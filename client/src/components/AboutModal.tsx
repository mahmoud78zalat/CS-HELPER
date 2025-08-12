import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Headphones, Users, MessageSquare, Clock, Zap, Shield, 
  Sparkles, Database, Settings, Cpu, Globe, Activity, 
  Palette, Bell, Lock, BarChart, Search, Mouse, Building
} from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  // Fetch site content from database
  const { data: siteContent = [] } = useQuery<any[]>({
    queryKey: ['/api/site-content'],
    retry: false,
  });

  // Extract site content values
  const getSiteContentValue = (key: string, fallback: string = '') => {
    const item = siteContent.find((item: any) => item.key === key);
    return item?.content || localStorage.getItem(key) || fallback;
  };

  const siteName = getSiteContentValue('site_name', 'BFL Customer Service Helper');
  const aboutTitle = getSiteContentValue('about_title', 'Customer Service Helper');
  const aboutDescription = getSiteContentValue('about_description', 'A comprehensive, enterprise-grade customer service management platform designed to streamline support operations, enhance team productivity, and deliver exceptional customer experiences through intelligent automation and advanced communication tools.');
  const versionLabel = getSiteContentValue('version_label');
  const footerText = getSiteContentValue('footer_text');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby="about-dialog-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Headphones className="h-5 w-5" />
              <span>About {siteName}</span>
            </DialogTitle>
          </div>
        </DialogHeader>
        <div id="about-dialog-description" className="sr-only">
          Information about the {siteName} platform and its comprehensive features
        </div>

        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Headphones className="text-white text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              {siteName}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto text-lg leading-relaxed">
              {aboutDescription}
            </p>
          </div>

          {/* Core Platform Features */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
              <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
              Enterprise Customer Service Platform
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  For Customer Service Agents:
                </h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <Database className="h-4 w-4 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                    <div><span className="font-semibold">Smart Customer Panel:</span> Persistent data storage with auto-save functionality</div>
                  </li>
                  <li className="flex items-start">
                    <Mouse className="h-4 w-4 mr-2 mt-1 text-green-500 flex-shrink-0" />
                    <div><span className="font-semibold">Drag & Drop Templates:</span> Intuitive organization with live template management</div>
                  </li>
                  <li className="flex items-start">
                    <Search className="h-4 w-4 mr-2 mt-1 text-purple-500 flex-shrink-0" />
                    <div><span className="font-semibold">Order Conversion Tool:</span> Seamless Order ID ↔ userid</div>
                  </li>
                  <li className="flex items-start">
                    <MessageSquare className="h-4 w-4 mr-2 mt-1 text-indigo-500 flex-shrink-0" />
                    <div><span className="font-semibold">Email Composer:</span> Professional internal communication system</div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 mt-1 text-orange-500 flex-shrink-0" />
                    <div><span className="font-semibold">Personal Notes:</span> Private workspace with full CRUD operations</div>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-4 w-4 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                    <div><span className="font-semibold">Variable System:</span> Dynamic {'{variable}'} replacement across all templates</div>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  For System Administrators:
                </h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <Users className="h-4 w-4 mr-2 mt-1 text-red-500 flex-shrink-0" />
                    <div><span className="font-semibold">User Management:</span> Complete control over user roles, status, and permissions</div>
                  </li>
                  <li className="flex items-start">
                    <Settings className="h-4 w-4 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                    <div><span className="font-semibold">Template Administration:</span> Advanced template creation, organization, and analytics</div>
                  </li>
                  <li className="flex items-start">
                    <BarChart className="h-4 w-4 mr-2 mt-1 text-green-500 flex-shrink-0" />
                    <div><span className="font-semibold">Analytics Dashboard:</span> Real-time performance insights and usage tracking</div>
                  </li>
                  <li className="flex items-start">
                    <Bell className="h-4 w-4 mr-2 mt-1 text-purple-500 flex-shrink-0" />
                    <div><span className="font-semibold">FAQ & Announcements:</span> Dynamic help content with persistent notifications</div>
                  </li>
                  <li className="flex items-start">
                    <Globe className="h-4 w-4 mr-2 mt-1 text-indigo-500 flex-shrink-0" />
                    <div><span className="font-semibold">White-Label Branding:</span> Complete site customization and theming control</div>
                  </li>
                  <li className="flex items-start">
                    <Palette className="h-4 w-4 mr-2 mt-1 text-pink-500 flex-shrink-0" />
                    <div><span className="font-semibold">Color Management:</span> Centralized visual organization and theme management</div>
                  </li>
                  <li className="flex items-start">
                    <Building className="h-4 w-4 mr-2 mt-1 text-orange-500 flex-shrink-0" />
                    <div><span className="font-semibold">Team Communication:</span> Store contact management with optional phone numbers, amount tracking, and delivery dates</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Categories */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Database className="h-6 w-6 text-blue-500" />
                  <span>Customer Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Centralized customer information hub with persistent storage</li>
                  <li>• Auto-save functionality with session-based data retention</li>
                  <li>• Advanced order tracking & conversion tools</li>
                  <li>• Additional customer details management system</li>
                  <li>• Real-time data synchronization across sessions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <MessageSquare className="h-6 w-6 text-purple-500" />
                  <span>Template Ecosystem</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Advanced drag & drop organization with collision detection</li>
                  <li>• Hierarchical categories & genres with visual organization</li>
                  <li>• Intelligent search & filtering with real-time results</li>
                  <li>• One-click copy functionality with toast notifications</li>
                  <li>• Comprehensive usage analytics & performance tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Activity className="h-6 w-6 text-green-500" />
                  <span>Advanced Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• 24/7 presence tracking with intelligent heartbeat logic (15-30s intervals)</li>
                  <li>• Team Communication Suite with amount tracking and delivery dates</li>
                  <li>• 14+ template groups with enterprise drag & drop organization</li>
                  <li>• 40+ dynamic variables with real-time preview and validation</li>
                  <li>• Bilingual support (Arabic/English) with automatic language switching</li>
                  <li>• Modal separation: Personal vs Admin functionality with proper security</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Technical Architecture */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
              <Cpu className="h-6 w-6 mr-3 text-indigo-600" />
              Technical Architecture & Infrastructure
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-lg">Frontend Stack:</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• <span className="font-medium">React 18</span> with TypeScript for type safety</li>
                  <li>• <span className="font-medium">Vite</span> for lightning-fast development</li>
                  <li>• <span className="font-medium">shadcn/ui + Radix UI</span> for accessible components</li>
                  <li>• <span className="font-medium">TanStack Query</span> for intelligent server state management</li>
                  <li>• <span className="font-medium">Tailwind CSS</span> with custom theming system</li>
                  <li>• <span className="font-medium">WebSocket</span> for real-time updates and presence</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-lg">Backend Infrastructure:</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• <span className="font-medium">Node.js + Express.js</span> for robust API layer</li>
                  <li>• <span className="font-medium">Drizzle ORM</span> with PostgreSQL for type-safe database operations</li>
                  <li>• <span className="font-medium">Supabase</span> for authentication, storage, and real-time features</li>
                  <li>• <span className="font-medium">Session-based security</span> with PostgreSQL storage</li>
                  <li>• <span className="font-medium">Multi-platform deployment</span> support and optimization</li>
                  <li>• <span className="font-medium">Railway, Vercel, Replit</span> compatible architecture</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security & Performance */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-red-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-500" />
                  <span>Security & Access Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Role-based access control (Admin/Agent permissions)</li>
                  <li>• Secure authentication with Supabase Auth integration</li>
                  <li>• Session-based security with PostgreSQL storage</li>
                  <li>• Complete user deletion from Auth and database</li>
                  <li>• Real-time user status and permission management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  <span>Performance & Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Real-time usage tracking and performance metrics</li>
                  <li>• Template effectiveness analytics and insights</li>
                  <li>• User engagement and productivity monitoring</li>
                  <li>• Comprehensive system activity logging</li>
                  <li>• Advanced caching with intelligent cache invalidation</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Project Statistics */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-indigo-600" />
              Development Scale & Statistics
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">52,224</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Lines</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">40,777</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Code Lines</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">1,066</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Project Files</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">600+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Dev Hours</div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-4">
              Enterprise-Level Customer Service Platform with Advanced Real-time Collaboration
            </p>
          </div>

          {/* Footer Information */}
          <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-700">
            {versionLabel && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                {versionLabel}
              </p>
            )}
            {footerText && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {footerText}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center">
                <Cpu className="h-3 w-3 mr-1" />
                Powered by React + TypeScript
              </span>
              <span className="flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Supabase + PostgreSQL
              </span>
              <span className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                Multi-Platform Deployment
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}