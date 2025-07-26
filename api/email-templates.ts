import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (req.method === 'GET') {
      const { category, genre, search, isActive } = req.query;
      
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (category) query = query.eq('category', category);
      if (genre) query = query.eq('genre', genre);
      if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,subject_en.ilike.%${search}%,content_en.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[Email Templates API] Error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[Email Templates API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}