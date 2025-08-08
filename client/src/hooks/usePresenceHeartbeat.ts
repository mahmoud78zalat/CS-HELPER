/**
 * Client-side Heartbeat Hook for Enhanced Presence Tracking
 * Implements industry-standard heartbeat logic with intelligent activity detection
 * Handles page visibility, network resilience, and graceful degradation
 */

import { useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';

export interface HeartbeatConfig {
  userId: string;
  enabled?: boolean;
  heartbeatInterval?: number; // milliseconds
  activityTimeout?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

interface HeartbeatState {
  lastActivity: number;
  lastHeartbeat: number;
  sessionId: string;
  retryCount: number;
  isActive: boolean;
  pageHidden: boolean;
}

/**
 * Enhanced presence heartbeat hook with Redis-like behavior
 * Features:
 * - Smart activity detection (mouse, keyboard, touch, scroll)
 * - Page visibility tracking
 * - Network retry logic with exponential backoff
 * - Graceful page unload handling
 * - Battery-efficient when tab is hidden
 */
export function usePresenceHeartbeat(config: HeartbeatConfig) {
  const {
    userId,
    enabled = true,
    heartbeatInterval = 25000, // 25 seconds - industry standard
    activityTimeout = 60000, // 1 minute inactive = user away
    maxRetries = 3,
    retryDelay = 2000
  } = config;

  const state = useRef<HeartbeatState>({
    lastActivity: Date.now(),
    lastHeartbeat: 0,
    sessionId: nanoid(),
    retryCount: 0,
    isActive: true,
    pageHidden: false
  });

  const heartbeatInterval_ = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Send heartbeat to server with retry logic
   */
  const sendHeartbeat = useCallback(async (extraData: Partial<{
    pageVisible: boolean;
    pageUnload: boolean;
    isActive: boolean;
  }> = {}) => {
    if (!enabled || !userId) return;

    const now = Date.now();
    const timeSinceActivity = now - state.current.lastActivity;
    const isUserActive = timeSinceActivity < activityTimeout;
    
    const heartbeatData = {
      userId,
      sessionId: state.current.sessionId,
      isActive: extraData.isActive ?? isUserActive,
      pageHidden: state.current.pageHidden,
      pageVisible: extraData.pageVisible ?? false,
      pageUnload: extraData.pageUnload ?? false,
      lastActivity: state.current.lastActivity,
      metadata: {
        userAgent: navigator.userAgent,
        pageTitle: document.title,
        timeSinceActivity: Math.round(timeSinceActivity / 1000),
        heartbeatInterval: Math.round(heartbeatInterval / 1000)
      }
    };

    console.log(`[PresenceHeartbeat] 💓 Sending heartbeat:`, {
      isActive: heartbeatData.isActive,
      pageHidden: heartbeatData.pageHidden,
      pageVisible: heartbeatData.pageVisible,
      pageUnload: heartbeatData.pageUnload,
      timeSinceActivity: Math.round(timeSinceActivity / 1000) + 's'
    });

    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(heartbeatData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      state.current.lastHeartbeat = now;
      state.current.retryCount = 0;

      if (result.statusChanged) {
        console.log(`[PresenceHeartbeat] 🔄 Status changed: ${result.previousStatus} → ${result.currentStatus}`);
      }

      return result;

    } catch (error) {
      console.error(`[PresenceHeartbeat] ❌ Heartbeat failed (attempt ${state.current.retryCount + 1}/${maxRetries}):`, error);
      
      // Implement exponential backoff retry
      if (state.current.retryCount < maxRetries) {
        state.current.retryCount++;
        const delay = retryDelay * Math.pow(2, state.current.retryCount - 1);
        
        setTimeout(() => {
          console.log(`[PresenceHeartbeat] 🔄 Retrying heartbeat in ${delay}ms...`);
          sendHeartbeat(extraData);
        }, delay);
      } else {
        console.error(`[PresenceHeartbeat] 💥 Max retries exceeded, heartbeat failed`);
        state.current.retryCount = 0; // Reset for next interval
      }
      
      throw error;
    }
  }, [userId, enabled, activityTimeout, heartbeatInterval, maxRetries, retryDelay]);

  /**
   * Update user activity timestamp
   */
  const recordActivity = useCallback(() => {
    const now = Date.now();
    const wasInactive = (now - state.current.lastActivity) >= activityTimeout;
    
    state.current.lastActivity = now;
    state.current.isActive = true;

    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set new timeout to mark inactive
    activityTimeoutRef.current = setTimeout(() => {
      state.current.isActive = false;
      console.log(`[PresenceHeartbeat] 😴 User became inactive after ${Math.round(activityTimeout / 1000)}s`);
    }, activityTimeout);

    // If user was inactive and just became active, send immediate heartbeat
    if (wasInactive && !state.current.pageHidden) {
      console.log(`[PresenceHeartbeat] ✨ User reactivated, sending immediate heartbeat`);
      sendHeartbeat({ isActive: true }).catch(() => {
        // Error already logged in sendHeartbeat
      });
    }
  }, [activityTimeout, sendHeartbeat]);

  /**
   * Handle page visibility changes
   */
  const handleVisibilityChange = useCallback(() => {
    const isHidden = document.hidden;
    const wasHidden = state.current.pageHidden;
    state.current.pageHidden = isHidden;

    if (isHidden !== wasHidden) {
      console.log(`[PresenceHeartbeat] 👁️ Page visibility changed: ${wasHidden ? 'hidden' : 'visible'} → ${isHidden ? 'hidden' : 'visible'}`);
      
      if (isHidden) {
        // Page became hidden - send offline heartbeat
        sendHeartbeat({ 
          isActive: false,
          pageVisible: false 
        }).catch(() => {
          // Error already logged in sendHeartbeat
        });
      } else {
        // Page became visible - record activity and send online heartbeat
        recordActivity();
        sendHeartbeat({ 
          isActive: true,
          pageVisible: true 
        }).catch(() => {
          // Error already logged in sendHeartbeat
        });
      }
    }
  }, [sendHeartbeat, recordActivity]);

  /**
   * Handle page unload (beforeunload)
   */
  const handlePageUnload = useCallback(() => {
    console.log(`[PresenceHeartbeat] 👋 Page unloading, sending final heartbeat`);
    
    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      const heartbeatData = {
        userId,
        sessionId: state.current.sessionId,
        isActive: false,
        pageUnload: true,
        lastActivity: state.current.lastActivity
      };

      const blob = new Blob([JSON.stringify(heartbeatData)], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/presence/heartbeat', blob);
      
      if (sent) {
        console.log(`[PresenceHeartbeat] ✅ Unload heartbeat sent via beacon`);
      } else {
        console.warn(`[PresenceHeartbeat] ⚠️ Beacon heartbeat failed`);
      }
    }
    
    // Fallback: synchronous fetch (may be blocked by browser)
    try {
      sendHeartbeat({ pageUnload: true, isActive: false });
    } catch (error) {
      console.error(`[PresenceHeartbeat] Unload heartbeat error:`, error);
    }
  }, [userId, sendHeartbeat]);

  /**
   * Start the heartbeat system
   */
  const startHeartbeat = useCallback(() => {
    if (!enabled || !userId || heartbeatInterval_.current) {
      return;
    }

    console.log(`[PresenceHeartbeat] 🚀 Starting heartbeat system for ${userId}`);
    console.log(`[PresenceHeartbeat] ⚙️ Interval: ${Math.round(heartbeatInterval/1000)}s, Activity timeout: ${Math.round(activityTimeout/1000)}s`);
    
    // Send initial heartbeat
    recordActivity();
    sendHeartbeat({ isActive: true }).catch(() => {
      // Error already logged
    });

    // Start regular heartbeat interval
    heartbeatInterval_.current = setInterval(() => {
      if (!state.current.pageHidden) {
        sendHeartbeat().catch(() => {
          // Error already logged
        });
      } else {
        console.log(`[PresenceHeartbeat] ⏸️ Skipping heartbeat - page hidden`);
      }
    }, heartbeatInterval);

    // Set up activity listeners
    const activityEvents = [
      'mousedown', 'mousemove', 'mouseup', 'click',
      'keydown', 'keypress', 'keyup',
      'touchstart', 'touchmove', 'touchend',
      'scroll', 'wheel', 'input', 'change',
      'focus', 'blur', 'resize'
    ];

    activityEvents.forEach(event => {
      document.addEventListener(event, recordActivity, { passive: true });
    });

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up unload listeners
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    // Cleanup function
    return () => {
      if (heartbeatInterval_.current) {
        clearInterval(heartbeatInterval_.current);
        heartbeatInterval_.current = null;
      }

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }

      activityEvents.forEach(event => {
        document.removeEventListener(event, recordActivity);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);
    };
  }, [enabled, userId, heartbeatInterval, recordActivity, sendHeartbeat, handleVisibilityChange, handlePageUnload]);

  /**
   * Stop the heartbeat system
   */
  const stopHeartbeat = useCallback(() => {
    console.log(`[PresenceHeartbeat] ⏹️ Stopping heartbeat system for ${userId}`);
    
    if (heartbeatInterval_.current) {
      clearInterval(heartbeatInterval_.current);
      heartbeatInterval_.current = null;
    }

    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }

    // Send final offline heartbeat
    sendHeartbeat({ isActive: false }).catch(() => {
      // Error already logged
    });
  }, [userId, sendHeartbeat]);

  // Auto-start/stop based on enabled state and userId
  useEffect(() => {
    if (enabled && userId) {
      const cleanup = startHeartbeat();
      return cleanup;
    } else {
      stopHeartbeat();
    }
  }, [enabled, userId, startHeartbeat, stopHeartbeat]);

  return {
    sendHeartbeat,
    recordActivity,
    startHeartbeat,
    stopHeartbeat,
    sessionId: state.current.sessionId,
    isActive: state.current.isActive
  };
}