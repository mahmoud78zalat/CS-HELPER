# Vercel Environment Variables Setup Guide

## 🔑 Required Environment Variables

Add these **exact** environment variables in your Vercel Dashboard:

### Go to: Project Settings → Environment Variables

```
VITE_SUPABASE_URL=https://lafldimdrginjqloihbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczOTg0MjYsImV4cCI6MjA1Mjk3NDQyNn0.Ljs6j-fIR4zNR7PZv-fmQ4J6HaklO4RgGJJOwBb7QSI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM5ODQyNiwiZXhwIjoyMDUyOTc0NDI2fQ.CXqvHcG_dZ_rJP1OJQdNtMpJXL-wjKSFz7nGLLhD4QE
NODE_ENV=production
```

## ⚠️ Important Setup Instructions

### 1. Environment Selection
**CRITICAL**: Set these variables for **ALL environments**:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 2. After Adding Variables
**You MUST redeploy** for changes to take effect:
- Go to Deployments tab
- Click "Redeploy" on latest deployment
- OR push a new commit

### 3. Verification Steps
After deployment, test these endpoints:

#### Health Check
```
GET https://your-app.vercel.app/api/health
```
Should return:
```json
{
  "status": "OK",
  "environment": "production",
  "supabase": true
}
```

#### Environment Test
```
GET https://your-app.vercel.app/api/test
```
Should show:
```json
{
  "environmentVariables": {
    "VITE_SUPABASE_URL": true,
    "VITE_SUPABASE_ANON_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "urlLength": 43,
    "keyLength": 208,
    "serviceKeyLength": 219
  }
}
```

#### Templates Test (Main Issue)
```
GET https://your-app.vercel.app/api/templates
```
Should return array of templates, NOT empty array.

## 🐛 Troubleshooting

### Issue: "No templates found"
**Cause**: Environment variables not set or deployment not refreshed
**Solution**: 
1. Verify all 4 variables are set in Vercel dashboard
2. Redeploy the application
3. Test `/api/test` endpoint to confirm variables

### Issue: 500 Internal Server Error
**Cause**: Missing SUPABASE_SERVICE_ROLE_KEY
**Solution**: Add service role key and redeploy

### Issue: CORS Errors
**Cause**: Domain not in allowed origins
**Solution**: Update allowed origins in `/api/index.ts`

## 🚀 Quick Deployment Checklist

- [ ] All 4 environment variables added to Vercel
- [ ] Variables set for Production, Preview, AND Development
- [ ] Application redeployed after adding variables
- [ ] `/api/health` returns status: "OK"
- [ ] `/api/test` shows all environment variables as `true`
- [ ] `/api/templates` returns actual templates data
- [ ] Frontend loads and shows templates

Your app should now work identically to the Replit preview! 🎉