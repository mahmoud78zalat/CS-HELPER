# Render.com Deployment Test Checklist

Use this checklist to verify your Customer Service Platform deployment on Render.com is working correctly.

## Pre-Deployment Verification

### Local Testing
- [ ] Build works locally: `npm run build`
- [ ] Production build starts: `npm run start:simple`
- [ ] Health check responds: `curl http://localhost:5000/api/health`
- [ ] Frontend loads without errors
- [ ] Database connection works (if using Supabase)

### Environment Setup
- [ ] All required environment variables documented in `.env.example`
- [ ] Supabase project created (if using Supabase)
- [ ] Database schema created (run `SUPABASE_BOOTSTRAP.sql`)
- [ ] GitHub repository is public or connected to Render

## Deployment Steps

### 1. Connect Repository
- [ ] Repository connected to Render.com
- [ ] Build settings configured (auto-detected from `render.yaml`)
- [ ] Environment variables set in Render dashboard

### 2. Environment Variables
Set these in Render Dashboard → Your Service → Environment:

**Required (choose database option):**
- [ ] `SESSION_SECRET` = (generate secure 32+ character string)

**Option A - Supabase Database:**
- [ ] `VITE_SUPABASE_URL` = https://your-project-id.supabase.co
- [ ] `VITE_SUPABASE_ANON_KEY` = your-anon-key
- [ ] `SUPABASE_URL` = https://your-project-id.supabase.co
- [ ] `SUPABASE_ANON_KEY` = your-anon-key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = your-service-role-key

**Option B - Render PostgreSQL:**
- [ ] Database service created in Render
- [ ] `DATABASE_URL` automatically connected

**Auto-managed:**
- [ ] `NODE_ENV` = production (automatic)
- [ ] `PORT` = (automatic from Render)

### 3. Initial Deployment
- [ ] Build completes successfully
- [ ] Service starts without errors
- [ ] Health check passes
- [ ] Service marked as "Live"

## Post-Deployment Testing

### Basic Functionality
1. **Application Access**
   - [ ] Visit your Render URL: `https://your-app-name.onrender.com`
   - [ ] Frontend loads without JavaScript errors
   - [ ] No 404 errors for static assets
   - [ ] Page styling loads correctly

2. **Health Check**
   - [ ] Visit `/api/health` endpoint
   - [ ] Returns JSON with status "healthy"
   - [ ] Database status shows "connected" (if using database)

3. **API Endpoints**
   - [ ] `/api/live-reply-templates` returns data
   - [ ] `/api/email-templates` returns data
   - [ ] `/api/site-content` returns data
   - [ ] All endpoints return proper JSON responses

### Database Testing (if using database)
4. **Supabase Connection** (if using Supabase)
   - [ ] User registration works
   - [ ] Login/logout functions
   - [ ] Templates can be created/edited
   - [ ] Data persists between sessions

5. **Render PostgreSQL** (if using Render DB)
   - [ ] Database migrations completed
   - [ ] Tables created successfully
   - [ ] Data operations work correctly

### User Interface Testing
6. **Frontend Features**
   - [ ] Landing page loads
   - [ ] Login page accessible
   - [ ] Admin panel works (if logged in as admin)
   - [ ] Template creation/editing works
   - [ ] Customer data panel functions
   - [ ] Email composer works

7. **Authentication**
   - [ ] User can register new account
   - [ ] Login works with valid credentials
   - [ ] Sessions persist across page reloads
   - [ ] Logout clears session properly

### Performance Testing
8. **Load Testing**
   - [ ] Site loads in under 3 seconds
   - [ ] API responses are fast (< 500ms)
   - [ ] No memory leaks after extended use
   - [ ] Health check consistently passes

## Troubleshooting

### If Build Fails
1. Check build logs in Render dashboard
2. Verify all dependencies in `package.json`
3. Test build locally: `npm run build`
4. Check for TypeScript errors

### If Service Won't Start
1. Check service logs for error messages
2. Verify environment variables are set correctly
3. Test health endpoint manually
4. Check database connectivity

### If Frontend Shows Errors
1. Check browser console for JavaScript errors
2. Verify environment variables for frontend (VITE_*)
3. Check network tab for failed API calls
4. Ensure static files are served correctly

### If Database Issues
1. Verify database service is running (Render DB)
2. Check Supabase project status and credentials
3. Test database connection in health endpoint
4. Verify tables exist and have correct structure

## Success Criteria

Your deployment is successful when:
- [ ] Application loads without errors
- [ ] Health check returns "healthy" status
- [ ] Users can register and log in
- [ ] Templates can be created and used
- [ ] All API endpoints respond correctly
- [ ] Data persists between sessions
- [ ] Performance is acceptable (< 3s load time)

## Security Checklist

Post-deployment security verification:
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Environment variables are secure
- [ ] Database has proper access controls
- [ ] Session secrets are strong and unique
- [ ] No sensitive data in logs or error messages

Your Customer Service Platform is now production-ready on Render.com!