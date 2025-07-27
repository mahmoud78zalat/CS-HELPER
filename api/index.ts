// Vercel serverless function entry point
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { testServerlessConnection, createServerlessAdminClient } from './supabase-client';

const app = express();

// Basic middleware for serverless function
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for deployment - Allow all origins for Vercel deployment
app.use((req: Request, res: Response, next: NextFunction) => {
  // Allow all origins in production for Vercel deployment flexibility
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Health check with database test - optimized for Vercel serverless
app.get('/api/health', async (req, res) => {
  try {
    const connectionTest = await testServerlessConnection();
    
    res.json({ 
      status: connectionTest.success ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      platform: process.env.VERCEL ? 'Vercel Serverless' : 'Development',
      supabase: {
        configured: !!process.env.VITE_SUPABASE_URL,
        connected: connectionTest.success
      },
      database: connectionTest.success ? 'connected' : 'failed',
      userCount: connectionTest.userCount,
      error: connectionTest.error || undefined
    });
  } catch (error) {
    console.error('[API Health Check] Error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      platform: process.env.VERCEL ? 'Vercel Serverless' : 'Development',
      supabase: {
        configured: !!process.env.VITE_SUPABASE_URL,
        connected: false
      },
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Core API endpoints for serverless deployment
app.get('/api/templates', async (req, res) => {
  try {
    const supabase = createServerlessAdminClient();
    const { data: templates, error } = await supabase
      .from('live_reply_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(templates || []);
  } catch (error) {
    console.error('[API Templates] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/site-content', async (req, res) => {
  try {
    const supabase = createServerlessAdminClient();
    const { data: content, error } = await supabase
      .from('site_content')
      .select('*');

    if (error) throw error;
    res.json(content || []);
  } catch (error) {
    console.error('[API Site Content] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/color-settings', async (req, res) => {
  try {
    const supabase = createServerlessAdminClient();
    const { data: colors, error } = await supabase
      .from('color_settings')
      .select('*');

    if (error) throw error;
    res.json(colors || []);
  } catch (error) {
    console.error('[API Color Settings] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/template-colors', async (req, res) => {
  try {
    const supabase = createServerlessAdminClient();
    const { data, error } = await supabase
      .from('color_settings')
      .upsert(req.body, { onConflict: 'category,genre' })
      .select();

    if (error) throw error;
    res.json(data?.[0] || {});
  } catch (error) {
    console.error('[API Template Colors] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = createServerlessAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    console.error('[API User] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/templates/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = createServerlessAdminClient();
    
    // Increment usage count
    const { data, error } = await supabase
      .rpc('increment_live_reply_usage', { template_id: id });

    if (error) throw error;
    res.json({ success: true, newCount: data });
  } catch (error) {
    console.error('[API Template Use] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/chatbase/verify-hash/:userId', async (req, res) => {
  try {
    // Simple hash verification - return success for demo
    res.json({ hash: 'demo-hash', verified: true });
  } catch (error) {
    console.error('[API Chatbase] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/announcements/unacknowledged/:userId', async (req, res) => {
  try {
    // Return empty announcements for now
    res.json([]);
  } catch (error) {
    console.error('[API Announcements] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/user/heartbeat', async (req, res) => {
  try {
    // Simple heartbeat response
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[API Heartbeat] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel serverless function
export default app;