
import React from 'react';
import { useLanguage } from '../types';

interface PricingPlan {
    title: string;
    price: string;
    oldPrice: string;
    features: string[];
}

interface WhyUsItem {
    title: string;
    features: string[];
}

export const PricingSection: React.FC = () => {
    const { t } = useLanguage();
    const plans: PricingPlan[] = t('pricing.plans');
    const whyUs: { title: string, items: WhyUsItem[] } = t('pricing.whyUs');

    return (
        <div className="w-full">
            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {plans.map((plan, index) => (
                    <div key={index} className="bg-white dark:bg-[#1F1F1F] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-brand-gold transition-all duration-300 flex flex-col overflow-hidden group">
                        <div className="p-6 flex-grow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors">{plan.title}</h3>
                                <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded-full border border-red-500/20">
                                    {t('pricing.discount')}
                                </span>
                            </div>
                            
                            <div className="mb-6">
                                <div className="text-sm text-gray-400 line-through mb-1">{plan.oldPrice}</div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white">{plan.price}</div>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                        <svg className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                                <span>{t('pricing.fileFormats')}</span>
                                <div className="flex gap-2">
                                    <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">PDF</span>
                                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">Word</span>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-brand-gold text-brand-blue font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-md">
                                {t('pricing.selectPlan')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Why Us Section */}
            <div className="bg-brand-blue/5 dark:bg-brand-blue/20 rounded-3xl p-8 md:p-12 border border-brand-blue/10 dark:border-brand-blue/50">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{whyUs.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {whyUs.items.map((item, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                                <ul className="space-y-1">
                                    {item.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center before:content-['•'] before:ml-2 before:text-brand-gold">
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PricingPage: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#111827] transition-colors animate-fade-in py-16">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                        {t('pricing.title')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t('pricing.subtitle')}
                    </p>
                    <div className="w-24 h-1.5 bg-brand-gold mx-auto rounded-full mt-8"></div>
                </div>
                
                <PricingSection />
            </div>
        </div>
    );
};

export default PricingPage;
