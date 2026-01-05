
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../types';

interface Order {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceType: string;
    description: string;
    status: string;
    priority: string;
    amount: string;
    createdAt: string;
}

interface Post {
    id: number;
    title: string;
    status: string;
    category: string;
    createdAt: string;
}

interface AdminStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalFiles: number;
    recentOrders: Order[];
    recentPosts: Post[];
}

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const AdminDashboard: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'live'>('overview');
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [orderFormData, setOrderFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        serviceType: 'consultation',
        description: '',
        priority: 'normal',
        amount: '',
    });
    const [submitting, setSubmitting] = useState(false);

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

    const fetchAdminStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setAdminStats(data);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderFormData,
                    status: 'pending',
                }),
            });
            if (res.ok) {
                setShowOrderForm(false);
                setOrderFormData({
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    serviceType: 'consultation',
                    description: '',
                    priority: 'normal',
                    amount: '',
                });
                fetchAdminStats();
            }
        } catch (error) {
            console.error('Error creating order:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateOrderStatus = async (orderId: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchAdminStats();
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    useEffect(() => {
        if (activeTab !== 'live') return;

        const interval = setInterval(() => {
            setLatencyData(prev => {
                const newData = [...prev.slice(1), getRandomInt(30, 180)];
                return newData;
            });

            setIngestionRate(prev => {
                const change = getRandomInt(-200, 200);
                const newVal = prev + change;
                return newVal > 0 ? newVal : 0;
            });

            setSystemHealth({
                cpu: getRandomInt(30, 70),
                memory: getRandomInt(50, 85),
                activeNodes: 8
            });

            setEndpoints(prev => prev.map(ep => ({
                ...ep,
                latency: Math.max(10, ep.latency + getRandomInt(-20, 20)),
                count: ep.count + getRandomInt(0, 5)
            })).sort((a, b) => b.count - a.count));

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

            setLiveEvents(prev => [newEvent, ...prev].slice(0, 12));

        }, 1000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const LiveChart = ({ data, color, height = 60 }: { data: number[], color: string, height?: number }) => {
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="min-h-screen py-8 animate-fade-in space-y-8">
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
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        Orders
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

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : activeTab === 'overview' ? (
                <div className="animate-fade-in space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Orders</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats?.totalOrders || 0}</h3>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-600">Orders</span>
                            </div>
                            <div className="mt-4 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: '70%' }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Orders</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats?.pendingOrders || 0}</h3>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">Pending</span>
                            </div>
                            <div className="mt-4 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div className="h-full rounded-full bg-yellow-500" style={{ width: `${adminStats?.totalOrders ? (adminStats.pendingOrders / adminStats.totalOrders) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Posts</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats?.totalPosts || 0}</h3>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-600">Posts</span>
                            </div>
                            <div className="mt-4 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div className="h-full rounded-full bg-purple-500" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Files</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminStats?.totalFiles || 0}</h3>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">Files</span>
                            </div>
                            <div className="mt-4 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div className="h-full rounded-full bg-green-500" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                                <button 
                                    onClick={() => setActiveTab('orders')}
                                    className="text-indigo-500 text-xs font-bold hover:underline"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {adminStats?.recentOrders && adminStats.recentOrders.length > 0 ? (
                                    adminStats.recentOrders.map((order) => (
                                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-green-500' : order.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.serviceType}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <p>No orders yet</p>
                                        <button
                                            onClick={() => { setActiveTab('orders'); setShowOrderForm(true); }}
                                            className="mt-2 text-indigo-500 hover:underline text-sm"
                                        >
                                            Create your first order
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">Recent Posts</h3>
                                <span className="text-xs text-gray-500">{adminStats?.publishedPosts || 0} published</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {adminStats?.recentPosts && adminStats.recentPosts.length > 0 ? (
                                    adminStats.recentPosts.map((post) => (
                                        <div key={post.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.category || 'Uncategorized'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {post.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <p>No posts yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6">System Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">File Storage</p>
                                        <p className="text-xs text-gray-500">{adminStats?.totalFiles || 0} files</p>
                                    </div>
                                </div>
                                <span className="text-xs text-green-500 font-bold">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'orders' ? (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orders Management</h2>
                        <button
                            onClick={() => setShowOrderForm(!showOrderForm)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Order
                        </button>
                    </div>

                    {showOrderForm && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Create New Order</h3>
                            <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={orderFormData.customerName}
                                        onChange={(e) => setOrderFormData({...orderFormData, customerName: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter customer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={orderFormData.customerEmail}
                                        onChange={(e) => setOrderFormData({...orderFormData, customerEmail: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="customer@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={orderFormData.customerPhone}
                                        onChange={(e) => setOrderFormData({...orderFormData, customerPhone: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="+1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Type</label>
                                    <select
                                        value={orderFormData.serviceType}
                                        onChange={(e) => setOrderFormData({...orderFormData, serviceType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="consultation">Consultation</option>
                                        <option value="legal_advice">Legal Advice</option>
                                        <option value="document_review">Document Review</option>
                                        <option value="representation">Representation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                    <select
                                        value={orderFormData.priority}
                                        onChange={(e) => setOrderFormData({...orderFormData, priority: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                    <input
                                        type="text"
                                        value={orderFormData.amount}
                                        onChange={(e) => setOrderFormData({...orderFormData, amount: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="$0.00"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={orderFormData.description}
                                        onChange={(e) => setOrderFormData({...orderFormData, description: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Describe the order details..."
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowOrderForm(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Creating...' : 'Create Order'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {adminStats?.recentOrders && adminStats.recentOrders.length > 0 ? (
                                        adminStats.recentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                                                        <p className="text-xs text-gray-500">{order.customerEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{order.serviceType}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                        order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        order.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                <p>No orders yet</p>
                                                <button
                                                    onClick={() => setShowOrderForm(true)}
                                                    className="mt-2 text-indigo-500 hover:underline text-sm"
                                                >
                                                    Create your first order
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
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
                                <span className="text-xs text-green-500">Online</span>
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
                        <div className="lg:col-span-2 bg-[#0B0F19] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden flex flex-col h-[350px]">
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
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-[10px] text-gray-700 font-mono">
                                    <div className="border-b border-gray-800 w-full">200ms</div>
                                    <div className="border-b border-gray-800 w-full">150ms</div>
                                    <div className="border-b border-gray-800 w-full">100ms</div>
                                    <div className="border-b border-gray-800 w-full">50ms</div>
                                    <div className="w-full">0ms</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0B0F19] p-0 rounded-xl border border-gray-800 shadow-xl flex flex-col h-[350px] overflow-hidden">
                            <div className="p-4 bg-gray-900/50 border-b border-gray-800">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Top Active Endpoints</h3>
                            </div>
                            <div className="flex-grow overflow-y-auto p-2">
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

                    <div className="bg-[#0B0F19] rounded-xl border border-gray-800 shadow-xl overflow-hidden h-[300px]">
                        <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Live Event Stream
                            </h3>
                            <span className="text-xs text-gray-500 font-mono">{liveEvents.length} events</span>
                        </div>
                        <div className="overflow-y-auto h-[calc(300px-56px)] p-2 font-mono text-xs">
                            {liveEvents.map((event) => (
                                <div key={event.id} className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 border-b border-gray-800/30">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        event.type === 'INGEST' ? 'bg-green-900/30 text-green-400' :
                                        event.type === 'API' ? 'bg-blue-900/30 text-blue-400' :
                                        event.type === 'DB' ? 'bg-purple-900/30 text-purple-400' :
                                        'bg-gray-900/30 text-gray-400'
                                    }`}>{event.type}</span>
                                    <span className="text-gray-300 flex-1 truncate">{event.msg}</span>
                                    <span className="text-gray-600">{event.time}</span>
                                </div>
                            ))}
                            {liveEvents.length === 0 && (
                                <div className="text-center text-gray-500 py-8">Waiting for events...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
