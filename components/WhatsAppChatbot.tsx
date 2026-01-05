import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../types';
import { WHATSAPP_CONFIG } from '../constants';

interface Message {
  role: 'user' | 'bot';
  text: string;
  showServices?: boolean;
}

const SUGGESTIONS = {
  fa: [
    'چطور می‌توانم دادخواست مطالبه وجه بنویسم؟',
    'مراحل طلاق توافقی چیست؟',
    'برای شکایت از چک برگشتی چه کنم؟',
    'هزینه وکیل برای پرونده ملکی چقدر است؟',
    'چگونه شرکت ثبت کنم؟',
    'مهلت تجدیدنظرخواهی چند روز است؟',
    'برای گرفتن مهریه چه مدارکی لازم است؟',
    'آیا می‌توانم از کارفرما شکایت کنم؟',
    'نحوه انحصار وراثت چگونه است؟',
    'برای تنظیم قرارداد اجاره چه نکاتی مهم است؟',
    'چطور وکالتنامه بگیرم؟',
    'حضانت فرزند به چه کسی می‌رسد؟',
  ],
  en: [
    'How can I file a petition for debt collection?',
    'What are the steps for a mutual divorce?',
    'What should I do to file a complaint for a bounced check?',
    'How much does a lawyer cost for a property case?',
    'How do I register a company?',
    'What is the deadline for appeal?',
    'What documents are needed to claim dowry?',
    'Can I file a complaint against my employer?',
    'How does inheritance work?',
    'What are the key points for a rental contract?',
    'How do I get a power of attorney?',
    'Who gets child custody?',
  ]
};

const getRandomSuggestions = (lang: 'fa' | 'en', count: number = 3): string[] => {
  const suggestions = [...SUGGESTIONS[lang]];
  const result: string[] = [];
  for (let i = 0; i < count && suggestions.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    result.push(suggestions.splice(randomIndex, 1)[0]);
  }
  return result;
};

const getSessionId = (): string => {
  if (typeof window === 'undefined') return `s_${Date.now()}`;
  const stored = localStorage.getItem('arman_whatsapp_session');
  if (stored) return stored;
  const newSession = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('arman_whatsapp_session', newSession);
  return newSession;
};

const WHATSAPP_NUMBER = '+447424366129';
const WHATSAPP_LINK = `https://wa.me/447424366129?text=${encodeURIComponent('سلام، یک سوال حقوقی دارم')}`;

const SERVICE_LINKS = {
  fa: [
    { label: 'مشاوره حقوقی', page: 'legal_drafter' },
    { label: 'تنظیم دادخواست', page: 'legal_drafter' },
    { label: 'تحلیلگر قرارداد', page: 'contract_analyzer' },
    { label: 'دستیار دادگاه', page: 'court_assistant' },
  ],
  en: [
    { label: 'Legal Consultation', page: 'legal_drafter' },
    { label: 'Draft Petition', page: 'legal_drafter' },
    { label: 'Contract Analyzer', page: 'contract_analyzer' },
    { label: 'Court Assistant', page: 'court_assistant' },
  ]
};

const WelcomeMessage: React.FC<{ lang: 'fa' | 'en' }> = ({ lang }) => {
  if (lang === 'fa') {
    return (
      <div>
        <div>سلام! من ربات هوشمند موسسه حقوقی آرمان هستم.</div>
        <div className="mt-2">بهترین راه برای صحبت با من: از طریق واتساپ پیام بدهید - متن یا صوت!</div>
        <a 
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
        >
          باز کردن واتساپ
        </a>
        <div className="mt-3 text-gray-300 text-xs">یا اینجا سوال بپرسید!</div>
      </div>
    );
  }
  return (
    <div>
      <div>Hello! I'm Arman Law Firm's AI assistant.</div>
      <div className="mt-2">Best way to chat: Send me a message on WhatsApp - text or voice!</div>
      <a 
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
      >
        Open WhatsApp
      </a>
      <div className="mt-3 text-gray-300 text-xs">Or ask your question here!</div>
    </div>
  );
};

