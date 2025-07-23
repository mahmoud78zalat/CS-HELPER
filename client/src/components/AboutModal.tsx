import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Headphones, Users, MessageSquare, Zap, Shield, Clock } from "lucide-react";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  // Get dynamic content from localStorage
  const siteName = localStorage.getItem('site_name') || 'Customer Service Platform';
  const aboutTitle = localStorage.getItem('about_title') || 'Customer Service Helper';
  const aboutDescription = localStorage.getItem('about_description') || 'A comprehensive customer service management tool designed to streamline support operations, template management, and team communications.';
  const versionLabel = localStorage.getItem('version_label') || '';
  const footerText = localStorage.getItem('footer_text') || '';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="about-dialog-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Headphones className="h-5 w-5" />
              <span>About {aboutTitle}</span>
            </DialogTitle>
            <div id="about-dialog-description" className="sr-only">
              Information about the {aboutTitle} tool and its features
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Headphones className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {aboutTitle}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {aboutDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>Customer Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  {(() => {
                    const features = localStorage.getItem('about_customer_features');
                    const defaultFeatures = [
                      'Centralized customer information storage',
                      'Auto-save functionality', 
                      'Order number conversion tools',
                      'Additional customer details tracking'
                    ];
                    const featuresList = features ? JSON.parse(features) : defaultFeatures;
                    return featuresList.map((feature: string, index: number) => (
                      <li key={index}>• {feature}</li>
                    ));
                  })()}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <span>Template System</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  {(() => {
                    const features = localStorage.getItem('about_template_features');
                    const defaultFeatures = [
                      'Instant template search and filtering',
                      'One-click copy functionality',
                      'Variable replacement system',
                      'Usage tracking and analytics'
                    ];
                    const featuresList = features ? JSON.parse(features) : defaultFeatures;
                    return featuresList.map((feature: string, index: number) => (
                      <li key={index}>• {feature}</li>
                    ));
                  })()}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  <span>Efficiency Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Real-time search capabilities</li>
                  <li>• Keyboard shortcuts support</li>
                  <li>• Expandable sidebar panels</li>
                  <li>• Quick action buttons</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span>Security & Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Role-based access control</li>
                  <li>• Secure authentication system</li>
                  <li>• Admin panel for user management</li>
                  <li>• Real-time user status tracking</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Key Features
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">For Agents:</h4>
                <ul className="space-y-1">
                  {(() => {
                    const features = localStorage.getItem('about_agent_features');
                    const defaultFeatures = [
                      'Manage customer information',
                      'Access reply templates instantly',
                      'Convert order numbers',
                      'Create internal emails',
                      'Track order status'
                    ];
                    const featuresList = features ? JSON.parse(features) : defaultFeatures;
                    return featuresList.map((feature: string, index: number) => (
                      <li key={index}>• {feature}</li>
                    ));
                  })()}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">For Administrators:</h4>
                <ul className="space-y-1">
                  {(() => {
                    const features = localStorage.getItem('about_admin_features');
                    const defaultFeatures = [
                      'Manage user accounts and roles',
                      'Create and edit templates',
                      'Monitor usage statistics',
                      'Configure system settings',
                      'Track team performance'
                    ];
                    const featuresList = features ? JSON.parse(features) : defaultFeatures;
                    return featuresList.map((feature: string, index: number) => (
                      <li key={index}>• {feature}</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            {versionLabel && <p>{versionLabel}</p>}
            {footerText && <p className={versionLabel ? "mt-1" : ""}>{footerText}</p>}
            <p className={`text-xs text-slate-400 mt-3 ${(versionLabel || footerText) ? 'border-t pt-3' : ''}`}>
              Made by Mahmoud Zalat
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
