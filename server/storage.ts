import {
  users,
  templates,
  templateUsage,
  siteContent,
  type User,
  type UpsertUser,
  type Template,
  type InsertTemplate,
  type InsertTemplateUsage,
  type TemplateUsage,
  type InsertSiteContent,
  type SiteContent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  updateUserRole(id: string, role: "admin" | "agent"): Promise<void>;

  // Template operations
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

  // Site content operations
  getSiteContent(key?: string): Promise<SiteContent[]>;
  upsertSiteContent(content: InsertSiteContent): Promise<SiteContent>;
}

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

  // Template operations
  async getTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<Template[]> {
    let query = db.select().from(templates);

    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(templates.category, filters.category));
    }

    if (filters?.genre) {
      conditions.push(eq(templates.genre, filters.genre));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(templates.name, `%${filters.search}%`),
          like(templates.content, `%${filters.search}%`),
          like(templates.subject, `%${filters.search}%`),
          like(templates.category, `%${filters.search}%`),
          like(templates.genre, `%${filters.search}%`)
        )
      );
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(templates.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(templates.stageOrder), desc(templates.createdAt));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db
      .insert(templates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template> {
    const [updatedTemplate] = await db
      .update(templates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  async incrementTemplateUsage(templateId: string, userId: string): Promise<void> {
    // Insert usage record
    await db.insert(templateUsage).values({
      templateId,
      userId,
    });

    // Increment usage count
    await db
      .update(templates)
      .set({
        usageCount: sql`${templates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));
  }

  async getTemplateUsageStats(templateId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(templateUsage)
      .where(eq(templateUsage.templateId, templateId));
    
    return result?.count || 0;
  }

  // Site content operations
  async getSiteContent(key?: string): Promise<SiteContent[]> {
    if (key) {
      const content = await db.select().from(siteContent).where(eq(siteContent.key, key));
      return content;
    }
    return await db.select().from(siteContent).orderBy(asc(siteContent.key));
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const [upsertedContent] = await db
      .insert(siteContent)
      .values(content)
      .onConflictDoUpdate({
        target: siteContent.key,
        set: {
          content: content.content,
          updatedBy: content.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedContent;
  }
}

// Memory storage for temporary use while database connection is being fixed
class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private templates: Map<string, Template> = new Map();
  private templateUsages: TemplateUsage[] = [];
  private siteContents: Map<string, SiteContent> = new Map();

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample templates
    const sampleTemplates = [
      {
        id: "1",
        name: "Order Delay Notification",
        subject: "Update on Your Recent Order",
        content: "Dear {customer_name}, We wanted to update you regarding your order {order_id}. Due to unforeseen circumstances, there will be a slight delay in processing your order. We sincerely apologize for any inconvenience this may cause.",
        category: "Order Issues",
        genre: "Standard",
        concernedTeam: "Customer Service",
        variables: ["customer_name", "order_id"],
        stageOrder: 1,
        isActive: true,
        usageCount: 0,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Delivery Problem Resolution",
        subject: "Regarding Your Delivery - {order_id}",
        content: "Hello {customer_name}, We understand you're experiencing an issue with the delivery of order {order_id}. Our team is working diligently to resolve this matter. We will update you within 24 hours with a resolution.",
        category: "Delivery Problems",
        genre: "Urgent",
        concernedTeam: "Logistics",
        variables: ["customer_name", "order_id"],
        stageOrder: 1,
        isActive: true,
        usageCount: 0,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Refund Request Confirmation",
        subject: "Your Refund Request - Order {order_id}",
        content: "Dear {customer_name}, We have received your refund request for order {order_id}. Your request is being processed and you can expect the refund to be completed within 3-5 business days.",
        category: "Refunds",
        genre: "Standard",
        concernedTeam: "Finance",
        variables: ["customer_name", "order_id"],
        stageOrder: 1,
        isActive: true,
        usageCount: 0,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleTemplates.forEach(template => {
      this.templates.set(template.id, template as Template);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      ...userData,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role || "agent",
      status: userData.status || "active",
      isOnline: userData.isOnline || false,
      lastSeen: userData.lastSeen || new Date(),
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      (a.firstName || "").localeCompare(b.firstName || "")
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

  async getTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<Template[]> {
    let result = Array.from(this.templates.values());

    if (filters?.category) {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters?.genre) {
      result = result.filter(t => t.genre === filters.genre);
    }
    if (filters?.isActive !== undefined) {
      result = result.filter(t => t.isActive === filters.isActive);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.content.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search) ||
        t.genre.toLowerCase().includes(search)
      );
    }

    return result.sort((a, b) => a.stageOrder - b.stageOrder);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const newTemplate: Template = {
      id: Math.random().toString(36).substr(2, 9),
      ...template,
      variables: template.variables ?? null,
      stageOrder: template.stageOrder ?? 1,
      isActive: template.isActive ?? true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error("Template not found");
    }
    
    const updated: Template = {
      ...existing,
      ...template,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    this.templates.delete(id);
  }

  async incrementTemplateUsage(templateId: string, userId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount++;
      template.updatedAt = new Date();
      this.templates.set(templateId, template);
    }

    this.templateUsages.push({
      id: Math.random().toString(36).substr(2, 9),
      templateId,
      userId,
      usedAt: new Date(),
    });
  }

  async getTemplateUsageStats(templateId: string): Promise<number> {
    return this.templateUsages.filter(u => u.templateId === templateId).length;
  }

  async getSiteContent(key?: string): Promise<SiteContent[]> {
    if (key) {
      const content = this.siteContents.get(key);
      return content ? [content] : [];
    }
    return Array.from(this.siteContents.values());
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const siteContent: SiteContent = {
      id: Math.random().toString(36).substr(2, 9),
      ...content,
      updatedAt: new Date(),
    };
    this.siteContents.set(content.key, siteContent);
    return siteContent;
  }
}

export const storage = process.env.NODE_ENV === 'development' 
  ? new MemStorage() 
  : new DatabaseStorage();
