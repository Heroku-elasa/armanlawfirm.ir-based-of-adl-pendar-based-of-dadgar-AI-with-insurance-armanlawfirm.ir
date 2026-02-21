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
    id: 'poyo',
    name: 'Poyo AI',
    enabled: true,
    priority: 1,
    model: 'gpt-4o-mini', 
    models: ['gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash', 'flux.2', 'nano-banana-pro', 'seedream-4.5', 'kling-3.0', 'sora-2'],
    endpoint: 'api.poyo.ai',
    status: 'idle',
    dashboardUrl: 'https://poyo.ai/dashboard',
    limits: { requestsPerMinute: 20, requestsPerDay: 100 }
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
    status: 'idle',
    dashboardUrl: 'https://openrouter.ai/keys',
    limits: { requestsPerMinute: 20, requestsPerDay: 50 }
  },
  {
    id: 'portkey',
    name: 'Portkey',
    enabled: true, 
    priority: 3,
    model: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'claude-3-haiku-20240307', 'gemini-1.5-flash'],
    endpoint: 'api.portkey.ai',
    status: 'idle',
    dashboardUrl: 'https://app.portkey.ai/dashboard',
    limits: { requestsPerMinute: 60, requestsPerDay: 1000 }
  }
];

const ApiTestPage: React.FC = () => {
  const { language } = useLanguage();
  const isRtl = language === 'fa';
  
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_PROVIDERS);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
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

  const addLog = (provider: string, model: string, status: 'success' | 'error', duration: number, error?: string, response?: string) => {
    setLogs(prev => [{ id: Date.now(), timestamp: new Date().toISOString(), provider, model, status, duration, error, response }, ...prev].slice(0, 100));
  };

  const updateProviderStatus = (id: string, status: AIProvider['status'], error?: string, latency?: number, usageInfo?: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status, lastError: error, lastLatency: latency, usageInfo } : p));
  };

  const checkOpenRouterUsage = async (key: string) => {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/key", { headers: { "Authorization": `Bearer ${key}` } });
      const data = await resp.json();
      if (data.data) {
        const d = data.data;
        return `Credits: ${d.limit_remaining || 'N/A'}, Usage: ${d.usage_daily || 0}, IsFree: ${d.is_free_tier}`;
      }
    } catch (e) { return "Usage check failed"; }
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
      let url = '', headers: any = { 'Content-Type': 'application/json' }, body: any = {}, apiKey = '', usageInfo = '';

      if (id === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        apiKey = apiKeys.openrouter1;
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Arman Law Firm';
        body = { model, messages: [{ role: 'user', content: "Say 'Test OK'" }], max_tokens: 20 };
        usageInfo = await checkOpenRouterUsage(apiKey);
      } else if (id === 'poyo') {
        // Checking if it's an image/video model based on suffix
        const isGenModel = ['flux.2', 'nano-banana-pro', 'seedream-4.5', 'kling-3.0', 'sora-2'].includes(model);
        if (isGenModel) {
          url = 'https://api.poyo.ai/api/generate/submit';
          apiKey = apiKeys.poyo1;
          headers['Authorization'] = `Bearer ${apiKey}`;
          body = {
            model: model,
            input: { prompt: "a simple test: red circle on white background" },
            callback_url: "https://example.com/webhook"
          };
        } else {
          url = 'https://api.poyo.ai/v1/chat/completions';
          apiKey = apiKeys.poyo1;
          headers['Authorization'] = `Bearer ${apiKey}`;
          body = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: "Say 'Test OK'" }], max_tokens: 20 };
        }
      } else if (id === 'portkey') {
        url = 'https://api.portkey.ai/v1/chat/completions';
        headers['x-portkey-api-key'] = apiKeys.portkey;
        headers['x-portkey-provider'] = 'openai';
        body = { model, messages: [{ role: 'user', content: "Say 'Test OK'" }], max_tokens: 20 };
      }

      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      const duration = Date.now() - start;

      if (res.ok) {
        let responseText = "";
        if (id === 'poyo' && data.data?.task_id) {
          responseText = `Generation Task Started! ID: ${data.data.task_id}`;
        } else {
          responseText = data.choices?.[0]?.message?.content || JSON.stringify(data);
        }
        setTestResult({ provider: id, success: true, duration, response: responseText, model });
        updateProviderStatus(id, 'success', undefined, duration, usageInfo);
        addLog(id, model, 'success', duration, undefined, responseText);
      } else { throw new Error(data.error?.message || res.statusText); }
    } catch (error: any) {
      const duration = Date.now() - start;
      if (retryWithBackup && id === 'poyo' && apiKeys.poyo2) {
        setApiKeys(prev => ({ ...prev, poyo1: apiKeys.poyo2, poyo2: apiKeys.poyo1 }));
        return testProvider(id, false);
      }
      setTestResult({ provider: id, success: false, error: error.message, model });
      updateProviderStatus(id, 'error', error.message, duration);
      addLog(id, model, 'error', duration, error.message);
    } finally { setTestingProvider(null); }
  };

  const testAllProviders = async () => {
    setLoading(true);
    for (const p of providers) { await testProvider(p.id); await new Promise(r => setTimeout(r, 500)); }
    setLoading(false);
  };

  const saveApiKeys = () => {
    localStorage.setItem('arman-api-keys', JSON.stringify(apiKeys));
    alert('✅ کلیدها با موفقیت ذخیره شدند. (Keys saved successfully)');
    window.location.reload(); 
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🧪 {isRtl ? 'سامانه مانیتورینگ هوشمند API' : 'AI API Test Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              {isRtl ? 'وضعیت سلامت سرویس‌های هوش مصنوعی و کلیدهای فعال را مدیریت کنید.' : 'Monitor AI service health and manage active API keys.'}
            </p>
          </div>
          <button 
            onClick={testAllProviders} 
            disabled={loading} 
            className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue/90 transition-all shadow-lg transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (isRtl ? 'در حال بررسی...' : 'Auditing...') : (isRtl ? 'بررسی جامع سلامت' : 'Run Full Audit')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2 dark:text-white border-b pb-4 dark:border-gray-700">
                📡 {isRtl ? 'سرویس‌های هوش مصنوعی متصل' : 'Active Providers'}
              </h2>
              <div className="space-y-4">
                {providers.map(p => (
                  <div key={p.id} className="p-5 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                          p.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 
                          p.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {p.id === 'openrouter' ? '🌐' : p.id === 'poyo' ? '⚡' : '🔑'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">{p.name}</h3>
                          <p className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{p.endpoint}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-wider ${
                          p.status === 'success' ? 'bg-green-500 text-white' : 
                          p.status === 'error' ? 'bg-red-500 text-white' : 
                          p.status === 'testing' ? 'bg-yellow-400 text-black animate-pulse' :
                          'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                        <button 
                          onClick={() => testProvider(p.id)} 
                          disabled={testingProvider === p.id}
                          className="text-xs text-brand-blue font-black hover:bg-brand-blue/10 px-3 py-1 rounded-lg transition-colors"
                        >
                          {isRtl ? 'تست مجدد' : 'Retry Test'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs">
                       <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border dark:border-gray-700">
                         <span className="text-gray-400 font-bold">{isRtl ? 'مدل:' : 'Model:'}</span>
                         <select 
                           value={selectedModel[p.id] || p.model}
                           onChange={(e) => setSelectedModel(prev => ({...prev, [p.id]: e.target.value}))}
                           className="bg-transparent border-none p-0 dark:text-white outline-none font-bold"
                         >
                           {p.models.map(m => <option key={m} value={m} className="dark:bg-gray-800">{m}</option>)}
                         </select>
                       </div>
                       {p.usageInfo && <span className="bg-blue-50 dark:bg-blue-900/20 text-brand-blue px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 font-bold">{p.usageInfo}</span>}
                       {p.lastLatency && <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg border dark:border-gray-700 font-mono">{p.lastLatency}ms</span>}
                    </div>

                    {(p.id === 'poyo' || p.id === 'portkey') && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-[11px] rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>⚠️</span>
                          <span>{isRtl ? 'گزارش مصرف مستقیم در API پشتیبانی نمی‌شود. برای جزئیات مصرف:' : 'Usage monitoring is only available via the provider dashboard.'}</span>
                        </div>
                        <a href={p.dashboardUrl} target="_blank" rel="noreferrer" className="bg-yellow-500 text-white px-3 py-1 rounded-lg font-black hover:bg-yellow-600 transition-colors">
                          {isRtl ? 'مشاهده مصرف' : 'View Usage'}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {testResult && (
              <div className={`p-6 rounded-3xl border-2 shadow-sm ${testResult.success ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  {testResult.success ? '✅ پاسخ موفقیت‌آمیز سرویس' : '❌ خطای پاسخ‌دهی'}
                  <span className="text-xs font-normal opacity-60">({testResult.provider} - {testResult.model})</span>
                </h3>
                <div className="relative">
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-white/80 dark:bg-black/40 p-4 rounded-2xl border border-current border-opacity-10 max-h-60 overflow-y-auto leading-relaxed">
                    {testResult.response || testResult.error}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-bold text-xl mb-6 dark:text-white border-b pb-4 dark:border-gray-700 flex items-center gap-2">
                🔑 {isRtl ? 'مدیریت کلیدهای امنیتی' : 'Key Management'}
              </h2>
              <div className="space-y-5">
                {Object.entries(apiKeys).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-[10px] text-gray-400 uppercase font-black mb-1.5 block tracking-widest">{key}</label>
                    <input 
                      type="password" 
                      value={val} 
                      onChange={(e) => setApiKeys(prev => ({...prev, [key]: e.target.value}))}
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder-gray-400"
                      placeholder={`Enter ${key}...`}
                    />
                  </div>
                ))}
                <button 
                  onClick={saveApiKeys} 
                  className="w-full bg-brand-blue text-white py-4 rounded-2xl text-sm font-black hover:bg-brand-blue/90 transition-all shadow-lg active:scale-95 mt-2"
                >
                  {isRtl ? 'ذخیره و اعمال تغییرات' : 'Save & Hot-Reload'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-bold text-xl mb-6 dark:text-white border-b pb-4 dark:border-gray-700">
                📝 {isRtl ? 'تاریخچه تست‌های نشست' : 'Session Logs'}
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs italic font-medium">
                    {isRtl ? 'هنوز داده‌ای ثبت نشده است.' : 'No diagnostic data recorded yet.'}
                  </div>
                ) : (
                  logs.map(l => (
                    <div key={l.id} className="p-3 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-xl transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black uppercase text-[10px] dark:text-white tracking-wider">{l.provider}</span>
                        <span className="text-[9px] text-gray-400 font-mono">{l.model}</span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-0.5">
                        <span className={`text-[9px] font-black tracking-tighter ${l.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>{l.status.toUpperCase()}</span>
                        <span className="text-[8px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">{l.duration}ms</span>
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
