
import React, { useState } from 'react';
import { PageKey } from '../types';

interface FaryadresiPageProps {
    setPage: (page: 'home' | PageKey) => void;
}

const formatNumber = (num: string | number) => {
    return Number(num).toLocaleString('fa-IR');
};

const FaryadresiPage: React.FC<FaryadresiPageProps> = ({ setPage }) => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [currencyType, setCurrencyType] = useState<'rial' | 'forex'>('rial');
    const [forexMethod, setForexMethod] = useState<string>('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringAmount, setRecurringAmount] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock Case Data
    const caseData = {
        name: "رضا م.",
        age: 34,
        city: "کرمانشاه",
        debt: 120000000,
        raised: 45000000,
        story: "رضا یه کارگر ساده ساختمانیه که به خاطر سقوط مصالح و عدم توانایی پرداخت دیه به زندان افتاده. ۳ تا بچه داره که الان ۶ ماهه پدرشون رو ندیدن. صاحب‌خانه جوابشون کرده و وضعیت معیشتی خانواده بسیار وخیمه.",
        id: "Case-9482"
    };

    const presetAmounts = [100000, 300000, 500000, 1000000, 3000000, 10000000];
    const recurringOptions = [200000, 500000, 1000000];

    const handleDonate = () => {
        const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount.replace(/,/g, '')) : 0);
        if (!finalAmount) return;

        setIsLoading(true);
        // Simulate payment process
        setTimeout(() => {
            setIsLoading(false);
            setShowSuccess(true);
            window.scrollTo(0, 0);
        }, 2000);
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (!isNaN(Number(rawValue))) {
            setCustomAmount(rawValue);
            setSelectedAmount(null);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    {/* Simulated Confetti/Particles */}
                    <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <div className="absolute top-10 right-1/4 w-2 h-2 bg-orange-500 rounded-full animate-ping delay-75"></div>
                    <div className="absolute bottom-1/4 left-10 w-2 h-2 bg-yellow-500 rounded-full animate-ping delay-150"></div>
                </div>
                
                <div className="bg-gray-800 rounded-3xl p-8 max-w-lg w-full text-center border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-fade-in transform scale-100 transition-all">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4">تو امروز یه زندگی رو نجات دادی 🖤</h2>
                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                        کمک شما با موفقیت ثبت شد. به زودی خبر آزادی رضا رو بهت میدیم. دمت گرم که بی‌تفاوت نبودی.
                    </p>
                    <div className="bg-gray-900 rounded-xl p-4 mb-8 border border-gray-700">
                        <p className="text-sm text-gray-500 mb-1">شماره پیگیری تراکنش</p>
                        <p className="text-xl font-mono text-green-400 font-bold tracking-widest">TRX-{Math.floor(Math.random() * 1000000)}</p>
                    </div>
                    <button 
                        onClick={() => { setShowSuccess(false); setPage('home'); }}
                        className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                    >
                        بازگشت به خانه
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05070A] text-white pb-20 font-sans">
            {/* Header / Nav Back */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => setPage('home')} className="text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10 hover:bg-white/20 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    بازگشت
                </button>
                <div className="text-xs font-mono text-gray-400 bg-black/50 px-3 py-1 rounded-full border border-white/10">
                    {caseData.id}
                </div>
            </div>

            {/* Hero Case Image */}
            <div className="relative h-[60vh] w-full">
                <img 
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" 
                    alt="Prisoner" 
                    className="w-full h-full object-cover filter grayscale contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
                    <div className="max-w-4xl mx-auto">
                        <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-3 inline-block animate-pulse">فوری و اضطراری</span>
                        <h1 className="text-4xl md:text-6xl font-black mb-2 text-white drop-shadow-lg">{caseData.name}</h1>
                        <div className="flex items-center gap-4 text-gray-300 text-sm md:text-base font-medium mb-6">
                            <span>{caseData.age} ساله</span>
                            <span>•</span>
                            <span>{caseData.city}</span>
                            <span>•</span>
                            <span className="text-red-400">بدهی مالی (غیرعمد)</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-gray-800/80 backdrop-blur rounded-2xl p-4 border border-gray-700 shadow-2xl">
                            <div className="flex justify-between text-sm mb-2 font-bold">
                                <span className="text-green-400">{formatNumber(caseData.raised)} تومان جمع شده</span>
                                <span className="text-gray-400">هدف: {formatNumber(caseData.debt)}</span>
                            </div>
                            <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-red-600 to-orange-500 h-full rounded-full relative" 
                                    style={{ width: `${(caseData.raised / caseData.debt) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <p className="text-xs text-right mt-2 text-gray-400">فقط {formatNumber(caseData.debt - caseData.raised)} تومان دیگه مونده تا آزادی...</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content & Donation Area */}
            <div className="container mx-auto px-4 -mt-6 relative z-10 max-w-4xl space-y-12">
                
                {/* Story */}
                <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-xl leading-loose font-medium text-gray-200 border-r-4 border-red-600 pr-4">
                        {caseData.story}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-6">
                        {/* Gallery Placeholders */}
                        <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700"><img src="https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt="Evidence 1"/></div>
                        <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700"><img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt="Evidence 2"/></div>
                        <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700 relative flex items-center justify-center group cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Video Thumbnail"/>
                            <div className="absolute w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donation Widget */}
                <div id="donate-section" className="bg-[#111827] rounded-3xl p-6 md:p-10 border border-gray-800 shadow-[0_0_40px_rgba(220,38,38,0.15)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <h2 className="text-2xl md:text-3xl font-black text-center mb-8 leading-tight">
                        شما چقدر می‌خوای این آدم رو <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">از زندان دربیاری؟</span>
                    </h2>

                    {/* Currency Tabs */}
                    <div className="flex bg-gray-900 p-1.5 rounded-xl mb-8 border border-gray-800">
                        <button 
                            onClick={() => setCurrencyType('rial')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${currencyType === 'rial' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            پرداخت ریالی (تومان)
                        </button>
                        <button 
                            onClick={() => setCurrencyType('forex')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${currencyType === 'forex' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30 shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            پرداخت ارزی
                        </button>
                    </div>

                    {currencyType === 'rial' ? (
                        /* Rial Flow */
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {presetAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                                        className={`py-4 rounded-xl border-2 text-lg font-bold transition-all duration-200 ${
                                            selectedAmount === amount 
                                                ? 'border-red-500 bg-red-500/10 text-white scale-105 shadow-lg shadow-red-500/20' 
                                                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:bg-gray-750'
                                        }`}
                                    >
                                        {formatNumber(amount)}
                                    </button>
                                ))}
                            </div>

                            <div className="relative mb-8">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="مبلغ دلخواه شما..."
                                    value={customAmount ? Number(customAmount).toLocaleString() : ''}
                                    onChange={handleCustomAmountChange}
                                    className={`w-full bg-gray-900 border-2 rounded-xl p-5 text-xl font-bold text-white focus:outline-none focus:ring-0 transition-colors ${customAmount ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-700 focus:border-gray-500'}`}
                                />
                                <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">تومان</span>
                            </div>
                        </>
                    ) : (
                        /* Forex Flow */
                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
                                    { id: 'visa', name: 'Visa / MasterCard', icon: '💳' },
                                    { id: 'usdt', name: 'Tether (USDT)', icon: '₮' },
                                    { id: 'perfect', name: 'Perfect Money', icon: '💱' },
                                    { id: 'webmoney', name: 'WebMoney', icon: '🌐' }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setForexMethod(method.id)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                            forexMethod === method.id 
                                                ? 'bg-blue-900/40 border-blue-500 text-white' 
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                                        }`}
                                    >
                                        <span className="text-2xl">{method.icon}</span>
                                        <span className="font-bold">{method.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {forexMethod === 'usdt' && (
                                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center animate-fade-in">
                                    <p className="text-sm text-gray-400 mb-2">Network Selection:</p>
                                    <div className="flex gap-2 justify-center">
                                        <span className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-600">TRC20</span>
                                        <span className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-600">ERC20</span>
                                        <span className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-600">BEP20</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="relative mt-4">
                                <label className="text-xs text-gray-500 mb-1 block">Donation Amount (USD)</label>
                                <input
                                    type="number"
                                    placeholder="Enter amount in USD"
                                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl p-4 text-xl font-bold text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Recurring Checkbox */}
                    <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <label className="flex items-center cursor-pointer gap-4">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={isRecurring}
                                    onChange={() => setIsRecurring(!isRecurring)} 
                                />
                                <div className={`w-14 h-8 rounded-full shadow-inner transition-colors ${isRecurring ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isRecurring ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div>
                                <span className="font-bold text-white block">می‌خوام هر ماه اتوماتیک کمک کنم</span>
                                <span className="text-xs text-gray-400">مثل Patreon، ولی برای نجات زندگی‌ها</span>
                            </div>
                        </label>
                        
                        {isRecurring && (
                            <div className="mt-4 pt-4 border-t border-gray-700 animate-fade-in">
                                <p className="text-sm text-gray-400 mb-2">مبلغ ماهانه:</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {recurringOptions.map(amt => (
                                        <button 
                                            key={amt} 
                                            onClick={() => setRecurringAmount(amt.toString())}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap border transition-colors ${recurringAmount === amt.toString() ? 'bg-purple-900/50 border-purple-500 text-purple-200' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
                                        >
                                            {formatNumber(amt)}
                                        </button>
                                    ))}
                                    <button className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-gray-900 border border-gray-700 text-gray-400">دلخواه</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleDonate}
                        disabled={isLoading || (currencyType === 'rial' && !selectedAmount && !customAmount) || (currencyType === 'forex' && !forexMethod)}
                        className="w-full py-5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-2xl font-black rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.4)] transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>همین الان آزادش کن</span>
                                <span className="text-3xl">🔥</span>
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-gray-500 mt-4">
                        تمامی تراکنش‌ها امن و رمزنگاری شده هستند. 🔒
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FaryadresiPage;
