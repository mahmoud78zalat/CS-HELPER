# BFL Customer Service Helper - System Architecture

## Overview

This is a comprehensive customer service management tool for "Brands For Less" (BFL) built as an internal platform for customer service agents. The system helps agents manage customer information, create internal team communications, and streamline support operations through email templates and centralized data management.

## User Preferences

Preferred communication style: Simple, everyday language.
Admin should have overpowered capabilities and enhanced control over all templates and system features.
Fix all bugs and ensure dropdown components work correctly.
Extensive template genres including greeting, CSAT, warning abusive language, apology, thank you, farewell, confirmation, technical support, and holiday/special occasion.

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
2. **Templates Table**: Email template management with categories, genres, and team assignments
3. **Template Usage Table**: Tracks template usage statistics for analytics
4. **Site Content Table**: Dynamic content management for customizable elements
5. **Sessions Table**: Secure session storage for authentication

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

### Template System
- **Variable Replacement**: Dynamic content insertion using `{variable_name}` syntax
- **Categorization**: Templates organized by category (Order Issues, Delivery Problems, etc.)
- **Enhanced Genre Classification**: Extended genres including Greeting, CSAT, Warning Abusive Language, Apology, Thank You, Farewell, Confirmation, Technical Support, Holiday/Special Occasion
- **Usage Analytics**: Track which templates are most frequently used
- **Template Starters**: Pre-built template starters with common use cases
- **Smart Variable System**: Automatic variable detection and validation

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