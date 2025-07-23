# Customer Service Communication Platform

A comprehensive customer service management tool designed for "Brands For Less" (BFL) built as an internal platform for customer service agents. The system helps agents manage customer information, create internal team communications, and streamline support operations through email templates and centralized data management.

## 🎯 Current Features

### ✅ Authentication & User Management
- **Supabase Authentication**: Login-only system (no signup) with admin role restrictions
- **Manual User Creation**: Users must be created manually in Supabase dashboard
- **Role-Based Access**: Admin and Agent roles with different permission levels
- **Real-time User Presence**: Online/offline status tracking via WebSocket

### ✅ Dual Template System
**Live Reply Templates** - For direct customer interactions in live chat:
- Bilingual support (English/Arabic) in single templates
- Quick copy-to-clipboard functionality for instant responses
- Variable substitution (customer_name, order_id, time_frame, etc.)
- Category-based organization (Orders, General, Apology, Technical)
- Usage tracking and analytics for optimization
- Dynamic variables in template names for admin users

**Email Templates** - For internal team communication:
- Subject + body content with variable support
- Team routing (Finance, IT Support, Fulfillment, Customer Service)
- Escalation workflows with priority levels (Standard, Urgent)
- Warning notes for sensitive communications
- Concerned team assignment for proper routing
- Dynamic variables in template names for admin users

### ✅ Enhanced Admin Panel (5 Comprehensive Tabs)
1. **User Management**: Complete control over user roles and status
2. **Template Management**: Create, edit, delete, and analyze live reply template usage
3. **Analytics Dashboard**: Real-time insights on user activity and template performance
4. **Email Templates**: Full email template management with team routing
5. **Site Content**: Dynamic content management for all customizable site elements

### ✅ Customer Information Management
- **Persistent Customer Data**: Local storage with session persistence
- **Order Conversion Tool**: Automatic conversion between order formats (Order ID ↔ AWB)
- **Variable Integration**: Customer data automatically populates in templates

### ✅ Email Template Composer
- **Full-Screen Responsive Layout**: Complete viewport utilization (100vw x 100vh)
- **Three-Panel Design**: Templates, Composition, Variables
- **Real-time Variable Replacement**: Live preview with dynamic substitution
- **Advanced Variable Management**: Categorized variables (Customer, Order, System, Time)
- **Team-based Routing**: Automatic routing to concerned teams

### ✅ White-Label Platform
- **Complete Brand Customization**: All branding elements are configurable
- **Site Content Management**: Dynamic site name, about content, footer customization
- **Mandatory Attribution**: "Made by Mahmoud Zalat" credit (non-removable)

### ✅ Bilingual Support
- **Unified Templates**: Single templates containing both English and Arabic content
- **Smart Language Detection**: Automatic language selection based on customer preference
- **Country Flag Integration**: Saudi Arabia 🇸🇦 for Arabic, Great Britain 🇬🇧 for English

### ✅ Real-time Features
- **WebSocket Communication**: Live user presence and status updates
- **Usage Analytics**: Real-time template performance tracking
- **Online Status**: Live tracking of agent availability

## 🏗️ System Architecture

### Frontend Stack
- **React 18** with TypeScript and Vite
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** with custom BFL brand colors
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **WebSocket** for real-time communication

### Backend Stack
- **Node.js** with Express.js server
- **Supabase** PostgreSQL database with real-time features
- **Supabase Auth** for authentication and session management
- **WebSocket** for user presence tracking

### Database Schema
- **Users Table**: User profiles with roles, status, and presence
- **Live Reply Templates**: Bilingual chat response templates
- **Email Templates**: Internal team communication templates
- **Usage Tracking**: Analytics for template performance
- **Site Content**: Dynamic content management
- **Sessions**: Secure authentication session storage

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase project created
- Environment variables configured

### Environment Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_session_secret
```

### Installation
1. **Clone and Install Dependencies**
   ```bash
   git clone <repository>
   cd customer-service-platform
   npm install
   ```

2. **Set up Supabase Database**
   - Create a new Supabase project
   - Run the `supabase-schema.sql` file in the Supabase SQL editor
   - Configure Row Level Security policies

3. **Create Admin User in Supabase**
   ```sql
   INSERT INTO users (id, email, first_name, last_name, role, status)
   VALUES ('your-admin-id', 'admin@yourcompany.com', 'Admin', 'User', 'admin', 'active');
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 👤 How to Make Yourself Admin

### Method 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to "Table Editor" → "users"
3. Click "Insert" → "Insert row"
4. Fill in the details:
   - `id`: Your unique user ID (e.g., 'admin-user-123')
   - `email`: Your email address
   - `first_name`: Your first name
   - `last_name`: Your last name
   - `role`: Select 'admin'
   - `status`: Select 'active'
