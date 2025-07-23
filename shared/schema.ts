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

// Live chat reply templates for customer interactions
export const liveReplyTemplates = pgTable("live_reply_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  contentEn: text("content_en").notNull(),
  contentAr: text("content_ar").notNull(),
  category: varchar("category").notNull(),
  genre: varchar("genre").notNull(),
  variables: text("variables").array(),
  stageOrder: integer("stage_order").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(), // Maps to Supabase record
  lastSyncedAt: timestamp("last_synced_at"),
});

// Email templates for internal team communication  
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  genre: varchar("genre").notNull(),
  concernedTeam: varchar("concerned_team").notNull(),
  warningNote: text("warning_note"),
  variables: text("variables").array(),
  stageOrder: integer("stage_order").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(), // Maps to Supabase record
  lastSyncedAt: timestamp("last_synced_at"),
});

export const liveReplyUsage = pgTable("live_reply_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => liveReplyTemplates.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const emailTemplateUsage = pgTable("email_template_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => emailTemplates.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const siteContent = pgTable("site_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key").unique().notNull(),
  content: text("content").notNull(),
  updatedBy: varchar("updated_by").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(), // Maps to Supabase record
  lastSyncedAt: timestamp("last_synced_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  liveReplyTemplates: many(liveReplyTemplates),
  emailTemplates: many(emailTemplates),
  liveReplyUsage: many(liveReplyUsage),
  emailTemplateUsage: many(emailTemplateUsage),
  siteContentUpdates: many(siteContent),
}));

export const liveReplyTemplatesRelations = relations(liveReplyTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [liveReplyTemplates.createdBy],
    references: [users.id],
  }),
  usage: many(liveReplyUsage),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [emailTemplates.createdBy],
    references: [users.id],
  }),
  usage: many(emailTemplateUsage),
}));

export const liveReplyUsageRelations = relations(liveReplyUsage, ({ one }) => ({
  template: one(liveReplyTemplates, {
    fields: [liveReplyUsage.templateId],
    references: [liveReplyTemplates.id],
  }),
  user: one(users, {
    fields: [liveReplyUsage.userId],
    references: [users.id],
  }),
}));

export const emailTemplateUsageRelations = relations(emailTemplateUsage, ({ one }) => ({
  template: one(emailTemplates, {
    fields: [emailTemplateUsage.templateId],
    references: [emailTemplates.id],
  }),
  user: one(users, {
    fields: [emailTemplateUsage.userId],
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

export const insertLiveReplyTemplateSchema = createInsertSchema(liveReplyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  supabaseId: true,
  lastSyncedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  supabaseId: true,
  lastSyncedAt: true,
});

export const insertLiveReplyUsageSchema = createInsertSchema(liveReplyUsage).omit({
  id: true,
  usedAt: true,
});

export const insertEmailTemplateUsageSchema = createInsertSchema(emailTemplateUsage).omit({
  id: true,
  usedAt: true,
});

export const insertSiteContentSchema = createInsertSchema(siteContent).omit({
  id: true,
  updatedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertLiveReplyTemplate = z.infer<typeof insertLiveReplyTemplateSchema>;
export type LiveReplyTemplate = typeof liveReplyTemplates.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertLiveReplyUsage = z.infer<typeof insertLiveReplyUsageSchema>;
export type LiveReplyUsage = typeof liveReplyUsage.$inferSelect;

export type InsertEmailTemplateUsage = z.infer<typeof insertEmailTemplateUsageSchema>;
export type EmailTemplateUsage = typeof emailTemplateUsage.$inferSelect;

export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;

// Personal Notes Schema
export const personalNotes = pgTable("personal_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personalNotesRelations = relations(personalNotes, ({ one }) => ({
  user: one(users, {
    fields: [personalNotes.userId],
    references: [users.id],
  }),
}));

export const insertPersonalNoteSchema = createInsertSchema(personalNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PersonalNote = typeof personalNotes.$inferSelect;
export type InsertPersonalNote = z.infer<typeof insertPersonalNoteSchema>;

// Legacy template type for backward compatibility (will remove after migration)
export type Template = LiveReplyTemplate;
export type InsertTemplate = InsertLiveReplyTemplate;
