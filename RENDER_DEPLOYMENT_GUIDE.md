# Render.com Deployment Guide

This guide will help you deploy your Customer Service Platform to Render.com with zero configuration.

## Prerequisites

1. A GitHub account with your project repository
2. A Render.com account (free tier available)
3. Supabase account for database (optional - can use Render PostgreSQL)

## Deployment Steps

### Option 1: Using Supabase Database (Recommended)

1. **Set up Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Navigate to Settings > API to get your credentials
   - Copy the Project URL and anon public key

2. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Render will automatically detect the `render.yaml` configuration
   - Set the following environment variables in Render dashboard:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     SESSION_SECRET=your_random_session_secret
     ```

3. **Initialize Database**
   - Run the SQL from `SUPABASE_BOOTSTRAP.sql` in your Supabase SQL editor
   - This creates all necessary tables and security policies

### Option 2: Using Render PostgreSQL

1. **Deploy with Database**
   - The `render.yaml` includes a PostgreSQL database
   - Render will automatically create and connect the database
   - Set these environment variables:
     ```
     SESSION_SECRET=your_random_session_secret
     ```

2. **Initialize Database Schema**
   - After deployment, run database migrations:
     ```bash
     npm run db:push
     ```

## Environment Variables Explained

### Required for Supabase Integration:
- `VITE_SUPABASE_URL` - Your Supabase project URL (for frontend)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (for frontend)
- `SUPABASE_URL` - Your Supabase project URL (for backend)
- `SUPABASE_ANON_KEY` - Your Supabase anon key (for backend)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

### Required for Sessions:
- `SESSION_SECRET` - Random string for session encryption (generate a secure 32+ character string)

### Auto-managed by Render:
- `PORT` - Automatically set by Render
- `NODE_ENV` - Set to "production"
- `DATABASE_URL` - Automatically set if using Render PostgreSQL

## Post-Deployment Setup

1. **Access Your Application**
   - Your app will be available at `https://your-app-name.onrender.com`
   - The admin panel is at `/admin`

2. **Create Admin User**
   - First user to register will automatically become admin
   - Or manually set user role in your database

3. **Configure Application**
   - Set up your company branding in the admin panel
   - Create email and live reply templates
   - Configure user roles and permissions

## Troubleshooting

### Build Issues
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Issues
- Verify environment variables are set correctly
- Check Supabase project URL and keys
- Ensure database tables are created

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check that CORS is configured in Supabase for your domain
- Ensure RLS policies are set up correctly

## Performance Optimization

- Render automatically handles SSL certificates
- Enable compression in your Render settings
- Consider upgrading to a paid plan for better performance
- Use Render's CDN for static asset delivery

## Monitoring and Logs

- Access application logs in Render dashboard
- Set up health check monitoring
- Configure alerting for downtime

## Support

For deployment issues:
1. Check Render documentation
2. Review application logs
3. Verify environment variables
4. Test database connectivity

Your Customer Service Platform is now ready for production use on Render.com!