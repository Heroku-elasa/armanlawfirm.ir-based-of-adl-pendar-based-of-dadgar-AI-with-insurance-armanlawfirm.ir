
import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { en, fa } from './constants';

// --- THEME & APPEARANCE SETUP ---
type Theme = 'light' | 'dark';

export interface ColorScheme {
    id: string;
    name: string;
    primary: string; // hex
    secondary: string; // hex
    accent?: string; // hex
}

export const THEME_PRESETS: ColorScheme[] = [
    { id: 'legal', name: 'Default Legal', primary: '#bef264', secondary: '#111827' }, // Lime-400, Gray-900
    { id: 'official', name: 'Official (SSAA)', primary: '#0891b2', secondary: '#334155' }, // Cyan-600, Slate-700
    { id: 'registry', name: 'Registry (Sabt)', primary: '#00897b', secondary: '#37474f' }, // Teal-600, BlueGrey-800
    { id: 'corporate', name: 'Corporate Trust', primary: '#60a5fa', secondary: '#1e3a8a' }, // Blue-400, Blue-900
    { id: 'justice', name: 'Crimson Justice', primary: '#fb7185', secondary: '#881337' }, // Rose-400, Rose-900
    { id: 'growth', name: 'Emerald Growth', primary: '#34d399', secondary: '#064e3b' }, // Emerald-400, Emerald-900
];

interface AppearanceContextType {
  theme: Theme;
  toggleTheme: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  customLogo: string;
  setCustomLogo: (url: string) => void;
  fastCacheEnabled: boolean;
  setFastCacheEnabled: (enabled: boolean) => void;
}

const AppearanceContext = createContext<AppearanceContextType | null>(null);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('dadgar-theme')) {
            return localStorage.getItem('dadgar-theme') as Theme;
        }
        return 'dark'; 
    });

    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('dadgar-color-scheme')) {
            try {
                return JSON.parse(localStorage.getItem('dadgar-color-scheme')!);
            } catch { return THEME_PRESETS[0]; }
        }
        return THEME_PRESETS[0];
    });

    const [customLogo, setCustomLogo] = useState<string>(() => {
        // Default to provided specific logo if local storage is empty
        return localStorage.getItem('dadgar-custom-logo') || "https://messages-prod.27c852f3500f38c1e7786e2c9ff9e48f.r2.cloudflarestorage.com/f0819c9a-22ad-4d4e-9a4b-d8c2ef893dd2/1764579575951-019ad922-8b89-702a-b810-c608609faa9e.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=c774f9d56a46165f86a9757e83c2bbc3%2F20251201%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251201T085936Z&X-Amz-Expires=3600&X-Amz-Signature=2de49acd6a4c990786b04ad5454ba37dbbe609a28a39e68561559591ae5dbbc8&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject";
    });

    const [fastCacheEnabled, setFastCacheEnabled] = useState<boolean>(() => {
        return localStorage.getItem('dadgar-fast-cache') !== 'false'; // Default true
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('dadgar-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('dadgar-color-scheme', JSON.stringify(colorScheme));
        localStorage.setItem('dadgar-custom-logo', customLogo);
        localStorage.setItem('dadgar-fast-cache', String(fastCacheEnabled));
    }, [colorScheme, customLogo, fastCacheEnabled]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return React.createElement(AppearanceContext.Provider, { 
        value: { 
            theme, 
            toggleTheme, 
            colorScheme, 
            setColorScheme, 
            customLogo, 
            setCustomLogo,
            fastCacheEnabled,
            setFastCacheEnabled
        } 
    }, children);
};

export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error("useAppearance must be used within an AppearanceProvider");
    return context;
};

// Keep compatibility for existing components using useTheme
export const useTheme = useAppearance;

// --- LANGUAGE & TRANSLATION SETUP ---
type Language = 'en' | 'fa';
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
}
const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fa');

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    const translations = language === 'fa' ? fa : en;
    let result: any = translations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }
    return result || key;
  }, [language]);

  return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

// --- TYPE DEFINITIONS ---
export type PageKey = 'dashboard' | 'legal_drafter' | 'lawyer_finder' | 'news_summarizer' | 'case_strategist' | 'notary_finder' | 'web_analyzer' | 'contract_analyzer' | 'evidence_analyzer' | 'image_generator' | 'corporate_services' | 'insurance_services' | 'site_architect' | 'external_service' | 'general_questions' | 'blog' | 'content_hub' | 'court_assistant' | 'pricing' | 'wp_dashboard' | 'faryadresi' | 'resume_analyzer' | 'job_assistant';

export interface LatLng {
  latitude: number;
  longitude: number;
}

// Type for auto-save status indicator
export type SaveStatus = 'idle' | 'saving' | 'saved';

// Type for a single chat message
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

// FIX: Added the missing FilePart interface, which is used for file uploads.
export interface FilePart {
  mimeType: string;
  data: string; // base64 encoded
}

