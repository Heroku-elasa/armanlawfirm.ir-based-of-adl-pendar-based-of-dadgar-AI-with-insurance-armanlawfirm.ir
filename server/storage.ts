import {
  users,
  orders,
  posts,
  files,
  type User,
  type UpsertUser,
  type Order,
  type InsertOrder,
  type Post,
  type InsertPost,
  type File,
  type InsertFile,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
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
  deleteFile(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
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

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  async getPosts(status?: string): Promise<Post[]> {
    if (status) {
      return db.select().from(posts).where(eq(posts.status, status)).orderBy(desc(posts.createdAt));
    }
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(and(eq(posts.slug, slug), eq(posts.status, 'published')));
    return post;
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const slug = postData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const [post] = await db.insert(posts).values({ ...postData, slug }).returning();
    return post;
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    await db.delete(posts).where(eq(posts.id, id));
    return true;
  }

  async getFiles(): Promise<File[]> {
    return db.select().from(files).orderBy(desc(files.createdAt));
  }

  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(fileData).returning();
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    await db.delete(files).where(eq(files.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
