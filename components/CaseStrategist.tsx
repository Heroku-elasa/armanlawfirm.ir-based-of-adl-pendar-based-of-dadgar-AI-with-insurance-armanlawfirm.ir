


import React, { useState } from 'react';
import { StrategyTask, useLanguage } from '../types';
import { useAISuggestions, AISuggestionsDisplay } from './AISuggestions';

interface CaseStrategistProps {
    onGenerate: (goal: string, useThinkingMode: boolean) => void;
    goal: string;
    setGoal: (value: string) => void;
    result: StrategyTask[];
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
    onExecuteTask: (task: StrategyTask) => Promise<void>;
    isExecutingTask: boolean;
    onUpdateTaskStatus: (index: number, status: StrategyTask['status']) => void;
}

const CaseStrategist: React.FC<CaseStrategistProps> = ({ 
    onGenerate, goal, setGoal, result, isLoading, error, isQuotaExhausted, onExecuteTask, isExecutingTask, onUpdateTaskStatus 
}) => {
    const { t } = useLanguage();
    const [visiblePromptId, setVisiblePromptId] = useState<number | null>(null);
    const [executingTaskId, setExecutingTaskId] = useState<number | null>(null);
    const [isGoalFocused, setIsGoalFocused] = useState(false);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    
    const { suggestions, isLoading: areSuggestionsLoading, setSuggestions } = useAISuggestions(
        goal,
        "Suggest high-level project goals a user might want to plan",
        !isQuotaExhausted && isGoalFocused,
        'case_strategist_goal'
    );

    const handleSuggestionSelect = (suggestion: string) => {
        setGoal(suggestion);
        setSuggestions([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal.trim()) {
            alert(t('caseStrategist.validationError'));
            return;
        }
        onGenerate(goal, useThinkingMode);
        setVisiblePromptId(null);
    };
    
    const handleUseExample = () => {
        setGoal(t('caseStrategist.example.goal'));
    };

    const handleExecute = async (task: StrategyTask, index: number) => {
        setExecutingTaskId(index);
        try {
            await onExecuteTask(task);
        } finally {
            setExecutingTaskId(null);
        }
    };

    const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-strategy" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-strategy"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );

    return (
        <section id="case-strategist" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto">
                <div className="mt-10 bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="goal-input" className="block text-sm font-medium text-gray-300">{t('caseStrategist.goalLabel')}</label>
                                <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                                    {t('generatorForm.useExample')}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea
                                    id="goal-input"
                                    rows={4}
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    onFocus={() => setIsGoalFocused(true)}
                                    onBlur={() => setIsGoalFocused(false)}
                                    autoComplete="off"
                                    className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                    placeholder={t('caseStrategist.goalPlaceholder')}
                                />
                                {isGoalFocused && (
                                    <AISuggestionsDisplay
                                        suggestions={suggestions}
                                        isLoading={areSuggestionsLoading}
                                        onSelect={handleSuggestionSelect}
                                    />
                                )}
                            </div>
                        </div>
                        <ThinkingModeToggle />
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || isQuotaExhausted}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? t('caseStrategist.generating') : isQuotaExhausted ? t('quotaErrorModal.title') : t('caseStrategist.buttonText')}
                            </button>
                        </div>
                    </form>
                </div>

                {(isLoading || error || result.length > 0) && (
                    <div className="mt-10 animate-fade-in">
                        <div className="mb-4">
                            <h3 className="text-2xl font-semibold text-white">{t('caseStrategist.resultsTitle')}</h3>
                        </div>
                        <div className="space-y-6">
                            {isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-brand-gold"></div>
                                    <span className="ml-3 text-gray-400">{t('caseStrategist.generating')}</span>
                                </div>
                            )}
                            {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>}
                            {result.map((task, index) => {
                                const isCancelled = task.status === 'cancelled';
                                const isCompleted = task.status === 'completed';

                                return (
                                    <div key={index} className={`bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border p-6 transition-all duration-300 ${isCompleted ? 'border-green-500/50 bg-green-900/10' : isCancelled ? 'border-gray-600/50 opacity-75' : 'border-brand-blue/50'}`}>
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-xl font-bold transition-colors duration-300 ${isCompleted ? 'text-green-400' : isCancelled ? 'text-gray-400 line-through decoration-2' : 'text-brand-gold'}`}>
                                                {task.taskName}
                                            </h4>
                                            <div className="text-right flex-shrink-0 ml-4">
                                                <div className="text-sm text-gray-400">{t('caseStrategist.effort')}</div>
                                                <div className={`text-lg font-bold ${isCancelled ? 'text-gray-500' : 'text-white'}`}>{task.effortPercentage}%</div>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full bg-brand-blue/80 rounded-full h-2.5 my-2 overflow-hidden">
                                            <div className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : isCancelled ? 'bg-gray-600' : 'bg-brand-gold'}`} style={{ width: `${task.effortPercentage}%` }}></div>
                                        </div>

                                        <p className={`mt-3 transition-colors duration-300 ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{task.description}</p>
                                        
                                        <div className="mt-4 pt-4 border-t border-brand-blue/70 flex flex-wrap items-center gap-4 justify-between">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <p className="text-sm flex-shrink-0"><span className="font-semibold text-gray-400">{t('caseStrategist.deliverable')}:</span> <span className={`font-medium px-2 py-1 rounded-md ${isCancelled ? 'text-gray-400 bg-gray-800' : 'text-gray-200 bg-brand-blue/70'}`}>{task.deliverableType}</span></p>
                                                <button 
                                                    onClick={() => setVisiblePromptId(visiblePromptId === index ? null : index)}
                                                    className={`text-sm hover:underline transition-colors ${isCancelled ? 'text-gray-500' : 'text-brand-gold hover:text-yellow-200'}`}
                                                >
                                                    {visiblePromptId === index ? '▲ ' : '▼ '} {t('caseStrategist.suggestedPrompt')}
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                 {!isCancelled && !isCompleted && (
                                                    <>
                                                        <button 
                                                            onClick={() => onUpdateTaskStatus(index, 'completed')}
                                                            className="p-2 text-green-400 hover:bg-green-900/30 rounded-full transition-colors"
                                                            title={t('caseStrategist.markComplete')}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => onUpdateTaskStatus(index, 'cancelled')}
                                                            className="p-2 text-red-400 hover:bg-red-900/30 rounded-full transition-colors"
                                                            title={t('caseStrategist.markCancelled')}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {(isCancelled || isCompleted) && (
                                                    <button 
                                                        onClick={() => onUpdateTaskStatus(index, 'pending')}
                                                        className="p-2 text-gray-400 hover:bg-gray-700/50 rounded-full transition-colors flex items-center gap-1"
                                                        title={t('caseStrategist.restore')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    </button>
                                                )}

                                                {isCompleted && <span className="text-xs font-bold text-green-500 px-2 py-1 bg-green-900/20 rounded border border-green-900/50">{t('caseStrategist.completedBadge')}</span>}
                                                {isCancelled && <span className="text-xs font-bold text-gray-500 px-2 py-1 bg-gray-800 rounded border border-gray-700">{t('caseStrategist.cancelledBadge')}</span>}

                                                <button 
                                                    onClick={() => handleExecute(task, index)}
                                                    disabled={isExecutingTask || isCancelled}
                                                    className={`flex items-center text-sm px-3 py-1 rounded-md transition-colors ${
                                                        isExecutingTask ? 'bg-gray-600 text-gray-300 cursor-wait' : 
                                                        isCancelled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                                                        'bg-brand-gold text-brand-blue hover:bg-yellow-200'
                                                    }`}
                                                >
                                                    {executingTaskId === index ? (
                                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        {t('caseStrategist.executingTask')}</>
                                                    ) : (
                                                        '⚡️ ' + t('caseStrategist.executeTask')
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        {visiblePromptId === index && (
                                            <div className="mt-4 bg-brand-blue/70 p-4 rounded-md border border-brand-blue">
                                                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono text-left" dir="ltr">
                                                    <code>{task.suggestedPrompt}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CaseStrategist;
