#!/bin/sh
# The production platform supplies an identity, but local image builds must work
# without one. Keep this narrow assertion alongside the Dockerfile regression.
set -eu

grep -Fx 'ARG BUILD_SHA=dev' Dockerfile >/dev/null
if grep -Eq 'test .*BUILD_SHA|grep -E.*\^\[0-9a-f\]\{40\}' Dockerfile; then
  echo 'Dockerfile must not reject the default build identity.' >&2
  exit 1
fi
