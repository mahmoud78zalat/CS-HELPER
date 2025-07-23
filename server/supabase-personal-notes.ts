import { PersonalNote, InsertPersonalNote } from '@shared/schema';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create service role client that bypasses RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export class SupabasePersonalNotesStorage {
  // Get all personal notes for a user
  async getPersonalNotes(userId: string): Promise<PersonalNote[]> {
    console.log('[SupabaseStorage] 📝 Fetching personal notes for user:', userId);
    
    const { data, error } = await supabase
      .from('personal_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseStorage] ❌ Error fetching personal notes:', error);
      return [];
    }

    console.log('[SupabaseStorage] ✅ Successfully fetched notes:', data?.length || 0);
    return data?.map(this.mapSupabasePersonalNote) || [];
  }

  // Create new personal note
  async createPersonalNote(note: InsertPersonalNote): Promise<PersonalNote> {
    console.log('[SupabaseStorage] 📝 Creating personal note:', note);
    
    const { data, error } = await supabase
      .from('personal_notes')
      .insert({
        user_id: note.userId,
        subject: note.subject,
        content: note.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error creating personal note:', error);
      throw new Error(`Failed to create note: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully created note:', data);
    return this.mapSupabasePersonalNote(data);
  }

  // Update personal note
  async updatePersonalNote(id: string, updates: { subject: string; content: string }): Promise<PersonalNote> {
    console.log('[SupabaseStorage] 📝 Updating personal note:', id, updates);
    
    const { data, error } = await supabase
      .from('personal_notes')
      .update({
        subject: updates.subject,
        content: updates.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error updating personal note:', error);
      throw new Error(`Failed to update note: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully updated note:', data);
    return this.mapSupabasePersonalNote(data);
  }

  // Delete personal note
  async deletePersonalNote(id: string): Promise<void> {
    console.log('[SupabaseStorage] 🗑️ Deleting personal note:', id);
    
    const { data, error } = await supabase
      .from('personal_notes')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error deleting personal note:', error);
      throw new Error(`Failed to delete note: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully deleted note:', data);
  }

  // Map Supabase personal note to application format
  private mapSupabasePersonalNote(data: any): PersonalNote {
    return {
      id: data.id,
      userId: data.user_id,
      subject: data.subject || '',
      content: data.content,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
    };
  }
}