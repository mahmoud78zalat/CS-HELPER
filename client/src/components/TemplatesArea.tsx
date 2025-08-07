import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplates } from "@/hooks/useTemplates";
import { useTemplateGroups } from "@/hooks/useTemplateGroups";
import { useCustomerData } from "@/hooks/useCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { useLocalTemplateOrdering } from "@/hooks/useLocalTemplateOrdering";
import TemplateCard from "./TemplateCard";
import DragDropTemplateList from "./DragDropTemplateList";
import { Search, FolderOpen, ArrowUpDown, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenreColor } from '@/lib/templateColors';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Sortable Group Component
function SortableGroupContainer({ group, templates, isDragDropMode, children }: {
  group: any;
  templates: any[];
  isDragDropMode: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`template-category ${isDragging ? 'opacity-50' : ''}`}
    >
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
        {isDragDropMode && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 mr-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Drag to reorder group"
          >
            <GripHorizontal className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <div 
          className="w-3 h-3 rounded-full mr-3 border-2 border-white dark:border-slate-800 shadow-sm"
          style={{ backgroundColor: group.color }}
        />
        <FolderOpen className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
        {group.name}
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-normal">
          ({templates.length} templates)
        </span>
        {isDragDropMode && (
          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
            Drag to reorder
          </span>
        )}
      </h3>
      {group.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 ml-9">
          {group.description}
        </p>
      )}
      {children}
    </div>
  );
}

