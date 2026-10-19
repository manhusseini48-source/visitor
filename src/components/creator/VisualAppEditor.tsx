import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { APP_TEXT_DEFINITIONS, AppTextItem, getAppText } from '../../utils/customText';
import {
  Sparkles,
  Search,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  CheckCircle2,
  Filter,
  Type,
  Layout,
  Pill,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  Shield,
  Eye,
  RefreshCw,
  ShoppingCart,
  LifeBuoy,
  Plus,
} from 'lucide-react';

export const VisualAppEditor: React.FC = () => {
  const { platformConfig, updatePlatformConfig } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>(() => {
    return { ...(platformConfig.customTexts || {}) };
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Custom Key Modal/Form
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomVal, setNewCustomVal] = useState('');
  const [newCustomLabel, setNewCustomLabel] = useState('');

  const categories = [
    { id: 'all', label: 'همه بخش‌ها', icon: Layout },
    { id: 'header', label: 'هدر و عنوان', icon: Type },
    { id: 'navigation', label: 'تب‌های ناوبری و منو', icon: Layout },
    { id: 'auth', label: 'ورود و احراز هویت', icon: Shield },
    { id: 'dashboard', label: 'داشبوردها', icon: Layout },
    { id: 'medicines', label: 'داروها و کاتالوگ', icon: Pill },
    { id: 'customers', label: 'دواخانه‌ها و مشتریان', icon: Users },
    { id: 'visits', label: 'برنامه ویزیت و پیگیری', icon: Calendar },
    { id: 'accounting', label: 'حسابداری و پورسانت', icon: DollarSign },
    { id: 'orders', label: 'سفارشات و فاکتورها', icon: ShoppingCart },
    { id: 'messenger', label: 'پیام‌رسان کاری', icon: MessageSquare },
    { id: 'support', label: 'پشتیبانی آنلاین', icon: LifeBuoy },
    { id: 'subscription', label: 'اشتراک و مهلت تست', icon: Shield },
  ];

  const customItems: AppTextItem[] = useMemo(() => {
    const knownKeys = new Set(APP_TEXT_DEFINITIONS.map((d) => d.key));
    const extra: AppTextItem[] = [];
    Object.entries(editedTexts).forEach(([k, v]) => {
      if (!knownKeys.has(k)) {
        extra.push({
          key: k,
          category: 'header',
          label: `متن اختصاصی (${k})`,
          defaultValue: v,
          description: 'کلید سفارشی اضافه‌شده توسط سازنده',
        });
      }
    });
    return extra;
  }, [editedTexts]);

  const allItems = useMemo(() => [...APP_TEXT_DEFINITIONS, ...customItems], [customItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.defaultValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (editedTexts[item.key] && editedTexts[item.key].toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allItems, selectedCategory, searchQuery, editedTexts]);

  const handleTextChange = (key: string, value: string) => {
    setEditedTexts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomKey.trim() || !newCustomVal.trim()) return;
    const cleanKey = newCustomKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setEditedTexts((prev) => ({
      ...prev,
      [cleanKey]: newCustomVal.trim(),
    }));
    setShowAddKeyModal(false);
    setNewCustomKey('');
    setNewCustomVal('');
    setNewCustomLabel('');
    showToast(`کلید متنی «${cleanKey}» اضافه شد. جهت ثبت نهایی، دکمه ذخیره را بزنید.`);
  };

  const handleResetSingle = (item: AppTextItem) => {
    const updated = { ...editedTexts };
    delete updated[item.key];
    setEditedTexts(updated);
    try {
      localStorage.removeItem(`visitor_app_text_${item.key}`);
    } catch {}
    showToast(`متن «${item.label}» به حالت پیش‌فرض بازگشت.`);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Clean empty keys
      const cleanCustomTexts: Record<string, string> = {};
      Object.entries(editedTexts).forEach(([k, v]) => {
        if (v && v.trim() !== '') {
          cleanCustomTexts[k] = v.trim();
          try {
            localStorage.setItem(`visitor_app_text_${k}`, v.trim());
          } catch {}
        } else {
          try {
            localStorage.removeItem(`visitor_app_text_${k}`);
          } catch {}
        }
      });

      const newConfig = {
        ...platformConfig,
        customTexts: cleanCustomTexts,
        updatedAt: new Date().toISOString(),
      };

      await updatePlatformConfig(newConfig);

      // Dispatch storage event so entire application live-updates instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      showToast('تمامی تغییرات متن‌ها با موفقیت ذخیره و در سرتاسر سامانه اعمال شدند.');
    } catch (err) {
      console.error(err);
      showToast('خطا در ذخیره تغییرات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllToDefaults = async () => {
    if (!window.confirm('آیا از بازنشانی کلیه متن‌های سامانه به حالت پیش‌فرض اولیه اطمینان دارید؟')) {
      return;
    }
    setEditedTexts({});
    APP_TEXT_DEFINITIONS.forEach((item) => {
      try {
        localStorage.removeItem(`visitor_app_text_${item.key}`);
      } catch {}
    });

    const newConfig = {
      ...platformConfig,
      customTexts: {},
      updatedAt: new Date().toISOString(),
    };
    await updatePlatformConfig(newConfig);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
    showToast('کلیه متون سامانه به مقادیر اصلی پیش‌فرض سیستم بازگردانده شدند.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to read current active value for simulator preview
  const previewVal = (key: string, fallback: string) => {
    if (editedTexts[key] && editedTexts[key].trim() !== '') {
      return editedTexts[key];
    }
    return getAppText(platformConfig, key, fallback);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>ویرایشگر زنده متن‌های سامانه (Visual Copy Editor)</span>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              شخصی‌سازی و تغییر لحظه‌ای تمام متون برنامه
            </h2>
            <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
              هر متنی که کاربر در هدر، فرم ورود، داشبورد، انبار، ویزیت و حسابداری می‌بیند را به دلخواه خود تغییر دهید. تغییرات به صورت زنده در شبیه‌ساز نمایش داده شده و با ذخیره روی کل دیتابیس اعمال می‌شوند.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddKeyModal(true)}
              className="px-3.5 py-2.5 bg-purple-600/40 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کلید متن دلخواه</span>
            </button>

            <button
              onClick={handleResetAllToDefaults}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-rose-500/30 text-rose-200 border border-white/20 hover:border-rose-400/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بازنشانی به پیش‌فرض‌ها</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره و اعمال بر کل سامانه'}</span>
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Two-Column Layout: Left/Top Editor, Right/Bottom Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Filter and List of Editable Texts (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Pills */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام بخش، متن نمایشی یا کلید متنی..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-purple-600 outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((c) => {
                const Icon = c.icon;
                const active = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Texts List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                موردی مطابق با جستجوی شما یافت نشد.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isModified =
                  editedTexts[item.key] !== undefined &&
                  editedTexts[item.key] !== item.defaultValue;
                const currentValue =
                  editedTexts[item.key] !== undefined
                    ? editedTexts[item.key]
                    : item.defaultValue;

                return (
                  <div
                    key={item.key}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 transition shadow-2xs space-y-2.5 ${
                      isModified
                        ? 'border-purple-300 dark:border-purple-700 ring-1 ring-purple-400/20'
                        : 'border-slate-200/90 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.label}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {item.key}
                        </span>
                      </div>

                      {isModified && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                            ویرایش‌شده
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetSingle(item)}
                            title="بازگشت به متن پیش‌فرض"
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    )}

                    <div>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleTextChange(item.key, e.target.value)}
                        placeholder={item.defaultValue}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-600 outline-none transition"
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>پیش‌فرض اصلی: «{item.defaultValue}»</span>
                      <span className="font-mono">{currentValue.length} کاراکتر</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Live Interactive Device Simulator Preview (5 Columns) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <h3 className="font-black text-xs text-slate-800 dark:text-slate-100">
                  شبیه‌ساز و پیش‌نمایش زنده تغییرات
                </h3>
              </div>

              {/* Device Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>موبایل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>رایانه</span>
                </button>
              </div>
            </div>

            {/* Simulated Frame */}
            <div
              className={`mx-auto bg-slate-950 text-white rounded-3xl p-3 border-4 border-slate-800 shadow-2xl transition-all duration-300 ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
              }`}
            >
              {/* Phone Speaker Notch */}
              {previewDevice === 'mobile' && (
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>
              )}

              {/* Mock App Content with Dynamic Texts */}
              <div className="bg-slate-900 rounded-2xl p-3 space-y-3 text-right">
                {/* Simulated Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">
                        {previewVal('app_name', platformConfig.appName)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {previewVal('app_subtitle', platformConfig.shortDescription)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-md font-bold">
                    نسخه ۲.۴
                  </span>
                </div>

                {/* Simulated Trial / Subscription Banner */}
                <div className="bg-sky-950/70 border border-sky-800/80 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-sky-200">
                    {previewVal('trial_banner_title', 'مهلت تست رایگان ۱۴ روزه فعال است')}
                  </span>
                  <span className="bg-sky-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                    {previewVal('trial_upgrade_btn', 'ارتقا')}
                  </span>
                </div>

                {/* Simulated Main Cards */}
                <div className="space-y-2">
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                    <div className="text-[11px] font-bold text-white mb-0.5">
                      {previewVal('medicines_title', 'داروها و موجودی انبار')}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      {previewVal('medicines_subtitle', 'مدیریت اقلام دارویی')}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded-lg">
                      <span>{previewVal('medicines_search_placeholder', 'جستجو در داروها...')}</span>
                      <Search className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                    <div className="text-[11px] font-bold text-white mb-0.5">
                      {previewVal('visits_title', 'برنامه ویزیت و پیگیری دواخانه‌ها')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {previewVal('visits_subtitle', 'زمان‌بندی مراجعات حضوری')}
                    </div>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5">
                    <div className="text-[11px] font-bold text-white mb-0.5">
                      {previewVal('accounting_title', 'حسابداری و تسویه پورسانت ویزیتورها')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {previewVal('accounting_subtitle', 'محاسبه واقعی پورسانت عملکرد')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400">
              پیش‌نمایش در لحظه با تایپ شما تغییر می‌کند
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>تعریف کلید متنی اختصاصی جدید</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomKey} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شناسه کلید متنی (انگلیسی با underline) *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value)}
                  placeholder="مثال: custom_promo_badge یا visitor_tab_note"
                  dir="ltr"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-left text-slate-900 dark:text-white outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن نمایشی برای کاربران *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newCustomVal}
                  onChange={(e) => setNewCustomVal(e.target.value)}
                  placeholder="متن فارسی یا دری مورد نظر جهت نمایش در برنامه..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKeyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  افزودن به لیست
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
