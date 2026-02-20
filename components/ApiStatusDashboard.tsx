import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface AIProvider {
  id: number;
  name: string;
  label: string;
  enabled: boolean;
  priority: number;
  model: string;
  keyConfigured: boolean;
  apiKeyEnv_var: string;
  usage: {
    requestsToday: number;
    tokensToday: number;
    errorsToday: number;
  };
}

const ApiStatusDashboard: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-brand-blue/20 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Status Monitor</h1>
        <button 
          onClick={fetchProviders} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm ${!provider.enabled ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{provider.label}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${provider.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {provider.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Key Status:</span>
                {provider.keyConfigured ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <XCircle className="w-4 h-4" /> Missing
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Requests</span>
                  <span className="font-bold text-gray-900 dark:text-white">{provider.usage.requestsToday}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Tokens</span>
                  <span className="font-bold text-gray-900 dark:text-white">{provider.usage.tokensToday}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Errors</span>
                  <span className="font-bold text-red-600">{provider.usage.errorsToday}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg flex items-start gap-3">
        <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <h3 className="font-bold text-yellow-800 dark:text-yellow-400 text-sm">Missing API Keys?</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-500/80">
            Please provide any missing keys in the Secrets tab to enable all AI capabilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiStatusDashboard;
