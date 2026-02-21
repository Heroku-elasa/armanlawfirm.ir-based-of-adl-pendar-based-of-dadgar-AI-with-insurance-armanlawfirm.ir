
import OpenAI from 'openai';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GroundingChunk, StrategyTask, IntentRoute, DraftPreparationResult, ChatMessage, FilePart, LatLng, DailyTrend, GeneratedPost, VideoScript, PublishingStrategy, VideoTool, LegalCitation, CourtroomRebuttal, InstagramReel, InstagramStory, InstagramGrowthPlan, ResumeAnalysisResult, JobDetails, JobSearchSuggestion, JobApplication } from '../types';
import { RESUME_ANALYSIS_CRITERIA } from '../constants';

interface AIProvider {
    name: string;
    call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

const CLOUDFLARE_API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';
const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';

// Initialize the Google GenAI SDK
// We use a singleton pattern to reuse the client instance
let aiInstance: GoogleGenAI | null = null;

// @ts-ignore
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
// @ts-ignore
const POYO_API_KEY = import.meta.env.VITE_POYO_AI_API_KEY || process.env.POYO_AI_API_KEY || process.env.POYO_API_KEY || '';
// @ts-ignore
const PORTKEY_API_KEY = import.meta.env.VITE_PORTKEY_API_KEY || process.env.PORTKEY_API_KEY || '';
// @ts-ignore
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
// @ts-ignore
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
// @ts-ignore
const POYO_AI_API_KEY = import.meta.env.VITE_POYO_AI_API_KEY || process.env.POYO_AI_API_KEY || '';

const getAI = (): GoogleGenAI | null => {
    if (!aiInstance) {
        // Try multiple potential keys for Gemini
        const apiKey = (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) ? GEMINI_API_KEY : 
                       (POYO_AI_API_KEY && POYO_AI_API_KEY.length > 10) ? POYO_AI_API_KEY : null;
        
        if (!apiKey) {
            console.warn("Google Gemini API key not found. Falling back to other providers.");
            return null;
        }
        try {
            aiInstance = new GoogleGenAI({ apiKey });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI:", e);
            return null;
        }
    }
    return aiInstance;
};

const poyoClient = new OpenAI({
    apiKey: POYO_API_KEY,
    baseURL: 'https://api.poyo.ai/v1',
    dangerouslyAllowBrowser: true
});

const portkeyClient = new OpenAI({
    apiKey: PORTKEY_API_KEY,
    baseURL: 'https://api.portkey.ai/v1',
    dangerouslyAllowBrowser: true
});

const portkeyProvider: AIProvider = {
    name: 'Portkey',
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        if (!PORTKEY_API_KEY) throw new Error('Portkey API key not configured');
        try {
            const response = await fetch('https://api.portkey.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-portkey-api-key': PORTKEY_API_KEY,
                    'x-portkey-provider': 'google'
                },
                body: JSON.stringify({
                    model: 'gemini-1.5-flash',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: temperature
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`Portkey error: ${response.status} - ${JSON.stringify(errData)}`);
            }
            const data = await response.json() as any;
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error("Portkey Error:", error);
            throw error;
        }
    }
};

const geminiProvider: AIProvider = {
    name: 'Gemini',
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const ai = getAI();
        if (!ai) throw new Error('Gemini API not initialized');
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
                config: { maxOutputTokens: maxTokens, temperature: temperature }
            });
            return response.text || '';
        } catch (error: any) {
            if (error.status === 400 || error.message?.includes('API key not valid')) {
                throw new Error('API_KEY_INVALID: Google Gemini API key is invalid.');
            }
            throw error;
        }
    }
};

const poyoProvider: AIProvider = {
    name: 'PoyoAI',
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        if (!POYO_API_KEY) throw new Error('Poyo AI API key not configured');
        try {
            const response = await poyoClient.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature
            });
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error("Poyo AI Primary Model Error, trying fallback:", error);
            const response = await poyoClient.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature
            });
            return response.choices[0]?.message?.content || '';
        }
    }
};

