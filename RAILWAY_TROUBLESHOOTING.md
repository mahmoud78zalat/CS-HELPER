# Railway Deployment Troubleshooting

## Health Check Failed - Service Not Starting

**Problem:** Railway health check fails with "1/1 replicas never became healthy"

**Root Cause:** The application requires Supabase environment variables to start, but they're missing in Railway.

### Immediate Solution

1. **Go to Railway Dashboard**
   - Open your project in Railway dashboard
   - Click on the "Variables" tab
   - Add these required environment variables:

2. **Required Environment Variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_random_32_character_string
```

3. **Get Your Supabase Credentials:**
   - Go to [supabase.com](https://supabase.com)
   - Open your project
   - Go to Settings > API
   - Copy:
     - Project URL (for VITE_SUPABASE_URL and SUPABASE_URL)
     - anon public key (for VITE_SUPABASE_ANON_KEY and SUPABASE_ANON_KEY)
     - service_role secret key (for SUPABASE_SERVICE_ROLE_KEY)

4. **Generate SESSION_SECRET:**
```bash
# Use any of these methods to generate a secure random string:
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or just use a random 32+ character string
```

5. **Redeploy:**
   - After adding all environment variables
   - Railway will automatically redeploy
   - Health check should pass within 2-5 minutes

### Health Check Process

Railway is trying to:
1. Start your application container
2. Wait for it to respond on PORT 8080
3. Check `/api/health` endpoint
4. Expect a 200 OK response

**Current Issue:** Your app can't start because it requires Supabase credentials, so the health check never gets a response.

### Verification Steps

After setting environment variables:

1. **Check Deploy Logs:**
   - Go to Railway dashboard > Deployments
   - Click on the latest deployment
   - Check logs for successful startup messages

2. **Test Health Endpoint:**
   - Once deployed, visit: `https://your-app.railway.app/api/health`
   - Should return JSON: `{"status":"healthy",...}`

3. **Test Application:**
   - Visit your Railway app URL
   - Should load the login page
   - Try logging in with your Supabase credentials

### Common Issues

**Still failing after setting variables?**
- Double-check all environment variable names (case-sensitive)
- Ensure Supabase URLs don't have trailing slashes
- Verify your Supabase project is active
- Check that SESSION_SECRET is at least 32 characters

**Application starts but crashes?**
- Check Railway logs for specific error messages
- Verify Supabase database is accessible
- Ensure all required tables exist in Supabase

**Need to create Supabase tables?**
- Run the SQL from `SUPABASE_BOOTSTRAP.sql` in your Supabase SQL editor

This is a configuration issue, not a code problem. Once the environment variables are set, the health check should pass immediately on the next deployment.