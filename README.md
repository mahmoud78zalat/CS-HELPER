# BFL Customer Service Helper

A comprehensive customer service communication platform with email template management, personal notes, and real-time collaboration features.

## 🚀 Features

- **Dual Template System**: Live reply templates for chat + Email templates for internal team communication
- **Personal Notes**: User-specific note-taking with CRUD operations
- **Role-Based Access**: Admin and Agent roles with different permissions
- **Real-time Updates**: WebSocket-powered live updates
- **Bilingual Support**: English and Arabic template content
- **Supabase Integration**: Authentication and data persistence

## 📋 Prerequisites

Before starting, ensure you have:
- A Supabase project set up
- Environment variables configured
- Database tables created

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Setup

**IMPORTANT**: Run the SQL scripts in your Supabase SQL Editor in this order:

1. **First, run the main database schema**:
   ```sql
   -- Copy and paste the contents of URGENT-RUN-IN-SUPABASE.sql
   ```

2. **Then, create the personal notes table**:
   ```sql
   -- Copy and paste the contents of SETUP_SUPABASE_ADMIN.sql
   ```

### 3. Make Yourself Admin

In your Supabase SQL Editor, run:
```sql
-- Replace with your actual email
UPDATE users 
SET role = 'admin', status = 'active' 
WHERE email = 'your-email@example.com';

-- Verify admin status
SELECT id, email, role, status FROM users WHERE email = 'your-email@example.com';
```

### 4. Authentication Setup

The system uses Supabase Auth with automatic user creation:
- Users sign up through Supabase Auth
- First-time users are automatically added to the system as 'agent' role
- Admins can upgrade user roles through the admin panel

## 🏃‍♂️ Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the provided URL

## 🔑 User Management

### Creating Admin Users
1. User signs up through the normal flow
2. In Supabase SQL Editor, update their role:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
   ```

### User Roles
- **Admin**: Full access to admin panel, user management, template management
- **Agent**: Access to templates, personal notes, customer info panels

## 📊 Database Schema

The system uses these main tables:
- `users` - User accounts with roles and status
- `live_reply_templates` - Quick chat responses
- `email_templates` - Internal team communication templates
- `personal_notes` - User-specific notes
- `site_content` - Dynamic site configuration
- `*_usage` tables - Analytics and usage tracking

## 🐛 Troubleshooting

### Login Issues
- Ensure user exists in Supabase Auth
- Check user role is 'admin' or 'agent' in database
- Verify environment variables are set correctly

### Database Errors
- Run all SQL scripts in correct order
- Check Supabase connection settings
- Verify table permissions and RLS policies

### Template Issues
- Check user permissions (admin can manage all templates)
- Verify Supabase sync is working
- Check template validation rules

## 🔄 Recent Updates (January 2025)

- ✅ Fixed login authentication and user creation flow
- ✅ Added Personal Notes feature with full CRUD operations
- ✅ Removed admin-only restrictions from login page
- ✅ Implemented automatic user registration for new signups
- ✅ Updated database schema with personal notes table
- ✅ Enhanced error handling and user feedback

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query

## 📝 Development Notes

- All data syncs to Supabase in real-time
- No local storage fallbacks - Supabase is single source of truth
- WebSocket connections for real-time features
- Role-based access control throughout the application
- Comprehensive error handling and logging

## 🤝 Contributing

When working on this project:
1. Follow the existing code structure
2. Update database schema through SQL scripts
3. Test all authentication flows
4. Ensure proper error handling
5. Update this README with any changes

---

**Made by Mahmoud Zalat** ✨