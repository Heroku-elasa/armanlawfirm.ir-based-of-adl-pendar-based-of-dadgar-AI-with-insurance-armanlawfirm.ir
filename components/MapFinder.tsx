import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLanguage, PageKey } from '../types';

interface MapFinderProps {
    setPage: (page: 'home' | PageKey) => void;
}

interface LocationMarker {
    id: number;
    name: string;
    nameEn: string;
    category: string;
    lat: number;
    lng: number;
    address: string;
    phone: string;
    hours: string;
    description: string;
}

const lawOfficesData: LocationMarker[] = [
    { id: 1, name: 'موسسه حقوقی آرمان', nameEn: 'Arman Law Firm', category: 'lawyers', lat: 35.7636, lng: 51.4126, address: 'تهران، جردن، خیابان طاهری پلاک ۱۸', phone: '۰۹۰۲۷۳۷۰۲۶۰', hours: '۹:۰۰ - ۱۸:۰۰', description: 'موسسه حقوقی پایه یک دادگستری' },
    { id: 2, name: 'دفتر وکالت دادگر', nameEn: 'Dadgar Law Office', category: 'lawyers', lat: 35.7219, lng: 51.3347, address: 'تهران، میدان آزادی، خیابان شهید خوش', phone: '۰۲۱-۶۶۰۱۲۳۴۵', hours: '۸:۳۰ - ۱۷:۰۰', description: 'وکالت در امور حقوقی و کیفری' },
    { id: 3, name: 'دفتر وکالت عدالت', nameEn: 'Edalat Law Office', category: 'lawyers', lat: 35.6892, lng: 51.3890, address: 'تهران، خیابان انقلاب، نبش خیابان کارگر', phone: '۰۲۱-۶۶۴۵۶۷۸۹', hours: '۹:۰۰ - ۱۹:۰۰', description: 'مشاوره حقوقی تخصصی' },
    { id: 4, name: 'دفتر اسناد رسمی ۱۲۳', nameEn: 'Notary Office 123', category: 'notary', lat: 35.7448, lng: 51.3756, address: 'تهران، میدان ونک، خیابان ملاصدرا', phone: '۰۲۱-۸۸۶۵۴۳۲۱', hours: '۸:۰۰ - ۱۶:۰۰', description: 'تنظیم اسناد رسمی و وکالتنامه' },
    { id: 5, name: 'دفتر اسناد رسمی ۴۵۶', nameEn: 'Notary Office 456', category: 'notary', lat: 35.7012, lng: 51.4234, address: 'تهران، خیابان شریعتی، نرسیده به میرداماد', phone: '۰۲۱-۲۲۸۹۱۲۳۴', hours: '۸:۳۰ - ۱۵:۳۰', description: 'ثبت معاملات و تنظیم قراردادها' },
    { id: 6, name: 'دادگاه عمومی تهران', nameEn: 'Tehran General Court', category: 'courts', lat: 35.6961, lng: 51.4231, address: 'تهران، خیابان شهید بهشتی، مجتمع قضایی شهید بهشتی', phone: '۰۲۱-۸۸۷۱۲۳۴۵', hours: '۸:۰۰ - ۱۴:۰۰', description: 'رسیدگی به پرونده‌های حقوقی و کیفری' },
    { id: 7, name: 'دادگاه خانواده', nameEn: 'Family Court', category: 'courts', lat: 35.7156, lng: 51.4089, address: 'تهران، خیابان ولیعصر، مجتمع قضایی خانواده', phone: '۰۲۱-۸۸۵۴۳۲۱۰', hours: '۸:۰۰ - ۱۴:۰۰', description: 'رسیدگی به امور خانواده' },
    { id: 8, name: 'اداره ثبت اسناد مرکزی', nameEn: 'Central Registry Office', category: 'registry', lat: 35.6823, lng: 51.4012, address: 'تهران، خیابان امام خمینی، سازمان ثبت اسناد', phone: '۰۲۱-۶۶۷۸۹۰۱۲', hours: '۸:۰۰ - ۱۵:۰۰', description: 'ثبت اسناد و املاک' },
    { id: 9, name: 'اداره ثبت شمال تهران', nameEn: 'North Tehran Registry', category: 'registry', lat: 35.7891, lng: 51.4356, address: 'تهران، تجریش، میدان قدس', phone: '۰۲۱-۲۲۳۴۵۶۷۸', hours: '۸:۰۰ - ۱۵:۰۰', description: 'خدمات ثبتی منطقه شمال' },
    { id: 10, name: 'دفتر وکالت حقوق‌یار', nameEn: 'Hoghoghyar Law Office', category: 'lawyers', lat: 35.7567, lng: 51.4456, address: 'تهران، الهیه، خیابان فرشته', phone: '۰۲۱-۲۲۶۷۸۹۰۱', hours: '۱۰:۰۰ - ۲۰:۰۰', description: 'وکالت تخصصی امور تجاری' },
];

