"""Core slicing logic emitting binary (1-bit) exposure masks as 4K BMP frames."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Optional

import numpy as np
import trimesh

from .parameters import PrintingParameters
from .steady_state import SteadyPhaseProfile, compute_steady_phase_profile


TARGET_WIDTH = 4096
TARGET_HEIGHT = 2160
TARGET_MODE = "1"  # emit 1-bit monochrome BMPs
PIXELS_PER_MM = 400
DEFAULT_VOXEL_SIZE = 0.0000001


@dataclass
class SlicingResult:
    """Container for slicing outputs."""

    output_directory: Path
    num_frames: int
    pitch: float
    voxel_size: float


class ConvexSlicer:
    """Generate convex slices for an STL model as binary exposure masks."""

    def __init__(
        self,
        params: PrintingParameters,
        *,
        pitch: float = 0.05,
        voxel_size: Optional[float] = None,
        profile: Optional[SteadyPhaseProfile] = None,
    ) -> None:
        self.params = params
        self.pitch = float(pitch)
        self.voxel_size = (
            float(voxel_size) if voxel_size is not None else DEFAULT_VOXEL_SIZE
        )
        self.profile = profile or compute_steady_phase_profile(params)

    def slice(
        self,
        stl_path: Path,
        output_dir: Path,
        progress_cb: Optional[Callable[[float], None]] = None,
        *,
        output_format: str = "bmp",
        target_dimensions_mm: Optional[dict] = None,
    ) -> SlicingResult:
        """Slice the provided STL model and write image frames."""

        fmt = (output_format or "bmp").lower()
        if fmt not in {"bmp", "png", "both"}:
            fmt = "bmp"

        mesh = self._load_mesh(stl_path)
        if target_dimensions_mm:
            mesh = self._scale_mesh_to_dimensions(mesh, target_dimensions_mm)
        mesh = self._prepare_mesh(mesh)
        voxel_grid = mesh.voxelized(self.voxel_size).fill()
        occupancy = voxel_grid.matrix.astype(bool)
        transform = voxel_grid.transform
        x_coords, y_coords, z_coords = _axis_coordinates(transform, occupancy.shape)

        xx, yy = np.meshgrid(x_coords, y_coords, indexing="ij", sparse=False)
        radii = np.sqrt(xx**2 + yy**2)
        surface_offsets = self.profile.height(radii)

        model_height = mesh.bounds[1, 2] - self.params.rim_start_height
        scale = 1.0
        if self.profile.max_height >= model_height and self.profile.max_height > 0:
            scale = 0.8 * model_height / self.profile.max_height
            surface_offsets *= scale

        meniscus_peak = float(
            surface_offsets.max()
        )  # how much higher the rim is than the center
        base_surface = self.params.rim_start_height + surface_offsets - meniscus_peak

        total_travel = model_height + meniscus_peak
        num_frames = max(int(math.ceil(total_travel / self.pitch)), 1)
        z_coords = np.asarray(z_coords)

        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        metadata = {
            "pitch": self.pitch,
            "voxel_size": self.voxel_size,
            "num_frames": num_frames,
            "rim_start_height": self.params.rim_start_height,
            "print_head_radius": self.params.print_head_radius,
            "meniscus_scale": scale,
            "control_points": self.profile.control_points.tolist(),
            "image_width": TARGET_WIDTH,
            "image_height": TARGET_HEIGHT,
            "bit_depth": 1,
            "color_mode": TARGET_MODE,
            "pixels_per_mm": PIXELS_PER_MM,
        }

        if progress_cb is not None:
            try:
                progress_cb(0.0)
            except Exception:
                pass

        for frame in range(num_frames):
            lower = base_surface + frame * self.pitch
            upper = lower + self.pitch
            _, mask = _slice_height_map(occupancy, z_coords, lower, upper)
            bitmap = np.where(mask, 255, 0).astype(np.uint8)
            _save_bitmap_frame(output_dir, frame, bitmap, self.voxel_size)

            if progress_cb is not None:
                try:
                    progress_cb((frame + 1) / float(num_frames))
                except Exception:
                    pass

        with (output_dir / "metadata.json").open("w", encoding="utf-8") as fp:
            json.dump(metadata, fp, indent=2)

        return SlicingResult(
            output_directory=output_dir,
            num_frames=num_frames,
            pitch=self.pitch,
            voxel_size=self.voxel_size,
        )

    def _load_mesh(self, stl_path: Path) -> trimesh.Trimesh:
        mesh = trimesh.load_mesh(stl_path)
        if isinstance(mesh, trimesh.Scene):
            mesh = mesh.dump().sum()
        if not isinstance(mesh, trimesh.Trimesh):
            raise TypeError("Unsupported mesh type: expected a triangular mesh")
        return mesh

    def _prepare_mesh(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        mesh = mesh.copy()
        bounds = mesh.bounds
        center_xy = (bounds[0, :2] + bounds[1, :2]) / 2.0
        translation = np.array([
            -center_xy[0],
            -center_xy[1],
            self.params.rim_start_height - bounds[0, 2],
        ])
        mesh.apply_translation(translation)
        return mesh

    def _scale_mesh_to_dimensions(
        self, mesh: trimesh.Trimesh, dims: dict
    ) -> trimesh.Trimesh:
        """Uniformly scale mesh so its (height or width/depth) matches requested mm."""

        m = mesh.copy()
        bounds = m.bounds
        size = bounds[1] - bounds[0]

        cur_w = float(size[0])
        cur_d = float(size[1])
        cur_h = float(size[2])

        des_h = float(dims.get("height")) if dims.get("height") else None
        des_w = float(dims.get("width")) if dims.get("width") else None
        des_d = float(dims.get("depth")) if dims.get("depth") else None

        scale = 1.0
        if des_h and cur_h > 0:
            scale = des_h / cur_h
        elif des_w and cur_w > 0:
            scale = des_w / cur_w
        elif des_d and cur_d > 0:
            scale = des_d / cur_d
        else:
            return m

        m.apply_scale(scale)
        return m


def _axis_coordinates(
    transform: np.ndarray, shape: Iterable[int]
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute coordinate arrays for the voxel grid axes."""

    shape = tuple(int(v) for v in shape)
    origin = transform @ np.array([0.0, 0.0, 0.0, 1.0])
    axis_vectors = (
        transform @ np.array([1.0, 0.0, 0.0, 0.0]),
        transform @ np.array([0.0, 1.0, 0.0, 0.0]),
        transform @ np.array([0.0, 0.0, 1.0, 0.0]),
    )
    x_coords = origin[0] + axis_vectors[0][0] * np.arange(shape[0])
    y_coords = origin[1] + axis_vectors[1][1] * np.arange(shape[1])
    z_coords = origin[2] + axis_vectors[2][2] * np.arange(shape[2])
    return x_coords, y_coords, z_coords


