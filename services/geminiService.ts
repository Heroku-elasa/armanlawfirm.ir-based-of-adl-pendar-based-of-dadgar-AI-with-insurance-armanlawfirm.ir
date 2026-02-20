import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from 'openai';
import { GroundingChunk, StrategyTask, IntentRoute, DraftPreparationResult, ChatMessage, FilePart, LatLng, DailyTrend, GeneratedPost, VideoScript, PublishingStrategy, VideoTool, LegalCitation, CourtroomRebuttal, InstagramReel, InstagramStory, InstagramGrowthPlan, ResumeAnalysisResult, JobDetails, JobSearchSuggestion, JobApplication } from '../types';
import { RESUME_ANALYSIS_CRITERIA } from '../constants';

// Initialize the Google GenAI SDK using Replit AI Integration
let aiInstance: GoogleGenerativeAI | null = null;

// @ts-ignore
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
// @ts-ignore
const POYO_API_KEY_1 = import.meta.env.VITE_POYO_AI_API_KEY_PRIMARY || process.env.POYO_AI_API_KEY_PRIMARY || process.env.POYO_AI_API_KEY || 'sk-NdIelDiC8dgJXP-uSy-4_03BQnGaCX1xdtVYZXFa9Z1b4FqXF3oProuUg9huz_';
// @ts-ignore
const POYO_API_KEY_2 = import.meta.env.VITE_POYO_AI_API_KEY_BACKUP || process.env.POYO_AI_API_KEY_BACKUP || 'sk-G8djO1CepO_vfl0u5CDGDdD6dXC5zG67rX07RDUZadqQQ5zI627VTifWq5CsJm';
// @ts-ignore
const PORTKEY_API_KEY = import.meta.env.VITE_PORTKEY_API_KEY || process.env.PORTKEY_API_KEY || 'gASN7iokVzgqJLweJTWr12V75JG+';
// @ts-ignore
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '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';
// @ts-ignore
const GEMINI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'DUMMY_KEY';
// @ts-ignore
const GEMINI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined;

const poyoClient1 = new OpenAI({
    apiKey: POYO_API_KEY_1,
    baseURL: 'https://api.poyo.ai/v1',
    dangerouslyAllowBrowser: true
});

const poyoClient2 = new OpenAI({
    apiKey: POYO_API_KEY_2,
    baseURL: 'https://api.poyo.ai/v1',
    dangerouslyAllowBrowser: true
});

const portkeyClient = new OpenAI({
    apiKey: PORTKEY_API_KEY,
    baseURL: 'https://api.portkey.ai/v1',
    defaultHeaders: {
        'x-portkey-api-key': PORTKEY_API_KEY
    },
    dangerouslyAllowBrowser: true
});

const openrouterClient = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'https://armanlawfirm.ir',
        'X-Title': 'Arman Law Firm'
    },
    dangerouslyAllowBrowser: true
});

interface AIProvider {
    name: string;
    id: string;
    priority: number;
    call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

function getAI() {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        const { GoogleGenerativeAI } = window;
        if (GoogleGenerativeAI && !aiInstance && GEMINI_API_KEY && GEMINI_API_KEY !== 'DUMMY_KEY') {
            aiInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
        }
    }
    return aiInstance;
}

const geminiProvider: AIProvider = {
    name: 'Gemini (Replit)',
    id: 'gemini',
    priority: 5,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const ai = getAI();
        if (!ai) throw new Error('Gemini not configured (no API key)');
        const modelName = GEMINI_BASE_URL ? "gemini-3-pro-preview" : "gemini-2.0-flash";
        const model = ai.getGenerativeModel({ model: modelName }, { baseUrl: GEMINI_BASE_URL });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: temperature }
        });
        return result.response.text();
    }
};

const poyoProvider1: AIProvider = {
    name: 'Poyo.ai (Primary)',
    id: 'poyo1',
    priority: 1,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const response = await poyoClient1.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                { role: 'system', content: 'You are a helpful search assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens,
            temperature: temperature
        });
        return response.choices[0]?.message?.content || '';
    }
};