const openRouterProvider: AIProvider = {
    name: 'OpenRouter',
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://armanlawfirm.ir',
                    'X-Title': 'Arman Law Firm Assistant'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: temperature
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                // If 401 or model error, try another model as fallback within OpenRouter
                if (response.status === 401 || response.status === 404) {
                     const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: 'openai/gpt-4o-mini',
                            messages: [{ role: 'user', content: prompt }],
                            max_tokens: maxTokens,
                        })
                    });
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json() as any;
                        return fallbackData.choices?.[0]?.message?.content || '';
                    }
                }
                throw new Error(`OpenRouter error: ${response.status} - ${JSON.stringify(errData)}`);
            }
            const data = await response.json() as { choices?: { message?: { content?: string } }[] };
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error("OpenRouter Error:", error);
            throw error;
        }
    }
};

const cloudflareProvider: AIProvider = {
    name: 'Cloudflare',
    call: async (prompt: string, maxTokens: number, _temperature: number): Promise<string> => {
        if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) throw new Error('Cloudflare credentials not configured');
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens
                })
            }
        );
        if (!response.ok) throw new Error(`Cloudflare error: ${response.status}`);
        const data = await response.json() as { result?: { response?: string } };
        return data.result?.response || '';
    }
};

const openAIProvider: AIProvider = {
    name: 'OpenAI',
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature
            })
        });
        if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
        const data = await response.json() as { choices?: { message?: { content?: string } }[] };
        return data.choices?.[0]?.message?.content || '';
    }
};

const allProviders: AIProvider[] = [poyoProvider, openRouterProvider, geminiProvider, portkeyProvider, cloudflareProvider, openAIProvider];

export async function callWithFallback(
    prompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.5
): Promise<string> {
    for (const provider of allProviders) {
        try {
            console.log(`[AI] Trying ${provider.name}...`);
            const result = await provider.call(prompt, maxTokens, temperature);
            if (result) {
                console.log(`[AI] Success with ${provider.name}`);
                return result;
            }
        } catch (error) {
            console.error(`[AI] ${provider.name} failed:`, error instanceof Error ? error.message : error);
            await new Promise(r => setTimeout(r, 500)); // Wait before next attempt
        }
    }
    throw new Error('تمام سرویس‌های هوش مصنوعی در دسترس نیستند. لطفاً بعداً تلاش کنید. (All AI services unavailable)');
}

