
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { marked } from 'marked';
import { useLanguage } from '../types';

interface DocumentDisplayProps {
  generatedDocument: string;
  isLoading: boolean;
  error: string | null;
}

const getDocumentStyles = () => `
    @font-face {
        font-family: 'Iransans';
        font-weight: 400;
        src: url('https://sevinsazeh.com/wp-content/uploads/2024/03/IRANSansWebFaNum.woff2') format('woff2'),
             url('https://sevinsazeh.com/wp-content/uploads/2024/03/IRANSansWebFaNum.woff') format('woff');
    }
    @font-face {
        font-family: 'Iransans';
        font-weight: 700;
        src: url('https://sevinsazeh.com/wp-content/uploads/2024/03/IRANSansWebFaNum_Bold.woff2') format('woff2'),
             url('https://sevinsazeh.com/wp-content/uploads/2024/03/IRANSansWebFaNum_Bold.woff') format('woff');
    }
    body { font-family: 'Iransans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; background-color: #f3f4f6; padding: 2rem; margin: 0; color: #111827; }
    .document-page { background-color: #ffffff; color: #111827; padding: 2.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); max-width: 8.5in; min-height: 10in; margin: 0 auto; }
    .document-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
    .document-logo { display: flex; align-items: center; gap: 0.75rem; }
    .document-logo svg { height: 50px; width: auto; }
    .document-logo span { font-size: 1.125rem; font-weight: 700; color: #374151; }
    .document-header-info { text-align: right; font-size: 0.875rem; color: #4b5563; }
    body[dir="rtl"] .document-header-info { text-align: left; }
    .document-body { color: #111827; max-width: none; }
    .document-body h1, .document-body h2, .document-body h3, .document-body h4 { color: #111827; font-family: 'Iransans', 'Inter', sans-serif; }
    .document-body p, .document-body li { color: #374151; line-height: 2; }
    body[dir="rtl"] { direction: rtl; }
    body[dir="rtl"] .document-body { text-align: right; }
    body[dir="rtl"] .document-body p, body[dir="rtl"] .document-body li { text-align: justify; }
    h1, h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    code { font-family: monospace; background-color: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; text-align: left; direction: ltr; }
    pre code { background-color: transparent; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    body[dir="ltr"] td { text-align: left; }
    body[dir="rtl"] td { text-align: right; }
    th { background-color: #f2f2f2; }
    blockquote { color: #666; margin: 0; padding-inline-start: 1em; border-inline-start: 0.25em solid #dfe2e5; }
    ul { padding-inline-start: 20px; }
    mark { background-color: #fde047; padding: 2px 1px; border-radius: 2px; color: inherit; }
    mark.current-match { background-color: #f97316; color: white; }
`;

