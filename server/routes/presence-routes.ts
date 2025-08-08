/**
 * Enhanced Presence API Routes
 * Modern REST endpoints for the new Redis-like presence tracking system
 * Handles heartbeats, presence queries, and real-time status management
 */

import express from 'express';
import { presenceStore } from '../presence-store';
import { wsPresenceManager } from '../websocket-presence';
import { storage } from '../storage';

const router = express.Router();

/**
 * Authentication middleware for presence endpoints
 */
async function requireAuth(req: any, res: any, next: any) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required - User ID missing' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required - User not found' });
    }

    req.user = { ...user, userId };
    next();
  } catch (error) {
    console.error('[PresenceAPI] Auth error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

/**
 * POST /api/presence/heartbeat
 * Process heartbeat from client with enhanced metadata
 */
router.post('/heartbeat', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const {
      sessionId,
      isActive = true,
      pageHidden = false,
      pageVisible = false,
      pageUnload = false,
      lastActivity,
      metadata = {}
    } = req.body;

    console.log(`[PresenceAPI] 💓 Heartbeat from ${userId}:`, {
      isActive,
      pageHidden,
      pageVisible,
      pageUnload,
      sessionId: sessionId?.slice(0, 8) + '...'
    });

    // Process heartbeat through the new presence store
    const result = presenceStore.processHeartbeat({
      userId,
      sessionId: sessionId || 'unknown',
      isActive,
      pageHidden,
      pageVisible,
      pageUnload,
      lastActivity: lastActivity ? new Date(lastActivity).getTime() : Date.now(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        ...metadata
      }
    });

    // Also update the database for persistence (async)
    storage.updateUserOnlineStatus(userId, result.isOnline).catch(error => {
      console.error('[PresenceAPI] Database update failed:', error);
    });

    res.json({
      success: true,
      userId,
      isOnline: result.isOnline,
      statusChanged: result.statusChanged,
      previousStatus: result.wasOnline ? 'online' : 'offline',
      currentStatus: result.isOnline ? 'online' : 'offline',
      timestamp: new Date().toISOString(),
      ttl: 90, // seconds
      nextHeartbeatExpected: 25 // seconds
    });

  } catch (error) {
    console.error('[PresenceAPI] Heartbeat error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process heartbeat',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/presence/status/:userId?
 * Get presence status for specific user or current user
 */
router.get('/status/:userId?', requireAuth, async (req: any, res) => {
  try {
    const targetUserId = req.params.userId || req.user.userId;
    const requesterId = req.user.userId;

    // Security check: non-admin users can only check their own status
    if (targetUserId !== requesterId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Forbidden - Can only check own status unless admin' 
      });
    }

    const presence = presenceStore.getPresence(targetUserId);

    if (!presence) {
      return res.json({
        userId: targetUserId,
        isOnline: false,
        lastSeen: null,
        status: 'offline',
        reason: 'No recent heartbeat'
      });
    }

    res.json({
      userId: presence.userId,
      isOnline: presence.isOnline,
      lastSeen: new Date(presence.lastActivity).toISOString(),
      lastHeartbeat: new Date(presence.lastHeartbeat).toISOString(),
      status: presence.isOnline ? 'online' : 'offline',
      sessionId: presence.sessionId.slice(0, 8) + '...',
      metadata: {
        pageHidden: presence.metadata.tabHidden,
        pageUnloading: presence.metadata.pageUnloading
      }
    });

  } catch (error) {
    console.error('[PresenceAPI] Status check error:', error);
    res.status(500).json({ 
      message: 'Failed to get presence status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/presence/online
 * Get all currently online users (admin only)
 */
router.get('/online', requireAuth, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const onlineUsers = presenceStore.getOnlineUsers();
    
    const userList = onlineUsers.map(presence => ({
      userId: presence.userId,
      lastSeen: new Date(presence.lastActivity).toISOString(),
      lastHeartbeat: new Date(presence.lastHeartbeat).toISOString(),
      sessionId: presence.sessionId.slice(0, 8) + '...',
      metadata: {
        pageHidden: presence.metadata.tabHidden,
        userAgent: presence.metadata.userAgent?.slice(0, 50) + '...'
      }
    }));

    res.json({
      count: userList.length,
      users: userList,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PresenceAPI] Online users error:', error);
    res.status(500).json({ 
      message: 'Failed to get online users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/presence/stats
 * Get presence system statistics (admin only)
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const presenceStats = presenceStore.getStats();
    const websocketStats = wsPresenceManager.getStats();
    
    res.json({
      presence: {
        ...presenceStats,
        oldestEntryAge: Math.round(presenceStats.oldestEntry / 1000), // convert to seconds
        newestEntryAge: Math.round(presenceStats.newestEntry / 1000),
        averageAge: Math.round(presenceStats.averageAge / 1000)
      },
      websocket: {
        ...websocketStats,
        averageConnectionAge: Math.round(websocketStats.averageConnectionAge / 1000)
      },
      system: {
        ttlSeconds: 90,
        heartbeatIntervalSeconds: 25,
        cleanupIntervalSeconds: 30,
        pingIntervalSeconds: 30,
        connectionTimeoutSeconds: 60
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PresenceAPI] Stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get presence statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/presence/force-offline/:userId
 * Force a user offline (admin only - for bans, logouts, etc.)
 */
router.post('/force-offline/:userId', requireAuth, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const targetUserId = req.params.userId;
    
    // Force offline in presence store
    presenceStore.forceOffline(targetUserId);
    
    // Update database
    await storage.updateUserOnlineStatus(targetUserId, false);
    
    console.log(`[PresenceAPI] 💨 Admin ${req.user.userId} forced ${targetUserId} offline`);
    
    res.json({
      success: true,
      message: `User ${targetUserId} forced offline`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PresenceAPI] Force offline error:', error);
    res.status(500).json({ 
      message: 'Failed to force user offline',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/presence/cleanup
 * Manual cleanup of stale presence entries (admin only)
 */
router.post('/cleanup', requireAuth, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get stats before cleanup
    const statsBefore = presenceStore.getStats();
    
    // The cleanup happens automatically, but we can trigger a manual stats check
    // by getting online users (which triggers cleanup)
    presenceStore.getOnlineUsers();
    
    const statsAfter = presenceStore.getStats();
    
    const cleaned = statsBefore.staleEntries;
    
    console.log(`[PresenceAPI] 🧹 Manual cleanup by admin ${req.user.userId}: ${cleaned} entries`);
    
    res.json({
      success: true,
      message: `Cleanup complete`,
      entriesRemoved: cleaned,
      before: statsBefore,
      after: statsAfter,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PresenceAPI] Manual cleanup error:', error);
    res.status(500).json({ 
      message: 'Failed to perform cleanup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/presence/health
 * Health check endpoint for presence system
 */
router.get('/health', (req, res) => {
  try {
    const stats = presenceStore.getStats();
    const wsStats = wsPresenceManager.getStats();
    
    const isHealthy = stats.totalEntries >= 0 && wsStats.totalConnections >= 0;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      presence: {
        totalEntries: stats.totalEntries,
        onlineUsers: stats.onlineUsers
      },
      websocket: {
        totalConnections: wsStats.totalConnections
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[PresenceAPI] Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;