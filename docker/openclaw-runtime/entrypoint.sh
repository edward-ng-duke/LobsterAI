#!/bin/sh
set -eu
: "${OPENCLAW_GATEWAY_TOKEN:?OPENCLAW_GATEWAY_TOKEN is required}"
test -d /state
test -d /workspace
exec node /opt/openclaw/openclaw.mjs gateway --allow-unconfigured --bind lan --port "${OPENCLAW_GATEWAY_PORT:-18789}"
