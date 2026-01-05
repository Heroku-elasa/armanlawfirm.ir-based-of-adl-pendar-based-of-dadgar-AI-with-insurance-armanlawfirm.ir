import React from 'react';
import { useLanguage } from '../types';

interface BusinessCanvasItem {
    icon: string;
    title: string;
    description: string;
}

const InvestmentPage: React.FC = () => {
    const { language } = useLanguage();
    
    const businessCanvas: BusinessCanvasItem[] = [
        { icon: '👥', title: 'مشتریان هدف', description: 'افراد عادی، زنان ۲۸-۴۵ سال، کسب‌وکارهای کوچک' },
        { icon: '💎', title: 'ارزش پیشنهادی', description: 'دادخواست و لایحه در ۴ دقیقه + وکیل پایه یک + ۸۰ هزار تومان' },
        { icon: '📱', title: 'کانال‌ها', description: 'وبسایت، ربات تلگرام، اینستاگرام، کافه‌بازار' },
        { icon: '💬', title: 'ارتباط با مشتری', description: 'چت ۲۴/۷، مشاوره تلفنی، پنل کاربری' },
        { icon: '💰', title: 'جریان درآمدی', description: '۱۸۰k دادخواست، ۱۲۰k لایحه، اشتراک VIP ۲.۹ میلیون سالانه' },
        { icon: '🧠', title: 'منابع کلیدی', description: 'Grok-4.1-fast رایگان، ۳ وکیل پایه یک، سرور آروان' },
        { icon: '⚡', title: 'فعالیت‌های کلیدی', description: 'آموزش روزانه AI، تبلیغات اینستاگرام، آپدیت آرای وحدت رویه' },
        { icon: '🤝', title: 'شرکای کلیدی', description: 'کانون وکلا، نقدینه (بانک گردشگری)، زرین‌پال' },
        { icon: '📊', title: 'ساختار هزینه', description: 'سود خالص ۹۲٪ – هزینه ماهانه ۴۸ میلیون' },
    ];

    const investmentOptions = [
        {
            title: 'Crowdfunding',
            titleFa: 'تامین مالی جمعی',
            description: 'از پلتفرم‌های ایرانی مانند Novin Kerad (همکاری با بانک مرکزی) استفاده کنید.',
            link: 'https://novinkerad.ir/',
            linkText: 'Novin Kerad'
        },
        {
            title: 'Tokenization',
            titleFa: 'توکنیزه کردن دارایی‌ها',
            description: 'دارایی‌های پروژه را توکنیزه کنید و بفروشید. از accelerators مانند AbanTether استفاده کنید.',
            link: '#',
            linkText: 'AbanTether'
        }
    ];

    const handleWhatsAppContact = () => {
        window.open('https://wa.me/989027370260?text=سلام،%20در%20مورد%20سرمایه‌گذاری%20در%20آرمان%20اطلاعات%20می‌خواهم', '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2540] to-[#1a365d] text-white animate-fade-in" dir="rtl">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmQzMDAiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                
                <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full px-6 py-2 mb-8">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                            <span className="text-amber-400 text-sm font-medium">فرصت سرمایه‌گذاری ۱۴۰۳</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                                موسسه حقوقی آرمان
                            </span>
                            <br />
                            <span className="text-white/90 text-2xl md:text-3xl lg:text-4xl">
                                بزرگ‌ترین پلتفرم هوش مصنوعی حقوقی ایران
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-amber-300/80 mb-8 font-medium">
                            درآمد ماهانه فعلی: ۱۲۰ میلیون تومان | کاربران فعال: ۱,۳۷۶ | هدف جذب سرمایه: ۲۸ میلیارد تومان
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={handleWhatsAppContact}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                تماس از طریق واتساپ
                            </button>
                            <a 
                                href="mailto:info@armanlawfirm.ir"
                                className="bg-white/10 hover:bg-white/20 border border-amber-500/30 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                ایمیل: info@armanlawfirm.ir
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Introduction */}
            <div className="container mx-auto px-4 py-16">
                <div className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 md:p-12 mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-6 flex items-center gap-3">
                        <span className="text-3xl">🚀</span>
                        معرفی پروژه
                    </h2>
                    <p className="text-white/80 text-lg leading-relaxed mb-6">
                        موسسه حقوقی آرمان یک پلتفرم مبتنی بر AI برای خدمات حقوقی فوری در ایران است. پیش‌بینی درآمد سال اول: ۲.۸ میلیارد تومان. سود خالص ماهانه: ۱۶۰-۲۰۰ میلیون تومان با ۵۰ مشتری روزانه.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6">
                            <div className="text-amber-400 text-sm font-medium mb-2">بازار هدف</div>
                            <p className="text-white/70 text-sm">افراد عادی، کسب‌وکارهای کوچک، فریلنسرها (۸۵% کسانی که دسترسی به وکیل ندارند)</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6">
                            <div className="text-amber-400 text-sm font-medium mb-2">ارزش پیشنهادی</div>
                            <p className="text-white/70 text-sm">مشاوره AI: ۸۰ هزار تومان، دادخواست هوشمند: ۱۸۰ هزار تومان</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6">
                            <div className="text-amber-400 text-sm font-medium mb-2">پیش‌بینی رشد</div>
                            <p className="text-white/70 text-sm">ماه ۱-۳: ۱۵-۳۰ میلیون، ماه ۷-۱۲: ۳۰۰-۶۰۰ میلیون تومان</p>
                        </div>
                    </div>
                </div>

                {/* Business Model Canvas */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                            🎯 بوم مدل کسب‌و‌کار
                        </h2>
                        <p className="text-amber-300/70">Business Model Canvas</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businessCanvas.map((item, index) => (
                            <div 
                                key={index}
                                className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 hover:border-amber-400/50 transition-all hover:scale-[1.02] group"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">{item.icon}</span>
                                    <h3 className="text-lg font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                                        {item.title}
                                    </h3>
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Investment Options */}
                <div className="bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/5 border border-amber-500/20 rounded-3xl p-8 md:p-12 mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
                        💼 گزینه‌های سرمایه‌گذاری
                    </h2>
                    <p className="text-center text-white/70 mb-8">
                        سرمایه‌گذاری از طریق سهام، crowdfunding، یا توکنیزه کردن دارایی‌ها امکان‌پذیر است. 
                        <span className="text-amber-400 font-bold"> حداقل سرمایه: ۱۰۰ میلیون تومان</span>
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {investmentOptions.map((option, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-bold">{index + 1}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{option.titleFa}</h3>
                                        <p className="text-amber-400 text-sm">{option.title}</p>
                                    </div>
                                </div>
                                <p className="text-white/70 mb-4">{option.description}</p>
                                <a 
                                    href={option.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium"
                                >
                                    {option.linkText}
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Accelerator Support */}
                <div className="text-center mb-16">
                    <div className="inline-block bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30 rounded-2xl p-8 md:p-12">
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent mb-4">
                            تحت حمایت شتاب‌دهنده نقدینه – بانک گردشگری
                        </h2>
                        <p className="text-white/70 text-lg">
                            اولین استارتاپ حقوقی ایران با توکن سهام رسمی – ارزش‌گذاری ۱۴۰۴: ۳۵۰ میلیارد تومان
                        </p>
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0a1628] mb-4">
                        آماده سرمایه‌گذاری هستید؟
                    </h2>
                    <p className="text-[#0a1628]/80 mb-8 text-lg">
                        همین حالا با تیم ما تماس بگیرید و جزئیات بیشتر را دریافت کنید
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={handleWhatsAppContact}
                            className="bg-[#0a1628] hover:bg-[#1a365d] text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            تماس با واتساپ
                        </button>
                        <a 
                            href="tel:+989027370260"
                            className="bg-white/20 hover:bg-white/30 text-[#0a1628] font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            تماس تلفنی
                        </a>
                    </div>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-white/50 text-sm mb-4">لینک صفحه سرمایه‌گذاری</p>
                <p className="text-amber-400 font-medium">armanlawfirm.ir/investment</p>
            </div>
        </div>
    );
};

export default InvestmentPage;
