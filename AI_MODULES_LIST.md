# AI Modules Used in Arman Law Firm Website

---

## How This File Was Created

### Creation Prompt (Save for Future Updates)
```
Analyze the codebase and create a comprehensive list of all AI modules, functions, 
and API integrations used in this site. Include:
1. All API keys required and their purposes
2. Free tier limitations for each provider (OpenRouter, Grok, Cloudflare, Gemini)
3. All AI function names with recommended settings (max_tokens, temperature)
4. Rate limiting recommendations
5. Multi-provider fallback strategy
6. Code examples for each API provider
```

### How to Update This File
Run these commands to find new AI functions:
```bash
# Find all exported AI functions
grep -n "^export.*function" services/geminiService.ts

# Find all AI API calls
grep -rn "openrouter\|openai\|gemini\|grok\|cloudflare" --include="*.ts" --include="*.tsx"

# Find components using AI
grep -rn "import.*geminiService" components/
```

### When to Update
- After adding new AI features
- After changing AI providers
- After modifying API settings
- Monthly review recommended

---

## Prompt: Add Alternative APIs to All AI Functions

Use this prompt to automatically add fallback APIs to any AI function:

```
I need to add multi-provider fallback support to the AI function "[FUNCTION_NAME]" 
in services/geminiService.ts (line [LINE_NUMBER]).

Current setup:
- Primary API: Google Gemini (GEMINI_API_KEY)
- Function purpose: [FUNCTION_PURPOSE]
- Max tokens: [MAX_TOKENS]
- Temperature: [TEMPERATURE]

Please modify this function to:

1. Keep Gemini as primary provider
2. Add OpenRouter as first fallback using these free models:
   - google/gemini-2.0-flash-001 (preferred)
   - meta-llama/llama-3.1-8b-instruct:free (backup)
3. Add Cloudflare Workers AI as second fallback:
   - @cf/meta/llama-3.2-3b-instruct
4. Add OpenAI as final fallback (paid):
   - gpt-4o-mini

Implementation requirements:
- Use try-catch for each provider
- Log which provider succeeded/failed
- Maintain the same return type and format
- Use environment variables: GEMINI_API_KEY, OPENROUTER_API_KEY, 
  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, OPENAI_API_KEY
- Add 1 second delay between fallback attempts
- Return Persian-friendly error message if all fail

API endpoints:
- OpenRouter: https://openrouter.ai/api/v1/chat/completions
- Cloudflare: https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL}
- OpenAI: https://api.openai.com/v1/chat/completions
```

### Quick Copy Template

```
Add multi-provider fallback to "[FUNCTION_NAME]" function.

Primary: Gemini (gemini-2.5-flash)
Fallback 1: OpenRouter (google/gemini-2.0-flash-001)
Fallback 2: Cloudflare (@cf/meta/llama-3.2-3b-instruct)
Fallback 3: OpenAI (gpt-4o-mini)

Max tokens: [MAX_TOKENS], Temperature: [TEMPERATURE]

Keep same return type. Log provider used. Persian error message on total failure.
```

### Batch Update Prompt (All Functions)

```
Review services/geminiService.ts and add multi-provider fallback support 
to ALL AI functions listed below. For each function:

1. Wrap existing Gemini call in try-catch
2. Add OpenRouter fallback (google/gemini-2.0-flash-001)
3. Add Cloudflare fallback (@cf/meta/llama-3.2-3b-instruct)  
4. Add OpenAI fallback (gpt-4o-mini)

Functions to update:
- generateChatResponse (line 355) - max_tokens: 800, temp: 0.6
- analyzeContract (line 404) - max_tokens: 2000, temp: 0.3
- getSuggestions (line 227) - max_tokens: 150, temp: 0.5
- findLawyers (line 162) - max_tokens: 1000, temp: 0.7
- analyzeResume (line 1055) - max_tokens: 1500, temp: 0.4

Use this fallback order for all:
Gemini → OpenRouter → Cloudflare → OpenAI

Create a shared helper function called `callWithFallback()` to avoid 
code duplication across all 44 AI functions.
```

### Helper Function Template

```javascript
// Add this helper to services/geminiService.ts

interface AIProvider {
  name: string;
  call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

async function callWithFallback(
  prompt: string,
  maxTokens: number,
  temperature: number,
  providers: AIProvider[]
): Promise<string> {
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await provider.call(prompt, maxTokens, temperature);
      if (result) {
        console.log(`Success with ${provider.name}`);
        return result;
      }
    } catch (error) {
      console.error(`${provider.name} failed:`, error);
      await new Promise(r => setTimeout(r, 1000)); // Wait before next attempt
    }
  }
  throw new Error('تمام سرویس‌های هوش مصنوعی در دسترس نیستند. لطفاً بعداً تلاش کنید.');
}

// Provider implementations
const geminiProvider: AIProvider = {
  name: 'Gemini',
  call: async (prompt, maxTokens, temp) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { maxOutputTokens: maxTokens, temperature: temp }
    });
    return response.text || '';
  }
};

const openRouterProvider: AIProvider = {
  name: 'OpenRouter',
  call: async (prompt, maxTokens, temp) => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
};

const cloudflareProvider: AIProvider = {
  name: 'Cloudflare',
  call: async (prompt, maxTokens, temp) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens
        })
      }
    );
    const data = await response.json();
    return data.result?.response || '';
  }
};

const openAIProvider: AIProvider = {
  name: 'OpenAI',
  call: async (prompt, maxTokens, temp) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
};

// Usage example:
const result = await callWithFallback(
  prompt, 
  800, 
  0.6, 
  [geminiProvider, openRouterProvider, cloudflareProvider, openAIProvider]
);
```

---

## API Keys Required

| API Key | Provider | Status | Purpose |
|---------|----------|--------|---------|
| `GEMINI_API_KEY` | Google AI | Primary | Main AI features (frontend) |
| `OPENROUTER_API_KEY` | OpenRouter | Primary | WhatsApp chatbot, multi-model access |
| `OPENAI_API_KEY` | OpenAI | Backup | Fallback for WhatsApp chatbot |
| `XAI_API_KEY` | xAI (Grok) | Optional | Grok models via OpenRouter or direct |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | Optional | Workers AI free tier |

