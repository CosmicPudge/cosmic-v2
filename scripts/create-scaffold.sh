#!/bin/bash

set -x

if [ ! -f "package.json" ]; then
    echo "❌ Run this script from the root of cosmic-v2."
    exit 1
fi

ROOT="$(cd "$(dirname "$0")" && pwd)"

source "$ROOT/scaffold.conf"

source "$ROOT/builder/helpers.sh"
source "$ROOT/builder/components.sh"
source "$ROOT/builder/next.sh"
source "$ROOT/builder/typescript.sh"
source "$ROOT/builder/assets.sh"
source "$ROOT/builder/summary.sh"

echo ""
echo "🚀 Building $PROJECT_NAME v$VERSION"
echo ""

build_components
build_next
build_typescript
build_styles

print_summary