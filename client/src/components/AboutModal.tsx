import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Headphones, Users, MessageSquare, Zap, Shield, Clock } from "lucide-react";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="about-dialog-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Headphones className="h-5 w-5" />
              <span>About BFL Customer Service Helper</span>
            </DialogTitle>
            <div id="about-dialog-description" className="sr-only">
              Information about the BFL Customer Service Helper tool and its features
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
              BFL Customer Service Helper
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A comprehensive internal customer service management tool designed to streamline 
              customer support operations, template management, and internal team communications 
              for Brands For Less (BFL).
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
                  <li>• Centralized customer information storage</li>
                  <li>• Auto-save functionality</li>
                  <li>• Order number conversion tools</li>
                  <li>• Additional customer details tracking</li>
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
                  <li>• Instant template search and filtering</li>
                  <li>• One-click copy functionality</li>
                  <li>• Variable replacement system</li>
                  <li>• Usage tracking and analytics</li>
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
                  <li>• Manage customer information</li>
                  <li>• Access reply templates instantly</li>
                  <li>• Convert order numbers</li>
                  <li>• Create internal emails</li>
                  <li>• Track order status</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">For Administrators:</h4>
                <ul className="space-y-1">
                  <li>• Manage user accounts and roles</li>
                  <li>• Create and edit templates</li>
                  <li>• Monitor usage statistics</li>
                  <li>• Configure system settings</li>
                  <li>• Track team performance</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            <p>Version 1.0.0 | Built for Brands For Less Customer Service Team</p>
            <p className="mt-1">© 2024 BFL. All rights reserved.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