---

## Complete AI Function List

### File: `services/geminiService.ts`

| # | Function Name | Line | Purpose | Max Tokens | Temperature |
|---|---------------|------|---------|------------|-------------|
| 1 | `generateReportStream` | 86 | Streaming text reports | 2000 | 0.5 |
| 2 | `generateSearchQuery` | 104 | Creates search queries from documents | 100 | 0.2 |
| 3 | `findLawyers` | 162 | AI-powered lawyer search | 1000 | 0.7 |
| 4 | `findNotaries` | 166 | AI-powered notary search | 1000 | 0.7 |
| 5 | `summarizeNews` | 170 | Summarizes legal news | 1500 | 0.5 |
| 6 | `analyzeWebPage` | 174 | Analyzes web content | 1500 | 0.5 |
| 7 | `analyzeSiteStructure` | 178 | Website structure analysis | 2000 | 0.5 |
| 8 | `askGroundedQuestion` | 182 | Answers legal questions | 1000 | 0.6 |
| 9 | `generateStrategy` | 187 | Creates legal strategies | 2000 | 0.5 |
| 10 | `getSuggestions` | 227 | Input autocomplete suggestions | 150 | 0.5 |
| 11 | `prepareDraftFromTask` | 268 | Legal document draft preparation | 500 | 0.4 |
| 12 | `routeUserIntent` | 304 | Routes user to correct tool | 300 | 0.3 |
| 13 | `generateChatResponse` | 355 | Main chatbot responses | 800 | 0.6 |
| 14 | `analyzeContract` | 404 | Contract analysis | 2000 | 0.3 |
| 15 | `analyzeImage` | 440 | Analyzes uploaded images | 1500 | 0.4 |
| 16 | `extractTextFromImage` | 470 | OCR - extracts text from images | 3000 | 0.1 |
| 17 | `extractTextFromDocument` | 491 | OCR - extracts text from PDFs/docs | 3000 | 0.1 |
| 18 | `generateImage` | 514 | Creates images (Imagen model) | N/A | N/A |
| 19 | `generateText` | 537 | General text generation | 1000 | 0.5 |
| 20 | `generateJsonArray` | 550 | Structured JSON data generation | 500 | 0.3 |
| 21 | `fetchDailyTrends` | 582 | Fetches trending topics | 1000 | 0.7 |
| 22 | `generateSocialPost` | 606 | Social media content creation | 500 | 0.8 |
| 23 | `adaptPostForWebsite` | 656 | Adapts post for different platforms | 800 | 0.6 |
| 24 | `generateVideoConcept` | 693 | Video script generation | 1500 | 0.7 |
| 25 | `getPublishingStrategy` | 747 | Content publishing strategy | 1500 | 0.6 |
| 26 | `findBestVideoTools` | 780 | Video tool recommendations | 800 | 0.5 |
| 27 | `generateInstagramReelScript` | 799 | Instagram reel scripts | 800 | 0.8 |
| 28 | `generateInstagramStoryBoard` | 850 | Instagram story ideas | 600 | 0.8 |
| 29 | `getInstagramGrowthPlan` | 888 | Instagram growth strategies | 2000 | 0.6 |
| 30 | `generateSpeech` | 927 | Text-to-speech generation | N/A | N/A |
| 31 | `findLegalCitations` | 971 | Finds legal references | 1500 | 0.3 |
| 32 | `getCourtRebuttal` | 1015 | Court argument generation | 2000 | 0.4 |
| 33 | `analyzeResume` | 1055 | Resume analysis | 1500 | 0.4 |
| 34 | `generateImprovedResume` | 1126 | Resume enhancement | 2500 | 0.5 |
| 35 | `syncLinkedInProfile` | 1154 | LinkedIn profile integration | 1000 | 0.4 |
| 36 | `suggestJobSearches` | 1167 | Job search recommendations | 800 | 0.6 |
| 37 | `scrapeJobDetails` | 1203 | Job posting analysis | 1000 | 0.3 |
| 38 | `generateTailoredResume` | 1249 | Tailored resume for job | 2000 | 0.5 |
| 39 | `generateCoverLetter` | 1272 | Cover letter generation | 1500 | 0.6 |
| 40 | `chatWithJobCoach` | 1295 | Job coaching chat | 1000 | 0.7 |
| 41 | `sendWhatsAppApproval` | 1320 | WhatsApp notification | N/A | N/A |
| 42 | `applyByEmail` | 1326 | Email job application | N/A | N/A |

### File: `server/routes.ts`

| # | Function/Endpoint | Purpose | Max Tokens | Temperature |
|---|-------------------|---------|------------|-------------|
| 43 | `/api/whatsapp-chat` | WhatsApp chatbot with fallback | 500 | 0.7 |

### File: `functions/api/generate.ts`

| # | Function | Purpose | Max Tokens | Temperature |
|---|----------|---------|------------|-------------|
| 44 | Cloudflare Worker | Serverless AI generation | 1000 | 0.5 |

---

## Available Free AI APIs Comparison

| Provider | Free Tier | Daily Limit | Best Models |
|----------|-----------|-------------|-------------|
| **OpenRouter** | Free models only | 50 req/day | Gemini, Llama, Mistral |
| **xAI Grok** | Beta credits ended | 10 prompts/2hrs | Grok 3, Grok 4 |
| **Cloudflare Workers AI** | 10,000 neurons/day | ~130 responses | Llama 3.2, Mistral |
| **Google Gemini** | 15 req/min | 1,500 req/day | Gemini 2.5 Flash |

---

## 1. OpenRouter API

### Free Tier Limits
| Metric | Free Tier | Paid ($10+ credits) |
|--------|-----------|---------------------|
| **Requests per minute (RPM)** | 20 | 20 |
| **Requests per day (RPD)** | 50 | 1,000 |
| **Token limits** | Model-dependent | Model-dependent |

