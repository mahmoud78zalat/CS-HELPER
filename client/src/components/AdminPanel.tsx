import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp, Edit3, Trash2, Search, Upload, Globe, BarChart3, Mail, MessageSquare, Palette, Megaphone, Info, CheckCircle, Save, Loader2, HelpCircle, FolderOpen
} from "lucide-react";
import { User, Template, EmailTemplate } from "@shared/schema";
import TemplateFormModal from "@/components/TemplateFormModal";
import TemplateConfigManager from "@/components/TemplateConfigManager";
import { SimpleTemplateConfigManager } from "@/components/SimpleTemplateConfigManager";


import DragDropEmailTemplates from "@/components/DragDropEmailTemplates";
import HorizontalGroupedTemplates from "@/components/HorizontalGroupedTemplates";
import GroupManager from "@/components/GroupManager";
import FAQEditor from "@/components/FAQEditor";

import { GENRE_COLORS, CATEGORY_COLORS, syncColorsToSupabase, getAllGenres, getAllCategories, updateColorsFromTemplates, loadColorsFromDatabase, getGenreColor, getCategoryColor } from "@/lib/templateColors";
import { HexColorPicker } from 'react-colorful';
// Removed QUICK_TEMPLATE_STARTERS import as it's no longer needed

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('announcements');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isEmailTemplate, setIsEmailTemplate] = useState(false); // Track template type
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [emailTemplateSearchTerm, setEmailTemplateSearchTerm] = useState('');
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const [siteContentValues, setSiteContentValues] = useState<{[key: string]: string}>({});
  const [genreColors, setGenreColors] = useState<Record<string, any>>({});
  const [categoryColors, setCategoryColors] = useState<Record<string, any>>({});
  const [groupColors, setGroupColors] = useState<Record<string, any>>({});
  
  // Fetch dynamic categories and genres - Force fresh data
  const { data: dynamicGenres = [], isLoading: genresLoading, refetch: refetchGenres } = useQuery<{id: string, name: string, description: string, isActive: boolean}[]>({
    queryKey: ['/api/template-genres'],
    staleTime: 0,
  });
  
  const { data: dynamicEmailCategories = [], isLoading: emailCategoriesLoading, refetch: refetchEmailCategories } = useQuery<{id: string, name: string, description: string, isActive: boolean}[]>({
    queryKey: ['/api/email-categories'],
    staleTime: 0,
  });
  
  const { data: dynamicTemplateCategories = [], isLoading: templateCategoriesLoading, refetch: refetchTemplateCategories } = useQuery<{id: string, name: string, description: string, isActive: boolean}[]>({
    queryKey: ['/api/template-categories'],
    staleTime: 0,
  });

  // Add concerned teams query for configuration manager count
  const { data: concernedTeamsData = [] } = useQuery<{id: string, name: string, description: string, isActive: boolean}[]>({
    queryKey: ['/api/concerned-teams'],
    staleTime: 0,
  });



  // Force refetch on component mount and load saved colors
  useEffect(() => {
    refetchGenres();
    refetchEmailCategories();
    refetchTemplateCategories();
    
    // Load saved colors from database on component mount
    loadColorsFromDatabase().then(() => {
      console.log('[AdminPanel] Colors loaded from database on mount');
    });
  }, [refetchGenres, refetchEmailCategories, refetchTemplateCategories]);

  // Debug logging
  useEffect(() => {
    console.log('[AdminPanel] Dynamic data status:', {
      genres: { count: (dynamicGenres as any[]).length, loading: genresLoading, data: dynamicGenres },
      emailCategories: { count: (dynamicEmailCategories as any[]).length, loading: emailCategoriesLoading, data: dynamicEmailCategories },
      templateCategories: { count: (dynamicTemplateCategories as any[]).length, loading: templateCategoriesLoading, data: dynamicTemplateCategories }
    });
  }, [dynamicGenres, dynamicEmailCategories, dynamicTemplateCategories, genresLoading, emailCategoriesLoading, templateCategoriesLoading]);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState<string>('#3b82f6');
  const [editingColorType, setEditingColorType] = useState<'genre' | 'category' | 'group'>('genre');
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  
  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderColor: '#1d4ed8',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    isActive: true
  });

  // Modern confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'template' | 'emailTemplate' | 'announcement' | 'user' | 'group' | 'category' | 'genre' | 'faq';
    item: any;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'template',
    item: null,
    title: '',
    description: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to show modern delete confirmation
  const showDeleteConfirmation = (type: typeof deleteConfirmation.type, item: any, customTitle?: string, customDescription?: string) => {
    const confirmations = {
      template: {
        title: `Delete Template "${item.name}"`,
        description: `Are you sure you want to delete this live reply template? This action cannot be undone.`
      },
      emailTemplate: {
        title: `Delete Email Template "${item.name}"`,
        description: `Are you sure you want to delete this email template? This action cannot be undone.`
      },
      announcement: {
        title: `Delete Announcement "${item.title}"`,
        description: `Are you sure you want to delete this announcement? This action cannot be undone.`
      },
      user: {
        title: `Delete User "${item.email}"`,
        description: `Are you sure you want to delete this user account? This action cannot be undone.`
      },
      group: {
        title: `Delete Group "${item.name}"`,
        description: `Are you sure you want to delete this group? This action cannot be undone.`
      },
      category: {
        title: `Delete Category "${item.name}"`,
        description: `Are you sure you want to delete "${item.name}"? This will also delete all associated genres.`
      },
      genre: {
        title: `Delete Genre "${item.name}"`,
        description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
      },
      faq: {
        title: `Delete FAQ`,
        description: `Are you sure you want to delete this FAQ? This action cannot be undone.`
      }
    };

    const config = confirmations[type];
    setDeleteConfirmation({
      isOpen: true,
      type,
      item,
      title: customTitle || config.title,
      description: customDescription || config.description
    });
  };

  // Helper function to handle confirmed deletion
  const handleConfirmedDelete = async () => {
    const { type, item } = deleteConfirmation;
    
    try {
      switch (type) {
        case 'template':
          await deleteLiveTemplateMutation.mutateAsync(item.id);
          break;
        case 'emailTemplate':
          await deleteEmailTemplateMutation.mutateAsync(item.id);
          break;
        case 'announcement':
          await deleteAnnouncementMutation.mutateAsync(item.id);
          break;
        case 'user':
          await deleteUserMutation.mutateAsync(item.id);
          break;
        default:
          console.error('Unknown delete type:', type);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Initialize colors from dynamic data with proper fallback chain
  useEffect(() => {
    // Initialize genre colors from dynamic data
    const initialGenreColors: Record<string, any> = {};
    (dynamicGenres as any[]).forEach(genre => {
      const genreKey = genre.name.toLowerCase();
      if (!genreColors[genreKey]) {
        // Use proper fallback chain: static config -> library function -> default
        const staticColor = GENRE_COLORS[genreKey];
        const libraryColor = getGenreColor(genre.name);
        initialGenreColors[genreKey] = staticColor || libraryColor || {
          background: 'bg-blue-100 dark:bg-blue-900',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-700'
        };
      }
    });
    
    // Initialize category colors from both email and template categories
    const initialCategoryColors: Record<string, any> = {};
    [...(dynamicEmailCategories as any[]), ...(dynamicTemplateCategories as any[])].forEach(category => {
      const categoryKey = category.name.toLowerCase();
      if (!categoryColors[categoryKey]) {
        // Use proper fallback chain: static config -> library function -> default
        const staticColor = CATEGORY_COLORS[categoryKey];
        const libraryColor = getCategoryColor(category.name);
        initialCategoryColors[categoryKey] = staticColor || libraryColor || {
          background: 'bg-green-100 dark:bg-green-900',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-700'
        };
      }
    });
    
    if (Object.keys(initialGenreColors).length > 0) {
      setGenreColors(prev => ({ ...prev, ...initialGenreColors }));
    }
    
    if (Object.keys(initialCategoryColors).length > 0) {
      setCategoryColors(prev => ({ ...prev, ...initialCategoryColors }));
    }
  }, [dynamicGenres, dynamicEmailCategories, dynamicTemplateCategories, genreColors, categoryColors]);

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

  // Function to update genre color - now saves to database
  const updateGenreColor = async (genre: string, color: string) => {
    try {
      const tailwindColors = hexToTailwindColor(color);
      
      // Save to database via bypass API route
      const response = await fetch('/api/create-color-setting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: 'genre',
          entityName: genre.toLowerCase(),
          backgroundColor: tailwindColors.background,
          textColor: tailwindColors.text,
          borderColor: tailwindColors.border,
        }),
      });

      if (response.ok) {
        // Update local state and reload colors from database to ensure consistency
        setGenreColors(prev => ({
          ...prev,
          [genre]: tailwindColors
        }));
        
        // Reload colors from database to update the static color objects
        await loadColorsFromDatabase();
        
        setColorPickerOpen(null);
        toast({
          title: "Color Updated",
          description: `${genre} color has been saved and synchronized successfully.`,
          duration: 3000,
        });
      } else {
        throw new Error('Failed to save color settings');
      }
    } catch (error) {
      console.error('Error updating genre color:', error);
      toast({
        title: "Error",
        description: `Failed to save ${genre} color. Changes not persisted.`,
        variant: "destructive",
        duration: 5000,
      });
      // Still update local state for immediate visual feedback
      const tailwindColors = hexToTailwindColor(color);
      setGenreColors(prev => ({
        ...prev,
        [genre]: tailwindColors
      }));
      setColorPickerOpen(null);
    }
  };

  // Function to update category color - now saves to database
  const updateCategoryColor = async (category: string, color: string) => {
    try {
      const tailwindColors = hexToTailwindColor(color);
      
      // Save to database via bypass API route
      const response = await fetch('/api/create-color-setting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: 'category',
          entityName: category.toLowerCase(),
          backgroundColor: tailwindColors.background,
          textColor: tailwindColors.text,
          borderColor: tailwindColors.border,
        }),
      });

      if (response.ok) {
        // Update local state and reload colors from database to ensure consistency
        setCategoryColors(prev => ({
          ...prev,
          [category]: tailwindColors
        }));
        
        // Reload colors from database to update the static color objects
        await loadColorsFromDatabase();
        
        setColorPickerOpen(null);
        toast({
          title: "Color Updated", 
          description: `${category} color has been saved and synchronized successfully.`,
          duration: 3000,
        });
      } else {
        throw new Error('Failed to save color settings');
      }
    } catch (error) {
      console.error('Error updating category color:', error);
      toast({
        title: "Error",
        description: `Failed to save ${category} color. Changes not persisted.`,
        variant: "destructive",
        duration: 5000,
      });
      // Still update local state for immediate visual feedback
      const tailwindColors = hexToTailwindColor(color);
      setCategoryColors(prev => ({
        ...prev,
        [category]: tailwindColors
      }));
      setColorPickerOpen(null);
    }
  };

  // Function to update group color
  const updateGroupColor = async (groupId: string, color: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/live-reply-template-groups/${groupId}`, {
        color: color
      });
      
      if (response.ok) {
        const updatedGroup = await response.json();
        
        // Update local state
        setGroupColors(prev => ({
          ...prev,
          [groupId]: color
        }));
        
        // Update the template groups query cache
        queryClient.setQueryData(['/api/live-reply-template-groups'], (old: any) => {
          const oldGroups = Array.isArray(old) ? old : [];
          return oldGroups.map((group: any) => 
            group.id === groupId ? { ...group, color: color } : group
          );
        });
        
        setColorPickerOpen(null);
        toast({
          title: "Group Color Updated",
          description: `Group color has been saved successfully.`,
        });
      } else {
        throw new Error('Failed to update group color');
      }
    } catch (error) {
      console.error('Error updating group color:', error);
      toast({
        title: "Error",
        description: `Failed to update group color.`,
        variant: "destructive",
      });
      setColorPickerOpen(null);
    }
  };

  // Function to open color picker
  const openColorPicker = (key: string, type: 'genre' | 'category' | 'group') => {
    setEditingColorType(type);
    setColorPickerOpen(key);
    // Set initial color based on current color
    setTempColor('#3b82f6'); // Default blue
  };

  // Users query - use admin endpoint that bypasses Vite interception
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: 5, // Increased retries for Railway deployment
    retryDelay: 2000, // 2 seconds between retries
    enabled: !!currentUser, // Always enabled when user exists - we'll check admin status later
    staleTime: 1000, // Consider data fresh for only 1 second for real-time status
    gcTime: 5000, // Shorter cache time to ensure fresh status updates
    refetchInterval: 3000, // Refresh every 3 seconds for live status updates
    queryFn: async () => {
      console.log('[AdminPanel] Fetching users via admin endpoint...');
      console.log('[AdminPanel] Current user:', currentUser?.email, currentUser?.role);
      
      if (!currentUser) {
        throw new Error('No current user available');
      }
      
      // Try multiple endpoints for Railway compatibility
      const urls = [
        '/api/admin/users', // Primary endpoint
        '/api/users', // Fallback endpoint
      ];
      
      for (const url of urls) {
        try {
          console.log('[AdminPanel] Trying URL:', url);
          const response = await fetch(url, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'x-user-id': currentUser.id,
              'X-User-Email': currentUser.email || '',
              'X-User-Role': currentUser.role || '',
            },
            credentials: 'include',
          });
          
          console.log('[AdminPanel] Response status:', response.status);
          console.log('[AdminPanel] Response content-type:', response.headers.get('content-type'));
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log('[AdminPanel] Request failed with status:', response.status, 'Error:', errorText);
            continue;
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            console.log('[AdminPanel] Non-JSON response from:', url);
            continue;
          }
          
          const data = await response.json();
          console.log('[AdminPanel] Users fetched successfully from:', url, '- Count:', data.length);
          console.log('[AdminPanel] Setting users loading to false, data:', data);
          return data;
        } catch (error) {
          console.log('[AdminPanel] Error with URL:', url, error);
          continue;
        }
      }
      
      throw new Error('Failed to fetch users from all endpoints');
    },
  });

  // Templates query with real-time updates
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<Template[]>({
    queryKey: ['/api/live-reply-templates'],
    retry: false,
    staleTime: 5000, // 5 seconds for real-time feel
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Live reply template groups query with enhanced error handling and real-time updates
  const { data: templateGroups = [], isLoading: groupsLoading, error: groupsError, refetch: refetchGroups } = useQuery({
    queryKey: ['/api/live-reply-template-groups'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/live-reply-template-groups');
        const result = await response.json();
        console.log('[AdminPanel] Template groups fetched:', result);
        console.log('[AdminPanel] Template groups type:', typeof result);
        console.log('[AdminPanel] Template groups isArray:', Array.isArray(result));
        
        // Handle different response formats
        if (Array.isArray(result)) {
          return result;
        } else if (result && typeof result === 'object' && result.data && Array.isArray(result.data)) {
          return result.data;
        } else if (result && typeof result === 'object') {
          // If it's an object but not an array, convert to array or return empty
          console.warn('[AdminPanel] Unexpected response format for groups:', result);
          return [];
        } else {
          console.warn('[AdminPanel] Invalid response for groups:', result);
          return [];
        }
      } catch (error) {
        console.error('Failed to load template groups:', error);
        // Return empty array on error to prevent crashes
        return [];
      }
    },
    retry: 3,
    staleTime: 2000, // Shorter stale time for real-time feel
    refetchInterval: 8000, // Auto-refresh every 8 seconds
    onError: (error: any) => {
      console.error('Failed to load template groups:', error);
      toast({
        title: "Failed to load template groups",
        description: "The table may need to be created in Supabase. Check console for details.",
        variant: "destructive"
      });
    }
  });

  // Debug logging for groups
  useEffect(() => {
    console.log('[AdminPanel] Groups state:', { 
      groups: templateGroups, 
      loading: groupsLoading, 
      error: groupsError 
    });
  }, [templateGroups, groupsLoading, groupsError]);

  // Email Templates query with proper typing
  const { data: emailTemplates = [], isLoading: emailTemplatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
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

  // Announcements query
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useQuery<any[]>({
    queryKey: ['/api/announcements'],
    retry: false,
    enabled: !!currentUser && currentUser.role === 'admin',
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      console.log('[DEBUG] Creating announcement:', announcementData);
      return apiRequest('POST', '/api/announcements', {
        ...announcementData,
        createdBy: currentUser?.id,
      });
    },
    onSuccess: async (data) => {
      console.log('[DEBUG] Announcement created successfully:', data);
      toast({
        title: "Announcement Created",
        description: "Your announcement has been created successfully.",
      });
      setShowAnnouncementForm(false);
      setAnnouncementForm({
        title: '',
        content: '',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        borderColor: '#1d4ed8',
        priority: 'medium',
        isActive: true
      });
      
      console.log('[DEBUG] About to invalidate and refetch announcements');
      // Invalidate and refetch announcements data
      await queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      await queryClient.refetchQueries({ queryKey: ['/api/announcements'] });
      console.log('[DEBUG] Finished invalidating and refetching announcements');
    },
    // Prevent duplicate requests
    retry: false,
    gcTime: 0,
    onError: (error: any) => {
      toast({
        title: "Error Creating Announcement",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/announcements/${id}`);
    },
    onSuccess: async () => {
      toast({
        title: "Announcement Deleted",
        description: "The announcement has been deleted successfully.",
      });
      // Invalidate and refetch announcements data
      await queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      await queryClient.refetchQueries({ queryKey: ['/api/announcements'] });
      // Broadcast real-time update to all users
      await realTimeService.broadcastAnnouncementUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Announcement",
        description: error.message || "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  // Re-announce mutation
  const reAnnounceMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[DEBUG] Re-announcing announcement:', id);
      return apiRequest('POST', `/api/announcements/${id}/re-announce`);
    },
    onSuccess: async (data, variables) => {
      console.log('[DEBUG] Re-announcement successful for:', variables);
      toast({
        title: "Re-announcement Successful",
        description: "The announcement will now show to all users again.",
      });
      console.log('[DEBUG] About to invalidate and refetch after re-announce');
      // Invalidate and refetch announcements data
      await queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      await queryClient.refetchQueries({ queryKey: ['/api/announcements'] });
      // Broadcast real-time update to all users
      await realTimeService.broadcastAnnouncementUpdate();
      console.log('[DEBUG] Finished invalidating and refetching after re-announce');
    },
    // Prevent duplicate requests
    retry: false,
    gcTime: 0,
    onError: (error: any) => {
      toast({
        title: "Error Re-announcing",
        description: error.message || "Failed to re-announce",
        variant: "destructive",
      });
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
  const filteredUsers = (users as User[]).filter((user: User) => {
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
  const filteredTemplates = (templates as Template[]).filter((template: any) => {
    const searchTerm = templateSearchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(searchTerm) ||
      template.category?.toLowerCase().includes(searchTerm) ||
      template.genre?.toLowerCase().includes(searchTerm) ||
      template.concernedTeam?.toLowerCase().includes(searchTerm)
    );
  });

  // Filter email templates based on search term
  const filteredEmailTemplates = (emailTemplates as EmailTemplate[]).filter((template: any) => {
    const searchTerm = emailTemplateSearchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(searchTerm) ||
      template.category?.toLowerCase().includes(searchTerm) ||
      template.genre?.toLowerCase().includes(searchTerm) ||
      template.concernedTeam?.toLowerCase().includes(searchTerm) ||
      template.subject?.toLowerCase().includes(searchTerm)
    );
  });



  // User role mutation
  const userRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    },
    onMutate: async ({ userId, role }) => {
      // Cancel any outgoing refetches to avoid optimistic update conflicts
      await queryClient.cancelQueries({ queryKey: ['/api/admin/users'] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData(['/api/admin/users']);

      // Optimistically update to the new value
      queryClient.setQueryData(['/api/admin/users'], (old: User[]) => {
        if (!old) return old;
        return old.map(user => 
          user.id === userId 
            ? { ...user, role: role as 'admin' | 'agent', updatedAt: new Date() }
            : user
        );
      });

      // Return a context object with the snapshotted value
      return { previousUsers };
    },
    onSuccess: async () => {
      // Invalidate and refetch for real-time updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/users'] })
      ]);
      
      // Broadcast user update to all connected users
      await realTimeService.broadcastUserUpdate();
      toast({
        title: "Role updated",
        description: "User permissions changed successfully",
        duration: 3000,
      });
    },
    onError: (err, variables, context) => {
      // If the mutation fails, rollback to the previous value
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/admin/users'], context.previousUsers);
      }
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

  // User delete mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      // Broadcast real-time update to all users
      await realTimeService.broadcastUserUpdate();
      toast({
        title: "User deleted",
        description: "User has been permanently removed from the system",
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
        description: "Unable to delete user. Please try again.",
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
      await queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
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
      const response = await apiRequest('DELETE', `/api/email-templates/${templateId}`);
      return response;
    },
    onSuccess: async () => {
      // Force immediate local cache refresh
      queryClient.removeQueries({ queryKey: ['/api/email-templates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/email-templates'] });
      
      // Broadcast real-time update to all other users
      await realTimeService.broadcastEmailTemplateUpdate();
      
      toast({
        title: "Email template deleted",
        description: "Successfully removed from system",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Email template deletion error:', error);
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

  // Announcement form handlers
  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] Form submission handler called');
    
    // Prevent double submission
    if (createAnnouncementMutation.isPending) {
      console.log('[DEBUG] Mutation already pending, ignoring submit');
      return;
    }
    
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required fields.",
        variant: "destructive",
      });
      return;
    }

    console.log('[DEBUG] About to call createAnnouncementMutation.mutate with:', announcementForm);
    createAnnouncementMutation.mutate(announcementForm);
  };

  const handleAnnouncementFormChange = (field: string, value: any) => {
    setAnnouncementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteAnnouncement = (id: string) => {
    deleteAnnouncementMutation.mutate(id);
  };

  const handleReAnnounce = (id: string) => {
    console.log('[DEBUG] handleReAnnounce called with id:', id);
    
    // Prevent double submission
    if (reAnnounceMutation.isPending) {
      console.log('[DEBUG] Re-announce mutation already pending, ignoring call');
      return;
    }
    
    reAnnounceMutation.mutate(id);
  };

  const handleUserRoleChange = (userId: string, role: string) => {
    userRoleMutation.mutate({ userId, role });
  };

  // Group creation mutation for live reply templates
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      console.log('[AdminPanel] Creating group with data:', groupData);
      console.log('[AdminPanel] Current user context:', currentUser);
      console.log('[AdminPanel] Template groups length:', templateGroups.length);
      
      const requestPayload = {
        name: groupData.name,
        description: groupData.description || '',
        color: groupData.color,
        orderIndex: templateGroups.length || 0,
        isActive: true
      };
      
      console.log('[AdminPanel] Request payload:', requestPayload);
      
      try {
        const response = await apiRequest('POST', '/api/live-reply-template-groups', requestPayload);
        const result = await response.json();
        console.log('[AdminPanel] Group creation response:', result);
        return result;
      } catch (error) {
        console.error('[AdminPanel] Group creation apiRequest failed:', error);
        console.log('[AdminPanel] Error details:', {
          message: error?.message,
          status: error?.status,
          response: error?.response
        });
        throw error;
      }
    },
    onMutate: async (groupData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/live-reply-template-groups'] });

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(['/api/live-reply-template-groups']);

      // Optimistically add the new group
      const tempGroup = {
        id: `temp-${Date.now()}`,
        name: groupData.name,
        description: groupData.description || '',
        color: groupData.color,
        orderIndex: templateGroups.length || 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      queryClient.setQueryData(['/api/live-reply-template-groups'], (old: any) => {
        const oldGroups = Array.isArray(old) ? old : [];
        return [...oldGroups, tempGroup];
      });

      return { previousGroups, tempGroup };
    },
    onSuccess: async (newGroup, variables, context) => {
      console.log('[AdminPanel] Group creation successful, invalidating queries...', newGroup);
      
      // Remove optimistic update and add real data
      queryClient.setQueryData(['/api/live-reply-template-groups'], (old: any) => {
        const oldGroups = Array.isArray(old) ? old : [];
        // Remove temp group and add real group
        const filteredGroups = oldGroups.filter(g => g.id !== context?.tempGroup?.id);
        return [...filteredGroups, newGroup];
      });
      
      // Force complete cache refresh for real-time updates
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] }),
        queryClient.refetchQueries({ queryKey: ['/api/live-reply-template-groups'] })
      ]);
      
      toast({
        title: "Success",
        description: "Template group created successfully!",
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousGroups) {
        queryClient.setQueryData(['/api/live-reply-template-groups'], context.previousGroups);
      }
      
      console.error('[AdminPanel] Group creation mutation error:', error);
      console.log('[AdminPanel] Error type:', typeof error);
      console.log('[AdminPanel] Error keys:', Object.keys(error || {}));
      
      toast({
        title: "Error",
        description: `Failed to create template group: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Group update mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/live-reply-template-groups/${id}`, data);
      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      await refetchGroups();
      toast({
        title: "Success",
        description: "Template group updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Group update error:', error);
      toast({
        title: "Error",
        description: "Failed to update template group",
        variant: "destructive",
      });
    },
  });

  // Live Chat Template create mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/live-reply-templates', templateData);
      return await response.json();
    },
    onSuccess: async () => {
      // Force immediate local cache refresh
      queryClient.removeQueries({ queryKey: ['/api/live-reply-templates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/live-reply-templates'] });
      refetchTemplates(); // Force immediate refresh
      
      // Broadcast real-time update to all other users
      await realTimeService.broadcastTemplateUpdate();
      
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Live chat template created successfully!",
      });
    },
    onError: (error) => {
      console.error('Live template creation error:', error);
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
      const response = await apiRequest('PUT', `/api/live-reply-templates/${id}`, data);
      return await response.json();
    },
    onSuccess: async () => {
      // Force immediate local cache refresh
      queryClient.removeQueries({ queryKey: ['/api/live-reply-templates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/live-reply-templates'] });
      refetchTemplates(); // Force immediate refresh
      
      // Broadcast real-time update to all other users
      await realTimeService.broadcastTemplateUpdate();
      
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success", 
        description: "Live chat template updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Live template update error:', error);
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
      console.log('[AdminPanel] Creating email template with data:', templateData);
      const response = await apiRequest('POST', '/api/email-templates', templateData);
      return await response.json();
    },
    onSuccess: async () => {
      // Immediate local updates for current session
      queryClient.removeQueries({ queryKey: ['/api/email-templates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/email-templates'] });
      
      // Broadcast real-time update to all other users
      await realTimeService.broadcastEmailTemplateUpdate();
      
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Email template created successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Email template creation error:', error);
      const errorMessage = error?.message || error?.error || 'Failed to create email template';
      const details = error?.errors ? error.errors.map((e: any) => e.message).join(', ') : '';
      toast({
        title: "Error",
        description: details ? `${errorMessage}: ${details}` : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Email Template update mutation  
  const updateEmailTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log('[AdminPanel] 🚀 Starting email template update:', id, 'with data:', data);
      
      // Retry logic for network issues
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[AdminPanel] Attempt ${attempt}/3 for template ${id}`);
          const response = await apiRequest('PUT', `/api/email-templates/${id}`, data);
          console.log('[AdminPanel] ✅ Update request successful, response:', response.status);
          const result = await response.json();
          console.log('[AdminPanel] 📦 Update result:', result);
          return result;
        } catch (error) {
          console.error(`[AdminPanel] ❌ Attempt ${attempt} failed:`, error);
          lastError = error;
          
          // If it's not a network error or last attempt, rethrow immediately
          if (attempt === 3 || (error as any)?.message?.includes('400')) {
            throw error;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
      
      throw lastError;
    },
    onSuccess: async () => {
      // Force complete cache refresh for email templates (immediate local update)
      queryClient.removeQueries({ queryKey: ['/api/email-templates'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/email-templates'] });
      
      // Also invalidate template usage data if it exists
      queryClient.invalidateQueries({ queryKey: ['/api/email-template-usage'] });
      
      // Broadcast real-time update to all other users
      await realTimeService.broadcastEmailTemplateUpdate();
      
      // Close form and clear editing state
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setIsEmailTemplate(false);
      
      // Add a small delay to ensure UI updates properly
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Email template updated successfully!",
        });
      }, 100);
    },
    onError: (error: any) => {
      console.error('Email template update error:', error);
      const errorMessage = error?.message || error?.error || 'Failed to update email template';
      const details = error?.errors ? error.errors.map((e: any) => e.message).join(', ') : '';
      toast({
        title: "Error",
        description: details ? `${errorMessage}: ${details}` : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete mutations
  const deleteLiveTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      console.log('[AdminPanel] 🗑️ Deleting live template:', templateId);
      await apiRequest('DELETE', `/api/live-reply-templates/${templateId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      await queryClient.refetchQueries({ queryKey: ['/api/live-reply-templates'] });
      toast({
        title: "Template deleted",
        description: "Live reply template deleted successfully",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('[AdminPanel] ❌ Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });






  const handleDeleteTemplate = async (templateId: string) => {
    // Find the template by ID to get the full template object
    const template = (templates as any[]).find(t => t.id === templateId);
    if (template) {
      showDeleteConfirmation('template', template);
    } else {
      console.error('Template not found for deletion:', templateId);
      toast({
        title: "Error",
        description: "Template not found",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDeleteEmailTemplate = (templateId: string) => {
    // Find the full template object from the filtered email templates
    const template = filteredEmailTemplates.find(t => t.id === templateId);
    if (template) {
      showDeleteConfirmation('emailTemplate', template);
    } else {
      console.error('Email template not found for deletion:', templateId);
      toast({
        title: "Error",
        description: "Email template not found",
        variant: "destructive",
        duration: 5000,
      });
    }
  };



  // Admin access check - placed AFTER all hooks are called
  console.log('AdminPanel - Current user:', currentUser);
  console.log('AdminPanel - User email:', currentUser?.email);
  console.log('AdminPanel - User role:', currentUser?.role);
  
  // Admin access check - temporarily allow all authenticated users for beta testing
  const isAdmin = true; // Temporarily disabled admin restriction for beta testing
  
  // Remove auto-close to prevent premature closing during authentication
  
  // HANDLE CONDITIONAL RENDERING AFTER ALL HOOKS ARE CALLED
  if (authLoading) {
    // Still loading user data
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogTitle>Loading</DialogTitle>
          <div className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Authenticating...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentUser) {
    // No user authenticated - show access denied
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogTitle>Access Denied</DialogTitle>
          <div className="p-6 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">
              Please log in to access the admin panel.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
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
              <TabsTrigger value="announcements" className="text-xs lg:text-sm p-2 lg:p-3">
                <Megaphone className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Announcements</span>
                <span className="lg:hidden">News</span>
              </TabsTrigger>
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
              <TabsTrigger value="sitecontent" className="text-xs lg:text-sm p-2 lg:p-3">
                <Settings className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Site Content</span>
                <span className="lg:hidden">Content</span>
              </TabsTrigger>


            </TabsList>

          <TabsContent value="announcements" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Announcement Management</h3>
                <Button
                  onClick={() => setShowAnnouncementForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">How Announcements Work</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                      <li>• Announcements appear as centered modals to all users</li>
                      <li>• Users must click "Got it" to acknowledge and dismiss announcements</li>
                      <li>• Priority levels determine display order (urgent, high, medium, low)</li>
                      <li>• Only active announcements are shown to users</li>
                      <li>• Rich HTML content is supported with custom colors</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    All Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {announcementsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading announcements...</p>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-8">
                      <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No announcements created yet.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Create your first announcement to broadcast messages to all users.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement: any) => (
                        <div
                          key={announcement.id}
                          className="border rounded-lg p-4"
                          style={{
                            backgroundColor: announcement.backgroundColor + '10',
                            borderColor: announcement.borderColor,
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{announcement.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={announcement.priority === 'urgent' ? 'destructive' : 
                                          announcement.priority === 'high' ? 'default' : 'secondary'}
                                >
                                  {announcement.priority}
                                </Badge>
                                <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                                  {announcement.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReAnnounce(announcement.id)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Re-announce to all users (even those who clicked 'Got it')"
                              >
                                <Megaphone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAnnouncementForm({
                                    title: announcement.title,
                                    content: announcement.content,
                                    backgroundColor: announcement.backgroundColor,
                                    textColor: announcement.textColor,
                                    borderColor: announcement.borderColor,
                                    priority: announcement.priority,
                                    isActive: announcement.isActive
                                  });
                                  setShowAnnouncementForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div 
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: announcement.content }}
                          />
                          <div className="text-xs text-gray-500 mt-2">
                            Created: {new Date(announcement.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Announcement Form Dialog */}
              <Dialog open={showAnnouncementForm} onOpenChange={setShowAnnouncementForm}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={announcementForm.title}
                        onChange={(e) => handleAnnouncementFormChange('title', e.target.value)}
                        placeholder="Enter announcement title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        value={announcementForm.content}
                        onChange={(e) => handleAnnouncementFormChange('content', e.target.value)}
                        placeholder="Enter announcement content (HTML supported)"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={announcementForm.backgroundColor}
                            onChange={(e) => handleAnnouncementFormChange('backgroundColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={announcementForm.backgroundColor}
                            onChange={(e) => handleAnnouncementFormChange('backgroundColor', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="textColor">Text Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="textColor"
                            type="color"
                            value={announcementForm.textColor}
                            onChange={(e) => handleAnnouncementFormChange('textColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={announcementForm.textColor}
                            onChange={(e) => handleAnnouncementFormChange('textColor', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="borderColor">Border Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="borderColor"
                            type="color"
                            value={announcementForm.borderColor}
                            onChange={(e) => handleAnnouncementFormChange('borderColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={announcementForm.borderColor}
                            onChange={(e) => handleAnnouncementFormChange('borderColor', e.target.value)}
                            placeholder="#1d4ed8"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={announcementForm.priority} onValueChange={(value) => handleAnnouncementFormChange('priority', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 mt-6">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={announcementForm.isActive}
                          onChange={(e) => handleAnnouncementFormChange('isActive', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="isActive">Active (show to users immediately)</Label>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border rounded-lg p-4">
                      <Label className="text-sm font-medium mb-2 block">Preview:</Label>
                      <div
                        className="rounded-lg p-4 border-2"
                        style={{
                          backgroundColor: announcementForm.backgroundColor,
                          color: announcementForm.textColor,
                          borderColor: announcementForm.borderColor,
                        }}
                      >
                        <h4 className="font-bold text-lg mb-2">
                          {announcementForm.title || 'Announcement Title'}
                        </h4>
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: announcementForm.content || 'Your announcement content will appear here...' 
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAnnouncementForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAnnouncementMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createAnnouncementMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Announcement
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

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
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <div className="text-slate-600">Loading users...</div>
                  <div className="text-xs text-slate-400">
                    Current User: {currentUser?.email} ({currentUser?.role})
                  </div>
                  <div className="text-xs text-slate-400">
                    Query Enabled: {!!currentUser && currentUser.role === 'admin' ? 'Yes' : 'No'}
                  </div>
                </div>
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
                      <TableHead>Online Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'} 
                            className={user.role === 'agent' ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' : ''}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.isOnline ? "default" : "secondary"} className="flex items-center space-x-1">
                              <div className={`h-2 w-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                              <span>{user.isOnline ? 'Online' : 'Offline'}</span>
                            </Badge>
                          </div>
                          {user.lastSeen && (
                            <div className="text-xs text-slate-500 mt-1">
                              Last seen: {new Date(user.lastSeen).toLocaleDateString()} at {new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={user.id === currentUser?.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete {user.firstName} {user.lastName}? 
                                  This action cannot be undone and will remove all their data from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Template Management</h3>
                  {/* Template Type Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setShowEmailTemplates(false)}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        !showEmailTemplates 
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Live Chat
                    </button>
                    <button
                      onClick={() => setShowEmailTemplates(true)}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        showEmailTemplates 
                          ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder={showEmailTemplates ? "Search email templates..." : "Search live chat templates..."}
                      value={templateSearchTerm}
                      onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsEmailTemplate(showEmailTemplates);
                      setShowTemplateForm(true);
                    }}
                    className={showEmailTemplates 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create {showEmailTemplates ? 'Email' : 'Live Chat'} Template
                  </Button>
                </div>
              </div>
              
{showEmailTemplates ? (
                // Email Templates View
                emailTemplatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-slate-600">Loading email templates...</div>
                  </div>
                ) : filteredEmailTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <FileText className="h-12 w-12 mb-4" />
                    <h4 className="text-lg font-medium mb-2">No Email Templates Found</h4>
                    <p className="text-sm text-center max-w-md">
                      Create email templates for consistent customer communication via email.
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingTemplate(null);
                        setIsEmailTemplate(true);
                        setShowTemplateForm(true);
                      }}
                      className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Email Template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-slate-700">
                        Email Templates - Professional Communication
                      </h4>
                    </div>
                    <DragDropEmailTemplates
                      templates={filteredEmailTemplates}
                      onEdit={(template) => {
                        setEditingTemplate(template);
                        setIsEmailTemplate(true);
                        setShowTemplateForm(true);
                      }}
                      onDelete={handleDeleteEmailTemplate}
                    />
                  </div>
                )
              ) : (
                // Live Chat Templates View
                templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-slate-600">Loading templates...</div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <FileText className="h-12 w-12 mb-4" />
                    <h4 className="text-lg font-medium mb-2">No Live Chat Templates Found</h4>
                    <p className="text-sm text-center max-w-md">
                      Get started by creating your first template. Templates help customer service agents provide consistent and professional responses.
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingTemplate(null);
                        setIsEmailTemplate(false);
                        setShowTemplateForm(true);
                      }}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Live Chat Template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-slate-700">
                        Live Chat Templates - Drag & Drop Management
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setShowGroupManager(true)}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Manage Groups
                        </Button>
                      </div>
                    </div>
                    <HorizontalGroupedTemplates
                      templates={filteredTemplates.map((t: any) => ({
                        ...t,
                        content: t.contentEn || t.content || '',
                        concernedTeam: t.concernedTeam || 'General'
                      }))}
                      groups={templateGroups}
                      onEdit={(template) => {
                        setEditingTemplate(template);
                        setIsEmailTemplate(false);
                        setShowTemplateForm(true);
                      }}
                      onDelete={handleDeleteTemplate}
                      onCreateGroup={() => setShowGroupManager(true)}
                      onEditGroup={(group) => {
                        setEditingGroup(group);
                        setShowGroupManager(true);
                      }}
                      isAdminMode={true}
                    />
                  </div>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Template Color Management</h3>
                <p className="text-sm text-slate-600">Customize badge colors for genres, categories, and groups</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      {genresLoading ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Loading genres...
                        </p>
                      ) : (dynamicGenres as any[]).length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No genres found. Database contains data but API may have issues.
                        </p>
                      ) : (
                        (dynamicGenres as any[]).map((genre: any) => {
                          const genreKey = genre.name.toLowerCase();
                          // First check saved colors, then check static config, then use fallback
                          const colors = genreColors[genreKey] || 
                                        GENRE_COLORS[genreKey] || 
                                        getGenreColor(genre.name) || {
                            background: 'bg-blue-100 dark:bg-blue-900',
                            text: 'text-blue-800 dark:text-blue-200',
                            border: 'border-blue-200 dark:border-blue-700'
                          };
                          
                          return (
                            <div key={genre.id} className="flex items-center justify-between p-3 border dark:border-slate-600 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge className={`${colors.background} ${colors.text} ${colors.border} border`}>
                                  {genre.name}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {genre.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`w-6 h-6 rounded-full ${colors.background.replace('100', '500')} border-2 border-white dark:border-slate-300 shadow-sm`}
                                  title={`Background: ${colors.background}, Text: ${colors.text}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openColorPicker(genreKey, 'genre')}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
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
                      {(templateCategoriesLoading || emailCategoriesLoading) ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Loading categories...
                        </p>
                      ) : [...(dynamicTemplateCategories as any[]), ...(dynamicEmailCategories as any[])].length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No categories found. Database contains data but API may have issues.
                        </p>
                      ) : (
                        // Combine and deduplicate categories from both sources
                        Array.from(
                          new Map(
                            [...(dynamicTemplateCategories as any[]), ...(dynamicEmailCategories as any[])]
                              .map((cat: any) => [cat.name.toLowerCase(), cat])
                          ).values()
                        ).map((category: any) => {
                          const categoryKey = category.name.toLowerCase();
                          // First check saved colors, then check static config, then use fallback
                          const colors = categoryColors[categoryKey] || 
                                        CATEGORY_COLORS[categoryKey] || 
                                        getCategoryColor(category.name) || {
                            background: 'bg-green-100 dark:bg-green-900',
                            text: 'text-green-800 dark:text-green-200',
                            border: 'border-green-200 dark:border-green-700'
                          };
                          
                          return (
                            <div key={category.id} className="flex items-center justify-between p-3 border dark:border-slate-600 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge className={`${colors.background} ${colors.text} ${colors.border} border`}>
                                  {category.name}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {category.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`w-6 h-6 rounded-full ${colors.background.replace('100', '500')} border-2 border-white dark:border-slate-300 shadow-sm`}
                                  title={`Background: ${colors.background}, Text: ${colors.text}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openColorPicker(categoryKey, 'category')}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Group Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Group Colors
                    </CardTitle>
                    <p className="text-sm text-slate-600">Configure colors for template groups</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupsLoading ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Loading groups...
                        </p>
                      ) : (templateGroups as any[]).length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No groups found. Create groups to manage their colors.
                        </p>
                      ) : (
                        (templateGroups as any[]).map((group: any) => {
                          return (
                            <div key={group.id} className="flex items-center justify-between p-3 border dark:border-slate-600 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge 
                                  className="border"
                                  style={{ 
                                    backgroundColor: group.color + '20',
                                    color: group.color,
                                    borderColor: group.color + '40'
                                  }}
                                >
                                  {group.name}
                                </Badge>
                                <span className="text-xs text-slate-500">
                                  {group.description || 'Live chat template group'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-300 shadow-sm"
                                  style={{ backgroundColor: group.color }}
                                  title={`Group color: ${group.color}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openColorPicker(group.id, 'group')}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                            } else if (editingColorType === 'category') {
                              updateCategoryColor(colorPickerOpen, tempColor);
                            } else if (editingColorType === 'group') {
                              updateGroupColor(colorPickerOpen, tempColor);
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
                    <p className="text-xs text-slate-500">Registered in system</p>
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
                    <CardTitle className="text-sm">Agent Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{users?.filter(u => u.role === 'agent').length || 0}</div>
                    <p className="text-xs text-slate-500">Customer service agents</p>
                    <div className="mt-2">
                      {users?.filter(u => u.role === 'agent').slice(0, 2).map(user => (
                        <div key={user.id} className="text-xs text-slate-600 flex items-center gap-1">
                          <div className={`w-2 h-2 ${user.isOnline ? 'bg-green-500' : 'bg-slate-400'} rounded-full`}></div>
                          {user.firstName} {user.lastName}
                        </div>
                      ))}
                      {users?.filter(u => u.role === 'agent').length > 2 && (
                        <div className="text-xs text-slate-500">+{users?.filter(u => u.role === 'agent').length - 2} more</div>
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
                        <span className="text-sm">Agent Users:</span>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          {users?.filter(u => u.role === 'agent').length || 0}
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
                <DragDropEmailTemplates
                  templates={filteredEmailTemplates}
                  onEdit={(template) => {
                    setEditingTemplate(template);
                    setIsEmailTemplate(true);
                    setShowTemplateForm(true);
                  }}
                  onDelete={handleDeleteEmailTemplate}
                />
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

                {/* Content Management - Consolidated FAQ and Configuration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Template Configuration */}
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowConfigManager(true)}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Template Configuration
                      </CardTitle>
                      <p className="text-sm text-slate-600">Manage categories, genres, and teams</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Categories:</span>
                          <span className="font-medium">{(dynamicTemplateCategories as any[]).length + (dynamicEmailCategories as any[]).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Genres:</span>
                          <span className="font-medium">{(dynamicGenres as any[]).length}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span>Teams:</span>
                          <span className="font-medium">{concernedTeamsData?.length || 0}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4" onClick={(e) => {
                        e.stopPropagation();
                        setShowConfigManager(true);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>

                  {/* FAQ Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        FAQ Management
                      </CardTitle>
                      <p className="text-sm text-slate-600">Manage frequently asked questions</p>
                    </CardHeader>
                    <CardContent className="p-0">
                      <FAQEditor />
                    </CardContent>
                  </Card>
                </div>



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
              createEmailTemplateMutation.mutate(templateData);
            } else {
              createTemplateMutation.mutate(templateData);
            }
          }
        }}
        isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending || createEmailTemplateMutation.isPending || updateEmailTemplateMutation.isPending}
        isEmailTemplate={isEmailTemplate}
      />

      {/* Template Config Manager */}
      <TemplateConfigManager isOpen={showConfigManager} onClose={() => setShowConfigManager(false)} />

      {/* Group Manager */}
      <GroupManager
        groups={templateGroups}
        isOpen={showGroupManager}
        onClose={() => {
          setShowGroupManager(false);
          setEditingGroup(null);
        }}
        editingGroup={editingGroup}
        onEditGroup={setEditingGroup}
        onCreateGroup={createGroupMutation.mutate}
        onUpdateGroup={updateGroupMutation.mutate}
      />

      {/* Modern Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => 
        setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {deleteConfirmation.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {deleteConfirmation.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
              disabled={deleteLiveTemplateMutation.isPending || deleteEmailTemplateMutation.isPending || deleteAnnouncementMutation.isPending || deleteUserMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedDelete}
              disabled={deleteLiveTemplateMutation.isPending || deleteEmailTemplateMutation.isPending || deleteAnnouncementMutation.isPending || deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {(deleteLiveTemplateMutation.isPending || deleteEmailTemplateMutation.isPending || deleteAnnouncementMutation.isPending || deleteUserMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </DialogContent>
    </Dialog>
  );
}
