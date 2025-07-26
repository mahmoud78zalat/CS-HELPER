# Vercel Environment Variables Setup

## Required Environment Variables

After deploying to Vercel, you need to set these environment variables in your Vercel project dashboard:

### 1. Supabase Configuration
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2. Authentication
```bash
SESSION_SECRET=your-very-secure-session-secret-at-least-32-characters-long
```

### 3. System Configuration
```bash
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable above with its corresponding value
5. Make sure to select "Production", "Preview", and "Development" for each variable
6. Click "Save" after adding each variable
7. Redeploy your project for changes to take effect

## Getting Supabase Credentials

1. **DATABASE_URL**: Go to Supabase Dashboard > Project Settings > Database > Connection string (URI)
2. **VITE_SUPABASE_URL**: Go to Supabase Dashboard > Project Settings > API > Project URL
3. **VITE_SUPABASE_ANON_KEY**: Go to Supabase Dashboard > Project Settings > API > Project API keys > anon/public
4. **SUPABASE_SERVICE_ROLE_KEY**: Go to Supabase Dashboard > Project Settings > API > Project API keys > service_role (keep this secret!)

## Database Setup

Make sure to run the SQL commands from `SUPABASE_BOOTSTRAP.sql` in your Supabase SQL editor to create all necessary tables and functions.

## Troubleshooting

- If you get 404 errors: Check that all environment variables are set correctly
- If API calls fail: Verify Supabase credentials and database tables exist
- If authentication doesn't work: Ensure SESSION_SECRET is set and is at least 32 characters