### Free Models on OpenRouter
| Model ID | Max Tokens | Best For | Speed |
|----------|------------|----------|-------|
| `google/gemini-2.0-flash-001` | 8,192 | General chat | Fast |
| `google/gemini-flash-1.5` | 8,192 | Longer context | Fast |
| `meta-llama/llama-3.2-3b-instruct:free` | 4,096 | Simple tasks | Fast |
| `meta-llama/llama-3.1-8b-instruct:free` | 4,096 | Balanced | Medium |
| `mistralai/mistral-7b-instruct:free` | 4,096 | Quick responses | Fast |
| `qwen/qwen-2-7b-instruct:free` | 4,096 | Multilingual (Persian) | Medium |

### OpenRouter API Usage
```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://yoursite.com'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.0-flash-001',
    messages: [{ role: 'user', content: 'Hello' }],
    max_tokens: 500,
    temperature: 0.7
  })
});
```

---

## 2. xAI Grok API

### Free Tier Limits (Consumer Interface)
| Metric | Limit | Reset |
|--------|-------|-------|
| **Text prompts** | 10 | Every 2 hours |
| **Image generations** | 10 | Every 2 hours |
| **Image analyses** | 3 | Per day |

### API Rate Limit Headers
| Header | Description |
|--------|-------------|
| `x-ratelimit-limit-requests` | Total requests allowed per day |
| `x-ratelimit-remaining-requests` | Remaining requests today |
| `x-ratelimit-reset-requests` | Time until reset |

### Available Grok Models
| Model | Context Window | Best For |
|-------|----------------|----------|
| `grok-3` | 128K tokens | General reasoning |
| `grok-4` | 128K tokens | Advanced tasks |
| `grok-vision-beta` | 128K tokens | Image analysis |

### Grok API Usage
```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${XAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'grok-3',
    messages: [{ role: 'user', content: 'Hello' }],
    max_tokens: 1000,
    temperature: 0.7
  })
});
```

### Grok via OpenRouter
```javascript
{
  model: 'x-ai/grok-beta',
  // ... rest same as OpenRouter format
}
```

---

## 3. Cloudflare Workers AI

### Free Tier Limits
| Metric | Limit | Reset |
|--------|-------|-------|
| **Neurons per day** | 10,000 | 00:00 UTC daily |
| **After free tier** | $0.011/1,000 neurons | Pay-as-you-go |

### What 10,000 Neurons Gets You
| Task | Approximate Count |
|------|-------------------|
| **LLM responses** | ~130 responses |
| **Image classifications** | ~830 images |
| **Text embeddings** | ~1,250 embeddings |

### Neuron Costs by Model
| Model | Input Neurons/1M tokens | Output Neurons/1M tokens |
|-------|-------------------------|--------------------------|
| **Llama 3.2 1B** | 2,457 | 18,252 |
| **Llama 3.2 3B** | 4,625 | 30,475 |
| **Llama 3.1 8B** | 4,119 | 34,868 |
| **Llama 3.1 70B** | 26,668 | 204,805 |

### Available Cloudflare Models
| Model | Type | Best For |
|-------|------|----------|
| `@cf/meta/llama-3.2-1b-instruct` | LLM | Fast, simple tasks |
| `@cf/meta/llama-3.2-3b-instruct` | LLM | Balanced performance |
| `@cf/meta/llama-3.1-8b-instruct` | LLM | Quality responses |
| `@cf/mistral/mistral-7b-instruct-v0.2` | LLM | General purpose |
| `@cf/microsoft/phi-2` | LLM | Efficient |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0` | Image | Image generation |

### Cloudflare Workers AI Usage
```javascript
// In Cloudflare Worker
export default {
  async fetch(request, env) {
    const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 500,
      temperature: 0.7
    });
    return new Response(JSON.stringify(response));
  }
};
```

### REST API Usage (outside Workers)
```javascript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 500
    })
  }
);
```

---

## 4. Google Gemini API

### Free Tier Limits
| Metric | Limit |
|--------|-------|
| **Requests per minute** | 15 |
| **Requests per day** | 1,500 |
| **Tokens per minute** | 1,000,000 |

### Available Models
| Model | Best For | Max Tokens |
|-------|----------|------------|
| `gemini-2.5-flash` | Fast, general purpose | 8,192 |
| `gemini-2.5-pro` | Complex reasoning | 8,192 |
| `imagen-4.0-generate-001` | Image generation | N/A |

### Gemini API Usage (via SDK)
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ parts: [{ text: 'Hello' }] }],
  config: { maxOutputTokens: 1000, temperature: 0.7 }
});
```

---

## Multi-Provider Fallback Strategy

### Recommended Priority Order
```
1. Google Gemini (GEMINI_API_KEY) - Primary, most features
2. OpenRouter (OPENROUTER_API_KEY) - Free models, good fallback
3. Cloudflare Workers AI (CLOUDFLARE_API_TOKEN) - Always free tier
4. xAI Grok (XAI_API_KEY) - When available
5. OpenAI (OPENAI_API_KEY) - Reliable paid fallback
```

### Fallback Implementation Example
```javascript
async function getAIResponse(message) {
  const providers = [
    { name: 'Gemini', fn: () => callGemini(message) },
    { name: 'OpenRouter', fn: () => callOpenRouter(message) },
    { name: 'Cloudflare', fn: () => callCloudflare(message) },
    { name: 'OpenAI', fn: () => callOpenAI(message) }
  ];
  
  for (const provider of providers) {
    try {
      const response = await provider.fn();
      if (response) {
        console.log(`Response from ${provider.name}`);
        return response;
      }
    } catch (error) {
      console.log(`${provider.name} failed:`, error.message);
    }
  }
  
  throw new Error('All AI providers failed');
}
```

---

## Rate Limiting Recommendations

### Combined Daily Budget (Free Tier)
| Provider | Daily Limit | Allocated Use |
|----------|-------------|---------------|
| Gemini | 1,500 requests | Main usage |
| OpenRouter | 50 requests | 20 for chat |
| Cloudflare | ~130 responses | 50 for analysis |
| **Total** | ~1,680 requests | Mixed workload |

### Implementation Tips
1. **Queue requests** - Don't allow rapid-fire AI calls
2. **Cache responses** - Store common answers (1 hour TTL)
3. **Batch requests** - Combine related queries
4. **Rotate providers** - Spread load across APIs
5. **Track usage** - Monitor daily consumption

---

## Error Codes to Handle

