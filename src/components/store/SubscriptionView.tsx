import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  CreditCard,
  Building,
  Phone,
  MessageCircle,
} from 'lucide-react';

export const SubscriptionView: React.FC = () => {
  const {
    currentStore,
    isSubscriptionExpired,
    trialDaysRemaining,
    updateStoreSubscription,
    platformConfig,
  } = useApp();

  const [requestedPlan, setRequestedPlan] = useState<'6-Month Plan' | '1-Year Plan' | null>(
    null
  );
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!currentStore) return null;

  const sub = currentStore.subscription;

  const price6Month = platformConfig.plan6MonthPriceAFN || 1700;
  const price1Year = platformConfig.plan1YearPriceAFN || 3000;
  const phone = platformConfig.supportPhone || '0784524918';
  const whatsappRaw = platformConfig.supportWhatsApp || '0784524918';

  // Format WhatsApp number with country code for Afghanistan (93)
  const whatsappClean = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappInternational = whatsappClean.startsWith('0')
    ? '93' + whatsappClean.slice(1)
    : whatsappClean.startsWith('93')
    ? whatsappClean
    : '93' + whatsappClean;

  const whatsappUrlGeneral = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    `سلام، جهت خرید و تمدید اشتراک فروشگاه «${currentStore.name}» در سامانه ویزیتور پیام می‌دهم.`
  )}`;

  const whatsappUrl6Month = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    `سلام، متقاضی فعال‌سازی اشتراک ۶ ماهه فروشگاه «${currentStore.name}» به مبلغ ${price6Month.toLocaleString()} افغانی در سامانه ویزیتور هستم.`
  )}`;

  const whatsappUrl1Year = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    `سلام، متقاضی فعال‌سازی اشتراک ۱ ساله (با تخفیف ویژه) فروشگاه «${currentStore.name}» به مبلغ ${price1Year.toLocaleString()} افغانی در سامانه ویزیتور هستم.`
  )}`;

  const SHARED_PLAN_FEATURES = [
    'دسترسی کامل و نامحدود به تمامی بخش‌ها و پنل‌های سامانه',
    'ثبت سفارشات، فاکتورهای فروش و انبار دارویی نامحدود',
    'تعداد ویزیتورها و مشتریان (دواخانه‌ها) بدون سقف',
    'برنامه ویزیت حضوری، زمان‌بندی و ثبت موقعیت مکانی GPS',
    'سیستم حسابداری، محاسبه خودکار پورسانت و دفتر کل مالی',
    'پیام‌رسان کاری با ارسال فاکتور، اسناد و عکس',
    'خروجی اکسل (Excel) و گزارش‌های تحلیلی BI و نمودارها',
    'پشتیبانی مستقیم تلفنی و پیام‌رسان واتساپ با مدیر فنی',
    'امنیت پایگاه داده، پشتیبان‌گیری منظم و به‌روزرسانی مداوم',
  ];

  const handleSimulatePayment = (plan: '6-Month Plan' | '1-Year Plan') => {
    const days = plan === '6-Month Plan' ? 180 : 365;
    updateStoreSubscription(currentStore.id, plan, days);
    setSuccessNotice(`اشتراک فروشگاه با موفقیت به مدت ${days} روز تمدید شد.`);
    setRequestedPlan(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Current Status Card */}
      <div className="bg-gradient-to-r from-sky-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-3 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>وضعیت اشتراک فروشگاه: {sub.planName}</span>
            </div>
            <h2 className="text-2xl font-black">{currentStore.name}</h2>
            <p className="text-xs text-sky-100 mt-1">
              تاریخ انقضای اعتبار: {new Date(sub.endDate).toLocaleDateString('fa-AF')}
            </p>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/20 text-center backdrop-blur-md">
            <div className="text-xs text-sky-200">
              {sub.status === 'active' ? 'اعتبار باقیمانده' : 'مهلت تست باقیمانده'}
            </div>
            <div className="text-3xl font-black font-mono my-1">
              {trialDaysRemaining} <span className="text-xs font-normal">روز</span>
            </div>
            <div className="text-[11px] font-bold">
              {isSubscriptionExpired ? (
                <span className="text-rose-300">منقضی شده</span>
              ) : sub.status === 'trial' ? (
                <span className="text-amber-300">مهلت تست ۱۴ روزه فعال</span>
              ) : (
                <span className="text-emerald-300 bg-emerald-900/50 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  اشتراک فعال رسمی
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Contact for Purchase & Support Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>خرید و تمدید مستقیم از طریق پشتیبان فروش:</span>
          </div>
          <p className="text-xs text-emerald-800">
            می‌توانید مستقیماً در واتساپ پیام دهید یا تماس تلفنی بگیرید تا اشتراک شما آنی فعال شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={whatsappUrlGeneral}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>پیام در واتساپ ({whatsappRaw})</span>
          </a>

          <a
            href={`tel:${phone}`}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Phone className="w-4 h-4 text-sky-600" />
            <span>تماس مستقیم ({phone})</span>
          </a>
        </div>
      </div>

      {successNotice && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Available Renewal Plans */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">طرح‌های تمدید و ارتقای سامانه:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 6-Month Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-sky-500 transition flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold mb-1">طرح پرطرفدار</div>
              <h4 className="text-lg font-black text-slate-800">اشتراک شش‌ماهه (۱۸۰ روز)</h4>
              <div className="text-2xl font-black text-sky-700 font-mono my-3">
                {price6Month.toLocaleString()} <span className="text-xs font-normal text-slate-500">افغانی</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                {SHARED_PLAN_FEATURES.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <a
                href={whatsappUrl6Month}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>سفارش طرح ۶ ماهه در واتساپ</span>
              </a>

              <a
                href={`tel:${phone}`}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>تماس مستقیم ({phone})</span>
              </a>
            </div>
          </div>

          {/* 1-Year Plan */}
          <div className="bg-white rounded-2xl border-2 border-sky-600 p-6 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 left-4 bg-sky-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow">
              اقتصادی‌ترین گزینه با تخفیف
            </span>
            <div>
              <div className="text-xs text-slate-400 font-bold mb-1">طرح طلایی سالیانه</div>
              <h4 className="text-lg font-black text-slate-800">اشتراک یک‌ساله (۳۶۵ روز)</h4>
              <div className="text-2xl font-black text-sky-700 font-mono my-2">
                {price1Year.toLocaleString()} <span className="text-xs font-normal text-slate-500">افغانی</span>
              </div>

              {/* Discount Notice Banner */}
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>۴۰۰ افغانی تخفیف نسبت به دو دوره ۶ ماهه (۳۴۰۰ ⇦ ۳۰۰۰)</span>
              </div>

              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                {SHARED_PLAN_FEATURES.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <a
                href={whatsappUrl1Year}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>سفارش طرح ۱ ساله در واتساپ</span>
              </a>

              <a
                href={`tel:${phone}`}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>تماس مستقیم ({phone})</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-3">سوابق تمدید و فعال‌سازی‌های فروشگاه:</h3>
        <div className="space-y-2 text-xs">
          {sub.renewalHistory.map((r) => (
            <div
              key={r.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800">{r.plan}</span>
                <span className="text-slate-400 mr-2">توسط {r.approvedBy}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-emerald-700 font-bold">{r.amount} AFN</span>
                <span className="text-slate-400">
                  {new Date(r.date).toLocaleDateString('fa-AF')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
