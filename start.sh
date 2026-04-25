#!/usr/bin/env bash
set -euo pipefail

# ─── Usage ────────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Start SystemManager via Docker Compose.

Options:
  -b, --build       Build images before starting (docker compose up --build)
  -r, --rebuild     Full rebuild: stop, remove volumes, build, start fresh
                    (docker compose down -v && docker compose up --build)
  -d, --detach      Run in background (detached mode)  [default: foreground]
  -s, --service     Start specific service(s) only, e.g. --service backend
  -l, --logs        Tail logs after detached start (implies --detach)
  -h, --help        Show this help message

Examples:
  $(basename "$0")                     # Start all services (no build)
  $(basename "$0") -b                  # Build then start
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

cd "$(dirname "$0")"

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

# ─── Normal start ─────────────────────────────────────────────────────────────
COMPOSE_ARGS=(up)

if [[ "$BUILD" == true ]]; then
  info "Building images before start..."
  COMPOSE_ARGS+=(--build)
else
  info "Starting without rebuild (use -b to build, -r for full rebuild)"
fi

[[ "$DETACH" == true ]] && COMPOSE_ARGS+=(-d)
[[ ${#SERVICES[@]} -gt 0 ]] && COMPOSE_ARGS+=("${SERVICES[@]}")

docker compose "${COMPOSE_ARGS[@]}"

if [[ "$TAIL_LOGS" == true ]]; then
  success "Containers started. Tailing logs..."
  docker compose logs -f "${SERVICES[@]}"
fi
