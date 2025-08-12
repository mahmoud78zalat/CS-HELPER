# BFL Customer Service Helper

## Overview
The BFL Customer Service Helper is a comprehensive, enterprise-grade customer service management platform for "Brands For Less" (BFL). It enhances support operations through intelligent automation, advanced multilingual template management, real-time collaboration, team communication tools, and seamless workflow coordination. The platform aims to provide a unified workspace for exceptional customer service delivery and increased agent productivity.

## User Preferences
- **Communication Style**: Simple, everyday language for non-technical users
- **Admin Capabilities**: Enhanced overpowered control over all templates, system features, and global configurations
- **UI/UX Standards**: All dropdown components working correctly with comprehensive error handling
- **Template Diversity**: Extensive template genres including greeting, CSAT, warning/abusive language, apology, thank you, farewell, confirmation, technical support, holiday/special occasions, and team communication
- **Development Mode**: Streamlined authentication with auto-admin access for development purposes
- **Variable Format**: EXCLUSIVELY use {variable} format - completely removed [VARIABLE] format support
- **Project Optimization**: Enhanced gitignore configuration to prevent large download sizes
- **Agent Onboarding**: Complete first-join GUI with bilingual profile setup (English and Arabic names), automatic agent variables in templates, and seamless user data refresh
- **Modal Configuration**: Fully mandatory onboarding modal (no X button, no escape, no outside clicks), enhanced API integration with proper database updates, and immediate UI refresh after completion
- **PersonalNotes Layout**: Add/edit form positioned above search bar for improved UX
- **Team Communication**: Renamed from "Store Emails/Store Contacts" - includes optional phone numbers, amount field integration, and delivery/refund date tracking
- **Reordering Systems**: ALL drag & drop reordering functionality must work correctly with real database persistence - no fake "success" messages without actual saves

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite
- **UI Components**: shadcn/ui library with Radix UI primitives
- **Styling**: Tailwind CSS with custom BFL brand colors, dark/light mode, responsive design
- **Routing**: Wouter
- **State Management**: TanStack Query v5 for server state, React Context for global state
- **Real-time Features**: WebSocket integration for user presence, live updates
- **Design System**: Consolidated color management, theme persistence, custom scrollbars, animated transitions
- **Advanced UI**: Drag & drop with @dnd-kit, color pickers, toast notifications, modal management

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Supabase PostgreSQL with real-time capabilities
- **API Design**: RESTful endpoints with Zod validation
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Real-time Updates**: WebSocket server for presence tracking and live notifications
- **Authentication Middleware**: Custom JWT and session-based authentication

### Authentication & Authorization System
- **Provider**: Supabase Auth with session management
- **Session Management**: Express sessions stored in PostgreSQL
- **Role-based Access**: Two roles (admin, agent) with granular permissions
- **User Status Management**: Active/blocked/banned status with real-time updates
- **Online Presence**: 24/7 presence tracking with intelligent heartbeat logic
- **Agent Onboarding**: Mandatory first-time user setup with bilingual profile creation
- **Security**: Comprehensive authentication middleware, session validation, CSRF protection

### Deployment Configuration
- **Platform**: Railway
- **Build Process**: Vite builds frontend to `dist/public/`, esbuild compiles production server to `dist/index.production.js`, Railway starts with `node dist/index.production.js`

### Database Schema
- **Status**: Fully operational (PostgreSQL + Supabase Integration)
- **Configuration**: Neon serverless database, Supabase with user credentials
- **Synchronization**: Complete with all foreign key constraints
- **Data Type Consistency**: All `user_id` columns standardized to UUID format.
- **Key Tables**: Users (with online presence), Live Reply Templates, Email Templates, Usage tracking, Site Content, Sessions.

### Core Platform Features
- **Customer Management System**: Smart customer information panel, transaction tracking, order ID conversion.
- **Team Communication Suite**: Contact management with optional phone numbers, amount field, delivery/refund date tracking, one-click copy.
- **Live Reply Template Ecosystem**: Horizontal grouped layout, drag & drop organization, 14+ template categories, bilingual support, dynamic {variable} replacement, usage analytics.
- **Email Template System**: Internal team communication, bilingual templates, team routing, guided creation process.
- **Advanced Admin Panel**: User management (CRUD, roles, presence), template administration, analytics dashboard, FAQ management, site content management.
- **Real-time Collaboration Platform**: User presence system, live updates via WebSockets, toast notifications, persistent notifications.
- **Personal Notes Management**: Enhanced layout, real-time sync, search functionality, private workspace.
- **Advanced Design System**: Enterprise-grade drag & drop, centralized color management, hierarchical categorization, responsive UI.
- **Variable Management System**: Exclusively {variable} format, 40+ predefined dynamic variables, intelligent deduplication, categorized organization.
- **Security & Access Control**: Role-based permissions, authentication middleware, modal separation for user/admin functionalities, API endpoint protection.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe database ORM.
- **@radix-ui/***: Headless UI component primitives.
- **@tanstack/react-query**: Server state management.
- **express**: Web server framework.
- **passport**: Authentication middleware.
- **Supabase**: Database, authentication, and real-time features.
- **Railway**: Deployment platform.