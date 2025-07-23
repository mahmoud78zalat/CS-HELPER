import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Copy, Plus, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { PersonalNote } from '@shared/schema';

export default function PersonalNotes() {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's personal notes (user-specific)
  const { data: notes = [], isLoading } = useQuery<PersonalNote[]>({
    queryKey: ['/api/personal-notes', user?.id],
    enabled: !!user,
  });

  // Create new note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/personal-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes', user?.id] });
      setNewNote('');
      toast({
        title: "Note Created",
        description: "Your personal note has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await fetch(`/api/personal-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/personal-notes', user?.id] });
      setEditingId(null);
      setEditContent('');
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

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/personal-notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      return response.json();
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

  const handleCreateNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim());
    }
  };

  const handleUpdateNote = (id: string) => {
    if (editContent.trim()) {
      updateNoteMutation.mutate({ id, content: editContent.trim() });
    }
  };

  const handleCopyNote = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Note content copied to clipboard.",
    });
  };

  const startEditing = (note: PersonalNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Notes ✦
        </h3>
        <div className="text-sm text-gray-500">Loading your notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <StickyNote className="h-4 w-4 text-white" />
        </div>
        Notes ✦
      </h3>

      {/* Add New Note */}
      <Card className="border-dashed border-2 border-purple-300 bg-purple-50/30">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Textarea
              placeholder="Write a quick note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] resize-none border-purple-200 focus:border-purple-400"
            />
            <Button
              onClick={handleCreateNote}
              disabled={!newNote.trim() || createNoteMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createNoteMutation.isPending ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                          onClick={() => handleCopyNote(note.content)}
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