#!/bin/bash
# Vercel build script - ensures all build tools are available

echo "Installing build dependencies..."
npm install --save vite@5.4.19 esbuild@0.25.0 @vitejs/plugin-react@4.3.2 typescript@5.6.3 tailwindcss@3.4.17 postcss@8.4.47 autoprefixer@10.4.20

echo "Clearing any Vite cache..."
rm -rf node_modules/.vite

echo "Running build process..."
npx vite build --mode production && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"