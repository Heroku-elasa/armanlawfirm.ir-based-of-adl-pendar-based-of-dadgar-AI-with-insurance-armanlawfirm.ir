
import React, { useState } from 'react';
import { useLanguage } from '../types';
import { saveSeoAudit } from '../services/dbService';

interface SeoResult {
    category: 'Meta' | 'Content' | 'Mobile' | 'Local';
    item: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    fix?: string;
}

interface SeoCheckerProps {
    onScanComplete?: () => void;
}

const SeoChecker: React.FC<SeoCheckerProps> = ({ onScanComplete }) => {
    const { t } = useLanguage();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState<SeoResult[]>([]);

    const analyzeSite = () => {
        setIsAnalyzing(true);
        setResults([]);
        setScore(0);

        setTimeout(() => {
            const newResults: SeoResult[] = [];
            let passedChecks = 0;
            let totalChecks = 0;

            // 1. Meta Title Check
            totalChecks++;
            const title = document.title;
            if (title && title.length > 10 && title.length < 70) {
                newResults.push({ category: 'Meta', item: 'Page Title', status: 'pass', message: 'Good length.' });
                passedChecks++;
            } else {
                newResults.push({ category: 'Meta', item: 'Page Title', status: 'warn', message: `Current length: ${title.length}. Recommended: 30-60 chars.`, fix: 'Update document.title in React.' });
            }

            // 2. Meta Description Check
            totalChecks++;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && metaDesc.getAttribute('content')) {
                newResults.push({ category: 'Meta', item: 'Meta Description', status: 'pass', message: 'Description tag found.' });
                passedChecks++;
            } else {
                newResults.push({ category: 'Meta', item: 'Meta Description', status: 'fail', message: 'Missing meta description.', fix: 'Add <meta name="description"> to index.html' });
            }

            // 3. H1 Check
            totalChecks++;
            const h1 = document.querySelector('h1');
            if (h1) {
                newResults.push({ category: 'Content', item: 'H1 Tag', status: 'pass', message: 'H1 tag exists.' });
                passedChecks++;
            } else {
                newResults.push({ category: 'Content', item: 'H1 Tag', status: 'fail', message: 'No H1 tag found on this page.', fix: 'Add a main <h1> heading.' });
            }

            // 4. Local SEO (Simulation)
            totalChecks++;
            // We simulate a check for local schema or local presence
            const hasSchema = document.querySelector('script[type="application/ld+json"]');
            if (hasSchema) {
                newResults.push({ category: 'Local', item: 'Schema Markup', status: 'pass', message: 'LocalBusiness Schema found.' });
                passedChecks++;
            } else {
                newResults.push({ category: 'Local', item: 'Schema Markup', status: 'warn', message: 'Missing structured data.', fix: 'Add JSON-LD for "LegalService".' });
            }

            // 5. Image Alt Tags
            totalChecks++;
            const images = document.querySelectorAll('img');
            const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
            if (imagesWithoutAlt.length === 0) {
                newResults.push({ category: 'Content', item: 'Image Alt Text', status: 'pass', message: 'All images have alt text.' });
                passedChecks++;
            } else {
                newResults.push({ category: 'Content', item: 'Image Alt Text', status: 'warn', message: `${imagesWithoutAlt.length} images missing alt text.`, fix: 'Add descriptive alt attributes to images.' });
            }

            const calculatedScore = Math.round((passedChecks / totalChecks) * 100);
            
            setResults(newResults);
            setScore(calculatedScore);
            setIsAnalyzing(false);

            // Save to DB
            const auditData = {
                url: window.location.origin, // Saving current origin as URL
                score: calculatedScore,
                results: newResults
            };
            saveSeoAudit(auditData).then(() => {
                if (onScanComplete) onScanComplete();
            });

        }, 2000);
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'pass': return '✅';
            case 'fail': return '❌';
            case 'warn': return '⚠️';
            default: return '';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">SEO Health & Optimization</h2>
                    <p className="text-sm text-gray-500">Analyze your site for search engine visibility.</p>
                </div>
                <button 
                    onClick={analyzeSite} 
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-brand-gold text-brand-blue font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {isAnalyzing ? (
                        <><div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
                    ) : (
                        'Check SEO Health'
                    )}
                </button>
            </div>

            {score > 0 && !isAnalyzing && (
                <div className="mb-8 flex items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score > 80 ? '#22c55e' : score > 50 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${score}, 100`} className="animate-[spin_1s_ease-out_reverse]" />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-800 dark:text-white">
                            {score}%
                        </div>
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <h3 className="font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Analysis Report</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {results.map((res, idx) => (
                            <div key={idx} className={`p-3 rounded border flex justify-between items-start ${res.status === 'pass' ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : res.status === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200' : 'bg-red-50 dark:bg-red-900/10 border-red-200'}`}>
                                <div>
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <span>{getStatusIcon(res.status)}</span>
                                        <span className="text-gray-700 dark:text-gray-200">{res.item}</span>
                                        <span className="text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500">{res.category}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">{res.message}</p>
                                    {res.fix && (
                                        <div className="mt-2 ml-6 text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 font-mono text-blue-600 dark:text-blue-400">
                                            <strong>Fix:</strong> {res.fix}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">🚀 Improve Your Local Visibility (Iran)</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <li>Register your firm on <a href="https://balad.ir" target="_blank" className="text-blue-600 underline">Balad (بلد)</a> map.</li>
                            <li>Register on <a href="https://neshan.org" target="_blank" className="text-blue-600 underline">Neshan (نشان)</a> map.</li>
                            <li>Create a "Google My Business" profile (if accessible).</li>
                            <li>Submit site to <a href="https://ketabavval.ir" target="_blank" className="text-blue-600 underline">Ketab Avval (کتاب اول)</a>.</li>
                            <li>Ensure NAP (Name, Address, Phone) consistency across all directories.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeoChecker;
