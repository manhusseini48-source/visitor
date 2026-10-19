import { PlatformConfig } from '../types';

export interface AppTextItem {
  key: string;
  category:
    | 'header'
    | 'navigation'
    | 'auth'
    | 'dashboard'
    | 'medicines'
    | 'customers'
    | 'visits'
    | 'accounting'
    | 'orders'
    | 'messenger'
    | 'support'
    | 'subscription';
  label: string;
  defaultValue: string;
  description?: string;
}

export const APP_TEXT_DEFINITIONS: AppTextItem[] = [
  // ==================== Header & Navigation ====================
  {
    key: 'app_name',
    category: 'header',
    label: 'نام اصلی سامانه',
    defaultValue: 'ویزیتور',
    description: 'نام نمایشی برند در هدر و نوار عنوان بالای صفحه',
  },
  {
    key: 'app_subtitle',
    category: 'header',
    label: 'زیرعنوان یا شعار برند',
    defaultValue: 'پنل ویزیتور دارو',
    description: 'توضیح کوتاه زیر نام سامانه در هدر',
  },
  {
    key: 'header_login_btn',
    category: 'header',
    label: 'دکمه ورود در هدر',
    defaultValue: 'ورود به حساب',
  },
  {
    key: 'header_register_btn',
    category: 'header',
    label: 'دکمه ثبت‌نام فروشگاه',
    defaultValue: 'ثبت‌نام فروشگاه',
  },
  {
    key: 'install_app_btn',
    category: 'header',
    label: 'دکمه نصب اپلیکیشن',
    defaultValue: 'نصب برنامه',
  },
  {
    key: 'nav_tab_dashboard',
    category: 'navigation',
    label: 'عنوان تب داشبورد',
    defaultValue: 'داشبورد من',
  },
  {
    key: 'nav_tab_medicines',
    category: 'navigation',
    label: 'عنوان تب داروها و موجودی انبار',
    defaultValue: 'کاتالوگ و موجودی داروها',
  },
  {
    key: 'nav_tab_orders',
    category: 'navigation',
    label: 'عنوان تب سفارشات',
    defaultValue: 'سفارشات من',
  },
  {
    key: 'nav_tab_customers',
    category: 'navigation',
    label: 'عنوان تب دواخانه‌ها و مشتریان',
    defaultValue: 'دواخانه‌های من',
  },
  {
    key: 'nav_tab_visits',
    category: 'navigation',
    label: 'عنوان تب برنامه ویزیت و مراجعات',
    defaultValue: 'برنامه مراجعات و پیگیری',
  },
  {
    key: 'nav_tab_accounting',
    category: 'navigation',
    label: 'عنوان تب حسابداری و پورسانت',
    defaultValue: 'حساب و پورسانت',
  },
  {
    key: 'nav_tab_messenger',
    category: 'navigation',
    label: 'عنوان تب پیام‌رسان کاری',
    defaultValue: 'پیام‌رسان کاری',
  },
  {
    key: 'nav_tab_visitors',
    category: 'navigation',
    label: 'عنوان تب مدیریت ویزیتورها (فروشگاه)',
    defaultValue: 'ویزیتورها',
  },
  {
    key: 'nav_tab_reports',
    category: 'navigation',
    label: 'عنوان تب گزارشات جامع',
    defaultValue: 'گزارشات',
  },
  {
    key: 'nav_tab_subscription',
    category: 'navigation',
    label: 'عنوان تب اشتراک سامانه',
    defaultValue: 'اشتراک من',
  },
  {
    key: 'nav_tab_support',
    category: 'navigation',
    label: 'عنوان تب پشتیبانی آنلاین',
    defaultValue: 'پشتیبانی',
  },

  // ==================== Auth & Login ====================
  {
    key: 'login_title',
    category: 'auth',
    label: 'عنوان پنجره ورود',
    defaultValue: 'ورود به سامانه ویزیتور',
  },
  {
    key: 'login_subtitle',
    category: 'auth',
    label: 'زیرعنوان فرم ورود',
    defaultValue: 'ورود با ایمیل، شماره تماس یا نام کاربری ثبت‌شده',
  },
  {
    key: 'login_id_label',
    category: 'auth',
    label: 'برچسب فیلد شناسه کاربری',
    defaultValue: 'شناسه کاربری (ایمیل، شماره تماس یا نام کاربری)',
  },
  {
    key: 'login_pass_label',
    category: 'auth',
    label: 'برچسب فیلد رمز عبور',
    defaultValue: 'رمز عبور',
  },
  {
    key: 'login_submit_btn',
    category: 'auth',
    label: 'دکمه ورود به سامانه',
    defaultValue: 'ورود به سامانه',
  },
  {
    key: 'login_guest_btn',
    category: 'auth',
    label: 'دکمه ادامه به عنوان مهمان',
    defaultValue: 'مشاهده به عنوان مهمان (بدون ثبت‌نام)',
  },

  // ==================== Dashboard ====================
  {
    key: 'store_dashboard_title',
    category: 'dashboard',
    label: 'عنوان داشبورد فروشگاه',
    defaultValue: 'داشبورد مدیریت فروشگاه دارویی',
  },
  {
    key: 'store_dashboard_subtitle',
    category: 'dashboard',
    label: 'زیرعنوان داشبورد فروشگاه',
    defaultValue: 'آمار زنده عملکرد فروش، ویزیتورها و وضعیت سفارش‌ها',
  },
  {
    key: 'visitor_dashboard_title',
    category: 'dashboard',
    label: 'عنوان داشبورد ویزیتور',
    defaultValue: 'داشبورد کاری من',
  },
  {
    key: 'visitor_dashboard_subtitle',
    category: 'dashboard',
    label: 'زیرعنوان داشبورد ویزیتور',
    defaultValue: 'خلاصه عملکرد فروش، مراجعات روزانه و کارمزد من',
  },
  {
    key: 'trial_banner_title',
    category: 'subscription',
    label: 'عنوان بنر مهلت تست',
    defaultValue: 'مهلت تست رایگان ۱۴ روزه فعال است',
  },
  {
    key: 'trial_upgrade_btn',
    category: 'subscription',
    label: 'دکمه تمدید/ارتقای اشتراک',
    defaultValue: 'تمدید و خرید اشتراک',
  },
  {
    key: 'subscription_expired_title',
    category: 'subscription',
    label: 'عنوان هشدار پایان اشتراک',
    defaultValue: 'دسترسی فروشگاه به پایان رسیده است',
  },

  // ==================== Medicines & Inventory ====================
  {
    key: 'medicines_title',
    category: 'medicines',
    label: 'عنوان بخش داروها و انبار',
    defaultValue: 'داروها و موجودی انبار',
  },
  {
    key: 'medicines_subtitle',
    category: 'medicines',
    label: 'زیرعنوان بخش داروها',
    defaultValue: 'مدیریت و ثبت اقلام دارویی، قیمت فروش، بسته‌بندی و انقضا',
  },
  {
    key: 'visitor_medicines_title',
    category: 'medicines',
    label: 'عنوان کاتالوگ داروها در پنل ویزیتور',
    defaultValue: 'کاتالوگ و موجودی زنده داروها',
  },
  {
    key: 'visitor_medicines_subtitle',
    category: 'medicines',
    label: 'توضیحات کاتالوگ داروها در پنل ویزیتور',
    defaultValue: 'مشاهده موجودی لحظه‌ای انبار فروشگاه، قیمت فروش، تاریخ انقضا و بسته‌بندی جهت معرفی به دواخانه‌ها',
  },
  {
    key: 'add_medicine_btn',
    category: 'medicines',
    label: 'دکمه ثبت داروی جدید',
    defaultValue: 'افزودن داروی جدید',
  },
  {
    key: 'medicines_search_placeholder',
    category: 'medicines',
    label: 'متن جستجوی دارو',
    defaultValue: 'جستجو در نام دارو، برند تجاری یا کد اختصاصی...',
  },

  // ==================== Customers & Pharmacies ====================
  {
    key: 'customers_title',
    category: 'customers',
    label: 'عنوان بخش مشتریان و دواخانه‌ها',
    defaultValue: 'مدیریت مشتریان و دواخانه‌ها',
  },
  {
    key: 'customers_subtitle',
    category: 'customers',
    label: 'زیرعنوان بخش مشتریان',
    defaultValue: 'فهرست دواخانه‌های تحت پوشش، موقعیت جغرافیایی و ویزیتور مسئول',
  },
  {
    key: 'add_customer_btn',
    category: 'customers',
    label: 'دکمه ثبت دواخانه جدید',
    defaultValue: 'ثبت دواخانه جدید',
  },

  // ==================== Visits & Schedule ====================
  {
    key: 'visits_title',
    category: 'visits',
    label: 'عنوان برنامه ویزیت و پیگیری',
    defaultValue: 'برنامه ویزیت و پیگیری دواخانه‌ها',
  },
  {
    key: 'visits_subtitle',
    category: 'visits',
    label: 'زیرعنوان برنامه ویزیت',
    defaultValue: 'زمان‌بندی مراجعات حضوری ویزیتورها و ثبت نتایج بازاریابی و فروش',
  },
  {
    key: 'add_visit_btn',
    category: 'visits',
    label: 'دکمه تنظیم ویزیت جدید',
    defaultValue: 'تنظیم ویزیت جدید',
  },
  {
    key: 'record_outcome_btn',
    category: 'visits',
    label: 'دکمه ثبت نتیجه ویزیت',
    defaultValue: 'ثبت نتیجه',
  },
  {
    key: 'order_now_visit_btn',
    category: 'visits',
    label: 'دکمه ثبت سریع سفارش از روی کارت ویزیت',
    defaultValue: 'ثبت سفارش برای این دواخانه',
  },

  // ==================== Accounting & Commission ====================
  {
    key: 'accounting_title',
    category: 'accounting',
    label: 'عنوان حسابداری و پورسانت',
    defaultValue: 'حسابداری و تسویه پورسانت ویزیتورها',
  },
  {
    key: 'accounting_subtitle',
    category: 'accounting',
    label: 'زیرعنوان حسابداری',
    defaultValue: 'دفتر کل مستقل، محاسبه کمیسیون بر اساس عملکرد واقعی، ثبت مساعده، حقوق پایه و مانده طلب ویزیتور',
  },
  {
    key: 'visitor_accounting_title',
    category: 'accounting',
    label: 'عنوان حساب مالی و پورسانت در پنل ویزیتور',
    defaultValue: 'حساب مالی و پورسانت من',
  },
  {
    key: 'visitor_accounting_subtitle',
    category: 'accounting',
    label: 'زیرعنوان حساب مالی در پنل ویزیتور',
    defaultValue: 'ریز تراکنش‌ها، مبالغ پورسانت محاسبه‌شده بر اساس فاکتورهای واقعی و تسویه‌های پرداختی',
  },
  {
    key: 'add_entry_btn',
    category: 'accounting',
    label: 'دکمه ثبت تراکنش مالی',
    defaultValue: 'ثبت تراکنش مالی جدید',
  },
  {
    key: 'auto_credit_commission_btn',
    category: 'accounting',
    label: 'دکمه ثبت خودکار پورسانت بر اساس فاکتورهای واقعی',
    defaultValue: 'ثبت خودکار پورسانت در دفتر کل',
  },

  // ==================== Orders ====================
  {
    key: 'orders_title',
    category: 'orders',
    label: 'عنوان بخش سفارشات',
    defaultValue: 'مدیریت سفارش‌ها و پیش‌فاکتورها',
  },
  {
    key: 'create_order_btn',
    category: 'orders',
    label: 'دکمه ثبت سفارش جدید',
    defaultValue: 'ثبت سفارش جدید',
  },

  // ==================== Messenger & Support ====================
  {
    key: 'messenger_title',
    category: 'messenger',
    label: 'عنوان پیام‌رسان کاری',
    defaultValue: 'پیام‌رسان کاری و گفتگوهای تجارتی',
  },
  {
    key: 'support_title',
    category: 'support',
    label: 'عنوان مرکز پشتیبانی',
    defaultValue: 'پشتیبانی آنلاین و پاسخ به سؤالات',
  },
];

/**
 * Retrieve customized text from PlatformConfig or localStorage fallback.
 */
export function getAppText(
  config: PlatformConfig | null | undefined,
  key: string,
  fallback: string
): string {
  if (
    config?.customTexts &&
    typeof config.customTexts[key] === 'string' &&
    config.customTexts[key].trim() !== ''
  ) {
    return config.customTexts[key];
  }
  // Try localStorage cached overrides
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`visitor_app_text_${key}`);
      if (cached && cached.trim()) return cached;
    } catch {}
  }
  return fallback;
}
