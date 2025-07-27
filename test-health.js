/**
 * Simple health check test for Railway deployment
 * Run this after deployment to verify the health endpoint works
 */

import http from 'http';

const testHealth = async (url) => {
  return new Promise((resolve, reject) => {
    const req = http.get(url + '/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      console.error('Health check failed:', error);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
};

// Test local development
testHealth('http://localhost:5000')
  .then(result => {
    console.log('✅ Health check passed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });

export { testHealth };