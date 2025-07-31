# BFL Customer Service Helper

## Overview
The BFL Customer Service Helper is an internal platform designed for "Brands For Less" (BFL) customer service agents. Its primary purpose is to streamline support operations by centralizing customer information, facilitating internal team communications, and providing efficient tools like email templates and order format conversion. The system aims to enhance agent productivity and improve overall customer service delivery.

## User Preferences
Preferred communication style: Simple, everyday language.
Admin should have overpowered capabilities and enhanced control over all templates and system features.
Fix all bugs and ensure dropdown components work correctly.
Extensive template genres including greeting, CSAT, warning abusive language, apology, thank you, farewell, confirmation, technical support, and holiday/special occasion.
Development mode: Authentication streamlined with auto-admin access for development purposes.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Components**: shadcn/ui and Radix UI.
- **Styling**: Tailwind CSS with custom BFL brand colors.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state, local storage for customer data persistence.
- **Real-time Communication**: WebSocket for user presence and live updates.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Database Provider**: Neon serverless PostgreSQL.
- **Authentication**: Replit's OpenID Connect integration with session management.
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple.

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect.
- **Session Management**: Express sessions stored in PostgreSQL.
- **Role-based Access**: Two roles (admin, agent).
- **User Status**: Active/blocked/banned management.
- **Online Presence**: Real-time user status tracking via WebSocket.

### Database Schema
Key tables include Users, Live Reply Templates, Email Templates, Usage tracking for both template types, Site Content, and Sessions. All tables are designed with `supabase_id` and `last_synced_at` fields for potential Supabase integration.

### Core Features
- **Customer Information Panel**: Persistent customer data entry.
- **Email Template System**: Pre-built templates with variable replacement, team routing, and escalation workflows.
- **Live Reply Templates**: Quick responses for chat interactions with variable substitution, horizontal grouped layout, and organized categories.
- **Order Conversion Tool**: Automatic conversion between Order ID and AWB.
- **Admin Panel**: Comprehensive user management, template administration, analytics dashboard, email template wizard, and site content control.
- **Real-time Presence**: WebSocket-powered online status tracking.
- **Personal Notes System**: User-specific notes with CRUD operations and Supabase storage.
- **Dynamic Content**: Site name, about content, version label, and footer are customizable via Site Content Management.
- **Theming**: Dark/Light mode toggle with persistence and real-time color sync.
- **Universal Variable System**: Centralized management of variables through the admin panel.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe database ORM.
- **@radix-ui/***: Headless UI component primitives.
- **@tanstack/react-query**: Server state management.
- **express**: Web server framework.
- **passport**: Authentication middleware.
- **Supabase**: Used for database, authentication, and real-time features when configured.
- **Vercel**: Deployment platform for frontend and serverless functions.
- **Railway**: Deployment platform, with specific configurations for Docker and environment variables.
- **Caddy**: Used for static file serving in certain Railway deployment configurations.
- **'serve' package**: Utilized for production static file serving in specific deployment scenarios.
```