
import React from 'react';
import { useLanguage } from '../types';

const CaseStudies: React.FC = () => {
    const { t } = useLanguage();
    const cases = t('caseStudies.cases') as { title: string, desc: string, outcome: string }[];

    // Mock images for demonstration since we can't upload
    const images = [
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?auto=format&fit=crop&w=800&q=80"
    ];

    return (
        <section className="py-20 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('caseStudies.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('caseStudies.subtitle')}</p>
                    <div className="w-24 h-1.5 bg-brand-gold mx-auto rounded-full mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cases.map((item, index) => (
                        <div key={index} className="group relative rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                            <div className="h-64 w-full overflow-hidden">
                                <img 
                                    src={images[index % images.length]} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300"></div>
                            </div>
                            
                            <div className="absolute bottom-0 left-0 w-full p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-xl font-bold mb-2 text-brand-gold">{item.title}</h3>
                                <p className="text-sm text-gray-300 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 mb-3">
                                    {item.desc}
                                </p>
                                <div className="inline-flex items-center gap-2 text-xs font-bold bg-green-600/90 px-3 py-1 rounded-full backdrop-blur-md">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    {item.outcome}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CaseStudies;