export async function callWithFallbackJSON<T>(
    prompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.3
): Promise<T> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just JSON.`;
    const result = await callWithFallback(jsonPrompt, maxTokens, temperature);
    const cleanJson = result.replace(/^```json\s*|```$/g, '').trim();
    return JSON.parse(cleanJson);
}

// --- CORE GENERATION FUNCTIONS ---

export async function* generateReportStream(prompt: string): AsyncGenerator<string, void, undefined> {
    const ai = getAI();
    if (!ai) {
        // Fallback for streaming if Gemini is not available
        try {
            const result = await callWithFallback(prompt, 2000, 0.7);
            yield result;
            return;
        } catch (e) {
            throwEnhancedError(e, 'All AI services failed to generate report.');
            return;
        }
    }
    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash',
            contents: [{ parts: [{ text: prompt }] }],
        });

        for await (const chunk of response) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (e) {
        throwEnhancedError(e, 'Failed to generate report stream.');
    }
}

export async function generateSearchQuery(documentText: string): Promise<string> {
    const ai = getAI();
    const prompt = `Based on the following legal document, generate a short, effective search query (under 10 words) to find a suitable professional in Iran. The query should specify the legal specialty and location if mentioned. Do not add any introduction or explanation, just the query text.
  
  Document:
  ---
  ${documentText}
  ---
  
  Search Query:`;

    if (!ai) {
        return await callWithFallback(prompt, 100, 0.2);
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.2,
            },
        });
        return response.text?.trim().replace(/["']/g, "") || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate search query.');
    }
}

export interface SearchResult {
    text: string;
    sources: GroundingChunk[];
}

async function performSearch(prompt: string, useThinkingMode: boolean, location?: LatLng | null): Promise<SearchResult> {
    const ai = getAI();
    if (!ai) {
        // Fallback to callWithFallback for search if Gemini is not initialized
        const result = await callWithFallback(prompt, 1500, 0.7);
        return { text: result, sources: [] };
    }
    const model = 'gemini-2.0-flash';

    let enhancedPrompt = prompt;
    if (location) {
        enhancedPrompt += `\n\nUser location context: Latitude ${location.latitude}, Longitude ${location.longitude}. Please consider this location when providing relevant information.`;
    }

    const config: any = {
        temperature: 0.7,
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: enhancedPrompt }] }],
            config,
        });

        const text = response.text || "";
        
        return { text, sources: [] };
    } catch (error) {
        throwEnhancedError(error, 'Search operation failed.');
    }
}

export async function findLawyers(prompt: string, location?: LatLng | null): Promise<SearchResult> {
    return performSearch(prompt, false, location);
}

export async function findNotaries(prompt: string, location?: LatLng | null): Promise<SearchResult> {
    return performSearch(prompt, false, location);
}

export async function summarizeNews(prompt: string, useThinkingMode: boolean): Promise<SearchResult> {
    return performSearch(prompt, useThinkingMode);
}

export async function analyzeWebPage(prompt: string, useThinkingMode: boolean): Promise<SearchResult> {
    return performSearch(prompt, useThinkingMode);
}

export async function analyzeSiteStructure(prompt: string, useThinkingMode: boolean): Promise<SearchResult> {
    return performSearch(prompt, useThinkingMode);
}

export async function askGroundedQuestion(query: string): Promise<SearchResult> {
    const prompt = `You are a helpful legal assistant for Arman AI. Answer the following legal or general question for an Iranian user accurately and concisely. Use Google Search to verify facts and provide up-to-date information. If specialized advice is needed, recommend a lawyer. Question: "${query}"`;
    return performSearch(prompt, false);
}

export async function generateStrategy(goal: string, promptTemplate: string, useThinkingMode: boolean): Promise<StrategyTask[]> {
    const ai = getAI();
    const prompt = promptTemplate.replace('{goal}', goal);
    const model = 'gemini-2.0-flash';

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                taskName: { type: Type.STRING },
                description: { type: Type.STRING },
                effortPercentage: { type: Type.NUMBER },
                deliverableType: { type: Type.STRING },
                suggestedPrompt: { type: Type.STRING },
            },
            required: ['taskName', 'description', 'effortPercentage', 'deliverableType', 'suggestedPrompt'],
        },
    };

    const config: any = {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config,
        });

        const jsonText = response.text?.trim() || "[]";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        return JSON.parse(cleanJson);
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate strategy.');
    }
}

export async function getSuggestions(query: string, contextPrompt: string): Promise<string[]> {
    const ai = getAI();
    const prompt = `${contextPrompt}: "${query}"`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            }
        },
        required: ['suggestions']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                maxOutputTokens: 150,
                temperature: 0.5,
            },
        });

        const jsonText = response.text?.trim() || "{}";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        const result = JSON.parse(cleanJson);

        if (result.suggestions && Array.isArray(result.suggestions)) {
            return result.suggestions.slice(0, 5);
        }
        return [];
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
    }
}

export async function prepareDraftFromTask(task: StrategyTask, promptTemplate: string, docTypeOptions: string): Promise<DraftPreparationResult> {
    const ai = getAI();
    const prompt = promptTemplate
        .replace('{taskName}', task.taskName)
        .replace('{description}', task.description)
        .replace('{suggestedPrompt}', task.suggestedPrompt)
        .replace('{docTypeOptions}', docTypeOptions);

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            docType: { type: Type.STRING },
            topic: { type: Type.STRING },
            description: { type: Type.STRING },
        },
        required: ['docType', 'topic', 'description'],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "{}";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        return JSON.parse(cleanJson);
    } catch (error) {
        throwEnhancedError(error, 'Failed to prepare draft.');
    }
}

export async function routeUserIntent(goal: string, promptTemplate: string): Promise<IntentRoute[]> {
    const ai = getAI();
    const prompt = promptTemplate.replace('{goal}', goal);

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                module: {
                    type: Type.STRING,
                    enum: ['legal_drafter', 'lawyer_finder', 'news_summarizer', 'case_strategist', 'notary_finder', 'web_analyzer', 'contract_analyzer', 'evidence_analyzer', 'image_generator', 'corporate_services', 'insurance_services', 'site_architect', 'content_hub', 'court_assistant', 'resume_analyzer', 'job_assistant']
                },
                confidencePercentage: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
            },
            required: ['module', 'confidencePercentage', 'reasoning'],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "[]";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        const parsedResult = JSON.parse(cleanJson);

        if (Array.isArray(parsedResult)) {
            return parsedResult.filter((item: any) =>
                typeof item === 'object' && item !== null &&
                ['legal_drafter', 'lawyer_finder', 'news_summarizer', 'case_strategist', 'notary_finder', 'web_analyzer', 'contract_analyzer', 'evidence_analyzer', 'image_generator', 'corporate_services', 'insurance_services', 'site_architect', 'content_hub', 'court_assistant', 'resume_analyzer', 'job_assistant'].includes(item.module)
            ) as IntentRoute[];
        }
        throw new Error("Received invalid data structure from AI.");
    } catch (error) {
        throwEnhancedError(error, 'Failed to route intent.');
    }
}

export interface ChatResponse {
    reply: string;
    suggestions: string[];
}

export async function generateChatResponse(history: ChatMessage[]): Promise<ChatResponse> {
    const ai = getAI();
    const systemInstruction = `You are 'Arman AI', a friendly and professional AI legal assistant for a notary public office in Iran. Your goal is to help users navigate legal topics and understand the services offered.
