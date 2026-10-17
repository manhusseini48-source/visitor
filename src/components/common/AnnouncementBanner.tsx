import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertOctagon,
  X,
  Megaphone,
} from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const { platformConfig, currentUser } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  const isEnabled = platformConfig.announcementEnabled;
  const message = platformConfig.publicAnnouncement?.trim();
  const title = platformConfig.announcementTitle?.trim();
  const type = platformConfig.announcementType || 'info';
  const targetRole = platformConfig.announcementTargetRole || 'all';
  const isDismissible = platformConfig.announcementDismissible !== false;
  const dateStr = platformConfig.announcementDate;

  // Key to remember dismissal for this specific message text
  const dismissKey = `visitor_dismissed_announcement_${message || ''}_${title || ''}`;

  useEffect(() => {
    if (!message) return;
    try {
      const dismissed = sessionStorage.getItem(dismissKey) === 'true';
      setIsDismissed(dismissed);
    } catch {
      setIsDismissed(false);
    }
  }, [message, title, dismissKey]);

  if (!isEnabled || !message || isDismissed) {
    return null;
  }

  // Check role targeting
  if (targetRole !== 'all') {
    if (targetRole === 'store_owner' && currentUser?.role !== 'store_owner') {
      return null;
    }
    if (targetRole === 'visitor' && currentUser?.role !== 'visitor') {
      return null;
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch {}
  };

  const configStyles = {
    info: {
      bg: 'bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900',
      border: 'border-sky-500/40',
      badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
      icon: <Info className="w-4 h-4 text-sky-300" />,
      defaultLabel: 'اطلاعیه رسمی',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-900',
      border: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      icon: <AlertTriangle className="w-4 h-4 text-amber-300" />,
      defaultLabel: 'هشدار و توجه',
    },
    urgent: {
      bg: 'bg-gradient-to-r from-rose-800 via-rose-900 to-red-950',
      border: 'border-rose-500/50',
      badgeBg: 'bg-rose-500/25 text-rose-200 border-rose-400/40',
      icon: <AlertOctagon className="w-4 h-4 text-rose-300 animate-pulse" />,
      defaultLabel: 'اطلاعیه فوری',
    },
    success: {
      bg: 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-950',
      border: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
      defaultLabel: 'خبر و بروزرسانی ویژه',
    },
  }[type];

  return (
    <aside
      aria-label="اطلاعیه سراسری"
      className={`${configStyles.bg} border-b ${configStyles.border} text-white px-4 py-2.5 shadow-md relative z-30 transition-all`}
    >
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
            {configStyles.icon}
          </div>

          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md border ${configStyles.badgeBg} flex items-center gap-1`}
              >
                <Megaphone className="w-3 h-3" />
                <span>{title || configStyles.defaultLabel}</span>
              </span>
              {dateStr && (
                <span className="text-[10px] text-white/60 font-mono hidden md:inline">
                  {dateStr}
                </span>
              )}
            </div>

            <p className="text-xs text-white/95 leading-relaxed font-medium break-words">
              {message}
            </p>
          </div>
        </div>

        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition flex-shrink-0 cursor-pointer"
            aria-label="بستن اطلاعیه"
            title="بستن این پیام"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
