#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

try {
  // Step 1: Install build dependencies
  console.log('📦 Installing build dependencies...');
  execSync('npm install vite@5.4.19 esbuild@0.25.0 @vitejs/plugin-react@4.3.2 typescript@5.6.3 tailwindcss@3.4.17 postcss@8.4.47 autoprefixer@10.4.20 --no-save', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Step 2: Clean any existing dist directory
  console.log('🧹 Cleaning build directory...');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  // Step 3: Run Vite build
  console.log('⚡ Building frontend with Vite...');
  execSync('npx vite build --mode production', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Step 4: Build server with esbuild
  console.log('🔧 Building server with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Step 5: Verify output
  const publicPath = path.join(process.cwd(), 'dist', 'public');
  const serverPath = path.join(process.cwd(), 'dist', 'index.js');
  
  if (!fs.existsSync(publicPath)) {
    throw new Error('Frontend build failed - dist/public directory not found');
  }
  
  if (!fs.existsSync(serverPath)) {
    throw new Error('Server build failed - dist/index.js not found');
  }

  console.log('✅ Build completed successfully!');
  console.log(`📁 Frontend: ${publicPath}`);
  console.log(`🖥️  Server: ${serverPath}`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}