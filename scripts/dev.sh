#!/usr/bin/env bash
set -euo pipefail

# Determine repository root relative to this script
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/src/3d-bioprinting-slicer"
BACKEND_DIR="$ROOT_DIR/src/convex-slicing"
VENV_DIR="$BACKEND_DIR/.venv"

cd "$ROOT_DIR"

echo "==> Preparing frontend dependencies"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing npm packages in $FRONTEND_DIR"
  (cd "$FRONTEND_DIR" && npm install)
else
  echo "Frontend dependencies already installed"
fi

echo "==> Preparing backend virtual environment"
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

PIP_CMD="$VENV_DIR/bin/pip"
UVICORN_CMD="$VENV_DIR/bin/uvicorn"

"$PIP_CMD" install -r "$BACKEND_DIR/requirements.txt"

echo "==> Starting backend server"
(cd "$BACKEND_DIR" && "$UVICORN_CMD" app.main:app --reload --host 0.0.0.0 &)
BACKEND_PID=$!

cleanup() {
  if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
    echo "\n==> Stopping backend server"
    kill "$BACKEND_PID"
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "==> Starting frontend dev server"
cd "$FRONTEND_DIR"
npm run dev -- --host
