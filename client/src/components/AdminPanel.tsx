import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { X, Users, FileText, Settings, Edit, Trash, Plus } from "lucide-react";
import { User, Template } from "@shared/schema";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (currentUser?.role !== 'admin') {
    onClose();
    return null;
  }

  // Users query
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
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

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-5/6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Admin Panel</span>
            </DialogTitle>
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
                <div>Loading templates...</div>
              ) : (
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
                    {templates.map((template: Template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell>{template.genre}</TableCell>
                        <TableCell>{template.concernedTeam}</TableCell>
                        <TableCell>{template.usageCount}</TableCell>
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
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Site Content Management</h3>
              <p className="text-slate-600">Site content management functionality coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
