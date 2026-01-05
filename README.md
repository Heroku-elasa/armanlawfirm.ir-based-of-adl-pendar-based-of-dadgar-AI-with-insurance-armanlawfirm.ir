# Arman Law Firm - AI Legal, Insurance & Psychology Platform

A comprehensive AI-powered legal, insurance, and psychological analysis assistant for the Iranian market.

---

## Quick Start

```bash
cd saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of
npm install
npm run dev
```

The app runs on:
- Frontend: http://localhost:5000
- Backend: http://localhost:3001

---

## Architecture Overview

```
Frontend (Static)          Backend (Node.js)           Database
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Cloudflare      │ ───► │  Render.com      │ ───► │  Supabase        │
│  Pages           │ API  │  Railway         │      │  (PostgreSQL)    │
│  (FREE)          │      │  Fly.io          │      │  (FREE Tier)     │
│                  │      │  (FREE)          │      │                  │
│  React + Vite    │      │  Express.js      │      │  500MB Storage   │
│  Static Build    │      │  Full Node.js    │      │  50K writes/mo   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## Free Backend Hosting Comparison

| Service | Free Tier | Best For | Sleep Mode | RAM | Limits |
|---------|-----------|----------|------------|-----|--------|
| **Render** | Yes | Full Node.js | 15 min idle | 512MB | 750 hrs/mo |
| **Railway** | $5 credit | Quick deploy | No | 512MB | Credit-based |
| **Fly.io** | Yes | Global edge | No | 256MB | 3 shared VMs |
| **Koyeb** | Yes | Containers | 5 min idle | 256MB | 1 instance |
| **Cyclic** | Yes | Serverless | No | 512MB | 100K requests |
| **Vercel** | Yes | Serverless only | N/A | 1024MB | 100GB bandwidth |
| **Netlify** | Yes | Serverless only | N/A | 1024MB | 125K functions |

### Recommended: Render.com

Why Render is best for this app:
- Full Express.js/Node.js support
- WebSocket support for real-time features
- Easy environment variables
- Free PostgreSQL add-on
- CORS configuration support
- Simple GitHub integration

---

## Deployment Guide

### Part 1: Backend on Render.com

#### Step 1: Create Account
Go to [render.com](https://render.com) and sign up

#### Step 2: New Web Service

| Setting | Value |
|---------|-------|
| Name | `armanlawfirm-api` |
| Environment | `Node` |
| Branch | `main` |
| Root Directory | `saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

#### Step 3: Environment Variables

| Key | Value | Required |
|-----|-------|----------|
| `GEMINI_API_KEY` | Your Google AI key | Yes |
| `NODE_ENV` | `production` | Yes |
| `SUPABASE_URL` | Your Supabase URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase key | Yes |

**Important**: Do NOT set PORT variable (Render assigns automatically)

#### Step 4: Deploy
Click "Create Web Service"

Your API URL: `https://armanlawfirm-api.onrender.com`

---

### Part 2: Frontend on Cloudflare Pages

