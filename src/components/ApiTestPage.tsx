import React, { useState, useEffect } from 'react';
import { useLanguage } from '../types';

interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  model: string;
  models: string[]; 
  endpoint: string;
  keyConfigured?: boolean;
  status: 'idle' | 'testing' | 'success' | 'error';
  lastError?: string;
  lastLatency?: number;
  limits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  usage: {
    requestsToday: number;
    tokensToday: number;
    errorsToday: number;
  };
}

interface AILog {
  id: number;
  timestamp: string;
  provider: string;
  model: string;
  status: 'success' | 'error' | 'fallback';
  duration: number;
  tokens: number;
  error?: string;
  response?: string;
}

const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: 'poyo',
    name: 'Poyo AI',
    enabled: true,
    priority: 1,
    model: 'gpt-4o-mini', 
    models: ['gpt-4o-mini', 'gpt-4o', 'claude-3-sonnet', 'gemini-pro'],
    endpoint: 'api.poyo.ai',
    keyConfigured: true,
    status: 'idle',
    limits: { requestsPerMinute: 20, requestsPerDay: 100 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    enabled: true,
    priority: 2,
    model: 'google/gemini-2.0-flash-exp:free', 
    models: [
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-pro:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ],
    endpoint: 'openrouter.ai',
    keyConfigured: true,
    status: 'idle',
    limits: { requestsPerMinute: 20, requestsPerDay: 50 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'portkey',
    name: 'Portkey',
    enabled: true, 
    priority: 3,
    model: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    endpoint: 'api.portkey.ai',
    keyConfigured: true, 
    status: 'idle',
    limits: { requestsPerMinute: 60, requestsPerDay: 1000 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  }
];

const ApiTestPage: React.FC = () => {
  const { language, t } = useLanguage();
  const isRtl = language === 'fa';
  
  const [activeTab, setActiveTab] = useState<'providers' | 'usage' | 'logs' | 'settings'>('providers');
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    provider: string;
    success: boolean;
    duration?: number;
    response?: string;
    error?: string;
    model?: string;
  } | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('سلام، یک جمله کوتاه درباره قانون بگو.');
  const [selectedModel, setSelectedModel] = useState<{[key: string]: string}>({});
  
  const [apiKeys, setApiKeys] = useState({
    portkey: 'gASN7iokVzgqJLweJTWr12V75JG+', 
    poyo1: 'sk-G8djO1CepO_vfl0u5CDGDdD6dXC5zG67rX07RDUZadqQQ5zI627VTifWq5CsJm',
    poyo2: 'sk-NdIelDiC8dgJXP-uSy-4_03BQnGaCX1xdtVYZXFa9Z1b4FqXF3oProuUg9huz_',
    openrouter1: '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',
    openrouter2: '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'
  });

  useEffect(() => {
    const savedKeys = localStorage.getItem('arman-api-keys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Error loading saved keys:', e);
      }
    }
  }, []);

  const addLog = (
    provider: string, 
    model: string,
    status: 'success' | 'error', 
    duration: number, 
    error?: string,
    response?: string
  ) => {
    const newLog: AILog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      provider,
      model,
      status: status === 'success' ? 'success' : 'error',
      duration,
      tokens: 0,
      error,
      response
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); 
  };

  const updateProviderStatus = (id: string, status: AIProvider['status'], error?: string, latency?: number) => {
    setProviders(prev => prev.map(p => 
      p.id === id 
        ? { ...p, status, lastError: error, lastLatency: latency }
        : p
    ));
  };

  const testProvider = async (id: string, retryWithBackup = true) => {
    setTestingProvider(id);
    setTestResult(null);
    updateProviderStatus(id, 'testing');
    
    const start = Date.now();
    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    const model = selectedModel[id] || provider.model;
    
    try {
      let url = '';
      let headers: any = { 'Content-Type': 'application/json' };
      let body: any = {};
      let apiKey = '';

      if (id === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        apiKey = apiKeys.openrouter1;
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Arman Law Firm';
        body = {
          model: model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 150
        };
      } else if (id === 'poyo') {
        url = 'https://api.poyo.ai/v1/chat/completions';
        apiKey = apiKeys.poyo1;
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model: model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 150
        };
      } else if (id === 'portkey') {
        if (!apiKeys.portkey) {
          throw new Error('کلید Portkey تنظیم نشده است');
        }
        url = 'https://api.portkey.ai/v1/chat/completions';
        headers['x-portkey-api-key'] = apiKeys.portkey;
        headers['x-portkey-provider'] = 'openai';
        body = {
          model: model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 150
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json() as any;
      const duration = Date.now() - start;

      if (res.ok && data.choices?.[0]?.message?.content) {
        const responseText = data.choices[0].message.content;
        setTestResult({ 
          provider: id, 
          success: true, 
          duration, 
          response: responseText,
          model 
        });
        updateProviderStatus(id, 'success', undefined, duration);
        addLog(id, model, 'success', duration, undefined, responseText);
      } else {
        const errorMsg = data.error?.message || data.error?.code || res.statusText || 'Unknown error';
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const duration = Date.now() - start;
      
      if (retryWithBackup && id === 'openrouter' && apiKeys.openrouter2) {
        const tempKey = apiKeys.openrouter1;
        setApiKeys(prev => ({ ...prev, openrouter1: apiKeys.openrouter2, openrouter2: tempKey }));
        await testProvider(id, false);
        return;
      }
      
      if (retryWithBackup && id === 'poyo' && apiKeys.poyo2) {
        const tempKey = apiKeys.poyo1;
        setApiKeys(prev => ({ ...prev, poyo1: apiKeys.poyo2, poyo2: tempKey }));
        await testProvider(id, false);
        return;
      }

      setTestResult({ provider: id, success: false, error: error.message, model });
      updateProviderStatus(id, 'error', error.message, duration);
      addLog(id, model, 'error', duration, error.message);
    } finally {
      setTestingProvider(null);
    }
  };

  const testAllProviders = async () => {
    setLoading(true);
    for (const provider of providers.filter(p => p.enabled)) {
      await testProvider(provider.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setLoading(false);
  };

  const saveApiKeys = () => {
    localStorage.setItem('arman-api-keys', JSON.stringify(apiKeys));
    alert(isRtl ? '✅ کلیدها ذخیره شدند' : '✅ Keys saved');
  };

  const getStatusBadge = (status: AIProvider['status']) => {
    switch (status) {
      case 'testing':
        return <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-1 rounded font-bold animate-pulse">⏳ {isRtl ? 'تست...' : 'Testing...'}</span>;
      case 'success':
        return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded font-bold">✅ {isRtl ? 'فعال' : 'Active'}</span>;
      case 'error':
        return <span className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded font-bold">❌ {isRtl ? 'خطا' : 'Error'}</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-1 rounded font-bold">⚪ {isRtl ? 'آماده' : 'Ready'}</span>;
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    errors: logs.filter(l => l.status === 'error').length,
    avgLatency: logs.filter(l => l.status === 'success').length > 0
      ? Math.round(logs.filter(l => l.status === 'success').reduce((acc, curr) => acc + curr.duration, 0) / logs.filter(l => l.status === 'success').length)
      : 0
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🧪 {isRtl ? 'تست API های هوش مصنوعی' : 'AI API Testing'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isRtl ? 'تست و مانیتورینگ کلیدهای API ارائه شده' : 'Test and monitor the provided API keys'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.success}</div>
                <div className="text-xs text-green-600 dark:text-green-500">{isRtl ? 'موفق' : 'Success'}</div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.errors}</div>
                <div className="text-xs text-red-600 dark:text-red-500">{isRtl ? 'خطا' : 'Errors'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-bold text-lg dark:text-white">{isRtl ? 'ارائه‌دهندگان' : 'Providers'}</h2>
                <button 
                  onClick={testAllProviders}
                  disabled={loading}
                  className="bg-brand-blue text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  {loading ? (isRtl ? 'در حال تست...' : 'Testing...') : (isRtl ? 'تست همه' : 'Test All')}
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {providers.map(provider => (
                  <div key={provider.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                          {provider.id === 'openrouter' ? '🌐' : provider.id === 'poyo' ? '⚡' : '🔑'}
                        </div>
                        <div>
                          <h3 className="font-bold dark:text-white">{provider.name}</h3>
                          <p className="text-xs text-gray-500">{provider.endpoint}</p>
                        </div>
                      </div>
                      {getStatusBadge(provider.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      <select 
                        value={selectedModel[provider.id] || provider.model}
                        onChange={(e) => setSelectedModel(prev => ({...prev, [provider.id]: e.target.value}))}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm dark:text-white"
                      >
                        {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <button 
                        onClick={() => testProvider(provider.id)}
                        disabled={testingProvider === provider.id}
                        className="text-brand-blue text-sm font-bold hover:underline"
                      >
                        {isRtl ? 'تست تکی' : 'Test Individual'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {testResult && (
              <div className={`p-6 rounded-2xl border ${testResult.success ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                <h3 className={`font-bold mb-2 ${testResult.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                  {testResult.success ? (isRtl ? 'نتیجه تست موفق' : 'Test Success') : (isRtl ? 'خطا در تست' : 'Test Failed')}
                </h3>
                <div className="text-sm space-y-2">
                  <p><span className="opacity-60">{isRtl ? 'ارائه‌دهنده:' : 'Provider:'}</span> {testResult.provider}</p>
                  <p><span className="opacity-60">{isRtl ? 'مدل:' : 'Model:'}</span> {testResult.model}</p>
                  {testResult.success ? (
                    <>
                      <p><span className="opacity-60">{isRtl ? 'زمان پاسخ:' : 'Latency:'}</span> {testResult.duration}ms</p>
                      <div className="mt-3 p-4 bg-white/50 dark:bg-black/20 rounded-xl font-mono text-xs whitespace-pre-wrap">
                        {testResult.response}
                      </div>
                    </>
                  ) : (
                    <p className="text-red-600 dark:text-red-400">{testResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-bold text-lg mb-4 dark:text-white">{isRtl ? 'تنظیمات کلیدها' : 'API Keys'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Portkey Key</label>
                  <input 
                    type="password"
                    value={apiKeys.portkey}
                    onChange={(e) => setApiKeys(prev => ({...prev, portkey: e.target.value}))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">PoYo Key 1</label>
                  <input 
                    type="password"
                    value={apiKeys.poyo1}
                    onChange={(e) => setApiKeys(prev => ({...prev, poyo1: e.target.value}))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">OpenRouter Key 1</label>
                  <input 
                    type="password"
                    value={apiKeys.openrouter1}
                    onChange={(e) => setApiKeys(prev => ({...prev, openrouter1: e.target.value}))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm dark:text-white"
                  />
                </div>
                <button 
                  onClick={saveApiKeys}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white py-2 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {isRtl ? 'ذخیره کلیدها' : 'Save Keys'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-lg dark:text-white">{isRtl ? 'گزارشات اخیر' : 'Recent Logs'}</h2>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {isRtl ? 'هیچ گزارشی ثبت نشده است' : 'No logs yet'}
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-4 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold dark:text-white">{log.provider}</span>
                        <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {log.status === 'success' ? 'SUCCESS' : 'ERROR'}
                        </span>
                      </div>
                      <div className="text-gray-500 flex justify-between">
                        <span>{log.model}</span>
                        <span>{log.duration}ms</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
