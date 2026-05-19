#!/bin/bash
# Build + restart the v2 staging container on this server.
# Run from the repo root on the staging box:
#   bash scripts/deploy-staging.sh

set -e

HOST_PORT=3004
SERVICE=osc

# Auto-stash local edits so git pull never blocks
git stash push -m "auto-stash $(date -u +%FT%TZ)" 2>/dev/null || true

git pull origin staging

# Rebuild image + recreate container if it changed
docker compose up -d --build

# Give Next.js a moment to come up
sleep 10

echo
echo "=== container status ==="
docker compose ps

echo
echo "=== health check ==="
if curl -sf -o /dev/null --max-time 15 "http://localhost:$HOST_PORT"; then
    echo "DEPLOY HEALTHY (http://localhost:$HOST_PORT)"
else
    echo "DEPLOY UNHEALTHY — check: docker compose logs --tail 100 $SERVICE"
    exit 1
fi
