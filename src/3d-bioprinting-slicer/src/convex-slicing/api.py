from __future__ import annotations

import io
import json
import tempfile
from pathlib import Path
from typing import Optional
import logging
import threading

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from convex_slicer.parameters import PrintingParameters
from convex_slicer.slicer import ConvexSlicer


class PhysicsParams(BaseModel):
    printHeadDiameter: float = 5.42
    rimStartHeight: float = 0.75
    contactAngleDeg: float = 45.0
    surfaceTension: float = 73.0
    density: float = 1000.0
    gravity: float = 9.81
    bezierK1: float = 0.25
    bezierK2: float = 0.75


def to_printing_params(p: PhysicsParams) -> PrintingParameters:
    return PrintingParameters(
        print_head_diameter=p.printHeadDiameter,
        rim_start_height=p.rimStartHeight,
        contact_angle_deg=p.contactAngleDeg,
        surface_tension=p.surfaceTension,
        density=p.density,
        gravity=p.gravity,
        bezier_k1=p.bezierK1,
        bezier_k2=p.bezierK2,
    )


app = FastAPI()
_progress: dict[str, float] = {}
_progress_logged: dict[str, int] = {}
_results: dict[str, dict] = {}
logger = logging.getLogger("convex-slicing")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent job directory for serving frames as static files
JOBS_DIR = Path("jobs").absolute()
JOBS_DIR.mkdir(parents=True, exist_ok=True)

# Static mount so clients can access frames by URL
# Note: client usually calls the API under "/api". When proxied, the public URL becomes
# "/api/slice/convex/files/...". We therefore return URLs prefixed with "/api" below.
app.mount("/slice/convex/files", StaticFiles(directory=str(JOBS_DIR), html=False), name="convex_files")


@app.get("/slice/convex/parameters/default")
def get_defaults() -> dict:
    return PhysicsParams().model_dict()


@app.post("/slice/convex/parameters/validate")
def validate_params(params: PhysicsParams) -> dict:
    # Minimal validation placeholder
    errors = []
    if params.printHeadDiameter <= 0:
        errors.append("printHeadDiameter must be > 0")
    if params.rimStartHeight < 0:
        errors.append("rimStartHeight must be >= 0")
    return {"valid": len(errors) == 0, "errors": errors or None}


@app.post("/slice/convex")
async def slice_convex(
    modelData: UploadFile = File(...),
    layerHeight: float = Form(0.2),
    physicsParams: Optional[str] = Form(None),
    outputFormat: Optional[str] = Form("bmp"),
    dimensions: Optional[str] = Form(None),
):
    try:
        pyd = PhysicsParams(**(json.loads(physicsParams) if physicsParams else {}))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid physicsParams: {exc}")

    pp = to_printing_params(pyd)
    # Parse optional target dimensions (mm)
    dims: dict[str, float] | None = None
    if dimensions:
        try:
            d = json.loads(dimensions)
            dims = {}
            for key in ("height", "width", "depth"):
                v = d.get(key)
                if isinstance(v, (int, float)) and float(v) > 0:
                    dims[key] = float(v)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Invalid dimensions: {exc}")

    # Create a persistent job folder
    from uuid import uuid4
    job_id = f"job-{uuid4().hex}"
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    in_path = job_dir / (modelData.filename or "model.stl")
    content = await modelData.read()
    in_path.write_bytes(content)

    out_dir = job_dir / "out"
    slicer = ConvexSlicer(pp, pitch=layerHeight)
    _progress[job_id] = 0.0
    _progress_logged[job_id] = -1

    params_dict = pyd.model_dump() if hasattr(pyd, "model_dump") else pyd.dict()
    logger.info(
        "[%s] Slicing request: file=%s layerHeight=%s outputFormat=%s params=%s",
        job_id,
        in_path.name,
        layerHeight,
        outputFormat,
        params_dict,
    )

    def on_progress(p: float) -> None:
        # Only increase progress; never jump backwards; never force 1.0 here
        p = max(0.0, min(1.0, float(p)))
        current = _progress.get(job_id, 0.0)
        if p > current:
            _progress[job_id] = p
        pct = int(_progress[job_id] * 100)
        last = _progress_logged.get(job_id, -1)
        if pct % 10 == 0 and pct != last:
            _progress_logged[job_id] = pct
            logger.info("[%s] Progress: %d%%", job_id, pct)

    def do_slice() -> None:
        try:
            fmt = (outputFormat or "bmp").lower()
            slicer.slice(
                in_path,
                out_dir,
                progress_cb=on_progress,
                output_format=fmt,
                target_dimensions_mm=dims,
            )
            # Prepare metadata and URL list (serve statically)
            frames = sorted(out_dir.glob("frame_*.bmp"))
            # Public URLs go through the "/api" prefix in dev/proxy setups
            base_url_prefix = "/api/slice/convex/files"
            slice_urls = [f"{base_url_prefix}/{job_id}/out/{f.name}" for f in frames]
            metadata_path = out_dir / "metadata.json"
            metadata = json.loads(metadata_path.read_text()) if metadata_path.exists() else {}
            _results[job_id] = {"slices": slice_urls, "metadata": metadata}
            _progress[job_id] = 1.0
            _progress_logged[job_id] = 100
            frames_num = metadata.get("num_frames") or metadata.get("numFrames") or len(frames)
            logger.info(
                "[%s] Completed: frames=%d pitch=%.3f voxelSize=%.3f",
                job_id,
                int(frames_num),
                float(metadata.get("pitch", 0.0)),
                float(metadata.get("voxel_size", 0.0)),
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("[%s] Slicing failed: %s", job_id, exc)
            _results[job_id] = {"error": str(exc)}
            _progress[job_id] = 1.0

    threading.Thread(target=do_slice, daemon=True).start()

    # Return immediately; frontend can poll progress and result
    return {"jobId": job_id}


@app.get("/slice/convex/progress/{job_id}")
def get_progress(job_id: str) -> dict:
    p = _progress.get(job_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Unknown job id")
    return {"progress": p}


@app.get("/slice/convex/result/{job_id}")
def get_result(job_id: str) -> dict:
    data = _results.get(job_id)
    if data is None:
        return {"ready": False}
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"]) 
    return {"ready": True, "slices": data.get("slices", []), "metadata": data.get("metadata", {})}


@app.delete("/slice/convex/{job_id}")
def delete_job(job_id: str) -> dict:
    """
    Delete a slicing job: remove progress/result entries and delete the job folder on disk.
    Safe to call even if job does not exist; returns 204-like response semantics.
    """
    # Purge in-memory state
    _progress.pop(job_id, None)
    _progress_logged.pop(job_id, None)
    _results.pop(job_id, None)

    # Remove files on disk
    job_dir = JOBS_DIR / job_id
    try:
        if job_dir.exists() and job_dir.is_dir():
            # Recursively delete job folder
            for p in sorted(job_dir.rglob("*"), reverse=True):
                try:
                    if p.is_file() or p.is_symlink():
                        p.unlink(missing_ok=True)
                    elif p.is_dir():
                        p.rmdir()
                except Exception:  # noqa: BLE001
                    pass
            try:
                job_dir.rmdir()
            except Exception:  # noqa: BLE001
                pass
    except Exception:  # noqa: BLE001
        # Best-effort deletion; ignore errors
        pass

    return {"deleted": True}


def create_app() -> FastAPI:
    return app