export default function TemplatesArea() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragDropMode, setIsDragDropMode] = useState(false);
  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch template groups instead of individual templates
  const { data: templateGroups, isLoading: groupsLoading } = useTemplateGroups();
  
  // Initialize local template ordering hook (for non-admin users only)
  const { 
    applyLocalOrdering, 
    applyLocalGroupOrdering,
    updateBulkOrdering, 
    updateBulkGroupOrdering,
    resetToAdminOrdering, 
    clearLocalOrderingForAdmin,
    hasLocalOrdering 
  } = useLocalTemplateOrdering(user?.id || 'anonymous');

  // Check if user is admin - admin users should never use local ordering
  const isAdmin = user?.role === 'admin';
  const shouldUseLocalOrdering = !isAdmin;

  // Clear local ordering when templates are refetched (indicating admin changes)
  const { data: allTemplates, isLoading: templatesLoading, dataUpdatedAt } = useTemplates({
    isActive: true,
  });

  // Clear local ordering when admin makes changes (detected by query refresh)
  // Removed the automatic clearing as it was causing render loops

  // Group reordering mutation (matches HorizontalGroupedTemplates format)
  const reorderGroupsMutation = useMutation({
    mutationFn: async (orderedGroups: any[]) => {
      const updates = orderedGroups.map((group, index) => ({
        id: group.id,
        orderIndex: index
      }));
      
      return apiRequest('POST', '/api/live-reply-template-groups/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ title: "Group order saved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save group order", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle group drag end - behavior depends on user role
  const handleGroupDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = activeGroups.findIndex((group: any) => group.id === active.id);
      const newIndex = activeGroups.findIndex((group: any) => group.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        if (isAdmin) {
          // Admin users: Update the actual database order
          const newGroupOrder = arrayMove(activeGroups, oldIndex, newIndex);
          reorderGroupsMutation.mutate(newGroupOrder);
        } else {
          // Non-admin users: Update local personal ordering only
          const newGroupOrder = arrayMove(activeGroups, oldIndex, newIndex);
          const orderedGroupIds = newGroupOrder.map((group: any) => group.id);
          updateBulkGroupOrdering(orderedGroupIds);
          toast({ title: "Personal group order updated" });
        }
      }
    }
  };
  
  // Enhanced search functionality - now includes group names
  const searchQuery = searchTerm.toLowerCase();
  
  // Filter templates by search term including group names
  const searchFilteredTemplates = (templates: any[]) => {
    if (!searchTerm) return templates;
    
    return templates.filter(template => {
      const content = customerData.language === 'ar' ? template.contentAr : template.contentEn;
      
      // Find the group this template belongs to
      const templateGroup = templateGroups?.find((group: any) => 
        template.groupId === group.id || 
        (!template.groupId && template.genre === group.name)
      );
      
      const groupName = templateGroup?.name?.toLowerCase() || '';
      const groupDescription = templateGroup?.description?.toLowerCase() || '';
      
      return template.name.toLowerCase().includes(searchQuery) ||
             content.toLowerCase().includes(searchQuery) ||
             template.genre.toLowerCase().includes(searchQuery) ||
             template.category.toLowerCase().includes(searchQuery) ||
             groupName.includes(searchQuery) ||
             groupDescription.includes(searchQuery);
    });
  };
  
  // Template data is already fetched above with dataUpdatedAt tracking

  const isLoading = groupsLoading || templatesLoading;
  
  // Apply local ordering only for non-admin users (admin always sees admin ordering)
  const orderedTemplates = shouldUseLocalOrdering 
    ? applyLocalOrdering(allTemplates || []) 
    : (allTemplates || []).sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0));
  const templates = searchFilteredTemplates(orderedTemplates);

  // Group templates by their group assignment
  const groupedTemplates = templates?.reduce((acc, template) => {
    // For search results, group by genre for backward compatibility
    const groupKey = template.genre;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(template);
    return acc;
  }, {} as Record<string, typeof templates>) || {};

  // Filter active groups and apply local ordering only for non-admin users
  const baseActiveGroups = (templateGroups || [])
    .filter((group: any) => group.isActive)
    .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  
  const activeGroups = shouldUseLocalOrdering 
    ? applyLocalGroupOrdering(baseActiveGroups)
    : baseActiveGroups;

  return (
    <>
      {/* Mobile-responsive Search Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 lg:px-6 py-3 lg:py-4">
        <div className="max-w-2xl">
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
              <Input
                type="text"
                className="w-full pl-10 pr-4 py-2 lg:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Search templates, groups, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant={isDragDropMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDragDropMode(!isDragDropMode)}
              className="px-3 py-2 lg:py-3"
              title={isAdmin ? "Admin: Drag & drop to change global order" : "Drag & drop for personal reordering"}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Only show reset button for non-admin users who have local ordering */}
          {!isAdmin && hasLocalOrdering && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>Using custom ordering</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToAdminOrdering}
                className="h-auto py-1 px-2 text-xs"
                title="Reset both template and group positions to admin-defined defaults"
              >
                Reset Reordering
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-responsive Templates Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 lg:p-6">
        <div className="w-full">
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200">Reply Templates</h2>
              <div className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full dark:text-slate-300">
                {customerData.language === 'ar' ? '🇸🇦 Arabic' : '🇬🇧 English'}
              </div>
            </div>
            <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400">
              Click on any template to instantly copy it to your clipboard. Switch language in Customer Info to see templates in {customerData.language === 'ar' ? 'Arabic' : 'English'}.
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
              {searchTerm ? (
                // Show search results grouped by genre when searching
                Object.entries(groupedTemplates).map(([genre, genreTemplates]) => (
                  <div key={genre} className="template-category">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${getGenreColor(genre).background.replace('100', '500')}`}></div>
                      {genre} Templates
                      {isDragDropMode && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Drag to reorder
                        </span>
                      )}
                    </h3>
                    
                    {isDragDropMode ? (
                      <DragDropTemplateList 
                        templates={genreTemplates as any[]}
                        groupName={genre}
                        onReorder={(newOrder) => {
                          updateBulkOrdering(newOrder);
                        }}
                      />
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
                        {(genreTemplates as any[]).map((template: any) => (
                          <TemplateCard key={template.id} template={template} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Show organized groups when not searching with drag and drop support
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleGroupDragEnd}
                >
                  <SortableContext 
                    items={activeGroups.map((group: any) => group.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {activeGroups.map((group: any) => {
                      // Get templates for this group by groupId, fallback to genre matching
                      const groupTemplates = templates.filter((template: any) => 
                        template.groupId === group.id || 
                        (!template.groupId && template.genre === group.name)
                      );
                      
                      if (groupTemplates.length === 0) return null;
                      
                      return (
                        <SortableGroupContainer 
                          key={group.id}
                          group={group}
                          templates={groupTemplates}
                          isDragDropMode={isDragDropMode}
                        >
                          {isDragDropMode ? (
                            <DragDropTemplateList 
                              templates={groupTemplates}
                              groupName={group.name}
                              onReorder={(newOrder) => {
                                // Update local ordering for this group's templates
                                newOrder.forEach((templateId, index) => {
                                  updateBulkOrdering(newOrder);
                                });
                              }}
                            />
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
                              {groupTemplates.map((template) => (
                                <TemplateCard key={template.id} template={template} />
                              ))}
                            </div>
                          )}
                        </SortableGroupContainer>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {!isLoading && (
            searchTerm ? (
              templates?.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 text-lg">No templates found matching "{searchTerm}"</p>
                  <p className="text-slate-400 text-sm mt-2">Try adjusting your search terms or browse groups below</p>
                </div>
              )
            ) : (
              activeGroups.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 text-lg">No template groups available</p>
                  <p className="text-slate-400 text-sm mt-2">Template groups need to be created in the Admin Panel</p>
                </div>
              )
            )
          )}
        </div>
      </div>
    </>
  );
}