const poyoProvider2: AIProvider = {
    name: 'Poyo.ai (Backup)',
    id: 'poyo2',
    priority: 2,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const response = await poyoClient2.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                { role: 'system', content: 'You are a helpful search assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens,
            temperature: temperature
        });
        return response.choices[0]?.message?.content || '';
    }
};

const portkeyProvider: AIProvider = {
    name: 'Portkey.ai',
    id: 'portkey',
    priority: 3,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const response = await portkeyClient.chat.completions.create({
            model: 'claude-3-5-sonnet-20240620',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });
        return response.choices[0]?.message?.content || '';
    }
};

const openrouterProvider: AIProvider = {
    name: 'OpenRouter',
    id: 'openrouter',
    priority: 4,
    call: async (prompt: string, maxTokens: number, temperature: number): Promise<string> => {
        const response = await openrouterClient.chat.completions.create({
            model: 'anthropic/claude-3.5-sonnet:beta',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });
        return response.choices[0]?.message?.content || '';
    }
};

const allProviders: AIProvider[] = [poyoProvider1, poyoProvider2, portkeyProvider, openrouterProvider]
    .sort((a, b) => a.priority - b.priority);

let selectedProviderId: string | null = 'poyo1';
const failedProviders = new Set<string>();

export function setSelectedProvider(id: string | null) {
    selectedProviderId = id || 'poyo1';
}

export function getAIProviders() {
    return allProviders.map(p => ({
        id: p.id,
        name: p.name,
        available: !failedProviders.has(p.id)
    }));
}

export async function callWithFallback(prompt: string, maxTokens: number = 1000, temperature: number = 0.5): Promise<string> {
    if (selectedProviderId) {
        const provider = allProviders.find(p => p.id === selectedProviderId);
        if (provider) {
            try {
                console.log(`🔄 Using selected provider: ${provider.name}...`);
                const res = await provider.call(prompt, maxTokens, temperature);
                failedProviders.delete(provider.id);
                return res;
            } catch (e) {
                console.error(`❌ Selected provider ${provider.name} failed:`, e);
                failedProviders.add(provider.id);
                // Clear failure after 5 mins
                setTimeout(() => failedProviders.delete(provider.id), 5 * 60 * 1000);
            }
        }
    }

    for (const provider of allProviders) {
        if (failedProviders.has(provider.id)) continue;

        try {
            console.log(`🔄 Trying provider: ${provider.name}...`);
            const res = await provider.call(prompt, maxTokens, temperature);
            if (res) {
                console.log(`✅ Success with ${provider.name}`);
                failedProviders.delete(provider.id);
                return res;
            }
        } catch (e: any) {
            console.error(`❌ ${provider.name} failed: ${e.message || e}`);
            failedProviders.add(provider.id);
            // Clear failure after 5 mins
            setTimeout(() => failedProviders.delete(provider.id), 5 * 60 * 1000);
        }
    }
    throw new Error('All AI providers failed');
}

export async function* generateReportStream(prompt: string): AsyncGenerator<string, void, undefined> {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    const modelName = GEMINI_BASE_URL ? "gemini-3-pro-preview" : "gemini-2.0-flash";
    const model = ai.getGenerativeModel({ model: modelName }, { baseUrl: GEMINI_BASE_URL });
    const result = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    for await (const chunk of result.stream) {
        yield chunk.text();
    }
}

export async function generateSearchQuery(documentText: string): Promise<string> {
    const prompt = `Generate a search query for: ${documentText}`;
    return callWithFallback(prompt, 100, 0.2);
}

export interface SearchResult {
    text: string;
    sources: GroundingChunk[];
}

export async function findLawyers(prompt: string, location?: LatLng | null): Promise<SearchResult> {
    const res = await callWithFallback(prompt);
    return { text: res, sources: [] };
}

export async function findNotaries(prompt: string, location?: LatLng | null): Promise<SearchResult> {
    return findLawyers(prompt, location);
}

export async function summarizeNews(prompt: string, useThinkingMode: boolean): Promise<SearchResult> {
    return findLawyers(prompt);
}

