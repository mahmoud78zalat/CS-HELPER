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
import { Plus, Edit2, Trash2, Save, X, HelpCircle, GripHorizontal, Settings, Users, CreditCard, Wrench, Info, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Sortable FAQ Item Component
const SortableFAQItem = ({ faq, isEditing, onEdit, onSave, onCancel, onDelete, getCategoryColor, availableCategories, isExpanded, onToggleExpansion }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${!faq.isActive ? 'opacity-60' : ''} ${isDragging ? 'shadow-lg z-50' : ''}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing mt-2 p-1 hover:bg-gray-100 rounded"
          >
            <GripHorizontal className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`edit-question-${faq.id}`}>Question *</Label>
                  <Input
                    id={`edit-question-${faq.id}`}
                    value={faq.question}
                    onChange={(e) => onEdit({ ...faq, question: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`edit-category-${faq.id}`}>Category</Label>
                  <Select 
                    value={faq.category} 
                    onValueChange={(value) => onEdit({ ...faq, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length > 0 ? (
                        availableCategories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor={`edit-answer-${faq.id}`}>Answer *</Label>
                  <Textarea
                    id={`edit-answer-${faq.id}`}
                    value={faq.answer}
                    onChange={(e) => onEdit({ ...faq, answer: e.target.value })}
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <Label htmlFor={`edit-icon-${faq.id}`}>Icon</Label>
                    <Select 
                      value={faq.icon || 'HelpCircle'} 
                      onValueChange={(value) => onEdit({ ...faq, icon: value })}
                    >
                      <SelectTrigger className="mt-1 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HelpCircle">Help Circle</SelectItem>
                        <SelectItem value="Settings">Settings</SelectItem>
                        <SelectItem value="Users">Users</SelectItem>
                        <SelectItem value="CreditCard">Billing</SelectItem>
                        <SelectItem value="Wrench">Technical</SelectItem>
                        <SelectItem value="Info">Information</SelectItem>
                        <SelectItem value="MessageCircle">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`edit-active-${faq.id}`}
                      checked={faq.isActive}
                      onChange={(e) => onEdit({ ...faq, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor={`edit-active-${faq.id}`}>Active</Label>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <Button
                    onClick={onSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode - Collapsible
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-3 px-3 py-2 rounded-lg"
                  onClick={onToggleExpansion}
                >
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex-1">{faq.question}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={getCategoryColor(faq.category)}
                      >
                        {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                      </Badge>
                      
                      {!faq.isActive && (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(faq);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(faq.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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
    icon: 'HelpCircle',
    isActive: true
  });
  const [sortedFaqs, setSortedFaqs] = useState<FAQ[]>([]);
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);

  // Fetch existing categories from the same API used everywhere else
  const { data: templateCategories = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/template-categories'],
  });

  const { data: emailCategories = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/email-categories'],
  });

  // Combine categories and remove duplicates
  const availableCategories = Array.from(
    new Map(
      [...templateCategories, ...emailCategories]
        .map((cat: any) => [cat.name.toLowerCase(), cat])
    ).values()
  );

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
      setNewFaq({ question: '', answer: '', category: 'general', icon: 'HelpCircle', isActive: true });
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
        icon: editingFaq.icon,
        isActive: editingFaq.isActive
      }
    });
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
      deleteFaqMutation.mutate(id);
    }
  };

  // Initialize drag and drop functionality  
  const dragAndDrop = useDragAndDrop({
    contentType: 'faqs',
    items: sortedFaqs,
    onReorder: (reorderedItems) => {
      setSortedFaqs(reorderedItems);
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update sorted FAQs when faqs data changes
  useEffect(() => {
    if (faqs && faqs.length > 0) {
      setSortedFaqs(faqs);
    }
  }, [faqs]);

  // Toggle FAQ expansion
  const toggleFaqExpansion = (faqId: string) => {
    setExpandedFaqs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  // Dynamic category colors based on available categories
  const getCategoryColor = (category: string) => {
    const colorOptions = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    
    const categoryLower = category.toLowerCase();
    let colorIndex = 0;
    for (let i = 0; i < categoryLower.length; i++) {
      colorIndex += categoryLower.charCodeAt(i);
    }
    return colorOptions[colorIndex % colorOptions.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <CardHeader className="px-0 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
        <CardTitle className="flex items-center justify-between">
          <span>FAQ Management</span>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New FAQ
          </Button>
        </CardTitle>
      </CardHeader>

      {/* Create New FAQ */}
      {isCreating && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
          <CardContent className="p-6 max-h-none overflow-visible">
            <h3 className="text-lg font-semibold mb-4 text-green-800">Create New FAQ</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-question">Question *</Label>
                <Input
                  id="new-question"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Enter the FAQ question"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="new-answer">Answer *</Label>
                <Textarea
                  id="new-answer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Enter the FAQ answer"
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="new-category">Category</Label>
                  <Select 
                    value={newFaq.category} 
                    onValueChange={(value) => setNewFaq({ ...newFaq, category: value })}
                  >
                    <SelectTrigger className="mt-1 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length > 0 ? (
                        availableCategories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="new-icon">Icon</Label>
                  <Select 
                    value={newFaq.icon} 
                    onValueChange={(value) => setNewFaq({ ...newFaq, icon: value })}
                  >
                    <SelectTrigger className="mt-1 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HelpCircle">Help Circle</SelectItem>
                      <SelectItem value="Settings">Settings</SelectItem>
                      <SelectItem value="Users">Users</SelectItem>
                      <SelectItem value="CreditCard">Billing</SelectItem>
                      <SelectItem value="Wrench">Technical</SelectItem>
                      <SelectItem value="Info">Information</SelectItem>
                      <SelectItem value="MessageCircle">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="new-active"
                    checked={newFaq.isActive}
                    onChange={(e) => setNewFaq({ ...newFaq, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="new-active">Active</Label>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
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
                    setNewFaq({ question: '', answer: '', category: 'general', icon: 'HelpCircle', isActive: true });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {sortedFaqs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No FAQs found. Create your first FAQ to get started.</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={dragAndDrop.handleDragStart}
            onDragEnd={dragAndDrop.handleDragEnd}
          >
            <SortableContext items={sortedFaqs.map(faq => faq.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {sortedFaqs.map((faq) => (
                  <SortableFAQItem
                    key={faq.id}
                    faq={editingFaq?.id === faq.id ? editingFaq : faq}
                    isEditing={editingFaq?.id === faq.id}
                    onEdit={setEditingFaq}
                    onSave={handleUpdateFaq}
                    onCancel={() => setEditingFaq(null)}
                    onDelete={handleDeleteFaq}
                    getCategoryColor={getCategoryColor}
                    availableCategories={availableCategories}
                    isExpanded={expandedFaqs.includes(faq.id)}
                    onToggleExpansion={() => toggleFaqExpansion(faq.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}