import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, X, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FAQEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'general',
    isActive: true
  });

  // Fetch FAQs
  const { data: faqs = [], isLoading, refetch } = useQuery<FAQ[]>({
    queryKey: ['/api/faqs'],
    queryFn: async () => {
      const response = await fetch('/api/faqs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      return response.json();
    },
  });

  // Create FAQ mutation
  const createFaqMutation = useMutation({
    mutationFn: async (faqData: any) => {
      return apiRequest('POST', '/api/faqs', faqData);
    },
    onSuccess: () => {
      toast({ title: "FAQ created successfully" });
      setIsCreating(false);
      setNewFaq({ question: '', answer: '', category: 'general', isActive: true });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create FAQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update FAQ mutation
  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/faqs/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "FAQ updated successfully" });
      setEditingFaq(null);
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update FAQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete FAQ mutation
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/faqs/${id}`);
    },
    onSuccess: () => {
      toast({ title: "FAQ deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete FAQ", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCreateFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast({ 
        title: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    createFaqMutation.mutate(newFaq);
  };

  const handleUpdateFaq = () => {
    if (!editingFaq) return;
    
    if (!editingFaq.question.trim() || !editingFaq.answer.trim()) {
      toast({ 
        title: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    
    updateFaqMutation.mutate({
      id: editingFaq.id,
      data: {
        question: editingFaq.question,
        answer: editingFaq.answer,
        category: editingFaq.category,
        isActive: editingFaq.isActive
      }
    });
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
      deleteFaqMutation.mutate(id);
    }
  };

  const categoryColors: Record<string, string> = {
    general: 'bg-blue-100 text-blue-800',
    orders: 'bg-green-100 text-green-800',
    returns: 'bg-orange-100 text-orange-800',
    shipping: 'bg-purple-100 text-purple-800',
    account: 'bg-pink-100 text-pink-800',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">FAQ Management</h3>
        </div>
        <div className="text-center py-8 text-gray-500">Loading FAQs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">FAQ Management</h3>
          <Badge variant="secondary">{faqs.length} FAQs</Badge>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Create New FAQ Form */}
      {isCreating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Create New FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-question">Question *</Label>
              <Input
                id="new-question"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="Enter the FAQ question..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="new-answer">Answer *</Label>
              <Textarea
                id="new-answer"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Enter the detailed answer..."
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="new-category">Category</Label>
              <Select 
                value={newFaq.category} 
                onValueChange={(value) => setNewFaq({ ...newFaq, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="returns">Returns</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={handleCreateFaq}
                disabled={createFaqMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {createFaqMutation.isPending ? 'Creating...' : 'Create FAQ'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewFaq({ question: '', answer: '', category: 'general', isActive: true });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No FAQs found. Create your first FAQ to get started.</p>
          </div>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id} className={`${!faq.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                {editingFaq?.id === faq.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`edit-question-${faq.id}`}>Question *</Label>
                      <Input
                        id={`edit-question-${faq.id}`}
                        value={editingFaq.question}
                        onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`edit-answer-${faq.id}`}>Answer *</Label>
                      <Textarea
                        id={`edit-answer-${faq.id}`}
                        value={editingFaq.answer}
                        onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <Label htmlFor={`edit-category-${faq.id}`}>Category</Label>
                        <Select 
                          value={editingFaq.category} 
                          onValueChange={(value) => setEditingFaq({ ...editingFaq, category: value })}
                        >
                          <SelectTrigger className="mt-1 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="orders">Orders</SelectItem>
                            <SelectItem value="returns">Returns</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`edit-active-${faq.id}`}
                          checked={editingFaq.isActive}
                          onChange={(e) => setEditingFaq({ ...editingFaq, isActive: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor={`edit-active-${faq.id}`}>Active</Label>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={handleUpdateFaq}
                        disabled={updateFaqMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateFaqMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFaq(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFaq(faq)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="hover:bg-red-50 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={categoryColors[faq.category] || 'bg-gray-100 text-gray-800'}
                      >
                        {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                      </Badge>
                      {!faq.isActive && (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}