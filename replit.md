# BFL Customer Service Helper

## Overview
The BFL Customer Service Helper is a comprehensive, enterprise-grade customer service management platform designed for "Brands For Less" (BFL). It delivers cutting-edge support operations through intelligent automation, advanced multilingual template management, real-time collaboration, team communication tools, and seamless workflow coordination. The platform combines modern technology with intuitive design to create a unified workspace for exceptional customer service delivery and enhanced agent productivity.

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

## System Architecture

### Frontend Architecture (React 18 + TypeScript)
- **Framework**: React 18 with TypeScript, Vite for lightning-fast development and optimized builds
- **UI Components**: Complete shadcn/ui library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom BFL brand colors, dark/light mode, responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query v5 for intelligent server state, React Context for global state
- **Real-time Features**: WebSocket integration for user presence, live updates, and collaboration
- **Design System**: Consolidated color management, theme persistence, custom scrollbars, animated transitions
- **Advanced UI**: Drag & drop with @dnd-kit, color pickers, toast notifications, modal management

### Backend Architecture (Node.js + Express)
- **Runtime**: Node.js with Express.js for robust API layer
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Database Provider**: Supabase PostgreSQL with real-time capabilities
- **API Design**: RESTful endpoints with comprehensive validation using Zod schemas
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Real-time Updates**: WebSocket server for presence tracking and live notifications
- **Authentication Middleware**: Custom JWT and session-based authentication

### Authentication & Authorization System
- **Provider**: Supabase Auth with session management and security
- **Session Management**: Express sessions stored in PostgreSQL with automatic cleanup
- **Role-based Access**: Two roles (admin, agent) with granular permissions
- **User Status Management**: Active/blocked/banned status with real-time updates
- **Online Presence**: Advanced 24/7 presence tracking with intelligent heartbeat logic (15-30 second heartbeats, 90-second TTL)
- **Agent Onboarding**: Mandatory first-time user setup with bilingual profile creation
- **Security**: Comprehensive authentication middleware, session validation, CSRF protection

### Database Schema  
**Database Status**: ✅ FULLY OPERATIONAL (PostgreSQL + Supabase Integration)

**Connection Configuration**: 
- PostgreSQL: Neon serverless database with proper environment variables
- Supabase: Configured with user credentials and working authentication
- Schema Synchronization: Complete with all foreign key constraints resolved

**Data Type Consistency**: All user_id columns standardized to UUID format across all tables:
- ✅ announcement_acknowledgments, email_template_usage, faq_acknowledgments  
- ✅ live_reply_usage, personal_notes, user_announcement_acks
- ✅ user_faq_acks, user_notification_preferences, user_ordering_preferences

Key tables include Users (with online presence fields), Live Reply Templates, Email Templates, Usage tracking, Site Content, and Sessions. Designed with `supabase_id` and `last_synced_at` for potential Supabase integration.

### Core Platform Features

#### 🎯 **Customer Management System**
- **Smart Customer Information Panel**: Persistent data storage with auto-save, real-time synchronization, and session persistence
- **Additional Info Panel**: Transaction amount tracking, delivery/refund date management, and custom field support
- **Order Management Tools**: Advanced Order ID ↔ AWB conversion with validation and tracking
- **Customer Data Context**: Centralized customer data with automatic variable population and real-time updates

#### 📧 **Team Communication Suite** (formerly Store Emails/Contacts)
- **Contact Management**: Store contact creation with optional phone numbers (email-only support)
- **Amount Integration**: Transaction amount field connected with {amount} variable for template use
- **Date Tracking**: Delivery/Refund date field for order status management
- **Copy Functionality**: One-click email/phone copying to clipboard for quick access

