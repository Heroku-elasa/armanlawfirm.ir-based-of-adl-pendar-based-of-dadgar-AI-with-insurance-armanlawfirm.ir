import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getSuggestions } from '../services/geminiService';
import { useLanguage } from '../types';
import { DEFAULT_SUGGESTIONS } from '../constants';

// The hook
export const useAISuggestions = (
    inputValue: string,
    contextPrompt: string,
    isEnabled: boolean,
    suggestionKey: string | null,
    minLength = 5,
    debounceTime = 750
) => {
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    const defaultSuggestions = useMemo(() => {
        if (suggestionKey && DEFAULT_SUGGESTIONS[suggestionKey as keyof typeof DEFAULT_SUGGESTIONS]) {
            return DEFAULT_SUGGESTIONS[suggestionKey as keyof typeof DEFAULT_SUGGESTIONS];
        }
        return [];
    }, [suggestionKey]);

    const fetchAISuggestions = useCallback(async () => {
        if (!isEnabled) return;
        setIsLoading(true);
        try {
            const result = await getSuggestions(inputValue, contextPrompt);
            setAiSuggestions(result);
        } catch (error) {
            console.error("Failed to get suggestions:", error);
            setAiSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, contextPrompt, isEnabled]);

    // Effect for triggering AI suggestions
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (isEnabled && inputValue.trim().length >= minLength) {
            debounceTimeout.current = window.setTimeout(fetchAISuggestions, debounceTime);
        } else {
            // If input is too short, clear AI suggestions
            setAiSuggestions([]);
        }

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [inputValue, minLength, debounceTime, fetchAISuggestions, isEnabled]);
    
    // The final returned suggestions logic
    const suggestions = useMemo(() => {
        const trimmedInput = inputValue.trim().toLowerCase();

        // If AI has results, prioritize them
        if (aiSuggestions.length > 0) {
            return aiSuggestions;
        }

        // If AI is loading, don't show defaults (the display component shows loading state)
        if (isLoading) {
            return [];
        }

        // If input is empty, show all defaults
        if (!trimmedInput) {
            return defaultSuggestions;
        }

        // If input is not empty, filter defaults
        return defaultSuggestions.filter(s => s.toLowerCase().includes(trimmedInput));
    }, [inputValue, aiSuggestions, defaultSuggestions, isLoading]);

    // The setSuggestions function for external use (like clearing)
    const setSuggestions = (newSuggestions: string[]) => {
        setAiSuggestions(newSuggestions);
    };

    return { suggestions, isLoading, setSuggestions };
};


// The display component
interface AISuggestionsDisplayProps {
    suggestions: string[];
    isLoading: boolean;
    onSelect: (suggestion: string) => void;
    showNoResults?: boolean;
}

export const AISuggestionsDisplay: React.FC<AISuggestionsDisplayProps> = ({ suggestions, isLoading, onSelect, showNoResults = false }) => {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="absolute z-10 mt-1 w-full bg-brand-blue border border-brand-blue/50 rounded-md shadow-lg p-3 text-sm text-gray-400 text-center animate-pulse">
                {t('aiSuggestions.thinking')}
            </div>
        );
    }

    if (suggestions.length === 0) {
        if (showNoResults && !isLoading) {
             return (
                <div className="absolute z-10 mt-1 w-full bg-brand-blue border border-brand-blue/50 rounded-md shadow-lg p-3 text-sm text-gray-500 text-center">
                    {t('aiSuggestions.noResults')}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="absolute z-10 mt-1 w-full bg-brand-blue border border-brand-blue/50 rounded-md shadow-lg max-h-60 overflow-y-auto animate-fade-in">
            <ul>
                {suggestions.map((s, i) => (
                    <li key={i}>
                        <button
                            type="button"
                            onMouseDown={(e) => { // use onMouseDown to fire before onBlur on input
                                e.preventDefault();
                                onSelect(s);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-brand-blue/70 transition-colors"
                        >
                            {s}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};
