import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";
import { GroundingChunk, StrategyTask, IntentRoute, DraftPreparationResult, ChatMessage, FilePart, LatLng, DailyTrend, GeneratedPost, LegalCitation, CourtroomRebuttal, ResumeAnalysisResult, JobApplication } from '../types';

interface AIProvider {
    name: string;
    apiKey?: string;
    call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

// @ts-ignore
const POYO_API_KEY = (import.meta as any).env?.VITE_POYO_AI_API_KEY || (process as any).env?.POYO_AI_API_KEY || '';
// @ts-ignore
const PORTKEY_API_KEY = (import.meta as any).env?.VITE_PORTKEY_API_KEY || (process as any).env?.PORTKEY_API_KEY || '';
// @ts-ignore
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY || '';
// @ts-ignore
const OPENROUTER_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || (process as any).env?.OPENROUTER_API_KEY || '';

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
    if (!aiInstance) {
        const apiKey = GEMINI_API_KEY || null;
        if (!apiKey) return null;
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
};

const portkeyProvider: AIProvider = {
    name: 'Portkey',
    apiKey: PORTKEY_API_KEY,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const key = portkeyProvider.apiKey || PORTKEY_API_KEY;
        if (!key) throw new Error('Portkey API key not configured');
        try {
            // Determine provider based on model or default to google
            const provider = 'google'; 
            const response = await fetch('https://api.portkey.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-portkey-api-key': key,
                    'x-portkey-provider': provider
                },
                body: JSON.stringify({
                    model: 'gemini-1.5-flash',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: temperature
                })
            });
            if (!response.ok) throw new Error(`Portkey error: ${response.status}`);
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
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { maxOutputTokens: maxTokens, temperature: temperature }
        });
        return response.text || '';
    }
};

const poyoProvider: AIProvider = {
    name: 'PoyoAI',
    apiKey: POYO_API_KEY,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const key = poyoProvider.apiKey || POYO_API_KEY;
        if (!key) throw new Error('Poyo AI API key not configured');
        const client = new OpenAI({ apiKey: key, baseURL: 'https://api.poyo.ai/v1', dangerouslyAllowBrowser: true });
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });
        return response.choices[0]?.message?.content || '';
    }
};

const openRouterProvider: AIProvider = {
    name: 'OpenRouter',
    apiKey: OPENROUTER_API_KEY,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const key = openRouterProvider.apiKey || OPENROUTER_API_KEY;
        if (!key) throw new Error('OpenRouter API key not configured');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'HTTP-Referer': 'https://armanlawfirm.ir',
                'X-Title': 'Arman Law Firm'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1-0528:free',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature
            })
        });
        if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content || '';
    }
};

const allProviders: AIProvider[] = [poyoProvider, openRouterProvider, geminiProvider, portkeyProvider];

if (typeof window !== 'undefined') {
    try {
        const savedKeysStr = localStorage.getItem('arman-api-keys');
        if (savedKeysStr) {
            const savedKeys = JSON.parse(savedKeysStr);
            if (savedKeys.portkey) portkeyProvider.apiKey = savedKeys.portkey;
            if (savedKeys.poyo1) poyoProvider.apiKey = savedKeys.poyo1;
            if (savedKeys.openrouter1) openRouterProvider.apiKey = savedKeys.openrouter1;
        }
    } catch (e) {
        console.error("Error loading keys:", e);
    }
}

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    // We can use Portkey or Poyo vision if available, for now fallback to general call
    const prompt = "Please extract all text from this image and return it as a string.";
    return await callWithFallback(prompt); 
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return '';
  }
};

export async function callWithFallback(prompt: string, maxTokens: number = 1000, temperature: number = 0.5): Promise<string> {
    // Dynamically reorder based on verified working status if we had a persistent store, 
    // for now we follow the standard fallback order.
    for (const provider of allProviders) {
        try {
            console.log(`[AI] Trying ${provider.name}...`);
            const result = await provider.call(prompt, maxTokens, temperature);
            if (result) return result;
        } catch (e) {
            console.error(`${provider.name} failed, trying next...`);
        }
    }
    throw new Error('All AI services failed. Please check the API Test page.');
}

export async function* generateReportStream(prompt: string): AsyncGenerator<string, void, undefined> {
    const ai = getAI();
    if (!ai) {
        yield await callWithFallback(prompt, 2000, 0.7);
        return;
    }
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: [{ parts: [{ text: prompt }] }],
    });
    for await (const chunk of response) {
        if (chunk.text) yield chunk.text;
    }
}

export async function findLawyers(prompt: string, location?: LatLng | null): Promise<{ text: string; sources: GroundingChunk[] }> {
    const text = await callWithFallback(prompt);
    return { text, sources: [] };
}