#### 🗣️ **Live Reply Template Ecosystem**
- **Horizontal Grouped Layout**: Medium-width columns (240px) with drag & drop organization
- **Template Groups**: 14+ categories including WELCOME GREETINGS, FREQUENTLY ASKED, CHECKING, ITEM COMPLAINT, RETURN OPTIONS, DELAYED ORDERS, etc.
- **Bilingual Support**: Complete English and Arabic template content with intelligent language switching
- **Variable System**: Dynamic {variable} replacement with real-time preview and validation
- **Usage Analytics**: Comprehensive tracking with performance insights and optimization recommendations

#### 📨 **Email Template System**
- **Professional Communication**: Internal team communication tools with advanced formatting
- **Bilingual Templates**: English and Arabic content support with language-specific formatting
- **Team Routing**: Escalation workflows and department-specific templates
- **Template Wizard**: Guided creation process with validation and best practices

#### 👑 **Advanced Admin Panel** (5 Management Tabs)
1. **User Management**: Complete CRUD operations, role-based access control, online presence tracking, status management (Active/Blocked/Banned)
2. **Template Administration**: Advanced template creation, editing, organization, and analytics
3. **Analytics Dashboard**: Real-time insights, usage patterns, performance metrics, and optimization suggestions
4. **FAQ Management**: Dynamic help content with persistent notifications and view tracking
5. **Site Content**: White-label branding, customization, about modal content, and theme management

#### ⚡ **Real-time Collaboration Platform**
- **User Presence System**: 24/7 online status tracking with intelligent heartbeat logic (15-30 second intervals)
- **Live Updates**: WebSocket-powered real-time synchronization across all components
- **Toast Notifications**: Comprehensive feedback system for all user actions and system events
- **Persistent Notifications**: Supabase-based notification tracking replacing localStorage

#### 📝 **Personal Notes Management**
- **Enhanced Layout**: Add/edit form positioned above search bar for improved UX
- **Real-time Sync**: Automatic saving and synchronization across sessions
- **Search Functionality**: Intelligent search with filtering and sorting capabilities
- **Private Workspace**: User-specific notes with privacy controls

#### 🎨 **Advanced Design System**
- **Professional Drag & Drop**: Enterprise-grade interface with @dnd-kit, collision detection, and visual feedback
- **Color Management**: Centralized theme control with custom BFL brand colors and dark/light mode
- **Template Organization**: Hierarchical categorization with visual color coding and sorting
- **Responsive UI**: Custom scrollbars, animated transitions, and mobile-optimized layouts

#### 🔧 **Variable Management System**
- **Universal Format**: Exclusively {variable} format with complete removal of [VARIABLE] support
- **Dynamic Variables**: 40+ predefined variables including customer info, order details, agent data, and system variables
- **Intelligent Deduplication**: Automatic duplicate prevention and variable validation
- **Category Organization**: Variables grouped by Customer, Order, System, and Time categories

#### 🛡️ **Security & Access Control**
- **Role-based Permissions**: Granular admin/agent access control with feature-specific restrictions
- **Authentication Middleware**: Comprehensive session validation and CSRF protection  
- **Modal Separation**: Complete segregation of user and admin functionality:
  - **User Modals**: Personal ordering saved to localStorage only
  - **Admin Modals**: Global changes saved to database with proper authentication
- **API Endpoint Protection**: Authenticated routes with proper validation and error handling

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

## Project Statistics

**Development Scale**: Enterprise-Level Customer Service Platform
- **Total Lines**: 52,224 (including all project files)
- **Code Lines**: 40,777 (TypeScript/JavaScript only)
- **File Count**: 1,066 files
- **Estimated Development Time**: 600+ hours
- **Architecture Complexity**: Advanced (Real-time collaboration, WebSocket integration, Enterprise drag & drop, Multilingual support)

**Component Breakdown**:
- **Frontend Components**: 35+ React components with TypeScript
- **Database Tables**: 20+ tables with complete relational schema
- **API Endpoints**: 50+ RESTful endpoints with authentication
- **Real-time Features**: WebSocket server, presence tracking, live updates
- **Template System**: 14+ grouped categories with bilingual support
- **Admin Features**: 5-tab management panel with advanced controls