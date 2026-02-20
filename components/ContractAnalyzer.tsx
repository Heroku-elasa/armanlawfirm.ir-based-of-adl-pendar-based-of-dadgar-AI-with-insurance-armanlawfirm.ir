

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePart, useLanguage } from '../types';
import DocumentDisplay from './ReportDisplay';
import CameraInput from './CameraInput';

interface ContractAnalyzerProps {
    onAnalyze: (content: { file?: FilePart; text?: string }, userQuery: string, useThinkingMode: boolean) => void;
    analysisResult: string;
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
    userQuery: string;
    setUserQuery: (value: string) => void;
    initialText: string;
    setInitialText: (value: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.substring(result.indexOf(',') + 1)); 
    };
    reader.onerror = error => reject(error);
  });

const ContractAnalyzer: React.FC<ContractAnalyzerProps> = ({
    onAnalyze, analysisResult, isLoading, error, isQuotaExhausted,
    userQuery, setUserQuery, initialText, setInitialText
}) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [useThinkingMode, setUseThinkingMode] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setFileError(null);
        if (rejectedFiles.length > 0) {
            setFileError(t('contractAnalyzer.unsupportedFileType'));
            setFile(null);
            setPreview(null);
            return;
        }
        if (acceptedFiles.length > 0) {
            const currentFile = acceptedFiles[0];
            setFile(currentFile);
            if (currentFile.type.startsWith('image/')) {
                 const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(currentFile);
            } else {
                setPreview(null);
            }
        }
    }, [t]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        },
        maxFiles: 1,
    });
    
    const handleCapture = (base64Data: string, mimeType: string) => {
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const capturedFile = new File([blob], "capture.jpg", { type: mimeType });
        
        setFile(capturedFile);
        setPreview(URL.createObjectURL(capturedFile));
        setFileError(null);
        setActiveTab('upload');
    };

    const handleAnalyze = async () => {
        if (activeTab === 'upload' && file) {
            const base64Data = await fileToBase64(file);
            const filePart: FilePart = {
                mimeType: file.type,
                data: base64Data,
            };
            onAnalyze({ file: filePart }, userQuery, useThinkingMode);
        } else if (activeTab === 'text' && initialText.trim()) {
            onAnalyze({ text: initialText }, userQuery, useThinkingMode);
        } else {
            alert('Please provide a contract to analyze.');
        }
    };
    
    const handleUseExample = () => {
        const example = t('contractAnalyzer.example');
        if (example && typeof example === 'object' && 'userQuery' in example) {
            setUserQuery(example.userQuery as string);
        }
    };

    const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-contract" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-contract"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );

    return (
        <section id="contract-analyzer" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50 lg:sticky top-40">
                    <div className="space-y-6">
                        <div>
                            <div className="border-b border-brand-blue/50 mb-4">
                                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                    <button onClick={() => setActiveTab('upload')} className={`${activeTab === 'upload' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>{t('contractAnalyzer.uploadTab')}</button>
                                    <button onClick={() => setActiveTab('text')} className={`${activeTab === 'text' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>{t('contractAnalyzer.textTab')}</button>
                                </nav>
                            </div>
                            {activeTab === 'upload' ? (
                                <div className="space-y-4">
                                    <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-md cursor-pointer text-center ${isDragActive ? 'border-brand-gold bg-brand-blue/70' : 'border-brand-blue/70'}`}>
                                        <input {...getInputProps()} />
                                        {preview ? (
                                            <img src={preview} alt="Preview" className="max-h-24 mx-auto rounded-md" />
                                        ) : (
                                            <p className="text-gray-400">{file ? file.name : t('contractAnalyzer.dropzoneText')}</p>
                                        )}
                                        {fileError && <p className="mt-2 text-sm text-red-400">{fileError}</p>}
                                    </div>
                                    <div className="relative flex py-1 items-center">
                                        <div className="flex-grow border-t border-brand-blue/50"></div>
                                        <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                                        <div className="flex-grow border-t border-brand-blue/50"></div>
                                    </div>
                                    <CameraInput onCapture={handleCapture} />
                                </div>
                            ) : (
                                <textarea rows={8} value={initialText} onChange={(e) => setInitialText(e.target.value)} className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder='Paste contract text here...' />
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-300">{t('contractAnalyzer.userQueryLabel')}</label>
                                <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                                    {t('generatorForm.useExample')}
                                </button>
                            </div>
                            <textarea
                                rows={3}
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white"
                                placeholder={t('contractAnalyzer.userQueryPlaceholder')}
                            />
                        </div>
                        <ThinkingModeToggle />
                        <button onClick={handleAnalyze} disabled={isLoading || isQuotaExhausted || (activeTab === 'upload' && !file) || (activeTab === 'text' && !initialText.trim())} className="w-full flex justify-center py-3 px-4 border-transparent rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">
                            {isLoading ? t('contractAnalyzer.analyzing') : t('contractAnalyzer.analyzeButton')}
                        </button>
                    </div>
                </div>
                <div className="bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-brand-blue/50">
                     <DocumentDisplay 
                        generatedDocument={analysisResult} 
                        isLoading={isLoading} 
                        error={error} 
                    />
                </div>
            </div>
        </section>
    );
};

export default ContractAnalyzer;