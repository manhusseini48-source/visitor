import {
  Store,
  UserProfile,
  Medicine,
  Customer,
  Order,
  VisitRecord,
  VisitorLedgerEntry,
  Conversation,
  Message,
  SupportTicket,
  SupportFaq,
  PlatformConfig,
  InventoryMovement,
  VisitorCashCollection,
  VisitorRemittance,
  PersonalNote,
  EisenhowerTask,
  AppAnalytics,
  GuestSessionLog,
  GuestAnalyticsSummary,
} from '../types';
import { SupabaseSync } from './supabaseSync';

const STORAGE_KEYS = {
  CURRENT_USER: 'visitor_app_current_user',
  STORES: 'visitor_app_stores',
  PROFILES: 'visitor_app_profiles',
  DELETED_USER_IDS: 'visitor_app_deleted_user_ids',
  DELETED_MEDICINE_IDS: 'visitor_app_deleted_medicine_ids',
  MEDICINES: 'visitor_app_medicines',
  CUSTOMERS: 'visitor_app_customers',
  ORDERS: 'visitor_app_orders',
  VISITS: 'visitor_app_visits',
  LEDGER: 'visitor_app_ledger',
  CONVERSATIONS: 'visitor_app_conversations',
  MESSAGES: 'visitor_app_messages',
  SUPPORT: 'visitor_app_support',
  CONFIG: 'visitor_app_config',
  MOVEMENTS: 'visitor_app_movements',
  COLLECTIONS: 'visitor_app_collections',
  REMITTANCES: 'visitor_app_remittances',
  NOTES: 'visitor_app_notes',
  EISENHOWER: 'visitor_app_eisenhower',
  ANALYTICS: 'visitor_app_analytics',
  GUEST_SESSIONS: 'visitor_app_guest_sessions',
};

export const INITIAL_SUPPORT_FAQS: SupportFaq[] = [
  {
    id: 'faq_01',
    question: 'چگونه دوای جدید به انبار و کاتالوگ فروشگاه اضافه کنم؟',
    answer: 'از منوی «دواها و انبار» روی دکمه «افزودن دوای جدید» کلیک کنید. نام، کد، دوز، تاریخ انقضا، موجودی انبار و قیمت فروش را وارد نموده و عکس دوا را بارگذاری نمایید تا فوراً با تمام ویزیتورها همگام‌سازی شود.',
    isActive: true,
    order: 1,
  },
  {
    id: 'faq_02',
    question: 'ویزیتور چگونه سفارش، فاکتور و بیعانه ثبت می‌کند؟',
    answer: 'ویزیتور از منوی «کاتالوگ و صدور فاکتور»، دواهای مورد نظر را جستجو و به سبد خرید اضافه می‌کند، دواخانه را انتخاب کرده و در صورت دریافت وجه، نوع تسویه (بیعانه، نقد یا حواله) را درج و فاکتور نهایی را صادر می‌نماید.',
    isActive: true,
    order: 2,
  },
  {
    id: 'faq_03',
    question: 'آیا ویزیتورها می‌توانند وجه یا بیعانه از دواخانه‌ها تحویل بگیرند؟',
    answer: 'بله، در صورتی که مدیر فروشگاه گزینه «مجوز دریافت بیعانه» را فعال کرده باشد، ویزیتور می‌تواند وجه نقد، کارت‌به‌کارت یا فیش بانکی دریافت کرده و از بخش حسابداری با فروشگاه تسویه نماید.',
    isActive: true,
    order: 3,
  },
  {
    id: 'faq_04',
    question: 'چگونه حساب و رمز عبور ویزیتور یا کاربر را ویرایش یا حذف کنم؟',
    answer: 'در پنل فروشگاه بخش «مدیریت ویزیتورها» یا در «پنل سازنده» تب کاربران، می‌توانید مشخصات، درصد پورسانت، حقوق و رمز عبور را بدون نیاز به رمز قبلی تغییر دهید و یا حساب را مسدود یا کاملاً حذف کنید.',
    isActive: true,
    order: 4,
  },
  {
    id: 'faq_05',
    question: 'چگونه نسخه جدید PWA را روی گوشی یا کامپیوتر بروزرسانی کنم؟',
    answer: 'هنگامی که سازنده نسخه جدیدی منتشر کند، دکمه بنفش‌رنگ «بروزرسانی نسخه جدید» در بالای صفحه پدیدار می‌شود. با کلیک روی آن کش برنامه نوسازی شده و آخرین تغییرات بلافاصله اعمال می‌شوند.',
    isActive: true,
    order: 5,
  },
];

// Initial Config
export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  appName: 'ویزیتور',
  shortDescription: 'پنل ویزیتور دوا',
  primaryColor: '#0284c7', // Sky-600
  accentColor: '#0d9488', // Teal-600
  subscriptionExpiredMessage:
    'دسترسی شما به‌دلیل پایان اشتراک فروشگاه غیرفعال شده است. لطفاً از صاحب فروشگاه بخواهید اشتراک را تمدید کند.',
  allowGuestMode: true,
  supportPhone: '0784524918',
  supportWhatsApp: '0784524918',
  plan6MonthPriceAFN: 1700,
  plan1YearPriceAFN: 3000,
  publicAnnouncement: '',
  announcementTitle: '',
  announcementType: 'info',
  announcementEnabled: false,
  announcementTargetRole: 'all',
  announcementDate: '',
  announcementDismissible: true,
  supportWelcomeMessage:
    'سلام و وقت بخیر! به واحد پشتیبانی آنلاین سامانه ویزیتور دوا خوش آمدید. پیام، سؤال یا تصویر مشکل خود را ارسال نمایید تا در اسرع وقت رسیدگی شود.',
  supportFaqs: INITIAL_SUPPORT_FAQS,
  notifications: [
    {
      id: 'notif_init_01',
      title: 'خوش‌آمدید به سامانه ویزیتور دوا',
      message: 'نسخه جدید ۲.۵ با هماهنگی آنلاین سریع دواها، پیام‌ها و کاتالوگ هم‌اکنون فعال است.',
      type: 'feature',
      createdAt: new Date().toISOString(),
      isImportant: true,
    },
  ],
  customTexts: {},
  updatedAt: new Date().toISOString(),
  version: 1,
  appReleaseVersion: '2.5.0',
  appVersionCode: 5,
  appUpdateNotes: 'بروزرسانی کامل دواها، پیام‌ها، مدیریت پیشرفته کاربران و پرسش‌های متداول',
  appUpdateRequired: false,
};

import { getAuthoritativeNow } from './onlineDate';

// Calculate 14-day trial date
export function getTwoWeeksTrialEnd(fromMs?: number): string {
  const base = fromMs || (typeof window !== 'undefined' ? getAuthoritativeNow() : Date.now());
  return new Date(base + 14 * 24 * 60 * 60 * 1000).toISOString();
}

// Initial Seeds - Clean Production Defaults (Zero internal records)
const INITIAL_STORE_ID = 'store_main';

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user_maker_01',
    name: 'مدیر کل سامانه',
    phone: '0700000000',
    email: 'admin@modesk.org',
    username: 'maker_admin',
    password: '123456',
    role: 'maker_admin',
    city: 'کابل',
    address: 'دفتر مرکزی',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

const INITIAL_STORES: Store[] = [];

const INITIAL_MEDICINES: Medicine[] = [];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_VISITS: VisitRecord[] = [];
const INITIAL_CONVERSATIONS: Conversation[] = [];
const INITIAL_MESSAGES: Message[] = [];
const INITIAL_LEDGER: VisitorLedgerEntry[] = [];

// Helper functions for reading/writing localStorage
function getItem<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage setItem failed:', e);
  }
}

const STORAGE_DATA_VERSION = 'v4_clean_zero_data_prod';

