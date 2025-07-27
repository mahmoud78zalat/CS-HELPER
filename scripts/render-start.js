#!/usr/bin/env node

/**
 * Render.com startup script for Customer Service Platform
 * Handles database initialization and graceful startup
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Customer Service Platform on Render.com...');

// Environment validation
const requiredEnvVars = ['NODE_ENV'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
  console.log('Continuing with defaults...');
}

// Set defaults for Render environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '5000';

console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Port: ${process.env.PORT}`);

// Database validation
if (process.env.DATABASE_URL) {
  console.log('🗄️ Using Render PostgreSQL database');
} else if (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) {
  console.log('☁️ Using Supabase database');
} else {
  console.log('💾 Using in-memory storage (development only)');
}

// Start the application
console.log('🎯 Starting application server...');

const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📋 Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📋 Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});

serverProcess.on('exit', (code) => {
  console.log(`🏁 Server process exited with code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Server process error:', error);
  process.exit(1);
});