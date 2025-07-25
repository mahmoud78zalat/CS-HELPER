# Vercel Deployment Guide

## Overview
This guide will help you deploy your BFL Customer Service Helper to Vercel using your existing Supabase database.

## Prerequisites
- GitHub account with your project repository
- Vercel account (free tier is sufficient)
- Your existing Supabase database credentials

## Step 1: Prepare Your Project for Vercel

### 1.1 Update package.json build script
Since package.json editing is restricted in this environment, you'll need to manually update the build script in your local/GitHub repository:

```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  }
}
```

### 1.2 Project Structure
Your project now has the following Vercel-ready structure:
```
├── api/                    # Vercel serverless functions
│   ├── user/
│   │   └── [id].ts        # Dynamic user endpoint
│   ├── create-user.ts     # User creation
│   ├── templates.ts       # Template management
│   ├── email-templates.ts # Email template management
│   └── site-content.ts    # Site content
├── client/                # React frontend
├── vercel.json           # Vercel configuration
└── package.json
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory of your project

### 2.2 Configure Environment Variables
In your Vercel project settings, add these environment variables:

**Required Variables:**
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_database_url
SESSION_SECRET=your_session_secret_key
NODE_ENV=production
```

**Optional Variables (if using Replit Auth):**
```
REPL_ID=your_repl_id
ISSUER_URL=your_issuer_url
```

### 2.3 Configure Build Settings
- **Framework Preset**: Other (or leave empty)
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x or 20.x

## Step 3: Fix Blank Page Issues

### 3.1 Critical Files to Check Before Deploying

**1. Update package.json build script locally:**
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build",
    "start": "node dist/index.js"
  }
}
```

**2. Ensure your GitHub repository has these exact files:**
- `vercel.json` (already updated)
- `.env.example` (template for environment variables)
- All `api/` folder contents
- `client/` folder with React app
- `shared/` folder with schema

### 3.2 Common Blank Page Fixes

**Problem 1: Wrong Output Directory**
- Vercel setting: `dist/public` (matches your vite.config.ts)
- NOT `client/dist` or just `dist`

**Problem 2: Missing Environment Variables**
- All Supabase credentials must be set in Vercel dashboard
- `NODE_ENV=production` is required
- Missing DATABASE_URL will cause API failures

**Problem 3: Build Configuration**
- Framework preset: "Other" or leave empty
- Build command: `npm run build`
- Node.js version: 18.x or 20.x

### 3.3 Troubleshooting Steps

**If you still get a blank page:**

1. **Check Vercel Function Logs:**
   - Go to your Vercel dashboard
   - Click on your project → Functions tab
   - Look for errors in `/api` functions

2. **Check Build Logs:**
   - In deployment details, review the build output
   - Ensure Vite build completes successfully
   - Confirm files are generated in `dist/public`

3. **Test API Endpoints:**
   - Visit `https://yourapp.vercel.app/api/site-content`
   - Should return JSON data, not 404

4. **Browser Console:**
   - Open browser dev tools on your deployed site
   - Check for JavaScript errors
   - Look for failed API calls

### 3.4 Complete API Migration
The current setup includes basic API endpoints. You may need to create additional serverless functions for:
- Personal notes management
- User role updates
- Template usage tracking
- WebSocket functionality (consider using Vercel's Edge Functions or a separate service)

### 3.2 Authentication Configuration
Since your app uses Supabase Auth, ensure your Supabase project is configured with:
- Correct site URL (your Vercel deployment URL)
- Redirect URLs for authentication

### 3.3 Database Connectivity
Your existing Supabase setup should work seamlessly with Vercel since all database operations go through Supabase's API.

## Step 4: Test Deployment

After deployment:
1. Visit your Vercel deployment URL
2. Test user authentication
3. Verify template loading
4. Check admin panel functionality
5. Test all API endpoints

## Step 5: Custom Domain (Optional)
1. In Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update Supabase site URL settings

## Notes
- **WebSocket Support**: Vercel doesn't support WebSocket connections in serverless functions. Consider using Supabase Realtime or implementing polling for real-time features.
- **Session Storage**: Your PostgreSQL session storage should work fine with Vercel.
- **File Structure**: The `/api` directory functions are automatically deployed as serverless endpoints.

## Troubleshooting
- **Build Errors**: Check that all imports use relative paths
- **API Errors**: Ensure environment variables are correctly set
- **Auth Issues**: Verify Supabase configuration matches your deployment URL

## Cost Estimation
- **Vercel Free Tier**: Sufficient for small to medium projects
- **Supabase Free Tier**: You're already using this
- **Total Cost**: $0/month for basic usage

Your project is now ready for Vercel deployment with these configurations!