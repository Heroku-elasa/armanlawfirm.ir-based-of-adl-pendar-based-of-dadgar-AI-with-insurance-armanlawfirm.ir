
import React, { useState } from 'react';
import { IntentRoute, PageKey, useLanguage } from '../types';
import { useAISuggestions, AISuggestionsDisplay } from './AISuggestions';

interface AIGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoute: (goal: string) => void;
  onSelectRoute: (page: PageKey) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  results: IntentRoute[];
  isLoading: boolean;
  error: string | null;
}

const AIGuideModal: React.FC<AIGuideModalProps> = ({ 
    isOpen, onClose, onRoute, onSelectRoute, prompt, setPrompt, results, isLoading, error 
}) => {
  const { t } = useLanguage();
  const [isPromptFocused, setIsPromptFocused] = useState(false);
  
  const { suggestions, isLoading: areSuggestionsLoading, setSuggestions } = useAISuggestions(
      prompt,
      "Suggest common legal goals or questions a user might have when using a legal AI assistant",
      isOpen && isPromptFocused,
      'ai_guide_prompt'
  );

  const handleSuggestionSelect = (suggestion: string) => {
      setPrompt(suggestion);
      setSuggestions([]);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
        alert(t('aiGuide.validationError'));
        return;
    }
    onRoute(prompt);
  };

  const handleUseExample = () => {
    setPrompt(t('aiGuide.example.prompt'));
  };

  const moduleTranslations: Record<PageKey, string> = {
    dashboard: t('header.dashboard'),
    legal_drafter: t('header.aiAssistant'),
    lawyer_finder: t('header.lawyerFinder'),
    news_summarizer: t('header.newsSummarizer'),
    case_strategist: t('header.caseStrategist'),
    notary_finder: t('header.notaryFinder'),
    web_analyzer: t('header.webAnalyzer'),
    contract_analyzer: t('header.contractAnalyzer'),
    evidence_analyzer: t('header.evidenceAnalyzer'),
    image_generator: t('header.imageGenerator'),
    corporate_services: t('header.corporateServices'),
    insurance_services: t('header.insuranceServices'),
    site_architect: t('header.siteArchitect'),
    external_service: t('header.externalService'),
    general_questions: t('header.generalQuestions'),
    blog: t('header.blog'),
    content_hub: t('header.contentHub'),
    court_assistant: t('header.courtAssistant'),
    pricing: t('header.pricing'),
    wp_dashboard: 'WordPress Dashboard',
    faryadresi: t('header.donation'),
    resume_analyzer: t('resumeAnalyzer.title'),
    job_assistant: t('jobAssistant.tabs.apply'),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-brand-blue rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 border border-brand-gold/50 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold leading-6 text-white">{t('aiGuide.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">{t('aiGuide.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                 <div className="flex justify-end items-center mb-1">
                    <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                        {t('generatorForm.useExample')}
                    </button>
                </div>
                <div className="relative">
                    <textarea
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onFocus={() => setIsPromptFocused(true)}
                        onBlur={() => setIsPromptFocused(false)}
                        autoComplete="off"
                        className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                        placeholder={t('aiGuide.placeholder')}
                    />
                    {isPromptFocused && (
                        <AISuggestionsDisplay
                            suggestions={suggestions}
                            isLoading={areSuggestionsLoading}
                            onSelect={handleSuggestionSelect}
                        />
                    )}
                </div>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isLoading ? t('aiGuide.gettingSuggestions') : t('aiGuide.submitButton')}
            </button>
        </form>

        <div className="mt-6 flex-grow overflow-y-auto pr-2">
            {isLoading && !error && (
                 <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-brand-gold"></div>
                    <span className="ml-3 text-gray-400">{t('aiGuide.gettingSuggestions')}</span>
                </div>
            )}
            {error && <div className="text-red-400 text-center p-4 bg-red-900/50 rounded-md">{error}</div>}
            
            {results.length > 0 && !isLoading && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-white">{t('aiGuide.resultsTitle')}</h4>
                    {results.map((result) => (
                        <div key={result.module} className="bg-brand-blue/50 p-4 rounded-lg border border-brand-blue/70 space-y-3">
                           <div className="flex justify-between items-start gap-4">
                                <h5 className="text-lg font-bold text-brand-gold">{moduleTranslations[result.module]}</h5>
                               <button 
                                   onClick={() => onSelectRoute(result.module)}
                                   className="flex-shrink-0 text-sm px-4 py-2 rounded-md bg-brand-gold text-brand-blue hover:bg-yellow-200 transition-colors"
                               >
                                   {t('aiGuide.goTo')}
                               </button>
                           </div>
                           <p className="text-sm text-gray-300">{result.reasoning}</p>
                           <div className="w-full pt-2">
                              <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-400">{t('aiGuide.confidence')}</span>
                                  <span className="text-sm font-medium text-white">{result.confidencePercentage}%</span>
                              </div>
                              <div className="w-full bg-brand-blue/70 rounded-full h-2.5">
                                  <div
                                      className="bg-gradient-to-r from-brand-gold to-yellow-200 h-2.5 rounded-full"
                                      style={{ width: `${result.confidencePercentage}%` }}
                                  ></div>
                              </div>
                          </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AIGuideModal;
