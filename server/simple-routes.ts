import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertLiveReplyTemplateSchema, 
  insertEmailTemplateSchema, 
  insertSiteContentSchema,
  insertPersonalNoteSchema,
  // Legacy for backward compatibility
  insertLiveReplyTemplateSchema as insertTemplateSchema
} from "@shared/schema";
import { SupabasePersonalNotesStorage } from './supabase-personal-notes';
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Live Reply Template routes (for live chat)
  app.get('/api/live-reply-templates', async (req, res) => {
    try {
      const { category, genre, search, isActive } = req.query;
      const filters = {
        category: category as string,
        genre: genre as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const templates = await storage.getLiveReplyTemplates(filters);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching live reply templates:", error);
      res.status(500).json({ message: "Failed to fetch live reply templates" });
    }
  });

  app.post('/api/live-reply-templates', async (req, res) => {
    try {
      const validatedData = insertLiveReplyTemplateSchema.parse(req.body);
      const template = await storage.createLiveReplyTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating live reply template:", error);
      res.status(500).json({ message: "Failed to create live reply template" });
    }
  });

  app.put('/api/live-reply-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLiveReplyTemplateSchema.partial().parse(req.body);
      const template = await storage.updateLiveReplyTemplate(id, validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating live reply template:", error);
      res.status(500).json({ message: "Failed to update live reply template" });
    }
  });

  app.delete('/api/live-reply-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLiveReplyTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting live reply template:", error);
      res.status(500).json({ message: "Failed to delete live reply template" });
    }
  });

  app.post('/api/live-reply-templates/:id/use', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await storage.incrementLiveReplyUsage(id, userId);
      res.status(200).json({ message: "Live reply template usage recorded" });
    } catch (error) {
      console.error("Error recording live reply template usage:", error);
      res.status(500).json({ message: "Failed to record live reply template usage" });
    }
  });

  // Email Template routes (for internal team communication)
  app.get('/api/email-templates', async (req, res) => {
    try {
      const { category, genre, concernedTeam, search, isActive } = req.query;
      const filters = {
        category: category as string,
        genre: genre as string,
        concernedTeam: concernedTeam as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const templates = await storage.getEmailTemplates(filters);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post('/api/email-templates', async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.put('/api/email-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      const template = await storage.updateEmailTemplate(id, validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete('/api/email-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  app.post('/api/email-templates/:id/use', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await storage.incrementEmailTemplateUsage(id, userId);
      res.status(200).json({ message: "Email template usage recorded" });
    } catch (error) {
      console.error("Error recording email template usage:", error);
      res.status(500).json({ message: "Failed to record email template usage" });
    }
  });

  // Legacy template routes (backward compatibility - map to live reply templates)
  app.get('/api/templates', async (req, res) => {
    try {
      const { category, genre, search, isActive } = req.query;
      const filters = {
        category: category as string,
        genre: genre as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const templates = await storage.getTemplates(filters);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
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

  app.post('/api/templates', async (req, res) => {
    try {
      const validatedData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(id, validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.post('/api/templates/:id/use', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await storage.incrementTemplateUsage(id, userId);
      res.status(200).json({ message: "Template usage recorded" });
    } catch (error) {
      console.error("Error recording template usage:", error);
      res.status(500).json({ message: "Failed to record template usage" });
    }
  });

  // Site content routes
  app.get('/api/site-content', async (req, res) => {
    try {
      const { key } = req.query;
      const content = await storage.getSiteContent(key as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching site content:", error);
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });

  app.post('/api/site-content', async (req, res) => {
    try {
      const validatedData = insertSiteContentSchema.parse(req.body);
      const content = await storage.upsertSiteContent(validatedData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      console.error("Error upserting site content:", error);
      res.status(500).json({ message: "Failed to upsert site content" });
    }
  });

  // User Management API routes (bypassing Vite interception)
  app.patch('/api/users/:id/role', async (req, res) => {
    console.log('[DirectRoleUpdate] === DIRECT ROLE UPDATE REQUEST START ===');
    console.log('[DirectRoleUpdate] Raw request body:', req.body);
    console.log('[DirectRoleUpdate] Request params:', req.params);
    console.log('[DirectRoleUpdate] Content-Type:', req.headers['content-type']);
    
    try {
      const { id } = req.params;
      const { role } = req.body;

      console.log('[DirectRoleUpdate] Processing - User ID:', id, 'Target role:', role);

      if (!role) {
        console.log('[DirectRoleUpdate] Missing role in request body');
        return res.status(400).json({ message: "Role is required" });
      }

      if (!['admin', 'agent'].includes(role)) {
        console.log('[DirectRoleUpdate] Invalid role provided:', role);
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        console.log('[DirectRoleUpdate] Target user not found:', id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('[DirectRoleUpdate] Target user found:', targetUser.email, 'current role:', targetUser.role);

      if (targetUser.role === role) {
        console.log('[DirectRoleUpdate] User already has this role, skipping update');
        return res.json({ message: "User already has this role", user: targetUser });
      }

      console.log('[DirectRoleUpdate] Calling storage.updateUserRole...');
      await storage.updateUserRole(id, role);
      console.log('[DirectRoleUpdate] Storage update completed');
      
      // Verify the update by fetching the user again
      const updatedUser = await storage.getUser(id);
      console.log('[DirectRoleUpdate] Verification - Updated user role:', updatedUser?.role);
      
      res.json({ 
        message: "User role updated successfully", 
        user: updatedUser,
        previousRole: targetUser.role,
        newRole: role
      });
    } catch (error) {
      console.error("[DirectRoleUpdate] Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role", error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    console.log('[DirectRoleUpdate] === DIRECT ROLE UPDATE REQUEST END ===');
  });

  app.patch('/api/users/:id/status', async (req, res) => {
    console.log('[DirectStatusUpdate] === DIRECT STATUS UPDATE REQUEST START ===');
    
    try {
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
    
    console.log('[DirectStatusUpdate] === DIRECT STATUS UPDATE REQUEST END ===');
  });

  // Admin routes that bypass Vite interception
  app.get('/api/admin/users', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      console.log('[AdminAPI] Fetching users for admin user:', userId);
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        console.log('[AdminAPI] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      // Update current user's online status first
      await storage.updateUserOnlineStatus(userId, true);
      
      // Fetch updated users data
      const users = await storage.getAllUsers();
      console.log('[AdminAPI] Retrieved', users.length, 'users');
      console.log('[AdminAPI] Online users:', users.filter(u => u.isOnline).length);
      
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    } catch (error) {
      console.error('[AdminAPI] Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Personal Notes Routes
  const personalNotesStorage = new SupabasePersonalNotesStorage();

  app.get('/api/personal-notes', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const notes = await personalNotesStorage.getPersonalNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching personal notes:', error);
      res.status(500).json({ message: 'Failed to fetch notes' });
    }
  });

  app.post('/api/personal-notes', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { subject, content } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const noteData = insertPersonalNoteSchema.parse({
        userId,
        subject,
        content
      });

      const note = await personalNotesStorage.createPersonalNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating personal note:', error);
      res.status(500).json({ message: 'Failed to create note' });
    }
  });

  app.patch('/api/personal-notes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { subject, content } = req.body;
      
      const note = await personalNotesStorage.updatePersonalNote(id, { subject, content });
      res.json(note);
    } catch (error) {
      console.error('Error updating personal note:', error);
      res.status(500).json({ message: 'Failed to update note' });
    }
  });

  app.delete('/api/personal-notes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await personalNotesStorage.deletePersonalNote(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting personal note:', error);
      res.status(500).json({ message: 'Failed to delete note' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'user_online':
            if (message.userId) {
              connectedClients.set(message.userId, ws);
              // Broadcast user online status
              broadcast({
                type: 'user_status_change',
                userId: message.userId,
                isOnline: true,
              });
            }
            break;
            
          case 'user_offline':
            if (message.userId) {
              connectedClients.delete(message.userId);
              // Broadcast user offline status
              broadcast({
                type: 'user_status_change',
                userId: message.userId,
                isOnline: false,
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Find and remove the disconnected client
      for (const [userId, client] of Array.from(connectedClients.entries())) {
        if (client === ws) {
          connectedClients.delete(userId);
          // Broadcast user offline status
          broadcast({
            type: 'user_status_change',
            userId,
            isOnline: false,
          });
          break;
        }
      }
    });
  });

  function broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    for (const [userId, client] of Array.from(connectedClients.entries())) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      } else {
        connectedClients.delete(userId);
      }
    }
  }

  return httpServer;
}