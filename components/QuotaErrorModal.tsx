import React from 'react';
import { useLanguage } from '../types';

interface QuotaErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuotaErrorModal: React.FC<QuotaErrorModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-brand-blue rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-red-500/50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900">
            <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-5 text-lg font-semibold leading-6 text-white">{t('quotaErrorModal.title')}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-400">
              {t('quotaErrorModal.body')}
            </p>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://aistudio.google.com/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-gold text-base font-medium text-brand-blue hover:bg-yellow-200 focus:outline-none sm:text-sm text-center"
          >
            {t('quotaErrorModal.cta')}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-brand-blue/50 text-base font-medium text-white hover:bg-brand-blue/80 focus:outline-none sm:text-sm"
          >
            {t('quotaErrorModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotaErrorModal;