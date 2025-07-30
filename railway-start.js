#!/usr/bin/env node

// Railway production starter script
// This ensures we use the correct production build file

console.log('[Railway] 🚂 Starting Railway deployment with production build...');

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set production environment
process.env.NODE_ENV = 'production';

// Check if the production build exists
const productionFile = path.join(__dirname, 'dist', 'index.production.js');

if (!fs.existsSync(productionFile)) {
  console.error('[Railway] 💥 CRITICAL ERROR: Production build not found!');
  console.error('[Railway] Expected file:', productionFile);
  console.error('[Railway] Please check build process completed successfully.');
  process.exit(1);
}

console.log('[Railway] ✅ Production build found:', productionFile);
console.log('[Railway] 🚀 Starting server...');

// Start the production server
const child = spawn('node', ['dist/index.production.js'], {
  stdio: 'inherit',
  env: process.env
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log('[Railway] 🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[Railway] 🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

child.on('error', (error) => {
  console.error('[Railway] 💥 Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`[Railway] Server exited with code ${code} and signal ${signal}`);
  process.exit(code);
});