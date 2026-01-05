
import React, { useState } from 'react';
import { useLanguage } from '../types';
import { useToast } from './Toast';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        type: 'in-person', // in-person, meet, whatsapp
        date: '',
        time: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handlePayment = () => {
        setIsProcessing(true);
        // Simulate payment gateway delay
        setTimeout(() => {
            setIsProcessing(false);
            addToast(t('booking.success'), 'success');
            onClose();
            setStep(1); // Reset
        }, 2000);
    };

    const nextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-brand-blue rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden border border-brand-gold/30" onClick={e => e.stopPropagation()}>
                <div className="bg-brand-blue/50 p-4 border-b border-brand-gold/20 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{t('booking.title')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <form onSubmit={nextStep} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('booking.nameLabel')}</label>
                                <input required type="text" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-gray-900 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('booking.phoneLabel')}</label>
                                <input required type="tel" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-gray-900 dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('booking.subtitle')}</label>
                                <select className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-gray-900 dark:text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="in-person">{t('booking.inPerson')}</option>
                                    <option value="meet">{t('booking.onlineMeet')}</option>
                                    <option value="whatsapp">{t('booking.onlineWhatsApp')}</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('booking.dateLabel')}</label>
                                    <input required type="date" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-gray-900 dark:text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                    <input required type="time" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-gray-900 dark:text-white" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-brand-gold text-brand-blue font-bold py-3 rounded hover:bg-yellow-300 transition-colors mt-4">
                                ادامه
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 text-right">
                                <p><strong>نام:</strong> {formData.name}</p>
                                <p><strong>نوع مشاوره:</strong> {formData.type === 'in-person' ? t('booking.inPerson') : 'آنلاین'}</p>
                                <p><strong>زمان:</strong> {formData.date} ساعت {formData.time}</p>
                            </div>
                            
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-white">
                                    <span>{t('booking.price')}</span>
                                    <span className="font-bold text-xl">250,000 تومان</span>
                                </div>
                                <button 
                                    onClick={handlePayment} 
                                    disabled={isProcessing}
                                    className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                            {t('booking.payment')}
                                        </>
                                    )}
                                </button>
                                <button onClick={() => setStep(1)} className="text-sm text-gray-500 mt-3 hover:text-brand-gold">{t('blog.back')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
