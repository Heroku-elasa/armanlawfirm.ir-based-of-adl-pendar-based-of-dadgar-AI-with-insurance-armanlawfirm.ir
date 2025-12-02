
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../types';
import { useToast } from './Toast';
import * as dbService from '../services/dbService';

// Initial Mock Data to seed the DB
const MOCK_CASES: dbService.CaseData[] = [
    {
        registrationDate: '1403/09/11',
        firstName: 'محمد',
        lastName: 'رضایی',
        nationalCode: '0012345678',
        mobile: '09121112233',
        email: 'm.rezaei@example.com',
        type: 'ملکی',
        status: 'در حال بررسی',
        priority: 'بالا',
        caseNumber: '980012/45',
        branch: 'شعبه ۱۰۵ کیفری ۲ تهران',
        defendant: 'شرکت ساختمانی الف',
        amount: '12,500,000,000',
        description: 'الزام به تنظیم سند رسمی و مطالبه خسارت تاخیر تادیه...'
    }
];

const GoogleSheetSimulator: React.FC = () => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState(5); // Default to Dashboard (Tab 6, index 5)
    const [cases, setCases] = useState<dbService.CaseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const tabs = [
        "اطلاعات موکل",
        "جزئیات پرونده",
        "استراتژی هوشمند",
        "پیش‌نویس‌های آماده",
        "وکیل‌یاب هوشمند",
        "داشبورد زیبا"
    ];

    const toolbarIcons = [
        { icon: "🖨️", action: () => addToast("ارسال به پرینتر...", "info") },
        { icon: "💾", action: () => handleSaveData(), text: "ذخیره" },
        { icon: "↪️", action: () => {} },
        { icon: "💰", action: () => {} },
        { icon: "PERCENT", text: "%" },
        { icon: "DEC_DEC", text: ".00" },
        { icon: "FONT", text: "B Nazanin" },
        { icon: "B", bold: true },
        { icon: "I", italic: true },
        { icon: "A", color: true },
        { icon: "FILL", fill: true },
        { icon: "BORDER", border: true },
        { icon: "ALIGN", align: true },
    ];

    // Initialize DB and load data
    useEffect(() => {
        const loadData = async () => {
            try {
                await dbService.initDB();
                const existingCases = await dbService.getAllCases();
                
                if (existingCases.length === 0) {
                    setCases(MOCK_CASES); // Set data immediately for UI responsiveness
                    // Try to seed silently
                    try {
                        for (const c of MOCK_CASES) {
                            await dbService.saveCase(c);
                        }
                    } catch (seedError) {
                        console.warn("Could not seed database (likely 'cases' table missing in Supabase):", seedError);
                    }
                } else {
                    setCases(existingCases);
                }
            } catch (err) {
                console.error("Failed to load data:", err);
                setCases(MOCK_CASES); // Fallback to mock data
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSaveData = async () => {
        try {
            for (const c of cases) {
                await dbService.saveCase(c);
            }
            addToast("اطلاعات با موفقیت ذخیره شد (DB)", "success");
        } catch (e) {
            console.error(e);
            addToast("خطا در ذخیره اطلاعات. لطفا اتصال اینترنت و تنظیمات دیتابیس را بررسی کنید.", "error");
        }
    };

    const handleExportPDF = () => {
        addToast("در حال ایجاد فایل PDF کامل پرونده...", "success");
    };

    const updateCase = (index: number, field: keyof dbService.CaseData, value: string) => {
        const newCases = [...cases];
        newCases[index] = { ...newCases[index], [field]: value };
        setCases(newCases);
    };

    const addNewRow = () => {
        const newCase: dbService.CaseData = {
            registrationDate: new Date().toLocaleDateString('fa-IR'),
            firstName: '', lastName: '', nationalCode: '', mobile: '', email: '',
            type: 'انتخاب کنید', status: 'جدید', priority: 'عادی'
        };
        setCases([...cases, newCase]);
    };

    // --- RENDERERS FOR EACH TAB ---

    const renderClientInfo = () => (
        <div className="w-full">
            <table className="w-full text-right border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-100 text-gray-600 font-bold text-xs text-center shadow-sm">
                        <th className="border p-2 w-10">#</th>
                        <th className="border p-2 min-w-[100px]">A<br/>تاریخ ثبت</th>
                        <th className="border p-2 min-w-[100px]">B<br/>نام</th>
                        <th className="border p-2 min-w-[100px]">C<br/>نام خانوادگی</th>
                        <th className="border p-2 min-w-[120px]">D<br/>کد ملی</th>
                        <th className="border p-2 min-w-[120px]">E<br/>شماره موبایل</th>
                        <th className="border p-2 min-w-[150px]">F<br/>ایمیل</th>
                        <th className="border p-2 min-w-[120px]">G<br/>نوع پرونده</th>
                        <th className="border p-2 min-w-[120px]">H<br/>وضعیت</th>
                        <th className="border p-2 min-w-[80px]">I<br/>اولویت</th>
                    </tr>
                </thead>
                <tbody>
                    {cases.map((c, i) => (
                        <tr key={c.id || i} className="text-sm border-b hover:bg-blue-50 transition-colors">
                            <td className="bg-gray-50 border text-center text-gray-500">{i + 1}</td>
                            <td className="border p-0"><input type="text" value={c.registrationDate} onChange={(e) => updateCase(i, 'registrationDate', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-mono dir-ltr outline-none focus:bg-white" /></td>
                            <td className="border p-0"><input type="text" value={c.firstName} onChange={(e) => updateCase(i, 'firstName', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:bg-white" /></td>
                            <td className="border p-0"><input type="text" value={c.lastName} onChange={(e) => updateCase(i, 'lastName', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:bg-white" /></td>
                            <td className="border p-0"><input type="text" value={c.nationalCode} onChange={(e) => updateCase(i, 'nationalCode', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-mono dir-ltr outline-none focus:bg-white" /></td>
                            <td className="border p-0"><input type="text" value={c.mobile} onChange={(e) => updateCase(i, 'mobile', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-mono dir-ltr outline-none focus:bg-white" /></td>
                            <td className="border p-0"><input type="text" value={c.email} onChange={(e) => updateCase(i, 'email', e.target.value)} className="w-full h-full p-2 bg-transparent text-left text-xs font-mono dir-ltr outline-none focus:bg-white" /></td>
                            <td className="border p-0">
                                <select value={c.type} onChange={(e) => updateCase(i, 'type', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer focus:bg-white">
                                    <option>انتخاب کنید</option>
                                    <option>ملکی</option>
                                    <option>خانواده</option>
                                    <option>کیفری</option>
                                    <option>چک و سفته</option>
                                    <option>قرارداد</option>
                                </select>
                            </td>
                            <td className="border p-0 text-center">
                                 <select value={c.status} onChange={(e) => updateCase(i, 'status', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer focus:bg-white">
                                    <option>جدید</option>
                                    <option>در حال بررسی</option>
                                    <option>اقدام شده</option>
                                    <option>مختومه</option>
                                </select>
                            </td>
                            <td className="border p-0 text-center">
                                <select value={c.priority} onChange={(e) => updateCase(i, 'priority', e.target.value)} className={`w-full h-full p-2 bg-transparent outline-none text-center cursor-pointer focus:bg-white font-bold ${c.priority === 'بالا' ? 'text-red-600' : 'text-gray-700'}`}>
                                    <option>عادی</option>
                                    <option>بالا</option>
                                    <option>فوری</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                    {/* Empty Rows Filler */}
                    {[...Array(Math.max(0, 10 - cases.length))].map((_, i) => (
                        <tr key={`empty-${i}`} className="text-sm border-b hover:bg-gray-50 h-9">
                            <td className="bg-gray-50 border text-center text-gray-400">{cases.length + i + 1}</td>
                            <td className="border"></td><td className="border"></td><td className="border"></td><td className="border"></td><td className="border"></td><td className="border"></td><td className="border"></td><td className="border"></td><td className="border"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={addNewRow} className="m-4 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100 transition-colors">
                + افزودن سطر جدید
            </button>
        </div>
    );

    const renderCaseDetails = () => (
        <table className="w-full text-right border-collapse">
            <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold text-xs text-center">
                    <th className="border p-2 w-10">#</th>
                    <th className="border p-2 min-w-[120px]">A<br/>شماره پرونده</th>
                    <th className="border p-2 min-w-[150px]">B<br/>دادگاه / شعبه</th>
                    <th className="border p-2 min-w-[120px]">C<br/>طرف مقابل</th>
                    <th className="border p-2 min-w-[150px]">D<br/>مبلغ خواسته (ریال)</th>
                    <th className="border p-2 w-1/3 min-w-[250px]">E<br/>خلاصه موضوع</th>
                    <th className="border p-2 min-w-[150px]">F<br/>مدارک موجود</th>
                    <th className="border p-2 min-w-[100px]">G<br/>تاریخ جلسه</th>
                </tr>
            </thead>
            <tbody>
                {cases.map((c, i) => (
                    <tr key={i} className="text-sm border-b hover:bg-blue-50 align-top">
                        <td className="bg-gray-50 border text-center text-gray-500 pt-3">{i + 1}</td>
                        <td className="border p-0"><input type="text" value={c.caseNumber || ''} onChange={(e) => updateCase(i, 'caseNumber', e.target.value)} className="w-full h-full p-2 pt-3 bg-transparent text-center font-mono dir-ltr outline-none" placeholder="---" /></td>
                        <td className="border p-0"><input type="text" value={c.branch || ''} onChange={(e) => updateCase(i, 'branch', e.target.value)} className="w-full h-full p-2 pt-3 bg-transparent outline-none" placeholder="---" /></td>
                        <td className="border p-0"><input type="text" value={c.defendant || ''} onChange={(e) => updateCase(i, 'defendant', e.target.value)} className="w-full h-full p-2 pt-3 bg-transparent outline-none" placeholder="---" /></td>
                        <td className="border p-2 text-center pt-3">
                            <input type="text" value={c.amount || ''} onChange={(e) => updateCase(i, 'amount', e.target.value)} className="w-full bg-transparent text-center font-mono dir-ltr outline-none" placeholder="0" />
                        </td>
                        <td className="border p-0"><textarea value={c.description || ''} onChange={(e) => updateCase(i, 'description', e.target.value)} className="w-full h-full p-2 bg-transparent text-xs leading-relaxed outline-none resize-none" rows={2} placeholder="توضیحات..." /></td>
                        <td className="border p-2 text-right">
                            <div className="flex flex-col gap-1 items-start text-xs">
                                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={!!c.caseNumber} readOnly className="accent-[#003087]" /> کارت ملی</label>
                                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-[#003087]" /> وکالت‌نامه</label>
                            </div>
                        </td>
                        <td className="border p-2 text-center font-mono text-xs pt-3">---</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderStrategy = () => (
        <table className="w-full text-right border-collapse">
            <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold text-xs text-center">
                    <th className="border p-2 w-10">#</th>
                    <th className="border p-2 min-w-[100px]">A<br/>شانس موفقیت</th>
                    <th className="border p-2 w-1/3 min-w-[300px]">B<br/>استراتژی پیشنهادی (Gemini)</th>
                    <th className="border p-2 min-w-[120px]">C<br/>لایحه پیشنهادی</th>
                    <th className="border p-2 min-w-[100px]">D<br/>زمان پیش‌بینی</th>
                    <th className="border p-2 min-w-[120px]">E<br/>هزینه تقریبی</th>
                </tr>
            </thead>
            <tbody>
                <tr className="text-sm border-b hover:bg-blue-50">
                    <td className="bg-gray-50 border text-center text-gray-500">1</td>
                    <td className="border p-2 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <span className="font-bold text-green-600 mb-1">85%</span>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[85%]"></div>
                            </div>
                        </div>
                    </td>
                    <td className="border p-2 text-xs leading-relaxed text-justify">
                        <strong>استراتژی ترکیبی:</strong> طرح دعوی الزام به تنظیم سند همزمان با دستور موقت منع نقل و انتقال جهت جلوگیری از فروش مال به غیر. استناد به مواد ۲۲۰ و ۲۲۱ قانون مدنی و رای وحدت رویه شماره ۷۹۰.
                    </td>
                    <td className="border p-2 text-center">
                        <button className="text-xs bg-[#003087] text-white px-3 py-1.5 rounded hover:bg-blue-800 flex items-center justify-center mx-auto gap-1">
                            <span>📄</span>
                            مشاهده لایحه
                        </button>
                    </td>
                    <td className="border p-2 text-center text-xs">۶ الی ۹ ماه</td>
                    <td className="border p-2 text-center text-xs">۴۵۰,۰۰۰ تومان</td>
                </tr>
            </tbody>
        </table>
    );

    const renderDrafts = () => (
        <table className="w-full text-right border-collapse">
            <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold text-xs text-center">
                    <th className="border p-2 w-10">#</th>
                    <th className="border p-2 min-w-[200px]">A<br/>نوع سند</th>
                    <th className="border p-2 min-w-[100px]">B<br/>وضعیت</th>
                    <th className="border p-2 min-w-[120px]">C<br/>عملیات تولید</th>
                    <th className="border p-2 min-w-[150px]">D<br/>لینک دانلود</th>
                </tr>
            </thead>
            <tbody>
                {[
                    { type: 'دادخواست کامل', status: 'آماده', color: 'bg-green-100 text-green-800' },
                    { type: 'لایحه دفاعیه اولیه', status: 'آماده', color: 'bg-green-100 text-green-800' },
                    { type: 'اظهارنامه رسمی', status: 'پیش‌نویس', color: 'bg-yellow-100 text-yellow-800' },
                    { type: 'قرارداد وکالت هوشمند', status: 'منتظر اطلاعات', color: 'bg-gray-100 text-gray-600' },
                    { type: 'استشهادیه محلی', status: 'نیار به اقدام', color: 'bg-red-100 text-red-800' }
                ].map((row, i) => (
                    <tr key={i} className="text-sm border-b hover:bg-blue-50">
                        <td className="bg-gray-50 border text-center text-gray-500">{i + 1}</td>
                        <td className="border p-2 font-medium">
                            <select className="w-full bg-transparent outline-none cursor-pointer" defaultValue={row.type}>
                                <option>دادخواست کامل</option>
                                <option>لایحه دفاعیه اولیه</option>
                                <option>لایحه دفاعیه تکمیلی</option>
                                <option>اظهارنامه رسمی</option>
                                <option>قرارداد وکالت هوشمند</option>
                                <option>استشهادیه محلی</option>
                                <option>درخواست تامین دلیل</option>
                            </select>
                        </td>
                        <td className="border p-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.color}`}>{row.status}</span></td>
                        <td className="border p-2 text-center">
                            <button className="text-[10px] bg-brand-gold text-brand-blue font-bold px-3 py-1.5 rounded hover:bg-yellow-300 transition-colors shadow-sm">
                                {row.status === 'آماده' ? 'تولید مجدد' : 'تولید سند'}
                            </button>
                        </td>
                        <td className="border p-2 text-center">
                            {row.status === 'آماده' ? (
                                <div className="flex justify-center gap-2">
                                    <a href="#" className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1"><span className="text-lg">📕</span> PDF</a>
                                    <span className="text-gray-300">|</span>
                                    <a href="#" className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"><span className="text-lg">📘</span> Word</a>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-xs">-</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderLawyerFinder = () => (
        <table className="w-full text-right border-collapse">
            <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold text-xs text-center">
                    <th className="border p-2 w-10">#</th>
                    <th className="border p-2 min-w-[150px]">A<br/>نام وکیل</th>
                    <th className="border p-2 min-w-[120px]">B<br/>تخصص اصلی</th>
                    <th className="border p-2 min-w-[100px]">C<br/>پرونده موفق</th>
                    <th className="border p-2 min-w-[100px]">D<br/>درصد موفقیت</th>
                    <th className="border p-2 min-w-[120px]">E<br/>تعرفه (تومان)</th>
                    <th className="border p-2 min-w-[100px]">F<br/>امتیاز</th>
                    <th className="border p-2 min-w-[100px]">G<br/>عملیات</th>
                </tr>
            </thead>
            <tbody>
                {[
                    { name: 'دکتر علیرضا نوری', spec: 'ملکی و ثبتی', count: 142, rate: '92%', price: 'توافقی', score: 4.9 },
                    { name: 'بانو سارا جلالی', spec: 'قراردادها', count: 89, rate: '88%', price: '۲۵۰,۰۰۰/ساعت', score: 4.7 },
                    { name: 'جناب آقای محمدی', spec: 'کیفری', count: 210, rate: '95%', price: 'توافقی', score: 5.0 }
                ].map((lawyer, i) => (
                    <tr key={i} className="text-sm border-b hover:bg-blue-50">
                        <td className="bg-gray-50 border text-center text-gray-500">{i + 1}</td>
                        <td className="border p-2 font-bold text-gray-800">{lawyer.name}</td>
                        <td className="border p-2 text-center bg-blue-50 text-blue-800 text-xs">{lawyer.spec}</td>
                        <td className="border p-2 text-center">{lawyer.count}</td>
                        <td className="border p-2 text-center text-green-600 font-bold dir-ltr">{lawyer.rate}</td>
                        <td className="border p-2 text-center text-xs">{lawyer.price}</td>
                        <td className="border p-2 text-center text-brand-gold text-xs">
                            {"★".repeat(Math.floor(lawyer.score))} {lawyer.score}
                        </td>
                        <td className="border p-2 text-center">
                            <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 shadow-sm transition-colors">انتخاب وکیل</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderVisualDashboard = () => (
        <div className="w-full h-full bg-white relative overflow-hidden text-right" style={{ minHeight: '600px' }}>
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(to right, #f3f4f6 1px, transparent 1px), linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)', 
                     backgroundSize: '40px 40px',
                 }}>
            </div>

            <div className="p-6 relative z-10 grid grid-cols-12 gap-6 h-full content-start">
                
                {/* Header Row */}
                <div className="col-span-12 bg-[#003087] text-white p-6 rounded-xl shadow-lg flex justify-between items-center border-b-4 border-brand-gold relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-2 bg-brand-gold"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <span className="text-xl">⚖️</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight">موسسه حقوقی آرمان</h1>
                        </div>
                        <p className="text-xs text-brand-gold tracking-[0.2em] uppercase font-mono opacity-90 mr-14">Arman Law Firm • 1403</p>
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-light italic text-blue-100">"چشم‌ها را باید شست، حق را باید دید"</p>
                    </div>
                </div>

                {/* Welcome & Date */}
                <div className="col-span-12 md:col-span-8 bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">خوش آمدید، <span className="text-[#003087]">محمد رضایی</span> گرامی</h2>
                    <p className="text-gray-500 text-sm">پنل مدیریت پرونده‌های حقوقی شما</p>
                </div>
                <div className="col-span-12 md:col-span-4 bg-[#003087]/5 p-6 rounded-xl border border-[#003087]/10 flex flex-col justify-center items-center text-center relative">
                    <div className="absolute top-2 right-2 text-gray-300">📅</div>
                    <span className="text-4xl font-black text-[#003087] mb-1">۱۱</span>
                    <span className="text-lg font-bold text-gray-700">آذر ماه ۱۴۰۳</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full mt-2 border border-gray-200">سه‌شنبه</span>
                </div>

                {/* Case Status */}
                <div className="col-span-12 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200 shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs font-bold uppercase mb-1">وضعیت پرونده جاری</span>
                            <span className="text-green-700 bg-green-50 px-3 py-1 rounded-md text-sm font-bold border border-green-100">در انتظار نوبت دادگاه</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold">شماره پرونده</span>
                        <span className="font-mono text-lg text-gray-700 font-bold">980012/45</span>
                    </div>
                </div>

                {/* Quick Access Buttons */}
                <div className="col-span-6 md:col-span-3 bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-gold/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">📝</div>
                    <div className="font-bold text-gray-700 text-sm relative z-10">تنظیم دادخواست</div>
                </div>
                <div className="col-span-6 md:col-span-3 bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-gold/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">⚖️</div>
                    <div className="font-bold text-gray-700 text-sm relative z-10">یافتن وکیل</div>
                </div>
                <div className="col-span-6 md:col-span-3 bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-gold/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">🔍</div>
                    <div className="font-bold text-gray-700 text-sm relative z-10">تحلیل قرارداد</div>
                </div>
                <div className="col-span-6 md:col-span-3 bg-white p-6 rounded-xl border border-gray-200 hover:border-brand-gold hover:shadow-md transition-all cursor-pointer text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-gold/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10">🏛️</div>
                    <div className="font-bold text-gray-700 text-sm relative z-10">دستیار دادگاه</div>
                </div>

                {/* Daily Tip */}
                <div className="col-span-12 bg-gradient-to-r from-brand-gold/10 to-transparent p-5 rounded-xl border-t-2 border-brand-gold mt-2 flex items-start gap-3">
                    <div className="text-2xl mt-0.5">💡</div>
                    <div>
                        <p className="text-xs text-[#003087] font-bold uppercase mb-1">نکته حقوقی روز</p>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed">
                            مهلت تجدیدنظرخواهی برای احکام حضوری دادگاه‌های عمومی و انقلاب <span className="font-bold text-red-600">۲۰ روز</span> است. در صورت عدم اقدام در این مهلت، رای قطعی خواهد شد.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full bg-gray-100 rounded-xl shadow-2xl overflow-hidden border border-gray-300 flex flex-col font-sans h-[850px] animate-fade-in" dir="rtl">
            {/* Top Menu Bar */}
            <div className="bg-[#f9fbfd] border-b border-gray-300 px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-600 rounded flex items-center justify-center text-white shadow-sm border border-green-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-sm font-bold text-gray-800 leading-none mb-1">پنل هوشمند موسسه حقوقی آرمان - نسخه ۱۴۰۳</span>
                        <div className="flex gap-2 text-[11px] text-gray-500">
                            {['پرونده', 'ویرایش', 'نمایش', 'ابزارها', 'افزونه‌ها', 'راهنما'].map(menu => (
                                <span key={menu} className="cursor-pointer hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors">{menu}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportPDF} className="bg-[#003087] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm border border-blue-900">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        خروجی PDF
                    </button>
                    <div className="w-9 h-9 rounded-full bg-brand-gold text-brand-blue flex items-center justify-center font-black text-xs border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" title="Account">MR</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-[#edf2fa] border-b border-gray-300 px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0 custom-scrollbar">
                {toolbarIcons.map((tool, idx) => (
                    <button key={idx} onClick={tool.action} className="p-1.5 rounded hover:bg-gray-300 text-gray-700 min-w-[28px] h-[28px] flex justify-center items-center text-sm font-medium transition-colors" title={tool.text || ""}>
                        {tool.icon === 'FONT' ? <span className="text-xs w-20 text-right px-2 bg-white border border-gray-300 h-6 flex items-center rounded truncate mx-1">B Nazanin</span> : 
                         tool.icon === 'B' ? <span className="font-bold font-serif">B</span> :
                         tool.icon === 'I' ? <span className="italic font-serif">I</span> :
                         tool.icon === 'A' ? <span className="text-red-600 font-bold border-b-4 border-red-600 leading-3 h-4">A</span> :
                         tool.icon === 'PERCENT' ? <span className="font-bold">%</span> :
                         tool.icon === 'DEC_DEC' ? <span className="text-xs font-bold">.00</span> :
                         tool.icon === 'FILL' ? <span className="text-lg">🪣</span> :
                         tool.icon === 'BORDER' ? <span className="text-lg border border-gray-400 w-4 h-4 block"></span> :
                         tool.icon === 'ALIGN' ? <span className="text-lg">≡</span> :
                         tool.text || tool.icon}
                    </button>
                ))}
                <div className="border-l border-gray-300 h-5 mx-2"></div>
                <div className="flex-grow bg-white border border-gray-300 rounded-sm px-2 py-1 text-xs text-gray-600 font-mono text-left dir-ltr flex items-center shadow-inner h-[28px] overflow-hidden">
                    <span className="text-gray-400 mr-2 font-bold select-none italic">fx</span>
                    <span className="truncate w-full">{activeTab === 5 ? '=DASHBOARD_VIEW("Client_ID_9845")' : activeTab === 2 ? '=CALC_SUCCESS_RATE(B2:B10)' : ''}</span>
                </div>
            </div>

            {/* Main Sheet Content */}
            <div className="flex-grow bg-white overflow-auto relative custom-scrollbar">
                {/* Headers Simulation */}
                {activeTab !== 5 && (
                    <>
                        <div className="sticky top-0 z-20 flex bg-[#f8f9fa] text-gray-500 font-bold text-[10px] border-b border-gray-300">
                            <div className="w-10 border-r border-gray-300 bg-[#f8f9fa] shrink-0 sticky left-0 z-30"></div>
                            {['A','B','C','D','E','F','G','H','I','J','K'].map(lt => (
                                <div key={lt} className="flex-1 min-w-[100px] border-r border-gray-300 text-center py-1">{lt}</div>
                            ))}
                        </div>
                    </>
                )}
                
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 ml-2"></div>
                        در حال بارگذاری اطلاعات پرونده‌ها...
                    </div>
                ) : (
                    <div className="h-full">
                        {activeTab === 0 && renderClientInfo()}
                        {activeTab === 1 && renderCaseDetails()}
                        {activeTab === 2 && renderStrategy()}
                        {activeTab === 3 && renderDrafts()}
                        {activeTab === 4 && renderLawyerFinder()}
                        {activeTab === 5 && renderVisualDashboard()}
                    </div>
                )}
            </div>

            {/* Bottom Tabs Bar */}
            <div className="bg-[#f9fbfd] border-t border-gray-300 px-2 flex items-end gap-0.5 h-9 overflow-x-auto shrink-0 custom-scrollbar">
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-t-lg transition-colors"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-t-lg transition-colors mr-2"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></button>
                
                {tabs.map((tabName, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-1.5 text-xs font-bold transition-all border-t border-l border-r rounded-t-lg min-w-[100px] text-center relative top-[1px]
                            ${activeTab === index 
                                ? 'bg-white text-[#003087] border-gray-300 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-10 h-[34px] border-b-transparent' 
                                : 'bg-[#e8eaed] text-gray-600 border-transparent hover:bg-gray-200 h-[30px] mt-1'}`}
                    >
                        {tabName}
                        {activeTab === index && <span className="mr-2 text-[8px] text-gray-400">▼</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GoogleSheetSimulator;
