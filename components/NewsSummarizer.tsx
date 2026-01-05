import React, { useState, useMemo } from 'react';
import { GroundingChunk, useLanguage } from '../types';
import { useAISuggestions, AISuggestionsDisplay } from './AISuggestions';
import DocumentDisplay from './ReportDisplay';

interface NewsSummarizerProps {
    onSummarize: (query: string, useThinkingMode: boolean) => void;
    query: string;
    setQuery: (value: string) => void;
    summary: string;
    sources: GroundingChunk[];
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
}

const NewsSummarizer: React.FC<NewsSummarizerProps> = ({
    onSummarize,
    query,
    setQuery,
    summary,
    sources,
    isLoading,
    error,
    isQuotaExhausted
}) => {
    const { t } = useLanguage();
    const [isQueryFocused, setIsQueryFocused] = useState(false);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const { suggestions, isLoading: areSuggestionsLoading, setSuggestions } = useAISuggestions(
        query,
        "Suggest current news topics or areas of interest in Iran",
        !isQuotaExhausted && isQueryFocused,
        'news_summarizer_query'
    );

    const handleSuggestionSelect = (suggestion: string) => {
        setQuery(suggestion);
        setSuggestions([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            alert(t('newsSummarizer.validationError'));
            return;
        }
        onSummarize(query, useThinkingMode);
    };
    
    const handleUseExample = () => {
        setQuery(t('newsSummarizer.example.query'));
    };

    const combinedMarkdown = useMemo(() => {
        if (!summary) return '';
        const sourcesMarkdown = sources.length > 0
            ? `\n\n---\n\n### ${t('newsSummarizer.sourcesTitle')}\n\n` + sources.map(s => {
                if (s.web) {
                    return `- [${s.web.title || s.web.uri}](${s.web.uri})`;
                }
                if (s.maps) {
                    return `- [${s.maps.title || s.maps.uri}](${s.maps.uri}) (Map)`;
                }
                return null;
            }).filter(Boolean).join('\n')
            : '';
        return summary + sourcesMarkdown;
    }, [summary, sources, t]);

    const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-news" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-news"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );

    return (
        <section id="news-summarizer" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto">
                <div className="mt-10 bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="news-query" className="block text-sm font-medium text-gray-300">{t('newsSummarizer.queryLabel')}</label>
                                <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                                    {t('generatorForm.useExample')}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea
                                    id="news-query"
                                    rows={3}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => setIsQueryFocused(true)}
                                    onBlur={() => setIsQueryFocused(false)}
                                    autoComplete="off"
                                    className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                    placeholder={t('newsSummarizer.queryPlaceholder')}
                                />
                                {isQueryFocused && (
                                    <AISuggestionsDisplay
                                        suggestions={suggestions}
                                        isLoading={areSuggestionsLoading}
                                        onSelect={handleSuggestionSelect}
                                    />
                                )}
                            </div>
                        </div>
                        <ThinkingModeToggle />
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || isQuotaExhausted}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? t('newsSummarizer.summarizing') : isQuotaExhausted ? t('quotaErrorModal.title') : t('newsSummarizer.buttonText')}
                            </button>
                        </div>
                    </form>
                </div>

                {(isLoading || error || summary) && (
                    <div className="mt-10 bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-brand-blue/50 animate-fade-in">
                        <DocumentDisplay 
                            generatedDocument={combinedMarkdown}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default NewsSummarizer;