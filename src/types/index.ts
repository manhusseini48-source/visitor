export type UserRole = 'store_owner' | 'visitor' | 'maker_admin' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  username: string;
  password?: string;
  role: UserRole;
  storeId?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  createdAt: string;
  lastActiveAt?: string;
  isActive: boolean;
  // Specific to visitor:
  baseSalary?: number;
  commissionRate?: number; // e.g. 5%
  commissionBasis?: 'approved_order' | 'delivered_order' | 'collected_payment';
  monthlyTarget?: number;
  weeklyTarget?: number;
  employmentNotes?: string;
  allowCashCollection?: boolean; // Whether this visitor is authorized to collect deposits/cash
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export interface StoreSubscription {
  id: string;
  storeId: string;
  planName: '14-Day Trial' | '6-Month Plan' | '1-Year Plan' | 'Custom';
  status: SubscriptionStatus;
  startDate: string;
  endDate: string; // ISO string
  trialDaysRemaining?: number;
  priceAFN: number;
  renewalHistory: {
    id: string;
    date: string;
    plan: string;
    amount: number;
    approvedBy: string;
  }[];
}

export interface Store {
  id: string;
  name: string;
  ownerId: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  createdAt: string;
  groupChatEnabled: boolean;
  allowVisitorCashCollection?: boolean; // Store-level setting to allow visitors to collect payments
  subscription: StoreSubscription;
}

export interface Medicine {
  id: string;
  storeId: string;
  name: string;
  brand: string;
  dosageForm: string; // قرص, کپسول, شربت, آمپول, پماد, قطره
  strength: string; // 500mg, 100ml, etc.
  code: string;
  unit: string; // بسته, قوطی, کارتن, عدد
  purchasePrice: number; // AFN
  salePrice: number; // AFN
  stock: number;
  minStockAlert: number;
  category: string;
  expiryDate: string; // YYYY-MM-DD
  batchNumber: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  status: 'active' | 'inactive';
  customCommissionRate?: number; // درصد پورسانت اختصاصی این دارو برای ویزیتور (مثلاً ۵٪ یا ۸٪)
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  storeId: string;
  medicineId: string;
  medicineName: string;
  type: 'initial' | 'purchase_in' | 'sale_out' | 'adjustment' | 'return';
  quantity: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string; // نام داروخانه / دواخانه
  managerName: string; // نام مسئول
  phone: string;
  altPhone?: string;
  tradeName?: string;
  address: string;
  city: string;
  area: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  licenseNumber?: string; // جواز یا پروانه دواخانه
  taxId?: string; // کد اقتصادی یا شماره ثبت
  creditLimitAFN?: number; // سقف اعتبار خرید
  createdBy: string; // ID of creator (visitor or owner)
  primaryVisitorId?: string; // ID of primary assigned visitor
  sharedVisitorIds: string[]; // Other visitors with access
  status: 'active' | 'archived';
  nextFollowupDate?: string;
  lastVisitDate?: string;
  createdAt: string;
  totalOrdersCount: number;
  totalOrderAmount: number;
}

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'preparing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refunded'
  | 'review_needed';

export interface OrderItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosageForm?: string; // e.g. قرص, کپسول, شربت, آمپول, پماد, قطره
  strength?: string; // 500mg, 100ml, etc.
  unit: string;
  quantity: number;
  unitPrice: number;
  discountAFN: number;
  totalAFN: number;
  batchNumber?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  changedBy: string;
  changedByName: string;
  timestamp: string;
  note?: string;
}

export interface OrderPaymentRecord {
  id: string;
  amountAFN: number;
  date: string;
  registeredBy: string;
  receiptNumber?: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-1042
  storeId: string;
  customerId: string;
  customerName: string;
  visitorId: string; // Creator visitor or assigned
  visitorName: string;
  items: OrderItem[];
  subtotalAFN: number;
  discountAFN: number;
  totalAFN: number;
  paidAmountAFN: number;
  remainingAmountAFN: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  history: OrderStatusHistoryItem[];
  payments: OrderPaymentRecord[];
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export type VisitOutcome =
  | 'order_placed'
  | 'did_not_buy'
  | 'absent'
  | 'followup_needed'
  | 'postponed'
  | 'phone_call';

export interface VisitRecord {
  id: string;
  storeId: string;
  visitorId: string;
  visitorName: string;
  customerId: string;
  customerName: string;
  scheduledTime: string;
  completedTime?: string;
  outcome?: VisitOutcome;
  orderId?: string;
  notes?: string;
  nextFollowupDate?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  locationRecorded?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  };
  storeAdvice?: {
    text: string;
    adviceDate: string;
    advisorName: string;
  };
}

