# BFL Customer Service Helper - System Architecture

## Overview

This is a comprehensive customer service management tool for "Brands For Less" (BFL) built as an internal platform for customer service agents. The system helps agents manage customer information, create internal team communications, and streamline support operations through email templates and centralized data management.

## User Preferences

Preferred communication style: Simple, everyday language.
Admin should have overpowered capabilities and enhanced control over all templates and system features.
Fix all bugs and ensure dropdown components work correctly.
Extensive template genres including greeting, CSAT, warning abusive language, apology, thank you, farewell, confirmation, technical support, and holiday/special occasion.
Development mode: Authentication streamlined with auto-admin access for development purposes.

**Template System Requirements (January 2025)**:
- Live reply templates for direct customer chat interactions
- Email templates for internal team escalations and communication
- Supabase integration ready - all admin panel changes should sync when configured
- Clear separation between customer-facing and internal communication templates

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom BFL brand colors
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state, local storage for customer data persistence
- **Real-time Communication**: WebSocket connection for user presence and live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit's OpenID Connect integration with session management
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL
- **Role-based Access**: Two roles (admin, agent) with different permissions
- **User Status**: Active/blocked/banned status management
- **Online Presence**: Real-time user status tracking via WebSocket

## Key Components

### Database Schema
1. **Users Table**: Stores user profiles with roles, status, and presence data
2. **Live Reply Templates Table**: Quick responses for customer live chat interactions
3. **Email Templates Table**: Internal team communication for escalations and requests  
4. **Live Reply Usage Table**: Tracks live chat template usage statistics
5. **Email Template Usage Table**: Tracks internal email template usage statistics
6. **Site Content Table**: Dynamic content management for customizable elements
7. **Sessions Table**: Secure session storage for authentication

**Supabase Integration**: All tables include `supabase_id` and `last_synced_at` fields for automatic synchronization when Supabase is configured.

### Enhanced Admin Panel Features (Latest Update)
1. **User Management**: Complete control over user roles and status
2. **Template Management**: Create, edit, delete, and analyze template usage
3. **Analytics Dashboard**: Real-time insights on user activity and template performance
4. **Email Template Wizard**: Pre-built template starters with smart variables
5. **Site Content Control**: Dynamic content management for all site elements

### Core Features
1. **Customer Information Panel**: Persistent customer data entry with local storage
2. **Email Template System**: Pre-built templates with variable replacement
3. **Order Conversion Tool**: Automatic conversion between order formats (Order ID ↔ AWB)
4. **Admin Panel**: User management and template administration
5. **Real-time Presence**: WebSocket-powered online status tracking

### Dual Template System (Updated January 2025)
**Live Reply Templates** - For direct customer interactions in live chat:
- Quick copy-to-clipboard functionality for instant responses
- Variable substitution (customer_name, order_id, time_frame, etc.)
- Category-based organization (Orders, General, Apology, Technical)
- Usage tracking and analytics for optimization
- No subject line (chat-focused content only)

**Email Templates** - For internal team communication:
- Subject + body content with variable support
- Team routing (Finance, IT Support, Fulfillment, Customer Service)
- Escalation workflows with priority levels (Standard, Urgent)
- Warning notes for sensitive communications
- Concerned team assignment for proper routing

**Shared Features**:
- Variable replacement using `{variable_name}` syntax
- Enhanced genre classification (Standard, Urgent, Greeting, CSAT, etc.)
- Usage analytics and performance tracking
- Supabase synchronization for data consistency

## Data Flow

1. **User Authentication**: Replit Auth → Session creation → Role-based access control
2. **Customer Data Management**: Local storage → Persistent across sessions → Template variable source
3. **Template Processing**: Template selection → Variable replacement → Copy to clipboard
4. **Admin Operations**: Role verification → Database operations → Real-time updates
5. **WebSocket Communication**: Connection establishment → User presence → Status broadcasting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@radix-ui/***: Headless UI component primitives
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **passport**: Authentication middleware

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first styling framework
- **ESBuild**: Fast JavaScript bundling for production

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React application to `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Database Migration**: Drizzle kit handles schema migrations

### Environment Configuration
- **Development**: Local development with Vite dev server and tsx
- **Production**: Express serves static files and API routes
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Sessions**: PostgreSQL-backed session storage for scalability

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect provider URL

The system is designed to be deployed on Replit with automatic environment provisioning, but can be adapted for other cloud platforms with minimal configuration changes.

## Recent Changes (January 23, 2025)

✓ Enhanced Admin Panel with 5 comprehensive tabs (User Management, Template Management, Analytics, Email Templates, Site Content)
✓ Added extensive template genres: greeting, CSAT, warning abusive language, apology, thank you, farewell, confirmation, technical support, holiday/special occasion
✓ Fixed CheckOrderModal dropdown issue by replacing Collapsible with standard button/conditional rendering
✓ Added Analytics Dashboard with real-time user and template usage insights
✓ Created Email Template Wizard with pre-built template starters
✓ Enhanced template validation and variable management system
✓ Added comprehensive template warning presets for all new genres
✓ Improved template color coding system for better visual organization
✓ Fixed database schema initialization issues
✓ Made admin panel more powerful with overpowered administrative capabilities
✓ Enabled beta testing mode with automatic admin access (authentication temporarily disabled for testing)
✓ Fixed authentication mismatch between Supabase frontend and Replit Auth backend causing blank page
✓ Added clear instructions for future authentication re-enablement in production
✓ **BETA MODE UPDATE**: Successfully unbinded databases as requested - switched from PostgreSQL to memory storage for beta testing
✓ Created MemoryStorage class with full functionality including sample data for immediate testing
✓ Disabled database connections and dependencies while preserving all API interfaces
✓ Application now runs without DATABASE_URL requirement and works completely offline
✓ **EMAIL COMPOSER ENHANCEMENT**: Completely rebuilt EmailComposerModal with advanced variable management system
✓ Fixed template update functionality by correcting PATCH/PUT method mismatches in AdminPanel
✓ Added comprehensive variable system categorized by Customer, Order, System, and Time data
✓ Implemented real-time variable replacement with live preview functionality
✓ Created dynamic variable input fields that appear based on template selection
✓ Enhanced email composition workflow with three-panel layout (Templates, Composition, Variables)
✓ Added sample email templates with proper variable usage for testing purposes
✓ **CRITICAL BUG FIXES**: Restored broken AdminPanel functionality after recent changes
✓ Fixed missing TabsContent sections for Analytics, Email Templates, and Settings tabs
✓ Resolved undefined template data variables causing blank admin screens
✓ **MAJOR BILINGUAL UPGRADE (January 23, 2025)**: Simplified bilingual support with single templates containing both languages
✓ **BREAKING CHANGE**: Replaced separate EN/AR templates with unified bilingual templates (contentEn + contentAr fields)
✓ **SMART LANGUAGE DETECTION**: Templates automatically show EN or AR content based on customer language selection
✓ **UI CLEANUP**: Removed Settings button, About button from navigation, Beta testing references, duplicate close buttons
✓ **WHITE-LABEL READY**: Removed all hardcoded branding, made platform fully customizable through Site Content
✓ **COUNTRY FLAG FIX**: Changed Arabic language flag from Oman 🇴🇲 to Saudi Arabia 🇸🇦
✓ **ADMIN EFFICIENCY**: Admins now create one template with both languages instead of managing separate templates