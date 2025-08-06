import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { PersonalNote } from "@shared/schema";
import CustomerInfoPanel from "./CustomerInfoPanel";
import OrderConverterPanel from "./OrderConverterPanel";
import AdditionalInfoPanel from "./AdditionalInfoPanel";
import PersonalNotes from "./PersonalNotes";
import { 
  User, 
  ArrowLeftRight, 
  Info, 
  Search, 
  HelpCircle,
  LogOut,
  ChevronRight,
  StickyNote,
  Copy,
  Plus,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface SidebarProps {
  onCheckOrder: () => void;
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
}

export default function Sidebar({ 
  onCheckOrder, 
  onEmailComposer,
  onAdminPanel,
  onAbout 
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [notesSearchTerm, setNotesSearchTerm] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const togglePanel = (panelId: string) => {
    setExpandedPanel(expandedPanel === panelId ? null : panelId);
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Fetch personal notes for dropdown
  const { data: personalNotes = [] } = useQuery<PersonalNote[]>({
    queryKey: ['/api/personal-notes', user?.id],
    enabled: !!user && expandedPanel === 'personal-notes',
    queryFn: async () => {
      const response = await fetch('/api/personal-notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      return response.json();
    },
  });

  // Filter notes based on search term
  const filteredPersonalNotes = personalNotes.filter(note => 
    note.content.toLowerCase().includes(notesSearchTerm.toLowerCase()) ||
    (note.subject && note.subject.toLowerCase().includes(notesSearchTerm.toLowerCase()))
  );

  const handleCopyNote = (note: PersonalNote) => {
    navigator.clipboard.writeText(note.content);
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg border-r border-slate-200 dark:border-slate-700 transition-all duration-300 w-16 lg:w-80 overflow-hidden">
      <div className="p-2 lg:p-6">
        <nav className="space-y-2">
          {/* Customer Info Panel */}
          <div className="customer-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600"
              onClick={() => togglePanel('customer-info')}
            >
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-blue-500" />
                <span className="hidden lg:block font-medium text-slate-700 dark:text-slate-200">Customer Info</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'customer-info' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'customer-info' && (
              <div className="mt-2">
                <CustomerInfoPanel />
              </div>
            )}
          </div>

          {/* Order Converter Panel */}
          <div className="order-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600"
              onClick={() => togglePanel('order-converter')}
            >
              <div className="flex items-center space-x-3">
                <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                <span className="hidden lg:block font-medium text-slate-700 dark:text-slate-200">Smart Converter</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'order-converter' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'order-converter' && (
              <div className="mt-2">
                <OrderConverterPanel />
              </div>
            )}
          </div>

          {/* Additional Info Panel */}
          <div className="additional-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600"
              onClick={() => togglePanel('additional-info')}
            >
              <div className="flex items-center space-x-3">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="hidden lg:block font-medium text-slate-700 dark:text-slate-200">Additional Info</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'additional-info' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'additional-info' && (
              <div className="mt-2">
                <AdditionalInfoPanel />
              </div>
            )}
          </div>

          {/* Personal Notes Panel */}
          <div className="notes-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 border border-slate-200 dark:border-slate-600"
              onClick={() => togglePanel('personal-notes')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <StickyNote className="h-2 w-2 text-white" />
                </div>
                <span className="hidden lg:block font-medium text-slate-700 dark:text-slate-200">Notes ✦</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'personal-notes' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'personal-notes' && (
              <div className="mt-2 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3" />
                  <Input
                    type="text"
                    className="pl-8 text-xs h-8"
                    placeholder="Search notes..."
                    value={notesSearchTerm}
                    onChange={(e) => setNotesSearchTerm(e.target.value)}
                  />
                </div>

                {/* Quick Notes List */}
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredPersonalNotes.length === 0 ? (
                    <div className="text-center text-slate-500 py-4 text-xs">
                      {notesSearchTerm ? 'No notes found' : 'No notes yet'}
                    </div>
                  ) : (
                    filteredPersonalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-50 dark:bg-slate-700 rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        {/* Header with title and controls */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                              {note.subject || 'Untitled'}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyNote(note);
                              }}
                              className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                              title="Copy note content"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNoteExpansion(note.id);
                              }}
                              className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                              title={expandedNotes.has(note.id) ? "Collapse note" : "Expand note"}
                            >
                              {expandedNotes.has(note.id) ? 
                                <ChevronUp className="h-3 w-3 text-slate-400" /> : 
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              }
                            </Button>
                          </div>
                        </div>

                        {/* Content with smart preview/expansion */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                          {expandedNotes.has(note.id) ? (
                            // Full content when expanded
                            note.content
                          ) : (
                            // Preview with smart truncation when collapsed
                            <div className="line-clamp-2">
                              {note.content.length > 60 ? 
                                `${note.content.substring(0, 60)}...` : 
                                note.content
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Note Button */}
                <div className="border-t pt-2">
                  <Button
                    onClick={() => {
                      // Open the PersonalNotes modal
                      const personalNotesModal = document.querySelector('[data-testid="personal-notes-dialog"]');
                      if (personalNotesModal) {
                        personalNotesModal.click();
                      } else {
                        // Fallback: trigger PersonalNotes component
                        const event = new CustomEvent('openPersonalNotes');
                        window.dispatchEvent(event);
                      }
                    }}
                    className="w-full text-xs py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New Note
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            <Button 
              onClick={onCheckOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 lg:p-3 transition-colors duration-200 shadow-sm"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Search className="h-4 w-4" />
                <span className="hidden lg:block font-medium">Check Order</span>
              </div>
            </Button>





            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-red-300 hover:bg-red-50 text-red-600 rounded-lg p-2 lg:p-3 transition-colors duration-200"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:block font-medium">Sign Out</span>
              </div>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
