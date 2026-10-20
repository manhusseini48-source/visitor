import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';

const INSTALLED_VERSION_KEY = 'visitor_app_installed_version_code';

export const AppUpdateBanner: React.FC = () => {
  const { platformConfig } = useApp();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const targetVersionCode = platformConfig.appVersionCode || 5;
  const releaseVersionName = platformConfig.appReleaseVersion || '2.5.0';
  const releaseNotes = platformConfig.appUpdateNotes || '';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
      if (!stored) {
        // Initialize on first load to current version so new users don't see update immediately
        localStorage.setItem(INSTALLED_VERSION_KEY, String(targetVersionCode));
        setHasUpdate(false);
      } else {
        const storedCode = parseInt(stored, 10);
        if (targetVersionCode > storedCode) {
          setHasUpdate(true);
        } else {
          setHasUpdate(false);
        }
      }
    } catch {
      setHasUpdate(false);
    }
  }, [targetVersionCode]);

  // Also listen to service worker updatefound or controllerchange
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // When controller changes after update
      });
    }
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Mark target version code as installed
      localStorage.setItem(INSTALLED_VERSION_KEY, String(targetVersionCode));

      // 2. Clear browser cache storage
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {}
      }

      // 3. Skip waiting on active service worker registrations if any
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        } catch {}
      }

      // 4. Reload page cleanly with cache bypass
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      window.location.reload();
    }
  };

  // Only show before update, never after!
  if (!hasUpdate || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white px-4 py-2.5 shadow-lg border-b border-purple-500/30 flex items-center justify-between gap-3 text-xs md:text-sm animate-in fade-in slide-in-from-top duration-300 relative z-50">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
          <ArrowUpCircle className="w-4 h-4 text-purple-200" />
        </div>
        <div className="truncate">
          <span className="font-black text-amber-300 ml-1.5">
            نسخه جدید {releaseVersionName} آماده است:
          </span>
          <span className="text-purple-100 hidden sm:inline">
            {releaseNotes || 'تغییرات و امکانات جدید اعمال شده‌اند. جهت اعمال، روی دکمه بروزرسانی بزنید.'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'در حال اعمال...' : 'بروزرسانی نسخه جدید'}</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-purple-200 hover:text-white rounded-lg transition cursor-pointer"
          title="بستن موقت"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
