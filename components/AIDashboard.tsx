import React, { useState, useEffect } from 'react';
import { useLanguage } from '../types';

interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  model: string;
  endpoint: string;
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
  functionName: string;
  status: 'success' | 'error' | 'fallback';
  duration: number;
  tokens: number;
  error?: string;
}

const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: true,
    priority: 1,
    model: 'gemini-2.5-flash',
    endpoint: 'googleapis.com',
    limits: { requestsPerMinute: 15, requestsPerDay: 1500 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    enabled: true,
    priority: 2,
    model: 'google/gemini-2.0-flash-001',
    endpoint: 'openrouter.ai',
    limits: { requestsPerMinute: 20, requestsPerDay: 50 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    enabled: true,
    priority: 3,
    model: '@cf/meta/llama-3.2-3b-instruct',
    endpoint: 'cloudflare.com',
    limits: { requestsPerMinute: 50, requestsPerDay: 130 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  },
  {
    id: 'openai',
    name: 'OpenAI',
    enabled: false,
    priority: 4,
    model: 'gpt-4o-mini',
    endpoint: 'api.openai.com',
    limits: { requestsPerMinute: 60, requestsPerDay: 10000 },
    usage: { requestsToday: 0, tokensToday: 0, errorsToday: 0 }
  }
];

const AIDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isRtl = language === 'fa';
  
  const [activeTab, setActiveTab] = useState<'providers' | 'usage' | 'logs' | 'debug' | 'settings'>('providers');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{provider: string; success: boolean; duration?: number; error?: string} | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [healthCheckRunning, setHealthCheckRunning] = useState(false);
  const [healthResults, setHealthResults] = useState<{id: string; status: string; latency?: number; error?: string}[]>([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [testPromptResult, setTestPromptResult] = useState<{success: boolean; response?: string; duration?: number; error?: string} | null>(null);
  const [testingPrompt, setTestingPrompt] = useState(false);
  
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    openrouter: '',
    cloudflare_account: '',
    cloudflare_token: '',
    openai: ''
  });

  useEffect(() => {
    fetchProviders();
    fetchLogs();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/ai/providers');
      if (res.ok) {
        const data = await res.json() as AIProvider[];
        setProviders(data.length > 0 ? data : DEFAULT_PROVIDERS);
      } else {
        setProviders(DEFAULT_PROVIDERS);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders(DEFAULT_PROVIDERS);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/ai/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const toggleProvider = async (id: string) => {
    const updatedProviders = providers.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setProviders(updatedProviders);
    
    try {
      await fetch(`/api/ai/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !providers.find(p => p.id === id)?.enabled })
      });
    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  };

  const testProvider = async (id: string) => {
    setTestingProvider(id);
    setTestResult(null);
    
    try {
      const res = await fetch(`/api/ai/providers/${id}/test`, { method: 'POST' });
      const data = await res.json() as { success: boolean; duration?: number; error?: string };
      setTestResult({ provider: id, success: data.success, duration: data.duration, error: data.error });
    } catch (error: any) {
      setTestResult({ provider: id, success: false, error: error.message });
    } finally {
      setTestingProvider(null);
    }
  };

  const runHealthCheck = async () => {
    setHealthCheckRunning(true);
    setHealthResults([]);
    
    try {
      const res = await fetch('/api/ai/health-check', { method: 'POST' });
      const data = await res.json();
      setHealthResults(data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setHealthCheckRunning(false);
    }
  };

  const testPromptHandler = async () => {
    if (!testPrompt.trim()) return;
    
    setTestingPrompt(true);
    setTestPromptResult(null);
    
    try {
      const res = await fetch('/api/ai/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt })
      });
      const data = await res.json();
      setTestPromptResult(data);
    } catch (error: any) {
      setTestPromptResult({ success: false, error: error.message });
    } finally {
      setTestingPrompt(false);
    }
  };

  const saveApiKeys = async () => {
    try {
      await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKeys)
      });
      alert(isRtl ? 'تنظیمات ذخیره شد' : 'Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const clearLogs = async () => {
    if (!confirm(isRtl ? 'آیا از پاک کردن لاگ‌ها مطمئن هستید؟' : 'Are you sure you want to clear logs?')) return;
    
    try {
      await fetch('/api/ai/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const moveProvider = (id: string, direction: 'up' | 'down') => {
    const index = providers.findIndex(p => p.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === providers.length - 1)) return;
    
    const newProviders = [...providers];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newProviders[index], newProviders[swapIndex]] = [newProviders[swapIndex], newProviders[index]];
    newProviders.forEach((p, i) => p.priority = i + 1);
    setProviders(newProviders);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const tabs = [
    { id: 'providers', label: isRtl ? 'ارائه‌دهندگان' : 'Providers' },
    { id: 'usage', label: isRtl ? 'مصرف و محدودیت‌ها' : 'Usage & Limits' },
    { id: 'logs', label: isRtl ? 'گزارشات' : 'Logs' },
    { id: 'debug', label: isRtl ? 'اشکال‌زدایی' : 'Debug' },
    { id: 'settings', label: isRtl ? 'تنظیمات' : 'Settings' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isRtl ? 'داشبورد هوش مصنوعی' : 'AI Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRtl ? 'مدیریت و نظارت بر API های هوش مصنوعی' : 'Manage and monitor AI API providers'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'providers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isRtl ? 'ارائه‌دهندگان API' : 'API Providers'}
                  </h2>
                  <button
                    onClick={runHealthCheck}
                    disabled={healthCheckRunning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {healthCheckRunning ? (isRtl ? 'در حال بررسی...' : 'Checking...') : (isRtl ? 'بررسی سلامت' : 'Health Check')}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {providers.map((provider, index) => {
                    const usagePercent = getUsagePercentage(provider.usage.requestsToday, provider.limits.requestsPerDay);
                    const healthResult = healthResults.find(h => h.id === provider.id);
                    
                    return (
                      <div
                        key={provider.id}
                        className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border-2 transition-all ${
                          provider.enabled ? 'border-green-500' : 'border-gray-300 dark:border-gray-600 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{provider.model}</p>
                          </div>
                          <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                            #{provider.priority}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{provider.usage.requestsToday} / {provider.limits.requestsPerDay}</span>
                            <span>{Math.round(usagePercent)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getStatusColor(usagePercent)}`}
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {healthResult && (
                          <div className={`text-xs mb-3 p-2 rounded ${
                            healthResult.status === 'ok' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {healthResult.status === 'ok' 
                              ? `✓ ${healthResult.latency}ms`
                              : `✗ ${healthResult.error}`
                            }
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={provider.enabled}
                              onChange={() => toggleProvider(provider.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>

                          <div className="flex gap-1">
                            <button
                              onClick={() => moveProvider(provider.id, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              title={isRtl ? 'بالا' : 'Up'}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveProvider(provider.id, 'down')}
                              disabled={index === providers.length - 1}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                              title={isRtl ? 'پایین' : 'Down'}
                            >
                              ▼
                            </button>
                          </div>

                          <button
                            onClick={() => testProvider(provider.id)}
                            disabled={testingProvider === provider.id}
                            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                          >
                            {testingProvider === provider.id ? '...' : (isRtl ? 'تست' : 'Test')}
                          </button>
                        </div>

                        {testResult?.provider === provider.id && (
                          <div className={`mt-3 text-xs p-2 rounded ${
                            testResult.success 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {testResult.success 
                              ? `✓ ${isRtl ? 'موفق' : 'Success'} (${testResult.duration}ms)`
                              : `✗ ${testResult.error}`
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {isRtl ? 'مصرف و محدودیت‌ها' : 'Usage & Limits'}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                        <th className="pb-3 font-medium">{isRtl ? 'ارائه‌دهنده' : 'Provider'}</th>
                        <th className="pb-3 font-medium">{isRtl ? 'درخواست امروز' : 'Requests Today'}</th>
                        <th className="pb-3 font-medium">{isRtl ? 'محدودیت روزانه' : 'Daily Limit'}</th>
                        <th className="pb-3 font-medium">{isRtl ? 'توکن مصرفی' : 'Tokens Used'}</th>
                        <th className="pb-3 font-medium">{isRtl ? 'خطاها' : 'Errors'}</th>
                        <th className="pb-3 font-medium">{isRtl ? 'وضعیت' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map(provider => {
                        const usagePercent = getUsagePercentage(provider.usage.requestsToday, provider.limits.requestsPerDay);
                        return (
                          <tr key={provider.id} className="border-b dark:border-gray-700">
                            <td className="py-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{provider.name}</div>
                                <div className="text-xs text-gray-500">{provider.model}</div>
                              </div>
                            </td>
                            <td className="py-4 text-gray-700 dark:text-gray-300">{provider.usage.requestsToday.toLocaleString()}</td>
                            <td className="py-4 text-gray-700 dark:text-gray-300">{provider.limits.requestsPerDay.toLocaleString()}</td>
                            <td className="py-4 text-gray-700 dark:text-gray-300">{provider.usage.tokensToday.toLocaleString()}</td>
                            <td className="py-4">
                              <span className={provider.usage.errorsToday > 0 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                                {provider.usage.errorsToday}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getStatusColor(usagePercent)}`}
                                    style={{ width: `${usagePercent}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{Math.round(usagePercent)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isRtl ? 'گزارشات AI' : 'AI Logs'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchLogs}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {isRtl ? 'بروزرسانی' : 'Refresh'}
                    </button>
                    <button
                      onClick={clearLogs}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      {isRtl ? 'پاک کردن' : 'Clear'}
                    </button>
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {isRtl ? 'هیچ گزارشی یافت نشد' : 'No logs found'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                          <th className="pb-3 font-medium">{isRtl ? 'زمان' : 'Time'}</th>
                          <th className="pb-3 font-medium">{isRtl ? 'ارائه‌دهنده' : 'Provider'}</th>
                          <th className="pb-3 font-medium">{isRtl ? 'تابع' : 'Function'}</th>
                          <th className="pb-3 font-medium">{isRtl ? 'وضعیت' : 'Status'}</th>
                          <th className="pb-3 font-medium">{isRtl ? 'زمان پاسخ' : 'Duration'}</th>
                          <th className="pb-3 font-medium">{isRtl ? 'خطا' : 'Error'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(0, 50).map(log => (
                          <tr key={log.id} className="border-b dark:border-gray-700">
                            <td className="py-3 text-gray-600 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="py-3 text-gray-700 dark:text-gray-300">{log.provider}</td>
                            <td className="py-3 text-gray-700 dark:text-gray-300">{log.functionName}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                log.status === 'fallback' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-600 dark:text-gray-400">{log.duration}ms</td>
                            <td className="py-3 text-red-500 text-xs">{log.error || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'debug' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {isRtl ? 'ابزار اشکال‌زدایی' : 'Debug Tools'}
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {isRtl ? 'بررسی سلامت سیستم' : 'System Health Check'}
                    </h3>
                    <button
                      onClick={runHealthCheck}
                      disabled={healthCheckRunning}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4"
                    >
                      {healthCheckRunning ? (isRtl ? 'در حال بررسی...' : 'Running...') : (isRtl ? 'اجرای بررسی سلامت' : 'Run Health Check')}
                    </button>

                    {healthResults.length > 0 && (
                      <div className="space-y-2">
                        {healthResults.map(result => (
                          <div
                            key={result.id}
                            className={`p-3 rounded-lg ${
                              result.status === 'ok'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            <span className="font-medium">{result.id}:</span>{' '}
                            {result.status === 'ok' 
                              ? `✓ OK (${result.latency}ms)`
                              : `✗ ${result.error}`
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {isRtl ? 'تست پرامپت' : 'Test Prompt'}
                    </h3>
                    <textarea
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder={isRtl ? 'پرامپت تست را وارد کنید...' : 'Enter test prompt...'}
                      className="w-full p-3 border dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      rows={4}
                    />
                    <button
                      onClick={testPromptHandler}
                      disabled={testingPrompt || !testPrompt.trim()}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {testingPrompt ? (isRtl ? 'در حال اجرا...' : 'Running...') : (isRtl ? 'اجرای تست' : 'Run Test')}
                    </button>

                    {testPromptResult && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        testPromptResult.success
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {testPromptResult.success ? (
                          <>
                            <div className="text-green-700 dark:text-green-400 font-medium mb-2">
                              ✓ {isRtl ? 'موفق' : 'Success'} ({testPromptResult.duration}ms)
                            </div>
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-48">
                              {testPromptResult.response}
                            </pre>
                          </>
                        ) : (
                          <div className="text-red-700 dark:text-red-400">
                            ✗ {testPromptResult.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {isRtl ? 'تنظیمات API' : 'API Settings'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                      placeholder="AIza..."
                      className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OpenRouter API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.openrouter}
                      onChange={(e) => setApiKeys({ ...apiKeys, openrouter: e.target.value })}
                      placeholder="sk-or-..."
                      className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cloudflare Account ID
                    </label>
                    <input
                      type="text"
                      value={apiKeys.cloudflare_account}
                      onChange={(e) => setApiKeys({ ...apiKeys, cloudflare_account: e.target.value })}
                      placeholder="abc123..."
                      className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cloudflare API Token
                    </label>
                    <input
                      type="password"
                      value={apiKeys.cloudflare_token}
                      onChange={(e) => setApiKeys({ ...apiKeys, cloudflare_token: e.target.value })}
                      placeholder="..."
                      className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                      placeholder="sk-..."
                      className="w-full p-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={saveApiKeys}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {isRtl ? 'ذخیره تنظیمات' : 'Save Settings'}
                  </button>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    {isRtl 
                      ? '⚠️ کلیدهای API در متغیرهای محیطی سرور ذخیره می‌شوند. برای امنیت بیشتر، کلیدها را مستقیماً در تنظیمات سرور وارد کنید.'
                      : '⚠️ API keys are stored as server environment variables. For better security, enter keys directly in server settings.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
