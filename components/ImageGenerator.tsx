import React from 'react';
import { useLanguage } from '../types';

interface ImageGeneratorProps {
    onGenerate: (prompt: string, aspectRatio: string) => void;
    prompt: string;
    setPrompt: (value: string) => void;
    aspectRatio: string;
    setAspectRatio: (value: string) => void;
    generatedImage: string;
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
}

const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '3:4', label: 'Tall (3:4)' },
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
    onGenerate, prompt, setPrompt, aspectRatio, setAspectRatio,
    generatedImage, isLoading, error, isQuotaExhausted
}) => {
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            alert(t('imageGenerator.validationError'));
            return;
        }
        onGenerate(prompt, aspectRatio);
    };
    
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${generatedImage}`;
        link.download = 'generated-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section id="image-generator" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50 lg:sticky top-40">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-300">{t('imageGenerator.promptLabel')}</label>
                            <textarea
                                id="image-prompt"
                                rows={4}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                                placeholder={t('imageGenerator.promptPlaceholder')}
                            />
                        </div>
                         <div>
                            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300">{t('imageGenerator.aspectRatioLabel')}</label>
                            <select
                                id="aspect-ratio"
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="mt-1 block w-full bg-brand-blue/50 border-brand-blue/70 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm text-white"
                            >
                                {aspectRatios.map(ratio => (
                                    <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || isQuotaExhausted}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-blue bg-brand-gold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-blue focus:ring-brand-gold disabled:bg-brand-gold/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? t('imageGenerator.generating') : isQuotaExhausted ? t('quotaErrorModal.title') : t('imageGenerator.buttonText')}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-brand-blue/50 animate-fade-in p-6">
                    <div className="aspect-square bg-brand-blue/50 rounded-md flex items-center justify-center">
                         {isLoading && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-gold"></div>
                                <span className="mt-4 text-gray-400">{t('imageGenerator.generating')}</span>
                            </div>
                        )}
                        {error && <div className="text-red-400 p-4 text-center">{error}</div>}
                        {generatedImage && !isLoading && (
                            <img src={`data:image/jpeg;base64,${generatedImage}`} alt={prompt} className="rounded-md w-full h-full object-contain" />
                        )}
                        {!isLoading && !generatedImage && !error && (
                             <div className="text-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="mt-2 text-sm">{t('imageGenerator.placeholder')}</p>
                            </div>
                        )}
                    </div>
                     {generatedImage && !isLoading && (
                        <div className="mt-4">
                            <button
                                onClick={handleDownload}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                {t('imageGenerator.download')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ImageGenerator;