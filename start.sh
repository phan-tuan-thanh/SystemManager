#!/usr/bin/env bash
set -euo pipefail

# ─── Usage ────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Start SystemManager via Docker Compose.

Options:
  -b, --build       Build images before starting; auto-fixes stale DB volume
  -r, --rebuild     Full rebuild: stop, remove volumes, build, start fresh
  -d, --detach      Run in background (detached mode)  [default: foreground]
  -s, --service     Start specific service(s) only, e.g. --service backend
  -l, --logs        Tail logs after detached start (implies --detach)
  -h, --help        Show this help message

Examples:
  $(basename "$0")                     # Start all services (no build)
  $(basename "$0") -b                  # Build then start (safe: auto-fixes stale DB)
  $(basename "$0") -b -d               # Build, start in background
  $(basename "$0") -r                  # Full clean rebuild + start
  $(basename "$0") -d -l               # Start in background then tail logs
  $(basename "$0") -b -s backend       # Build and start only the backend
EOF
}

# ─── Defaults ─────────────────────────────────────────────────────────────────
BUILD=false
REBUILD=false
DETACH=false
TAIL_LOGS=false
SERVICES=()

# ─── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--build)    BUILD=true;   shift ;;
    -r|--rebuild)  REBUILD=true; shift ;;
    -d|--detach)   DETACH=true;  shift ;;
    -l|--logs)     TAIL_LOGS=true; DETACH=true; shift ;;
    -s|--service)
      [[ -z "${2:-}" ]] && { echo "Error: --service requires a value"; exit 1; }
      SERVICES+=("$2"); shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

# ─── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
success() { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()    { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
error()   { echo -e "\033[1;31m[ERR]\033[0m   $*"; }

cd "$(dirname "$0")"

# ─── Wait for DB to be ready (pg_isready, TCP connectivity only) ──────────────
wait_for_db() {
  local retries=30
  info "Waiting for database to be ready..."
  while [[ $retries -gt 0 ]]; do
    if docker compose exec -T db pg_isready -U postgres -q 2>/dev/null; then
      return 0
    fi
    sleep 2
    ((retries--))
  done
  error "Database did not become ready in time."
  return 1
}

# ─── Test auth from the same Docker network as migrate/backend use ─────────────
# pg_isready does NOT test auth; must run a real psql query over the Docker network.
# We spin up a one-shot postgres:15-alpine container on the same network.
get_db_network() {
  docker inspect systemmanager-db-1 \
    --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null | awk '{print $1}'
}

check_db_auth() {
  local network
  network=$(get_db_network)
  [[ -z "$network" ]] && { warn "Cannot determine DB network."; return 1; }
  docker run --rm \
    --network "$network" \
    -e PGPASSWORD=postgres \
    postgres:15-alpine \
    psql -h db -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1
}

# ─── Check that system_manager database exists (not just auth works) ───────────
check_app_db_exists() {
  local network
  network=$(get_db_network)
  [[ -z "$network" ]] && return 1
  docker run --rm \
    --network "$network" \
    -e PGPASSWORD=postgres \
    postgres:15-alpine \
    psql -h db -U postgres -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='system_manager'" 2>/dev/null | grep -q "1"
}

# ─── Remove the pgdata volume by project name ──────────────────────────────────
remove_pgdata_volume() {
  local project_name
  project_name=$(docker compose config 2>/dev/null | grep '^name:' | awk '{print $2}')
  [[ -z "$project_name" ]] && project_name=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
  local vol="${project_name}_pgdata"
  info "Removing volume: $vol"
  docker volume rm "$vol" 2>/dev/null || true
}

# ─── Ensure DB volume has correct credentials and app DB exists ────────────────
# Never auto-deletes data — exits with a clear error and instructions instead.
ensure_db_healthy() {
  info "Starting database service..."
  docker compose up -d db

  wait_for_db

  if ! check_db_auth; then
    error "Database authentication failed."
    error "The pgdata volume was likely initialized with a different password."
    error "To fix: run './start.sh -r' to do a full rebuild (WARNING: destroys all data)."
    exit 1
  fi

  if ! check_app_db_exists; then
    error "Database 'system_manager' does not exist in the current pgdata volume."
    error "The volume may belong to another project or was initialized without POSTGRES_DB."
    error "To fix: run './start.sh -r' to do a full rebuild (WARNING: destroys all data)."
    exit 1
  fi

  success "Database credentials and 'system_manager' DB verified."
}

# ─── Full rebuild: wipe volumes, rebuild images, start fresh ──────────────────
if [[ "$REBUILD" == true ]]; then
  warn "Full rebuild: stopping containers and removing all volumes..."
  docker compose down -v
  info "Building images from scratch..."
  COMPOSE_ARGS=(up --build)
  [[ "$DETACH" == true ]] && COMPOSE_ARGS+=(-d)
  [[ ${#SERVICES[@]} -gt 0 ]] && COMPOSE_ARGS+=("${SERVICES[@]}")
  docker compose "${COMPOSE_ARGS[@]}"
  [[ "$TAIL_LOGS" == true ]] && docker compose logs -f "${SERVICES[@]}"
  exit 0
fi

# ─── Build mode: verify DB before starting remaining services ─────────────────
if [[ "$BUILD" == true ]]; then
  info "Building images..."
  docker compose build

  # Only verify DB if starting all services (not a specific service filter)
  if [[ ${#SERVICES[@]} -eq 0 ]] || printf '%s\n' "${SERVICES[@]}" | grep -qx "db"; then
    ensure_db_healthy
  fi

  info "Starting all services..."
  COMPOSE_ARGS=(up)
  [[ "$DETACH" == true ]] && COMPOSE_ARGS+=(-d)
  [[ ${#SERVICES[@]} -gt 0 ]] && COMPOSE_ARGS+=("${SERVICES[@]}")
  docker compose "${COMPOSE_ARGS[@]}"

  [[ "$TAIL_LOGS" == true ]] && docker compose logs -f "${SERVICES[@]}"
  exit 0
fi

# ─── Normal start (no build) ──────────────────────────────────────────────────
info "Starting without rebuild (use -b to build, -r for full rebuild)"
COMPOSE_ARGS=(up)
[[ "$DETACH" == true ]] && COMPOSE_ARGS+=(-d)
[[ ${#SERVICES[@]} -gt 0 ]] && COMPOSE_ARGS+=("${SERVICES[@]}")

docker compose "${COMPOSE_ARGS[@]}"

if [[ "$TAIL_LOGS" == true ]]; then
  success "Containers started. Tailing logs..."
  docker compose logs -f "${SERVICES[@]}"
fi
