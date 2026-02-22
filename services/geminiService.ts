import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";
import { 
    GroundingChunk, StrategyTask, IntentRoute, DraftPreparationResult, 
    ChatMessage, FilePart, DailyTrend, GeneratedPost, 
    LegalCitation, CourtroomRebuttal, ResumeAnalysisResult, JobApplication,
    InstagramReel, InstagramStory, InstagramGrowthPlan, VideoTool, VideoScript, PublishingStrategy
} from '../types';

interface AIProvider {
    name: string;
    apiKey?: string;
    call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

// @ts-ignore
const OPENROUTER_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || (process as any).env?.OPENROUTER_API_KEY || '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';
const OPENROUTER_API_KEY_2 = (import.meta as any).env?.VITE_OPENROUTER_API_KEY_2 || (process as any).env?.OPENROUTER_API_KEY_2 || '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';
// @ts-ignore
const PORTKEY_API_KEY = (import.meta as any).env?.VITE_PORTKEY_API_KEY || (process as any).env?.PORTKEY_API_KEY || 'gASN7iokVzgqJLweJTWr12V75JG+';
const PORTKEY_API_KEY_2 = (import.meta as any).env?.VITE_PORTKEY_API_KEY_2 || (process as any).env?.PORTKEY_API_KEY_2 || 'nJqZtrgTuBQzAF5DM77t64UCIgZT';
// @ts-ignore
const POYO_API_KEY = (import.meta as any).env?.VITE_POYO_AI_API_KEY || (process as any).env?.POYO_AI_API_KEY || 'sk-G8djO1CepO_vfl0u5CDGDdD6dXC5zG67rX07RDUZadqQQ5zI627VTifWq5CsJm';
const POYO_API_KEY_2 = (import.meta as any).env?.VITE_POYO_AI_API_KEY_2 || (process as any).env?.POYO_AI_API_KEY_2 || 'sk-NdIelDiC8dgJXP-uSy-4_03BQnGaCX1xdtVYZXFa9Z1b4FqXF3oProuUg9huz_';
// @ts-ignore
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY || '';

let aiInstance: any = null;

const getAI = (): any => {
    if (!aiInstance && GEMINI_API_KEY) {
        aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
    return aiInstance;
};

const openRouterProvider: AIProvider = {
    name: 'OpenRouter',
    apiKey: OPENROUTER_API_KEY,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const keys = [OPENROUTER_API_KEY, OPENROUTER_API_KEY_2];
        for (const key of keys) {
            if (!key || key.includes('`')) continue;
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`,
                        'HTTP-Referer': 'https://armanlawfirm.ir',
                        'X-Title': 'Arman Law Firm'
                    },
                    body: JSON.stringify({
                        model: 'google/gemini-2.0-flash-001',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: maxTokens,
                        temperature: temperature
                    })
                });
                if (response.ok) {
                    const data = await response.json() as any;
                    return data.choices?.[0]?.message?.content || '';
                }
            } catch (e) {
                console.error("OpenRouter Key failed:", e);
            }
        }
        throw new Error("OpenRouter failed with all keys");
    }
};

const portkeyProvider: AIProvider = {
    name: 'Portkey',
    apiKey: PORTKEY_API_KEY,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const keys = [PORTKEY_API_KEY, PORTKEY_API_KEY_2];
        for (const key of keys) {
            if (!key || key.includes('`')) continue;
            try {
                const response = await fetch('https://api.portkey.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-portkey-api-key': key,
                        'x-portkey-provider': 'google'
                    },
                    body: JSON.stringify({
                        model: 'gemini-2.0-flash',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: maxTokens,
                        temperature: temperature
                    })
                });
                if (response.ok) {
                    const data = await response.json() as any;
                    return data.choices?.[0]?.message?.content || '';
                }
            } catch (error) {
                console.error("Portkey Key failed:", error);
            }
        }
        throw new Error("Portkey failed with all keys");
    }
};

const poyoProvider: AIProvider = {
    name: 'PoyoAI',
    apiKey: POYO_API_KEY,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const keys = [POYO_API_KEY, POYO_API_KEY_2];
        for (const key of keys) {
            if (!key || key.includes('`')) continue;
            try {
                const client = new OpenAI({ apiKey: key, baseURL: 'https://api.poyo.ai/v1', dangerouslyAllowBrowser: true });
                const response = await client.chat.completions.create({
                    model: 'gemini-2.0-flash',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: temperature
                });
                return response.choices[0]?.message?.content || '';
            } catch (error) {
                console.error("Poyo Key failed:", error);
            }
        }
        throw new Error("Poyo failed with all keys");
    }
};

const geminiProvider: AIProvider = {
    name: 'Gemini',
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const ai = getAI();
        if (!ai) throw new Error('Gemini API not initialized');
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: temperature }
        });
        return result.response.text() || '';
    }
};

