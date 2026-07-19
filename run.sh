#!/usr/bin/env bash
# Dev runner:
#   ./run.sh            start backend and frontend
#   ./run.sh backend    start backend only
#   ./run.sh frontend   start frontend only, connected to a running backend
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

native_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    echo "$1"
  fi
}

export UV_NO_CACHE="${UV_NO_CACHE:-1}"
export UV_PROJECT_ENVIRONMENT="${UV_PROJECT_ENVIRONMENT:-$(native_path "$ROOT_DIR/.uv-venv")}"
export UV_PYTHON_PREFERENCE="${UV_PYTHON_PREFERENCE:-only-system}"
export PYTHONUTF8="${PYTHONUTF8:-1}"
if [ -z "${UV_PYTHON:-}" ] && command -v python >/dev/null 2>&1; then
  export UV_PYTHON="$(native_path "$(command -v python)")"
fi
BACKEND_PORT_FILE="$ROOT_DIR/.dev_backend_port"
FRONTEND_PORT_FILE="$ROOT_DIR/.dev_frontend_port"
BACKEND_PID_FILE="$ROOT_DIR/.backend.pid"
FRONTEND_PID_FILE="$ROOT_DIR/.frontend.pid"

is_port_open() {
  local host="${1:-127.0.0.1}"
  local port="$2"
  (exec 3<>"/dev/tcp/${host}/${port}") 2>/dev/null
}

pick_free_port() {
  local lo="$1"
  local hi="$2"

  for _ in $(seq 1 200); do
    local port=$(( lo + RANDOM % (hi - lo + 1) ))
    if ! is_port_open 127.0.0.1 "$port"; then
      echo "$port"
      return 0
    fi
  done

  echo "Could not find a free port in ${lo}-${hi}." >&2
  exit 1
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local retries="${3:-60}"

  for _ in $(seq 1 "$retries"); do
    if is_port_open 127.0.0.1 "$port"; then
      return 0
    fi
    sleep 0.5
  done

  echo "${name} did not start on port ${port}." >&2
  return 1
}

write_frontend_env() {
  local backend_port="$1"

  {
    echo "VITE_API_URL=http://localhost:${backend_port}/api"
    echo "VITE_DISABLE_LOCAL_CACHE=true"
  } > "$FRONTEND_DIR/.env.development"
}

ensure_frontend_dependencies() {
  # npm run resolves binaries from node_modules/.bin.  On a fresh checkout
  # that directory does not exist yet, so install from the committed lockfile
  # before attempting to start Vite.
  if [ -x "$FRONTEND_DIR/node_modules/.bin/vite" ]; then
    return 0
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required to start the frontend, but it was not found in PATH." >&2
    return 1
  fi

  echo "Frontend dependencies are missing; installing them with npm ci ..."
  (cd "$FRONTEND_DIR" && npm ci --no-audit --no-fund)
}

start_backend() {
  local port="$1"

  echo "Starting backend: http://localhost:${port}/docs"
  (cd "$BACKEND_DIR" && uv run uvicorn app.main:app --host 0.0.0.0 --port "$port" --reload) &
  echo $! > "$BACKEND_PID_FILE"

  wait_for_port "$port" "Backend"
  echo "$port" > "$BACKEND_PORT_FILE"
}

start_frontend() {
  local backend_port="$1"
  local frontend_port="${2:-$(pick_free_port 5173 5199)}"

  ensure_frontend_dependencies
  write_frontend_env "$backend_port"
  echo "Frontend API: http://localhost:${backend_port}/api"
  echo "Starting frontend: http://localhost:${frontend_port}"

  (cd "$FRONTEND_DIR" && npm run dev -- --host 0.0.0.0 --port "$frontend_port" --strictPort) &
  echo $! > "$FRONTEND_PID_FILE"

  wait_for_port "$frontend_port" "Frontend"
  echo "$frontend_port" > "$FRONTEND_PORT_FILE"
}

stop_all() {
  echo
  echo "Stopping services ..."
  [ -f "$BACKEND_PID_FILE" ] && kill "$(cat "$BACKEND_PID_FILE")" 2>/dev/null || true
  [ -f "$FRONTEND_PID_FILE" ] && kill "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null || true
  rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE" "$BACKEND_PORT_FILE" "$FRONTEND_PORT_FILE"
  exit 0
}
trap stop_all INT TERM

CMD="${1:-all}"

case "$CMD" in
  backend)
    BACKEND_PORT="$(pick_free_port 8100 8999)"
    start_backend "$BACKEND_PORT"
    echo
    echo "Backend is running: http://localhost:${BACKEND_PORT}/docs"
    wait
    ;;
  frontend)
    if [ -f "$BACKEND_PORT_FILE" ]; then
      BACKEND_PORT="$(cat "$BACKEND_PORT_FILE")"
    else
      BACKEND_PORT="${BACKEND_PORT:-8000}"
      echo "No backend port file found; trying http://localhost:${BACKEND_PORT}/api"
    fi

    if ! is_port_open 127.0.0.1 "$BACKEND_PORT"; then
      echo "Backend port ${BACKEND_PORT} is not reachable. Run ./run.sh backend or ./run.sh first." >&2
      exit 1
    fi

    FRONTEND_PORT="$(pick_free_port 5173 5199)"
    start_frontend "$BACKEND_PORT" "$FRONTEND_PORT"
    echo
    echo "Frontend is running: http://localhost:${FRONTEND_PORT}"
    wait
    ;;
  all)
    BACKEND_PORT="$(pick_free_port 8100 8999)"
    FRONTEND_PORT="$(pick_free_port 5173 5199)"

    start_backend "$BACKEND_PORT"
    start_frontend "$BACKEND_PORT" "$FRONTEND_PORT"

    echo
    echo "Backend: http://localhost:${BACKEND_PORT}/docs"
    echo "Frontend: http://localhost:${FRONTEND_PORT}"
    echo "Frontend API: http://localhost:${BACKEND_PORT}/api"
    wait
    ;;
  *)
    echo "Unknown command: ${CMD} (available: all | backend | frontend)" >&2
    exit 1
    ;;
esac
