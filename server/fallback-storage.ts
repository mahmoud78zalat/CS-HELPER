/**
 * Fallback storage for deployment environments without database
 * Provides basic functionality for initial deployment testing
 */

import { IStorage } from './storage';
import { MemoryStorage } from './memory-storage';
import type {
  User,
  UpsertUser,
  LiveReplyTemplate,
  EmailTemplate,
  InsertLiveReplyTemplate,
  InsertEmailTemplate,
  InsertSiteContent,
  SiteContent
} from '@shared/schema';

export class FallbackStorage implements IStorage {
  private users = new Map<string, User>();
  private liveReplyTemplates = new Map<string, LiveReplyTemplate>();
  private emailTemplates = new Map<string, EmailTemplate>();
  private siteContent = new Map<string, SiteContent>();
  
  constructor() {
    console.log('🔄 Using fallback storage - suitable for initial deployment testing');
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Seed with minimal default data for deployment testing
    const defaultAdmin: User = {
      id: 'fallback-admin-001',
      email: 'admin@demo.local',
      firstName: 'Demo',
      lastName: 'Admin',
      profileImageUrl: null,
      role: 'admin',
      status: 'active',
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    };

    const defaultTemplate: LiveReplyTemplate = {
      id: 'fallback-template-001',
      name: 'Welcome Message',
      contentEn: 'Hello {customer_name}, thank you for contacting us. How can we help you today?',
      contentAr: 'مرحبا {customer_name}، شكرا لتواصلك معنا. كيف يمكننا مساعدتك اليوم؟',
      category: 'General',
      genre: 'Greeting',
      variables: ['customer_name'],
      stageOrder: 1,
      isActive: true,
      usageCount: 0,
      createdBy: defaultAdmin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    };

    const defaultSiteContent: SiteContent = {
      id: 'fallback-site-001',
      key: 'site_name',
      content: 'Customer Service Platform',
      updatedBy: defaultAdmin.id,
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    };

    // Store in memory
    this.users.set(defaultAdmin.id, defaultAdmin);
    this.liveReplyTemplates.set(defaultTemplate.id, defaultTemplate);
    this.siteContent.set(defaultSiteContent.key, defaultSiteContent);

    console.log('✅ Fallback storage initialized with demo data');
  }

  // Implement required IStorage methods with basic functionality
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.get(user.id);
    const newUser: User = {
      ...existingUser,
      ...user,
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    } as User;
    this.users.set(user.id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.status = status;
      user.updatedAt = new Date();
    }
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
    }
  }

  async updateUserRole(id: string, role: "admin" | "agent"): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.role = role;
      user.updatedAt = new Date();
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getLiveReplyTemplates(): Promise<LiveReplyTemplate[]> {
    return Array.from(this.liveReplyTemplates.values());
  }

  async getLiveReplyTemplate(id: string): Promise<LiveReplyTemplate | undefined> {
    return this.liveReplyTemplates.get(id);
  }

  async createLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    const id = `fallback-${Date.now()}`;
    const newTemplate: LiveReplyTemplate = {
      id,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    } as LiveReplyTemplate;
    this.liveReplyTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async upsertLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    return this.createLiveReplyTemplate(template);
  }

  async updateLiveReplyTemplate(id: string, template: Partial<InsertLiveReplyTemplate>): Promise<LiveReplyTemplate> {
    const existing = this.liveReplyTemplates.get(id);
    if (!existing) throw new Error('Template not found');
    
    const updated = { ...existing, ...template, updatedAt: new Date() };
    this.liveReplyTemplates.set(id, updated);
    return updated;
  }

  async deleteLiveReplyTemplate(id: string): Promise<void> {
    this.liveReplyTemplates.delete(id);
  }

  async incrementLiveReplyUsage(): Promise<void> {
    // No-op for fallback
  }

  async getLiveReplyUsageStats(): Promise<number> {
    return 0;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = `fallback-email-${Date.now()}`;
    const newTemplate: EmailTemplate = {
      id,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    } as EmailTemplate;
    this.emailTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async upsertEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    return this.createEmailTemplate(template);
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const existing = this.emailTemplates.get(id);
    if (!existing) throw new Error('Template not found');
    
    const updated = { ...existing, ...template, updatedAt: new Date() };
    this.emailTemplates.set(id, updated);
    return updated;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    this.emailTemplates.delete(id);
  }

  async incrementEmailTemplateUsage(): Promise<void> {
    // No-op for fallback
  }

  async getEmailTemplateUsageStats(): Promise<number> {
    return 0;
  }

  async getSiteContent(key: string): Promise<SiteContent | undefined> {
    return this.siteContent.get(key);
  }

  async getAllSiteContent(): Promise<SiteContent[]> {
    return Array.from(this.siteContent.values());
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const existing = this.siteContent.get(content.key);
    const newContent: SiteContent = {
      id: existing?.id || `fallback-content-${Date.now()}`,
      ...content,
      updatedAt: new Date(),
      supabaseId: null,
      lastSyncedAt: null
    };
    this.siteContent.set(content.key, newContent);
    return newContent;
  }

  // Stub implementations for other required methods
  async getAnnouncements(): Promise<any[]> { return []; }
  async createAnnouncement(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async updateAnnouncement(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async deleteAnnouncement(): Promise<void> { throw new Error('Not implemented in fallback'); }
  async getUserAnnouncementAcks(): Promise<any[]> { return []; }
  async markAnnouncementAsRead(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async getTemplateVariables(): Promise<any[]> { return []; }
  async createTemplateVariable(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async updateTemplateVariable(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async deleteTemplateVariable(): Promise<void> { throw new Error('Not implemented in fallback'); }
  async getTemplateVariableCategories(): Promise<any[]> { return []; }
  async createTemplateVariableCategory(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async updateTemplateVariableCategory(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async deleteTemplateVariableCategory(): Promise<void> { throw new Error('Not implemented in fallback'); }
  async getColorSettings(): Promise<any[]> { return []; }
  async upsertColorSetting(): Promise<any> { throw new Error('Not implemented in fallback'); }
  async resetColorsToDefault(): Promise<void> { throw new Error('Not implemented in fallback'); }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return {
      status: 'healthy',
      message: 'Fallback storage operational - connect database for full functionality'
    };
  }
}