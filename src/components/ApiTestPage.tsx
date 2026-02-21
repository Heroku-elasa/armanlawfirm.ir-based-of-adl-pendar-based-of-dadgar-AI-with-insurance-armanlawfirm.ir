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
  usageInfo?: string;
  dashboardUrl: string;
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
    model: 'flux.2', 
    models: ['flux.2', 'nano-banana-pro', 'seedream-4.5', 'kling-3.0', 'sora-2'],
    endpoint: 'api.poyo.ai',
    keyConfigured: true,
    status: 'idle',
    dashboardUrl: 'https://poyo.ai/dashboard',
    limits: { requestsPerMinute: 20, requestsPerDay: 100 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    enabled: true,
    priority: 2,
    model: 'deepseek/deepseek-r1-0528:free', 
    models: [
      'deepseek/deepseek-r1-0528:free',
      'upstage/solar-pro-3:free',
      'arcee-ai/trinity-large-preview:free',
      'stepfun/step-3.5-flash:free',
      'z-ai/glm-4.5-air:free'
    ],
    endpoint: 'openrouter.ai',
    keyConfigured: true,
    status: 'idle',
    dashboardUrl: 'https://openrouter.ai/keys',
    limits: { requestsPerMinute: 20, requestsPerDay: 50 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'portkey',
    name: 'Portkey',
    enabled: true, 
    priority: 3,
    model: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'claude-3-haiku-20240307', 'gemini-1.5-flash'],
    endpoint: 'api.portkey.ai',
    keyConfigured: true, 
    status: 'idle',
    dashboardUrl: 'https://app.portkey.ai/dashboard',
    limits: { requestsPerMinute: 60, requestsPerDay: 1000 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  }
];

