import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  serviceType: varchar("service_type").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"),
  priority: varchar("priority").default("normal"),
  amount: integer("amount"),
  notes: text("notes"),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").references(() => users.id),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  featuredImage: varchar("featured_image"),
  category: varchar("category"),
  tags: jsonb("tags").default([]),
  status: varchar("status").default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  uploaderId: varchar("uploader_id").references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type"),
  size: integer("size"),
  path: varchar("path").notNull(),
  url: varchar("url"),
  relatedType: varchar("related_type"),
  relatedId: varchar("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export type InsertFile = typeof files.$inferInsert;
export type File = typeof files.$inferSelect;

export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  label: varchar("label"),
  enabled: boolean("enabled").default(true),
  priority: integer("priority").default(0),
  endpoint: varchar("endpoint"),
  model: varchar("model"),
  apiKeyEnvVar: varchar("api_key_env_var"),
  requestsPerMinute: integer("requests_per_minute"),
  requestsPerDay: integer("requests_per_day"),
  description: text("description"),
  getKeyUrl: text("get_key_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiUsage = pgTable("ai_usage", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => aiProviders.id),
  date: varchar("date").notNull(),
  requestsCount: integer("requests_count").default(0),
  tokensCount: integer("tokens_count").default(0),
  errorsCount: integer("errors_count").default(0),
  avgLatency: integer("avg_latency"),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

export const aiHealthLogs = pgTable("ai_health_logs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider").notNull(),
  status: varchar("status").notNull(),
  latency: integer("latency"),
  error: text("error"),
  timestamp: timestamp("timestamp").defaultNow(),
});
