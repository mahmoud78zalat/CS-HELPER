import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Database, Mail, Phone, Copy, X } from "lucide-react";
import { StoreEmail } from "@shared/schema";

interface StoreEmailsManagerProps {
  onClose: () => void;
}

export default function StoreEmailsManager({ onClose }: StoreEmailsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  // Fetch store emails
  const { data: storeEmails = [], isLoading } = useQuery<StoreEmail[]>({
    queryKey: ["/api/store-emails"],
    staleTime: 0,
  });

  const handleCopyInfo = (type: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleCopyAllInfo = (store: StoreEmail) => {
    const allInfo = `Store: ${store.storeName}
Email: ${store.storeEmail}
Phone: ${store.storePhone}`;
    navigator.clipboard.writeText(allInfo);
    toast({
      title: "Copied!",
      description: "All store information copied to clipboard",
    });
  };

  // Filter store emails based on search term
  const filteredStoreEmails = storeEmails.filter(store =>
    store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storePhone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Store Emails Directory
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and copy store contact information
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search stores by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Store Emails List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading store information...</p>
          </div>
        ) : filteredStoreEmails.length === 0 ? (
          <Card className="p-8 text-center">
            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No store emails found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "No stores match your search criteria" : "No store information is available"}
            </p>
          </Card>
        ) : (
          filteredStoreEmails.map((store) => (
            <Card key={store.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {store.storeName}
                    </h3>
                    <Badge variant={store.isActive ? "default" : "secondary"}>
                      {store.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{store.storeEmail}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyInfo("Email", store.storeEmail)}
                        className="h-6 w-6 p-0 ml-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{store.storePhone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyInfo("Phone", store.storePhone)}
                        className="h-6 w-6 p-0 ml-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {store.createdAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Added: {new Date(store.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAllInfo(store)}
                    className="shrink-0"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy All
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}