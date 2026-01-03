#!/usr/bin/env bash

set -e

# This script orchestrates the complete Hls.js Player setup and integration
echo "=== Hls.js Player Build Process ==="

# Step 1: Run setup to extract the tarball
echo "Step 1: Running setup.sh..."
./setup.sh

# Step 2: Copy outputs to the project
echo "Step 2: Running copyOutputs.sh..."
./copyOutputs.sh

echo "=== Hls.js Player build completed successfully ==="
