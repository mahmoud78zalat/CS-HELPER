# VERCEL SUPABASE CONNECTION FIX

## Problem
Your Vercel deployment is working but not connecting to Supabase database.

## Required Environment Variables in Vercel

**Go to your Vercel project dashboard → Settings → Environment Variables and add these:**

### Frontend Variables (VITE_ prefix for client-side)
```
VITE_SUPABASE_URL=https://lafldimdrginjqloihbh.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend Variables (for server-side API)
```
SUPABASE_URL=https://lafldimdrginjqloihbh.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:your-password@db.lafldimdrginjqloihbh.supabase.co:5432/postgres
```

### Authentication & System
```
SESSION_SECRET=your-32-character-secret-here
NODE_ENV=production
```

## Important: Set for All Environments

When adding each variable in Vercel:
- ✅ Check "Production" 
- ✅ Check "Preview"
- ✅ Check "Development"

## After Setting Variables

1. **Redeploy your project** - this is critical for environment variables to take effect
2. Click "Redeploy" in Vercel dashboard or push a new commit

## Verification

Your app should then connect to Supabase and show:
- User authentication working
- Templates loading from database
- Admin panel functionality
- Real-time data sync

## Quick Test

Visit your deployed URL and:
1. Try to login with Supabase Auth
2. Check if templates load (should show data from your Supabase database)
3. Admin panel should show users and analytics

If still not working, check browser console for error messages and let me know the specific errors.