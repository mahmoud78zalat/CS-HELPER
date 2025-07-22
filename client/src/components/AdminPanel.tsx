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
import { X, Users, FileText, Settings, Edit, Trash, Plus, Crown, Shield, AlertTriangle } from "lucide-react";
import { User, Template } from "@shared/schema";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
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
      setShowCreateTemplate(false);
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
      setShowCreateTemplate(false);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Template Management
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
                  onClick={() => setShowCreateTemplate(true)}
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
                    onClick={() => setShowCreateTemplate(true)}
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
                                onClick={() => setEditingTemplate(template)}
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
        </Tabs>

        {/* Template Create/Edit Modal */}
        {(showCreateTemplate || editingTemplate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              
              <form id="template-form" className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    name="template-name"
                    placeholder="e.g., Order Delay Notification"
                    defaultValue={editingTemplate?.name || ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select name="template-category" defaultValue={editingTemplate?.category || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Order Issues">Order Issues</SelectItem>
                        <SelectItem value="Delivery Problems">Delivery Problems</SelectItem>
                        <SelectItem value="Payment Issues">Payment Issues</SelectItem>
                        <SelectItem value="Returns & Refunds">Returns & Refunds</SelectItem>
                        <SelectItem value="Product Inquiry">Product Inquiry</SelectItem>
                        <SelectItem value="General Support">General Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="template-genre">Genre/Priority</Label>
                    <Select name="template-genre" defaultValue={editingTemplate?.genre || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Escalation">Escalation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Courtesy">Courtesy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-team">Concerned Team</Label>
                  <Select name="template-team" defaultValue={editingTemplate?.concernedTeam || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer Service">Customer Service</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template-content">Template Content</Label>
                  <Textarea
                    id="template-content"
                    name="template-content"
                    rows={8}
                    placeholder="Write your template content here... Use {customer_name}, {order_number}, etc. for variables"
                    defaultValue={editingTemplate?.content || ''}
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Use variables like {'{customer_name}'}, {'{order_number}'}, {'{tracking_number}'} for dynamic content
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="template-active"
                      name="template-active"
                      defaultChecked={editingTemplate?.isActive !== false}
                    />
                    <Label htmlFor="template-active">Active Template</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateTemplate(false);
                        setEditingTemplate(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      onClick={() => {
                        const form = document.getElementById('template-form') as HTMLFormElement;
                        const formData = new FormData(form);
                        
                        const templateData = {
                          name: formData.get('template-name') as string,
                          subject: formData.get('template-name') as string,
                          content: formData.get('template-content') as string,
                          category: formData.get('template-category') as string,
                          genre: formData.get('template-genre') as string,
                          concernedTeam: formData.get('template-team') as string,
                          isActive: formData.get('template-active') === 'on',
                        };

                        if (editingTemplate) {
                          updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateData });
                        } else {
                          createTemplateMutation.mutate(templateData);
                        }
                      }}
                    >
                      {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