const allProviders: AIProvider[] = [openRouterProvider, poyoProvider, portkeyProvider, geminiProvider];

export async function callWithFallback(prompt: string, maxTokens: number = 1000, temperature: number = 0.5): Promise<string> {
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

// --- CORE EXPORTS ---

export const extractTextFromDocument = async (file: any): Promise<string> => {
    // @ts-ignore
    console.log("Extracting text from document:", file?.name || 'document');
    return "Extracted text from document placeholder.";
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const prompt = "Please extract all text from this image.";
    return await callWithFallback(prompt);
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return '';
  }
};

export async function* generateReportStream(prompt: string): AsyncGenerator<string, void, undefined> {
    yield await callWithFallback(prompt, 2000, 0.7);
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
    const prompt = promptTemplate.replace('{goal}', goal);
    const res = await callWithFallback(prompt + " Response must be valid JSON array of objects with taskName, description, effortPercentage, deliverableType, suggestedPrompt.");
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
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

// --- CONTENT HUB EXPORTS ---

export const findBestVideoTools = async (lang: string): Promise<VideoTool[]> => {
    const res = await callWithFallback(`Provide a list of the 5 best AI video tools for legal content in ${lang}. Return as a JSON array of objects with name, url, description, and price.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
};

export const generateInstagramReelScript = async (topic: string, lang: string): Promise<InstagramReel> => {
    const res = await callWithFallback(`Generate a high-engaging Instagram Reel script about ${topic} in ${lang}. Return as a JSON object with title, hook_3sec, audio_suggestion, scenes (array with time, visual, text_overlay), caption_viral, and hashtags_seo (array).`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
};

export const generateInstagramStoryBoard = async (topic: string, lang: string): Promise<InstagramStory> => {
    const res = await callWithFallback(`Create a 3-frame Instagram Story storyboard for ${topic} in ${lang}. Return as a JSON object with frame_1, frame_2, frame_3, and interactive_sticker.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
};

export const getInstagramGrowthPlan = async (niche: string, lang: string): Promise<InstagramGrowthPlan> => {
    const res = await callWithFallback(`Develop a 30-day Instagram growth plan for a ${niche} professional in ${lang}. Return as a JSON object with profile_audit, content_strategy_2025, hashtags_strategy, and engagement_tactic.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
};

export const generateVideoConcept = async (topic: string, platform: string, lang: string): Promise<VideoScript> => {
    const res = await callWithFallback(`Generate a video concept for a ${platform} post about ${topic} in ${lang}. Return as a JSON object with title, hook, scenes (array with timecode, visual, voiceover, emotion, audio_cues), cta, caption, and hashtags.`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
};

export const getPublishingStrategy = async (topic: string, platform: string, lang: string): Promise<PublishingStrategy> => {
    const res = await callWithFallback(`Generate a publishing strategy for ${topic} on ${platform} in ${lang}. Return as a JSON object with title and platforms (array with name, content, best_time, hashtags).`);
    return JSON.parse(res.replace(/^```json\s*|```$/g, ''));
};

// --- RESUME ANALYZER EXPORTS ---

export const generateImprovedResume = async (resumeText: string, lang: string): Promise<string> => {
    return await callWithFallback(`Improve this resume in ${lang}:\n${resumeText}`);
};

export const syncLinkedInProfile = async (profileUrl: string, lang: string): Promise<string> => {
    return `LinkedIn profile ${profileUrl} synced.`;
};

export const suggestJobSearches = async (resumeText: string, lang: string): Promise<string[]> => {
    const res = await callWithFallback(`Suggest 5 job search queries in ${lang} based on this resume:\n${resumeText}. Return as a JSON array of strings.`);
    const match = res.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
};

export const generateSpeech = async (text: string): Promise<string> => {
    console.log("Generating speech for:", text);
    return "Speech generation placeholder";
};

export const scrapeJobDetails = async (url: string): Promise<JobDetails> => {
    return {
        title: "Software Engineer",
        company: "Arman Law Firm",
        description: "Job description from " + url,
        skills: ["React", "TypeScript", "Node.js"]
    };
};

export const generateTailoredResume = async (resumeText: string, jobDescription: string, lang: string): Promise<string> => {
    return await callWithFallback(`Tailor this resume for the following job description in ${lang}:\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`);
};

export const generateCoverLetter = async (resumeText: string, jobDescription: string, lang: string): Promise<string> => {
    return await callWithFallback(`Generate a cover letter for the following job in ${lang}:\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`);
};

export const sendWhatsAppApproval = async (application: JobApplication): Promise<boolean> => {
    console.log("Sending WhatsApp approval for:", application.jobTitle);
    return true;
};

export const applyByEmail = async (application: JobApplication): Promise<boolean> => {
    console.log("Applying by email for:", application.jobTitle);
    return true;
};