export async function findNotaries(prompt: string, location?: LatLng | null): Promise<{ text: string; sources: GroundingChunk[] }> {
    const text = await callWithFallback(prompt);
    return { text, sources: [] };
}

export async function summarizeNews(prompt: string, useThinkingMode: boolean): Promise<{ text: string; sources: GroundingChunk[] }> {
    const text = await callWithFallback(prompt);
    return { text, sources: [] };
}

export async function analyzeWebPage(url: string, query: string, lang: string): Promise<{ text: string; sources: GroundingChunk[] }> {
    const text = await callWithFallback(`Analyze ${url}: ${query}`);
    return { text, sources: [] };
}

export async function analyzeSiteStructure(url: string, query: string, lang: string): Promise<{ text: string; sources: GroundingChunk[] }> {
    const text = await callWithFallback(`Analyze site structure ${url}: ${query}`);
    return { text, sources: [] };
}

export async function askGroundedQuestion(query: string): Promise<{ text: string; sources: GroundingChunk[] }> {
    const text = await callWithFallback(query);
    return { text, sources: [] };
}

export async function generateStrategy(goal: string, promptTemplate: string, useThinkingMode: boolean): Promise<StrategyTask[]> {
    const ai = getAI();
    const prompt = promptTemplate.replace('{goal}', goal);
    if (!ai) {
        const res = await callWithFallback(prompt + " Response must be valid JSON array of objects with taskName, description, effortPercentage, deliverableType, suggestedPrompt.");
        return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
}

export async function prepareDraftFromTask(task: StrategyTask, promptTemplate: string, docTypeOptions: string): Promise<DraftPreparationResult> {
    const prompt = promptTemplate.replace('{taskName}', task.taskName).replace('{description}', task.description).replace('{suggestedPrompt}', task.suggestedPrompt).replace('{docTypeOptions}', docTypeOptions);
    const res = await callWithFallback(prompt + " Response must be valid JSON object with docType, topic, description.");
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function routeUserIntent(goal: string, promptTemplate: string): Promise<IntentRoute[]> {
    const prompt = promptTemplate.replace('{goal}', goal);
    const res = await callWithFallback(prompt + " Response must be valid JSON array of objects with module, confidencePercentage, reasoning.");
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function analyzeContract(text: string, query: string, prompt: string): Promise<string> {
    return await callWithFallback(`${prompt}\n\nContract:\n${text}\n\nQuery: ${query}`);
}

export async function analyzeEvidence(files: FilePart[], query: string, prompt: string): Promise<string> {
    return await callWithFallback(`${prompt}\n\nQuery: ${query}`);
}

export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    return "https://via.placeholder.com/512?text=Image+Generation+Placeholder";
}

export async function generateText(prompt: string): Promise<string> {
    return await callWithFallback(prompt);
}

export async function fetchDailyTrends(lang: string): Promise<DailyTrend[]> {
    const res = await callWithFallback(`Generate daily legal trends for Iran in ${lang}. Return JSON array of objects with title, summary, contentIdea.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function generateSocialPost(topic: string, platform: string, lang: string): Promise<GeneratedPost> {
    const res = await callWithFallback(`Generate ${platform} post about ${topic} in ${lang}. Return JSON object with platform, text.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function adaptPostForWebsite(postText: string, platform: string, lang: string): Promise<{ title: string; content: string }> {
    const res = await callWithFallback(`Adapt this ${platform} post for a website article in ${lang}:\n${postText}\nReturn JSON object with title, content.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function findLegalCitations(text: string): Promise<LegalCitation[]> {
    const res = await callWithFallback(`Find legal citations for this text:\n${text}\nReturn JSON array of objects with text_segment, law_name, article_number, relevance_explanation.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function getCourtRebuttal(statement: string, prompt: string): Promise<CourtroomRebuttal> {
    const res = await callWithFallback(`${prompt}\n\nStatement: ${statement}\nReturn JSON object with validity_status, analysis, relevant_law, suggested_rebuttal.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function analyzeResume(resumeText: string, lang: string): Promise<ResumeAnalysisResult> {
    const res = await callWithFallback(`Analyze this resume in ${lang}:\n${resumeText}\nReturn JSON object with overallScore, predictedJobTitle, summaryAndRecommendations, analysis (array of items).`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
}

export async function generateChatResponse(history: ChatMessage[]): Promise<{ reply: string }> {
    const prompt = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const reply = await callWithFallback(prompt);
    return { reply };
}

export const getSuggestions = async (prompt: string): Promise<string[]> => {
    try {
        const res = await callWithFallback(`Based on the user's input: "${prompt}", provide 3-5 short, relevant follow-up questions or actions. Return as a JSON array of strings.`);
        const match = res.match(/\[.*\]/s);
        if (match) {
            return JSON.parse(match[0]);
        }
        return [];
    } catch (err) {
        console.error("Error getting suggestions:", err);
        return [];
    }
};
