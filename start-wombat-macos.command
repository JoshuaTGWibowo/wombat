#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/src/3d-bioprinting-slicer/src/convex-slicing"
FRONTEND_DIR="$SCRIPT_DIR/src/3d-bioprinting-slicer"
APP_URL="http://localhost:5173/"

error() {
  printf "[ERROR] %s\n" "$1" >&2
}

info() {
  printf "[INFO] %s\n" "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "Required command '$1' is not installed or not on your PATH."
    exit 1
  fi
}

if [[ ! -d "$BACKEND_DIR" ]]; then
  error "Could not locate backend directory at $BACKEND_DIR."
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR" ]]; then
  error "Could not locate frontend directory at $FRONTEND_DIR."
  exit 1
fi

require_command python3
require_command npm
require_command osascript

backend_cmd="cd '$BACKEND_DIR'; \
if [ ! -f .venv/bin/python ]; then \
  echo 'Creating Python virtual environment...'; \
  python3 -m venv .venv; \
fi; \
source .venv/bin/activate; \
python -m pip install --upgrade pip; \
pip install -r requirements.txt; \
pip install python-multipart uvicorn fastapi; \
uvicorn api:app --reload --host 0.0.0.0 --port 8000"

frontend_cmd="cd '$FRONTEND_DIR'; \
if [ ! -f .env.local ]; then \
  echo 'Creating default .env.local...'; \
  { \
    echo "BACKEND_URL=http://localhost:8000"; \
    echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1wb2xsaXdvZy04Ni5jbGVyay5hY2NvdW50cy5kZXYk"; \
  } > .env.local; \
fi; \
if [ -f package-lock.json ]; then \
  npm ci; \
else \
  npm install; \
fi; \
npm run dev"

info "Launching Convex Slicing API server in a new Terminal window..."
osascript <<EOF_APPLE
  tell application "Terminal"
    do script "$backend_cmd"
  end tell
EOF_APPLE

info "Launching frontend dev server in a new Terminal window..."
osascript <<EOF_APPLE
  tell application "Terminal"
    do script "$frontend_cmd"
  end tell
EOF_APPLE

info "Waiting a few seconds for the frontend to start..."
sleep 5

info "Opening $APP_URL in your default browser..."
open "$APP_URL"

info "All services have been launched in separate Terminal windows."
