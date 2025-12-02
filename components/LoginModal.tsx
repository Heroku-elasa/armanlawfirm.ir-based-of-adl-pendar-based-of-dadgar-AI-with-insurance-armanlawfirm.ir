
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
