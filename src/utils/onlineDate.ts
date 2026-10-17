/**
 * Online Authoritative Date & Afghan Shamsi (Solar Hijri) Calendar Engine
 * Prevents client-side time tampering for 14-day trial period & subscriptions
 * using server-side time verification and local monotonic ratchets.
 * Formats Afghan Solar Hijri dates in text (حمل، ثور، جوزا، ...) & numerical formats.
 */

// Memory offset between trusted server time and client device clock
let serverTimeOffsetMs = 0;
let isSynced = false;

const RATCHET_STORAGE_KEY = 'visitor_app_trusted_ratchet_time';

export const AFGHAN_SOLAR_MONTHS = [
  'حمل',
  'ثور',
  'جوزا',
  'سرطان',
  'اسد',
  'سنبله',
  'میزان',
  'عقرب',
  'قوس',
  'جدی',
  'دلو',
  'حوت',
];

const IRANIAN_TO_AFGHAN_MONTHS: Record<string, string> = {
  فروردین: 'حمل',
  اردیبهشت: 'ثور',
  خرداد: 'جوزا',
  تیر: 'سرطان',
  مرداد: 'اسد',
  شهریور: 'سنبله',
  مهر: 'میزان',
  آبان: 'عقرب',
  آذر: 'قوس',
  دی: 'جدی',
  بهمن: 'دلو',
  اسفند: 'حوت',
};

/**
 * Initializes online time synchronization with servers.
 * Uses HTTP Date response header (tamper-proof UTC time from VPS/Nginx)
 * with graceful fallback to public time APIs.
 */
export async function initOnlineTimeSync(): Promise<number> {
  let trustedServerTime: number | null = null;

  // 1. Try local origin HEAD request (works on Nginx VPS / Vite server)
  try {
    const res = await fetch(window.location.origin, {
      method: 'HEAD',
      cache: 'no-store',
    });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const parsed = Date.parse(dateHeader);
      if (!isNaN(parsed) && parsed > 1700000000000) {
        trustedServerTime = parsed;
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // 2. Fallback to public trusted time API if origin header unavailable
  if (!trustedServerTime) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://timeapi.io/api/v1/time/current/zone?timeZone=Asia/Kabul', {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.dateTime) {
          const parsed = Date.parse(data.dateTime);
          if (!isNaN(parsed)) trustedServerTime = parsed;
        }
      }
    } catch (e) {
      // Continue to next fallback
    }
  }

  // 3. Fallback to worldtimeapi
  if (!trustedServerTime) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kabul', {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.utc_datetime) {
          const parsed = Date.parse(data.utc_datetime);
          if (!isNaN(parsed)) trustedServerTime = parsed;
        }
      }
    } catch (e) {
      // Continue
    }
  }

  const localNow = Date.now();

  if (trustedServerTime) {
    serverTimeOffsetMs = trustedServerTime - localNow;
    isSynced = true;
  }

  // Anti-rollback ratchet check:
  // If user rolled their system clock backward, ensure we never go below the highest verified timestamp seen
  let lastRatchet = 0;
  try {
    const ratchetStr = localStorage.getItem(RATCHET_STORAGE_KEY);
    lastRatchet = ratchetStr ? parseInt(ratchetStr, 10) : 0;
  } catch {}

  const currentComputed = localNow + serverTimeOffsetMs;

  let finalAuthoritative = currentComputed;
  if (lastRatchet > 0 && currentComputed < lastRatchet) {
    // Clock rollback detected! Anchor to last known verified ratchet
    finalAuthoritative = lastRatchet;
    serverTimeOffsetMs = lastRatchet - localNow;
  } else {
    try {
      localStorage.setItem(RATCHET_STORAGE_KEY, currentComputed.toString());
    } catch {}
  }

  return finalAuthoritative;
}

/**
 * Returns the tamper-proof current timestamp in milliseconds.
 * Guaranteed to never roll backward even if user changes device clock.
 */
export function getAuthoritativeNow(): number {
  const localNow = Date.now();
  const computed = localNow + serverTimeOffsetMs;

  let lastRatchet = 0;
  try {
    const ratchetStr = localStorage.getItem(RATCHET_STORAGE_KEY);
    lastRatchet = ratchetStr ? parseInt(ratchetStr, 10) : 0;
  } catch {}

  let authoritative = computed;
  if (lastRatchet > 0 && computed < lastRatchet) {
    authoritative = lastRatchet;
  } else {
    try {
      localStorage.setItem(RATCHET_STORAGE_KEY, computed.toString());
    } catch {}
  }

  return authoritative;
}

/**
 * Returns a Date object anchored to the authoritative online time.
 */
export function getAuthoritativeDate(): Date {
  return new Date(getAuthoritativeNow());
}

