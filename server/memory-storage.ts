import {
  type User,
  type UpsertUser,
  type LiveReplyTemplate,
  type LiveReplyTemplateGroup,
  type InsertLiveReplyTemplateGroup,
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
  type Faq,
  type InsertFaq,
  type CallScript,
  type InsertCallScript,
  type StoreEmail,
  type InsertStoreEmail,
  // Legacy types for backward compatibility
  type Template,
  type InsertTemplate,
} from "@shared/schema";
import { nanoid } from "nanoid";
import type { IStorage } from "./storage";

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private liveReplyTemplates = new Map<string, LiveReplyTemplate>();
  private liveReplyTemplateGroups = new Map<string, LiveReplyTemplateGroup>();
  private emailTemplates = new Map<string, EmailTemplate>();
  private liveReplyUsage = new Map<string, LiveReplyUsage>();
  private emailTemplateUsage = new Map<string, EmailTemplateUsage>();
  private siteContent = new Map<string, SiteContent>();
  private announcements = new Map<string, Announcement>();
  private userAnnouncementAcks = new Map<string, UserAnnouncementAck>();
  private faqs = new Map<string, Faq>();
  private callScripts = new Map<string, CallScript>();
  private storeEmails = new Map<string, StoreEmail>();

  constructor() {
    console.log('[MemoryStorage] ⚠️  Using memory storage - data will not persist!');
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // FAQ data will be fetched from database only - no hardcoded data
    console.log('[MemoryStorage] FAQ system configured to use database data only');
    
    // Add sample call scripts for testing
    this.initializeSampleCallScripts();
    this.initializeSampleStoreEmails();
  }

  private initializeSampleCallScripts(): void {
    const sampleScripts = [
      {
        id: "cs1",
        name: "Welcome Greeting",
        content: "Hello, thank you for calling our support. How may I assist you today?",
        category: "greeting",
        genre: "general greeting",
        isActive: true,
        orderIndex: 1,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: "cs2", 
        name: "Order Status Check",
        content: "I'll be happy to check your order status. Could you please provide me with your order number?",
        category: "order inquiry",
        genre: "order id",
        isActive: true,
        orderIndex: 2,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: "cs3",
        name: "Apology for Delay",
        content: "I sincerely apologize for the delay in your order delivery. Let me look into this matter immediately and find a solution for you.",
        category: "delivery problems", 
        genre: "apology",
        isActive: true,
        orderIndex: 3,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      }
    ];

    sampleScripts.forEach(script => {
      this.callScripts.set(script.id, script);
    });
    
    console.log('[MemoryStorage] Initialized with 3 sample call scripts');
  }

  private initializeSampleStoreEmails(): void {
    const sampleStoreEmails = [
      {
        id: "se1",
        storeName: "Dubai Mall Store",
        storeEmail: "dubaimall@brandsforless.ae",
        storePhone: "+971-4-123-4567",
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: "se2",
        storeName: "Mall of Emirates Store", 
        storeEmail: "moe@brandsforless.ae",
        storePhone: "+971-4-987-6543",
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: "se3",
        storeName: "City Centre Deira Store",
        storeEmail: "deira@brandsforless.ae", 
        storePhone: "+971-4-555-0123",
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      }
    ];

    sampleStoreEmails.forEach(storeEmail => {
      this.storeEmails.set(storeEmail.id, storeEmail);
    });
    
    console.log('[MemoryStorage] Initialized with 3 sample store emails');
  }



  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'agent';
  }): Promise<User | null> {
    const now = new Date();
    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: null,
      role: userData.role || "agent",
      status: "active",
      isOnline: true,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    };
    
    this.users.set(userData.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const existingUser = this.users.get(userData.id);
    
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "agent",
      status: userData.status || "active",
      isOnline: userData.isOnline || false,
      lastSeen: userData.lastSeen || now,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(userData.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const now = new Date();
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

    return Array.from(this.users.values()).map(user => {
      // Calculate accurate online status based on last activity
      if (user.lastSeen) {
        const lastSeenTime = new Date(user.lastSeen).getTime();
        const timeSinceLastSeen = now.getTime() - lastSeenTime;
        
        // User is only considered online if they were active within the last 5 minutes
        const wasOnline = user.isOnline;
        user.isOnline = timeSinceLastSeen < OFFLINE_THRESHOLD;
        
        // Log status changes for debugging
        if (wasOnline !== user.isOnline) {
          console.log(`[MemoryStorage] User ${user.email} status updated: ${wasOnline} -> ${user.isOnline} (last seen: ${Math.round(timeSinceLastSeen / 1000)}s ago)`);
        }
      } else {
        // No last seen time means user is offline
        user.isOnline = false;
      }
      
      return user;
    }).sort((a, b) => 
      (a.firstName || "").localeCompare(b.firstName || "") || (a.lastName || "").localeCompare(b.lastName || "")
    );
  }

  async updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.status = status;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  async deleteUser(id: string): Promise<void> {
    console.log('[MemoryStorage] Deleting user with ID:', id);
    
    // For memory storage, we can only delete from our in-memory store
    // Note: This is a limitation of memory storage - it cannot delete from Supabase Auth
    console.log('[MemoryStorage] WARNING: Memory storage cannot delete from Supabase Auth');
    console.log('[MemoryStorage] Only removing user from in-memory store');
    
    this.users.delete(id);
    console.log('[MemoryStorage] Successfully deleted user from memory storage:', id);
  }

  async updateUserRole(id: string, role: "admin" | "agent"): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.role = role;
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  // Live Reply Template operations
  async getLiveReplyTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<LiveReplyTemplate[]> {
    let templates = Array.from(this.liveReplyTemplates.values());

    if (filters?.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters?.genre) {
      templates = templates.filter(t => t.genre === filters.genre);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.contentEn.toLowerCase().includes(searchLower) ||
        t.contentAr.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.genre.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === filters.isActive);
    }

    return templates.sort((a, b) => a.stageOrder - b.stageOrder || (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime());
  }

  async getLiveReplyTemplate(id: string): Promise<LiveReplyTemplate | undefined> {
    return this.liveReplyTemplates.get(id);
  }

  async createLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    const id = nanoid();
    const now = new Date();
    
    const newTemplate: LiveReplyTemplate = {
      id,
      name: template.name,
      contentEn: template.contentEn,
      contentAr: template.contentAr,
      category: template.category,
      genre: template.genre,
      variables: template.variables || null,
      stageOrder: template.stageOrder || 1,
      isActive: template.isActive !== undefined ? template.isActive : true,
      usageCount: 0,

      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    console.log('[MemoryStorage] Created template:', newTemplate.name);
    this.liveReplyTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async upsertLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    // For memory storage, upsert is same as create since we don't have IDs from external source
    return this.createLiveReplyTemplate(template);
  }

  async updateLiveReplyTemplate(id: string, template: Partial<InsertLiveReplyTemplate>): Promise<LiveReplyTemplate> {
    const existingTemplate = this.liveReplyTemplates.get(id);
    if (!existingTemplate) {
      throw new Error("Template not found");
    }

    const updatedTemplate: LiveReplyTemplate = {
      ...existingTemplate,
      ...template,
      updatedAt: new Date(),
    };

    this.liveReplyTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteLiveReplyTemplate(id: string): Promise<void> {
    this.liveReplyTemplates.delete(id);
  }

  async incrementLiveReplyUsage(templateId: string, userId: string): Promise<void> {
    const usageId = nanoid();
    const usage: LiveReplyUsage = {
      id: usageId,
      templateId,
      userId,
      usedAt: new Date(),
    };
    
    this.liveReplyUsage.set(usageId, usage);

    const template = this.liveReplyTemplates.get(templateId);
    if (template) {
      template.usageCount++;
      template.updatedAt = new Date();
      this.liveReplyTemplates.set(templateId, template);
    }
  }

  async getLiveReplyUsageStats(templateId: string): Promise<number> {
    return Array.from(this.liveReplyUsage.values())
      .filter(usage => usage.templateId === templateId).length;
  }

  // Live Reply Template Group operations
  async getLiveReplyTemplateGroups(): Promise<LiveReplyTemplateGroup[]> {
    return Array.from(this.liveReplyTemplateGroups.values())
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getLiveReplyTemplateGroup(id: string): Promise<LiveReplyTemplateGroup | undefined> {
    return this.liveReplyTemplateGroups.get(id);
  }

  async createLiveReplyTemplateGroup(group: InsertLiveReplyTemplateGroup): Promise<LiveReplyTemplateGroup> {
    console.log('[MemoryStorage] Creating live reply template group:', group.name);
    
    // Check for duplicate names
    const existingGroups = Array.from(this.liveReplyTemplateGroups.values());
    const duplicateName = existingGroups.find(g => g.name.toLowerCase() === group.name.toLowerCase());
    
    if (duplicateName) {
      console.error('[MemoryStorage] Duplicate group name found:', group.name);
      throw new Error(`A group with the name "${group.name}" already exists. Please choose a different name.`);
    }
    
    const id = nanoid();
    const now = new Date();
    
    // Find next order index
    const maxOrder = existingGroups.length > 0 ? Math.max(...existingGroups.map(g => g.orderIndex)) : 0;
    
    const newGroup: LiveReplyTemplateGroup = {
      id,
      name: group.name,
      description: group.description || null,
      color: group.color || '#3b82f6',
      isActive: group.isActive !== undefined ? group.isActive : true,
      orderIndex: group.orderIndex !== undefined ? group.orderIndex : maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      supabaseId: null, // Memory storage doesn't sync to Supabase
      lastSyncedAt: null,
    };
    
    this.liveReplyTemplateGroups.set(id, newGroup);
    console.log('[MemoryStorage] Successfully created live reply template group:', id);
    return newGroup;
  }

  async updateLiveReplyTemplateGroup(id: string, group: Partial<InsertLiveReplyTemplateGroup>): Promise<LiveReplyTemplateGroup> {
    const existingGroup = this.liveReplyTemplateGroups.get(id);
    if (!existingGroup) {
      throw new Error("Group not found");
    }

    const updatedGroup: LiveReplyTemplateGroup = {
      ...existingGroup,
      ...group,
      updatedAt: new Date(),
    };

    this.liveReplyTemplateGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteLiveReplyTemplateGroup(id: string): Promise<void> {
    this.liveReplyTemplateGroups.delete(id);
  }

  async reorderLiveReplyTemplateGroups(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const update of updates) {
      const group = this.liveReplyTemplateGroups.get(update.id);
      if (group) {
        group.orderIndex = update.orderIndex;
        group.updatedAt = new Date();
        this.liveReplyTemplateGroups.set(update.id, group);
      }
    }
  }

  // Email Template operations
  async getEmailTemplates(filters?: {
    category?: string;
    genre?: string;
    concernedTeam?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate[]> {
    let templates = Array.from(this.emailTemplates.values());

    if (filters?.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters?.genre) {
      templates = templates.filter(t => t.genre === filters.genre);
    }

    if (filters?.concernedTeam) {
      templates = templates.filter(t => t.concernedTeam === filters.concernedTeam);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        (t.content && t.content.toLowerCase().includes(searchLower)) ||
        t.subject.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.genre.toLowerCase().includes(searchLower) ||
        (t.concernedTeam && t.concernedTeam.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === filters.isActive);
    }

    return templates.sort((a, b) => a.stageOrder - b.stageOrder || (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime());
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = nanoid();
    const now = new Date();
    
    const newTemplate: EmailTemplate = {
      id,
      name: template.name,
      subject: template.subject,
      content: template.content || '',
      contentEn: template.contentEn || template.content || '',
      contentAr: template.contentAr || '',
      category: template.category,
      genre: template.genre,
      concernedTeam: template.concernedTeam,
      warningNote: template.warningNote || null,
      variables: template.variables || null,
      stageOrder: template.stageOrder || 1,
      isActive: template.isActive !== undefined ? template.isActive : true,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.emailTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async upsertEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    // For memory storage, upsert is same as create since we don't have IDs from external source
    return this.createEmailTemplate(template);
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const existingTemplate = this.emailTemplates.get(id);
    if (!existingTemplate) {
      throw new Error("Template not found");
    }

    const updatedTemplate: EmailTemplate = {
      ...existingTemplate,
      ...template,
      updatedAt: new Date(),
    };

    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    this.emailTemplates.delete(id);
  }

  async incrementEmailTemplateUsage(templateId: string, userId: string): Promise<void> {
    const usageId = nanoid();
    const usage: EmailTemplateUsage = {
      id: usageId,
      templateId,
      userId,
      usedAt: new Date(),
    };
    
    this.emailTemplateUsage.set(usageId, usage);

    const template = this.emailTemplates.get(templateId);
    if (template) {
      template.usageCount++;
      template.updatedAt = new Date();
      this.emailTemplates.set(templateId, template);
    }
  }

  async getEmailTemplateUsageStats(templateId: string): Promise<number> {
    return Array.from(this.emailTemplateUsage.values())
      .filter(usage => usage.templateId === templateId).length;
  }

  // Legacy template operations (backward compatibility)
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
    let content = Array.from(this.siteContent.values());

    if (key) {
      content = content.filter(c => c.key === key);
    }

    return content.sort((a, b) => (b.updatedAt || new Date(0)).getTime() - (a.updatedAt || new Date(0)).getTime());
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const existingContent = Array.from(this.siteContent.values())
      .find(c => c.key === content.key);
    
    const now = new Date();
    const newContent: SiteContent = {
      id: existingContent?.id || nanoid(),
      ...content,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.siteContent.set(newContent.id, newContent);
    return newContent;
  }

  // Announcement operations (stub implementation for memory storage)
  async getAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveAnnouncement(): Promise<Announcement | undefined> {
    return Array.from(this.announcements.values())
      .filter(a => a.isActive)
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority] || 
               new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      })[0];
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const now = new Date();
    const newAnnouncement: Announcement = {
      id: nanoid(),
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive || false,
      backgroundColor: announcement.backgroundColor || "#3b82f6",
      textColor: announcement.textColor || "#ffffff",
      borderColor: announcement.borderColor || "#1d4ed8",
      priority: announcement.priority || "medium",
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastAnnouncedAt: null,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.announcements.set(newAnnouncement.id, newAnnouncement);
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const existing = this.announcements.get(id);
    if (!existing) {
      throw new Error("Announcement not found");
    }

    const updated: Announcement = {
      ...existing,
      ...announcement,
      updatedAt: new Date(),
    };
    
    this.announcements.set(id, updated);
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    this.announcements.delete(id);
    // Also delete related acknowledgments
    for (const [ackId, ack] of Array.from(this.userAnnouncementAcks.entries())) {
      if (ack.announcementId === id) {
        this.userAnnouncementAcks.delete(ackId);
      }
    }
  }

  async acknowledgeAnnouncement(userId: string, announcementId: string): Promise<void> {
    const ackId = nanoid();
    const ack: UserAnnouncementAck = {
      id: ackId,
      userId,
      announcementId,
      acknowledgedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.userAnnouncementAcks.set(ackId, ack);
  }

  async getUserAnnouncementAck(userId: string, announcementId: string): Promise<UserAnnouncementAck | undefined> {
    return Array.from(this.userAnnouncementAcks.values())
      .find(ack => ack.userId === userId && ack.announcementId === announcementId);
  }

  async getUnacknowledgedAnnouncements(userId: string): Promise<Announcement[]> {
    const activeAnnouncements = Array.from(this.announcements.values()).filter(a => a.isActive);
    const userAcks = Array.from(this.userAnnouncementAcks.values()).filter(ack => ack.userId === userId);
    
    return activeAnnouncements.filter(announcement => 
      !userAcks.some(ack => ack.announcementId === announcement.id)
    ).sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });
  }

  async reAnnounce(announcementId: string): Promise<void> {
    const existing = this.announcements.get(announcementId);
    if (!existing) {
      throw new Error("Announcement not found");
    }

    const updated: Announcement = {
      ...existing,
      version: (existing.version || 1) + 1,
      lastAnnouncedAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.announcements.set(announcementId, updated);
  }

  // Dynamic Category and Genre operations - return empty arrays for memory storage
  async getTemplateCategories(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    return [];
  }

  async getEmailCategories(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    return [];
  }

  async getTemplateGenres(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    return [];
  }

  async getConcernedTeams(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    return [];
  }

  // CRUD operations for categories and teams (stub implementations)
  async createTemplateCategory(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async updateTemplateCategory(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteTemplateCategory(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  async createEmailCategory(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async updateEmailCategory(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteEmailCategory(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  async createTemplateGenre(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async updateTemplateGenre(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteTemplateGenre(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  async createConcernedTeam(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async updateConcernedTeam(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteConcernedTeam(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  // Template Variables operations (stub implementations)
  async getTemplateVariables(filters?: { category?: string; search?: string; isSystem?: boolean; }): Promise<any[]> {
    return [];
  }

  async getTemplateVariable(id: string): Promise<any | undefined> {
    return undefined;
  }

  async createTemplateVariable(variable: any): Promise<any> {
    throw new Error('Not implemented in memory storage');
  }

  async updateTemplateVariable(id: string, variable: any): Promise<any> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteTemplateVariable(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  // Template Variable Categories operations (stub implementations)
  async getTemplateVariableCategories(): Promise<any[]> {
    return [];
  }

  async getTemplateVariableCategory(id: string): Promise<any | undefined> {
    return undefined;
  }

  async createTemplateVariableCategory(category: any): Promise<any> {
    throw new Error('Not implemented in memory storage');
  }

  async updateTemplateVariableCategory(id: string, category: any): Promise<any> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteTemplateVariableCategory(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  // Color Settings operations (stub implementations)
  async getColorSettings(filters?: { entityType?: 'genre' | 'category'; entityName?: string; }): Promise<any[]> {
    return [];
  }

  async getColorSetting(id: string): Promise<any | undefined> {
    return undefined;
  }

  async upsertColorSetting(colorSetting: any): Promise<any> {
    throw new Error('Not implemented in memory storage');
  }

  async deleteColorSetting(id: string): Promise<void> {
    throw new Error('Not implemented in memory storage');
  }

  // FAQ operations
  async getFaqs(filters?: { category?: string; search?: string; isActive?: boolean; }): Promise<Faq[]> {
    let faqList = Array.from(this.faqs.values());

    if (filters?.category) {
      faqList = faqList.filter(f => f.category === filters.category);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      faqList = faqList.filter(f => 
        f.question.toLowerCase().includes(searchLower) ||
        f.answer.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.isActive !== undefined) {
      faqList = faqList.filter(f => f.isActive === filters.isActive);
    }

    return faqList.sort((a, b) => a.order - b.order);
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    return this.faqs.get(id);
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const id = nanoid();
    const now = new Date();
    
    const newFaq: Faq = {
      id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'general',
      order: faq.order || 0,
      isActive: faq.isActive !== undefined ? faq.isActive : true,
      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.faqs.set(id, newFaq);
    return newFaq;
  }

  async updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq> {
    const existingFaq = this.faqs.get(id);
    if (!existingFaq) {
      throw new Error("FAQ not found");
    }

    const updatedFaq: Faq = {
      ...existingFaq,
      ...faq,
      updatedAt: new Date(),
    };

    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }

  async deleteFaq(id: string): Promise<void> {
    this.faqs.delete(id);
  }

  // User ordering operations (for drag-and-drop functionality)
  async getUserOrdering(userId: string, contentType: string): Promise<Array<{item_id: string, display_order: number}>> {
    // Memory storage doesn't persist ordering, return empty array
    console.log(`[MemoryStorage] getUserOrdering for ${userId}, ${contentType} - returning empty (no persistence)`);
    return [];
  }

  async saveUserOrdering(userId: string, contentType: string, ordering: Array<{item_id: string, display_order: number}>): Promise<void> {
    // Memory storage doesn't persist ordering, just log
    console.log(`[MemoryStorage] saveUserOrdering for ${userId}, ${contentType}:`, ordering.length, 'items');
  }

  // Global ordering operations
  async getGlobalOrdering(contentType: string): Promise<Array<{item_id: string, display_order: number}>> {
    console.log(`[MemoryStorage] getGlobalOrdering for ${contentType} - returning empty (no persistence)`);
    return [];
  }

  async saveGlobalOrdering(contentType: string, ordering: Array<{item_id: string, display_order: number}>): Promise<void> {
    console.log(`[MemoryStorage] saveGlobalOrdering for ${contentType}:`, ordering.length, 'items');
  }

  // FAQ seen tracking
  async markFaqAsSeen(userId: string, faqId: string): Promise<void> {
    console.log(`[MemoryStorage] markFaqAsSeen for user ${userId}, FAQ ${faqId}`);
  }

  async getUserSeenFaqs(userId: string): Promise<string[]> {
    console.log(`[MemoryStorage] getUserSeenFaqs for user ${userId} - returning empty`);
    return [];
  }

  // Announcement seen tracking
  async markAnnouncementAsSeen(userId: string, announcementId: string): Promise<void> {
    console.log(`[MemoryStorage] markAnnouncementAsSeen for user ${userId}, announcement ${announcementId}`);
  }

  async getUserSeenAnnouncements(userId: string): Promise<string[]> {
    console.log(`[MemoryStorage] getUserSeenAnnouncements for user ${userId} - returning empty`);
    return [];
  }

  // Call Scripts operations
  async getCallScripts(filters?: {
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<CallScript[]> {
    let scriptList = Array.from(this.callScripts.values());

    if (filters?.category) {
      scriptList = scriptList.filter(s => s.category === filters.category);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      scriptList = scriptList.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.content.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.isActive !== undefined) {
      scriptList = scriptList.filter(s => s.isActive === filters.isActive);
    }

    return scriptList.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getCallScript(id: string): Promise<CallScript | undefined> {
    return this.callScripts.get(id);
  }

  async createCallScript(script: InsertCallScript): Promise<CallScript> {
    const id = nanoid();
    const now = new Date();
    
    const newScript: CallScript = {
      id,
      name: script.name,
      content: script.content,
      category: script.category || null,
      genre: script.genre || null,
      isActive: script.isActive !== undefined ? script.isActive : true,
      orderIndex: script.orderIndex || 0,
      createdBy: script.createdBy || null,
      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };

    this.callScripts.set(id, newScript);
    console.log(`[MemoryStorage] Created call script: ${script.name}`);
    return newScript;
  }

  async updateCallScript(id: string, script: Partial<InsertCallScript>): Promise<CallScript> {
    const existingScript = this.callScripts.get(id);
    if (!existingScript) {
      throw new Error("Call script not found");
    }

    const updatedScript: CallScript = {
      ...existingScript,
      ...script,
      updatedAt: new Date(),
    };

    this.callScripts.set(id, updatedScript);
    console.log(`[MemoryStorage] Updated call script: ${updatedScript.name}`);
    return updatedScript;
  }

  async deleteCallScript(id: string): Promise<void> {
    const script = this.callScripts.get(id);
    if (script) {
      console.log(`[MemoryStorage] Deleted call script: ${script.name}`);
    }
    this.callScripts.delete(id);
  }

  // Store Emails operations
  async getStoreEmails(filters?: {
    search?: string;
    isActive?: boolean;
  }): Promise<StoreEmail[]> {
    let emailList = Array.from(this.storeEmails.values());

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      emailList = emailList.filter(e => 
        e.storeName.toLowerCase().includes(searchLower) ||
        e.storeEmail.toLowerCase().includes(searchLower) ||
        e.storePhone.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.isActive !== undefined) {
      emailList = emailList.filter(e => e.isActive === filters.isActive);
    }

    return emailList.sort((a, b) => a.storeName.localeCompare(b.storeName));
  }

  async getAllStoreEmails(): Promise<StoreEmail[]> {
    return Array.from(this.storeEmails.values())
      .sort((a, b) => a.storeName.localeCompare(b.storeName));
  }

  async getStoreEmail(id: string): Promise<StoreEmail | undefined> {
    return this.storeEmails.get(id);
  }

  async createStoreEmail(storeEmail: InsertStoreEmail): Promise<StoreEmail> {
    const id = nanoid();
    const now = new Date();
    
    const newStoreEmail: StoreEmail = {
      id,
      storeName: storeEmail.storeName,
      storeEmail: storeEmail.storeEmail,
      storePhone: storeEmail.storePhone,
      isActive: storeEmail.isActive !== undefined ? storeEmail.isActive : true,
      createdBy: storeEmail.createdBy || null,
      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };

    this.storeEmails.set(id, newStoreEmail);
    console.log(`[MemoryStorage] Created store email: ${storeEmail.storeName}`);
    return newStoreEmail;
  }

  async updateStoreEmail(id: string, storeEmail: Partial<InsertStoreEmail>): Promise<StoreEmail> {
    const existingEmail = this.storeEmails.get(id);
    if (!existingEmail) {
      throw new Error("Store email not found");
    }

    const updatedEmail: StoreEmail = {
      ...existingEmail,
      ...storeEmail,
      updatedAt: new Date(),
    };

    this.storeEmails.set(id, updatedEmail);
    console.log(`[MemoryStorage] Updated store email: ${updatedEmail.storeName}`);
    return updatedEmail;
  }

  async deleteStoreEmail(id: string): Promise<void> {
    const email = this.storeEmails.get(id);
    if (email) {
      console.log(`[MemoryStorage] Deleted store email: ${email.storeName}`);
    }
    this.storeEmails.delete(id);
  }
}