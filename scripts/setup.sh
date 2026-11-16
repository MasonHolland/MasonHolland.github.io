#!/usr/bin/env bash
# Runs once when the Codespace is created. Installs the sync dependency and
# fetches the three.js file the room needs (it is too large to keep in every copy of the project).
set -e
cd "$(dirname "$0")/.."
npm install --no-audit --no-fund
if [ ! -s assets/vendor/three.module.js ]; then
  mkdir -p assets/vendor
  tmp=$(mktemp -d)
  (cd "$tmp" && npm init -y >/dev/null && npm install three@0.170.0 --no-audit --no-fund >/dev/null)
  cp "$tmp/node_modules/three/build/three.module.js" assets/vendor/three.module.js
  rm -rf "$tmp"
  echo "three.js 0.170.0 installed to assets/vendor/"
fi