- Keep your responses concise, clear, and easy to understand for a non-lawyer.
- When asked about a service, briefly explain it and suggest which tool in the app (like 'AI Drafter' or 'Lawyer Finder') could help.
- After every response, you MUST provide three relevant, short, follow-up questions or actions the user might want to take next.
- Your entire output must be a single JSON object matching the requested schema. Do not add any text before or after the JSON.`;

    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            reply: { type: Type.STRING },
            suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
        required: ['reply', 'suggestions'],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "{}";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        const parsedResult = JSON.parse(cleanJson);

        if (typeof parsedResult.reply === 'string' && Array.isArray(parsedResult.suggestions)) {
            return parsedResult;
        }
        throw new Error("Received invalid data structure from AI for chat.");
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate chat response.');
    }
}

export async function analyzeContract(
    content: { file?: FilePart; text?: string },
    userQuery: string,
    promptTemplate: string,
    useThinkingMode: boolean
): Promise<string> {
    const ai = getAI();
    const model = 'gemini-2.0-flash';
    const config: any = {};

    const userQuestion = userQuery || 'سوال خاصی پرسیده نشده است.';
    let basePrompt = promptTemplate.replace('{userQuery}', userQuestion);

    const parts: any[] = [];
    if (content.file) {
        parts.push({ text: basePrompt });
        parts.push({ inlineData: { mimeType: content.file.mimeType, data: content.file.data } });
    } else if (content.text) {
        basePrompt += `\n\n${content.text}`;
        parts.push({ text: basePrompt });
    } else {
        throw new Error("No content provided to analyze.");
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts }],
            config,
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to analyze contract.');
    }
}

export async function analyzeImage(
    content: { file: FilePart },
    userQuery: string,
    promptTemplate: string,
    useThinkingMode: boolean
): Promise<string> {
    const ai = getAI();
    const model = 'gemini-2.0-flash';
    const config: any = {};

    const userQuestion = userQuery || 'Please analyze this image.';
    const prompt = promptTemplate.replace('{userQuery}', userQuestion);

    const parts = [
        { text: prompt },
        { inlineData: { mimeType: content.file.mimeType, data: content.file.data } }
    ];

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts }],
            config,
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to analyze image.');
    }
}

export async function extractTextFromImage(file: FilePart): Promise<string> {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const prompt = 'Extract all visible text from this document image. Present the text exactly as it appears, preserving formatting and paragraphs as best as possible. Do not add any commentary or explanation.';

    const parts = [
        { text: prompt },
        { inlineData: { mimeType: file.mimeType, data: file.data } }
    ];

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts }],
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to extract text from image.');
    }
}

export async function extractTextFromDocument(file: FilePart): Promise<string> {
    // This function handles PDF and Image text extraction using Gemini
    // For DOCX, we use Mammoth in the component, but this serves as a fallback or for PDFs.
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    const prompt = 'Extract all text from this document. Preserve the structure and content exactly as it is.';

    const parts = [
        { text: prompt },
        { inlineData: { mimeType: file.mimeType, data: file.data } }
    ];

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts }],
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to extract text from document.');
    }
}

export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    const ai = getAI();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio,
                outputMimeType: 'image/jpeg',
            },
        });
        
        const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64Image) {
            throw new Error("No image data found in API response.");
        }
        return base64Image;
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate image.');
    }
}

export async function generateText(prompt: string): Promise<string> {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text?.trim() || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate text response.');
    }
}

export async function generateJsonArray(prompt: string): Promise<string[]> {
    const ai = getAI();
    try {
        const responseSchema = {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "[]";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        const result = JSON.parse(cleanJson);

        if (Array.isArray(result)) {
            return result.filter((item): item is string => typeof item === 'string');
        }
        throw new Error("AI did not return a valid JSON array of strings.");
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate JSON array.');
    }
}

// --- CONTENT HUB FUNCTIONS ---

export async function fetchDailyTrends(language: string): Promise<DailyTrend[]> {
    const region = language === 'fa' ? 'Iran' : 'Global';
    const prompt = `Identify the top 5 trending topics in ${region} related to law, business, society, or technology for today.
    For each trend, provide a title, a short summary, and a unique content creation idea for a social media post.
    Return ONLY a JSON array of objects. Each object must have: "title", "summary", and "contentIdea".`;

    // Use search grounding
    const result = await performSearch(prompt, false);

    // Extract JSON from text
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("Failed to parse trends JSON", e);
        }
    }

    return [
        { title: "Trend Parsing Error", summary: "Could not parse trending data.", contentIdea: "Try refreshing." }
    ];
}

export async function generateSocialPost(topic: string, platform: string, language: string): Promise<GeneratedPost> {
    const prompt = `Write a highly engaging social media post for ${platform} about "${topic}".
    The language should be ${language === 'fa' ? 'Persian' : 'English'}.
    Include emojis and hashtags.
    ALSO, provide a detailed prompt for an image generator to create a visual for this post.
    Return ONLY a JSON object with keys: "text" (the post content) and "imagePrompt" (the description for image generation).`;

    try {
        const parsed = await callWithFallbackJSON<{ text: string; imagePrompt: string }>(prompt, 1000, 0.7);

        let imageUrl = '';
        if (parsed.imagePrompt) {
            try {
                const imageBase64 = await generateImage(parsed.imagePrompt, '1:1');
                imageUrl = `data:image/jpeg;base64,${imageBase64}`;
            } catch (e) {
                console.error("Failed to generate image for post", e);
            }
        }

        return {
            platform: platform as any,
            text: parsed.text,
            imageUrl: imageUrl
        };
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate social post.');
    }
}

export async function adaptPostForWebsite(postText: string, platform: string, language: string): Promise<{ title: string; content: string }> {
    const prompt = `Adapt the following ${platform} post into a full blog post or website article.
    Expand on the points, add a catchy title, and use Markdown formatting.
    Language: ${language === 'fa' ? 'Persian' : 'English'}.
    
    Original Post:
    "${postText}"
    
    Return ONLY a JSON object with "title" and "content" (markdown string).`;

    try {
        return await callWithFallbackJSON<{ title: string; content: string }>(prompt, 2000, 0.5);
    } catch (error) {
        throwEnhancedError(error, 'Failed to adapt post.');
    }
}

export async function generateVideoConcept(topic: string, platform: string, language: string): Promise<VideoScript> {
    const prompt = `Create a short video script (Reels/TikTok style) for ${platform} about "${topic}".
    Language: ${language === 'fa' ? 'Persian' : 'English'}.
    Return ONLY a JSON object with:
    "title": "Video title",
    "hook": "First 3 seconds",
    "body": "Main content",
    "callToAction": "Ending",
    "visualDescription": "What to show on screen"`;

    try {
        return await callWithFallbackJSON<VideoScript>(prompt, 1500, 0.7);
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate video concept.');
    }
}

export async function getPublishingStrategy(topic: string, platform: string, language: string): Promise<PublishingStrategy> {
    const prompt = `Provide a publishing strategy for a ${platform} post about "${topic}" in ${language === 'fa' ? 'Iran' : 'Global'}.
    Return JSON with: "bestTime", "reasoning", "algorithmTip", "nextPostIdea".`;

    try {
        return await callWithFallbackJSON<PublishingStrategy>(prompt, 1000, 0.5);
    } catch (error) {
        throwEnhancedError(error, 'Failed to get publishing strategy.');
    }
}

export async function findBestVideoTools(language: string): Promise<VideoTool[]> {
    const prompt = `Suggest 5 best AI video creation/editing tools suitable for ${language === 'fa' ? 'Persian users' : 'general users'}.
    Return JSON array with "name", "cost", "farsiSupport" (Yes/No/Partial), "features", "qualityRating" (1-10).`;

    try {
        return await callWithFallbackJSON<VideoTool[]>(prompt, 1500, 0.5);
    } catch (error) {
        throwEnhancedError(error, 'Failed to find video tools.');
    }
}

// --- INSTAGRAM ADMIN PRO FUNCTIONS ---

export async function generateInstagramReelScript(topic: string): Promise<InstagramReel> {
    const prompt = `Create a viral Instagram Reel script about "${topic}" optimized for 2025 algorithm (High Retention).
    Language: Persian.
    Must include:
    1. A hook in the first 3 seconds (visual/audio).
    2. Fast-paced scenes.
    3. Trending audio suggestion.
    4. Caption optimized for SEO and Saves.
    Return JSON with keys: title, hook_3sec, audio_suggestion, scenes (array of {time, visual, text_overlay}), caption_viral, hashtags_seo.`;

    try {
        return await callWithFallbackJSON<InstagramReel>(prompt, 1500, 0.7);
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate reel script.');
    }
}

export async function generateInstagramStoryBoard(topic: string): Promise<InstagramStory> {
    const prompt = `Create a 3-frame Instagram Story sequence about "${topic}" designed for engagement.
    Language: Persian.
    Frame 1: Hook/Question.
    Frame 2: Value/Insight.
    Frame 3: Call to Action (Link/DM).
    Suggest a specific interactive sticker (Poll, Quiz, Slider) for one frame.
    Return JSON with keys: frame_1, frame_2, frame_3, interactive_sticker.`;

    try {
        return await callWithFallbackJSON<InstagramStory>(prompt, 1000, 0.7);
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate story board.');
    }
}

export async function getInstagramGrowthPlan(profileType: string): Promise<InstagramGrowthPlan> {
    const prompt = `Generate an Instagram Organic Growth Strategy for 2025 for a "${profileType}" profile in Iran.
    Focus on:
    1. Profile Audit Checklist.
    2. Content Pillars for 2025 Algorithm (SEO, Saves, Shares).
    3. Hashtag & Keyword Strategy.
    4. Engagement Tactic (e.g., DM automation, community building).
    Return JSON with keys: profile_audit, content_strategy_2025, hashtags_strategy, engagement_tactic.`;

    try {
        return await callWithFallbackJSON<InstagramGrowthPlan>(prompt, 1500, 0.5);
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate growth plan.');
    }
}

// --- SPEECH GENERATION ---
export async function generateSpeech(text: string): Promise<void> {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // Example voice
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned.");
        }

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContext,
            24000,
            1
        );

        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNode);
        source.start();

    } catch (error) {
        throwEnhancedError(error, 'Failed to generate speech.');
    }
}

// --- COURT ASSISTANT FUNCTIONS ---

export async function findLegalCitations(text: string, file?: FilePart): Promise<LegalCitation[]> {
    const ai = getAI();
    // The prompt ensures output is a JSON array
    const prompt = `Read the text below. Identify specific Iranian legal articles (Civil Code, Penal Code, etc.) that support the arguments. Return JSON array: text_segment, law_name, article_number, relevance_explanation.
    
    Text: ${text}`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                text_segment: { type: Type.STRING },
                law_name: { type: Type.STRING },
                article_number: { type: Type.STRING },
                relevance_explanation: { type: Type.STRING },
            },
            required: ['text_segment', 'law_name', 'article_number', 'relevance_explanation'],
        },
    };

    const parts: any[] = [{ text: prompt }];
    if (file) {
        parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "[]";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        return JSON.parse(cleanJson);
    } catch (error) {
        throwEnhancedError(error, 'Failed to find citations.');
    }
}

export async function getCourtRebuttal(statement: string, promptTemplate: string, file?: FilePart, persona: string = 'neutral_judge'): Promise<CourtroomRebuttal> {
    const ai = getAI();
    const prompt = promptTemplate.replace('{statement}', statement).replace('{persona}', persona);

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            validity_status: { type: Type.STRING, enum: ['valid', 'invalid', 'debatable'] },
            analysis: { type: Type.STRING },
            relevant_law: { type: Type.STRING },
            suggested_rebuttal: { type: Type.STRING },
        },
        required: ['validity_status', 'analysis', 'relevant_law', 'suggested_rebuttal'],
    };

    const parts: any[] = [{ text: prompt }];
    if (file) {
        parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "{}";
        const cleanJson = jsonText.replace(/^```json\s*|```$/g, '');
        return JSON.parse(cleanJson);
    } catch (error) {
        throwEnhancedError(error, 'Failed to generate rebuttal.');
    }
}

// --- RESUME & JOB FUNCTIONS ---

export async function analyzeResume(resumeText: string, language: 'en' | 'fa'): Promise<ResumeAnalysisResult> {
    const ai = getAI();
    const criteriaJson = JSON.stringify(RESUME_ANALYSIS_CRITERIA.map(c => ({ id: c.id, requirement: c.requirement.en })));
    
    const prompt = `You are an expert Resume Analyst. Analyze the following resume text against these criteria: ${criteriaJson}.
    
    Resume Text:
    """
    ${resumeText}
    """
    
    Respond in ${language === 'fa' ? 'Persian (Farsi)' : 'English'}. The 'summaryAndRecommendations', 'predictedJobTitle', and 'evidence' fields must be in the target language.
    
    Output a JSON object with the following structure:
    {
      "overallScore": number (0-100),
      "predictedJobTitle": string (e.g., "Senior Software Engineer"),
      "summaryAndRecommendations": string (markdown format, summarizing strengths and giving concrete improvement tips),
      "analysis": [
        {
          "id": string (matching criteria id),
          "category": string (e.g., "Contact Info", "Experience"),
          "requirement": string (description of what was checked),
          "status": "present" | "missing" | "implicit",
          "evidence": string (short text snippet or explanation)
        },
        ...
      ]
    }`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            overallScore: { type: Type.NUMBER },
            predictedJobTitle: { type: Type.STRING },
            summaryAndRecommendations: { type: Type.STRING },
            analysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        category: { type: Type.STRING },
                        requirement: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ['present', 'missing', 'implicit'] },
                        evidence: { type: Type.STRING }
                    },
                    required: ['id', 'category', 'requirement', 'status', 'evidence']
                }
            }
        },
        required: ['overallScore', 'predictedJobTitle', 'summaryAndRecommendations', 'analysis']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "{}";
        return JSON.parse(jsonText.replace(/^```json\s*|```$/g, ''));
    } catch (error) {
        throwEnhancedError(error, 'Failed to analyze resume.');
    }
}

export async function generateImprovedResume(originalResume: string, analysis: ResumeAnalysisResult, chatHistory: ChatMessage[], language: 'en' | 'fa'): Promise<string> {
    const ai = getAI();
    const prompt = `You are an expert Resume Writer. Rewrite and improve the following resume based on the analysis provided and any additional context from the chat history.
    The output should be a professional, ATS-friendly Markdown document.
    Language: ${language === 'fa' ? 'Persian' : 'English'}.
    
    Original Resume:
    """${originalResume}"""
    
    Analysis Weaknesses:
    ${analysis.analysis.filter(i => i.status !== 'present').map(i => `- ${i.requirement}`).join('\n')}
    
    User Chat Context:
    ${chatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}
    
    Output ONLY the full Markdown content of the improved resume.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to improve resume.');
    }
}

