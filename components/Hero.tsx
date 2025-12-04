

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage, PageKey } from '../types';
import { PricingSection } from './PricingPage';
import CaseStudies from './CaseStudies';

interface HomePageProps {
    setPage: (page: 'home' | PageKey) => void;
    onOpenAIGuide: () => void;
    onOpenBooking: () => void; // New prop
}

const ServiceCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void; image: string }> = ({ icon, title, description, onClick, image }) => (
  <button onClick={onClick} className="group text-center p-0 space-y-0 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-brand-gold transition-all duration-300 hover:shadow-lg hover:shadow-brand-gold/10 w-full flex flex-col overflow-hidden h-full">
    <div className="w-full h-48 relative overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent flex items-end p-4">
             <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-gold/90 text-brand-blue shadow-lg backdrop-blur-md transform translate-y-0 transition-transform duration-300 group-hover:-translate-y-2">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6" })}
            </div>
        </div>
    </div>
    <div className="p-6 flex flex-col flex-grow items-start text-right w-full">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white transition-colors group-hover:text-brand-gold mb-3">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-justify line-clamp-3">{description}</p>
        <div className="mt-auto pt-4 flex items-center text-brand-gold text-sm font-bold opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2 rtl:group-hover:-translate-x-2">
            مشاهده جزئیات
            <svg className="w-4 h-4 mr-2 rtl:mr-2 rtl:ml-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </div>
    </div>
  </button>
);

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center p-4">
        <h3 className="text-3xl sm:text-4xl font-black text-brand-gold mb-2">{value}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
    </div>
);

const ProcessStep: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
    <div className="flex flex-col items-center text-center space-y-4 relative z-10">
        <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center text-brand-blue text-2xl font-bold shadow-lg shadow-brand-gold/30">
            {number}
        </div>
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">{desc}</p>
    </div>
);

const ReviewCard: React.FC<{ name: string; role: string; text: string; stars: number }> = ({ name, role, text, stars }) => (
    <div className="bg-white dark:bg-[#1F1F1F] p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-gold/50 transition-colors shadow-sm dark:shadow-none h-full flex flex-col">
        <div className="flex text-brand-gold mb-4 space-x-1 rtl:space-x-reverse">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < stars ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.603 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            ))}
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-loose flex-grow">"{text}"</p>
        <div className="text-right rtl:text-left pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
            <h5 className="text-brand-gold font-bold text-sm">{name}</h5>
            <span className="text-xs text-gray-500">{role}</span>
        </div>
    </div>
);

