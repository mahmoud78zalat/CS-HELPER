import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: pgEnum("user_role", ["admin", "agent"])("role").default("agent").notNull(),
  status: pgEnum("user_status", ["active", "blocked", "banned"])("status").default("active").notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  genre: varchar("genre").notNull(),
  concernedTeam: varchar("concerned_team").notNull(),
  variables: text("variables").array(),
  stageOrder: integer("stage_order").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templateUsage = pgTable("template_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => templates.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const siteContent = pgTable("site_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key").unique().notNull(),
  content: text("content").notNull(),
  updatedBy: varchar("updated_by").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  templates: many(templates),
  templateUsage: many(templateUsage),
  siteContentUpdates: many(siteContent),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [templates.createdBy],
    references: [users.id],
  }),
  usage: many(templateUsage),
}));

export const templateUsageRelations = relations(templateUsage, ({ one }) => ({
  template: one(templates, {
    fields: [templateUsage.templateId],
    references: [templates.id],
  }),
  user: one(users, {
    fields: [templateUsage.userId],
    references: [users.id],
  }),
}));

export const siteContentRelations = relations(siteContent, ({ one }) => ({
  updatedBy: one(users, {
    fields: [siteContent.updatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertTemplateUsageSchema = createInsertSchema(templateUsage).omit({
  id: true,
  usedAt: true,
});

export const insertSiteContentSchema = createInsertSchema(siteContent).omit({
  id: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplateUsage = z.infer<typeof insertTemplateUsageSchema>;
export type TemplateUsage = typeof templateUsage.$inferSelect;
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;
