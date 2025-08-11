import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createHmac } from "crypto";
import { storage } from "./storage";
import { insertLiveReplyTemplateSchema, insertEmailTemplateSchema, insertSiteContentSchema, insertCallScriptSchema, insertStoreEmailSchema } from "@shared/schema";
import { z } from "zod";
import { presenceApiRouter } from './routes/presence-api';

// Simple Supabase-based auth middleware
async function isAuthenticated(req: any, res: any, next: any) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required - User ID missing' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required - User not found' });
    }

    // Attach user info for route handlers
    req.user = { claims: { sub: userId }, userDetails: user };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Critical API route protection: Register these routes FIRST to prevent Vite interception
  app.patch('/api/call-scripts/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[CallScripts] FIXED ROUTE - Reorder request:', updates);
      console.log('[CallScripts] FIXED ROUTE - Storage type:', storage.constructor?.name);
      console.log('[CallScripts] FIXED ROUTE - Storage updateCallScript method exists:', typeof storage.updateCallScript);
      
      // Update each call script's order index - FIXED TO MATCH WORKING PATTERN
      for (const update of updates) {
        if (update.id) {
          const updateData: any = {};
          
          // Handle different order field names from frontend
          if (typeof update.order === 'number') {
            updateData.orderIndex = update.order;
          }
          if (typeof update.orderIndex === 'number') {
            updateData.orderIndex = update.orderIndex;
          }
          
          // Only update if we have valid order data
          if (Object.keys(updateData).length > 0) {
            console.log(`[CallScripts] FIXED ROUTE - Updating script ${update.id} with:`, updateData);
            await storage.updateCallScript(update.id, updateData);
          }
        }
      }
      
      console.log('[CallScripts] FIXED ROUTE - Call scripts reordered successfully');
      res.json({ message: "Call scripts reordered successfully" });
    } catch (error) {
      console.error("FIXED ROUTE - Error reordering call scripts:", error);
      res.status(500).json({ message: "Failed to reorder call scripts" });
    }
  });

  app.patch('/api/store-emails/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[StoreEmails] FIXED ROUTE - Reorder request:', updates);
      console.log('[StoreEmails] FIXED ROUTE - Storage type:', storage.constructor?.name);
      console.log('[StoreEmails] FIXED ROUTE - Storage updateStoreEmail method exists:', typeof storage.updateStoreEmail);
      
      // Update each store email's order index - FIXED TO MATCH WORKING PATTERN
      for (const update of updates) {
        if (update.id) {
          const updateData: any = {};
          
          // Handle different order field names from frontend
          if (typeof update.order === 'number') {
            updateData.orderIndex = update.order;
          }
          if (typeof update.orderIndex === 'number') {
            updateData.orderIndex = update.orderIndex;
          }
          
          // Only update if we have valid order data
          if (Object.keys(updateData).length > 0) {
            console.log(`[StoreEmails] FIXED ROUTE - Updating email ${update.id} with:`, updateData);
            await storage.updateStoreEmail(update.id, updateData);
          }
        }
      }
      
      console.log('[StoreEmails] FIXED ROUTE - Store emails reordered successfully');
      res.json({ message: "Store emails reordered successfully" });
    } catch (error) {
      console.error("FIXED ROUTE - Error reordering store emails:", error);
      res.status(500).json({ message: "Failed to reorder store emails" });
    }
  });

  // Template reorder endpoints - moved from simple-routes.ts to prevent Vite interception
  app.post('/api/live-reply-templates/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[LiveReplyTemplates] FIXED ROUTE - Reordering live reply templates:', updates);

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
          
          // Only update if we have valid order data
          if (Object.keys(updateData).length > 0) {
            console.log(`[LiveReplyTemplates] FIXED ROUTE - Updating template ${update.id} with:`, updateData);
            await storage.updateLiveReplyTemplate(update.id, updateData);
          }
        }
      }

      res.status(200).json({ message: "Live reply template order updated successfully" });
    } catch (error) {
      console.error("FIXED ROUTE - Error reordering live reply templates:", error);
      res.status(500).json({ message: "Failed to reorder live reply templates" });
    }
  });

  app.post('/api/email-templates/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[EmailTemplates] FIXED ROUTE - Reordering email templates:', updates);

      // Update each template's order
      for (const update of updates) {
        if (update.id && typeof update.order === 'number') {
          console.log(`[EmailTemplates] FIXED ROUTE - Updating template ${update.id} with stageOrder:`, update.order);
          await storage.updateEmailTemplate(update.id, { stageOrder: update.order });
        }
      }

      res.status(200).json({ message: "Email template order updated successfully" });
    } catch (error) {
      console.error("FIXED ROUTE - Error reordering email templates:", error);
      res.status(500).json({ message: "Failed to reorder email templates" });
    }
  });

  app.post('/api/faq-templates/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[FaqTemplates] FIXED ROUTE - Reordering FAQ templates:', updates);

      // Update each template's order
      for (const update of updates) {
        if (update.id) {
          const updateData: any = {};
          
          if (typeof update.order === 'number') {
            updateData.stageOrder = update.order;
          }
          if (typeof update.stageOrder === 'number') {
            updateData.stageOrder = update.stageOrder;
          }
          
          if (Object.keys(updateData).length > 0) {
            console.log(`[FaqTemplates] FIXED ROUTE - Updating template ${update.id} with:`, updateData);
            await storage.updateEmailTemplate(update.id, updateData);
          }
        }
      }

      res.status(200).json({ message: "FAQ template order updated successfully" });
    } catch (error) {
      console.error("FIXED ROUTE - Error reordering FAQ templates:", error);
      res.status(500).json({ message: "Failed to reorder FAQ templates" });
    }
  });

  app.post('/api/variable-templates/reorder', async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array is required" });
      }

      console.log('[VariableTemplates] FIXED ROUTE - Reordering variable templates:', updates);

      // Update each template's order
      for (const update of updates) {
        if (update.id) {
          const updateData: any = {};
          
          if (typeof update.order === 'number') {
            updateData.stageOrder = update.order;
          }
          if (typeof update.stageOrder === 'number') {
            updateData.stageOrder = update.stageOrder;
          }
          
          if (Object.keys(updateData).length > 0) {
            console.log(`[VariableTemplates] FIXED ROUTE - Updating template ${update.id} with:`, updateData);
            await storage.updateEmailTemplate(update.id, updateData);
          }
        }
      }

      res.status(200).json({ message: "Variable template order updated successfully" });
    } catch (error) {
      console.error("FIXED ROUTE - Error reordering variable templates:", error);
      res.status(500).json({ message: "Failed to reorder variable templates" });
    }
  });

  // Template GET endpoints - moved from simple-routes.ts to prevent Vite interception
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

  app.get('/api/live-reply-template-groups', async (req, res) => {
    try {
      const groups = await storage.getLiveReplyTemplateGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching live reply template groups:", error);
      res.status(500).json({ message: "Failed to fetch live reply template groups" });
    }
  });

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

  // Create new user endpoint (moved from simple-routes.ts)
  app.post('/api/create-user', async (req, res) => {
    try {
      console.log('[API] POST /api/create-user called with:', req.body);
      
      const userData = req.body;
      if (!userData.id || !userData.email) {
        return res.status(400).json({ message: 'User ID and email are required' });
      }

      // Check if user already exists (more reliable check)
      const existingUser = await storage.getUser(userData.id);
      if (existingUser) {
        console.log('[API] ✅ User already exists:', existingUser.email, '- returning existing user data');
        console.log('[API] User status - FirstTime:', existingUser.isFirstTimeUser, 'Role:', existingUser.role);
        return res.json(existingUser);
      }

      // Create new user only if they don't exist
      console.log('[API] 🔧 Creating truly new user in database...');
      const newUser = await storage.createUser(userData);
      if (newUser) {
        console.log('[API] ✅ New user created successfully:', newUser.email, newUser.role);
        res.status(201).json(newUser);
      } else {
        console.error('[API] ❌ Failed to create user - storage returned null');
        res.status(500).json({ message: 'Failed to create user in database' });
      }
    } catch (error) {
      console.error('[API] ❌ Error in create-user endpoint:', error);
      res.status(500).json({ message: 'Failed to create user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Heartbeat endpoint for online status detection - Now works for all users
  app.post('/api/user/heartbeat', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        userId, 
        isOnline, 
        lastActivity, 
        timestamp,
        pageHidden,
        pageVisible, 
        pageUnload,
        heartbeatStopped 
      } = req.body;
      
      const currentUserId = req.headers['x-user-id'] as string;
      
      // Security: Users can only update their own heartbeat
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Can only update own status" });
      }
      
      console.log(`[Enhanced Heartbeat] User ${userId} status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`, {
        lastActivity,
        pageHidden,
        pageVisible,
        pageUnload,
        heartbeatStopped
      });
      
      // Use enhanced presence tracking
      await storage.updateUserOnlineStatus(userId, isOnline);
      
      res.json({ 
        message: "Enhanced heartbeat updated",
        userId,
        isOnline,
        timestamp: new Date().toISOString(),
        realTimeEnabled: true
      });
    } catch (error) {
      console.error("Error updating enhanced heartbeat:", error);
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

  // Template routes (removed isAuthenticated middleware to match simple-routes.ts behavior)
  app.get('/api/templates', async (req: any, res) => {
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
        createdBy: currentUser.email || req.user.claims.sub,
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

      console.log('[Templates] Updating template', id, 'by user:', currentUser.email);

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

  app.put('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const updateData = insertLiveReplyTemplateSchema.partial().parse(req.body);

      console.log('[Templates] Updating template', id, 'by user:', currentUser.email);

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

  // Note: Personal notes routes are handled in simple-routes.ts without authentication restrictions for all users

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

  // Dynamic Categories and Genres API Routes
  
  // Get all template categories (live chat) - Temporarily remove auth for admin panel
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

  // Get all email categories - Temporarily remove auth for admin panel
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

  // Get all genres - Temporarily remove auth for admin panel
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

  // Get all concerned teams - Temporarily remove auth for admin panel
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

  // Announcements API Routes (moved from simple-routes.ts)
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

  // FAQ API Routes (moved from simple-routes.ts)
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

  // Core Template System Routes (moved from simple-routes.ts)
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

  // Site Content Routes (moved from simple-routes.ts)
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

  // Duplicate routes removed - using the ones defined earlier in the file

  // Call Scripts & Store Emails Routes (moved from simple-routes.ts)
  app.get('/api/call-scripts', async (req, res) => {
    try {
      const { category, search, isActive } = req.query;
      const filters = {
        category: category as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const scripts = await storage.getCallScripts(filters);
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching call scripts:", error);
      res.status(500).json({ message: "Failed to fetch call scripts" });
    }
  });

  app.get('/api/store-emails', async (req, res) => {
    try {
      const { category, search, isActive } = req.query;
      const filters = {
        category: category as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };

      const emails = await storage.getStoreEmails(filters);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching store emails:", error);
      res.status(500).json({ message: "Failed to fetch store emails" });
    }
  });

  // Personal Notes Routes (moved from simple-routes.ts)  
  app.get('/api/personal-notes/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { search } = req.query;
      
      const notes = await storage.getPersonalNotes(userId, { search: search as string });
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
      
      const { insertPersonalNoteSchema } = await import("@shared/schema");
      const noteData = insertPersonalNoteSchema.parse({
        userId,
        subject,
        content
      });

      // Use the main storage interface directly instead of sub-storage
      const note = await storage.createPersonalNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating personal note:', error);
      console.error('Error details:', error);
      res.status(500).json({ message: 'Failed to create note', error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch('/api/personal-notes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { subject, content } = req.body;
      
      const note = await storage.updatePersonalNote(id, { subject, content });
      res.json(note);
    } catch (error) {
      console.error('Error updating personal note:', error);
      res.status(500).json({ message: 'Failed to update note' });
    }
  });

  app.delete('/api/personal-notes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePersonalNote(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting personal note:', error);
      res.status(500).json({ message: 'Failed to delete note' });
    }
  });

  // Template Variables API Routes
  app.get('/api/template-variables', async (req: any, res) => {
    try {
      console.log('[API] Fetching template variables');
      const { category, search, isSystem } = req.query;
      const variables = await storage.getTemplateVariables({ 
        category: category || undefined,
        search: search || undefined,
        isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined
      });
      console.log(`[API] Found ${variables.length} template variables`);
      res.json(variables);
    } catch (error) {
      console.error("Error fetching template variables:", error);
      res.status(500).json({ message: "Failed to fetch template variables" });
    }
  });

  app.post('/api/template-variables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const variableData = { ...req.body, createdBy: userId };
      const variable = await storage.createTemplateVariable(variableData);
      res.status(201).json(variable);
    } catch (error) {
      console.error("Error creating template variable:", error);
      res.status(500).json({ message: "Failed to create template variable" });
    }
  });

  app.put('/api/template-variables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const variable = await storage.updateTemplateVariable(id, req.body);
      res.json(variable);
    } catch (error) {
      console.error("Error updating template variable:", error);
      res.status(500).json({ message: "Failed to update template variable" });
    }
  });

  app.delete('/api/template-variables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariable(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template variable:", error);
      res.status(500).json({ message: "Failed to delete template variable" });
    }
  });

  // Template Variable Categories API Routes
  app.get('/api/template-variable-categories', async (req: any, res) => {
    try {
      console.log('[API] Fetching template variable categories');
      const categories = await storage.getTemplateVariableCategories();
      console.log(`[API] Found ${categories.length} template variable categories`);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template variable categories:", error);
      res.status(500).json({ message: "Failed to fetch template variable categories" });
    }
  });

  app.post('/api/template-variable-categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = { ...req.body, createdBy: userId };
      const category = await storage.createTemplateVariableCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating template variable category:", error);
      res.status(500).json({ message: "Failed to create template variable category" });
    }
  });

  app.put('/api/template-variable-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateTemplateVariableCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating template variable category:", error);
      res.status(500).json({ message: "Failed to update template variable category" });
    }
  });

  app.delete('/api/template-variable-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariableCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template variable category:", error);
      res.status(500).json({ message: "Failed to delete template variable category" });
    }
  });

  // User profile setup route
  app.post('/api/users/setup-profile', async (req: any, res) => {
    try {
      console.log('[API] Profile setup request received');
      console.log('[API] Request body:', req.body);
      console.log('[API] Request headers:', req.headers);
      
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

  // Color Settings API Routes
  app.get('/api/color-settings', async (req: any, res) => {
    try {
      console.log('[API] Fetching color settings');
      const { entityType, entityName } = req.query;
      const settings = await storage.getColorSettings({ 
        entityType: entityType || undefined,
        entityName: entityName || undefined
      });
      console.log(`[API] Found ${settings.length} color settings`);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching color settings:", error);
      res.status(500).json({ message: "Failed to fetch color settings" });
    }
  });

  app.post('/api/color-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const colorData = { ...req.body, createdBy: userId };
      const setting = await storage.upsertColorSetting(colorData);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating color setting:", error);
      res.status(500).json({ message: "Failed to create color setting" });
    }
  });

  app.put('/api/color-settings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const colorData = { ...req.body, createdBy: userId };
      const setting = await storage.upsertColorSetting(colorData);
      res.json(setting);
    } catch (error) {
      console.error("Error updating color setting:", error);
      res.status(500).json({ message: "Failed to update color setting" });
    }
  });

  app.delete('/api/color-settings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteColorSetting(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting color setting:", error);
      res.status(500).json({ message: "Failed to delete color setting" });
    }
  });



  // Template Categories and Genres API (for Call Scripts filtering)
  app.get('/api/template-categories', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getAllTemplateCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories:", error);
      res.status(500).json({ message: "Failed to fetch template categories" });
    }
  });

  app.get('/api/template-genres', isAuthenticated, async (req: any, res) => {
    try {
      const genres = await storage.getAllTemplateGenres();
      res.json(genres);
    } catch (error) {
      console.error("Error fetching template genres:", error);
      res.status(500).json({ message: "Failed to fetch template genres" });
    }
  });

  // Template Variables routes
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
      console.error("Error fetching template variables:", error);
      res.status(500).json({ message: "Failed to fetch template variables" });
    }
  });

  app.get('/api/template-variables/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const variable = await storage.getTemplateVariable(id);
      if (!variable) {
        return res.status(404).json({ message: "Template variable not found" });
      }
      res.json(variable);
    } catch (error) {
      console.error("Error fetching template variable:", error);
      res.status(500).json({ message: "Failed to fetch template variable" });
    }
  });

  app.post('/api/template-variables', isAuthenticated, async (req: any, res) => {
    try {
      const variableData = {
        ...req.body,
        createdBy: req.user.claims.sub
      };
      const variable = await storage.createTemplateVariable(variableData);
      res.status(201).json(variable);
    } catch (error) {
      console.error("Error creating template variable:", error);
      res.status(500).json({ message: "Failed to create template variable" });
    }
  });

  app.put('/api/template-variables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const variable = await storage.updateTemplateVariable(id, req.body);
      res.json(variable);
    } catch (error) {
      console.error("Error updating template variable:", error);
      res.status(500).json({ message: "Failed to update template variable" });
    }
  });

  app.delete('/api/template-variables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariable(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template variable:", error);
      res.status(500).json({ message: "Failed to delete template variable" });
    }
  });

  // Template Variable Categories routes
  app.get('/api/template-variable-categories', async (req, res) => {
    try {
      const categories = await storage.getTemplateVariableCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template variable categories:", error);
      res.status(500).json({ message: "Failed to fetch template variable categories" });
    }
  });

  app.get('/api/template-variable-categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getTemplateVariableCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Template variable category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching template variable category:", error);
      res.status(500).json({ message: "Failed to fetch template variable category" });
    }
  });

  app.post('/api/template-variable-categories', isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = {
        ...req.body,
        createdBy: req.user.claims.sub
      };
      const category = await storage.createTemplateVariableCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating template variable category:", error);
      res.status(500).json({ message: "Failed to create template variable category" });
    }
  });

  app.put('/api/template-variable-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateTemplateVariableCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating template variable category:", error);
      res.status(500).json({ message: "Failed to update template variable category" });
    }
  });

  app.delete('/api/template-variable-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplateVariableCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template variable category:", error);
      res.status(500).json({ message: "Failed to delete template variable category" });
    }
  });

  // Call Scripts API endpoints
  app.get('/api/call-scripts', isAuthenticated, async (req: any, res) => {
    try {
      const { category, search, isActive } = req.query;
      const filters = {
        ...(category && { category }),
        ...(search && { search }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      };
      const scripts = await storage.getCallScripts(filters);
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching call scripts:", error);
      res.status(500).json({ message: "Failed to fetch call scripts" });
    }
  });

  app.get('/api/call-scripts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const script = await storage.getCallScript(id);
      if (!script) {
        return res.status(404).json({ message: "Call script not found" });
      }
      res.json(script);
    } catch (error) {
      console.error("Error fetching call script:", error);
      res.status(500).json({ message: "Failed to fetch call script" });
    }
  });

  app.post('/api/call-scripts', isAuthenticated, async (req: any, res) => {
    try {
      const scriptData = {
        ...req.body,
        createdBy: req.user.claims.sub
      };
      const script = await storage.createCallScript(scriptData);
      res.status(201).json(script);
    } catch (error) {
      console.error("Error creating call script:", error);
      res.status(500).json({ message: "Failed to create call script" });
    }
  });

  app.put('/api/call-scripts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const script = await storage.updateCallScript(id, req.body);
      res.json(script);
    } catch (error) {
      console.error("Error updating call script:", error);
      res.status(500).json({ message: "Failed to update call script" });
    }
  });

  app.delete('/api/call-scripts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCallScript(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting call script:", error);
      res.status(500).json({ message: "Failed to delete call script" });
    }
  });

  // Store Emails API endpoints
  app.get('/api/store-emails', isAuthenticated, async (req: any, res) => {
    try {
      const { search, isActive } = req.query;
      const filters = {
        ...(search && { search }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      };
      const storeEmails = await storage.getStoreEmails(filters);
      res.json(storeEmails);
    } catch (error) {
      console.error("Error fetching store emails:", error);
      res.status(500).json({ message: "Failed to fetch store emails" });
    }
  });

  app.get('/api/store-emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const storeEmail = await storage.getStoreEmail(id);
      if (!storeEmail) {
        return res.status(404).json({ message: "Store email not found" });
      }
      res.json(storeEmail);
    } catch (error) {
      console.error("Error fetching store email:", error);
      res.status(500).json({ message: "Failed to fetch store email" });
    }
  });

  app.post('/api/store-emails', isAuthenticated, async (req: any, res) => {
    try {
      const storeEmailData = {
        ...req.body,
        createdBy: req.user.claims.sub
      };
      const storeEmail = await storage.createStoreEmail(storeEmailData);
      res.status(201).json(storeEmail);
    } catch (error) {
      console.error("Error creating store email:", error);
      res.status(500).json({ message: "Failed to create store email" });
    }
  });

  app.put('/api/store-emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const storeEmail = await storage.updateStoreEmail(id, req.body);
      res.json(storeEmail);
    } catch (error) {
      console.error("Error updating store email:", error);
      res.status(500).json({ message: "Failed to update store email" });
    }
  });

  app.delete('/api/store-emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStoreEmail(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting store email:", error);
      res.status(500).json({ message: "Failed to delete store email" });
    }
  });

  // NOTE: Reorder endpoints moved to top of file to prevent Vite interception

  // Template Categories and Genres endpoints (for Call Scripts)
  app.get('/api/template-categories', async (req, res) => {
    try {
      const categories = await storage.getAllTemplateCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get template categories error:', error);
      res.status(500).json({ error: 'Failed to get template categories' });
    }
  });

  app.get('/api/template-genres', async (req, res) => {
    try {
      const genres = await storage.getAllTemplateGenres();
      res.json(genres);
    } catch (error) {
      console.error('Get template genres error:', error);
      res.status(500).json({ error: 'Failed to get template genres' });
    }
  });



  // FAQ and Announcement Acknowledgment API endpoints (Persistent notification system)
  app.post('/api/persistent/user/:userId/faq-acknowledgments/:faqId', async (req, res) => {
    try {
      const { userId, faqId } = req.params;
      await storage.acknowledgeFaq(userId, faqId);
      res.json({ success: true, message: 'FAQ acknowledged' });
    } catch (error) {
      console.error('Error acknowledging FAQ:', error);
      res.status(500).json({ message: 'Failed to acknowledge FAQ' });
    }
  });

  app.get('/api/persistent/user/:userId/faq-acknowledgments', async (req, res) => {
    try {
      const { userId } = req.params;
      const acknowledgments = await storage.getUserFaqAcknowledgments(userId);
      res.json(acknowledgments);
    } catch (error) {
      console.error('Error fetching FAQ acknowledgments:', error);
      res.status(500).json({ message: 'Failed to fetch FAQ acknowledgments' });
    }
  });

  app.post('/api/persistent/user/:userId/announcement-acknowledgments/:announcementId', async (req, res) => {
    try {
      const { userId, announcementId } = req.params;
      const { version } = req.body;
      await storage.acknowledgeAnnouncement(userId, announcementId, version || 1);
      res.json({ success: true, message: 'Announcement acknowledged' });
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
      res.status(500).json({ message: 'Failed to acknowledge announcement' });
    }
  });

  app.get('/api/persistent/user/:userId/announcement-acknowledgments', async (req, res) => {
    try {
      const { userId } = req.params;
      const acknowledgments = await storage.getUserAnnouncementAcknowledgments(userId);
      res.json(acknowledgments);
    } catch (error) {
      console.error('Error fetching announcement acknowledgments:', error);
      res.status(500).json({ message: 'Failed to fetch announcement acknowledgments' });
    }
  });

  // FAQ Routes 
  app.get('/api/faqs', async (req, res) => {
    try {
      const { category, search, isActive } = req.query;
      const filters = {
        category: category as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      };
      const faqs = await storage.getFaqs(filters);
      res.json(faqs);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      res.status(500).json({ message: 'Failed to fetch FAQs' });
    }
  });

  // Enhanced presence API endpoints
  app.use('/api/presence', presenceApiRouter);

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
