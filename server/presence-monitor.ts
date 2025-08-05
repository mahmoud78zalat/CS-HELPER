import { storage } from './storage';

/**
 * Background service to monitor user presence and automatically mark stale users as offline
 * This ensures accurate online/offline status even when users close their browsers abruptly
 */
class PresenceMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute
  private readonly STALE_THRESHOLD = 3 * 60 * 1000; // 3 minutes stale = offline

  constructor() {
    console.log('[PresenceMonitor] Initializing real-time presence monitoring system');
  }

  start(): void {
    if (this.intervalId) {
      console.log('[PresenceMonitor] Already running');
      return;
    }

    console.log('[PresenceMonitor] 🚀 Starting real-time presence monitor');
    console.log(`[PresenceMonitor] Check interval: ${this.CHECK_INTERVAL / 1000}s`);
    console.log(`[PresenceMonitor] Stale threshold: ${this.STALE_THRESHOLD / 1000}s`);

    this.intervalId = setInterval(async () => {
      try {
        await this.checkStaleUsers();
      } catch (error) {
        console.error('[PresenceMonitor] Error during stale user check:', error);
      }
    }, this.CHECK_INTERVAL);

    // Run initial check immediately
    this.checkStaleUsers().catch(error => {
      console.error('[PresenceMonitor] Error during initial stale user check:', error);
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[PresenceMonitor] ⏹️ Stopped presence monitor');
    }
  }

  private async checkStaleUsers(): Promise<void> {
    try {
      const markedOffline = await storage.markStaleUsersOffline();
      
      if (markedOffline > 0) {
        console.log(`[PresenceMonitor] ⚡ Marked ${markedOffline} stale users offline`);
      }
    } catch (error) {
      console.error('[PresenceMonitor] Error marking stale users offline:', error);
    }
  }

  // Manual trigger for testing
  async triggerCheck(): Promise<number> {
    console.log('[PresenceMonitor] 🔧 Manual stale user check triggered');
    try {
      return await storage.markStaleUsersOffline();
    } catch (error) {
      console.error('[PresenceMonitor] Error during manual check:', error);
      return 0;
    }
  }

  getStatus(): { running: boolean; checkInterval: number; staleThreshold: number } {
    return {
      running: this.intervalId !== null,
      checkInterval: this.CHECK_INTERVAL,
      staleThreshold: this.STALE_THRESHOLD
    };
  }
}

export const presenceMonitor = new PresenceMonitor();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[PresenceMonitor] Received SIGTERM, stopping presence monitor...');
  presenceMonitor.stop();
});

process.on('SIGINT', () => {
  console.log('[PresenceMonitor] Received SIGINT, stopping presence monitor...');
  presenceMonitor.stop();
});