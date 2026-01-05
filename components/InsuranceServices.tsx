
import React, { useState, useCallback } from 'react';
import { produce } from 'immer';
import { useDropzone } from 'react-dropzone';
import { AppState, useLanguage, FilePart } from '../types';
import DocumentDisplay from './ReportDisplay';
import CameraInput from './CameraInput';
import { useAISuggestions, AISuggestionsDisplay } from './AISuggestions';

// --- PROPS INTERFACE ---
interface InsuranceServicesProps {
    onAnalyzePolicy: (content: { file?: FilePart; text?: string }, userQuery: string, useThinkingMode: boolean) => void;
    onDraftClaim: (query: AppState['insurance_claimQuery']) => void;
    onRecommendInsurance: (query: string) => void;
    onAssessRisk: (query: AppState['insurance_riskQuery']) => void;
    onDetectFraud: (query: AppState['insurance_fraudQuery']) => void;
    onAutoClaimAssess: (content: { file: FilePart }, userQuery: string, useThinkingMode: boolean) => void;
    onSimulateQuote: (query: AppState['insurance_quoteQuery']) => void;
    onAnalyzeLifeNeeds: (query: AppState['insurance_lifeNeedsQuery']) => void;
    isLoading: boolean;
    error: string | null;
    isQuotaExhausted: boolean;
    
    // State and setters for each tool
    policyQuery: string; setPolicyQuery: (v: string) => void; policyAnalysis: string; initialPolicyText: string; setInitialPolicyText: (v: string) => void;
    claimQuery: AppState['insurance_claimQuery']; setClaimQuery: (v: AppState['insurance_claimQuery']) => void; generatedClaim: string;
    recommendationQuery: string; setRecommendationQuery: (v: string) => void; recommendationAnswer: string;
    riskQuery: AppState['insurance_riskQuery']; setRiskQuery: (v: AppState['insurance_riskQuery']) => void; riskAssessmentResult: string;
    fraudQuery: AppState['insurance_fraudQuery']; setFraudQuery: (v: AppState['insurance_fraudQuery']) => void; fraudDetectionResult: string;
    autoClaimQuery: string; setAutoClaimQuery: (v: string) => void; autoClaimResult: string;
    quoteQuery: AppState['insurance_quoteQuery']; setQuoteQuery: (v: AppState['insurance_quoteQuery']) => void; quoteResult: string;
    lifeNeedsQuery: AppState['insurance_lifeNeedsQuery']; setLifeNeedsQuery: (v: AppState['insurance_lifeNeedsQuery']) => void; lifeNeedsResult: string;
}

// --- HELPER COMPONENTS ---

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

const CollapsibleTool: React.FC<{ title: string; description: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, description, children, isOpen, onToggle }) => (
    <div className="bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-brand-blue/50 overflow-hidden">
        <button onClick={onToggle} className="w-full text-left p-6 flex justify-between items-center hover:bg-brand-blue/50 transition-colors">
            <div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-gray-400 mt-1">{description}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-brand-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isOpen && <div className="p-6 border-t border-brand-blue/50 animate-fade-in">{children}</div>}
    </div>
);

// --- INDIVIDUAL TOOL COMPONENTS ---

