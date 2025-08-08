/**
 * WebSocket-based Real-time Presence Broadcasting
 * Implements scalable WebSocket architecture for instant presence updates
 * Handles connection management, heartbeat distribution, and real-time notifications
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { nanoid } from 'nanoid';
import { presenceStore, type HeartbeatData } from './presence-store';
import { storage } from './storage';

export interface WebSocketClient {
  id: string;
  userId: string;
  ws: WebSocket;
  lastPing: number;
  subscriptions: Set<string>; // User IDs this client wants updates for
}

interface PresenceMessage {
  type: 'heartbeat' | 'subscribe' | 'unsubscribe' | 'ping' | 'presence_update';
  userId?: string;
  sessionId?: string;
  isActive?: boolean;
  pageHidden?: boolean;
  pageVisible?: boolean;
  pageUnload?: boolean;
  lastActivity?: number;
  subscribeToUsers?: string[];
  unsubscribeFromUsers?: string[];
  presenceData?: {
    userId: string;
    isOnline: boolean;
    lastSeen?: number;
  };
}

/**
 * WebSocket Presence Manager
 * Handles real-time bidirectional communication for presence tracking
 */
class WebSocketPresenceManager {
  private clients = new Map<string, WebSocketClient>();
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30 * 1000; // Ping clients every 30s for connection health
  private readonly CONNECTION_TIMEOUT = 60 * 1000; // Drop clients that don't respond within 60s
  
  constructor() {
    console.log('[WebSocketPresence] 🌐 Initializing WebSocket presence manager');
    this.setupPresenceStoreSubscription();
    this.startPingTimer();
  }

