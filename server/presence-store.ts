/**
 * Redis-like Presence Store with TTL-based automatic expiry
 * Implements industry-standard presence tracking for real-time applications
 * Handles heartbeat logic, automatic offline detection, and scalable architecture
 */

export interface PresenceEntry {
  userId: string;
  isOnline: boolean;
  lastHeartbeat: number; // timestamp
  lastActivity: number; // timestamp
  sessionId: string;
  metadata: {
    userAgent?: string;
    ip?: string;
    pageTitle?: string;
    tabHidden?: boolean;
    pageUnloading?: boolean;
  };
}

export interface HeartbeatData {
  userId: string;
  sessionId: string;
  isActive: boolean;
  pageHidden?: boolean;
  pageVisible?: boolean;
  pageUnload?: boolean;
  lastActivity?: number;
  metadata?: Record<string, any>;
}

/**
 * TTL-based in-memory presence store
 * Mimics Redis behavior with automatic key expiry
 */
class PresenceStore {
  private store = new Map<string, PresenceEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly TTL_SECONDS = 90; // 90 seconds TTL - user goes offline after missing 3+ heartbeats
  private readonly CLEANUP_INTERVAL = 30 * 1000; // Clean expired entries every 30s
  private readonly HEARTBEAT_INTERVAL = 25 * 1000; // Expected heartbeat every 25s
  private subscribers = new Set<(userId: string, isOnline: boolean) => void>();

  constructor() {
    this.startCleanupTimer();
    console.log('[PresenceStore] 🚀 Initialized Redis-like presence store with TTL');
    console.log(`[PresenceStore] TTL: ${this.TTL_SECONDS}s, Cleanup: ${this.CLEANUP_INTERVAL/1000}s, Expected Heartbeat: ${this.HEARTBEAT_INTERVAL/1000}s`);
  }

  /**
   * Process heartbeat and update presence state
   * Only updates status when transitioning (online ↔ offline) to reduce noise
   */
  processHeartbeat(data: HeartbeatData): { statusChanged: boolean; wasOnline: boolean; isOnline: boolean } {
    const now = Date.now();
    const { userId, sessionId, isActive, pageHidden, pageVisible, pageUnload } = data;
    
    const existingEntry = this.store.get(userId);
    const wasOnline = existingEntry?.isOnline ?? false;
    
    // Determine new online status based on activity and page state
    let isOnline = isActive && !pageUnload && !pageHidden;
    
    // Special handling for visibility changes
    if (pageVisible && !pageUnload) {
      isOnline = true; // Page became visible = user is back
    }
    
    const newEntry: PresenceEntry = {
      userId,
      isOnline,
      lastHeartbeat: now,
      lastActivity: data.lastActivity || now,
      sessionId,
      metadata: {
        userAgent: data.metadata?.userAgent,
        ip: data.metadata?.ip,
        pageTitle: data.metadata?.pageTitle,
        tabHidden: pageHidden,
        pageUnloading: pageUnload,
      }
    };

    this.store.set(userId, newEntry);
    
    const statusChanged = wasOnline !== isOnline;
    
    if (statusChanged) {
      console.log(`[PresenceStore] 🔄 Status change: ${userId} ${wasOnline ? 'ONLINE' : 'OFFLINE'} → ${isOnline ? 'ONLINE' : 'OFFLINE'}`, {
        reason: pageUnload ? 'page_unload' : pageHidden ? 'tab_hidden' : pageVisible ? 'tab_visible' : isActive ? 'active' : 'inactive',
        sessionId: sessionId.slice(0, 8) + '...'
      });
      
      // Notify subscribers of status change
      this.notifySubscribers(userId, isOnline);
    }

    return { statusChanged, wasOnline, isOnline };
  }

