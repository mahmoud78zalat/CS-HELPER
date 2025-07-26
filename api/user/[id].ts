import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('[User API] Error:', error);
      return res.status(404).json({ message: 'User not found' });
    }

    // Map Supabase data to frontend format
    const user = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url || '',
      role: data.role,
      status: data.status,
      isOnline: data.is_online,
      lastSeen: new Date(data.last_seen),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return res.status(200).json(user);
  } catch (error) {
    console.error('[User API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}