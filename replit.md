# BFL Customer Service Helper

## Overview
The BFL Customer Service Helper is an enterprise-grade customer service management platform for "Brands For Less" (BFL). It enhances support operations through intelligent automation, advanced template management, real-time collaboration, and seamless team coordination, aiming to boost agent productivity and improve customer experiences.

## User Preferences
Preferred communication style: Simple, everyday language.
Admin should have overpowered capabilities and enhanced control over all templates and system features.
Fix all bugs and ensure dropdown components work correctly.
Extensive template genres including greeting, CSAT, warning abusive language, apology, thank you, farewell, confirmation, technical support, and holiday/special occasion.
Development mode: Authentication streamlined with auto-admin access for development purposes.
Variable Format: ONLY use {variable} format - completely remove [VARIABLE] format support.
Project Size Optimization: Enhanced gitignore configuration to prevent large download sizes.
Agent Setup: Complete first-join GUI with bilingual profile setup (English and Arabic names), automatic agent variables in templates, and seamless user data refresh.
Modal Configuration: Fully mandatory onboarding modal (no X button, no escape, no outside clicks), enhanced API integration with proper database updates, and immediate UI refresh after completion.
PersonalNotes Layout: Add/edit form moved above search bar for better UX.

## Recent Changes (January 2025)
- Enhanced template variable system with proper gender field replacement (Male → "Sir", Female → "Ma'am")
- Fixed online/offline user tracking to work equally for admin and agent roles  
- Improved order/userid converter validation logic with proper dash handling
- Updated validation text from "A or U and at least 13 characters" to "A and at least 13 characters"
- Ensured heartbeat initialization works properly for all user authentication flows
- Added phone number mapping in template variables (customer_phone → phone_number)
- Fixed personal notes editing functionality by correcting HTTP method from PUT to PATCH
- Enhanced delivery date formatting in templates (ISO date → readable format like "29th of August 2025")
- Fixed Order/User ID converter with correct dynamic logic (remove first character + last 5 characters)

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
Key tables include Users, Live Reply Templates, Email Templates, Usage tracking, Site Content, and Sessions. All tables are designed with `supabase_id` and `last_synced_at` for potential Supabase integration.

### Core Features
- **Smart Customer Information Panel**: Persistent data storage with auto-save and real-time synchronization.
- **Enterprise Email Template System**: Professional communication tools with advanced formatting, variable replacement, and analytics.
- **Live Reply Template Ecosystem**: Sophisticated quick-response system with drag & drop, categorization, and performance tracking.
- **Advanced Order Conversion Tool**: Seamless Order ID ↔ AWB conversion with validation and error handling.
- **Comprehensive Admin Panel**: Five management tabs for users, templates, analytics, FAQ, and site customization.
- **Real-time Collaboration Platform**: WebSocket-powered user presence tracking and live status updates.
- **Enhanced Personal Notes Management**: User-specific workspace with improved layout, quick-add, search, and Supabase storage.
- **Agent Profile Management System**: First-time user onboarding for English and Arabic name setup, with automatic agent variable population in templates.
- **White-Label Content Management**: Complete site customization including branding, about content, and footer.
- **Advanced Theme System**: Dark/Light mode with persistence and centralized color management.
- **Universal Variable Management**: Centralized control for template variables with intelligent suggestions and usage tracking, exclusively supporting `{variable}` format.
- **Professional Drag & Drop System**: Enterprise-grade interface with collision detection and visual feedback.
- **Hierarchical Template Organization**: Connected Configuration system with drag & drop for categories, genres, and groups.
- **Intelligent Variable Deduplication**: Prevents duplicate variables across templates with smart merging.
- **Persistent Notification Architecture**: Supabase-based tracking for FAQ views and announcements.
- **Centralized Design System**: Consolidated color management for consistent interface.
- **Enhanced User Experience**: Improved collision detection, always-enabled admin drag & drop, and comprehensive toast notifications.
- **Advanced Announcement System**: Unique filtering and user acknowledgment tracking.
- **Modern Documentation Tools**: Updated About modal with current platform features and descriptions.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe database ORM.
- **@radix-ui/***: Headless UI component primitives.
- **@tanstack/react-query**: Server state management.
- **express**: Web server framework.
- **passport**: Authentication middleware.
- **Supabase**: Used for database, authentication, and real-time features (if configured).
- **Vercel**: Deployment platform.
- **Railway**: Deployment platform.
- **Caddy**: Static file serving (in certain Railway configurations).
- **'serve' package**: Production static file serving (in specific deployment scenarios).