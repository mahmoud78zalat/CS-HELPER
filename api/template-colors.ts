import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { colors } = req.body;
    
    if (!colors || typeof colors !== 'object') {
      return res.status(400).json({ error: 'Invalid colors data' });
    }

    // Update color settings in database
    for (const [key, color] of Object.entries(colors)) {
      const { error } = await supabase
        .from('color_settings')
        .upsert({
          target_type: 'genre',
          target_name: key,
          color_value: color,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'target_type,target_name'
        });
        
      if (error) {
        console.error(`[Template Colors API] Error updating color for ${key}:`, error);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Template Colors API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}