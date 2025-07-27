# Railway.app Deployment Guide

## Quick Deployment Steps

### 1. Prerequisites
- GitHub repository with your code
- Supabase project with credentials
- Railway.app account

### 2. Environment Variables (Required)
Set these in Railway dashboard under Variables:

**Supabase Configuration:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Session Configuration:**
```
SESSION_SECRET=your_random_32_character_string
```

**Railway Configuration (automatically set):**
```
NODE_ENV=production
PORT=8080
```

### 3. Deploy to Railway

1. **Connect Repository**
   - Go to Railway.app dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**
   - Go to Variables tab in Railway dashboard
   - Add all the required environment variables listed above
   - Railway will automatically detect the `railway.json` configuration

3. **Deploy**
   - Railway will automatically build using the Dockerfile
   - Health checks will run against `/api/health`
   - Build takes ~2-3 minutes, health checks may take 2-5 minutes

### 4. Troubleshooting

**Health Check Failures:**
- Ensure all Supabase environment variables are set correctly
- Check that SESSION_SECRET is a secure random string (32+ characters)
- Verify your Supabase project is active and accessible

**Build Failures:**
- Check the build logs for specific error messages
- Ensure all dependencies are in package.json
- Verify the build command works locally with `npm run build`

**Application Not Starting:**
- Check the deploy logs for runtime errors
- Verify environment variables are set in Railway dashboard
- Test the health endpoint locally: `curl http://localhost:8080/api/health`

### 5. Configuration Files

The following files are configured for Railway deployment:

- **`railway.json`** - Railway-specific configuration
- **`Dockerfile`** - Container build instructions  
- **`package.json`** - Build and start scripts
- **Health Check** - Available at `/api/health`

### 6. Post-Deployment

1. **Test Health Check**
   - Visit `https://your-app.railway.app/api/health`
   - Should return: `{"status":"healthy","timestamp":"...","environment":"production",...}`

2. **Test Application**
   - Visit your Railway app URL
   - Log in with your Supabase credentials
   - Verify all features work correctly

3. **Monitor Logs**
   - Check Railway logs for any runtime errors
   - Monitor performance and response times

## Support

If you encounter issues:
1. Check Railway logs for specific error messages
2. Verify all environment variables are correctly set
3. Test the application locally with the same environment variables
4. Contact Railway support for platform-specific issues

Your Customer Service Platform is now deployed on Railway! 🚀