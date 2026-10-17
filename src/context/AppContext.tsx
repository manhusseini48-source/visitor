import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  Store,
  PlatformConfig,
  UserRole,
} from '../types';
import { Storage, DEFAULT_PLATFORM_CONFIG, getTwoWeeksTrialEnd } from '../utils/storage';
import {
  initOnlineTimeSync,
  calculateTrialDaysRemaining,
  getShamsiDateDetails,
  ShamsiDateInfo,
} from '../utils/onlineDate';
import { toEnglishDigits } from '../utils/numberUtils';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { SupabaseSync } from '../utils/supabaseSync';

interface AppContextType {
  currentUser: UserProfile | null;
  currentStore: Store | null;
  platformConfig: PlatformConfig;
  isGuest: boolean;
  isSubscriptionExpired: boolean;
  trialDaysRemaining: number;
  shamsiDate: ShamsiDateInfo;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setGuestMode: () => void;
  registerStore: (formData: {
    fullName: string;
    phone: string;
    storeName: string;
    email: string;
    username: string;
    address: string;
    password?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  createVisitor: (formData: {
    name: string;
    phone: string;
    username: string;
    city: string;
    address?: string;
    password?: string;
    baseSalary: number;
    commissionRate: number;
    commissionBasis: 'approved_order' | 'delivered_order' | 'collected_payment';
    monthlyTarget: number;
    weeklyTarget: number;
    employmentNotes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updateVisitor: (visitorId: string, updates: Partial<UserProfile>) => void;
  toggleVisitorActive: (visitorId: string) => void;
  updateStoreSubscription: (
    storeId: string,
    plan: '14-Day Trial' | '6-Month Plan' | '1-Year Plan' | 'Custom',
    daysToAdd: number
  ) => void;
  refreshState: () => void;
  updatePlatformConfig: (cfg: Partial<PlatformConfig>) => void;
  quickSwitchUser: (username: string) => void;
  resetDatabase: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      return Storage.getCurrentUser();
    } catch {
      return null;
    }
  });

  const [currentStore, setCurrentStore] = useState<Store | null>(() => {
    try {
      const u = Storage.getCurrentUser();
      if (u?.storeId) {
        return Storage.getStore(u.storeId) || Storage.getStores()[0] || null;
      }
      return Storage.getStores()[0] || null;
    } catch {
      return null;
    }
  });

  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() => {
    try {
      return Storage.getConfig();
    } catch {
      return DEFAULT_PLATFORM_CONFIG;
    }
  });

