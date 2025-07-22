import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTemplateSchema, insertSiteContentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Template routes
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
      for (const [userId, client] of connectedClients.entries()) {
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
    for (const [userId, client] of connectedClients.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      } else {
        connectedClients.delete(userId);
      }
    }
  }

  return httpServer;
}