const PolicyAnalyzerTool: React.FC<Pick<InsuranceServicesProps, 'onAnalyzePolicy' | 'isLoading' | 'policyQuery' | 'setPolicyQuery' | 'initialPolicyText' | 'setInitialPolicyText' | 'isQuotaExhausted'>> = ({ onAnalyzePolicy, isLoading, policyQuery, setPolicyQuery, initialPolicyText, setInitialPolicyText, isQuotaExhausted }) => {
    const { t } = useLanguage();
    const [tab, setTab] = useState<'upload' | 'text'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const onDrop = useCallback((accepted:File[], rejected:any[]) => { if(rejected.length) setFileError(t('contractAnalyzer.unsupportedFileType')); else { setFile(accepted[0]); setFileError(null); }},[t]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'application/pdf':[], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':[], 'text/plain':[], 'image/jpeg':[], 'image/png':[]}, maxFiles: 1 });
    const handleCapture = (base64Data: string, mimeType: string) => { /* logic to create file from base64 */ };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'upload' && file) onAnalyzePolicy({ file: { mimeType: file.type, data: await fileToBase64(file) } }, policyQuery, useThinkingMode);
        else if (tab === 'text' && initialPolicyText) onAnalyzePolicy({ text: initialPolicyText }, policyQuery, useThinkingMode);
    };
     const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-policy" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-policy"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-brand-blue/50"><nav className="-mb-px flex space-x-4"><button type="button" onClick={() => setTab('upload')} className={`${tab === 'upload' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-400'} py-2 px-1 border-b-2 text-sm`}>{t('contractAnalyzer.uploadTab')}</button><button type="button" onClick={() => setTab('text')} className={`${tab === 'text' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-400'} py-2 px-1 border-b-2 text-sm`}>{t('contractAnalyzer.textTab')}</button></nav></div>
            {tab === 'upload' ? (<div><div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-md cursor-pointer ${isDragActive ? 'border-brand-gold' : 'border-brand-blue/70'}`}><input {...getInputProps()} /><p className="text-gray-400 text-sm">{file ? file.name : t('contractAnalyzer.dropzoneText')}</p>{fileError && <p className="text-red-400 text-sm">{fileError}</p>}</div><div className="relative my-2 flex items-center"><div className="flex-grow border-t border-brand-blue/50"></div><span className="mx-4 text-xs text-gray-400">OR</span><div className="flex-grow border-t border-brand-blue/50"></div></div><CameraInput onCapture={handleCapture} /></div>) : (<textarea rows={6} value={initialPolicyText} onChange={e => setInitialPolicyText(e.target.value)} className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder='Paste policy text...' />)}
            <textarea rows={2} value={policyQuery} onChange={e => setPolicyQuery(e.target.value)} className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.policyAnalyzer.userQueryPlaceholder')} />
            <ThinkingModeToggle />
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('contractAnalyzer.analyzing') : t('contractAnalyzer.analyzeButton')}</button>
        </form>
    );
};

const ClaimDrafterTool: React.FC<Pick<InsuranceServicesProps, 'onDraftClaim' | 'isLoading' | 'claimQuery' | 'setClaimQuery'>> = ({ onDraftClaim, isLoading, claimQuery, setClaimQuery }) => {
    const { t } = useLanguage();
    const handleChange = (field: keyof typeof claimQuery, value: string) => setClaimQuery(produce(claimQuery, draft => { draft[field] = value; }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onDraftClaim(claimQuery); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm text-gray-300">{t('insuranceServices.claimDrafter.incidentTypeLabel')}</label><input type="text" value={claimQuery.incidentType} onChange={e => handleChange('incidentType', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.claimDrafter.incidentTypePlaceholder')} /></div><div><label className="block text-sm text-gray-300">{t('insuranceServices.claimDrafter.policyNumberLabel')}</label><input type="text" value={claimQuery.policyNumber} onChange={e => handleChange('policyNumber', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.claimDrafter.policyNumberPlaceholder')} /></div></div>
            <div><label className="block text-sm text-gray-300">{t('insuranceServices.claimDrafter.descriptionLabel')}</label><textarea rows={4} value={claimQuery.description} onChange={e => handleChange('description', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.claimDrafter.descriptionPlaceholder')} /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('reportDisplay.generating') : t('insuranceServices.claimDrafter.buttonText')}</button>
        </form>
    );
};

const RecommenderTool: React.FC<Pick<InsuranceServicesProps, 'onRecommendInsurance' | 'isLoading' | 'recommendationQuery' | 'setRecommendationQuery'>> = ({ onRecommendInsurance, isLoading, recommendationQuery, setRecommendationQuery }) => {
    const { t } = useLanguage();
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onRecommendInsurance(recommendationQuery); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-300">{t('insuranceServices.recommender.queryLabel')}</label><textarea rows={3} value={recommendationQuery} onChange={e => setRecommendationQuery(e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.recommender.queryPlaceholder')} /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('insuranceServices.recommender.gettingAnswer') : t('insuranceServices.recommender.buttonText')}</button>
        </form>
    );
};

const RiskAssessorTool: React.FC<Pick<InsuranceServicesProps, 'onAssessRisk' | 'isLoading' | 'riskQuery' | 'setRiskQuery'>> = ({ onAssessRisk, isLoading, riskQuery, setRiskQuery }) => {
    const { t } = useLanguage();
    const handleChange = (field: keyof typeof riskQuery, value: string) => setRiskQuery(produce(riskQuery, draft => { draft[field] = value; }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAssessRisk(riskQuery); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-300">{t('insuranceServices.riskAssessor.assetTypeLabel')}</label><input type="text" value={riskQuery.assetType} onChange={e => handleChange('assetType', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.riskAssessor.assetTypePlaceholder')} /></div>
            <div><label className="block text-sm text-gray-300">{t('insuranceServices.riskAssessor.descriptionLabel')}</label><textarea rows={4} value={riskQuery.description} onChange={e => handleChange('description', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.riskAssessor.descriptionPlaceholder')} /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('insuranceServices.riskAssessor.assessing') : t('insuranceServices.riskAssessor.buttonText')}</button>
        </form>
    );
};

const FraudDetectorTool: React.FC<Pick<InsuranceServicesProps, 'onDetectFraud' | 'isLoading' | 'fraudQuery' | 'setFraudQuery'>> = ({ onDetectFraud, isLoading, fraudQuery, setFraudQuery }) => {
    const { t } = useLanguage();
    const handleChange = (field: keyof typeof fraudQuery, value: string) => setFraudQuery(produce(fraudQuery, draft => { draft[field] = value; }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onDetectFraud(fraudQuery); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-300">{t('insuranceServices.fraudDetector.claimDescriptionLabel')}</label><textarea rows={5} value={fraudQuery.claimDescription} onChange={e => handleChange('claimDescription', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.fraudDetector.claimDescriptionPlaceholder')} /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('insuranceServices.fraudDetector.analyzing') : t('insuranceServices.fraudDetector.buttonText')}</button>
        </form>
    );
};

const AutoClaimAssessorTool: React.FC<Pick<InsuranceServicesProps, 'onAutoClaimAssess' | 'isLoading' | 'autoClaimQuery' | 'setAutoClaimQuery' | 'isQuotaExhausted'>> = ({ onAutoClaimAssess, isLoading, autoClaimQuery, setAutoClaimQuery, isQuotaExhausted }) => {
    const { t } = useLanguage();
    const [file, setFile] = useState<File|null>(null);
    const [fileError, setFileError] = useState<string|null>(null);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const onDrop = useCallback((accepted:File[], rejected:any[]) => { if(rejected.length) setFileError(t('contractAnalyzer.unsupportedFileType')); else { setFile(accepted[0]); setFileError(null); }},[t]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/jpeg':[], 'image/png':[]}, maxFiles: 1 });
    const handleCapture = (base64Data: string, mimeType: string) => { /* logic to create file */ };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (file) onAutoClaimAssess({ file: { mimeType: file.type, data: await fileToBase64(file) } }, autoClaimQuery, useThinkingMode);
    };
    const ThinkingModeToggle = () => (
        <div className="flex items-center justify-between mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
          <div>
            <label htmlFor="thinking-mode-toggle-autoclaim" className="font-semibold text-white">
              {t('thinkingMode.label')}
            </label>
            <p className="text-xs text-gray-400">{t('thinkingMode.description')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="thinking-mode-toggle-autoclaim"
              checked={useThinkingMode}
              onChange={(e) => setUseThinkingMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-gold peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
          </label>
        </div>
    );
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-md cursor-pointer ${isDragActive ? 'border-brand-gold' : 'border-brand-blue/70'}`}><input {...getInputProps()} /><p className="text-gray-400 text-sm">{file ? file.name : t('evidenceAnalyzer.dropzoneText')}</p>{fileError && <p className="text-red-400 text-sm">{fileError}</p>}</div><div className="relative my-2 flex items-center"><div className="flex-grow border-t border-brand-blue/50"></div><span className="mx-4 text-xs text-gray-400">OR</span><div className="flex-grow border-t border-brand-blue/50"></div></div><CameraInput onCapture={handleCapture} /></div>
            <textarea rows={2} value={autoClaimQuery} onChange={e => setAutoClaimQuery(e.target.value)} className="w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.autoClaimAssessor.userQueryPlaceholder')} />
            <ThinkingModeToggle />
            <button type="submit" disabled={isLoading || !file} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('insuranceServices.autoClaimAssessor.assessing') : t('insuranceServices.autoClaimAssessor.buttonText')}</button>
        </form>
    );
};

