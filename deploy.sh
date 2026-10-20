#!/usr/bin/env bash
# פרסום ל-GitHub Pages: בונה ומעלה את dist לענף gh-pages
set -euo pipefail
cd "$(dirname "$0")"
npm run build
touch dist/.nojekyll
TMP=$(mktemp -d)
cp -R dist/. "$TMP/"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="Rina Atias" -c user.email="rinaati@gmail.com" commit -q -m "deploy $(date '+%d/%m/%Y %H:%M')"
git push -q -f "https://github.com/rinaati-sketch/subscription-radar-app.git" gh-pages
rm -rf "$TMP"
echo "פורסם: https://rinaati-sketch.github.io/subscription-radar-app/"
