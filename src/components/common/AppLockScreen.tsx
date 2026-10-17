import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getAppLockConfig, saveAppLockConfig } from '../../utils/appLock';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Delete,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const { currentUser, currentStore, logout } = useApp();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  if (!currentUser) return null;

  const config = getAppLockConfig(currentUser.id);

  const handleVerify = (enteredPin: string) => {
    if (!enteredPin) {
      setError('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    if (enteredPin === config.pin) {
      setError(null);
      onUnlock();
    } else {
      setError('رمز واردشده صحیح نیست.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      // Auto submit if reached configured pin length
      if (config.pin && nextPin.length === config.pin.length) {
        setTimeout(() => handleVerify(nextPin), 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleForgotUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    // Verify against account's main password
    if (!accountPassword) {
      setForgotError('رمز عبور حساب کاربری الزامی است.');
      return;
    }

    if (currentUser.password && currentUser.password === accountPassword) {
      // Disable lock or reset pin
      saveAppLockConfig(currentUser.id, {
        ...config,
        enabled: false,
        pin: '',
      });
      setIsForgotModalOpen(false);
      onUnlock();
    } else {
      setForgotError('رمز عبور حساب کاربری اشتباه است.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Lock Header Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-600/30">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
          برنامه قفل است
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          جهت مشاهده اطلاعات {currentStore?.name || 'فروشگاه'} رمز ورود را وارد کنید
        </p>

        {/* User Card */}
        <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between text-right">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {currentUser.avatarUrl && currentUser.avatarUrl.length < 5
                ? currentUser.avatarUrl
                : currentUser.name.slice(0, 1) || 'U'}
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser.role === 'store_owner' ? 'مدیر فروشگاه' : 'ویزیتور'}
              </div>
            </div>
          </div>

          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            امنیت فعال
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-200 flex items-center justify-center gap-1.5 font-bold">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Input Field */}
        <div className="mt-5 relative">
          <input
            ref={inputRef}
            type={showPin ? 'text' : 'password'}
            maxLength={12}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleVerify(pin);
              }
            }}
            placeholder="رمز ورود..."
            className="w-full text-center py-3.5 px-10 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl text-xl font-black tracking-widest text-slate-900 dark:text-white font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-inner"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute left-3 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title={showPin ? 'مخفی کردن' : 'نمایش رمز'}
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Numeric Keypad for fast mobile usage */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeyPress(n)}
              className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:bg-sky-100 text-slate-800 dark:text-slate-100 rounded-xl text-lg font-black font-mono transition cursor-pointer active:scale-95 shadow-2xs"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
          >
            پاک کردن
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:bg-sky-100 text-slate-800 dark:text-slate-100 rounded-xl text-lg font-black font-mono transition cursor-pointer active:scale-95 shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold transition cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => handleVerify(pin)}
          className="w-full mt-4 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
        >
          <Unlock className="w-4 h-4" />
          <span>باز کردن قفل برنامه</span>
        </button>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>فراموشی رمز قفل؟</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('آیا می‌خواهید از حساب کاربری خارج شوید؟')) {
                logout();
              }
            }}
            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>

      {/* Forgot PIN Recovery Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-right shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-center text-slate-800 dark:text-slate-100">
              بازیابی و بازگشایی قفل
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed text-center">
              برای رفع قفل برنامه، رمز عبور اصلی حساب کاربری خود را وارد نمایید. پس از تایید، قفل برنامه غیرفعال خواهد شد.
            </p>

            {forgotError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotUnlock} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رمز عبور حساب کاربری:
                </label>
                <input
                  type="password"
                  maxLength={32}
                  required
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="رمز اصلی اکانت"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:border-sky-500"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  تایید و غیرفعال‌سازی قفل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setAccountPassword('');
                    setForgotError(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