const QuoteSimulatorTool: React.FC<Pick<InsuranceServicesProps, 'onSimulateQuote' | 'isLoading' | 'quoteQuery' | 'setQuoteQuery' | 'isQuotaExhausted'>> = ({ onSimulateQuote, isLoading, quoteQuery, setQuoteQuery, isQuotaExhausted }) => {
    const { t } = useLanguage();
    const handleChange = (field: keyof typeof quoteQuery, value: string) => setQuoteQuery(produce(quoteQuery, draft => { draft[field] = value; }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSimulateQuote(quoteQuery); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.quoteSimulator.carModelLabel')}</label><input type="text" value={quoteQuery.carModel} onChange={e => handleChange('carModel', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.quoteSimulator.carModelPlaceholder')} /></div>
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.quoteSimulator.carYearLabel')}</label><input type="text" value={quoteQuery.carYear} onChange={e => handleChange('carYear', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.quoteSimulator.carYearPlaceholder')} /></div>
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.quoteSimulator.driverAgeLabel')}</label><input type="text" value={quoteQuery.driverAge} onChange={e => handleChange('driverAge', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.quoteSimulator.driverAgePlaceholder')} /></div>
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.quoteSimulator.drivingHistoryLabel')}</label><input type="text" value={quoteQuery.drivingHistory} onChange={e => handleChange('drivingHistory', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.quoteSimulator.drivingHistoryPlaceholder')} /></div>
             </div>
             <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('insuranceServices.quoteSimulator.calculating') : t('insuranceServices.quoteSimulator.buttonText')}</button>
        </form>
    );
};

