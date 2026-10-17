import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pill, Lock, User, ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { getAppText } from '../../utils/customText';

interface LoginViewProps {
  onClose?: () => void;
  onOpenRegister?: () => void;
  onContinueAsGuest?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onClose,
  onOpenRegister,
  onContinueAsGuest,
}) => {
  const { login, platformConfig } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('لطفاً ایمیل، شماره تماس یا نام کاربری را وارد کنید.');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'ورود ناموفق بود.');
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 relative">
        {/* Close button if modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/15 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-xs shadow-inner border border-white/20">
            <Pill className="w-8 h-8 rotate-45 text-white" />
          </div>
          <h2 className="text-xl font-black">
            {getAppText(platformConfig, 'login_title', 'ورود به سامانه ویزیتور')}
          </h2>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            {getAppText(platformConfig, 'login_subtitle', 'ورود با ایمیل، شماره تماس یا نام کاربری ثبت‌شده')}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {getAppText(platformConfig, 'login_id_label', 'شناسه کاربری (ایمیل، شماره تماس یا نام کاربری)')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={50}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="نام کاربری، شماره تماس یا ایمیل"
                  className="w-full text-right pl-3 pr-10 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition shadow-2xs"
                  dir="ltr"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {getAppText(platformConfig, 'login_pass_label', 'رمز عبور')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={32}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 32))}
                  placeholder="••••••••"
                  className="w-full text-left pr-10 pl-10 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition font-mono shadow-2xs"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  title={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <span>در حال بررسی...</span>
              ) : (
                <>
                  <span>{getAppText(platformConfig, 'login_btn_text', 'ورود به سامانه')}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Actions */}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenRegister) onOpenRegister();
              }}
              className="text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
            >
              ثبت‌نام فروشگاه جدید (۱۴ روز رایگان)
            </button>

            {onContinueAsGuest && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onContinueAsGuest();
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {getAppText(platformConfig, 'login_guest_btn', 'مشاهده به عنوان مهمان')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
