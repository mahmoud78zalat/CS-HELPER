// Vercel serverless function entry point - Proper handler pattern
import type { Request, Response } from 'express';
import { storage } from '../server/storage';

// Vercel handler function - this is the correct pattern for Vercel 2025
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] // Replace with your actual domain
    : ['http://localhost:5000', 'http://localhost:3000'];
    
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse the URL to get the API path
    const url = new URL(req.url!, `https://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method;

    console.log(`[Vercel API] ${method} ${path}`);

    // Health check endpoint
    if (path === '/api/health') {
      return res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        supabase: !!process.env.VITE_SUPABASE_URL
      });
    }

    // Templates endpoint - the main issue
    if (path === '/api/templates' && method === 'GET') {
      const templates = await storage.getLiveReplyTemplates();
      console.log(`[Vercel API] Found ${templates.length} templates`);
      return res.json(templates);
    }

    // User endpoint
    if (path.startsWith('/api/user/') && method === 'GET') {
      const userId = path.split('/')[3];
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(user);
    }

    // Email templates endpoint
    if (path === '/api/email-templates' && method === 'GET') {
      const templates = await storage.getEmailTemplates();
      return res.json(templates);
    }

    // Site content endpoint
    if (path === '/api/site-content' && method === 'GET') {
      const content = await storage.getSiteContent();
      return res.json(content);
    }

    // Color settings endpoint
    if (path === '/api/color-settings' && method === 'GET') {
      const settings = await storage.getColorSettings();
      return res.json(settings);
    }

    // Template usage endpoint
    if (path.includes('/use') && method === 'POST') {
      const templateId = path.split('/')[3];
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await storage.incrementLiveReplyUsage(templateId, body?.userId || 'anonymous');
      return res.json({ success: true, templateId });
    }

    // Announcements endpoint
    if (path.includes('/announcements') && method === 'GET') {
      const announcements = await storage.getAnnouncements();
      return res.json(announcements);
    }

    // Default 404 for unknown routes
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: path,
      method: method
    });

  } catch (error) {
    console.error('[Vercel API Error]:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}