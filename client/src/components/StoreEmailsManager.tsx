import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search, X, Mail, Building, Phone as PhoneIcon, Plus, Edit, Trash2 } from "lucide-react";
import type { StoreEmail } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface StoreEmailsManagerProps {
  onClose: () => void;
}

interface StoreEmailFormData {
  storeName: string;
  storeEmail: string;
  storePhone: string;
}

export function StoreEmailsManager({ onClose }: StoreEmailsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreEmail | null>(null);
  const [formData, setFormData] = useState<StoreEmailFormData>({
    storeName: "",
    storeEmail: "",
    storePhone: ""
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch store emails
  const { data: storeEmails = [], isLoading: storesLoading } = useQuery({
    queryKey: ['/api/store-emails'],
    enabled: true
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<StoreEmail, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'lastSyncedAt'>) => {
      const response = await fetch('/api/store-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create store');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      setShowForm(false);
      resetForm();
      toast({ title: "Success", description: "Store contact created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create store contact", variant: "destructive" });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StoreEmail> }) => {
      const response = await fetch(`/api/store-emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update store');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      setEditingStore(null);
      setShowForm(false);
      resetForm();
      toast({ title: "Success", description: "Store contact updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update store contact", variant: "destructive" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/store-emails/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete store');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
      toast({ title: "Success", description: "Store contact deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete store contact", variant: "destructive" });
    }
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

  const resetForm = () => {
    setFormData({ storeName: "", storeEmail: "", storePhone: "" });
    setEditingStore(null);
  };

  const handleSubmit = () => {
    if (!formData.storeName || !formData.storeEmail || !formData.storePhone) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    const storeData = {
      storeName: formData.storeName,
      storeEmail: formData.storeEmail,
      storePhone: formData.storePhone,
      isActive: true,
      createdBy: user?.id || null
    };

    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: storeData });
    } else {
      createMutation.mutate(storeData);
    }
  };

  const handleEdit = (store: StoreEmail) => {
    setEditingStore(store);
    setFormData({
      storeName: store.storeName,
      storeEmail: store.storeEmail,
      storePhone: store.storePhone
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this store contact?')) {
      deleteMutation.mutate(id);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter store emails based on search term
  const filteredStoreEmails = storeEmails.filter((store: StoreEmail) => {
    const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storePhone.includes(searchTerm);
    
    return matchesSearch && store.isActive;
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Store Emails & Contact Information
            </DialogTitle>
            {isAdmin && (
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
                data-testid="button-add-store"
              >
                <Plus className="h-4 w-4" />
                Add Store
              </Button>
            )}
          </div>
        </DialogHeader>

        {showForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="font-medium">
              {editingStore ? 'Edit Store Contact' : 'Add New Store Contact'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <Input
                  value={formData.storeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="Store name"
                  data-testid="input-store-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Store Email</label>
                <Input
                  type="email"
                  value={formData.storeEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, storeEmail: e.target.value }))}
                  placeholder="store@company.com"
                  data-testid="input-store-email"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Store Phone</label>
                <Input
                  value={formData.storePhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, storePhone: e.target.value }))}
                  placeholder="+971-50-123-4567"
                  data-testid="input-store-phone"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                data-testid="button-cancel-form"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-store"
              >
                {editingStore ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        )}

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
                data-testid="input-search-stores"
              />
            </div>

            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="flex items-center gap-2"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="h-4 w-4" />
            <span>Showing {filteredStoreEmails.length} of {storeEmails.length} stores</span>
          </div>
        </div>

        {/* Store Emails Grid */}
        <div className="overflow-y-auto max-h-[50vh] space-y-4">
          {storesLoading ? (
            <div className="text-center py-8">Loading stores...</div>
          ) : filteredStoreEmails.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No store information is available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStoreEmails.map((store: StoreEmail) => (
                <Card key={store.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-medium mb-2 flex items-center gap-2">
                          <Building className="h-5 w-5 text-blue-600" />
                          {store.storeName}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          Active Store
                        </Badge>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyAll(store)}
                          className="flex items-center gap-1"
                          data-testid={`button-copy-all-${store.id}`}
                        >
                          <Copy className="h-4 w-4" />
                          Copy All
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(store)}
                              className="flex items-center gap-1"
                              data-testid={`button-edit-${store.id}`}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(store.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${store.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {/* Email Section */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">{store.storeEmail}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyEmail(store.storeEmail, store.storeName)}
                          className="flex items-center gap-1"
                          data-testid={`button-copy-email-${store.id}`}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>

                      {/* Phone Section */}
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Phone</p>
                            <p className="text-sm text-gray-600">{store.storePhone}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyPhone(store.storePhone, store.storeName)}
                          className="flex items-center gap-1"
                          data-testid={`button-copy-phone-${store.id}`}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {isAdmin ? 'Manage store contact information for your team' : 'Quick access to store contact information for customer inquiries'}
          </div>
          <Button onClick={onClose} variant="outline" data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}