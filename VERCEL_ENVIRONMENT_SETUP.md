# Vercel Environment Variables Setup Guide

## Quick Setup

1. **Copy the `.env.vercel` file** - Contains all required environment variables
2. **Add to Vercel Dashboard**:
   - Go to your Vercel project
   - Settings → Environment Variables
   - Add each variable from `.env.vercel`
   - Set for: Production, Preview, Development

## Required Variables (Minimum)

```bash
SUPABASE_URL=https://lafldimdrginjqloihbh.supabase.co
VITE_SUPABASE_URL=https://lafldimdrginjqloihbh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0
NODE_ENV=production
```

## Additional Variables (Recommended)

For full functionality, also add:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_dashboard
SESSION_SECRET=generate_random_32_character_string
```

## Step-by-Step Vercel Setup

### 1. Access Environment Variables
- Login to Vercel Dashboard
- Select your project
- Go to **Settings** tab
- Click **Environment Variables**

### 2. Add Variables
For each variable in `.env.vercel`:
- Click **"Add New"**
- Enter **Name** (e.g., `SUPABASE_URL`)
- Enter **Value** (e.g., `https://lafldimdrginjqloihbh.supabase.co`)
- Select **Environments**: Production, Preview, Development
- Click **Save**

### 3. Deploy
- Go to **Deployments** tab
- Click **"Redeploy"** on latest deployment
- Wait for completion

## How to Get Missing Values

### Service Role Key
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Settings → API
4. Copy "service_role" key
5. Add as `SUPABASE_SERVICE_ROLE_KEY`

### Session Secret
Generate a random string:
```bash
# Use any random 32+ character string
SESSION_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

## Verification

After setting environment variables:
1. Redeploy your Vercel project
2. Visit your deployed app
3. Check if templates load (should show your Supabase data)
4. Test login functionality
5. Verify admin panel access

## Troubleshooting

**Templates not loading?**
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check browser console for connection errors

**Authentication not working?**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase Auth settings

**Environment variables not working?**
- Ensure variables are set for all environments (Production, Preview, Development)
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## Security Best Practices

- **Never commit** `.env.vercel` to public repositories
- **ANON_KEY** is safe to expose (designed for frontend use)
- **SERVICE_ROLE_KEY** must remain private (has admin access)
- Use unique **SESSION_SECRET** for each deployment environment