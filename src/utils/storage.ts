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
  PlatformConfig,
  InventoryMovement,
} from '../types';
import { SupabaseSync } from './supabaseSync';

const STORAGE_KEYS = {
  CURRENT_USER: 'visitor_app_current_user',
  STORES: 'visitor_app_stores',
  PROFILES: 'visitor_app_profiles',
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
};

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
  supportFaqs: [],
  notifications: [
    {
      id: 'notif_init_01',
      title: 'خوش‌آمدید به سامانه ویزیتور دارو',
      message: 'نسخه جدید ۲.۴ با موتور چاپ فاکتورهای رسمی، امکان گفتگوی زنده با پشتیبانی، رمزنگاری و ثبت آفلاین سفارش‌ها هم‌اکنون فعال است.',
      type: 'feature',
      createdAt: new Date().toISOString(),
      isImportant: true,
    },
  ],
  customTexts: {},
  updatedAt: new Date().toISOString(),
  version: 1,
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

  getProfiles(): UserProfile[] {
    const list = getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    return list.map((p) => (p.password ? p : { ...p, password: '123456' }));
  },

  saveProfiles(profiles: UserProfile[]) {
    setItem(STORAGE_KEYS.PROFILES, profiles);
    try {
      profiles.forEach((p) => SupabaseSync.syncProfile(p));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  getMedicines(storeId: string): Medicine[] {
    return getItem<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES).filter(
      (m) => m.storeId === storeId
    );
  },

  saveMedicines(medicines: Medicine[]) {
    setItem(STORAGE_KEYS.MEDICINES, medicines);
    try {
      medicines.forEach((m) => SupabaseSync.syncMedicine(m));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  getCustomers(storeId: string): Customer[] {
    const list = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    return list
      .map((c) => ({
        ...c,
        sharedVisitorIds: Array.isArray(c.sharedVisitorIds) ? c.sharedVisitorIds : [],
      }))
      .filter((c) => c.storeId === storeId);
  },

  saveCustomers(customers: Customer[]) {
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    try {
      customers.forEach((c) => SupabaseSync.syncCustomer(c));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  getOrders(storeId: string): Order[] {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return list
      .map((o) => ({
        ...o,
        items: Array.isArray(o.items) ? o.items : [],
      }))
      .filter((o) => o.storeId === storeId);
  },

  saveOrders(orders: Order[]) {
    setItem(STORAGE_KEYS.ORDERS, orders);
    try {
      orders.forEach((o) => SupabaseSync.syncOrder(o));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  getVisits(storeId: string): VisitRecord[] {
    return getItem<VisitRecord[]>(STORAGE_KEYS.VISITS, INITIAL_VISITS).filter(
      (v) => v.storeId === storeId
    );
  },

  saveVisits(visits: VisitRecord[]) {
    setItem(STORAGE_KEYS.VISITS, visits);
    try {
      visits.forEach((v) => SupabaseSync.syncVisit(v));
    } catch (e) {
      // Background sync non-blocking
    }
  },

  getLedger(storeId: string): VisitorLedgerEntry[] {
    return getItem<VisitorLedgerEntry[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER).filter(
      (l) => l.storeId === storeId
    );
  },

  saveLedger(ledger: VisitorLedgerEntry[]) {
    setItem(STORAGE_KEYS.LEDGER, ledger);
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

  getConfig(): PlatformConfig {
    const saved = getItem<PlatformConfig>(STORAGE_KEYS.CONFIG, DEFAULT_PLATFORM_CONFIG);
    const merged = { ...DEFAULT_PLATFORM_CONFIG, ...saved };
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