export async function syncLinkedInProfile(url: string): Promise<string> {
    // In a real app, this would use a backend scraper or official API.
    // For this demo, we'll simulate it with a search-grounded request to Gemini 
    // to try and fetch public info, but warn it's not perfect.
    const ai = getAI();
    const prompt = `Find the public LinkedIn profile for this URL: ${url}. 
    Extract the full work experience, education, skills, and summary. 
    Format it as a clean text resume. If you cannot access it, write a template based on the URL name.`;

    const result = await performSearch(prompt, false);
    return result.text;
}

export async function suggestJobSearches(resumeText: string): Promise<JobSearchSuggestion[]> {
    const ai = getAI();
    const prompt = `Based on this resume, suggest 3 specific job titles to search for. For each, provide a short reasoning and 3-5 keywords.
    Resume: """${resumeText.substring(0, 2000)}..."""
    Return JSON array: jobTitle, reasoning, keywords (array of strings).`;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                jobTitle: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['jobTitle', 'reasoning', 'keywords']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text?.trim() || "[]";
        return JSON.parse(jsonText.replace(/^```json\s*|```$/g, ''));
    } catch (error) {
        throwEnhancedError(error, 'Failed to suggest jobs.');
    }
}

export async function scrapeJobDetails(url: string): Promise<JobDetails> {
    const ai = getAI();
    const prompt = `Analyze the job posting at this URL: ${url}.
    Extract: Title, Company Name, Full Description, and Required Skills.
    Return JSON: title, company, description, skills (array of strings).`;

    // Use search tool to "scrape" via Google cache/index
    const result = await performSearch(prompt, false);
    
    // The search result text might be natural language, we need to convert it to JSON
    // We'll use a second call to format it if performSearch returns text
    const formatPrompt = `Convert this text into a JSON object with keys: title, company, description, skills (array). Text: """${result.text}"""`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            description: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'company', 'description', 'skills']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: formatPrompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        const jsonText = response.text?.trim() || "{}";
        return JSON.parse(jsonText.replace(/^```json\s*|```$/g, ''));
    } catch (e) {
        // Fallback
        return {
            title: "Unknown Job",
            company: "Unknown Company",
            description: result.text,
            skills: []
        };
    }
}

