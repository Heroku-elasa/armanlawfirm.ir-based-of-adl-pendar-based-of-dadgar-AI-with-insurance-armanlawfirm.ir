import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuth } from './hooks/useAuth';
import { login, logout } from './lib/authUtils';

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
import AIDashboard from './components/AIDashboard'; 
import AdminDashboard from './components/AdminDashboard'; 
import WordPressDashboard from './components/WordPressDashboard';
import FaryadresiPage from './components/FaryadresiPage';
import AIGuideModal from './components/AIGuideModal';
import QuotaErrorModal from './components/QuotaErrorModal';
import Chatbot from './components/Chatbot';
import WhatsAppChatbot from './components/WhatsAppChatbot';
import SettingsModal from './components/SettingsModal';
import ApiTestPage from './components/ApiTestPage';
import { ToastProvider } from './components/Toast';
import BookingModal from './components/BookingModal'; 
import DonationModal from './components/DonationModal'; 
import ResumeAnalyzer from './components/ResumeAnalyzer';
import JobAssistant from './components/JobAssistant';
import LoginModal from './components/LoginModal';
import MapFinder from './components/MapFinder';
import GeoReferencer from './components/GeoReferencer';
import InvestmentPage from './components/InvestmentPage';

// Type and Service Imports
import { AppState, Checkpoint, PageKey, SaveStatus, useLanguage, Lawyer, Notary, GroundingChunk, StrategyTask, IntentRoute, FilePart, DraftPreparationResult, AutoSaveData, LatLng, useAppearance, LegalCitation, CourtroomRebuttal, ChatMessage, ResumeAnalysisResult, JobApplication } from './types';
import * as geminiService from './services/geminiService';
import * as dbService from './services/dbService';
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