const FAQSection: React.FC = () => {
    const { t } = useLanguage();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const faqItems: { q: string; a: string }[] = t('faq.items');

    return (
        <section className="py-24 bg-gray-50 dark:bg-[#111827] transition-colors border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{t('faq.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('faq.subtitle')}</p>
                </div>
                <div className="space-y-4">
                    {faqItems.map((item, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1F1F1F] overflow-hidden transition-all hover:border-brand-gold/30">
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-5 text-right rtl:text-right ltr:text-left font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span>{item.q}</span>
                                <svg className={`w-5 h-5 text-brand-gold transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-5 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700/50">
                                    {item.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const HomePage: React.FC<HomePageProps> = ({ setPage, onOpenAIGuide, onOpenBooking }) => {
  const { t } = useLanguage();
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [systemLoad, setSystemLoad] = useState(78);
  const [processedCount, setProcessedCount] = useState(1245);
  const scrollRef = useRef<HTMLDivElement>(null);

  const logs = [
      "در حال پردازش درخواست‌های حقوقی...",
      "جستجوی وکیل متخصص در پایگاه داده...",
      "تحلیل هوشمند قراردادهای ملکی...",
      "محاسبه ریسک‌های بیمه و خسارت...",
      "استخراج متن از مدارک اسکن شده...",
      "بررسی تغییرات جدید قوانین..."
  ];

  useEffect(() => {
      const interval = setInterval(() => {
          setActiveLogIndex((prev) => (prev + 1) % logs.length);
          setSystemLoad(Math.floor(Math.random() * (95 - 60 + 1) + 60)); // Random between 60 and 95
          setProcessedCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
      }, 2500);
      return () => clearInterval(interval);
  }, []);

  const services = [
    { 
        key: 'legal_drafter', 
        title: t('header.aiAssistant'), 
        description: 'تنظیم هوشمند انواع اوراق قضایی، دادخواست و اظهارنامه با دقت و سرعت بالا', 
        image: 'https://images.weserv.nl/?url=images.pexels.com/photos/48148/document-agreement-documents-sign-48148.jpeg&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> 
    },
    { 
        key: 'court_assistant', 
        title: t('header.courtAssistant'), 
        description: 'دستیار هوشمند و زنده برای جلسات دادگاه، تحلیل لحظه‌ای و پیشنهاد دفاعیه', 
        image: 'https://images.weserv.nl/?url=images.unsplash.com/photo-1589829085413-56de8ae18c73&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg> 
    },
    { 
        key: 'contract_analyzer', 
        title: t('header.contractAnalyzer'), 
        description: 'بررسی دقیق و تحلیل هوشمند قراردادها و متون حقوقی برای شناسایی ریسک‌ها', 
        image: 'https://images.weserv.nl/?url=images.unsplash.com/photo-1589994965851-a8f479c573a9&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
    },
    { 
        key: 'lawyer_finder', 
        title: t('header.lawyerFinder'), 
        description: 'جستجو و انتخاب بهترین وکیل متخصص بر اساس نیاز و پرونده شما', 
        image: 'https://images.weserv.nl/?url=images.unsplash.com/photo-1587740896339-96a76170508d&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.375 6.375a6.375 6.375 0 1112.75 0 6.375 6.375 0 01-12.75 0z" /></svg> 
    },
    { 
        key: 'corporate_services', 
        title: t('header.corporateServices'), 
        description: 'ثبت شرکت، تنظیم صورت‌جلسات، اساسنامه و امور حقوقی کسب‌وکارها', 
        image: 'https://images.weserv.nl/?url=images.unsplash.com/photo-1619418602850-35ad20aa1700&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375M9 12h6.375m-6.375 5.25h6.375M5.25 21V3m13.5 18V3" /></svg> 
    },
    { 
        key: 'insurance_services', 
        title: t('header.insuranceServices'), 
        description: 'مشاوره بیمه، تنظیم خسارت و تحلیل بیمه‌نامه‌ها با هوش مصنوعی', 
        image: 'https://images.weserv.nl/?url=images.unsplash.com/photo-1571624436279-b272aff752b5&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z" /></svg> 
    },
    { 
        key: 'notary_finder', 
        title: t('header.notaryFinder'), 
        description: 'یافتن نزدیک‌ترین دفاتر اسناد رسمی و خدمات ثبتی در سراسر کشور', 
        image: 'https://images.weserv.nl/?url=images.unsplash.com/photo-1619418602850-35ad20aa1700&w=600&q=80',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> 
    }
  ];

  const processSteps = t('home.process.steps');
  const reviews = t('home.reviews.items');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
        const { current } = scrollRef;
        const cardWidth = current.firstElementChild?.clientWidth || 300;
        const gap = 32; 
        const scrollAmount = cardWidth + gap;
        
        const left = direction === 'left' 
            ? current.scrollLeft - scrollAmount 
            : current.scrollLeft + scrollAmount;
            
        current.scrollTo({ left, behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fade-in bg-gray-50 dark:bg-[#111827] transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center z-0 opacity-40" style={{backgroundImage: 'url(https://images.weserv.nl/?url=images.unsplash.com/photo-1571624436279-b272aff752b5&w=1920&q=80)'}}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-0 dark:from-[#111827] dark:via-[#111827]/80"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="w-full lg:w-1/2 text-right rtl:text-right ltr:text-left space-y-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-sm font-semibold mb-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold ml-2 rtl:ml-2 ltr:mr-2 animate-pulse"></span>
                    {t('home.subtitle')}
                </div>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-tight text-white">
                    <span className="text-brand-gold">{t('home.title').split(' ')[0]}</span> {t('home.title').split(' ').slice(1).join(' ')}
                </h1>
                <p className="text-xl text-gray-300 dark:text-gray-400 max-w-2xl leading-relaxed">
                    {t('home.servicesSubtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button onClick={onOpenAIGuide} className="px-8 py-4 bg-brand-gold text-brand-blue font-bold rounded-xl hover:bg-white transition-all text-lg shadow-[0_0_20px_rgba(190,242,100,0.3)] transform hover:-translate-y-1">
                        {t('home.cta.main')}
                    </button>
                    <button onClick={onOpenBooking} className="px-8 py-4 bg-transparent border-2 border-gray-400 dark:border-gray-600 text-white font-bold rounded-xl hover:border-brand-gold hover:text-brand-gold transition-all text-lg flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        {t('home.cta.call')}
                    </button>
                </div>
            </div>
            
            <div className="w-full lg:w-1/2 relative">
                 <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900 dark:bg-[#1F1F1F] p-2">
                    <img src="https://images.weserv.nl/?url=images.unsplash.com/photo-1571624436279-b272aff752b5&w=800&q=80" alt="دفتر مرکزی موسسه حقوقی آرمان" className="rounded-xl opacity-90 w-full object-cover h-[400px] lg:h-[500px]" loading="lazy" />
                    <div className="absolute bottom-6 right-6 left-6 bg-[#111827]/95 backdrop-blur-xl p-6 rounded-xl border border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white font-bold text-lg">سامانه هوشمند آرمان</h3>
                                <p className="text-gray-400 text-xs mt-1">دستیار پیشرفته حقوقی و قضایی</p>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-medium text-green-400">سیستم فعال</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <span>ظرفیت تحلیل</span>
                                    <span className="text-brand-gold font-mono">{systemLoad}%</span>
                                </div>
                                <span className="font-mono text-gray-500">REQ: {processedCount.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full w-full overflow-hidden">
                                <div 
                                    className="h-full bg-brand-gold transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(190,242,100,0.5)]"
                                    style={{ width: `${systemLoad}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                            <p className="text-brand-gold text-xs font-mono flex items-center gap-2 w-full">
                                <span className="text-green-500">➜</span>
                                <span className="animate-fade-in w-full truncate">{logs[activeLogIndex]}</span>
                            </p>
                            <span className="text-[10px] text-gray-600 font-mono tracking-widest whitespace-nowrap hidden sm:inline">DADGAR AI</span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Clients & Mission Strip */}
      <section className="bg-brand-blue dark:bg-black border-y border-gray-800 py-8 text-white">
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="md:w-1/2">
                      <h4 className="text-brand-gold font-bold mb-2 uppercase text-xs tracking-wider">{t('mission.title')}</h4>
                      <p className="text-lg leading-relaxed font-light text-gray-300">
                          {t('mission.text')}
                      </p>
                  </div>
                  <div className="md:w-1/2 flex justify-center md:justify-end gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Mock Client Logos */}
                        <div className="h-10 w-24 bg-white/10 rounded flex items-center justify-center font-bold text-xs">Client 1</div>
                        <div className="h-10 w-24 bg-white/10 rounded flex items-center justify-center font-bold text-xs">Client 2</div>
                        <div className="h-10 w-24 bg-white/10 rounded flex items-center justify-center font-bold text-xs">Client 3</div>
                        <div className="h-10 w-24 bg-white/10 rounded flex items-center justify-center font-bold text-xs">Client 4</div>
                  </div>
              </div>
          </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-[#1F1F1F] border-b border-gray-200 dark:border-gray-800 py-10 transition-colors">
          <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-200 dark:divide-gray-800 rtl:divide-x-reverse">
                  <StatCard value={t('home.stats.cases').split(' ')[0]} label={t('home.stats.cases').split(' ').slice(1).join(' ')} />
                  <StatCard value={t('home.stats.satisfaction').split(' ')[0]} label={t('home.stats.satisfaction').split(' ').slice(1).join(' ')} />
                  <StatCard value={t('home.stats.support').split(' ')[0]} label={t('home.stats.support').split(' ').slice(1).join(' ')} />
                  <StatCard value={t('home.stats.experience').split(' ')[0]} label={t('home.stats.experience').split(' ').slice(1).join(' ')} />
              </div>
          </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gray-50 dark:bg-[#111827] transition-colors">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-brand-gold font-bold tracking-wide uppercase text-sm mb-3">{t('home.servicesTitle')}</h2>
                <h3 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">{t('home.servicesSubtitle')}</h3>
                <div className="w-24 h-1.5 bg-brand-gold mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                    <ServiceCard key={service.key} {...service} onClick={() => setPage(service.key as PageKey)} />
                ))}
            </div>
        </div>
      </section>

      {/* Court Assistant Promo */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-1/2 space-y-6">
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">{t('home.courtAssistantPromo.badge')}</span>
                    <h2 className="text-4xl font-bold">{t('home.courtAssistantPromo.title')}</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        {t('home.courtAssistantPromo.description')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/10 p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                            <h4 className="font-bold text-brand-gold mb-2">{t('home.courtAssistantPromo.feature1Title')}</h4>
                            <p className="text-sm text-gray-300">{t('home.courtAssistantPromo.feature1Desc')}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                            <h4 className="font-bold text-brand-gold mb-2">{t('home.courtAssistantPromo.feature2Title')}</h4>
                            <p className="text-sm text-gray-300">{t('home.courtAssistantPromo.feature2Desc')}</p>
                        </div>
                    </div>
                    <button onClick={() => setPage('court_assistant')} className="mt-6 px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
                        {t('home.courtAssistantPromo.button')}
                    </button>
                </div>
                <div className="lg:w-1/2 relative w-full">
                    {/* Mock Chat Interface */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-2xl max-w-md mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold text-white">{t('home.courtAssistantPromo.mockChat.header')}</span>
                            </div>
                            <span className="text-xs text-gray-400">{t('home.courtAssistantPromo.mockChat.persona')}</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <div className="bg-brand-blue text-white p-3 rounded-2xl rounded-tr-none text-sm max-w-[90%] shadow-md">
                                    {t('home.courtAssistantPromo.mockChat.userMsg')}
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="bg-gray-700 text-gray-200 p-4 rounded-2xl rounded-tl-none text-sm max-w-[95%] space-y-3 border-l-4 border-brand-gold shadow-md">
                                    <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-gray-600">
                                        <span className="uppercase font-bold">{t('home.courtAssistantPromo.mockChat.analysisLabel')}</span>
                                        <span className="text-red-400 font-bold px-2 py-0.5 bg-red-900/30 rounded">{t('home.courtAssistantPromo.mockChat.status')}</span>
                                    </div>
                                    <p className="leading-relaxed">{t('home.courtAssistantPromo.mockChat.analysisText')}</p>
                                    <div className="bg-black/30 p-2 rounded text-xs font-mono text-blue-300 border border-white/5">
                                        {t('home.courtAssistantPromo.mockChat.law')}
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-xs text-green-400 font-bold uppercase block mb-1">{t('home.courtAssistantPromo.mockChat.rebuttalLabel')}</span>
                                        <p className="text-white font-medium leading-relaxed">{t('home.courtAssistantPromo.mockChat.rebuttalText')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Case Studies / Portfolio */}
      <CaseStudies />

      {/* Pricing Block */}
      <section className="py-24 bg-white dark:bg-[#1F1F1F] border-y border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('pricing.title')}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{t('pricing.subtitle')}</p>
              </div>
              <PricingSection />
          </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-gray-50 dark:bg-[#111827] relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 relative z-10">
             <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('home.process.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('home.process.subtitle')}</p>
            </div>
            
            <div className="relative max-w-5xl mx-auto">
                <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-700"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <ProcessStep number="۱" title={processSteps[0].title} desc={processSteps[0].desc} />
                    <ProcessStep number="۲" title={processSteps[1].title} desc={processSteps[1].desc} />
                    <ProcessStep number="۳" title={processSteps[2].title} desc={processSteps[2].desc} />
                </div>
            </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 bg-white dark:bg-[#1F1F1F] transition-colors relative">
          <div className="container mx-auto px-4 relative">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                  <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{t('home.reviews.title')}</h2>
                      <p className="text-brand-gold">{t('home.reviews.subtitle')}</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => scroll('left')} className="p-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/10 transition-colors z-10 bg-white dark:bg-[#1F1F1F]">
                          <svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button onClick={() => scroll('right')} className="p-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/10 transition-colors z-10 bg-white dark:bg-[#1F1F1F]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                  </div>
              </div>
              
              <div 
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                  {reviews.map((review: any, idx: number) => (
                      <div key={idx} className="min-w-full md:min-w-[calc(50%-16px)] lg:min-w-[calc(33.333%-21.33px)] snap-center flex-shrink-0 h-full">
                          <ReviewCard name={review.name} role={review.role} text={review.text} stars={5} />
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Location Section */}
      <section className="relative py-24 bg-gray-50 dark:bg-[#111827] transition-colors">
          <div className="container mx-auto px-4">
              <div className="bg-[#bef264]/10 border border-[#bef264]/30 rounded-3xl overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2 min-h-[300px] relative bg-gray-900 dark:bg-[#111827] flex items-center justify-center group overflow-hidden">
                        <iframe 
                            src="https://maps.google.com/maps?q=35.779995,51.42057&hl=fa&z=16&output=embed"
                            className="absolute inset-0 w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="نقشه موقعیت موسسه حقوقی آرمان"
                        ></iframe>
                  </div>
                  <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('home.location.title')}</h2>
                      <div className="space-y-6">
                          <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#bef264]/20 flex items-center justify-center flex-shrink-0 mt-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              </div>
                              <div>
                                  <h4 className="text-brand-gold font-bold mb-1">آدرس دفتر:</h4>
                                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('home.location.address')}</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#bef264]/20 flex items-center justify-center flex-shrink-0 mt-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                  <h4 className="text-brand-gold font-bold mb-1">ساعات کاری:</h4>
                                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('home.location.hours')}</p>
                              </div>
                          </div>
                      </div>
                      <div className="mt-8 flex flex-wrap gap-4">
                           <a href="https://balad.ir/directions/driving?destination=51.420640700586006%2C35.779938840547146" target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/30 dark:border-blue-500/50 text-blue-600 dark:text-blue-300 py-2 px-4 rounded-lg hover:bg-blue-600/20 dark:hover:bg-blue-600/40 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                مسیریابی با بلد
                           </a>
                           <a href="https://neshan.org/maps/places/_bv7MH0xidTa#c35.780-51.421-19z-0p" target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600/10 dark:bg-green-600/20 border border-green-500/30 dark:border-green-500/50 text-green-600 dark:text-green-300 py-2 px-4 rounded-lg hover:bg-green-600/20 dark:hover:bg-green-600/40 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                مسیریابی با نشان
                           </a>
                           <a href="https://www.google.com/maps/search/?api=1&query=35.779995,51.42057" target="_blank" rel="noopener noreferrer" className="flex-1 bg-red-600/10 dark:bg-red-600/20 border border-red-500/30 dark:border-red-500/50 text-red-600 dark:text-red-300 py-2 px-4 rounded-lg hover:bg-red-600/20 dark:hover:bg-red-600/40 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Google Maps
                           </a>
                      </div>
                      <button onClick={onOpenBooking} className="mt-6 w-full bg-brand-gold text-brand-blue font-bold py-4 px-8 rounded-xl hover:bg-white transition-colors shadow-lg">
                          {t('home.cta.main')}
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
};

export default HomePage;