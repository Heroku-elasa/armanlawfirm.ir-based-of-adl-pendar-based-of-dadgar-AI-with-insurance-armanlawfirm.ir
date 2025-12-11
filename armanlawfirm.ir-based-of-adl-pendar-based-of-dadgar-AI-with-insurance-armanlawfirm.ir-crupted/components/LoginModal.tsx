
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './Toast';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [emailError, setEmailError] = useState('');
    const [checkEmail, setCheckEmail] = useState(false);

    if (!isOpen) return null;

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');

        if (!validateEmail(email)) {
            setEmailError('لطفا یک ایمیل معتبر وارد کنید.');
            return;
        }

        setIsLoading(true);

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                addToast("ورود موفقیت‌آمیز بود", "success");
                onLoginSuccess(data.user);
                onClose();
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                // Check if user session is null (means confirmation email sent)
                if (data.user && !data.session) {
                    setCheckEmail(true);
                } else {
                    addToast("ثبت‌نام انجام شد.", "success");
                    if (data.user) onLoginSuccess(data.user);
                    onClose();
                }
            }
        } catch (error: any) {
            addToast(error.message || "خطا در عملیات", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
            // Browser will redirect
        } catch (error: any) {
            addToast(error.message || "خطا در ارتباط با سرویس دهنده", "error");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl w-full max-w-sm m-4 overflow-hidden border border-brand-gold/30" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-brand-gold">
                            <span className="text-2xl">⚖️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ورود به حساب کاربری</h2>
                        <p className="text-sm text-gray-500 mt-1">موسسه حقوقی آرمان</p>
                    </div>

                    {checkEmail ? (
                        <div className="text-center space-y-4 animate-fade-in">
                            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">ایمیل ارسال شد!</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    لینک تایید به ایمیل <strong>{email}</strong> ارسال شد. لطفا صندوق ورودی (Inbox) یا پوشه اسپم (Spam) خود را بررسی کنید.
                                </p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-full bg-brand-gold text-brand-blue font-bold py-2 rounded-lg hover:bg-yellow-300 transition-colors"
                            >
                                متوجه شدم
                            </button>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleAuth} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ایمیل</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={e => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError('');
                                        }}
                                        className={`w-full bg-gray-100 dark:bg-gray-800 border ${emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg p-3 text-sm focus:ring-brand-gold focus:border-brand-gold outline-none transition-colors text-gray-900 dark:text-white`}
                                        placeholder="name@example.com"
                                        required
                                    />
                                    {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">رمز عبور</label>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-brand-gold focus:border-brand-gold outline-none text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full bg-[#003087] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>لطفا صبر کنید...</span>
                                        </>
                                    ) : (mode === 'login' ? 'ورود' : 'ثبت نام')}
                                </button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-white dark:bg-[#111827] text-gray-500">یا ورود با</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => handleSocialLogin('google')}
                                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                                    disabled={isLoading}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </button>
                                <button
                                    onClick={() => handleSocialLogin('github')}
                                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                                    disabled={isLoading}
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </button>
                            </div>

                            <div className="mt-4 text-center">
                                <button 
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'signup' : 'login');
                                        setEmailError('');
                                    }}
                                    className="text-xs text-brand-gold hover:underline"
                                >
                                    {mode === 'login' ? 'حساب کاربری ندارید؟ ثبت نام' : 'حساب دارید؟ ورود'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
