# Cloudflare Pages - Full Deployment (Frontend + Backend)

Deploy both frontend and backend on Cloudflare Pages using Functions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE PAGES (ALL-IN-ONE)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │   Static Frontend   │      │   Cloudflare Functions  │  │
│  │   (React + Vite)    │ ───► │   (Serverless Backend)  │  │
│  │                     │      │                         │  │
│  │   /dist folder      │      │   /functions folder     │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│                                                             │
│  URL: https://armanlawfirm.pages.dev                       │
│  API: https://armanlawfirm.pages.dev/api/generate          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create Cloudflare Pages Project

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click **"Create a project"** > **"Connect to Git"**
3. Select your GitHub repository
4. Select branch: `main`

---

## Step 2: Build Settings

| Setting | Value |
|---------|-------|
| **Project name** | `armanlawfirm` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Root directory** | `saved-hstory-of-armanlawfirmir-based-of-adl-pendar-based-of` |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `dist` |

---

## Step 3: Environment Variables

Go to **Settings** > **Environment Variables**:

| Variable Name | Value | Type |
|---------------|-------|------|
| `GEMINI_API_KEY` | `your-google-ai-api-key` | **Secret** |
| `NODE_VERSION` | `20` | Plaintext |

---

## Step 4: Functions Configuration

The `/functions` folder is automatically detected by Cloudflare Pages:

```
functions/
├── api/
│   ├── generate.ts    → /api/generate (Gemini AI calls)
│   └── health.ts      → /api/health (Health check)
└── sitemap.xml.ts     → /sitemap.xml
```

**No extra configuration needed!**

---

## Step 5: Deploy

Click **"Save and Deploy"**

Wait 2-3 minutes for deployment.

---

## Your URLs

After deployment:

| URL | Description |
|-----|-------------|
| `https://armanlawfirm.pages.dev` | Your website |
| `https://armanlawfirm.pages.dev/api/generate` | AI API endpoint |
| `https://armanlawfirm.pages.dev/api/health` | Health check |

---

## Custom Domain

1. Go to your project > **Custom Domains**
2. Add `armanlawfirm.ir`
3. Follow DNS instructions:
   - Add CNAME record: `@` → `armanlawfirm.pages.dev`
   - Or use Cloudflare nameservers

---

## Troubleshooting

### API calls return 404

- Check `/functions` folder exists
- Files must export `onRequestGet` or `onRequestPost`
- Redeploy after adding functions

### GEMINI_API_KEY not working

- Make sure it's set as **Secret** (not Plaintext)
- Check spelling: `GEMINI_API_KEY`
- Redeploy after adding environment variables

### Build fails

- Run `npm run build` locally first
- Check for TypeScript errors
- Make sure all dependencies are in package.json

### Functions timeout

- Cloudflare Functions have 30 second limit
- Large AI responses may fail
- Consider using streaming responses

---

## Limitations (Cloudflare Only)

| Feature | Status |
|---------|--------|
| Legal Drafting | Works |
| Lawyer Finder | Works |
| Contract Analysis | Works |
| News Summarizer | Works |
| Image Generator | Works |
| User Login (Replit Auth) | NOT available |
| Database Storage | NOT available |
| User Dashboard | NOT available |

**Note:** For user authentication and database features, you need a separate backend (Render, Railway, etc.)

---

## Advantages

- **Free tier**: 100,000 requests/day
- **Fast**: Edge network worldwide
- **Simple**: One deployment for everything
- **SSL**: Automatic HTTPS
- **No Render needed**: All in one place
