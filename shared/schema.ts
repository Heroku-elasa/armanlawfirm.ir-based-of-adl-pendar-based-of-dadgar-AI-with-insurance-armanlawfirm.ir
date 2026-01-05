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
