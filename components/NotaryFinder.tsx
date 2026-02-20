
import React, { useState, useMemo, useEffect } from 'react';
import { Notary, useLanguage, LatLng } from '../types';
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

const parseNotaryTable = (markdown: string): Notary[] => {
    const notaries: Notary[] = [];
    const tableStartIndex = markdown.indexOf('| Office Name');
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
        if (header.includes('office name')) headerMap.officeName = index;
        if (header.includes('city')) headerMap.city = index;
        if (header.includes('address')) headerMap.address = index;
        if (header.includes('contact')) headerMap.contactInfo = index;
        if (header.includes('website')) headerMap.website = index;
        if (header.includes('services')) headerMap.services = index;
    });
    
    if (headerMap.officeName === undefined) {
        console.warn("Could not find essential 'Office Name' header.");
        return [];
    }

    const dataRows = rows.slice(1).filter(row => !row.includes('---'));
    dataRows.forEach(row => {
        const columns = row.split('|').map(col => col.trim()).slice(1, -1);
        const officeName = columns[headerMap.officeName] ?? '';
        if (!officeName) return;

        const rawLink = headerMap.website !== undefined ? columns[headerMap.website] : '';
        const linkData = parseMarkdownLink(rawLink ?? '');

        notaries.push({
            officeName,
            city: columns[headerMap.city] ?? 'N/A',
            address: columns[headerMap.address] ?? 'N/A',
            contactInfo: columns[headerMap.contactInfo] ?? 'N/A',
            website: linkData.url,
            websiteTitle: linkData.title,
            services: headerMap.services !== undefined ? columns[headerMap.services] : undefined,
        });
    });

    return notaries;
};


interface NotaryFinderProps {
  onSearch: (query: string, location: LatLng | null) => Promise<string | null>;
  keywords: string;
  setKeywords: (value: string) => void;
  results: Notary[]; // This prop seems unused, internal state manages display
  isLoading: boolean;
  error: string | null;
  isQuotaExhausted: boolean;
  preparedSearchQuery: { for: 'lawyer_finder' | 'notary_finder' | null; query: string };
  setPreparedSearchQuery: (query: { for: 'lawyer_finder' | 'notary_finder' | null; query: string }) => void;
  generatedDocument: string;
}

type SortKey = 'officeName' | 'city';