const LeafletMap = lazy(() => import('./LeafletMapComponent'));

const MapFinder: React.FC<MapFinderProps> = ({ setPage }) => {
    useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isClient, setIsClient] = useState(false);

    const categories = [
        { id: 'all', label: 'همه', icon: '🏛️' },
        { id: 'lawyers', label: 'دفاتر وکالت', icon: '⚖️' },
        { id: 'notary', label: 'دفاتر اسناد رسمی', icon: '📜' },
        { id: 'courts', label: 'دادگاه‌ها', icon: '🏢' },
        { id: 'registry', label: 'ثبت اسناد', icon: '📋' },
    ];

    const filteredLocations = useMemo(() => lawOfficesData.filter(loc => {
        const matchesCategory = selectedCategory === 'all' || loc.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
            loc.name.includes(searchQuery) || 
            loc.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.address.includes(searchQuery);
        return matchesCategory && matchesSearch;
    }), [selectedCategory, searchQuery]);

    useEffect(() => {
        setIsClient(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleGetLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(newLocation);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('دسترسی به موقعیت مکانی امکان‌پذیر نیست');
                }
            );
        }
    }, []);

    const getCategoryColor = useCallback((category: string) => {
        switch (category) {
            case 'lawyers': return 'bg-blue-500 border-blue-400';
            case 'notary': return 'bg-purple-500 border-purple-400';
            case 'courts': return 'bg-red-500 border-red-400';
            case 'registry': return 'bg-green-500 border-green-400';
            default: return 'bg-brand-gold border-brand-gold';
        }
    }, []);

    const getCategoryIcon = useCallback((category: string) => {
        switch (category) {
            case 'lawyers': return '⚖️';
            case 'notary': return '📜';
            case 'courts': return '🏢';
            case 'registry': return '📋';
            default: return '🏛️';
        }
    }, []);

    const openInGoogleMaps = useCallback((loc: LocationMarker) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
        window.open(url, '_blank');
    }, []);

    const openDirections = useCallback((loc: LocationMarker) => {
        const url = userLocation 
            ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${loc.lat},${loc.lng}`
            : `https://www.google.com/maps/dir//${loc.lat},${loc.lng}`;
        window.open(url, '_blank');
    }, [userLocation]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#111827] transition-colors animate-fade-in">            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <button 
                        onClick={() => setPage('home')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <span>بازگشت به صفحه اصلی</span>
                    </button>
                    
                    <div className="text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-sm font-semibold mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            نقشه یاب هوشمند
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            یافتن <span className="text-brand-gold">دفاتر حقوقی</span> در نقشه
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            با استفاده از نقشه هوشمند، نزدیک‌ترین دفاتر حقوقی، دفاتر اسناد رسمی و مراکز قضایی را در محل خود پیدا کنید.
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="bg-white dark:bg-[#1F1F1F] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="جستجوی آدرس یا نام دفتر..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button
                                onClick={handleGetLocation}
                                className="px-4 py-2 bg-brand-gold text-brand-blue font-medium rounded-lg hover:bg-white transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                موقعیت من
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                        selectedCategory === cat.id
                                            ? 'bg-brand-gold text-brand-blue'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-[#1F1F1F] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-blue to-gray-900 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-white/70 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>اتصال امن</span>
                                    </div>
                                    {!isLoading && (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-[10px] font-medium text-green-400">متصل</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="relative" style={{ minHeight: '500px' }}>
                                {isLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                                        <div className="text-center">
                                            <div className="w-16 h-16 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-2">در حال بارگذاری نقشه...</p>
                                            <p className="text-gray-500 dark:text-gray-500 text-sm">لطفاً چند لحظه صبر کنید</p>
                                        </div>
                                    </div>
                                ) : isClient ? (
                                    <Suspense fallback={
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                            <div className="text-center">
                                                <div className="w-16 h-16 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری نقشه...</p>
                                            </div>
                                        </div>
                                    }>
                                        <LeafletMap
                                            locations={filteredLocations}
                                            selectedMarker={selectedMarker}
                                            setSelectedMarker={setSelectedMarker}
                                            userLocation={userLocation}
                                            openInGoogleMaps={openInGoogleMaps}
                                            openDirections={openDirections}
                                        />
                                    </Suspense>
                                ) : (
                                    <div className="flex items-center justify-center h-full" style={{ minHeight: '500px' }}>
                                        <p className="text-gray-500">در حال آماده‌سازی نقشه...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#1F1F1F] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-gold/20 to-transparent p-4 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                    نتایج جستجو ({filteredLocations.length})
                                </h3>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {filteredLocations.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400">نتیجه‌ای یافت نشد</p>
                                        <p className="text-sm text-gray-500 mt-1">لطفاً عبارت جستجو را تغییر دهید</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredLocations.map((loc) => (
                                            <div 
                                                key={loc.id}
                                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${selectedMarker?.id === loc.id ? 'bg-brand-gold/5 border-r-4 border-brand-gold' : ''}`}
                                                onClick={() => setSelectedMarker(loc)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${getCategoryColor(loc.category).split(' ')[0]}`}>
                                                        {getCategoryIcon(loc.category)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{loc.name}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{loc.address}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                                {loc.hours}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {selectedMarker && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedMarker(null)}>
                        <div className="bg-white dark:bg-[#1F1F1F] rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-brand-blue to-gray-900 p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl ${getCategoryColor(selectedMarker.category).split(' ')[0]}`}>
                                            {getCategoryIcon(selectedMarker.category)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{selectedMarker.name}</h3>
                                            <p className="text-white/70 text-sm">{selectedMarker.nameEn}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedMarker(null)}
                                        className="text-white/70 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">آدرس</p>
                                        <p className="text-gray-900 dark:text-white">{selectedMarker.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">تلفن</p>
                                        <p className="text-gray-900 dark:text-white font-mono">{selectedMarker.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">ساعات کاری</p>
                                        <p className="text-gray-900 dark:text-white">{selectedMarker.hours}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">توضیحات</p>
                                        <p className="text-gray-900 dark:text-white">{selectedMarker.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button 
                                    onClick={() => openInGoogleMaps(selectedMarker)}
                                    className="flex-1 px-4 py-3 bg-brand-gold text-brand-blue font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    مشاهده در نقشه
                                </button>
                                <button 
                                    onClick={() => openDirections(selectedMarker)}
                                    className="flex-1 px-4 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    مسیریابی
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 bg-white dark:bg-[#1F1F1F] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        راهنمای استفاده
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <span className="flex-shrink-0 w-8 h-8 bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold font-bold">۱</span>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">موقعیت خود را مشخص کنید</h4>
                                <p className="text-gray-600 dark:text-gray-400">با کلیک روی دکمه "موقعیت من"، مکان فعلی خود را ثبت کنید</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <span className="flex-shrink-0 w-8 h-8 bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold font-bold">۲</span>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">دسته‌بندی را انتخاب کنید</h4>
                                <p className="text-gray-600 dark:text-gray-400">از فیلترهای بالا برای یافتن نوع خدمات استفاده کنید</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <span className="flex-shrink-0 w-8 h-8 bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold font-bold">۳</span>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">روی نشانگرها کلیک کنید</h4>
                                <p className="text-gray-600 dark:text-gray-400">با کلیک روی نشانگرهای رنگی، اطلاعات هر مکان را ببینید</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#1F1F1F] p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-gold/50 transition-colors">
                        <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-gold" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">موقعیت‌یابی دقیق</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">مکان دقیق دفاتر حقوقی را با استفاده از GPS پیدا کنید</p>
                    </div>
                    
                    <div className="bg-white dark:bg-[#1F1F1F] p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-gold/50 transition-colors">
                        <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-gold" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">وکلای مجرب</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">دسترسی به اطلاعات تماس وکلای پایه یک دادگستری</p>
                    </div>
                    
                    <div className="bg-white dark:bg-[#1F1F1F] p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-gold/50 transition-colors">
                        <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-gold" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">ساعات کاری</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">مشاهده ساعات کاری و وضعیت فعلی دفاتر</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapFinder;
