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
};

export const INITIAL_SUPPORT_FAQS: SupportFaq[] = [
  {
    id: 'faq_01',
    question: 'چگونه داروی جدید به انبار و کاتالوگ فروشگاه اضافه کنم؟',
    answer: 'از منوی «داروها و انبار» روی دکمه «افزودن داروی جدید» کلیک کنید. نام، کد، دوز، تاریخ انقضا، موجودی انبار و قیمت فروش را وارد نموده و عکس دارو را بارگذاری نمایید تا فوراً با تمام ویزیتورها همگام‌سازی شود.',
    isActive: true,
    order: 1,
  },
  {
    id: 'faq_02',
    question: 'ویزیتور چگونه سفارش، فاکتور و بیعانه ثبت می‌کند؟',
    answer: 'ویزیتور از منوی «کاتالوگ و صدور فاکتور»، داروهای مورد نظر را جستجو و به سبد خرید اضافه می‌کند، داروخانه را انتخاب کرده و در صورت دریافت وجه، نوع تسویه (بیعانه، نقد یا حواله) را درج و فاکتور نهایی را صادر می‌نماید.',
    isActive: true,
    order: 2,
  },
  {
    id: 'faq_03',
    question: 'آیا ویزیتورها می‌توانند وجه یا بیعانه از داروخانه‌ها تحویل بگیرند؟',
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
  shortDescription: 'پنل ویزیتور دارو',
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
    'سلام و وقت بخیر! به واحد پشتیبانی آنلاین سامانه ویزیتور دارو خوش آمدید. پیام، سؤال یا تصویر مشکل خود را ارسال نمایید تا در اسرع وقت رسیدگی شود.',
  supportFaqs: INITIAL_SUPPORT_FAQS,
  notifications: [
    {
      id: 'notif_init_01',
      title: 'خوش‌آمدید به سامانه ویزیتور دارو',
      message: 'نسخه جدید ۲.۵ با موتور هماهنگ‌سازی ابری داروها، پیام‌ها و کاتالوگ آنلاین هم‌اکنون فعال است.',
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
  appUpdateNotes: 'همگام‌سازی کامل داروها، پیام‌ها، مدیریت پیشرفته کاربران و پرسش‌های متداول',
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
    if (!user) return null;
    // Keep synchronized with PROFILES in case name, avatar or other details were updated
    const profiles = this.getProfiles();
    const fresh = profiles.find((p) => p.id === user.id);
    return fresh || user;
  },

  setCurrentUser(user: UserProfile | null) {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
    if (user && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('visitor_app_logged_out');
        localStorage.removeItem('visitor_app_is_guest');
      } catch {}
    }
  },

  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    const profiles = this.getProfiles().map((p) =>
      p.id === userId ? { ...p, ...updates } : p
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


