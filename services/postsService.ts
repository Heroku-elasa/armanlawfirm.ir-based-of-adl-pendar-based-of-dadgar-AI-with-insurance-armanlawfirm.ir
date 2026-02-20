import { supabase } from './supabaseClient';

export interface Post {
  id?: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  author_id?: string;
  author_email?: string;
  created_at?: string;
  updated_at?: string;
  slug?: string;
  featured_image?: string;
  category?: string;
}

export const createPost = async (post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post | null> => {
  const slug = post.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  const { data, error } = await supabase
    .from('posts')
    .insert([{ ...post, slug, updated_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    return null;
  }
  return data;
};

export const getPosts = async (status?: 'draft' | 'published'): Promise<Post[]> => {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  return data || [];
};

export const getPostById = async (id: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }
  return data;
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }
  return data;
};

export const updatePost = async (id: string, updates: Partial<Post>): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    return null;
  }
  return data;
};

export const deletePost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting post:', error);
    return false;
  }
  return true;
};

export const publishPost = async (id: string): Promise<Post | null> => {
  return updatePost(id, { status: 'published' });
};

export const unpublishPost = async (id: string): Promise<Post | null> => {
  return updatePost(id, { status: 'draft' });
};

export const publishToTelegram = async (postId: string): Promise<boolean> => {
  try {
    const post = await getPostById(postId);
    if (!post) return false;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram bot token or chat ID not configured');
      return false;
    }

    const message = `*${post.title}*\n\n${post.content.substring(0, 500)}...\n\n#حقوقی #آرمان`;
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error publishing to Telegram:', error);
    return false;
  }
};
