#!/usr/bin/env node

/**
 * Railway Static Site Starter
 * Serves the built Vite frontend using the 'serve' package
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('[Railway Static] 🚀 Starting static site server...');

// Check if the build directory exists
const distPath = path.join(__dirname, 'dist', 'public');

if (!fs.existsSync(distPath)) {
  console.error('[Railway Static] 💥 CRITICAL ERROR: Build directory not found!');
  console.error('[Railway Static] Expected directory:', distPath);
  console.error('[Railway Static] Please ensure "npm run build" completed successfully.');
  process.exit(1);
}

console.log('[Railway Static] ✅ Build directory found:', distPath);

// Check what files are available
const files = fs.readdirSync(distPath);
console.log('[Railway Static] Static files available:', files);

// Check if index.html exists
if (!files.includes('index.html')) {
  console.error('[Railway Static] 💥 CRITICAL ERROR: index.html not found in build directory!');
  console.error('[Railway Static] Available files:', files);
  process.exit(1);
}

console.log('[Railway Static] ✅ index.html found, starting server...');

// Set environment variables
const PORT = process.env.PORT || 3000;
process.env.NODE_ENV = 'production';

console.log('[Railway Static] 🌐 Starting server on port:', PORT);
console.log('[Railway Static] 📁 Serving from:', distPath);

// Start the serve command
const serveCommand = 'npx';
const serveArgs = ['serve', '-s', 'dist/public', '-p', PORT.toString()];

console.log('[Railway Static] 🚀 Command:', serveCommand, serveArgs.join(' '));

const child = spawn(serveCommand, serveArgs, {
  stdio: 'inherit',
  env: process.env
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log('[Railway Static] 🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[Railway Static] 🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

child.on('error', (error) => {
  console.error('[Railway Static] 💥 Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`[Railway Static] Server exited with code ${code} and signal ${signal}`);
  process.exit(code || 0);
});