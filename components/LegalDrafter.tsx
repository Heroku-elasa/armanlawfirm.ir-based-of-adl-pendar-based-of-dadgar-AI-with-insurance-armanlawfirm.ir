import React from 'react';
import GeneratorForm from './GeneratorForm';
import DocumentDisplay from './ReportDisplay';
import { useLanguage } from '../types';

interface LegalDrafterProps {
  onGenerate: (topic: string, description: string, docType: string) => void;
  isLoading: boolean;
  isComplete: boolean;
  topic: string;
  description: string;
  docType: string;
  setTopic: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setDocType: React.Dispatch<React.SetStateAction<string>>;
  generatedDocument: string;
  error: string | null;
  isQuotaExhausted: boolean;
}

const LegalDrafter: React.FC<LegalDrafterProps> = ({
  onGenerate,
  isLoading,
  isComplete,
  topic,
  description,
  docType,
  setTopic,
  setDescription,
  setDocType,
  generatedDocument,
  error,
  isQuotaExhausted
}) => {
  const { t } = useLanguage();

  return (
    <section id="legal-drafter" className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-1 lg:sticky top-28">
          <GeneratorForm
            onGenerate={onGenerate}
            isLoading={isLoading}
            isComplete={isComplete}
            topic={topic}
            description={description}
            docType={docType}
            setTopic={setTopic}
            setDescription={setDescription}
            setDocType={setDocType}
            isQuotaExhausted={isQuotaExhausted}
          />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-brand-blue/30 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 dark:border-brand-blue/50 transition-colors duration-300">
          <DocumentDisplay
            generatedDocument={generatedDocument}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </section>
  );
};

export default LegalDrafter;