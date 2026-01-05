# Overview

This is a comprehensive AI-powered legal and insurance assistant application for the Iranian market, branded as "Arman Law Firm" (موسسه حقوقی آرمان). The platform provides intelligent legal drafting, lawyer/notary discovery, contract analysis, case strategy planning, insurance services, job assistance, resume analysis, and various other AI-driven tools. It's built as a single-page application (SPA) using React with TypeScript, leveraging Google's Gemini AI for natural language processing and intelligent suggestions.

The application serves both legal professionals and individuals seeking legal/insurance assistance, offering features like:
- Legal document drafting (petitions, contracts, complaints)
- Lawyer and notary finder with map integration
- Contract and evidence analysis
- Court assistant with live courtroom simulation
- Insurance policy analysis and claims drafting
- Resume analysis and job application tracking
- News summarization with legal context
- Corporate services (company name generation, articles of association)
- Content creation hub for social media
- Donation and booking systems

# Recent Changes

**December 2025:**
- Added WhatsApp AI Chatbot Integration:
  - Interactive AI assistant powered by CodeWords API (arman_law_whatsapp_assistant)
  - Floating chat widget with Persian/English bilingual support
  - Server-side API proxy at /api/whatsapp-chat with rate limiting (20 requests/minute)
  - Session-based conversation memory for 1 hour
  - Language-aware positioning (left for RTL/Farsi, right for LTR/English)
  - Component: components/WhatsAppChatbot.tsx
  - Requires CODEWORDS_API_KEY secret
- Added Cloudflare D1 Database Integration:
  - Database binding: DB, name: wb-data_bs_armanlawfirm, ID: 54480fa8-5a72-4664-ab2d-0b676c942805
  - Full CRUD API for users, orders, posts, files at /api/d1/
  - SQLite schema with migrations (migrations/0001_init.sql)
  - Drizzle ORM for D1 (shared/d1-schema.ts, server/d1-storage.ts)
  - MySQL/Postgres migration script (scripts/migrate-to-d1.ts)
  - Test endpoint at /api/d1-test