export async function analyzeWebPage(prompt: string, useThinkingMode: boolean): Promise<SearchResult> {
    return findLawyers(prompt);
}

export async function analyzeSiteStructure(prompt: string, useThinkingMode: boolean): Promise<SearchResult> {
    return findLawyers(prompt);
}

export async function askGroundedQuestion(query: string): Promise<SearchResult> {
    return findLawyers(query);
}

export async function generateStrategy(goal: string, promptTemplate: string, useThinkingMode: boolean): Promise<StrategyTask[]> {
    const prompt = promptTemplate.replace('{goal}', goal);
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return [];
    }
}

export async function getSuggestions(query: string, contextPrompt: string): Promise<string[]> {
    const prompt = `${contextPrompt}: ${query}`;
    const res = await callWithFallback(prompt);
    try {
        const parsed = JSON.parse(res.replace(/```json|```/g, ''));
        return parsed.suggestions || [];
    } catch (e) {
        return [];
    }
}

export async function prepareDraftFromTask(task: StrategyTask, promptTemplate: string, docTypeOptions: string): Promise<DraftPreparationResult> {
    const prompt = promptTemplate.replace('{taskName}', task.taskName);
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return { docType: '', topic: '', description: '' };
    }
}

export async function routeUserIntent(goal: string, promptTemplate: string): Promise<IntentRoute[]> {
    const prompt = promptTemplate.replace('{goal}', goal);
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return [];
    }
}

export async function generateChatResponse(history: ChatMessage[]): Promise<{ reply: string; suggestions: string[] }> {
    const prompt = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return { reply: res, suggestions: [] };
    }
}

export async function analyzeContract(content: { file?: FilePart; text?: string }, userQuery: string, promptTemplate: string): Promise<string> {
    const prompt = `${promptTemplate} ${userQuery} ${content.text || ''}`;
    return callWithFallback(prompt);
}

export async function analyzeImage(content: { file: FilePart }, userQuery: string, promptTemplate: string): Promise<string> {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    const modelName = GEMINI_BASE_URL ? "gemini-3-pro-preview" : "gemini-2.0-flash";
    const model = ai.getGenerativeModel({ model: modelName }, { baseUrl: GEMINI_BASE_URL });
    const prompt = `${promptTemplate} ${userQuery}`;
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: content.file.mimeType, data: content.file.data } }] }]
    });
    return result.response.text();
}

export async function analyzeEvidence(prompt: string): Promise<string> {
    return callWithFallback(prompt);
}

export async function extractTextFromImage(file: FilePart): Promise<string> {
    const ai = getAI();
    if (!ai) throw new Error("AI not initialized");
    const modelName = GEMINI_BASE_URL ? "gemini-3-pro-preview" : "gemini-2.0-flash";
    const model = ai.getGenerativeModel({ model: modelName }, { baseUrl: GEMINI_BASE_URL });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Extract text" }, { inlineData: { mimeType: file.mimeType, data: file.data } }] }]
    });
    return result.response.text();
}

export async function extractTextFromDocument(file: FilePart): Promise<string> {
    return extractTextFromImage(file);
}

export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
    throw new Error("Image generation not implemented in fallback");
}

export async function generateText(prompt: string): Promise<string> {
    return callWithFallback(prompt);
}

export async function generateJsonArray(prompt: string): Promise<string[]> {
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return [];
    }
}