| Code | Meaning | Action |
|------|---------|--------|
| 429 | Rate limited | Wait 60s & retry / Use fallback |
| 402 | No credits | Switch to backup API |
| 503 | Service unavailable | Switch to backup API |
| 500 | Server error | Retry once, then fallback |

---

## Components Using AI

| Component | File | AI Functions Used |
|-----------|------|-------------------|
| **Chatbot** | `components/Chatbot.tsx` | generateChatResponse |
| **Lawyer Finder** | `components/LawyerFinder.tsx` | findLawyers |
| **Contract Analyzer** | `components/ContractAnalyzer.tsx` | analyzeContract |
| **Evidence Analyzer** | `components/EvidenceAnalyzer.tsx` | analyzeImage, analyzeContract |
| **Court Assistant** | `components/CourtAssistant.tsx` | findLegalCitations, getCourtRebuttal |
| **Content Hub** | `components/ContentHubPage.tsx` | generateSocialPost, getPublishingStrategy, generateVideoConcept |
| **Resume Analyzer** | `components/ResumeAnalyzer.tsx` | analyzeResume, generateImprovedResume |
| **Job Assistant** | `components/JobAssistant.tsx` | suggestJobSearches, generateTailoredResume |
| **Site Architect** | `components/SiteArchitect.tsx` | analyzeSiteStructure |
| **Geo Referencer** | `components/GeoReferencer.tsx` | AI location features |
| **AI Suggestions** | `components/AISuggestions.tsx` | getSuggestions |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total AI Functions** | 44 |
| **Primary API** | Google Gemini |
| **Free Backup APIs** | OpenRouter, Cloudflare |
| **Paid Backup** | OpenAI |
| **Combined free daily limit** | ~1,680 requests |
| **Providers configured** | 5 (Gemini, OpenRouter, OpenAI, Grok, Cloudflare) |
| **Last Updated** | December 2024 |

---

## Maintenance Log

| Date | Change | By |
|------|--------|-----|
| Dec 2024 | Initial creation with all AI functions documented | AI Assistant |
| Dec 2024 | Added OpenRouter, Grok, Cloudflare API details | AI Assistant |
| Dec 2024 | Added function list with line numbers | AI Assistant |
| Dec 2024 | Added comprehensive implementation prompts (specific + generalized) | AI Assistant |
| Dec 2024 | Added WordPress Dashboard AI Settings section | AI Assistant |

---

## WordPress Dashboard AI Settings Management

### Dashboard Location
The AI API Settings panel is located in the WordPress-style dashboard under the **AI Settings** menu item (visible to admin users only).

**Path:** Dashboard > AI Settings

### Dashboard UI Design

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI API Settings                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Gemini API Key:      [••••••••••••••••••••] 👁️             │
│  (Primary)            Get from Google AI Studio             │
│                                                              │
│  OpenRouter API Key:  [••••••••••••••••••••] 👁️             │
│  (Free Fallback)      Get from OpenRouter                   │
│                                                              │
│  Cloudflare Account:  [abc123def456        ] 👁️             │
│                                                              │
│  Cloudflare Token:    [••••••••••••••••••••] 👁️             │
│  (Workers AI)         10,000 free neurons/day               │
│                                                              │
│  OpenAI API Key:      [••••••••••••••••••••] 👁️             │
│  (Paid Backup)        Get from OpenAI Platform              │
│                                                              │
│  [Save Settings]      ✓ Settings saved successfully!        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Provider Priority & Free Limits                             │
├─────────────────────────────────────────────────────────────┤
│  Priority │ Provider       │ Free Limit    │ Status         │
│  ─────────┼────────────────┼───────────────┼────────────────│
│     1     │ Google Gemini  │ 1,500 req/day │ ✓ Configured   │
│     2     │ OpenRouter     │ 50 req/day    │ ✓ Configured   │
│     3     │ Cloudflare AI  │ ~130 resp/day │ Not set        │
│     4     │ OpenAI         │ Paid only     │ Not set        │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

**File:** `components/WordPressDashboard.tsx`

**Features:**
1. Password-masked API key inputs with show/hide toggle
2. Local storage persistence for settings
3. Real-time configuration status display
4. Provider priority order visualization
5. Direct links to get API keys from each provider

**Storage Key:** `arman-ai-settings`

**State Structure:**
```typescript
interface AISettings {
  geminiApiKey: string;
  openRouterApiKey: string;
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  openAiApiKey: string;
}
```

### Prompt: Add AI Settings Dashboard to WordPress Panel

Use this prompt to add or modify the AI Settings section:

```
Add an AI API Settings panel to the WordPress Dashboard (components/WordPressDashboard.tsx).

Requirements:
1. Add "AI Settings" menu item (admin only, between SEO Check and Appearance)
2. Create settings panel with these fields:
   - Gemini API Key (Primary)
   - OpenRouter API Key (Free Fallback)
   - Cloudflare Account ID
   - Cloudflare API Token (Workers AI)
   - OpenAI API Key (Paid Backup)

3. UI Features:
   - Password-masked inputs with eye toggle to show/hide
   - Save Settings button with success message
   - Provider priority table showing free limits
   - Status indicators (✓ Configured / Not set)
   - Direct links to get API keys

4. Storage:
   - Use localStorage with key 'arman-ai-settings'
   - Load settings on component mount
   - Save with visual confirmation

5. Styling:
   - WordPress admin style (white cards, #2271b1 blue)
   - Max width 2xl for readability
   - Proper spacing and borders

This creates a user-friendly interface for managing AI API keys without 
requiring access to environment variables or server configuration.
```

### API Key Sources

| Provider | Get API Key URL | Notes |
|----------|-----------------|-------|
| Google Gemini | https://aistudio.google.com/apikey | Free tier: 1,500 req/day |
| OpenRouter | https://openrouter.ai/keys | Free models available |
| Cloudflare | https://dash.cloudflare.com/profile/api-tokens | 10,000 neurons/day free |
| OpenAI | https://platform.openai.com/api-keys | Paid only |

---

## Complete Implementation Prompts

Below are two versions of the prompt for implementing the multi-provider fallback system:
1. **Project-Specific Version** - For this Arman Law Firm website
2. **Generalized Version** - Reusable for any AI website project

---

