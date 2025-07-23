import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplates } from "@/hooks/useTemplates";
import TemplateCard from "./TemplateCard";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerData } from "@/hooks/useCustomerData";

export default function TemplatesArea() {
  const [searchTerm, setSearchTerm] = useState('');
  const [forceRefresh, setForceRefresh] = useState(0);
  const { customerData } = useCustomerData();

  // Force refresh when customer data changes - CRITICAL FIX
  useEffect(() => {
    console.log('TemplatesArea: Customer data changed, forcing refresh:', customerData);
    setForceRefresh(prev => prev + 1);
  }, [customerData, customerData?.customer_name, customerData?.customer_phone, customerData?.customer_email]);

  const { data: templates, isLoading } = useTemplates({
    search: searchTerm || undefined,
    isActive: true,
  });



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
      {/* Mobile-responsive Search Bar */}
      <div className="bg-white border-b border-slate-200 px-3 lg:px-6 py-3 lg:py-4">
        <div className="max-w-2xl">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              className="w-full pl-10 pr-4 py-2 lg:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Mobile-responsive Templates Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-3 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2">Reply Templates</h2>
            <p className="text-sm lg:text-base text-slate-600">
              Click on any template to instantly copy it to your clipboard.
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
                  <div key={`genre-${genre}-${forceRefresh}`} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
                    {genreTemplates.map((template) => (
                      <TemplateCard key={`${template.id}-${forceRefresh}`} template={template} />
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
