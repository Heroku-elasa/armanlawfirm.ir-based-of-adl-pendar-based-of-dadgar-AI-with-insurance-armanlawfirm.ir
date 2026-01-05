
import React, { useState } from 'react';
import { useLanguage } from '../types';
import { useToast } from './Toast';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const presetAmounts = t('donation.amounts') as string[];

    if (!isOpen) return null;

    const handlePay = () => {
        if (!amount) return;
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            addToast(t('donation.success'), 'success');
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-brand-blue rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden border border-brand-gold/50" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-brand-gold to-yellow-300 p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-brand-blue">{t('donation.title')}</h2>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                        {t('donation.subtitle')}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {presetAmounts.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setAmount(amt.replace(/,/g, ''))}
                                className={`py-2 px-3 rounded border transition-colors ${amount === amt.replace(/,/g, '') ? 'bg-brand-gold text-brand-blue border-brand-gold font-bold' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                {amt}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('donation.customAmount')}</label>
                        <input 
                            type="number" 
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-3 text-lg font-bold text-center text-brand-blue dark:text-white focus:ring-brand-gold"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <button 
                        onClick={handlePay} 
                        disabled={isProcessing || !amount}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t('donation.pay')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DonationModal;
