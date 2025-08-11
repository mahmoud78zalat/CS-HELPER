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

export function StoreEmailsManager({ onClose }: StoreEmailsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();

  // Fetch store emails
  const { data: storeEmails = [], isLoading: storesLoading } = useQuery({
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
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Store Contacts - View Only
          </DialogTitle>
        </DialogHeader>



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
            Quick access to store contact information for customer inquiries
          </div>
          <Button onClick={onClose} variant="outline" data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}