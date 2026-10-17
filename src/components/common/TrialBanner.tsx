import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, AlertTriangle, ArrowLeft, Phone, MessageCircle } from 'lucide-react';

interface Props {
  onNavigateSubscription?: () => void;
}

export const TrialBanner: React.FC<Props> = ({ onNavigateSubscription }) => {
  const { currentStore, isSubscriptionExpired, trialDaysRemaining, currentUser, platformConfig } = useApp();

  if (!currentStore || !currentUser) return null;

  const sub = currentStore.subscription;
  const phone = platformConfig.supportPhone || '0784524918';
  const whatsappRaw = platformConfig.supportWhatsApp || '0784524918';

  const whatsappClean = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappInternational = whatsappClean.startsWith('0')
    ? '93' + whatsappClean.slice(1)
    : whatsappClean.startsWith('93')
    ? whatsappClean
    : '93' + whatsappClean;

  const whatsappUrl = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    `سلام، جهت تمدید اشتراک فروشگاه «${currentStore.name}» در سامانه ویزیتور پیام می‌دهم.`
  )}`;

  if (isSubscriptionExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse flex-shrink-0" />
          <span>
            مهلت استفاده فروشگاه پایان یافته است. دسترسی عملیاتی جهت ثبت سفارشات و داروها محدود شده است.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>واتساپ ({whatsappRaw})</span>
          </a>
          <a
            href={`tel:${phone}`}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>تماس ({phone})</span>
          </a>
          {currentUser.role === 'store_owner' && onNavigateSubscription && (
            <button
              onClick={onNavigateSubscription}
              className="bg-white text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1 shadow transition cursor-pointer"
            >
              <span>طرح‌های اشتراک</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show trial banner strictly only if plan is trial AND not active and not paid
  const isPaid = sub.status === 'active' && sub.planName !== '14-Day Trial';
  const isTrial = (sub.status === 'trial' || sub.planName === '14-Day Trial') && !isPaid && sub.status !== 'active';
  if (isTrial && !isSubscriptionExpired) {
    return (
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-4 py-2 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-200 flex-shrink-0" />
          <span>
            <strong>مهلت تست رایگان ۲ هفته‌ای فعال است:</strong> {trialDaysRemaining} روز دیگر تا پایان فرصت آزمایشی فروشگاه باقی مانده است.
          </span>
        </div>
        {currentUser.role === 'store_owner' && onNavigateSubscription && (
          <button
            onClick={onNavigateSubscription}
            className="bg-sky-500/40 hover:bg-white hover:text-sky-800 text-white border border-white/30 px-2.5 py-0.5 rounded-md text-xs font-medium transition cursor-pointer"
          >
            مشاهده طرح‌ها و تمدید
          </button>
        )}
      </div>
    );
  }

  return null;
};
