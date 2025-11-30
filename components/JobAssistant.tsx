
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { produce } from 'immer';
import { useDropzone } from 'react-dropzone';
import mammoth from 'mammoth';
import { nanoid } from 'nanoid';
import { JobApplication, JobDetails, useLanguage, JobApplicationStatus, FilePart, ChatMessage, JobSearchSuggestion } from '../types';
import * as geminiService from '../services/geminiService';

const CV_LOCAL_STORAGE_KEY = 'dadgar-ai-cv-draft';

interface JobAssistantProps {
    applications: JobApplication[];
    currentUserCv: string;
    setCurrentUserCv: (cv: string) => void;
    onAddApplication: (app: JobApplication) => Promise<void>;
    onUpdateApplication: (app: JobApplication) => Promise<void>;
    handleApiError: (err: unknown) => string;
    isQuotaExhausted: boolean;
    initialAppToEdit?: JobApplication | null;
    onClearAppToEdit?: () => void;
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

const fileToText = (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
             const reader = new FileReader();
             reader.onload = async (e) => {
                 const arrayBuffer = e.target?.result;
                 if (arrayBuffer) {
                     try {
                         const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer as ArrayBuffer });
                         resolve(result.value);
                     } catch (err) {
                         reject(err);
                     }
                 } else {
                     reject(new Error("Failed to read DOCX file."));
                 }
             };
             reader.onerror = (error) => reject(error);
             reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
             try {
                 const base64Data = await fileToBase64(file);
                 const filePart: FilePart = { mimeType: file.type, data: base64Data };
                 const text = await geminiService.extractTextFromDocument(filePart);
                 resolve(text);
             } catch (err) {
                 reject(err);
             }
        } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
             const reader = new FileReader();
             reader.readAsText(file);
             reader.onload = () => resolve(reader.result as string);
             reader.onerror = (error) => reject(error);
        } else {
             reject(new Error("UNSUPPORTED_FILE_TYPE"));
        }
    });
};

const GenerationStepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = ['Job Analysis', 'Tailoring Resume', 'Writing Cover Letter', 'Review'];
    
    return (
        <div className="w-full mb-8 px-2">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full"></div>
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-gold -z-10 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isPending = stepNum > currentStep;

                    return (
                        <div key={label} className="flex flex-col items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 z-10 bg-white dark:bg-gray-800
                                ${isCompleted ? 'bg-brand-gold border-brand-gold text-brand-blue' : ''}
                                ${isCurrent ? 'border-brand-gold text-brand-gold ring-4 ring-brand-gold/30 scale-110' : ''}
                                ${isPending ? 'border-gray-300 dark:border-gray-600 text-gray-400' : ''}
                            `}>
                                {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : isCurrent ? (
                                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    stepNum
                                )}
                            </div>
                            <span className={`
                                mt-2 text-xs font-medium transition-colors duration-300 absolute -bottom-6 w-32 text-center
                                ${isCurrent ? 'text-brand-gold font-bold' : isCompleted ? 'text-gray-500' : 'text-gray-400'}
                            `}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="h-6"></div>
        </div>
    );
};


const JobAssistant: React.FC<JobAssistantProps> = ({ 
    applications, currentUserCv, setCurrentUserCv, 
    onAddApplication, onUpdateApplication, handleApiError, isQuotaExhausted,
    initialAppToEdit, onClearAppToEdit
}) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'apply' | 'dashboard' | 'cv'>('dashboard');
    const [jobUrl, setJobUrl] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [currentApp, setCurrentApp] = useState<JobApplication | null>(initialAppToEdit || null);
    
    // CV Tab state
    const [linkedInUrl, setLinkedInUrl] = useState('');
    const [isSyncingLinkedIn, setIsSyncingLinkedIn] = useState(false);
    const [cvError, setCvError] = useState<string | null>(null);
    const [isParsingCv, setIsParsingCv] = useState(false);

    useEffect(() => {
        if (initialAppToEdit) {
            setCurrentApp(initialAppToEdit);
            setActiveTab('apply'); // Or preview mode
        }
    }, [initialAppToEdit]);

    useEffect(() => {
        if (!currentUserCv) {
            const savedCv = localStorage.getItem(CV_LOCAL_STORAGE_KEY);
            if (savedCv) setCurrentUserCv(savedCv);
        }
    }, [currentUserCv, setCurrentUserCv]);

    const handleSaveCv = (text: string) => {
        setCurrentUserCv(text);
        localStorage.setItem(CV_LOCAL_STORAGE_KEY, text);
    };

    const onDropCv = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setIsParsingCv(true);
            setCvError(null);
            try {
                const text = await fileToText(acceptedFiles[0]);
                handleSaveCv(text);
            } catch (err: any) {
                setCvError(err.message || "Failed to parse CV");
            } finally {
                setIsParsingCv(false);
            }
        }
    }, []);

    const { getRootProps: getCvRootProps, getInputProps: getCvInputProps, isDragActive: isCvDragActive } = useDropzone({
        onDrop: onDropCv,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        maxFiles: 1
    });

    const handleLinkedInSync = async () => {
        if (!linkedInUrl) return;
        setIsSyncingLinkedIn(true);
        try {
            const text = await geminiService.syncLinkedInProfile(linkedInUrl);
            handleSaveCv(text);
        } catch (err) {
            console.error(err);
            setCvError("Failed to sync LinkedIn");
        } finally {
            setIsSyncingLinkedIn(false);
        }
    };

    const handleGenerateApplication = async () => {
        if (!currentUserCv) {
            alert(t('jobAssistant.error.noCv'));
            setActiveTab('cv');
            return;
        }
        if (!jobUrl && !jobDescription) {
            alert(t('jobAssistant.error.noJob'));
            return;
        }

        setIsProcessing(true);
        setProcessingStep(1); // Analysis

        try {
            let details: JobDetails;
            if (jobUrl) {
                details = await geminiService.scrapeJobDetails(jobUrl);
            } else {
                // Mock details from description
                details = {
                    title: "Provided Job Description",
                    company: "Unknown",
                    description: jobDescription,
                    skills: []
                };
            }

            setProcessingStep(2); // Tailoring Resume
            const tailoredResume = await geminiService.generateTailoredResume(details, currentUserCv);

            setProcessingStep(3); // Cover Letter
            const coverLetter = await geminiService.generateCoverLetter(details, currentUserCv);

            setProcessingStep(4); // Review (Done)
            
            const newApp: JobApplication = {
                id: nanoid(),
                jobTitle: details.title,
                company: details.company,
                jobUrl: jobUrl,
                status: 'draft',
                cvText: currentUserCv, // Original CV snapshot
                jobDescription: details.description,
                tailoredResume: tailoredResume,
                coverLetter: coverLetter,
                lastUpdated: Date.now(),
                chatHistory: []
            };

            await onAddApplication(newApp);
            setCurrentApp(newApp);
            setJobUrl('');
            setJobDescription('');

        } catch (err: any) {
            alert(handleApiError(err));
        } finally {
            setIsProcessing(false);
            setProcessingStep(0);
        }
    };

    const handleStatusChange = async (app: JobApplication, newStatus: JobApplicationStatus) => {
        const updated = { ...app, status: newStatus, lastUpdated: Date.now() };
        await onUpdateApplication(updated);
        if (currentApp?.id === app.id) setCurrentApp(updated);
    };

    const handleWhatsAppApproval = async () => {
        if (!currentApp) return;
        try {
            await geminiService.sendWhatsAppApproval(currentApp.id, "+989123456789"); // Mock
            handleStatusChange(currentApp, 'pending_approval');
            alert("Sent for approval!");
        } catch (e) {
            console.error(e);
        }
    };

    const handleApplyEmail = async () => {
        if (!currentApp) return;
        try {
            await geminiService.applyByEmail(currentApp.id, "hr@company.com"); // Mock
            handleStatusChange(currentApp, 'applied');
            alert("Application sent!");
        } catch (e) {
            console.error(e);
        }
    };

    // Render Dashboard List
    if (activeTab === 'dashboard') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('jobAssistant.dashboard.title')}</h2>
                    <button onClick={() => setActiveTab('apply')} className="bg-brand-gold text-brand-blue px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition-colors">
                        + {t('jobAssistant.tabs.apply')}
                    </button>
                </div>
                
                {applications.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">{t('jobAssistant.dashboard.noApps')}</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {applications.map(app => (
                            <div key={app.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:border-brand-gold/50 transition-colors cursor-pointer" onClick={() => { setCurrentApp(app); setActiveTab('apply'); }}>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{app.jobTitle}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.company} • {new Date(app.lastUpdated).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    app.status === 'applied' ? 'bg-green-100 text-green-800' :
                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {t(`jobAssistant.status.${app.status}`)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Render CV Management
    if (activeTab === 'cv') {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setActiveTab('dashboard')} className="text-gray-500 hover:text-brand-gold">← Back</button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('jobAssistant.cv.title')}</h2>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('jobAssistant.cv.linkedinLabel')}</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={linkedInUrl} 
                                onChange={e => setLinkedInUrl(e.target.value)} 
                                placeholder={t('jobAssistant.cv.linkedinPlaceholder')}
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-transparent text-gray-900 dark:text-white"
                            />
                            <button 
                                onClick={handleLinkedInSync} 
                                disabled={isSyncingLinkedIn}
                                className="bg-[#0077b5] text-white px-4 py-2 rounded-md hover:bg-[#006097] disabled:opacity-50"
                            >
                                {isSyncingLinkedIn ? t('jobAssistant.cv.syncingButton') : t('jobAssistant.cv.syncButton')}
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400">OR</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <div {...getCvRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isCvDragActive ? 'border-brand-gold bg-brand-gold/10' : 'border-gray-300 dark:border-gray-600 hover:border-brand-gold'}`}>
                        <input {...getCvInputProps()} />
                        {isParsingCv ? (
                            <p className="text-brand-gold animate-pulse">{t('jobAssistant.cv.parsing')}</p>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">{t('jobAssistant.cv.dropzone')}</p>
                        )}
                        {cvError && <p className="text-red-500 text-sm mt-2">{cvError}</p>}
                    </div>

                    <textarea
                        rows={10}
                        value={currentUserCv}
                        onChange={e => handleSaveCv(e.target.value)}
                        placeholder={t('jobAssistant.cv.placeholder')}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-transparent text-gray-900 dark:text-white text-sm"
                    />
                </div>
            </div>
        );
    }

    // Render Apply / Edit View
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => { setCurrentApp(null); setActiveTab('dashboard'); }} className="text-gray-500 hover:text-brand-gold flex items-center gap-1">
                    ← {t('jobAssistant.tabs.dashboard')}
                </button>
                {currentApp && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-mono">{currentApp.status}</span>}
            </div>

            {!currentApp ? (
                // New Application Form
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('jobAssistant.apply.title')}</h2>
                    
                    {isProcessing && <GenerationStepper currentStep={processingStep} />}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobAssistant.apply.jobUrlLabel')}</label>
                            <input 
                                type="url" 
                                value={jobUrl} 
                                onChange={e => setJobUrl(e.target.value)} 
                                placeholder={t('jobAssistant.apply.jobUrlPlaceholder')}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-transparent text-gray-900 dark:text-white"
                                disabled={isProcessing}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobAssistant.apply.jobDescLabel')}</label>
                            <textarea 
                                rows={4}
                                value={jobDescription} 
                                onChange={e => setJobDescription(e.target.value)} 
                                placeholder={t('jobAssistant.apply.jobDescPlaceholder')}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-transparent text-gray-900 dark:text-white"
                                disabled={isProcessing}
                            />
                        </div>
                        <button 
                            onClick={handleGenerateApplication}
                            disabled={isProcessing || isQuotaExhausted}
                            className="w-full bg-brand-gold text-brand-blue font-bold py-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isProcessing ? 'Generating...' : t('jobAssistant.apply.generateButton')}
                        </button>
                    </div>
                </div>
            ) : (
                // Existing Application View (Review & Edit)
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Resume Editor */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('jobAssistant.preview.resume')}</h3>
                            <button className="text-xs text-brand-gold hover:underline">Download PDF</button>
                        </div>
                        <textarea
                            value={currentApp.tailoredResume}
                            onChange={e => onUpdateApplication({ ...currentApp, tailoredResume: e.target.value })}
                            className="w-full h-[600px] border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-brand-gold"
                        />
                    </div>

                    {/* Cover Letter & Actions */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('jobAssistant.preview.coverLetter')}</h3>
                            <textarea
                                value={currentApp.coverLetter}
                                onChange={e => onUpdateApplication({ ...currentApp, coverLetter: e.target.value })}
                                className="w-full h-[300px] border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-brand-gold"
                            />
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600 space-y-4">
                            <h4 className="font-bold text-gray-800 dark:text-white">Next Steps</h4>
                            <button 
                                onClick={handleWhatsAppApproval}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.512 1.916 6.36l-.348 1.251 1.27 1.27.347-1.252z"/></svg>
                                {t('jobAssistant.preview.whatsappButton')}
                            </button>
                            <button 
                                onClick={handleApplyEmail}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {t('jobAssistant.preview.applyButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobAssistant;
