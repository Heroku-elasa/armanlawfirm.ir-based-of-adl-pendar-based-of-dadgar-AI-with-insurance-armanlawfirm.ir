
import React, { useState, useEffect } from 'react';
import { useAppearance, THEME_PRESETS, ColorScheme, useLanguage } from '../types';
import { FastCache } from '../services/cacheService';

interface ApiHealthStatus {
    provider: string;
    status: 'online' | 'offline' | 'error';
    latency?: number;
    error?: string;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onToggleRole?: () => void;
    currentRole?: 'user' | 'admin';
    onOpenWPDashboard?: () => void;
    setPage: (page: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onToggleRole, currentRole, onOpenWPDashboard, setPage }) => {
    const { t } = useLanguage();
    const { 
        theme, toggleTheme,
        colorScheme, setColorScheme, 
        customLogo, setCustomLogo,
        fastCacheEnabled, setFastCacheEnabled
    } = useAppearance();

    const [inputLogo, setInputLogo] = useState(customLogo);
    const [inputColor, setInputColor] = useState(colorScheme.primary);
    const [apiHealth, setApiHealth] = useState<ApiHealthStatus[]>([]);
    const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

    const refreshHealth = async () => {
        setIsRefreshingHealth(true);
        try {
            const response = await fetch('/api/ai/health-check', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                setApiHealth(data);
            }
        } catch (err) {
            console.error("Health check failed", err);
        } finally {
            setIsRefreshingHealth(false);
        }
    };

    useEffect(() => {
        if (isOpen) refreshHealth();
    }, [isOpen]);

    useEffect(() => {
        setInputLogo(customLogo);
        setInputColor(colorScheme.primary);
    }, [customLogo, colorScheme, isOpen]);

    const handleColorSelect = (preset: ColorScheme) => {
        setColorScheme(preset);
        setInputColor(preset.primary);
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setInputColor(color);
        
        // Create a custom scheme based on this color
        setColorScheme({
            id: 'custom',
            name: 'Custom',
            primary: color,
            secondary: colorScheme.secondary // Keep current secondary or default to dark
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputLogo(e.target.value);
    };

    const handleSaveLogo = () => {
        setCustomLogo(inputLogo);
    };

    const handleToggleCache = () => {
        const newState = !fastCacheEnabled;
        setFastCacheEnabled(newState);
        FastCache.setEnabled(newState);
    };

    const handleClearCache = () => {
        FastCache.clear();
        alert("Cache cleared successfully.");
    };

    const applyThemeTemplate = (template: 'default' | 'official' | 'registry' | 'ailawyer') => {
        let schemeId = '';
        
        if (template === 'ailawyer') {
            schemeId = 'ailawyer';
            if (theme === 'light') toggleTheme();
        } else if (template === 'registry') {
            schemeId = 'registry';
            if (theme === 'dark') toggleTheme();
        } else if (template === 'official') {
            schemeId = 'official';
            if (theme === 'dark') toggleTheme();
        } else {
            schemeId = 'legal';
            if (theme === 'light') toggleTheme();
        }

        const scheme = THEME_PRESETS.find(p => p.id === schemeId);
        if (scheme) {
            setColorScheme(scheme);
            setInputColor(scheme.primary);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-brand-blue rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden border border-brand-gold/30" onClick={e => e.stopPropagation()}>
                <div className="bg-brand-blue/50 p-4 border-b border-brand-gold/20 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">تنظیمات سایت (Site Settings)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                    
                    {/* Theme Templates (New Section) */}
                    <section>
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-4">Theme Templates</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => applyThemeTemplate('ailawyer')}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group hover:border-brand-gold transition-colors"
                            >
                                <div className="h-14 bg-[#1c1c1c] flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full border-2 border-[#ad2ffb] bg-[#1c1c1c]" style={{boxShadow: '0 0 8px #ad2ffb'}}></div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-center">
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">AI Lawyer</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => applyThemeTemplate('default')}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group hover:border-brand-gold transition-colors"
                            >
                                <div className="h-14 bg-[#111827] flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full border-2 border-[#bef264] bg-[#111827]"></div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-center">
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">Modern Dark</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => applyThemeTemplate('official')}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group hover:border-brand-gold transition-colors"
                            >
                                <div className="h-14 bg-gray-100 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full border-2 border-[#0891b2] bg-white"></div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-center">
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">Official (SSAA)</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => applyThemeTemplate('registry')}
                                className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden group hover:border-brand-gold transition-colors"
                            >
                                <div className="h-14 bg-gray-50 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full border-2 border-[#00897b] bg-white"></div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-800 text-center">
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block leading-tight">Registry (Sabt)</span>
                                </div>
                            </button>
                        </div>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Role & Dashboard Management */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-2">View Modes</h3>
                        
                        {onToggleRole && currentRole && (
                            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">Current Mode: {currentRole === 'admin' ? 'Admin' : 'User'}</p>
                                    <p className="text-xs text-gray-500">Switch between User and Admin dashboard layouts.</p>
                                </div>
                                <button 
                                    onClick={onToggleRole}
                                    className={`px-3 py-1.5 rounded text-xs font-bold text-white transition-colors ${currentRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    Switch Role
                                </button>
                            </div>
                        )}

                        {onOpenWPDashboard && (
                            <button 
                                onClick={onOpenWPDashboard}
                                className="w-full flex items-center justify-between bg-[#2271b1] hover:bg-[#135e96] text-white p-3 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="dashicons-wordpress w-6 h-6 flex items-center justify-center bg-white text-[#2271b1] rounded-full p-0.5 font-bold font-serif">W</span>
                                    <div className="text-left">
                                        <p className="text-sm font-bold">Open CMS Dashboard</p>
                                        <p className="text-xs opacity-80">WordPress-style Admin Panel</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </section>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Color Theme Section */}
                    <section>
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-4">Color Palette</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {THEME_PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleColorSelect(preset)}
                                    className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all ${colorScheme.id === preset.id ? 'border-brand-gold bg-brand-gold/10' : 'border-transparent bg-gray-100 dark:bg-gray-800 hover:border-gray-500'}`}
                                >
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{preset.name}</span>
                                    <div className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: preset.primary }}></div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Custom Hex:</label>
                            <div className="flex items-center gap-2 flex-grow">
                                <input 
                                    type="color" 
                                    value={inputColor}
                                    onChange={handleCustomColorChange}
                                    className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={inputColor}
                                    onChange={handleCustomColorChange}
                                    className="flex-grow bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-800 dark:text-white font-mono"
                                />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Logo Section */}
                    <section>
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-4">Customize Logo</h3>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={inputLogo}
                                    onChange={handleLogoChange}
                                    placeholder="https://example.com/logo.png"
                                    className="flex-grow bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-800 dark:text-white"
                                />
                                <button onClick={handleSaveLogo} className="bg-brand-gold text-brand-blue font-bold px-3 py-2 rounded text-sm hover:bg-yellow-300">Set</button>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                <span className="text-xs text-gray-500">Preview:</span>
                                <img src={inputLogo} alt="Preview" className="w-8 h-8 object-contain rounded-full border border-gray-300" />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* API Status Section */}
                    <section>
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-4">API Keys Status</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 mb-2">PORTKEY API</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">Key 1:</span>
                                        <span className="text-green-500 font-mono">gASN...JG+</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">Key 2:</span>
                                        <span className="text-green-500 font-mono">nJqZ...IgzT</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 mb-2">POYO API</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">Key 1:</span>
                                        <span className="text-green-500 font-mono">sk-G8...Jm</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">Key 2:</span>
                                        <span className="text-green-500 font-mono">sk-Nd...uz_</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 mb-2">OPENROUTER API</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">Key 1:</span>
                                        <span className="text-green-500 font-mono">sk-or...76f</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-400">Key 2:</span>
                                        <span className="text-green-500 font-mono">sk-or...88c</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* AI Infrastructure Health */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider">AI Infrastructure</h3>
                            <button 
                                onClick={refreshHealth} 
                                disabled={isRefreshingHealth}
                                className="text-[10px] bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold px-2 py-1 rounded border border-brand-gold/30 transition-colors disabled:opacity-50"
                            >
                                {isRefreshingHealth ? 'Refreshing...' : 'Refresh Status'}
                            </button>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-200 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                                    <tr>
                                        <th className="px-3 py-2">Provider</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">Latency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {apiHealth.length > 0 ? apiHealth.map(h => (
                                        <tr key={h.provider} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200 uppercase">{h.provider}</td>
                                            <td className="px-3 py-2">
                                                <span className={`flex items-center gap-1.5 ${h.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                                                    {h.status === 'online' ? 'Online' : 'Offline'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-500 font-mono">{h.latency ? `${h.latency}ms` : '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-4 text-center text-gray-500 italic">No health data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button 
                          onClick={() => { setPage('apitest'); onClose(); }}
                          className="w-full mt-3 text-[10px] text-brand-gold hover:underline text-center"
                        >
                          Open Advanced API Tester 🧪
                        </button>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Fast Cache Section */}
                    <section>
                        <h3 className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-4">Fast Cache Module (GitHub)</h3>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="block text-sm font-medium text-gray-800 dark:text-white">Enable Fast Cache</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Cache API responses for instant loading.</span>
                            </div>
                            <button 
                                onClick={handleToggleCache}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fastCacheEnabled ? 'bg-brand-gold' : 'bg-gray-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fastCacheEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <button 
                            onClick={handleClearCache}
                            className="w-full border border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs font-bold py-2 rounded transition-colors"
                        >
                            Clear Cache Storage
                        </button>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
