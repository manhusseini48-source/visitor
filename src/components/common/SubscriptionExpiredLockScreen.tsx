import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  AlertTriangle,
  Phone,
  MessageCircle,
  ShieldAlert,
  LogOut,
  Calendar,
  Sparkles,
  RefreshCw,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { getShamsiDateDetails } from '../../utils/onlineDate';

interface Props {
  onOpenSubscriptionPlans?: () => void;
}

export const SubscriptionExpiredLockScreen: React.FC<Props> = ({ onOpenSubscriptionPlans }) => {
  const { currentStore, currentUser, logout, platformConfig, refreshState } = useApp();

  const phone = platformConfig.supportPhone || '0784524918';
  const whatsappRaw = platformConfig.supportWhatsApp || '0784524918';

  const whatsappClean = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappInternational = whatsappClean.startsWith('0')
    ? '93' + whatsappClean.slice(1)
    : whatsappClean.startsWith('93')
    ? whatsappClean
    : '93' + whatsappClean;

  const storeName = currentStore?.name || 'فروشگاه شما';
  const whatsappUrl = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    `سلام و وقت بخیر، جهت تمدید اشتراک فروشگاه «${storeName}» با شناسه [${currentStore?.id || ''}] در سامانه ویزیتور پیام می‌دهم.`
  )}`;

  const endDate = currentStore?.subscription?.endDate;
  const expiredDateFormatted = endDate
    ? getShamsiDateDetails(new Date(endDate)).textDate
    : 'نامشخص';

  return (
    <div className="w-full max-w-3xl mx-auto py-6 sm:py-10 px-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-500/30 dark:border-rose-500/40 shadow-2xl overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white p-6 sm:p-8 text-center relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 rounded-3xl mx-auto flex items-center justify-center mb-4 border border-white/20 backdrop-blur-xs shadow-inner">
            <Lock className="w-9 h-9 sm:w-11 sm:h-11 text-amber-300 animate-bounce" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-900/60 border border-rose-400/30 rounded-full text-xs font-bold text-rose-100 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>پایان مهلت اشتراک و آزمایشی</span>
          </span>

          <h1 className="text-xl sm:text-2xl font-black">
            اشتراک فروشگاه شما به پایان رسیده است
          </h1>
          <p className="text-xs sm:text-sm text-rose-100 mt-2 max-w-lg mx-auto leading-relaxed font-medium">
            تمامی امکانات سامانه (کاتالوگ دواها، ثبت سفارشات، مشتریان، ویزیتورها و حسابداری) تا زمان تمدید اشتراک قفل می‌باشند.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Custom Creator Expiration Notice */}
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-rose-900 dark:text-rose-200 text-xs sm:text-sm leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">پیام مدیریت سامانه:</p>
              <p className="text-rose-800 dark:text-rose-300">
                {platformConfig.subscriptionExpiredMessage ||
                  'دسترسی شما به‌دلیل پایان اشتراک فروشگاه غیرفعال شده است. لطفاً از صاحب فروشگاه بخواهید اشتراک را تمدید کند.'}
              </p>
            </div>
          </div>

          {/* Store Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">فروشگاه:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{storeName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">تاریخ پایان مهلت:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {expiredDateFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">وضعیت دسترسی:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">قفل موقت</span>
              </div>
            </div>
          </div>

          {/* Available Renewal Plans Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>تعرفه‌های تمدید و فعال‌سازی فوری</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                فعال‌سازی بدون معطلی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    پلن ۶ ماهه
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {platformConfig.plan6MonthPriceAFN.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">افغانی</span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>دسترسی کامل مدیر و ویزیتورها</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>پشتیبانی فنی و آپدیت‌ها</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between relative overflow-hidden">
                <span className="absolute top-2 left-2 text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full">
                  پیشنهاد ویژه
                </span>
                <div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    پلن ۱ ساله (۱۲ ماهه)
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {platformConfig.plan1YearPriceAFN.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">افغانی</span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>بیشترین صرفه اقتصادی</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>همگام‌سازی ابری نامحدود</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تمدید فوری در واتساپ ({whatsappRaw})</span>
              </a>

              <a
                href={`tel:${phone}`}
                className="w-full sm:w-auto py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Phone className="w-4 h-4" />
                <span>تماس تلفنی ({phone})</span>
              </a>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={refreshState}
                className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بررسی وضعیت تمدید</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از حساب</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
