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
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp, Edit3, Trash2, Search, Upload, Globe, BarChart3, Mail, MessageSquare
} from "lucide-react";
import { User, Template } from "@shared/schema";
import TemplateFormModal from "@/components/TemplateFormModal";
import TemplateConfigManager from "@/components/TemplateConfigManager";
import CustomVariableManager from "@/components/CustomVariableManager";
// Removed QUICK_TEMPLATE_STARTERS import as it's no longer needed

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isEmailTemplate, setIsEmailTemplate] = useState(false); // Track template type
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [emailTemplateSearchTerm, setEmailTemplateSearchTerm] = useState('');
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [showVariableManager, setShowVariableManager] = useState(false);
  const [siteContentValues, setSiteContentValues] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
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

  // Email Templates query with proper typing
  const { data: emailTemplates = [], isLoading: emailTemplatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/email-templates'],
    retry: false,
  });

  // Site content query
  const { data: siteContent = [] } = useQuery({
    queryKey: ['/api/site-content'],
    retry: false,
    queryFn: async () => {
      const response = await fetch('/api/site-content', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch site content');
      const data = await response.json();
      
      // Convert array to object for easier state management
      const contentObject: {[key: string]: string} = {};
      data.forEach((item: any) => {
        contentObject[item.key] = item.content;
      });
      setSiteContentValues(contentObject);
      return data;
    },
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
        title: "User status updated",
        description: "Changes applied successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Redirecting to login...",
          variant: "destructive",
          duration: 4000,
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update failed",
        description: "Unable to change user status. Please try again.",
        variant: "destructive",
        duration: 4000,
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
        title: "Role updated",
        description: "User permissions changed successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Redirecting to login...",
          variant: "destructive",
          duration: 4000,
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Role update failed",
        description: "Unable to change user permissions. Please try again.",
        variant: "destructive",
        duration: 4000,
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
        title: "Template deleted",
        description: "Removed from system successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Redirecting to login...",
          variant: "destructive",
          duration: 4000,
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Delete failed",
        description: "Unable to remove template. Please try again.",
        variant: "destructive",
        duration: 4000,
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
        title: "Email template deleted",
        description: "Successfully removed from system",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Unable to remove email template. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // Site content update mutation
  const updateSiteContentMutation = useMutation({
    mutationFn: async ({ key, content }: { key: string; content: string }) => {
      const response = await fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, content }),
      });
      if (!response.ok) throw new Error('Failed to update site content');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
      toast({
        title: "Site content updated",
        description: "Changes have been saved to the database.",
      });
    },
    onError: (error) => {
      console.error('Update site content error:', error);
      toast({
        title: "Error",
        description: "Failed to update site content. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add timeout ref for debouncing
  const [timeoutRef, setTimeoutRef] = useState<NodeJS.Timeout | null>(null);

  const handleSiteContentChange = (key: string, value: string) => {
    // Update local state immediately for responsive UI
    setSiteContentValues(prev => ({ ...prev, [key]: value }));
    
    // Debounce the API call to avoid too many requests
    if (timeoutRef) {
      clearTimeout(timeoutRef);
    }
    
    const newTimeout = setTimeout(() => {
      updateSiteContentMutation.mutate({ key, content: value });
    }, 1000);
    
    setTimeoutRef(newTimeout);
  };

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

  // Only allow admin users to access the admin panel - check after all hooks are called
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Access Restricted</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
            <p className="text-gray-600 mb-4">
              This admin panel is only available to administrators. Please contact your system administrator for access.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this live chat template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  }

  const handleDeleteEmailTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this email template?')) {
      deleteEmailTemplateMutation.mutate(templateId);
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
    template.contentEn?.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
    template.contentAr?.toLowerCase().includes(templateSearchTerm.toLowerCase())
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
  
  // Admin access check
  const isAdmin = currentUser?.role === 'admin' || 
                  currentUser?.email === 'mahmoud78zalat@gmail.com';
  
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

          <TabsContent value="analytics" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                <p className="text-sm text-slate-600">Monitor user activity and template usage</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users?.length || 0}</div>
                    <p className="text-xs text-slate-500">Active: {users?.filter(u => u.status === 'active').length || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Live Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{templates?.length || 0}</div>
                    <p className="text-xs text-slate-500">Customer-facing replies</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Email Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(emailTemplates as any[])?.length || 0}</div>
                    <p className="text-xs text-slate-500">Internal team communication</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Online Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{users?.filter(u => u.isOnline).length || 0}</div>
                    <p className="text-xs text-slate-500">Currently active</p>
                    <div className="mt-2">
                      {users?.filter(u => u.isOnline).slice(0, 2).map(user => (
                        <div key={user.id} className="text-xs text-slate-600 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {user.firstName} {user.lastName}
                        </div>
                      ))}
                      {users?.filter(u => u.isOnline).length > 2 && (
                        <div className="text-xs text-slate-500">+{users?.filter(u => u.isOnline).length - 2} more</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">System Status</h4>
                <div className="text-sm text-blue-800">
                  <p>✓ Development mode active with automatic admin access</p>
                  <p>✓ All template configurations stored locally</p>
                  <p>✓ Real-time user presence tracking enabled</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emailtemplates" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Email Template Management</h3>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder="Search email templates..."
                      value={emailTemplateSearchTerm}
                      onChange={(e) => setEmailTemplateSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsEmailTemplate(true);
                      setShowTemplateForm(true);
                    }} 
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Email Template
                  </Button>
                </div>
              </div>
              
              {emailTemplatesLoading ? (
                <div>Loading email templates...</div>
              ) : (
                <div className="space-y-2">
                  {filteredEmailTemplates.map((template: any) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.genre || 'Standard'}
                            </Badge>
                            {template.concernedTeam && (
                              <Badge variant="secondary" className="text-xs">
                                {template.concernedTeam}
                              </Badge>
                            )}
                          </div>
                          {template.subject && (
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Subject:</strong> {template.subject}
                            </p>
                          )}
                          <p className="text-sm text-slate-600">
                            {template.content?.substring(0, 100)}...
                          </p>
                          {template.warningNote && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              <strong>Warning:</strong> {template.warningNote}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsEmailTemplate(true);
                              setShowTemplateForm(true);
                            }}
                            title="Edit Template"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmailTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Email Template"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">System Settings</h3>
                <p className="text-sm text-slate-600">Configure system preferences and security</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Beta Testing Configuration</CardTitle>
                  <p className="text-sm text-slate-600">Current beta testing settings</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-admin Access</p>
                        <p className="text-sm text-slate-600">Automatic admin permissions for testing</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Enabled
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Memory Storage</p>
                        <p className="text-sm text-slate-600">Using local memory instead of database</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Real-time Updates</p>
                        <p className="text-sm text-slate-600">WebSocket connection for live features</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Management</CardTitle>
                  <p className="text-sm text-slate-600">Manage local storage and configuration</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="h-4 w-4 mr-2" />
                      Export Configuration
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Configuration
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sitecontent" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Site Content Management</h3>
                <p className="text-sm text-slate-600">Manage template options, categories, genres, concerned teams, and custom variables</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Site Branding Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Site Branding
                    </CardTitle>
                    <p className="text-sm text-slate-600">Customize site name, about content, and footer</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        placeholder="e.g., Customer Service Platform"
                        value={siteContentValues.site_name || ''}
                        onChange={(e) => handleSiteContentChange('site_name', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aboutTitle">About Tool Title</Label>
                      <Input
                        id="aboutTitle"
                        placeholder="e.g., Customer Service Helper"
                        value={siteContentValues.about_title || ''}
                        onChange={(e) => handleSiteContentChange('about_title', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aboutDescription">About Description</Label>
                      <Textarea
                        id="aboutDescription"
                        placeholder="Brief description of your platform..."
                        rows={3}
                        value={siteContentValues.about_description || ''}
                        onChange={(e) => handleSiteContentChange('about_description', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="versionLabel">Version Label (optional)</Label>
                      <Input
                        id="versionLabel"
                        placeholder="e.g., Version 1.0.0 | Built for Company X"
                        value={siteContentValues.version_label || ''}
                        onChange={(e) => handleSiteContentChange('version_label', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="footerText">Footer Text (optional)</Label>
                      <Input
                        id="footerText"
                        placeholder="e.g., © 2025 Your Company. All rights reserved."
                        value={siteContentValues.footer_text || ''}
                        onChange={(e) => handleSiteContentChange('footer_text', e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={() => {
                        const siteName = (document.getElementById('siteName') as HTMLInputElement)?.value;
                        const aboutTitle = (document.getElementById('aboutTitle') as HTMLInputElement)?.value;
                        const aboutDescription = (document.getElementById('aboutDescription') as HTMLTextAreaElement)?.value;
                        const versionLabel = (document.getElementById('versionLabel') as HTMLInputElement)?.value;
                        const footerText = (document.getElementById('footerText') as HTMLInputElement)?.value;
                        
                        localStorage.setItem('site_name', siteName || '');
                        localStorage.setItem('about_title', aboutTitle || '');
                        localStorage.setItem('about_description', aboutDescription || '');
                        localStorage.setItem('version_label', versionLabel || '');
                        localStorage.setItem('footer_text', footerText || '');
                        
                        toast({
                          title: "Changes saved successfully",
                          description: "Your site branding updates have been applied",
                          duration: 3000,
                        });
                        
                        // Force refresh the page to show changes
                        window.location.reload();
                      }}
                      className="w-full mt-4"
                    >
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                {/* Template Configuration Section */}
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
                          const categories = siteContentValues.template_categories;
                          return categories ? JSON.parse(categories).length : 8;
                        })()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Genres:</span>
                        <span className="font-medium">{(() => {
                          const genres = siteContentValues.template_genres;
                          return genres ? JSON.parse(genres).length : 14;
                        })()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Concerned Teams:</span>
                        <span className="font-medium">{(() => {
                          const teams = siteContentValues.template_concerned_teams;
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
                        <span className="font-medium">{templates?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Email Templates:</span>
                        <span className="font-medium">{(emailTemplates as any[])?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Users:</span>
                        <span className="font-medium">{users?.filter(u => u.status === 'active').length || 0}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-full mt-4 justify-center">
                      Development Mode
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
