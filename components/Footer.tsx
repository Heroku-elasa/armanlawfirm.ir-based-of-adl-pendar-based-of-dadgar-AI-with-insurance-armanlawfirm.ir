
import React from 'react';
import { useLanguage, useAppearance, PageKey } from '../types';

interface SiteFooterProps {
    setPage: (page: 'home' | PageKey) => void;
}

const SiteFooter: React.FC<SiteFooterProps> = ({ setPage }) => {
    const { t } = useLanguage();
    const { customLogo } = useAppearance();
    const quickLinks: { text: string; type: 'page' | 'scroll'; value: string }[] = t('footer.quickLinks');

    const handleNavigation = (e: React.MouseEvent, link: { type: string, value: string }) => {
        e.preventDefault();
        if (link.type === 'page') {
            setPage(link.value as PageKey | 'home');
            window.scrollTo(0, 0);
        } else {
            // If it's a scroll link, ensure we are on home first, then scroll
            // Ideally this logic should be centralized, but for footer simplicity:
            if (document.getElementById(link.value)) {
                document.getElementById(link.value)?.scrollIntoView({ behavior: 'smooth' });
            } else {
                setPage('home');
                setTimeout(() => {
                    document.getElementById(link.value)?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    };

    return (
        <footer id="footer" className="bg-gray-100 dark:bg-[#0B0F19] text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Column 1: Logo & Description */}
                    <div className="space-y-6 md:col-span-1">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse group">
                             <img src={customLogo} alt="Arman Law Firm Logo" className="w-16 h-16 rounded-full object-cover border-2 border-brand-gold group-hover:scale-105 transition-transform" />
                             <div className="flex flex-col">
                                <span className="font-bold text-2xl text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors">موسسه حقوقی آرمان</span>
                                <span className="text-xs text-gray-500 tracking-wider">Arman Law Firm</span>
                             </div>
                        </div>
                        <p className="text-sm font-semibold text-brand-gold">{t('footer.slogan')}</p>
                        <p className="text-sm leading-loose text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            خدمات اینترنتی موسسه حقوقی آرمان در اوقات اداری بصورت حضوری و در ساعتهای دیگر بصورت غير حضوری قابل دسترس شما خواهد بود.
                        </p>
                        <div className="flex space-x-4 rtl:space-x-reverse">
                            {/* Instagram */}
                            <a href="https://www.instagram.com/adlpendaar/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors" aria-label="Instagram">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                        </div>
                    </div>
                    {/* Column 2: Quick Links */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-brand-gold/50 inline-block pb-2">{t('footer.quickLinksTitle')}</h2>
                        <ul className="space-y-3 text-sm columns-2 gap-8">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <a href="#" onClick={(e) => handleNavigation(e, link)} className="hover:text-brand-gold transition-colors flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mr-2 rtl:ml-2 rtl:mr-0"></span>
                                        {link.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Column 3: Contact Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-brand-gold/50 inline-block pb-2">تماس</h2>
                        <div className="flex flex-col space-y-4">
                             <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">تهران، جردن، خیابان طاهری</p>
                             </div>
                             <div>
                                <p className="text-xl font-bold text-brand-gold dir-ltr">۰۲۱-۲۲۰۴۱۶۵۵</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-200 dark:bg-black/30 py-6 border-t border-gray-300 dark:border-gray-800 transition-colors">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>{t('footer.copyright')}</p>
                    <div className="mt-4 md:mt-0 flex space-x-4 rtl:space-x-reverse">
                        <span>{t('footer.madeBy')}</span>
                        <span className="w-px h-3 bg-gray-400 dark:bg-gray-700"></span>
                        <span className="flex items-center space-x-1 rtl:space-x-reverse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                            <span>{t('footer.viewOnGitHub')}</span>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