def _slice_height_map(
    occupancy: np.ndarray,
    z_coords: np.ndarray,
    lower: np.ndarray,
    upper: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Return (height_map, mask) for a slice band."""

    z_grid = z_coords[np.newaxis, np.newaxis, :]
    within = (z_grid >= lower[..., np.newaxis]) & (z_grid < upper[..., np.newaxis])
    hits = occupancy & within

    with np.errstate(invalid="ignore"):
        z_vals = np.where(hits, z_grid, np.nan)
        height_map = np.nanmax(z_vals, axis=2)

    mask = np.isfinite(height_map)
    height_map[~mask] = 0.0
    return height_map.astype(np.float32), mask


def _save_bitmap_frame(
    output_dir: Path, index: int, bitmap: np.ndarray, voxel_size: float
) -> None:
    """Write the binary frame as a 1-bit BMP image with 4K DCI resolution."""

    frame = _render_bitmap(bitmap, voxel_size)
    frame.save(output_dir / f"frame_{index:04d}.bmp", format="BMP")


def _render_bitmap(bitmap: np.ndarray, voxel_size: float) -> "Image.Image":
    """Project the binary array (H=W=voxel grid) onto the 4K target canvas."""

    from PIL import Image

    array = bitmap.transpose(1, 0)[::-1, :]
    base_image = Image.fromarray(array).convert("1", dither=Image.Dither.NONE)

    desired_width = max(1, int(round(base_image.width * voxel_size * PIXELS_PER_MM)))
    desired_height = max(1, int(round(base_image.height * voxel_size * PIXELS_PER_MM)))

    if desired_width > TARGET_WIDTH or desired_height > TARGET_HEIGHT:
        raise ValueError(
            "Model footprint exceeds the printable area at 400 px/mm resolution"
        )

    if (desired_width, desired_height) == base_image.size:
        resized = base_image
    else:
        resized = base_image.resize(
            (desired_width, desired_height), resample=Image.NEAREST
        )

    canvas = Image.new(TARGET_MODE, (TARGET_WIDTH, TARGET_HEIGHT), color=0)
    left = (TARGET_WIDTH - desired_width) // 2
    top = (TARGET_HEIGHT - desired_height) // 2
    canvas.paste(resized, (left, top))
    return canvas
