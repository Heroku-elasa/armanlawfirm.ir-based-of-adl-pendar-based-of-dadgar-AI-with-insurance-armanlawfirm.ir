import React, { useMemo, useState } from 'react';
import { GroundingChunk, useLanguage } from '../types';
import DocumentDisplay from './ReportDisplay';

interface WebAnalyzerProps {
    onAnalyze: (url: string, query: string, useThinkingMode: boolean) => void;
    url: string;
    setUrl: (value: string) => void;
    query: string;
    setQuery: (value: string) => void;
    result: string;
    sources: GroundingChunk[];
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
}

const WebAnalyzer: React.FC<WebAnalyzerProps> = ({
    onAnalyze,
    url,
    setUrl,
    query,
    setQuery,
    result,
    sources,
    isLoading,
    error,
    isQuotaExhausted
}) => {
    const { t } = useLanguage();
    const [useThinkingMode, setUseThinkingMode] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || !query.trim()) {
            alert(t('webAnalyzer.validationError'));
            return;
        }
        onAnalyze(url, query, useThinkingMode);
    };

    const handleUseExample = () => {
        setUrl(t('webAnalyzer.example.url'));
        setQuery(t('webAnalyzer.example.query'));
    };
    
    const combinedMarkdown = useMemo(() => {
        if (!result) return '';
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
        return result + sourcesMarkdown;
    }, [result, sources, t]);

    const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-web" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-web"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );

    return (
        <section id="web-analyzer" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto">
                <div className="mt-10 bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                             <div className="flex justify-between items-center mb-1">
                                <label htmlFor="web-analyzer-url" className="block text-sm font-medium text-gray-300">{t('webAnalyzer.urlLabel')}</label>
                                <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                                    {t('generatorForm.useExample')}
                                </button>
                            </div>
                            <input
                                type="url"
                                id="web-analyzer-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                placeholder={t('webAnalyzer.urlPlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="web-analyzer-query" className="block text-sm font-medium text-gray-300">{t('webAnalyzer.queryLabel')}</label>
                            <textarea
                                id="web-analyzer-query"
                                rows={3}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                placeholder={t('webAnalyzer.queryPlaceholder')}
                            />
                        </div>
                        <ThinkingModeToggle />
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || isQuotaExhausted}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? t('webAnalyzer.analyzing') : isQuotaExhausted ? t('quotaErrorModal.title') : t('webAnalyzer.buttonText')}
                            </button>
                        </div>
                    </form>
                </div>

                {(isLoading || error || result) && (
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

export default WebAnalyzer;