  /**
   * Get current presence status for a user
   */
  getPresence(userId: string): PresenceEntry | null {
    const entry = this.store.get(userId);
    if (!entry) return null;
    
    // Check if entry has expired (TTL exceeded)
    const now = Date.now();
    const age = now - entry.lastHeartbeat;
    
    if (age > this.TTL_SECONDS * 1000) {
      // Entry expired - mark as offline and clean up
      this.store.delete(userId);
      console.log(`[PresenceStore] ⏰ TTL expired for ${userId} (${Math.round(age/1000)}s old)`);
      
      if (entry.isOnline) {
        this.notifySubscribers(userId, false); // Notify offline due to TTL
      }
      
      return null;
    }
    
    return entry;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): PresenceEntry[] {
    const now = Date.now();
    const onlineUsers: PresenceEntry[] = [];
    
    const entries = Array.from(this.store.entries());
    for (const [userId, entry] of entries) {
      const age = now - entry.lastHeartbeat;
      
      if (age > this.TTL_SECONDS * 1000) {
        // Expired entry
        this.store.delete(userId);
        if (entry.isOnline) {
          this.notifySubscribers(userId, false);
        }
        continue;
      }
      
      if (entry.isOnline) {
        onlineUsers.push(entry);
      }
    }
    
    return onlineUsers;
  }

  /**
   * Get presence statistics for monitoring
   */
  getStats(): {
    totalEntries: number;
    onlineUsers: number;
    offlineUsers: number;
    staleEntries: number;
    oldestEntry: number;
    newestEntry: number;
    averageAge: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.store.values());
    const ages = entries.map(e => now - e.lastHeartbeat);
    
    const onlineCount = entries.filter(e => e.isOnline && (now - e.lastHeartbeat) <= this.TTL_SECONDS * 1000).length;
    const staleCount = entries.filter(e => (now - e.lastHeartbeat) > this.TTL_SECONDS * 1000).length;
    
    return {
      totalEntries: entries.length,
      onlineUsers: onlineCount,
      offlineUsers: entries.length - onlineCount - staleCount,
      staleEntries: staleCount,
      oldestEntry: ages.length > 0 ? Math.max(...ages) : 0,
      newestEntry: ages.length > 0 ? Math.min(...ages) : 0,
      averageAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0
    };
  }

  /**
   * Subscribe to presence status changes
   */
  subscribe(callback: (userId: string, isOnline: boolean) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Force user offline (for logout, ban, etc.)
   */
  forceOffline(userId: string): void {
    const entry = this.store.get(userId);
    if (entry) {
      const wasOnline = entry.isOnline;
      entry.isOnline = false;
      entry.lastHeartbeat = Date.now();
      entry.metadata.pageUnloading = true;
      
      this.store.set(userId, entry);
      
      if (wasOnline) {
        console.log(`[PresenceStore] 💨 Force offline: ${userId}`);
        this.notifySubscribers(userId, false);
      }
    }
  }

  /**
   * Remove user from store completely
   */
  removeUser(userId: string): void {
    const entry = this.store.get(userId);
    if (entry && entry.isOnline) {
      this.notifySubscribers(userId, false);
    }
    this.store.delete(userId);
    console.log(`[PresenceStore] 🗑️ Removed user from presence store: ${userId}`);
  }

  /**
   * TTL-based automatic cleanup (Redis-like behavior)
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;
    let offlineNotifications = 0;
    
    const entries = Array.from(this.store.entries());
    for (const [userId, entry] of entries) {
      const age = now - entry.lastHeartbeat;
      
      if (age > this.TTL_SECONDS * 1000) {
        // TTL expired
        const wasOnline = entry.isOnline;
        this.store.delete(userId);
        expiredCount++;
        
        if (wasOnline) {
          this.notifySubscribers(userId, false);
          offlineNotifications++;
        }
      }
    }
    
    if (expiredCount > 0) {
      console.log(`[PresenceStore] 🧹 Cleanup: removed ${expiredCount} expired entries, ${offlineNotifications} offline notifications sent`);
    }
  }

  private notifySubscribers(userId: string, isOnline: boolean): void {
    const subscribers = Array.from(this.subscribers);
    for (const callback of subscribers) {
      try {
        callback(userId, isOnline);
      } catch (error) {
        console.error('[PresenceStore] Error in subscriber callback:', error);
      }
    }
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.subscribers.clear();
    this.store.clear();
    console.log('[PresenceStore] 🛑 Graceful shutdown complete');
  }
}

// Singleton instance
export const presenceStore = new PresenceStore();

// Graceful shutdown handlers
process.on('SIGTERM', () => presenceStore.shutdown());
process.on('SIGINT', () => presenceStore.shutdown());