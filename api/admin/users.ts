import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[Admin Users API] Error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Map Supabase data to frontend format
    const users = data.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      profileImageUrl: user.profile_image_url || '',
      role: user.role,
      status: user.status,
      isOnline: user.is_online,
      lastSeen: new Date(user.last_seen),
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }));

    return res.status(200).json(users);
  } catch (error) {
    console.error('[Admin Users API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}