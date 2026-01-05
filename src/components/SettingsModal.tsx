
import React, { useState, useEffect } from 'react';
import { useAppearance, THEME_PRESETS, ColorScheme, useLanguage } from '../types';
import { FastCache } from '../services/cacheService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onToggleRole?: () => void;
    currentRole?: 'user' | 'admin';
    onOpenWPDashboard?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onToggleRole, currentRole, onOpenWPDashboard }) => {
    const { t } = useLanguage();
    const { 
        theme, toggleTheme,
        colorScheme, setColorScheme, 
        customLogo, setCustomLogo,
        fastCacheEnabled, setFastCacheEnabled
    } = useAppearance();

    const [inputLogo, setInputLogo] = useState(customLogo);
    const [inputColor, setInputColor] = useState(colorScheme.primary);

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

    const applyThemeTemplate = (template: 'default' | 'official' | 'registry') => {
        let schemeId = '';
        
        if (template === 'registry') {
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
                        <div className="grid grid-cols-3 gap-3">
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
