# Render.com Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Build Failures

**Issue**: Build process fails during deployment
```bash
npm ERR! missing script: build
```

**Solution**: 
- Ensure your repository includes all source files
- Verify `package.json` has the correct build script
- Check that all dependencies are listed in `package.json`

**Manual fix**:
```bash
# If automatic build fails, use manual commands:
npm ci
vite build
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### 2. Environment Variable Issues

**Issue**: Application shows "Missing Supabase credentials" error

**Solution**:
1. Go to Render Dashboard → Your Service → Environment
2. Add these variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SESSION_SECRET=your-random-secret
   ```
3. Redeploy your service

### 3. Database Connection Issues

**Issue**: App starts but shows database errors

**For Supabase Users**:
1. Verify your Supabase project is active
2. Check that environment variables match your Supabase settings
3. Ensure your database has the required tables (run `SUPABASE_BOOTSTRAP.sql`)

**For Render PostgreSQL Users**:
1. Ensure the database service is running
2. Check that `DATABASE_URL` is automatically set
3. Run database migrations: `npm run db:push`

### 4. Health Check Failures

**Issue**: Service fails health checks and gets marked as unhealthy

**Solution**:
1. Check logs in Render Dashboard
2. Ensure `/api/health` endpoint is accessible
3. Verify server is binding to `0.0.0.0:$PORT`
4. Test health endpoint manually: `curl https://your-app.onrender.com/api/health`

### 5. Static File Issues

**Issue**: Frontend files not loading (404 errors)

**Solution**:
1. Verify build creates `dist/public` directory
2. Check that Express serves static files correctly
3. Ensure Vite build completed successfully

### 6. Session/Authentication Issues

**Issue**: Users can't log in or sessions don't persist

**Solution**:
1. Set a secure `SESSION_SECRET` environment variable
2. Ensure database stores sessions correctly
3. Check CORS settings for your domain

### 7. Performance Issues

**Issue**: App is slow or times out

**Solutions**:
- Upgrade to Render's paid plan for better performance
- Optimize database queries
- Enable caching where appropriate
- Use Render's CDN for static assets

### 8. Memory Issues

**Issue**: App crashes with "out of memory" errors

**Solutions**:
- Upgrade your Render plan for more memory
- Optimize application memory usage
- Check for memory leaks in your code

## Deployment Checklist

Before deploying to Render:

- [ ] All source code is committed to your repository
- [ ] Environment variables are documented in `.env.example`
- [ ] Build process works locally: `npm run build`
- [ ] Health check endpoint responds: `/api/health`
- [ ] Database schema is ready (Supabase tables created)
- [ ] Session secret is generated and secure
- [ ] CORS is configured for your domain

## Getting Help

1. **Check Render Logs**: Go to your service dashboard and check the "Logs" tab
2. **Test Locally**: Run `NODE_ENV=production npm start` locally to reproduce issues
3. **Database Debug**: Check the health endpoint at `/api/health` for database status
4. **Environment Check**: Verify all required environment variables are set

## Emergency Rollback

If deployment fails:
1. Go to Render Dashboard → Your Service → Deploys
2. Click "Redeploy" on a previous working deploy
3. Fix issues in your code and redeploy when ready

Your Customer Service Platform should now be running smoothly on Render.com!