const NotaryFinder: React.FC<NotaryFinderProps> = ({ 
    onSearch, keywords, setKeywords, isLoading, error, isQuotaExhausted, preparedSearchQuery, setPreparedSearchQuery, generatedDocument
}) => {
    const { t } = useLanguage();
    const [rawTextResult, setRawTextResult] = useState<string | null>(null);
    const [parsedResults, setParsedResults] = useState<Notary[]>([]);
    
    // State for filtering and sorting
    const [cityFilter, setCityFilter] = useState<string>('');
    const [officeNameFilter, setOfficeNameFilter] = useState<string>('');
    const [serviceFilter, setServiceFilter] = useState<string>('');
    const [sortKey, setSortKey] = useState<SortKey>('officeName');

    const [useLocation, setUseLocation] = useState(false);
    const [location, setLocation] = useState<LatLng | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isKeywordsFocused, setIsKeywordsFocused] = useState(false);
    const { suggestions, isLoading: areSuggestionsLoading, setSuggestions } = useAISuggestions(
        keywords,
        "Suggest common services provided by a Notary Public office in Iran",
        !isQuotaExhausted && isKeywordsFocused,
        'notary_finder_keywords'
    );

    useEffect(() => {
        if (preparedSearchQuery.for === 'notary_finder' && preparedSearchQuery.query) {
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
        setKeywords(t('notaryFinder.example.keywords'));
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

    const handleSearchInternal = async () => {
        if (!keywords.trim()) {
            alert(t('notaryFinder.validationError'));
            return;
        }
        setRawTextResult(null);
        setParsedResults([]);
        
        const resultText = await onSearch(keywords, useLocation ? location : null);

        if (resultText) {
            const parsed = parseNotaryTable(resultText);
            if (parsed.length > 0) {
                setParsedResults(parsed);
            } else {
                setRawTextResult(resultText);
            }
        }
    };

    const handleConfirmAndSearch = () => {
        handleSearchInternal();
        resetPreparedSearch();
    };
    
    const handleWhatsAppShare = (notary: Notary) => {
        const phone = notary.contactInfo.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        if (!phone) {
            alert('No valid phone number found.');
            return;
        }
        const fullPhone = phone.startsWith('98') ? phone : `98${phone.substring(1)}`;
        const message = t('notaryFinder.whatsAppMessage');
    
        const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };


    const filteredAndSortedResults = useMemo(() => {
        const filtered = parsedResults.filter(notary => {
            const cityLower = cityFilter.toLowerCase();
            const nameLower = officeNameFilter.toLowerCase();
            const serviceLower = serviceFilter.toLowerCase();
            
            const notaryCityLower = notary.city?.toLowerCase() || '';
            const notaryNameLower = notary.officeName?.toLowerCase() || '';
            const notaryServicesLower = notary.services?.toLowerCase() || '';

            const cityMatch = !cityLower || notaryCityLower.includes(cityLower);
            const nameMatch = !nameLower || notaryNameLower.includes(nameLower);
            const serviceMatch = !serviceLower || notaryServicesLower.includes(serviceLower);

            return cityMatch && nameMatch && serviceMatch;
        });

        return [...filtered].sort((a, b) => {
            switch(sortKey) {
                case 'city':
                    return (a.city ?? '').localeCompare(b.city ?? '');
                case 'officeName':
                default:
                    return (a.officeName ?? '').localeCompare(b.officeName ?? '');
            }
        });

    }, [parsedResults, cityFilter, officeNameFilter, serviceFilter, sortKey]);
    
    return (
        <section id="notary-finder" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto">
                 {showConfirmation && (
                    <div className="max-w-3xl mx-auto bg-indigo-900/50 p-6 rounded-lg border-2 border-brand-gold/50 mb-8 animate-fade-in shadow-2xl">
                        <h4 className="text-lg font-semibold text-white">{t('notaryFinder.aiGeneratedQueryTitle')}</h4>
                        <p className="text-sm text-gray-300 mt-1 mb-4">{t('notaryFinder.aiGeneratedQuerySubtitle')}</p>
                        <div className="flex gap-4">
                            <button onClick={handleConfirmAndSearch} className="flex-1 bg-brand-gold text-brand-blue font-bold py-2 px-4 rounded-md hover:bg-yellow-200 transition-colors">{t('notaryFinder.confirmAndSearch')}</button>
                            <button onClick={resetPreparedSearch} className="flex-1 bg-brand-blue/50 text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue/80 border border-brand-blue/80 transition-colors">{t('notaryFinder.editQuery')}</button>
                        </div>
                    </div>
                )}
                <div className="mt-10 bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearchInternal(); }} className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="notary-keywords" className="block text-sm font-medium text-gray-300">{t('notaryFinder.keywordsLabel')}</label>
                                <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                                    {t('generatorForm.useExample')}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea
                                    id="notary-keywords"
                                    rows={3}
                                    value={keywords}
                                    onChange={(e) => { setKeywords(e.target.value); resetPreparedSearch(); }}
                                    onFocus={() => setIsKeywordsFocused(true)}
                                    onBlur={() => setIsKeywordsFocused(false)}
                                    autoComplete="off"
                                    className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                    placeholder={t('notaryFinder.keywordsPlaceholder')}
                                />
                                {isKeywordsFocused && (
                                    <AISuggestionsDisplay
                                        suggestions={suggestions}
                                        isLoading={areSuggestionsLoading}
                                        onSelect={handleSuggestionSelect}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                            <input
                                type="checkbox"
                                id="use-location-notary"
                                checked={useLocation}
                                onChange={handleUseLocationChange}
                                className="h-4 w-4 rounded border-gray-500 text-brand-gold focus:ring-brand-gold bg-brand-blue/50"
                            />
                            <label htmlFor="use-location-notary" className="text-sm text-gray-300">
                                {t('common.useLocation')}
                            </label>
                        </div>
                        {locationError && <p className="text-sm text-red-400 -mt-2">{locationError}</p>}
                        <div>
                             <button
                                type="submit"
                                disabled={isLoading || isQuotaExhausted}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? t('notaryFinder.finding') : isQuotaExhausted ? t('quotaErrorModal.title') : t('notaryFinder.findButton')}
                            </button>
                        </div>
                    </form>
                </div>

                 {(isLoading || error || parsedResults.length > 0 || rawTextResult) && (
                    <div className="mt-10 animate-fade-in">
                        <div className="mb-4">
                            <h3 className="text-2xl font-semibold text-white">{t('notaryFinder.resultsTitle')}</h3>
                        </div>
                        <div className="space-y-6">
                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-brand-gold"></div>
                                    <span className="ml-3 text-gray-400">{t('notaryFinder.finding')}</span>
                                </div>
                            )}
                            {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>}
                            
                            {parsedResults.length > 0 && (
                                <>
                                 {/* Filter & Sort Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-brand-blue/20 p-4 rounded-lg border border-brand-blue/50">
                                    <div>
                                        <label htmlFor="notary-city-filter" className="block text-sm font-medium text-gray-400">{t('notaryFinder.filterByCity')}</label>
                                        <input id="notary-city-filter" type="text" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="..."
                                            className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="notary-name-filter" className="block text-sm font-medium text-gray-400">{t('notaryFinder.filterByOfficeName')}</label>
                                        <input id="notary-name-filter" type="text" value={officeNameFilter} onChange={(e) => setOfficeNameFilter(e.target.value)} placeholder="..."
                                            className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="notary-service-filter" className="block text-sm font-medium text-gray-400">{t('notaryFinder.filterByService')}</label>
                                        <input id="notary-service-filter" type="text" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} placeholder="..."
                                            className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <div>
                                            <label htmlFor="notary-sort-key" className="block text-sm font-medium text-gray-400 text-right">{t('notaryFinder.sortBy')}:</label>
                                            <select id="notary-sort-key" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
                                                className="mt-1 bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white">
                                                <option value="officeName">{t('notaryFinder.sort.officeName')}</option>
                                                <option value="city">{t('notaryFinder.sort.city')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {filteredAndSortedResults.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredAndSortedResults.map((notary, index) => (
                                            <div key={index} className="bg-brand-blue/30 rounded-lg p-6 border border-brand-blue/50 flex flex-col">
                                                <div className="flex-grow">
                                                  <h4 className="text-lg font-bold text-brand-gold truncate" title={notary.officeName}>{notary.officeName}</h4>
                                                  <p className="text-sm text-gray-400 mb-3">{notary.city}</p>
                                                  <div className="space-y-2 text-sm">
                                                      <p><strong className="text-gray-300">{t('notaryFinder.address')}:</strong> {notary.address}</p>
                                                      <p><strong className="text-gray-300">{t('notaryFinder.contact')}:</strong> {notary.contactInfo}</p>
                                                      {notary.services && <p><strong className="text-gray-300">{t('notaryFinder.services')}:</strong> {notary.services}</p>}
                                                      {notary.website && (
                                                          <a href={notary.website} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline block truncate">{notary.websiteTitle}</a>
                                                      )}
                                                  </div>
                                                </div>
                                                 {generatedDocument && (
                                                    <div className="mt-6 pt-4 border-t border-brand-blue/70">
                                                        <button onClick={() => handleWhatsAppShare(notary)} className="w-full flex items-center justify-center gap-2 text-center font-semibold py-2 px-4 rounded-md transition-colors bg-green-600 text-white hover:bg-green-700">
                                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.512 1.916 6.36l-.348 1.251 1.27 1.27.347-1.252z"/></svg>
                                                            {t('notaryFinder.sendWhatsApp')}
                                                        </button>
                                                    </div>
                                                 )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-10 bg-brand-blue/30 rounded-lg"><p>{t('notaryFinder.noFilterResults')}</p></div>
                                )}
                                </>
                            )}

                            {rawTextResult && (
                                <div className="p-6 bg-brand-blue/50 border border-brand-blue/70 rounded-lg">
                                    <h4 className="font-semibold text-white mb-2">{t('notaryFinder.parseErrorTitle')}</h4>
                                    <p className="text-sm text-gray-400 mb-4">{t('notaryFinder.parseErrorSubtitle')}</p>
                                    <pre className="whitespace-pre-wrap bg-black/30 p-4 rounded-md text-sm text-gray-300">{rawTextResult}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                 )}
            </div>
        </section>
    );
};

export default NotaryFinder;