// Interface for a lawyer profile from the AI search or in saved state
export interface Lawyer {
    name: string;
    specialty: string;
    city: string;
    contactInfo: string;
    address: string;
    website: string;
    websiteTitle: string;
    relevanceScore?: number;
    yearsOfExperience?: number;
    notes?: string;
}

// Interface for a Notary Public office
export interface Notary {
    officeName: string;
    city: string;
    address: string;
    contactInfo: string;
    website: string;
    websiteTitle: string;
    services?: string;
}

// Interface for a web or map source from Google Search grounding
export interface GroundingChunk {
  web?: { 
    uri: string; 
    title: string; 
  };
  maps?: {
    uri: string;
    title: string; 
  };
}

// Interface for a single task in the generated strategy
export interface StrategyTask {
  taskName: string;
  description: string;
  effortPercentage: number;
  deliverableType: string;
  suggestedPrompt: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

// Interface for a single AI-guided routing suggestion
export interface IntentRoute {
  module: PageKey;
  confidencePercentage: number;
  reasoning: string;
}

// Interface for the result of preparing a draft from a strategy task
export interface DraftPreparationResult {
  docType: string;
  topic: string;
  description: string;
}

// Interface for Event (Calendar)
export interface Event {
  id?: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  color: string;
  category: string;
}

// Interface for Blog Post
export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    date: string;
    author: string;
    category: string;
}

// --- CONTENT HUB TYPES ---
export interface DailyTrend {
  title: string;
  summary: string;
  contentIdea?: string;
}

export interface GeneratedPost {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  text: string;
  imageUrl?: string;
}

export interface VideoScene {
  timecode: string;
  visual: string;
  voiceover: string;
  emotion: string;
  audio_cues: string;
}

export interface VideoScript {
  title: string;
  hook: string;
  scenes: VideoScene[];
  cta: string;
  caption: string;
  hashtags: string[];
}

// New Types for Instagram Admin
export interface InstagramReel {
    title: string;
    hook_3sec: string;
    audio_suggestion: string;
    scenes: { time: string; visual: string; text_overlay: string }[];
    caption_viral: string;
    hashtags_seo: string[];
}

export interface InstagramStory {
    frame_1: string; // Hook
    frame_2: string; // Value/Engagement
    frame_3: string; // CTA
    interactive_sticker: string; // e.g., Poll: A or B
}

export interface InstagramGrowthPlan {
    profile_audit: string;
    content_strategy_2025: string;
    hashtags_strategy: string;
    engagement_tactic: string;
}

export interface PublishingStrategy {
  bestTime: string;
  reasoning: string;
  algorithmTip: string;
  nextPostIdea: string;
}

export interface VideoTool {
  name: string;
  cost: string;
  farsiSupport: string;
  features: string;
  qualityRating: string;
}

// --- COURT ASSISTANT TYPES ---
export interface LegalCitation {
    text_segment: string;
    law_name: string;
    article_number: string;
    relevance_explanation: string;
}

export interface CourtroomRebuttal {
    validity_status: 'valid' | 'invalid' | 'debatable';
    analysis: string;
    relevant_law: string;
    suggested_rebuttal: string;
}

export type CourtPersona = 'neutral_judge' | 'aggressive_lawyer' | 'wise_counselor' | 'detailed_analyst';

export interface ChatHistoryItem {
    id: string;
    role: 'user' | 'ai';
    content: string | CourtroomRebuttal;
    image?: string;
}

// --- RESUME & JOB TYPES ---
export type ResumeAnalysisStatus = 'present' | 'missing' | 'implicit' | 'pending' | 'done';

export interface ResumeAnalysisItem {
    id: string;
    category: string;
    requirement: string;
    status: ResumeAnalysisStatus;
    evidence?: string;
}

export interface ResumeAnalysisResult {
    overallScore: number;
    predictedJobTitle: string;
    summaryAndRecommendations: string;
    analysis: ResumeAnalysisItem[];
}

export interface JobSearchSuggestion {
    jobTitle: string;
    reasoning: string;
    keywords: string[];
}

export type JobApplicationStatus = 'draft' | 'pending_approval' | 'applying' | 'applied' | 'viewed' | 'interview_scheduled' | 'offer_received' | 'rejected' | 'error';

export interface JobApplication {
    id: string;
    jobTitle: string;
    company: string;
    jobUrl: string;
    status: JobApplicationStatus;
    cvText: string;
    jobDescription: string;
    tailoredResume: string;
    coverLetter: string;
    lastUpdated: number;
    appliedDate?: number;
    chatHistory: ChatMessage[];
}

export interface JobDetails {
    title: string;
    company: string;
    description: string;
    skills: string[];
}

// --- APP STATE & CHECKPOINT SETUP ---

