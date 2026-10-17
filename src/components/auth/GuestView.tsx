import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Pill,
  Users,
  ShoppingCart,
  TrendingUp,
  MapPin,
  MessageSquare,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Laptop,
  Phone,
  MessageCircle,
  Calendar,
} from 'lucide-react';

interface Props {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const GuestView: React.FC<Props> = ({ onOpenLogin, onOpenRegister }) => {
  const { platformConfig, shamsiDate } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'store_panel' | 'visitor_panel' | 'features'>('overview');
  const [showWarningModal, setShowWarningModal] = useState(false);

  const phone = platformConfig.supportPhone || '0784524918';
  const whatsappRaw = platformConfig.supportWhatsApp || '0784524918';

  const whatsappClean = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappInternational = whatsappClean.startsWith('0')
    ? '93' + whatsappClean.slice(1)
    : whatsappClean.startsWith('93')
    ? whatsappClean
    : '93' + whatsappClean;

  const whatsappUrl = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    'سلام، جهت مشاوره و خرید سامانه ویزیتور دارو پیام می‌دهم.'
  )}`;

  const handleRestrictedAction = () => {
    setShowWarningModal(true);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-8 md:p-12 shadow-2xl border border-sky-900/50">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 text-sky-300 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پلتفرم تخصصی عمده‌فروشی و توزیع دارو</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-sky-100 px-3.5 py-1 rounded-full text-xs font-bold backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              <span>امروز: {shamsiDate.textDate}</span>
              <span className="text-white/40">|</span>
              <span className="font-mono text-sky-300 tracking-wider font-black dir-ltr">
                {shamsiDate.numericDate}
              </span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            نرم‌افزار جامع <span className="text-sky-400">ویزیتور دارو</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
            انتقال هوشمند فرایند سفارش‌گیری، مدیریت ویزیتورها، موجودی داروها، ردیابی وصول مطالبات و حسابداری کمیسیون از حالت کاغذی سنتی به سامانه‌ای مدرن، سریع، امن و آفلاین‌پذیر.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenRegister}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-black text-sm shadow-lg shadow-sky-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <span>شروع مهلت تست رایگان (۲ هفته)</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-sm backdrop-blur-md transition cursor-pointer"
            >
              ورود به حساب کاربری
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-emerald-400/30 backdrop-blur-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساپ پشتیبانی ({whatsappRaw})</span>
            </a>
            <a
              href={`tel:${phone}`}
              className="px-4 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 backdrop-blur-md"
            >
              <Phone className="w-4 h-4 text-sky-400" />
              <span>تماس مستقیم ({phone})</span>
            </a>
          </div>
        </div>

        {/* Decorative background grid and badges */}
        <div className="absolute left-6 bottom-6 hidden lg:flex flex-col gap-3 opacity-90">
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">بارگذاری پرسرعت کاتالوگ دارو</div>
              <div className="text-slate-400 text-[10px]">بهینه‌سازی مصرف داده و اتصال پایدار</div>
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              AFN
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">واحد پول افغانی و تقویم محلی</div>
              <div className="text-slate-400 text-[10px]">طراحی شده برای بازار دارویی افغانستان</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          معرفی کلی و مزایا
        </button>
        <button
          onClick={() => setActiveTab('store_panel')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition ${
            activeTab === 'store_panel'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          امکانات پنل فروشگاه دارویی
        </button>
        <button
          onClick={() => setActiveTab('visitor_panel')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition ${
            activeTab === 'visitor_panel'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          امکانات پنل موبایل ویزیتور
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">سفارش‌گیری سریع و بی‌اشتباه</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ویزیتور در دواخانه تنها با چند لمس ساده، نام دارو، موجودی زنده، دوز و قیمت را مشاهده نموده و سفارش را همراه تخفیف‌های مجاز ثبت می‌کند.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">حسابداری دقیق پورسانت و وصول</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تفکیک کامل وضعیت ارسال دارو از وضعیت وصول وجه، محاسبه شفاف پورسانت بر مبنای سفارش یا وصول، و دفتر مالی اختصاصی برای هر ویزیتور.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">ثبت لوکیشن و مأموریت‌های مشتریان</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                امکان ثبت موقعیت جغرافیایی دواخانه‌ها با رضایت کاربر، واگذاری مشتریان به ویزیتورهای مشخص، و جلوگیری از تداخل بازاریابی.
              </p>
            </div>
          </div>

          {/* Interactive Mock Action to Demonstrate Guest Interception */}
          <div className="bg-slate-100/80 rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">آزمایش ثبت دارو یا سفارش به عنوان مهمان</h4>
              <p className="text-xs text-slate-500 mt-1">
                در حالت مهمان می‌توانید ساختار سیستم را مشاهده فرمایید، اما برای تغییرات واقعی پایگاه داده نیاز به ثبت‌نام یا ورود است.
              </p>
            </div>
            <button
              onClick={handleRestrictedAction}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Pill className="w-4 h-4" />
              <span>افزودن داروی جدید</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Store Panel Preview */}
      {activeTab === 'store_panel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-base mb-2">
            <Laptop className="w-5 h-5" />
            <span>بخش‌های ویژه صاحب فروشگاه و عمده‌فروش دارو:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">۱. داشبورد آمار لحظه‌ای</div>
              فروش امروز و ماه جاری، مبالغ وصول‌شده، مطالبات معوق، هشدارهای موجودی اندک و داروهای نزدیک انقضا.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">۲. مدیریت جامع داروها و انبار</div>
              تعریف فرم دارویی، سری ساخت، تاریخ انقضا، واحد بسته‌بندی، قیمت خرید و فروش و بارگذاری تصاویر باکیفیت کاتالوگ.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">۳. ساخت حساب ویزیتور و قوانین پورسانت</div>
              تعریف حقوق پایه، درصد کمیسیون، تارگت ماهانه و ثبت سوابق ماندگار حتی پس از غیرفعال‌سازی ویزیتور.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">۴. خروجی PDF و اکسل سفارشات</div>
              تولید رسمی فاکتورها، ارسال فاکتور در چت اختصاصی و گزارش‌گیری چند فیلتره.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Visitor Panel Preview */}
      {activeTab === 'visitor_panel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-base mb-2">
            <Smartphone className="w-5 h-5" />
            <span>طراحی موبایل‌محور ویژه کار در خیابان و دواخانه‌ها:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">ثبت سفارش با ۲ لمس</div>
              جستجوی نام تجاری دارو، مشاهده موجودی انبار، اعمال تخفیف و ثبت آنی فاکتور.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">برنامه ویزیت روزانه و ثبت نتیجه</div>
              ثبت نتایج مراجعه (خرید کرد، حضور نداشت، پیگیری مجدد) و تاریخ مراجعات بعدی.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">ثبت مشتری و موقعیت مکانی GPS</div>
              ثبت دواخانه‌های جدید، نشانی و ثبت لوکیشن دقیق جهت سهولت توزیع در دفعات بعد.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">پیام‌رسان کاری سریع</div>
              چت خصوصی با صاحب فروشگاه با قابلیت ارسال تصاویر، مدارک و سند سفارش.
            </div>
          </div>
        </div>
      )}

      {/* Interception Warning Modal when guest tries real action */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-800 text-base">دسترسی حالت مهمان</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              شما در حال مشاهده دموی معرفی سیستم هستید. برای ثبت دارو، ویرایش مشتریان یا ثبت سفارش واقعی، لطفاً ثبت‌نام کنید یا وارد حساب شوید.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  onOpenRegister();
                }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
              >
                ثبت‌نام فروشگاه (۱۴ روز رایگان)
              </button>
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