const ApiTestPage: React.FC = () => {
  const { language, t } = useLanguage();
  const isRtl = language === 'fa';
  
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
  const [selectedModel, setSelectedModel] = useState<{[key: string]: string}>({});
  
  const [apiKeys, setApiKeys] = useState({
    portkey: 'nJqZtrgTuBQzAF5DM77t64UCIgZT', 
    poyo1: 'sk-G8djO1CepO_vfl0u5CDGDdD6dXC5zG67rX07RDUZadqQQ5zI627VTifWq5CsJm',
    poyo2: 'sk-NdIelDiC8dgJXP-uSy-4_03BQnGaCX1xdtVYZXFa9Z1b4FqXF3oProuUg9huz_',
    openrouter1: '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'
  });

  useEffect(() => {
    const savedKeys = localStorage.getItem('arman-api-keys');
    if (savedKeys) {
      try {
        setApiKeys(prev => ({...prev, ...JSON.parse(savedKeys)}));
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

  const updateProviderStatus = (id: string, status: AIProvider['status'], error?: string, latency?: number, usageInfo?: string) => {
    setProviders(prev => prev.map(p => 
      p.id === id 
        ? { ...p, status, lastError: error, lastLatency: latency, usageInfo }
        : p
    ));
  };

  const checkOpenRouterUsage = async (key: string) => {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const data = await resp.json();
      if (data.data) {
        const d = data.data;
        return `Credits: ${d.limit_remaining || 'N/A'}, Usage: ${d.usage_daily || 0}, IsFree: ${d.is_free_tier}`;
      }
    } catch (e) {
      return "Usage check failed";
    }
    return "";
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
      let usageInfo = '';

      if (id === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        apiKey = apiKeys.openrouter1;
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Arman Law Firm';
        body = {
          model: model,
          messages: [{ role: 'user', content: "Say 'Test OK'" }],
          max_tokens: 20
        };
        usageInfo = await checkOpenRouterUsage(apiKey);
      } else if (id === 'poyo') {
        url = 'https://api.poyo.ai/api/generate/submit';
        apiKey = apiKeys.poyo1;
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model: model,
          input: { prompt: "a simple test: red circle on white background" },
          callback_url: "https://example.com/webhook"
        };
      } else if (id === 'portkey') {
        url = 'https://api.portkey.ai/v1/chat/completions';
        headers['x-portkey-api-key'] = apiKeys.portkey;
        headers['x-portkey-provider'] = 'openai';
        body = {
          model: model,
          messages: [{ role: 'user', content: "Say 'Test OK'" }],
          max_tokens: 20
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json() as any;
      const duration = Date.now() - start;

      if (res.ok) {
        let responseText = "";
        if (id === 'poyo') {
          responseText = data.data?.task_id ? `Task ID: ${data.data.task_id}` : JSON.stringify(data);
        } else {
          responseText = data.choices?.[0]?.message?.content || JSON.stringify(data);
        }
        
        setTestResult({ 
          provider: id, 
          success: true, 
          duration, 
          response: responseText,
          model 
        });
        updateProviderStatus(id, 'success', undefined, duration, usageInfo);
        addLog(id, model, 'success', duration, undefined, responseText);
      } else {
        const errorMsg = data.error?.message || data.error?.code || res.statusText || 'Unknown error';
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const duration = Date.now() - start;
      
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

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold dark:text-white mb-2">🧪 API Test Dashboard</h1>
            <p className="text-gray-500">Monitor and test your verified AI provider keys.</p>
          </div>
          <button onClick={testAllProviders} disabled={loading} className="btn-brand">
            {loading ? 'Testing All...' : 'Run Full Audit'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                📡 Active Providers
              </h2>
              <div className="space-y-4">
                {providers.map(p => (
                  <div key={p.id} className="p-4 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold dark:text-white">{p.name}</h3>
                        <p className="text-xs text-gray-500">{p.endpoint}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         {getStatusBadge(p.status)}
                         <button onClick={() => testProvider(p.id)} className="text-xs text-brand-blue font-bold">Test</button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs">
                       <select 
                         value={selectedModel[p.id] || p.model}
                         onChange={(e) => setSelectedModel(prev => ({...prev, [p.id]: e.target.value}))}
                         className="bg-transparent border dark:border-gray-700 rounded p-1"
                       >
                         {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                       {p.usageInfo && <span className="text-brand-blue">{p.usageInfo}</span>}
                       {p.lastLatency && <span className="text-gray-400">{p.lastLatency}ms</span>}
                    </div>

                    {(p.id === 'poyo' || p.id === 'portkey') && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 text-[10px] rounded border border-yellow-100 flex justify-between items-center">
                        <span>⚠️ Usage cannot be checked via API. Visit dashboard:</span>
                        <a href={p.dashboardUrl} target="_blank" className="font-bold underline">Open Dashboard</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {testResult && (
              <div className={`p-6 rounded-2xl border ${testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <h3 className="font-bold mb-2">{testResult.success ? '✅ Success' : '❌ Failed'}</h3>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-white/50 p-3 rounded-lg">{testResult.response || testResult.error}</pre>
              </div>
            )}
          </div>

          <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <h2 className="font-bold mb-4">🔑 Key Management</h2>
                <div className="space-y-4">
                  {Object.entries(apiKeys).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">{key}</label>
                      <input 
                        type="password" 
                        value={val} 
                        onChange={(e) => setApiKeys(prev => ({...prev, [key]: e.target.value}))}
                        className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  ))}
                  <button onClick={saveApiKeys} className="w-full bg-brand-blue text-white py-2 rounded-xl text-sm font-bold">Save Keys</button>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <h2 className="font-bold mb-4">📝 Session Logs</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {logs.map(l => (
                    <div key={l.id} className="text-[10px] p-2 border-b dark:border-gray-700 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold uppercase">{l.provider}</span>
                        <span className="text-gray-400">{l.model}</span>
                      </div>
                      <span className={l.status === 'success' ? 'text-green-600' : 'text-red-600'}>{l.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;
