#!/usr/bin/env bash
# Copy the latest MakeCode export into public/.
# Excludes index.html and assets/ (those belong to the standalone site, not RCade).
# Run this after regenerating the export with `bash gen` in the MakeCode-Arcade-to-App repo.

set -euo pipefail

#DIST="/home/deck/ws/src/github.com/UnsignedArduino/MakeCode-Arcade-to-App/Racers/racers-website/dist"
DIST="/home/deck/ws/src/github.com/rippy/MakeCode-Arcade-to-App/Racers/racers-website/dist"
PUBLIC="$(dirname "$0")/public"

if [[ ! -d "$DIST" ]]; then
  echo "Error: dist not found at $DIST"
  echo "Run 'bash gen' in MakeCode-Arcade-to-App first."
  exit 1
fi

cp "$DIST/binary.js"          "$PUBLIC/binary.js"
cp "$DIST/---simulator.html"  "$PUBLIC/---simulator.html"
cp "$DIST/pxtsim.js"          "$PUBLIC/pxtsim.js"
cp "$DIST/sim.js"             "$PUBLIC/sim.js"
cp "$DIST/sim.css"            "$PUBLIC/sim.css"
cp "$DIST/icons.css"          "$PUBLIC/icons.css"
cp "$DIST/favicon.ico"        "$PUBLIC/favicon.ico"

echo "public/ updated from $DIST"
