import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search, X, Mail, Building, Phone as PhoneIcon, Shuffle, RotateCcw, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StoreEmail } from "@shared/schema";

interface StoreEmailsManagerProps {
  onClose: () => void;
}

interface SortableStoreCardProps {
  store: StoreEmail;
  isDragMode: boolean;
  onCopyEmail: (email: string, storeName: string) => void;
  onCopyPhone: (phone: string, storeName: string) => void;
}

function SortableStoreCard({ store, isDragMode, onCopyEmail, onCopyPhone }: SortableStoreCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: store.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`transition-shadow ${isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isDragMode && (
                  <div 
                    {...listeners} 
                    className="cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <CardTitle className="text-lg font-semibold">
                  {store.storeName}
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-mono">{store.storeEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyEmail(store.storeEmail, store.storeName)}
              className="h-6 w-6 p-0 ml-auto"
              title="Copy email"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-mono">{store.storePhone}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyPhone(store.storePhone, store.storeName)}
              className="h-6 w-6 p-0 ml-auto"
              title="Copy phone"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StoreEmailsManager({ onClose }: StoreEmailsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragMode, setIsDragMode] = useState(false);
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

  // Fetch store emails
  const { data: storeEmails = [], isLoading: storesLoading } = useQuery<StoreEmail[]>({
    queryKey: ['/api/store-emails'],
    enabled: true
  });

  // Synchronize local state with server data and apply local ordering
  useEffect(() => {
    if (storeEmails && storeEmails.length > 0) {
      // Check for saved local order
      const savedOrder = localStorage.getItem('storeEmails_local_order');
      if (savedOrder) {
        try {
          const orderMap = JSON.parse(savedOrder);
          const reorderedStores = [...storeEmails].sort((a, b) => {
            const aOrder = orderMap[a.id] !== undefined ? orderMap[a.id] : a.orderIndex;
            const bOrder = orderMap[b.id] !== undefined ? orderMap[b.id] : b.orderIndex;
            return aOrder - bOrder;
          });
          setLocalStores(reorderedStores);
        } catch {
          setLocalStores([...storeEmails].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
        }
      } else {
        setLocalStores([...storeEmails].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      }
    }
  }, [storeEmails]);

  // Reorder mutation (not used in user modal - kept for potential future use)
  const reorderMutation = useMutation({
    mutationFn: async (reorderedStores: StoreEmail[]) => {
      const updates = reorderedStores.map((store, index) => ({
        id: store.id,
        orderIndex: index
      }));
      
      console.log('[StoreEmailsManager] Sending reorder request with updates:', updates);
      
      const response = await apiRequest('PATCH', '/api/store-emails/reorder', { updates });
      console.log('[StoreEmailsManager] Reorder response:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "Store contacts have been reordered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/store-emails'] });
    },
    onError: (error) => {
      console.error('[StoreEmailsManager] Reorder failed:', error);
      toast({
        title: "Reorder failed",
        description: "Failed to save the new order. Please try again.",
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





  // Handle drag end for local reordering  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localStores.findIndex((item) => item.id === active.id);
      const newIndex = localStores.findIndex((item) => item.id === over.id);
      
      const reorderedStores = arrayMove(localStores, oldIndex, newIndex);
      
      console.log('[StoreEmailsManager] Drag end event:', { active: active.id, over: over.id });
      console.log('[StoreEmailsManager] Moving store from index', oldIndex, 'to', newIndex);
      console.log('[StoreEmailsManager] Reordered stores preview:', reorderedStores.map(s => ({ id: s.id, name: s.storeName })));
      
      setLocalStores(reorderedStores);
      
      // For regular users: Save local order to localStorage (NOT to backend)
      const orderMap: Record<string, number> = {};
      reorderedStores.forEach((store, index) => {
        orderMap[store.id] = index;
      });
      localStorage.setItem('storeEmails_local_order', JSON.stringify(orderMap));
      console.log('[StoreEmailsManager] User reorder - saved to localStorage:', orderMap);
      
      toast({
        title: "Contacts reordered",
        description: "Your personal store contacts order has been updated",
      });
    } else {
      console.log('[StoreEmailsManager] No reorder needed - same position');
    }
  };

  // Reset local ordering
  const resetLocalOrder = () => {
    localStorage.removeItem('storeEmails_local_order');
    setLocalStores([...storeEmails].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
    setIsDragMode(false);
    toast({
      title: "Order reset",
      description: "Your personal store contacts order has been reset to default",
    });
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Check if there's any custom ordering
  const hasCustomOrder = localStorage.getItem('storeEmails_local_order') !== null;

  // Filter store emails based on search term using localStores for custom ordering
  const filteredStoreEmails = localStores.filter((store: StoreEmail) => {
    const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.storePhone.includes(searchTerm);
    
    return matchesSearch && store.isActive;
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Store Contacts
          </DialogTitle>
        </DialogHeader>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Reordering Controls */}
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => setIsDragMode(!isDragMode)}
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              {isDragMode ? "Exit Reorder Mode" : "Reorder Stores"}
            </Button>
            
            {(hasCustomOrder || isDragMode) && (
              <Button
                onClick={resetLocalOrder}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Order
              </Button>
            )}
          </div>

          {/* Search Controls */}
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
            <span>Showing {filteredStoreEmails.length} of {localStores.length} stores</span>
            {hasCustomOrder && <Badge variant="secondary">Custom Order</Badge>}
            {isDragMode && <Badge variant="default">Drag Mode</Badge>}
          </div>
        </div>

        {/* Store Emails Grid */}
        <div className="overflow-y-auto max-h-[50vh] space-y-4">
          {storesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading store contacts...</div>
            </div>
          ) : filteredStoreEmails.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">
                {searchTerm ? 'No stores found matching your search.' : 'No store contacts available.'}
              </div>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredStoreEmails.map(store => store.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredStoreEmails.map((store) => (
                  <SortableStoreCard
                    key={store.id}
                    store={store}
                    isDragMode={isDragMode}
                    onCopyEmail={handleCopyEmail}
                    onCopyPhone={handleCopyPhone}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>


      </DialogContent>
    </Dialog>
  );
}