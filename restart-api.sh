#!/usr/bin/env bash
# Rebuilds and restarts the API server (run from project root)
set -e

cd "$(dirname "$0")/artifacts/api-server"

# make sure .env is present in this folder
if [ ! -f .env ]; then
  cp ../../.env .env
fi

echo "Building API server..."
pnpm run build

echo "Starting API server..."
node --env-file=.env --enable-source-maps ./dist/index.mjs
