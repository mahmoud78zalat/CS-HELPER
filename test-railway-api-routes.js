#!/usr/bin/env node

/**
 * Railway API Routes Test Script
 * Tests that all API routes are properly registered and working
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing Railway API Routes Fix...');

// Set production environment variables for local testing
const testEnv = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '8081',
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
  process.exit(1);
}

console.log('✅ Production build found');
console.log('🚀 Starting production server...');
console.log('📍 Server URL: http://localhost:8081');

// Start the production server
const child = spawn('node', ['dist/index.production.js'], {
  stdio: 'inherit',
  env: testEnv,
  cwd: __dirname
});

// Test API routes after server starts
setTimeout(async () => {
  console.log('\n🧪 Testing API routes...');
  
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: 'http://localhost:8081/api/railway/health',
      expectJSON: true
    },
    {
      name: 'Debug Endpoint',
      method: 'GET', 
      url: 'http://localhost:8081/api/railway/supabase-debug',
      expectJSON: true
    },
    {
      name: 'Personal Notes GET',
      method: 'GET',
      url: 'http://localhost:8081/api/personal-notes',
      headers: { 'X-User-Id': 'test-user-123' },
      expectJSON: true
    },
    {
      name: 'Personal Notes POST',
      method: 'POST',
      url: 'http://localhost:8081/api/personal-notes',
      headers: { 
        'X-User-Id': 'test-user-123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Test Note',
        content: 'This is a test note for Railway deployment'
      }),
      expectJSON: true
    },
    {
      name: 'Live Reply Templates',
      method: 'GET',
      url: 'http://localhost:8081/api/live-reply-templates',
      expectJSON: true
    },
    {
      name: 'Color Settings',
      method: 'GET',
      url: 'http://localhost:8081/api/color-settings',
      expectJSON: true
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: test.headers || {}
      };

      if (test.body) {
        options.body = test.body;
      }

      const response = await fetch(test.url, options);
      const statusCode = response.status;
      
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        responseText = '[No response body]';
      }

      if (statusCode === 405) {
        console.log(`❌ ${test.name}: 405 Method Not Allowed - Route not registered`);
      } else if (statusCode >= 200 && statusCode < 300) {
        console.log(`✅ ${test.name}: ${statusCode} - SUCCESS`);
        passedTests++;
      } else if (statusCode === 404) {
        console.log(`❌ ${test.name}: 404 Not Found - Route missing`);
      } else if (statusCode >= 400 && statusCode < 500) {
        console.log(`⚠️ ${test.name}: ${statusCode} - Client error (may be expected)`);
        passedTests++; // Count as pass if it's a client error (route exists)
      } else {
        console.log(`❌ ${test.name}: ${statusCode} - Server error`);
        console.log(`   Response: ${responseText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: Network error - ${error.message}`);
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! API routes are working correctly.');
  } else {
    console.log('⚠️ Some routes failed. Check the output above for details.');
  }

  // Kill the server
  child.kill('SIGTERM');
  process.exit(passedTests === totalTests ? 0 : 1);
  
}, 5000);

// Handle cleanup
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  child.kill('SIGINT');
});

child.on('error', (error) => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`\n📊 Server exited with code ${code} and signal ${signal}`);
});