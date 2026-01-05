# Backend Server

Express.js backend server for Arman Law Firm application.

## Files

| File | Description |
|------|-------------|
| `index.ts` | Main server entry point |
| `routes.ts` | API route definitions |
| `replitAuth.ts` | Authentication middleware (Replit Auth) |
| `storage.ts` | Database storage layer |
| `db.ts` | Database connection |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/user` | GET | Get current authenticated user |

## Running the Server

```bash
# Development
npm run server

# Production (serves frontend + API)
NODE_ENV=production npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode (production/development) | development |
| `DATABASE_URL` | PostgreSQL connection string | - |

## Production Mode

In production (`NODE_ENV=production`), the server:
1. Serves the API routes under `/api/*`
2. Serves static frontend files from `/dist`
3. Returns `index.html` for all non-API routes (SPA routing)

## Deployment Notes

### Render.com

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Do NOT set PORT - Render assigns it automatically
- Set `NODE_ENV=production`

### Cannot Deploy To

- Cloudflare Pages (static only, no server support)
- GitHub Pages (static only)
- Netlify (without serverless functions rewrite)

## Authentication

This server uses Replit Auth for authentication. If deploying outside Replit:
1. You may need to replace the auth system
2. Consider using Passport.js with a different strategy
3. Or implement JWT-based authentication
