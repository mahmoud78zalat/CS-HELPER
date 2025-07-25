# Customer Service Platform

A professional, white-label customer service management platform designed for businesses requiring advanced communication tools, template management, and administrative controls.

## 🎯 Overview

This platform empowers customer service teams with intelligent communication tools, real-time collaboration capabilities, and comprehensive administrative controls. Built for businesses that need professional, scalable customer support infrastructure.

## ✨ Key Features

### 🔐 **User Management**
- Multi-tier authentication (Admin/Agent roles)
- Real-time user presence tracking
- User status management (Active/Blocked/Banned)
- Session-based authentication with PostgreSQL storage

### 💬 **Communication Tools**
- **Live Chat Templates**: Quick-reply templates for customer interactions
- **Email Templates**: Professional internal team communication
- **Bilingual Support**: English/Arabic language switching
- **Smart Variables**: Dynamic content replacement (customer names, order IDs, dates, etc.)

### 🛠️ **Admin Panel**
- Complete platform control with 5 management tabs
- Template creation and organization
- Real-time analytics dashboard
- White-label branding customization
- Color management for visual organization

### 📊 **Analytics & Insights**
- Live user activity monitoring
- Template usage tracking and performance metrics
- Comprehensive dashboard with visual data
- User engagement and productivity insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (for database)

### Setup Instructions

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Run the `SUPABASE_BOOTSTRAP.sql` script in your Supabase SQL editor
   - Get your project URL and API keys from Project Settings > API

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   SESSION_SECRET="your-secure-session-secret"
   ```

3. **Install and Run**
   ```bash
   npm install
   npm run dev
   ```

4. **Access Platform**
   - Open `http://localhost:5000`
   - Sign up/login through Supabase Auth
   - First user will need admin role assigned in database

## 🏗️ Technical Architecture

### Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via Supabase)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Supabase Authentication
- **Real-time**: WebSocket connections

### Project Structure
```
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # TypeScript schemas
├── api/              # Vercel serverless functions
└── SUPABASE_BOOTSTRAP.sql  # Database setup script
```

## 📋 Core Components

### Template System
- **Live Chat Templates**: For direct customer communication
- **Email Templates**: For internal team escalations
- **Variable System**: Dynamic content with 15+ variables
- **Categories & Genres**: Organized template library

### Admin Features
- User role and status management
- Template creation and analytics
- Site branding customization
- Color scheme management
- Real-time activity monitoring

### Agent Tools
- Quick-access template library
- Personal notes system
- Order tracking and conversion
- Real-time collaboration

## 🚀 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically with each push
4. Uses serverless functions in `/api` directory

### Replit
1. Import project to Replit
2. Configure environment variables
3. Use built-in hosting and database

### Custom Server
```bash
npm run build    # Build production assets
npm start        # Start production server
```

## 🔧 Environment Variables

Required for all deployments:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres"

# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Authentication
SESSION_SECRET="your-secure-session-secret"

# Optional
NODE_ENV="production"
BASE_URL="https://your-domain.com"
```

## 🎨 Customization

### White-Label Branding
- Site name and description
- Logo and color schemes
- Custom footer content
- About page content

### Template Categories
- Create custom categories
- Assign color schemes
- Set usage priorities
- Track performance metrics

### User Variables
- Customer information fields
- Order and tracking data
- Agent information
- System timestamps

## 🛡️ Security Features

- Row Level Security (RLS) policies
- Session-based authentication
- SQL injection protection
- XSS prevention
- CSRF protection
- Role-based access control

## 📊 Analytics

- Real-time user presence
- Template usage statistics
- Agent performance metrics
- Category effectiveness
- System activity logs

## 🧪 Development

### Commands
```bash
npm run dev      # Start development server
npm run build    # Build production assets
npm run check    # TypeScript checking
npm run db:push  # Update database schema
```

### Database Management
- Use Supabase dashboard for database management
- All schema changes via `SUPABASE_BOOTSTRAP.sql`
- Automatic migrations and seeding

## 📚 Database Schema

The platform includes 15+ tables:
- Users and authentication
- Live chat and email templates
- Categories, genres, and teams
- Usage tracking and analytics
- Personal notes and announcements
- Color settings and site content

## 🆘 Support

### Common Issues
1. **Database Connection**: Verify Supabase credentials
2. **Authentication**: Check Supabase Auth configuration
3. **Build Errors**: Ensure all environment variables are set
4. **Template Sync**: Verify database permissions

### Troubleshooting
- Check browser console for errors
- Verify environment variables
- Confirm database connectivity
- Review Supabase logs

## 🏆 Production Considerations

- Use environment-specific configs
- Enable database connection pooling
- Set up monitoring and logging
- Configure backup strategies
- Implement CDN for static assets

---

**Professional Customer Service Platform Architecture**  
*Made by Mahmoud Zalat*