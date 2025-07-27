// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase client setup for Vercel
const getSupabaseClient = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[Vercel API] Environment check:', {
    urlPresent: !!url,
    serviceKeyPresent: !!serviceKey,
    nodeEnv: process.env.NODE_ENV
  });
  
  if (!url || !serviceKey) {
    throw new Error(`Missing Supabase credentials: URL=${!!url}, ServiceKey=${!!serviceKey}`);
  }
  
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
};

// CORS headers helper
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Main serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { url } = req;
  console.log('[Vercel API] Request:', req.method, url);
  
  try {
    // Health check endpoint
    if (url === '/api/health') {
      const supabase = getSupabaseClient();
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
        
      if (error) throw error;
      
      return res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        platform: 'Vercel Serverless',
        userCount: users?.length || 0
      });
    }
    
    // Templates endpoint
    if (url === '/api/templates' && req.method === 'GET') {
      const supabase = getSupabaseClient();
      const { data: templates, error } = await supabase
        .from('live_reply_templates')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return res.json(templates || []);
    }
    
    // Site content endpoint
    if (url === '/api/site-content' && req.method === 'GET') {
      const supabase = getSupabaseClient();
      const { data: content, error } = await supabase
        .from('site_content')
        .select('*');
        
      if (error) throw error;
      return res.json(content || []);
    }
    
    // Color settings endpoint
    if (url === '/api/color-settings' && req.method === 'GET') {
      const supabase = getSupabaseClient();
      const { data: colors, error } = await supabase
        .from('color_settings')
        .select('*');
        
      if (error) throw error;
      return res.json(colors || []);
    }
    
    // Template colors POST endpoint
    if (url === '/api/template-colors' && req.method === 'POST') {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('color_settings')
        .upsert(req.body, { onConflict: 'category,genre' })
        .select();
        
      if (error) throw error;
      return res.json(data?.[0] || {});
    }
    
    // User endpoint
    if (url?.startsWith('/api/user/') && req.method === 'GET') {
      const userId = url.split('/').pop();
      if (userId === 'heartbeat') {
        return res.json({ success: true, timestamp: new Date().toISOString() });
      }
      
      const supabase = getSupabaseClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return res.json(user);
    }
    
    // Template usage endpoint
    if (url?.match(/\/api\/templates\/[^\/]+\/use$/) && req.method === 'POST') {
      const templateId = url.split('/')[3];
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .rpc('increment_live_reply_usage', { template_id: templateId });
        
      if (error) throw error;
      return res.json({ success: true, newCount: data });
    }
    
    // Chatbase verification
    if (url?.startsWith('/api/chatbase/verify-hash/')) {
      return res.json({ hash: 'demo-hash', verified: true });
    }
    
    // Announcements
    if (url?.startsWith('/api/announcements/unacknowledged/')) {
      return res.json([]);
    }
    
    // User heartbeat
    if (url === '/api/user/heartbeat' && req.method === 'POST') {
      return res.json({ success: true, timestamp: new Date().toISOString() });
    }
    
    // 404 for unmatched routes
    return res.status(404).json({
      error: 'Not found',
      path: url,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Vercel API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}