import React, { useState } from 'react';
import { REPORT_TYPES } from '../constants';
import { FilePart, useLanguage } from '../types';
import { useAISuggestions, AISuggestionsDisplay } from './AISuggestions';
import CameraInput from './CameraInput';
import { extractTextFromImage } from '../services/geminiService';

interface DraftingFormProps {
  onGenerate: (topic: string, description: string, docType: string) => void;
  isLoading: boolean;
  isComplete: boolean;
  topic: string;
  description: string;
  docType: string;
  setTopic: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setDocType: React.Dispatch<React.SetStateAction<string>>;
  isQuotaExhausted: boolean;
}

const DraftingForm: React.FC<DraftingFormProps> = ({ 
  onGenerate, 
  isLoading, 
  isComplete,
  topic,
  description,
  docType,
  setTopic,
  setDescription,
  setDocType,
  isQuotaExhausted
}) => {
  const { t } = useLanguage();
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const { suggestions: topicSuggestions, isLoading: isTopicSuggestionsLoading, setSuggestions: setTopicSuggestions } = useAISuggestions(
    topic,
    "Suggest a concise legal case topic based on the following user input",
    !isQuotaExhausted && isTopicFocused,
    'legal_drafter_topic'
  );

  const { suggestions: descriptionSuggestions, isLoading: isDescriptionSuggestionsLoading, setSuggestions: setDescriptionSuggestions } = useAISuggestions(
    description,
    "Suggest key legal points for a case description based on the following text",
    !isQuotaExhausted && isDescriptionFocused && topic.trim().length > 0,
    'legal_drafter_description'
  );

  const handleTopicSuggestionSelect = (suggestion: string) => {
    setTopic(suggestion);
    setTopicSuggestions([]);
  };

  const handleDescriptionSuggestionSelect = (suggestion: string) => {
    setDescription(prev => prev ? `${prev.trim()}\n- ${suggestion}` : `- ${suggestion}`);
    setDescriptionSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !description.trim()) {
      alert(t('generatorForm.validationError'));
      return;
    }
    onGenerate(topic, description, docType);
  };

  const handleUseExample = () => {
    const example = t(`reportExamples.${docType}`);
    if (example && typeof example === 'object' && 'topic' in example && 'description' in example) {
        setTopic(example.topic as string);
        setDescription(example.description as string);
    } else {
        console.warn(`No example found for docType: ${docType}`);
    }
  };

  const handleCapture = async (base64Data: string, mimeType: string) => {
    setIsExtractingText(true);
    setExtractionError(null);
    try {
        const filePart: FilePart = { data: base64Data, mimeType };
        const extractedText = await extractTextFromImage(filePart);
        setDescription(prev => (prev ? `${prev.trim()}\n\n--- ${t('camera.captureSectionTitle')} ---\n` : '') + extractedText);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setExtractionError(msg);
    } finally {
        setIsExtractingText(false);
    }
  };


  return (
    <div className="bg-white dark:bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-brand-blue/50 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('generatorForm.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="docType" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 relative transition-colors duration-500 ${isComplete ? 'strikethrough-animated' : ''}`}>{t('generatorForm.docType')}</label>
          <select
            id="docType"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="mt-1 block w-full bg-gray-50 dark:bg-brand-blue/50 border-gray-300 dark:border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-gray-900 dark:text-white"
          >
            {REPORT_TYPES.map(option => (
              <option key={option.value} value={option.value}>
                {t(`reportTypes.${option.value}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="topic" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 relative transition-colors duration-500 ${isComplete ? 'strikethrough-animated' : ''}`}>{t('generatorForm.topic')}</label>
          <div className="relative">
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setIsTopicFocused(true)}
              onBlur={() => setIsTopicFocused(false)}
              autoComplete="off"
              className="mt-1 block w-full bg-gray-50 dark:bg-brand-blue/50 border-gray-300 dark:border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-gray-900 dark:text-white"
              placeholder={t('generatorForm.topicPlaceholder')}
            />
            {isTopicFocused && (
              <AISuggestionsDisplay
                suggestions={topicSuggestions}
                isLoading={isTopicSuggestionsLoading}
                onSelect={handleTopicSuggestionSelect}
              />
            )}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="description" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 relative transition-colors duration-500 ${isComplete ? 'strikethrough-animated' : ''}`}>{t('generatorForm.description')}</label>
            <button
                type="button"
                onClick={handleUseExample}
                className="text-xs text-brand-gold hover:underline focus:outline-none"
            >
                {t('generatorForm.useExample')}
            </button>
          </div>
          <div className="relative">
            <textarea
              id="description"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setIsDescriptionFocused(true)}
              onBlur={() => setIsDescriptionFocused(false)}
              className="block w-full bg-gray-50 dark:bg-brand-blue/50 border-gray-300 dark:border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-gray-900 dark:text-white"
              placeholder={t('generatorForm.descriptionPlaceholder')}
            />
            {isDescriptionFocused && (
                <AISuggestionsDisplay
                  suggestions={descriptionSuggestions}
                  isLoading={isDescriptionSuggestionsLoading}
                  onSelect={handleDescriptionSuggestionSelect}
                />
            )}
          </div>
          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-brand-blue/50"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs">{t('camera.orDivider')}</span>
              <div className="flex-grow border-t border-gray-200 dark:border-brand-blue/50"></div>
          </div>
          <div className="space-y-2">
              <CameraInput onCapture={handleCapture} />
              {isExtractingText && (
                  <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('camera.extractingText')}</span>
                  </div>
              )}
              {extractionError && (
                  <p className="mt-2 text-sm text-red-400 text-center">{extractionError}</p>
              )}
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading || isQuotaExhausted}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isQuotaExhausted ? t('quotaErrorModal.title') : t('generatorForm.buttonText')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DraftingForm;