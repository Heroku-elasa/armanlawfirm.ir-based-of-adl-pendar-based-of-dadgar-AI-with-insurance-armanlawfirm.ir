
import React from 'react';
import { useLanguage, AppState, Checkpoint, PageKey, Lawyer } from '../types';
import GoogleSheetSimulator from './GoogleSheetSimulator';

interface DashboardProps {
    setPage: (page: 'home' | PageKey) => void;
    checkpoints: Checkpoint[];
    savedLawyers: Lawyer[];
    strategyResult: AppState['strategyResult'];
    onRestoreCheckpoint: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setPage, checkpoints, savedLawyers, strategyResult, onRestoreCheckpoint }) => {
    const { t, language } = useLanguage();
    
    // Calculate strategy progress
    const totalTasks = strategyResult.length;
    const completedTasks = strategyResult.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const quickActions = [
        { key: 'legal_drafter', label: t('dashboard.tools.drafter'), icon: '📝', color: 'bg-blue-500' },
        { key: 'lawyer_finder', label: t('dashboard.tools.finder'), icon: '⚖️', color: 'bg-purple-500' },
        { key: 'contract_analyzer', label: t('dashboard.tools.analyzer'), icon: '🔍', color: 'bg-green-500' },
        { key: 'court_assistant', label: t('dashboard.tools.court'), icon: '🏛️', color: 'bg-red-500' },
    ];

    const currentDate = new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="py-8 animate-fade-in space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-brand-blue to-[#1e3a8a] text-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="z-10">
                    <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcome')} <span className="text-brand-gold">کاربر گرامی</span></h1>
                    <p className="text-blue-200">{t('dashboard.welcomeSubtitle')}</p>
                    <div className="mt-4 text-sm bg-white/10 inline-block px-4 py-2 rounded-lg backdrop-blur-md">
                        📅 {currentDate}
                    </div>
                </div>
                <div className="z-10 mt-6 md:mt-0 text-center md:text-left max-w-sm bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-brand-gold font-bold uppercase mb-1">💡 {t('dashboard.dailyTip').split(':')[0]}</p>
                    <p className="text-sm italic text-gray-200">{t('dashboard.dailyTip').split(':')[1]}</p>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(action => (
                    <button
                        key={action.key}
                        onClick={() => setPage(action.key as PageKey)}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-brand-blue/30 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-gold/50 hover:shadow-md transition-all group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* GOOGLE SHEET SIMULATOR (Main Case Management) */}
            <div className="w-full">
                <GoogleSheetSimulator />
            </div>

            {/* Lower Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Strategy) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Strategy Progress */}
                    {totalTasks > 0 ? (
                        <div className="bg-white dark:bg-brand-blue/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.strategyProgress')}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{completedTasks} / {totalTasks} {t('dashboard.tasksCompleted')}</p>
                                </div>
                                <span className="text-2xl font-bold text-brand-gold">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                                <div className="bg-brand-gold h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            <button onClick={() => setPage('case_strategist')} className="text-sm text-blue-500 hover:underline">{t('dashboard.viewAll')}</button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-brand-blue/30 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center py-10">
                            <span className="text-4xl mb-2">🚀</span>
                            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noStrategy')}</p>
                            <button onClick={() => setPage('case_strategist')} className="mt-4 px-4 py-2 bg-brand-gold text-brand-blue rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
                                {t('header.caseStrategist')}
                            </button>
                        </div>
                    )}

                    {/* Recent Drafts (Checkpoints) */}
                    <div className="bg-white dark:bg-brand-blue/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.recentDrafts')}</h3>
                        {checkpoints.length > 0 ? (
                            <div className="space-y-3">
                                {checkpoints.slice().reverse().slice(0, 3).map(ckpt => (
                                    <div key={ckpt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-2 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-800 dark:text-white">{ckpt.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(ckpt.timestamp).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { onRestoreCheckpoint(ckpt.id); }}
                                            className="text-xs font-bold text-brand-gold hover:text-white bg-brand-blue/80 px-3 py-1.5 rounded-md hover:bg-brand-blue transition-colors"
                                        >
                                            {t('dashboard.restoreDraft')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                {t('dashboard.noDrafts')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Saved Lawyers) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Saved Lawyers */}
                    <div className="bg-white dark:bg-brand-blue/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.savedLawyers')}</h3>
                        {savedLawyers.length > 0 ? (
                            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                                {savedLawyers.slice(0, 5).map((lawyer, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-brand-gold/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">⚖️</span>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate">{lawyer.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lawyer.specialty}</p>
                                            <a href={lawyer.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">تماس</a>
                                        </div>
                                    </div>
                                ))}
                                {savedLawyers.length > 5 && (
                                    <button onClick={() => setPage('lawyer_finder')} className="w-full text-center text-sm text-gray-500 hover:text-brand-gold py-2">
                                        {t('dashboard.viewAll')} ({savedLawyers.length})
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center py-10">
                                <span className="text-4xl mb-2 grayscale opacity-50">👨‍⚖️</span>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('dashboard.noLawyers')}</p>
                                <button onClick={() => setPage('lawyer_finder')} className="text-xs border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    {t('dashboard.tools.finder')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