### VERSION 1: Project-Specific Prompt (Arman Law Firm)

```
# PROMPT: Implement Multi-Provider AI Fallback System for Arman Law Firm Website

## OBJECTIVE
Add a robust multi-provider fallback system to all 44 AI functions in `services/geminiService.ts`. 
When the primary AI provider (Gemini) fails, the system should automatically try alternative 
providers until one succeeds.

---

## PROVIDER ORDER (Fallback Chain)
1. **Google Gemini** (Primary) - `gemini-2.5-flash`
2. **OpenRouter** (Free Fallback) - `google/gemini-2.0-flash-001`
3. **Cloudflare Workers AI** (Free Fallback) - `@cf/meta/llama-3.2-3b-instruct`
4. **OpenAI** (Paid Fallback) - `gpt-4o-mini`

---

## REQUIRED ENVIRONMENT VARIABLES
Ensure these are set before implementation:
- `GEMINI_API_KEY` - Google AI key (existing)
- `OPENROUTER_API_KEY` - OpenRouter key
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `OPENAI_API_KEY` - OpenAI key

---

## IMPLEMENTATION STEPS

### Step 1: Add Shared Types and Interfaces
At the top of `services/geminiService.ts`, add:

interface AIProvider {
  name: string;
  call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

interface FallbackConfig {
  maxTokens: number;
  temperature: number;
  providers?: AIProvider[];
}

### Step 2: Create Provider Implementations

// Gemini Provider (Primary)
const geminiProvider: AIProvider = {
  name: 'Gemini',
  call: async (prompt, maxTokens, temp) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { maxOutputTokens: maxTokens, temperature: temp }
    });
    return response.text || '';
  }
};

// OpenRouter Provider (Free Fallback)
const openRouterProvider: AIProvider = {
  name: 'OpenRouter',
  call: async (prompt, maxTokens, temp) => {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('No OpenRouter key');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://armanlawfirm.ir'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp
      })
    });
    if (!response.ok) throw new Error(`OpenRouter: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
};

// Cloudflare Provider (Free Fallback)
const cloudflareProvider: AIProvider = {
  name: 'Cloudflare',
  call: async (prompt, maxTokens, temp) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) throw new Error('No Cloudflare credentials');
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens
        })
      }
    );
    if (!response.ok) throw new Error(`Cloudflare: ${response.status}`);
    const data = await response.json();
    return data.result?.response || '';
  }
};

