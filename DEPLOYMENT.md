# Deployment Guide

Complete deployment instructions for Arman Law Firm application.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │   CLOUDFLARE PAGES  │      │      RENDER.COM         │  │
│  │   (Frontend Only)   │ ───► │   (Node.js Backend)     │  │
│  │                     │ API  │                         │  │
│  │   React + Vite      │ Calls│   Express.js Server     │  │
│  │   Static Files      │      │   API Endpoints         │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Platform | Supports Frontend | Supports Backend | Recommended For |
|----------|-------------------|------------------|-----------------|
| Render | Yes | Yes | Backend API |
| Cloudflare Pages | Yes | No | Frontend Static |
| Vercel | Yes | Partial | Frontend Only |
| Netlify | Yes | Partial | Frontend Only |

---

## PART 1: Render.com Backend Deployment

### Step 1: Create New Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New"** > **"Web Service"**
3. Connect your GitHub repository

### Step 2: Configure Build Settings

Copy these exact settings:

| Setting | Value |
|---------|-------|
| **Name** | `armanlawfirm-api` |
| **Environment** | `Node` |
| **Branch** | `main` |
| **Root Directory** | `saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter $7/month) |

### Step 3: Environment Variables

Click **"Add Environment Variable"** and add:

| Key | Value | Required |
|-----|-------|----------|
| `GEMINI_API_KEY` | `your-google-ai-api-key` | Yes |
| `NODE_ENV` | `production` | Yes |
| `SUPABASE_URL` | `your-supabase-url` | Optional |
| `SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Optional |

**Important Notes:**
- Do NOT add a `PORT` variable (Render sets this automatically)
- Never commit API keys to Git

### Step 4: Deploy

Click **"Create Web Service"** and wait 2-5 minutes.

Your backend URL will be: `https://armanlawfirm-api.onrender.com`

---

## PART 2: Cloudflare Pages Frontend Deployment

### Step 1: Prepare Frontend for External API

Before deploying to Cloudflare, update the frontend to call your Render backend.

Create or update `.env.production`:
```
VITE_API_URL=https://armanlawfirm-api.onrender.com
VITE_GEMINI_API_KEY=your-api-key
```

### Step 2: Create Cloudflare Pages Project

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click **"Create a project"** > **"Connect to Git"**
3. Select your GitHub repository

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Project name** | `armanlawfirm` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Root directory** | `saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of` |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `dist` |

### Step 4: Environment Variables

Go to **Settings** > **Environment Variables** and add:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_URL` | `https://armanlawfirm-api.onrender.com` | Production |
| `VITE_GEMINI_API_KEY` | `your-api-key` | Production (Secret) |
| `GEMINI_API_KEY` | `your-api-key` | Production (Secret) |
| `NODE_VERSION` | `20` | Production |

### Step 5: Deploy

Click **"Save and Deploy"**

Your frontend URL will be: `https://armanlawfirm.pages.dev`

---

## PART 3: Connect Frontend to Backend

Update your frontend API calls to use the external backend URL.

### Update API Service

In your frontend services, update API calls:

```typescript
// services/apiConfig.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiCall = async (endpoint: string, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
};
```

### Update CORS on Backend

The backend already has CORS configured for all origins:

```typescript
// server/index.ts
app.use(cors({
  origin: true,
  credentials: true,
}));
```

---

## Environment Variables Summary

### Render (Backend)

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI API key | Yes |
| `NODE_ENV` | Set to `production` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Optional |

### Cloudflare (Frontend)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend URL on Render | Yes |
| `VITE_GEMINI_API_KEY` | For client-side AI calls | Optional |
| `NODE_VERSION` | Node.js version | Recommended |

---

## Troubleshooting

### Render Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `Port already in use` | PORT env variable set | Remove PORT from env variables |
| `tsx: not found` | Missing dependency | Check dependencies in package.json |
| `Python version not found` | Wrong language detected | Set Language to `Node`, delete requirements.txt |
| Build timeout | Large node_modules | Add node_modules to .gitignore |

### Cloudflare Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `Failed to resolve import` | Missing dependency | Run `npm install` locally first |
| API calls failing | Wrong VITE_API_URL | Check environment variable |
| CORS error | Backend not configured | Update CORS on Render backend |
| Login not working | No backend for auth | Expected - auth needs backend |

### General Tips

1. **Test locally first**: Run `npm run build` before deploying
2. **Check logs**: Render Dashboard > Logs
3. **Clear cache**: Cloudflare Dashboard > Caching > Clear Cache
4. **Force refresh**: Ctrl+Shift+R in browser

---

## Custom Domain Setup

### Cloudflare Pages

1. Go to your project > Custom domains
2. Add your domain (e.g., `armanlawfirm.ir`)
3. Update DNS records as instructed

### Render

1. Go to your service > Settings > Custom Domains
2. Add your API domain (e.g., `api.armanlawfirm.ir`)
3. Update DNS records as instructed

---

## Feature Availability

| Feature | Render Backend | Cloudflare Frontend Only |
|---------|----------------|--------------------------|
| Legal Drafting | Works | Works |
| Lawyer Finder | Works | Works |
| Contract Analysis | Works | Works |
| News Summarizer | Works | Works |
| Image Generator | Works | Works |
| User Login | Works | NOT available |
| Save Lawyers | Works | NOT available |
| User Dashboard | Works | NOT available |

---

## Security Checklist

- [ ] Never commit API keys to Git
- [ ] Use "Secret" type for sensitive variables in Cloudflare
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Rotate API keys if exposed
- [ ] Review CORS settings for production
