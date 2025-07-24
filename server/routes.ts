import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createHmac } from "crypto";
import { storage } from "./storage";
import { SupabasePersonalNotesStorage } from "./supabase-personal-notes";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLiveReplyTemplateSchema, insertEmailTemplateSchema, insertSiteContentSchema, insertPersonalNoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get single user by ID (for authentication) - MUST come before the general /api/users route
  app.get('/api/user/:id', async (req, res) => {
    try {
      console.log('[API] Getting user by ID:', req.params.id);
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log('[API] User not found in backend storage:', id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('[API] User found in backend:', user.email, user.role);
      res.json(user);
    } catch (error) {
      console.error("[API] Error fetching user from storage:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create new user (for auto-registration)
  app.post('/api/create-user', async (req, res) => {
    try {
      console.log('[API] Creating user:', req.body.email);
      const userData = req.body;
      const user = await storage.upsertUser(userData);
      console.log('[API] User created successfully:', user.email);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Heartbeat endpoint for advanced online status detection
  app.post('/api/user/heartbeat', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, isOnline, lastActivity } = req.body;
      const currentUserId = req.user.claims.sub;
      
      // Security: Users can only update their own heartbeat
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Can only update own status" });
      }
      
      console.log(`[Heartbeat] User ${userId} status: ${isOnline ? 'online' : 'offline'}, activity: ${lastActivity}`);
      
      await storage.updateUserOnlineStatus(userId, isOnline);
      
      res.json({ 
        message: "Heartbeat updated",
        userId,
        isOnline,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating heartbeat:", error);
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // User management routes (admin only) - MUST come after the single user route
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      console.log('[API] /api/users called by user:', req.user?.claims?.sub);
      const currentUser = await storage.getUser(req.user.claims.sub);
      console.log('[API] Current user role:', currentUser?.role);
      
      if (currentUser?.role !== 'admin') {
        console.log('[API] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }
      
      console.log('[API] Fetching all users from storage...');
      const users = await storage.getAllUsers();
      console.log('[API] Fetched', users.length, 'users from storage');
      console.log('[API] Sample user data:', users[0] ? { id: users[0].id, email: users[0].email, role: users[0].role } : 'No users');
      
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'blocked', 'banned'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateUserStatus(id, status);
      res.json({ message: "User status updated" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    console.log('[RoleUpdate] === ROLE UPDATE REQUEST START ===');
    console.log('[RoleUpdate] Raw request body:', req.body);
    console.log('[RoleUpdate] Request params:', req.params);
    console.log('[RoleUpdate] Content-Type:', req.headers['content-type']);
    
    try {
      console.log('[RoleUpdate] Request received for user:', req.params.id, 'with role:', req.body.role);
      
      const currentUser = await storage.getUser(req.user.claims.sub);
      console.log('[RoleUpdate] Current user:', currentUser?.email, 'with role:', currentUser?.role);
      
      if (currentUser?.role !== 'admin') {
        console.log('[RoleUpdate] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;

      console.log('[RoleUpdate] Processing - User ID:', id, 'Target role:', role);

      if (!role) {
        console.log('[RoleUpdate] Missing role in request body');
        return res.status(400).json({ message: "Role is required" });
      }

      if (!['admin', 'agent'].includes(role)) {
        console.log('[RoleUpdate] Invalid role provided:', role);
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        console.log('[RoleUpdate] Target user not found:', id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('[RoleUpdate] Target user found:', targetUser.email, 'current role:', targetUser.role);

      if (targetUser.role === role) {
        console.log('[RoleUpdate] User already has this role, skipping update');
        return res.json({ message: "User already has this role", user: targetUser });
      }

      console.log('[RoleUpdate] Calling storage.updateUserRole...');
      await storage.updateUserRole(id, role);
      console.log('[RoleUpdate] Storage update completed');
      
      // Verify the update by fetching the user again
      const updatedUser = await storage.getUser(id);
      console.log('[RoleUpdate] Verification - Updated user role:', updatedUser?.role);
      
      res.json({ 
        message: "User role updated successfully", 
        user: updatedUser,
        previousRole: targetUser.role,
        newRole: role
      });
    } catch (error) {
      console.error("[RoleUpdate] Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role", error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    console.log('[RoleUpdate] === ROLE UPDATE REQUEST END ===');
  });

  // Template routes
  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const { category, genre, search, isActive } = req.query;
      
      const templates = await storage.getTemplates({
        category: category as string,
        genre: genre as string,
        search: search as string,
        isActive: isActive ? isActive === 'true' : undefined,
      });
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const templateData = insertLiveReplyTemplateSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const updateData = insertLiveReplyTemplateSchema.partial().parse(req.body);

      const template = await storage.updateTemplate(id, updateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteTemplate(id);
      res.json({ message: "Template deleted" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.post('/api/templates/:id/use', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      await storage.incrementTemplateUsage(id, userId);
      res.json({ message: "Template usage recorded" });
    } catch (error) {
      console.error("Error recording template usage:", error);
      res.status(500).json({ message: "Failed to record template usage" });
    }
  });

  // Site content routes (accessible to all authenticated users for reading)
  app.get('/api/site-content', isAuthenticated, async (req: any, res) => {
    try {
      const { key } = req.query;
      const content = await storage.getSiteContent(key as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching site content:", error);
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.post('/api/site-content', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const contentData = insertSiteContentSchema.parse({
        ...req.body,
        updatedBy: req.user.claims.sub,
      });

      const content = await storage.upsertSiteContent(contentData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      console.error("Error updating site content:", error);
      res.status(500).json({ message: "Failed to update site content" });
    }
  });

  // Personal Notes Routes
  const personalNotesStorage = new SupabasePersonalNotesStorage();

  app.get('/api/personal-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await personalNotesStorage.getPersonalNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching personal notes:', error);
      res.status(500).json({ message: 'Failed to fetch notes' });
    }
  });

  app.post('/api/personal-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content } = req.body;
      
      const noteData = insertPersonalNoteSchema.parse({
        userId,
        content
      });

      const note = await personalNotesStorage.createPersonalNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating personal note:', error);
      res.status(500).json({ message: 'Failed to create note' });
    }
  });

  app.patch('/api/personal-notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      const note = await personalNotesStorage.updatePersonalNote(id, content);
      res.json(note);
    } catch (error) {
      console.error('Error updating personal note:', error);
      res.status(500).json({ message: 'Failed to update note' });
    }
  });

  app.delete('/api/personal-notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await personalNotesStorage.deletePersonalNote(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting personal note:', error);
      res.status(500).json({ message: 'Failed to delete note' });
    }
  });

  // Template colors configuration endpoint
  app.post('/api/template-colors', async (req, res) => {
    try {
      // Accept color configuration and store it in site content for admin management
      const colorConfig = req.body;
      console.log('[API] Received template colors sync:', colorConfig.lastUpdated);
      
      // For now, just acknowledge the sync - colors are managed client-side
      // In future, we could store these in a dedicated colors table in Supabase
      res.json({ success: true, message: 'Template colors synced successfully' });
    } catch (error) {
      console.error("Error syncing template colors:", error);
      res.status(500).json({ message: "Failed to sync template colors" });
    }
  });

  // Chatbase verification hash endpoint
  app.get('/api/chatbase/verify-hash/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const secret = 'mvdtvo2wat99uoda8ce0duge4c6krljv'; // Verification secret key
      
      // Generate hash for user verification
      const hash = createHmac('sha256', secret).update(userId).digest('hex');
      
      res.json({ hash, userId });
    } catch (error) {
      console.error("Error generating chatbase hash:", error);
      res.status(500).json({ message: "Failed to generate verification hash" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, request) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'user_online') {
          // Update user online status
          if (data.userId) {
            await storage.updateUserOnlineStatus(data.userId, true);
            
            // Broadcast user status to all connected clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'user_status_update',
                  userId: data.userId,
                  isOnline: true,
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      // Note: In a real implementation, you'd track which user this connection belongs to
      // and update their status accordingly
    });
  });

  return httpServer;
}