  const [isGuest, setIsGuest] = useState(() => {
    try {
      const u = Storage.getCurrentUser();
      if (u) return false;
      return localStorage.getItem('visitor_app_is_guest') === 'true';
    } catch {
      return false;
    }
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [shamsiDate, setShamsiDate] = useState<ShamsiDateInfo>(() => getShamsiDateDetails());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visitor_app_theme');
        if (saved === 'dark' || saved === 'light') return saved;
      } catch {}
    }
    return 'light';
  });

  // Sync theme with document class & data attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      try {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.style.colorScheme = 'light';
        }
        localStorage.setItem('visitor_app_theme', theme);
      } catch {}
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Initialize storage once and sync authoritative online time
  useEffect(() => {
    Storage.init();
    const config = Storage.getConfig();
    setPlatformConfig(config);

    // Initial online time sync to prevent clock tampering
    initOnlineTimeSync().then(() => {
      setShamsiDate(getShamsiDateDetails());
    });

    // Refresh Shamsi date every minute
    const dateInterval = setInterval(() => {
      setShamsiDate(getShamsiDateDetails());
    }, 60000);

    const savedUser = Storage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      if (savedUser.storeId) {
        const store = Storage.getStore(savedUser.storeId);
        if (store) setCurrentStore(store);
      }
    } else {
      setCurrentUser(null);
      const initialStores = Storage.getStores();
      if (initialStores.length > 0) {
        setCurrentStore(initialStores[0]);
      } else {
        setCurrentStore(null);
      }
    }

    const handleStorageChange = () => {
      refreshState();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(dateInterval);
    };
  }, []);

  // Synchronize active store subscription status from Supabase
  useEffect(() => {
    const pullStoreSub = async () => {
      const u = Storage.getCurrentUser();
      if (!u?.storeId || !supabase || !isSupabaseConfigured) return;
      try {
        const { data } = await supabase.from('stores').select('*').eq('id', u.storeId);
        if (data && data.length > 0) {
          const s = data[0];
          const allStores = Storage.getStores();
          const target = allStores.find((st) => st.id === u.storeId);
          if (target) {
            const isExpired = s.subscription_expires_at
              ? new Date(s.subscription_expires_at).getTime() < Date.now()
              : false;
            const isTrial = s.subscription_plan === 'trial' || s.subscription_plan === '14-Day Trial';
            const planName = s.subscription_plan === 'trial' ? '14-Day Trial' : s.subscription_plan;
            const status = !s.is_active ? 'suspended' : isExpired ? 'expired' : isTrial ? 'trial' : 'active';

            const changed =
              target.subscription.planName !== planName ||
              target.subscription.status !== status ||
              (s.subscription_expires_at && target.subscription.endDate !== s.subscription_expires_at);

            if (changed) {
              target.subscription.planName = planName as any;
              target.subscription.status = status as any;
              if (s.subscription_expires_at) {
                target.subscription.endDate = s.subscription_expires_at;
              }
              if (status === 'active') {
                try {
                  localStorage.removeItem(`visitor_store_trial_ratchet_${u.storeId}`);
                } catch {}
              }
              Storage.saveStores(allStores);
              setCurrentStore({ ...target });
            }
          }
        }
      } catch {}
    };

    pullStoreSub();
    const interval = setInterval(pullStoreSub, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const refreshState = () => {
    const isLoggedOut = localStorage.getItem('visitor_app_logged_out') === 'true';
    const isGuestMode = localStorage.getItem('visitor_app_is_guest') === 'true';
    const u = Storage.getCurrentUser();

    if (u) {
      setCurrentUser(u);
      if (u.storeId) {
        const s = Storage.getStore(u.storeId);
        if (s) setCurrentStore(s);
      }
    } else if (isLoggedOut || isGuestMode) {
      setCurrentUser(null);
    }
    setPlatformConfig(Storage.getConfig());
  };

  // Check Subscription Expiration with Anti-Tamper Online Time
  let isSubscriptionExpired = false;
  let trialDaysRemaining = 14;

  if (currentStore && currentStore.subscription) {
    const isPaid =
      currentStore.subscription.planName !== '14-Day Trial' &&
      currentStore.subscription.status === 'active';
    const calc = calculateTrialDaysRemaining(
      currentStore.subscription.endDate,
      currentStore.id,
      isPaid
    );
    trialDaysRemaining = calc.daysRemaining;

    if (calc.isExpired || currentStore.subscription.status === 'expired') {
      isSubscriptionExpired = true;
    }
  }

  // Helper to normalize phone numbers (strips country code +93, 0093, leading 0, non-digits)
  const normalizePhoneNumber = (phone: string): string => {
    const digits = toEnglishDigits(phone).replace(/\D/g, '');
    return digits.replace(/^(0093|93|0)/, '');
  };

  // Login handler
  const login = async (identifier: string, _pass: string) => {
    const rawId = identifier.trim().toLowerCase();
    const engId = toEnglishDigits(rawId).toLowerCase();
    const inputPhoneNormalized = normalizePhoneNumber(rawId);
    let profiles = Storage.getProfiles();

    // 1. Try matching in local profiles
    let match = profiles.find((p) => {
      const pUser = p.username.toLowerCase();
      const pPhone = toEnglishDigits(p.phone).replace(/\s+/g, '');
      const pPhoneNorm = normalizePhoneNumber(p.phone);
      const pEmail = (p.email || '').toLowerCase();
      const pName = p.name.toLowerCase();

      return (
        pUser === rawId ||
        pUser === engId ||
        (inputPhoneNormalized && pPhoneNorm === inputPhoneNormalized) ||
        pPhone === engId.replace(/\s+/g, '') ||
        pEmail === rawId ||
        pEmail === engId ||
        pName === rawId
      );
    });

    // 2. If not found in local cache, query Supabase cloud database
    if (!match && supabase && isSupabaseConfigured) {
      try {
        // Query by username first
        let { data: supaProfiles } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', engId);

        // If not found by username, query profiles by phone
        if (!supaProfiles || supaProfiles.length === 0) {
          const { data: allSupaProfiles } = await supabase
            .from('profiles')
            .select('*');
          if (allSupaProfiles && allSupaProfiles.length > 0) {
            supaProfiles = allSupaProfiles.filter((p: any) => {
              const pNorm = normalizePhoneNumber(p.phone || '');
              return (
                (inputPhoneNormalized && pNorm === inputPhoneNormalized) ||
                (p.name && p.name.toLowerCase() === rawId) ||
                (p.username && p.username.toLowerCase() === rawId)
              );
            });
          }
        }

        if (supaProfiles && supaProfiles.length > 0) {
          const sp = supaProfiles[0];
          match = {
            id: sp.id,
            name: sp.name,
            phone: sp.phone,
            email: sp.username?.includes('@') ? sp.username : undefined,
            username: sp.username,
            password: sp.password_hash || '123456',
            role: sp.role as any,
            storeId: sp.store_id || undefined,
            avatarUrl: sp.avatar_url || undefined,
            city: sp.city || 'کابل',
            createdAt: sp.created_at || new Date().toISOString(),
            isActive: sp.is_active ?? true,
          };

          // Cache profile locally
          if (!profiles.some((p) => p.id === match!.id)) {
            profiles.push(match);
            Storage.saveProfiles(profiles);
          }

          // Also pull corresponding store from Supabase if not present locally
          if (match.storeId) {
            const localStore = Storage.getStore(match.storeId);
            if (!localStore) {
              const { data: supaStores } = await supabase
                .from('stores')
                .select('*')
                .eq('id', match.storeId);
              if (supaStores && supaStores.length > 0) {
                const ss = supaStores[0];
                const pulledStore: Store = {
                  id: ss.id,
                  name: ss.name,
                  ownerId: match.id,
                  phone: ss.phone,
                  email: match.email || '',
                  address: ss.address || '',
                  createdAt: ss.created_at || new Date().toISOString(),
                  groupChatEnabled: true,
                  subscription: {
                    id: `sub_${ss.id}`,
                    storeId: ss.id,
                    planName: (ss.subscription_plan as any) || '14-Day Trial',
                    status: ss.is_active ? 'trial' : 'expired',
                    startDate: ss.created_at || new Date().toISOString(),
                    endDate:
                      ss.subscription_expires_at ||
                      new Date(Date.now() + 14 * 86400000).toISOString(),
                    trialDaysRemaining: 14,
                    priceAFN: 0,
                    renewalHistory: [],
                  },
                };
                const allStores = Storage.getStores();
                allStores.push(pulledStore);
                Storage.saveStores(allStores);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Supabase profile query during login:', err);
      }
    }

    if (!match) {
      return { success: false, message: 'حسابی با این شناسه یافت نشد.' };
    }

    if (!match.isActive) {
      return {
        success: false,
        message: 'این حساب توسط مدیریت غیرفعال شده است. لطفاً با مدیر فروشگاه تماس بگیرید.',
      };
    }

    // Verify Password (supports English or Persian digits)
    const cleanPass = _pass ? _pass.trim() : '';
    const engPass = toEnglishDigits(cleanPass);
    if (match.password) {
      if (!cleanPass) {
        return {
          success: false,
          message: 'لطفاً رمز عبور حساب کاربری خود را وارد نمایید.',
        };
      }
      if (cleanPass !== match.password && engPass !== match.password) {
        return {
          success: false,
          message: 'رمز عبور وارد شده نادرست است. لطفاً دوباره تلاش نمایید.',
        };
      }
    }

    // If visitor, verify store subscription
    if (match.role === 'visitor' && match.storeId) {
      const store = Storage.getStore(match.storeId);
      if (store) {
        const end = new Date(store.subscription.endDate).getTime();
        if (Date.now() > end) {
          return {
            success: false,
            message:
              'دسترسی شما به‌دلیل پایان اشتراک فروشگاه غیرفعال شده است. لطفاً از صاحب فروشگاه بخواهید اشتراک را تمدید کند.',
          };
        }
      }
    }

    Storage.setCurrentUser(match);
    setCurrentUser(match);
    setIsGuest(false);
    try {
      localStorage.removeItem('visitor_app_is_guest');
      localStorage.removeItem('visitor_app_logged_out');
      localStorage.setItem('visitor_app_active_tab', 'dashboard');
    } catch {}

    if (match.storeId) {
      const store = Storage.getStore(match.storeId);
      if (store) setCurrentStore(store);
    }

    refreshState();
    return { success: true };
  };

  const logout = () => {
    Storage.setCurrentUser(null);
    setCurrentUser(null);
    setIsGuest(false);
    try {
      localStorage.removeItem('visitor_app_is_guest');
      localStorage.setItem('visitor_app_logged_out', 'true');
    } catch {}
  };

  const setGuestMode = () => {
    Storage.setCurrentUser(null);
    setCurrentUser(null);
    setIsGuest(true);
    try {
      localStorage.setItem('visitor_app_is_guest', 'true');
      localStorage.removeItem('visitor_app_logged_out');
    } catch {}
  };

  // Register New Store - with strictly 2 weeks (14 days) trial period
  const registerStore = async (formData: {
    fullName: string;
    phone: string;
    storeName: string;
    email: string;
    username: string;
    address: string;
    password?: string;
  }) => {
    const profiles = Storage.getProfiles();
    const cleanUsername = formData.username.trim().toLowerCase();
    const cleanPhone = toEnglishDigits(formData.phone.trim());
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = toEnglishDigits(formData.password?.trim() || '123456');

    // Check uniqueness
    if (profiles.some((p) => p.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً ثبت شده است.' };
    }
    if (profiles.some((p) => toEnglishDigits(p.phone).replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''))) {
      return { success: false, message: 'این شماره تماس قبلاً در سامانه ثبت شده است.' };
    }
    if (profiles.some((p) => p.email && p.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'این ایمیل قبلاً در سامانه ثبت شده است.' };
    }

    const newStoreId = `store_${Date.now()}`;
    const newOwnerId = `user_${Date.now()}`;

    const newStore: Store = {
      id: newStoreId,
      name: formData.storeName.trim(),
      ownerId: newOwnerId,
      phone: cleanPhone,
      email: cleanEmail,
      address: formData.address.trim(),
      createdAt: new Date().toISOString(),
      groupChatEnabled: true,
      subscription: {
        id: `sub_${Date.now()}`,
        storeId: newStoreId,
        planName: '14-Day Trial',
        status: 'trial',
        startDate: new Date().toISOString(),
        endDate: getTwoWeeksTrialEnd(), // Exactly 2 weeks trial period
        trialDaysRemaining: 14,
        priceAFN: 0,
        renewalHistory: [
          {
            id: `ren_${Date.now()}`,
            date: new Date().toISOString(),
            plan: 'مهلت تست ۲ هفته (رایگان)',
            amount: 0,
            approvedBy: 'سیستم ثبت نام هوشمند',
          },
        ],
      },
    };

    const newOwnerProfile: UserProfile = {
      id: newOwnerId,
      name: formData.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      username: cleanUsername,
      password: cleanPassword,
      role: 'store_owner',
      storeId: newStoreId,
      address: formData.address.trim(),
      city: 'کابل',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Save
    const allStores = Storage.getStores();
    allStores.push(newStore);
    Storage.saveStores(allStores);

    profiles.push(newOwnerProfile);
    Storage.saveProfiles(profiles);

    // 1. Sign up user in Supabase Auth so it shows in Supabase Dashboard -> Authentication -> Users
    if (supabase && isSupabaseConfigured && cleanEmail && cleanPassword) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              name: formData.fullName.trim(),
              username: cleanUsername,
              phone: cleanPhone,
              role: 'store_owner',
              store_name: formData.storeName.trim(),
            },
          },
        });
      } catch (authErr) {
        console.warn('Supabase auth signup notice:', authErr);
      }
    }

    try {
      await SupabaseSync.syncStore(newStore);
      await SupabaseSync.syncProfile(newOwnerProfile);
    } catch (e) {
      console.warn('Syncing store on register:', e);
    }

    // Auto-login newly registered store owner
    Storage.setCurrentUser(newOwnerProfile);
    setCurrentUser(newOwnerProfile);
    setCurrentStore(newStore);
    setIsGuest(false);
    try {
      localStorage.removeItem('visitor_app_is_guest');
      localStorage.removeItem('visitor_app_logged_out');
      localStorage.setItem('visitor_app_active_tab', 'dashboard');
    } catch {}

    return { success: true };
  };

  // Store owner creates a visitor account
  const createVisitor = async (formData: {
    name: string;
    phone: string;
    username: string;
    city: string;
    address?: string;
    password?: string;
    baseSalary: number;
    commissionRate: number;
    commissionBasis: 'approved_order' | 'delivered_order' | 'collected_payment';
    monthlyTarget: number;
    weeklyTarget: number;
    employmentNotes?: string;
  }) => {
    if (!currentStore) return { success: false, message: 'فروشگاهی یافت نشد.' };

    const profiles = Storage.getProfiles();
    const cleanUsername = formData.username.trim().toLowerCase();
    const cleanPhone = formData.phone.trim();

    if (profiles.some((p) => p.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً استفاده شده است.' };
    }
    if (profiles.some((p) => p.phone === cleanPhone)) {
      return { success: false, message: 'این شماره تماس قبلاً برای ویزیتور دیگری ثبت شده است.' };
    }

    const newVisitor: UserProfile = {
      id: `vis_${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      username: formData.username,
      password: formData.password || '123456',
      role: 'visitor',
      storeId: currentStore.id,
      city: formData.city,
      address: formData.address,
      createdAt: new Date().toISOString(),
      isActive: true,
      baseSalary: formData.baseSalary,
      commissionRate: formData.commissionRate,
      commissionBasis: formData.commissionBasis,
      monthlyTarget: formData.monthlyTarget,
      weeklyTarget: formData.weeklyTarget,
      employmentNotes: formData.employmentNotes,
    };

    profiles.push(newVisitor);
    Storage.saveProfiles(profiles);

    // Automatically create private conversation between store and this visitor
    const convs = Storage.getConversations(currentStore.id);
    convs.push({
      id: `conv_${Date.now()}`,
      storeId: currentStore.id,
      type: 'private',
      visitorId: newVisitor.id,
      visitorName: newVisitor.name,
      unreadCount: 0,
      lastMessageText: 'گفتگوی کاری ایجاد شد',
      lastMessageTime: new Date().toISOString(),
    });
    Storage.saveConversations(convs);

    refreshState();
    return { success: true };
  };

  const updateVisitor = (visitorId: string, updates: Partial<UserProfile>) => {
    const profiles = Storage.getProfiles().map((p) =>
      p.id === visitorId ? { ...p, ...updates } : p
    );
    Storage.saveProfiles(profiles);
    refreshState();
  };

  const toggleVisitorActive = (visitorId: string) => {
    const profiles = Storage.getProfiles().map((p) =>
      p.id === visitorId ? { ...p, isActive: !p.isActive } : p
    );
    Storage.saveProfiles(profiles);
    refreshState();
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'کاربری وارد نشده است.' };

    const updated = Storage.updateUserProfile(currentUser.id, updates);
    if (!updated) return { success: false, message: 'خطا در ویرایش اطلاعات کاربر.' };

    setCurrentUser(updated);
    refreshState();
    return { success: true };
  };

  const updateStoreSubscription = async (
    storeId: string,
    plan: '14-Day Trial' | '6-Month Plan' | '1-Year Plan' | 'Custom',
    daysToAdd: number
  ) => {
    const stores = Storage.getStores();
    const target = stores.find((s) => s.id === storeId);
    if (!target) return;

    const price6M = platformConfig.plan6MonthPriceAFN || 1700;
    const price1Y = platformConfig.plan1YearPriceAFN || 3000;

    const newEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    const isPaid = plan !== '14-Day Trial';
    target.subscription.status = isPaid ? 'active' : 'trial';
    target.subscription.planName = plan;
    target.subscription.endDate = newEnd;
    target.subscription.renewalHistory.push({
      id: `ren_${Date.now()}`,
      date: new Date().toISOString(),
      plan: `تمدید ${plan} (${daysToAdd} روز)`,
      amount: plan === '6-Month Plan' ? price6M : plan === '1-Year Plan' ? price1Y : 0,
      approvedBy: currentUser?.name || 'مدیر کل سیستم',
    });

    try {
      localStorage.removeItem(`visitor_store_trial_ratchet_${storeId}`);
    } catch {}

    Storage.saveStores(stores);
    if (currentStore?.id === storeId) {
      setCurrentStore({ ...target });
    }

    // Immediately push update to Supabase
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('stores')
          .update({
            subscription_plan: plan,
            subscription_expires_at: newEnd,
            is_active: true,
          })
          .eq('id', storeId);
      } catch (err) {
        console.warn('Sync store subscription to Supabase warning:', err);
      }
    }
  };

  const updatePlatformConfig = (cfg: Partial<PlatformConfig>) => {
    const updated = { ...platformConfig, ...cfg, updatedAt: new Date().toISOString() };
    Storage.saveConfig(updated);
    setPlatformConfig(updated);
  };

  const quickSwitchUser = (username: string) => {
    const profiles = Storage.getProfiles();
    const found = profiles.find((p) => p.username === username);
    if (found) {
      Storage.setCurrentUser(found);
      setCurrentUser(found);
      setIsGuest(false);
      if (found.storeId) {
        const store = Storage.getStore(found.storeId);
        if (store) setCurrentStore(store);
      }
    }
  };

  const resetDatabase = () => {
    Storage.resetToZeroData();
    setCurrentUser(null);
    setCurrentStore(null);
    setIsGuest(false);
    refreshState();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentStore,
        platformConfig,
        isGuest,
        isSubscriptionExpired,
        trialDaysRemaining,
        shamsiDate,
        theme,
        toggleTheme,
        isProfileOpen,
        setIsProfileOpen,
        updateProfile,
        login,
        logout,
        setGuestMode,
        registerStore,
        createVisitor,
        updateVisitor,
        toggleVisitorActive,
        updateStoreSubscription,
        refreshState,
        updatePlatformConfig,
        quickSwitchUser,
        resetDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
