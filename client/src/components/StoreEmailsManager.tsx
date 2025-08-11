import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Database, Mail, Phone } from "lucide-react";
import { StoreEmail, InsertStoreEmail } from "@shared/schema";

export default function StoreEmailsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStore, setEditingStore] = useState<StoreEmail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InsertStoreEmail>({
    storeName: "",
    storeEmail: "",
    storePhone: "",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch store emails
  const { data: storeEmails = [], isLoading, refetch } = useQuery<StoreEmail[]>({
    queryKey: ["/api/store-emails"],
    staleTime: 0,
  });

  // Create store email mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: InsertStoreEmail) => 
      await apiRequest("POST", "/api/store-emails", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-emails"] });
      setShowForm(false);
      setFormData({ storeName: "", storeEmail: "", storePhone: "", isActive: true });
      toast({
        title: "Store email created",
        description: "Store email information has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create store email",
        variant: "destructive",
      });
    },
  });

  // Update store email mutation
  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertStoreEmail> }) =>
      await apiRequest("PUT", `/api/store-emails/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-emails"] });
      setEditingStore(null);
      setShowForm(false);
      setFormData({ storeName: "", storeEmail: "", storePhone: "", isActive: true });
      toast({
        title: "Store email updated",
        description: "Store email information has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update store email",
        variant: "destructive",
      });
    },
  });

  // Delete store email mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (id: string) => await apiRequest("DELETE", `/api/store-emails/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-emails"] });
      toast({
        title: "Store email deleted",
        description: "Store email information has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete store email",
        variant: "destructive",
      });
    },
  });

  // Filter store emails based on search term
  const filteredStoreEmails = storeEmails.filter((store) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      store.storeName?.toLowerCase().includes(searchLower) ||
      store.storeEmail?.toLowerCase().includes(searchLower) ||
      store.storePhone?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (store: StoreEmail) => {
    setEditingStore(store);
    setFormData({
      storeName: store.storeName,
      storeEmail: store.storeEmail,
      storePhone: store.storePhone,
      isActive: store.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingStore) {
      updateStoreMutation.mutate({ id: editingStore.id, data: formData });
    } else {
      createStoreMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStore(null);
    setFormData({ storeName: "", storeEmail: "", storePhone: "", isActive: true });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading store emails...</div>;
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[70vh]">
      {/* Header with search and add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search store emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                {editingStore ? "Edit Store Email" : "Add New Store Email"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  placeholder="e.g., Downtown Branch, Main Office"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeEmail">Store Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  placeholder="e.g., store@company.com"
                  value={formData.storeEmail}
                  onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storePhone">Store Phone</Label>
                <Input
                  id="storePhone"
                  type="tel"
                  placeholder="e.g., +1 (555) 123-4567"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createStoreMutation.isPending || updateStoreMutation.isPending ||
                    !formData.storeName.trim() || !formData.storeEmail.trim() || !formData.storePhone.trim()
                  }
                  className="flex-1"
                >
                  {createStoreMutation.isPending || updateStoreMutation.isPending ? "Saving..." : "Save Store"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Store Emails List */}
      <div className="space-y-3">
        {filteredStoreEmails.length === 0 ? (
          <Card className="p-8 text-center">
            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No store emails found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "No stores match your search criteria" : "Get started by adding your first store email information"}
            </p>
          </Card>
        ) : (
          filteredStoreEmails.map((store) => (
            <Card key={store.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{store.storeName}</h3>
                    <Badge variant={store.isActive ? "default" : "secondary"}>
                      {store.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span>{store.storeEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{store.storePhone}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(store.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(store)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Store Email</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{store.storeName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteStoreMutation.mutate(store.id)}
                          disabled={deleteStoreMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteStoreMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}