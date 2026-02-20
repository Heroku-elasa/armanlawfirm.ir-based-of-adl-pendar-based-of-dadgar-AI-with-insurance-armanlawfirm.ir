
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage, PageKey } from '../types';
import { PricingSection } from './PricingPage';
import CaseStudies from './CaseStudies';

interface HomePageProps {
    setPage: (page: 'home' | PageKey) => void;
    onOpenAIGuide: () => void;
    onOpenBooking: () => void;
    onOpenChatbot?: () => void;
}

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
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-loose flex-grow">«{text}»</p>
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
                        مشکل حقوقی خود را بنویسید (هوشمند)
                    </button>
                    <a href="https://wa.me/447424366129?text=%D8%B3%D9%84%D8%A7%D9%85" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-transparent border-2 border-gray-400 dark:border-gray-600 text-white font-bold rounded-xl hover:border-green-500 hover:text-green-500 transition-all text-lg flex items-center justify-center gap-2">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {t('home.cta.call')}
                    </a>
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
                            <span className="text-[10px] text-gray-600 font-mono tracking-widest whitespace-nowrap hidden sm:inline">ARMAN AI</span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Clients & Mission Strip */}
      <section className="bg-brand-blue dark:bg-black border-y border-gray-800 py-10 text-white">
          <div className="container mx-auto px-4">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                  <div className="lg:w-1/2 flex items-start gap-6">
                      <img 
                        src="/logo.png" 
                        alt="Arman Law Firm Logo" 
                        className="w-20 h-20 md:w-24 md:h-24 object-contain flex-shrink-0"
                      />
                      <div>
                          <h4 className="text-brand-gold font-bold mb-3 uppercase text-sm tracking-widest flex items-center gap-2">
                              <span className="w-8 h-[1px] bg-brand-gold"></span>
                              منشور اخلاقی موسسه
                          </h4>
                          <p className="text-lg md:text-xl leading-relaxed font-medium text-gray-200 text-justify">
                              ما در موسسه حقوقی آرمان متعهد هستیم که با صداقت، امانتداری و تخصص، مدافع حقوق موکلین خود باشیم. اولویت ما صلح و سازش است، اما در دفاع از حق، قاطع و سازش‌ناپذیر خواهیم بود.
                          </p>
                      </div>
                  </div>
                  <div className="lg:w-1/2 w-full">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-70 hover:opacity-100 transition-opacity duration-500">
                          <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                              <img src="https://upload.wikimedia.org/wikipedia/fa/thumb/b/b5/Digikala_logo.svg/1200px-Digikala_logo.svg.png" alt="دیجی‌کالا" className="h-10 object-contain grayscale group-hover:grayscale-0 transition-all" />
                              <span className="text-[10px] text-gray-400 font-bold group-hover:text-brand-gold transition-colors">دیجی‌کالا</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Snapp_Logo.svg/2560px-Snapp_Logo.svg.png" alt="اسنپ" className="h-10 object-contain grayscale group-hover:grayscale-0 transition-all" />
                              <span className="text-[10px] text-gray-400 font-bold group-hover:text-brand-gold transition-colors">اسنپ</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                              <img src="https://upload.wikimedia.org/wikipedia/fa/4/4b/Tapsi_Logo.png" alt="تپسی" className="h-10 object-contain grayscale group-hover:grayscale-0 transition-all" />
                              <span className="text-[10px] text-gray-400 font-bold group-hover:text-brand-gold transition-colors">تپسی</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Divar_logo.svg/2560px-Divar_logo.svg.png" alt="دیوار" className="h-10 object-contain grayscale group-hover:grayscale-0 transition-all" />
                              <span className="text-[10px] text-gray-400 font-bold group-hover:text-brand-gold transition-colors">دیوار</span>
                          </div>
                      </div>
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

      {/* Quick Services Section - ailawyer.pro style */}
      <section id="services" className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-[#1F1F1F] dark:to-[#111827] transition-colors">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <span className="inline-block px-4 py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-full text-brand-gold text-sm font-semibold mb-4">خدمات سریع</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">دسترسی آسان به خدمات حقوقی</h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">با استفاده از سامانه هوشمند آرمان، به سرعت به خدمات حقوقی دسترسی پیدا کنید</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Consultation - مشاوره */}
                  <button 
                      onClick={onOpenAIGuide}
                      className="group relative bg-white dark:bg-[#1F1F1F] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-brand-gold/50 hover:shadow-2xl transition-all duration-300 text-right overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">مشاوره حقوقی</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">دریافت مشاوره تخصصی از هوش مصنوعی و وکلای مجرب</p>
                          <span className="inline-flex items-center text-brand-gold text-sm font-semibold group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform">
                              شروع مشاوره
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 rotate-180 rtl:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                      </div>
                  </button>

                  {/* Faryadresi - فریادرسی */}
                  <button 
                      onClick={() => setPage('faryadresi')}
                      className="group relative bg-white dark:bg-[#1F1F1F] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-red-500/50 hover:shadow-2xl transition-all duration-300 text-right overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                              </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">فریادرسی</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">کمک فوری در شرایط اضطراری و پرونده‌های فوری</p>
                          <span className="inline-flex items-center text-red-500 text-sm font-semibold group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform">
                              درخواست کمک
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 rotate-180 rtl:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                      </div>
                  </button>

                  {/* In-person Booking - وقت مشاوره حضوری */}
                  <button 
                      onClick={onOpenBooking}
                      className="group relative bg-white dark:bg-[#1F1F1F] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 hover:shadow-2xl transition-all duration-300 text-right overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">وقت مشاوره حضوری</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">رزرو آنلاین جلسه حضوری با وکلای مجرب</p>
                          <span className="inline-flex items-center text-blue-500 text-sm font-semibold group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform">
                              رزرو وقت
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 rotate-180 rtl:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                      </div>
                  </button>

                  {/* Map Finder - نقشه یاب */}
                  <button 
                      onClick={() => setPage('map_finder')}
                      className="group relative bg-white dark:bg-[#1F1F1F] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-green-500/50 hover:shadow-2xl transition-all duration-300 text-right overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">نقشه یاب حقوقی</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">یافتن نزدیک‌ترین دفاتر حقوقی و وکلا</p>
                          <span className="inline-flex items-center text-green-500 text-sm font-semibold group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform">
                              جستجو در نقشه
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 rotate-180 rtl:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                      </div>
                  </button>
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
                            src="https://maps.google.com/maps?q=35.780016,51.420537&hl=fa&z=16&output=embed"
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
                           <a href="https://balad.ir/search?query=Tehran%20Jordan%20Taheri%20St" target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/30 dark:border-blue-500/50 text-blue-600 dark:text-blue-300 py-2 px-4 rounded-lg hover:bg-blue-600/20 dark:hover:bg-blue-600/40 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                مسیریابی با بلد
                           </a>
                           <a href="https://neshan.org/maps/@35.780016,51.420537,15z" target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600/10 dark:bg-green-600/20 border border-green-500/30 dark:border-green-500/50 text-green-600 dark:text-green-300 py-2 px-4 rounded-lg hover:bg-green-600/20 dark:hover:bg-green-600/40 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                مسیریابی با نشان
                           </a>
                           <a href="https://www.google.com/maps/search/?api=1&query=35.780016,51.420537" target="_blank" rel="noopener noreferrer" className="flex-1 bg-red-600/10 dark:bg-red-600/20 border border-red-500/30 dark:border-red-500/50 text-red-600 dark:text-red-300 py-2 px-4 rounded-lg hover:bg-red-600/20 dark:hover:bg-red-600/40 transition-colors text-center text-sm font-semibold flex items-center justify-center gap-2">
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
