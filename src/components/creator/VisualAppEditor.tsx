import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { APP_TEXT_DEFINITIONS, getAppText, TextDefinition } from '../../utils/customText';
import {
  Layout,
  Smartphone,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  Sparkles,
  Edit3,
  Sliders,
  Eye,
  Shield,
  Pill,
  Clock,
  Phone,
  MessageCircle,
  Package,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const VisualAppEditor: React.FC = () => {
  const { platformConfig, updatePlatformConfig } = useApp();

  // Local draft of custom texts
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>(() => {
    return { ...(platformConfig.customTexts || {}) };
  });

  const [activeScreen, setActiveScreen] = useState<
    'general' | 'auth' | 'banners' | 'nav' | 'dashboard' | 'medicines' | 'orders' | 'support'
  >('general');

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedKeyForFocus, setSelectedKeyForFocus] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to read text from draft with fallback
  const getDraftText = (key: string): string => {
    if (draftTexts[key] !== undefined && draftTexts[key].trim() !== '') {
      return draftTexts[key];
    }
    const def = APP_TEXT_DEFINITIONS.find((d) => d.key === key);
    return def ? def.defaultValue : '';
  };

  const handleTextChange = (key: string, value: string) => {
    setDraftTexts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetSingle = (key: string) => {
    setDraftTexts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast('متن مورد نظر به حالت پیش‌فرض اولیه بازگردانده شد.');
  };

  const handleResetAllToDefaults = () => {
    if (
      confirm(
        'آیا از بازنشانی کلیه متون به حالت پیش‌فرض اولیه اطمینان دارید؟ تمامی متون سفارشی‌شده به حالت کارخانه بازمی‌گردند.'
      )
    ) {
      setDraftTexts({});
      updatePlatformConfig({ customTexts: {} });
      showToast('تمامی متون برنامه به حالت پیش‌فرض اولیه کارخانه بازنشانی شدند.');
    }
  };

  const handleSaveAll = () => {
    updatePlatformConfig({
      customTexts: draftTexts,
      appName: draftTexts['app_name'] || platformConfig.appName,
      shortDescription: draftTexts['app_subtitle'] || platformConfig.shortDescription,
    });
    showToast('تمامی تغییرات متنی با موفقیت ذخیره شدند و بلافاصله روی کل برنامه اعمال گردیدند.');
  };

  // Filtered definitions
  const filteredDefinitions = useMemo(() => {
    return APP_TEXT_DEFINITIONS.filter((def) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        def.label.includes(searchQuery) ||
        def.defaultValue.includes(searchQuery) ||
        (draftTexts[def.key] && draftTexts[def.key].includes(searchQuery)) ||
        def.description.includes(searchQuery);

      if (searchQuery.trim() !== '') return matchesSearch;
      return def.category === activeScreen;
    });
  }, [activeScreen, searchQuery, draftTexts]);

  // Count customized texts
  const customizedCount = useMemo(() => {
    return Object.keys(draftTexts).filter((k) => draftTexts[k] && draftTexts[k].trim() !== '').length;
  }, [draftTexts]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-purple-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-500/30 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold text-purple-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ویرایشگر بصری زنده و تغییر کلیه متون سیستم</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            استودیوی شخصی‌سازی متون کل برنامه
          </h2>
          <p className="text-xs text-purple-200 mt-1 max-w-2xl leading-relaxed">
            در این بخش می‌توانید هر متنی را در هر کجای برنامه تغییر دهید و پیش‌نمایش زنده آن را در شبیه‌ساز مشاهده کنید. با زدن دکمه ذخیره، تغییرات فوراً روی سایت اصلی و برای تمامی کاربران اعمال می‌شود.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleResetAllToDefaults}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-rose-600/30 hover:border-rose-400/50 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="بازنشانی تمامی متون به تنظیمات کارخانه"
          >
            <RotateCcw className="w-4 h-4 text-rose-300" />
            <span>ریست به حالت اولیه</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره و اعمال نهایی</span>
            {customizedCount > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {customizedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Selector Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'general', label: 'عمومی و برندینگ', icon: Sparkles },
          { id: 'auth', label: 'ورود و ثبت‌نام', icon: Shield },
          { id: 'banners', label: 'بنرها و اشتراک', icon: Clock },
          { id: 'nav', label: 'منوها و ناوبری', icon: Layout },
          { id: 'dashboard', label: 'داشبورد فروشگاه', icon: TrendingUp },
          { id: 'medicines', label: 'کاتالوگ داروها', icon: Pill },
          { id: 'orders', label: 'سفارشات و فاکتورها', icon: FileText },
          { id: 'support', label: 'پشتیبانی و تماس', icon: MessageCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveScreen(tab.id as any);
                setSearchQuery('');
              }}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dual Layout: Live Simulator on Left, Visual Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: LIVE APP SIMULATOR (شبیه‌ساز زنده برنامه) */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              پیش‌نمایش زنده تعاملی (دقیقاً شبیه به برنامه واقعی):
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              بروزرسانی بلادرنگ
            </span>
          </div>

          <div className="bg-slate-900 rounded-3xl p-3 border-4 border-slate-800 shadow-2xl">
            {/* Mock Mobile/Desktop Device Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-slate-400 text-[11px] mb-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span>https://mvpanel.modesk.org</span>
              <Smartphone className="w-3.5 h-3.5" />
            </div>

            {/* Simulated App Container */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden text-slate-800 dark:text-slate-100 min-h-[480px] p-4 text-xs space-y-4 shadow-inner border border-slate-800/40">
              {/* Simulator Header */}
              <div className="bg-gradient-to-r from-sky-700 to-indigo-800 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
                    💊
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{getDraftText('app_name')}</h4>
                    <p className="text-[10px] text-sky-200">{getDraftText('app_subtitle')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {getDraftText('sub_active_badge')}
                  </span>
                </div>
              </div>

              {/* Dynamic Screen Simulator Content */}
              {activeScreen === 'general' && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                      سربرگ اصلی
                    </span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {getDraftText('app_name')}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {getDraftText('app_subtitle')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      {getDraftText('app_tagline')}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500">
                    {getDraftText('footer_copyright')}
                  </div>
                </div>
              )}

              {activeScreen === 'auth' && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {getDraftText('login_title')}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {getDraftText('login_subtitle')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {getDraftText('login_id_label')}
                        </label>
                        <input
                          type="text"
                          disabled
                          placeholder="نام کاربری یا شماره تماس"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {getDraftText('login_pass_label')}
                        </label>
                        <input
                          type="password"
                          disabled
                          value="••••••••"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px]"
                        />
                      </div>

                      <button
                        type="button"
                        disabled
                        className="w-full py-2 bg-sky-600 text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        {getDraftText('login_btn_text')}
                      </button>

                      <button
                        type="button"
                        disabled
                        className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-[11px]"
                      >
                        {getDraftText('login_guest_btn')}
                      </button>
                    </div>
                  </div>

                  {/* Register preview */}
                  <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800/60 space-y-1.5">
                    <h5 className="font-black text-xs text-sky-900 dark:text-sky-200">
                      {getDraftText('register_modal_title')}
                    </h5>
                    <p className="text-[10px] text-sky-800 dark:text-sky-300">
                      {getDraftText('register_modal_desc')}
                    </p>
                    <div className="text-[10px] text-slate-500 pt-1">
                      ☑️ {getDraftText('register_terms_text')}
                    </div>
                  </div>
                </div>
              )}

              {activeScreen === 'banners' && (
                <div className="space-y-3">
                  {/* Trial Banner */}
                  <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-3 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-200" />
                      <span>
                        <strong>{getDraftText('trial_banner_title')}</strong> ۱۴{' '}
                        {getDraftText('trial_banner_desc')}
                      </span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                      {getDraftText('trial_banner_button')}
                    </span>
                  </div>

                  {/* Expired Banner */}
                  <div className="bg-rose-600 text-white p-3 rounded-2xl flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <span className="text-[11px] font-medium leading-relaxed">
                      {getDraftText('expired_banner_text')}
                    </span>
                  </div>

                  {/* Subscription Page Card */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {getDraftText('sub_page_title')}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {getDraftText('sub_page_desc')}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px]">
                        {getDraftText('sub_active_badge')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeScreen === 'nav' && (
                <div className="space-y-2">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400">منوی ناوبری اصلی (سایدبار و منوی موبایل):</span>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                        📊 {getDraftText('nav_tab_dashboard')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        💊 {getDraftText('nav_tab_medicines')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        🛒 {getDraftText('nav_tab_orders')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        🏥 {getDraftText('nav_tab_customers')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        💼 {getDraftText('nav_tab_visitors')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        📍 {getDraftText('nav_tab_schedule')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        💰 {getDraftText('nav_tab_accounting')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        💬 {getDraftText('nav_tab_messages')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        📈 {getDraftText('nav_tab_reports')}
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        🛡️ {getDraftText('nav_tab_subscription')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeScreen === 'dashboard' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{getDraftText('dash_stat_sales')}</div>
                      <div className="text-base font-black text-sky-600 mt-1 font-mono">۱۲۴,۵۰۰ افغانی</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{getDraftText('dash_stat_orders')}</div>
                      <div className="text-base font-black text-emerald-600 mt-1 font-mono">۴۸ سفارش</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{getDraftText('dash_stat_debt')}</div>
                      <div className="text-base font-black text-amber-600 mt-1 font-mono">۳۲,۰۰۰ افغانی</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500">{getDraftText('dash_stat_low_stock')}</div>
                      <div className="text-base font-black text-rose-600 mt-1 font-mono">۵ قلم دارو</div>
                    </div>
                  </div>
                </div>
              )}

              {activeScreen === 'medicines' && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {getDraftText('med_title')}
                      </h4>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]">
                        {getDraftText('med_add_btn')}
                      </span>
                    </div>
                    <input
                      type="text"
                      disabled
                      placeholder={getDraftText('med_search_place')}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px]"
                    />
                  </div>
                </div>
              )}

              {activeScreen === 'orders' && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {getDraftText('orders_title')}
                      </h4>
                      <span className="px-2.5 py-1 bg-sky-600 text-white rounded-lg font-bold text-[10px]">
                        {getDraftText('orders_new_btn')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeScreen === 'support' && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {getDraftText('support_page_title')}
                    </h4>
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{getDraftText('support_whatsapp_btn')}</span>
                      </button>
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-sky-600" />
                        <span>{getDraftText('support_call_btn')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: VISUAL TEXT EDITOR (پنل ویرایش مستقیم متون) */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-600" />
                  <span>متون قابل ویرایش بخش: {filteredDefinitions[0]?.categoryLabel || 'انتخاب‌شده'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  متن دلخواه خود را بنویسید؛ تغییرات بلافاصله در شبیه‌ساز سمت راست نمایش داده می‌شود.
                </p>
              </div>

              <div className="w-48 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در تمام متون..."
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* List of Editable Text Inputs */}
            <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
              {filteredDefinitions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  متنی با عبارت جستجوی شما یافت نشد.
                </div>
              ) : (
                filteredDefinitions.map((def) => {
                  const currentValue =
                    draftTexts[def.key] !== undefined ? draftTexts[def.key] : def.defaultValue;
                  const isCustomized =
                    draftTexts[def.key] !== undefined && draftTexts[def.key].trim() !== '';

                  return (
                    <div
                      key={def.key}
                      className={`p-3.5 rounded-2xl border transition ${
                        isCustomized
                          ? 'border-purple-300 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{def.label}</span>
                          {isCustomized ? (
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                              سفارشی‌شده
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                              پیش‌فرض
                            </span>
                          )}
                        </label>

                        {isCustomized && (
                          <button
                            type="button"
                            onClick={() => handleResetSingle(def.key)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1 cursor-pointer transition"
                            title="بازگردانی این متن به پیش‌فرض"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>ریست به پیش‌فرض</span>
                          </button>
                        )}
                      </div>

                      {def.isMultiLine ? (
                        <textarea
                          rows={3}
                          value={currentValue}
                          onChange={(e) => handleTextChange(def.key, e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs font-medium"
                          placeholder={def.defaultValue}
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleTextChange(def.key, e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs font-medium"
                          placeholder={def.defaultValue}
                        />
                      )}

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {def.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-500">
                مجموع متون تعریف‌شده در سامانه: <strong>{APP_TEXT_DEFINITIONS.length}</strong> مورد
              </span>

              <button
                type="button"
                onClick={handleSaveAll}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره کلیه تغییرات در برنامه</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
