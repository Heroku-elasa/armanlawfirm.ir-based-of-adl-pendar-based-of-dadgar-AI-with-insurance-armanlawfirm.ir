

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePart, useLanguage } from '../types';
import DocumentDisplay from './ReportDisplay';
import CameraInput from './CameraInput';
import { extractTextFromImage } from '../services/geminiService';

interface EvidenceAnalyzerProps {
    onAnalyze: (content: { file: FilePart }, userQuery: string, useThinkingMode: boolean) => void;
    analysisResult: string;
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
    userQuery: string;
    setUserQuery: (value: string) => void;
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

const EvidenceAnalyzer: React.FC<EvidenceAnalyzerProps> = ({
    onAnalyze, analysisResult, isLoading, error, isQuotaExhausted,
    userQuery, setUserQuery
}) => {
    const { t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    
    // State for text extraction feature
    const [extractedText, setExtractedText] = useState<string>('');
    const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setFileError(null);
        setExtractedText('');
        setExtractionError(null);
        if (rejectedFiles.length > 0) {
            setFileError(t('contractAnalyzer.unsupportedFileType'));
            setFile(null);
            setPreview(null);
            return;
        }
        if (acceptedFiles.length > 0) {
            const currentFile = acceptedFiles[0];
            setFile(currentFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(currentFile);
        }
    }, [t]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
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
        setExtractedText('');
        setExtractionError(null);
    };

    const handleAnalyze = async () => {
        if (file) {
            const base64Data = await fileToBase64(file);
            const filePart: FilePart = {
                mimeType: file.type,
                data: base64Data,
            };
            onAnalyze({ file: filePart }, userQuery, useThinkingMode);
        } else {
            alert('Please provide an image to analyze.');
        }
    };
    
    const handleUseExample = () => {
        const example = t('evidenceAnalyzer.example');
        if (example && typeof example === 'object' && 'userQuery' in example) {
            setUserQuery(example.userQuery as string);
        }
    };

    const handleExtractTextClick = async () => {
        if (!file) return;
        setIsExtractingText(true);
        setExtractionError(null);
        setExtractedText('');
        try {
            const base64Data = await fileToBase64(file);
            const filePart: FilePart = { mimeType: file.type, data: base64Data };
            const text = await extractTextFromImage(filePart);
            setExtractedText(text);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setExtractionError(msg);
        } finally {
            setIsExtractingText(false);
        }
    };

    const handleCopyText = () => {
        if (extractedText) {
            navigator.clipboard.writeText(extractedText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-evidence" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-evidence"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );

    return (
        <section id="evidence-analyzer" className="py-12 sm:py-16">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="bg-brand-blue/30 rounded-lg p-8 shadow-lg backdrop-blur-sm border border-brand-blue/50 lg:sticky top-40">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-md cursor-pointer text-center ${isDragActive ? 'border-brand-gold bg-brand-blue/70' : 'border-brand-blue/70'}`}>
                                <input {...getInputProps()} />
                                {preview ? (
                                    <img src={preview} alt="Preview" className="max-h-24 mx-auto rounded-md" />
                                ) : (
                                    <p className="text-gray-400">{file ? file.name : t('evidenceAnalyzer.dropzoneText')}</p>
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
                        
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-300">{t('evidenceAnalyzer.userQueryLabel')}</label>
                                <button type="button" onClick={handleUseExample} className="text-xs text-brand-gold hover:underline focus:outline-none">
                                    {t('generatorForm.useExample')}
                                </button>
                            </div>
                            <textarea
                                rows={3}
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white"
                                placeholder={t('evidenceAnalyzer.userQueryPlaceholder')}
                            />
                        </div>
                        <ThinkingModeToggle />
                        <div className="space-y-3">
                            <button onClick={handleAnalyze} disabled={isLoading || isQuotaExhausted || !file} className="w-full flex justify-center py-3 px-4 border-transparent rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">
                                {isLoading ? t('evidenceAnalyzer.analyzing') : t('evidenceAnalyzer.analyzeButton')}
                            </button>
                             <button 
                                onClick={handleExtractTextClick} 
                                disabled={isExtractingText || isQuotaExhausted || !file} 
                                className="w-full flex justify-center items-center py-3 px-4 border border-brand-gold rounded-md text-sm font-medium text-brand-gold bg-transparent hover:bg-brand-gold/10 disabled:opacity-50 transition-colors"
                            >
                                {isExtractingText ? t('evidenceAnalyzer.extractText.extracting') : t('evidenceAnalyzer.extractText.button')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-brand-blue/50">
                     <DocumentDisplay 
                        generatedDocument={analysisResult} 
                        isLoading={isLoading} 
                        error={error} 
                    />
                     {(isExtractingText || extractionError || extractedText) && (
                        <div className="p-4 sm:p-6 border-t border-brand-blue/50 animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-4">{t('evidenceAnalyzer.extractText.title')}</h3>
                            {isExtractingText && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-brand-gold"></div>
                                    <span className="ml-3 rtl:mr-3 text-gray-400">{t('evidenceAnalyzer.extractText.extracting')}</span>
                                </div>
                            )}
                            {extractionError && (
                                <div className="text-red-400 p-4 bg-red-900/50 rounded-md">{extractionError}</div>
                            )}
                            {extractedText && (
                                <div className="space-y-4">
                                    <textarea
                                        readOnly
                                        value={extractedText}
                                        rows={10}
                                        className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-gray-300 font-mono text-sm"
                                    />
                                    <button
                                        onClick={handleCopyText}
                                        className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                    >
                                        {isCopied ? t('evidenceAnalyzer.extractText.copied') : t('evidenceAnalyzer.extractText.copy')}
                                    </button>
                                </div>
                            )}
                        </div>
                     )}
                </div>
            </div>
        </section>
    );
};

export default EvidenceAnalyzer;
