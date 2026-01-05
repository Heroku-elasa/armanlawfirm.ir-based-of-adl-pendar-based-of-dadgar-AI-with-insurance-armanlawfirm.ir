/// <reference types="@cloudflare/workers-types" />
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, desc, and } from "drizzle-orm";
import * as schema from "../shared/d1-schema";
import type { User, UpsertUser, Order, InsertOrder, Post, InsertPost, File, InsertFile } from "../shared/d1-schema";

export interface ID1Storage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  getPosts(status?: string): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  getFiles(): Promise<File[]>;
  getFileById(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

export class D1Storage implements ID1Storage {
  private db: DrizzleD1Database<typeof schema>;

  constructor(d1Database: D1Database) {
    this.db = drizzle(d1Database, { schema });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? await this.getUser(userData.id) : null;
    
    if (existingUser) {
      const [user] = await this.db
        .update(schema.users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userData.id!))
        .returning();
      return user;
    } else {
      const [user] = await this.db.insert(schema.users).values(userData).returning();
      return user;
    }
  }

  async getOrders(): Promise<Order[]> {
    return this.db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await this.db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await this.db.insert(schema.orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await this.db
      .update(schema.orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: number): Promise<boolean> {
    await this.db.delete(schema.orders).where(eq(schema.orders.id, id));
    return true;
  }

  async getPosts(status?: string): Promise<Post[]> {
    if (status) {
      return this.db.select().from(schema.posts).where(eq(schema.posts.status, status)).orderBy(desc(schema.posts.createdAt));
    }
    return this.db.select().from(schema.posts).orderBy(desc(schema.posts.createdAt));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await this.db.select().from(schema.posts).where(eq(schema.posts.id, id));
    return post;
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const [post] = await this.db.select().from(schema.posts).where(and(eq(schema.posts.slug, slug), eq(schema.posts.status, 'published')));
    return post;
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const slug = postData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const [post] = await this.db.insert(schema.posts).values({ ...postData, slug }).returning();
    return post;
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await this.db
      .update(schema.posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    await this.db.delete(schema.posts).where(eq(schema.posts.id, id));
    return true;
  }

  async getFiles(): Promise<File[]> {
    return this.db.select().from(schema.files).orderBy(desc(schema.files.createdAt));
  }

  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await this.db.select().from(schema.files).where(eq(schema.files.id, id));
    return file;
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await this.db.insert(schema.files).values(fileData).returning();
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const [file] = await this.db
      .update(schema.files)
      .set(updates)
      .where(eq(schema.files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    await this.db.delete(schema.files).where(eq(schema.files.id, id));
    return true;
  }
}

export function createD1Storage(db: D1Database): D1Storage {
  return new D1Storage(db);
}
