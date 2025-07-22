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

export const storage = new DatabaseStorage();
