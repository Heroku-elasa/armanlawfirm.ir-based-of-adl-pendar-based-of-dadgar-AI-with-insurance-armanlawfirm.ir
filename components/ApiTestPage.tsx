import React, { useState } from 'react';
import { useLanguage } from '../types';

interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  model: string;
  models: string[];
  endpoint: string;
  keyConfigured: boolean;
  status: 'idle' | 'testing' | 'success' | 'error';
  lastError?: string;
  lastLatency?: number;
}

interface AILog {
  id: number;
  timestamp: string;
  provider: string;
  model: string;
  status: 'success' | 'error';
  duration: number;
  error?: string;
  response?: string;
}

const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter (Free Tier Working)',
    enabled: true,
    priority: 1,
    model: 'deepseek/deepseek-r1-0528:free',
    models: [
      'deepseek/deepseek-r1-0528:free',
      'upstage/solar-pro-3:free',
      'arcee-ai/trinity-large-preview:free',
      'stepfun/step-3.5-flash:free',
      'z-ai/glm-4.5-air:free',
      'meta-llama/llama-3.3-70b-instruct:free'
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    keyConfigured: true,
    status: 'idle',
    lastError: '',
    lastLatency: 0
  },
  {
    id: 'portkey',
    name: 'Portkey (Gateway)',
    enabled: true,
    priority: 2,
    model: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku'],
    endpoint: 'https://api.portkey.ai/v1/chat/completions',
    keyConfigured: true,
    status: 'idle',
    lastError: '',
    lastLatency: 0
  },
  {
    id: 'poyo',
    name: 'Poyo AI (Image/Video Only)',
    enabled: false,
    priority: 3,
    model: 'kling-1.5',
    models: ['kling-1.5', 'flux.2', 'seedream-4.5'],
    endpoint: 'https://api.poyo.ai/api/generate/submit',
    keyConfigured: true,
    status: 'idle',
    lastError: 'Poyo does not support chat completions',
    lastLatency: 0
  }
];

const ApiTestPage: React.FC = () => {
  const { language } = useLanguage();
  const isRtl = language === 'fa';
  const [activeTab, setActiveTab] = useState<'providers' | 'logs'>('providers');
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [testPrompt, setTestPrompt] = useState(isRtl ? 'یک جمله کوتاه بگو.' : 'Say a short sentence.');
  const [loading, setLoading] = useState(false);

  const addLog = (log: AILog) => setLogs(prev => [log, ...prev].slice(0, 50));

  const testProvider = async (provider: AIProvider) => {
    const id = provider.id;
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status: 'testing' } : p));
    
    try {
      const response = await fetch('/api/ai/health-check', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const healthData = await response.json() as any[];
      const match = healthData.find((h: any) => h.provider.toLowerCase().includes(id));
      
      if (match && match.status === 'online') {
        setProviders(prev => prev.map(p => p.id === id ? { 
          ...p, 
          status: 'success', 
          lastLatency: match.latency 
        } : p));
        addLog({ 
          id: Date.now(), 
          timestamp: new Date().toISOString(), 
          provider: id, 
          model: provider.model, 
          status: 'success', 
          duration: match.latency || 0,
          response: 'API is reachable and working.'
        });
      } else {
        throw new Error(match?.error || 'Provider offline or error');
      }
    } catch (err: any) {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status: 'error', lastError: err.message } : p));
      addLog({ 
        id: Date.now(), 
        timestamp: new Date().toISOString(), 
        provider: id, 
        model: provider.model, 
        status: 'error', 
        duration: 0, 
        error: err.message 
      });
    }
  };

  const testAll = async () => {
    setLoading(true);
    for (const p of providers.filter(p => p.enabled)) {
      await testProvider(p);
    }
    setLoading(false);
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto ${isRtl ? 'rtl' : 'ltr'} bg-white dark:bg-brand-blue min-h-screen text-gray-900 dark:text-white`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-gold">🧪 AI API Tester</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'providers' ? 'bg-brand-gold text-brand-blue' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            {isRtl ? 'سرویس‌دهنده‌ها' : 'Providers'}
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'logs' ? 'bg-brand-gold text-brand-blue' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            {isRtl ? 'گزارش‌ها' : 'Logs'}
          </button>
        </div>
      </div>

      {activeTab === 'providers' && (
        <>
          <div className="bg-white dark:bg-brand-blue/40 p-6 rounded-xl border border-brand-gold/20 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-grow w-full">
                <label className="block text-sm font-bold text-gray-500 mb-2">{isRtl ? 'متن تست' : 'Test Prompt'}</label>
                <input
                  type="text"
                  value={testPrompt}
                  onChange={e => setTestPrompt(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={testAll}
                disabled={loading}
                className="bg-brand-gold text-brand-blue px-8 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 h-[42px]"
              >
                {loading ? (isRtl ? 'در حال تست...' : 'Testing...') : (isRtl ? 'تست همه' : 'Test All')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {providers.map(p => (
              <div key={p.id} className="bg-white dark:bg-brand-blue/40 border border-brand-gold/20 rounded-xl p-5 shadow-md hover:shadow-brand-gold/5 transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">{p.name}</h2>
                    <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-60 truncate max-w-[150px]">{p.endpoint}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    p.status === 'success' ? 'bg-green-100 text-green-800' : 
                    p.status === 'error' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{isRtl ? 'مدل پیش‌فرض' : 'Default Model'}:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{p.model}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{isRtl ? 'تأخیر' : 'Latency'}:</span>
                    <span className="text-gray-900 dark:text-white">{p.lastLatency ? `${p.lastLatency}ms` : '-'}</span>
                  </div>
                </div>

                {p.lastError && (
                  <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded text-[10px] text-red-600 dark:text-red-400 mb-4 break-words font-mono">
                    {p.lastError}
                  </div>
                )}

                <button
                  onClick={() => testProvider(p)}
                  disabled={p.status === 'testing'}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {p.status === 'testing' ? (isRtl ? 'در حال اجرا...' : 'Running...') : (isRtl ? 'اجرای تست' : 'Run Test')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-brand-blue/40 rounded-xl border border-brand-gold/20 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-brand-gold/10 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-bold text-gray-900 dark:text-white">{isRtl ? 'گزارش‌های اخیر' : 'Recent Logs'}</h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {logs.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <strong className="text-gray-900 dark:text-white uppercase">{log.provider}</strong>
                        <span className="text-xs text-gray-500 font-mono">({log.model})</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                    </div>
                    <div className="flex gap-4 text-xs mb-2">
                      <span className="text-gray-500">{isRtl ? 'مدت زمان' : 'Duration'}: <span className="text-gray-900 dark:text-white font-mono">{log.duration}ms</span></span>
                    </div>
                    {log.response && (
                      <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs text-gray-700 dark:text-gray-300 font-mono italic">
                        "{log.response}"
                      </div>
                    )}
                    {log.error && (
                      <div className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-900/10 p-2 rounded">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 italic">
                {isRtl ? 'هنوز گزارشی ثبت نشده است.' : 'No logs recorded yet.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestPage;
