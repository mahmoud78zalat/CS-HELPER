import { Request, Response } from 'express';
import { storage } from './storage';

export async function healthCheck(req: Request, res: Response) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'disconnected',
      storage: 'unknown'
    };

    // Test database connection by attempting to get users
    try {
      const users = await storage.getAllUsers();
      healthData.database = 'connected';
      healthData.storage = 'functional';
    } catch (error) {
      console.error('[Health Check] Database test failed:', error);
      healthData.database = 'error';
      healthData.storage = 'fallback';
    }

    // Return 200 if basic app is running, even with database issues
    res.status(200).json(healthData);
  } catch (error) {
    console.error('[Health Check] Critical error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Critical system error'
    });
  }
}