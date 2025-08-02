# BFL Customer Service Helper

## Overview
The BFL Customer Service Helper is a comprehensive, enterprise-grade customer service management platform designed for "Brands For Less" (BFL) customer service operations. This sophisticated system revolutionizes support operations through intelligent automation, advanced template management, real-time collaboration, and seamless team coordination. The platform combines cutting-edge technology with intuitive design to create a unified workspace that significantly enhances agent productivity and delivers exceptional customer experiences.

## User Preferences
Preferred communication style: Simple, everyday language.
Admin should have overpowered capabilities and enhanced control over all templates and system features.
Fix all bugs and ensure dropdown components work correctly.
Extensive template genres including greeting, CSAT, warning abusive language, apology, thank you, farewell, confirmation, technical support, and holiday/special occasion.
Development mode: Authentication streamlined with auto-admin access for development purposes.
Variable Format: ONLY use {variable} format - completely remove [VARIABLE] format support.
Project Size Optimization: Enhanced gitignore configuration to prevent large download sizes.

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
- **Smart Customer Information Panel**: Advanced persistent data storage with auto-save functionality, session management, and real-time synchronization across all user interactions.
- **Enterprise Email Template System**: Professional communication tools with advanced formatting, variable replacement, team routing, escalation workflows, and comprehensive usage analytics.
- **Live Reply Template Ecosystem**: Sophisticated quick-response system with drag & drop organization, horizontal grouped layout, intelligent categorization, and real-time performance tracking.
- **Advanced Order Conversion Tool**: Seamless Order ID ↔ AWB conversion with intelligent validation, error handling, and integration with customer management system.
- **Comprehensive Admin Panel**: Five management tabs providing complete control over users, templates, analytics, FAQ system, and site customization with real-time insights.
- **Real-time Collaboration Platform**: WebSocket-powered user presence tracking, live status updates, and seamless team coordination capabilities.
- **Personal Notes Management**: User-specific workspace with full CRUD operations, Supabase storage, and advanced search functionality.
- **White-Label Content Management**: Complete site customization including branding, about content, version labels, and footer with dynamic content loading.
- **Advanced Theme System**: Dark/Light mode with persistence, real-time color synchronization, and centralized color management across all components.
- **Universal Variable Management**: Centralized control system for all template variables with intelligent suggestions, duplicate prevention, and usage tracking.
- **Exclusive {variable} Format**: Modern variable system using only {variable} format with complete removal of legacy [VARIABLE] format support across the platform.
- **Professional Drag & Drop System**: Enterprise-grade interface with collision detection using closestCorners algorithm, enhanced visual feedback, and smooth animations.
- **Hierarchical Template Organization**: Connected Configuration system with drag & drop support for categories, genres, and groups with visual organization and search functionality.
- **Intelligent Variable Deduplication**: Advanced system preventing duplicate variables across template subjects and content with smart merging and display optimization.
- **Persistent Notification Architecture**: Supabase-based tracking system for FAQ views, announcements, and user interactions replacing localStorage for enterprise reliability.
- **Centralized Design System**: Consolidated color management with dedicated Colors panel, removing scattered color controls for consistent interface and simplified management.
- **Enhanced User Experience**: Improved collision detection, always-enabled admin drag & drop, toggleable user controls, and comprehensive toast notifications with detailed action feedback.
- **Advanced Announcement System**: Unique filtering in Supabase storage layer preventing duplicates with comprehensive notification management and user acknowledgment tracking.
- **Modern Documentation Tools**: Updated About modal with current platform features, drag & drop capabilities, persistent notifications, and comprehensive feature descriptions.

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

## Recent Changes

### Bug Fix: Email Template Deletion Error (August 2, 2025)
Fixed the "unable to remove email template please try again" error that occurred when deleting email templates. The issue was caused by:

**Root Cause**: Silent failures in Supabase deletion operations. When the Supabase `deleteTemplate` method failed, it returned `false` instead of throwing an error, causing:
- Local database deletion to proceed successfully
- Supabase records to remain intact
- Database inconsistency between local and remote data
- Generic error messages displayed to users

**Solution Implemented**:
1. **Enhanced Error Handling in Supabase Layer**: Modified `server/supabase.ts` to throw detailed errors when deletion fails instead of silently returning false
2. **Fail-Fast Deletion Strategy**: Updated `server/storage.ts` to delete from Supabase first, ensuring consistency
3. **Comprehensive Logging**: Added detailed logging throughout the deletion process for better debugging
4. **Schema Cleanup**: Removed references to non-existent fields (`createdBy`, `updatedBy`) that were causing LSP errors

The deletion process now follows a fail-fast approach: if Supabase deletion fails, the entire operation fails, maintaining data consistency between local and remote databases.
```