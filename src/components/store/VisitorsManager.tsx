import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { UserProfile } from '../../types';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompressor';
import { parseNumberInput, toEnglishDigits } from '../../utils/numberUtils';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Lock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  X,
  ShieldAlert,
  Camera,
  Eye,
  EyeOff,
  Key,
  Trophy,
} from 'lucide-react';
import { VisitorLeaderboard } from '../common/VisitorLeaderboard';

export const VisitorsManager: React.FC = () => {
  const { currentStore, createVisitor, updateVisitor, toggleVisitorActive } = useApp();
  const storeId = currentStore?.id || '';

  const [profiles, setProfiles] = useState<UserProfile[]>(() =>
    Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewTab, setActiveViewTab] = useState<'leaderboard' | 'accounts'>('leaderboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<UserProfile | null>(null);

  // Danger Purge Modal
  const [purgeTarget, setPurgeTarget] = useState<UserProfile | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [city, setCity] = useState('کابل');
  const [address, setAddress] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(12000);
  const [commissionRate, setCommissionRate] = useState<number>(4.0);
  const [commissionBasis, setCommissionBasis] = useState<
    'approved_order' | 'delivered_order' | 'collected_payment'
  >('delivered_order');
  const [monthlyTarget, setMonthlyTarget] = useState<number>(250000);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(60000);
  const [employmentNotes, setEmploymentNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reloadData = () => {
    const list = Storage.getProfiles().filter(
      (p) => p.storeId === storeId && p.role === 'visitor'
    );
    setProfiles(list);
  };

  const openAddModal = () => {
    setFormError(null);
    setEditingVisitor(null);
    setName('');
    setPhone('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setCity('کابل');
    setAddress('');
    setBaseSalary(12000);
    setCommissionRate(4.0);
    setCommissionBasis('delivered_order');
    setMonthlyTarget(250000);
    setWeeklyTarget(60000);
    setEmploymentNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (v: UserProfile) => {
    setFormError(null);
    setEditingVisitor(v);
    setName(v.name);
    setPhone(v.phone);
    setUsername(v.username);
    setPassword(v.password || '');
    setShowPassword(false);
    setCity(v.city || 'کابل');
    setAddress(v.address || '');
    setBaseSalary(v.baseSalary || 12000);
    setCommissionRate(v.commissionRate || 4.0);
    setCommissionBasis(v.commissionBasis || 'delivered_order');
    setMonthlyTarget(v.monthlyTarget || 250000);
    setWeeklyTarget(v.weeklyTarget || 60000);
    setEmploymentNotes(v.employmentNotes || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !phone.trim() || !username.trim()) {
      setFormError('نام، شماره تماس و نام کاربری ویزیتور الزامی هستند.');
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    if (!editingVisitor) {
      if (!/^[a-zA-Z]/.test(cleanUser)) {
        setFormError('حرف اول نام کاربری باید حتماً یکی از حروف انگلیسی (A-Z یا a-z) باشد.');
        return;
      }
      if (!/^[a-zA-Z][a-zA-Z0-9]{2,21}$/.test(cleanUser)) {
        setFormError('نام کاربری باید بین ۳ تا ۲۲ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد (بدون فاصله، علامت یا حروف فارسی).');
        return;
      }
    }

    const duplicatePhone = profiles.find(
      (v) => v.phone.trim() === phone.trim() && v.id !== editingVisitor?.id
    );
    if (duplicatePhone) {
      setFormError(`ویزیتور دیگری با شماره تماس «${phone}» قبلاً در این فروشگاه ثبت شده است.`);
      return;
    }

    if (!editingVisitor) {
      if (password.trim().length < 6 || password.trim().length > 32) {
        setFormError('رمز عبور ویزیتور باید بین ۶ تا ۳۲ کاراکتر باشد.');
        return;
      }
    } else if (password.trim() && (password.trim().length < 6 || password.trim().length > 32)) {
      setFormError('در صورت تغییر رمز عبور، طول آن باید بین ۶ تا ۳۲ کاراکتر باشد.');
      return;
    }

    setLoading(true);

    if (editingVisitor) {
      const updates: Partial<UserProfile> = {
        name,
        phone,
        city,
        address,
        baseSalary: Number(baseSalary),
        commissionRate: Number(commissionRate),
        commissionBasis,
        monthlyTarget: Number(monthlyTarget),
        weeklyTarget: Number(weeklyTarget),
        employmentNotes,
      };
      if (password.trim()) {
        updates.password = password.trim();
      }
      updateVisitor(editingVisitor.id, updates);
      reloadData();
      setIsAddModalOpen(false);
    } else {
      if (!password.trim()) {
        setFormError('لطفاً رمز عبور اختصاصی ویزیتور را تعیین نمایید (حداقل ۶ کاراکتر)');
        setLoading(false);
        return;
      }
      if (password.trim().length < 6) {
        setFormError('رمز عبور ویزیتور باید حداقل ۶ کاراکتر باشد.');
        setLoading(false);
        return;
      }

      const res = await createVisitor({
        name,
        phone,
        username,
        password: password.trim(),
        city,
        address,
        baseSalary: Number(baseSalary),
        commissionRate: Number(commissionRate),
        commissionBasis,
        monthlyTarget: Number(monthlyTarget),
        weeklyTarget: Number(weeklyTarget),
        employmentNotes,
      });

      if (!res.success) {
        setFormError(res.message || 'خطا در ثبت ویزیتور');
      } else {
        reloadData();
        setIsAddModalOpen(false);
      }
    }
    setLoading(false);
  };

  // Toggle active / soft disable
  const handleToggleActive = (id: string) => {
    toggleVisitorActive(id);
    reloadData();
  };

  // Permanent Purge handler (with safety inspection)
  const handlePermanentPurge = async () => {
    if (!purgeTarget) return;

    // Remove user profile permanently locally and from Supabase cloud database
    await Storage.deleteProfileAsync(purgeTarget.id);

    // Keep orders with visitorName preserved as historical record
    reloadData();
    setPurgeTarget(null);
  };

  const filteredVisitors = useMemo(() => {
    return profiles.filter(
      (v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery) ||
        v.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profiles, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>مدیریت تیم ویزیتورها و رتبه‌بندی فروشگاه ({profiles.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مشاهده تابلوی افتخارات، جدول امتیازات عملکردی، شرایط حقوق و پورسانت و حساب‌های کاری
          </p>
        </div>

        {activeViewTab === 'accounts' && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن ویزیتور جدید</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation: 1. Leaderboard / Podium, 2. Accounts & Settings */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-0.5">
        <button
          onClick={() => setActiveViewTab('leaderboard')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeViewTab === 'leaderboard'
              ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>تابلوی افتخارات و جدول امتیازات ویزیتورها</span>
          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
            مخصوص مدیریت فروشگاه
          </span>
        </button>

        <button
          onClick={() => setActiveViewTab('accounts')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeViewTab === 'accounts'
              ? 'border-sky-600 text-sky-700 dark:text-sky-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4 text-sky-600" />
          <span>فهرست حساب‌ها و شرایط کاری ({profiles.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: VISITOR LEADERBOARD & PODIUM (Only visible to Store) */}
      {/* ========================================================= */}
      {activeViewTab === 'leaderboard' && (
        <div className="animate-in fade-in duration-150">
          <VisitorLeaderboard storeId={storeId} />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VISITOR ACCOUNTS & SETTINGS */}
      {/* ========================================================= */}
      {activeViewTab === 'accounts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Policy Reminder Card */}
          <div className="bg-sky-50 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 p-4 rounded-2xl text-xs text-sky-900 dark:text-sky-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">سیاست ماندگاری داده‌های ویزیتور:</div>
              <p className="text-sky-800 dark:text-slate-300 text-[11px] leading-relaxed">
                ویزیتورها امکان حذف حساب کاربری خود را ندارند. در صورت غیرفعال‌سازی توسط مدیر فروشگاه، حساب ویزیتور قفل شده و امکان ورود نخواهد داشت، اما تمام سوابق تاریخی فروش، مراجعات و حسابداری او در سامانه محفوظ خواهد ماند.
              </p>
            </div>
          </div>

          {/* Search Input for Accounts */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، تلفن یا نام کاربری..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500"
            />
          </div>

          {/* Visitors List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVisitors.map((v) => (
          <div
            key={v.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
              v.isActive ? 'border-slate-200/80' : 'border-slate-300 bg-slate-50/70 opacity-80'
            }`}
          >
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {v.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{v.name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">
                      نام کاربری: <strong className="text-slate-700">{v.username}</strong>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    v.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {v.isActive ? 'فعال' : 'غیرفعال شده'}
                </span>
              </div>

              {/* Compensation details */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
                <div>
                  <div className="text-slate-400 text-[10px]">حقوق ثابت</div>
                  <div className="font-bold text-slate-800 font-mono">
                    {(v.baseSalary || 0).toLocaleString()} AFN
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">درصد پورسانت</div>
                  <div className="font-bold text-sky-700 font-mono">
                    {v.commissionRate || 4}٪
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">تارگت ماهانه</div>
                  <div className="font-bold text-slate-800 font-mono">
                    {(v.monthlyTarget || 0).toLocaleString()} AFN
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div>
                  شماره تماس: <strong className="font-mono text-slate-800">{v.phone}</strong>
                </div>
                <div>
                  مبنای محاسبه کمیسیون:{' '}
                  <span className="font-semibold text-slate-700">
                    {v.commissionBasis === 'collected_payment'
                      ? 'وصول قطعی وجه'
                      : v.commissionBasis === 'delivered_order'
                      ? 'فروش تحویل‌شده'
                      : 'سفارش تأییدشده'}
                  </span>
                </div>
                {v.employmentNotes && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    یادداشت: {v.employmentNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(v)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش شرایط</span>
                </button>

                <button
                  onClick={() => handleToggleActive(v.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    v.isActive
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {v.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>{v.isActive ? 'غیرفعال‌سازی ورود' : 'فعال‌سازی مجدد'}</span>
                </button>
              </div>

              <button
                onClick={() => setPurgeTarget(v)}
                className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 text-xs"
                title="حذف سوابق با تأیید صریح"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

      {/* Add / Edit Visitor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>{editingVisitor ? 'ویرایش اطلاعات ویزیتور' : 'ایجاد حساب ویزیتور جدید'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: فرید احمـدی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    شماره تماس همراه *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام کاربری (جهت ورود ویزیتور به پنل) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={22}
                  disabled={!!editingVisitor}
                  value={username}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 22);
                    setUsername(clean);
                  }}
                  placeholder="مثال: farid2025"
                  className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-medium disabled:opacity-50 font-mono shadow-2xs"
                  dir="ltr"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>فقط حروف و عدد انگلیسی (شروع با حرف، حداکثر ۲۲ کاراکتر)</span>
                  <span className="font-mono font-bold text-sky-600">{username.length}/22</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {editingVisitor ? 'تغییر رمز عبور ویزیتور (اختیاری)' : 'رمز عبور ویزیتور *'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {editingVisitor ? 'در صورت خالی ماندن، تغییر نمی‌کند (حداکثر ۳۲ کاراکتر)' : '۶ تا ۳۲ کاراکتر'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingVisitor}
                    maxLength={32}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, 32))}
                    placeholder={editingVisitor ? 'رمز جدید را وارد کنید...' : 'رمز عبور ورود ویزیتور'}
                    className="w-full pr-3 pl-9 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-medium font-mono shadow-2xs"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'مخفی کردن' : 'نمایش'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    حقوق ثابت (افغانی)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={baseSalary || ''}
                    onChange={(e) => setBaseSalary(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    درصد پورسانت (٪)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={commissionRate || ''}
                    onChange={(e) => setCommissionRate(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تارگت ماه (AFN)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={monthlyTarget || ''}
                    onChange={(e) => setMonthlyTarget(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مبنای محاسبه پورسانت
                </label>
                <select
                  value={commissionBasis}
                  onChange={(e) => setCommissionBasis(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="delivered_order">فروش تحویل داده شده (پیش‌فرض)</option>
                  <option value="collected_payment">مبلغ وصول شده و نقد شده</option>
                  <option value="approved_order">مبلغ سفارش تأیید شده</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  یادداشت مدیریتی / منطقه فعالیت
                </label>
                <input
                  type="text"
                  value={employmentNotes}
                  onChange={(e) => setEmploymentNotes(e.target.value)}
                  placeholder="مثال: بازاریاب مناطق کارته ۴ و دارالامان"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
                >
                  {editingVisitor ? 'بروزرسانی شرایط' : 'ایجاد حساب ویزیتور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Warning for Permanent Purge */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-slate-800 text-base">هشدار حذف پرونده ویزیتور</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                آیا از حذف پرونده کاربری <strong>{purgeTarget.name}</strong> اطمینان دارید؟
                طبق قواعد قانونی حسابداری، فاکتورها و سفارشات پیشین جهت ممیزی مالیاتی و تسویه مشتریان حذف نخواهند شد، اما حساب ویزیتور کاملاً مسدود خواهد گشت.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setPurgeTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handlePermanentPurge}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20"
              >
                تأیید و اجرای عملیات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