// OpenAI Provider (Paid Fallback)
const openAIProvider: AIProvider = {
  name: 'OpenAI',
  call: async (prompt, maxTokens, temp) => {
    if (!process.env.OPENAI_API_KEY) throw new Error('No OpenAI key');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp
      })
    });
    if (!response.ok) throw new Error(`OpenAI: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
};

// Default provider chain
const defaultProviders = [geminiProvider, openRouterProvider, cloudflareProvider, openAIProvider];

### Step 3: Create Main Fallback Function

async function callWithFallback(
  prompt: string,
  config: FallbackConfig
): Promise<string> {
  const providers = config.providers || defaultProviders;
  const errors: string[] = [];
  
  for (const provider of providers) {
    try {
      console.log(`[AI Fallback] Attempting ${provider.name}...`);
      const result = await provider.call(prompt, config.maxTokens, config.temperature);
      
      if (result && result.trim().length > 0) {
        console.log(`[AI Fallback] ✓ Success with ${provider.name}`);
        return result;
      }
      console.log(`[AI Fallback] ${provider.name} returned empty response`);
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      errors.push(`${provider.name}: ${errorMsg}`);
      console.error(`[AI Fallback] ✗ ${provider.name} failed:`, errorMsg);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('[AI Fallback] All providers failed:', errors);
  throw new Error('متأسفانه سرویس هوش مصنوعی در دسترس نیست. لطفاً چند دقیقه دیگر تلاش کنید.');
}

### Step 4: Create JSON-Specific Fallback Function

async function callWithFallbackJSON<T>(
  prompt: string,
  config: FallbackConfig,
  parseFunction: (text: string) => T
): Promise<T> {
  const result = await callWithFallback(prompt, config);
  
  try {
    const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || 
                      result.match(/\{[\s\S]*\}/) ||
                      result.match(/\[[\s\S]*\]/);
    
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result;
    return parseFunction(jsonText);
  } catch (parseError) {
    console.error('[AI Fallback] JSON parse error:', parseError);
    throw new Error('خطا در پردازش پاسخ. لطفاً دوباره تلاش کنید.');
  }
}

---

## FUNCTION-SPECIFIC CONFIGURATIONS

| Function | Max Tokens | Temperature | Notes |
|----------|------------|-------------|-------|
| generateChatResponse | 800 | 0.6 | Standard |
| analyzeContract | 2000 | 0.3 | Low temp |
| getSuggestions | 150 | 0.5 | Short |
| findLawyers | 1000 | 0.7 | Creative |
| findNotaries | 1000 | 0.7 | Creative |
| summarizeNews | 1500 | 0.5 | Balanced |
| analyzeWebPage | 1500 | 0.5 | Balanced |
| analyzeSiteStructure | 2000 | 0.5 | Balanced |
| askGroundedQuestion | 1000 | 0.6 | Standard |
| generateStrategy | 2000 | 0.5 | Balanced |
| prepareDraftFromTask | 500 | 0.4 | Lower |
| routeUserIntent | 300 | 0.3 | Precise |
| analyzeImage | 1500 | 0.4 | SKIP-Gemini only |
| extractTextFromImage | 3000 | 0.1 | SKIP-OCR |
| extractTextFromDocument | 3000 | 0.1 | SKIP-OCR |
| generateImage | N/A | N/A | SKIP-Imagen |
| generateText | 1000 | 0.5 | Standard |
| generateJsonArray | 500 | 0.3 | JSON fallback |
| fetchDailyTrends | 1000 | 0.7 | Creative |
| generateSocialPost | 500 | 0.8 | High creative |
| adaptPostForWebsite | 800 | 0.6 | Standard |
| generateVideoConcept | 1500 | 0.7 | Creative |
| getPublishingStrategy | 1500 | 0.6 | Standard |
| findBestVideoTools | 800 | 0.5 | Balanced |
| generateInstagramReelScript | 800 | 0.8 | High creative |
| generateInstagramStoryBoard | 600 | 0.8 | High creative |
| getInstagramGrowthPlan | 2000 | 0.6 | Standard |
| generateSpeech | N/A | N/A | SKIP-TTS |
| findLegalCitations | 1500 | 0.3 | Low temp |
| getCourtRebuttal | 2000 | 0.4 | Lower |
| analyzeResume | 1500 | 0.4 | Lower |
| generateImprovedResume | 2500 | 0.5 | Balanced |
| syncLinkedInProfile | 1000 | 0.4 | Lower |
| suggestJobSearches | 800 | 0.6 | Standard |
| scrapeJobDetails | 1000 | 0.3 | Low temp |
| generateTailoredResume | 2000 | 0.5 | Balanced |
| generateCoverLetter | 1500 | 0.6 | Standard |
| chatWithJobCoach | 1000 | 0.7 | Creative |

---

## SPECIAL CASES - DO NOT MODIFY
1. analyzeImage - Requires vision (Gemini only)
2. extractTextFromImage - OCR (Gemini only)
3. extractTextFromDocument - PDF processing (Gemini only)
4. generateImage - Imagen model (Gemini only)
5. generateSpeech - Google TTS (special API)
6. generateReportStream - Streaming output (special handling)

---

## EXPECTED BEHAVIORS

### On Success:
- Log provider used
- Return result normally

### On Single Provider Failure:
- Log error with provider name
- Wait 1 second
- Try next provider

### On All Providers Failure:
- Log all errors
- Throw Persian error message

### Rate Limit (HTTP 429):
- Skip to next provider immediately
- Log rate limit hit

---

## PRIORITY ORDER FOR IMPLEMENTATION
1. generateChatResponse
2. analyzeContract
3. findLawyers
4. findLegalCitations
5. getCourtRebuttal
6. analyzeResume
7. getSuggestions
8. All remaining functions
```

---

### VERSION 2: Generalized Prompt (For Any AI Website)

```
# PROMPT: Implement a Multi-Provider AI Fallback System for This Website

## OBJECTIVE

Upgrade all existing AI functions in the project by adding a unified multi-provider fallback system.
When the primary AI provider fails, the system must automatically switch to the next provider in 
the fallback chain until one returns a result.

---

## PROVIDER ORDER (Fallback Chain)

1. **Primary Provider** – e.g., `gemini-2.5-flash`
2. **Secondary Provider (via OpenRouter)** – e.g., `google/gemini-2.0-flash-001`
3. **Cloudflare Workers AI** – e.g., `@cf/meta/llama-3.2-3b-instruct`
4. **OpenAI (Paid Fallback)** – e.g., `gpt-4o-mini`

*The builder should allow replacing or reordering these without modifying all individual functions.*

---

## REQUIRED ENVIRONMENT VARIABLES

Before implementing, ensure the following environment variables exist (names may be adapted per project):

* `GEMINI_API_KEY` - Primary AI provider key
* `OPENROUTER_API_KEY` - OpenRouter access key
* `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
* `CLOUDFLARE_API_TOKEN` - Cloudflare API token
* `OPENAI_API_KEY` - OpenAI access key

---

## IMPLEMENTATION STEPS

### Step 1: Add Shared Types and Interfaces

At the top of the service file handling AI requests, add:

interface AIProvider {
  name: string;
  call: (
    prompt: string,
    maxTokens: number,
    temperature: number
  ) => Promise<string>;
}

interface FallbackConfig {
  maxTokens: number;
  temperature: number;
  providers?: AIProvider[];
}

### Step 2: Create Provider Factory

Create modular provider implementations that can be easily swapped:

const createGeminiProvider = (apiKey: string): AIProvider => ({
  name: 'Gemini',
  call: async (prompt, maxTokens, temp) => {
    // Gemini implementation
  }
});

const createOpenRouterProvider = (apiKey: string): AIProvider => ({
  name: 'OpenRouter', 
  call: async (prompt, maxTokens, temp) => {
    // OpenRouter implementation
  }
});

const createCloudflareProvider = (accountId: string, token: string): AIProvider => ({
  name: 'Cloudflare',
  call: async (prompt, maxTokens, temp) => {
    // Cloudflare implementation
  }
});

const createOpenAIProvider = (apiKey: string): AIProvider => ({
  name: 'OpenAI',
  call: async (prompt, maxTokens, temp) => {
    // OpenAI implementation
  }
});

### Step 3: Create Main Fallback Function

async function callWithFallback(
  prompt: string,
  config: FallbackConfig,
  providers: AIProvider[]
): Promise<string> {
  const errors: string[] = [];
  
  for (const provider of providers) {
    try {
      console.log(`[AI Fallback] Trying ${provider.name}...`);
      const result = await provider.call(prompt, config.maxTokens, config.temperature);
      
      if (result && result.trim().length > 0) {
        console.log(`[AI Fallback] ✓ ${provider.name} succeeded`);
        return result;
      }
    } catch (error: any) {
      errors.push(`${provider.name}: ${error?.message || 'Unknown'}`);
      console.error(`[AI Fallback] ✗ ${provider.name} failed`);
      await new Promise(r => setTimeout(r, 1000)); // Wait before retry
    }
  }
  
  throw new Error('All AI providers failed. Please try again later.');
}

### Step 4: Configure Provider Chain

// Configure once at application startup
const providers = [
  createGeminiProvider(process.env.GEMINI_API_KEY),
  createOpenRouterProvider(process.env.OPENROUTER_API_KEY),
  createCloudflareProvider(process.env.CLOUDFLARE_ACCOUNT_ID, process.env.CLOUDFLARE_API_TOKEN),
  createOpenAIProvider(process.env.OPENAI_API_KEY)
].filter(p => p !== null); // Only include configured providers

---

## FUNCTION CONFIGURATION TEMPLATE

For each AI function, define:

| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| maxTokens | Maximum response length | 100-3000 |
| temperature | Creativity level | 0.1-0.9 |

Guidelines:
- Low temperature (0.1-0.3): Precise, factual responses
- Medium temperature (0.4-0.6): Balanced responses  
- High temperature (0.7-0.9): Creative, varied responses

---

## SPECIAL CASES

Some functions may require specific providers only:
- Vision/Image analysis → Provider with vision capability
- Image generation → Provider with image models
- Text-to-speech → Provider with TTS support
- Streaming output → Provider with streaming support

For these, implement separate fallback chains or skip fallback entirely.

---

## EXPECTED BEHAVIORS

| Scenario | Action |
|----------|--------|
| Success | Log provider, return result |
| Single failure | Log error, wait 1s, try next |
| Rate limit (429) | Skip to next immediately |
| All fail | Throw user-friendly error |

---

## ERROR MESSAGES

Provide localized error messages based on project language:
- English: "AI service unavailable. Please try again later."
- Persian: "متأسفانه سرویس هوش مصنوعی در دسترس نیست. لطفاً چند دقیقه دیگر تلاش کنید."
- Add other languages as needed

---

## TESTING CHECKLIST

After implementation, verify:
- [ ] Primary provider works normally
- [ ] Fallback triggers on primary failure
- [ ] All providers attempted in order
- [ ] Logs show which provider succeeded
- [ ] Error messages display correctly
- [ ] Response times acceptable (< 10s per attempt)
- [ ] JSON-returning functions parse correctly

---

## CONVERSION EXAMPLE

### Before (Single Provider):
export async function generateResponse(message: string): Promise<string> {
  const response = await primaryAI.generate(message);
  return response.text;
}

### After (With Fallback):
export async function generateResponse(message: string): Promise<string> {
  return callWithFallback(message, {
    maxTokens: 800,
    temperature: 0.6
  }, providers);
}

---

## IMPLEMENTATION PRIORITY

1. Most-used functions (chatbot, main features)
2. Critical functions (payment, auth-related)
3. Secondary functions (analytics, suggestions)
4. Nice-to-have functions (social media, extras)

Now implement step by step, starting with the helper functions.
```

---

### VERSION 3: Complete Prompt with Admin AI Dashboard

```
# PROMPT: Implement a Multi-Provider AI Fallback System and AI API Management Dashboard

## OBJECTIVE

Upgrade all AI-powered features in the project by adding:

1. **A multi-provider fallback system** that automatically switches between AI providers when one fails.
2. **An AI API Management Dashboard** inside the website's admin panel (e.g., WordPress dashboard or equivalent), allowing administrators to:
   * View all configured AI providers
   * Add or remove API keys
   * See API usage limits and quotas
   * Enable/disable providers
   * Adjust provider priority order
   * Debug AI-related functions and error logs

This prompt must apply to **any AI-generated website**.

---

## PROVIDER ORDER (Fallback Chain)

1. **Primary Provider** – e.g., `gemini-2.5-flash`
2. **Secondary Provider (via OpenRouter)** – e.g., `google/gemini-2.0-flash-001`
3. **Cloudflare Workers AI** – e.g., `@cf/meta/llama-3.2-3b-instruct`
4. **OpenAI** – e.g., `gpt-4o-mini`

*The system should allow reordering or replacing these through the admin dashboard.*

---

## REQUIRED ENVIRONMENT VARIABLES

The prompt must ensure the following environment variables (or similar) are set:

* `GEMINI_API_KEY`
* `OPENROUTER_API_KEY`
* `CLOUDFLARE_ACCOUNT_ID`
* `CLOUDFLARE_API_TOKEN`
* `OPENAI_API_KEY`

These should be manageable through the Admin AI Dashboard when possible.

---

## IMPLEMENTATION STEPS

### Step 1: Add Shared Types and Interfaces

Add the unified provider interfaces to the main AI service file:

interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiKeyEnvVar: string;
  endpoint: string;
  model: string;
  limits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
  };
  usage: {
    requestsToday: number;
    tokensToday: number;
    lastUsed: Date | null;
    lastError: string | null;
  };
  call: (
    prompt: string,
    maxTokens: number,
    temperature: number
  ) => Promise<string>;
}

