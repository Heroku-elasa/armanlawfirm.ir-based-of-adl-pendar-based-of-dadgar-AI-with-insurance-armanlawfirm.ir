
import React, { useState, useMemo } from 'react';
import { GroundingChunk, useLanguage } from '../types';
import DocumentDisplay from './ReportDisplay';

interface GeneralQuestionsProps {
    onAskAI: (query: string) => void;
    aiQuery: string;
    setAiQuery: (value: string) => void;
    aiAnswer: string;
    aiSources: GroundingChunk[];
    isLoading: boolean;
    error: string | null;
}

const GeneralQuestions: React.FC<GeneralQuestionsProps> = ({ onAskAI, aiQuery, setAiQuery, aiAnswer, aiSources, isLoading, error }) => {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const categories = [
        { key: 'all', label: t('generalQuestionsPage.categories.general') }, // Using general label for 'All' initially or iterate keys
        { key: 'general', label: t('generalQuestionsPage.categories.general') },
        { key: 'legal', label: t('generalQuestionsPage.categories.legal') },
        { key: 'ai', label: t('generalQuestionsPage.categories.ai') },
        { key: 'security', label: t('generalQuestionsPage.categories.security') },
    ];

    const allItems = t('generalQuestionsPage.items') as { category: string; q: string; a: string }[];

    const filteredItems = allItems.filter(item => {
        const matchesCategory = activeCategory === 'all' || activeCategory === 'general' && item.category === 'general' || item.category === activeCategory; // Simplified logic for demo, refined below
        // Better category logic:
        const catMatch = activeCategory === 'all' ? true : item.category === activeCategory;
        const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase());
        return catMatch && matchesSearch;
    });

    // Unique handling for 'all' since the mock data might strictly use specific keys
    const finalItems = activeCategory === 'all' 
        ? allItems.filter(i => i.q.toLowerCase().includes(searchQuery.toLowerCase()) || i.a.toLowerCase().includes(searchQuery.toLowerCase()))
        : filteredItems;

    const handleAskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(aiQuery.trim()) onAskAI(aiQuery);
    };

    const combinedMarkdown = useMemo(() => {
        if (!aiAnswer) return '';
        const sourcesMarkdown = aiSources && aiSources.length > 0
            ? `\n\n---\n\n### ${t('newsSummarizer.sourcesTitle')}\n\n` + aiSources.map(s => {
                if (s.web) {
                    return `- [${s.web.title || s.web.uri}](${s.web.uri})`;
                }
                if (s.maps) {
                    return `- [${s.maps.title || s.maps.uri}](${s.maps.uri}) (Map)`;
                }
                return null;
            }).filter(Boolean).join('\n')
            : '';
        return aiAnswer + sourcesMarkdown;
    }, [aiAnswer, aiSources, t]);

    return (
        <div className="animate-fade-in min-h-screen bg-gray-50 dark:bg-[#111827] transition-colors">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-brand-blue to-[#111827] text-white py-16 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('generalQuestionsPage.title')}</h1>
                    <p className="text-lg text-gray-300 mb-8">{t('generalQuestionsPage.subtitle')}</p>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('generalQuestionsPage.searchPlaceholder')}
                            className="w-full p-4 pr-12 rounded-xl text-gray-900 border-none focus:ring-4 focus:ring-brand-gold/50 shadow-xl"
                        />
                        <svg className="w-6 h-6 text-gray-400 absolute top-1/2 right-4 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {categories.slice(1).map((cat) => ( // Skip 'all' for buttons if desired, or keep it
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                activeCategory === cat.key
                                    ? 'bg-brand-gold text-brand-blue shadow-lg scale-105'
                                    : 'bg-white dark:bg-brand-blue/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-blue border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    <button onClick={() => setActiveCategory('all')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === 'all' ? 'bg-brand-gold text-brand-blue shadow-lg' : 'bg-white dark:bg-brand-blue/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                        همه
                    </button>
                </div>

                {/* FAQ List */}
                <div className="max-w-3xl mx-auto space-y-4">
                    {finalItems.length > 0 ? finalItems.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-brand-blue/30 border border-gray-200 dark:border-brand-blue/50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <button
                                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                className="w-full text-right px-6 py-4 flex justify-between items-center focus:outline-none"
                            >
                                <span className="font-semibold text-gray-800 dark:text-white text-lg">{item.q}</span>
                                <svg className={`w-5 h-5 text-brand-gold transform transition-transform duration-300 ${expandedIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700/50 pt-4">
                                    {item.a}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-500 py-10">
                            <p>موردی یافت نشد.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ask AI Section */}
            <div className="bg-brand-blue text-white py-16 mt-12">
                <div className="container mx-auto px-4 text-center max-w-2xl">
                    <h2 className="text-3xl font-bold mb-4">{t('generalQuestionsPage.aiSection.title')}</h2>
                    <p className="text-gray-400 mb-8">{t('generalQuestionsPage.aiSection.subtitle')}</p>
                    <form onSubmit={handleAskSubmit} className="space-y-4">
                        <textarea
                            rows={4}
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder={t('generalQuestionsPage.aiSection.inputPlaceholder')}
                            className="w-full p-4 rounded-xl bg-brand-blue/50 border border-brand-gold/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !aiQuery}
                            className="px-8 py-3 bg-brand-gold text-brand-blue font-bold rounded-full hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? t('generalQuestionsPage.aiSection.thinking') : t('generalQuestionsPage.aiSection.button')}
                        </button>
                    </form>
                    
                    {(isLoading || error || aiAnswer) && (
                        <div className="mt-8 text-right animate-fade-in">
                             {isLoading && !aiAnswer && (
                                 <div className="bg-brand-blue/50 p-6 rounded-xl border border-brand-gold/20">
                                     <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-brand-gold"></div>
                                        <span className="ml-3 text-gray-400">{t('generalQuestionsPage.aiSection.thinking')}</span>
                                    </div>
                                 </div>
                             )}
                             {error && <div className="p-3 bg-red-900/50 text-red-200 rounded-lg">{error}</div>}
                             
                             {!isLoading && !error && aiAnswer && (
                                 <div className="bg-brand-blue/30 rounded-xl overflow-hidden border border-brand-gold/20 shadow-lg">
                                     <div className="p-4 bg-brand-blue/50 border-b border-brand-blue/70 flex justify-between items-center">
                                         <h4 className="text-brand-gold font-bold">پاسخ هوش مصنوعی (با جستجوی گوگل):</h4>
                                     </div>
                                     <DocumentDisplay
                                        generatedDocument={combinedMarkdown}
                                        isLoading={false}
                                        error={null}
                                     />
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralQuestions;
