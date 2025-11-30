
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../types';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const AdminDashboard: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'live'>('overview');

    // --- LIVE DASHBOARD STATE ---
    // Simulating time-series data for the chart
    const [latencyData, setLatencyData] = useState<number[]>(new Array(60).fill(40));
    const [ingestionRate, setIngestionRate] = useState<number>(2400);
    const [liveEvents, setLiveEvents] = useState<{id: number, type: string, msg: string, time: string}[]>([]);
    const [systemHealth, setSystemHealth] = useState({ cpu: 45, memory: 60, activeNodes: 8 });
    const [endpoints, setEndpoints] = useState([
        { method: 'POST', path: '/api/v1/generate', latency: 120, status: 200, count: 1540 },
        { method: 'GET', path: '/api/v1/user/profile', latency: 45, status: 200, count: 3200 },
        { method: 'POST', path: '/api/v1/ingest', latency: 15, status: 202, count: 8500 },
        { method: 'GET', path: '/api/v1/lawyers/search', latency: 310, status: 200, count: 420 },
    ]);

    // Mock Data for Static Overview
    const stats = [
        { label: 'Total Users', value: '1,245', change: '+12%', color: 'text-blue-500' },
        { label: 'Active Cases', value: '86', change: '+5%', color: 'text-green-500' },
        { label: 'Revenue (MTD)', value: '$12.4k', change: '+22%', color: 'text-purple-500' },
        { label: 'Pending Verifications', value: '12', change: '-2%', color: 'text-orange-500' },
    ];

    const activityLog = [
        { id: 1, user: 'Ali R.', action: 'Created new petition draft', time: '5 min ago', status: 'success' },
        { id: 2, user: 'Sara M.', action: 'Searched for Lawyer (Tehran)', time: '12 min ago', status: 'info' },
        { id: 3, user: 'Reza K.', action: 'Payment failed', time: '1 hour ago', status: 'error' },
        { id: 4, user: 'System', action: 'Daily database backup', time: '3 hours ago', status: 'system' },
        { id: 5, user: 'Mahsa V.', action: 'Generated Social Post', time: '4 hours ago', status: 'success' },
    ];

    // --- LIVE SIMULATION EFFECTS ---
    useEffect(() => {
        if (activeTab !== 'live') return;

        const interval = setInterval(() => {
            // Update Latency Chart Data (shift left)
            setLatencyData(prev => {
                const newData = [...prev.slice(1), getRandomInt(30, 180)];
                return newData;
            });

            // Fluctuate Ingestion Rate
            setIngestionRate(prev => {
                const change = getRandomInt(-200, 200);
                const newVal = prev + change;
                return newVal > 0 ? newVal : 0;
            });

            // Update System Health
            setSystemHealth({
                cpu: getRandomInt(30, 70),
                memory: getRandomInt(50, 85),
                activeNodes: 8
            });

            // Update Endpoints stats slightly
            setEndpoints(prev => prev.map(ep => ({
                ...ep,
                latency: Math.max(10, ep.latency + getRandomInt(-20, 20)),
                count: ep.count + getRandomInt(0, 5)
            })).sort((a, b) => b.count - a.count));

            // Add Live Event Log
            const eventTypes = ['INGEST', 'API', 'DB', 'CACHE'];
            const type = eventTypes[getRandomInt(0, 3)];
            let msg = '';
            
            if (type === 'INGEST') msg = `Processed batch #${getRandomInt(10000, 99999)} from Kafka`;
            else if (type === 'API') msg = `${['POST', 'GET'][getRandomInt(0, 1)]} /api/v1/${['generate', 'search', 'auth'][getRandomInt(0, 2)]} - ${getRandomInt(200, 201)} OK`;
            else if (type === 'DB') msg = `RisingWave materialized view update (${getRandomInt(10, 50)}ms)`;
            else msg = `Cache hit for key: sess_${getRandomInt(1000, 9999)}`;

            const newEvent = {
                id: Date.now(),
                type,
                msg,
                time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" })
            };

            setLiveEvents(prev => [newEvent, ...prev].slice(0, 12)); // Keep last 12 events

        }, 1000);

        return () => clearInterval(interval);
    }, [activeTab]);

    // Simple SVG Line Chart for Real-time Data
    const LiveChart = ({ data, color, height = 60 }: { data: number[], color: string, height?: number }) => {
        const width = 100; // percent
        const max = Math.max(...data, 200);
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d / max) * 100);
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className={`w-full h-[${height}px] relative overflow-hidden`} style={{ height: `${height}px` }}>
                <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
                    <polygon fill={`url(#gradient-${color})`} points={`0,100 ${points} 100,100`} vectorEffect="non-scaling-stroke" className="opacity-50" />
                </svg>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-8 animate-fade-in space-y-8">
            {/* Header & Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Platform Operations & Analytics</p>
                </div>
                <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-gold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${activeTab === 'live' ? 'block' : 'hidden'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTab === 'live' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        </span>
                        Live Ops
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                /* --- STATIC DASHBOARD --- */
                <div className="animate-fade-in space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-opacity-10 ${stat.change.startsWith('+') ? 'bg-green-500 text-green-600' : 'bg-red-500 text-red-600'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <div className={`mt-4 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden`}>
                                    <div className={`h-full rounded-full ${stat.color.replace('text-', 'bg-')}`} style={{ width: '70%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Activity Log */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                                <button className="text-indigo-500 text-xs font-bold hover:underline">View All</button>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {activityLog.map((log) => (
                                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'error' ? 'bg-red-500' : log.status === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">by {log.user}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Status Panel */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6">System Status</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">API Gateway</p>
                                            <p className="text-xs text-gray-500">Operational</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-green-500 font-bold">99.9%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
                                            <p className="text-xs text-gray-500">Healthy</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-green-500 font-bold">99.99%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">AI Engine</p>
                                            <p className="text-xs text-gray-500">Idle Load</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-blue-500 font-bold">Latency Normal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- LIVE OPERATIONS DASHBOARD --- */
                <div className="animate-fade-in space-y-6">
                    {/* Top Metrics Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-[#0B0F19] border border-gray-800 p-4 rounded-xl shadow-lg">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Ingestion Rate</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-mono text-green-400 font-bold">{ingestionRate.toLocaleString()}</span>
                                <span className="text-xs text-gray-500">EPS</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full transition-all duration-300" style={{width: `${(ingestionRate/3000)*100}%`}}></div>
                            </div>
                        </div>
                        <div className="bg-[#0B0F19] border border-gray-800 p-4 rounded-xl shadow-lg">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Avg Latency (p95)</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-mono font-bold ${latencyData[latencyData.length-1] > 150 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                    {latencyData[latencyData.length - 1]}
                                </span>
                                <span className="text-xs text-gray-500">ms</span>
                            </div>
                             <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-300 ${latencyData[latencyData.length-1] > 150 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{width: `${(latencyData[latencyData.length-1]/200)*100}%`}}></div>
                            </div>
                        </div>
                        <div className="bg-[#0B0F19] border border-gray-800 p-4 rounded-xl shadow-lg">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Active Nodes</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-mono text-purple-400 font-bold">{systemHealth.activeNodes}</span>
                                <span className="text-xs text-green-500">● Online</span>
                            </div>
                             <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full w-full"></div>
                            </div>
                        </div>
                        <div className="bg-[#0B0F19] border border-gray-800 p-4 rounded-xl shadow-lg">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Error Rate</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-mono text-white font-bold">0.02%</span>
                                <span className="text-xs text-gray-500">Stable</span>
                            </div>
                             <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full" style={{width: '2%'}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Real-time Chart */}
                        <div className="lg:col-span-2 bg-[#0B0F19] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden flex flex-col h-[350px]">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <svg width="150" height="150" viewBox="0 0 100 100"><path d="M10 10 H90 V90 H10 L10 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-500"/></svg>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    Real-time Ingestion Traffic
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-mono rounded border border-blue-900/50">Kafka Topic: events_v1</span>
                                    <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs font-mono rounded border border-green-900/50">RisingWave: Active</span>
                                </div>
                            </div>
                            <div className="flex-grow w-full relative">
                                <LiveChart data={latencyData} color="#3B82F6" height={250} />
                                {/* Grid Lines Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-[10px] text-gray-700 font-mono">
                                    <div className="border-b border-gray-800 w-full">200ms</div>
                                    <div className="border-b border-gray-800 w-full">150ms</div>
                                    <div className="border-b border-gray-800 w-full">100ms</div>
                                    <div className="border-b border-gray-800 w-full">50ms</div>
                                    <div className="w-full">0ms</div>
                                </div>
                            </div>
                        </div>

                        {/* Top Endpoints */}
                        <div className="bg-[#0B0F19] p-0 rounded-xl border border-gray-800 shadow-xl flex flex-col h-[350px] overflow-hidden">
                            <div className="p-4 bg-gray-900/50 border-b border-gray-800">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Top Active Endpoints</h3>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                                <table className="w-full text-left">
                                    <thead className="text-[10px] uppercase text-gray-500 font-mono bg-gray-900/30">
                                        <tr>
                                            <th className="px-3 py-2">Path</th>
                                            <th className="px-3 py-2 text-right">Req/m</th>
                                            <th className="px-3 py-2 text-right">Lat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono text-xs">
                                        {endpoints.map((ep, i) => (
                                            <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ep.method === 'POST' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-blue-900/30 text-blue-500'}`}>{ep.method}</span>
                                                        <span className="text-gray-300 truncate max-w-[120px]" title={ep.path}>{ep.path}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-right text-white">{ep.count.toLocaleString()}</td>
                                                <td className={`px-3 py-3 text-right ${ep.latency > 200 ? 'text-red-400' : ep.latency > 100 ? 'text-yellow-400' : 'text-green-400'}`}>{ep.latency}ms</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Logs & Data Sources */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Live Log */}
                        <div className="lg:col-span-2 bg-[#0B0F19] rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col h-[300px]">
                            <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Streaming Logs
                                </h3>
                                <span className="flex items-center gap-1.5 text-[10px] text-green-500 bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    LIVE
                                </span>
                            </div>
                            <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] space-y-1 custom-scrollbar bg-[#05070A]">
                                {liveEvents.map((event) => (
                                    <div key={event.id} className="flex gap-3 hover:bg-gray-800/50 p-0.5 rounded transition-colors group">
                                        <span className="text-gray-600 w-16 shrink-0">{event.time}</span>
                                        <span className={`w-12 shrink-0 font-bold ${
                                            event.type === 'ERROR' ? 'text-red-500' : 
                                            event.type === 'INGEST' ? 'text-purple-400' : 
                                            event.type === 'DB' ? 'text-blue-400' :
                                            'text-green-400'
                                        }`}>[{event.type}]</span>
                                        <span className="text-gray-400 group-hover:text-white transition-colors">{event.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Data Sources / Health */}
                        <div className="bg-[#0B0F19] rounded-xl border border-gray-800 shadow-xl p-6 flex flex-col h-[300px]">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-6">Data Sources Health</h3>
                            <div className="space-y-6 flex-grow">
                                {/* Kafka */}
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-purple-500/50 transition-colors">
                                            <span className="text-xs font-bold text-purple-400">KFK</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Apache Kafka</p>
                                            <p className="text-xs text-gray-500">Cluster: prod-asia-1</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="text-xs text-green-500 font-bold">Healthy</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Lag: 4ms</p>
                                    </div>
                                </div>

                                {/* RisingWave */}
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-blue-500/50 transition-colors">
                                            <span className="text-xs font-bold text-blue-400">RW</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">RisingWave DB</p>
                                            <p className="text-xs text-gray-500">Streaming SQL</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <span className="text-xs text-green-500 font-bold">Connected</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Sink: Grafana</p>
                                    </div>
                                </div>

                                {/* Grafana/Visual */}
                                <div className="mt-auto pt-4 border-t border-gray-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">System Load</span>
                                        <span className="text-xs text-white font-mono">{systemHealth.cpu}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-brand-gold h-full transition-all duration-500" style={{width: `${systemHealth.cpu}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
