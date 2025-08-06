import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit3, Copy, Plus, StickyNote, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { PersonalNote } from '@shared/schema';

interface PersonalNotesProps {
  open: boolean;
  onClose: () => void;
}

export default function PersonalNotes({ open, onClose }: PersonalNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  // Fetch user's personal notes with auto-refresh and smooth updates
  const { data: notes = [], isLoading } = useQuery<PersonalNote[]>({
    queryKey: ['/api/personal-notes', user?.id],
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data fresh for 10 seconds
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
      
      const data = await response.json();
      return data;
    },
  });

  // Create new note mutation using direct fetch to bypass Vite interception
  const createNoteMutation = useMutation({
    mutationFn: async ({ subject, content }: { subject: string; content: string }) => {
      console.log('Creating note with subject:', subject, 'content:', content, 'userId:', user?.id);
      
      const response = await fetch('/api/personal-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({ subject, content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create note');
      }

      return response.json();
    },
    onSuccess: () => {
      setNewNote('');
      setNewSubject('');
      toast({
        title: "Success!",
        description: "Note created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create note.",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, subject, content }: { id: string; subject: string; content: string }) => {
      const response = await fetch(`/api/personal-notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({ subject, content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update note');
      }

      return response.json();
    },
    onSuccess: () => {
      setEditingId(null);
      setEditContent('');
      setEditSubject('');
      toast({
        title: "Success!",
        description: "Note updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update note.",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await fetch(`/api/personal-notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete note');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Note deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note.",
        variant: "destructive",
      });
    },
  });

  const handleCreateNote = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSubject.trim() && newNote.trim() && !createNoteMutation.isPending) {
      console.log('Creating note:', newSubject.trim(), newNote.trim());
      createNoteMutation.mutate({ subject: newSubject.trim(), content: newNote.trim() });
    }
  };

  const handleUpdateNote = (id: string) => {
    if (editSubject.trim() && editContent.trim()) {
      updateNoteMutation.mutate({ id, subject: editSubject.trim(), content: editContent.trim() });
    }
  };

  const handleCopyNote = (note: PersonalNote) => {
    navigator.clipboard.writeText(note.content);
    toast({
      title: "Note Copied!",
      description: `"${note.subject || 'Note'}" has been copied to clipboard.`,
    });
  };

  const startEditing = (note: PersonalNote) => {
    setEditingId(note.id);
    setEditSubject(note.subject || ''); 
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
    setEditSubject('');
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.subject && note.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <StickyNote className="h-4 w-4 text-white" />
              </div>
              Personal Notes ✦
            </DialogTitle>
          </DialogHeader>

          <div className="flex h-full overflow-hidden">
            {/* Left Panel - Notes List */}
            <div className="w-1/2 pr-4 flex flex-col">
              {/* Add New Note Section - Moved above search */}
              <div className="mb-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Quick Add Note
                </h4>
                <form onSubmit={handleCreateNote} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Note subject..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    placeholder="Note content..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="text-sm min-h-[60px] resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={!newSubject.trim() || !newNote.trim() || createNoteMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-sm py-2"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    {createNoteMutation.isPending ? 'Creating...' : 'Add Note'}
                  </Button>
                </form>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {isLoading ? (
                  <div className="text-center text-gray-500 py-8">Loading your notes...</div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {searchTerm ? 'No notes match your search.' : 'No notes yet. Create your first note!'}
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-semibold line-clamp-1">
                            {note.subject || `Note #${notes.indexOf(note) + 1}`}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyNote(note);
                              }}
                              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              title="Copy note content"
                            >
                              <Copy className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(note);
                              }}
                              className="h-6 w-6 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                              title="Edit note"
                            >
                              <Edit3 className="h-3 w-3 text-yellow-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNoteMutation.mutate({ id: note.id });
                              }}
                              disabled={deleteNoteMutation.isPending}
                              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                              title="Delete note"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {note.content}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-2">
                          {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Edit Form (only when editing) */}
            <div className="w-1/2 pl-4 border-l">
              {editingId ? (
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Edit Note
                  </h3>

                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Subject Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        type="text"
                        placeholder="Enter note subject..."
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                      />
                    </div>

                    {/* Content Textarea */}
                    <div className="flex-1 flex flex-col">
                      <label className="block text-sm font-medium mb-2">Note Content</label>
                      <Textarea
                        placeholder="Write your note content..."
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 resize-none min-h-[300px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      type="button"
                      onClick={() => handleUpdateNote(editingId)}
                      disabled={!editSubject.trim() || !editContent.trim() || updateNoteMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {updateNoteMutation.isPending ? 'Updating...' : 'Update Note'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditing}
                      className="px-6"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <StickyNote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a note to edit</p>
                    <p className="text-sm">Click the edit button on any note to modify it</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }