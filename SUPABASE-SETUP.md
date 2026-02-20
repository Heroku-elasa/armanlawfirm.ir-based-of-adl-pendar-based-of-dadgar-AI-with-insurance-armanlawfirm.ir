# تنظیمات Supabase

## جدول Posts

در Supabase Dashboard برو به **SQL Editor** و این کد رو اجرا کن:

```sql
-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID,
  author_email TEXT,
  slug TEXT UNIQUE,
  featured_image TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published posts
CREATE POLICY "Anyone can read published posts" ON posts
  FOR SELECT USING (status = 'published');

-- Allow authenticated users to create posts
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (author_id = auth.uid());

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (author_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
```

---

## تنظیم Google OAuth

### قدم ۱: Google Cloud Console

1. برو به [console.cloud.google.com](https://console.cloud.google.com)
2. یه پروژه جدید بساز یا انتخاب کن
3. برو به **APIs & Services** > **Credentials**
4. روی **Create Credentials** > **OAuth Client ID** کلیک کن
5. نوع: **Web application**
6. نام: `Arman Law Firm`
7. **Authorized redirect URIs** اضافه کن:
   ```
   https://vemzvvveaseghlhjmnqy.supabase.co/auth/v1/callback
   ```
8. Client ID و Client Secret رو کپی کن

### قدم ۲: Supabase Dashboard

1. برو به پروژه Supabase
2. **Authentication** > **Providers**
3. **Google** رو پیدا کن و فعال کن
4. Client ID و Client Secret رو وارد کن
5. **Save** کن

### قدم ۳: Cloudflare Environment

این متغیرها رو اضافه کن:

| متغیر | مقدار |
|-------|-------|
| `SUPABASE_URL` | `https://vemzvvveaseghlhjmnqy.supabase.co` |
| `SUPABASE_ANON_KEY` | کلید Supabase |

---

## Site URL در Supabase

1. برو به **Authentication** > **URL Configuration**
2. **Site URL** رو ست کن:
   - برای توسعه: آدرس Replit
   - برای پروداکشن: `https://armanlawfirm.pages.dev`

3. **Redirect URLs** اضافه کن:
   ```
   https://armanlawfirm.pages.dev
   https://armanlawfirm.pages.dev/**
   https://*.replit.dev
   ```

---

## تست

بعد از تنظیمات:
1. صفحه رو رفرش کن
2. روی "ورود با Google" کلیک کن
3. باید به Google هدایت بشی
4. بعد لاگین، برگردی به سایت
