import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building, Search, Plus, Edit, Trash2, Copy, Phone, Mail, GripVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StoreEmail {
  id: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  isActive: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

interface StoreContactsAdminManagerProps {
  onClose: () => void;
}

export function StoreContactsAdminManager({ onClose }: StoreContactsAdminManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreEmail | null>(null);
  const [localStores, setLocalStores] = useState<StoreEmail[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch store emails with authentication
  const { data: storeEmails = [], isLoading: storesLoading } = useQuery<StoreEmail[]>({
    queryKey: ['/api/store-emails'],
    enabled: true,
    queryFn: async (): Promise<StoreEmail[]> => {
      const response = await fetch('/api/store-emails', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('current_user_id') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch store emails');
      return response.json();
    }
  });

  // Synchronize local state with server data 
  useEffect(() => {
    if (storeEmails) {
      // Sort by orderIndex if available, otherwise by name
      const sortedStores = [...storeEmails].sort((a, b) => {
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        return a.storeName.localeCompare(b.storeName);
      });
      setLocalStores(sortedStores);
    }
  }, [storeEmails]);

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedStores: StoreEmail[]) => {
      const updates = reorderedStores.map((store, index) => ({
        id: store.id,
        orderIndex: index
      }));
      
      return apiRequest('PATCH', '/api/store-emails/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      toast({
        title: "Order updated",
        description: "Store contacts have been reordered successfully",
      });
    },
    onError: (error: any) => {
      console.error('Reorder error:', error);
      toast({
        title: "Reorder failed",  
        description: error?.message || "Unable to reorder store contacts",
        variant: "destructive",
      });
    },
  });

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localStores.findIndex((store) => store.id === active.id);
      const newIndex = localStores.findIndex((store) => store.id === over?.id);

      const reorderedStores = arrayMove(localStores, oldIndex, newIndex);
      setLocalStores(reorderedStores);
      reorderMutation.mutate(reorderedStores);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/store-emails/${id}`);
    },
    onSuccess: async () => {
      // Invalidate and refetch the exact query key
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/store-emails'],
        exact: true 
      });
      
      toast({
        title: "Store contact deleted",
        description: "Store contact has been successfully deleted",
      });
    },
    onError: (error: any) => {
      console.error('Delete store contact error:', error);
      toast({
        title: "Delete failed",
        description: error?.message || "Unable to delete store contact",
        variant: "destructive",
      });
    },
  });

  const handleCopyEmail = (email: string, storeName: string) => {
    try {
      navigator.clipboard.writeText(email);
      toast({
        title: "Copied!",
        description: `${storeName} email copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyPhone = (phone: string, storeName: string) => {
    try {
      navigator.clipboard.writeText(phone);
      toast({
        title: "Copied!",
        description: `${storeName} phone copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyAll = (store: StoreEmail) => {
    try {
      const allInfo = `Store: ${store.storeName}\nEmail: ${store.storeEmail}\nPhone: ${store.storePhone}`;
      navigator.clipboard.writeText(allInfo);
      toast({
        title: "Copied!",
        description: `${store.storeName} contact info copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (store: StoreEmail) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" store contact?`)) {
      deleteMutation.mutate(id);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter store emails based on search term using localStores
  const filteredStoreEmails = localStores.filter((store: StoreEmail) => {
    const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storePhone.includes(searchTerm);
    
    return matchesSearch && store.isActive;
  });

  // Sortable Store Item Component
  const SortableStoreItem = ({ store }: { store: StoreEmail }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: store.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <Card className="relative group">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {store.storeName}
                  </CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-mono text-sm">{store.storeEmail}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyEmail(store.storeEmail, store.storeName)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-mono text-sm">{store.storePhone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyPhone(store.storePhone, store.storeName)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyAll(store)}
                  title="Copy all contact info"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(store)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(store.id, store.storeName)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Store Contacts Manager
            </DialogTitle>
            <div className="text-sm text-gray-500">
              Manage store contact information with full admin controls
            </div>
          </DialogHeader>

          {/* Admin Controls */}
          <div className="flex justify-between items-center">
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Store Contact
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>

          {/* Search Controls */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stores by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchTerm && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear Search
                </Button>
              )}
            </div>
          </div>

          {/* Store Contacts List with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[500px] w-full">
                {storesLoading ? (
                  <div className="text-center py-8">Loading store contacts...</div>
                ) : filteredStoreEmails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {localStores.length === 0 ? "No store contacts found" : "No stores match your search"}
                  </div>
                ) : (
                  <SortableContext
                    items={filteredStoreEmails.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-4 p-4">
                      {filteredStoreEmails.map((store: StoreEmail) => (
                        <SortableStoreItem
                          key={store.id}
                          store={store}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </ScrollArea>
            </div>
          </DndContext>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      {showCreateModal && (
        <StoreContactCreateModal 
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingStore && (
        <StoreContactEditModal 
          store={editingStore}
          onClose={() => {
            setShowEditModal(false);
            setEditingStore(null);
          }}
        />
      )}
    </>
  );
}

// Create Modal Component
function StoreContactCreateModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    storeName: "",
    storeEmail: "",
    storePhone: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/store-emails', { ...data, isActive: true });
    },
    onSuccess: async () => {
      // Invalidate and refetch the exact query key
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/store-emails'],
        exact: true 
      });
      
      toast({
        title: "Store contact created",
        description: "New store contact has been successfully created",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Create store contact error:', error);
      toast({
        title: "Create failed",
        description: error?.message || "Unable to create store contact",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName || !formData.storeEmail || !formData.storePhone) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Store Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="storeName">Store Name *</Label>
            <Input
              id="storeName"
              value={formData.storeName}
              onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
              placeholder="Enter store name"
              required
            />
          </div>

          <div>
            <Label htmlFor="storeEmail">Store Email *</Label>
            <Input
              id="storeEmail"
              type="email"
              value={formData.storeEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, storeEmail: e.target.value }))}
              placeholder="Enter store email"
              required
            />
          </div>

          <div>
            <Label htmlFor="storePhone">Store Phone *</Label>
            <Input
              id="storePhone"
              type="tel"
              value={formData.storePhone}
              onChange={(e) => setFormData(prev => ({ ...prev, storePhone: e.target.value }))}
              placeholder="Enter store phone number"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Modal Component
function StoreContactEditModal({ 
  store, 
  onClose 
}: { 
  store: StoreEmail;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    storeName: store.storeName,
    storeEmail: store.storeEmail,
    storePhone: store.storePhone,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('PUT', `/api/store-emails/${store.id}`, data);
    },
    onSuccess: async () => {
      // Invalidate and refetch the exact query key
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/store-emails'],
        exact: true 
      });
      
      toast({
        title: "Store contact updated",
        description: "Store contact has been successfully updated",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Update store contact error:', error);
      toast({
        title: "Update failed",
        description: error?.message || "Unable to update store contact",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName || !formData.storeEmail || !formData.storePhone) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Store Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="storeName">Store Name *</Label>
            <Input
              id="storeName"
              value={formData.storeName}
              onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
              placeholder="Enter store name"
              required
            />
          </div>

          <div>
            <Label htmlFor="storeEmail">Store Email *</Label>
            <Input
              id="storeEmail"
              type="email"
              value={formData.storeEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, storeEmail: e.target.value }))}
              placeholder="Enter store email"
              required
            />
          </div>

          <div>
            <Label htmlFor="storePhone">Store Phone *</Label>
            <Input
              id="storePhone"
              type="tel"
              value={formData.storePhone}
              onChange={(e) => setFormData(prev => ({ ...prev, storePhone: e.target.value }))}
              placeholder="Enter store phone number"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}