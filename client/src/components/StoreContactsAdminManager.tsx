import { useState } from "react";
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

  // Fetch store emails
  const { data: storeEmails = [], isLoading: storesLoading } = useQuery({
    queryKey: ['/api/store-emails'],
    enabled: true
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/store-emails/${id}`);
    },
    onSuccess: async () => {
      // Force immediate cache refresh
      queryClient.removeQueries({ queryKey: ['/api/store-emails'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      await queryClient.refetchQueries({ queryKey: ['/api/store-emails'] });
      
      toast({
        title: "Store contact deleted",
        description: "Store contact has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Unable to delete store contact",
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

  // Filter store emails based on search term
  const filteredStoreEmails = (storeEmails as StoreEmail[]).filter((store: StoreEmail) => {
    const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storePhone.includes(searchTerm);
    
    return matchesSearch && store.isActive;
  });

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

          {/* Store Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {storesLoading ? (
              <div className="text-center py-8">Loading store contacts...</div>
            ) : filteredStoreEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {(storeEmails as StoreEmail[]).length === 0 ? "No store contacts found" : "No stores match your search"}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredStoreEmails.map((store: StoreEmail) => (
                  <Card key={store.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{store.storeName}</CardTitle>
                          <CardDescription className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{store.storeEmail}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyEmail(store.storeEmail, store.storeName)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{store.storePhone}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyPhone(store.storePhone, store.storeName)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardDescription>
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
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="text-right text-gray-500">
                          Created: {new Date(store.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
      // Force immediate cache refresh
      queryClient.removeQueries({ queryKey: ['/api/store-emails'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      await queryClient.refetchQueries({ queryKey: ['/api/store-emails'] });
      
      toast({
        title: "Store contact created",
        description: "New store contact has been successfully created",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Create failed",
        description: "Unable to create store contact",
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
      // Force immediate cache refresh
      queryClient.removeQueries({ queryKey: ['/api/store-emails'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      await queryClient.refetchQueries({ queryKey: ['/api/store-emails'] });
      
      toast({
        title: "Store contact updated",
        description: "Store contact has been successfully updated",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Unable to update store contact",
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