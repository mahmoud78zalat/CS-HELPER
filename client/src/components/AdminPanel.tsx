import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp, Edit3, Trash2, Search, Upload, Globe, BarChart3, Mail, MessageSquare, Palette
} from "lucide-react";
import { User, Template } from "@shared/schema";
import TemplateFormModal from "@/components/TemplateFormModal";
import TemplateConfigManager from "@/components/TemplateConfigManager";
import VariableManager from "@/components/VariableManager";
import { GENRE_COLORS, CATEGORY_COLORS, syncColorsToSupabase, getAllGenres, getAllCategories, updateColorsFromTemplates } from "@/lib/templateColors";
import { HexColorPicker } from 'react-colorful';
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
  const [genreColors, setGenreColors] = useState(GENRE_COLORS);
  const [categoryColors, setCategoryColors] = useState(CATEGORY_COLORS);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState<string>('#3b82f6');
  const [editingColorType, setEditingColorType] = useState<'genre' | 'category'>('genre');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to convert hex color to closest Tailwind color with accurate color matching
  const hexToTailwindColor = (hex: string): { background: string; text: string; border: string } => {
    // Comprehensive color mapping with RGB values for accurate matching
    const colorMap: Record<string, { bg: string; text: string; border: string; rgb: [number, number, number] }> = {
      // Red family
      '#fee2e2': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', rgb: [254, 226, 226] },
      '#fecaca': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', rgb: [254, 202, 202] },
      '#ef4444': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', rgb: [239, 68, 68] },
      '#dc2626': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', rgb: [220, 38, 38] },
      '#e11d48': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', rgb: [225, 29, 72] },
      
      // Orange family
      '#fed7aa': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', rgb: [254, 215, 170] },
      '#f97316': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', rgb: [249, 115, 22] },
      '#f59e0b': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', rgb: [245, 158, 11] },
      
      // Yellow family
      '#fef3c7': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', rgb: [254, 243, 199] },
      '#eab308': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', rgb: [234, 179, 8] },
      '#84cc16': { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', rgb: [132, 204, 22] },
      
      // Green family
      '#dcfce7': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', rgb: [220, 252, 231] },
      '#22c55e': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', rgb: [34, 197, 94] },
      '#10b981': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', rgb: [16, 185, 129] },
      '#14b8a6': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', rgb: [20, 184, 166] },
      
      // Blue family
      '#dbeafe': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', rgb: [219, 234, 254] },
      '#3b82f6': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', rgb: [59, 130, 246] },
      '#06b6d4': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', rgb: [6, 182, 212] },
      '#6366f1': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', rgb: [99, 102, 241] },
      
      // Purple family
      '#e9d5ff': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', rgb: [233, 213, 255] },
      '#8b5cf6': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', rgb: [139, 92, 246] },
      '#7c3aed': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', rgb: [124, 58, 237] },
      
      // Pink family
      '#fce7f3': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', rgb: [252, 231, 243] },
      '#ec4899': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', rgb: [236, 72, 153] },
      
      // Gray family
      '#f3f4f6': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', rgb: [243, 244, 246] },
      '#6b7280': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', rgb: [107, 114, 128] },
    };

    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [0, 0, 0];
    };

    // Calculate color distance using RGB values
    const colorDistance = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
      return Math.sqrt(
        Math.pow(rgb1[0] - rgb2[0], 2) +
        Math.pow(rgb1[1] - rgb2[1], 2) +
        Math.pow(rgb1[2] - rgb2[2], 2)
      );
    };

    const targetRgb = hexToRgb(hex);
    let closestColor = Object.keys(colorMap)[0];
    let minDistance = colorDistance(targetRgb, colorMap[closestColor].rgb);

    Object.entries(colorMap).forEach(([color, config]) => {
      const distance = colorDistance(targetRgb, config.rgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    });

    const colorConfig = colorMap[closestColor];
    return {
      background: colorConfig.bg,
      text: colorConfig.text,
      border: colorConfig.border
    };
  };

  // Function to update genre color
  const updateGenreColor = (genre: string, color: string) => {
    const tailwindColors = hexToTailwindColor(color);
    setGenreColors(prev => ({
      ...prev,
      [genre]: tailwindColors
    }));
    setColorPickerOpen(null);
    toast({
      title: "Color Updated",
      description: `${genre} color has been updated successfully.`,
    });
  };

  // Function to update category color
  const updateCategoryColor = (category: string, color: string) => {
    const tailwindColors = hexToTailwindColor(color);
    setCategoryColors(prev => ({
      ...prev,
      [category]: tailwindColors
    }));
    setColorPickerOpen(null);
    toast({
      title: "Color Updated", 
      description: `${category} color has been updated successfully.`,
    });
  };

  // Function to open color picker
  const openColorPicker = (key: string, type: 'genre' | 'category') => {
    setEditingColorType(type);
    setColorPickerOpen(key);
    // Set initial color based on current color
    setTempColor('#3b82f6'); // Default blue
  };

  // Users query - use apiRequest from the query client to ensure proper authentication
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false,
    enabled: !!currentUser && currentUser.role === 'admin', // Only fetch if user is admin
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
        // Sync to localStorage for immediate access across the app
        localStorage.setItem(item.key, item.content);
      });
      setSiteContentValues(contentObject);
      return data;
    },
  });
  
  // Effect to automatically detect and add new genres/categories
  useEffect(() => {
    if (templates || emailTemplates) {
      const result = updateColorsFromTemplates(templates, emailTemplates);
      
      if (result.updated) {
        // Refresh local state with updated colors
        setGenreColors({ ...GENRE_COLORS });
        setCategoryColors({ ...CATEGORY_COLORS });
        
        // Show notification for new colors detected
        toast({
          title: "New Template Colors Detected",
          description: `Added colors for ${result.newGenres} genres and ${result.newCategories} categories.`,
        });
      }
    }
  }, [templates, emailTemplates, toast]);

  // Filter users based on search term
  const filteredUsers = users.filter((user: User) => {
    const searchTerm = userSearchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.role?.toLowerCase().includes(searchTerm)
    );
  });

  // Debug logging - only log when values change to avoid spam
  useEffect(() => {
    console.log('[AdminPanel] Users data changed:', { 
      count: users.length, 
      loading: usersLoading, 
      error: usersError?.message,
      currentUser: currentUser?.email,
      isAdmin: currentUser?.role === 'admin'
    });
    if (users.length > 0) {
      console.log('[AdminPanel] Sample user:', { 
        id: users[0].id, 
        email: users[0].email, 
        role: users[0].role 
      });
    }
  }, [users, usersLoading, usersError, currentUser]);

  // Filter templates based on search term
  const filteredTemplates = templates.filter((template: any) => {
    const searchTerm = templateSearchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(searchTerm) ||
      template.category?.toLowerCase().includes(searchTerm) ||
      template.genre?.toLowerCase().includes(searchTerm) ||
      template.concernedTeam?.toLowerCase().includes(searchTerm)
    );
  });

  // Filter email templates based on search term
  const filteredEmailTemplates = emailTemplates.filter((template: any) => {
    const searchTerm = emailTemplateSearchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(searchTerm) ||
      template.category?.toLowerCase().includes(searchTerm) ||
      template.genre?.toLowerCase().includes(searchTerm) ||
      template.concernedTeam?.toLowerCase().includes(searchTerm) ||
      template.subject?.toLowerCase().includes(searchTerm)
    );
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
      await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
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
        body: JSON.stringify({ 
          key, 
          content, 
          updatedBy: currentUser?.id 
        }),
      });
      if (!response.ok) throw new Error('Failed to update site content');
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Update localStorage for immediate UI consistency
      localStorage.setItem(variables.key, variables.content);
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
      toast({
        title: "Site content updated",
        description: "Changes synced to database and all users.",
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
              <TabsTrigger value="colors" className="text-xs lg:text-sm p-2 lg:p-3">
                <div className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 bg-gradient-to-r from-red-400 to-blue-400 rounded-full"></div>
                <span className="hidden lg:inline">Colors</span>
                <span className="lg:hidden">Colors</span>
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
              ) : usersError ? (
                <div className="text-red-600">Error loading users: {usersError.message}</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No users found in the system.</p>
                </div>
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

          <TabsContent value="colors" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Template Color Management</h3>
                <p className="text-sm text-slate-600">Customize badge colors for genres and categories</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Genre Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Genre Colors
                    </CardTitle>
                    <p className="text-sm text-slate-600">Configure colors for template genres</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(genreColors).map(([genre, colors]) => (
                        <div key={genre} className="flex items-center justify-between p-3 border dark:border-slate-600 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={`${colors.background} ${colors.text} ${colors.border} border`}>
                              {genre}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-6 h-6 rounded-full ${colors.background.replace('100', '500')} border-2 border-white dark:border-slate-300 shadow-sm`}
                              title={`Background: ${colors.background}, Text: ${colors.text}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openColorPicker(genre, 'genre')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Category Colors
                    </CardTitle>
                    <p className="text-sm text-slate-600">Configure colors for template categories</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(categoryColors).map(([category, colors]) => (
                        <div key={category} className="flex items-center justify-between p-3 border dark:border-slate-600 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={`${colors.background} ${colors.text} ${colors.border} border`}>
                              {category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-6 h-6 rounded-full ${colors.background.replace('100', '500')} border-2 border-white dark:border-slate-300 shadow-sm`}
                              title={`Background: ${colors.background}, Text: ${colors.text}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openColorPicker(category, 'category')}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to default colors
                    setGenreColors(GENRE_COLORS);
                    setCategoryColors(CATEGORY_COLORS);
                    toast({
                      title: "Colors Reset",
                      description: "Template colors have been reset to defaults.",
                    });
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2 dark:text-blue-100">Color System Information</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Genre colors are used for template type badges (urgent, standard, greeting, etc.)</li>
                  <li>• Category colors are used for template category badges (orders, delivery, technical, etc.)</li>
                  <li>• Colors sync automatically when changed - no manual sync required</li>
                  <li>• Changes apply immediately to all template cards and displays</li>
                  <li>• Use the color picker to customize any badge color to match your brand</li>
                </ul>
              </div>

              {/* Color Picker Modal */}
              {colorPickerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold dark:text-white">
                        Choose Color for "{colorPickerOpen}"
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setColorPickerOpen(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <HexColorPicker
                          color={tempColor}
                          onChange={setTempColor}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border-2 border-gray-300"
                          style={{ backgroundColor: tempColor }}
                        />
                        <Input
                          value={tempColor}
                          onChange={(e) => setTempColor(e.target.value)}
                          placeholder="#3b82f6"
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (editingColorType === 'genre') {
                              updateGenreColor(colorPickerOpen, tempColor);
                            } else {
                              updateCategoryColor(colorPickerOpen, tempColor);
                            }
                          }}
                          className="flex-1"
                        >
                          Apply Color
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setColorPickerOpen(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
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

              {/* User Activity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Activity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Users:</span>
                        <Badge variant="secondary">{users?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Users:</span>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {users?.filter(u => u.status === 'active').length || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Online Now:</span>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {users?.filter(u => u.isOnline).length || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Admin Users:</span>
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          {users?.filter(u => u.role === 'admin').length || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blocked/Banned:</span>
                        <Badge variant="destructive">
                          {users?.filter(u => u.status === 'blocked' || u.status === 'banned').length || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Template Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Live Chat Templates:</span>
                        <Badge variant="secondary">{templates?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Email Templates:</span>
                        <Badge variant="secondary">{emailTemplates?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Templates:</span>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {templates?.filter((t: any) => t.isActive).length || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Usage Count:</span>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {templates?.reduce((sum: number, t: any) => sum + (t.usageCount || 0), 0) || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Unique Genres:</span>
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          {new Set([...templates?.map((t: any) => t.genre) || [], ...emailTemplates?.map((t: any) => t.genre) || []]).size}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Online Users Details */}
              {users?.filter(u => u.isOnline).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-500" />
                      Currently Online Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {users?.filter(u => u.isOnline).map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{user.email}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">System Status</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p>✓ Supabase database connected and synchronized</p>
                  <p>✓ Real-time user presence tracking enabled</p>
                  <p>✓ Template color management system active</p>
                  <p>✓ Analytics dashboard updating in real-time</p>
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

                {/* Universal Variables Card */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowVariableManager(true)}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Variable Manager
                    </CardTitle>
                    <p className="text-sm text-slate-600">Manage all template variables system-wide</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Variables:</span>
                        <span className="font-medium">{(() => {
                          const variables = localStorage.getItem('system_template_variables');
                          return variables ? JSON.parse(variables).length : 18;
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

      {/* Universal Variable Manager */}
      <VariableManager isOpen={showVariableManager} onClose={() => setShowVariableManager(false)} />
      </DialogContent>
    </Dialog>
  );
}