/**
 * Calculates remaining trial days based on authoritative time and local anti-tamper ratchet.
 * Automatically decreases each real-world day and expires when <= 0.
 * A hidden monotonic counter ensures days can NEVER increase once decreased.
 */
export function calculateTrialDaysRemaining(
  endDate: string,
  storeId?: string,
  isPaidPlan?: boolean
): {
  daysRemaining: number;
  isExpired: boolean;
  authoritativeNow: number;
} {
  const endMs = new Date(endDate).getTime();
  const nowMs = getAuthoritativeNow();

  if (isNaN(endMs)) {
    return { daysRemaining: 0, isExpired: true, authoritativeNow: nowMs };
  }

  const diffMs = endMs - nowMs;
  let rawDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (rawDays <= 0 || nowMs >= endMs) {
    return { daysRemaining: 0, isExpired: true, authoritativeNow: nowMs };
  }

  // If it is a paid plan (6-Month, 1-Year) or more than 14 days, return full remaining days
  if (isPaidPlan || rawDays > 14) {
    if (storeId && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`visitor_store_trial_ratchet_${storeId}`);
      } catch {}
    }
    return { daysRemaining: rawDays, isExpired: false, authoritativeNow: nowMs };
  }

  // Anti-tampering store ratchet for 14-day trial period:
  if (storeId && typeof window !== 'undefined') {
    try {
      const ratchetKey = `visitor_store_trial_ratchet_${storeId}`;
      const savedRatchetStr = localStorage.getItem(ratchetKey);
      if (savedRatchetStr) {
        const savedRatchet = JSON.parse(savedRatchetStr);
        const minDaysSeen = Number(savedRatchet.minDaysRemaining);
        if (!isNaN(minDaysSeen)) {
          // If user rolled clock back, prevent days from increasing
          if (rawDays > minDaysSeen) {
            rawDays = minDaysSeen;
          } else if (rawDays < minDaysSeen && rawDays >= 0) {
            // New forward day progress
            localStorage.setItem(
              ratchetKey,
              JSON.stringify({ minDaysRemaining: rawDays, lastUpdated: nowMs })
            );
          }
        }
      } else if (rawDays >= 0 && rawDays <= 14) {
        localStorage.setItem(
          ratchetKey,
          JSON.stringify({ minDaysRemaining: rawDays, lastUpdated: nowMs })
        );
      }
    } catch {}
  }

  return { daysRemaining: Math.max(0, rawDays), isExpired: false, authoritativeNow: nowMs };
}

export interface ShamsiDateInfo {
  textDate: string; // e.g. "دوشنبه، ۲۰ میزان ۱۴۰۵"
  numericDate: string; // e.g. "۱۴۰۵/۰۷/۲۰"
  fullLabel: string; // e.g. "دوشنبه، ۲۰ میزان ۱۴۰۵ | ۱۴۰۵/۰۷/۲۰"
  weekday: string; // e.g. "دوشنبه"
  day: string; // e.g. "۲۰"
  monthName: string; // e.g. "میزان"
  year: string; // e.g. "۱۴۰۵"
}

/**
 * Converts a Gregorian Date into Afghan Solar Hijri (Shamsi) details
 * using official Afghan Dari month names: حمل، ثور، جوزا، سرطان، اسد، سنبله، میزان، عقرب، قوس، جدی، دلو، حوت.
 */
export function getShamsiDateDetails(targetDate?: Date | number): ShamsiDateInfo {
  const d = targetDate
    ? typeof targetDate === 'number'
      ? new Date(targetDate)
      : targetDate
    : getAuthoritativeDate();

  try {
    const textFormatter = new Intl.DateTimeFormat('fa-AF-u-ca-persian', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const numFormatter = new Intl.DateTimeFormat('fa-AF-u-ca-persian-nu-arabext', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = textFormatter.formatToParts(d);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    let monthName = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';

    // Guarantee official Afghan month name if environment defaulted to Iranian months
    if (IRANIAN_TO_AFGHAN_MONTHS[monthName]) {
      monthName = IRANIAN_TO_AFGHAN_MONTHS[monthName];
    }

    const textDate = `${weekday}، ${day} ${monthName} ${year}`.trim();
    const numericDate = numFormatter.format(d);
    const fullLabel = `${textDate}  |  ${numericDate}`;

    return {
      textDate,
      numericDate,
      fullLabel,
      weekday,
      day,
      monthName,
      year,
    };
  } catch (e) {
    // Pure fallback if Intl failed
    const fallbackStr = d.toLocaleDateString('fa-AF');
    return {
      textDate: fallbackStr,
      numericDate: fallbackStr,
      fullLabel: fallbackStr,
      weekday: '',
      day: '',
      monthName: '',
      year: '',
    };
  }
}
