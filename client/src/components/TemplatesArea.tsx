import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplates } from "@/hooks/useTemplates";
import TemplateCard from "./TemplateCard";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesArea() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const { data: templates, isLoading } = useTemplates({
    category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
    genre: genreFilter && genreFilter !== 'all' ? genreFilter : undefined,
    search: searchTerm || undefined,
    isActive: true,
  });

  const categories = [
    'Order Issues',
    'Delivery Problems', 
    'Payment Issues',
    'Product Complaints',
    'Returns & Refunds',
    'Technical Support',
    'General Inquiry',
    'Escalation'
  ];

  const genres = [
    'Urgent',
    'Standard',
    'Follow-up',
    'Escalation',
    'Resolution',
    'Information Request',
    'Complaint Handling',
    'Greeting',
    'CSAT',
    'Warning Abusive Language',
    'Apology',
    'Thank You',
    'Farewell',
    'Confirmation',
    'Technical Support',
    'Holiday/Special Occasion'
  ];

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.genre]) {
      acc[template.genre] = [];
    }
    acc[template.genre].push(template);
    return acc;
  }, {} as Record<string, typeof templates>) || {};

  const getGenreColor = (genre: string) => {
    const colors = {
      'Urgent': 'red',
      'Standard': 'blue', 
      'Follow-up': 'green',
      'Escalation': 'orange',
      'Resolution': 'emerald',
      'Information Request': 'purple',
      'Complaint Handling': 'yellow',
      'Greeting': 'cyan',
      'CSAT': 'indigo',
      'Warning Abusive Language': 'red',
      'Apology': 'amber',
      'Thank You': 'pink',
      'Farewell': 'teal',
      'Confirmation': 'lime',
      'Technical Support': 'violet',
      'Holiday/Special Occasion': 'rose'
    };
    return colors[genre as keyof typeof colors] || 'gray';
  };

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search templates by category, genre, content, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 mt-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Templates Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Reply Templates</h2>
            <p className="text-slate-600">
              Click on any template to instantly copy it to your clipboard. Customer information from the sidebar will automatically populate variables.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2].map(j => (
                      <Skeleton key={j} className="h-40" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([genre, genreTemplates]) => (
                <div key={genre} className="template-category">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <div className={`w-2 h-2 bg-${getGenreColor(genre)}-500 rounded-full mr-3`}></div>
                    {genre} Templates
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {genreTemplates.map((template) => (
                      <TemplateCard key={template.id} template={template} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && templates?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No templates found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
