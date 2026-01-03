#!/usr/bin/env bash

set -e 

export VERSION="4.8.5"
export RELEASE="1.2"

# Helper for logging
log() { echo -e "\033[1;32m[INFO]\033[0m $1"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $1"; exit 1; }

reset_shaka_state() {
    log "Resetting Shaka Player state..."
    pushd shaka-player > /dev/null

    git am --abort >/dev/null 2>&1 || true 
    git clean -fdx >/dev/null 2>&1 
    git reset --hard HEAD >/dev/null 2>&1 

    git checkout main >/dev/null 2>&1
    git branch -D "amz_$VERSION" >/dev/null 2>&1 || true

    popd > /dev/null
    log "Shaka Player state has been reset"
}

validate_integration() {
    log "Validating Shaka Player syntax..."
    node --check dist/shaka-player.compiled.js
}

if [ ! -d "shaka-player" ]; then
    error "shaka-player directory does not exist. Please clone the repository first."
fi

reset_shaka_state

pushd shaka-player > /dev/null

# Checkout branch
log "Creating Amazon branch 'amz_$VERSION' from tag v$VERSION"
git checkout -b "amz_$VERSION" "v$VERSION" || log "Using existing branch 'amz_$VERSION'"

# Unpack tarball
TARBALL="../shaka-rel-v$VERSION-r$RELEASE.tar.gz"
if [ -f "$TARBALL" ]; then
    log "Extracting custom patches and source files..."
    tar -xzf "$TARBALL"
else
    error "Tarball $TARBALL not found!"
fi

# --- Package.json Fix ---
log "Updating overrides in package.json"
if command -v jq >/dev/null 2>&1; then
    jq 'del(.overrides.karma) | .overrides["ua-parser-js"] = "0.7.34"' package.json > package.json.tmp && mv package.json.tmp package.json
else
    log "Warning: jq not found, using sed (less reliable for JSON)"
    sed -i 's/"ua-parser-js": "github:joeyparrish\/ua-parser-js#preview"/"ua-parser-js": "0.7.34"/g' package.json
fi

# Apply patches
log "Applying custom patches..."
if ! git am shaka-rel/shaka-patch/*.patch -3; then
    log "Patch application failed or already applied. Aborting git am."
    git am --abort
fi

# Disable Google Fonts (Combined sed for efficiency)
if [ -f "ui/controls.less" ]; then
    log "Disabling Google Font imports..."
    sed -i -e 's|@import (css, inline) "https://fonts.googleapis.com/css?family=Roboto";|/* Roboto disabled */|g' \
           -e 's|@import (css, inline) "https://fonts.googleapis.com/icon?family=Material+Icons+Round";|/* Icons disabled */|g' ui/controls.less
fi

# Build
log "Building customized Shaka Player..."
if command -v kepler >/dev/null 2>&1; then
    kepler exec python build/all.py || python3 build/all.py
else
    python3 build/all.py
fi

# Post-build: Add @ts-nocheck
# Using -print0 and read -d '' is safer for filenames with spaces/special characters
log "Adding TypeScript no-check directives..."
LINE_TO_ADD="// @ts-nocheck"
find dist shaka-rel/src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
    if ! grep -qF "$LINE_TO_ADD" "$file"; then
        echo -e "$LINE_TO_ADD\n$(cat "$file")" > "$file"
        log "Added @ts-nocheck to: $file"
    fi
done

# Final validation
if validate_integration; then
    log "Shaka Player v$VERSION integration completed successfully."
    popd > /dev/null
else
    error "Shaka Player integration validation failed!"
fi
