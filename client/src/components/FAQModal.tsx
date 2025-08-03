import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, ShoppingBag, RotateCcw, Settings, CreditCard, User, Phone, Mail, Globe, DollarSign, Truck, FileText, Users, CheckCircle, AlertTriangle, Info, Star, Heart, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Faq } from "@shared/schema";

interface FAQModalProps {
  open: boolean;
  onClose: () => void;
}

const categoryIcons = {
  general: HelpCircle,
  orders: ShoppingBag,
  returns: RotateCcw,
  support: MessageCircle,
};

const categoryColors = {
  general: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  orders: "bg-green-100 text-green-800 hover:bg-green-200", 
  returns: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  support: "bg-purple-100 text-purple-800 hover:bg-purple-200",
};

// Icon mapping for FAQs
const iconMapping = {
  HelpCircle,
  Settings,
  ShoppingBag,
  CreditCard,
  User,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Truck,
  FileText,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Heart,
  MoreHorizontal,
  MessageCircle,
  RotateCcw
};

// Function to get icon component from string
const getIconComponent = (iconName: string) => {
  return iconMapping[iconName as keyof typeof iconMapping] || HelpCircle;
};

export default function FAQModal({ open, onClose }: FAQModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { data: faqs = [], isLoading, error } = useQuery<Faq[]>({
    queryKey: ['/api/faqs', { isActive: true }],
    queryFn: async () => {
      const response = await fetch('/api/faqs?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      return response.json();
    },
    enabled: open,
  });

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedItems(newExpanded);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedCategory(null);
      setExpandedItems(new Set());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </DialogTitle>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              All Categories
            </Button>
            {categories.map(category => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || HelpCircle;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full flex items-center gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              );
            })}
          </div>
        </DialogHeader>

        {/* FAQ Content */}
        <div className="flex-1 overflow-y-auto mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading FAQs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load FAQs. Please try again later.</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || selectedCategory 
                  ? "No FAQs match your search criteria." 
                  : "No FAQs available at the moment."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredFaqs.map((faq, index) => {
                  const isExpanded = expandedItems.has(faq.id);
                  const Icon = faq.icon ? 
                    getIconComponent(faq.icon) : 
                    categoryIcons[faq.category as keyof typeof categoryIcons] || HelpCircle;
                  
                  return (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => toggleExpanded(faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                            <Badge 
                              variant="secondary" 
                              className={`mt-1 text-xs ${categoryColors[faq.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>


      </DialogContent>
    </Dialog>
  );
}