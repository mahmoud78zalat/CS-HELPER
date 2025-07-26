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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData) {
      // Auto-create user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'User',
          last_name: user.user_metadata?.last_name || '',
          role: 'agent',
          status: 'active',
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('[Auth API] Error creating user:', createError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      // Return the newly created user
      const mappedUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        profileImageUrl: newUser.profile_image_url || '',
        role: newUser.role,
        status: newUser.status,
        isOnline: newUser.is_online,
        lastSeen: new Date(newUser.last_seen),
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at)
      };
      
      return res.status(200).json(mappedUser);
    }

    // Map existing user data to frontend format
    const mappedUser = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      profileImageUrl: userData.profile_image_url || '',
      role: userData.role,
      status: userData.status,
      isOnline: userData.is_online,
      lastSeen: new Date(userData.last_seen),
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at)
    };

    return res.status(200).json(mappedUser);
  } catch (error) {
    console.error('[Auth API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}