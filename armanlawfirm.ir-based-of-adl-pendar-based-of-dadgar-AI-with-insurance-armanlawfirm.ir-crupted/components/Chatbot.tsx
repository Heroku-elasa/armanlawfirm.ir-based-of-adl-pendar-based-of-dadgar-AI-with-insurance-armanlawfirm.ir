
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage, ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface ChatbotProps {
    isQuotaExhausted: boolean;
    handleApiError: (err: unknown) => string;
}

// Helper component for highlighting text
const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <>{text}</>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-300 text-black rounded-sm px-0.5 font-medium">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const Chatbot: React.FC<ChatbotProps> = ({ isQuotaExhausted, handleApiError }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const initialSuggestions = [
        t('chatbot.initialSuggestions.s1'),
        t('chatbot.initialSuggestions.s2'),
        t('chatbot.initialSuggestions.s3')
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!searchQuery) {
            scrollToBottom();
        }
    }, [messages, isLoading, searchQuery]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setIsLoading(true);
            setTimeout(() => {
                setMessages([{ role: 'model', text: t('chatbot.welcomeMessage') }]);
                setSuggestions(initialSuggestions);
                setIsLoading(false);
            }, 500);
        }
    }, [isOpen, messages.length, t, initialSuggestions]);

    const handleSendMessage = async (messageText?: string) => {
        const textToSend = (messageText || inputValue).trim();
        if (!textToSend || isLoading || isQuotaExhausted) return;

        // Clear search when sending a message
        if (isSearchOpen) {
            setSearchQuery('');
            setIsSearchOpen(false);
        }

        const newUserMessage: ChatMessage = { role: 'user', text: textToSend };
        const newMessages = [...messages, newUserMessage];
        
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);
        setSuggestions([]);

        try {
            const response = await generateChatResponse(newMessages);
            const aiMessage: ChatMessage = { role: 'model', text: response.reply };
            setMessages(prev => [...prev, aiMessage]);
            setSuggestions(response.suggestions || []);
        } catch (err) {
            const errorMsg = handleApiError(err);
            const errorMessage: ChatMessage = { role: 'model', text: `Sorry, an error occurred: ${errorMsg}`};
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        handleSendMessage(suggestion);
    };

    // Filter messages based on search query
    const displayedMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        return messages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [messages, searchQuery]);

    return (
        <>
            {/* Chat Window: Full-screen on mobile, floating on desktop */}
            <div className={`fixed z-50 transition-all duration-300 ease-out
                ${/* Base styles for position and transition */ ''}
                inset-0
                sm:inset-auto sm:bottom-24 ${t('langCode') === 'fa' ? 'sm:left-5' : 'sm:right-5'}
                
                ${/* Handle open/close state */ ''}
                ${isOpen 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-full sm:translate-y-4 pointer-events-none'
                }`
            }>
                <div className="w-full h-full bg-brand-blue/95 backdrop-blur-xl flex flex-col 
                                sm:max-w-sm md:max-w-md sm:border sm:border-brand-gold/30 
                                sm:rounded-xl sm:shadow-2xl sm:h-[70vh] sm:max-h-[600px]">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brand-blue/50">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="bg-brand-gold p-2 rounded-full">
                               <svg className="h-5 w-5 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v16.5m-1.5-16.5v16.5m-3-16.5v16.5m-1.5-16.5v16.5m-3-16.5v16.5m-1.5-16.5v16.5M5.25 4.97c-1.01.143-2.01.317-3 .52m3-.52v16.5m1.5-16.5v16.5m3-16.5v16.5m1.5-16.5v16.5m3-16.5v16.5m1.5-16.5v16.5" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-white">{t('chatbot.title')}</h3>
                        </div>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <button 
                                onClick={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery(''); }} 
                                className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'text-brand-gold bg-brand-blue/50' : 'text-gray-400 hover:text-white'}`}
                                title="Search Chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    {isSearchOpen && (
                        <div className="px-4 py-2 bg-brand-blue/80 border-b border-brand-blue/50 animate-fade-in">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search messages..." 
                                    className="w-full bg-indigo-950/50 border border-brand-blue/70 rounded-lg py-1.5 px-3 pl-8 rtl:pl-3 rtl:pr-8 text-sm text-white focus:outline-none focus:border-brand-gold/50"
                                    autoFocus
                                />
                                <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-2 rtl:pr-2 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-2 rtl:pl-2 flex items-center text-gray-400 hover:text-white"
                                    >
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {displayedMessages.length === 0 && searchQuery && (
                            <div className="text-center text-gray-400 text-sm py-4">
                                No messages found for "{searchQuery}"
                            </div>
                        )}
                        
                        {displayedMessages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-6 h-6 bg-brand-gold rounded-full flex-shrink-0"></div>}
                                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-brand-gold text-brand-blue rounded-br-none' : 'bg-indigo-900/70 text-white rounded-bl-none'}`}>
                                    <p className="text-sm">
                                        <HighlightedText text={msg.text} highlight={searchQuery} />
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && !searchQuery && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-6 h-6 bg-brand-gold rounded-full flex-shrink-0"></div>
                                <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-2xl bg-indigo-900/70 text-white rounded-bl-none flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions & Input */}
                    <div className="flex-shrink-0 p-4 border-t border-brand-blue/50 space-y-3">
                        {suggestions.length > 0 && !searchQuery && (
                            <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => handleSuggestionClick(s)} className="px-3 py-1.5 bg-brand-blue/70 text-brand-gold text-sm rounded-full hover:bg-brand-blue transition-colors">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2 rtl:space-x-reverse">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={t('chatbot.placeholder')}
                                disabled={isLoading || isQuotaExhausted}
                                className="w-full bg-indigo-950/80 border-brand-blue/70 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-gold text-white text-sm disabled:opacity-50"
                            />
                            <button type="submit" disabled={!inputValue.trim() || isLoading || isQuotaExhausted} className="p-2 bg-brand-gold rounded-full text-brand-blue disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.172 15V4.828a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.172 15V4.828a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428a1 1 0 00.707-1.952V4.828a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428a1 1 0 00.707-1.952V4.828z" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Chat Toggle Button */}
            <div className={`fixed z-40 bottom-5 transition-all duration-300 ease-out ${t('langCode') === 'fa' ? 'left-5' : 'right-5'} ${isOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-brand-gold text-brand-blue rounded-full p-4 shadow-lg hover:bg-yellow-200 transform hover:scale-110 transition-all"
                    aria-label={t('chatbot.title')}
                >
                     <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                </button>
            </div>
        </>
    );
};

export default Chatbot;
