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

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "agent"]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked", "banned"]);
export const announcementPriorityEnum = pgEnum("announcement_priority", ["low", "medium", "high", "urgent"]);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("agent").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
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
  // Legacy content field for database compatibility
  content: text("content"),
  // New bilingual fields (optional for backward compatibility)
  contentEn: text("content_en"),
  contentAr: text("content_ar"),
  category: varchar("category").notNull(),
  genre: varchar("genre").notNull(),
  concernedTeam: varchar("concerned_team").notNull(),

  warningNote: text("warning_note"),
  variables: text("variables").array(),
  stageOrder: integer("stage_order").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(), // Maps to Supabase record
  lastSyncedAt: timestamp("last_synced_at"),
});

export const liveReplyUsage = pgTable("live_reply_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => liveReplyTemplates.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const emailTemplateUsage = pgTable("email_template_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => emailTemplates.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const siteContent = pgTable("site_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key").unique().notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(), // Maps to Supabase record
  lastSyncedAt: timestamp("last_synced_at"),
});

// FAQ entries for user help and information
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").default("general").notNull(),
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(), // Maps to Supabase record
  lastSyncedAt: timestamp("last_synced_at"),
});

// Global announcements table for admin broadcast messages
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  content: text("content").notNull(), // Rich HTML/Markdown content
  isActive: boolean("is_active").default(false).notNull(),
  backgroundColor: varchar("background_color").default("#3b82f6").notNull(),
  textColor: varchar("text_color").default("#ffffff").notNull(),
  borderColor: varchar("border_color").default("#1d4ed8").notNull(),
  priority: announcementPriorityEnum("priority").default("medium").notNull(),
  version: integer("version").default(1).notNull(), // Version for re-announce functionality
  lastAnnouncedAt: timestamp("last_announced_at").defaultNow(), // Track when last announced
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// User announcement acknowledgments to track who has seen announcements
export const userAnnouncementAcks = pgTable("user_announcement_acks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  liveReplyUsage: many(liveReplyUsage),
  emailTemplateUsage: many(emailTemplateUsage),
  announcementAcks: many(userAnnouncementAcks),
}));

export const liveReplyTemplatesRelations = relations(liveReplyTemplates, ({ many }) => ({
  usage: many(liveReplyUsage),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ many }) => ({
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

export const announcementsRelations = relations(announcements, ({ many }) => ({
  acknowledgments: many(userAnnouncementAcks),
}));

export const userAnnouncementAcksRelations = relations(userAnnouncementAcks, ({ one }) => ({
  user: one(users, {
    fields: [userAnnouncementAcks.userId],
    references: [users.id],
  }),
  announcement: one(announcements, {
    fields: [userAnnouncementAcks.announcementId],
    references: [announcements.id],
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
}).extend({
  // Custom validation: at least one content field must be provided
  contentEn: z.string().optional(),
  contentAr: z.string().optional(),
  content: z.string().optional(),
}).refine((data) => {
  // At least one content field must be provided
  return data.contentEn || data.contentAr || data.content;
}, {
  message: "At least one content field (contentEn, contentAr, or content) must be provided",
  path: ["content"],
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

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  version: true,
  lastAnnouncedAt: true,
  createdAt: true,
  updatedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

export const insertUserAnnouncementAckSchema = createInsertSchema(userAnnouncementAcks).omit({
  id: true,
  acknowledgedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
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

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export type InsertUserAnnouncementAck = z.infer<typeof insertUserAnnouncementAckSchema>;
export type UserAnnouncementAck = typeof userAnnouncementAcks.$inferSelect;

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

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

// Template Variables Schema
export const templateVariables = pgTable("template_variables", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").unique().notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  example: text("example").notNull(),
  defaultValue: text("default_value"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// Template Variable Categories Schema
export const templateVariableCategories = pgTable("template_variable_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").unique().notNull(),
  displayName: varchar("display_name").notNull(),
  color: varchar("color").default("#3b82f6").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// Color Management Schema
export const colorSettings = pgTable("color_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type").notNull(), // 'genre' or 'category'
  entityName: varchar("entity_name").notNull(),
  backgroundColor: varchar("background_color").notNull(),
  textColor: varchar("text_color").notNull(),
  borderColor: varchar("border_color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// Relations
// Relations removed - templateVariables no longer has createdBy field

// Relations removed - templateVariableCategories no longer has createdBy field

// Relations removed - colorSettings no longer has createdBy field

// Insert schemas
export const insertTemplateVariableSchema = createInsertSchema(templateVariables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

export const insertTemplateVariableCategorySchema = createInsertSchema(templateVariableCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

export const insertColorSettingSchema = createInsertSchema(colorSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

// Types
export type TemplateVariable = typeof templateVariables.$inferSelect;
export type InsertTemplateVariable = z.infer<typeof insertTemplateVariableSchema>;

export type TemplateVariableCategory = typeof templateVariableCategories.$inferSelect;
export type InsertTemplateVariableCategory = z.infer<typeof insertTemplateVariableCategorySchema>;

export type ColorSetting = typeof colorSettings.$inferSelect;
export type InsertColorSetting = z.infer<typeof insertColorSettingSchema>;

// User ordering preferences for drag-and-drop functionality
export const userOrderingPreferences = pgTable("user_ordering_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: varchar("content_type", { length: 50 }).notNull(), // 'live_reply_templates', 'email_templates', 'faqs', etc.
  itemId: uuid("item_id").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_ordering_user_content").on(table.userId, table.contentType),
  index("idx_user_ordering_display_order").on(table.displayOrder),
]);

// Create insert schema for user ordering preferences
export const insertUserOrderingPreferenceSchema = createInsertSchema(userOrderingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export user ordering types
export type UserOrderingPreference = typeof userOrderingPreferences.$inferSelect;
export type InsertUserOrderingPreference = z.infer<typeof insertUserOrderingPreferenceSchema>;

// Legacy template type for backward compatibility (will remove after migration)
export type Template = LiveReplyTemplate;
export type InsertTemplate = InsertLiveReplyTemplate;
