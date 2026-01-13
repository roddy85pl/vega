#!/usr/bin/env bash

set -e 

export VERSION="1.5.11"
export RELEASE="1.5"

# Helper for logging
log() { echo -e "\033[1;32m[INFO]\033[0m $1"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $1"; exit 1; }

log "Starting Hls.js Player setup v$VERSION-r$RELEASE"

# Check if tarball exists
TARBALL="hls-rel-v$VERSION-r$RELEASE.tar.gz"
if [ ! -f "$TARBALL" ]; then
    error "Tarball $TARBALL not found in hls-setup directory!"
fi

log "Extracting hls-rel package..."
tar -xzf "$TARBALL"

if [ ! -d "hls-rel" ]; then
    error "Extraction failed: hls-rel directory not found"
fi

log "Hls.js Player setup completed successfully"
log "Generated hls-rel directory with source files and dist"
