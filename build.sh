#!/bin/bash
# Vercel build script - ensures all build tools are available

echo "Installing build dependencies explicitly..."
npm install --no-save vite esbuild @vitejs/plugin-react typescript tailwindcss postcss autoprefixer

echo "Running build process..."
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"