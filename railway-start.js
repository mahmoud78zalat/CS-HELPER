#!/usr/bin/env node

/**
 * Railway-specific startup script
 * Handles environment variable setup and server startup for Railway deployment
 */

// Set production environment for Railway
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import and start the application
import('./dist/index.js');