interface FallbackConfig {
  maxTokens: number;
  temperature: number;
  providers?: AIProvider[];
}

interface AILog {
  id: string;
  timestamp: Date;
  provider: string;
  function: string;
  status: 'success' | 'error' | 'fallback';
  duration: number;
  tokens: number;
  error?: string;
}

---

### Step 2: Create Admin AI Dashboard

The dashboard should include the following sections:

#### 2.1 Provider Management Panel
- List all configured AI providers with status indicators
- Toggle switches to enable/disable each provider
- Drag-and-drop to reorder provider priority
- "Add New Provider" button with form:
  - Provider name
  - API endpoint URL
  - Model name
  - API key (stored securely)
  - Rate limits configuration

#### 2.2 API Key Management
- Secure input fields for each provider's API key
- "Test Connection" button for each provider
- Last validation status and timestamp
- Masked display of current keys (show last 4 characters only)

#### 2.3 Usage & Limits Dashboard
| Provider | Requests Today | Daily Limit | Tokens Used | Status |
|----------|----------------|-------------|-------------|--------|
| Gemini   | 450            | 1,500       | 125,000     | Active |
| OpenRouter | 12           | 50          | 8,500       | Active |
| Cloudflare | 45           | 130         | 22,000      | Active |
| OpenAI   | 0              | Unlimited   | 0           | Standby |

- Progress bars showing usage percentage
- Alerts when approaching limits (80%, 95%, 100%)
- Reset time countdown for each provider

#### 2.4 AI Function Registry
| Function Name | Last Called | Provider Used | Avg Response Time | Status |
|---------------|-------------|---------------|-------------------|--------|
| generateChatResponse | 2 min ago | Gemini | 1.2s | OK |
| analyzeContract | 15 min ago | Gemini | 3.5s | OK |
| findLawyers | 1 hr ago | OpenRouter | 2.1s | OK |

- Click function name to see detailed logs
- Filter by status, provider, or date range

#### 2.5 Debug Console
- Real-time log viewer with filtering:
  - Filter by: All | Errors | Warnings | Info
  - Filter by provider
  - Filter by function
  - Date/time range selector