const LifeNeedsAnalyzerTool: React.FC<Pick<InsuranceServicesProps, 'onAnalyzeLifeNeeds' | 'isLoading' | 'lifeNeedsQuery' | 'setLifeNeedsQuery' | 'isQuotaExhausted'>> = ({ onAnalyzeLifeNeeds, isLoading, lifeNeedsQuery, setLifeNeedsQuery, isQuotaExhausted }) => {
    const { t } = useLanguage();
    const handleChange = (field: keyof typeof lifeNeedsQuery, value: string) => setLifeNeedsQuery(produce(lifeNeedsQuery, draft => { draft[field] = value; }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAnalyzeLifeNeeds(lifeNeedsQuery); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.lifeNeedsAnalyzer.ageLabel')}</label><input type="text" value={lifeNeedsQuery.age} onChange={e => handleChange('age', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" /></div>
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.lifeNeedsAnalyzer.incomeLabel')}</label><input type="text" value={lifeNeedsQuery.income} onChange={e => handleChange('income', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" /></div>
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.lifeNeedsAnalyzer.dependentsLabel')}</label><input type="text" value={lifeNeedsQuery.dependents} onChange={e => handleChange('dependents', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" /></div>
                <div><label className="block text-sm text-gray-300">{t('insuranceServices.lifeNeedsAnalyzer.debtsLabel')}</label><input type="text" value={lifeNeedsQuery.debts} onChange={e => handleChange('debts', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" /></div>
            </div>
            <div><label className="block text-sm text-gray-300">{t('insuranceServices.lifeNeedsAnalyzer.goalsLabel')}</label><textarea rows={3} value={lifeNeedsQuery.goals} onChange={e => handleChange('goals', e.target.value)} className="mt-1 w-full bg-brand-blue/50 border-brand-blue/70 rounded-md py-2 px-3 text-white" placeholder={t('insuranceServices.lifeNeedsAnalyzer.goalsPlaceholder')} /></div>
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-md text-brand-blue bg-brand-gold hover:bg-yellow-200 disabled:bg-brand-gold/50">{isLoading ? t('insuranceServices.lifeNeedsAnalyzer.analyzing') : t('insuranceServices.lifeNeedsAnalyzer.buttonText')}</button>
        </form>
    );
};


// --- MAIN COMPONENT ---

const InsuranceServices: React.FC<InsuranceServicesProps> = (props) => {
    const { t } = useLanguage();
    const [openTool, setOpenTool] = useState<string | null>(null);

    const handleToggle = (toolKey: string) => {
        setOpenTool(prev => (prev === toolKey ? null : toolKey));
    };
    
    const tools = [
        { key: 'policy', title: t('insuranceServices.policyAnalyzer.title'), description: t('insuranceServices.policyAnalyzer.description'), component: <PolicyAnalyzerTool {...props} />, result: props.policyAnalysis },
        { key: 'claim', title: t('insuranceServices.claimDrafter.title'), description: t('insuranceServices.claimDrafter.description'), component: <ClaimDrafterTool {...props} />, result: props.generatedClaim },
        { key: 'recommender', title: t('insuranceServices.recommender.title'), description: t('insuranceServices.recommender.description'), component: <RecommenderTool {...props} />, result: props.recommendationAnswer },
        { key: 'risk', title: t('insuranceServices.riskAssessor.title'), description: t('insuranceServices.riskAssessor.description'), component: <RiskAssessorTool {...props} />, result: props.riskAssessmentResult },
        { key: 'fraud', title: t('insuranceServices.fraudDetector.title'), description: t('insuranceServices.fraudDetector.description'), component: <FraudDetectorTool {...props} />, result: props.fraudDetectionResult },
        { key: 'autoClaim', title: t('insuranceServices.autoClaimAssessor.title'), description: t('insuranceServices.autoClaimAssessor.description'), component: <AutoClaimAssessorTool {...props} />, result: props.autoClaimResult },
        { key: 'quote', title: t('insuranceServices.quoteSimulator.title'), description: t('insuranceServices.quoteSimulator.description'), component: <QuoteSimulatorTool {...props} />, result: props.quoteResult },
        { key: 'lifeNeeds', title: t('insuranceServices.lifeNeedsAnalyzer.title'), description: t('insuranceServices.lifeNeedsAnalyzer.description'), component: <LifeNeedsAnalyzerTool {...props} />, result: props.lifeNeedsResult },
    ];

    return (
        <section id="insurance-services" className="py-12 sm:py-16 animate-fade-in">
            <div className="max-w-4xl mx-auto text-center mb-12">
                <h1 className="text-4xl font-bold text-white">{t('insuranceServices.title')}</h1>
                <p className="mt-4 text-lg text-gray-400">{t('insuranceServices.subtitle')}</p>
            </div>
            
            <div className="space-y-8 max-w-5xl mx-auto">
                {tools.map(tool => (
                    <div key={tool.key}>
                        <CollapsibleTool
                            title={tool.title}
                            description={tool.description}
                            isOpen={openTool === tool.key}
                            onToggle={() => handleToggle(tool.key)}
                        >
                            {tool.component}
                        </CollapsibleTool>
                        {(tool.result || (props.isLoading && openTool === tool.key) || (props.error && openTool === tool.key)) && (
                             <div className="mt-4 bg-brand-blue/30 rounded-lg shadow-lg">
                                <DocumentDisplay 
                                    generatedDocument={tool.result} 
                                    isLoading={props.isLoading && openTool === tool.key} 
                                    error={openTool === tool.key ? props.error : null} 
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default InsuranceServices;
