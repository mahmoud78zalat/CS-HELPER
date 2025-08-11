import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Building, Search, Plus, Edit, Trash2, Copy, Phone, Mail } from "lucide-react";
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Create store mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<StoreEmail, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest('POST', '/api/store-emails', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      setShowCreateModal(false);
      toast({
        title: "Store created",
        description: "New store contact has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create store contact",
        variant: "destructive",
      });
    },
  });

  // Update store mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreEmail> }) =>
      apiRequest('PUT', `/api/store-emails/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      setShowEditModal(false);
      setEditingStore(null);
      toast({
        title: "Store updated",
        description: "Store contact has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update store contact",
        variant: "destructive",
      });
    },
  });

  // Delete store mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/store-emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      toast({
        title: "Store deleted",
        description: "Store contact has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete store contact",
        variant: "destructive",
      });
    },
  });

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleEdit = (store: StoreEmail) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  const handleDelete = (store: StoreEmail) => {
    if (confirm(`Are you sure you want to delete "${store.storeName}"?`)) {
      deleteMutation.mutate(store.id);
    }
  };

  // Filter stores based on search term - sort by orderIndex for consistent ordering
  const filteredStores = storeEmails
    .filter((store) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        store.storeName.toLowerCase().includes(search) ||
        store.storeEmail.toLowerCase().includes(search) ||
        store.storePhone.includes(search)
      );
    })
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Store Contacts Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Controls */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Store
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total: {storeEmails.length}</span>
              <span>Active: {storeEmails.filter(s => s.isActive).length}</span>
              <span>Showing: {filteredStores.length}</span>
            </div>

            {/* Store List */}
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storesLoading ? (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="text-gray-500">Loading stores...</div>
                  </div>
                ) : filteredStores.length === 0 ? (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="text-gray-500">
                      {searchTerm ? 'No stores found matching your search.' : 'No stores found.'}
                    </div>
                  </div>
                ) : (
                  filteredStores.map((store, index) => {
                    // Generate vibrant colors for each store
                    const colors = [
                      'from-purple-500 to-pink-500',
                      'from-blue-500 to-cyan-500', 
                      'from-green-500 to-teal-500',
                      'from-orange-500 to-red-500',
                      'from-indigo-500 to-purple-500',
                      'from-pink-500 to-rose-500',
                      'from-yellow-400 to-orange-500',
                      'from-emerald-500 to-blue-500',
                    ];
                    const gradientClass = colors[index % colors.length];
                    
                    return (
                      <Card key={store.id} className="overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-opacity-50">
                        {/* Gradient Header */}
                        <div className={`h-20 bg-gradient-to-r ${gradientClass} relative`}>
                          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(store)}
                              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(store)}
                              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-3 left-4">
                            <Building className="w-8 h-8 text-white/90" />
                          </div>
                        </div>
                        
                        <CardHeader className="pb-3">
                          <div className="space-y-2">
                            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">
                              {store.storeName}
                            </CardTitle>
                            <div>
                              {store.isActive ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                  ✓ Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                                  ⚠ Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                                {store.storeEmail}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(store.storeEmail, "Email")}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                              >
                                <Copy className="w-3 h-3 text-blue-500" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded text-green-600 dark:text-green-400">
                                {store.storePhone}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(store.storePhone, "Phone")}
                                className="h-6 w-6 p-0 hover:bg-green-100"
                              >
                                <Copy className="w-3 h-3 text-green-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      {showCreateModal && (
        <StoreFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingStore && (
        <StoreFormModal
          store={editingStore}
          onClose={() => {
            setShowEditModal(false);
            setEditingStore(null);
          }}
          onSubmit={(data) => updateMutation.mutate({ id: editingStore.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}
    </>
  );
}

interface StoreFormModalProps {
  store?: StoreEmail;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function StoreFormModal({ store, onClose, onSubmit, isLoading }: StoreFormModalProps) {
  const [formData, setFormData] = useState({
    storeName: store?.storeName || "",
    storeEmail: store?.storeEmail || "",
    storePhone: store?.storePhone || "",
    isActive: store?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {store ? 'Edit Store Contact' : 'Create Store Contact'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="storeEmail">Store Email</Label>
            <Input
              id="storeEmail"
              type="email"
              value={formData.storeEmail}
              onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="storePhone">Store Phone</Label>
            <Input
              id="storePhone"
              value={formData.storePhone}
              onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : store ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}