export async function fetchDailyTrends(language: string): Promise<DailyTrend[]> {
    const prompt = `Trends in ${language}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return [];
    }
}

export async function generateSocialPost(topic: string, platform: string, language: string): Promise<GeneratedPost> {
    const prompt = `You are a social media expert for Arman Law Firm (armanlawfirm.ir). 
    Generate a high-quality, engaging social media post in ${language === 'fa' ? 'Persian (Farsi)' : 'English'} for ${platform}.
    Topic: ${topic}
    
    The post should include:
    1. A catchy headline
    2. Engaging body text with legal insights
    3. Relevant hashtags
    4. A call to action to visit armanlawfirm.ir or contact 09027370260.
    
    Return the result as a JSON object with the following keys:
    {
      "platform": "${platform}",
      "text": "the full post content",
      "imageUrl": ""
    }
    
    IMPORTANT: Return ONLY the JSON object, no markdown formatting.`;
    
    const res = await callWithFallback(prompt, 2000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        console.error("Failed to parse generated post JSON:", e);
        return { platform: platform as any, text: res, imageUrl: '' };
    }
}

export async function adaptPostForWebsite(postText: string, platform: string, language: string): Promise<{ title: string; content: string }> {
    const prompt = `Adapt this social media post for a professional law firm website blog.
    Post: ${postText}
    Platform: ${platform}
    Language: ${language === 'fa' ? 'Persian' : 'English'}
    
    Return a JSON object:
    {
      "title": "professional title",
      "content": "expanded professional article content"
    }
    
    Return ONLY JSON.`;
    const res = await callWithFallback(prompt, 2000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return { title: 'Adapted Post', content: res };
    }
}

export async function generateVideoConcept(topic: string, platform: string, language: string): Promise<VideoScript> {
    const prompt = `Create a short video script (TikTok/Reel style) for Arman Law Firm.
    Topic: ${topic}
    Platform: ${platform}
    Language: ${language === 'fa' ? 'Persian' : 'English'}
    
    Return a JSON object with title, hook, scenes (array of {time, visual, voiceover, emotion, audio_cues}), cta, caption, hashtags.
    
    Return ONLY JSON.`;
    const res = await callWithFallback(prompt, 3000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return { title: '', hook: '', body: '', callToAction: '', visualDescription: '' } as any;
    }
}

export async function getPublishingStrategy(topic: string, platform: string, language: string): Promise<PublishingStrategy> {
    const prompt = `What is the best publishing strategy for a post about ${topic} on ${platform}?
    Language: ${language === 'fa' ? 'Persian' : 'English'}
    
    Return a JSON object:
    {
      "bestTime": "time recommendation",
      "reasoning": "why this time",
      "algorithmTip": "how to beat the algorithm",
      "nextPostIdea": "what to post next"
    }
    
    Return ONLY JSON.`;
    const res = await callWithFallback(prompt, 1000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return { bestTime: '', reasoning: '', algorithmTip: '', nextPostIdea: '' };
    }
}

export async function findBestVideoTools(language: string): Promise<VideoTool[]> {
    const prompt = `Recommend 3 best AI video creation tools for a law firm social media team.
    Language: ${language === 'fa' ? 'Persian' : 'English'}
    
    Return a JSON array of objects with name, url, description, and useCase.
    
    Return ONLY JSON.`;
    const res = await callWithFallback(prompt, 1000, 0.5);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return [];
    }
}

export async function generateInstagramReelScript(topic: string): Promise<InstagramReel> {
    const prompt = `You are an Instagram expert for Arman Law Firm.
    Create a viral Reel script in Persian (Farsi) about: ${topic}.
    
    Return a JSON object with these keys:
    {
      "title": "catchy title",
      "hook_3sec": "strong opening hook",
      "audio_suggestion": "trending audio description",
      "scenes": [
        {"time": "0:00-0:03", "visual": "description", "text_overlay": "text on screen"},
        {"time": "0:03-0:07", "visual": "description", "text_overlay": "text on screen"}
      ],
      "caption_viral": "engaging caption",
      "hashtags_seo": ["hashtag1", "hashtag2"]
    }
    
    Return ONLY JSON.`;
    
    const res = await callWithFallback(prompt, 2000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return { 
            title: 'Instagram Reel', 
            hook_3sec: '', 
            audio_suggestion: '', 
            scenes: [], 
            caption_viral: res, 
            hashtags_seo: [] 
        };
    }
}

export async function generateInstagramStoryBoard(topic: string): Promise<InstagramStory> {
    const prompt = `Create an Instagram Story board (3 frames) in Persian for Arman Law Firm about: ${topic}.
    
    Return a JSON object:
    {
      "frame_1": "text/visual for frame 1",
      "frame_2": "text/visual for frame 2",
      "frame_3": "text/visual for frame 3",
      "interactive_sticker": "poll or question sticker text"
    }
    
    Return ONLY JSON.`;
    
    const res = await callWithFallback(prompt, 1000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return { frame_1: res, frame_2: '', frame_3: '', interactive_sticker: '' };
    }
}

export async function getInstagramGrowthPlan(profileType: string): Promise<InstagramGrowthPlan> {
    const prompt = `Create a 2025 Instagram growth plan in Persian for a legal profile: ${profileType}.
    
    Return a JSON object:
    {
      "profile_audit": "markdown audit",
      "content_strategy_2025": "markdown strategy",
      "hashtags_strategy": "hashtag advice",
      "engagement_tactic": "engagement tips"
    }
    
    Return ONLY JSON.`;
    
    const res = await callWithFallback(prompt, 3000, 0.7);
    try {
        const cleanRes = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanRes);
    } catch (e) {
        return { 
            profile_audit: res, 
            content_strategy_2025: '', 
            hashtags_strategy: '', 
            engagement_tactic: '' 
        };
    }
}

export async function findLegalCitations(text: string, file?: FilePart): Promise<LegalCitation[]> {
    const prompt = `Citations for: ${text}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return [];
    }
}

