import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { SupabasePersonalNotesStorage } from "./supabase-personal-notes";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTemplateSchema, insertSiteContentSchema, insertPersonalNoteSchema } from "@shared/schema";
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

  // User management routes (admin only) - MUST come after the single user route
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
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
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'agent'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(id, role);
      res.json({ message: "User role updated" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
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

      const templateData = insertTemplateSchema.parse({
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
      const updateData = insertTemplateSchema.partial().parse(req.body);

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

  // Site content routes (admin only)
  app.get('/api/site-content', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

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
