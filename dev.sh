#!/usr/bin/env bash
# Starts the API server AND the frontend together (run from project root)
# Press Ctrl+C to stop both.

set -e
ROOT="$(dirname "$0")"

# make sure .env exists where each service expects it
[ -f "$ROOT/lib/db/.env" ] || cp "$ROOT/.env" "$ROOT/lib/db/.env"
[ -f "$ROOT/artifacts/api-server/.env" ] || cp "$ROOT/.env" "$ROOT/artifacts/api-server/.env"

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $API_PID $WEB_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "Building + starting API server..."
(
  cd "$ROOT/artifacts/api-server"
  pnpm run build
  node --env-file=.env --enable-source-maps ./dist/index.mjs
) &
API_PID=$!

# give the API a moment to boot before starting the frontend (optional)
sleep 2

echo "Starting frontend..."
(
  cd "$ROOT/artifacts/luma-restaurant"
  pnpm run dev
) &
WEB_PID=$!

wait
