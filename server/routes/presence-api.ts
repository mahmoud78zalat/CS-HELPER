import { Router } from 'express';
import { storage } from '../storage';
// Note: Using the existing auth middleware from routes.ts
async function requireSupabaseAuth(req: any, res: any, next: any) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required - User ID missing' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required - User not found' });
    }

    req.user = { claims: { sub: userId }, userDetails: user };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}
import { presenceMonitor } from '../presence-monitor';

const router = Router();

/**
 * Enhanced presence API endpoints for real-time user status management
 */

// Get current presence status
router.get('/status', requireSupabaseAuth, async (req: any, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      userId: user.id,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      monitorStatus: presenceMonitor.getStatus()
    });
  } catch (error) {
    console.error('[Presence API] Error getting status:', error);
    res.status(500).json({ message: 'Failed to get presence status' });
  }
});

// Trigger manual stale user check (admin only)
router.post('/check-stale', requireSupabaseAuth, async (req: any, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const markedOffline = await presenceMonitor.triggerCheck();
    
    res.json({
      message: `Manually marked ${markedOffline} users offline`,
      count: markedOffline
    });
  } catch (error) {
    console.error('[Presence API] Error in manual check:', error);
    res.status(500).json({ message: 'Failed to check stale users' });
  }
});

// Get presence monitor statistics
router.get('/monitor/stats', requireSupabaseAuth, async (req: any, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const stats = presenceMonitor.getStatus();
    
    res.json({
      monitor: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Presence API] Error getting monitor stats:', error);
    res.status(500).json({ message: 'Failed to get monitor statistics' });
  }
});

export { router as presenceApiRouter };