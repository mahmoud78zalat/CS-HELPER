# BFL Customer Service Helper

## Overview
The BFL Customer Service Helper is an enterprise-grade customer service management platform for "Brands For Less" (BFL). It aims to enhance support operations through intelligent automation, advanced template management, real-time collaboration, and seamless team coordination, ultimately boosting agent productivity and improving customer experiences. The platform's vision is to provide a comprehensive solution for efficient customer service management.

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

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Components**: shadcn/ui and Radix UI.
- **Styling**: Tailwind CSS with custom BFL brand colors.
- **Routing**: Wouter.
- **State Management**: TanStack Query for server state, local storage for customer data persistence.
- **Real-time Communication**: WebSocket for user presence and live updates.
- **Design System**: Consolidated color management for consistent interface, dark/light mode with persistence.

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
- **Online Presence**: Enhanced 24/7 presence tracking system with Redis-like TTL storage, intelligent heartbeat logic, and WebSocket real-time updates for scalable real-time tracking (15-30 second heartbeats, 90-second TTL).

### Database Schema
Key tables include Users (with online presence fields), Live Reply Templates, Email Templates, Usage tracking, Site Content, and Sessions. Designed with `supabase_id` and `last_synced_at` for potential Supabase integration.

### Core Features
- **Smart Customer Information Panel**: Persistent data storage with auto-save and real-time synchronization.
- **Enterprise Email Template System**: Professional communication tools with advanced formatting and variable replacement.
- **Live Reply Template Ecosystem**: Sophisticated quick-response system with drag & drop, categorization, and performance tracking. Supports hierarchical template organization.
- **Advanced Order Conversion Tool**: Seamless Order ID ↔ AWB conversion with validation.
- **Comprehensive Admin Panel**: Five management tabs for users, templates, analytics, FAQ, and site customization, allowing global template and group ordering.
- **Real-time Collaboration Platform**: WebSocket-powered user presence tracking and live status updates.
- **Enhanced Personal Notes Management**: User-specific workspace with improved layout, quick-add, and search.
- **Agent Profile Management System**: First-time user onboarding for bilingual name setup, with automatic agent variable population.
- **White-Label Content Management**: Complete site customization including branding, about content, and footer.
- **Universal Variable Management**: Centralized control for template variables, exclusively supporting `{variable}` format with intelligent deduplication.
- **Professional Drag & Drop System**: Enterprise-grade interface with collision detection and visual feedback. Allows local reordering for regular users (via localStorage) and global reordering for admins.
- **Persistent Notification Architecture**: Tracking for FAQ views and announcements with unique filtering.
- **Improved UX**: Enhanced collision detection, always-enabled admin drag & drop, and comprehensive toast notifications.
- **Widget Interaction**: Full functionality of draggable support widgets (e.g., Ziwo, Chatbase) above modal overlays.
- **Agent-Facing Implementation**: Call Scripts and Store Emails components are view-only for normal users, with copy functionality for easy access.

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