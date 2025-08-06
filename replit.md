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
Agent Setup: First-join GUI for profile setup with English and Arabic names, automatic agent variables in templates.
PersonalNotes Layout: Add/edit form moved above search bar for better UX.

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
- **Enhanced Personal Notes Management**: User-specific workspace with improved layout design - quick add note section above search bar, simplified right panel for editing only, toast notifications for copy actions, and advanced search functionality with Supabase storage.
- **Agent Profile Management System**: First-time user onboarding with AgentSetupModal for English and Arabic name setup, automatic agent variable population (agentfirstname, agent_name, agentarabicfirstname, etc.) in templates, and real-time synchronization with user profiles.
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

### Comprehensive Real-Time Updates Implementation (August 2, 2025)
Successfully implemented complete real-time update functionality across the entire admin panel system without requiring page refresh or panel reopening.

**Enhancement Overview**: The system now provides true real-time synchronization using WebSocket-based communication through Supabase channels for all CRUD operations.

**Implementation Details**:
1. **Real-Time Service Enhancement**: Expanded `client/src/lib/realTimeService.ts` with broadcast functions for all entity types:
   - Templates (live reply templates)
   - Email templates 
   - Announcements
   - Users and role changes
   - Groups, categories, and genres
   - FAQs and variables

2. **Comprehensive Mutation Broadcasting**: Added real-time broadcast calls to all AdminPanel mutations:
   - Template creation, updating, and deletion
   - Email template creation, updating, and deletion
   - Announcement creation, deletion, and re-announcement
   - User role changes and deletion
   - Group creation and updating

3. **Real-Time Update Hook**: The existing `useRealTimeUpdates` hook automatically listens for all broadcast events and triggers cache invalidation for affected data.

**User Experience Impact**: 
- All admin panel changes now reflect immediately across all connected user sessions
- No manual refresh required for any admin operations
- Consistent data state maintained across multiple administrators
- Enhanced collaborative workflow for admin teams

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

### Enhanced Online/Offline Detection & Notes UI Improvements (August 6, 2025)
Completed comprehensive improvements to user presence tracking and Notes section user interface.

**Online/Offline Detection Enhancements**:
1. **Optimized Heartbeat System**: Implemented balanced intervals for accurate real-time status:
   - Client heartbeat: 8 seconds for responsive updates
   - Server monitoring: 30 seconds for efficient processing
   - Offline threshold: 90 seconds for reliable detection
2. **Enhanced Presence Tracking**: Improved page visibility change detection and connection reliability
3. **Robust Authentication**: Fixed server-side middleware and presence monitoring issues
4. **Activity Detection**: Better handling of page refresh and reconnection scenarios

**Notes UI Improvements**:
1. **Collapsible Content System**: Added smart expand/collapse functionality for both main PersonalNotes and Sidebar quick notes
2. **Always-Visible Copy Buttons**: Copy functionality accessible without scrolling or hovering
3. **Smart Content Preview**: Intelligent truncation showing first 120 characters with expand option
4. **Duplicate Notes Fix**: Removed redundant PersonalNotes embedding in Sidebar, keeping only quick preview with expand functionality
5. **Enhanced Sidebar Notes**: Individual expand/collapse controls for each note with proper state management
6. **Improved User Experience**: Better visual feedback, tooltips, and responsive design for both desktop and mobile

**Technical Implementation**:
- Enhanced `client/src/hooks/useAuth.ts` with optimized heartbeat timing
- Updated `server/presence-monitor.ts` with improved monitoring intervals
- Fixed authentication middleware in `server/routes.ts`
- Redesigned `client/src/components/PersonalNotes.tsx` with collapsible interface
- Enhanced `client/src/components/Sidebar.tsx` with individual note expand/collapse functionality
- Implemented proper state management for expanded notes using Set data structure

**User Experience Impact**:
- Real-time user status updates without delay
- Accurate last seen timestamps after page refresh
- Streamlined Notes interface with easy content access
- Eliminated interface duplication and confusion
- Enhanced productivity through improved quick access features

### Agent Profile Setup & PersonalNotes Layout Improvements (August 6, 2025)
Enhanced agent onboarding workflow and optimized PersonalNotes interface for better user experience.

**Agent Profile Management**:
1. **First-Time User Setup**: AgentSetupModal provides guided onboarding for new agents to set English and Arabic names (firstName, lastName, arabicFirstName, arabicLastName)
2. **Automatic Variable Population**: Agent variables (agentfirstname, agent_name, agentarabicfirstname, etc.) are automatically populated from user profiles in all templates
3. **Real-Time Synchronization**: Agent data updates instantly across all template systems when profile is modified
4. **Database Integration**: Complete user profile management with setup-profile API endpoint and proper validation

**PersonalNotes Interface Redesign**:
1. **Quick Add Above Search**: Moved note creation form above search bar for better workflow - users can quickly add notes without scrolling
2. **Simplified Right Panel**: Edit mode now only appears when actively editing a note, otherwise shows placeholder with clear instructions
3. **Enhanced Toast Notifications**: Copy actions now show confirmation with note title for better user feedback
4. **Streamlined Layout**: Two-column design with left panel for browsing/adding, right panel dedicated to editing

**Technical Implementation**:
- Enhanced `client/src/context/CustomerDataContext.tsx` with automatic agent variable population from useAuth
- Updated `client/src/components/PersonalNotes.tsx` with improved two-panel layout and quick-add form
- Added `setup_agent_variables.sql` script for database initialization with agent variable categories
- Backend `/api/users/setup-profile` endpoint handles complete name setup for English and Arabic

**Database Changes**:
- Agent Info variable category with comprehensive agent variables: agentfirstname, agent_name, agentarabicfirstname, agentfullname, etc.
- Automatic user profile completion tracking via isFirstTimeUser flag
- Performance indexes for user lookups and status management

**User Experience Benefits**:
- New agents guided through complete profile setup on first login
- Templates automatically personalized with agent names in both languages
- Faster note creation workflow with prominent add form
- Cleaner editing interface focused on single-note editing
- Consistent agent branding across all customer communications