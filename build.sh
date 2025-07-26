#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Vercel build process..."

# Step 1: Install exact build dependencies 
echo "📦 Installing build dependencies..."
npm install vite@5.4.19 esbuild@0.25.0 @vitejs/plugin-react@4.3.2 typescript@5.6.3 tailwindcss@3.4.17 postcss@8.4.47 autoprefixer@10.4.20 --force --no-save

# Step 2: Verify installations
echo "🔍 Verifying installations..."
npx vite --version || (echo "Installing vite globally..." && npm install -g vite@5.4.19)
npx esbuild --version || (echo "Installing esbuild globally..." && npm install -g esbuild@0.25.0)

# Step 3: Clear cache
echo "🧹 Clearing build cache..."
rm -rf node_modules/.vite dist

# Step 4: Build frontend
echo "⚡ Building frontend..."
NODE_ENV=production npx vite build --mode production

# Step 5: Build server  
echo "🔧 Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Step 6: Verify outputs
echo "✅ Verifying build outputs..."
if [ ! -d "dist/public" ]; then
  echo "❌ Frontend build failed - dist/public not found"
  exit 1
fi

if [ ! -f "dist/index.js" ]; then
  echo "❌ Server build failed - dist/index.js not found"  
  exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Frontend: $(ls -la dist/public)"
echo "🖥️  Server: $(ls -la dist/index.js)"