// Interface for data to be auto-saved to localStorage
export interface AutoSaveData {
  topic: string;
  description: string;
  docType: string;
  lawyerFinderKeywords: string;
  notaryFinderKeywords: string;
  newsQuery: string;
  webAnalyzerUrl: string;
  webAnalyzerQuery: string;
  strategyGoal: string;
  aiGuidePrompt: string;
  contractAnalyzerQuery: string;
  initialContractText: string;
  evidenceAnalyzerQuery: string;
  imageGenPrompt: string;
  imageGenAspectRatio: string;
  corporateServices_nameQuery: string;
  corporateServices_articlesQuery: {
    name: string;
    type: string;
    activity: string;
    capital: string;
  };
  corporateServices_complianceQuery: string;
  insurance_policyQuery: string;
  insurance_initialPolicyText: string;
  insurance_claimQuery: {
    incidentType: string;
    description: string;
    policyNumber: string;
  };
  insurance_recommendationQuery: string;
  insurance_riskQuery: {
    assetType: string;
    description: string;
  };
  insurance_fraudQuery: {
    claimDescription: string;
  };
  insurance_autoClaimQuery: string;
  insurance_quoteQuery: {
    carModel: string;
    carYear: string;
    driverAge: string;
    drivingHistory: string;
  };
  insurance_lifeNeedsQuery: {
    age: string;
    income: string;
    dependents: string;
    debts: string;
    goals: string;
  };
  siteArchitectUrl: string;
  siteArchitectQuery: string;
  // Content Hub
  contentHub_generatedPost?: GeneratedPost | null;
  contentHub_adaptedPost?: { title: string; content: string } | null;
  // Court Assistant
  courtAssistant_draftText: string;
  // User Role Persistence
  userRole?: 'user' | 'admin';
  // Resume & Jobs
  resumeText?: string;
}

export interface AppState {
  page: 'home' | PageKey;
  userRole: 'user' | 'admin'; // NEW: Track current role
  document: string;
  form: {
    topic: string;
    description: string;
    docType: string;
  };
  lawyers: Lawyer[];
  allLawyers: Lawyer[];
  lawyerFinderKeywords: string;
  notaryFinderKeywords: string;
  foundNotaries: Notary[];
  newsQuery: string;
  newsSummary: string;
  newsSources: GroundingChunk[];
  strategyGoal: string;
  strategyResult: StrategyTask[];
  webAnalyzerUrl: string;
  webAnalyzerQuery: string;
  webAnalyzerResult: string;
  webAnalyzerSources: GroundingChunk[];
  aiGuidePrompt: string;
  aiGuideResults: IntentRoute[];
  contractAnalyzerQuery: string;
  contractAnalysis: string;
  initialContractText: string;
  evidenceAnalyzerQuery: string;
  evidenceAnalysisResult: string;
  imageGenPrompt: string;
  imageGenAspectRatio: string;
  generatedImage: string;
  corporateServices_nameQuery: string;
  corporateServices_generatedNames: string[];
  corporateServices_articlesQuery: {
    name: string;
    type: string;
    activity: string;
    capital: string;
  };
  corporateServices_generatedArticles: string;
  corporateServices_complianceQuery: string;
  corporateServices_complianceAnswer: string;
  insurance_policyQuery: string;
  insurance_policyAnalysis: string;
  insurance_initialPolicyText: string;
  insurance_claimQuery: {
    incidentType: string;
    description: string;
    policyNumber: string;
  };
  insurance_generatedClaim: string;
  insurance_recommendationQuery: string;
  insurance_recommendationAnswer: string;
  insurance_riskQuery: {
    assetType: string;
    description: string;
  };
  insurance_riskAssessmentResult: string;
  insurance_fraudQuery: {
    claimDescription: string;
  };
  insurance_fraudDetectionResult: string;
  insurance_autoClaimQuery: string;
  insurance_autoClaimResult: string;
  insurance_quoteQuery: {
    carModel: string;
    carYear: string;
    driverAge: string;
    drivingHistory: string;
  };
  insurance_quoteResult: string;
  insurance_lifeNeedsQuery: {
    age: string;
    income: string;
    dependents: string;
    debts: string;
    goals: string;
  };
  insurance_lifeNeedsResult: string;
  siteArchitectUrl: string;
  siteArchitectQuery: string;
  siteArchitectResult: string;
  siteArchitectSources: GroundingChunk[];
  generalQuestionsQuery: string;
  generalQuestionsAnswer: string;
  generalQuestionsSources: GroundingChunk[];
  // Content Hub State
  contentHub_trends: DailyTrend[] | null;
  contentHub_generatedPost: GeneratedPost | null;
  contentHub_adaptedPost: { title: string; content: string } | null;
  // Court Assistant
  courtAssistant_draftText: string;
  courtAssistant_citations: LegalCitation[];
  courtAssistant_rebuttal: CourtroomRebuttal | null;
  // Resume Analyzer
  resumeText: string;
  resumeAnalysisResult: ResumeAnalysisResult | null;
  resumeChatHistory: ChatMessage[];
  // Job Assistant
  jobApplications: JobApplication[];
  currentUserCv: string; // Shared CV for Job Assistant
}
export interface PricingPlan {
    title: string;
    price: string;
    oldPrice: string;
    features: string[];
}
export interface Checkpoint {
  id: string;
  timestamp: number;
  name: string;
  state: AppState;
}