  /**
   * Initialize WebSocket server with HTTP server
   */
  setupWebSocketServer(server: any): WebSocketServer {
    const wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true,
    });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    wss.on('error', (error) => {
      console.error('[WebSocketPresence] WebSocket server error:', error);
    });

    console.log('[WebSocketPresence] 🔌 WebSocket server initialized on /ws');
    return wss;
  }

  /**
   * Handle new WebSocket connections
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = nanoid();
    const userId = this.extractUserIdFromRequest(req);
    
    if (!userId) {
      console.log('[WebSocketPresence] ❌ Connection rejected - no user authentication');
      ws.close(4001, 'Authentication required');
      return;
    }

    const client: WebSocketClient = {
      id: clientId,
      userId,
      ws,
      lastPing: Date.now(),
      subscriptions: new Set()
    };

    this.clients.set(clientId, client);
    
    console.log(`[WebSocketPresence] ✅ Client connected: ${userId} (${clientId.slice(0, 8)})`);
    console.log(`[WebSocketPresence] 📊 Active connections: ${this.clients.size}`);

    // Send initial presence data
    this.sendPresenceUpdate(client, {
      type: 'presence_update',
      presenceData: {
        userId: userId,
        isOnline: true,
        lastSeen: Date.now()
      }
    });

    // Set up message handlers
    ws.on('message', (data) => this.handleMessage(client, data));
    ws.on('close', () => this.handleDisconnection(client));
    ws.on('error', (error) => this.handleError(client, error));
    ws.on('pong', () => this.handlePong(client));
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(client: WebSocketClient, data: any): void {
    try {
      const message: PresenceMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'heartbeat':
          this.handleHeartbeat(client, message);
          break;
          
        case 'subscribe':
          this.handleSubscription(client, message.subscribeToUsers || []);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(client, message.unsubscribeFromUsers || []);
          break;
          
        case 'ping':
          this.handlePing(client);
          break;
          
        default:
          console.warn(`[WebSocketPresence] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[WebSocketPresence] Error parsing message from ${client.userId}:`, error);
    }
  }

  /**
   * Process heartbeat messages and update presence store
   */
  private handleHeartbeat(client: WebSocketClient, message: PresenceMessage): void {
    const heartbeatData: HeartbeatData = {
      userId: client.userId,
      sessionId: client.id,
      isActive: message.isActive ?? true,
      pageHidden: message.pageHidden,
      pageVisible: message.pageVisible,
      pageUnload: message.pageUnload,
      lastActivity: message.lastActivity,
      metadata: {
        userAgent: client.ws.protocol || 'unknown',
        ip: this.getClientIP(client)
      }
    };

    const result = presenceStore.processHeartbeat(heartbeatData);
    
    // Send acknowledgment back to client
    this.sendPresenceUpdate(client, {
      type: 'heartbeat',
      presenceData: {
        userId: client.userId,
        isOnline: result.isOnline,
        lastSeen: Date.now()
      }
    });
  }

  /**
   * Handle subscription requests (e.g., admin wanting to monitor all users)
   */
  private handleSubscription(client: WebSocketClient, userIds: string[]): void {
    for (const userId of userIds) {
      client.subscriptions.add(userId);
    }
    
    console.log(`[WebSocketPresence] 👀 ${client.userId} subscribed to ${userIds.length} users`);
    
    // Send current presence data for subscribed users
    const onlineUsers = presenceStore.getOnlineUsers();
    for (const user of onlineUsers) {
      if (userIds.includes(user.userId)) {
        this.sendPresenceUpdate(client, {
          type: 'presence_update',
          presenceData: {
            userId: user.userId,
            isOnline: true,
            lastSeen: user.lastActivity
          }
        });
      }
    }
  }

  /**
   * Handle unsubscription requests
   */
  private handleUnsubscription(client: WebSocketClient, userIds: string[]): void {
    for (const userId of userIds) {
      client.subscriptions.delete(userId);
    }
    console.log(`[WebSocketPresence] 👁️‍🗨️ ${client.userId} unsubscribed from ${userIds.length} users`);
  }

  /**
   * Handle ping messages for connection health
   */
  private handlePing(client: WebSocketClient): void {
    client.lastPing = Date.now();
    this.sendPresenceUpdate(client, { type: 'ping' });
  }

  /**
   * Handle pong responses
   */
  private handlePong(client: WebSocketClient): void {
    client.lastPing = Date.now();
  }

  /**
   * Handle client disconnections
   */
  private handleDisconnection(client: WebSocketClient): void {
    console.log(`[WebSocketPresence] 📴 Client disconnected: ${client.userId} (${client.id.slice(0, 8)})`);
    
    // Force user offline in presence store
    presenceStore.forceOffline(client.userId);
    
    // Remove client
    this.clients.delete(client.id);
    console.log(`[WebSocketPresence] 📊 Active connections: ${this.clients.size}`);
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(client: WebSocketClient, error: Error): void {
    console.error(`[WebSocketPresence] Client error for ${client.userId}:`, error);
  }

  /**
   * Subscribe to presence store changes and broadcast to relevant clients
   */
  private setupPresenceStoreSubscription(): void {
    presenceStore.subscribe((userId: string, isOnline: boolean) => {
      console.log(`[WebSocketPresence] 📡 Broadcasting presence change: ${userId} → ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      // Find all clients that should receive this update
      const relevantClients = Array.from(this.clients.values()).filter(client => 
        client.subscriptions.has(userId) || client.userId === userId
      );
      
      const message = {
        type: 'presence_update',
        presenceData: {
          userId,
          isOnline,
          lastSeen: Date.now()
        }
      };
      
      let broadcastCount = 0;
      for (const client of relevantClients) {
        if (this.sendPresenceUpdate(client, message)) {
          broadcastCount++;
        }
      }
      
      if (broadcastCount > 0) {
        console.log(`[WebSocketPresence] 📤 Broadcast sent to ${broadcastCount} clients`);
      }
    });
  }

  /**
   * Send message to a specific client
   */
  private sendPresenceUpdate(client: WebSocketClient, message: any): boolean {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`[WebSocketPresence] Failed to send to ${client.userId}:`, error);
        this.clients.delete(client.id);
        return false;
      }
    }
    return false;
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastToAll(message: any): void {
    let successCount = 0;
    const totalClients = this.clients.size;
    
    const clients = Array.from(this.clients.values());
    for (const client of clients) {
      if (this.sendPresenceUpdate(client, message)) {
        successCount++;
      }
    }
    
    console.log(`[WebSocketPresence] 📢 Broadcast complete: ${successCount}/${totalClients} clients reached`);
  }

  /**
   * Start connection health monitoring
   */
  private startPingTimer(): void {
    this.pingInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.PING_INTERVAL);
  }

  /**
   * Check connection health and remove stale connections
   */
  private performHealthCheck(): void {
    const now = Date.now();
    let staleConnections = 0;
    
    const clientEntries = Array.from(this.clients.entries());
    for (const [clientId, client] of clientEntries) {
      const timeSinceLastPing = now - client.lastPing;
      
      if (timeSinceLastPing > this.CONNECTION_TIMEOUT) {
        // Connection is stale
        console.log(`[WebSocketPresence] ⏰ Removing stale connection: ${client.userId} (${Math.round(timeSinceLastPing/1000)}s old)`);
        presenceStore.forceOffline(client.userId);
        client.ws.terminate();
        this.clients.delete(clientId);
        staleConnections++;
      } else if (client.ws.readyState === WebSocket.OPEN) {
        // Send ping to healthy connections
        try {
          client.ws.ping();
        } catch (error) {
          console.error(`[WebSocketPresence] Ping failed for ${client.userId}:`, error);
        }
      }
    }
    
    if (staleConnections > 0) {
      console.log(`[WebSocketPresence] 🧹 Health check: removed ${staleConnections} stale connections`);
    }
  }

  /**
   * Extract user ID from WebSocket connection request
   */
  private extractUserIdFromRequest(req: IncomingMessage): string | null {
    // Try to get user ID from query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      return userId;
    }
    
    // Try to get from headers
    const headerUserId = req.headers['x-user-id'] as string;
    if (headerUserId) {
      return headerUserId;
    }
    
    return null;
  }

  /**
   * Get client IP address
   */
  private getClientIP(client: WebSocketClient): string {
    // This would be implemented based on your server setup
    return 'unknown';
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    userConnections: Record<string, number>;
    averageConnectionAge: number;
  } {
    const now = Date.now();
    const userConnections: Record<string, number> = {};
    let totalAge = 0;
    
    const clients = Array.from(this.clients.values());
    for (const client of clients) {
      userConnections[client.userId] = (userConnections[client.userId] || 0) + 1;
      totalAge += now - client.lastPing;
    }
    
    return {
      totalConnections: this.clients.size,
      userConnections,
      averageConnectionAge: this.clients.size > 0 ? totalAge / this.clients.size : 0
    };
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close all connections
    const clients = Array.from(this.clients.values());
    for (const client of clients) {
      client.ws.close(1001, 'Server shutdown');
    }
    
    this.clients.clear();
    console.log('[WebSocketPresence] 🛑 WebSocket presence manager shutdown complete');
  }
}

// Singleton instance
export const wsPresenceManager = new WebSocketPresenceManager();

// Graceful shutdown
process.on('SIGTERM', () => wsPresenceManager.shutdown());
process.on('SIGINT', () => wsPresenceManager.shutdown());