import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getAppLockConfig, saveAppLockConfig, setSessionLocked, AppLockConfig } from '../../utils/appLock';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Camera,
  Lock,
  CheckCircle2,
  X,
  Upload,
  Sparkles,
  DollarSign,
  TrendingUp,
  Target,
  FileText,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  Smartphone,
  Timer,
  Edit2,
} from 'lucide-react';
import { Storage } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Preset avatars for rapid selection
const PRESET_AVATARS = [
  { id: 'doc_male', label: 'دکتر داروساز (آقا)', icon: '👨‍⚕️' },
  { id: 'doc_female', label: 'دکتر داروساز (خانم)', icon: '👩‍⚕️' },
  { id: 'visitor_male', label: 'ویزیتور رسمی', icon: '💼' },
  { id: 'manager', label: 'مدیر بازرگانی', icon: '🧑‍💼' },
  { id: 'pharmacist', label: 'مسئول فنی دواخانه', icon: '🧑‍🔬' },
  { id: 'accountant', label: 'حسابدار و امور مالی', icon: '👨‍💻' },
];

export const UserProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, currentStore, updateProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || 'کابل');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // App PIN Lock State
  const [appLockConfig, setAppLockConfig] = useState<AppLockConfig>(() => {
    return currentUser ? getAppLockConfig(currentUser.id) : { enabled: false, pin: '', autoLockDelay: 0 };
  });
  const [lockPin, setLockPin] = useState(appLockConfig.pin);
  const [confirmLockPin, setConfirmLockPin] = useState(appLockConfig.pin);
  const [showLockPin, setShowLockPin] = useState(false);
  const [lockSaveSuccess, setLockSaveSuccess] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  // Handle custom file upload with downscaling for localStorage safety
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          setErrorMessage(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('نام و نام‌خانوادگی نمی‌تواند خالی باشد.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('شماره تماس الزامی است.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updates: Partial<typeof currentUser> = {
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      avatarUrl: avatarUrl.trim(),
    };

    // If not a visitor (e.g. store owner or admin), allow updating username
    const isVisitor = currentUser.role === 'visitor';
    if (!isVisitor && username.trim()) {
      const cleanUser = username.trim().toLowerCase();
      if (cleanUser !== currentUser.username.toLowerCase()) {
        if (!/^[a-zA-Z][a-zA-Z0-9_]{2,21}$/.test(cleanUser)) {
          setIsSaving(false);
          setErrorMessage('نام کاربری باید حداقل ۳ کاراکتر، با حروف انگلیسی شروع شود و فقط شامل حروف، اعداد و _ باشد.');
          return;
        }
        const allProfiles = Storage.getProfiles();
        if (allProfiles.some((p) => p.id !== currentUser.id && p.username.toLowerCase() === cleanUser)) {
          setIsSaving(false);
          setErrorMessage('این نام کاربری قبلاً توسط کاربر دیگری در سامانه ثبت شده است.');
          return;
        }
        updates.username = cleanUser;
      }
    }

    if (newPassword.trim()) {
      if (currentUser.password && currentPassword.trim() !== currentUser.password) {
        setIsSaving(false);
        setErrorMessage('رمز عبور فعلی نادرست است. لطفاً رمز عبور فعلی صحیح را وارد کنید.');
        return;
      }
      if (newPassword.trim().length < 4) {
        setIsSaving(false);
        setErrorMessage('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.');
        return;
      }
      if (newPassword.trim().length > 32) {
        setIsSaving(false);
        setErrorMessage('رمز عبور جدید حداکثر می‌تواند ۳۲ کاراکتر باشد.');
        return;
      }
      if (newPassword.trim() !== confirmNewPassword.trim()) {
        setIsSaving(false);
        setErrorMessage('رمز عبور جدید با تکرار آن مطابقت ندارد.');
        return;
      }
      updates.password = newPassword.trim();
    }

    const res = await updateProfile(updates);

    setIsSaving(false);

    if (res.success) {
      setSuccessMessage('اطلاعات پروفایل شما با موفقیت ذخیره شد.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } else {
      setErrorMessage(res.message || 'خطا در ثبت اطلاعات');
    }
  };

  const handleSaveAppLock = () => {
    setLockError(null);
    setLockSaveSuccess(null);
    if (!currentUser) return;

    if (appLockConfig.enabled) {
      if (!lockPin.trim()) {
        setLockError('لطفاً یک رمز عبور یا پین عددی برای قفل برنامه تعیین کنید.');
        return;
      }
      if (lockPin.trim().length < 4) {
        setLockError('رمز قفل برنامه باید حداقل ۴ رقم یا کاراکتر باشد.');
        return;
      }
      if (lockPin.trim().length > 12) {
        setLockError('رمز قفل برنامه حداکثر ۱۲ رقم می‌تواند باشد.');
        return;
      }
      if (lockPin !== confirmLockPin) {
        setLockError('رمز قفل برنامه و تکرار آن یکسان نیستند.');
        return;
      }
    }

    const updated: AppLockConfig = {
      enabled: appLockConfig.enabled,
      pin: lockPin.trim(),
      autoLockDelay: appLockConfig.autoLockDelay,
    };
    saveAppLockConfig(currentUser.id, updated);
    setAppLockConfig(updated);
    setLockSaveSuccess('تنظیمات قفل امنیتی برنامه با موفقیت ذخیره شد.');
    setTimeout(() => setLockSaveSuccess(null), 3000);
  };

  const handleTestLockNow = () => {
    if (!appLockConfig.enabled || !lockPin.trim()) {
      setLockError('ابتدا قفل برنامه را فعال کرده و رمز تعیین نمایید.');
      return;
    }
    handleSaveAppLock();
    setSessionLocked(true);
    onClose();
    // Dispatch storage or custom event so App locks immediately
    window.dispatchEvent(new Event('app_lock_triggered'));
  };

  const isPresetIcon = (url: string) => {
    return PRESET_AVATARS.some((p) => p.icon === url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black">پروفایل کاربری من</h2>
                <span className="bg-white/20 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border border-white/20" dir="ltr">
                  @{currentUser.username}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                مشاهده و ویرایش مشخصات فردی، عکس و تنظیمات حساب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <X className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>تصویر یا آواتار پروفایل:</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-sky-600 shadow-md flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    isPresetIcon(avatarUrl) ? (
                      <span className="text-5xl">{avatarUrl}</span>
                    ) : (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center">
                      {name.slice(0, 1) || 'U'}
                    </div>
                  )}
                </div>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-md transition"
                    title="حذف عکس"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload & Presets Actions */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>بارگذاری عکس از دستگاه</span>
                  </button>

                  <span className="text-[11px] text-slate-400">یا انتخاب آواتار آماده:</span>
                </div>

                {/* Preset Avatars Grid */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.icon)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        avatarUrl === preset.icon
                          ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-[11px]">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account Identifiers (Username & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sky-50/60 dark:bg-slate-800/60 border border-sky-200/80 dark:border-slate-700 rounded-2xl p-4">
            {/* Username Field */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  نام کاربری (Username)
                </span>
                {currentUser.role === 'visitor' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md font-bold">
                    <Lock className="w-3 h-3" />
                    غیرقابل تغییر برای ویزیتور
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-bold">
                    <Edit2 className="w-3 h-3" />
                    قابل تغییر توسط شما
                  </span>
                )}
              </div>
              {currentUser.role === 'visitor' ? (
                <input
                  type="text"
                  value={currentUser.username}
                  disabled
                  readOnly
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-200 cursor-not-allowed text-left"
                />
              ) : (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  dir="ltr"
                  placeholder="نام کاربری انگلیسی"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-left focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              )}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {currentUser.role === 'visitor'
                  ? 'شناسه ثبت‌شده شما جهت ورود به سامانه'
                  : 'شناسه شما جهت ورود به سامانه (در صورت تغییر، برای دفعات بعدی با این شناسه وارد شوید)'}
              </p>
            </div>

            {/* Email - READ-ONLY */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  ایمیل کاربری (Email)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-md font-bold">
                  <Lock className="w-3 h-3" />
                  ثابت
                </span>
              </div>
              <input
                type="email"
                value={currentUser.email || 'ثبت نشده'}
                disabled
                readOnly
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed text-left"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                ایمیل پس از ثبت‌نام اولیه جهت امنیت و بازیابی حساب قفل است
              </p>
            </div>
          </div>

          {/* Editable Fields: Name, Phone, City, Address */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800">مشخصات قابل ویرایش:</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام و نام‌خانوادگی: *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="مثال: دکتر احمد نیازی"
                    className="w-full pr-9 pl-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره تماس / موبایل: *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="07XXXXXXXX"
                    className="w-full pr-9 pl-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 text-right focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شهر / ولایت:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: کابل، هرات، مزارشریف"
                    className="w-full pr-9 pl-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نقش و فروشگاه سازمانی:
                </label>
                <div className="flex items-center gap-2 py-2">
                  <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-xl text-xs font-bold">
                    {currentUser.role === 'store_owner'
                      ? '👑 مدیر فروشگاه'
                      : currentUser.role === 'visitor'
                      ? '💼 ویزیتور رسمی'
                      : '🛡️ مدیر کل سیستم'}
                  </span>
                  {currentStore && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{currentStore.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                آدرس کامل کاری / محل سکونت:
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="آدرس دقیق، ناحیه، خیابان یا مجتمع تجارتی..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Security & Password Setting Section */}
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">
                    تعیین و تغییر رمز عبور حساب ({currentUser.role === 'store_owner' ? 'مدیر فروشگاه' : 'ویزیتور'})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {currentUser.password
                      ? 'رمز عبور فعال است. برای تغییر آن کلیک کنید.'
                      : 'جهت افزایش امنیت، برای حساب خود رمز عبور تعیین کنید.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="px-3 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold transition cursor-pointer"
              >
                {isChangingPassword ? 'انصراف از تغییر رمز' : 'تغییر رمز عبور'}
              </button>
            </div>

            {isChangingPassword && (
              <div className="pt-3 border-t border-slate-200/70 space-y-3 animate-in fade-in duration-200">
                {currentUser.password && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رمز عبور فعلی:
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-3 pl-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-hidden focus:border-sky-500"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showCurrentPassword ? 'مخفی کردن' : 'نمایش'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رمز عبور جدید:
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="حداقل ۴ کاراکتر"
                        className="w-full pr-3 pl-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-hidden focus:border-sky-500"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showNewPassword ? 'مخفی کردن' : 'نمایش'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تکرار رمز عبور جدید:
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="تکرار رمز جدید"
                        className="w-full pr-3 pl-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-hidden focus:border-sky-500"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showConfirmPassword ? 'مخفی کردن' : 'نمایش'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  پس از ذخیره تغییرات، رمز عبور جدید برای ورودهای آینده شما اعمال خواهد شد.
                </p>
              </div>
            )}
          </div>

          {/* App Lock / Device Security Section */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-slate-50 border-2 border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>قفل امنیتی برنامه (App PIN Lock)</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      محافظت از اطلاعات در گوشی
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    اگر گوشی دست فرد دیگری بود، برنامه قفل می‌شود و بدون رمز امکان ورود نخواهد داشت.
                  </p>
                </div>
              </div>

              {/* Toggle Enable Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appLockConfig.enabled}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setAppLockConfig((prev) => ({ ...prev, enabled: isChecked }));
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {lockSaveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{lockSaveSuccess}</span>
              </div>
            )}

            {lockError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{lockError}</span>
              </div>
            )}

            {appLockConfig.enabled && (
              <div className="pt-3 border-t border-indigo-100 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رمز ورود یا پین برنامه (۴ تا ۱۲ رقم):
                    </label>
                    <div className="relative">
                      <input
                        type={showLockPin ? 'text' : 'password'}
                        maxLength={12}
                        value={lockPin}
                        onChange={(e) => setLockPin(e.target.value)}
                        placeholder="مثال: 1234"
                        className="w-full pr-3 pl-10 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-left focus:border-indigo-500 text-slate-900"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLockPin(!showLockPin)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showLockPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تکرار رمز قفل برنامه:
                    </label>
                    <div className="relative">
                      <input
                        type={showLockPin ? 'text' : 'password'}
                        maxLength={12}
                        value={confirmLockPin}
                        onChange={(e) => setConfirmLockPin(e.target.value)}
                        placeholder="تکرار رمز قفل"
                        className="w-full pr-3 pl-10 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-left focus:border-indigo-500 text-slate-900"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Lock Delay Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>زمان قفل خودکار برنامه:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { delay: 0, label: 'بلافاصله پس از خروج' },
                      { delay: 60, label: 'بعد از ۱ دقیقه' },
                      { delay: 300, label: 'بعد از ۵ دقیقه' },
                      { delay: 900, label: 'بعد از ۱۵ دقیقه' },
                    ].map((opt) => (
                      <button
                        key={opt.delay}
                        type="button"
                        onClick={() => setAppLockConfig((p) => ({ ...p, autoLockDelay: opt.delay }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          appLockConfig.autoLockDelay === opt.delay
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white hover:bg-indigo-50/50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-100/60">
                  <button
                    type="button"
                    onClick={handleSaveAppLock}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    ذخیره تنظیمات قفل
                  </button>

                  <button
                    type="button"
                    onClick={handleTestLockNow}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>تست و قفل فوری برنامه</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visitor-specific Informational Section */}
          {currentUser.role === 'visitor' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>اطلاعات قرارداد و حقوق (تعیین‌شده توسط مدیر فروشگاه):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] text-slate-400">حقوق ثابت ماهانه</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                    {(currentUser.baseSalary || 0).toLocaleString()} AFN
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] text-slate-400">نرخ پورسانت فروش</div>
                  <div className="text-xs font-bold text-sky-700 mt-0.5 font-mono">
                    {currentUser.commissionRate || 0}%
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] text-slate-400">تارگت ماهانه فروش</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5 font-mono">
                    {(currentUser.monthlyTarget || 0).toLocaleString()} AFN
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="text-[10px] text-slate-400">مبنای تسویه</div>
                  <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                    {currentUser.commissionBasis === 'delivered_order'
                      ? 'سفارش تحویل‌شده'
                      : currentUser.commissionBasis === 'collected_payment'
                      ? 'وصول نقدی'
                      : 'تأیید فاکتور'}
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>در حال ذخیره...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ذخیره تغییرات پروفایل</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