const ServiceLinks: React.FC<{ lang: 'fa' | 'en'; onNavigate?: (page: string) => void }> = ({ lang, onNavigate }) => {
  const links = SERVICE_LINKS[lang];
  return (
    <div className="mt-3 pt-3 border-t border-gray-600">
      <div className="text-xs text-gray-400 mb-2">{lang === 'fa' ? 'خدمات ما:' : 'Our Services:'}</div>
      <div className="flex flex-wrap gap-1">
        {links.map((link, i) => (
          <button 
            key={i}
            onClick={() => onNavigate?.(link.page)}
            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors"
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface WhatsAppChatbotProps {
  externalOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const WhatsAppChatbot: React.FC<WhatsAppChatbotProps> = ({ externalOpen, onOpenChange }) => {
  const { language } = useLanguage();
  const isRTL = language === 'fa';
  const lang = language === 'fa' ? 'fa' : 'en';
  
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (externalOpen !== undefined) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(getSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() => getRandomSuggestions(lang));
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    setMessages([]);
    setSuggestions(getRandomSuggestions(lang));
    setMessageCount(0);
  }, [lang]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(WHATSAPP_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json() as { response?: string };
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.response || (lang === 'fa' ? 'متاسفم، پاسخی دریافت نشد.' : 'Sorry, no response received.'),
        showServices: newCount === 1
      } as Message & { showServices?: boolean }]);
    } catch (error) {
      console.error('WhatsApp chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: lang === 'fa' 
          ? `متاسفم، خطایی رخ داد. لطفاً دوباره تلاش کنید یا با ایمیل info@armanlawfirm.ir تماس بگیرید.`
          : `Sorry, an error occurred. Please try again or email info@armanlawfirm.ir`
      }]);
    } finally {
      setIsLoading(false);
      setSuggestions(getRandomSuggestions(lang));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed z-[9999] inset-2 sm:inset-auto sm:bottom-24 sm:left-4 sm:right-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="w-full sm:w-96 sm:max-w-[calc(100vw-32px)] h-full sm:h-[500px] sm:max-h-[calc(100vh-160px)] bg-[#1a1a2e] rounded-xl shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">{isRTL ? 'دستیار هوشمند آرمان' : 'Arman AI Assistant'}</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {isRTL ? 'آنلاین' : 'Online'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleOpenChange(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#16213e]" dir={isRTL ? 'rtl' : 'ltr'}>
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed bg-[#2d2d44] text-white rounded-br-sm">
                  <WelcomeMessage lang={lang} />
                </div>
              </div>
            )}
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-bl-sm' 
                      : 'bg-[#2d2d44] text-white rounded-br-sm'
                    }
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#2d2d44] px-4 py-3 rounded-xl rounded-br-sm text-gray-400 text-sm italic">
                  {isRTL ? 'در حال تایپ...' : 'Typing...'}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-[#1a1a2e] border-t border-[#2d2d44]">
            {messages.length <= 1 && suggestions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-500/30 transition-colors border border-purple-500/30 truncate max-w-full"
                    title={suggestion}
                  >
                    {suggestion.length > 35 ? suggestion.substring(0, 35) + '...' : suggestion}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRTL ? "سوال خود را بنویسید..." : "Type your question..."}
                disabled={isLoading}
                className="flex-1 bg-[#16213e] border-2 border-[#2d2d44] rounded-full py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      <button
        onClick={() => handleOpenChange(!isOpen)}
        className={`fixed z-[9998] bottom-4 left-3 sm:bottom-6 sm:left-4 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-110 flex items-center justify-center ${isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
        aria-label="WhatsApp Chat"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
          AI
        </span>
      </button>
    </>
  );
};

export default WhatsAppChatbot;
