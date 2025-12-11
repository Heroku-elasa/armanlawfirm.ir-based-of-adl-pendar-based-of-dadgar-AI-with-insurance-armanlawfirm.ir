
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLanguage, LegalCitation, CourtroomRebuttal, FilePart, CourtPersona, ChatHistoryItem } from '../types';
import { useToast } from './Toast';
import * as geminiService from '../services/geminiService';
import CameraInput from './CameraInput';

interface CourtAssistantProps {
    onFindCitations: (text: string) => void; // Keep old signature for App.tsx compatibility
    onGetRebuttal: (statement: string) => void; // Same here
    isLoading: boolean;
    citations: LegalCitation[];
    rebuttal: CourtroomRebuttal | null;
    draftText: string;
    setDraftText: (text: string) => void;
    error: string | null;
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

const CourtAssistant: React.FC<CourtAssistantProps> = ({
    isLoading,
    citations,
    rebuttal,
    draftText,
    setDraftText,
    error
}) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'citation' | 'live'>('citation');
    const [liveInput, setLiveInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<CourtPersona>('neutral_judge');
    
    // File Upload State
    const [file, setFile] = useState<FilePart | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    
    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Internal loading state
    const [localLoading, setLocalLoading] = useState(false);
    const [localCitations, setLocalCitations] = useState<LegalCitation[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    
    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Camera Modal State
    const [showCamera, setShowCamera] = useState(false);

    // Combine local and prop state
    const displayLoading = isLoading || localLoading;
    const displayCitations = localCitations.length > 0 ? localCitations : citations;
    const displayError = localError || error;

    useEffect(() => {
        if (activeTab === 'live') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, activeTab]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const currentFile = acceptedFiles[0];
            try {
                const base64 = await fileToBase64(currentFile);
                setFile({ mimeType: currentFile.type, data: base64 });
                setFileName(currentFile.name);
                addToast("File attached successfully.", "success");
            } catch (e) {
                addToast("Error reading file.", "error");
            }
        }
    }, [addToast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/*': ['.jpeg', '.jpg', '.png']
        },
        maxFiles: 1
    });

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    setFile({ mimeType: 'audio/webm', data: base64String });
                    setFileName("Audio Recording.webm");
                    addToast("Audio recorded and attached.", "success");
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            addToast("Could not access microphone.", "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleCameraCapture = (base64Data: string, mimeType: string) => {
        setFile({ mimeType, data: base64Data });
        setFileName("Camera Snapshot.jpg");
        setShowCamera(false);
        addToast("Photo captured and attached.", "success");
    };

    const handleScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = stream.getVideoTracks()[0];
            
            // Check if ImageCapture is available (experimental API)
            if ('ImageCapture' in window) {
                // @ts-ignore - ImageCapture is not yet in standard TS lib
                const imageCapture = new window.ImageCapture(videoTrack);
                const bitmap = await imageCapture.grabFrame();
                
                // Convert bitmap to base64 via canvas
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const context = canvas.getContext('2d');
                if (context) {
                    context.drawImage(bitmap, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    const base64 = dataUrl.split(',')[1];
                    setFile({ mimeType: 'image/jpeg', data: base64 });
                    setFileName("Screen Capture.jpg");
                    addToast("Screen captured and attached.", "success");
                }
            } else {
                addToast("Screen capture not supported in this browser.", "error");
            }
            
            // Stop sharing immediately after capture (or failure)
            videoTrack.stop();
        } catch (err) {
            console.error("Error sharing screen:", err);
            addToast("Screen share cancelled or failed.", "error");
        }
    };

    const removeFile = () => {
        setFile(null);
        setFileName(null);
    };

    const handleCitationSubmitInternal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draftText.trim() && !file) {
            addToast(t('generatorForm.validationError'), "error");
            return;
        }
        setLocalLoading(true);
        setLocalError(null);
        setLocalCitations([]);
        try {
            const result = await geminiService.findLegalCitations(draftText, file || undefined);
            setLocalCitations(result);
        } catch (err: any) {
            setLocalError(err.message || "Error finding citations");
        } finally {
            setLocalLoading(false);
        }
    };

    const handleLiveSubmitInternal = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageText = liveInput.trim();
        if (!messageText && !file) {
            addToast("Please enter text or record audio.", "error");
            return;
        }

        const newItem: ChatHistoryItem = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText || (fileName ? `[Attached: ${fileName}]` : 'Audio/File'),
            image: file?.mimeType.startsWith('image/') ? `data:${file.mimeType};base64,${file.data}` : undefined
        };

        setChatHistory(prev => [...prev, newItem]);
        setLiveInput('');
        setLocalLoading(true);
        setLocalError(null);

        const currentFile = file; // Capture current file
        removeFile(); // Clear file input immediately after sending

        try {
            const promptTemplate = t('courtAssistant.prompts.liveRebuttal');
            const personaLabel = t(`courtAssistant.live.personas.${selectedPersona}`);
            
            const result = await geminiService.getCourtRebuttal(messageText, promptTemplate, currentFile || undefined, personaLabel);
            
            const responseItem: ChatHistoryItem = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: result
            };
            setChatHistory(prev => [...prev, responseItem]);
        } catch (err: any) {
            setLocalError(err.message || "Error analyzing rebuttal");
            const errorItem: ChatHistoryItem = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: "Error analyzing response. Please try again."
            };
            setChatHistory(prev => [...prev, errorItem]);
        } finally {
            setLocalLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'valid': return 'bg-green-500';
            case 'invalid': return 'bg-red-500';
            case 'debatable': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const examples = activeTab === 'citation' 
        ? t('courtAssistant.citation.examples') 
        : t('courtAssistant.live.examples');

    const handleExampleClick = (ex: string) => {
        if (activeTab === 'citation') {
            setDraftText(ex);
        } else {
            setLiveInput(ex);
        }
    };

    const speakText = async (text: string) => {
        if (isSpeaking) return;
        setIsSpeaking(true);
        try {
            await geminiService.generateSpeech(text);
        } catch (e) {
            addToast("Failed to generate speech.", "error");
        } finally {
            setIsSpeaking(false);
        }
    };

    return (
        <section id="court-assistant" className="py-12 sm:py-16 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('courtAssistant.title')}</h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('courtAssistant.subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white dark:bg-brand-blue/30 p-1 rounded-xl inline-flex border border-gray-200 dark:border-brand-blue/50">
                        <button
                            onClick={() => { setActiveTab('citation'); removeFile(); setLocalCitations([]); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'citation' ? 'bg-brand-gold text-brand-blue shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {t('courtAssistant.tabs.citation')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('live'); removeFile(); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${activeTab === 'live' ? 'block' : 'hidden'}`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTab === 'live' ? 'bg-white' : 'bg-red-500'}`}></span>
                            </span>
                            {t('courtAssistant.tabs.live')}
                        </button>
                    </div>
                </div>

                {activeTab === 'citation' ? (
                    /* Citation View */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5 space-y-6">
                            <div className="p-6 rounded-2xl shadow-lg border h-full flex flex-col bg-white dark:bg-brand-blue/30 border-gray-200 dark:border-brand-blue/50">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">{t('courtAssistant.citation.title')}</h3>
                                <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">{t('courtAssistant.citation.description')}</p>
                                
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {Array.isArray(examples) && examples.map((ex: string, i: number) => (
                                        <button key={i} onClick={() => handleExampleClick(ex)} className="text-xs px-2 py-1 rounded-full border transition-colors text-right truncate max-w-full bg-gray-100 dark:bg-brand-blue/50 border-gray-300 dark:border-brand-blue/70 text-gray-600 dark:text-gray-300 hover:bg-brand-gold/20">
                                            {ex}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleCitationSubmitInternal} className="flex-grow flex flex-col">
                                    <textarea
                                        value={draftText}
                                        onChange={(e) => setDraftText(e.target.value)}
                                        placeholder={t('courtAssistant.citation.inputPlaceholder')}
                                        className="flex-grow w-full p-4 rounded-xl focus:ring-2 resize-none min-h-[200px] mb-4 bg-gray-50 dark:bg-brand-blue/50 border border-gray-200 dark:border-brand-blue/70 focus:ring-brand-gold text-gray-900 dark:text-white"
                                    />
                                    
                                    <div className="mb-4 flex items-center gap-2">
                                        <div {...getRootProps()} className="cursor-pointer">
                                            <input {...getInputProps()} />
                                            <button type="button" className="p-2 rounded-full transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300" title={t('courtAssistant.inputOptions.uploadFile')}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            </button>
                                        </div>
                                        <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`} title={t('courtAssistant.inputOptions.recordAudio')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                        </button>
                                        {fileName && (
                                            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs truncate max-w-[150px] bg-blue-100 text-blue-800">
                                                <span className="truncate">{fileName}</span>
                                                <button type="button" onClick={removeFile} className="hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" disabled={displayLoading} className="w-full py-3 px-4 font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 bg-brand-gold text-brand-blue hover:bg-yellow-300">
                                        {displayLoading ? <><div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-brand-blue"></div> {t('reportDisplay.generating')}</> : t('courtAssistant.citation.button')}
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            {displayError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{displayError}</div>}
                            {displayCitations.length > 0 ? (
                                <div className="bg-white dark:bg-brand-blue/30 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-brand-blue/50">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('courtAssistant.citation.resultTitle')}</h3>
                                    <div className="space-y-4">
                                        {displayCitations.map((citation, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-brand-blue/50 p-4 rounded-xl border-l-4 border-brand-gold hover:shadow-md transition-shadow">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">"{citation.text_segment}"</p>
                                                <div className="flex flex-wrap gap-2 items-center mb-2">
                                                    <span className="px-2 py-1 bg-brand-gold text-brand-blue text-xs font-bold rounded">{citation.law_name}</span>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">{t('courtAssistant.citation.articleNo')} {citation.article_number}</span>
                                                </div>
                                                <p className="text-gray-800 dark:text-white text-sm">{citation.relevance_explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                !displayLoading && (
                                    <div className="h-full flex items-center justify-center text-center p-12 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <div className="text-gray-400">
                                            <p className="text-lg font-medium">منتظر ورودی شما...</p>
                                            <p className="text-sm mt-2">لطفا متن لایحه، فایل یا صدای دادگاه را وارد کنید.</p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    /* Live Chat View */
                    <div className="grid grid-cols-1 gap-6 h-[700px] lg:h-[800px]">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
                            {/* Chat Header & Persona */}
                            <div className="bg-gray-800 p-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
                                <div className="flex items-center gap-2 text-white">
                                    <div className="bg-red-600 p-2 rounded-full animate-pulse"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                                    <h3 className="font-bold">{t('courtAssistant.live.title')}</h3>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <label className="text-gray-400 text-xs whitespace-nowrap">{t('courtAssistant.live.personaLabel')}</label>
                                    <select 
                                        value={selectedPersona}
                                        onChange={(e) => setSelectedPersona(e.target.value as CourtPersona)}
                                        className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1 border-none focus:ring-2 focus:ring-brand-gold"
                                    >
                                        {Object.entries(t('courtAssistant.live.personas')).map(([key, label]) => (
                                            <option key={key} value={key}>{label as string}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Chat History */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-900">
                                {chatHistory.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                        <p>{t('courtAssistant.live.description')}</p>
                                    </div>
                                )}
                                
                                {chatHistory.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-brand-blue border border-gray-700 text-white rounded-tr-none' : 'bg-gray-800 border-l-4 border-brand-gold text-gray-100 rounded-tl-none'}`}>
                                            {msg.role === 'user' ? (
                                                <>
                                                    {msg.image && <img src={msg.image} alt="User attachment" className="w-full h-32 object-cover rounded-lg mb-2" />}
                                                    <p>{msg.content as string}</p>
                                                </>
                                            ) : (
                                                typeof msg.content === 'string' ? <p>{msg.content}</p> : (
                                                    <div className="space-y-3">
                                                        <div className={`flex items-center justify-between pb-2 border-b border-gray-700`}>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getStatusColor((msg.content as CourtroomRebuttal).validity_status)} text-white`}>
                                                                {t(`courtAssistant.live.validity.${(msg.content as CourtroomRebuttal).validity_status}`)}
                                                            </span>
                                                            <button 
                                                                onClick={() => speakText((msg.content as CourtroomRebuttal).suggested_rebuttal)} 
                                                                className={`text-gray-400 hover:text-white ${isSpeaking ? 'animate-pulse text-brand-gold' : ''}`} 
                                                                title={t('courtAssistant.live.voiceAction')}
                                                                disabled={isSpeaking}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                            </button>
                                                        </div>
                                                        
                                                        <div>
                                                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">{t('courtAssistant.live.analysisTitle')}</p>
                                                            <p className="text-sm text-gray-300 leading-relaxed">{(msg.content as CourtroomRebuttal).analysis}</p>
                                                        </div>

                                                        <div className="bg-black/30 p-2 rounded border border-gray-700/50">
                                                            <p className="text-xs text-blue-400 font-mono mb-1">{(msg.content as CourtroomRebuttal).relevant_law}</p>
                                                        </div>

                                                        <div className="bg-green-900/20 p-3 rounded-lg border border-green-900/50">
                                                            <p className="text-xs text-green-400 uppercase font-bold mb-1">{t('courtAssistant.live.rebuttalTitle')}</p>
                                                            <p className="text-sm text-white font-medium leading-relaxed">{(msg.content as CourtroomRebuttal).suggested_rebuttal}</p>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {displayLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-gray-800 border-t border-gray-700">
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {Array.isArray(examples) && examples.map((ex: string, i: number) => (
                                        <button key={i} onClick={() => setLiveInput(ex)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors border border-gray-600">
                                            {ex.length > 30 ? ex.substring(0, 30) + '...' : ex}
                                        </button>
                                    ))}
                                </div>
                                
                                <form onSubmit={handleLiveSubmitInternal} className="flex gap-2 items-end">
                                    <div className="flex-grow relative">
                                        <textarea
                                            value={liveInput}
                                            onChange={(e) => setLiveInput(e.target.value)}
                                            placeholder={t('courtAssistant.live.inputPlaceholder')}
                                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:ring-1 focus:ring-red-500 resize-none pr-28 min-h-[50px] max-h-[150px]"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleLiveSubmitInternal(e);
                                                }
                                            }}
                                        />
                                        <div className="absolute left-2 bottom-2 flex gap-1">
                                            <div {...getRootProps()} className="cursor-pointer">
                                                <input {...getInputProps()} />
                                                <button type="button" className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-full" title={t('courtAssistant.inputOptions.uploadFile')}>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </button>
                                            </div>
                                            <button type="button" onClick={() => setShowCamera(true)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-full" title={t('courtAssistant.inputOptions.camera')}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </button>
                                            <button type="button" onClick={handleScreenShare} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-full" title={t('courtAssistant.inputOptions.screenShare')}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </button>
                                            <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-1.5 rounded-full ${isRecording ? 'text-red-500 animate-pulse bg-red-900/20' : 'text-gray-400 hover:text-white bg-gray-800'}`} title={t('courtAssistant.inputOptions.recordAudio')}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={displayLoading || (!liveInput.trim() && !file)} className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-900/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.172 15V4.828a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428a1 1 0 00.707-1.952V4.828a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428a1 1 0 00.707-1.952V4.828z" /></svg>
                                    </button>
                                </form>
                                {fileName && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded w-fit">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        {fileName}
                                        <button onClick={removeFile} className="hover:text-red-400 ml-1">×</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Simple Modal for Camera */}
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="bg-gray-900 p-4 rounded-xl max-w-lg w-full relative">
                        <button onClick={() => setShowCamera(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h3 className="text-white font-bold mb-4">Live Snapshot</h3>
                        <CameraInput onCapture={handleCameraCapture} />
                    </div>
                </div>
            )}
        </section>
    );
};

export default CourtAssistant;
