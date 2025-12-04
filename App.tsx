
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { nanoid } from 'nanoid';

// Component Imports
import SiteHeader from './components/Header';
import SiteFooter from './components/Footer';
import HomePage from './components/Hero';
import LegalDrafter from './components/LegalDrafter';
import LawyerFinder from './components/LawyerFinder';
import NewsSummarizer from './components/NewsSummarizer';
import CaseStrategist from './components/CaseStrategist';
import NotaryFinder from './components/NotaryFinder';
import WebAnalyzer from './components/WebAnalyzer';
import ContractAnalyzer from './components/ContractAnalyzer';
import EvidenceAnalyzer from './components/EvidenceAnalyzer';
import ImageGenerator from './components/ImageGenerator';
import CorporateServices from './components/CorporateServices';
import InsuranceServices from './components/InsuranceServices';
import SiteArchitect from './components/SiteArchitect';
import ExternalService from './components/ExternalService';
import GeneralQuestions from './components/GeneralQuestions';
import Blog from './components/Blog';
import ContentHubPage from './components/ContentHubPage';
import CourtAssistant from './components/CourtAssistant'; 
import PricingPage from './components/PricingPage';
import Dashboard from './components/Dashboard'; 
import AdminDashboard from './components/AdminDashboard'; 
import WordPressDashboard from './components/WordPressDashboard';
import FaryadresiPage from './components/FaryadresiPage';
import AIGuideModal from './components/AIGuideModal';
import QuotaErrorModal from './components/QuotaErrorModal';
import Chatbot from './components/Chatbot';
import SettingsModal from './components/SettingsModal';
import { ToastProvider } from './components/Toast';
import BookingModal from './components/BookingModal'; 
import DonationModal from './components/DonationModal'; 
import ResumeAnalyzer from './components/ResumeAnalyzer';
import JobAssistant from './components/JobAssistant';
import LoginModal from './components/LoginModal';

// Type and Service Imports
import { AppState, Checkpoint, PageKey, SaveStatus, useLanguage, Lawyer, Notary, GroundingChunk, StrategyTask, IntentRoute, FilePart, DraftPreparationResult, AutoSaveData, LatLng, useAppearance, LegalCitation, CourtroomRebuttal, ChatMessage, ResumeAnalysisResult, JobApplication } from './types';
import * as geminiService from './services/geminiService';
import * as dbService from './services/dbService';
import { supabase } from './services/supabaseClient';
import { FastCache } from './services/cacheService';
import { REPORT_TYPES } from './constants';

const LOCAL_STORAGE_KEY = 'dadgar-ai-autosave';
const CHECKPOINTS_STORAGE_KEY = 'dadgar-ai-checkpoints';

const initialState: AppState = {
  page: 'home',
  userRole: 'user', 
  document: '',
  form: {
    topic: '',
    description: '',
    docType: REPORT_TYPES[0].value,
  },
  lawyers: [],
  allLawyers: [],
  lawyerFinderKeywords: '',
  notaryFinderKeywords: '',
  foundNotaries: [],
  newsQuery: '',
  newsSummary: '',
  newsSources: [],
  strategyGoal: '',
  strategyResult: [],
  webAnalyzerUrl: '',
  webAnalyzerQuery: '',
  webAnalyzerResult: '',
  webAnalyzerSources: [],
  aiGuidePrompt: '',
  aiGuideResults: [],
  contractAnalyzerQuery: '',
  contractAnalysis: '',
  initialContractText: '',
  evidenceAnalyzerQuery: '',
  evidenceAnalysisResult: '',
  imageGenPrompt: '',
  imageGenAspectRatio: '1:1',
  generatedImage: '',
  corporateServices_nameQuery: '',
  corporateServices_generatedNames: [],
  corporateServices_articlesQuery: {
    name: '',
    type: 'llc',
    activity: '',
    capital: '',
  },
  corporateServices_generatedArticles: '',
  corporateServices_complianceQuery: '',
  corporateServices_complianceAnswer: '',
  insurance_policyQuery: '',
  insurance_policyAnalysis: '',
  insurance_initialPolicyText: '',
  insurance_claimQuery: {
    incidentType: '',
    description: '',
    policyNumber: '',
  },
  insurance_generatedClaim: '',
  insurance_recommendationQuery: '',
  insurance_recommendationAnswer: '',
  insurance_riskQuery: {
    assetType: '',
    description: '',
  },
  insurance_riskAssessmentResult: '',
  insurance_fraudQuery: {
    claimDescription: '',
  },
  insurance_fraudDetectionResult: '',
  insurance_autoClaimQuery: '',
  insurance_autoClaimResult: '',
  insurance_quoteQuery: {
    carModel: '',
    carYear: '',
    driverAge: '',
    drivingHistory: '',
  },
  insurance_quoteResult: '',
  insurance_lifeNeedsQuery: {
    age: '',
    income: '',
    dependents: '',
    debts: '',
    goals: '',
  },
  insurance_lifeNeedsResult: '',
  siteArchitectUrl: '',
  siteArchitectQuery: '',
  siteArchitectResult: '',
  siteArchitectSources: [],
  generalQuestionsQuery: '',
  generalQuestionsAnswer: '',
  generalQuestionsSources: [],
  contentHub_trends: null,
  contentHub_generatedPost: null,
  contentHub_adaptedPost: null,
  courtAssistant_draftText: '',
  courtAssistant_citations: [],
  courtAssistant_rebuttal: null,
  resumeText: '',
  resumeAnalysisResult: null,
  resumeChatHistory: [],
  jobApplications: [],
  currentUserCv: '',
};

// Helper to convert hex to RGB
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
}

