import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit3, Copy, Plus, StickyNote, Search, X, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { PersonalNote } from '@shared/schema';

export default function PersonalNotes() {
  const [newNote, setNewNote] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's personal notes using direct fetch to bypass Vite interception
  const { data: notes = [], isLoading } = useQuery<PersonalNote[]>({
    queryKey: ['/api/personal-notes', user?.id],
    enabled: !!user,
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
      console.log('Fetched notes:', data);
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
        throw new Error('Failed to create note');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Note created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes', user?.id] });
      setNewNote('');
      setNewSubject('');
      toast({
        title: "Note Created",
        description: "Your personal note has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Create note error:', error);
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update note mutation using direct fetch
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, subject, content }: { id: string; subject: string; content: string }) => {
      const response = await fetch(`/api/personal-notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject, content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes', user?.id] });
      setEditingId(null);
      setEditContent('');
      setEditSubject('');
      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation using direct fetch
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personal-notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      return response.status === 204 ? null : await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes', user?.id] });
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
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
    const fullText = `${note.subject || 'Untitled'}\n\n${note.content}`;
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Copied!",
      description: "Complete note copied to clipboard.",
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
    <div className="space-y-4">
      {/* Notes Dropdown Toggle */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="flex items-center gap-2 w-full"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <StickyNote className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-left">Personal Notes ({notes.length})</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Fullscreen Notes Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                              onClick={() => handleCopyNote(note)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(note)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 line-clamp-2">{note.content.substring(0, 120)}{note.content.length > 120 ? '...' : ''}</p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'No date'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Add/Edit Note */}
            <div className="w-1/2 pl-4 border-l">
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4">
                  {editingId ? 'Edit Note' : 'Add New Note'}
                </h3>

                <form onSubmit={handleCreateNote} className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject (Note Title)</label>
                      <Input
                        placeholder="Enter note subject/title..."
                        value={editingId ? editSubject : newSubject}
                        onChange={(e) => editingId ? setEditSubject(e.target.value) : setNewSubject(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="text-sm font-medium mb-2 block">Note Content</label>
                      <Textarea
                        placeholder="Write your note content..."
                        value={editingId ? editContent : newNote}
                        onChange={(e) => editingId ? setEditContent(e.target.value) : setNewNote(e.target.value)}
                        className="flex-1 resize-none min-h-[300px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {editingId ? (
                      <>
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
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => handleCreateNote()}
                        disabled={!newSubject.trim() || !newNote.trim() || createNoteMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {createNoteMutation.isPending ? 'Saving...' : 'Add Note'}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Notes */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <StickyNote className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No notes yet. Create your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                {editingId === note.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editContent.trim() || updateNoteMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={updateNoteMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {note.content}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date'}
                      </Badge>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyNote(note)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(note)}
                          className="h-8 w-8 p-0 hover:bg-yellow-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          disabled={deleteNoteMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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