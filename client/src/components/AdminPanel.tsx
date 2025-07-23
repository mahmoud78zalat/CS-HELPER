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
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp, Edit3, Trash2, Search
} from "lucide-react";
import { User, Template } from "@shared/schema";
import TemplateFormModal from "@/components/TemplateFormModal";
import TemplateConfigManager from "@/components/TemplateConfigManager";
import CustomVariableManager from "@/components/CustomVariableManager";
import { QUICK_TEMPLATE_STARTERS } from "@/lib/templateUtils";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isEmailTemplate, setIsEmailTemplate] = useState(false); // Track template type
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [emailTemplateSearchTerm, setEmailTemplateSearchTerm] = useState('');
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [showVariableManager, setShowVariableManager] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Users query - always call hooks at top level
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false,
  });

  // Templates query
  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    retry: false,
  });

  // Email Templates query
  const { data: emailTemplates = [], isLoading: emailTemplatesLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    retry: false,
  });

  // User status mutation
  const userStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest('PUT', `/api/users/${userId}/status`, { status });
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
      await apiRequest('PUT', `/api/users/${userId}/role`, { role });
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

  // Email template deletion mutation
  const deleteEmailTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest('DELETE', `/api/email-templates/${templateId}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Success",
        description: "Email template deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete email template",
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

  // Live Chat Template create mutation
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
        description: "Live chat template created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create live chat template",
        variant: "destructive",
      });
    },
  });

  // Live Chat Template update mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest('PUT', `/api/templates/${id}`, data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      await realTimeService.broadcastTemplateUpdate();
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success", 
        description: "Live chat template updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update live chat template",
        variant: "destructive",
      });
    },
  });

  // Email Template create mutation  
  const createEmailTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      await apiRequest('POST', '/api/email-templates', templateData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Email template created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create email template",
        variant: "destructive",
      });
    },
  });

  // Email Template update mutation
  const updateEmailTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest('PUT', `/api/email-templates/${id}`, data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Email template updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  // Filter functions for search
  const filteredUsers = users.filter((user: User) =>
    user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter((template: any) =>
    template.name?.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
    template.genre?.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
    template.content?.toLowerCase().includes(templateSearchTerm.toLowerCase())
  );

  const filteredEmailTemplates = emailTemplates.filter((template: any) =>
    template.name?.toLowerCase().includes(emailTemplateSearchTerm.toLowerCase()) ||
    template.subject?.toLowerCase().includes(emailTemplateSearchTerm.toLowerCase()) ||
    template.content?.toLowerCase().includes(emailTemplateSearchTerm.toLowerCase()) ||
    template.concernedTeam?.toLowerCase().includes(emailTemplateSearchTerm.toLowerCase()) ||
    template.genre?.toLowerCase().includes(emailTemplateSearchTerm.toLowerCase())
  );

  // Check admin access AFTER all hooks are called
  console.log('AdminPanel - Current user:', currentUser);
  console.log('AdminPanel - User email:', currentUser?.email);
  console.log('AdminPanel - User role:', currentUser?.role);
  
  // BETA TESTING: Allow all beta users admin access + production admin check
  const isAdmin = currentUser?.role === 'admin' || 
                  currentUser?.email === 'mahmoud78zalat@gmail.com' ||
                  currentUser?.id === 'beta-admin-user'; // Beta testing access
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
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] p-0" aria-describedby="admin-panel-description">
        <DialogHeader className="p-4 lg:p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span className="text-base lg:text-lg">Admin Panel</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Beta Mode
              </Badge>
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

        <div className="flex-1 overflow-hidden p-4 lg:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Mobile-responsive tabs */}
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4">
              <TabsTrigger value="users" className="text-xs lg:text-sm p-2 lg:p-3">
                <Users className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">User Management</span>
                <span className="lg:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs lg:text-sm p-2 lg:p-3">
                <FileText className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Template Management</span>
                <span className="lg:hidden">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs lg:text-sm p-2 lg:p-3">
                <Crown className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Analytics</span>
                <span className="lg:hidden">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="emailtemplates" className="text-xs lg:text-sm p-2 lg:p-3">
                <Wand2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Email Templates</span>
                <span className="lg:hidden">Email</span>
              </TabsTrigger>
              <TabsTrigger value="sitecontent" className="text-xs lg:text-sm p-2 lg:p-3">
                <Settings className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Site Content</span>
                <span className="lg:hidden">Content</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs lg:text-sm p-2 lg:p-3">
                <Shield className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Settings</span>
                <span className="lg:hidden">Settings</span>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="users" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Management</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="text"
                    className="pl-10"
                    placeholder="Search users by name, email, or role..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
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
                    {filteredUsers.map((user: User) => (
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
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder="Search templates by name, category..."
                      value={templateSearchTerm}
                      onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsEmailTemplate(false);
                      setShowTemplateForm(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Live Chat Template
                  </Button>
                </div>
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
                      {filteredTemplates.map((template: any) => (
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

          <TabsContent value="sitecontent" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Site Content Management</h3>
                <p className="text-sm text-slate-600">Manage template options, categories, genres, concerned teams, and custom variables</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Template Configuration Card */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowConfigManager(true)}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Template Configuration
                    </CardTitle>
                    <p className="text-sm text-slate-600">Manage categories, genres, and concerned teams</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Categories:</span>
                        <span className="font-medium">{(() => {
                          const categories = localStorage.getItem('template_categories');
                          return categories ? JSON.parse(categories).length : 8;
                        })()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Genres:</span>
                        <span className="font-medium">{(() => {
                          const genres = localStorage.getItem('template_genres');
                          return genres ? JSON.parse(genres).length : 14;
                        })()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Concerned Teams:</span>
                        <span className="font-medium">{(() => {
                          const teams = localStorage.getItem('template_concerned_teams');
                          return teams ? JSON.parse(teams).length : 7;
                        })()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4" onClick={(e) => {
                      e.stopPropagation();
                      setShowConfigManager(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Configuration
                    </Button>
                  </CardContent>
                </Card>

                {/* Custom Variables Card */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowVariableManager(true)}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Custom Variables
                    </CardTitle>
                    <p className="text-sm text-slate-600">Manage custom template variables</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Variables:</span>
                        <span className="font-medium">{(() => {
                          const variables = localStorage.getItem('custom_template_variables');
                          return variables ? JSON.parse(variables).length : 3;
                        })()}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Add custom variables that can be used in templates with {`{VARIABLE_NAME}`} syntax
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4" onClick={(e) => {
                      e.stopPropagation();
                      setShowVariableManager(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Manage Variables
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      System Overview
                    </CardTitle>
                    <p className="text-sm text-slate-600">Current system configuration</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Live Templates:</span>
                        <span className="font-medium">{templatesData?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Email Templates:</span>
                        <span className="font-medium">{emailTemplatesData?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Users:</span>
                        <span className="font-medium">{usersData?.filter(u => u.status === 'active').length || 0}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-full mt-4 justify-center">
                      Beta Testing Mode
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Configuration Notes</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Changes to categories and genres apply immediately to new templates</li>
                  <li>• Concerned teams are only used for email templates (internal communication)</li>
                  <li>• Custom variables can be used in both email and live chat templates</li>
                  <li>• All configurations are stored locally and persist across sessions</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>

      {/* Template Form Modal */}
      <TemplateFormModal
        template={editingTemplate}
        isOpen={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false);
          setEditingTemplate(null);
          setIsEmailTemplate(false);
        }}
        onSave={(templateData) => {
          if (editingTemplate) {
            if (isEmailTemplate) {
              updateEmailTemplateMutation.mutate({ id: editingTemplate.id, data: templateData });
            } else {
              updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateData });
            }
          } else {
            if (isEmailTemplate) {
              createEmailTemplateMutation.mutate({ ...templateData, createdBy: currentUser?.id });
            } else {
              createTemplateMutation.mutate({ ...templateData, createdBy: currentUser?.id });
            }
          }
        }}
        isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending || createEmailTemplateMutation.isPending || updateEmailTemplateMutation.isPending}
        isEmailTemplate={isEmailTemplate}
      />

      {/* Template Config Manager */}
      <TemplateConfigManager isOpen={showConfigManager} onClose={() => setShowConfigManager(false)} />

      {/* Custom Variable Manager */}
      <CustomVariableManager isOpen={showVariableManager} onClose={() => setShowVariableManager(false)} />
      </DialogContent>
    </Dialog>
  );
}
