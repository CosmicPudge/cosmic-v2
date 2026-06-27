#!/bin/bash

set -e

# Safety check
if [ ! -f "package.json" ]; then
    echo "❌ Run this script from the root of cosmic-v2."
    exit 1
fi

echo "📁 Creating Cosmic OS folder structure..."

mkdir -p \
app/os/{assistant,outlook,calendar,weather,sports,garage,school,projects,notes,settings} \
components/os/{core,layout,widgets,windows,overlays,effects,ui,icons,animations} \
hooks/os \
lib/{ai,auth,microsoft,weather,sports,school,garage,notifications} \
services \
stores \
config/os \
styles/os \
types/os \
utils/os \
public/os/{fonts,icons,images,sounds,videos,wallpapers} \
docs \
constants/os \
scripts

echo "✅ Folder structure created successfully."