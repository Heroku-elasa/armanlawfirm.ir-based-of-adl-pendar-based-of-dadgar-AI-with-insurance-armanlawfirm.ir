-- ============================================================
-- D1 Database Schema for Arman Law Firm
-- ============================================================
-- Compatible with Cloudflare D1 (SQLite)
-- ============================================================

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT DEFAULT 'user',
    password_hash TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    service_type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    amount INTEGER,
    notes TEXT,
    attachments TEXT DEFAULT '[]',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    category TEXT,
    tags TEXT DEFAULT '[]',
    status TEXT DEFAULT 'draft',
    published_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uploader_id TEXT REFERENCES users(id),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    path TEXT NOT NULL,
    url TEXT,
    related_type TEXT,
    related_id TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploader_id);

-- ============================================================
-- Sample data for testing (optional)
-- ============================================================
-- INSERT INTO users (id, email, first_name, last_name, role) 
-- VALUES ('admin-001', 'admin@armanlawfirm.ir', 'Admin', 'User', 'admin');
