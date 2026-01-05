import { D1Storage, createD1Storage } from '../../../server/d1-storage';

interface Env {
  DB: D1Database;
}

interface Context {
  env: Env;
  request: Request;
}

function sanitizeUser(user: any) {
  if (!user) return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const route = (params.route as string[])?.join('/') || '';
  
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'D1 database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const storage = createD1Storage(env.DB);
  const method = request.method;

  try {
    switch (true) {
      case route === 'health' && method === 'GET':
        return jsonResponse({ status: 'ok', database: 'd1', timestamp: new Date().toISOString() });

      case route === 'users' && method === 'GET':
        const userId = url.searchParams.get('id');
        if (userId) {
          const user = await storage.getUser(userId);
          return user ? jsonResponse(sanitizeUser(user)) : jsonResponse({ error: 'User not found' }, 404);
        }
        return jsonResponse({ error: 'User ID required' }, 400);

      case route === 'users' && method === 'POST':
        const userData = await request.json();
        const newUser = await storage.upsertUser(userData);
        return jsonResponse(sanitizeUser(newUser), 201);

      case route === 'orders' && method === 'GET':
        const orderId = url.searchParams.get('id');
        if (orderId) {
          const order = await storage.getOrderById(parseInt(orderId));
          return order ? jsonResponse(order) : jsonResponse({ error: 'Order not found' }, 404);
        }
        const orders = await storage.getOrders();
        return jsonResponse(orders);

      case route === 'orders' && method === 'POST':
        const orderData = await request.json();
        const newOrder = await storage.createOrder(orderData);
        return jsonResponse(newOrder, 201);

      case route.startsWith('orders/') && method === 'PUT':
        const updateOrderId = parseInt(route.split('/')[1]);
        const orderUpdates = await request.json();
        const updatedOrder = await storage.updateOrder(updateOrderId, orderUpdates);
        return updatedOrder ? jsonResponse(updatedOrder) : jsonResponse({ error: 'Order not found' }, 404);

      case route.startsWith('orders/') && method === 'DELETE':
        const deleteOrderId = parseInt(route.split('/')[1]);
        await storage.deleteOrder(deleteOrderId);
        return jsonResponse({ message: 'Order deleted' });

      case route === 'posts' && method === 'GET':
        const postStatus = url.searchParams.get('status') || undefined;
        const posts = await storage.getPosts(postStatus);
        return jsonResponse(posts);

      case route.startsWith('posts/slug/') && method === 'GET':
        const slug = route.replace('posts/slug/', '');
        const postBySlug = await storage.getPostBySlug(slug);
        return postBySlug ? jsonResponse(postBySlug) : jsonResponse({ error: 'Post not found' }, 404);

      case route.startsWith('posts/') && method === 'GET':
        const getPostId = parseInt(route.split('/')[1]);
        const post = await storage.getPostById(getPostId);
        return post ? jsonResponse(post) : jsonResponse({ error: 'Post not found' }, 404);

      case route === 'posts' && method === 'POST':
        const postData = await request.json();
        const newPost = await storage.createPost(postData);
        return jsonResponse(newPost, 201);

      case route.startsWith('posts/') && route.endsWith('/publish') && method === 'PUT':
        const publishPostId = parseInt(route.split('/')[1]);
        const publishedPost = await storage.updatePost(publishPostId, { status: 'published', publishedAt: new Date() });
        return publishedPost ? jsonResponse(publishedPost) : jsonResponse({ error: 'Post not found' }, 404);

      case route.startsWith('posts/') && method === 'PUT':
        const updatePostId = parseInt(route.split('/')[1]);
        const postUpdates = await request.json();
        const updatedPost = await storage.updatePost(updatePostId, postUpdates);
        return updatedPost ? jsonResponse(updatedPost) : jsonResponse({ error: 'Post not found' }, 404);

      case route.startsWith('posts/') && method === 'DELETE':
        const deletePostId = parseInt(route.split('/')[1]);
        await storage.deletePost(deletePostId);
        return jsonResponse({ message: 'Post deleted' });

      case route === 'files' && method === 'GET':
        const files = await storage.getFiles();
        return jsonResponse(files);

      case route === 'files' && method === 'POST':
        const fileData = await request.json();
        const newFile = await storage.createFile(fileData);
        return jsonResponse(newFile, 201);

      case route.startsWith('files/') && method === 'PUT':
        const updateFileId = parseInt(route.split('/')[1]);
        const fileUpdates = await request.json();
        const updatedFile = await storage.updateFile(updateFileId, fileUpdates);
        return updatedFile ? jsonResponse(updatedFile) : jsonResponse({ error: 'File not found' }, 404);

      case route.startsWith('files/') && method === 'DELETE':
        const deleteFileId = parseInt(route.split('/')[1]);
        await storage.deleteFile(deleteFileId);
        return jsonResponse({ message: 'File deleted' });

      case route === 'stats' && method === 'GET':
        const [allOrders, allPosts, allFiles] = await Promise.all([
          storage.getOrders(),
          storage.getPosts(),
          storage.getFiles(),
        ]);
        
        const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
        const completedOrders = allOrders.filter(o => o.status === 'completed').length;
        const publishedPosts = allPosts.filter(p => p.status === 'published').length;
        
        return jsonResponse({
          totalOrders: allOrders.length,
          pendingOrders,
          completedOrders,
          totalPosts: allPosts.length,
          publishedPosts,
          draftPosts: allPosts.length - publishedPosts,
          totalFiles: allFiles.length,
          recentOrders: allOrders.slice(0, 5),
          recentPosts: allPosts.slice(0, 5),
        });

      default:
        return jsonResponse({ error: 'Route not found', route }, 404);
    }
  } catch (error) {
    console.error('D1 API Error:', error);
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
