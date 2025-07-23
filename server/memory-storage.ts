import {
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
  // Legacy types for backward compatibility
  type Template,
  type InsertTemplate,
} from "@shared/schema";
import { nanoid } from "nanoid";
import type { IStorage } from "./storage";

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private liveReplyTemplates = new Map<string, LiveReplyTemplate>();
  private emailTemplates = new Map<string, EmailTemplate>();
  private liveReplyUsage = new Map<string, LiveReplyUsage>();
  private emailTemplateUsage = new Map<string, EmailTemplateUsage>();
  private siteContent = new Map<string, SiteContent>();

  constructor() {
    // Initialize with default admin user
    const defaultAdmin: User = {
      id: "admin-user",
      firstName: "System",
      lastName: "Admin",
      email: "admin@example.com",
      profileImageUrl: null,
      role: "admin",
      status: "active",
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(defaultAdmin.id, defaultAdmin);

    // Initialize with some sample templates for demo
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample live reply templates - Bilingual (English and Arabic in single template)
    const sampleLiveTemplates: LiveReplyTemplate[] = [
      {
        id: nanoid(),
        name: "Welcome Greeting",
        contentEn: "Hello {customer_name}! Welcome to our service. How can I assist you today?",
        contentAr: "مرحباً {customer_name}! أهلاً بك في خدمتنا. كيف يمكنني مساعدتك اليوم؟",
        category: "General",
        genre: "greeting",
        variables: ["customer_name"],
        stageOrder: 1,
        isActive: true,
        usageCount: 0,
        createdBy: "admin-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: nanoid(),
        name: "Order Status Check",
        contentEn: "Hi {customer_name}, let me check the status of your order {order_id} right away.",
        contentAr: "مرحباً {customer_name}، دعني أتحقق من حالة طلبك {order_id} فوراً.",
        category: "Orders",
        genre: "standard",
        variables: ["customer_name", "order_id"],
        stageOrder: 2,
        isActive: true,
        usageCount: 0,
        createdBy: "admin-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: nanoid(),
        name: "Apology for Delay",
        contentEn: "I sincerely apologize for the delay with your order {order_id}, {customer_name}. Let me resolve this immediately.",
        contentAr: "أعتذر بصدق عن التأخير في طلبك {order_id}، {customer_name}. دعني أحل هذا الأمر فوراً.",
        category: "Apology",
        genre: "apology",
        variables: ["order_id", "customer_name"],
        stageOrder: 3,
        isActive: true,
        usageCount: 0,
        createdBy: "admin-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
    ];

    sampleLiveTemplates.forEach(template => {
      this.liveReplyTemplates.set(template.id, template);
    });

    // Sample email templates
    const sampleEmailTemplates: EmailTemplate[] = [
      {
        id: nanoid(),
        name: "Order Escalation to Finance",
        subject: "Urgent: Payment Issue for Order {order_id}",
        content: "Dear Finance Team,\n\nCustomer {customer_name} is experiencing payment issues with order {order_id}. Please review and resolve urgently.\n\nBest regards,\nCustomer Service",
        category: "Orders",
        genre: "urgent",
        concernedTeam: "Finance",
        warningNote: null,
        variables: ["order_id", "customer_name"],
        stageOrder: 1,
        isActive: true,
        usageCount: 0,
        createdBy: "admin-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: nanoid(),
        name: "Order Issue Escalation",
        subject: "Order Issue - Customer: {customer_name} - REASON: {REASON}",
        content: "Dear Finance Team,\n\nWe have an order issue that requires immediate attention:\n\nCustomer: {customer_name}\nOrder ID: {order_id}\nReason: {REASON}\n\nAgent handling this case: {AGENTNAME}\n\nPlease review and provide guidance within 24 hours.\n\nBest regards,\n{AGENTNAME}",
        category: "Escalation",
        genre: "urgent",
        concernedTeam: "Finance",
        warningNote: "Ensure all details are accurate before escalating",
        variables: ["customer_name", "order_id", "REASON", "AGENTNAME"],
        stageOrder: 2,
        isActive: true,
        usageCount: 0,
        createdBy: "admin-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
      {
        id: nanoid(),
        name: "Customer Complaint Resolution", 
        subject: "Customer Complaint - {customer_name} - {REASON}",
        content: "Dear Customer Service Manager,\n\nWe received a customer complaint that needs your attention:\n\nCustomer Details:\n- Name: {customer_name}\n- Email: {customer_email}\n- Phone: {customer_phone}\n\nComplaint Reason: {REASON}\nOrder ID: {order_id}\n\nThis case is being handled by {AGENTNAME} and requires management review.\n\nPlease advise on next steps.\n\nRegards,\n{AGENTNAME}",
        category: "Complaint",
        genre: "urgent", 
        concernedTeam: "Customer Service",
        warningNote: "Handle with care - customer satisfaction priority",
        variables: ["customer_name", "customer_email", "customer_phone", "REASON", "order_id", "AGENTNAME"],
        stageOrder: 3,
        isActive: true,
        usageCount: 0,
        createdBy: "admin-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        supabaseId: null,
        lastSyncedAt: null,
      },
    ];

    sampleEmailTemplates.forEach(template => {
      this.emailTemplates.set(template.id, template);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
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
    return Array.from(this.users.values()).sort((a, b) => 
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
      createdBy: template.createdBy,
      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.liveReplyTemplates.set(id, newTemplate);
    return newTemplate;
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
        t.content.toLowerCase().includes(searchLower) ||
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
      content: template.content,
      category: template.category,
      genre: template.genre,
      concernedTeam: template.concernedTeam,
      warningNote: template.warningNote || null,
      variables: template.variables || null,
      stageOrder: template.stageOrder || 1,
      isActive: template.isActive !== undefined ? template.isActive : true,
      usageCount: 0,
      createdBy: template.createdBy,
      createdAt: now,
      updatedAt: now,
      supabaseId: null,
      lastSyncedAt: null,
    };
    
    this.emailTemplates.set(id, newTemplate);
    return newTemplate;
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
}