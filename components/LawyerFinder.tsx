
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { findLawyers } from '../services/geminiService';
import { Lawyer, LatLng } from '../types';
import { useLanguage } from '../types';
import { useAISuggestions, AISuggestionsDisplay } from './AISuggestions';

const parseMarkdownLink = (text: string): { url: string; title: string } => {
    const markdownMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(text);
    if (markdownMatch) {
        return { title: markdownMatch[1], url: markdownMatch[2].trim() };
    }
    const url = text.trim();
    if (url.includes('.') && !url.includes(' ')) {
        return { title: url, url: url.startsWith('http') ? url : `https://${url}` };
    }
    return { title: text.trim(), url: '' };
};

const parseLawyerTable = (markdown: string): Lawyer[] => {
    const lawyers: Lawyer[] = [];
    const tableStartIndex = markdown.indexOf('| Name');
    if (tableStartIndex === -1) {
        console.warn("Could not find a markdown table header in the AI response.");
        return [];
    }
    const tableMarkdown = markdown.substring(tableStartIndex);
    const rows = tableMarkdown.split('\n').map(row => row.trim()).filter(row => row.startsWith('|') && row.endsWith('|'));
    if (rows.length < 2) return [];

    const headers = rows[0].split('|').map(h => h.trim().toLowerCase()).slice(1, -1);
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
        if (header.includes('name')) headerMap.name = index;
        if (header.includes('specialty')) headerMap.specialty = index;
        if (header.includes('city')) headerMap.city = index;
        if (header.includes('address')) headerMap.address = index;
        if (header.includes('contact')) headerMap.contactInfo = index;
        if (header.includes('website')) headerMap.website = index;
        if (header.includes('experience')) headerMap.yearsOfExperience = index;
        if (header.includes('relevance')) headerMap.relevanceScore = index;
    });
    
    if (headerMap.name === undefined || headerMap.website === undefined) {
        console.warn("Could not find essential 'Name' or 'Website' headers.");
        return [];
    }

    const dataRows = rows.slice(1).filter(row => !row.includes('---'));
    dataRows.forEach(row => {
        const columns = row.split('|').map(col => col.trim()).slice(1, -1);
        const name = columns[headerMap.name] ?? '';
        if (!name) return;

        const rawLink = columns[headerMap.website] ?? '';
        const linkData = parseMarkdownLink(rawLink);
        if (!linkData.url) return;

        const rawScore = headerMap.relevanceScore !== undefined ? columns[headerMap.relevanceScore] : '0';
        const relevanceScore = parseInt(rawScore?.replace('%', '').trim() || '0', 10);

        const rawExperience = headerMap.yearsOfExperience !== undefined ? columns[headerMap.yearsOfExperience] : '0';
        const yearsOfExperience = parseInt(rawExperience?.trim() || '0', 10);

        lawyers.push({
            name,
            specialty: columns[headerMap.specialty] ?? 'N/A',
            city: columns[headerMap.city] ?? 'N/A',
            address: columns[headerMap.address] ?? 'N/A',
            contactInfo: columns[headerMap.contactInfo] ?? 'N/A',
            website: linkData.url,
            websiteTitle: linkData.title,
            relevanceScore: isNaN(relevanceScore) ? 0 : relevanceScore,
            yearsOfExperience: isNaN(yearsOfExperience) ? 0 : yearsOfExperience,
        });
    });

    return lawyers;
};

interface LawyerFinderProps {
  savedLawyers: Lawyer[];
  onSaveLawyer: (lawyer: Lawyer) => void;
  onRemoveLawyer: (lawyer: Lawyer) => void;
  onClearAllSaved: () => void;
  onNoteChange: (index: number, note: string) => void;
  keywords: string;
  setKeywords: (value: string) => void;
  handleApiError: (err: unknown) => string;
  isQuotaExhausted: boolean;
  allLawyers: Lawyer[];
  onLawyersFound: (lawyers: Lawyer[]) => void;
  onClearAllDbLawyers: () => void;
  preparedSearchQuery: { for: 'lawyer_finder' | 'notary_finder' | null; query: string };
  setPreparedSearchQuery: (query: { for: 'lawyer_finder' | 'notary_finder' | null; query: string }) => void;
  generatedDocument: string;
}

