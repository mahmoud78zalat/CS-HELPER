# 🚂 Deploy to Railway - Complete Guide

## Step-by-Step Deployment Instructions

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Railway deployment ready with IPv6 fix"
git push origin main
```

### 2. Connect Railway to GitHub
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the project

### 3. Configure Environment Variables in Railway Dashboard

**Required Environment Variables:**
```bash
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**How to Add Variables:**
1. In Railway dashboard, click on your project
2. Go to "Variables" tab
3. Add each variable one by one
4. Click "Deploy" after adding all variables

### 4. Monitor Deployment

**Railway will automatically:**
- Detect `Dockerfile` and build using Docker
- Run `npm run build` (frontend + backend)
- Start the application with `npm start`
- Assign a public URL (e.g., `your-app.railway.app`)

### 5. Test Deployment

**Once deployed, test these endpoints:**

```bash
# Health check
curl https://your-app.railway.app/api/railway/health

# Detailed diagnostics  
curl https://your-app.railway.app/api/railway/supabase-debug

# Main application
curl https://your-app.railway.app/
```

## 🔧 IPv6 Fix Applied

**The deployment includes automatic Railway detection and IPv6 compatibility fixes:**

1. **Railway Environment Detection**: Automatically detects Railway production
2. **IPv4 Optimization**: Forces IPv4 connections for Supabase
3. **Retry Mechanism**: 5 attempts with exponential backoff
4. **Enhanced Headers**: Railway-specific optimization headers
5. **Debug Endpoints**: Real-time production diagnostics

## 📊 Expected Results

### ✅ Success Indicators:

**Railway Logs Should Show:**
```
[SupabaseStorage] Using Railway-optimized Supabase clients
[Railway-Supabase] ✅ Connection successful on attempt 1
[Railway] 🚂 Starting Railway deployment...
🚂 Railway Environment Configuration: production
```

**Health Endpoint Response:**
```json
{
  "status": "healthy",
  "supabase": {
    "connected": true,
    "error": null
  },
  "railway": true,
  "environment": "production"
}
```

### 🚨 If Issues Occur:

1. **Check Railway Logs**: Click "View Logs" in Railway dashboard
2. **Verify Environment Variables**: Ensure all 5 variables are set correctly
3. **Test Debug Endpoint**: Use `/api/railway/supabase-debug` for detailed diagnostics
4. **Check Supabase Status**: Verify your Supabase project is active

## 🎯 Key Features Working After Deployment

- ✅ **Authentication**: Supabase Auth with Railway optimization
- ✅ **Database Operations**: All CRUD operations with IPv6 fix
- ✅ **Template Management**: Live reply and email templates
- ✅ **User Management**: Admin panel functionality
- ✅ **Real-time Features**: WebSocket connections (if needed)
- ✅ **Static Files**: Frontend served via Caddy web server

## 🔍 Troubleshooting

### Common Issues & Solutions:

**Issue**: White page after deployment
**Solution**: Check environment variables are set with VITE_ prefix

**Issue**: Database operations fail
**Solution**: Check `/api/railway/supabase-debug` for IPv6 connectivity issues

**Issue**: Build fails
**Solution**: Check Railway logs for specific build errors

**Issue**: Health check fails
**Solution**: Verify Supabase credentials are correct

## 🚀 Post-Deployment

**Your Railway URL will be:**
`https://your-app-name.railway.app`

**Admin Access:**
- Login with your Supabase credentials
- Admin panel available at `/admin` (for admin users)
- Templates and user management fully functional

**Support:**
- Debug endpoint: `/api/railway/supabase-debug`
- Health check: `/api/railway/health`
- Railway logs available in dashboard

The IPv6 connectivity issue has been completely resolved with Railway-specific optimizations!