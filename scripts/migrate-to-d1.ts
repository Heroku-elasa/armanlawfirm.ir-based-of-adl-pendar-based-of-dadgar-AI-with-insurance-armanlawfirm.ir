/**
 * Migration Script: MySQL/PostgreSQL to Cloudflare D1
 * ====================================================
 * This script helps migrate data from existing databases to D1.
 * 
 * Usage:
 *   1. Export your MySQL data to JSON or run this script with DB connection
 *   2. npx tsx scripts/migrate-to-d1.ts
 *   3. Or use wrangler: npx wrangler d1 execute wb-data_bs_armanlawfirm --file=./migrations/data-import.sql
 * 
 * For production migrations:
 *   1. First run the schema migration: npx wrangler d1 execute wb-data_bs_armanlawfirm --file=./migrations/0001_init.sql
 *   2. Then export your data and run this script
 */

import fs from 'fs';
import path from 'path';

interface MigrationData {
  users?: any[];
  orders?: any[];
  posts?: any[];
  files?: any[];
}

function escapeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function convertTimestamp(date: Date | string | null): string {
  if (!date) return 'NULL';
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor(d.getTime() / 1000).toString();
}

function jsonToSQL(json: any): string {
  if (json === null || json === undefined) return "'{}'";
  return escapeString(JSON.stringify(json));
}

export function generateUserInserts(users: any[]): string {
  return users.map(user => `
INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, password_hash, created_at, updated_at)
VALUES (
  ${escapeString(user.id)},
  ${escapeString(user.email)},
  ${escapeString(user.firstName || user.first_name)},
  ${escapeString(user.lastName || user.last_name)},
  ${escapeString(user.profileImageUrl || user.profile_image_url)},
  ${escapeString(user.role || 'user')},
  ${escapeString(user.passwordHash || user.password_hash)},
  ${convertTimestamp(user.createdAt || user.created_at)},
  ${convertTimestamp(user.updatedAt || user.updated_at)}
);`).join('\n');
}

export function generateOrderInserts(orders: any[]): string {
  return orders.map(order => `
INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, service_type, description, status, priority, amount, notes, attachments, created_at, updated_at)
VALUES (
  ${order.id},
  ${escapeString(order.userId || order.user_id)},
  ${escapeString(order.customerName || order.customer_name)},
  ${escapeString(order.customerEmail || order.customer_email)},
  ${escapeString(order.customerPhone || order.customer_phone)},
  ${escapeString(order.serviceType || order.service_type)},
  ${escapeString(order.description)},
  ${escapeString(order.status || 'pending')},
  ${escapeString(order.priority || 'normal')},
  ${order.amount || 'NULL'},
  ${escapeString(order.notes)},
  ${jsonToSQL(order.attachments)},
  ${convertTimestamp(order.createdAt || order.created_at)},
  ${convertTimestamp(order.updatedAt || order.updated_at)}
);`).join('\n');
}

export function generatePostInserts(posts: any[]): string {
  return posts.map(post => `
INSERT INTO posts (id, author_id, title, slug, content, excerpt, featured_image, category, tags, status, published_at, created_at, updated_at)
VALUES (
  ${post.id},
  ${escapeString(post.authorId || post.author_id)},
  ${escapeString(post.title)},
  ${escapeString(post.slug)},
  ${escapeString(post.content)},
  ${escapeString(post.excerpt)},
  ${escapeString(post.featuredImage || post.featured_image)},
  ${escapeString(post.category)},
  ${jsonToSQL(post.tags)},
  ${escapeString(post.status || 'draft')},
  ${convertTimestamp(post.publishedAt || post.published_at)},
  ${convertTimestamp(post.createdAt || post.created_at)},
  ${convertTimestamp(post.updatedAt || post.updated_at)}
);`).join('\n');
}

export function generateFileInserts(files: any[]): string {
  return files.map(file => `
INSERT INTO files (id, uploader_id, filename, original_name, mime_type, size, path, url, related_type, related_id, created_at)
VALUES (
  ${file.id},
  ${escapeString(file.uploaderId || file.uploader_id)},
  ${escapeString(file.filename)},
  ${escapeString(file.originalName || file.original_name)},
  ${escapeString(file.mimeType || file.mime_type)},
  ${file.size || 'NULL'},
  ${escapeString(file.path)},
  ${escapeString(file.url)},
  ${escapeString(file.relatedType || file.related_type)},
  ${escapeString(file.relatedId || file.related_id)},
  ${convertTimestamp(file.createdAt || file.created_at)}
);`).join('\n');
}

export function generateMigrationSQL(data: MigrationData): string {
  let sql = `-- ============================================================
-- D1 Data Migration
-- Generated: ${new Date().toISOString()}
-- ============================================================
-- Run this with: npx wrangler d1 execute wb-data_bs_armanlawfirm --file=./migrations/data-import.sql
-- ============================================================

`;

  if (data.users?.length) {
    sql += `-- Users (${data.users.length} records)\n`;
    sql += generateUserInserts(data.users);
    sql += '\n\n';
  }

  if (data.orders?.length) {
    sql += `-- Orders (${data.orders.length} records)\n`;
    sql += generateOrderInserts(data.orders);
    sql += '\n\n';
  }

  if (data.posts?.length) {
    sql += `-- Posts (${data.posts.length} records)\n`;
    sql += generatePostInserts(data.posts);
    sql += '\n\n';
  }

  if (data.files?.length) {
    sql += `-- Files (${data.files.length} records)\n`;
    sql += generateFileInserts(data.files);
    sql += '\n\n';
  }

  return sql;
}

async function main() {
  console.log('='.repeat(60));
  console.log('D1 Migration Script');
  console.log('='.repeat(60));
  
  const dataFilePath = path.join(process.cwd(), 'migrations', 'source-data.json');
  
  if (fs.existsSync(dataFilePath)) {
    console.log('Found source-data.json, generating migration SQL...');
    const data: MigrationData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    const sql = generateMigrationSQL(data);
    
    const outputPath = path.join(process.cwd(), 'migrations', 'data-import.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`Migration SQL written to: ${outputPath}`);
    console.log('\nTo apply migration, run:');
    console.log('npx wrangler d1 execute wb-data_bs_armanlawfirm --file=./migrations/data-import.sql');
  } else {
    console.log('\nTo migrate data:');
    console.log('1. Create migrations/source-data.json with your data:');
    console.log(`   {
     "users": [...],
     "orders": [...],
     "posts": [...],
     "files": [...]
   }`);
    console.log('2. Run this script again: npx tsx scripts/migrate-to-d1.ts');
    console.log('\nOr export from your current database:');
    console.log('- MySQL: mysqldump --where="1" --no-create-info --compact database > data.sql');
    console.log('- PostgreSQL: pg_dump --data-only --format=plain database > data.sql');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Schema Migration Commands:');
  console.log('='.repeat(60));
  console.log('1. Apply schema:');
  console.log('   npx wrangler d1 execute wb-data_bs_armanlawfirm --file=./migrations/0001_init.sql');
  console.log('\n2. Apply data (after creating source-data.json):');
  console.log('   npx wrangler d1 execute wb-data_bs_armanlawfirm --file=./migrations/data-import.sql');
}

main().catch(console.error);
