#!/bin/sh
set -eu
ready_file=/tmp/lobster-worker-ready
rm -f "$ready_file"
node /opt/lobster/index.mjs &
child=$!
touch "$ready_file"
terminate() {
  rm -f "$ready_file"
  kill -TERM "$child" 2>/dev/null || true
}
trap terminate INT TERM
set +e
wait "$child"
status=$?
set -e
rm -f "$ready_file"
wait "$child" 2>/dev/null || true
exit "$status"
