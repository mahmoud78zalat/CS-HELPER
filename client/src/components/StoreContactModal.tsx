import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building } from "lucide-react";
import type { StoreEmail } from "@shared/schema";

interface StoreContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStore?: StoreEmail | null;
}

interface StoreContactFormData {
  storeName: string;
  storeEmail: string;
  storePhone: string;
}

export function StoreContactModal({ isOpen, onClose, editingStore }: StoreContactModalProps) {
  const [formData, setFormData] = useState<StoreContactFormData>({
    storeName: "",
    storeEmail: "",
    storePhone: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes or editing store changes
  useEffect(() => {
    if (editingStore) {
      setFormData({
        storeName: editingStore.storeName,
        storeEmail: editingStore.storeEmail,
        storePhone: editingStore.storePhone || ""
      });
    } else {
      resetForm();
    }
  }, [editingStore, isOpen]);

  const resetForm = () => {
    setFormData({
      storeName: "",
      storeEmail: "",
      storePhone: ""
    });
  };

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
      handleClose();
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
      handleClose();
      toast({ title: "Success", description: "Store contact updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update store contact", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!formData.storeName.trim() || !formData.storeEmail.trim() || !formData.storePhone.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "All fields are required", 
        variant: "destructive" 
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.storeEmail)) {
      toast({ 
        title: "Validation Error", 
        description: "Please enter a valid email address", 
        variant: "destructive" 
      });
      return;
    }

    const storeData = {
      storeName: formData.storeName.trim(),
      storeEmail: formData.storeEmail.trim(),
      storePhone: formData.storePhone.trim(),
      isActive: true,
      createdBy: null,
      orderIndex: 0
    };

    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: storeData });
    } else {
      createMutation.mutate(storeData);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {editingStore ? 'Edit Store Contact' : 'Add New Store Contact'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name *</label>
            <Input
              value={formData.storeName}
              onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
              placeholder="Store name"
              data-testid="input-store-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Store Email *</label>
            <Input
              type="email"
              value={formData.storeEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, storeEmail: e.target.value }))}
              placeholder="store@company.com"
              data-testid="input-store-email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Store Phone *</label>
            <Input
              value={formData.storePhone}
              onChange={(e) => setFormData(prev => ({ ...prev, storePhone: e.target.value }))}
              placeholder="+971-50-123-4567"
              data-testid="input-store-phone"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-form"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-store"
            >
              {editingStore ? 'Update Contact' : 'Create Contact'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}