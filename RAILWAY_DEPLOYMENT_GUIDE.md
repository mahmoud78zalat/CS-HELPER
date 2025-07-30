# Railway.app Deployment Guide - BFL Customer Service Helper

## Quick Fix for Current Issue

Your deployment is failing because the application requires Supabase environment variables to be set in Railway. Here's how to fix it:

### 1. Set Environment Variables in Railway Dashboard

Go to your Railway project dashboard and add these environment variables:

**Required Supabase Variables:**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_random_session_secret
```

**How to get Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) and create/access your project
2. Go to Settings → API
3. Copy your Project URL (VITE_SUPABASE_URL)
4. Copy your anon/public key (VITE_SUPABASE_ANON_KEY) 
5. Copy your service_role key (SUPABASE_SERVICE_ROLE_KEY)

**Session Secret:**
Generate a random 32+ character string for SESSION_SECRET:
```bash
# You can generate one with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Deploy Process

1. **Push your code to GitHub** (if not already done)
2. **Connect Railway to your GitHub repo**
3. **Set the environment variables** in Railway dashboard
4. **Deploy** - Railway will automatically use the Dockerfile

### 3. Troubleshooting

**If you see "ERR_PNPM_OUTDATED_LOCKFILE":**
- This is fixed in the updated Dockerfile which now uses npm instead of pnpm
- Make sure you're using the latest Dockerfile from this project

**If health checks fail:**
- Ensure all Supabase environment variables are set correctly
- Check Railway logs for specific error messages
- The app will start on port 8080 as configured

### 4. Railway-Specific Files

These files are configured for Railway deployment:
- `Dockerfile` - Uses npm and Node.js 20
- `railway.json` - Railway configuration with health checks
- `.dockerignore` - Excludes pnpm files to prevent conflicts

## Complete Deployment Steps

1. **Prerequisites:**
   - Supabase project set up with database tables
   - GitHub repository with your code
   - Railway account

2. **Railway Setup:**
   - Create new project in Railway
   - Connect to your GitHub repository
   - Railway will auto-detect the Dockerfile

3. **Environment Configuration:**
   Set all required environment variables in Railway dashboard:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
   SESSION_SECRET=your-random-32-char-secret
   NODE_ENV=production
   PORT=8080
   ```

4. **Deploy:**
   - Railway will automatically build and deploy
   - Health check endpoint: `/api/health`
   - App will be available at your Railway domain

## Database Setup

Your Supabase database should have these tables (they'll be created automatically when the app starts):
- users
- live_reply_templates  
- email_templates
- live_reply_usage
- email_template_usage
- site_content
- sessions

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify all environment variables are set
3. Ensure Supabase project is accessible
4. Check that your Supabase database URL is correct

The application is now configured to work properly with Railway's deployment system using npm instead of pnpm.