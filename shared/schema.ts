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

// Live reply template groups for organizing templates
export const liveReplyTemplateGroups = pgTable("live_reply_template_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
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
  groupId: uuid("group_id").references(() => liveReplyTemplateGroups.id),
  stageOrder: integer("stage_order").default(1).notNull(),
  groupOrder: integer("group_order").default(0).notNull(), // Order within the group
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
  icon: varchar("icon").default("HelpCircle").notNull(), // Lucide icon name
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
  userId: text("user_id").references(() => users.id).notNull(),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// User FAQ acknowledgments to track who has seen FAQs
export const userFaqAcks = pgTable("user_faq_acks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  faqId: uuid("faq_id").references(() => faqs.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  // Supabase sync tracking
  supabaseId: uuid("supabase_id").unique(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// New persistent notification tables for Supabase integration
// FAQ Acknowledgments - replaces localStorage for FAQ disco states
export const faqAcknowledgments = pgTable("faq_acknowledgments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  faqId: uuid("faq_id").references(() => faqs.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure one acknowledgment per user per FAQ
  index("unique_faq_ack").on(table.userId, table.faqId)
]);

// Announcement Acknowledgments - replaces localStorage for "Got it" states  
export const announcementAcknowledgments = pgTable("announcement_acknowledgments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull(),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow(),
  announcementVersion: integer("announcement_version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure one acknowledgment per user per announcement version
  index("unique_announcement_ack").on(table.userId, table.announcementId, table.announcementVersion)
]);

// User Notification Preferences for future customization
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id).notNull().unique(),
  disableFaqNotifications: boolean("disable_faq_notifications").default(false).notNull(),
  disableAnnouncementNotifications: boolean("disable_announcement_notifications").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  liveReplyUsage: many(liveReplyUsage),
  emailTemplateUsage: many(emailTemplateUsage),
  announcementAcks: many(userAnnouncementAcks),
  faqAcks: many(userFaqAcks),
}));

export const liveReplyTemplateGroupsRelations = relations(liveReplyTemplateGroups, ({ many }) => ({
  templates: many(liveReplyTemplates),
}));

export const liveReplyTemplatesRelations = relations(liveReplyTemplates, ({ many, one }) => ({
  usage: many(liveReplyUsage),
  group: one(liveReplyTemplateGroups, {
    fields: [liveReplyTemplates.groupId],
    references: [liveReplyTemplateGroups.id],
  }),
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

export const faqsRelations = relations(faqs, ({ many }) => ({
  userAcks: many(userFaqAcks),
}));

export const userFaqAcksRelations = relations(userFaqAcks, ({ one }) => ({
  user: one(users, {
    fields: [userFaqAcks.userId],
    references: [users.id],
  }),
  faq: one(faqs, {
    fields: [userFaqAcks.faqId],
    references: [faqs.id],
  }),
}));

// New persistent notification relations
export const faqAcknowledgmentsRelations = relations(faqAcknowledgments, ({ one }) => ({
  user: one(users, {
    fields: [faqAcknowledgments.userId],
    references: [users.id],
  }),
  faq: one(faqs, {
    fields: [faqAcknowledgments.faqId],
    references: [faqs.id],
  }),
}));

export const announcementAcknowledgmentsRelations = relations(announcementAcknowledgments, ({ one }) => ({
  user: one(users, {
    fields: [announcementAcknowledgments.userId],
    references: [users.id],
  }),
  announcement: one(announcements, {
    fields: [announcementAcknowledgments.announcementId],
    references: [announcements.id],
  }),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationPreferences.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveReplyTemplateGroupSchema = createInsertSchema(liveReplyTemplateGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
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

export const insertUserFaqAckSchema = createInsertSchema(userFaqAcks).omit({
  id: true,
  acknowledgedAt: true,
  supabaseId: true,
  lastSyncedAt: true,
});

// New persistent notification schemas
export const insertFaqAcknowledgmentSchema = createInsertSchema(faqAcknowledgments).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementAcknowledgmentSchema = createInsertSchema(announcementAcknowledgments).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertLiveReplyTemplateGroup = z.infer<typeof insertLiveReplyTemplateGroupSchema>;
export type LiveReplyTemplateGroup = typeof liveReplyTemplateGroups.$inferSelect;

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

export type InsertUserFaqAck = z.infer<typeof insertUserFaqAckSchema>;
export type UserFaqAck = typeof userFaqAcks.$inferSelect;

// New persistent notification types
export type InsertFaqAcknowledgment = z.infer<typeof insertFaqAcknowledgmentSchema>;
export type FaqAcknowledgment = typeof faqAcknowledgments.$inferSelect;

export type InsertAnnouncementAcknowledgment = z.infer<typeof insertAnnouncementAcknowledgmentSchema>;
export type AnnouncementAcknowledgment = typeof announcementAcknowledgments.$inferSelect;

export type InsertUserNotificationPreferences = z.infer<typeof insertUserNotificationPreferencesSchema>;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;

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
  order: integer("order").default(0).notNull(), // For drag-and-drop ordering
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
