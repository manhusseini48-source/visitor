import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, Share, CheckCircle2, ArrowDown } from 'lucide-react';

export const PWAInstallBar: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  // If already installed and running as standalone app, hide completely
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowGeneralGuide(true);
    }
  };

  return (
    <>
      {/* High-visibility installation banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="truncate">
            <span className="font-black text-white ml-1.5">نصب اپلیکیشن ویزیتور:</span>
            <span className="text-sky-100 hidden sm:inline">
              برای دسترسی سریع، عملکرد آفلاین و تجربه مانند اپلیکیشن بومی
            </span>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="bg-white text-sky-800 hover:bg-sky-50 px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>نصب برنامه روی دستگاه</span>
        </button>
      </div>

      {/* Floating Install Quick Button on bottom-left for continuous visibility */}
      <div className="fixed bottom-4 left-4 z-40 sm:hidden">
        <button
          onClick={handleInstallClick}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-full font-black text-xs shadow-xl flex items-center gap-2 border border-emerald-400/40 active:scale-95 cursor-pointer animate-bounce"
        >
          <Download className="w-4 h-4 text-emerald-200" />
          <span>نصب اپلیکیشن</span>
        </button>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-600" />
                <span>نصب روی آیفون / آیپد (iOS)</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              مرورگر سافاری به دلایل امنیتی اپل، نصب را از طریق ۲ لمس ساده انجام می‌دهد:
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۱
                </span>
                <div>
                  در نوار پایین یا بالای مرورگر Safari، دکمه <strong>Share (اشتراک‌گذاری)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-sky-600" /> را لمس کنید.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۲
                </span>
                <div>
                  کمی به پایین اسکرول کرده و گزینه <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* General Guide Modal (for desktop Chrome / Edge) */}
      {showGeneralGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-sky-600" />
                <span>نصب اپلیکیشن</span>
              </h3>
              <button
                onClick={() => setShowGeneralGuide(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              برای نصب این برنامه روی کامپیوتر یا گوشی:
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
              <p>
                در نوار آدرس مرورگر کروم، روی آیکون <strong>نصب (Install)</strong> در سمت راست نوار آدرس کلیک کنید.
              </p>
              <p className="text-slate-500 text-[11px]">
                یا از منوی سه‌نقطه مرورگر گزینه <strong>Install App / نصب برنامه</strong> را انتخاب نمایید.
              </p>
            </div>

            <button
              onClick={() => setShowGeneralGuide(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </>
  );
};