5. Save the row

### Method 2: SQL Query in Supabase
1. Go to Supabase Dashboard → "SQL Editor"
2. Run this query:
```sql
INSERT INTO users (id, email, first_name, last_name, role, status, is_online)
VALUES ('your-admin-id', 'your-email@company.com', 'Your Name', 'Last Name', 'admin', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
```

### Method 3: Update Existing User
If you already exist as an agent, upgrade to admin:
```sql
UPDATE users 
SET role = 'admin', status = 'active', updated_at = NOW()
WHERE email = 'your-email@company.com';
```

## 🎨 Template System

### Variable Categories
**Customer Variables:**
- `{customer_name}`, `{customer_email}`, `{customer_phone}`, `{customer_address}`

**Order Variables:**
- `{order_id}`, `{awb_number}`, `{order_status}`, `{tracking_number}`, `{delivery_date}`

**System Variables:**
- `{agent_name}`, `{company_name}`, `{support_email}`, `{business_hours}`

**Time Variables:**
- `{current_date}`, `{current_time}`, `{time_frame}`

### Template Genres
- **Standard**: Regular communication templates
- **Urgent**: High-priority escalation templates
- **Greeting**: Welcome and introduction templates
- **CSAT**: Customer satisfaction survey templates
- **Warning Abusive Language**: Templates for handling difficult customers
- **Apology**: Apology and resolution templates
- **Thank You**: Appreciation templates
- **Farewell**: Closing and goodbye templates
- **Confirmation**: Order and action confirmation templates
- **Technical Support**: Technical assistance templates
- **Holiday/Special Occasion**: Seasonal and special event templates

## 🔄 Data Flow

1. **Authentication Flow**: User login → Supabase Auth verification → Role check → Dashboard access
2. **Template Processing**: Template selection → Variable replacement → Copy to clipboard/Email composition
3. **Admin Operations**: Role verification → Database operations → Real-time updates
4. **Customer Data**: Local storage → Template variables → Persistent sessions
5. **Real-time Updates**: WebSocket connection → User presence → Status broadcasting

## 📊 Analytics & Reporting

- **Template Usage Statistics**: Track which templates are used most frequently
- **User Activity Monitoring**: Monitor agent engagement and activity levels
- **Performance Metrics**: Analyze response times and template effectiveness
- **Team Routing Analytics**: Track email escalations by department

## 🛡️ Security Features

- **Row Level Security**: Supabase RLS policies for data protection
- **Role-Based Access Control**: Admin/Agent permission separation
- **Session Management**: Secure session storage in PostgreSQL
- **Input Validation**: Comprehensive form validation and sanitization

## 🚀 Future Plans

### Phase 1: Enhanced Analytics
- [ ] Advanced reporting dashboard
- [ ] Customer satisfaction tracking
- [ ] Performance metrics visualization
- [ ] Export functionality for reports

### Phase 2: Advanced Features
- [ ] Multi-language support expansion
- [ ] Template versioning system
- [ ] Automated template suggestions
- [ ] Integration with CRM systems

### Phase 3: AI Integration
- [ ] AI-powered template recommendations
- [ ] Sentiment analysis for customer interactions
- [ ] Automated response suggestions
- [ ] Intelligent escalation routing

### Phase 4: Mobile & Integration
- [ ] Mobile-responsive improvements
- [ ] API for third-party integrations
- [ ] Webhook support for external systems
- [ ] Advanced notification system

## 📝 Development Notes

### Template Name Dynamic Variables
Admin users can now include variables in template names:
- Example: `"Order {order_id} Follow-up"`
- Variables are replaced when templates are displayed
- Helps create more contextual and organized templates

### Removed Features (As Requested)
- ❌ Quick Template Starters (removed from both email and live chat)
- ❌ "Hide Variables" button in Email Composer
- ❌ Signup functionality (login-only system)
- ❌ Settings and About buttons in navigation

### Database Requirements
- PostgreSQL database (Supabase recommended)
- All tables include RLS policies for security
- UUID primary keys for templates
- Usage tracking with foreign key relationships

## 🤝 Contributing

This system is designed for easy maintenance and updates. Key areas for future development:

1. **Template System**: Located in `client/src/lib/templateUtils.ts`
2. **Database Schema**: Defined in `shared/schema.ts`
3. **Admin Panel**: `client/src/components/AdminPanel.tsx`
4. **Email Composer**: `client/src/components/EmailComposerModalNew.tsx`
5. **Authentication**: `server/supabase-auth.ts` and `client/src/lib/supabase.ts`

## 📄 License

Private project for Brands For Less customer service operations.

---

**Made by Mahmoud Zalat** - Customer Service Communication Platform v2.0