export interface VisitorLedgerEntry {
  id: string;
  storeId: string;
  visitorId: string;
  type: 'salary' | 'commission' | 'bonus' | 'advance' | 'payout' | 'deduction';
  amount: number;
  title: string;
  description?: string;
  orderId?: string;
  date: string;
  registeredBy: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text?: string;
  imageUrl?: string;
  orderDocAttachment?: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    totalAFN: number;
  };
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  storeId: string;
  type: 'private' | 'store_group';
  visitorId?: string; // For private chats
  visitorName?: string;
  lastMessageText?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface SupportTicket {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  imageUrl?: string;
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: 'store' | 'maker';
    text: string;
    imageUrl?: string;
    createdAt: string;
  }[];
}

export interface SupportFaq {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  order?: number;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: 'update' | 'announcement' | 'warning' | 'feature';
  createdAt: string;
  isImportant?: boolean;
}

export interface PlatformConfig {
  appName: string;
  shortDescription: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  publicAnnouncement?: string;
  announcementTitle?: string;
  announcementType?: 'info' | 'warning' | 'success' | 'urgent';
  announcementEnabled?: boolean;
  announcementTargetRole?: 'all' | 'store_owner' | 'visitor';
  announcementDate?: string;
  announcementDismissible?: boolean;
  subscriptionExpiredMessage: string;
  allowGuestMode: boolean;
  supportPhone: string;
  supportWhatsApp: string;
  plan6MonthPriceAFN: number;
  plan1YearPriceAFN: number;
  supportWelcomeMessage?: string;
  supportFaqs?: SupportFaq[];
  notifications?: PlatformNotification[];
  customTexts?: Record<string, string>;
  updatedAt: string;
  version: number;
  appReleaseVersion?: string;
  appVersionCode?: number;
  appUpdateNotes?: string;
  appUpdateRequired?: boolean;
}

export interface VisitorCashCollection {
  id: string;
  storeId: string;
  visitorId: string;
  visitorName: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  amountAFN: number;
  collectionType: 'deposit' | 'full_payment' | 'installment';
  paymentMethod: 'cash' | 'card_to_card' | 'bank_receipt' | 'other';
  receiptNumber?: string;
  notes?: string;
  date: string;
  status: 'in_hand' | 'remitted';
  remittanceId?: string;
}

export interface VisitorRemittance {
  id: string;
  remittanceNumber: string;
  storeId: string;
  visitorId: string;
  visitorName: string;
  amountAFN: number;
  paymentMethod: 'bank_transfer' | 'cash_in_person' | 'exchange_remittance' | 'check';
  bankName?: string;
  destinationAccount?: string;
  trackingNumber: string;
  receiptImageUrl?: string;
  notes?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  rejectionReason?: string;
}

export interface PersonalNote {
  id: string;
  userId: string;
  storeId?: string;
  title: string;
  content: string;
  category: 'general' | 'client_followup' | 'idea' | 'checklist' | 'private';
  colorTag?: string; // hex or tailwind class
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EisenhowerQuadrant =
  | 'q1_urgent_important'
  | 'q2_important_not_urgent'
  | 'q3_urgent_not_important'
  | 'q4_not_urgent_not_important';

export interface EisenhowerTask {
  id: string;
  userId: string;
  storeId?: string;
  title: string;
  description?: string;
  quadrant: EisenhowerQuadrant;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AppAnalytics {
  totalInstalls: number;
  activeInstalls7Days: number;
  visitsDaily: number;
  visitsWeekly: number;
  visitsMonthly: number;
  visitsYearly: number;
  visitsInstalledPWA: number;
  visitsWebBrowser: number;
  visitsGuestMode: number;
}

