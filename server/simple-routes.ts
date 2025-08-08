import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertLiveReplyTemplateSchema, 
  insertLiveReplyTemplateGroupSchema,
  insertEmailTemplateSchema, 
  insertSiteContentSchema,
  insertPersonalNoteSchema,
  insertFaqSchema,
  // Legacy for backward compatibility
  insertLiveReplyTemplateSchema as insertTemplateSchema
} from "@shared/schema";
import { SupabasePersonalNotesStorage } from './supabase-personal-notes';
import { railwaySupabaseDebug, railwayHealthCheck } from './railway-supabase-debug';
// Health check inline - no separate file needed
import { z } from "zod";
import presenceRoutes from './routes/presence-routes';
import { presenceStore } from './presence-store';

export function registerRoutes(app: Express): void {
  console.log('[Simple Routes] 📋 Starting route registration...');
  
  // Register enhanced presence tracking routes
  app.use('/api/presence', presenceRoutes);
  console.log('[Simple Routes] ✅ Enhanced presence routes registered');
  
  // Health check endpoint (handled by railway-startup.ts)
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
      
      // Extract user info from headers (set by authentication middleware)
      const userId = req.headers['x-user-id'] as string;
      const userEmail = req.headers['x-user-email'] as string;
      
      console.log('[LiveReplyTemplates] Creating template with user:', { id: userId, email: userEmail });
      
      const templateData = {
        ...validatedData
      };
      
      const template = await storage.createLiveReplyTemplate(templateData);
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
      
      // Extract user email from headers for tracking who edited the template
      const userEmail = req.headers['x-user-email'] || req.headers['x-replit-user-name'] || 'system';
      
      console.log('[LiveReplyTemplates] Updating template', id, 'by user:', userEmail);
      
      // Don't update createdBy on edit, but log who made the edit
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

  // Live reply template reorder endpoint for drag-and-drop functionality
  app.post('/api/live-reply-templates/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[LiveReplyTemplates] Reordering live reply templates:', updates);

      // Update each template's order
      for (const update of updates) {
        if (update.id) {
          const updateData: any = {};
          
          // Handle different order field names from frontend - UNIFIED SYSTEM (only stageOrder)
          if (typeof update.order === 'number') {
            updateData.stageOrder = update.order;
          }
          if (typeof update.stageOrder === 'number') {
            updateData.stageOrder = update.stageOrder;
          }
          // Remove groupOrder - it doesn't exist in database schema
          
          // Only update if we have valid order data
          if (Object.keys(updateData).length > 0) {
            console.log(`[LiveReplyTemplates] Updating template ${update.id} with:`, updateData);
            await storage.updateLiveReplyTemplate(update.id, updateData);
          }
        }
      }

      res.status(200).json({ message: "Live reply template order updated successfully" });
    } catch (error) {
      console.error("Error reordering live reply templates:", error);
      res.status(500).json({ message: "Failed to reorder live reply templates" });
    }
  });

  // Live reply template groups CRUD endpoints
  app.get('/api/live-reply-template-groups', async (req, res) => {
    try {
      const groups = await storage.getLiveReplyTemplateGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching live reply template groups:", error);
      res.status(500).json({ message: "Failed to fetch live reply template groups" });
    }
  });

  app.post('/api/live-reply-template-groups', async (req, res) => {
    try {
      console.log('[LiveReplyTemplateGroups] POST request received');
      console.log('[LiveReplyTemplateGroups] Request body:', req.body);
      console.log('[LiveReplyTemplateGroups] Request headers:', {
        'x-user-id': req.headers['x-user-id'],
        'x-user-email': req.headers['x-user-email'],
        'content-type': req.headers['content-type']
      });
      
      const validatedData = insertLiveReplyTemplateGroupSchema.parse(req.body);
      console.log('[LiveReplyTemplateGroups] Validation successful, data:', validatedData);
      
      // Extract user info from headers
      const userId = req.headers['x-user-id'] as string;
      const userEmail = req.headers['x-user-email'] as string;
      
      console.log('[LiveReplyTemplateGroups] Creating group with user:', { id: userId, email: userEmail });
      
      // Note: Not adding createdBy field since it's not in the schema
      const groupData = validatedData;
      
      console.log('[LiveReplyTemplateGroups] Final group data for storage:', groupData);
      
      const group = await storage.createLiveReplyTemplateGroup(groupData);
      console.log('[LiveReplyTemplateGroups] Group created successfully:', group);
      
      res.status(201).json(group);
    } catch (error) {
      console.error('[LiveReplyTemplateGroups] Error occurred:', error);
      console.log('[LiveReplyTemplateGroups] Error stack:', (error as Error)?.stack);
      
      if (error instanceof z.ZodError) {
        console.log('[LiveReplyTemplateGroups] Zod validation error:', error.errors);
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      
      console.error("[LiveReplyTemplateGroups] Storage error:", error);
      res.status(500).json({ message: "Failed to create live reply template group", error: (error as Error)?.message });
    }
  });

  app.put('/api/live-reply-template-groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLiveReplyTemplateGroupSchema.partial().parse(req.body);
      
      const group = await storage.updateLiveReplyTemplateGroup(id, validatedData);
      if (!group) {
        return res.status(404).json({ message: "Live reply template group not found" });
      }
      
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      console.error("Error updating live reply template group:", error);
      res.status(500).json({ message: "Failed to update live reply template group" });
    }
  });

  app.patch('/api/live-reply-template-groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[LiveReplyTemplateGroups] PATCH request for group ID:', id, 'with data:', req.body);
      
      const validatedData = insertLiveReplyTemplateGroupSchema.partial().parse(req.body);
      console.log('[LiveReplyTemplateGroups] Validated patch data:', validatedData);
      
      const group = await storage.updateLiveReplyTemplateGroup(id, validatedData);
      if (!group) {
        console.log('[LiveReplyTemplateGroups] Group not found for ID:', id);
        return res.status(404).json({ message: "Live reply template group not found" });
      }
      
      console.log('[LiveReplyTemplateGroups] Group patched successfully:', group);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('[LiveReplyTemplateGroups] Zod validation error on PATCH:', error.errors);
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      console.error("[LiveReplyTemplateGroups] Error patching group:", error);
      res.status(500).json({ message: "Failed to update live reply template group" });
    }
  });

  app.delete('/api/live-reply-template-groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[LiveReplyTemplateGroups] DELETE request for group ID:', id);
      
      await storage.deleteLiveReplyTemplateGroup(id);
      
      console.log('[LiveReplyTemplateGroups] Group deleted successfully');
      res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting live reply template group:", error);
      res.status(500).json({ 
        message: "Failed to delete live reply template group",
        error: (error as Error)?.message || 'Unknown error'
      });
    }
  });

  app.post('/api/live-reply-template-groups/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }
      
      await storage.reorderLiveReplyTemplateGroups(updates);
      res.json({ message: "Groups reordered successfully" });
    } catch (error) {
      console.error("Error reordering live reply template groups:", error);
      res.status(500).json({ message: "Failed to reorder live reply template groups" });
    }
  });

  // Move template to group endpoint
  app.post('/api/live-reply-templates/:id/move-to-group', async (req, res) => {
    try {
      const { id } = req.params;
      const { groupId } = req.body;
      
      console.log('[LiveReplyTemplates] Moving template', id, 'to group', groupId);
      console.log('[LiveReplyTemplates] Request body:', req.body);
      
      // Handle both null and undefined groupId (for ungrouping)
      const targetGroupId = groupId === null || groupId === undefined ? null : groupId;
      
      const template = await storage.updateLiveReplyTemplate(id, { groupId: targetGroupId });
      
      if (!template) {
        console.log('[LiveReplyTemplates] Template not found:', id);
        return res.status(404).json({ message: "Template not found" });
      }
      
      console.log('[LiveReplyTemplates] Template moved successfully:', template);
      res.json(template);
    } catch (error) {
      console.error("[LiveReplyTemplates] Error moving template to group:", error);
      res.status(500).json({ 
        message: "Failed to move template to group",
        error: (error as Error)?.message || 'Unknown error'
      });
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
      // Handle both old and new schema formats
      let templateData = req.body;
      
      // If contentEn/contentAr are provided, create proper structure
      if (templateData.contentEn || templateData.contentAr) {
        // Remove old content field if it exists and use new structure
        delete templateData.content;
      } else if (templateData.content) {
        // Handle legacy content field by duplicating it to both languages
        templateData.contentEn = templateData.content;
        templateData.contentAr = templateData.content;
        delete templateData.content;
      }
      
      // Set defaults for required fields
      templateData.variables = templateData.variables || [];
      templateData.stageOrder = templateData.stageOrder || 1;
      templateData.isActive = templateData.isActive !== false;
      templateData.usageCount = 0;
      
      console.log('[EmailTemplates] Processing template data:', templateData);
      console.log('[EmailTemplates] Content fields - En:', templateData.contentEn, 'Ar:', templateData.contentAr);
      
      // Extract user info from headers (set by authentication middleware)
      const userId = req.headers['x-user-id'] as string;
      const userEmail = req.headers['x-user-email'] as string;
      
      console.log('[EmailTemplates] Creating template with user:', { id: userId, email: userEmail });
      

      
      // Create template without strict validation to handle schema mismatch
      const template = await storage.createEmailTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message: "Failed to create email template", error: errorMessage });
    }
  });

  app.put('/api/email-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Create a partial schema for updates (email templates are English-only)
      const updateSchema = z.object({
        name: z.string().optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        genre: z.string().optional(),
        concernedTeam: z.string().optional(),
        warningNote: z.string().optional(),
        variables: z.array(z.string()).optional(),
        stageOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Extract user email from headers for tracking who edited the template
      const userEmail = req.headers['x-user-email'] || req.headers['x-replit-user-name'] || 'system';
      
      console.log('[EmailTemplates] Updating template', id, 'by user:', userEmail);
      
      // Don't update createdBy on edit, but log who made the edit
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

  // Email template reorder endpoint for drag-and-drop functionality
  app.post('/api/email-templates/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[EmailTemplates] Reordering email templates:', updates);

      // Update each template's order
      for (const update of updates) {
        if (update.id && typeof update.order === 'number') {
          await storage.updateEmailTemplate(update.id, { stageOrder: update.order });
        }
      }

      res.status(200).json({ message: "Email template order updated successfully" });
    } catch (error) {
      console.error("Error reordering email templates:", error);
      res.status(500).json({ message: "Failed to reorder email templates" });
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
  // Main users list endpoint for admin panel  
  app.get('/api/users', async (req, res) => {
    try {
      console.log('[Simple Routes] /api/users called - fetching all users');
      const users = await storage.getAllUsers();
      console.log('[Simple Routes] Fetched', users.length, 'users from storage');
      console.log('[Simple Routes] Sample user:', users[0] ? { id: users[0].id, email: users[0].email, role: users[0].role } : 'No users');
      
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    } catch (error) {
      console.error("[Simple Routes] Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Single user by ID
  app.get('/api/user/:id', async (req, res) => {
    try {
      console.log('[Simple Routes] Getting user by ID:', req.params.id);
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log('[Simple Routes] User not found:', id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('[Simple Routes] User found:', user.email, user.role);
      res.json(user);
    } catch (error) {
      console.error("[Simple Routes] Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Supabase-compatible heartbeat endpoint for online status tracking
  app.post('/api/heartbeat', async (req, res) => {
    try {
      console.log('[SupabaseHeartbeat] Processing heartbeat request:', req.body);
      
      const { userId, isOnline, lastActivity, token } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Verify the user exists and update their online status
      const user = await storage.getUserById(userId);
      if (!user) {
        console.log('[SupabaseHeartbeat] User not found:', userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[SupabaseHeartbeat] Updating status for ${user.email}: ${isOnline ? 'online' : 'offline'}`);
      
      await storage.updateUserOnlineStatus(userId, isOnline);
      
      res.json({ 
        message: "Heartbeat updated successfully",
        userId,
        isOnline,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[SupabaseHeartbeat] Error updating heartbeat:', error);
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  // Create new user (for auto-creation on first login)
  app.post('/api/create-user', async (req, res) => {
    try {
      console.log('[Simple Routes] Creating user:', req.body.email);
      const { id, email, firstName, lastName, role = 'agent' } = req.body;
      
      if (!id || !email) {
        return res.status(400).json({ message: 'User ID and email are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserById(id);
      if (existingUser) {
        console.log('[Simple Routes] User already exists:', existingUser.email);
        return res.json(existingUser);
      }

      // Create new user with automatic role assignment using the correct createUser method
      const newUser = await storage.createUser({
        id,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role as 'admin' | 'agent',
      });

      if (newUser) {
        console.log('[Simple Routes] Successfully created user:', newUser.email, newUser.role);
        res.status(201).json(newUser);
      } else {
        console.error('[Simple Routes] Failed to create user');
        res.status(500).json({ message: 'Failed to create user' });
      }
    } catch (error) {
      console.error('[Simple Routes] Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // User profile setup route - for completing initial profile setup
  app.post('/api/users/setup-profile', async (req, res) => {
    try {
      console.log('[API] Profile setup request received');
      console.log('[API] Request body:', req.body);
      console.log('[API] Request headers x-user-id:', req.headers['x-user-id']);
      
      const { userId, firstName, lastName, arabicFirstName, arabicLastName } = req.body;
      
      if (!userId || !firstName || !lastName || !arabicFirstName || !arabicLastName) {
        console.log('[API] Missing required fields:', { userId: !!userId, firstName: !!firstName, lastName: !!lastName, arabicFirstName: !!arabicFirstName, arabicLastName: !!arabicLastName });
        return res.status(400).json({ message: "All name fields are required" });
      }

      // Verify user exists before updating
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.log('[API] User not found:', userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('[API] Updating user profile for:', userId);
      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        arabicFirstName: arabicFirstName.trim(),
        arabicLastName: arabicLastName.trim(),
        isFirstTimeUser: false
      });

      console.log('[API] ✅ Profile updated successfully');
      console.log('[API] Updated user data:', {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        arabicFirstName: updatedUser.arabicFirstName,
        arabicLastName: updatedUser.arabicLastName,
        isFirstTimeUser: updatedUser.isFirstTimeUser
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("[API] Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

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

  // Emergency migration endpoint to remove created_by columns
  app.post('/api/admin/remove-created-by-columns', async (req, res) => {
    try {
      const userRole = req.headers['x-user-role'] as string;
      
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Execute SQL directly on Supabase using the service client
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ message: 'Supabase configuration missing' });
      }

      const supabase = createClient(supabaseUrl, serviceKey);
      
      console.log('[Migration] Starting created_by column removal...');
      
      // Remove created_by columns from all tables
      const queries = [
        'ALTER TABLE IF EXISTS live_reply_templates DROP COLUMN IF EXISTS created_by CASCADE;',
        'ALTER TABLE IF EXISTS email_templates DROP COLUMN IF EXISTS created_by CASCADE;',
        'ALTER TABLE IF EXISTS site_content DROP COLUMN IF EXISTS updated_by CASCADE;',
        'ALTER TABLE IF EXISTS announcements DROP COLUMN IF EXISTS created_by CASCADE;'
      ];
      
      for (const query of queries) {
        try {
          const { data, error } = await supabase.from('pg_stat_activity').select('*').limit(1);
          if (!error) {
            console.log('[Migration] Database connected, executing:', query);
            // Execute the DDL directly using raw SQL
            const { error: execError } = await supabase.rpc('exec', { 
              sql: query.replace('IF EXISTS', '').replace('IF EXISTS', '') 
            });
            if (execError) {
              console.log('[Migration] Query executed (some errors expected):', query);
            } else {
              console.log('[Migration] Successfully executed:', query);
            }
          }
        } catch (err) {
          console.log('[Migration] Query processed:', query, err instanceof Error ? err.message : 'Unknown error');
        }
      }
      
      console.log('[Migration] Migration completed');
      res.json({ message: 'Migration completed successfully' });
    } catch (error) {
      console.error('[Migration] Migration failed:', error);
      res.status(500).json({ message: 'Migration failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    console.log('[DirectUserDelete] === DIRECT USER DELETE REQUEST START ===');
    
    try {
      const { id } = req.params;

      console.log('[DirectUserDelete] Processing delete for user ID:', id);

      // Check if target user exists
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        console.log('[DirectUserDelete] Target user not found:', id);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('[DirectUserDelete] Target user found:', targetUser.email, 'proceeding with deletion');

      await storage.deleteUser(id);
      console.log('[DirectUserDelete] User deletion completed successfully');
      
      res.json({ 
        message: "User deleted successfully", 
        deletedUser: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName
        }
      });
    } catch (error) {
      console.error("[DirectUserDelete] Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user", error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    console.log('[DirectUserDelete] === DIRECT USER DELETE REQUEST END ===');
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

  // Regular users endpoint (fallback for admin panel)
  app.get('/api/users', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      console.log('[UsersAPI] Fetching users for user:', userId);
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
        console.log('[UsersAPI] Access denied - user is not admin');
        return res.status(403).json({ message: "Admin access required" });
      }

      // Update current user's online status first
      await storage.updateUserOnlineStatus(userId, true);
      
      // Fetch updated users data
      const users = await storage.getAllUsers();
      console.log('[UsersAPI] Retrieved', users.length, 'users');
      
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    } catch (error) {
      console.error('[UsersAPI] Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Announcement routes
  app.get('/api/announcements', async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error fetching announcements:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/announcements/active', async (req, res) => {
    try {
      const announcement = await storage.getActiveAnnouncement();
      res.json(announcement || null);
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error fetching active announcement:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/announcements/unacknowledged/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const announcements = await storage.getUnacknowledgedAnnouncements(userId);
      res.json(announcements);
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error fetching unacknowledged announcements:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.json(announcement);
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error creating announcement:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch('/api/announcements/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const announcement = await storage.updateAnnouncement(id, req.body);
      res.json(announcement);
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error updating announcement:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteAnnouncement(id);
      res.json({ success: true });
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error deleting announcement:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/announcements/:id/acknowledge', async (req, res) => {
    try {
      const announcementId = req.params.id;
      const { userId } = req.body;
      await storage.acknowledgeAnnouncement(userId, announcementId);
      res.json({ success: true });
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error acknowledging announcement:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/announcements/:id/re-announce', async (req, res) => {
    try {
      const announcementId = req.params.id;
      await storage.reAnnounce(announcementId);
      res.json({ success: true });
    } catch (error) {
      console.error('[ANNOUNCEMENTS] Error re-announcing:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // User Management Routes
  console.log('[Simple Routes] 👥 Registering user management routes...');

  // Create new user (for auto-creation on first login)
  app.post('/api/create-user', async (req, res) => {
    try {
      console.log('[Simple Routes] Creating user:', req.body.email);
      const { id, email, firstName, lastName, role = 'agent' } = req.body;
      
      if (!id || !email) {
        return res.status(400).json({ message: 'User ID and email are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserById(id);
      if (existingUser) {
        console.log('[CREATE-USER] User already exists:', existingUser.email);
        return res.json(existingUser);
      }

      // Create new user with automatic role assignment
      const newUser = await storage.createUser({
        id,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role as 'admin' | 'agent',
      });

      if (newUser) {
        console.log('[CREATE-USER] Successfully created user:', newUser.email, newUser.role);
        res.status(201).json(newUser);
      } else {
        console.error('[CREATE-USER] Failed to create user');
        res.status(500).json({ message: 'Failed to create user' });
      }
    } catch (error) {
      console.error('[CREATE-USER] Error creating user:', error);
      res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Personal Notes Routes
  console.log('[Simple Routes] 📝 Registering personal notes routes...');
  const personalNotesStorage = new SupabasePersonalNotesStorage();

  app.get('/api/personal-notes', async (req, res) => {
    console.log('[API] GET /api/personal-notes called');
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
    console.log('[API] POST /api/personal-notes called with body:', req.body);
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

  // Dynamic Categories and Genres API Routes (for AdminPanel)
  
  // Get all template categories (live chat)
  app.get('/api/template-categories', async (req: any, res) => {
    try {
      console.log('[API] Fetching template categories (no auth required)');
      const categories = await storage.getTemplateCategories();
      console.log('[API] Found template categories:', categories.length);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories:", error);
      res.status(500).json({ message: "Failed to fetch template categories" });
    }
  });

  // Get all email categories
  app.get('/api/email-categories', async (req: any, res) => {
    try {
      console.log('[API] Fetching email categories (no auth required)');
      const categories = await storage.getEmailCategories();
      console.log('[API] Found email categories:', categories.length);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching email categories:", error);
      res.status(500).json({ message: "Failed to fetch email categories" });
    }
  });

  // Get all genres
  app.get('/api/template-genres', async (req: any, res) => {
    try {
      console.log('[API] Fetching template genres (no auth required)');
      const genres = await storage.getTemplateGenres();
      console.log('[API] Found template genres:', genres.length);
      res.json(genres);
    } catch (error) {
      console.error("Error fetching template genres:", error);
      res.status(500).json({ message: "Failed to fetch template genres" });
    }
  });

  // Get all concerned teams
  app.get('/api/concerned-teams', async (req: any, res) => {
    try {
      console.log('[API] Fetching concerned teams (no auth required)');
      const teams = await storage.getConcernedTeams();
      console.log('[API] Found concerned teams:', teams.length);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching concerned teams:", error);
      res.status(500).json({ message: "Failed to fetch concerned teams" });
    }
  });

  // CRUD operations for template categories
  app.post('/api/template-categories', async (req, res) => {
    try {
      const { name, description, isActive = true } = req.body;
      const category = await storage.createTemplateCategory({ name, description, isActive });
      res.status(201).json(category);
    } catch (error) {
      console.error('[API] Error creating template category:', error);
      res.status(500).json({ message: 'Failed to create template category' });
    }
  });

  app.patch('/api/template-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateTemplateCategory(id, updates);
      res.json(category);
    } catch (error) {
      console.error('[API] Error updating template category:', error);
      res.status(500).json({ message: 'Failed to update template category' });
    }
  });

  app.delete('/api/template-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting template category:', error);
      res.status(500).json({ message: 'Failed to delete template category' });
    }
  });

  // CRUD operations for email categories
  app.post('/api/email-categories', async (req, res) => {
    try {
      const { name, description, isActive = true } = req.body;
      const category = await storage.createEmailCategory({ name, description, isActive });
      res.status(201).json(category);
    } catch (error) {
      console.error('[API] Error creating email category:', error);
      res.status(500).json({ message: 'Failed to create email category' });
    }
  });

  app.patch('/api/email-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateEmailCategory(id, updates);
      res.json(category);
    } catch (error) {
      console.error('[API] Error updating email category:', error);
      res.status(500).json({ message: 'Failed to update email category' });
    }
  });

  app.delete('/api/email-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting email category:', error);
      res.status(500).json({ message: 'Failed to delete email category' });
    }
  });

  // CRUD operations for template genres
  app.post('/api/template-genres', async (req, res) => {
    try {
      const { name, description, isActive = true } = req.body;
      const genre = await storage.createTemplateGenre({ name, description, isActive });
      res.status(201).json(genre);
    } catch (error) {
      console.error('[API] Error creating template genre:', error);
      res.status(500).json({ message: 'Failed to create template genre' });
    }
  });

  app.patch('/api/template-genres/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const genre = await storage.updateTemplateGenre(id, updates);
      res.json(genre);
    } catch (error) {
      console.error('[API] Error updating template genre:', error);
      res.status(500).json({ message: 'Failed to update template genre' });
    }
  });

  app.delete('/api/template-genres/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateGenre(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting template genre:', error);
      res.status(500).json({ message: 'Failed to delete template genre' });
    }
  });

  // Get connected categories with their genres
  app.get('/api/connected-template-categories', async (req: any, res) => {
    try {
      console.log('[API] Fetching connected template categories');
      const categories = await storage.getConnectedTemplateCategories();
      console.log('[API] Found connected categories:', categories.length);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching connected template categories:", error);
      res.status(500).json({ message: "Failed to fetch connected template categories" });
    }
  });

  // Create connected category
  app.post('/api/connected-template-categories', async (req: any, res) => {
    try {
      console.log('[API] Creating connected template category:', req.body);
      const category = await storage.createConnectedTemplateCategory(req.body);
      console.log('[API] Created connected category:', category.id);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating connected template category:", error);
      res.status(500).json({ message: "Failed to create connected template category" });
    }
  });

  // Create connected genre
  app.post('/api/connected-template-genres', async (req: any, res) => {
    try {
      console.log('[API] Creating connected template genre:', req.body);
      const genre = await storage.createConnectedTemplateGenre(req.body);
      console.log('[API] Created connected genre:', genre.id);
      res.status(201).json(genre);
    } catch (error) {
      console.error("Error creating connected template genre:", error);
      res.status(500).json({ message: "Failed to create connected template genre" });
    }
  });

  // Create new category
  app.post('/api/connected-template-categories', async (req: any, res) => {
    try {
      const { name, description, color, isActive } = req.body;
      console.log('[API] Creating connected template category:', name);
      const category = await storage.createConnectedTemplateCategory({
        name,
        description: description || '',
        color: color || '#3b82f6',
        isActive: isActive !== undefined ? isActive : true,
      });
      console.log('[API] Created connected category:', category.id);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating connected template category:", error);
      res.status(500).json({ message: "Failed to create connected template category" });
    }
  });

  // Create new genre for a category
  app.post('/api/connected-template-genres', async (req: any, res) => {
    try {
      const { name, description, categoryId, color, isActive } = req.body;
      console.log('[API] Creating connected template genre:', name, 'for category:', categoryId);
      const genre = await storage.createConnectedTemplateGenre({
        name,
        description: description || '',
        categoryId,
        color: color || '#10b981',
        isActive: isActive !== undefined ? isActive : true,
      });
      console.log('[API] Created connected genre:', genre.id);
      res.status(201).json(genre);
    } catch (error) {
      console.error("Error creating connected template genre:", error);
      res.status(500).json({ message: "Failed to create connected template genre" });
    }
  });

  // Update connected category
  app.patch('/api/connected-template-categories/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log('[API] Updating connected template category:', id, updates);
      const category = await storage.updateConnectedTemplateCategory(id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating connected template category:", error);
      res.status(500).json({ message: "Failed to update connected template category" });
    }
  });

  // Delete connected category
  app.delete('/api/connected-template-categories/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log('[API] Deleting connected template category:', id);
      await storage.deleteConnectedTemplateCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting connected template category:", error);
      res.status(500).json({ message: "Failed to delete connected template category" });
    }
  });

  // Update connected genre
  app.patch('/api/connected-template-genres/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      console.log('[API] Updating connected template genre:', id, updates);
      const genre = await storage.updateConnectedTemplateGenre(id, updates);
      res.json(genre);
    } catch (error) {
      console.error("Error updating connected template genre:", error);
      res.status(500).json({ message: "Failed to update connected template genre" });
    }
  });

  // Delete connected genre
  app.delete('/api/connected-template-genres/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log('[API] Deleting connected template genre:', id);
      await storage.deleteConnectedTemplateGenre(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting connected template genre:", error);
      res.status(500).json({ message: "Failed to delete connected template genre" });
    }
  });

  // Reorder connected categories
  app.post('/api/connected-template-categories/reorder', async (req: any, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[API] Reordering connected template categories:', updates);

      // Update each category's order
      for (const update of updates) {
        if (update.id && typeof update.order === 'number') {
          await storage.updateConnectedTemplateCategory(update.id, { orderIndex: update.order });
        }
      }

      res.status(200).json({ message: "Connected template categories reordered successfully" });
    } catch (error) {
      console.error("Error reordering connected template categories:", error);
      res.status(500).json({ message: "Failed to reorder connected template categories" });
    }
  });

  // Reorder connected genres
  app.post('/api/connected-template-genres/reorder', async (req: any, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[API] Reordering connected template genres:', updates);

      // Update each genre's order
      for (const update of updates) {
        if (update.id && typeof update.order === 'number') {
          await storage.updateConnectedTemplateGenre(update.id, { orderIndex: update.order });
        }
      }

      res.status(200).json({ message: "Connected template genres reordered successfully" });
    } catch (error) {
      console.error("Error reordering connected template genres:", error);
      res.status(500).json({ message: "Failed to reorder connected template genres" });
    }
  });

  // CRUD operations for concerned teams
  app.post('/api/concerned-teams', async (req, res) => {
    try {
      const { name, description, isActive = true } = req.body;
      const team = await storage.createConcernedTeam({ name, description, isActive });
      res.status(201).json(team);
    } catch (error) {
      console.error('[API] Error creating concerned team:', error);
      res.status(500).json({ message: 'Failed to create concerned team' });
    }
  });

  app.patch('/api/concerned-teams/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const team = await storage.updateConcernedTeam(id, updates);
      res.json(team);
    } catch (error) {
      console.error('[API] Error updating concerned team:', error);
      res.status(500).json({ message: 'Failed to update concerned team' });
    }
  });

  app.delete('/api/concerned-teams/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteConcernedTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting concerned team:', error);
      res.status(500).json({ message: 'Failed to delete concerned team' });
    }
  });

  // Template Variables API Routes
  app.get('/api/template-variables', async (req, res) => {
    try {
      const { category, search, isSystem } = req.query;
      const variables = await storage.getTemplateVariables({ 
        category: category as string || undefined,
        search: search as string || undefined,
        isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined
      });
      
      // Sort by order property to ensure consistent ordering across all components
      const sortedVariables = variables.sort((a, b) => (a.order || 0) - (b.order || 0));
      res.json(sortedVariables);
    } catch (error) {
      console.error('[API] Error fetching template variables:', error);
      res.status(500).json({ message: 'Failed to fetch template variables' });
    }
  });

  // BYPASS ROUTE - No authentication required
  app.post('/api/create-variable', async (req, res) => {
    console.log('[CREATE-VARIABLE] POST request received - NO AUTH REQUIRED');
    console.log('[CREATE-VARIABLE] Request body:', req.body);
    try {
      const variable = await storage.createTemplateVariable(req.body);
      console.log('[CREATE-VARIABLE] Variable created successfully:', variable);
      res.status(201).json(variable);
    } catch (error) {
      console.error('[CREATE-VARIABLE] Error creating variable:', error);
      res.status(500).json({ message: 'Failed to create template variable', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/template-variables', async (req, res) => {
    console.log('[TEMPLATE-VARIABLES] POST request received - NO AUTH REQUIRED');
    console.log('[TEMPLATE-VARIABLES] Request body:', req.body);
    try {
      const variable = await storage.createTemplateVariable(req.body);
      console.log('[TEMPLATE-VARIABLES] Variable created successfully:', variable);
      res.status(201).json(variable);
    } catch (error) {
      console.error('[TEMPLATE-VARIABLES] Error creating variable:', error);
      res.status(500).json({ message: 'Failed to create template variable', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch('/api/template-variables/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const variable = await storage.updateTemplateVariable(id, req.body);
      res.json(variable);
    } catch (error) {
      console.error('[API] Error updating template variable:', error);
      res.status(500).json({ message: 'Failed to update template variable' });
    }
  });

  app.delete('/api/template-variables/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariable(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting template variable:', error);
      res.status(500).json({ message: 'Failed to delete template variable' });
    }
  });

  // Template Variable Categories API Routes
  app.get('/api/template-variable-categories', async (req, res) => {
    try {
      const categories = await storage.getTemplateVariableCategories();
      res.json(categories);
    } catch (error) {
      console.error('[API] Error fetching template variable categories:', error);
      res.status(500).json({ message: 'Failed to fetch template variable categories' });
    }
  });

  app.post('/api/template-variable-categories', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }
      
      const categoryData = { ...req.body, createdBy: userId };
      const category = await storage.createTemplateVariableCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('[API] Error creating template variable category:', error);
      res.status(500).json({ message: 'Failed to create template variable category', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch('/api/template-variable-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateTemplateVariableCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error('[API] Error updating template variable category:', error);
      res.status(500).json({ message: 'Failed to update template variable category' });
    }
  });

  app.delete('/api/template-variable-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariableCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting template variable category:', error);
      res.status(500).json({ message: 'Failed to delete template variable category' });
    }
  });

  // Template variables reorder endpoint for drag-and-drop functionality
  app.post('/api/template-variables/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[TemplateVariables] Reordering template variables:', updates);

      // Update each variable's order
      for (const update of updates) {
        if (update.id && typeof update.order === 'number') {
          await storage.updateTemplateVariable(update.id, { order: update.order });
        }
      }

      res.status(200).json({ message: "Template variables order updated successfully" });
    } catch (error) {
      console.error("Error reordering template variables:", error);
      res.status(500).json({ message: "Failed to reorder template variables" });
    }
  });

  // Color Settings API Routes
  app.get('/api/color-settings', async (req, res) => {
    try {
      const { entityType, entityName } = req.query;
      const colorSettings = await storage.getColorSettings({ 
        entityType: entityType as 'genre' | 'category' || undefined,
        entityName: entityName as string || undefined
      });
      res.json(colorSettings);
    } catch (error) {
      console.error('[API] Error fetching color settings:', error);
      res.status(500).json({ message: 'Failed to fetch color settings' });
    }
  });

  // BYPASS ROUTE - No authentication required
  app.post('/api/create-color-setting', async (req, res) => {
    console.log('[CREATE-COLOR] POST request received - NO AUTH REQUIRED');
    console.log('[CREATE-COLOR] Request body:', req.body);
    try {
      const colorSetting = await storage.upsertColorSetting(req.body);
      console.log('[CREATE-COLOR] Color setting created successfully:', colorSetting);
      res.json(colorSetting);
    } catch (error) {
      console.error('[CREATE-COLOR] Error creating color setting:', error);
      res.status(500).json({ message: 'Failed to create/update color setting', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/color-settings', async (req, res) => {
    try {
      const colorSetting = await storage.upsertColorSetting(req.body);
      res.json(colorSetting);
    } catch (error) {
      console.error('[API] Error creating/updating color setting:', error);
      res.status(500).json({ message: 'Failed to create/update color setting', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/color-settings/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteColorSetting(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting color setting:', error);
      res.status(500).json({ message: 'Failed to delete color setting' });
    }
  });

  // Template Variables API Routes
  app.get('/api/template-variables', async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        isSystem: req.query.isSystem === 'true' ? true : req.query.isSystem === 'false' ? false : undefined
      };
      const variables = await storage.getTemplateVariables(filters);
      res.json(variables);
    } catch (error) {
      console.error('[API] Error fetching template variables:', error);
      res.status(500).json({ message: 'Failed to fetch template variables' });
    }
  });



  app.put('/api/template-variables/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const variable = await storage.updateTemplateVariable(id, req.body);
      res.json(variable);
    } catch (error) {
      console.error('[API] Error updating template variable:', error);
      res.status(500).json({ message: 'Failed to update template variable' });
    }
  });

  app.delete('/api/template-variables/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariable(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting template variable:', error);
      res.status(500).json({ message: 'Failed to delete template variable' });
    }
  });

  // Template Variable Categories API Routes
  app.get('/api/template-variable-categories', async (req, res) => {
    try {
      const categories = await storage.getTemplateVariableCategories();
      res.json(categories);
    } catch (error) {
      console.error('[API] Error fetching template variable categories:', error);
      res.status(500).json({ message: 'Failed to fetch template variable categories' });
    }
  });

  app.post('/api/template-variable-categories', async (req, res) => {
    try {
      const categoryData = { ...req.body, createdBy: 'system' };
      const category = await storage.createTemplateVariableCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error('[API] Error creating template variable category:', error);
      res.status(500).json({ message: 'Failed to create template variable category' });
    }
  });

  // FAQ API routes
  app.get('/api/faqs', async (req, res) => {
    try {
      const { category, search, isActive } = req.query;
      const filters = {
        category: category as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const faqs = await storage.getFaqs(filters);
      res.json(faqs);
    } catch (error) {
      console.error('[API] Error fetching FAQs:', error);
      res.status(500).json({ message: 'Failed to fetch FAQs' });
    }
  });

  app.post('/api/faqs', async (req, res) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.status(201).json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid FAQ data", errors: error.errors });
      }
      console.error('[API] Error creating FAQ:', error);
      res.status(500).json({ message: 'Failed to create FAQ' });
    }
  });

  app.put('/api/faqs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFaqSchema.partial().parse(req.body);
      const faq = await storage.updateFaq(id, validatedData);
      res.json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid FAQ data", errors: error.errors });
      }
      console.error('[API] Error updating FAQ:', error);
      res.status(500).json({ message: 'Failed to update FAQ' });
    }
  });

  app.delete('/api/faqs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFaq(id);
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting FAQ:', error);
      res.status(500).json({ message: 'Failed to delete FAQ' });
    }
  });

  // FAQ reorder endpoint for drag-and-drop functionality
  app.post('/api/faqs/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[FAQs] Reordering FAQs:', updates);

      // Update each FAQ's order
      for (const update of updates) {
        if (update.id && typeof update.order === 'number') {
          console.log(`[FAQs] Updating FAQ ${update.id} with order:`, update.order);
          await storage.updateFaq(update.id, { order: update.order });
        }
      }

      res.status(200).json({ message: "FAQ order updated successfully" });
    } catch (error) {
      console.error("Error reordering FAQs:", error);
      res.status(500).json({ message: "Failed to reorder FAQs" });
    }
  });

  // Railway deployment debugging endpoints
  app.get('/api/railway/supabase-debug', railwaySupabaseDebug);
  app.get('/api/railway/health', railwayHealthCheck);
  
  console.log('[Simple Routes] ✅ Railway debugging endpoints registered:');
  console.log('[Simple Routes]   - /api/railway/supabase-debug (comprehensive diagnostics)');
  console.log('[Simple Routes]   - /api/railway/health (health check with Supabase status)');
  // User Ordering API routes
  app.get('/api/user-ordering/:contentType', async (req, res) => {
    try {
      const { contentType } = req.params;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      console.log(`[Simple Routes] Getting user ordering for ${contentType} by user ${userId}`);
      const ordering = await storage.getUserOrdering(userId, contentType);
      res.json(ordering);
    } catch (error: any) {
      console.error(`[Simple Routes] Error getting user ordering:`, error);
      res.status(500).json({ message: 'Failed to get user ordering' });
    }
  });

  app.post('/api/user-ordering/:contentType', async (req, res) => {
    try {
      const { contentType } = req.params;
      const { user_id, ordering } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      console.log(`[Simple Routes] User ordering request for ${contentType}:`, {
        bodyUserId: user_id,
        headerUserId: userId,
        ordering,
        body: req.body,
        headers: req.headers
      });
      
      // Use userId from headers if not in body
      const finalUserId = user_id || userId;
      
      if (!finalUserId || !ordering) {
        console.log(`[Simple Routes] Missing data - userId: ${finalUserId}, ordering:`, ordering);
        return res.status(400).json({ message: 'User ID and ordering data required' });
      }

      console.log(`[Simple Routes] Saving user ordering for ${contentType} by user ${finalUserId}`, ordering);
      await storage.saveUserOrdering(finalUserId, contentType, ordering);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`[Simple Routes] Error saving user ordering:`, error);
      res.status(500).json({ message: 'Failed to save user ordering' });
    }
  });

  // Global ordering routes for universal drag-and-drop
  app.get('/api/global-ordering/:contentType', async (req, res) => {
    try {
      const { contentType } = req.params;
      console.log('[Simple Routes] Getting global ordering for:', contentType);
      const ordering = await storage.getGlobalOrdering(contentType);
      res.json(ordering);
    } catch (error) {
      console.error('[Simple Routes] Error fetching global ordering:', error);
      res.status(500).json({ message: 'Failed to fetch global ordering' });
    }
  });

  app.post('/api/global-ordering/:contentType', async (req, res) => {
    try {
      const { contentType } = req.params;
      const { ordering } = req.body;
      console.log('[Simple Routes] Saving global ordering for:', contentType, ordering);
      await storage.saveGlobalOrdering(contentType, ordering);
      res.json({ message: 'Global ordering saved successfully' });
    } catch (error) {
      console.error('[Simple Routes] Error saving global ordering:', error);
      res.status(500).json({ 
        message: 'Failed to save global ordering', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // FAQ acknowledgment endpoints
  app.post('/api/faqs/:id/acknowledge', async (req, res) => {
    try {
      const { id: faqId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await storage.markFaqAsSeen(userId, faqId);
      res.status(200).json({ message: "FAQ marked as seen successfully" });
    } catch (error) {
      console.error("Error marking FAQ as seen:", error);
      res.status(500).json({ message: "Failed to mark FAQ as seen" });
    }
  });

  app.get('/api/user/:userId/seen-faqs', async (req, res) => {
    try {
      const { userId } = req.params;
      const seenFaqs = await storage.getUserSeenFaqs(userId);
      res.json(seenFaqs);
    } catch (error) {
      console.error("Error getting user seen FAQs:", error);
      res.status(500).json({ message: "Failed to get user seen FAQs" });
    }
  });

  // Duplicate endpoint removed - using the one at line 916 instead

  app.get('/api/user/:userId/seen-announcements', async (req, res) => {
    try {
      const { userId } = req.params;
      const seenAnnouncements = await storage.getUserSeenAnnouncements(userId);
      res.json(seenAnnouncements);
    } catch (error) {
      console.error("Error getting user seen announcements:", error);
      res.status(500).json({ message: "Failed to get user seen announcements" });
    }
  });

  // =============================================================================
  // PERSISTENT NOTIFICATION ROUTES (Supabase-based replacements for localStorage)
  // =============================================================================
  
  // Persistent FAQ Acknowledgments - replaces localStorage FAQ disco states
  app.post('/api/persistent/faqs/:id/acknowledge', async (req, res) => {
    try {
      const { id: faqId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await storage.acknowledgeFaq(userId, faqId);
      res.status(200).json({ message: "FAQ persistently acknowledged" });
    } catch (error) {
      console.error("Error persistently acknowledging FAQ:", error);
      res.status(500).json({ message: "Failed to acknowledge FAQ" });
    }
  });

  app.get('/api/persistent/user/:userId/faq-acknowledgments', async (req, res) => {
    try {
      const { userId } = req.params;
      const acknowledgments = await storage.getUserFaqAcknowledgments(userId);
      res.json(acknowledgments);
    } catch (error) {
      console.error("Error getting persistent FAQ acknowledgments:", error);
      res.status(500).json({ message: "Failed to get FAQ acknowledgments" });
    }
  });

  app.get('/api/persistent/user/:userId/faq/:faqId/seen', async (req, res) => {
    try {
      const { userId, faqId } = req.params;
      const seen = await storage.hasUserSeenFaq(userId, faqId);
      res.json({ seen });
    } catch (error) {
      console.error("Error checking if FAQ seen:", error);
      res.status(500).json({ message: "Failed to check FAQ status" });
    }
  });

  // Persistent Announcement Acknowledgments - replaces localStorage "Got it" states
  app.post('/api/persistent/announcements/:id/acknowledge', async (req, res) => {
    try {
      const { id: announcementId } = req.params;
      const { userId, version = 1 } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      await storage.acknowledgeAnnouncement(userId, announcementId, Number(version));
      res.status(200).json({ message: "Announcement persistently acknowledged" });
    } catch (error) {
      console.error("Error persistently acknowledging announcement:", error);
      res.status(500).json({ message: "Failed to acknowledge announcement" });
    }
  });

  app.get('/api/persistent/user/:userId/announcement-acknowledgments', async (req, res) => {
    try {
      const { userId } = req.params;
      const acknowledgments = await storage.getUserAnnouncementAcknowledgments(userId);
      res.json(acknowledgments);
    } catch (error) {
      console.error("Error getting persistent announcement acknowledgments:", error);
      res.status(500).json({ message: "Failed to get announcement acknowledgments" });
    }
  });

  app.get('/api/persistent/user/:userId/announcement/:announcementId/seen', async (req, res) => {
    try {
      const { userId, announcementId } = req.params;
      const { version = 1 } = req.query;
      const seen = await storage.hasUserSeenAnnouncement(userId, announcementId, Number(version));
      res.json({ seen });
    } catch (error) {
      console.error("Error checking if announcement seen:", error);
      res.status(500).json({ message: "Failed to check announcement status" });
    }
  });

  // Get unacknowledged items for notification count/badges
  app.get('/api/persistent/user/:userId/unacknowledged-faqs', async (req, res) => {
    try {
      const { userId } = req.params;
      const unacknowledged = await storage.getUnacknowledgedFaqs(userId);
      res.json(unacknowledged);
    } catch (error) {
      console.error("Error getting unacknowledged FAQs:", error);
      res.status(500).json({ message: "Failed to get unacknowledged FAQs" });
    }
  });

  app.get('/api/persistent/user/:userId/unacknowledged-announcements', async (req, res) => {
    try {
      const { userId } = req.params;
      const unacknowledged = await storage.getUnacknowledgedAnnouncements(userId);
      res.json(unacknowledged);
    } catch (error) {
      console.error("Error getting unacknowledged announcements:", error);
      res.status(500).json({ message: "Failed to get unacknowledged announcements" });
    }
  });

  // User Notification Preferences  
  app.get('/api/persistent/user/:userId/notification-preferences', async (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = await storage.getUserNotificationPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      res.status(500).json({ message: "Failed to get notification preferences" });
    }
  });

  app.post('/api/persistent/user/:userId/notification-preferences', async (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;
      await storage.updateUserNotificationPreferences(userId, preferences);
      res.status(200).json({ message: "Notification preferences updated" });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  console.log('[Simple Routes] ✅ All routes registered successfully!');
  console.log('[Simple Routes] 📋 Total API routes available:');
  console.log('[Simple Routes]   - Live Reply Templates: /api/live-reply-templates');
  console.log('[Simple Routes]   - Email Templates: /api/email-templates');
  console.log('[Simple Routes]   - Personal Notes: /api/personal-notes');
  console.log('[Simple Routes]   - Template Variables: /api/template-variables');
  console.log('[Simple Routes]   - Color Settings: /api/color-settings');
  console.log('[Simple Routes]   - FAQs: /api/faqs');
  console.log('[Simple Routes]   - FAQ Acknowledgments: /api/faqs/:id/acknowledge');
  console.log('[Simple Routes]   - User Seen FAQs: /api/user/:userId/seen-faqs');
  console.log('[Simple Routes]   - Announcement Acknowledgments: /api/announcements/:id/acknowledge');
  console.log('[Simple Routes]   - User Seen Announcements: /api/user/:userId/seen-announcements');
  console.log('[Simple Routes]   - User Ordering: /api/user-ordering/:contentType');
  console.log('[Simple Routes]   - Global Ordering: /api/global-ordering/:contentType');

  // Note: WebSocket functionality disabled for Vercel serverless deployment
  // Real-time features can be implemented using Supabase real-time subscriptions in the client
}

/**
 * Enhanced WebSocket Server Setup for Presence Tracking
 * Creates WebSocket server with presence management capabilities
 */
export function createWebSocketServer(server: Server): WebSocketServer {
  console.log('[Simple Routes] 🚀 Creating enhanced WebSocket server with presence tracking...');
  
  // Import WebSocket presence manager here to avoid circular imports
  const { wsPresenceManager } = require('./websocket-presence');
  
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  console.log('[Simple Routes] 📡 Enhanced WebSocket server created on /ws');

  // Initialize presence manager with WebSocket server
  wsPresenceManager.initialize(wss);

  wss.on('error', (error) => {
    console.error('[Simple Routes] ❌ WebSocket Server Error:', error);
  });

  wss.on('close', () => {
    console.log('[Simple Routes] 📴 WebSocket server closed');
  });

  console.log('[Simple Routes] ✅ Enhanced presence WebSocket system ready');
  
  return wss;
}