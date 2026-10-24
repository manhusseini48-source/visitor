import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Pill,
  LogOut,
  Store as StoreIcon,
  ChevronDown,
  Download,
  Smartphone,
  X,
  Share,
  User,
  Menu,
  Calendar,
  Sun,
  Moon,
  Bell,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { getAppText } from '../../utils/customText';

interface HeaderProps {
  onOpenAuth?: () => void;
  onOpenRegister?: () => void;
  onOpenProfile?: () => void;
  onNavigateTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenRegister,
  onOpenProfile,
  onNavigateTab,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const {
    currentUser,
    currentStore,
    platformConfig,
    isGuest,
    logout,
    setIsProfileOpen,
    shamsiDate,
    theme,
    toggleTheme,
  } = useApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Read notifications tracking
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('visitor_app_read_notifs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const notifications = platformConfig.notifications || [];
  const unreadNotifsCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;

  const handleOpenNotifications = () => {
    setShowNotificationsModal(true);
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('visitor_app_read_notifs', JSON.stringify(allIds));
    } catch {}
  };

  // Close user dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  // Live online/offline status detection
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo & Brand & Mobile Menu Button */}
        <div className="flex items-center gap-2.5 min-w-0">


          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-500/20 flex-shrink-0"
            style={{ backgroundColor: platformConfig.primaryColor }}
          >
            <Pill className="w-6 h-6 rotate-45" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg md:text-xl text-slate-800 dark:text-white tracking-tight truncate">
                {getAppText(platformConfig, 'app_name', platformConfig.appName)}
              </span>
              <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[10px] md:text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 transition-colors">
                {getAppText(platformConfig, 'app_version_label', `نسخه ${platformConfig.appReleaseVersion || '2.5.0'}`)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
              {getAppText(platformConfig, 'app_subtitle', platformConfig.shortDescription)}
            </p>
          </div>
        </div>

        {/* Center: Shamsi Date Display (Text & Numeric) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">{shamsiDate.textDate}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span
            className="font-mono font-black text-sky-700 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-900/40 px-2 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800/60"
            dir="ltr"
          >
            {shamsiDate.numericDate}
          </span>
        </div>

        {/* Current Store Display (if logged in) */}
        {currentStore && currentUser && (
          <div className="hidden xl:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300">
            <StoreIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentStore.name}</span>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-500 dark:text-slate-400">کابل، افغانستان</span>
          </div>
        )}

        {/* Right Actions: Online Status, Theme Toggle, Install & User Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Live Online / Offline Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border transition shadow-2xs ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 animate-pulse'
            }`}
            title={
              isOnline
                ? 'اتصال اینترنت پایدار و برقرار است'
                : 'اینترنت قطع است (کار با حافظه داخلی آفلاین)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{isOnline ? 'آنلاین' : 'آفلاین'}</span>
          </div>

          {/* Theme Switcher (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs"
            title={theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
            aria-label="تغییر پوسته تاریک و روشن"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications & Announcements Bell */}
          <button
            onClick={handleOpenNotifications}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs"
            title="اعلانات و پیام‌های سراسری سیستم"
            aria-label="اعلانات"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="نصب اپلیکیشن روی دستگاه"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">نصب برنامه</span>
              <span className="sm:hidden text-[11px]">نصب</span>
            </button>
          )}

          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-2 sm:pl-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden border border-sky-400/30">
                  {currentUser.avatarUrl ? (
                    currentUser.avatarUrl.length < 10 ? (
                      <span className="text-base">{currentUser.avatarUrl}</span>
                    ) : (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    currentUser.name.slice(0, 1)
                  )}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentUser.role === 'store_owner'
                      ? 'مدیر فروشگاه'
                      : currentUser.role === 'visitor'
                      ? 'ویزیتور رسمی'
                      : 'مدیر کل'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 text-xs z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                      {currentUser.avatarUrl ? (
                        currentUser.avatarUrl.length < 10 ? (
                          <span className="text-lg">{currentUser.avatarUrl}</span>
                        ) : (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        currentUser.name.slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.phone}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenProfile) {
                        onOpenProfile();
                      } else {
                        setIsProfileOpen(true);
                      }
                      setShowUserMenu(false);
                    }}
                    className="w-full text-right px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-800 dark:hover:text-sky-300 rounded-xl flex items-center gap-2 cursor-pointer font-bold transition mb-1"
                  >
                    <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>پروفایل و تنظیمات امنیت</span>
                  </button>


                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-right px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 cursor-pointer font-bold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs font-bold">
                حالت مهمان
              </span>
              <button
                onClick={logout}
                className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                title="بازگشت به صفحه خوش‌آمدگویی"
              >
                صفحه ورود
              </button>
              <button
                onClick={onOpenAuth}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                ورود
              </button>
              <button
                onClick={onOpenRegister}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 transition flex items-center gap-1 cursor-pointer"
              >
                <span>ثبت‌نام</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                ورود به حساب
              </button>
              <button
                onClick={onOpenRegister}
                className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>ثبت‌نام فروشگاه</span>
                <span className="hidden sm:inline bg-sky-500 text-[10px] px-1.5 py-0.2 rounded font-normal">
                  ۱۴ روز رایگان
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-slate-800 dark:text-slate-100 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>نصب در آیفون (iOS)</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="text-xs space-y-3 list-decimal list-inside text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                در مرورگر Safari دکمه{' '}
                <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1">
                  اشتراک‌گذاری (Share <Share className="w-3.5 h-3.5 inline text-sky-600" />)
                </strong>{' '}
                را در پایین صفحه لمس کنید.
              </li>
              <li>
                منو را به پایین بکشید و گزینه{' '}
                <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong> (افزودن به
                صفحه اصلی) را انتخاب کنید.
              </li>
              <li>در گوشه بالا، گزینه Add را بزنید تا آیکون برنامه ذخیره شود.</li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Android Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-slate-800 dark:text-slate-100 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>راهنمای نصب اپلیکیشن</span>
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Permanent QR Code for Mobile Scanning */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5 my-2">
              <img
                src="/qr-code.png"
                alt="QR Code"
                className="w-36 h-36 rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                اسکن با دوربین موبایل جهت باز کردن و نصب فوری
              </span>
              <a
                href="/qr-code.png"
                download="mvpanel-qrcode.png"
                className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                دانلود تصویر QR کد با کیفیت بالا
              </a>
            </div>

            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>در مرورگر کروم کامپیوتر یا لپ‌تاپ:</strong>
              </p>
              <p className="text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                در نوار آدرس بالا، روی آیکون مانیتور کوچک (نصب اپلیکیشن) یا منوی سه نقطه و گزینه{' '}
                <span className="font-bold text-sky-700 dark:text-sky-300">«Install App»</span> کلیک فرمایید.
              </p>
              <p className="pt-1">
                <strong>در موبایل و تبلت‌های اندروید:</strong>
              </p>
              <p className="text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                از منوی سه‌نقطه بالای کروم، گزینه{' '}
                <span className="font-bold text-emerald-700 dark:text-emerald-300">«افزودن به صفحه اصلی / Install app»</span>{' '}
                را انتخاب کنید تا مستقیماً همانند اپ‌های گوگل‌پلی نصب گردد.
              </p>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* Platform Notifications & Updates Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full text-slate-800 dark:text-slate-100 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-inner">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">اعلانات و بروزرسانی‌های سامانه</h3>
                  <p className="text-[10px] text-slate-400">پیام‌های رسمی و تغییرات جدید پلتفرم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  هیچ اعلان یا بروزرسانی جدیدی وجود ندارد.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-1.5 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{notif.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.createdAt).toLocaleDateString('fa-AF')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              بستن پنجره اعلانات
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
