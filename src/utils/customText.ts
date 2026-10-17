/**
 * Master Text Dictionary and Customizer Engine for Visitor Pharma App
 * Allows Creator to edit any text anywhere in the entire system.
 */
import { PlatformConfig } from '../types';

export interface TextDefinition {
  key: string;
  category: 'general' | 'auth' | 'banners' | 'nav' | 'dashboard' | 'medicines' | 'orders' | 'support';
  categoryLabel: string;
  label: string;
  defaultValue: string;
  description: string;
  isMultiLine?: boolean;
}

export const APP_TEXT_DEFINITIONS: TextDefinition[] = [
  // --- عمومی و برندینگ ---
  {
    key: 'app_name',
    category: 'general',
    categoryLabel: 'عمومی و برندینگ',
    label: 'نام اصلی سامانه (App Name)',
    defaultValue: 'ویزیتور',
    description: 'در سربرگ، تب مرورگر و لوگوی برنامه نمایش داده می‌شود.',
  },
  {
    key: 'app_subtitle',
    category: 'general',
    categoryLabel: 'عمومی و برندینگ',
    label: 'شعار و زیرعنوان برنامه',
    defaultValue: 'پلتفرم جامع مدیریت ویزیتوری و فروش دارویی',
    description: 'در صفحه اصلی و معرفی سیستم نمایش داده می‌شود.',
  },
  {
    key: 'app_tagline',
    category: 'general',
    categoryLabel: 'عمومی و برندینگ',
    label: 'توضیح کوتاه سازمانی',
    defaultValue: 'سیستم هوشمند توزیع دارو، انبارداری، فاکتور و حسابداری دواخانه‌ها',
    description: 'توضیحات کوتاه در سربرگ و معرفی برنامه.',
    isMultiLine: true,
  },
  {
    key: 'footer_copyright',
    category: 'general',
    categoryLabel: 'عمومی و برندینگ',
    label: 'متن کپی‌رایت فوتر',
    defaultValue: 'تمامی حقوق برای سامانه مدیریت ویزیتوری دارو محفوظ است.',
    description: 'متن انتهای صفحات و فوتر برنامه.',
  },

  // --- صفحه ورود و ثبت نام ---
  {
    key: 'login_title',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'عنوان پنجره ورود',
    defaultValue: 'ورود به سامانه ویزیتور',
    description: 'تیتر بالای فرم ورود کاربران.',
  },
  {
    key: 'login_subtitle',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'توضیحات زیر عنوان ورود',
    defaultValue: 'ورود با ایمیل، شماره تماس یا نام کاربری ثبت‌شده',
    description: 'متن راهنمای ورود به حساب.',
  },
  {
    key: 'login_id_label',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'برچسب کادر شناسه کاربری',
    defaultValue: 'شناسه کاربری (ایمیل، شماره تماس یا نام کاربری)',
    description: 'عنوان بالای فیلد شناسه ورود.',
  },
  {
    key: 'login_pass_label',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'برچسب کادر رمز عبور',
    defaultValue: 'رمز عبور',
    description: 'عنوان فیلد پسورد.',
  },
  {
    key: 'login_btn_text',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'متن دکمه ورود به حساب',
    defaultValue: 'ورود به سامانه',
    description: 'متن روی دکمه آبی رنگ ورود.',
  },
  {
    key: 'login_guest_btn',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'متن دکمه ورود مهمان',
    defaultValue: 'مشاهده آزمایشی به عنوان مهمان',
    description: 'دکمه ورود مهمان بدون نیاز به ثبت‌نام.',
  },
  {
    key: 'register_modal_title',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'عنوان پنجره ثبت نام فروشگاه',
    defaultValue: 'ثبت‌نام فروشگاه و شروع مهلت تست رایگان',
    description: 'تیتر پاپ‌آپ ثبت نام.',
  },
  {
    key: 'register_modal_desc',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'توضیح هدیه تست رایگان در ثبت‌نام',
    defaultValue: '۱۴ روز استفاده کامل و نامحدود از تمام امکانات بدون نیاز به پرداخت اولیه',
    description: 'توضیحات طرح تشویقی ۱۴ روز تست.',
    isMultiLine: true,
  },
  {
    key: 'register_btn_submit',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'متن دکمه ثبت نام نهایی',
    defaultValue: 'ثبت نهایی و شروع دوره تست رایگان',
    description: 'دکمه سابمیت فرم ثبت نام.',
  },
  {
    key: 'register_terms_text',
    category: 'auth',
    categoryLabel: 'ورود و ثبت‌نام',
    label: 'متن تایید شرایط و قوانین',
    defaultValue: 'شرایط و قوانین استفاده از خدمات سامانه ویزیتوری دارو را مطالعه نموده و می‌پذیرم.',
    description: 'متن کنار چک‌باکس تایید قوانین.',
  },

  // --- بنرها، مهلت تست و اشتراک ---
  {
    key: 'trial_banner_title',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'تیتر بنر مهلت تست ۱۴ روزه',
    defaultValue: 'مهلت تست رایگان ۲ هفته‌ای فعال است:',
    description: 'متن ابتدای نوار آبی بالای صفحه هنگام تست.',
  },
  {
    key: 'trial_banner_desc',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'متن ادامه روزشمار تست',
    defaultValue: 'روز دیگر تا پایان فرصت آزمایشی فروشگاه باقی مانده است.',
    description: 'جمله‌ای که بعد از تعداد روز باقیمانده می‌آید.',
  },
  {
    key: 'trial_banner_button',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'متن دکمه بنر مهلت تست',
    defaultValue: 'مشاهده طرح‌ها و تمدید',
    description: 'دکمه هدایت به صفحه اشتراک.',
  },
  {
    key: 'expired_banner_text',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'متن بنر قرمز انقضای اشتراک',
    defaultValue: 'مهلت استفاده فروشگاه پایان یافته است. دسترسی عملیاتی جهت ثبت سفارشات و داروها محدود شده است.',
    description: 'پیام هشداری که بعد از پایان مهلت تست یا اشتراک ظاهر می‌شود.',
    isMultiLine: true,
  },
  {
    key: 'sub_page_title',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'عنوان صفحه اشتراک',
    defaultValue: 'طرح‌های اشتراک و تمدید اعتبار فروشگاه',
    description: 'تیتر اصلی در تب اشتراک.',
  },
  {
    key: 'sub_page_desc',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'توضیحات صفحه اشتراک',
    defaultValue: 'دسترسی کامل و بدون محدودیت به سیستم ویزیتوری، ثبت نامحدود داروها، سفارشات و اتصال به دواخانه‌ها',
    description: 'متن توضیحات امکانات اشتراک.',
    isMultiLine: true,
  },
  {
    key: 'sub_active_badge',
    category: 'banners',
    categoryLabel: 'بنرها و اشتراک',
    label: 'متن برچسب اشتراک فعال',
    defaultValue: 'اشتراک فعال رسمی',
    description: 'برچسب سبز رنگ تایید اعتبار در پنل فروشگاه.',
  },

  // --- سربرگ و نام تب‌ها ---
  {
    key: 'nav_dashboard',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب داشبورد',
    defaultValue: 'داشبورد',
    description: 'نام دکمه تب داشبورد.',
  },
  {
    key: 'nav_medicines',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب داروها',
    defaultValue: 'کاتالوگ داروها',
    description: 'نام دکمه تب داروها.',
  },
  {
    key: 'nav_orders',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب سفارشات',
    defaultValue: 'سفارشات',
    description: 'نام دکمه تب سفارش‌ها.',
  },
  {
    key: 'nav_customers',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب مشتریان',
    defaultValue: 'دواخانه‌ها و مشتریان',
    description: 'نام دکمه تب مشتریان.',
  },
  {
    key: 'nav_visitors',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب ویزیتورها',
    defaultValue: 'ویزیتورها',
    description: 'نام دکمه تب ویزیتورها.',
  },
  {
    key: 'nav_visits',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب ویزیت حضوری',
    defaultValue: 'برنامه ویزیت حضوری',
    description: 'نام دکمه تب برنامه ویزیت.',
  },
  {
    key: 'nav_accounting',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب حسابداری',
    defaultValue: 'حسابداری و مالی',
    description: 'نام دکمه تب حسابداری.',
  },
  {
    key: 'nav_messenger',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب پیام‌رسان',
    defaultValue: 'پیام‌رسان کاری',
    description: 'نام دکمه تب چت.',
  },
  {
    key: 'nav_reports',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب گزارش‌ها',
    defaultValue: 'گزارش‌های تحلیلی',
    description: 'نام دکمه تب گزارشات.',
  },
  {
    key: 'nav_subscription',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب اشتراک',
    defaultValue: 'اشتراک و تمدید',
    description: 'نام دکمه تب اشتراک.',
  },
  {
    key: 'nav_support',
    category: 'nav',
    categoryLabel: 'منوی ناوبری',
    label: 'عنوان تب پشتیبانی',
    defaultValue: 'پشتیبانی آنلاین',
    description: 'نام دکمه تب پشتیبانی.',
  },

  // --- داشبورد فروشگاه ---
  {
    key: 'dash_stat_sales',
    category: 'dashboard',
    categoryLabel: 'داشبورد فروشگاه',
    label: 'عنوان کارت فروش کل',
    defaultValue: 'مجموع فروش کل',
    description: 'کارت آمار فروش در داشبورد.',
  },
  {
    key: 'dash_stat_orders',
    category: 'dashboard',
    categoryLabel: 'داشبورد فروشگاه',
    label: 'عنوان کارت تعداد سفارشات',
    defaultValue: 'کل سفارشات ثبت‌شده',
    description: 'کارت تعداد سفارشات.',
  },
  {
    key: 'dash_stat_debt',
    category: 'dashboard',
    categoryLabel: 'داشبورد فروشگاه',
    label: 'عنوان کارت طلبکاری / بدهی',
    defaultValue: 'باقیمانده طلب از دواخانه‌ها',
    description: 'کارت مبالغ وصول‌نشده.',
  },
  {
    key: 'dash_stat_low_stock',
    category: 'dashboard',
    categoryLabel: 'داشبورد فروشگاه',
    label: 'عنوان کارت هشدار موجودی',
    defaultValue: 'داروهای در آستانه اتمام',
    description: 'کارت هشدار انبار داروها.',
  },

  // --- کاتالوگ داروها و سفارشات ---
  {
    key: 'med_title',
    category: 'medicines',
    categoryLabel: 'کاتالوگ داروها',
    label: 'عنوان صفحه داروها',
    defaultValue: 'مدیریت کاتالوگ داروها و موجودی انبار',
    description: 'تیتر بالای لیست داروها.',
  },
  {
    key: 'med_add_btn',
    category: 'medicines',
    categoryLabel: 'کاتالوگ داروها',
    label: 'متن دکمه افزودن دارو',
    defaultValue: '+ افزودن داروی جدید',
    description: 'دکمه سبز رنگ افزودن قلم دارو.',
  },
  {
    key: 'med_search_place',
    category: 'medicines',
    categoryLabel: 'کاتالوگ داروها',
    label: 'متن جایگزین جستجوی داروها',
    defaultValue: 'جستجو بر اساس نام دارو، شرکت، کد یا بارکد...',
    description: 'متن کم‌رنگ داخل کادر جستجوی دارو.',
  },
  {
    key: 'orders_title',
    category: 'orders',
    categoryLabel: 'سفارشات و فاکتورها',
    label: 'عنوان صفحه سفارشات',
    defaultValue: 'مدیریت و پیگیری سفارشات ثبت‌شده',
    description: 'تیتر بالای لیست سفارش‌ها.',
  },
  {
    key: 'orders_new_btn',
    category: 'orders',
    categoryLabel: 'سفارشات و فاکتورها',
    label: 'متن دکمه ثبت سفارش جدید',
    defaultValue: '+ ثبت سفارش جدید',
    description: 'دکمه ایجاد فاکتور فروش.',
  },

  // --- پشتیبانی و ارتباطات ---
  {
    key: 'support_page_title',
    category: 'support',
    categoryLabel: 'پشتیبانی و ارتباطات',
    label: 'عنوان صفحه پشتیبانی',
    defaultValue: 'واحد پشتیبانی و مرکز ارتباط با مدیر سیستم',
    description: 'تیتر صفحه پشتیبانی.',
  },
  {
    key: 'support_whatsapp_btn',
    category: 'support',
    categoryLabel: 'پشتیبانی و ارتباطات',
    label: 'متن دکمه واتساپ پشتیبانی',
    defaultValue: 'ارتباط مستقیم در واتساپ',
    description: 'دکمه سبز ارسال پیام به واتساپ مدیر.',
  },
  {
    key: 'support_call_btn',
    category: 'support',
    categoryLabel: 'پشتیبانی و ارتباطات',
    label: 'متن دکمه تماس تلفنی',
    defaultValue: 'تماس تلفنی با پشتیبان',
    description: 'دکمه تماس مستقیم.',
  },
];

/**
 * Helper to get a dynamic text with fallback to default
 */
export function getAppText(
  config: PlatformConfig | undefined,
  key: string,
  hardcodedDefault?: string
): string {
  if (config && config.customTexts && config.customTexts[key] !== undefined) {
    const val = config.customTexts[key].trim();
    if (val) return val;
  }
  const foundDef = APP_TEXT_DEFINITIONS.find((d) => d.key === key);
  return foundDef ? foundDef.defaultValue : (hardcodedDefault || '');
}

/**
 * Returns all default text pairs
 */
export function getAllDefaultTexts(): Record<string, string> {
  const result: Record<string, string> = {};
  APP_TEXT_DEFINITIONS.forEach((d) => {
    result[d.key] = d.defaultValue;
  });
  return result;
}
