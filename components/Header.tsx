
import React, { useState, useRef, useEffect } from 'react';
import { Checkpoint, PageKey, SaveStatus, useLanguage, useAppearance } from '../types';

interface SiteHeaderProps {
    currentPage: string;
    setPage: (page: 'home' | PageKey) => void;
    checkpoints: Checkpoint[];
    onCreateCheckpoint: () => void;
    onRestoreCheckpoint: (id: string) => void;
    onDeleteCheckpoint: (id: string) => void;
    saveStatus: SaveStatus;
    onOpenSettings: () => void;
    onOpenAIGuide: () => void;
    onOpenDonation: () => void; 
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ currentPage, setPage, checkpoints, onCreateCheckpoint, onRestoreCheckpoint, onDeleteCheckpoint, saveStatus, onOpenSettings, onOpenAIGuide, onOpenDonation }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, customLogo } = useAppearance();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCheckpointMenuOpen, setIsCheckpointMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const checkpointMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (checkpointMenuRef.current && !checkpointMenuRef.current.contains(event.target as Node)) {
        setIsCheckpointMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const handlePageChange = (page: 'home' | PageKey) => {
      setPage(page);
      window.scrollTo(0, 0);
      setIsMobileMenuOpen(false);
      setIsToolsMenuOpen(false);
  }

  const handleScrollTo = (id: string) => {
    if (currentPage !== 'home') {
      handlePageChange('home');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const toolsGroups = [
    {
      title: language === 'fa' ? 'خدمات حقوقی' : 'Legal Services',
      items: [
        { key: 'legal_drafter', text: t('header.aiAssistant') },
        { key: 'court_assistant', text: t('header.courtAssistant') },
        { key: 'contract_analyzer', text: t('header.contractAnalyzer') },
        { key: 'evidence_analyzer', text: t('header.evidenceAnalyzer') },
        { key: 'corporate_services', text: t('header.corporateServices') },
        { key: 'insurance_services', text: t('header.insuranceServices') },
      ]
    },
    {
        title: language === 'fa' ? 'جستجو و ارتباط' : 'Search & Connect',
        items: [
            { key: 'lawyer_finder', text: t('header.lawyerFinder') },
            { key: 'notary_finder', text: t('header.notaryFinder') },
            { key: 'map_finder', text: language === 'fa' ? 'نقشه یاب' : 'Map Finder' },
            { key: 'geo_referencer', text: language === 'fa' ? 'ژئورفرنسینگ هوشمند' : 'Smart Georeferencing' },
            { key: 'general_questions', text: t('header.generalQuestions') },
        ]
    },
    {
        title: language === 'fa' ? 'ابزارهای هوشمند' : 'Smart Tools',
        items: [
            { key: 'content_hub', text: t('header.contentHub') },
            { key: 'news_summarizer', text: t('header.newsSummarizer') },
            { key: 'resume_analyzer', text: t('header.resumeAnalyzer') },
            { key: 'job_assistant', text: t('header.jobAssistant') },
            { key: 'web_analyzer', text: t('header.webAnalyzer') },
            { key: 'site_architect', text: t('header.siteArchitect') },
            { key: 'image_generator', text: t('header.imageGenerator') },
        ]
    }
  ];

  // Flatten for mobile view
  const allToolsFlat = toolsGroups.flatMap(g => g.items.map(item => ({...item, action: () => handlePageChange(item.key as PageKey)})));

  const mainLinks = [
    { key: 'home', text: t('header.home'), action: () => handlePageChange('home') },
    { 
      key: 'dashboard_group', 
      text: t('header.dashboard'), 
      hasDropdown: true,
      items: [
        { key: 'dashboard', text: t('header.dashboard'), action: () => handlePageChange('dashboard') },
        { key: 'wordpress_dashboard', text: t('header.cmsPanel'), action: () => handlePageChange('wordpress_dashboard') },
      ]
    },
    // Tools dropdown goes here in desktop view
    { key: 'pricing', text: t('header.pricing'), action: () => handlePageChange('pricing') },
    { key: 'investment', text: language === 'fa' ? 'سرمایه‌گذاری' : 'Investment', action: () => handlePageChange('investment') },
    { key: 'services', text: t('header.services'), action: () => handleScrollTo('services') },
    { key: 'contact', text: t('header.contact'), action: () => handleScrollTo('footer'), isPriority: true },
  ];

  const allLinksForMobile = [
      ...mainLinks.slice(0, 1),
      { key: 'dashboard', text: t('header.dashboard'), action: () => handlePageChange('dashboard') },
      { key: 'wordpress_dashboard', text: t('header.cmsPanel'), action: () => handlePageChange('wordpress_dashboard') },
      ...allToolsFlat,
      ...mainLinks.slice(2)
  ];
  
  const SaveStatusIndicator: React.FC = () => {
    let text: string | null = null;
    let icon: React.ReactNode = null;
    let key: string = saveStatus;

    switch (saveStatus) {
        case 'saving':
            text = 'Saving...';
            icon = <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
            break;
        case 'saved':
            text = 'Saved';
            icon = <svg className="h-4 w-4 text-brand-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
            key = `${saveStatus}-${Date.now()}`;
            break;
        default:
            return null;
    }

    return (
        <div key={key} className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-gray-400 animate-fade-in">
            {icon}
            <span>{text}</span>
        </div>
    );
  };


  return (
    <header className="bg-white dark:bg-[#0f172a] sticky top-0 z-[1000] border-b border-gray-100 dark:border-gray-800/50 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center lg:flex-1 overflow-visible">
            <a href="#" onClick={(e) => { e.preventDefault(); handlePageChange('home'); }} className="flex-shrink-0 flex items-center space-x-2 rtl:space-x-reverse group mr-3 rtl:ml-3">
              <img src={customLogo} alt="Arman Law Firm Logo" className="w-9 h-9 rounded-full object-cover border border-brand-gold/50 group-hover:border-brand-gold transition-colors" />
              <span className="font-semibold text-sm text-gray-800 dark:text-white hidden sm:inline">موسسه حقوقی آرمان</span>
            </a>
            
            <nav className="hidden lg:flex items-center gap-0.5 mx-2 flex-nowrap">
              {mainLinks.slice(0, 1).map((link, idx) => (
                  <button 
                    key={link.key} 
                    onClick={link.action} 
                    className={`px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap rounded ${currentPage === link.key ? 'text-brand-gold bg-brand-gold/10' : 'text-gray-600 dark:text-gray-400 hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  >
                      {link.text}
                  </button>
              ))}

              {/* Dashboard Dropdown */}
              <div className="relative group/dash">
                  <button
                      className={`px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap rounded flex items-center gap-1
                      ${['dashboard', 'wordpress_dashboard'].includes(currentPage)
                          ? 'text-brand-gold bg-brand-gold/10' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  >
                      {t('header.dashboard')}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className={`absolute top-full mt-1 w-44 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700/50 rounded-md shadow-lg z-[9999] ${language === 'fa' ? 'right-0' : 'left-0'} opacity-0 invisible group-hover/dash:opacity-100 group-hover/dash:visible transition-all duration-200`}>
                      <button
                          onClick={() => handlePageChange('dashboard')}
                          className={`block w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-[11px] transition-colors first:rounded-t-md
                          ${currentPage === 'dashboard' ? 'bg-brand-gold/10 text-brand-gold font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                          {t('header.dashboard')}
                      </button>
                      <button
                          onClick={() => handlePageChange('wordpress_dashboard')}
                          className={`block w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-[11px] transition-colors last:rounded-b-md
                          ${currentPage === 'wordpress_dashboard' ? 'bg-brand-gold/10 text-brand-gold font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                          {t('header.cmsPanel')}
                      </button>
                  </div>
              </div>

              {/* Tools Dropdown */}
              <div className="relative" ref={toolsMenuRef}>
                  <button
                      onClick={(e) => { e.stopPropagation(); setIsToolsMenuOpen(!isToolsMenuOpen); }}
                      className={`px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap rounded flex items-center gap-1
                      ${allToolsFlat.some(l => l.key === currentPage) || isToolsMenuOpen
                          ? 'text-brand-gold bg-brand-gold/10' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  >
                      {language === 'fa' ? 'ابزارها' : 'Tools'}
                      <svg className={`w-3 h-3 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  {isToolsMenuOpen && (
                      <div className={`absolute top-full mt-1 w-40 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700/50 rounded-md shadow-lg z-[9999] ${language === 'fa' ? 'right-0' : 'left-0'} animate-fade-in`}>
                          {toolsGroups.map((group, groupIdx) => (
                              <div key={groupIdx} className="group/accordion relative border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                  <h4 className="px-3 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                      <span>{group.title}</span>
                                      <svg className={`w-3 h-3 transition-transform ${language === 'fa' ? 'rotate-90' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </h4>
                                  <div className={`absolute top-0 ${language === 'fa' ? 'right-full mr-1' : 'left-full ml-1'} w-44 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700/50 rounded-md shadow-lg opacity-0 invisible group-hover/accordion:opacity-100 group-hover/accordion:visible transition-all duration-200`}>
                                      {group.items.map(link => (
                                          <button
                                              key={link.key}
                                              onClick={() => { handlePageChange(link.key as PageKey); setIsToolsMenuOpen(false); }}
                                              className={`block w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-[11px] transition-colors first:rounded-t-md last:rounded-b-md
                                              ${currentPage === link.key ? 'bg-brand-gold/10 text-brand-gold font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                          >
                                              {link.text}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {mainLinks.slice(2).map((link, idx) => (
                  <button 
                    key={link.key} 
                    onClick={link.action} 
                    className={`px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap rounded
                        ${link.isPriority 
                            ? 'bg-brand-gold text-brand-blue hover:bg-yellow-400' 
                            : currentPage === link.key ? 'text-brand-gold bg-brand-gold/10' : 'text-gray-600 dark:text-gray-400 hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                  >
                      {link.text}
                  </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-0.5 rtl:space-x-reverse flex-shrink-0">
             <div className="hidden md:flex items-center ml-1 rtl:mr-1 h-4 min-w-[50px] justify-end">
               <SaveStatusIndicator />
            </div>

            <button onClick={onOpenAIGuide} title="AI Guide" className="p-1.5 text-gray-400 hover:text-brand-gold transition-colors">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>

            <button onClick={toggleTheme} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                {theme === 'dark' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>

            <button onClick={onOpenSettings} className="p-1.5 text-gray-400 hover:text-brand-gold transition-colors" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>

            <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse border-r border-gray-200 dark:border-gray-700 pr-2 mr-2 rtl:border-r-0 rtl:border-l rtl:pl-2 rtl:ml-2">
                 <div className="relative" ref={checkpointMenuRef}>
                  <button
                      onClick={() => setIsCheckpointMenuOpen(prev => !prev)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title={t('header.projectHistory')}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  {isCheckpointMenuOpen && (
                      <div className={`absolute mt-2 w-72 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 ${language === 'fa' ? 'left-0' : 'right-0'}`}>
                          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{t('header.projectHistory')}</span>
                              <button onClick={onCreateCheckpoint} className="text-xs bg-brand-gold text-brand-blue px-2 py-1 rounded hover:bg-yellow-300 transition-colors">{t('header.createCheckpoint')}</button>
                          </div>
                          {checkpoints.length > 0 ? (
                              <ul className="py-1 max-h-80 overflow-y-auto">
                                  {checkpoints.map(ckpt => (
                                      <li key={ckpt.id} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
                                         <div className="flex justify-between items-center">
                                              <div className="text-sm text-gray-700 dark:text-gray-300 truncate pr-2">{ckpt.name}</div>
                                              <div className="flex-shrink-0 flex items-center space-x-1">
                                                  <button onClick={() => onRestoreCheckpoint(ckpt.id)} title={t('header.restore')} className="p-1 text-gray-400 hover:text-brand-gold"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg></button>
                                                  <button onClick={() => onDeleteCheckpoint(ckpt.id)} title={t('header.delete')} className="p-1 text-gray-400 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                              </div>
                                         </div>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <div className="text-center text-gray-500 py-4 px-3 text-xs">{t('header.noCheckpoints')}</div>
                          )}
                      </div>
                  )}
              </div>
            </div>

            <div className="relative" ref={langMenuRef}>
                <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m4 13l4-4M19 9l-4 4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-semibold text-xs mx-1">{language === 'fa' ? 'en' : 'fa'}</span>
                </button>
                {isLangMenuOpen && (
                    <div className={`absolute mt-2 w-28 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 ${language === 'fa' ? 'left-0' : 'right-0'}`}>
                        <ul className="py-1">
                            <li><button onClick={() => { setLanguage('fa'); setIsLangMenuOpen(false); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">فارسی</button></li>
                            <li><button onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">English</button></li>
                        </ul>
                    </div>
                )}
            </div>
            
            <div className="lg:hidden mr-2 rtl:ml-2 rtl:mr-0">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
                </button>
            </div>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#1F1F1F] border-t border-gray-200 dark:border-gray-800 py-2 animate-fade-in max-h-[80vh] overflow-y-auto">
            {allLinksForMobile.map((link, idx) => (
                <button 
                    key={idx} 
                    onClick={() => { link.action && link.action(); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-right px-4 py-3 text-sm font-medium border-b border-gray-100 dark:border-gray-800 last:border-0 ${currentPage === link.key ? 'text-brand-gold bg-gray-50 dark:bg-white/5' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    {link.text}
                </button>
            ))}
            <button 
                onClick={() => { onOpenDonation(); setIsMobileMenuOpen(false); }}
                className="block w-full text-right px-4 py-3 text-sm font-bold text-red-500 border-b border-gray-100 dark:border-gray-800"
            >
                {t('header.donation')}
            </button>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