type SortKey = 'relevanceScore' | 'name' | 'city' | 'experience_desc' | 'city_specialty';

const LawyerFinder: React.FC<LawyerFinderProps> = ({ 
    savedLawyers,
    onSaveLawyer,
    onRemoveLawyer,
    onClearAllSaved,
    onNoteChange,
    keywords,
    setKeywords,
    handleApiError,
    isQuotaExhausted,
    allLawyers,
    onLawyersFound,
    onClearAllDbLawyers,
    preparedSearchQuery,
    setPreparedSearchQuery,
    generatedDocument
}) => {
    const { t } = useLanguage();
    const [maxResults, setMaxResults] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [rawTextResult, setRawTextResult] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('relevanceScore');
    const [cityFilter, setCityFilter] = useState<string>('');
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('');
    const [minExperienceFilter, setMinExperienceFilter] = useState<string>('');
    
    const [useLocation, setUseLocation] = useState(false);
    const [location, setLocation] = useState<LatLng | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isKeywordsFocused, setIsKeywordsFocused] = useState(false);
    const { suggestions, isLoading: areSuggestionsLoading, setSuggestions } = useAISuggestions(
        keywords,
        "Suggest common legal specialties or issues for finding a lawyer in Iran",
        !isQuotaExhausted && isKeywordsFocused,
        'lawyer_finder_keywords'
    );
    
    useEffect(() => {
        if (preparedSearchQuery.for === 'lawyer_finder' && preparedSearchQuery.query) {
            setKeywords(preparedSearchQuery.query);
            setShowConfirmation(true);
            window.scrollTo(0, 0);
        }
    }, [preparedSearchQuery, setKeywords]);

    const resetPreparedSearch = () => {
        setShowConfirmation(false);
        setPreparedSearchQuery({ for: null, query: '' });
    };


    const handleSuggestionSelect = (suggestion: string) => {
        setKeywords(suggestion);
        setSuggestions([]);
        resetPreparedSearch();
    };

    const handleUseExample = () => {
        setKeywords(t('lawyerFinder.example.keywords'));
        resetPreparedSearch();
    };

    const handleUseLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setUseLocation(isChecked);
      setLocationError(null);
      if (isChecked) {
        if (!navigator.geolocation) {
          setLocationError("Geolocation is not supported by your browser.");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => {
            setLocationError("Unable to retrieve your location. Please check browser permissions.");
            setUseLocation(false); // uncheck if permission denied
          }
        );
      } else {
        setLocation(null);
      }
    };

    const handleSearch = async () => {
        if (!keywords.trim()) {
            setError(t('lawyerFinder.validationError'));
            return;
        }
        setError(null);
        setRawTextResult(null);
        setIsLoading(true);

        let prompt = t('lawyerFinder.prompt')
            .replace('{queries}', keywords)
            .replace('{maxResults}', maxResults.toString());
        if (useLocation && location) {
            prompt += " The search should be prioritized for lawyers near my current location.";
        }

        try {
            const searchResult = await findLawyers(prompt, useLocation ? location : null);
            const parsed = parseLawyerTable(searchResult.text);
            
            if (parsed.length > 0) {
                onLawyersFound(parsed);
            } else if (searchResult.text) {
                setRawTextResult(searchResult.text);
            }
        } catch (err) {
            const msg = handleApiError(err);
            setError(msg);
        } finally { setIsLoading(false); }
    };

    const handleConfirmAndSearch = () => {
        handleSearch();
        resetPreparedSearch();
    };
    
    const handleWhatsAppShare = (lawyer: Lawyer) => {
        const phone = lawyer.contactInfo.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        if (!phone) {
            alert('No valid phone number found.');
            return;
        }
        const fullPhone = phone.startsWith('98') ? phone : `98${phone.substring(1)}`; // Assuming local numbers start with 0
        const message = t('lawyerFinder.whatsAppMessage');
    
        const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const isLawyerSaved = useCallback((lawyer: Lawyer): boolean => {
        return savedLawyers.some(l => l.name === lawyer.name && l.website === lawyer.website);
    }, [savedLawyers]);

    const sortedLawyers = useMemo(() => {
        const filtered = allLawyers.filter(lawyer => {
            const cityLower = cityFilter.toLowerCase();
            const specialtyLower = specialtyFilter.toLowerCase();
            const minExp = parseInt(minExperienceFilter, 10);

            const lawyerCityLower = lawyer.city?.toLowerCase() || '';
            const lawyerSpecialtyLower = lawyer.specialty?.toLowerCase() || '';

            const cityMatch = !cityLower || lawyerCityLower.includes(cityLower);
            const specialtyMatch = !specialtyLower || lawyerSpecialtyLower.includes(specialtyLower);
            const experienceMatch = isNaN(minExp) || (lawyer.yearsOfExperience ?? 0) >= minExp;

            return cityMatch && specialtyMatch && experienceMatch;
        });

        return [...filtered].sort((a, b) => {
            switch (sortKey) {
                case 'name':
                    return (a.name ?? '').localeCompare(b.name ?? '');
                case 'relevanceScore': 
                    return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
                case 'city': 
                    return (a.city ?? '').localeCompare(b.city ?? '');
                case 'experience_desc':
                    return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
                case 'city_specialty':
                    const cityCompare = (a.city ?? '').localeCompare(b.city ?? '');
                    if (cityCompare !== 0) return cityCompare;
                    return (a.specialty ?? '').localeCompare(b.specialty ?? '');
                default: 
                    return 0;
            }
        });
    }, [allLawyers, sortKey, cityFilter, specialtyFilter, minExperienceFilter]);

    return (
        <section id="lawyer-finder" className="py-16 sm:py-24 space-y-12">
            {showConfirmation && (
                <div className="max-w-3xl mx-auto bg-indigo-900/50 p-6 rounded-lg border-2 border-brand-gold/50 mb-8 animate-fade-in shadow-2xl">
                    <h4 className="text-lg font-semibold text-white">{t('lawyerFinder.aiGeneratedQueryTitle')}</h4>
                    <p className="text-sm text-gray-300 mt-1 mb-4">{t('lawyerFinder.aiGeneratedQuerySubtitle')}</p>
                    <div className="flex gap-4">
                        <button onClick={handleConfirmAndSearch} className="flex-1 bg-brand-gold text-brand-blue font-bold py-2 px-4 rounded-md hover:bg-yellow-200 transition-colors">{t('lawyerFinder.confirmAndSearch')}</button>
                        <button onClick={resetPreparedSearch} className="flex-1 bg-brand-blue/50 text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue/80 border border-brand-blue/80 transition-colors">{t('lawyerFinder.editQuery')}</button>
                    </div>
                </div>
            )}
            <div className="max-w-3xl mx-auto bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50 space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="keywords-prompt" className="block text-sm font-medium text-gray-300">{t('lawyerFinder.keywordsLabel')}</label>
                        <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                            {t('generatorForm.useExample')}
                        </button>
                    </div>
                    <div className="relative">
                        <textarea id="keywords-prompt" rows={3} value={keywords} onChange={(e) => {setKeywords(e.target.value); resetPreparedSearch(); }}
                            onFocus={() => setIsKeywordsFocused(true)}
                            onBlur={() => setIsKeywordsFocused(false)}
                            autoComplete="off"
                            className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                            placeholder={t('lawyerFinder.keywordsPlaceholder')} />
                        {isKeywordsFocused && (
                            <AISuggestionsDisplay
                                suggestions={suggestions}
                                isLoading={areSuggestionsLoading}
                                onSelect={handleSuggestionSelect}
                            />
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor="max-results" className="block text-sm font-medium text-gray-300">{t('lawyerFinder.maxResults')} ({maxResults})</label>
                    <input id="max-results" type="range" min="5" max="25" step="5" value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}
                        className="mt-1 block w-full h-2 bg-brand-blue/80 rounded-lg appearance-none cursor-pointer" />
                </div>
                 <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                    <input
                        type="checkbox"
                        id="use-location-lawyer"
                        checked={useLocation}
                        onChange={handleUseLocationChange}
                        className="h-4 w-4 rounded border-gray-500 text-brand-gold focus:ring-brand-gold bg-brand-blue/50"
                    />
                    <label htmlFor="use-location-lawyer" className="text-sm text-gray-300">
                        {t('common.useLocation')}
                    </label>
                </div>
                {locationError && <p className="text-sm text-red-400 -mt-2">{locationError}</p>}
                <div>
                    <button onClick={handleSearch} disabled={isLoading || !keywords.trim() || isQuotaExhausted}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? t('lawyerFinder.finding') : isQuotaExhausted ? t('quotaErrorModal.title') : t('lawyerFinder.findButton')}
                    </button>
                </div>
            </div>
            
            {savedLawyers.length > 0 && (
                <div className="mt-12 space-y-8 animate-fade-in max-w-5xl mx-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-white">{t('lawyerFinder.savedTitle')}</h3>
                        <button onClick={onClearAllSaved} className="px-3 py-1 bg-red-800/70 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-colors">{t('lawyerFinder.clearAll')}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedLawyers.map((lawyer, index) => (
                            <div key={`${lawyer.website}-${index}`} className="bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-brand-blue/50 p-6 flex flex-col">
                                <a href={lawyer.website} target="_blank" rel="noopener noreferrer" className="hover:underline"><h4 className="text-lg font-bold text-brand-gold">{lawyer.name}</h4></a>
                                <p className="text-sm text-gray-400 mb-2">{lawyer.specialty} - {lawyer.city}</p>
                                <div className="mt-4 pt-4 border-t border-brand-blue/70">
                                    <label htmlFor={`notes-${index}`} className="block text-sm font-medium text-gray-300 mb-2">{t('lawyerFinder.notesLabel')}</label>
                                    <textarea id={`notes-${index}`} rows={3}
                                        className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white transition-colors"
                                        placeholder={t('lawyerFinder.notesPlaceholder')} value={lawyer.notes || ''} onChange={(e) => onNoteChange(index, e.target.value)} />
                                </div>
                                <div className="mt-6">
                                     <button onClick={() => onRemoveLawyer(lawyer)} className="w-full text-center bg-red-700/80 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors">{t('lawyerFinder.remove')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-12 space-y-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">{t('lawyerFinder.crateTitle')}</h3>
                        <p className="text-sm text-gray-400">{t('lawyerFinder.crateSubtitle')}</p>
                    </div>
                     <div className="bg-gradient-to-r from-purple-600 to-brand-gold text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        ✨ {t('lawyerFinder.semanticSearchBadge')}
                    </div>
                    {allLawyers.length > 0 &&
                        <button onClick={onClearAllDbLawyers} className="px-3 py-1 bg-red-800/70 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-colors">{t('lawyerFinder.clearCrate')}</button>
                    }
                </div>

                {isLoading && (
                    <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-gold mx-auto"></div></div>
                )}
                {error && !error.includes('(Quota Exceeded)') && <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>}
                
                {!isLoading && (
                    <div className="space-y-6">
                        {allLawyers.length > 0 ? (
                            <>
                                {/* Filter & Sort Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-brand-blue/20 p-4 rounded-lg border border-brand-blue/50">
                                    <div>
                                        <label htmlFor="city-filter" className="block text-sm font-medium text-gray-400">{t('lawyerFinder.filterByCity')}</label>
                                        <input id="city-filter" type="text" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="..."
                                            className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="specialty-filter" className="block text-sm font-medium text-gray-400">{t('lawyerFinder.filterBySpecialty')}</label>
                                        <input id="specialty-filter" type="text" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} placeholder="..."
                                            className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="experience-filter" className="block text-sm font-medium text-gray-400">{t('lawyerFinder.filterByExperience')}</label>
                                        <input id="experience-filter" type="number" min="0" value={minExperienceFilter} onChange={(e) => setMinExperienceFilter(e.target.value)} placeholder="e.g., 5"
                                            className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <div>
                                            <label htmlFor="sort-key" className="block text-sm font-medium text-gray-400 text-right">{t('lawyerFinder.sortBy')}:</label>
                                            <select id="sort-key" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
                                                className="mt-1 bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white">
                                                <option value="relevanceScore">{t('lawyerFinder.sort.relevance')}</option>
                                                <option value="name">{t('lawyerFinder.sort.name')}</option>
                                                <option value="experience_desc">{t('lawyerFinder.sort.experience_desc')}</option>
                                                <option value="city_specialty">{t('lawyerFinder.sort.city_specialty')}</option>
                                                <option value="city">{t('lawyerFinder.sort.city')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {sortedLawyers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {sortedLawyers.map((lawyer) => (
                                            <div key={lawyer.website} className="bg-brand-blue/30 rounded-lg p-6 flex flex-col border border-brand-blue/50">
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-lg font-bold text-brand-gold truncate pr-2" title={lawyer.name}>{lawyer.name}</h4>
                                                        {lawyer.yearsOfExperience !== undefined && lawyer.yearsOfExperience > 0 && (
                                                            <div className="text-sm text-gray-300 bg-brand-blue/70 px-2 py-1 rounded-md flex-shrink-0">{lawyer.yearsOfExperience} years</div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-3">{lawyer.specialty} - {lawyer.city}</p>
                                                    <div className="space-y-2 text-sm">
                                                        <p><strong className="text-gray-300">{t('lawyerFinder.address')}:</strong> {lawyer.address}</p>
                                                        <p><strong className="text-gray-300">{t('lawyerFinder.contact')}:</strong> {lawyer.contactInfo}</p>
                                                        <a href={lawyer.website} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline block truncate">{lawyer.websiteTitle}</a>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-brand-blue/70 flex flex-col sm:flex-row gap-3">
                                                    <button onClick={() => onSaveLawyer(lawyer)} disabled={isLawyerSaved(lawyer)} className="flex-1 text-center font-semibold py-2 px-4 rounded-md transition-colors bg-brand-gold text-brand-blue hover:bg-yellow-200 disabled:bg-brand-gold/20 disabled:text-gray-400 disabled:cursor-not-allowed">{isLawyerSaved(lawyer) ? t('lawyerFinder.saved') : t('lawyerFinder.save')}</button>
                                                    {generatedDocument && (
                                                        <button onClick={() => handleWhatsAppShare(lawyer)} className="flex-1 flex items-center justify-center gap-2 text-center font-semibold py-2 px-4 rounded-md transition-colors bg-green-600 text-white hover:bg-green-700">
                                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.512 1.916 6.36l-.348 1.251 1.27 1.27.347-1.252z"/></svg>
                                                            {t('lawyerFinder.sendWhatsApp')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-10 bg-brand-blue/30 rounded-lg"><p>{t('lawyerFinder.noFilterResults')}</p></div>
                                )}
                            </>
                        ) : (
                            rawTextResult ? (
                                <div className="p-6 bg-brand-blue/50 border border-brand-blue/70 rounded-lg">
                                    <h4 className="font-semibold text-white mb-2">{t('lawyerFinder.parseErrorTitle')}</h4>
                                    <pre className="whitespace-pre-wrap bg-black/30 p-4 rounded-md text-sm text-gray-300">{rawTextResult}</pre>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-10 bg-brand-blue/30 rounded-lg"><p>{t('lawyerFinder.crateEmpty')}</p></div>
                            )
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default LawyerFinder;