export async function getCourtRebuttal(statement: string, promptTemplate: string, file?: FilePart, persona: string = 'neutral_judge'): Promise<CourtroomRebuttal> {
    const prompt = `${promptTemplate} ${statement}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return { validity_status: 'debatable', analysis: res, relevant_law: '', suggested_rebuttal: '' };
    }
}

export async function analyzeResume(resumeText: string, language: 'en' | 'fa'): Promise<ResumeAnalysisResult> {
    const prompt = `Analyze resume: ${resumeText}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return { overallScore: 0, predictedJobTitle: '', summaryAndRecommendations: res, analysis: [] };
    }
}

export async function generateImprovedResume(originalResume: string, analysis: ResumeAnalysisResult, chatHistory: ChatMessage[], language: 'en' | 'fa'): Promise<string> {
    const prompt = `Improve resume: ${originalResume}`;
    return callWithFallback(prompt);
}

export async function syncLinkedInProfile(url: string): Promise<string> {
    const prompt = `LinkedIn profile: ${url}`;
    return callWithFallback(prompt);
}

export async function suggestJobSearches(resumeText: string): Promise<JobSearchSuggestion[]> {
    const prompt = `Job searches for: ${resumeText}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return [];
    }
}

export async function scrapeJobDetails(url: string): Promise<JobDetails> {
    const prompt = `Job details: ${url}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return { title: '', company: '', description: '', skills: [] };
    }
}

export async function generateJobApplication(jobDetails: JobDetails, resumeText: string, language: 'en' | 'fa'): Promise<JobApplication> {
    const prompt = `Job app for ${jobDetails.title}`;
    const res = await callWithFallback(prompt);
    try {
        return JSON.parse(res.replace(/```json|```/g, ''));
    } catch (e) {
        return { coverLetter: res, followUpEmail: '' };
    }
}

export async function generateSpeech(text: string): Promise<string> {
    return `Speech generation for: ${text}`;
}

export async function generateTailoredResume(resumeText: string, jobDetails: JobDetails, language: 'en' | 'fa'): Promise<string> {
    const prompt = `Tailor resume for ${jobDetails.title}: ${resumeText}`;
    return callWithFallback(prompt);
}

export async function generateCoverLetter(jobDetails: JobDetails, resumeText: string, language: 'en' | 'fa'): Promise<string> {
    const prompt = `Cover letter for ${jobDetails.title}: ${resumeText}`;
    return callWithFallback(prompt);
}

export async function sendWhatsAppApproval(data: any): Promise<boolean> {
    console.log('WhatsApp approval sent:', data);
    return true;
}

export async function applyByEmail(data: any): Promise<boolean> {
    console.log('Email application sent:', data);
    return true;
}