- Added new "AI Lawyer" theme as default - purple/violet color scheme (#ad2ffb primary, #1c1c1c secondary, #416DFF accent) inspired by ailawyer.pro
- Fixed Map Finder module - replaced broken external iframe with OpenStreetMap integration
- Added 10 sample Tehran law office locations with real addresses, phone numbers, and hours
- Map now dynamically updates to center on selected location
- Added search and category filtering for locations (lawyers, notary, courts, registry)
- Added Google Maps integration for directions and location viewing
- Added Smart Georeferencing page (ژئورفرنسینگ هوشمند) for matching old maps to modern maps
  - Map upload and overlay functionality with opacity, rotation, and scale controls
  - AI-powered analysis with focus modes (optimal, rotation, scale, location)
  - Voice/text commands for finding specific map elements (roads, landmarks, rivers)
  - Automatic optimization of detected AI focus elements
  - Confidence scoring and precision tracking across iterations
  - Settings save and export functionality

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 19.1.1 with TypeScript 5.8.2
- Single-page application with component-based architecture
- State management using React hooks (useState, useEffect, useCallback, useRef)
- Immutable state updates via Immer for complex nested state objects
- Context API for global state (Language, Appearance/Theme)

**Routing**: Page-based navigation without traditional routing library
- Managed via `currentPage` state in App.tsx
- PageKey type union controls available pages
- Scroll-to-top on page transitions

**UI/UX Patterns**:
- Dark/Light theme support with multiple color scheme presets
- RTL (Right-to-Left) support for Farsi language
- Responsive design with mobile-first approach
- Custom modal system for AI Guide, Settings, Quota Errors, Login, Booking, Donations
- Toast notification system for user feedback
- Dropzone integration for file uploads
- Camera input support for mobile evidence/document capture

**State Management Strategy**:
- Main application state (`AppState` interface) centralized in App.tsx
- Checkpoint system for saving/restoring application state
- LocalStorage for persistence of checkpoints, theme preferences, CV drafts
- Auto-save mechanism with debouncing (5-second delay)

## Backend Architecture

**AI Integration**: Google Gemini API (via @google/genai package)
- Primary AI service for all natural language processing tasks
- Grounding search enabled for fact-checking and source attribution
- Thinking mode option for complex reasoning tasks
- Image generation via Imagen 3
- Vision capabilities for document/image analysis (OCR)

**Service Layer** (`services/` directory):
- `geminiService.ts`: Core AI operations wrapper
  - Document drafting and analysis
  - Legal research and citation finding
  - Strategy planning and task generation
  - Resume analysis and improvement
  - Social media content generation
  - Job search suggestions
  - Fraud detection and risk assessment
- `dbService.ts`: Data persistence layer
- `supabaseClient.ts`: Authentication and database client
- `cacheService.ts`: FastCache implementation for performance optimization

**API Communication**:
- Environment variable-based API key management (`GEMINI_API_KEY`)
- Error handling with user-friendly quota exhaustion detection
- Retry logic for transient failures
- Markdown parsing for structured AI responses

## Data Storage Solutions

**Primary Database**: Supabase (PostgreSQL)
- User authentication and session management
- Case data storage (legal cases, applications)
- Checkpoint persistence (planned)
- User profiles and preferences

**Local Storage**:
- Application checkpoints (serialized AppState)
- Theme and appearance preferences
- Language selection
- CV draft auto-save
- Fast cache entries

**In-Memory State**:
- Current session data (AppState)
- Chat histories
- AI-generated content before persistence
- Form inputs and temporary data

**File Handling**:
- Base64 encoding for file uploads to AI
- Support for DOCX, PDF, images (JPEG, PNG, WEBP)
- Mammoth.js for DOCX text extraction
- Camera capture with MediaStream API

## Authentication and Authorization

**Authentication Provider**: Supabase Auth
- Email/password authentication
- Session management with JWT tokens
- LoginModal component for user sign-in/sign-up
- User state stored in App.tsx (`currentUser`)

**Authorization Model**:
- Role-based access (regular users, admin dashboard)
- Admin dashboard separate from user dashboard
- Protected routes via conditional rendering based on `currentUser`

**Security Considerations**:
- API keys stored in environment variables
- Client-side validation for email format
- Supabase RLS (Row Level Security) for database access control
- No sensitive data in localStorage (only user preferences)

## External Dependencies

### Third-Party Services

1. **Google Gemini AI** (@google/genai v1.17.0)
   - Core AI capabilities for all intelligent features
   - Models: gemini-2.0-flash-exp, gemini-2.0-flash-thinking-exp-1219, imagen-3.0-generate-001
   - Required: `GEMINI_API_KEY` environment variable
   - Quota limits enforced by Google

2. **Supabase** (@supabase/supabase-js v2.45.0)
   - Backend-as-a-Service for auth and database
   - PostgreSQL database with REST API
   - Real-time subscriptions (not currently utilized)
   - Configuration via supabaseClient.ts

3. **Cloudflare R2** (via CDN URLs)
   - Static asset hosting (images, logos)
   - Used in HTML meta tags and component references

### Third-Party APIs

1. **Google Search Grounding**
   - Integrated via Gemini's grounding feature
   - Provides source attribution for AI responses
   - Returns GroundingChunk objects with URLs

2. **Map Services** (External iframe)
   - External mapping service for lawyer/notary finder
   - Hosted at: `https://fbf5c9fb-bd5c-48f5-a87f-30402730e13f-00-2zfa03n8n0o8d.sisko.replit.dev/`
   - MapFinder component embeds iframe

### NPM Dependencies

**Core Libraries**:
- `react` & `react-dom` (19.1.1): UI framework
- `typescript` (5.8.2): Type safety
- `@google/genai` (1.17.0): AI integration
- `@supabase/supabase-js` (2.45.0): Backend services

**Utility Libraries**:
- `immer` (10.1.3): Immutable state updates
- `nanoid` (5.1.6): Unique ID generation
- `marked` (14.0.0): Markdown parsing
- `lucide-react` (0.554.0): Icon components
- `mammoth` (1.7.2): DOCX to text conversion
- `html-to-docx` (1.8.0): HTML to DOCX export
- `react-dropzone` (14.3.8): File upload UI

**Build Tools**:
- `vite` (6.2.0): Build tool and dev server
- `@vitejs/plugin-react` (5.0.0): React plugin for Vite
- Port 5000 for development server

### External Integrations

1. **Social Media Platforms** (ContentHub feature)
   - LinkedIn, Twitter, Instagram, Facebook
   - Post adaptation for each platform
   - No direct API integration (manual copy/paste workflow)

2. **Payment Gateways** (Mock implementation)
   - Booking and donation modals simulate payment flow
   - No actual payment processor integrated

3. **Google Analytics & Facebook Pixel** (index.html)
   - Tracking scripts in HTML head
   - Google tag ID: G-G4XGLJP1KK