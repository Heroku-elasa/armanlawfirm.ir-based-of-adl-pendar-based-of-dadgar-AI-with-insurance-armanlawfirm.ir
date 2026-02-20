import { sql } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => [index("idx_session_expire").on(table.expire)],
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("user"),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  serviceType: text("service_type").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  priority: text("priority").default("normal"),
  amount: integer("amount"),
  notes: text("notes"),
  attachments: text("attachments", { mode: "json" }).$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_orders_user_id").on(table.userId),
  index("idx_orders_status").on(table.status),
]);

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("author_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  category: text("category"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  status: text("status").default("draft"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_posts_slug").on(table.slug),
  index("idx_posts_status").on(table.status),
  index("idx_posts_author").on(table.authorId),
]);

export const files = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploaderId: text("uploader_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  path: text("path").notNull(),
  url: text("url"),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  index("idx_files_uploader").on(table.uploaderId),
]);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export type InsertFile = typeof files.$inferInsert;
export type File = typeof files.$inferSelect;