const App: React.FC = () => {
  const { t, language } = useLanguage();
  const { colorScheme, fastCacheEnabled } = useAppearance(); 
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiError, setIsApiError] = useState<string | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isBookingOpen, setIsBookingOpen] = useState(false); 
  const [isDonationOpen, setIsDonationOpen] = useState(false); 
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [savedLawyers, setSavedLawyers] = useState<Lawyer[]>(() => {
      const saved = localStorage.getItem('dadgar-saved-lawyers');
      return saved ? JSON.parse(saved) : [];
  });

  const checkUserRole = (email: string | undefined): 'user' | 'admin' => {
      return email === 'admin@armanlawfirm.ir' ? 'admin' : 'user';
  };

  // SEO: Update Page Title
  useEffect(() => {
    const titles: Record<string, string> = {
      home: 'Arman Law Firm | دستیار هوشمند حقوقی',
      legal_drafter: 'تنظیم دادخواست هوشمند | Arman Law Firm',
      lawyer_finder: 'جستجوی وکیل پایه یک | Arman Law Firm',
      court_assistant: 'دستیار هوشمند دادگاه | Arman Law Firm',
      pricing: 'تعرفه‌ها و خدمات | Arman Law Firm',
      blog: 'مجله حقوقی آرمان',
      dashboard: 'داشبورد کاربری | Arman Law Firm',
      contact: 'تماس با ما | Arman Law Firm'
    };
    
    document.title = titles[state.page] || 'Arman Law Firm | خدمات حقوقی آنلاین';
  }, [state.page]);

  // Check Auth Status on Load & Listen for Changes (e.g. Email Link Redirect)
  useEffect(() => {
      // Initial Session Check
      supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          if (session?.user) {
              const role = checkUserRole(session.user.email);
              setState(produce(draft => { draft.userRole = role; }));
          }
      });

      // Listen for auth changes (Login, Logout, OAuth redirect, Magic Link)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
              const role = checkUserRole(session.user.email);
              setState(produce(draft => { draft.userRole = role; }));
          } else {
              // Reset role to user on logout
              setState(produce(draft => { draft.userRole = 'user'; }));
          }
          
          // If we just logged in via a hash URL (magic link), clean the URL
          if (session?.user && window.location.hash.includes('access_token')) {
              window.history.replaceState(null, '', window.location.pathname);
          }
      });

      return () => subscription.unsubscribe();
  }, []);

  const handleSaveLawyer = (lawyer: Lawyer) => {
      const updated = [...savedLawyers, lawyer];
      setSavedLawyers(updated);
      localStorage.setItem('dadgar-saved-lawyers', JSON.stringify(updated));
  };

  const handleRemoveLawyer = (lawyer: Lawyer) => {
      const updated = savedLawyers.filter(l => l.website !== lawyer.website);
      setSavedLawyers(updated);
      localStorage.setItem('dadgar-saved-lawyers', JSON.stringify(updated));
  };

  const handleClearSavedLawyers = () => {
      setSavedLawyers([]);
      localStorage.removeItem('dadgar-saved-lawyers');
  };

  const handleNoteChange = (index: number, note: string) => {
      const updated = produce(savedLawyers, draft => {
          draft[index].notes = note;
      });
      setSavedLawyers(updated);
      localStorage.setItem('dadgar-saved-lawyers', JSON.stringify(updated));
  };
  
  const preparedSearchQueryRef = useRef<{ for: 'lawyer_finder' | 'notary_finder' | null; query: string }>({ for: null, query: '' });
  const [preparedSearchQuery, setPreparedSearchQuery] = useState(preparedSearchQueryRef.current);

  const saveTimeout = useRef<number | null>(null);

  useEffect(() => {
      const root = document.documentElement;
      const primaryRgb = hexToRgb(colorScheme.primary);
      const secondaryRgb = hexToRgb(colorScheme.secondary);
      
      if (primaryRgb) root.style.setProperty('--brand-gold', primaryRgb); 
      if (secondaryRgb) root.style.setProperty('--brand-blue', secondaryRgb); 
      
      FastCache.setEnabled(fastCacheEnabled);
  }, [colorScheme, fastCacheEnabled]);

  const handleApiError = useCallback((err: unknown): string => {
    const error = err instanceof Error ? err : new Error(String(err));
    const lowerCaseMessage = error.message.toLowerCase();

    if (lowerCaseMessage.includes('quota')) {
      setIsQuotaExhausted(true);
      return t('quotaErrorModal.title');
    }
    return error.message;
  }, [t]);

  useEffect(() => {
    dbService.initDB().then(() => {
      dbService.getAllLawyers().then(allLawyers => {
        setState(prev => ({ ...prev, allLawyers }));
      });
    });

    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedCheckpoints = localStorage.getItem(CHECKPOINTS_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData: AutoSaveData = JSON.parse(savedData);
        setState(produce(draft => {
          draft.form.topic = parsedData.topic;
          draft.form.description = parsedData.description;
          draft.form.docType = parsedData.docType;
          // ... restore other fields ...
        }));
      } catch (e) {
        console.error("Failed to parse autosave data:", e);
      }
    }
    if (savedCheckpoints) {
      setCheckpoints(JSON.parse(savedCheckpoints));
    }
  }, []);

  const triggerSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('saving');
    saveTimeout.current = window.setTimeout(() => {
      const dataToSave: AutoSaveData = {
        topic: state.form.topic,
        description: state.form.description,
        docType: state.form.docType,
        lawyerFinderKeywords: state.lawyerFinderKeywords,
        notaryFinderKeywords: state.notaryFinderKeywords,
        newsQuery: state.newsQuery,
        webAnalyzerUrl: state.webAnalyzerUrl,
        webAnalyzerQuery: state.webAnalyzerQuery,
        strategyGoal: state.strategyGoal,
        aiGuidePrompt: state.aiGuidePrompt,
        contractAnalyzerQuery: state.contractAnalyzerQuery,
        initialContractText: state.initialContractText,
        evidenceAnalyzerQuery: state.evidenceAnalyzerQuery,
        imageGenPrompt: state.imageGenPrompt,
        imageGenAspectRatio: state.imageGenAspectRatio,
        corporateServices_nameQuery: state.corporateServices_nameQuery,
        corporateServices_articlesQuery: state.corporateServices_articlesQuery,
        corporateServices_complianceQuery: state.corporateServices_complianceQuery,
        insurance_policyQuery: state.insurance_policyQuery,
        insurance_initialPolicyText: state.insurance_initialPolicyText,
        insurance_claimQuery: state.insurance_claimQuery,
        insurance_recommendationQuery: state.insurance_recommendationQuery,
        insurance_riskQuery: state.insurance_riskQuery,
        insurance_fraudQuery: state.insurance_fraudQuery,
        insurance_autoClaimQuery: state.insurance_autoClaimQuery,
        insurance_quoteQuery: state.insurance_quoteQuery,
        insurance_lifeNeedsQuery: state.insurance_lifeNeedsQuery,
        siteArchitectUrl: state.siteArchitectUrl,
        siteArchitectQuery: state.siteArchitectQuery,
        contentHub_generatedPost: state.contentHub_generatedPost,
        contentHub_adaptedPost: state.contentHub_adaptedPost,
        courtAssistant_draftText: state.courtAssistant_draftText,
        userRole: state.userRole,
        resumeText: state.resumeText,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  }, [state]);

  useEffect(() => {
    triggerSave();
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [triggerSave]);

  const updateCheckpoints = (newCheckpoints: Checkpoint[]) => {
    setCheckpoints(newCheckpoints);
    localStorage.setItem(CHECKPOINTS_STORAGE_KEY, JSON.stringify(newCheckpoints));
  };
  
  const handleCreateCheckpoint = () => {
    const name = prompt(t('header.checkpointPrompt'), new Date().toLocaleString());
    if (name) {
      const newCheckpoint: Checkpoint = {
        id: nanoid(),
        timestamp: Date.now(),
        name,
        state: JSON.parse(JSON.stringify(state)),
      };
      updateCheckpoints([...checkpoints, newCheckpoint]);
    }
  };

  const handleRestoreCheckpoint = (id: string) => {
    const checkpoint = checkpoints.find(c => c.id === id);
    if (checkpoint && window.confirm(t('header.restoreConfirm'))) {
      setState(checkpoint.state);
      setPage('legal_drafter'); 
    }
  };

  const handleDeleteCheckpoint = (id: string) => {
    if (window.confirm(t('header.deleteConfirm'))) {
      updateCheckpoints(checkpoints.filter(c => c.id !== id));
    }
  };

  const setPage = (page: 'home' | PageKey) => {
    setState(produce(draft => { draft.page = page; }));
    setIsApiError(null); 
  };
  
  const handleGenerateReport = async (topic: string, description: string, docType: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce(draft => {
      draft.document = '';
      draft.form = { topic, description, docType };
    }));

    const prompt = t(`reportPrompts.${docType}`).replace('{topic}', topic).replace('{description}', description);
    try {
      const generator = geminiService.generateReportStream(prompt);
      let fullReport = '';
      for await (const chunk of generator) {
        fullReport += chunk;
        setState(produce(draft => { draft.document = fullReport; }));
      }
      if (!fullReport) {
          throw new Error("AI returned an empty response. Please try a different topic or details.");
      }
    } catch (err) {
      const msg = handleApiError(err);
      setIsApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFindLawyers = async (keywords: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => { draft.lawyerFinderKeywords = keywords; }));

      const cacheKey = `lawyer-${keywords}`;
      const cachedResult = await FastCache.get<any>(cacheKey);
      if (cachedResult) {
      }

      const prompt = t('lawyerFinder.prompt').replace('{queries}', keywords).replace('{maxResults}', "10");
      try {
          await geminiService.findLawyers(prompt);
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleLawyersFound = async (lawyers: Lawyer[]) => {
      try {
          await dbService.addLawyers(lawyers);
          const allLawyers = await dbService.getAllLawyers();
          setState(produce(draft => { draft.allLawyers = allLawyers }));
      } catch (e) {
          console.error(e);
      }
  };

  const handleClearAllDbLawyers = async () => {
    if (window.confirm(t('lawyerFinder.confirmClearCrate'))) {
      await dbService.clearAllLawyers();
      setState(produce(draft => { draft.allLawyers = [] }));
    }
  };

  const handleFindNotaries = async (keywords: string, location: LatLng | null): Promise<string | null> => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => { draft.notaryFinderKeywords = keywords; }));

      let prompt = t('notaryFinder.prompt').replace('{query}', keywords);
      if (location) {
          prompt += " The search should be prioritized for notaries near my current location."
      }

      try {
          const result = await geminiService.findNotaries(prompt, location);
          return result.text;
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
          return null;
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleSummarizeNews = async (query: string, useThinkingMode: boolean) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => {
          draft.newsQuery = query;
          draft.newsSummary = '';
          draft.newsSources = [];
      }));

      const cacheKey = `news-${query}`;
      const cached = await FastCache.get<{text: string, sources: GroundingChunk[]}>(cacheKey);
      if (cached) {
          setState(produce(draft => {
              draft.newsSummary = cached.text;
              draft.newsSources = cached.sources;
          }));
          setIsLoading(false);
          return;
      }

      const prompt = t('newsSummarizer.prompt').replace('{query}', query);
      try {
          const result = await geminiService.summarizeNews(prompt, useThinkingMode);
          await FastCache.set(cacheKey, result); 
          setState(produce(draft => {
              draft.newsSummary = result.text;
              draft.newsSources = result.sources;
          }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateStrategy = async (goal: string, useThinkingMode: boolean) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce(draft => {
        draft.strategyGoal = goal;
        draft.strategyResult = [];
    }));
    try {
        const result = await geminiService.generateStrategy(goal, t('caseStrategist.prompt'), useThinkingMode);
        const tasksWithStatus = result.map(task => ({ ...task, status: 'pending' as const }));
        setState(produce(draft => { draft.strategyResult = tasksWithStatus; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = (index: number, status: StrategyTask['status']) => {
    setState(produce(draft => {
      if (draft.strategyResult[index]) {
        draft.strategyResult[index].status = status;
      }
    }));
  };

  const handleExecuteStrategyTask = async (task: StrategyTask) => {
      setIsExecutingTask(true);
      try {
          const docTypeOptions = REPORT_TYPES.map(rt => t(`reportTypes.${rt.value}`)).join(', ');
          const result: DraftPreparationResult = await geminiService.prepareDraftFromTask(task, t('caseStrategist.prepareDraftPrompt'), docTypeOptions);
          
          setState(produce(draft => {
              draft.page = 'legal_drafter';
              draft.form.docType = REPORT_TYPES.find(rt => t(`reportTypes.${rt.value}`) === result.docType)?.value || 'petition';
              draft.form.topic = result.topic;
              draft.form.description = result.description;
              draft.document = '';
          }));
          window.scrollTo(0, 0);

      } catch (err) {
          const msg = handleApiError(err);
          alert(msg); 
      } finally {
          setIsExecutingTask(false);
      }
  };

  const handleAnalyzeWebPage = async (url: string, query: string, useThinkingMode: boolean) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => {
          draft.webAnalyzerUrl = url;
          draft.webAnalyzerQuery = query;
          draft.webAnalyzerResult = '';
          draft.webAnalyzerSources = [];
      }));
      const prompt = t('webAnalyzer.prompt').replace('{url}', url).replace('{query}', query);
      try {
          const result = await geminiService.analyzeWebPage(prompt, useThinkingMode);
          setState(produce(draft => {
              draft.webAnalyzerResult = result.text;
              draft.webAnalyzerSources = result.sources;
          }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleAnalyzeSiteStructure = async (url: string, query: string, useThinkingMode: boolean) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce(draft => {
        draft.siteArchitectUrl = url;
        draft.siteArchitectQuery = query;
        draft.siteArchitectResult = '';
        draft.siteArchitectSources = [];
    }));
    const prompt = t('siteArchitect.prompt').replace('{url}', url).replace('{query}', query);
    try {
        const result = await geminiService.analyzeSiteStructure(prompt, useThinkingMode);
        setState(produce(draft => {
            draft.siteArchitectResult = result.text;
            draft.siteArchitectSources = result.sources;
        }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
};
  
  const handleRouteUserIntent = async (goal: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => {
          draft.aiGuidePrompt = goal;
          draft.aiGuideResults = [];
      }));
      try {
          const results = await geminiService.routeUserIntent(goal, t('aiGuide.prompt'));
          setState(produce(draft => { draft.aiGuideResults = results; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleSelectRoute = async (page: PageKey) => {
      setIsAIGuideOpen(false);
      setState(produce(draft => { draft.page = page; }));
      
      if (page === 'lawyer_finder' || page === 'notary_finder') {
          try {
              const query = await geminiService.generateSearchQuery(state.aiGuidePrompt);
              preparedSearchQueryRef.current = { for: page, query: query };
              setPreparedSearchQuery(preparedSearchQueryRef.current);
          } catch(err) {
              console.error("Failed to generate search query:", err);
          }
      }
  };

  const handleAnalyzeContract = async (content: { file?: FilePart; text?: string }, userQuery: string, useThinkingMode: boolean) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce(draft => {
        draft.contractAnalysis = "";
        draft.contractAnalyzerQuery = userQuery;
        if (content.text) draft.initialContractText = content.text;
    }));

    try {
        const result = await geminiService.analyzeContract(content, userQuery, t('contractAnalyzer.prompt'), useThinkingMode);
        setState(produce(draft => { draft.contractAnalysis = result; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnalyzeEvidence = async (content: { file: FilePart }, userQuery: string, useThinkingMode: boolean) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce(draft => {
        draft.evidenceAnalysisResult = "";
        draft.evidenceAnalyzerQuery = userQuery;
    }));

    try {
        const result = await geminiService.analyzeImage(content, userQuery, t('evidenceAnalyzer.prompt'), useThinkingMode);
        setState(produce(draft => { draft.evidenceAnalysisResult = result; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateImage = async (prompt: string, aspectRatio: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce(draft => {
        draft.imageGenPrompt = prompt;
        draft.imageGenAspectRatio = aspectRatio;
        draft.generatedImage = '';
    }));

    try {
        const result = await geminiService.generateImage(prompt, aspectRatio);
        setState(produce(draft => { draft.generatedImage = result; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateCompanyNames = async (keywords: string, companyType: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => {
          draft.corporateServices_nameQuery = keywords;
          draft.corporateServices_generatedNames = [];
      }));
      try {
          const companyTypeText = t(`corporateServices.nameGenerator.types.${companyType}`);
          const prompt = t('corporateServices.prompts.nameGenerator')
              .replace('{keywords}', keywords)
              .replace('{companyType}', companyTypeText);
          const names = await geminiService.generateJsonArray(prompt);
          setState(produce(draft => { draft.corporateServices_generatedNames = names; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDraftArticles = async (query: AppState['corporateServices_articlesQuery']) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => {
          draft.corporateServices_articlesQuery = query;
          draft.corporateServices_generatedArticles = '';
      }));
      try {
          const companyTypeText = t(`corporateServices.nameGenerator.types.${query.type}`);
          const prompt = t('corporateServices.prompts.articlesDrafter')
              .replace('{companyName}', query.name)
              .replace('{companyType}', companyTypeText)
              .replace('{activity}', query.activity)
              .replace('{capital}', query.capital);
          
          const generator = geminiService.generateReportStream(prompt);
          let fullText = '';
          for await (const chunk of generator) {
              fullText += chunk;
              setState(produce(draft => { draft.corporateServices_generatedArticles = fullText; }));
          }
          if (!fullText) {
              throw new Error("AI returned an empty response.");
          }
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleAnswerComplianceQuestion = async (query: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce(draft => {
          draft.corporateServices_complianceQuery = query;
          draft.corporateServices_complianceAnswer = '';
      }));
      try {
          const prompt = t('corporateServices.prompts.complianceQA').replace('{query}', query);
          const answer = await geminiService.generateText(prompt);
          setState(produce(draft => { draft.corporateServices_complianceAnswer = answer; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

    const handleAnalyzePolicy = async (content: { file?: FilePart; text?: string }, userQuery: string, useThinkingMode: boolean) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_policyAnalysis = "";
            draft.insurance_policyQuery = userQuery;
            if (content.text) draft.insurance_initialPolicyText = content.text;
        }));

        try {
            const result = await geminiService.analyzeContract(content, userQuery, t('insuranceServices.prompts.policyAnalyzer'), useThinkingMode);
            setState(produce(draft => { draft.insurance_policyAnalysis = result; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDraftClaim = async (query: AppState['insurance_claimQuery']) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_claimQuery = query;
            draft.insurance_generatedClaim = '';
        }));
        try {
            const prompt = t('insuranceServices.prompts.claimDrafter')
                .replace('{incidentType}', query.incidentType)
                .replace('{policyNumber}', query.policyNumber)
                .replace('{description}', query.description);
            
            const generator = geminiService.generateReportStream(prompt);
            let fullText = '';
            for await (const chunk of generator) {
                fullText += chunk;
                setState(produce(draft => { draft.insurance_generatedClaim = fullText; }));
            }
            if (!fullText) {
                throw new Error("AI returned an empty response.");
            }
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecommendInsurance = async (query: string) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_recommendationQuery = query;
            draft.insurance_recommendationAnswer = '';
        }));
        try {
            const prompt = t('insuranceServices.prompts.recommender').replace('{query}', query);
            const answer = await geminiService.generateText(prompt);
            setState(produce(draft => { draft.insurance_recommendationAnswer = answer; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssessRisk = async (query: AppState['insurance_riskQuery']) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_riskQuery = query;
            draft.insurance_riskAssessmentResult = '';
        }));
        try {
            const prompt = t('insuranceServices.prompts.riskAssessor')
                .replace('{assetType}', query.assetType)
                .replace('{description}', query.description);
            const answer = await geminiService.generateText(prompt);
            setState(produce(draft => { draft.insurance_riskAssessmentResult = answer; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDetectFraud = async (query: AppState['insurance_fraudQuery']) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_fraudQuery = query;
            draft.insurance_fraudDetectionResult = '';
        }));
        try {
            const prompt = t('insuranceServices.prompts.fraudDetector')
                .replace('{claimDescription}', query.claimDescription);
            const answer = await geminiService.generateText(prompt);
            setState(produce(draft => { draft.insurance_fraudDetectionResult = answer; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAutoClaimAssess = async (content: { file: FilePart }, userQuery: string, useThinkingMode: boolean) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_autoClaimResult = "";
            draft.insurance_autoClaimQuery = userQuery;
        }));

        try {
            const result = await geminiService.analyzeImage(content, userQuery, t('insuranceServices.prompts.autoClaimAssessor'), useThinkingMode);
            setState(produce(draft => { draft.insurance_autoClaimResult = result; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulateQuote = async (query: AppState['insurance_quoteQuery']) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_quoteQuery = query;
            draft.insurance_quoteResult = '';
        }));
        try {
            const prompt = t('insuranceServices.prompts.quoteSimulator')
                .replace('{carModel}', query.carModel)
                .replace('{carYear}', query.carYear)
                .replace('{driverAge}', query.driverAge)
                .replace('{drivingHistory}', query.drivingHistory);
            const answer = await geminiService.generateText(prompt);
            setState(produce(draft => { draft.insurance_quoteResult = answer; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeLifeNeeds = async (query: AppState['insurance_lifeNeedsQuery']) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.insurance_lifeNeedsQuery = query;
            draft.insurance_lifeNeedsResult = '';
        }));
        try {
            const prompt = t('insuranceServices.prompts.lifeNeedsAnalyzer')
                .replace('{age}', query.age)
                .replace('{income}', query.income)
                .replace('{dependents}', query.dependents)
                .replace('{debts}', query.debts)
                .replace('{goals}', query.goals);
            const answer = await geminiService.generateText(prompt);
            setState(produce(draft => { draft.insurance_lifeNeedsResult = answer; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAskGeneralQuestion = async (query: string) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.generalQuestionsQuery = query;
            draft.generalQuestionsAnswer = '';
            draft.generalQuestionsSources = [];
        }));
        try {
            const result = await geminiService.askGroundedQuestion(query);
            setState(produce(draft => { 
                draft.generalQuestionsAnswer = result.text; 
                draft.generalQuestionsSources = result.sources;
            }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchTrends = async () => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => { draft.contentHub_trends = null; }));
        try {
            const trends = await geminiService.fetchDailyTrends(language);
            setState(produce(draft => { draft.contentHub_trends = trends; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePost = async (topic: string, platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook') => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => { draft.contentHub_generatedPost = null; }));
        try {
            const post = await geminiService.generateSocialPost(topic, platform, language);
            setState(produce(draft => { draft.contentHub_generatedPost = post; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdaptPost = async (postText: string, platform: string) => {
        setIsExecutingTask(true); 
        try {
            const adapted = await geminiService.adaptPostForWebsite(postText, platform, language);
            setState(produce(draft => { draft.contentHub_adaptedPost = adapted; }));
        } catch (err) {
            console.error("Failed to adapt post", err);
        } finally {
            setIsExecutingTask(false);
        }
    };

    const handleFindCitations = async (text: string) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.courtAssistant_citations = [];
        }));
        try {
            const citations = await geminiService.findLegalCitations(text);
            setState(produce(draft => {
                draft.courtAssistant_citations = citations;
            }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetRebuttal = async (statement: string) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.courtAssistant_rebuttal = null;
        }));
        try {
            const rebuttal = await geminiService.getCourtRebuttal(statement, t('courtAssistant.prompts.liveRebuttal'));
            setState(produce(draft => {
                draft.courtAssistant_rebuttal = rebuttal;
            }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- RESUME ANALYZER HANDLERS ---
    const handleAnalyzeResume = async (resumeText: string) => {
        setIsLoading(true);
        setIsApiError(null);
        setState(produce(draft => {
            draft.resumeAnalysisResult = null;
            draft.resumeChatHistory = [];
        }));
        try {
            const result = await geminiService.analyzeResume(resumeText);
            setState(produce(draft => { draft.resumeAnalysisResult = result; }));
        } catch (err) {
            const msg = handleApiError(err);
            setIsApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeChat = async (userMessage: string) => {
        setState(produce(draft => {
            draft.resumeChatHistory.push({ role: 'user', text: userMessage });
        }));
        
        try {
             const contextMsg: ChatMessage = { 
                 role: 'user', 
                 text: `Context: I am analyzing a resume. The analysis is: ${JSON.stringify(state.resumeAnalysisResult)}. User asks: ${userMessage}` 
             };
             
             const historyWithContext = [
                 ...state.resumeChatHistory,
                 { role: 'user', text: userMessage }
             ] as ChatMessage[];

             const response = await geminiService.generateChatResponse(historyWithContext);
             setState(produce(draft => {
                 draft.resumeChatHistory.push({ role: 'model', text: response.reply });
             }));
        } catch (err) {
             console.error("Chat Error", err);
        }
    };

    // --- JOB ASSISTANT HANDLERS ---
    const handleAddApplication = async (app: JobApplication) => {
        setState(produce(draft => {
            draft.jobApplications.push(app);
        }));
    };

    const handleUpdateApplication = async (app: JobApplication) => {
        setState(produce(draft => {
            const index = draft.jobApplications.findIndex(a => a.id === app.id);
            if (index !== -1) {
                draft.jobApplications[index] = app;
            }
        }));
    };


    const toggleUserRole = () => {
        setState(produce(draft => {
            draft.userRole = draft.userRole === 'admin' ? 'user' : 'admin';
        }));
    };


  const setSingleState = (key: keyof AppState, value: any) => {
    setState(produce(draft => {
      (draft as any)[key] = value;
    }));
  };
  
  const setNestedState = (parentKey: keyof AppState, childKey: string, value: any) => {
    setState(produce(draft => {
      (draft[parentKey] as any)[childKey] = value;
    }));
  };

  const renderPage = () => {
    switch (state.page) {
      case 'home':
        return <HomePage setPage={setPage} onOpenAIGuide={() => setIsAIGuideOpen(true)} onOpenBooking={() => setIsBookingOpen(true)} />;
      case 'wp_dashboard':
        return <WordPressDashboard setPage={setPage} userRole={state.userRole} />;
      case 'dashboard':
        return state.userRole === 'admin' ? (
            <AdminDashboard />
        ) : (
            <Dashboard 
                  setPage={setPage} 
                  checkpoints={checkpoints} 
                  savedLawyers={savedLawyers} 
                  strategyResult={state.strategyResult}
                  onRestoreCheckpoint={handleRestoreCheckpoint}
               />
        );
      case 'faryadresi':
        return <FaryadresiPage setPage={setPage} />;
      case 'pricing':
        return <PricingPage />;
      case 'blog':
        return <Blog />;
      case 'legal_drafter':
        return <LegalDrafter
          onGenerate={handleGenerateReport}
          isLoading={isLoading}
          isComplete={state.document.length > 0}
          topic={state.form.topic}
          description={state.form.description}
          docType={state.form.docType}
          setTopic={(value) => setNestedState('form', 'topic', value)}
          setDescription={(value) => setNestedState('form', 'description', value)}
          setDocType={(value) => setNestedState('form', 'docType', value)}
          generatedDocument={state.document}
          error={isApiError}
          isQuotaExhausted={isQuotaExhausted}
        />;
      case 'lawyer_finder':
        return <LawyerFinder
          keywords={state.lawyerFinderKeywords}
          setKeywords={(value) => setSingleState('lawyerFinderKeywords', value)}
          handleApiError={handleApiError}
          isQuotaExhausted={isQuotaExhausted}
          allLawyers={state.allLawyers}
          onLawyersFound={handleLawyersFound}
          onClearAllDbLawyers={handleClearAllDbLawyers}
          preparedSearchQuery={preparedSearchQuery}
          setPreparedSearchQuery={setPreparedSearchQuery}
          generatedDocument={state.document}
          savedLawyers={savedLawyers}
          onSaveLawyer={handleSaveLawyer}
          onRemoveLawyer={handleRemoveLawyer}
          onClearAllSaved={handleClearSavedLawyers}
          onNoteChange={handleNoteChange}
        />
      case 'news_summarizer':
        return <NewsSummarizer
          onSummarize={handleSummarizeNews}
          query={state.newsQuery}
          setQuery={(value) => setSingleState('newsQuery', value)}
          summary={state.newsSummary}
          sources={state.newsSources}
          isLoading={isLoading}
          error={isApiError}
          isQuotaExhausted={isQuotaExhausted}
        />
      case 'case_strategist':
          return <CaseStrategist 
              onGenerate={handleGenerateStrategy}
              goal={state.strategyGoal}
              setGoal={(value) => setSingleState('strategyGoal', value)}
              result={state.strategyResult}
              isLoading={isLoading}
              error={isApiError}
              isQuotaExhausted={isQuotaExhausted}
              onExecuteTask={handleExecuteStrategyTask}
              isExecutingTask={isExecutingTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
          />
      case 'notary_finder':
          return <NotaryFinder 
              onSearch={handleFindNotaries}
              keywords={state.notaryFinderKeywords}
              setKeywords={(value) => setSingleState('notaryFinderKeywords', value)}
              results={state.foundNotaries}
              isLoading={isLoading}
              error={isApiError}
              isQuotaExhausted={isQuotaExhausted}
              preparedSearchQuery={preparedSearchQuery}
              setPreparedSearchQuery={setPreparedSearchQuery}
              generatedDocument={state.document}
          />
      case 'web_analyzer':
        return <WebAnalyzer 
          onAnalyze={handleAnalyzeWebPage}
          url={state.webAnalyzerUrl}
          setUrl={(value) => setSingleState('webAnalyzerUrl', value)}
          query={state.webAnalyzerQuery}
          setQuery={(value) => setSingleState('webAnalyzerQuery', value)}
          result={state.webAnalyzerResult}
          sources={state.webAnalyzerSources}
          isLoading={isLoading}
          error={isApiError}
          isQuotaExhausted={isQuotaExhausted}
        />
      case 'site_architect':
        return <SiteArchitect 
            onAnalyze={handleAnalyzeSiteStructure}
            url={state.siteArchitectUrl}
            setUrl={(value) => setSingleState('siteArchitectUrl', value)}
            query={state.siteArchitectQuery}
            setQuery={(value) => setSingleState('siteArchitectQuery', value)}
            result={state.siteArchitectResult}
            sources={state.siteArchitectSources}
            isLoading={isLoading}
            error={isApiError}
            isQuotaExhausted={isQuotaExhausted}
        />
      case 'external_service':
        return <ExternalService />;
      case 'contract_analyzer':
        return <ContractAnalyzer
          onAnalyze={handleAnalyzeContract}
          analysisResult={state.contractAnalysis}
          isLoading={isLoading}
          error={isApiError}
          isQuotaExhausted={isQuotaExhausted}
          userQuery={state.contractAnalyzerQuery}
          setUserQuery={(value) => setSingleState('contractAnalyzerQuery', value)}
          initialText={state.initialContractText}
          setInitialText={(value) => setSingleState('initialContractText', value)}
        />
      case 'evidence_analyzer':
          return <EvidenceAnalyzer 
            onAnalyze={handleAnalyzeEvidence}
            analysisResult={state.evidenceAnalysisResult}
            isLoading={isLoading}
            error={isApiError}
            isQuotaExhausted={isQuotaExhausted}
            userQuery={state.evidenceAnalyzerQuery}
            setUserQuery={(value) => setSingleState('evidenceAnalyzerQuery', value)}
          />
      case 'image_generator':
          return <ImageGenerator
            onGenerate={handleGenerateImage}
            prompt={state.imageGenPrompt}
            setPrompt={(value) => setSingleState('imageGenPrompt', value)}
            aspectRatio={state.imageGenAspectRatio}
            setAspectRatio={(value) => setSingleState('imageGenAspectRatio', value)}
            generatedImage={state.generatedImage}
            isLoading={isLoading}
            error={isApiError}
            isQuotaExhausted={isQuotaExhausted}
          />
      case 'corporate_services':
          return <CorporateServices
              onGenerateNames={handleGenerateCompanyNames}
              onDraftArticles={handleDraftArticles}
              onAnswerQuestion={handleAnswerComplianceQuestion}
              isLoading={isLoading}
              error={isApiError}
              isQuotaExhausted={isQuotaExhausted}
              nameQuery={state.corporateServices_nameQuery}
              setNameQuery={(v) => setSingleState('corporateServices_nameQuery', v)}
              generatedNames={state.corporateServices_generatedNames}
              articlesQuery={state.corporateServices_articlesQuery}
              setArticlesQuery={(v) => setSingleState('corporateServices_articlesQuery', v)}
              generatedArticles={state.corporateServices_generatedArticles}
              complianceQuery={state.corporateServices_complianceQuery}
              setComplianceQuery={(v) => setSingleState('corporateServices_complianceQuery', v)}
              complianceAnswer={state.corporateServices_complianceAnswer}
          />
       case 'insurance_services':
          return <InsuranceServices
              onAnalyzePolicy={handleAnalyzePolicy}
              onDraftClaim={handleDraftClaim}
              onRecommendInsurance={handleRecommendInsurance}
              onAssessRisk={handleAssessRisk}
              onDetectFraud={handleDetectFraud}
              onAutoClaimAssess={handleAutoClaimAssess}
              onSimulateQuote={handleSimulateQuote}
              onAnalyzeLifeNeeds={handleAnalyzeLifeNeeds}
              isLoading={isLoading}
              error={isApiError}
              isQuotaExhausted={isQuotaExhausted}
              policyQuery={state.insurance_policyQuery}
              setPolicyQuery={(v) => setSingleState('insurance_policyQuery', v)}
              policyAnalysis={state.insurance_policyAnalysis}
              initialPolicyText={state.insurance_initialPolicyText}
              setInitialPolicyText={(v) => setSingleState('insurance_initialPolicyText', v)}
              claimQuery={state.insurance_claimQuery}
              setClaimQuery={(v) => setSingleState('insurance_claimQuery', v)}
              generatedClaim={state.insurance_generatedClaim}
              recommendationQuery={state.insurance_recommendationQuery}
              setRecommendationQuery={(v) => setSingleState('insurance_recommendationQuery', v)}
              recommendationAnswer={state.insurance_recommendationAnswer}
              riskQuery={state.insurance_riskQuery}
              setRiskQuery={(v) => setSingleState('insurance_riskQuery', v)}
              riskAssessmentResult={state.insurance_riskAssessmentResult}
              fraudQuery={state.insurance_fraudQuery}
              setFraudQuery={(v) => setSingleState('insurance_fraudQuery', v)}
              fraudDetectionResult={state.insurance_fraudDetectionResult}
              autoClaimQuery={state.insurance_autoClaimQuery}
              setAutoClaimQuery={(v) => setSingleState('insurance_autoClaimQuery', v)}
              autoClaimResult={state.insurance_autoClaimResult}
              quoteQuery={state.insurance_quoteQuery}
              setQuoteQuery={(v) => setSingleState('insurance_quoteQuery', v)}
              quoteResult={state.insurance_quoteResult}
              lifeNeedsQuery={state.insurance_lifeNeedsQuery}
              setLifeNeedsQuery={(v) => setSingleState('insurance_lifeNeedsQuery', v)}
              lifeNeedsResult={state.insurance_lifeNeedsResult}
          />
        case 'general_questions':
            return <GeneralQuestions
                onAskAI={handleAskGeneralQuestion}
                aiQuery={state.generalQuestionsQuery}
                setAiQuery={(v) => setSingleState('generalQuestionsQuery', v)}
                aiAnswer={state.generalQuestionsAnswer}
                aiSources={state.generalQuestionsSources}
                isLoading={isLoading}
                error={isApiError}
            />;
        case 'content_hub':
            return <ContentHubPage
                onFetchTrends={handleFetchTrends}
                isFetchingTrends={isLoading && !state.contentHub_generatedPost}
                trends={state.contentHub_trends}
                trendsError={isApiError}
                onGeneratePost={handleGeneratePost}
                isGeneratingPost={isLoading}
                generatedPost={state.contentHub_generatedPost}
                onClearPost={() => setSingleState('contentHub_generatedPost', null)}
                onAdaptPost={handleAdaptPost}
                isAdapting={isExecutingTask}
                adaptedPost={state.contentHub_adaptedPost}
            />
        case 'court_assistant':
            return <CourtAssistant
                onFindCitations={handleFindCitations}
                onGetRebuttal={handleGetRebuttal}
                isLoading={isLoading}
                error={isApiError}
                citations={state.courtAssistant_citations}
                rebuttal={state.courtAssistant_rebuttal}
                draftText={state.courtAssistant_draftText}
                setDraftText={(v) => setSingleState('courtAssistant_draftText', v)}
            />
        case 'resume_analyzer':
            return <ResumeAnalyzer
                resumeText={state.resumeText}
                setResumeText={(text) => setSingleState('resumeText', text)}
                analysisResult={state.resumeAnalysisResult}
                chatHistory={state.resumeChatHistory}
                onAnalyze={handleAnalyzeResume}
                onChat={handleResumeChat}
                isLoading={isLoading}
                error={isApiError}
                isQuotaExhausted={isQuotaExhausted}
            />;
        case 'job_assistant':
            return <JobAssistant
                applications={state.jobApplications}
                currentUserCv={state.currentUserCv}
                setCurrentUserCv={(cv) => setSingleState('currentUserCv', cv)}
                onAddApplication={handleAddApplication}
                onUpdateApplication={handleUpdateApplication}
                handleApiError={handleApiError}
                isQuotaExhausted={isQuotaExhausted}
            />;
      default:
        return <HomePage setPage={setPage} onOpenAIGuide={() => setIsAIGuideOpen(true)} onOpenBooking={() => setIsBookingOpen(true)} />;
    }
  };

  return (
    <ToastProvider>
      <div className={`min-h-screen flex flex-col ${state.page === 'wp_dashboard' || state.page === 'faryadresi' ? 'overflow-hidden' : 'bg-gray-50 dark:bg-brand-blue'} text-gray-900 dark:text-gray-200 ${t('font')} transition-colors duration-300`}>
        {state.page !== 'wp_dashboard' && state.page !== 'faryadresi' && (
            <SiteHeader 
              currentPage={state.page} 
              setPage={setPage} 
              checkpoints={checkpoints}
              onCreateCheckpoint={handleCreateCheckpoint}
              onRestoreCheckpoint={handleRestoreCheckpoint}
              onDeleteCheckpoint={handleDeleteCheckpoint}
              saveStatus={saveStatus}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAIGuide={() => setIsAIGuideOpen(true)}
              onOpenDonation={() => setPage('faryadresi')}
            />
        )}
        <main className={`flex-grow ${state.page === 'wp_dashboard' || state.page === 'faryadresi' ? 'h-screen overflow-auto' : (state.page === 'external_service' ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8')}`}>
          {renderPage()}
        </main>
        {state.page !== 'wp_dashboard' && state.page !== 'faryadresi' && <SiteFooter setPage={setPage} />}
        
        <AIGuideModal 
          isOpen={isAIGuideOpen}
          onClose={() => setIsAIGuideOpen(false)}
          onRoute={handleRouteUserIntent}
          onSelectRoute={handleSelectRoute}
          prompt={state.aiGuidePrompt}
          setPrompt={(value) => setSingleState('aiGuidePrompt', value)}
          results={state.aiGuideResults}
          isLoading={isLoading}
          error={isApiError}
        />
        
        <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
        <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
        <QuotaErrorModal isOpen={isQuotaExhausted} onClose={() => setIsQuotaExhausted(false)} />
        <Chatbot isQuotaExhausted={isQuotaExhausted} handleApiError={handleApiError} />
        
        <LoginModal 
            isOpen={isLoginOpen} 
            onClose={() => setIsLoginOpen(false)} 
            onLoginSuccess={(user) => {
                setUser(user);
                setIsLoginOpen(false);
                // Also update role immediately on login success
                const role = checkUserRole(user.email);
                setState(produce(draft => { draft.userRole = role; }));
            }} 
        />

        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            onToggleRole={toggleUserRole}
            currentRole={state.userRole}
            onOpenWPDashboard={() => { setPage('wp_dashboard'); setIsSettingsOpen(false); }}
        />
        
        {/* Floating Login Button (if not logged in) */}
        {!user && (
            <div className={`fixed z-40 bottom-24 transition-all duration-300 ease-out ${language === 'fa' ? 'right-5' : 'left-5'}`}>
                <button
                    onClick={() => setIsLoginOpen(true)}
                    className="bg-brand-blue text-white rounded-full p-4 shadow-lg hover:bg-brand-blue/80 transform hover:scale-110 transition-all flex items-center justify-center border-2 border-brand-gold"
                    aria-label="Login"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        )}

        <div className={`fixed z-40 bottom-5 transition-all duration-300 ease-out ${language === 'fa' ? 'right-5' : 'left-5'}`}>
            <a
                href="https://wa.me/989027370260"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transform hover:scale-110 transition-all flex items-center justify-center"
                aria-label="Contact Support on WhatsApp"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </a>
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;
