# Customer Service Helper Platform

A comprehensive customer service management platform built with React, TypeScript, and Supabase. This system helps teams manage customer communications through templates, personal notes, and real-time collaboration.

## 🚀 Complete Setup Guide for Next Developer

### Prerequisites
- Node.js 18+
- Supabase account with project created
- Access to Supabase SQL Editor

### 1. Critical Environment Variables

**YOU MUST HAVE THESE 3 ENVIRONMENT VARIABLES:**

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get these values:**
1. Go to [supabase.com](https://supabase.com) and create/access your project
2. Navigate to Settings → API in your Supabase dashboard
3. Copy the Project URL as `SUPABASE_URL`
4. Copy the `anon public` key as `SUPABASE_ANON_KEY`
5. Copy the `service_role` key as `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Setup

**CRITICAL - Run these SQL scripts in your Supabase SQL Editor:**

1. **First, run the main setup script:**
   ```sql
   -- Copy and paste the ENTIRE contents of: SETUP_SUPABASE_ADMIN.sql
   -- This creates all necessary tables and policies
   ```

2. **Verify tables were created:**
   Check your Supabase dashboard for these tables:
   - users
   - live_reply_templates
   - email_templates
   - personal_notes
   - sessions

### 3. Installation

```bash
npm install
npm run dev
```

### 4. Create Your Admin User

**Method 1: Automatic Script**
```bash
# Edit create-mahmoud-admin.js and change the email to yours
# Then run:
node create-mahmoud-admin.js
```

**Method 2: Manual SQL**
1. First sign up through the app with your email
2. Then run in Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 🔐 Authentication System

### How It Works
- **Platform Access**: Any authenticated Supabase user can access the platform
- **Role-Based Features**: Only admin users can access the Admin Panel
- **Auto User Creation**: New signups automatically get 'agent' role
- **Timeout Protection**: Authentication stops loading after 10 seconds

### User Roles
- **agent**: Default role, full platform access except admin panel
- **admin**: Full access including user management and admin panel

## 🚨 Troubleshooting Authentication Issues

### Issue: "Authenticating..." Never Ends
1. Check browser console for specific errors
2. Verify all 3 environment variables are correct
3. Ensure Supabase project is active (not paused)
4. Run admin user creation script
5. Clear browser cache and localStorage

### Issue: User Not Found After Login
```sql
-- Check if user exists in database:
SELECT * FROM users WHERE email = 'your-email@example.com';

-- If no results, the user wasn't created properly
-- Sign up again or run the admin creation script
```

### Issue: Admin Panel Shows "Access Restricted"
```sql
-- Verify admin role:
SELECT email, role FROM users WHERE email = 'your-email@example.com';

-- Should return role = 'admin'
-- If not, update the role:
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components with Tailwind CSS
- **State**: TanStack Query for server state
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth with automatic fallbacks
- **Routing**: Wouter for client-side routing

### Key Features
1. **Dual Template System**:
   - Live reply templates for customer chat
   - Email templates for internal team communication
2. **Personal Notes**: User-specific with full CRUD
3. **Admin Panel**: Complete user and template management
4. **Real-time Updates**: Live user presence
5. **Bilingual Support**: English/Arabic templates

## 📁 Project Structure

```
├── client/src/
│   ├── components/       # UI components
│   │   ├── AdminPanel.tsx       # Admin-only access
│   │   ├── PersonalNotes.tsx    # User-specific notes
│   │   └── ui/                  # shadcn components
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication logic
│   │   └── useTemplates.ts      # Template management
│   ├── pages/
│   │   ├── login.tsx            # Authentication page
│   │   └── home.tsx             # Main dashboard
│   └── lib/
│       ├── supabase.ts          # Supabase client
│       └── utils.ts             # Utilities
├── server/                      # Express API routes
├── shared/schema.ts             # Database schema
└── Database Scripts/            # SQL setup files
```

## 🗄️ Database Schema

### Core Tables
- **users**: Profiles, roles, status, presence
- **live_reply_templates**: Customer chat responses
- **email_templates**: Internal team communications
- **personal_notes**: User-specific notes with RLS
- **sessions**: Authentication sessions

### Important Notes
- Row Level Security (RLS) enabled on personal_notes
- Users auto-created on first Supabase Auth signup
- Admin role must be manually assigned

## 🔧 Development Features

### Authentication Flow
1. User signs in via Supabase Auth
2. System checks for user in database
3. If not found, automatically creates user with 'agent' role
4. API routes have fallback to direct Supabase queries
5. Timeout prevents infinite loading states

### Admin Panel Access Control
```typescript
// Only admin users can access AdminPanel component
if (!currentUser || currentUser.role !== 'admin') {
  return <AccessRestrictedMessage />;
}
```

### Personal Notes Security
- Uses Supabase RLS policies
- Users can only see their own notes
- Full CRUD operations with real-time updates

## 🚀 Deployment

### Environment Variables for Production
```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

### Build Commands
```bash
npm run build    # Build for production
npm start        # Run production server
```

## 📝 Critical Information for Next Developer

### Known Issues & Solutions
1. **API Route Interception**: Vite intercepts `/api/*` routes in development
   - **Solution**: System automatically falls back to direct Supabase queries
   
2. **Authentication Timeout**: Prevents infinite "Authenticating..." state
   - **Implementation**: 10-second timeout with console logging
   
3. **Role-Based Access**: AdminPanel component checks user role
   - **Critical**: Only `role = 'admin'` users can access admin features

### Recent Critical Fixes (January 23, 2025)
✓ Fixed infinite authentication loading with timeout system
✓ Removed admin-only platform restriction - all authenticated users can access
✓ Added admin role check specifically for AdminPanel component
✓ Implemented automatic user creation for new Supabase signups
✓ Added fallback direct Supabase queries when API routes fail
✓ Updated authentication flow to handle API route interception

### Testing Checklist
- [ ] Environment variables configured
- [ ] Database tables created via SQL scripts
- [ ] Admin user created and role verified
- [ ] Login successful (no infinite loading)
- [ ] Admin panel accessible for admin users
- [ ] Personal notes working for all users
- [ ] Template system functional

### Quick Debugging Commands
```sql
-- Check user exists and role
SELECT id, email, role, status FROM users WHERE email = 'test@example.com';

-- Make user admin
UPDATE users SET role = 'admin' WHERE email = 'test@example.com';

-- Check personal notes exist
SELECT * FROM personal_notes WHERE user_id = 'user-id-here';
```

## 📞 Support

If authentication still doesn't work:
1. Check browser console for specific error messages
2. Verify Supabase project is active and properly configured
3. Test with a fresh browser session
4. Ensure all SQL scripts were run successfully

---

**Made by Mahmoud Zalat** - Customer Service Platform Specialist