#### Step 1: Create Project
Go to [pages.cloudflare.com](https://pages.cloudflare.com)

#### Step 2: Build Settings

| Setting | Value |
|---------|-------|
| Project name | `armanlawfirm` |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of` |
| Build command | `npm install && npm run build` |
| Build output | `dist` |

#### Step 3: Environment Variables

| Variable | Value | Type |
|----------|-------|------|
| `VITE_API_URL` | `https://armanlawfirm-api.onrender.com` | Plain |
| `VITE_GEMINI_API_KEY` | Your Gemini API key | Secret |
| `GEMINI_API_KEY` | Your Gemini API key | Secret |
| `NODE_VERSION` | `20` | Plain |

#### Step 4: Deploy
Click "Save and Deploy"

Your site URL: `https://armanlawfirm.pages.dev`

---

## API Keys Reference

### Getting Your API Keys

| Service | Key Name | Get From |
|---------|----------|----------|
| Google AI | `GEMINI_API_KEY` | [ai.google.dev](https://ai.google.dev) |
| Supabase | `SUPABASE_URL` | Your Supabase Dashboard > Settings > API |
| Supabase | `SUPABASE_ANON_KEY` | Your Supabase Dashboard > Settings > API |

### Environment Variables Summary

#### Cloudflare (Frontend)

| Variable | Description | Type |
|----------|-------------|------|
| `VITE_API_URL` | Backend URL on Render | Plain |
| `VITE_GEMINI_API_KEY` | For client-side AI | Secret |
| `NODE_VERSION` | Node.js version (20) | Plain |

#### Render (Backend)

| Variable | Description | Type |
|----------|-------------|------|
| `GEMINI_API_KEY` | Google AI key | Secret |
| `NODE_ENV` | Set to `production` | Plain |
| `SUPABASE_URL` | Supabase project URL | Secret |
| `SUPABASE_ANON_KEY` | Supabase anon key | Secret |

---

## Database Setup (Supabase)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and anon key

### Database Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved lawyers
CREATE TABLE saved_lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lawyer_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enable Row Level Security

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
```

### Free Tier Limits

| Resource | Limit |
|----------|-------|
| Database Storage | 500 MB |
| Monthly Writes | 50,000 |
| Monthly Reads | 500,000 |
| File Storage | 1 GB |
| Bandwidth | 2 GB |

---

## WordPress-Like Features

### What This App Has

| Feature | Status | Description |
|---------|--------|-------------|
| Content Creation | Available | AI-assisted legal document drafting |
| Media Upload | Available | Document/image uploads with preview |
| Theme System | Available | 7 color themes (AI Lawyer, Legal, etc.) |
| RTL Support | Available | Full Farsi/Persian support |
| User Accounts | Available | Login with Replit Auth or Supabase |
| Dark/Light Mode | Available | Toggle between themes |

### What This App Does NOT Have

| Feature | Status | Alternative |
|---------|--------|-------------|
| Visual Page Editor | Not built | Use AI drafting instead |
| Plugin System | Not built | Features are built-in |
| Multi-user Roles | Partial | Basic user/admin only |
| SEO Dashboard | Not built | SEO is pre-configured |
| Media Library | Partial | Basic uploads only |
| Post/Page Management | Not built | Documents are user-specific |

### Conclusion

This app is **NOT a WordPress replacement**. It's an AI-powered legal assistant with specific features.

For full CMS capabilities, consider these alternatives:

| CMS | Type | Best For | Free Tier |
|-----|------|----------|-----------|
| **Strapi** | Headless | API-first apps | Yes |
| **Directus** | Open Source | Visual management | Yes |
| **Payload** | TypeScript | Modern Node apps | Yes |
| **Ghost** | Blog-focused | Publishing | Yes |
| **Contentful** | Headless | Enterprise | Yes (limited) |

---

## Features List

### Legal Services
- Legal document drafting (petitions, contracts, complaints)
- Lawyer and notary finder with interactive map
- Contract analysis with AI
- Court assistant with live simulation
- Blood money (Diyeh) calculator
- Evidence analysis

### Psychology Analysis
- Psychological case analysis
- Forensic psychology assessments
- Criminal behavior profiling
- Witness statement analysis
- Personality assessment for cases

### Insurance Services
- Policy analysis and comparison
- Claims drafting assistance
- Coverage recommendations
- Insurance dispute guidance

### Corporate Services
- Company name generator
- Articles of association drafting
- Corporate document templates
- Business registration guidance

### Additional Features
- Resume analysis
- News summarization with legal context
- Social media content creation
- Booking system for consultations
- Donation system
- Multi-language support (Farsi/English)

---

## Project Structure

```
saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of/
├── index.html          # Main HTML with SEO meta tags
├── index.tsx           # React entry point
├── App.tsx             # Main React component
├── components/         # React UI components
├── services/           # API services (Gemini, Supabase)
├── server/             # Express.js backend
│   └── index.ts        # Server entry point
├── lib/                # Utility libraries
├── hooks/              # React custom hooks
├── shared/             # Shared types and schemas
├── public/             # Static assets
│   ├── robots.txt      # SEO robots file
│   ├── sitemap.xml     # SEO sitemap
│   └── logo.png        # Logo
├── dist/               # Build output (generated)
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── DEPLOYMENT.md       # Detailed deployment guide
└── README.md           # This file
```

---

## Troubleshooting

### Render Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Port already in use | PORT env set | Remove PORT variable |
| tsx not found | Missing dependency | Check package.json |
| Python error | Wrong language | Set to Node, not Python |
| Build timeout | Large modules | Add node_modules to .gitignore |

### Cloudflare Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Build fails | Missing dependency | Run `npm install` locally first |
| API calls fail | Wrong URL | Check VITE_API_URL |
| CORS error | Backend config | Update CORS on Render |
| Login not working | No backend | Need Render backend |

### Database Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Connection refused | Wrong URL | Check SUPABASE_URL |
| Permission denied | RLS policies | Check row-level security |
| Quota exceeded | Free tier limit | Upgrade or optimize queries |

---

## Security Checklist

- [ ] Never commit API keys to Git
- [ ] Use "Secret" type for sensitive variables
- [ ] Enable HTTPS (automatic on Cloudflare/Render)
- [ ] Rotate API keys if exposed
- [ ] Review CORS settings
- [ ] Enable RLS on Supabase tables
- [ ] Use environment variables for all secrets

---

## Support

- Render logs: Dashboard > Your Service > Logs
- Cloudflare logs: Dashboard > Your Project > Functions
- Supabase logs: Dashboard > Logs > Edge Functions

---

## License

MIT License - Arman Law Firm
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
# replit-V-For-SmartWaste-AI---Intelligent-Waste-Management-number-2
