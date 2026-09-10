#!/usr/bin/env bash
# Runs the API and the web app together, and shuts both down on Ctrl-C.
set -uo pipefail
cd "$(dirname "$0")/.."

cleanup() {
  echo
  echo "Stopping LockedIn…"
  kill 0 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting API on http://localhost:4000 (docs at /docs)…"
npm run dev:api &

sleep 2
echo "Starting web app on http://localhost:3000…"
npm run dev:web &

wait