const AppContent: React.FC = () => {
  const { t, language } = useLanguage();
  const { colorScheme, fastCacheEnabled } = useAppearance(); 
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiError, setIsApiError] = useState<string | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [isAIGuideOpen, setIsAIGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isBookingOpen, setIsBookingOpen] = useState(false); 
  const [isWhatsAppChatOpen, setIsWhatsAppChatOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false); 
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  
  const [savedLawyers, setSavedLawyers] = useState<Lawyer[]>(() => {
      const saved = localStorage.getItem('dadgar-saved-lawyers');
      return saved ? JSON.parse(saved) : [];
  });

  const checkUserRole = (email: string | null | undefined): 'user' | 'admin' => {
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

  // Update user role when auth state changes
  useEffect(() => {
      if (user) {
          const role = checkUserRole(user.email);
          setState(produce((draft: AppState) => { draft.userRole = role; }));
      } else {
          setState(produce((draft: AppState) => { draft.userRole = 'user'; }));
      }
  }, [user]);

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
        setState(produce((draft: AppState) => {
          draft.form.topic = parsedData.topic || '';
          draft.form.description = parsedData.description || '';
          draft.form.docType = parsedData.docType || REPORT_TYPES[0].value;
          draft.lawyerFinderKeywords = parsedData.lawyerFinderKeywords || '';
          draft.notaryFinderKeywords = parsedData.notaryFinderKeywords || '';
          draft.newsQuery = parsedData.newsQuery || '';
          draft.webAnalyzerUrl = parsedData.webAnalyzerUrl || '';
          draft.webAnalyzerQuery = parsedData.webAnalyzerQuery || '';
          draft.strategyGoal = parsedData.strategyGoal || '';
          draft.aiGuidePrompt = parsedData.aiGuidePrompt || '';
          draft.contractAnalyzerQuery = parsedData.contractAnalyzerQuery || '';
          draft.initialContractText = parsedData.initialContractText || '';
          draft.evidenceAnalyzerQuery = parsedData.evidenceAnalyzerQuery || '';
          draft.imageGenPrompt = parsedData.imageGenPrompt || '';
          draft.imageGenAspectRatio = parsedData.imageGenAspectRatio || '1:1';
          draft.corporateServices_nameQuery = parsedData.corporateServices_nameQuery || '';
          draft.corporateServices_articlesQuery = parsedData.corporateServices_articlesQuery || draft.corporateServices_articlesQuery;
          draft.corporateServices_complianceQuery = parsedData.corporateServices_complianceQuery || '';
          draft.insurance_policyQuery = parsedData.insurance_policyQuery || '';
          draft.insurance_initialPolicyText = parsedData.insurance_initialPolicyText || '';
          draft.insurance_claimQuery = parsedData.insurance_claimQuery || draft.insurance_claimQuery;
          draft.insurance_recommendationQuery = parsedData.insurance_recommendationQuery || '';
          draft.insurance_riskQuery = parsedData.insurance_riskQuery || draft.insurance_riskQuery;
          draft.insurance_fraudQuery = parsedData.insurance_fraudQuery || draft.insurance_fraudQuery;
          draft.insurance_autoClaimQuery = parsedData.insurance_autoClaimQuery || '';
          draft.insurance_quoteQuery = parsedData.insurance_quoteQuery || draft.insurance_quoteQuery;
          draft.insurance_lifeNeedsQuery = parsedData.insurance_lifeNeedsQuery || draft.insurance_lifeNeedsQuery;
          draft.siteArchitectUrl = parsedData.siteArchitectUrl || '';
          draft.siteArchitectQuery = parsedData.siteArchitectQuery || '';
          draft.contentHub_generatedPost = parsedData.contentHub_generatedPost || null;
          draft.contentHub_adaptedPost = parsedData.contentHub_adaptedPost || null;
          draft.courtAssistant_draftText = parsedData.courtAssistant_draftText || '';
          draft.resumeText = parsedData.resumeText || '';
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
    setState(produce((draft: AppState) => { draft.page = page; }));
    setIsApiError(null); 
  };
  
  const handleGenerateReport = async (topic: string, description: string, docType: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce((draft: AppState) => {
      draft.document = '';
      draft.form = { topic, description, docType };
    }));

    const prompt = t(`reportPrompts.${docType}`).replace('{topic}', topic).replace('{description}', description);
    try {
      const generator = geminiService.generateReportStream(prompt);
      let fullReport = '';
      for await (const chunk of generator) {
        fullReport += chunk;
        setState(produce((draft: AppState) => { draft.document = fullReport; }));
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
      setState(produce((draft: AppState) => { draft.lawyerFinderKeywords = keywords; }));

      const prompt = t('lawyerFinder.prompt').replace('{queries}', keywords).replace('{maxResults}', "10");
      try {
          const result = await geminiService.findLawyers(prompt, null);
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
          setState(produce((draft: AppState) => { draft.allLawyers = allLawyers }));
      } catch (e) {
          console.error(e);
      }
  };

  const handleClearAllDbLawyers = async () => {
    if (window.confirm(t('lawyerFinder.confirmClearCrate'))) {
      await dbService.clearAllLawyers();
      setState(produce((draft: AppState) => { draft.allLawyers = [] }));
    }
  };

  const handleFindNotaries = async (keywords: string, location: LatLng | null): Promise<string | null> => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => { draft.notaryFinderKeywords = keywords; }));

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
      setState(produce((draft: AppState) => {
          draft.newsQuery = query;
          draft.newsSummary = '';
          draft.newsSources = [];
      }));

      const cacheKey = `news-${query}`;
      const cached = await FastCache.get<{text: string, sources: GroundingChunk[]}>(cacheKey);
      if (cached) {
          setState(produce((draft: AppState) => {
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
          setState(produce((draft: AppState) => {
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
    setState(produce((draft: AppState) => {
        draft.strategyGoal = goal;
        draft.strategyResult = [];
    }));
    try {
        const result = await geminiService.generateStrategy(goal, t('caseStrategist.prompt'), useThinkingMode);
        const tasksWithStatus = result.map(task => ({ ...task, status: 'pending' as const }));
        setState(produce((draft: AppState) => { draft.strategyResult = tasksWithStatus; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = (index: number, status: StrategyTask['status']) => {
    setState(produce((draft: AppState) => {
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
          
          setState(produce((draft: AppState) => {
              draft.page = 'legal_drafter';
              draft.form.docType = REPORT_TYPES.find(rt => t(`reportTypes.${rt.value}`) === result.docType)?.value || 'petition';
              draft.form.topic = result.topic;
              draft.form.description = result.description;
              draft.document = '';
          }));
      } catch (err) {
          console.error("Failed to prepare draft", err);
      } finally {
          setIsExecutingTask(false);
      }
  };

  const handleAnalyzeWebPage = async (url: string, query: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce((draft: AppState) => {
        draft.webAnalyzerUrl = url;
        draft.webAnalyzerQuery = query;
        draft.webAnalyzerResult = '';
        draft.webAnalyzerSources = [];
    }));
    try {
        const result = await geminiService.analyzeWebPage(url, query, language);
        setState(produce((draft: AppState) => {
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

  const handleAnalyzeSiteStructure = async (url: string, query: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce((draft: AppState) => {
        draft.siteArchitectUrl = url;
        draft.siteArchitectQuery = query;
        draft.siteArchitectResult = '';
        draft.siteArchitectSources = [];
    }));
    try {
        const result = await geminiService.analyzeSiteStructure(url, query, language);
        setState(produce((draft: AppState) => {
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

  const handleRouteUserIntent = async (prompt: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce((draft: AppState) => {
        draft.aiGuidePrompt = prompt;
        draft.aiGuideResults = [];
    }));
    try {
        const result: IntentRoute[] = await geminiService.routeUserIntent(prompt, t('aiGuide.routingPrompt'));
        setState(produce((draft: AppState) => { draft.aiGuideResults = result; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectRoute = (route: IntentRoute) => {
      setIsAIGuideOpen(false);
      if (route.module === 'lawyer_finder' || route.module === 'notary_finder') {
          preparedSearchQueryRef.current = { for: route.module as 'lawyer_finder' | 'notary_finder', query: route.suggestedQuery || '' };
          setPreparedSearchQuery(preparedSearchQueryRef.current);
      }
      setPage(route.module);
  };

  const handleAnalyzeContract = async (text: string, query: string) => {
    setIsLoading(true);
    setIsApiError(null);
    setState(produce((draft: AppState) => {
        draft.contractAnalysis = '';
        draft.contractAnalyzerQuery = query;
        draft.initialContractText = text;
    }));
    try {
        const result = await geminiService.analyzeContract(text, query, t('contractAnalyzer.prompt'));
        setState(produce((draft: AppState) => { draft.contractAnalysis = result; }));
    } catch (err) {
        const msg = handleApiError(err);
        setIsApiError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnalyzeEvidence = async (files: FilePart[], query: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => {
          draft.evidenceAnalysisResult = '';
          draft.evidenceAnalyzerQuery = query;
      }));
      try {
          const result = await geminiService.analyzeEvidence(files, query, t('evidenceAnalyzer.prompt'));
          setState(produce((draft: AppState) => { draft.evidenceAnalysisResult = result; }));
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
      setState(produce((draft: AppState) => {
          draft.imageGenPrompt = prompt;
          draft.imageGenAspectRatio = aspectRatio;
          draft.generatedImage = '';
      }));
      try {
          const result = await geminiService.generateImage(prompt, aspectRatio);
          setState(produce((draft: AppState) => { draft.generatedImage = result; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateCompanyNames = async (query: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => {
          draft.corporateServices_nameQuery = query;
          draft.corporateServices_generatedNames = [];
      }));
      try {
          const prompt = t('corporateServices.prompts.nameGenerator').replace('{query}', query);
          const answer = await geminiService.generateText(prompt);
          const names = answer.split('\n').filter(n => n.trim().length > 0).map(n => n.replace(/^\d+\.\s*/, '').trim());
          setState(produce((draft: AppState) => { draft.corporateServices_generatedNames = names; }));
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
      setState(produce((draft: AppState) => {
          draft.corporateServices_articlesQuery = query;
          draft.corporateServices_generatedArticles = '';
      }));
      try {
          const prompt = t('corporateServices.prompts.articlesDrafter')
              .replace('{name}', query.name)
              .replace('{type}', query.type)
              .replace('{activity}', query.activity)
              .replace('{capital}', query.capital);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.corporateServices_generatedArticles = answer; }));
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
      setState(produce((draft: AppState) => {
          draft.corporateServices_complianceQuery = query;
          draft.corporateServices_complianceAnswer = '';
      }));
      try {
          const prompt = t('corporateServices.prompts.complianceAssistant').replace('{query}', query);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.corporateServices_complianceAnswer = answer; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleAnalyzePolicy = async (text: string, query: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => {
          draft.insurance_policyAnalysis = '';
          draft.insurance_policyQuery = query;
          draft.insurance_initialPolicyText = text;
      }));
      try {
          const prompt = t('insuranceServices.prompts.policyAnalyzer')
              .replace('{policyText}', text)
              .replace('{query}', query);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.insurance_policyAnalysis = answer; }));
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
      setState(produce((draft: AppState) => {
          draft.insurance_claimQuery = query;
          draft.insurance_generatedClaim = '';
      }));
      try {
          const prompt = t('insuranceServices.prompts.claimDrafter')
              .replace('{incidentType}', query.incidentType)
              .replace('{description}', query.description)
              .replace('{policyNumber}', query.policyNumber);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.insurance_generatedClaim = answer; }));
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
      setState(produce((draft: AppState) => {
          draft.insurance_recommendationQuery = query;
          draft.insurance_recommendationAnswer = '';
      }));
      try {
          const prompt = t('insuranceServices.prompts.insuranceAdvisor').replace('{query}', query);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.insurance_recommendationAnswer = answer; }));
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
      setState(produce((draft: AppState) => {
          draft.insurance_riskQuery = query;
          draft.insurance_riskAssessmentResult = '';
      }));
      try {
          const prompt = t('insuranceServices.prompts.riskAssessor')
              .replace('{assetType}', query.assetType)
              .replace('{description}', query.description);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.insurance_riskAssessmentResult = answer; }));
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
      setState(produce((draft: AppState) => {
          draft.insurance_fraudQuery = query;
          draft.insurance_fraudDetectionResult = '';
      }));
      try {
          const prompt = t('insuranceServices.prompts.fraudDetector')
              .replace('{claimDescription}', query.claimDescription);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.insurance_fraudDetectionResult = answer; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleAutoClaimAssess = async (query: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => {
          draft.insurance_autoClaimQuery = query;
          draft.insurance_autoClaimResult = '';
      }));
      try {
          const prompt = t('insuranceServices.prompts.autoClaimAssessor').replace('{query}', query);
          const answer = await geminiService.generateText(prompt);
          setState(produce((draft: AppState) => { draft.insurance_autoClaimResult = answer; }));
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
      setState(produce((draft: AppState) => {
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
          setState(produce((draft: AppState) => { draft.insurance_quoteResult = answer; }));
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
      setState(produce((draft: AppState) => {
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
          setState(produce((draft: AppState) => { draft.insurance_lifeNeedsResult = answer; }));
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
      setState(produce((draft: AppState) => {
          draft.generalQuestionsQuery = query;
          draft.generalQuestionsAnswer = '';
          draft.generalQuestionsSources = [];
      }));
      try {
          const result = await geminiService.askGroundedQuestion(query);
          setState(produce((draft: AppState) => { 
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
      setState(produce((draft: AppState) => { draft.contentHub_trends = null; }));
      try {
          const trends = await geminiService.fetchDailyTrends(language);
          setState(produce((draft: AppState) => { draft.contentHub_trends = trends; }));
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
      setState(produce((draft: AppState) => { draft.contentHub_generatedPost = null; }));
      try {
          const post = await geminiService.generateSocialPost(topic, platform, language);
          setState(produce((draft: AppState) => { draft.contentHub_generatedPost = post; }));
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
          setState(produce((draft: AppState) => { draft.contentHub_adaptedPost = adapted; }));
      } catch (err) {
          console.error("Failed to adapt post", err);
      } finally {
          setIsExecutingTask(false);
      }
  };

  const handleFindCitations = async (text: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => {
          draft.courtAssistant_citations = [];
      }));
      try {
          const citations = await geminiService.findLegalCitations(text);
          setState(produce((draft: AppState) => {
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
      setState(produce((draft: AppState) => {
          draft.courtAssistant_rebuttal = null;
      }));
      try {
          const rebuttal = await geminiService.getCourtRebuttal(statement, t('courtAssistant.prompts.liveRebuttal'));
          setState(produce((draft: AppState) => {
              draft.courtAssistant_rebuttal = rebuttal;
          }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleAnalyzeResume = async (resumeText: string) => {
      setIsLoading(true);
      setIsApiError(null);
      setState(produce((draft: AppState) => {
          draft.resumeAnalysisResult = null;
          draft.resumeChatHistory = [];
      }));
      try {
          const result = await geminiService.analyzeResume(resumeText, language);
          setState(produce((draft: AppState) => { draft.resumeAnalysisResult = result; }));
      } catch (err) {
          const msg = handleApiError(err);
          setIsApiError(msg);
      } finally {
          setIsLoading(false);
      }
  };

  const handleResumeChat = async (userMessage: string) => {
      setState(produce((draft: AppState) => {
          draft.resumeChatHistory.push({ role: 'user', text: userMessage });
      }));
      
      try {
           const historyWithContext = [
               ...state.resumeChatHistory,
               { role: 'user', text: userMessage }
           ] as ChatMessage[];

           const response = await geminiService.generateChatResponse(historyWithContext);
           setState(produce((draft: AppState) => {
               draft.resumeChatHistory.push({ role: 'model', text: response.reply });
           }));
      } catch (err) {
           console.error("Chat Error", err);
      }
  };

  const handleAddApplication = async (app: JobApplication) => {
      setState(produce((draft: AppState) => {
          draft.jobApplications.push(app);
      }));
  };

  const handleUpdateApplication = async (app: JobApplication) => {
      setState(produce((draft: AppState) => {
          const index = draft.jobApplications.findIndex(a => a.id === app.id);
          if (index !== -1) {
              draft.jobApplications[index] = app;
          }
      }));
  };

  const toggleUserRole = () => {
      setState(produce((draft: AppState) => {
          draft.userRole = draft.userRole === 'admin' ? 'user' : 'admin';
      }));
  };

  const setSingleState = (key: keyof AppState, value: any) => {
    setState(produce((draft: AppState) => {
      (draft as any)[key] = value;
    }));
  };
  
  const setNestedState = (parentKey: keyof AppState, childKey: string, value: any) => {
    setState(produce((draft: AppState) => {
      (draft[parentKey] as any)[childKey] = value;
    }));
  };

  useEffect(() => {
    if (isAuthenticated && state.page === 'home') {
      setPage('dashboard');
    }
  }, [isAuthenticated]);

  const renderPage = () => {
    const protectedPages = ['dashboard', 'admin_dashboard', 'wordpress_dashboard'];
    if (protectedPages.includes(state.page) && !isAuthenticated) {
        setTimeout(() => setIsLoginOpen(true), 0);
        return <HomePage setPage={setPage} onOpenAIGuide={() => setIsAIGuideOpen(true)} onOpenBooking={() => setIsBookingOpen(true)} onOpenChatbot={() => setIsWhatsAppChatOpen(true)} />;
    }

    const adminPages = ['admin_dashboard', 'wordpress_dashboard'];
    if (adminPages.includes(state.page) && state.userRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold mb-4 text-brand-blue dark:text-brand-gold">دسترسی محدود شده</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">فقط مدیران سیستم به این بخش دسترسی دارند.</p>
              <button 
                onClick={() => setPage('home')}
                className="px-8 py-3 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 shadow-lg transition-all transform hover:scale-105"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
        );
    }

    switch (state.page) {
      case 'home':
        return <HomePage setPage={setPage} onOpenAIGuide={() => setIsAIGuideOpen(true)} onOpenBooking={() => setIsBookingOpen(true)} onOpenChatbot={() => setIsWhatsAppChatOpen(true)} />;
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
        case 'map_finder':
            return <MapFinder setPage={setPage} />;
        case 'geo_referencer':
            return <GeoReferencer setPage={setPage} isLoading={isLoading} setIsLoading={setIsLoading} />;
        case 'investment':
            return <InvestmentPage />;
        case 'ai_dashboard':
        return <AIDashboard />;
      case 'apitest':
        return <ApiTestPage />;
      default:
        return <HomePage setPage={setPage} onOpenAIGuide={() => setIsAIGuideOpen(true)} onOpenBooking={() => setIsBookingOpen(true)} onOpenChatbot={() => setIsWhatsAppChatOpen(true)} />;
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
        <main className={`flex-grow ${state.page === 'wp_dashboard' || state.page === 'faryadresi' ? 'h-screen overflow-auto' : (state.page === 'external_service' || state.page === 'home' ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8')}`}>
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
            onLoginSuccess={() => {
                setIsLoginOpen(false);
                window.location.reload(); 
            }} 
        />

        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            onToggleRole={toggleUserRole}
            currentRole={state.userRole}
            onOpenWPDashboard={() => { setPage('wp_dashboard'); setIsSettingsOpen(false); }}
            setPage={setPage}
        />
        
        {!isAuthenticated && (
            <div className={`fixed z-30 bottom-4 sm:bottom-6 transition-all duration-300 ease-out ${language === 'fa' ? 'right-36 sm:right-44' : 'left-4 sm:left-5'}`}>
                <button
                    onClick={login}
                    className="bg-brand-blue text-white rounded-full p-3 shadow-lg hover:bg-brand-blue/80 transform hover:scale-110 transition-all flex items-center justify-center border-2 border-brand-gold"
                    aria-label="Login"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        )}

        <WhatsAppChatbot 
          externalOpen={isWhatsAppChatOpen} 
          onOpenChange={setIsWhatsAppChatOpen}
        />
      </div>
    </ToastProvider>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
