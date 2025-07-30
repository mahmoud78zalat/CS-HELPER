import {
  users,
  liveReplyTemplates,
  emailTemplates,
  liveReplyUsage,
  emailTemplateUsage,
  siteContent,
  announcements,
  userAnnouncementAcks,
  templateVariables,
  templateVariableCategories,
  colorSettings,
  type User,
  type UpsertUser,
  type LiveReplyTemplate,
  type EmailTemplate,
  type InsertLiveReplyTemplate,
  type InsertEmailTemplate,
  type InsertLiveReplyUsage,
  type InsertEmailTemplateUsage,
  type LiveReplyUsage,
  type EmailTemplateUsage,
  type InsertSiteContent,
  type SiteContent,
  type Announcement,
  type InsertAnnouncement,
  type UserAnnouncementAck,
  type InsertUserAnnouncementAck,
  type TemplateVariable,
  type InsertTemplateVariable,
  type TemplateVariableCategory,
  type InsertTemplateVariableCategory,
  type ColorSetting,
  type InsertColorSetting,
  // Legacy types for backward compatibility
  type Template,
  type InsertTemplate,
} from "@shared/schema";
// Database imports commented out for beta testing
// import { supabaseSync } from "./supabase";
// import { db } from "./db";
// import { eq, desc, asc, and, or, like, sql } from "drizzle-orm";
import { SupabaseStorage } from "./supabase-storage";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'agent';
  }): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  updateUserRole(id: string, role: "admin" | "agent"): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Live reply template operations (for live chat)
  getLiveReplyTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<LiveReplyTemplate[]>;
  getLiveReplyTemplate(id: string): Promise<LiveReplyTemplate | undefined>;
  createLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate>;
  upsertLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate>;
  updateLiveReplyTemplate(id: string, template: Partial<InsertLiveReplyTemplate>): Promise<LiveReplyTemplate>;
  deleteLiveReplyTemplate(id: string): Promise<void>;
  incrementLiveReplyUsage(templateId: string, userId: string): Promise<void>;
  getLiveReplyUsageStats(templateId: string): Promise<number>;

  // Email template operations (for internal team communication)
  getEmailTemplates(filters?: {
    category?: string;
    genre?: string;
    concernedTeam?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  upsertEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;
  incrementEmailTemplateUsage(templateId: string, userId: string): Promise<void>;
  getEmailTemplateUsageStats(templateId: string): Promise<number>;

  // Legacy template operations (backward compatibility - map to live reply templates)
  getTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;
  incrementTemplateUsage(templateId: string, userId: string): Promise<void>;
  getTemplateUsageStats(templateId: string): Promise<number>;

  // Dynamic Category and Genre operations
  getTemplateCategories(): Promise<{id: string, name: string, description: string, isActive: boolean}[]>;
  getEmailCategories(): Promise<{id: string, name: string, description: string, isActive: boolean}[]>;
  getTemplateGenres(): Promise<{id: string, name: string, description: string, isActive: boolean}[]>;
  getConcernedTeams(): Promise<{id: string, name: string, description: string, isActive: boolean}[]>;

  // CRUD operations for dynamic data
  createTemplateCategory(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  updateTemplateCategory(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  deleteTemplateCategory(id: string): Promise<void>;

  createEmailCategory(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  updateEmailCategory(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  deleteEmailCategory(id: string): Promise<void>;

  createTemplateGenre(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  updateTemplateGenre(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  deleteTemplateGenre(id: string): Promise<void>;

  createConcernedTeam(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  updateConcernedTeam(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}>;
  deleteConcernedTeam(id: string): Promise<void>;

  // Site content operations
  getSiteContent(key?: string): Promise<SiteContent[]>;
  upsertSiteContent(content: InsertSiteContent): Promise<SiteContent>;

  // Announcement operations (for admin broadcast messages)
  getAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncement(): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;
  
  // User announcement acknowledgment operations
  acknowledgeAnnouncement(userId: string, announcementId: string): Promise<void>;
  getUserAnnouncementAck(userId: string, announcementId: string): Promise<UserAnnouncementAck | undefined>;
  getUnacknowledgedAnnouncements(userId: string): Promise<Announcement[]>;
  reAnnounce(announcementId: string): Promise<void>;

  // Template Variables operations
  getTemplateVariables(filters?: {
    category?: string;
    search?: string;
    isSystem?: boolean;
  }): Promise<TemplateVariable[]>;
  getTemplateVariable(id: string): Promise<TemplateVariable | undefined>;
  createTemplateVariable(variable: InsertTemplateVariable): Promise<TemplateVariable>;
  updateTemplateVariable(id: string, variable: Partial<InsertTemplateVariable>): Promise<TemplateVariable>;
  deleteTemplateVariable(id: string): Promise<void>;

  // Template Variable Categories operations
  getTemplateVariableCategories(): Promise<TemplateVariableCategory[]>;
  getTemplateVariableCategory(id: string): Promise<TemplateVariableCategory | undefined>;
  createTemplateVariableCategory(category: InsertTemplateVariableCategory): Promise<TemplateVariableCategory>;
  updateTemplateVariableCategory(id: string, category: Partial<InsertTemplateVariableCategory>): Promise<TemplateVariableCategory>;
  deleteTemplateVariableCategory(id: string): Promise<void>;

  // Color Settings operations
  getColorSettings(filters?: {
    entityType?: 'genre' | 'category';
    entityName?: string;
  }): Promise<ColorSetting[]>;
  getColorSetting(id: string): Promise<ColorSetting | undefined>;
  upsertColorSetting(colorSetting: InsertColorSetting): Promise<ColorSetting>;
  deleteColorSetting(id: string): Promise<void>;
}

// DatabaseStorage class commented out for beta testing
/*
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName), asc(users.lastName));
  }

  async updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void> {
    await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: "admin" | "agent"): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Live Reply Template operations (for live chat)
  async getLiveReplyTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<LiveReplyTemplate[]> {
    let query = db.select().from(liveReplyTemplates);

    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(liveReplyTemplates.category, filters.category));
    }

    if (filters?.genre) {
      conditions.push(eq(liveReplyTemplates.genre, filters.genre));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(liveReplyTemplates.name, `%${filters.search}%`),
          like(liveReplyTemplates.content, `%${filters.search}%`),
          like(liveReplyTemplates.category, `%${filters.search}%`),
          like(liveReplyTemplates.genre, `%${filters.search}%`)
        )
      );
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(liveReplyTemplates.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(liveReplyTemplates.stageOrder), desc(liveReplyTemplates.createdAt));
  }

  async getLiveReplyTemplate(id: string): Promise<LiveReplyTemplate | undefined> {
    const [template] = await db.select().from(liveReplyTemplates).where(eq(liveReplyTemplates.id, id));
    return template;
  }

  async createLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    const [newTemplate] = await db
      .insert(liveReplyTemplates)
      .values(template)
      .returning();
    
    // Sync to Supabase if available
    if (supabaseSync.isReady()) {
      const supabaseId = await supabaseSync.syncLiveReplyTemplate(newTemplate);
      if (supabaseId) {
        await db
          .update(liveReplyTemplates)
          .set({ 
            supabaseId,
            lastSyncedAt: new Date() 
          })
          .where(eq(liveReplyTemplates.id, newTemplate.id));
        newTemplate.supabaseId = supabaseId;
        newTemplate.lastSyncedAt = new Date();
      }
    }

    return newTemplate;
  }

  async updateLiveReplyTemplate(id: string, template: Partial<InsertLiveReplyTemplate>): Promise<LiveReplyTemplate> {
    const [updatedTemplate] = await db
      .update(liveReplyTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(liveReplyTemplates.id, id))
      .returning();
    
    // Sync to Supabase if available
    if (supabaseSync.isReady() && updatedTemplate) {
      const supabaseId = await supabaseSync.syncLiveReplyTemplate(updatedTemplate);
      if (supabaseId && supabaseId !== updatedTemplate.supabaseId) {
        await db
          .update(liveReplyTemplates)
          .set({ 
            supabaseId,
            lastSyncedAt: new Date() 
          })
          .where(eq(liveReplyTemplates.id, id));
        updatedTemplate.supabaseId = supabaseId;
        updatedTemplate.lastSyncedAt = new Date();
      }
    }

    return updatedTemplate;
  }

  async deleteLiveReplyTemplate(id: string): Promise<void> {
    // Get template to delete from Supabase
    const template = await this.getLiveReplyTemplate(id);
    
    await db.delete(liveReplyTemplates).where(eq(liveReplyTemplates.id, id));
    
    // Delete from Supabase if available
    if (supabaseSync.isReady() && template?.supabaseId) {
      await supabaseSync.deleteTemplate('live_reply_templates', template.supabaseId);
    }
  }

  async incrementLiveReplyUsage(templateId: string, userId: string): Promise<void> {
    // Insert usage record
    await db.insert(liveReplyUsage).values({
      templateId,
      userId,
    });

    // Increment usage count
    await db
      .update(liveReplyTemplates)
      .set({
        usageCount: sql`${liveReplyTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(liveReplyTemplates.id, templateId));
  }

  async getLiveReplyUsageStats(templateId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(liveReplyUsage)
      .where(eq(liveReplyUsage.templateId, templateId));

    return result?.count || 0;
  }

  // Email Template operations (for internal team communication)
  async getEmailTemplates(filters?: {
    category?: string;
    genre?: string;
    concernedTeam?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate[]> {
    let query = db.select().from(emailTemplates);

    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(emailTemplates.category, filters.category));
    }

    if (filters?.genre) {
      conditions.push(eq(emailTemplates.genre, filters.genre));
    }

    if (filters?.concernedTeam) {
      conditions.push(eq(emailTemplates.concernedTeam, filters.concernedTeam));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(emailTemplates.name, `%${filters.search}%`),
          like(emailTemplates.content, `%${filters.search}%`),
          like(emailTemplates.subject, `%${filters.search}%`),
          like(emailTemplates.category, `%${filters.search}%`),
          like(emailTemplates.genre, `%${filters.search}%`),
          like(emailTemplates.concernedTeam, `%${filters.search}%`)
        )
      );
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(emailTemplates.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(emailTemplates.stageOrder), desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    
    // Sync to Supabase if available
    if (supabaseSync.isReady()) {
      const supabaseId = await supabaseSync.syncEmailTemplate(newTemplate);
      if (supabaseId) {
        await db
          .update(emailTemplates)
          .set({ 
            supabaseId,
            lastSyncedAt: new Date() 
          })
          .where(eq(emailTemplates.id, newTemplate.id));
        newTemplate.supabaseId = supabaseId;
        newTemplate.lastSyncedAt = new Date();
      }
    }

    return newTemplate;
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    
    // Sync to Supabase if available
    if (supabaseSync.isReady() && updatedTemplate) {
      const supabaseId = await supabaseSync.syncEmailTemplate(updatedTemplate);
      if (supabaseId && supabaseId !== updatedTemplate.supabaseId) {
        await db
          .update(emailTemplates)
          .set({ 
            supabaseId,
            lastSyncedAt: new Date() 
          })
          .where(eq(emailTemplates.id, id));
        updatedTemplate.supabaseId = supabaseId;
        updatedTemplate.lastSyncedAt = new Date();
      }
    }

    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    // Get template to delete from Supabase
    const template = await this.getEmailTemplate(id);
    
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    
    // Delete from Supabase if available
    if (supabaseSync.isReady() && template?.supabaseId) {
      await supabaseSync.deleteTemplate('email_templates', template.supabaseId);
    }
  }

  async incrementEmailTemplateUsage(templateId: string, userId: string): Promise<void> {
    // Insert usage record
    await db.insert(emailTemplateUsage).values({
      templateId,
      userId,
    });

    // Increment usage count
    await db
      .update(emailTemplates)
      .set({
        usageCount: sql`${emailTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId));
  }

  async getEmailTemplateUsageStats(templateId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailTemplateUsage)
      .where(eq(emailTemplateUsage.templateId, templateId));

    return result?.count || 0;
  }

  // Legacy template operations (backward compatibility - map to live reply templates)
  async getTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<Template[]> {
    return this.getLiveReplyTemplates(filters);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.getLiveReplyTemplate(id);
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    return this.createLiveReplyTemplate(template);
  }

  async updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template> {
    return this.updateLiveReplyTemplate(id, template);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.deleteLiveReplyTemplate(id);
  }

  async incrementTemplateUsage(templateId: string, userId: string): Promise<void> {
    return this.incrementLiveReplyUsage(templateId, userId);
  }

  async getTemplateUsageStats(templateId: string): Promise<number> {
    return this.getLiveReplyUsageStats(templateId);
  }

  // Site content operations
  async getSiteContent(key?: string): Promise<SiteContent[]> {
    let query = db.select().from(siteContent);

    if (key) {
      query = query.where(eq(siteContent.key, key));
    }

    return await query.orderBy(desc(siteContent.updatedAt));
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const [newContent] = await db
      .insert(siteContent)
      .values(content)
      .onConflictDoUpdate({
        target: siteContent.key,
        set: {
          ...content,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Sync to Supabase if available
    if (supabaseSync.isReady()) {
      const supabaseId = await supabaseSync.syncSiteContent(newContent);
      if (supabaseId) {
        await db
          .update(siteContent)
          .set({ 
            supabaseId,
            lastSyncedAt: new Date() 
          })
          .where(eq(siteContent.id, newContent.id));
        newContent.supabaseId = supabaseId;
        newContent.lastSyncedAt = new Date();
      }
    }

    return newContent;
  }
}
*/

// Lazy storage initialization - allows server to start even without Supabase
let _storage: IStorage | null = null;

function getStorage(): IStorage {
  if (!_storage) {
    try {
      _storage = new SupabaseStorage();
      console.log('[Storage] ✅ Using Supabase storage');
    } catch (error) {
      console.error('[Storage] Failed to initialize Supabase storage:', error);
      console.error('[Storage] Please ensure Supabase environment variables are configured:');
      console.error('[Storage] - VITE_SUPABASE_URL or SUPABASE_URL');
      console.error('[Storage] - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
      console.error('[Storage] - SUPABASE_SERVICE_ROLE_KEY (for admin operations)');
      
      // For Railway deployment, use memory storage fallback to allow health checks
      console.warn('[Storage] 🟡 Using memory storage fallback - Supabase functionality disabled');
      const { MemoryStorage } = require('./memory-storage');
      _storage = new MemoryStorage();
      console.log('[Storage] ✅ Using memory storage (degraded mode)');
    }
  }
  return _storage!;
}

// Export storage getter instead of direct instance
export const storage = new Proxy({} as IStorage, {
  get(target, prop) {
    return getStorage()[prop as keyof IStorage];
  }
});