const DocumentDisplay: React.FC<DocumentDisplayProps> = ({ generatedDocument, isLoading, error }) => {
  const { t, language } = useLanguage();
  const endOfReportRef = useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [reportHtml, setReportHtml] = useState('');
  const currentDate = useMemo(() => new Date().toLocaleDateString(language === 'fa' ? 'fa-IR-u-nu-latn' : 'en-US'), [language]);

  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const isComplete = !isLoading && generatedDocument.length > 0 && !error;

  const searchMatches = useMemo(() => {
    if (!generatedDocument || !searchQuery) {
      return [];
    }
    // Escape special characters for regex
    const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(generatedDocument)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
      });
    }
    return matches;
  }, [generatedDocument, searchQuery]);

  // Reset search index when query changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentMatchIndex(searchMatches.length > 0 ? 0 : -1);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, searchMatches]);

  // Scroll to the current match
  useEffect(() => {
    if (currentMatchIndex > -1) {
      const element = document.getElementById(`search-match-${currentMatchIndex}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentMatchIndex]);

  const highlightedMarkdown = useMemo(() => {
    if (!searchQuery || searchMatches.length === 0) {
      return generatedDocument;
    }

    let lastIndex = 0;
    const parts = [];
    searchMatches.forEach((match, index) => {
      // Add the text before the match
      parts.push(generatedDocument.substring(lastIndex, match.index));
      // Add the highlighted match
      const isCurrent = index === currentMatchIndex;
      const className = isCurrent ? 'current-match' : '';
      const id = `search-match-${index}`;
      const originalText = generatedDocument.substring(match.index, match.index + match.length);
      parts.push(
        `<mark id="${id}" class="${className}">${originalText}</mark>`
      );
      lastIndex = match.index + match.length;
    });
    // Add the remaining text
    parts.push(generatedDocument.substring(lastIndex));
    return parts.join('');
  }, [generatedDocument, searchQuery, searchMatches, currentMatchIndex]);


  useEffect(() => {
    if (isLoading) {
      endOfReportRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatedDocument, isLoading]);

  useEffect(() => {
    let isMounted = true;
    const parseMarkdown = async () => {
      if (highlightedMarkdown) {
        const html = await marked.parse(highlightedMarkdown);
        if (isMounted) setReportHtml(html);
      } else {
        if (isMounted) setReportHtml('');
      }
    };
    parseMarkdown();
    return () => { isMounted = false; };
  }, [highlightedMarkdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadFile = (filename: string, content: string | Blob | ArrayBuffer, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocument);
    setIsExportMenuOpen(false);
  };
  
  const handleDownloadMD = () => {
    downloadFile('document.md', generatedDocument, 'text/markdown;charset=utf-8');
    setIsExportMenuOpen(false);
  };

  const handleDownloadDOCX = async () => {
    const reportHtmlString = await createHtmlContent(generatedDocument);
    try {
      const htmlToDocxModule = await import('html-to-docx');
      const htmlToDocx = htmlToDocxModule.default;
      
      if (typeof htmlToDocx !== 'function') {
        console.error('Failed to load html-to-docx function', htmlToDocxModule);
        throw new Error('Could not convert to DOCX. The library did not load correctly.');
      }

      const docxBlob = await htmlToDocx(reportHtmlString, '', {
        margins: { top: 720, right: 720, bottom: 720, left: 720 }
      });
      downloadFile('document.docx', docxBlob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch (e) {
      console.error("Error converting HTML to DOCX:", e);
      alert(e instanceof Error ? e.message : "An error occurred while trying to generate the DOCX file.");
    }
    setIsExportMenuOpen(false);
  };
  
  const createHtmlContent = async (markdownContent: string) => {
    const parsedHtml = await marked.parse(markdownContent);
    const styles = getDocumentStyles();
    const dir = language === 'fa' ? 'rtl' : 'ltr';
    const lang = language;

    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t('reportDisplay.docTitle')}</title>
  <style>${styles}</style>
</head>
<body dir="${dir}">
  <div class="document-page">
    <div class="document-header">
        <div class="document-logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="%23002279"/><path d="M32 12V20M32 20H18C16.8954 20 16 20.8954 16 22V24C16 25.1046 16.8954 26 18 26H32M32 20H46C47.1046 20 48 20.8954 48 22V24C48 25.1046 47.1046 26 46 26H32M18 26L22 48M46 26L42 48M14 52H50" stroke="%23D3B574" stroke-width="2.5"/></svg>
            <span>دادگر AI</span>
        </div>
        <div class="document-header-info">
            <p><strong>${t('reportDisplay.headerDate')}:</strong> ${currentDate}</p>
            <p><strong>${t('reportDisplay.headerCaseNo')}:</strong> ${t('reportDisplay.caseNoPlaceholder')}</p>
        </div>
    </div>
    <div class="document-body">
      ${parsedHtml}
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadHTML = async () => {
    const htmlContent = await createHtmlContent(generatedDocument);
    downloadFile('document.html', htmlContent, 'text/html;charset=utf-8');
    setIsExportMenuOpen(false);
  };

  const handlePrint = async () => {
    const htmlContent = await createHtmlContent(generatedDocument);
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    setIsExportMenuOpen(false);
  };

  const handleShareEmail = () => {
    const subject = t('reportDisplay.docTitle');
    const body = `Please find the legal document details below:\n\n---\n\n${generatedDocument}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setIsExportMenuOpen(false);
  };

  const handleShareWhatsApp = () => {
    const text = `${t('reportDisplay.docTitle')}\n\n---\n\n${generatedDocument}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setIsExportMenuOpen(false);
  };

  const handleSendToSupport = () => {
      const text = `سلام، لطفا این سند تولید شده توسط هوش مصنوعی را بررسی کنید:\n\n---\n\n${generatedDocument}`;
      const url = `https://wa.me/989027370260?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      setIsExportMenuOpen(false);
  };

  const handleNextMatch = () => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length);
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col">
      <div className="flex justify-between items-center p-4 bg-brand-blue/50 border-b border-brand-blue relative">
        <h3 className="text-lg font-semibold text-white flex items-center" key={isComplete ? 'complete' : 'pending'}>
          {isComplete && (
            <svg className="h-5 w-5 text-green-400 ml-2 animate-fade-in" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {t('reportDisplay.title')}
        </h3>
        <div className="flex items-center space-x-2">
            {isComplete && (
                 <button onClick={() => setIsSearchVisible(prev => !prev)} className="p-1.5 text-white hover:bg-brand-blue/80 rounded-md transition-colors" title="Search document">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                 </button>
            )}
            {isComplete && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setIsExportMenuOpen(prev => !prev)}
                  className="px-3 py-1 bg-brand-blue hover:bg-brand-blue/80 text-white text-sm rounded-md transition-colors flex items-center"
                >
                  {t('reportDisplay.export')}
                  <svg className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''} ${language === 'fa' ? 'mr-2' : 'ml-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isExportMenuOpen && (
                  <div className={`absolute mt-2 w-56 bg-brand-blue rounded-md shadow-lg z-20 border border-brand-blue/50 ${language === 'fa' ? 'left-0' : 'right-0'}`}>
                    <ul className="py-1 text-white text-sm">
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handleCopy}>{t('reportDisplay.copy')}</li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handleDownloadMD}>{t('reportDisplay.downloadMD')}</li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handleDownloadDOCX}>{t('reportDisplay.downloadDOCX')}</li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handleDownloadHTML}>{t('reportDisplay.downloadHTML')}</li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handlePrint}>{t('reportDisplay.printPDF')}</li>
                      <li className="border-t border-brand-blue/50 my-1"></li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer text-green-400 font-semibold" onClick={handleSendToSupport}>{t('reportDisplay.sendToSupport')}</li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handleShareWhatsApp}>{t('reportDisplay.shareWhatsApp')}</li>
                      <li className="px-4 py-2 hover:bg-brand-blue/70 cursor-pointer" onClick={handleShareEmail}>{t('reportDisplay.shareEmail')}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
        </div>
        {isSearchVisible && isComplete && (
            <div className="absolute top-full left-0 right-0 bg-brand-blue/80 backdrop-blur-sm p-2 z-10 border-b border-brand-blue flex items-center gap-2 animate-fade-in">
                 <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-grow bg-indigo-950/80 border-brand-blue/70 rounded-md py-1 px-3 focus:outline-none focus:ring-2 focus:ring-brand-gold text-white text-sm"
                />
                <span className="text-xs text-gray-300 w-20 text-center">
                    {searchMatches.length > 0 ? `${currentMatchIndex + 1} / ${searchMatches.length}` : '0 / 0'}
                </span>
                <button onClick={handlePrevMatch} disabled={searchMatches.length === 0} className="p-1 text-white disabled:text-gray-500 hover:bg-brand-blue/80 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                <button onClick={handleNextMatch} disabled={searchMatches.length === 0} className="p-1 text-white disabled:text-gray-500 hover:bg-brand-blue/80 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
                <button onClick={() => setIsSearchVisible(false)} className="p-1 text-white hover:bg-brand-blue/80 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            </div>
        )}
      </div>
      <div className="flex-grow overflow-y-auto bg-brand-blue/30 p-4 sm:p-8">
        <div className="document-page">
          {!isLoading && !error && isComplete && (
            <div className="document-header animate-fade-in">
                <div className="document-logo">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#002279"/><path d="M32 12V20M32 20H18C16.8954 20 16 20.8954 16 22V24C16 25.1046 16.8954 26 18 26H32M32 20H46C47.1046 20 48 20.8954 48 22V24C48 25.1046 47.1046 26 46 26H32M18 26L22 48M46 26L42 48M14 52H50" stroke="#374151" stroke-width="2.5"/></svg>
                    <span className="font-bold">دادگر AI</span>
                </div>
                <div className="document-header-info">
                    <p><strong>{t('reportDisplay.headerDate')}:</strong> {currentDate}</p>
                    <p><strong>${t('reportDisplay.headerCaseNo')}:</strong> ${t('reportDisplay.caseNoPlaceholder')}</p>
                </div>
            </div>
          )}

          <div className="document-body">
            {error && <div className="text-red-500 p-4 bg-red-100/10 border border-red-500/30 rounded-md">{error}</div>}
            
            <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-gray-800 prose-li:text-gray-800" dangerouslySetInnerHTML={{ __html: reportHtml }} />

            {isLoading && (
              <div className="flex items-center justify-center pt-4">
                <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-brand-gold"></div>
                <span className="text-gray-500 ${language === 'fa' ? 'mr-2' : 'ml-2'}">{t('reportDisplay.generating')}</span>
              </div>
            )}

            {!isLoading && !generatedDocument && !error && (
                <div className="text-center text-gray-500 py-16">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold">{t('reportDisplay.placeholder1')}</p>
                    <p className="mt-1 text-sm">{t('reportDisplay.placeholder2')}</p>
                </div>
            )}
            <div ref={endOfReportRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDisplay;
