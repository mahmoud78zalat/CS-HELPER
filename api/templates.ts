import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get Supabase credentials with multiple fallback patterns
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.VITE_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL ||
                       'https://lafldimdrginjqloihbh.supabase.co';
                       
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_ANON_KEY || 
                       process.env.VITE_SUPABASE_ANON_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';
    
    console.log('[Vercel Templates API] URL:', supabaseUrl ? 'present' : 'missing');
    console.log('[Vercel Templates API] Key:', supabaseKey ? 'present' : 'missing');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (req.method === 'GET') {
      // Get query parameters
      const { category, genre, search, isActive } = req.query;
      
      console.log('[Vercel Templates API] Fetching templates with filters:', { category, genre, search, isActive });
      
      let query = supabase
        .from('live_reply_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      if (genre) {
        query = query.eq('genre', genre);
      }
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive === 'true');
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,content_en.ilike.%${search}%,content_ar.ilike.%${search}%`);
      }
      
      const { data: templates, error } = await query;
      
      if (error) {
        console.error('[Vercel Templates API] Fetch error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      console.log('[Vercel Templates API] Found templates:', templates?.length || 0);
      
      // Convert snake_case to camelCase to match frontend expectations
      const formattedTemplates = templates?.map(template => ({
        id: template.id,
        name: template.name,
        contentEn: template.content_en,
        contentAr: template.content_ar,
        category: template.category,
        genre: template.genre,
        isActive: template.is_active,
        warningNote: template.warning_note,
        variables: template.variables,
        usageCount: template.usage_count,
        createdBy: template.created_by,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      })) || [];
      
      return res.status(200).json(formattedTemplates);
    }
    
    if (req.method === 'POST') {
      // Create new template
      const templateData = req.body;
      
      const { data: template, error } = await supabase
        .from('live_reply_templates')
        .insert({
          name: templateData.name,
          content_en: templateData.contentEn,
          content_ar: templateData.contentAr,
          category: templateData.category,
          genre: templateData.genre,
          is_active: templateData.isActive,
          warning_note: templateData.warningNote,
          variables: templateData.variables,
          created_by: templateData.createdBy
        })
        .select()
        .single();
      
      if (error) {
        console.error('[Vercel Templates API] Create error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(201).json(template);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('[Vercel Templates API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}