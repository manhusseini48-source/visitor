import React from 'react';
import { ShieldAlert, X, ArrowRight, ShieldCheck, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  actionName?: string;
}

export const GuestActionRestrictionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenLogin,
  actionName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-sky-200 dark:border-sky-900/60 relative my-auto animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label="بستن پنجره"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Ribbon */}
        <div className="bg-gradient-to-l from-sky-600 via-teal-600 to-indigo-700 text-white p-6 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md mx-auto flex items-center justify-center shadow-lg shadow-sky-900/20 mb-3">
            <ShieldAlert className="w-7 h-7 text-amber-300" />
          </div>
          <h3 className="text-lg font-black">ثبت‌نام برای ایجاد تغییرات</h3>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            شما با عنوان «کاربر مهمان» در حال مشاهده امکانات برنامه هستید
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {actionName && (
            <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-sky-900 dark:text-sky-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 animate-ping" />
              <span>عملیات انتخابی: <span className="underline decoration-sky-400 font-black">«{actionName}»</span></span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-right">
            تمام بخش‌های برنامه (داشبورد، سفارش‌ها، انبار دواها، مشتریان، ویزیتورها و حسابداری) در حالت مهمان فعال و قابل بررسی است.
            اما جهت <strong>ذخیره تغییرات، ثبت فاکتور واقعی یا ایجاد اطلاعات جدید</strong>، نیاز به داشتن حساب کاربری دارید.
          </p>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>مزایای ثبت‌نام رایگان:</span>
            </div>
            <ul className="text-[11px] space-y-1 list-disc list-inside text-emerald-800 dark:text-emerald-300 pr-1 leading-relaxed">
              <li>۲ هفته اشتراک کاملاً رایگان بدون نیاز به پرداخت</li>
              <li>انبار ادویه اختصاصی با قیمت‌گذاری و پورسانت‌دهی خودکار</li>
              <li>اتصال سریع ویزیتورها و صدور فاکتور آنلاین</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>ثبت‌نام رایگان فروشگاه (۱۴ روز تست)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-sky-600" />
              <span>قبلاً ثبت‌نام کرده‌اید؟ ورود به حساب</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition cursor-pointer"
            >
              ادامه مشاهده امکانات در حالت مهمان
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
