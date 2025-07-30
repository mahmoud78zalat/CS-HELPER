#!/usr/bin/env node

/**
 * Production Server Test Script
 * Tests the production build locally with Railway environment simulation
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing Production Server Build...');

// Set production environment variables for local testing
const testEnv = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '8080',
  VITE_SUPABASE_URL: 'https://lafldimdrginjqloihbh.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODk0MzcsImV4cCI6MjA2ODg2NTQzN30.odt1bQ6leB_wWSVV4emTt5bpNts-d0NeZZ-cnBT3SYU',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI4OTQzNywiZXhwIjoyMDY4ODY1NDM3fQ.TDcqHBm6LLn_bE8KJMdxrYpE_KU9vw2LYN6L4UByOTU',
  SESSION_SECRET: 'railway-bfl-customer-service-secret-2025',
  RAILWAY_ENVIRONMENT_NAME: 'production'
};

// Check if production build exists
const productionFile = path.join(__dirname, 'dist', 'index.production.js');

if (!fs.existsSync(productionFile)) {
  console.error('❌ Production build not found!');
  console.error('Expected file:', productionFile);
  console.error('Run the build command first:');
  console.error('NODE_ENV=production npx vite build --config vite.config.railway.ts');
  console.error('npx esbuild server/index.production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:@replit/* --external:pg-native --external:cpu-features');
  process.exit(1);
}

console.log('✅ Production build found');
console.log('🚀 Starting production server with test environment...');
console.log('📍 Server URL: http://localhost:8080');
console.log('🔧 Debug URL: http://localhost:8080/api/railway/supabase-debug');
console.log('💚 Health URL: http://localhost:8080/api/railway/health');

// Start the production server
const child = spawn('node', ['dist/index.production.js'], {
  stdio: 'inherit',
  env: testEnv,
  cwd: __dirname
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

child.on('error', (error) => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`\n📊 Production server exited with code ${code} and signal ${signal}`);
  process.exit(code);
});

// Wait a moment then test endpoints
setTimeout(async () => {
  console.log('\n🧪 Testing endpoints...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:8080/api/railway/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working');
      console.log('📊 Health status:', healthData.status);
    } else {
      console.log('❌ Health endpoint failed');
    }
    
    // Test debug endpoint
    const debugResponse = await fetch('http://localhost:8080/api/railway/supabase-debug');
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint working');
      console.log('📊 Supabase connection:', debugData.supabaseTests?.connectionTest?.success ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('❌ Debug endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ Endpoint testing failed:', error.message);
  }
}, 3000);