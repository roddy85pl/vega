#!/usr/bin/env bash

set -e 

export VERSION="4.8.5"
export RELEASE="1.2"
# KLUCZOWE: Wyłączamy wewnętrzne 'npm ci' skryptu Shaka, bo my sami zarządzamy zależnościami
export SHAKA_SKIP_NPM_UPDATE=1

reset_shaka_state() {
    echo "--- Resetting Shaka Player state ---"
    cd shaka-player
    git am --abort >/dev/null 2>&1 || true
    git clean -fdx >/dev/null 2>&1
    git reset --hard HEAD >/dev/null 2>&1
    git checkout main >/dev/null 2>&1
    git branch -D amz_$VERSION >/dev/null 2>&1 || true
    cd ..
}

trap 'echo "BUILD FAILED!"' ERR

if [ ! -d "shaka-player" ]; then
    git clone https://github.com/shaka-project/shaka-player.git
fi

reset_shaka_state
cd shaka-player

echo "Checking out v$VERSION..."
git checkout -b amz_$VERSION v$VERSION

echo "Applying Vega TV resources..."
cp ../shaka-rel-v$VERSION-r$RELEASE.tar.gz .
tar -xzf shaka-rel-v$VERSION-r$RELEASE.tar.gz

echo "Applying patches..."
git am shaka-rel/shaka-patch/*.patch -3

echo "Fixing package.json & ua-parser-js..."
# Usuwamy package-lock, bo i tak go przebudujemy przez npm install
rm -f package-lock.json

if command -v jq >/dev/null 2>&1; then
    jq --arg ver "$VERSION" '.version = $ver | del(.overrides.karma) | .overrides["ua-parser-js"] = "0.7.34" | .dependencies["ua-parser-js"] = "0.7.34"' package.json > package.json.tmp && mv package.json.tmp package.json
else
    sed -i 's/"ua-parser-js": "github:joeyparrish\/ua-parser-js#preview"/"ua-parser-js": "0.7.34"/g' package.json
fi

echo "Disabling Google Fonts (Linter friendly)..."
if [ -f "ui/controls.less" ]; then
    # Zamiast wstawiać komentarz, po prostu usuwamy te linie, żeby nie drażnić lintera CSS
    sed -i '/fonts.googleapis.com/d' ui/controls.less
    sed -i '/family=Material+Icons+Round/d' ui/controls.less
fi

echo "Installing NPM dependencies (generating new lockfile)..."
# Musimy wygenerować nowy lockfile, żeby Python go nie odrzucił
npm install

echo "Building Shaka Player..."
# Przekazujemy zmienną środowiskową, żeby Python nie robił 'npm ci'
if command -v kepler >/dev/null 2>&1; then
    SHAKA_SKIP_NPM_UPDATE=1 kepler exec python3 build/all.py
else
    SHAKA_SKIP_NPM_UPDATE=1 python3 build/all.py
fi

echo "Adding @ts-nocheck..."
find dist shaka-rel/src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    if ! grep -qF "// @ts-nocheck" "$file"; then
        echo -e "// @ts-nocheck\n$(cat "$file")" > "$file"
    fi
done

cd ..
echo "SUCCESS!"