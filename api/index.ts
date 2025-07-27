// Vercel serverless function entry point
import express from 'express';
import { registerRoutes } from '../server/simple-routes';
import type { Request, Response, NextFunction } from 'express';

const app = express();

// Basic middleware for serverless function
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for deployment
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] // Update with your actual domain
    : ['http://localhost:5000', 'http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Initialize routes synchronously for serverless
registerRoutes(app);

// Health check with database test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { storage } = await import('../server/storage');
    const users = await storage.getUsers();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: !!process.env.VITE_SUPABASE_URL,
      database: 'connected',
      userCount: users.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: !!process.env.VITE_SUPABASE_URL,
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error('API Error:', err);
  res.status(status).json({ message });
});

// 404 handler for unmatched routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export for Vercel serverless function
export default app;