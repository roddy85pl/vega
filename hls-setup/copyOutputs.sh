#!/usr/bin/env bash

set -e

echo "Starting Hls.js Player artifacts integration"

# Remove default HlsJsPlayer.ts if it exists in the tarball (using custom version instead)
rm -f hls-rel/src/hlsjsplayer/HlsJsPlayer.ts 2>/dev/null || true

echo "Copying custom source files and polyfills to src/"
cp -R hls-rel/src/. ../src/

echo "Copying built Hls.js Player distribution files to src/hlsjsplayer/dist/"
mkdir -p ../src/hlsjsplayer/dist/
cp -R hls-rel/dist/. ../src/hlsjsplayer/dist/

echo "Hls.js Player integration completed."
