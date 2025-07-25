# Quick Vercel Deployment Fix

## ✅ What I've Fixed for You

1. **Updated vercel.json** - Fixed output directory and CORS headers
2. **Created .env.example** - Template for environment variables
3. **Updated deployment guide** - Specific troubleshooting steps

## 🚀 Exact Steps to Deploy Successfully

### 1. Update Your Local Files

In your local/GitHub repository, update these files:

**package.json** - Change the build script:
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  }
}
```

### 2. Vercel Project Settings

When setting up your Vercel project:

- **Framework Preset**: Other (or leave empty)
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x

### 3. Environment Variables (Critical!)

Add these in Vercel dashboard → Settings → Environment Variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_database_url
SESSION_SECRET=your_session_secret_key
NODE_ENV=production
```

### 4. Files to Push to GitHub

Make sure your GitHub repository has:
- ✅ `vercel.json` (updated)
- ✅ `.env.example` (created)
- ✅ `api/` folder with all serverless functions
- ✅ `client/` folder with React app
- ✅ `shared/` folder with schema
- ✅ Updated `package.json` with correct build script

## 🔍 If Still Getting Blank Page

1. **Check Vercel Function Logs**
   - Go to Vercel dashboard → Your project → Functions
   - Look for API errors

2. **Test API Endpoint**
   - Visit: `https://yourapp.vercel.app/api/site-content`
   - Should return JSON, not 404

3. **Browser Console**
   - Check for JavaScript errors
   - Look for failed API calls to your backend

## 🎯 Most Common Issues

1. **Wrong Output Directory**: Must be `dist/public` not `client/dist`
2. **Missing Environment Variables**: Supabase credentials are required
3. **Build Script**: Must be `vite build` not the complex esbuild command

The blank page is usually caused by wrong output directory or missing environment variables. Follow these exact settings and it should work!