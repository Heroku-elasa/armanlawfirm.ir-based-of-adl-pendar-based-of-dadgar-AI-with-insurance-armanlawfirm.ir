import { aiAPI } from "../services/multi-api";
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { pool } from "./db";
import { runNewsSync } from "../services/newsScraper";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const claims = req.user.claims;
      if (!claims || !claims.sub) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      const userId = claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/orders', async (_req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const order = await storage.createOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.updateOrder(id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      await storage.deleteOrder(id);
      res.json({ message: "Order deleted" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.get('/api/posts', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const posts = await storage.getPosts(status);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      const post = await storage.getPostById(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.get('/api/posts/slug/:slug', async (req: Request, res: Response) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', async (req: Request, res: Response) => {
    try {
      const post = await storage.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put('/api/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      const post = await storage.updatePost(id, req.body);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.put('/api/posts/:id/publish', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      const post = await storage.updatePost(id, { status: 'published', publishedAt: new Date() });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error publishing post:", error);
      res.status(500).json({ message: "Failed to publish post" });
    }
  });

  app.delete('/api/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      await storage.deletePost(id);
      res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.get('/api/files', async (_req: Request, res: Response) => {
    try {
      const files = await storage.getFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post('/api/files/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`,
        relatedType: req.body.relatedType || null,
        relatedId: req.body.relatedId || null,
      };
      
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete('/api/files/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      const file = await storage.getFileById(id);
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      await storage.deleteFile(id);
      res.json({ message: "File deleted" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // WhatsApp Chatbot API Proxy with rate limiting
  const chatRateLimits = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_MAX = 20; // max requests per window
  const RATE_LIMIT_WINDOW = 60000; // 1 minute window
  
  app.post('/api/whatsapp-chat', async (req: Request, res: Response) => {
    try {
      const { message, session_id, provider } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Rate limiting based on session_id or IP
      const clientId = session_id || req.ip || 'anonymous';
      const now = Date.now();
      const rateData = chatRateLimits.get(clientId);
      
      if (rateData) {
        if (now < rateData.resetTime) {
          if (rateData.count >= RATE_LIMIT_MAX) {
            return res.status(429).json({ message: "Too many requests. Please wait a moment." });
          }
          rateData.count++;
        } else {
          chatRateLimits.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }
      } else {
        chatRateLimits.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
      
      // Clean up old rate limit entries periodically
      if (chatRateLimits.size > 1000) {
        for (const [key, value] of chatRateLimits.entries()) {
          if (now > value.resetTime) {
            chatRateLimits.delete(key);
          }
        }
      }

      // Use MultiAPIManager for chat with fallback
      const result = await aiAPI.chat(message, {
        systemPrompt: "You are a helpful legal assistant for Arman Law Firm (armanlawfirm.ir). Respond in Persian (Farsi) by default.",
        forceProvider: provider === 'auto' ? null : provider
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "All AI providers failed. Please try again later." });
      }

      console.log(`Response from ${result.provider} using model ${result.model}`);
      res.json({ 
        response: result.content,
        provider: result.provider,
        model: result.model
      });
    } catch (error) {
      console.error("WhatsApp chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // AI Providers status endpoint for dashboard
  app.get('/api/ai/providers', async (_req: Request, res: Response) => {
    try {
      res.json(aiAPI.getStatus());
    } catch (error) {
      console.error("Error fetching AI providers:", error);
      res.status(500).json({ message: "Failed to fetch AI providers" });
    }
  });

  app.get('/api/admin/stats', async (_req: Request, res: Response) => {
    try {
      const [orders, posts, files] = await Promise.all([
        storage.getOrders(),
        storage.getPosts(),
        storage.getFiles(),
      ]);
      
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const publishedPosts = posts.filter(p => p.status === 'published').length;
      
      res.json({
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        totalPosts: posts.length,
        publishedPosts,
        draftPosts: posts.length - publishedPosts,
        totalFiles: files.length,
        recentOrders: orders.slice(0, 5),
        recentPosts: posts.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.post('/api/admin/sync-news', async (_req: Request, res: Response) => {
    try {
      await runNewsSync();
      res.json({ message: 'News sync started successfully' });
    } catch (error) {
      console.error("Error syncing news:", error);
      res.status(500).json({ message: "Failed to sync news" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
