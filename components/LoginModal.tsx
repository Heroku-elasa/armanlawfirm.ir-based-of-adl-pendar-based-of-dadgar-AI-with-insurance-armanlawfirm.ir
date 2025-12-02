
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

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
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
                addToast("ثبت‌نام انجام شد. لطفا ایمیل خود را چک کنید.", "info");
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

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">ایمیل</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-brand-gold focus:border-brand-gold outline-none"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">رمز عبور</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-brand-gold focus:border-brand-gold outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-[#003087] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? '...' : (mode === 'login' ? 'ورود' : 'ثبت نام')}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-xs text-brand-gold hover:underline"
                        >
                            {mode === 'login' ? 'حساب کاربری ندارید؟ ثبت نام' : 'حساب دارید؟ ورود'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
