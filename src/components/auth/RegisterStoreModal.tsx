import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Storage } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterStoreModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { registerStore } = useApp();

  // Step state: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Form states
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanStore = storeName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUser = username.trim().toLowerCase();

    if (!cleanName || !cleanStore || !cleanPhone || !cleanEmail || !cleanUser) {
      setError('لطفاً تمام موارد ستاره‌دار را تکمیل نمایید.');
      return;
    }

    // Username validation: English letters and digits only, starts with a letter, 3 to 22 chars
    if (!/^[a-zA-Z]/.test(cleanUser)) {
      setError('حرف اول نام کاربری باید حتماً یکی از حروف انگلیسی (A-Z یا a-z) باشد.');
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]{2,21}$/.test(cleanUser)) {
      setError('نام کاربری باید بین ۳ تا ۲۲ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد (بدون فاصله، علامت یا حروف فارسی).');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('لطفاً یک آدرس ایمیل معتبر و صحیح وارد نمایید.');
      return;
    }

    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (password.length > 32) {
      setError('رمز عبور حداکثر می‌تواند ۳۲ کاراکتر باشد.');
      return;
    }

    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    if (!acceptTerms) {
      setError('لطفاً شرایط و قوانین استفاده از خدمات را تایید نمایید.');
      return;
    }

    // Local uniqueness check
    const profiles = Storage.getProfiles();
    if (profiles.some((p) => p.username.toLowerCase() === cleanUser)) {
      setError('این نام کاربری قبلاً در سامانه ثبت شده است. لطفاً نام دیگری برگزینید.');
      return;
    }
    if (profiles.some((p) => p.phone === cleanPhone)) {
      setError('این شماره تماس قبلاً در سامانه ثبت شده است.');
      return;
    }
    if (profiles.some((p) => p.email && p.email.toLowerCase() === cleanEmail)) {
      setError('این ایمیل قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.');
      return;
    }

    setLoading(true);

    try {
      // Register store directly & start 14-day trial
      const regRes = await registerStore({
        fullName: cleanName,
        storeName: cleanStore,
        phone: cleanPhone,
        email: cleanEmail,
        username: cleanUser,
        address: address.trim(),
        password: password.trim(),
      });

      setLoading(false);

      if (!regRes.success) {
        setError(regRes.message || 'خطا در ثبت نهایی فروشگاه.');
        return;
      }

      // Success! Show celebration and redirect
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'خطا در ثبت‌نام فروشگاه. لطفاً مجدداً تلاش کنید.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Banner with 14-day trial announcement */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>۲ هفته مهلت تست رایگان (بدون نیاز به پرداخت)</span>
            </div>
          </div>

          <h2 className="text-xl font-black">
            {step === 'form' && 'ثبت‌نام فروشگاه و عمده‌فروشی دارو'}
            {step === 'success' && 'تبریک! حساب شما با موفقیت فعال گردید'}
          </h2>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            {step === 'form' && 'اطلاعات فروشگاه خود را وارد کنید تا حساب بلافاصله فعال شود.'}
            {step === 'success' && 'در حال انتقال به داشبورد اختصاصی مدیریت فروشگاه...'}
          </p>
        </div>

        {/* Modal content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: FORM INPUTS */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام و تخلص مدیر *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={50}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: داکتر احمد رحیمی"
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام فروشگاه / عمده‌فروشی دارو *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={60}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="مثال: شرکت دارویی امید کابل"
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                      required
                    />
                    <Store className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس (افغانستان) *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      maxLength={15}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0799123456"
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono"
                      dir="ltr"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    آدرس ایمیل معتبر *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      maxLength={80}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pharmacy@example.com"
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono"
                      dir="ltr"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام کاربری ورود (حروف انگلیسی و عدد) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={22}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="omid_pharma"
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono text-left"
                    dir="ltr"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  نام کاربری باید با یک حرف انگلیسی شروع شود، حداکثر ۲۲ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نشانی و موقعیت فروشگاه
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="کابل، سرای شمالی، مارکت گلبهار"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رمز عبور (حداقل ۶ و حداکثر ۳۲ کاراکتر) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={32}
                      value={password}
                      onChange={(e) => setPassword(e.target.value.slice(0, 32))}
                      placeholder="••••••••"
                      className="w-full pr-9 pl-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono text-left"
                      dir="ltr"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تکرار رمز عبور *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      maxLength={32}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.slice(0, 32))}
                      placeholder="••••••••"
                      className="w-full pr-9 pl-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono text-left"
                      dir="ltr"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  شرایط استفاده از خدمات و حفظ حریم خصوصی داده‌های دارویی را می‌پذیرم.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ایجاد فروشگاه و شروع مهلت تست...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>ثبت‌نام و شروع فوری ۱۴ روز تست رایگان</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: SUCCESS CELEBRATION */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-90">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <CheckCircle className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                تبریک! فروشگاه شما با موفقیت ثبت شد
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                اشتراک ۱۴ روزه رایگان آغاز گردید. در حال انتقال به داشبورد اختصاصی مدیریت...
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
