# Services

API service modules for Arman Law Firm application.

## Files

| File | Description |
|------|-------------|
| `geminiService.ts` | Google Gemini AI integration |
| `supabaseClient.ts` | Supabase database client |
| `dbService.ts` | IndexedDB local storage |
| `cacheService.ts` | Fast caching layer |

## Gemini Service

Main AI service using Google Gemini API.

### Features
- Text generation and streaming
- Image generation (Imagen)
- Document analysis (PDF, images)
- Web search grounding
- JSON structured outputs

### Models Used
- `gemini-2.5-flash` - Fast responses
- `imagen-4.0-generate-001` - Image generation

### Environment Variables
- `GEMINI_API_KEY` or `API_KEY` - Google API key

## Supabase Client

Database client for user data storage.

### Features
- User authentication
- Case data storage
- Real-time subscriptions

## Cache Service

Local caching for AI responses.

### Features
- TTL-based expiration
- Memory-efficient storage
- Toggle enable/disable
