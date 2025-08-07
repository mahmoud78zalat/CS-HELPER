# Railway Deployment Guide - IPv6/IPv4 Fix

## Problem Overview
Railway doesn't support outbound IPv6 connections, but Supabase's direct database connections use IPv6-only addresses. This causes `ENETUNREACH` errors when trying to fetch data from the database after deployment.

## Automatic Fixes Applied

This project now includes automatic fixes for IPv6/IPv4 compatibility:

1. **Automatic URL Conversion**: Database URLs are automatically converted to use Supabase's IPv4-compatible pooler
2. **Environment Variable Fix**: Missing DATABASE_URL is generated from Supabase credentials
3. **Client Headers**: IPv4 preference headers are automatically added for Railway deployments
4. **Connection Testing**: Startup tests validate database connectivity and provide clear error messages

## Required Environment Variables for Railway

Set these environment variables in your Railway project:

### Essential Variables
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_SECRET=your-session-secret
```

### Database Connection (Recommended)
For best compatibility, use the Supabase pooler URL:
```bash
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true
```

### Alternative: Let the System Generate It
If you don't want to manually set DATABASE_URL, set this instead:
```bash
SUPABASE_DB_PASSWORD=your-database-password
```

The system will automatically generate a Railway-compatible pooler URL.

## How to Get Your Supabase Pooler URL

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **Database**
3. Click **Connection Pooling**
4. Select **Session** mode (recommended for Railway)
5. Copy the connection string
6. Use this as your `DATABASE_URL` in Railway

## Verification

After deployment, check the Railway logs for these messages:

✅ **Success indicators:**
```
[Railway-Env] ✅ Applied IPv4 database connection fix
[Railway-Supabase] ✅ Connection successful
[Railway-DB-Test] ✅ Database connection test passed
```

❌ **Error indicators:**
```
[Railway-Supabase] 🚨 IPv6 connectivity issue detected!
[Railway-DB-Test] ❌ Database connection test failed
```

## Troubleshooting

### Still getting ENETUNREACH errors?
1. Ensure you're using the pooler URL, not direct connection
2. Check that your DATABASE_URL includes `.pooler.supabase.com`
3. Verify all environment variables are set in Railway

### Data not loading after deployment?
1. Check Railway logs for connection test results
2. Verify Supabase credentials are correct
3. Ensure your database password is correct

### Performance issues?
- Use **Session** mode pooler for persistent connections
- Use **Transaction** mode only for serverless functions

## Contact

If you continue experiencing issues after following this guide, the automatic fixes should provide detailed error messages in the Railway logs to help diagnose the problem.