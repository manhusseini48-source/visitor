/**
 * Persian/Arabic to English digit conversion and numeric input parsing utilities.
 * Handles both Persian (۰-۹), Arabic (٠-٩), and English (0-9) input seamlessly.
 */

export function toEnglishDigits(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  const s = String(str);
  return s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function parseNumberInput(val: string | number | undefined | null, defaultVal = 0): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const eng = toEnglishDigits(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(eng);
  return isNaN(n) ? defaultVal : n;
}

export function cleanNumericString(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return toEnglishDigits(val).replace(/[^0-9]/g, '');
}

export function cleanPhoneInput(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return toEnglishDigits(val).replace(/[^0-9+]/g, '');
}
