/**
 * App Lock / PIN Security Utility
 * Provides device-level screen lock to protect sensitive pharma data
 * when someone else holds the user's phone or computer.
 */

export interface AppLockConfig {
  enabled: boolean;
  pin: string; // 4 to 8 digits or characters
  autoLockDelay: number; // in seconds: 0 = immediate on blur/switch, 60 = 1 min, 300 = 5 min, 900 = 15 min
}

const STORAGE_PREFIX = 'visitor_app_lock_config_';
const SESSION_LOCK_KEY = 'visitor_app_is_locked_state';
const LAST_ACTIVE_KEY = 'visitor_app_last_active_ts';

export function getAppLockConfig(userId: string): AppLockConfig {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        pin: parsed.pin || '',
        autoLockDelay: typeof parsed.autoLockDelay === 'number' ? parsed.autoLockDelay : 0,
      };
    }
  } catch (e) {
    console.error('Error reading app lock config:', e);
  }
  return {
    enabled: false,
    pin: '',
    autoLockDelay: 0,
  };
}

export function saveAppLockConfig(userId: string, config: AppLockConfig): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving app lock config:', e);
  }
}

export function isSessionLocked(): boolean {
  try {
    const state = sessionStorage.getItem(SESSION_LOCK_KEY);
    return state === '1';
  } catch {
    return false;
  }
}

export function setSessionLocked(locked: boolean): void {
  try {
    if (locked) {
      sessionStorage.setItem(SESSION_LOCK_KEY, '1');
    } else {
      sessionStorage.removeItem(SESSION_LOCK_KEY);
    }
  } catch {}
}

export function recordLastActiveTime(): void {
  try {
    sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch {}
}

export function getLastActiveTime(): number {
  try {
    const val = sessionStorage.getItem(LAST_ACTIVE_KEY);
    return val ? parseInt(val, 10) : Date.now();
  } catch {
    return Date.now();
  }
}
