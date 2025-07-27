# Supabase Deployment Troubleshooting Guide

## Issue: Authentication works but data fetching fails after deployment

This issue occurs when authentication connects to Supabase but database operations fail, causing the app to "hang" or return empty responses.

### Root Cause Analysis

1. **Backend Falls Back to Memory Storage**: Server-side can't access environment variables
2. **Inconsistent Environment Variable Access**: Different naming patterns between frontend/backend
3. **Missing Environment Variables in Deployment**: Variables not properly set in deployment environment

### Solution Steps

#### 1. Environment Variable Setup

Ensure these exact environment variables are set in your deployment platform:

```bash
# Required for Frontend (Client-side)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Required for Backend (Server-side) 
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Important**: Use `VITE_` prefixed variables for both frontend AND backend to ensure consistency across deployment platforms.

#### 2. Verify Environment Variables

Check your deployment logs for these indicators:

**✅ Working Deployment:**
```
[SupabaseStorage] VITE_SUPABASE_URL: PRESENT
[SupabaseStorage] VITE_SUPABASE_ANON_KEY: PRESENT
[SupabaseStorage] ✅ Successfully connected to Supabase
```

**❌ Broken Deployment:**
```
[SupabaseStorage] VITE_SUPABASE_URL: MISSING
[SupabaseStorage] VITE_SUPABASE_ANON_KEY: MISSING
[Storage] Failed to initialize Supabase storage, falling back to memory storage
```

#### 3. Platform-Specific Instructions

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add the variables above
3. Redeploy the project

**Replit:**
1. Go to Secrets tab in your Repl
2. Add the variables above
3. Restart the application

**Other Platforms:**
- Ensure environment variables are available to both build-time and runtime processes
- Use `VITE_` prefix for all Supabase variables to ensure Vite can access them

#### 4. Testing Connection

After setting environment variables, check these logs:

1. **Frontend logs** (browser console):
   ```
   [Frontend Supabase] URL: https://your-project.supabase.co
   [Frontend Supabase] Key present: true
   ```

2. **Backend logs** (server console):
   ```
   [SupabaseStorage] ✅ Successfully connected to Supabase
   [SupabaseStorage] Connection test - Users count: X
   ```

#### 5. Common Mistakes

❌ **Don't do this:**
- Using different variable names for frontend vs backend
- Hardcoding fallback values in production
- Missing `VITE_` prefix for client-side variables
- Setting only `SUPABASE_URL` without `VITE_SUPABASE_URL`

✅ **Do this:**
- Use consistent `VITE_` prefixed variables everywhere
- Set all three required variables
- Verify variables are available in deployment environment
- Check both frontend and backend logs for confirmation

### Quick Debug Commands

Run these in your deployment to verify environment variables:

```bash
# Check if variables are present
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY length: ${#VITE_SUPABASE_ANON_KEY}"
echo "SERVICE_ROLE_KEY length: ${#SUPABASE_SERVICE_ROLE_KEY}"
```

### Contact Support

If the issue persists after following these steps:

1. Share your deployment logs showing the SupabaseStorage initialization
2. Confirm environment variables are set correctly in your deployment platform
3. Verify your Supabase project is accessible from your deployment URL

The authentication working but data failing is a clear indicator of environment variable configuration issues, not Supabase service problems.