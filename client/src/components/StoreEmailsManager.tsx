import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search, X, Mail, Building, Phone as PhoneIcon } from "lucide-react";
import type { StoreEmail } from "@shared/schema";

interface StoreEmailsManagerProps {
  onClose: () => void;
}

interface StoreCardProps {
  store: StoreEmail;
  onCopyEmail: (email: string, storeName: string) => void;
  onCopyPhone: (phone: string, storeName: string) => void;
}

function StoreCard({ store, onCopyEmail, onCopyPhone, index = 0 }: StoreCardProps & { index?: number }) {
  // Generate vibrant colors for each store
  const colors = [
    'from-violet-500 to-purple-500',
    'from-cyan-500 to-blue-500', 
    'from-teal-500 to-green-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-blue-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-cyan-500',
  ];
  const gradientClass = colors[index % colors.length];

  return (
    <Card className="overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-opacity-50">
      {/* Gradient Header */}
      <div className={`h-16 bg-gradient-to-r ${gradientClass} relative`}>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute bottom-3 left-4">
          <Building className="w-6 h-6 text-white/90" />
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">
          {store.storeName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400 flex-1">
              {store.storeEmail}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyEmail(store.storeEmail, store.storeName)}
              className="h-6 w-6 p-0 hover:bg-blue-100"
              title="Copy email"
            >
              <Copy className="h-3 w-3 text-blue-500" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded text-green-600 dark:text-green-400 flex-1">
              {store.storePhone}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyPhone(store.storePhone, store.storeName)}
              className="h-6 w-6 p-0 hover:bg-green-100"
              title="Copy phone"
            >
              <Copy className="h-3 w-3 text-green-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StoreEmailsManager({ onClose }: StoreEmailsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();

  // Fetch store emails
  const { data: storeEmails = [], isLoading: storesLoading } = useQuery<StoreEmail[]>({
    queryKey: ['/api/store-emails'],
    enabled: true
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

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter store emails based on search term - sort by orderIndex for consistent ordering
  const filteredStoreEmails = storeEmails
    .filter((store: StoreEmail) => {
      const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.storeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.storePhone.includes(searchTerm);
      
      return matchesSearch && store.isActive;
    })
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Team Communication
          </DialogTitle>
        </DialogHeader>

        {/* Control Panel */}
        <div className="space-y-4">
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
            <span>Showing {filteredStoreEmails.length} of {storeEmails.length} stores</span>
          </div>
        </div>

        {/* Store Emails Grid */}
        <div className="overflow-y-auto max-h-[60vh]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStoreEmails.map((store, index) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  index={index}
                  onCopyEmail={handleCopyEmail}
                  onCopyPhone={handleCopyPhone}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}