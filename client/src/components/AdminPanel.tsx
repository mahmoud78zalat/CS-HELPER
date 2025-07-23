import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { realTimeService } from "@/lib/realTimeService";
import { 
  X, Users, FileText, Settings, Edit, Trash, Plus, Crown, Shield, AlertTriangle, 
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp 
} from "lucide-react";
import { User, Template } from "@shared/schema";
import TemplateFormModal from "@/components/TemplateFormModal";
import { QUICK_TEMPLATE_STARTERS } from "@/lib/templateUtils";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Users query - always call hooks at top level
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Templates query
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    retry: false,
  });

  // User status mutation
  const userStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}/status`, { status });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      // Broadcast user update to all connected users
      await realTimeService.broadcastUserUpdate();
      toast({
        title: "Success",
        description: "User status updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // User role mutation
  const userRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      // Broadcast user update to all connected users
      await realTimeService.broadcastUserUpdate();
      toast({
        title: "Success",
        description: "User role updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Template delete mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest('DELETE', `/api/templates/${templateId}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      // Broadcast template update to all connected users
      await realTimeService.broadcastTemplateUpdate();
      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const handleUserStatusChange = (userId: string, status: string) => {
    userStatusMutation.mutate({ userId, status });
  };

  const handleUserRoleChange = (userId: string, role: string) => {
    userRoleMutation.mutate({ userId, role });
  };

  // Template create mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      await apiRequest('POST', '/api/templates', templateData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      await realTimeService.broadcastTemplateUpdate();
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Template created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Template update mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest('PATCH', `/api/templates/${id}`, data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      await realTimeService.broadcastTemplateUpdate();
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success", 
        description: "Template updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  // Check admin access AFTER all hooks are called
  console.log('AdminPanel - Current user:', currentUser);
  console.log('AdminPanel - User metadata:', currentUser?.user_metadata);
  console.log('AdminPanel - User email:', currentUser?.email);
  
  const isAdmin = currentUser?.user_metadata?.role === 'admin' || currentUser?.email === 'mahmoud78zalat@gmail.com';
  console.log('AdminPanel - Is Admin:', isAdmin);
  
  if (!isAdmin) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md" aria-describedby="access-denied-description">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <div id="access-denied-description" className="sr-only">
              You don't have admin permissions to access this panel
            </div>
          </DialogHeader>
          <div className="p-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have admin permissions to access this panel.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-5/6" aria-describedby="admin-panel-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Admin Panel</span>
            </DialogTitle>
            <div id="admin-panel-description" className="sr-only">
              Admin panel for managing users, templates, and site content
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Template Management
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Crown className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="emailtemplates">
              <Wand2 className="h-4 w-4 mr-2" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="content">
              <Settings className="h-4 w-4 mr-2" />
              Site Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Management</h3>
              
              {usersLoading ? (
                <div>Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Online</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select 
                            value={user.role} 
                            onValueChange={(role) => handleUserRoleChange(user.id, role)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.status} 
                            onValueChange={(status) => handleUserStatusChange(user.id, status)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                              <SelectItem value="banned">Banned</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isOnline ? "default" : "secondary"}>
                            {user.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-500">
                            Last seen: {user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Never'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Template Management</h3>
                <Button 
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowTemplateForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
              
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-600">Loading templates...</div>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mb-4" />
                  <h4 className="text-lg font-medium mb-2">No Templates Found</h4>
                  <p className="text-sm text-center max-w-md">
                    Get started by creating your first template. Templates help customer service agents provide consistent and professional responses.
                  </p>
                  <Button 
                    onClick={() => {
                      setEditingTemplate(null);
                      setShowTemplateForm(true);
                    }}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Genre</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template: any) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{template.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{template.genre}</Badge>
                          </TableCell>
                          <TableCell>{template.concernedTeam || 'General'}</TableCell>
                          <TableCell className="text-center">{template.usageCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setShowTemplateForm(true);
                                }}
                                title="Edit Template"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete Template"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Admin Management Guide</h3>
              
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  <strong>Super Admin:</strong> mahmoud78zalat@gmail.com has permanent admin access.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    How to Make Someone Admin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-slate-600">
                    <p><strong>Method 1: Through Supabase Dashboard (Recommended)</strong></p>
                    <ol className="list-decimal ml-4 mt-2 space-y-2">
                      <li>Log into your Supabase project dashboard</li>
                      <li>Go to "Authentication" → "Users"</li>
                      <li>Find the user you want to promote</li>
                      <li>Click on their user record</li>
                      <li>In the "Raw User Meta Data" section, add:</li>
                      <div className="bg-slate-100 p-3 rounded mt-2 font-mono text-xs">
                        {`{\n  "role": "admin",\n  "first_name": "User First Name",\n  "last_name": "User Last Name"\n}`}
                      </div>
                      <li>Save the changes</li>
                      <li>User will have admin access on next login</li>
                    </ol>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Warning:</strong> Only grant admin access to trusted team members. Admins can manage templates, view all user data, and change system settings.
                    </AlertDescription>
                  </Alert>

                  <div className="text-sm text-slate-600">
                    <p><strong>Method 2: Through Code (For Developers)</strong></p>
                    <p className="mt-2">Add the user's email to the admin check in the Header component alongside 'mahmoud78zalat@gmail.com'</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Admin Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span>You are currently logged in as: <strong>{currentUser?.email}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm mt-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Admin Role: <strong>Active</strong></span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Analytics & Insights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Active templates in system</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{users.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Registered users</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Online Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {users.filter((user: User) => user.isOnline).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Currently active</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Template Usage by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templates.reduce((acc: any, template: any) => {
                        const category = template.category || 'Uncategorized';
                        acc[category] = (acc[category] || 0) + (template.usageCount || 0);
                        return acc;
                      }, {}) && Object.entries(templates.reduce((acc: any, template: any) => {
                        const category = template.category || 'Uncategorized';
                        acc[category] = (acc[category] || 0) + (template.usageCount || 0);
                        return acc;
                      }, {})).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">{category}</span>
                          <Badge variant="secondary">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User Roles Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Admins</span>
                        <Badge variant="default">
                          {users.filter((user: User) => user.role === 'admin').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Agents</span>
                        <Badge variant="secondary">
                          {users.filter((user: User) => user.role === 'agent').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Used Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates
                      .sort((a: any, b: any) => (b.usageCount || 0) - (a.usageCount || 0))
                      .slice(0, 5)
                      .map((template: any) => (
                        <div key={template.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                          <div>
                            <span className="font-medium text-sm">{template.name}</span>
                            <div className="text-xs text-slate-500">{template.category} • {template.genre}</div>
                          </div>
                          <Badge variant="outline">{template.usageCount || 0} uses</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emailtemplates" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Email Template Wizard</h3>
                <Button 
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowTemplateForm(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create Magic Template
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(QUICK_TEMPLATE_STARTERS).map(([name, template]) => (
                  <Card key={name} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wand2 size={16} className="text-purple-600" />
                        {name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-3">
                        {template.substring(0, 100)}...
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(null);
                          setShowTemplateForm(true);
                          // Pre-fill with starter template
                          setTimeout(() => {
                            const event = new CustomEvent('useTemplateStarter', { detail: name });
                            window.dispatchEvent(event);
                          }, 100);
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                      >
                        Use This Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> These template starters include smart variables that automatically populate with customer data. You can customize them further after selection.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Categories & Genres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Available Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Order Issues', 'Delivery Problems', 'Payment Issues', 'Returns & Refunds', 'Product Inquiry', 'General Support', 'Technical Support', 'Escalation'].map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Available Genres</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Urgent', 'Standard', 'Follow-up', 'Escalation', 'Resolution', 'Greeting', 'CSAT', 'Warning Abusive Language', 'Apology', 'Thank You', 'Farewell', 'Confirmation', 'Technical Support', 'Holiday/Special Occasion'].map((genre) => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      {/* Template Form Modal */}
      <TemplateFormModal
        template={editingTemplate}
        isOpen={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false);
          setEditingTemplate(null);
        }}
        onSave={(templateData) => {
          if (editingTemplate) {
            updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateData });
          } else {
            createTemplateMutation.mutate({ ...templateData, createdBy: currentUser?.id });
          }
        }}
        isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
      />
      </DialogContent>
    </Dialog>
  );
}