export async function generateTailoredResume(jobDetails: JobDetails, userCv: string): Promise<string> {
    const ai = getAI();
    const prompt = `You are a professional resume writer. Tailor the following resume for the specific job description below.
    Highlight relevant skills and experience. Use strong action verbs. Output in Markdown.
    
    Job Details:
    Title: ${jobDetails.title} at ${jobDetails.company}
    Description: ${jobDetails.description}
    
    User Resume:
    """${userCv}"""`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to tailor resume.');
    }
}

export async function generateCoverLetter(jobDetails: JobDetails, userCv: string): Promise<string> {
    const ai = getAI();
    const prompt = `Write a compelling cover letter for the following job, based on the candidate's resume.
    Tone: Professional and enthusiastic.
    
    Job Details:
    Title: ${jobDetails.title} at ${jobDetails.company}
    Description: ${jobDetails.description}
    
    Candidate Resume:
    """${userCv}"""`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Failed to write cover letter.');
    }
}

export async function chatWithJobCoach(history: ChatMessage[], application: JobApplication): Promise<string> {
    const ai = getAI();
    const systemPrompt = `You are a career coach helping the user apply for the position of ${application.jobTitle} at ${application.company}.
    Context:
    - Job Description: ${application.jobDescription.substring(0, 500)}...
    - User Resume status: ${application.status}
    
    Answer the user's questions about interview prep, salary negotiation, or application tips specifically for this role. Keep answers concise.`;

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] }, // System context as first user msg
        ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }))
    ];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
        });
        return response.text || "";
    } catch (error) {
        throwEnhancedError(error, 'Job Coach chat failed.');
    }
}

function throwEnhancedError(error: any, context: string): never {
    console.error(`[AI Error] ${context}:`, error);
    let messageToParse = "";

    if (error instanceof Error) {
        messageToParse = error.message;
    } else if (typeof error === 'string') {
        messageToParse = error;
    } else if (typeof error === 'object' && error !== null) {
        messageToParse = JSON.stringify(error);
    }

    const lowerCaseMessage = messageToParse.toLowerCase();

    if (lowerCaseMessage.includes('api key') || lowerCaseMessage.includes('auth')) {
        throw new Error(`خطای اعتبار سنجی API. لطفا تنظیمات کلیدهای هوش مصنوعی را بررسی کنید. (${messageToParse})`);
    }

    if (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('limit')) {
        throw new Error('سهمیه استفاده از هوش مصنوعی به پایان رسیده است. لطفا لحظاتی دیگر تلاش کنید.');
    }

    throw new Error(`${context} (${messageToParse})`);
}

export async function sendWhatsAppApproval(appId: string, phone: string): Promise<void> {
    // Mock
    console.log(`Sending approval request for app ${appId} to ${phone}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export async function applyByEmail(appId: string, email: string): Promise<void> {
    // Mock
    console.log(`Sending application ${appId} to ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
}