export const Storage = {
  init() {
    // If older version or demo data exists, wipe out cached demo data
    try {
      const currentVer = localStorage.getItem('visitor_app_data_version');
      if (currentVer !== STORAGE_DATA_VERSION) {
        localStorage.removeItem(STORAGE_KEYS.MEDICINES);
        localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
        localStorage.removeItem(STORAGE_KEYS.VISITS);
        localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
        localStorage.removeItem(STORAGE_KEYS.MESSAGES);
        localStorage.removeItem(STORAGE_KEYS.LEDGER);
        localStorage.removeItem(STORAGE_KEYS.STORES);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem('visitor_app_is_guest');
        localStorage.removeItem('visitor_app_logged_out');
        localStorage.setItem('visitor_app_data_version', STORAGE_DATA_VERSION);
      }
    } catch (e) {
      console.error('Storage version migration error:', e);
    }

    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      setItem(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STORES)) {
      setItem(STORAGE_KEYS.STORES, INITIAL_STORES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDICINES)) {
      setItem(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      setItem(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
      setItem(STORAGE_KEYS.VISITS, INITIAL_VISITS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEDGER)) {
      setItem(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) {
      setItem(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      setItem(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      setItem(STORAGE_KEYS.CONFIG, DEFAULT_PLATFORM_CONFIG);
    }
    // No automatic login: User chooses Guest, Register, or Login on first load
  },

  resetToZeroData(keepMakerSession = false) {
    try {
      setItem(STORAGE_KEYS.MEDICINES, []);
      setItem(STORAGE_KEYS.CUSTOMERS, []);
      setItem(STORAGE_KEYS.ORDERS, []);
      setItem(STORAGE_KEYS.VISITS, []);
      setItem(STORAGE_KEYS.LEDGER, []);
      setItem(STORAGE_KEYS.CONVERSATIONS, []);
      setItem(STORAGE_KEYS.MESSAGES, []);
      setItem(STORAGE_KEYS.STORES, []);
      setItem(STORAGE_KEYS.SUPPORT, []);
      setItem(STORAGE_KEYS.MOVEMENTS, []);

      const currentProfiles = this.getProfiles();
      const makerAdmin = currentProfiles.find((p) => p.role === 'maker_admin') || INITIAL_PROFILES[0];
      setItem(STORAGE_KEYS.PROFILES, [makerAdmin]);

      if (keepMakerSession) {
        setItem(STORAGE_KEYS.CURRENT_USER, makerAdmin);
      } else {
        setItem(STORAGE_KEYS.CURRENT_USER, null);
        localStorage.removeItem('visitor_app_is_guest');
      }
      localStorage.setItem('visitor_app_data_version', STORAGE_DATA_VERSION);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error('Storage reset error:', e);
    }
  },

  getCurrentUser(): UserProfile | null {
    const user = getItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (user) {
      if (user.isGuest) return user;
      // Keep synchronized with PROFILES in case name, avatar or other details were updated
      const profiles = this.getProfiles();
      const fresh = profiles.find((p) => p.id === user.id);
      return fresh || user;
    }
    // Check if guest flag is set in localStorage without an explicit logout
    if (typeof window !== 'undefined') {
      try {
        const isGuestFlag = localStorage.getItem('visitor_app_is_guest') === 'true';
        const loggedOut = localStorage.getItem('visitor_app_logged_out') === 'true';
        if (isGuestFlag && !loggedOut) {
          return {
            id: 'guest_user_demo',
            name: 'کاربر مهمان',
            phone: '0700000000',
            username: 'guest_user',
            role: 'store_owner',
            storeId: 'store_demo_guest',
            avatarUrl: 'م',
            city: 'کابل',
            createdAt: new Date().toISOString(),
            isActive: true,
            isGuest: true,
          };
        }
      } catch {}
    }
    return null;
  },

  setCurrentUser(user: UserProfile | null) {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
    if (typeof window !== 'undefined') {
      try {
        if (user?.isGuest) {
          localStorage.setItem('visitor_app_is_guest', 'true');
          localStorage.removeItem('visitor_app_logged_out');
        } else if (user) {
          localStorage.removeItem('visitor_app_is_guest');
          localStorage.removeItem('visitor_app_logged_out');
        } else {
          localStorage.removeItem('visitor_app_is_guest');
        }
      } catch {}
    }
  },

  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    // Strictly prevent guest profile mutations
    if (userId === 'user_guest') {
      return this.getCurrentUser();
    }
    const profiles = this.getProfiles().map((p) =>
      p.id === userId && !p.isGuest ? { ...p, ...updates } : p
    );
    this.saveProfiles(profiles);
    const updated = profiles.find((p) => p.id === userId) || null;
    const current = this.getCurrentUser();
    if (current && current.id === userId && updated) {
      this.setCurrentUser(updated);
    }
    return updated;
  },

  getStores(): Store[] {
    return getItem<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
  },

  saveStores(stores: Store[]) {
    setItem(STORAGE_KEYS.STORES, stores);
    try {
      stores.forEach((s) => SupabaseSync.syncStore(s));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  getStore(storeId: string): Store | undefined {
    return this.getStores().find((s) => s.id === storeId);
  },

  updateStore(updated: Store) {
    const stores = this.getStores().map((s) => (s.id === updated.id ? updated : s));
    this.saveStores(stores);
  },

  getDeletedUserIds(): string[] {
    return getItem<string[]>(STORAGE_KEYS.DELETED_USER_IDS, []);
  },

  addDeletedUserId(id: string) {
    const list = this.getDeletedUserIds();
    if (!list.includes(id)) {
      list.push(id);
      setItem(STORAGE_KEYS.DELETED_USER_IDS, list);
    }
  },

  getDeletedMedicineIds(): string[] {
    return getItem<string[]>(STORAGE_KEYS.DELETED_MEDICINE_IDS, []);
  },

  addDeletedMedicineId(id: string) {
    const list = this.getDeletedMedicineIds();
    if (!list.includes(id)) {
      list.push(id);
      setItem(STORAGE_KEYS.DELETED_MEDICINE_IDS, list);
    }
  },

  getProfiles(): UserProfile[] {
    const list = getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const deletedIds = this.getDeletedUserIds();
    return list
      .filter((p) => !deletedIds.includes(p.id))
      .map((p) => (p.password ? p : { ...p, password: '123456' }));
  },

  saveProfiles(profiles: UserProfile[]) {
    const deletedIds = this.getDeletedUserIds();
    const filtered = profiles.filter((p) => !deletedIds.includes(p.id));
    setItem(STORAGE_KEYS.PROFILES, filtered);
    try {
      filtered.forEach((p) => SupabaseSync.syncProfile(p));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  deleteProfile(userId: string) {
    this.addDeletedUserId(userId);
    const list = this.getProfiles().filter((p) => p.id !== userId);
    setItem(STORAGE_KEYS.PROFILES, list);
    const curr = this.getCurrentUser();
    if (curr?.id === userId) {
      this.setCurrentUser(null);
    }
    try {
      SupabaseSync.deleteProfile(userId);
    } catch (e) {
      console.warn('Delete profile error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  async deleteProfileAsync(userId: string): Promise<void> {
    this.addDeletedUserId(userId);
    const list = this.getProfiles().filter((p) => p.id !== userId);
    setItem(STORAGE_KEYS.PROFILES, list);
    const curr = this.getCurrentUser();
    if (curr?.id === userId) {
      this.setCurrentUser(null);
    }
    try {
      await SupabaseSync.deleteProfile(userId);
    } catch (e) {
      console.warn('Async delete profile error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  mergeCloudProfiles(cloudProfiles: UserProfile[]) {
    if (!cloudProfiles || cloudProfiles.length === 0) return;
    const deletedIds = this.getDeletedUserIds();
    const current = getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES)
      .filter((p) => !deletedIds.includes(p.id));
    const profMap = new Map<string, UserProfile>();
    current.forEach((p) => profMap.set(p.id, p));
    cloudProfiles
      .filter((cp) => !deletedIds.includes(cp.id))
      .forEach((cp) => {
        const existing = profMap.get(cp.id);
        profMap.set(cp.id, {
          ...(existing || {}),
          ...cp,
          password: existing?.password || cp.password || '123456',
        });
      });
    setItem(STORAGE_KEYS.PROFILES, Array.from(profMap.values()));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getMedicines(storeId?: string): Medicine[] {
    const list = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    const deletedMedIds = this.getDeletedMedicineIds();
    const activeList = list.filter((m) => !deletedMedIds.includes(m.id));
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id || 'store_main';
    
    // 1. Exact store match
    const matching = activeList.filter((m) => m.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;

    // 2. Fallback to main store or untagged medicines
    const fallback = activeList.filter((m) => !m.storeId || m.storeId === 'store_main');
    if (fallback.length > 0) return fallback;

    // 3. Complete catalogue fallback so visitor always sees store medicines
    return activeList;
  },

  getAllMedicinesAcrossStores(): Medicine[] {
    const list = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    const deletedMedIds = this.getDeletedMedicineIds();
    return list.filter((m) => !deletedMedIds.includes(m.id));
  },

  getAllOrdersAcrossStores(): Order[] {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return list.map((o) => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : [],
    }));
  },

  saveMedicines(medicines: Medicine[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id || 'store_main';
    const all = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    const otherStores = all.filter((m) => m.storeId && m.storeId !== effectiveStoreId);
    const tagged = medicines.map((m) => ({ ...m, storeId: m.storeId || effectiveStoreId }));
    const merged = [...tagged, ...otherStores];
    setItem(STORAGE_KEYS.MEDICINES, merged);
    try {
      tagged.forEach((m) => SupabaseSync.syncMedicine(m));
    } catch (e) {
      // Background sync non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  deleteMedicine(medicineId: string, storeId?: string) {
    this.addDeletedMedicineId(medicineId);
    const all = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
    const remaining = all.filter((m) => m.id !== medicineId);
    setItem(STORAGE_KEYS.MEDICINES, remaining);
    try {
      SupabaseSync.deleteMedicine(medicineId);
    } catch (e) {
      console.warn('Delete medicine error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  async deleteMedicineAsync(medicineId: string, storeId?: string): Promise<void> {
    this.addDeletedMedicineId(medicineId);
    const all = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
    const remaining = all.filter((m) => m.id !== medicineId);
    setItem(STORAGE_KEYS.MEDICINES, remaining);
    try {
      await SupabaseSync.deleteMedicine(medicineId);
    } catch (e) {
      console.warn('Delete medicine error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  mergeCloudMedicines(cloudMeds: Medicine[], storeId?: string) {
    if (!cloudMeds || cloudMeds.length === 0) return;
    const deletedMedIds = this.getDeletedMedicineIds();
    const current = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, []).filter((m) => !deletedMedIds.includes(m.id));
    const medMap = new Map<string, Medicine>();
    current.forEach((m) => medMap.set(m.id, m));
    cloudMeds
      .filter((m) => !deletedMedIds.includes(m.id))
      .forEach((m) => {
        const existing = medMap.get(m.id);
        medMap.set(m.id, {
          ...(existing || {}),
          ...m,
          storeId: m.storeId || existing?.storeId || storeId || 'store_main',
        });
      });
    const merged = Array.from(medMap.values());
    setItem(STORAGE_KEYS.MEDICINES, merged);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getCustomers(storeId?: string): Customer[] {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const cleaned = list.map((c) => ({
      ...c,
      sharedVisitorIds: Array.isArray(c.sharedVisitorIds) ? c.sharedVisitorIds : [],
    }));
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (!effectiveStoreId) return cleaned;
    const matching = cleaned.filter((c) => c.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;
    const fallback = cleaned.filter((c) => !c.storeId);
    return fallback.length > 0 ? fallback : cleaned;
  },

  saveCustomers(customers: Customer[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (effectiveStoreId) {
      const all = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
      const otherStores = all.filter((c) => c.storeId && c.storeId !== effectiveStoreId);
      const tagged = customers.map((c) => ({ ...c, storeId: c.storeId || effectiveStoreId }));
      const merged = [...tagged, ...otherStores];
      setItem(STORAGE_KEYS.CUSTOMERS, merged);
    } else {
      setItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
    try {
      customers.forEach((c) => SupabaseSync.syncCustomer(c));
    } catch (e) {
      // Background sync non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  deleteCustomer(customerId: string, storeId?: string) {
    const all = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const remaining = all.filter((c) => c.id !== customerId);
    setItem(STORAGE_KEYS.CUSTOMERS, remaining);
    try {
      SupabaseSync.deleteCustomer(customerId);
    } catch (e) {
      console.warn('Delete customer error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getOrders(storeId?: string): Order[] {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const cleaned = list.map((o) => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : [],
    }));
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (!effectiveStoreId) return cleaned;
    const matching = cleaned.filter((o) => o.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;
    const fallback = cleaned.filter((o) => !o.storeId);
    return fallback.length > 0 ? fallback : cleaned;
  },

  saveOrders(orders: Order[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (effectiveStoreId) {
      const all = getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
      const otherStores = all.filter((o) => o.storeId && o.storeId !== effectiveStoreId);
      const tagged = orders.map((o) => ({ ...o, storeId: o.storeId || effectiveStoreId }));
      const merged = [...tagged, ...otherStores];
      setItem(STORAGE_KEYS.ORDERS, merged);
    } else {
      setItem(STORAGE_KEYS.ORDERS, orders);
    }
    try {
      orders.forEach((o) => SupabaseSync.syncOrder(o));
    } catch (e) {
      // Background sync non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  deleteOrder(orderId: string, storeId?: string) {
    const all = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const remaining = all.filter((o) => o.id !== orderId);
    setItem(STORAGE_KEYS.ORDERS, remaining);
    try {
      SupabaseSync.deleteOrder(orderId);
    } catch (e) {
      console.warn('Delete order error:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  mergeCloudCustomers(cloudCusts: Customer[], storeId?: string) {
    if (!cloudCusts || cloudCusts.length === 0) return;
    const current = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const map = new Map<string, Customer>();
    current.forEach((c) => map.set(c.id, c));
    cloudCusts.forEach((c) => {
      const existing = map.get(c.id);
      map.set(c.id, { ...(existing || {}), ...c, storeId: c.storeId || existing?.storeId || storeId || '' });
    });
    setItem(STORAGE_KEYS.CUSTOMERS, Array.from(map.values()));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
  },

  mergeCloudOrders(cloudOrders: Order[], storeId?: string) {
    if (!cloudOrders || cloudOrders.length === 0) return;
    const current = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const map = new Map<string, Order>();
    current.forEach((o) => map.set(o.id, o));
    cloudOrders.forEach((o) => {
      const existing = map.get(o.id);
      map.set(o.id, { ...(existing || {}), ...o, storeId: o.storeId || existing?.storeId || storeId || '' });
    });
    setItem(STORAGE_KEYS.ORDERS, Array.from(map.values()));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
  },

  getVisits(storeId?: string): VisitRecord[] {
    const list = getItem<VisitRecord[]>(STORAGE_KEYS.VISITS, INITIAL_VISITS);
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (!effectiveStoreId) return list;
    const matching = list.filter((v) => v.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;
    const fallback = list.filter((v) => !v.storeId);
    return fallback.length > 0 ? fallback : list;
  },

  saveVisits(visits: VisitRecord[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (effectiveStoreId) {
      const all = getItem<VisitRecord[]>(STORAGE_KEYS.VISITS, INITIAL_VISITS);
      const otherStores = all.filter((v) => v.storeId && v.storeId !== effectiveStoreId);
      const tagged = visits.map((v) => ({ ...v, storeId: v.storeId || effectiveStoreId }));
      const merged = [...tagged, ...otherStores];
      setItem(STORAGE_KEYS.VISITS, merged);
    } else {
      setItem(STORAGE_KEYS.VISITS, visits);
    }
    try {
      visits.forEach((v) => SupabaseSync.syncVisit(v));
    } catch (e) {
      // Background sync non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getLedger(storeId?: string): VisitorLedgerEntry[] {
    const list = getItem<VisitorLedgerEntry[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
    // Strict separation: Visitor remittances of customer drug cash/deposits belong to store treasury,
    // NEVER to visitor personal salary or commission ledger. Filter out any legacy bogus records.
    const sanitized = list.filter(
      (l) => !l.id?.startsWith('led_rem_') && !l.title?.includes('واریزی صندوق ویزیتور')
    );
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (!effectiveStoreId) return sanitized;
    const matching = sanitized.filter((l) => l.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;
    const fallback = sanitized.filter((l) => !l.storeId);
    return fallback.length > 0 ? fallback : sanitized;
  },

  saveLedger(ledger: VisitorLedgerEntry[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    const sanitizedLedger = ledger.filter(
      (l) => !l.id?.startsWith('led_rem_') && !l.title?.includes('واریزی صندوق ویزیتور')
    );
    if (effectiveStoreId) {
      const all = getItem<VisitorLedgerEntry[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER).filter(
        (l) => !l.id?.startsWith('led_rem_') && !l.title?.includes('واریزی صندوق ویزیتور')
      );
      const otherStores = all.filter((l) => l.storeId && l.storeId !== effectiveStoreId);
      const tagged = sanitizedLedger.map((l) => ({ ...l, storeId: l.storeId || effectiveStoreId }));
      const merged = [...tagged, ...otherStores];
      setItem(STORAGE_KEYS.LEDGER, merged);
    } else {
      setItem(STORAGE_KEYS.LEDGER, ledger);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getConversations(storeId: string): Conversation[] {
    return getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS).filter(
      (c) => c.storeId === storeId
    );
  },

  saveConversations(convs: Conversation[]) {
    setItem(STORAGE_KEYS.CONVERSATIONS, convs);
  },

  getMessages(conversationId: string): Message[] {
    return getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES).filter(
      (m) => m.conversationId === conversationId
    );
  },

  addMessage(msg: Message, storeId?: string) {
    const msgs = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    msgs.push(msg);
    setItem(STORAGE_KEYS.MESSAGES, msgs);
    try {
      const activeStoreId = storeId || this.getCurrentUser()?.storeId || '';
      SupabaseSync.syncMessage(msg, activeStoreId);
    } catch (e) {
      // Non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  softDeleteMessage(messageId: string, storeId?: string): boolean {
    const msgs = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const targetIdx = msgs.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return false;

    const target = msgs[targetIdx];
    msgs[targetIdx] = {
      ...target,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      text: 'این پیام حذف شده است',
      imageUrl: undefined,
      orderDocAttachment: undefined,
    };
    setItem(STORAGE_KEYS.MESSAGES, msgs);

    const activeStoreId = storeId || this.getCurrentUser()?.storeId || '';
    if (activeStoreId) {
      const convs = this.getConversations(activeStoreId);
      const conv = convs.find((c) => c.id === target.conversationId);
      if (conv) {
        const convMsgs = msgs.filter((m) => m.conversationId === conv.id);
        if (convMsgs.length > 0) {
          const lastMsg = convMsgs[convMsgs.length - 1];
          conv.lastMessageText = lastMsg.isDeleted ? 'این پیام حذف شده است' : (lastMsg.text || 'تصویر پیوست شده');
          conv.lastMessageTime = lastMsg.createdAt;
          this.saveConversations(convs);
        }
      }
    }

    try {
      SupabaseSync.syncMessage(msgs[targetIdx], activeStoreId);
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
    return true;
  },

  mergeCloudMessages(cloudMsgs: Message[], storeId?: string) {
    if (!cloudMsgs || cloudMsgs.length === 0) return;
    const current = getItem<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const msgMap = new Map<string, Message>();
    current.forEach((m) => msgMap.set(m.id, m));
    cloudMsgs.forEach((m) => msgMap.set(m.id, m));
    const merged = Array.from(msgMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setItem(STORAGE_KEYS.MESSAGES, merged);

    if (storeId) {
      const convs = this.getConversations(storeId);
      let convsUpdated = false;
      convs.forEach((c) => {
        const convMsgs = merged.filter((m) => m.conversationId === c.id);
        if (convMsgs.length > 0) {
          const lastMsg = convMsgs[convMsgs.length - 1];
          if (c.lastMessageTime !== lastMsg.createdAt) {
            c.lastMessageText = lastMsg.text || (lastMsg.imageUrl ? 'تصویر پیوست شده' : 'پیام جدید');
            c.lastMessageTime = lastMsg.createdAt;
            convsUpdated = true;
          }
        }
      });
      if (convsUpdated) {
        this.saveConversations(convs);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getTotalUnreadMessagesCount(userId?: string, role?: string, storeId?: string): number {
    if (!storeId) return 0;
    try {
      const convs = this.getConversations(storeId);
      let count = 0;
      convs.forEach((c) => {
        if (role === 'visitor') {
          if (c.type === 'store_group' || (c.type === 'private' && c.visitorId === userId)) {
            count += c.unreadCount || 0;
          }
        } else {
          count += c.unreadCount || 0;
        }
      });
      return count;
    } catch {
      return 0;
    }
  },

  getSupportTickets(storeId?: string): SupportTicket[] {
    const tickets = getItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT, []);
    return storeId ? tickets.filter((t) => t.storeId === storeId) : tickets;
  },

  saveSupportTickets(tickets: SupportTicket[]) {
    setItem(STORAGE_KEYS.SUPPORT, tickets);
  },

  getCashCollections(storeId?: string): VisitorCashCollection[] {
    const list = getItem<VisitorCashCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (!effectiveStoreId) return list;
    const matching = list.filter((c) => c.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;
    const fallback = list.filter((c) => !c.storeId);
    return fallback.length > 0 ? fallback : list;
  },

  saveCashCollections(collections: VisitorCashCollection[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (effectiveStoreId) {
      const all = getItem<VisitorCashCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
      const otherStores = all.filter((c) => c.storeId && c.storeId !== effectiveStoreId);
      const tagged = collections.map((c) => ({ ...c, storeId: c.storeId || effectiveStoreId }));
      const merged = [...tagged, ...otherStores];
      setItem(STORAGE_KEYS.COLLECTIONS, merged);
    } else {
      setItem(STORAGE_KEYS.COLLECTIONS, collections);
    }
    try {
      collections.forEach((c) => SupabaseSync.syncCashCollection(c));
    } catch (e) {
      // Non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getRemittances(storeId?: string): VisitorRemittance[] {
    const list = getItem<VisitorRemittance[]>(STORAGE_KEYS.REMITTANCES, []);
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (!effectiveStoreId) return list;
    const matching = list.filter((r) => r.storeId === effectiveStoreId);
    if (matching.length > 0) return matching;
    const fallback = list.filter((r) => !r.storeId);
    return fallback.length > 0 ? fallback : list;
  },

  saveRemittances(remittances: VisitorRemittance[], storeId?: string) {
    const effectiveStoreId = storeId || this.getCurrentUser()?.storeId || this.getStores()[0]?.id;
    if (effectiveStoreId) {
      const all = getItem<VisitorRemittance[]>(STORAGE_KEYS.REMITTANCES, []);
      const otherStores = all.filter((r) => r.storeId && r.storeId !== effectiveStoreId);
      const tagged = remittances.map((r) => ({ ...r, storeId: r.storeId || effectiveStoreId }));
      const merged = [...tagged, ...otherStores];
      setItem(STORAGE_KEYS.REMITTANCES, merged);
    } else {
      setItem(STORAGE_KEYS.REMITTANCES, remittances);
    }
    try {
      remittances.forEach((r) => SupabaseSync.syncRemittance(r));
    } catch (e) {
      // Non-blocking
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  mergeCloudCollections(cloudCols: VisitorCashCollection[], storeId?: string) {
    if (!cloudCols || cloudCols.length === 0) return;
    const current = getItem<VisitorCashCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
    const map = new Map<string, VisitorCashCollection>();
    current.forEach((c) => map.set(c.id, c));
    cloudCols.forEach((c) => {
      const existing = map.get(c.id);
      map.set(c.id, { ...(existing || {}), ...c, storeId: c.storeId || existing?.storeId || storeId || '' });
    });
    setItem(STORAGE_KEYS.COLLECTIONS, Array.from(map.values()));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
  },

  mergeCloudRemittances(cloudRems: VisitorRemittance[], storeId?: string) {
    if (!cloudRems || cloudRems.length === 0) return;
    const current = getItem<VisitorRemittance[]>(STORAGE_KEYS.REMITTANCES, []);
    const map = new Map<string, VisitorRemittance>();
    current.forEach((r) => map.set(r.id, r));
    cloudRems.forEach((r) => {
      const existing = map.get(r.id);
      map.set(r.id, { ...(existing || {}), ...r, storeId: r.storeId || existing?.storeId || storeId || '' });
    });
    setItem(STORAGE_KEYS.REMITTANCES, Array.from(map.values()));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage'));
  },

  getConfig(): PlatformConfig {
    const saved = getItem<PlatformConfig>(STORAGE_KEYS.CONFIG, DEFAULT_PLATFORM_CONFIG);
    const merged = { ...DEFAULT_PLATFORM_CONFIG, ...saved };
    if (!Array.isArray(merged.supportFaqs) || merged.supportFaqs.length === 0) {
      merged.supportFaqs = INITIAL_SUPPORT_FAQS;
    }
    // Migrate legacy demo prices to requested initial prices (1700 AFN for 6 months, 3000 AFN for 1 year)
    if (merged.plan6MonthPriceAFN === 12000) {
      merged.plan6MonthPriceAFN = 1700;
    }
    if (merged.plan1YearPriceAFN === 20000) {
      merged.plan1YearPriceAFN = 3000;
    }
    return merged;
  },

  saveConfig(config: PlatformConfig) {
    setItem(STORAGE_KEYS.CONFIG, config);
    try {
      SupabaseSync.syncPlatformConfig(config);
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  mergeCloudPlatformConfig(cloudCfg: Partial<PlatformConfig>) {
    if (!cloudCfg) return;
    const current = this.getConfig();
    const merged: PlatformConfig = {
      ...current,
      ...cloudCfg,
      supportFaqs:
        Array.isArray(cloudCfg.supportFaqs) && cloudCfg.supportFaqs.length > 0
          ? cloudCfg.supportFaqs
          : current.supportFaqs,
    };
    setItem(STORAGE_KEYS.CONFIG, merged);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  touchUserActive(userId?: string) {
    try {
      const nowIso = new Date().toISOString();
      const current = this.getCurrentUser();
      const targetId = userId || current?.id;
      if (!targetId) return;

      const profiles = this.getProfiles();
      let updatedProfiles = false;
      const mapped = profiles.map((p) => {
        if (p.id === targetId) {
          updatedProfiles = true;
          return { ...p, lastActiveAt: nowIso };
        }
        return p;
      });

      if (updatedProfiles) {
        setItem(STORAGE_KEYS.PROFILES, mapped);
      }
      if (current && current.id === targetId) {
        setItem(STORAGE_KEYS.CURRENT_USER, { ...current, lastActiveAt: nowIso });
      }
    } catch {}
  },

  getNotes(userId?: string): PersonalNote[] {
    const list = getItem<PersonalNote[]>(STORAGE_KEYS.NOTES, []);
    if (!userId) return list;
    return list.filter((n) => n.userId === userId);
  },

  saveNotes(notes: PersonalNote[]) {
    setItem(STORAGE_KEYS.NOTES, notes);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  deleteNote(noteId: string) {
    const all = this.getNotes();
    const remaining = all.filter((n) => n.id !== noteId);
    this.saveNotes(remaining);
  },

  getEisenhowerTasks(userId?: string): EisenhowerTask[] {
    const list = getItem<EisenhowerTask[]>(STORAGE_KEYS.EISENHOWER, []);
    if (!userId) return list;
    return list.filter((t) => t.userId === userId);
  },

  saveEisenhowerTasks(tasks: EisenhowerTask[]) {
    setItem(STORAGE_KEYS.EISENHOWER, tasks);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  },

  getAppAnalytics(): AppAnalytics {
    const EVENTS_KEY = 'visitor_app_visit_events';
    const events = getItem<{ ts: number; mode: 'pwa' | 'browser' | 'guest' }[]>(EVENTS_KEY, []);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;
    const oneYear = 365 * oneDay;

    const daily = events.filter((e) => now - e.ts < oneDay).length;
    const weekly = events.filter((e) => now - e.ts < sevenDays).length;
    const monthly = events.filter((e) => now - e.ts < thirtyDays).length;
    const yearly = events.filter((e) => now - e.ts < oneYear).length;

    const pwaVisits = events.filter((e) => e.mode === 'pwa').length;
    const browserVisits = events.filter((e) => e.mode === 'browser').length;
    const guestVisits = events.filter((e) => e.mode === 'guest').length;

    const recordedInstalls = getItem<number>('visitor_app_installs_count', 0);
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
    const totalInstalls = Math.max(recordedInstalls, isStandalone ? 1 : 0);
    const activeInstalls7Days = events.filter((e) => e.mode === 'pwa' && now - e.ts < sevenDays).length;

    return {
      totalInstalls,
      activeInstalls7Days: Math.min(totalInstalls, activeInstalls7Days),
      visitsDaily: daily,
      visitsWeekly: weekly,
      visitsMonthly: monthly,
      visitsYearly: yearly,
      visitsInstalledPWA: pwaVisits,
      visitsWebBrowser: browserVisits,
      visitsGuestMode: guestVisits,
    };
  },

  recordAppVisit(mode: 'pwa' | 'browser' | 'guest') {
    try {
      const EVENTS_KEY = 'visitor_app_visit_events';
      const events = getItem<{ ts: number; mode: 'pwa' | 'browser' | 'guest' }[]>(EVENTS_KEY, []);
      events.push({ ts: Date.now(), mode });
      // Keep within 5000 recent events
      if (events.length > 5000) events.splice(0, events.length - 5000);
      setItem(EVENTS_KEY, events);

      const stats = this.getAppAnalytics();
      setItem(STORAGE_KEYS.ANALYTICS, stats);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}
  },

  recordAppInstall() {
    try {
      const count = getItem<number>('visitor_app_installs_count', 0) + 1;
      setItem('visitor_app_installs_count', count);
      this.recordAppVisit('pwa');
    } catch {}
  },

  getGuestSessions(): GuestSessionLog[] {
    return getItem<GuestSessionLog[]>(STORAGE_KEYS.GUEST_SESSIONS, []);
  },

  recordGuestSession(info: Partial<GuestSessionLog>): GuestSessionLog {
    try {
      const all = this.getGuestSessions();
      const now = new Date();
      let shamsiDateFormatted = '';
      try {
        shamsiDateFormatted = `${now.toLocaleDateString('fa-AF')} ${now.toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit' })}`;
      } catch {
        shamsiDateFormatted = now.toISOString();
      }

      const newSession: GuestSessionLog = {
        id: `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: now.toISOString(),
        deviceType: info.deviceType || 'mobile',
        os: info.os || 'نامشخص',
        browser: info.browser || 'مرورگر وب',
        screenWidth: info.screenWidth || 0,
        screenHeight: info.screenHeight || 0,
        viewportWidth: info.viewportWidth || 0,
        viewportHeight: info.viewportHeight || 0,
        pixelRatio: info.pixelRatio || 1,
        userAgent: info.userAgent || '',
        language: info.language || 'fa-AF',
        isStandalonePWA: info.isStandalonePWA ?? false,
        platform: info.platform || '',
        shamsiDateFormatted,
      };

      const updated = [newSession, ...all.slice(0, 999)];
      setItem(STORAGE_KEYS.GUEST_SESSIONS, updated);

      this.recordAppVisit('guest');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      try {
        (SupabaseSync as any).syncGuestSession?.(newSession);
      } catch {}

      return newSession;
    } catch (e) {
      console.warn('Error recording guest session:', e);
      return {
        id: `gs_${Date.now()}`,
        timestamp: new Date().toISOString(),
        deviceType: 'mobile',
        os: 'نامشخص',
        browser: 'مرورگر وب',
        screenWidth: 0,
        screenHeight: 0,
        viewportWidth: 0,
        viewportHeight: 0,
        pixelRatio: 1,
        userAgent: '',
        language: 'fa',
        isStandalonePWA: false,
      };
    }
  },

  deleteGuestSession(sessionId: string) {
    try {
      const all = this.getGuestSessions();
      const filtered = all.filter((s) => s.id !== sessionId);
      setItem(STORAGE_KEYS.GUEST_SESSIONS, filtered);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}
  },

  clearGuestSessions() {
    try {
      setItem(STORAGE_KEYS.GUEST_SESSIONS, []);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}
  },

  getGuestAnalyticsSummary(): GuestAnalyticsSummary {
    const sessions = this.getGuestSessions();
    const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    let pwaCount = 0;
    let webCount = 0;

    const uniqueDeviceKeys = new Set<string>();

    sessions.forEach((s) => {
      if (s.deviceType === 'mobile') deviceCounts.mobile++;
      else if (s.deviceType === 'tablet') deviceCounts.tablet++;
      else deviceCounts.desktop++;

      const fingerprint = `${s.os}_${s.browser}_${s.screenWidth}x${s.screenHeight}_${s.isStandalonePWA}`;
      uniqueDeviceKeys.add(fingerprint);

      const osKey = s.os || 'سایر';
      osCounts[osKey] = (osCounts[osKey] || 0) + 1;

      const bKey = s.browser || 'سایر';
      browserCounts[bKey] = (browserCounts[bKey] || 0) + 1;

      if (s.isStandalonePWA) pwaCount++;
      else webCount++;
    });

    return {
      totalSessions: sessions.length,
      uniqueDevices: uniqueDeviceKeys.size,
      deviceCounts,
      osCounts,
      browserCounts,
      pwaCount,
      webCount,
      lastSessionTime: sessions.length > 0 ? sessions[0].timestamp : undefined,
    };
  },

  seedDemoGuestData(targetStoreId: string = 'store_demo_guest') {
    try {
      const existingMeds = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
      const storeMeds = existingMeds.filter((m) => m.storeId === targetStoreId);
      if (storeMeds.length > 0) return; // already seeded

      const now = Date.now();
      const isoNow = new Date(now).toISOString();

      // 1. Visitors & Profiles
      const currentProfiles = this.getProfiles();
      const demoVisitors: UserProfile[] = [
        {
          id: 'visitor_demo_01',
          name: 'احمد فهیم رضایی',
          phone: '0781112233',
          username: 'visitor_fahim',
          password: '123',
          role: 'visitor',
          storeId: targetStoreId,
          city: 'کابل',
          avatarUrl: 'ا',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          isActive: true,
          baseSalary: 18000,
          commissionRate: 5,
          monthlyTarget: 350000,
          weeklyTarget: 87500,
          allowCashCollection: true,
        },
        {
          id: 'visitor_demo_02',
          name: 'بلال امینی',
          phone: '0782223344',
          username: 'visitor_bilal',
          password: '123',
          role: 'visitor',
          storeId: targetStoreId,
          city: 'کابل',
          avatarUrl: 'ب',
          createdAt: new Date(now - 25 * 86400000).toISOString(),
          isActive: true,
          baseSalary: 16000,
          commissionRate: 4.5,
          monthlyTarget: 280000,
          weeklyTarget: 70000,
          allowCashCollection: true,
        },
        {
          id: 'visitor_demo_03',
          name: 'مصطفی هروی',
          phone: '0783334455',
          username: 'visitor_mustafa',
          password: '123',
          role: 'visitor',
          storeId: targetStoreId,
          city: 'هرات',
          avatarUrl: 'م',
          createdAt: new Date(now - 20 * 86400000).toISOString(),
          isActive: true,
          baseSalary: 17500,
          commissionRate: 5,
          monthlyTarget: 320000,
          weeklyTarget: 80000,
          allowCashCollection: true,
        },
      ];

      const guestOwnerProfile: UserProfile = {
        id: 'guest_user_demo',
        name: 'کاربر مهمان',
        phone: '0700000000',
        username: 'guest_user',
        role: 'store_owner',
        storeId: targetStoreId,
        avatarUrl: 'م',
        city: 'کابل',
        createdAt: isoNow,
        isActive: true,
        isGuest: true,
      };

      const newProfiles = [
        ...currentProfiles.filter((p) => !p.id.startsWith('visitor_demo_') && p.id !== 'guest_user_demo'),
        guestOwnerProfile,
        ...demoVisitors,
      ];
      setItem(STORAGE_KEYS.PROFILES, newProfiles);

      // 2. Customers
      const demoCustomers: Customer[] = [
        {
          id: 'cust_demo_01',
          storeId: targetStoreId,
          name: 'دواخانه شفا کابل',
          managerName: 'دکتر جاوید احمدی',
          phone: '0799123456',
          address: 'چهارراهی انصاری، شهر نو',
          city: 'کابل',
          area: 'شهر نو',
          creditLimitAFN: 150000,
          createdBy: 'visitor_demo_01',
          primaryVisitorId: 'visitor_demo_01',
          sharedVisitorIds: ['visitor_demo_01'],
          status: 'active',
          totalOrdersCount: 6,
          totalOrderAmount: 184500,
          createdAt: new Date(now - 28 * 86400000).toISOString(),
        },
        {
          id: 'cust_demo_02',
          storeId: targetStoreId,
          name: 'دواخانه رحمانی',
          managerName: 'شفیق‌الله رحمانی',
          phone: '0788234567',
          address: 'کوته سنگی، جنب شفاخانه معالج',
          city: 'کابل',
          area: 'کوته سنگی',
          creditLimitAFN: 120000,
          createdBy: 'visitor_demo_02',
          primaryVisitorId: 'visitor_demo_02',
          sharedVisitorIds: ['visitor_demo_01', 'visitor_demo_02'],
          status: 'active',
          totalOrdersCount: 4,
          totalOrderAmount: 96000,
          createdAt: new Date(now - 25 * 86400000).toISOString(),
        },
        {
          id: 'cust_demo_03',
          storeId: targetStoreId,
          name: 'دواخانه امید آریا',
          managerName: 'دکتر ضیاء حبیبی',
          phone: '0777345678',
          address: 'ده افغانان، روبروی وزارت عدلیه سابق',
          city: 'کابل',
          area: 'مرکز شهر',
          creditLimitAFN: 200000,
          createdBy: 'visitor_demo_02',
          primaryVisitorId: 'visitor_demo_02',
          sharedVisitorIds: ['visitor_demo_02'],
          status: 'active',
          totalOrdersCount: 5,
          totalOrderAmount: 145000,
          createdAt: new Date(now - 22 * 86400000).toISOString(),
        },
        {
          id: 'cust_demo_04',
          storeId: targetStoreId,
          name: 'دواخانه سینا هرات',
          managerName: 'فاروق هروی',
          phone: '0700456789',
          address: 'چوک گلها، ابتدای جاده بهزاد',
          city: 'هرات',
          area: 'مرکز هرات',
          creditLimitAFN: 180000,
          createdBy: 'visitor_demo_03',
          primaryVisitorId: 'visitor_demo_03',
          sharedVisitorIds: ['visitor_demo_03'],
          status: 'active',
          totalOrdersCount: 5,
          totalOrderAmount: 162000,
          createdAt: new Date(now - 20 * 86400000).toISOString(),
        },
        {
          id: 'cust_demo_05',
          storeId: targetStoreId,
          name: 'دواخانه ستاره بلخ',
          managerName: 'عبدالحلیم بلخی',
          phone: '0744567890',
          address: 'میدان کامگار، جاده شفاخانه',
          city: 'مزارشریف',
          area: 'میدان کامگار',
          creditLimitAFN: 100000,
          createdBy: 'visitor_demo_01',
          primaryVisitorId: 'visitor_demo_01',
          sharedVisitorIds: ['visitor_demo_01'],
          status: 'active',
          totalOrdersCount: 3,
          totalOrderAmount: 58000,
          createdAt: new Date(now - 18 * 86400000).toISOString(),
        },
        {
          id: 'cust_demo_06',
          storeId: targetStoreId,
          name: 'دواخانه ملت خیرخانه',
          managerName: 'دکتر صمیم نوری',
          phone: '0781239876',
          address: 'سرک ۵، خیرخانه، جنب مارکت بهار',
          city: 'کابل',
          area: 'خیرخانه',
          creditLimitAFN: 160000,
          createdBy: 'visitor_demo_02',
          primaryVisitorId: 'visitor_demo_02',
          sharedVisitorIds: ['visitor_demo_02'],
          status: 'active',
          totalOrdersCount: 4,
          totalOrderAmount: 89000,
          createdAt: new Date(now - 15 * 86400000).toISOString(),
        },
      ];
      const existingCusts = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
      setItem(STORAGE_KEYS.CUSTOMERS, [
        ...existingCusts.filter((c) => c.storeId !== targetStoreId),
        ...demoCustomers,
      ]);

      // 3. Medicines
      const demoMedicines: Medicine[] = [
        {
          id: 'med_demo_01',
          storeId: targetStoreId,
          name: 'استامینوفن ۵۰۰ (Paracetamol)',
          brand: 'Glaxo',
          dosageForm: 'قرص',
          strength: '500mg',
          code: 'MED-101',
          unit: 'بسته ۱۰۰ عددی',
          purchasePrice: 65,
          salePrice: 85,
          stock: 1250,
          minStockAlert: 200,
          category: 'مسکن و تب‌بر',
          expiryDate: new Date(now + 380 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-8891',
          shortDescription: 'مسکن تب‌بر و ضد درد سریع‌الاثر',
          fullDescription: 'دارای تاییدیه وزارت صحت عامه افغانستان',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_02',
          storeId: targetStoreId,
          name: 'کپسول آموکسی‌سیلین ۵۰۰ (Amoxicillin)',
          brand: 'Ajanta',
          dosageForm: 'کپسول',
          strength: '500mg',
          code: 'MED-102',
          unit: 'بسته ۱۰۰ عددی',
          purchasePrice: 110,
          salePrice: 140,
          stock: 840,
          minStockAlert: 150,
          category: 'آنتی‌بیوتیک خوراکی',
          expiryDate: new Date(now + 420 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-9022',
          shortDescription: 'آنتی‌بیوتیک وسیع‌الطیف تنفسی و عمومی',
          fullDescription: 'مناسب برای عفونت‌های باکتریایی',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_03',
          storeId: targetStoreId,
          name: 'ویال تزریقی سفتریاکسون ۱ گرام (Ceftriaxone)',
          brand: 'Rocephin',
          dosageForm: 'ویال تزریقی',
          strength: '1g',
          code: 'MED-103',
          unit: 'قطی ۱۰ ویالی',
          purchasePrice: 150,
          salePrice: 190,
          stock: 320,
          minStockAlert: 80,
          category: 'آنتی‌بیوتیک تزریقی',
          expiryDate: new Date(now + 290 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-7741',
          shortDescription: 'آنتی‌بیوتیک تزریقی وریدی و عضلانی',
          fullDescription: 'کیفیت بالا بیمارستانی',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_04',
          storeId: targetStoreId,
          name: 'قرص آزیترومایسین ۲۵۰ (Azithromycin)',
          brand: 'Zithromax',
          dosageForm: 'قرص',
          strength: '250mg',
          code: 'MED-104',
          unit: 'جعبه ۶ عددی',
          purchasePrice: 175,
          salePrice: 220,
          stock: 450,
          minStockAlert: 100,
          category: 'آنتی‌بیوتیک خوراکی',
          expiryDate: new Date(now + 500 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-9140',
          shortDescription: 'دوره کوتاه درمانی عفونت‌های سینه و ریه',
          fullDescription: 'تولید بین‌المللی',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_05',
          storeId: targetStoreId,
          name: 'قرص بروفن ۴۰۰ (Ibuprofen)',
          brand: 'Brufen',
          dosageForm: 'قرص',
          strength: '400mg',
          code: 'MED-105',
          unit: 'بسته ۱۰۰ عددی',
          purchasePrice: 70,
          salePrice: 95,
          stock: 980,
          minStockAlert: 180,
          category: 'مسکن و ضدالتهاب',
          expiryDate: new Date(now + 340 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-6632',
          shortDescription: 'ضد درد و ضدالتهاب مفاصل و دندان',
          fullDescription: 'بسیار پرمصرف و پرتقاضا',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_06',
          storeId: targetStoreId,
          name: 'کپسول امپرازول ۲۰ (Omeprazole)',
          brand: 'Omez',
          dosageForm: 'کپسول',
          strength: '20mg',
          code: 'MED-106',
          unit: 'جعبه ۳۰ عددی',
          purchasePrice: 98,
          salePrice: 130,
          stock: 720,
          minStockAlert: 120,
          category: 'گوارشی',
          expiryDate: new Date(now + 410 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-5521',
          shortDescription: 'مهارکننده اسید معده و درمان زخم گوارشی',
          fullDescription: 'پرمصرف‌ترین دوای گوارشی',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_07',
          storeId: targetStoreId,
          name: 'قرص متفورمین ۵۰۰ (Metformin)',
          brand: 'Glucophage',
          dosageForm: 'قرص',
          strength: '500mg',
          code: 'MED-107',
          unit: 'بسته ۱۰۰ عددی',
          purchasePrice: 82,
          salePrice: 110,
          stock: 610,
          minStockAlert: 100,
          category: 'تنظیم قند و دیابت',
          expiryDate: new Date(now + 360 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-4410',
          shortDescription: 'کنترل قند خون در بیماران دیابت نوع ۲',
          fullDescription: 'استاندارد جهانی کنترل قند',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'med_demo_08',
          storeId: targetStoreId,
          name: 'شربت مولتی‌ویتامین و زینک (Multivitamin Syrup)',
          brand: 'Vitane',
          dosageForm: 'شربت',
          strength: '200ml',
          code: 'MED-108',
          unit: 'شیشه',
          purchasePrice: 130,
          salePrice: 175,
          stock: 240,
          minStockAlert: 90,
          category: 'تقویتی و ویتامین',
          expiryDate: new Date(now + 210 * 86400000).toISOString().slice(0, 10),
          batchNumber: 'BT-3329',
          shortDescription: 'تقویت سیستم ایمنی و رشد اطفال و نوجوانان',
          fullDescription: 'طعم دلپذیر همراه با زینک',
          images: [],
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
      ];
      const existingMedsAll = getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
      setItem(STORAGE_KEYS.MEDICINES, [
        ...existingMedsAll.filter((m) => m.storeId !== targetStoreId),
        ...demoMedicines,
      ]);

      // 4. Orders across last 10 days
      const demoOrders: Order[] = [
        {
          id: 'ord_demo_01',
          orderNumber: 'ORD-1091',
          storeId: targetStoreId,
          customerId: 'cust_demo_01',
          customerName: 'دواخانه شفا کابل',
          visitorId: 'visitor_demo_01',
          visitorName: 'احمد فهیم رضایی',
          items: [
            { id: 'item_1', medicineId: 'med_demo_01', medicineName: 'استامینوفن ۵۰۰ (Paracetamol)', unit: 'بسته ۱۰۰ عددی', quantity: 100, unitPrice: 85, discountAFN: 0, totalAFN: 8500 },
            { id: 'item_2', medicineId: 'med_demo_02', medicineName: 'کپسول آموکسی‌سیلین ۵۰۰ (Amoxicillin)', unit: 'بسته ۱۰۰ عددی', quantity: 100, unitPrice: 140, discountAFN: 0, totalAFN: 14000 },
            { id: 'item_3', medicineId: 'med_demo_05', medicineName: 'قرص بروفن ۴۰۰ (Ibuprofen)', unit: 'بسته ۱۰۰ عددی', quantity: 100, unitPrice: 95, discountAFN: 0, totalAFN: 9500 },
          ],
          subtotalAFN: 32000,
          discountAFN: 0,
          totalAFN: 32000,
          paidAmountAFN: 32000,
          remainingAmountAFN: 0,
          status: 'preparing',
          paymentStatus: 'paid',
          notes: 'تسویه کامل نقدی، تحویل فوری صبح',
          history: [],
          payments: [{ id: 'p_1', amountAFN: 32000, date: isoNow, registeredBy: 'visitor_demo_01', receiptNumber: 'REC-551' }],
          createdAt: new Date(now - 0.2 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_02',
          orderNumber: 'ORD-1090',
          storeId: targetStoreId,
          customerId: 'cust_demo_02',
          customerName: 'دواخانه رحمانی',
          visitorId: 'visitor_demo_02',
          visitorName: 'بلال امینی',
          items: [
            { id: 'item_4', medicineId: 'med_demo_03', medicineName: 'ویال تزریقی سفتریاکسون ۱ گرام (Ceftriaxone)', unit: 'قطی ۱۰ ویالی', quantity: 80, unitPrice: 190, discountAFN: 0, totalAFN: 15200 },
            { id: 'item_5', medicineId: 'med_demo_06', medicineName: 'کپسول امپرازول ۲۰ (Omeprazole)', unit: 'جعبه ۳۰ عددی', quantity: 60, unitPrice: 130, discountAFN: 0, totalAFN: 7800 },
          ],
          subtotalAFN: 23000,
          discountAFN: 0,
          totalAFN: 23000,
          paidAmountAFN: 15000,
          remainingAmountAFN: 8000,
          status: 'shipped',
          paymentStatus: 'partial',
          notes: 'ارسال با موتر باربری فروشگاه',
          history: [],
          payments: [{ id: 'p_2', amountAFN: 15000, date: new Date(now - 1 * 86400000).toISOString(), registeredBy: 'visitor_demo_02' }],
          createdAt: new Date(now - 1 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_03',
          orderNumber: 'ORD-1089',
          storeId: targetStoreId,
          customerId: 'cust_demo_03',
          customerName: 'دواخانه امید آریا',
          visitorId: 'visitor_demo_02',
          visitorName: 'بلال امینی',
          items: [
            { id: 'item_6', medicineId: 'med_demo_04', medicineName: 'قرص آزیترومایسین ۲۵۰ (Azithromycin)', unit: 'جعبه ۶ عددی', quantity: 120, unitPrice: 220, discountAFN: 0, totalAFN: 26400 },
            { id: 'item_7', medicineId: 'med_demo_07', medicineName: 'قرص متفورمین ۵۰۰ (Metformin)', unit: 'بسته ۱۰۰ عددی', quantity: 150, unitPrice: 110, discountAFN: 0, totalAFN: 16500 },
          ],
          subtotalAFN: 42900,
          discountAFN: 0,
          totalAFN: 42900,
          paidAmountAFN: 42900,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'تحویل داده شد و فیش بانکی دریافت گردید',
          history: [],
          payments: [{ id: 'p_3', amountAFN: 42900, date: new Date(now - 2 * 86400000).toISOString(), registeredBy: 'visitor_demo_02' }],
          createdAt: new Date(now - 2 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_04',
          orderNumber: 'ORD-1088',
          storeId: targetStoreId,
          customerId: 'cust_demo_04',
          customerName: 'دواخانه سینا هرات',
          visitorId: 'visitor_demo_03',
          visitorName: 'مصطفی هروی',
          items: [
            { id: 'item_8', medicineId: 'med_demo_08', medicineName: 'شربت مولتی‌ویتامین و زینک (Multivitamin Syrup)', unit: 'شیشه', quantity: 100, unitPrice: 175, discountAFN: 0, totalAFN: 17500 },
            { id: 'item_9', medicineId: 'med_demo_02', medicineName: 'کپسول آموکسی‌سیلین ۵۰۰ (Amoxicillin)', unit: 'بسته ۱۰۰ عددی', quantity: 150, unitPrice: 140, discountAFN: 0, totalAFN: 21000 },
          ],
          subtotalAFN: 38500,
          discountAFN: 0,
          totalAFN: 38500,
          paidAmountAFN: 38500,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'حواله صرافی کابل - هرات واریز شد',
          history: [],
          payments: [{ id: 'p_4', amountAFN: 38500, date: new Date(now - 3 * 86400000).toISOString(), registeredBy: 'visitor_demo_03' }],
          createdAt: new Date(now - 3 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_05',
          orderNumber: 'ORD-1087',
          storeId: targetStoreId,
          customerId: 'cust_demo_06',
          customerName: 'دواخانه ملت خیرخانه',
          visitorId: 'visitor_demo_01',
          visitorName: 'احمد فهیم رضایی',
          items: [
            { id: 'item_10', medicineId: 'med_demo_01', medicineName: 'استامینوفن ۵۰۰ (Paracetamol)', unit: 'بسته ۱۰۰ عددی', quantity: 120, unitPrice: 85, discountAFN: 0, totalAFN: 10200 },
            { id: 'item_11', medicineId: 'med_demo_05', medicineName: 'قرص بروفن ۴۰۰ (Ibuprofen)', unit: 'بسته ۱۰۰ عددی', quantity: 90, unitPrice: 95, discountAFN: 0, totalAFN: 8550 },
          ],
          subtotalAFN: 18750,
          discountAFN: 0,
          totalAFN: 18750,
          paidAmountAFN: 10000,
          remainingAmountAFN: 8750,
          status: 'delivered',
          paymentStatus: 'partial',
          notes: 'بیعانه نقد پرداخت شد',
          history: [],
          payments: [{ id: 'p_5', amountAFN: 10000, date: new Date(now - 4 * 86400000).toISOString(), registeredBy: 'visitor_demo_01' }],
          createdAt: new Date(now - 4 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_06',
          orderNumber: 'ORD-1086',
          storeId: targetStoreId,
          customerId: 'cust_demo_01',
          customerName: 'دواخانه شفا کابل',
          visitorId: 'visitor_demo_01',
          visitorName: 'احمد فهیم رضایی',
          items: [
            { id: 'item_12', medicineId: 'med_demo_03', medicineName: 'ویال تزریقی سفتریاکسون ۱ گرام (Ceftriaxone)', unit: 'قطی ۱۰ ویالی', quantity: 110, unitPrice: 190, discountAFN: 0, totalAFN: 20900 },
            { id: 'item_13', medicineId: 'med_demo_06', medicineName: 'کپسول امپرازول ۲۰ (Omeprazole)', unit: 'جعبه ۳۰ عددی', quantity: 70, unitPrice: 130, discountAFN: 0, totalAFN: 9100 },
          ],
          subtotalAFN: 30000,
          discountAFN: 0,
          totalAFN: 30000,
          paidAmountAFN: 30000,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'تحویل شد',
          history: [],
          payments: [{ id: 'p_6', amountAFN: 30000, date: new Date(now - 5 * 86400000).toISOString(), registeredBy: 'visitor_demo_01' }],
          createdAt: new Date(now - 5 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_07',
          orderNumber: 'ORD-1085',
          storeId: targetStoreId,
          customerId: 'cust_demo_05',
          customerName: 'دواخانه ستاره بلخ',
          visitorId: 'visitor_demo_01',
          visitorName: 'احمد فهیم رضایی',
          items: [
            { id: 'item_14', medicineId: 'med_demo_07', medicineName: 'قرص متفورمین ۵۰۰ (Metformin)', unit: 'بسته ۱۰۰ عددی', quantity: 140, unitPrice: 110, discountAFN: 0, totalAFN: 15400 },
          ],
          subtotalAFN: 15400,
          discountAFN: 0,
          totalAFN: 15400,
          paidAmountAFN: 15400,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'تسویه نقد',
          history: [],
          payments: [{ id: 'p_7', amountAFN: 15400, date: new Date(now - 6 * 86400000).toISOString(), registeredBy: 'visitor_demo_01' }],
          createdAt: new Date(now - 6 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_08',
          orderNumber: 'ORD-1084',
          storeId: targetStoreId,
          customerId: 'cust_demo_02',
          customerName: 'دواخانه رحمانی',
          visitorId: 'visitor_demo_02',
          visitorName: 'بلال امینی',
          items: [
            { id: 'item_15', medicineId: 'med_demo_02', medicineName: 'کپسول آموکسی‌سیلین ۵۰۰ (Amoxicillin)', unit: 'بسته ۱۰۰ عددی', quantity: 160, unitPrice: 140, discountAFN: 0, totalAFN: 22400 },
          ],
          subtotalAFN: 22400,
          discountAFN: 0,
          totalAFN: 22400,
          paidAmountAFN: 22400,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'تحویل شد',
          history: [],
          payments: [{ id: 'p_8', amountAFN: 22400, date: new Date(now - 7 * 86400000).toISOString(), registeredBy: 'visitor_demo_02' }],
          createdAt: new Date(now - 7 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_09',
          orderNumber: 'ORD-1083',
          storeId: targetStoreId,
          customerId: 'cust_demo_04',
          customerName: 'دواخانه سینا هرات',
          visitorId: 'visitor_demo_03',
          visitorName: 'مصطفی هروی',
          items: [
            { id: 'item_16', medicineId: 'med_demo_04', medicineName: 'قرص آزیترومایسین ۲۵۰ (Azithromycin)', unit: 'جعبه ۶ عددی', quantity: 110, unitPrice: 220, discountAFN: 0, totalAFN: 24200 },
            { id: 'item_17', medicineId: 'med_demo_08', medicineName: 'شربت مولتی‌ویتامین و زینک (Multivitamin Syrup)', unit: 'شیشه', quantity: 95, unitPrice: 175, discountAFN: 0, totalAFN: 16625 },
          ],
          subtotalAFN: 40825,
          discountAFN: 0,
          totalAFN: 40825,
          paidAmountAFN: 40825,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'ارسال با باربری',
          history: [],
          payments: [{ id: 'p_9', amountAFN: 40825, date: new Date(now - 8 * 86400000).toISOString(), registeredBy: 'visitor_demo_03' }],
          createdAt: new Date(now - 8 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
        {
          id: 'ord_demo_10',
          orderNumber: 'ORD-1082',
          storeId: targetStoreId,
          customerId: 'cust_demo_03',
          customerName: 'دواخانه امید آریا',
          visitorId: 'visitor_demo_02',
          visitorName: 'بلال امینی',
          items: [
            { id: 'item_18', medicineId: 'med_demo_01', medicineName: 'استامینوفن ۵۰۰ (Paracetamol)', unit: 'بسته ۱۰۰ عددی', quantity: 180, unitPrice: 85, discountAFN: 0, totalAFN: 15300 },
            { id: 'item_19', medicineId: 'med_demo_05', medicineName: 'قرص بروفن ۴۰۰ (Ibuprofen)', unit: 'بسته ۱۰۰ عددی', quantity: 170, unitPrice: 95, discountAFN: 0, totalAFN: 16150 },
          ],
          subtotalAFN: 31450,
          discountAFN: 0,
          totalAFN: 31450,
          paidAmountAFN: 31450,
          remainingAmountAFN: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          notes: 'تسویه کامل',
          history: [],
          payments: [{ id: 'p_10', amountAFN: 31450, date: new Date(now - 9 * 86400000).toISOString(), registeredBy: 'visitor_demo_02' }],
          createdAt: new Date(now - 9 * 86400000).toISOString(),
          updatedAt: isoNow,
        },
      ];
      const existingOrdersAll = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
      setItem(STORAGE_KEYS.ORDERS, [
        ...existingOrdersAll.filter((o) => o.storeId !== targetStoreId),
        ...demoOrders,
      ]);

      // 5. Visits
      const demoVisits: VisitRecord[] = [
        {
          id: 'visit_demo_01',
          storeId: targetStoreId,
          visitorId: 'visitor_demo_01',
          visitorName: 'احمد فهیم رضایی',
          customerId: 'cust_demo_01',
          customerName: 'دواخانه شفا کابل',
          scheduledTime: new Date(now + 2 * 3600000).toISOString(),
          status: 'scheduled',
          outcome: 'order_placed',
          orderId: 'ord_demo_01',
        },
        {
          id: 'visit_demo_02',
          storeId: targetStoreId,
          visitorId: 'visitor_demo_02',
          visitorName: 'بلال امینی',
          customerId: 'cust_demo_02',
          customerName: 'دواخانه رحمانی',
          scheduledTime: new Date(now - 18 * 3600000).toISOString(),
          completedTime: new Date(now - 17 * 3600000).toISOString(),
          status: 'completed',
          outcome: 'order_placed',
          orderId: 'ord_demo_02',
        },
        {
          id: 'visit_demo_03',
          storeId: targetStoreId,
          visitorId: 'visitor_demo_03',
          visitorName: 'مصطفی هروی',
          customerId: 'cust_demo_04',
          customerName: 'دواخانه سینا هرات',
          scheduledTime: new Date(now - 48 * 3600000).toISOString(),
          completedTime: new Date(now - 47 * 3600000).toISOString(),
          status: 'completed',
          outcome: 'order_placed',
          orderId: 'ord_demo_04',
        },
      ];
      const existingVisits = getItem<VisitRecord[]>(STORAGE_KEYS.VISITS, []);
      setItem(STORAGE_KEYS.VISITS, [
        ...existingVisits.filter((v) => v.storeId !== targetStoreId),
        ...demoVisits,
      ]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('seedDemoGuestData error:', e);
    }
  },

  resetAllData() {
    // Preserve maker_admin user profile with current password and credentials
    const currentProfiles = this.getProfiles();
    const makerAdmin = currentProfiles.find((p) => p.role === 'maker_admin') || INITIAL_PROFILES[0];
    setItem(STORAGE_KEYS.PROFILES, [makerAdmin]);
    setItem(STORAGE_KEYS.STORES, []);
    setItem(STORAGE_KEYS.MEDICINES, []);
    setItem(STORAGE_KEYS.CUSTOMERS, []);
    setItem(STORAGE_KEYS.ORDERS, []);
    setItem(STORAGE_KEYS.VISITS, []);
    setItem(STORAGE_KEYS.LEDGER, []);
    setItem(STORAGE_KEYS.CONVERSATIONS, []);
    setItem(STORAGE_KEYS.MESSAGES, []);
    setItem(STORAGE_KEYS.SUPPORT, []);
    setItem(STORAGE_KEYS.MOVEMENTS, []);
    setItem(STORAGE_KEYS.COLLECTIONS, []);
    setItem(STORAGE_KEYS.REMITTANCES, []);
    const currentUser = this.getCurrentUser();
    if (currentUser?.role === 'maker_admin') {
      this.setCurrentUser(makerAdmin);
    }
  },
};

// Initialize default storage immediately on load
if (typeof window !== 'undefined') {
  try {
    Storage.init();
  } catch (e) {
    console.error('Storage synchronous init failed', e);
  }
}

/**
 * Universal store ID resolution helper ensuring stores, visitors, and messages always share the same ID.
 */
export function getEffectiveStoreId(user?: UserProfile | null, store?: Store | null): string {
  if (store?.id) return store.id;
  if (user?.storeId) return user.storeId;
  const localUser = Storage.getCurrentUser();
  if (localUser?.storeId) return localUser.storeId;
  const localStores = Storage.getStores();
  if (localStores && localStores.length > 0 && localStores[0].id) {
    return localStores[0].id;
  }
  return 'store_main';
}


