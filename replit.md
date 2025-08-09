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
- Removed User ID format conversion logic (only Order ID → User ID conversion remains)
- Order converter now returns pure numbers (no A/U prefix): A121212121221 → 1212121
- Updated delivery date format to display "25th of August 2025" instead of "August 25, 2025"  
- Added is_first_time_user check in authentication to trigger agent setup modal for new users
- Fixed personal notes deletion JSON parsing error by properly handling 204 no-content response
- Removed debugging console logs for cleaner production code
- **CRITICAL FIX**: Resolved Railway IPv6/IPv4 connectivity issues affecting data fetching
- Implemented automatic DATABASE_URL conversion to use Supabase pooler for IPv4 compatibility
- Added Railway-specific connection string fixes and environment variable handling
- Enhanced client-side IPv4 preference headers for better Railway compatibility
- Created comprehensive connectivity testing during deployment startup
- **UI FIX**: Fixed warning note display in email composer - now shows red-styled warnings next to "TO" field
- Added warning note indicators in email template selection list for better visibility
- **MAJOR ENHANCEMENT**: Fully decoupled local user reordering from admin template management system
- Implemented complete role-based template ordering system where admin actions modify global database order while non-admin users have independent personal view customization
- Enhanced "Reset Reordering" functionality to clear both individual template positions AND group folder positions
- Updated drag-and-drop behavior to distinguish between admin users (database modifications) and regular users (local ordering only)
- Resolved recurring blank page issues caused by React useEffect dependency loops in template ordering logic
- Updated reference number placeholder from "REF-12345" to "71547****" in Additional Info panel
- **CRITICAL ORDERING FIX**: Homepage drag-and-drop now works as local personalization for ALL users (including admins)
- Admin Panel remains the ONLY authoritative place to modify global template and group ordering
- Reset button now appears for all users during drag-drop mode and when custom ordering is active
- Completely eliminated backend API calls from homepage reordering to ensure strict local-only behavior
- **MAJOR ADMIN/PERSONAL ORDERING SEPARATION (January 2025)**: Fixed crossover between personal and admin ordering systems
- Added explicit `isAdminMode` prop to `HorizontalGroupedTemplates` component to distinguish admin panel operations from homepage operations
- Resolved issue where admin panel modal was incorrectly triggering personal ordering logic instead of admin ordering logic
- Ensured admin operations always save to backend database while personal operations remain local-only
- Updated ordering logic to properly detect admin panel context regardless of URL path
- **MAJOR PRESENCE SYSTEM REDESIGN (January 2025)**: Implemented enterprise-grade 24/7 online/offline presence tracker with heartbeat logic
- Created Redis-like TTL-based in-memory presence storage system for scalable real-time tracking
- Built intelligent WebSocket presence manager with automatic reconnection and ping/pong health checks
- Developed sophisticated client-side heartbeat hook with activity detection, page visibility tracking, and network retry logic
- Replaced basic presence monitoring with advanced system featuring 15-30 second heartbeat intervals and 90-second TTL expiration
- Added comprehensive presence API endpoints for heartbeat processing, status queries, and admin statistics
- Integrated graceful page unload handling and battery-efficient tracking when tabs are hidden

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
- **Online Presence**: Enhanced 24/7 presence tracking system with Redis-like TTL storage, intelligent heartbeat logic, and WebSocket real-time updates.

### Enhanced Presence System Architecture (2025)
- **Presence Store**: Redis-like TTL-based in-memory storage with 90-second expiration
- **Heartbeat Logic**: Client-side intelligent activity detection with 15-30 second intervals
- **WebSocket Manager**: Real-time presence updates with automatic reconnection and health checks
- **API Endpoints**: Comprehensive REST API for heartbeat processing, status queries, and admin statistics
- **Database Integration**: Persists online status to PostgreSQL while using in-memory store for real-time performance
- **Graceful Degradation**: Handles page unload, network failures, and battery optimization for hidden tabs

### Database Schema
Key tables include Users (with online presence fields), Live Reply Templates, Email Templates, Usage tracking, Site Content, and Sessions. All tables are designed with `supabase_id` and `last_synced_at` for potential Supabase integration.

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