#!/usr/bin/env bash
set -euo pipefail

DEBUG=${DEBUG:-0}
if [[ "$DEBUG" == "1" ]]; then
  set -x
fi

# Determine repository root relative to this script
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/src/3d-bioprinting-slicer"
BACKEND_DIR="$ROOT_DIR/src/convex-slicing"
VENV_DIR="$BACKEND_DIR/.venv"
BACKEND_LOG="$ROOT_DIR/.dev_backend.log"
BACKEND_PID=""

cd "$ROOT_DIR"

log() {
  printf '==> %s\n' "$1"
}

handle_error() {
  local exit_code=$1
  local line_no=$2
  echo "" >&2
  echo "[dev.sh] Error on or near line ${line_no}. Exit status: ${exit_code}" >&2
  if [[ -s "$BACKEND_LOG" ]]; then
    echo "Last backend log lines:" >&2
    tail -n 20 "$BACKEND_LOG" >&2 || true
  fi
}

trap 'handle_error $? $LINENO' ERR

log "Preparing frontend dependencies"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  log "Installing npm packages in $FRONTEND_DIR"
  (cd "$FRONTEND_DIR" && npm install)
else
  log "Frontend dependencies already installed"
fi

log "Preparing backend virtual environment"
if [ ! -d "$VENV_DIR" ]; then
  log "Creating virtual environment at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

PIP_CMD="$VENV_DIR/bin/pip"
UVICORN_CMD="$VENV_DIR/bin/uvicorn"

"$PIP_CMD" install -r "$BACKEND_DIR/requirements.txt"

log "Starting backend server (logging to $BACKEND_LOG)"
rm -f "$BACKEND_LOG"
(cd "$BACKEND_DIR" && "$UVICORN_CMD" app.main:app --reload --host 0.0.0.0 >"$BACKEND_LOG" 2>&1 &)
BACKEND_PID=$!
sleep 1

if ! ps -p "$BACKEND_PID" > /dev/null 2>&1; then
  echo "Backend failed to stay running. Inspect $BACKEND_LOG for details." >&2
  if [[ -s "$BACKEND_LOG" ]]; then
    tail -n 20 "$BACKEND_LOG" >&2 || true
  fi
  exit 1
fi

cleanup() {
  if [[ -n "$BACKEND_PID" ]] && ps -p "$BACKEND_PID" > /dev/null 2>&1; then
    echo "\n==> Stopping backend server"
    kill "$BACKEND_PID"
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

log "Starting frontend dev server"
cd "$FRONTEND_DIR"
npm run dev -- --host
