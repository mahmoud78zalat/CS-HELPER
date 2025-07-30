# Railway Blank Page Fix - Complete Guide

## Issue: Deployed Railway app shows completely blank page

**Symptoms:**
- Railway deployment URL returns 404 "Application not found"
- Health endpoint also returns 404
- Local production build works perfectly

**Root Cause Analysis:**
The Railway deployment is failing because either:
1. Environment variables are not set in Railway dashboard
2. Railway build process is not creating static files properly
3. Railway is not starting the application correctly

## Step-by-Step Fix

### 1. Check Railway Environment Variables

Go to your Railway project dashboard and ensure these variables are set:

```
VITE_SUPABASE_URL=https://lafldimdrginjqloihbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODk0MzcsImV4cCI6MjA2ODg2NTQzN30.odt1bQ6leB_wWSVV4emTt5bpNts-d0NeZZ-cnBT3SYU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI4OTQzNywiZXhwIjoyMDY4ODY1NDM3fQ.lfME_7acf3LYMdlnQflOaMavMErHhRgl4QBxKYXyWd8
SESSION_SECRET=railway-bfl-customer-service-secret-2025
```

**Note:** Do NOT set `NODE_ENV=production` or `PORT` - these are handled automatically.

### 2. Verify Railway Build Settings

In Railway dashboard:
1. Go to Settings tab
2. Check "Build Command": Should be automatic (uses Dockerfile)
3. Check "Start Command": Should be automatic (uses Dockerfile CMD)

### 3. Force Railway Redeploy

After setting environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Or push a small change to GitHub to trigger new deployment

### 4. Check Railway Logs

During deployment, check logs for:
- ✅ `[Railway] ✅ Static files served from: /app/dist/public`
- ✅ `[Railway] Static files found: [ 'assets', 'index.html' ]`
- ✅ `[Railway] ✅ Server successfully started`

If you see these messages, the issue is environment variables.

### 5. Alternative Fix: Manual Environment Check

If Railway is still showing blank page, the environment variables might not be propagating. Check Railway logs for:

```
🚂 Railway Environment Configuration:
   NODE_ENV: production
   PORT: [PORT_NUMBER]
   Database: Supabase
   Supabase URL: configured
   Service Role Key: configured
```

If you see "NOT CONFIGURED" instead of "configured", the environment variables are not set properly.

## Expected Working Flow

**Successful deployment should show:**
1. Build completes without errors
2. Frontend assets created in `dist/public/`
3. Backend bundle created as `dist/index.production.js`
4. Server starts and serves static files
5. Health endpoint returns `{"status":"healthy"}`
6. Frontend loads with authentication page

## Troubleshooting Commands

Test locally first to confirm everything works:
```bash
# Build production
NODE_ENV=production npx vite build --config vite.config.railway.ts
npx esbuild server/index.production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:@replit/* --external:pg-native --external:cpu-features

# Test production server
export VITE_SUPABASE_URL="https://lafldimdrginjqloihbh.supabase.co"
export VITE_SUPABASE_ANON_KEY="your_anon_key"
export SUPABASE_SERVICE_ROLE_KEY="your_service_key" 
export SESSION_SECRET="railway-bfl-customer-service-secret-2025"
export PORT=8080
export NODE_ENV=production

node railway-start.js
```

If this works locally but fails on Railway, the issue is definitely environment variables in Railway dashboard.

## Files That Must Be Pushed to GitHub

Make sure these files are committed and pushed:
- `railway-start.js`
- `railway.json` 
- `Dockerfile`
- `server/index.production.ts`
- `vite.config.railway.ts`
- `nixpacks.toml`

## Quick Fix Summary

1. **Set environment variables in Railway dashboard**
2. **Redeploy from Railway dashboard**
3. **Check deployment logs for static file confirmation**
4. **Test health endpoint: https://your-app.railway.app/api/health**

The local production build works perfectly, so the issue is 100% Railway environment configuration.