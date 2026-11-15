#!/usr/bin/env bash
# Genera las páginas en inglés y japonés (scripts/idiomas.js) y arma dist/ solo con lo público.
# Cloudflare publica esa carpeta (wrangler.jsonc).
# Uso: bash scripts/construir.sh   y luego   npx wrangler deploy
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/idiomas.js || echo "(AVISO: faltan traducciones; en/ y ja/ quedan como estaban)"
rm -rf dist && mkdir -p dist/img dist/video dist/marca/kit
cp index.html dist/
cp -r en ja css js fuentes dist/
cp img/og.jpg img/yo.webp dist/img/
cp -r img/portafolio img/bancos dist/img/
cp -r video/escenas dist/video/
cp -r marca/kit/svg marca/kit/web dist/marca/kit/
echo "dist/ listo: $(du -sh dist | cut -f1)"
