
#!/usr/bin/env bash
set -euo pipefail

# Dev script to run backend (Django) and frontend (Vite) in parallel.
# If `backend/venv` is missing, it will be created and dependencies installed
# Usage:
#   chmod +x scripts/dev.sh
#   ./scripts/dev.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f backend/manage.py ]; then
  echo "Error: backend/manage.py not found. Are you in the project root?"
  exit 1
fi

if [ ! -f frontend/package.json ]; then
  echo "Error: frontend/package.json not found. Is the frontend folder present?"
  exit 1
fi

# Create venv if missing and install requirements
if [ ! -d "backend/venv" ] || [ ! -f "backend/venv/bin/activate" ]; then
  echo "No virtualenv found at backend/venv — creating one now."
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD=python3
  elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD=python
  else
    echo "Error: python3 or python not found in PATH. Install Python 3 and try again."
    exit 1
  fi

  echo "Creating virtualenv using $PYTHON_CMD"
  $PYTHON_CMD -m venv backend/venv
  # shellcheck disable=SC1091
  source backend/venv/bin/activate

  if [ -f backend/requirements.txt ]; then
    echo "Installing Python dependencies from backend/requirements.txt"
    pip install --upgrade pip setuptools wheel
    pip install -r backend/requirements.txt
  else
    echo "Warning: backend/requirements.txt not found; skipping pip install"
  fi
else
  echo "Activating Python virtualenv at backend/venv"
  # shellcheck disable=SC1091
  source backend/venv/bin/activate
fi

echo "Starting backend (Django)..."
python backend/manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

echo "Starting frontend (Vite)..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"

# Ensure child processes are terminated on exit (including Ctrl+C)
_cleanup() {
  echo "Stopping servers..."
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}

trap _cleanup INT TERM EXIT

# Wait for both processes. If either exits, the script will finish and cleanup will run.
wait