- Log entry format:
  [2024-12-11 14:32:15] [INFO] [Gemini] generateChatResponse - Success (1.2s, 450 tokens)
  [2024-12-11 14:32:18] [ERROR] [Gemini] analyzeContract - Rate limit exceeded
  [2024-12-11 14:32:19] [INFO] [OpenRouter] analyzeContract - Fallback success (2.1s)
- Export logs as CSV/JSON
- Clear logs button (with confirmation)

#### 2.6 Test & Diagnostic Tools
- "Test All Providers" button - runs health check on all APIs
- "Test Specific Function" dropdown - test any AI function manually
- Input field for test prompt
- Response preview with timing and token count
- Fallback simulation mode (force primary to fail)

---

### Step 3: Database Schema for Dashboard

// For storing provider configurations
CREATE TABLE ai_providers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  endpoint VARCHAR(255),
  model VARCHAR(100),
  api_key_env_var VARCHAR(100),
  requests_per_minute INT DEFAULT 15,
  requests_per_day INT DEFAULT 1500,
  tokens_per_minute INT DEFAULT 1000000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

// For tracking usage
CREATE TABLE ai_usage (
  id SERIAL PRIMARY KEY,
  provider_id VARCHAR(50) REFERENCES ai_providers(id),
  date DATE DEFAULT CURRENT_DATE,
  requests_count INT DEFAULT 0,
  tokens_count INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  UNIQUE(provider_id, date)
);

// For logging
CREATE TABLE ai_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  provider_id VARCHAR(50),
  function_name VARCHAR(100),
  status VARCHAR(20), -- 'success', 'error', 'fallback'
  duration_ms INT,
  tokens_used INT,
  error_message TEXT,
  request_preview TEXT,
  response_preview TEXT
);

---

### Step 4: Backend API Endpoints for Dashboard

// Provider Management
GET    /api/admin/ai/providers        - List all providers
POST   /api/admin/ai/providers        - Add new provider
PUT    /api/admin/ai/providers/:id    - Update provider
DELETE /api/admin/ai/providers/:id    - Remove provider
POST   /api/admin/ai/providers/:id/test - Test provider connection
PUT    /api/admin/ai/providers/reorder - Update priority order

// Usage & Stats
GET    /api/admin/ai/usage            - Get usage statistics
GET    /api/admin/ai/usage/:providerId - Get provider-specific usage

// Logs
GET    /api/admin/ai/logs             - Get logs (with pagination/filters)
DELETE /api/admin/ai/logs             - Clear logs
GET    /api/admin/ai/logs/export      - Export logs as CSV/JSON

// Diagnostics
POST   /api/admin/ai/test-function    - Test specific AI function
POST   /api/admin/ai/health-check     - Run health check on all providers

---

### Step 5: WordPress Integration (if applicable)

For WordPress sites, add a custom admin menu:

// Add to functions.php or custom plugin
add_action('admin_menu', function() {
  add_menu_page(
    'AI Dashboard',           // Page title
    'AI Dashboard',           // Menu title
    'manage_options',         // Capability
    'ai-dashboard',           // Menu slug
    'render_ai_dashboard',    // Callback function
    'dashicons-admin-generic', // Icon
    30                        // Position
  );
  
  add_submenu_page('ai-dashboard', 'Providers', 'Providers', 'manage_options', 'ai-providers', 'render_providers_page');
  add_submenu_page('ai-dashboard', 'Usage', 'Usage', 'manage_options', 'ai-usage', 'render_usage_page');
  add_submenu_page('ai-dashboard', 'Logs', 'Logs', 'manage_options', 'ai-logs', 'render_logs_page');
  add_submenu_page('ai-dashboard', 'Debug', 'Debug', 'manage_options', 'ai-debug', 'render_debug_page');
});

---

### Step 6: Security Considerations

1. **Authentication**: Dashboard accessible only to admin users
2. **API Key Storage**: Store keys encrypted, never in plain text
3. **Rate Limiting**: Prevent abuse of test endpoints
4. **Audit Trail**: Log all admin actions (key changes, provider toggles)
5. **Input Validation**: Sanitize all inputs before processing
6. **CORS**: Restrict API endpoints to same-origin requests

---

## EXPECTED DASHBOARD FEATURES

| Feature | Description | Priority |
|---------|-------------|----------|
| Provider List | View all AI providers with status | High |
| Enable/Disable Toggle | Turn providers on/off | High |
| Priority Reorder | Drag-drop to change fallback order | High |
| API Key Management | Add/edit/remove API keys securely | High |
| Usage Stats | Real-time usage vs limits | High |
| Error Logs | View recent errors with details | High |
| Test Connection | Verify API key works | Medium |
| Function Registry | See all AI functions and their status | Medium |
| Export Logs | Download logs for analysis | Medium |
| Debug Console | Real-time log streaming | Medium |
| Usage Alerts | Notifications when approaching limits | Low |
| Historical Charts | Usage trends over time | Low |

---

## IMPLEMENTATION PRIORITY

1. **Phase 1 (Core)**
   - Provider list with enable/disable
   - API key management
   - Basic usage stats

2. **Phase 2 (Monitoring)**
   - Error logs viewer
   - Function registry
   - Test connection feature

3. **Phase 3 (Advanced)**
   - Debug console
   - Export functionality
   - Historical charts
   - Usage alerts

---

## TESTING CHECKLIST

After implementation, verify:
- [ ] Dashboard loads correctly for admin users
- [ ] Non-admin users cannot access dashboard
- [ ] Providers can be enabled/disabled
- [ ] Priority order can be changed
- [ ] API keys can be added/updated securely
- [ ] Usage stats update in real-time
- [ ] Logs display correctly with filters
- [ ] Test connection works for all providers
- [ ] Fallback system respects dashboard settings
- [ ] All CRUD operations work correctly
```

---

## Quick Reference: Which Prompt to Use?

| Scenario | Use Version |
|----------|-------------|
| This specific Arman Law Firm project | Version 1 (Project-Specific) |
| New AI website project (basic) | Version 2 (Generalized) |
| Replit AI builder (basic) | Version 2 (Generalized) |
| **Full system with Admin Dashboard** | **Version 3 (With Dashboard)** |
| WordPress with AI admin panel | Version 3 (With Dashboard) |
| Enterprise/Production deployment | Version 3 (With Dashboard) |
