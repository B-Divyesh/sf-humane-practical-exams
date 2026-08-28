#!/bin/sh
# Regression test for the factory's container runtime contract. The executable is
# deliberately launched with only PORT. (The executable uses an absolute path,
# so PATH is not needed by the process.)
set -eu

test_root=$(mktemp -d)
test_port=18081
test_log="$test_root/service.log"
cleanup() {
  if [ "${service_pid:-}" ]; then kill "$service_pid" 2>/dev/null || true; fi
  wait "${service_pid:-}" 2>/dev/null || true
  rm -rf "$test_root"
}
trap cleanup EXIT INT TERM

cp -R dist "$test_root/dist"
(
  cd "$test_root"
  env -i PORT="$test_port" /work/repo/target/debug/humane-practical-exams >"$test_log" 2>&1
) &
service_pid=$!

attempt=0
until response=$(curl --silent --show-error --fail "http://127.0.0.1:$test_port/health" 2>/dev/null); do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 40 ]; then
    cat "$test_log" >&2
    exit 1
  fi
  sleep 0.25
done

printf '%s' "$response" | grep -F '"status":"ok"' >/dev/null
curl --silent --show-error --fail "http://127.0.0.1:$test_port/" | grep -F '<div id="app"></div>' >/dev/null
test -s "$test_root/data/submission-encryption-key"
test "$(stat -c '%a' "$test_root/data/submission-encryption-key")" = 600
grep -F '"key_source":"generated"' "$test_log" >/dev/null
