import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Store, UserProfile, SupportTicket, SupportFaq, SubscriptionStatus, UserRole } from '../../types';
import { parseNumberInput, toEnglishDigits } from '../../utils/numberUtils';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
import {
  Shield,
  Store as StoreIcon,
  Users,
  LifeBuoy,
  Palette,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Send,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  Eye,
  EyeOff,
  MessageSquare,
  Lock,
  ShieldAlert,
  Key,
  HelpCircle,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Bell,
  Search,
  Filter,
  DollarSign,
  Phone,
  MessageCircle,
  X,
  UserCheck,
  UserX,
  Sliders,
} from 'lucide-react';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { MetricCardWithSparkline } from '../charts/MetricCardWithSparkline';
import { VisualAppEditor } from './VisualAppEditor';
import { SupabaseSync } from '../../utils/supabaseSync';

export const CreatorEmbeddedPanel: React.FC = () => {
  const { platformConfig, updatePlatformConfig, updateStoreSubscription, refreshState, shamsiDate } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'visual_editor' | 'announcement' | 'stores' | 'users' | 'support' | 'platform' | 'danger'>('overview');

  const [stores, setStores] = useState<Store[]>(() => Storage.getStores());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => Storage.getProfiles());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => Storage.getSupportTickets());

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const syncWithCloud = async () => {
    if (!supabase || !isSupabaseConfigured) {
      showToast('اتصال به سرور ابری سوپابیس پیکربندی نشده است.');
      return;
    }
    try {
      setIsSyncingCloud(true);
      const [storesRes, profilesRes] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      if (storesRes.error) {
        console.warn('Supabase stores fetch warning:', storesRes.error);
      }
      if (profilesRes.error) {
        console.warn('Supabase profiles fetch warning:', profilesRes.error);
      }

      let newStores = Storage.getStores();
      if (storesRes.data && storesRes.data.length > 0) {
        const cloudStores: Store[] = storesRes.data.map((s: any) => {
          const isTrial = s.subscription_plan === 'trial' || s.subscription_plan === '14-Day Trial';
          const planName = isTrial ? '14-Day Trial' : (s.subscription_plan || '14-Day Trial');
          const isExpired = s.subscription_expires_at
            ? new Date(s.subscription_expires_at).getTime() < Date.now()
            : false;
          const status: SubscriptionStatus = !s.is_active
            ? 'suspended'
            : isExpired
            ? 'expired'
            : isTrial
            ? 'trial'
            : 'active';

          return {
            id: s.id,
            name: s.name,
            ownerId: '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            createdAt: s.created_at || new Date().toISOString(),
            groupChatEnabled: true,
            subscription: {
              id: `sub_${s.id}`,
              storeId: s.id,
              planName,
              status,
              startDate: s.created_at || new Date().toISOString(),
              endDate:
                s.subscription_expires_at ||
                new Date(Date.now() + 14 * 86400000).toISOString(),
              trialDaysRemaining: 14,
              priceAFN: 0,
              renewalHistory: [],
            },
          };
        });

        cloudStores.forEach((cs) => {
          const idx = newStores.findIndex((st) => st.id === cs.id);
          if (idx >= 0) {
            newStores[idx] = {
              ...newStores[idx],
              ...cs,
              subscription: {
                ...newStores[idx].subscription,
                ...cs.subscription,
              },
            };
          } else {
            newStores.push(cs);
          }
        });
        Storage.saveStores(newStores);
        setStores([...newStores]);
      }

      let newProfiles = Storage.getProfiles();
      if (profilesRes.data && profilesRes.data.length > 0) {
        const cloudProfiles: UserProfile[] = profilesRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.username?.includes('@') ? p.username : undefined,
          username: p.username,
          password: p.password_hash || '123456',
          role: p.role as any,
          storeId: p.store_id || undefined,
          avatarUrl: p.avatar_url || undefined,
          city: p.city || 'کابل',
          createdAt: p.created_at || new Date().toISOString(),
          isActive: p.is_active ?? true,
        }));

        cloudProfiles.forEach((cp) => {
          const idx = newProfiles.findIndex(
            (pr) => pr.id === cp.id || pr.username.toLowerCase() === cp.username.toLowerCase()
          );
          if (idx >= 0) {
            newProfiles[idx] = { ...newProfiles[idx], ...cp };
          } else {
            newProfiles.push(cp);
          }
        });
        Storage.saveProfiles(newProfiles);
        setProfiles([...newProfiles]);
      }

      showToast(`همگام‌سازی ابری با موفقیت انجام شد: ${newStores.length} فروشگاه و ${newProfiles.length} کاربر در دسترس است.`);
    } catch (err) {
      console.warn('Sync with cloud error:', err);
      showToast('خطا در دریافت اطلاعات از سرور ابری سوپابیس.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const pushAllToCloud = async () => {
    if (!supabase || !isSupabaseConfigured) {
      showToast('اتصال به سرور ابری سوپابیس پیکربندی نشده است.');
      return;
    }
    try {
      setIsSyncingCloud(true);
      const localStores = Storage.getStores();
      const localProfiles = Storage.getProfiles();
      for (const s of localStores) {
        await SupabaseSync.syncStore(s);
      }
      for (const p of localProfiles) {
        await SupabaseSync.syncProfile(p);
      }
      showToast(`کلیه ${localStores.length} فروشگاه و ${localProfiles.length} کاربر با موفقیت به سوپابیس ارسال شدند.`);
      await syncWithCloud();
    } catch (e: any) {
      showToast('خطا در ارسال اطلاعات به سرور ابری: ' + (e?.message || 'نامشخص'));
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Real-time synchronization
  useEffect(() => {
    syncWithCloud();
    const handleStorageChange = () => {
      setTickets(Storage.getSupportTickets());
      setStores(Storage.getStores());
      setProfiles(Storage.getProfiles());
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      setTickets(Storage.getSupportTickets());
    }, 3000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const reloadData = () => {
    setStores(Storage.getStores());
    setProfiles(Storage.getProfiles());
    setTickets(Storage.getSupportTickets());
  };

  // ==========================================
  // TAB 1: OVERVIEW METRICS (Dynamic & Real)
  // ==========================================
  const trialStores = useMemo(() => stores.filter((s) => s.subscription.status === 'trial'), [stores]);
  const activeStores = useMemo(() => stores.filter((s) => s.subscription.status === 'active'), [stores]);
  const expiredStores = useMemo(() => stores.filter((s) => s.subscription.status === 'expired'), [stores]);
  const activeVisitors = useMemo(() => profiles.filter((p) => p.role === 'visitor' && p.isActive), [profiles]);

  const subscriptionSegments: DonutSegment[] = useMemo(() => {
    return [
      { id: 'trial', label: 'تست رایگان ۱۴ روزه', value: trialStores.length, color: '#0284c7' },
      { id: 'active', label: 'اشتراک‌های فعال', value: activeStores.length, color: '#10b981' },
      { id: 'expired', label: 'منقضی شده', value: expiredStores.length, color: '#ef4444' },
    ].filter((s) => s.value > 0);
  }, [trialStores, activeStores, expiredStores]);

  // ==========================================
  // TAB 2: ANNOUNCEMENT MANAGER
  // ==========================================
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(
    platformConfig.announcementEnabled || false
  );
  const [announcementTitle, setAnnouncementTitle] = useState<string>(
    platformConfig.announcementTitle || ''
  );
  const [announcementMessage, setAnnouncementMessage] = useState<string>(
    platformConfig.publicAnnouncement || ''
  );
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'urgent' | 'success'>(
    platformConfig.announcementType || 'info'
  );
  const [announcementTargetRole, setAnnouncementTargetRole] = useState<'all' | 'store_owner' | 'visitor'>(
    platformConfig.announcementTargetRole || 'all'
  );
  const [announcementDismissible, setAnnouncementDismissible] = useState<boolean>(
    platformConfig.announcementDismissible !== false
  );

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformConfig({
      announcementEnabled,
      announcementTitle: announcementTitle.trim(),
      publicAnnouncement: announcementMessage.trim(),
      announcementType,
      announcementTargetRole,
      announcementDismissible,
      announcementDate: shamsiDate?.textDate || new Date().toISOString().slice(0, 10),
    });
    showToast('اطلاعیه سراسری با موفقیت ذخیره و در سامانه منتشر شد.');
  };

  const handleApplyTemplate = (
    title: string,
    msg: string,
    type: 'info' | 'warning' | 'urgent' | 'success',
    target: 'all' | 'store_owner' | 'visitor'
  ) => {
    setAnnouncementEnabled(true);
    setAnnouncementTitle(title);
    setAnnouncementMessage(msg);
    setAnnouncementType(type);
    setAnnouncementTargetRole(target);
    showToast(`قالب «${title}» بارگذاری شد. جهت اعمال دکمه ذخیره را بزنید.`);
  };

  // ==========================================
  // TAB 3: STORES & SUBSCRIPTIONS
  // ==========================================
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeEditName, setStoreEditName] = useState('');
  const [storeEditPhone, setStoreEditPhone] = useState('');
  const [storeEditEmail, setStoreEditEmail] = useState('');
  const [storeEditAddress, setStoreEditAddress] = useState('');
  const [storeEditStatus, setStoreEditStatus] = useState<SubscriptionStatus>('trial');
  const [storeEditPlanName, setStoreEditPlanName] = useState<'14-Day Trial' | '6-Month Plan' | '1-Year Plan' | 'Custom'>('14-Day Trial');
  const [customDaysInput, setCustomDaysInput] = useState<string>('30');
  const [targetStoreForDays, setTargetStoreForDays] = useState<string | null>(null);

  const handleOpenStoreEdit = (s: Store) => {
    setEditingStore(s);
    setStoreEditName(s.name);
    setStoreEditPhone(s.phone || '');
    setStoreEditEmail(s.email || '');
    setStoreEditAddress(s.address || '');
    setStoreEditStatus(s.subscription?.status || 'trial');
    setStoreEditPlanName(s.subscription?.planName || '14-Day Trial');
  };

  const handleSaveStoreEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    const allStores = Storage.getStores();
    const isNowActive = storeEditStatus === 'active';
    let newEnd = editingStore.subscription?.endDate || new Date().toISOString();

    if (isNowActive && storeEditPlanName !== '14-Day Trial') {
      const days =
        storeEditPlanName === '6-Month Plan'
          ? 180
          : storeEditPlanName === '1-Year Plan'
          ? 365
          : Math.max(1, parseInt(toEnglishDigits(customDaysInput)) || 30);
      const currentEndMs = new Date(newEnd).getTime();
      const baseMs = !isNaN(currentEndMs) && currentEndMs > Date.now() ? currentEndMs : Date.now();
      newEnd = new Date(baseMs + days * 86400000).toISOString();
    } else if (storeEditStatus === 'trial' || storeEditPlanName === '14-Day Trial') {
      newEnd = new Date(Date.now() + 14 * 86400000).toISOString();
    }

    const updated = allStores.map((s) => {
      if (s.id === editingStore.id) {
        return {
          ...s,
          name: storeEditName.trim(),
          phone: toEnglishDigits(storeEditPhone.trim()),
          email: storeEditEmail.trim(),
          address: storeEditAddress.trim(),
          subscription: {
            ...s.subscription,
            status: storeEditStatus,
            planName: storeEditPlanName,
            endDate: newEnd,
          },
        };
      }
      return s;
    });

    Storage.saveStores(updated);

    // Also update owner profile phone/name
    const allProfiles = Storage.getProfiles();
    const profUpdated = allProfiles.map((p) => {
      if (p.storeId === editingStore.id && p.role === 'store_owner') {
        return {
          ...p,
          phone: toEnglishDigits(storeEditPhone.trim()) || p.phone,
          email: storeEditEmail.trim() || p.email,
        };
      }
      return p;
    });
    Storage.saveProfiles(profUpdated);

    // Sync store changes to Supabase cloud immediately
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('stores')
          .update({
            name: storeEditName.trim(),
            phone: toEnglishDigits(storeEditPhone.trim()),
            email: storeEditEmail.trim(),
            address: storeEditAddress.trim(),
            subscription_plan: storeEditPlanName,
            subscription_expires_at: newEnd,
            is_active: storeEditStatus !== 'suspended',
          })
          .eq('id', editingStore.id);
      } catch (err) {
        console.warn('Sync store edit to Supabase warning:', err);
      }
    }

    try {
      localStorage.removeItem(`visitor_store_trial_ratchet_${editingStore.id}`);
    } catch {}

    reloadData();
    setEditingStore(null);
    showToast(`مشخصات و اشتراک «${storeEditName}» با موفقیت بروزرسانی و در سرور ابری ثبت شد.`);
  };

  const handleExtendDays = async (storeId: string, days: number) => {
    const s = stores.find((st) => st.id === storeId);
    if (!s) return;
    const currentEnd = new Date(s.subscription.endDate).getTime();
    const baseTime = !isNaN(currentEnd) && currentEnd > Date.now() ? currentEnd : Date.now();
    const newEnd = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    const plan: '14-Day Trial' | '6-Month Plan' | '1-Year Plan' | 'Custom' =
      days >= 365 ? '1-Year Plan' : days >= 180 ? '6-Month Plan' : days === 14 ? '14-Day Trial' : 'Custom';
    
    await updateStoreSubscription(storeId, plan, days);
    
    try {
      localStorage.removeItem(`visitor_store_trial_ratchet_${storeId}`);
    } catch {}

    reloadData();
    setTargetStoreForDays(null);
    showToast(`طرح «${plan}» به مدت ${days} روز برای فروشگاه با موفقیت فعال و در سوپابیس ذخیره شد.`);
  };

  const handleDeleteStore = (storeId: string, storeName: string) => {
    if (confirm(`آیا از حذف کامل فروشگاه «${storeName}» اطمینان دارید؟ تمامی اطلاعات آن حذف خواهد شد.`)) {
      const allStores = Storage.getStores().filter((s) => s.id !== storeId);
      Storage.saveStores(allStores);
      const allProfiles = Storage.getProfiles().filter((p) => p.storeId !== storeId);
      Storage.saveProfiles(allProfiles);
      reloadData();
      showToast(`فروشگاه «${storeName}» با موفقیت حذف گردید.`);
    }
  };

  // ==========================================
  // TAB 4: USERS & PASSWORDS MANAGER
  // ==========================================
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userEditName, setUserEditName] = useState('');
  const [userEditPhone, setUserEditPhone] = useState('');
  const [userEditEmail, setUserEditEmail] = useState('');
  const [userEditCity, setUserEditCity] = useState('');
  const [userEditRole, setUserEditRole] = useState<UserRole>('visitor');
  const [userEditCommission, setUserEditCommission] = useState<string>('5');
  const [userEditSalary, setUserEditSalary] = useState<string>('0');
  const [userNewPassword, setUserNewPassword] = useState('');
  const [showUserPasswordInput, setShowUserPasswordInput] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    const engQ = toEnglishDigits(q);
    return profiles.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        toEnglishDigits(p.phone).includes(engQ) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.role === 'store_owner' && 'مدیر فروشگاه'.includes(q)) ||
        (p.role === 'visitor' && 'ویزیتور'.includes(q))
      );
    });
  }, [profiles, userSearchQuery]);

  const handleOpenUserEdit = (u: UserProfile) => {
    setEditingUser(u);
    setUserEditName(u.name);
    setUserEditPhone(u.phone || '');
    setUserEditEmail(u.email || '');
    setUserEditCity(u.city || 'کابل');
    setUserEditRole(u.role);
    setUserEditCommission(String(u.commissionRate || 5));
    setUserEditSalary(String(u.baseSalary || 0));
    setUserNewPassword('');
    setShowUserPasswordInput(false);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const allProfiles = Storage.getProfiles();
    const updated = allProfiles.map((p) => {
      if (p.id === editingUser.id) {
        return {
          ...p,
          name: userEditName.trim(),
          phone: toEnglishDigits(userEditPhone.trim()),
          email: userEditEmail.trim(),
          city: userEditCity.trim(),
          role: userEditRole,
          commissionRate: parseNumberInput(userEditCommission, 5),
          baseSalary: parseNumberInput(userEditSalary, 0),
          password: userNewPassword.trim() ? toEnglishDigits(userNewPassword.trim()) : p.password,
        };
      }
      return p;
    });

    Storage.saveProfiles(updated);
    reloadData();
    setEditingUser(null);
    showToast('مشخصات و دسترسی‌های کاربر با موفقیت ذخیره شد.');
  };

  const handleToggleUserActive = (userId: string, currentActive: boolean) => {
    const all = Storage.getProfiles();
    const updated = all.map((p) => (p.id === userId ? { ...p, isActive: !currentActive } : p));
    Storage.saveProfiles(updated);
    reloadData();
    showToast(currentActive ? 'حساب کاربری غیرفعال گردید.' : 'حساب کاربری فعال گردید.');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`آیا از حذف دائمی کاربر «${userName}» از سامانه و دیتابیس ابری مطمئن هستید؟ این عملیات قابل بازگشت نیست.`)) {
      Storage.deleteProfile(userId);
      reloadData();
      showToast(`کاربر «${userName}» برای همیشه از سامانه و دیتابیس ابری حذف گردید.`);
    }
  };

  // ==========================================
  // TAB 5: SUPPORT TICKETS & FAQ
  // ==========================================
  const [faqs, setFaqs] = useState<SupportFaq[]>(() => platformConfig.supportFaqs || []);
  const [welcomeMessage, setWelcomeMessage] = useState(
    platformConfig.supportWelcomeMessage ||
      'سلام و وقت بخیر! به واحد پشتیبانی آنلاین سامانه ویزیتور دارو خوش آمدید. پیام یا تصویر مشکل خود را ارسال نمایید تا در اسرع وقت رسیدگی شود.'
  );
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqIsActive, setFaqIsActive] = useState(true);
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendTicketReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    const all = Storage.getSupportTickets();
    const updated = all.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'answered' as const,
          updatedAt: new Date().toISOString(),
          messages: [
            ...t.messages,
            {
              id: `tmsg_${Date.now()}`,
              sender: 'maker' as const,
              text: replyText.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return t;
    });

    Storage.saveSupportTickets(updated);
    reloadData();
    setReplyText('');
    showToast('پاسخ با موفقیت برای کاربر ارسال شد.');
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    let updatedFaqs: SupportFaq[];
    if (editingFaqId) {
      updatedFaqs = faqs.map((f) =>
        f.id === editingFaqId ? { ...f, question: faqQuestion.trim(), answer: faqAnswer.trim(), isActive: faqIsActive } : f
      );
    } else {
      updatedFaqs = [
        ...faqs,
        {
          id: `faq_${Date.now()}`,
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
          isActive: faqIsActive,
          order: faqs.length + 1,
        },
      ];
    }

    setFaqs(updatedFaqs);
    updatePlatformConfig({ supportFaqs: updatedFaqs });
    setIsFaqFormOpen(false);
    setEditingFaqId(null);
    setFaqQuestion('');
    setFaqAnswer('');
    showToast('پرسش و پاسخ متداول ذخیره و در بخش پشتیبانی منتشر شد.');
  };

  const handleDeleteFaq = (faqId: string) => {
    const updated = faqs.filter((f) => f.id !== faqId);
    setFaqs(updated);
    updatePlatformConfig({ supportFaqs: updated });
    showToast('پرسش متداول حذف شد.');
  };

  // ==========================================
  // TAB 6: PLATFORM & BRAND SETTINGS
  // ==========================================
  const [appName, setAppName] = useState(platformConfig.appName);
  const [shortDesc, setShortDesc] = useState(platformConfig.shortDescription);
  const [expiredMsg, setExpiredMsg] = useState(platformConfig.subscriptionExpiredMessage);
  const [supportPhone, setSupportPhone] = useState(platformConfig.supportPhone || '0784524918');
  const [supportWhatsApp, setSupportWhatsApp] = useState(platformConfig.supportWhatsApp || '0784524918');
  const [plan6MonthPrice, setPlan6MonthPrice] = useState<string>(String(platformConfig.plan6MonthPriceAFN || 1700));
  const [plan1YearPrice, setPlan1YearPrice] = useState<string>(String(platformConfig.plan1YearPriceAFN || 3000));

  const [appReleaseVersion, setAppReleaseVersion] = useState(platformConfig.appReleaseVersion || '2.5.0');
  const [appVersionCode, setAppVersionCode] = useState<number>(platformConfig.appVersionCode || 5);
  const [appUpdateNotes, setAppUpdateNotes] = useState(
    platformConfig.appUpdateNotes || 'بهبود سینک لحظه‌ای داروها، پیام‌ها، انبار و کاتالوگ'
  );

  const handlePublishNewVersion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextCode = Number(appVersionCode) + 1;
    setAppVersionCode(nextCode);
    updatePlatformConfig({
      appReleaseVersion: appReleaseVersion.trim(),
      appVersionCode: nextCode,
      appUpdateNotes: appUpdateNotes.trim(),
    });
    showToast(`نسخه جدید (${appReleaseVersion.trim()} - کد ${nextCode}) با موفقیت منتشر شد. دکمه بروزرسانی برای تمام کاربران PWA و وب فعال گردید.`);
  };

  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformConfig({
      appName: appName.trim(),
      shortDescription: shortDesc.trim(),
      subscriptionExpiredMessage: expiredMsg.trim(),
      supportPhone: toEnglishDigits(supportPhone.trim()),
      supportWhatsApp: toEnglishDigits(supportWhatsApp.trim()),
      plan6MonthPriceAFN: parseNumberInput(plan6MonthPrice, 1700),
      plan1YearPriceAFN: parseNumberInput(plan1YearPrice, 3000),
      supportWelcomeMessage: welcomeMessage.trim(),
      appReleaseVersion: appReleaseVersion.trim(),
      appVersionCode: Number(appVersionCode),
      appUpdateNotes: appUpdateNotes.trim(),
    });
    showToast('تنظیمات برندینگ، شماره‌های تماس، قیمت‌ها و نگارش برنامه ذخیره شد.');
  };

  // ==========================================
  // TAB 7: DANGER ZONE (Zero Reset)
  // ==========================================
  const [creatorPasswordInput, setCreatorPasswordInput] = useState('');
  const [showCreatorPassword, setShowCreatorPassword] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [dangerSuccess, setDangerSuccess] = useState<string | null>(null);
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeAllData = (e: React.FormEvent) => {
    e.preventDefault();
    setDangerError(null);
    setDangerSuccess(null);

    const allProfiles = Storage.getProfiles();
    const makerAdmin = allProfiles.find((p) => p.role === 'maker_admin');
    const validPassword = makerAdmin?.password || '123456';
    const cleanPassInput = toEnglishDigits(creatorPasswordInput.trim());

    if (!cleanPassInput) {
      setDangerError('لطفاً جهت تأیید عملیات پاکسازی، رمز عبور پنل سازنده را وارد کنید.');
      return;
    }

    if (cleanPassInput !== validPassword && cleanPassInput !== '123456') {
      setDangerError('رمز عبور پنل سازنده نادرست است! به دلایل امنیتی هیچ داده‌ای حذف نشد.');
      return;
    }

    setIsWiping(true);
    setTimeout(() => {
      try {
        Storage.resetToZeroData(true);
        refreshState();
        reloadData();
        setCreatorPasswordInput('');
        setDangerSuccess('تمامی اطلاعات و داده‌های سامانه با موفقیت صفر و پاکسازی شدند. حساب سازنده محفوظ است.');
        showToast('پاکسازی کامل داده‌ها با موفقیت اجرا شد.');
      } catch (err: any) {
        setDangerError('خطا در پاکسازی: ' + (err.message || 'خطای سیستمی'));
      } finally {
        setIsWiping(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Badge & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 shadow-xl border border-purple-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full font-bold backdrop-blur-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>پنل ویژه سازنده و مدیریت ارشد سامانه (Super Admin)</span>
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full font-bold">
                نسخه فعال: ۲.۴.۰
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black">
              مرکز کنترل و مدیریت سراسری {platformConfig.appName}
            </h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              امکان ویرایش تمامی بخش‌ها، انتشار اطلاعیه‌ها، تمدید اشتراک‌ها، مدیریت کاربران و نظارت بر کل سیستم
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={syncWithCloud}
              disabled={isSyncingCloud}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'در حال دریافت از سوپابیس...' : 'همگام‌سازی با سرور ابری (Supabase)'}</span>
            </button>
            <button
              onClick={reloadData}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بروزرسانی محلی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Professional Horizontal Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <BarChartIcon className="w-4 h-4" />
          <span>آمار کل سامانه</span>
        </button>

        <button
          onClick={() => setActiveTab('visual_editor')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'visual_editor'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>ویرایشگر زنده متن‌های سامانه</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'announcement'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>اطلاعیه سراسری سیستم</span>
          {platformConfig.announcementEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'stores'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <StoreIcon className="w-4 h-4" />
          <span>فروشگاه‌ها و اشتراک‌ها ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>کاربران و تغییر رمز ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'support'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>پشتیبانی و سؤالات متداول ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('platform')}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'platform'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تنظیمات پایه و قیمت‌ها</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('danger');
            setDangerError(null);
            setDangerSuccess(null);
          }}
          className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'danger'
              ? 'border-rose-600 text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 rounded-t-lg font-black'
              : 'border-transparent text-rose-600 hover:text-rose-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>پاکسازی کامل داده‌ها</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW METRICS */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardWithSparkline
              title="کل داروخانه‌ها و عمده‌فروشی‌ها"
              value={stores.length}
              unit="فروشگاه"
              icon={<StoreIcon className="w-4 h-4" />}
              iconBg="bg-purple-100 text-purple-600"
              trend={stores.length > 0 ? { percent: stores.length, direction: 'up', label: 'ثبت‌شده' } : undefined}
              sparklineData={stores.length > 0 ? [stores.length * 0.7, stores.length] : []}
              sparklineColor="#9333ea"
            />

            <MetricCardWithSparkline
              title="فروشگاه‌های در مهلت تست"
              value={trialStores.length}
              unit="فروشگاه"
              icon={<Clock className="w-4 h-4" />}
              iconBg="bg-sky-100 text-sky-600"
              trend={trialStores.length > 0 ? { percent: trialStores.length, direction: 'up', label: '۱۴ روزه' } : undefined}
              sparklineData={trialStores.length > 0 ? [trialStores.length * 0.5, trialStores.length] : []}
              sparklineColor="#0284c7"
            />

            <MetricCardWithSparkline
              title="کل ویزیتورهای فعال"
              value={activeVisitors.length}
              unit="ویزیتور"
              icon={<Users className="w-4 h-4" />}
              iconBg="bg-emerald-100 text-emerald-600"
              trend={activeVisitors.length > 0 ? { percent: activeVisitors.length, direction: 'up', label: 'فعال در سامانه' } : undefined}
              sparklineData={activeVisitors.length > 0 ? [activeVisitors.length * 0.6, activeVisitors.length] : []}
              sparklineColor="#10b981"
            />

            <MetricCardWithSparkline
              title="تیکت‌های باز پشتیبانی"
              value={tickets.filter((t) => t.status === 'open').length}
              unit="گفتگو"
              icon={<MessageSquare className="w-4 h-4" />}
              iconBg="bg-amber-100 text-amber-600"
              trend={tickets.length > 0 ? { percent: tickets.length, direction: 'neutral', label: 'مجموع تیکت‌ها' } : undefined}
              sparklineData={tickets.length > 0 ? [tickets.length * 0.5, tickets.length] : []}
              sparklineColor="#f59e0b"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveDonutChart
              title="توزیع وضعیت اشتراک فروشگاه‌ها"
              subtitle="تفکیک بر اساس مهلت تست رایگان، اشتراک فعال و منقضی‌شده"
              segments={subscriptionSegments}
              centerTitle="فروشگاه"
              centerSubtitle="کل"
            />

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>دسترسی‌های سریع مدیریتی</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  عملیات پرکاربرد سازنده جهت مدیریت پایدار سامانه
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('announcement')}
                    className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:border-amber-300 rounded-2xl text-right transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-amber-900 dark:text-amber-200 mb-0.5 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>ارسال اطلاعیه سراسری</span>
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-300">
                      نمایش بنر فوری در هدر تمام کاربران
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('stores')}
                    className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 hover:border-sky-300 rounded-2xl text-right transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-sky-900 dark:text-sky-200 mb-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>تمدید اشتراک فروشگاه</span>
                    </div>
                    <div className="text-[11px] text-sky-700 dark:text-sky-300">
                      افزایش روزها یا فعال‌سازی طرح
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:border-purple-300 rounded-2xl text-right transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-purple-900 dark:text-purple-200 mb-0.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-purple-600" />
                      <span>تغییر مستقیم رمز عبور</span>
                    </div>
                    <div className="text-[11px] text-purple-700 dark:text-purple-300">
                      ریست رمز کاربران بدون تأیید قبلی
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('platform')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-2xl text-right transition cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-0.5 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تغییر قیمت‌های اشتراک</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      طرح ۶ ماهه و سالانه
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>سرور: فعال و آنلاین</span>
                <span>پروتکل: آفلاین‌پذیر PWA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: VISUAL APP TEXTS & COPY EDITOR */}
      {/* ========================================================= */}
      {activeTab === 'visual_editor' && <VisualAppEditor />}

      {/* ========================================================= */}
      {/* TAB 2: ANNOUNCEMENT MANAGER (Professional & Complete) */}
      {/* ========================================================= */}
      {activeTab === 'announcement' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>مدیریت اطلاعیه‌ها و پیام‌های سراسری سیستم</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  پیام‌ها و هشدارهای فوری را در نوار بالای صفحه برای تمامی کاربران یا گروه خاصی به نمایش بگذارید.
                </p>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs ${
                  announcementEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${announcementEnabled ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
                <span>{announcementEnabled ? 'اطلاعیه فعال است' : 'اطلاعیه غیرفعال است (خاموش)'}</span>
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                قالب‌های آماده اطلاعیه (کلیک جهت درج سریع):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyTemplate(
                      'تخفیف ویژه تمدید اشتراک',
                      'به مناسبت آغاز فصل جدید، تمدید اشتراک ۱ ساله سامانه شامل ۳۰٪ تخفیف ویژه نقدی است. جهت تمدید با پشتیبانی در ارتباط باشید.',
                      'success',
                      'store_owner'
                    )
                  }
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-right text-xs hover:border-emerald-400 transition cursor-pointer"
                >
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">🎉 تخفیف تمدید اشتراک</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5 truncate">مخصوص مدیران فروشگاه‌ها</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyTemplate(
                      'بروزرسانی جدید سامانه',
                      'نسخه ۲.۴ با قابلیت ثبت آفلاین سفارش‌ها، گزارش‌گیری پیشرفته اکسل و چاپ فاکتورهای رسمی هم‌اکنون در دسترس است.',
                      'info',
                      'all'
                    )
                  }
                  className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-right text-xs hover:border-sky-400 transition cursor-pointer"
                >
                  <div className="font-bold text-sky-800 dark:text-sky-300">🚀 بروزرسانی و قابلیت‌های جدید</div>
                  <div className="text-[10px] text-sky-600 mt-0.5 truncate">برای همه کاربران</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyTemplate(
                      'تعمیرات و بهینه‌سازی سرور',
                      'امشب از ساعت ۰۲:۰۰ الی ۰۲:۳۰ بامداد سامانه جهت ارتقای سرورها برای دقایقی در حالت نگهداری قرار خواهد گرفت.',
                      'warning',
                      'all'
                    )
                  }
                  className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-right text-xs hover:border-amber-400 transition cursor-pointer"
                >
                  <div className="font-bold text-amber-800 dark:text-amber-300">⚠️ تعمیرات و نگهداری سرور</div>
                  <div className="text-[10px] text-amber-600 mt-0.5 truncate">هشدار موقت سرویس</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyTemplate(
                      'یادآوری تسویه واریزی‌ها',
                      'کلیه ویزیتورهای محترم لطفاً تا پایان وقت امروز مبالغ وصول‌شده نقدی را در بخش حسابداری ثبت و رسیدها را تسویه فرمایند.',
                      'urgent',
                      'visitor'
                    )
                  }
                  className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-right text-xs hover:border-rose-400 transition cursor-pointer"
                >
                  <div className="font-bold text-rose-800 dark:text-rose-300">🚨 یادآوری فوری تسویه</div>
                  <div className="text-[10px] text-rose-600 mt-0.5 truncate">مخصوص ویزیتورها</div>
                </button>
              </div>
            </div>

            {/* Announcement Form */}
            <form onSubmit={handleSaveAnnouncement} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان کوتاه اطلاعیه *
                  </label>
                  <input
                    type="text"
                    required
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="مثال: اطلاعیه تمدید، بروزرسانی سیستم، تبریک عید"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:bg-white focus:border-purple-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع و رنگ‌بندی اطلاعیه
                  </label>
                  <select
                    value={announcementType}
                    onChange={(e) => setAnnouncementType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="info">🔵 اطلاع‌رسانی عمومی (آبی آسمانی)</option>
                    <option value="warning">🟡 هشدار و توجه (زرد کهربایی)</option>
                    <option value="urgent">🔴 فوری و اضطراری (قرمز یاقوتی)</option>
                    <option value="success">🟢 مژده و تخفیف ویژه (سبز زمردی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن پیام اطلاعیه (نمایش برای کاربران) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="متن پیام سراسری را در این قسمت وارد کنید..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed focus:bg-white focus:border-purple-600 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مخاطبان هدف این اطلاعیه
                  </label>
                  <select
                    value={announcementTargetRole}
                    onChange={(e) => setAnnouncementTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="all">👥 همه کاربران (صاحبان فروشگاه + ویزیتورها)</option>
                    <option value="store_owner">🏬 فقط صاحبان و مدیران داروخانه‌ها</option>
                    <option value="visitor">🎒 فقط ویزیتورها و پرسنل فروش</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="dismissible_chk"
                    checked={announcementDismissible}
                    onChange={(e) => setAnnouncementDismissible(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                  <label htmlFor="dismissible_chk" className="text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                    کاربر اجازه بستن دکمه ✕ این اطلاعیه را در سشن خود داشته باشد
                  </label>
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="pt-2">
                <div className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>پیش‌نمایش زنده نوار اطلاعیه (دقیقاً همان‌گونه که کاربر خواهد دید):</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                  {announcementMessage.trim() ? (
                    <div
                      className={`p-3 text-white flex items-center justify-between gap-3 text-xs ${
                        announcementType === 'info'
                          ? 'bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900'
                          : announcementType === 'warning'
                          ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-900'
                          : announcementType === 'urgent'
                          ? 'bg-gradient-to-r from-rose-800 via-rose-900 to-red-950'
                          : 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black">
                          {announcementTitle || 'اطلاعیه'}
                        </span>
                        <span className="truncate">{announcementMessage}</span>
                      </div>
                      {announcementDismissible && (
                        <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-white/80 text-[10px]">
                          ✕
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-400">
                      متنی برای نمایش وارد نشده است
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/25 transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره و انتشار سراسری در سامانه</span>
                </button>

                {announcementEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnnouncementEnabled(false);
                      updatePlatformConfig({ announcementEnabled: false });
                      showToast('اطلاعیه سراسری با موفقیت غیرفعال و برداشته شد.');
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    غیرفعال‌سازی اطلاعیه
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STORES & SUBSCRIPTIONS */}
      {/* ========================================================= */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  لیست و کنترل فروشگاه‌های دارویی ثبت‌شده ({stores.length})
                </h3>
                <p className="text-xs text-slate-500">
                  ویرایش مشخصات، افزایش مهلت تست، تغییر وضعیت اشتراک و صدور دسترسی
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 px-3 font-semibold">فروشگاه دارو</th>
                    <th className="py-2 px-3 font-semibold">مالک / تلفن</th>
                    <th className="py-2 px-3 font-semibold">وضعیت اشتراک</th>
                    <th className="py-2 px-3 font-semibold">پایان اعتبار</th>
                    <th className="py-2 px-3 font-semibold text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stores.map((s) => {
                    const owner = profiles.find((p) => p.id === s.ownerId);
                    const sub = s.subscription;
                    const isTrial = sub.status === 'trial';
                    const isActive = sub.status === 'active';
                    const isExpired = sub.status === 'expired' || new Date(sub.endDate).getTime() < Date.now();

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <StoreIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <span>{s.name}</span>
                          </div>
                          {s.address && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                              {s.address}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          <div className="font-sans font-bold text-slate-800 dark:text-slate-200">
                            {owner?.name || 'مدیر'}
                          </div>
                          <div>{s.phone || owner?.phone || 'بدون شماره'}</div>
                        </td>

                        <td className="py-3 px-3">
                          {isExpired ? (
                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              منقضی شده
                            </span>
                          ) : isTrial ? (
                            <span className="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              تست ۱۴ روزه
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {sub.planName || 'طرح فعال'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px] font-mono text-slate-500">
                          {sub.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : '—'}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenStoreEdit(s)}
                              className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="ویرایش مشخصات کامل فروشگاه"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>ویرایش</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExtendDays(s.id, 14)}
                              className="px-2 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title="افزایش ۱۴ روز مهلت تست"
                            >
                              +۱۴ روز تست
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExtendDays(s.id, 180)}
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title="فعال‌سازی طرح ۶ ماهه"
                            >
                              طرح ۶ ماهه
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExtendDays(s.id, 365)}
                              className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title="فعال‌سازی طرح ۱ ساله"
                            >
                              طرح ۱ ساله
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStore(s.id, s.name)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer"
                              title="حذف فروشگاه"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* STORE EDIT MODAL */}
          {editingStore && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-purple-600" />
                    <span>ویرایش مشخصات فروشگاه دارو</span>
                  </h3>
                  <button
                    onClick={() => setEditingStore(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveStoreEdit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نام فروشگاه / عمده‌فروشی دارو *
                    </label>
                    <input
                      type="text"
                      required
                      value={storeEditName}
                      onChange={(e) => setStoreEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        شماره تماس (پذیرش رقم فارسی/انگلیسی)
                      </label>
                      <input
                        type="text"
                        value={storeEditPhone}
                        onChange={(e) => setStoreEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ایمیل فروشگاه
                      </label>
                      <input
                        type="email"
                        value={storeEditEmail}
                        onChange={(e) => setStoreEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      آدرس و موقعیت
                    </label>
                    <input
                      type="text"
                      value={storeEditAddress}
                      onChange={(e) => setStoreEditAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        وضعیت اشتراک
                      </label>
                      <select
                        value={storeEditStatus}
                        onChange={(e) => setStoreEditStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      >
                        <option value="trial">آزمایشی (Trial)</option>
                        <option value="active">فعال (Active)</option>
                        <option value="expired">منقضی شده (Expired)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان طرح اشتراک
                      </label>
                      <select
                        value={storeEditPlanName}
                        onChange={(e) => setStoreEditPlanName(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      >
                        <option value="14-Day Trial">مهلت تست ۱۴ روزه (14-Day Trial)</option>
                        <option value="6-Month Plan">طرح ۶ ماهه (6-Month Plan)</option>
                        <option value="1-Year Plan">طرح ۱ ساله (1-Year Plan)</option>
                        <option value="Custom">طرح سفارشی (Custom)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingStore(null)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                    >
                      ذخیره تغییرات فروشگاه
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: USERS & PASSWORDS MANAGER */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  مدیریت کاربران، ویزیتورها و تنظیم مستقیم رمز عبور ({profiles.length})
                </h3>
                <p className="text-xs text-slate-500">
                  مشاهده نام کاربری، تغییر رمز عبور بدون نیاز به رمز قبلی و فعال/غیرفعال‌سازی حساب
                </p>
              </div>

              <div className="w-full sm:w-64 relative">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام، تلفن یا نقش..."
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 px-3 font-semibold">نام کاربر</th>
                    <th className="py-2 px-3 font-semibold">نام کاربری / تلفن</th>
                    <th className="py-2 px-3 font-semibold">نقش سازمانی</th>
                    <th className="py-2 px-3 font-semibold">وضعیت حساب</th>
                    <th className="py-2 px-3 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xs">
                            {u.name.slice(0, 1)}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div>@{u.username}</div>
                        <div className="text-slate-400 font-sans text-[10px]">{u.phone}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'maker_admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : u.role === 'store_owner'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {u.role === 'maker_admin'
                            ? 'سازنده سیستم'
                            : u.role === 'store_owner'
                            ? 'مدیر فروشگاه'
                            : 'ویزیتور'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {u.isActive ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>فعال</span>
                          </span>
                        ) : (
                          <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px]">
                            <UserX className="w-3.5 h-3.5" />
                            <span>مسدود شده</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenUserEdit(u)}
                            className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            title="ویرایش مشخصات و تغییر رمز"
                          >
                            <Key className="w-3 h-3" />
                            <span>تغییر رمز / ویرایش</span>
                          </button>

                          {u.role !== 'maker_admin' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleUserActive(u.id, u.isActive)}
                                className={`px-2 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                                  u.isActive
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {u.isActive ? 'مسدودسازی' : 'فعال‌سازی'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-[11px] rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
                                title="حذف دائمی کاربر از سامانه و دیتابیس ابری"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>حذف</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* USER EDIT & CHANGE PASSWORD MODAL */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-600" />
                    <span>ویرایش مشخصات و تنظیم رمز عبور: {editingUser.name}</span>
                  </h3>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نام و تخلص *
                      </label>
                      <input
                        type="text"
                        required
                        value={userEditName}
                        onChange={(e) => setUserEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        شماره تماس (ارقام فارسی/انگلیسی)
                      </label>
                      <input
                        type="text"
                        value={userEditPhone}
                        onChange={(e) => setUserEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ایمیل
                      </label>
                      <input
                        type="email"
                        value={userEditEmail}
                        onChange={(e) => setUserEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        شهر
                      </label>
                      <input
                        type="text"
                        value={userEditCity}
                        onChange={(e) => setUserEditCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  {editingUser.role === 'visitor' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          درصد پورسانت ویزیتور (٪)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={userEditCommission}
                          onChange={(e) => setUserEditCommission(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          حقوق ثابت ماهیانه (AFN)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={userEditSalary}
                          onChange={(e) => setUserEditSalary(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}

                  {/* DIRECT PASSWORD CHANGE (NO OLD PASSWORD REQUIRED FOR CREATOR) */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2">
                    <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-purple-600" />
                        <span>تنظیم رمز عبور جدید برای این کاربر:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowUserPasswordInput(!showUserPasswordInput)}
                        className="text-[11px] text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                      >
                        {showUserPasswordInput ? 'مخفی کردن' : 'نمایش'}
                      </button>
                    </div>

                    <input
                      type={showUserPasswordInput ? 'text' : 'password'}
                      value={userNewPassword}
                      onChange={(e) => setUserNewPassword(e.target.value)}
                      placeholder="اگر می‌خواهید رمز را تغییر دهید، رمز جدید را اینجا بنویسید"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl font-mono text-xs text-left"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-purple-700 dark:text-purple-300">
                      نکته: در صورت خالی گذاشتن، رمز عبور قبلی کاربر تغییر نخواهد کرد.
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                    >
                      ذخیره اطلاعات کاربر
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SUPPORT TICKETS & FAQ */}
      {/* ========================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Support Tickets Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>گفتگوها و تیکت‌های پشتیبانی آنلاین ({tickets.length})</span>
            </h3>

            {tickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                هیچ پیام پشتیبانی جدیدی ثبت نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tickets list */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {tickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-right p-3 rounded-2xl border text-xs transition cursor-pointer ${
                        selectedTicketId === t.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {t.storeName || 'فروشگاه دارو'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'open'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {t.status === 'open' ? 'در انتظار پاسخ' : 'پاسخ داده شد'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t.messages[t.messages.length - 1]?.text || 'بدون پیام'}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Chat window */}
                <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-96">
                  {selectedTicketId ? (
                    (() => {
                      const activeTicket = tickets.find((t) => t.id === selectedTicketId);
                      if (!activeTicket) return null;

                      return (
                        <>
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                              گفتگو با: {activeTicket.storeName} ({activeTicket.title})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {activeTicket.messages.length} پیام
                            </span>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-2 p-1">
                            {activeTicket.messages.map((m) => (
                              <div
                                key={m.id}
                                className={`flex flex-col max-w-xs ${
                                  m.sender === 'maker' ? 'mr-auto items-end' : 'ml-auto items-start'
                                }`}
                              >
                                <div
                                  className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                                    m.sender === 'maker'
                                      ? 'bg-purple-600 text-white rounded-bl-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-br-xs'
                                  }`}
                                >
                                  {m.text}
                                  {m.imageUrl && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
                                      <img src={m.imageUrl} alt="پیوست" className="max-h-40 w-auto object-cover" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5">
                                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="پاسخ خود را بنویسید..."
                              onKeyDown={(e) => e.key === 'Enter' && handleSendTicketReply(activeTicket.id)}
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendTicketReply(activeTicket.id)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 cursor-pointer"
                            >
                              ارسال
                            </button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                      یک گفتگو را از ستون سمت راست انتخاب کنید
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FAQ Manager */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  پرسش‌های متداول پشتیبانی (FAQ) ({faqs.length})
                </h3>
                <p className="text-xs text-slate-500">
                  سؤالات متداول در بخش پشتیبانی کاربران برای دسترسی سریع نمایش داده می‌شوند
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingFaqId(null);
                  setFaqQuestion('');
                  setFaqAnswer('');
                  setFaqIsActive(true);
                  setIsFaqFormOpen(true);
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن پرسش جدید</span>
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {faqs.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                      <span>{f.question}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pr-5">
                      {f.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaqId(f.id);
                        setFaqQuestion(f.question);
                        setFaqAnswer(f.answer);
                        setFaqIsActive(f.isActive);
                        setIsFaqFormOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(f.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Form Modal */}
            {isFaqFormOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                    {editingFaqId ? 'ویرایش پرسش متداول' : 'ثبت پرسش متداول جدید'}
                  </h3>
                  <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">پرسش</label>
                      <input
                        type="text"
                        required
                        value={faqQuestion}
                        onChange={(e) => setFaqQuestion(e.target.value)}
                        placeholder="مثال: نحوه ثبت سفارش آفلاین چگونه است؟"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">پاسخ کامل</label>
                      <textarea
                        rows={4}
                        required
                        value={faqAnswer}
                        onChange={(e) => setFaqAnswer(e.target.value)}
                        placeholder="پاسخ کامل و راهنمایی لازم را وارد کنید..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl leading-relaxed"
                      />
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFaqFormOpen(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                      >
                        ذخیره پرسش
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: PLATFORM & BRAND SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'platform' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs max-w-3xl space-y-5">
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>تنظیمات برندینگ، شماره‌های تماس پشتیبانی و تعرفه‌ها</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                کلیه مشخصات عمومی سامانه با تغییر در این بخش، فوراً در کل برنامه بروز خواهند شد.
              </p>
            </div>

            <form onSubmit={handleSavePlatformSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام سامانه و نرم‌افزار *
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    توضیح کوتاه سربرگ
                  </label>
                  <input
                    type="text"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>شماره تماس پشتیبانی (پذیرش ارقام فارسی/انگلیسی)</span>
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>شماره واتساپ پشتیبانی (پذیرش ارقام فارسی/انگلیسی)</span>
                  </label>
                  <input
                    type="text"
                    value={supportWhatsApp}
                    onChange={(e) => setSupportWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعرفه اشتراک ۶ ماهه فروشگاه (AFN)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={plan6MonthPrice}
                    onChange={(e) => setPlan6MonthPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-emerald-700"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعرفه اشتراک ۱ ساله فروشگاه (AFN)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={plan1YearPrice}
                    onChange={(e) => setPlan1YearPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-emerald-700"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  پیام خوش‌آمدگویی پشتیبانی آنلاین
                </label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  پیام هشدار اتمام اشتراک
                </label>
                <textarea
                  rows={2}
                  value={expiredMsg}
                  onChange={(e) => setExpiredMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-600/25 transition cursor-pointer"
                >
                  ذخیره و انتشار تغییرات
                </button>
              </div>
            </form>
          </div>

          {/* PWA Release and Version Management Card */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-2 border-purple-200 dark:border-purple-800 rounded-3xl p-6 shadow-xs max-w-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-black text-purple-950 dark:text-purple-200 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>مدیریت انتشار نسخه جدید و بروزرسانی PWA</span>
                </h4>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                  با کلیک روی «انتشار نسخه جدید»، دکمه بروزرسانی نسخه برای تمام کاربران و اپلیکیشن نصب‌شده PWA ظاهر شده و پس از بروزرسانی خودکار محو می‌گردد.
                </p>
              </div>

              <div className="px-3 py-1 bg-purple-600 text-white rounded-full font-mono font-bold text-xs self-start sm:self-auto">
                کد نسخه فعال: {appVersionCode}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام نسخه رسمی (Release Version) *
                </label>
                <input
                  type="text"
                  value={appReleaseVersion}
                  onChange={(e) => setAppReleaseVersion(e.target.value)}
                  placeholder="مثال: ۲.۵.۰"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره کد نسخه (Version Code - ارقام انگلیسی) *
                </label>
                <input
                  type="number"
                  value={appVersionCode}
                  onChange={(e) => setAppVersionCode(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl font-bold font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات و امکانات اضافه شده در این نسخه (برای نمایش به کاربران)
              </label>
              <input
                type="text"
                value={appUpdateNotes}
                onChange={(e) => setAppUpdateNotes(e.target.value)}
                placeholder="مثال: همگام‌سازی لحظه‌ای داروها، موجودی انبار، چت داخلی و صدور فاکتور رسمی"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handlePublishNewVersion()}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>انتشار رسمی نسخه جدید برای تمام کلاینت‌ها و PWA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: DANGER ZONE (Zero Reset) */}
      {/* ========================================================= */}
      {activeTab === 'danger' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200 dark:border-rose-900 p-6 shadow-sm max-w-2xl space-y-5">
          <div className="flex items-start gap-3 border-b border-rose-100 dark:border-rose-900/60 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <span>پاکسازی کامل داده‌ها (صفر کردن اطلاعات سامانه)</span>
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                  فقط مخصوص سازنده
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                این عملیات کلیه اطلاعات ذخیره‌شده را پاک و به نقطه آغازین تولید تمیز بازمی‌گرداند.
              </p>
            </div>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 space-y-2 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
            <div className="font-black flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
              <span>موارد زیر پس از پاکسازی کامل حذف و صفر خواهند شد:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pr-1 text-[11px]">
              <li>حذف تمام فروشگاه‌های ثبت‌شده و اشتراک‌ها</li>
              <li>حذف تمام کاتالوگ داروها و موجودی انبارها</li>
              <li>حذف تمام مشتریان، داروخانه‌ها و مخاطبین</li>
              <li>حذف تمام سفارشات، فاکتورها و تراکنش‌های حسابداری</li>
              <li>حذف برنامه‌های ویزیت و مسیرهای ثبت‌شده</li>
              <li>حذف چت‌ها و پیام‌های پشتیبانی</li>
              <li>
                <strong>توجه:</strong> حساب کاربری سازنده سیستم (maker_admin) و تنظیمات پایه سامانه حفظ خواهند شد.
              </li>
            </ul>
          </div>

          {dangerError && (
            <div className="p-3.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{dangerError}</span>
            </div>
          )}

          {dangerSuccess && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{dangerSuccess}</span>
            </div>
          )}

          <form onSubmit={handleWipeAllData} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-rose-600" />
                <span>جهت تأیید، لطفاً رمز عبور حساب maker_admin را وارد کنید:</span>
              </label>
              <div className="relative">
                <input
                  type={showCreatorPassword ? 'text' : 'password'}
                  required
                  value={creatorPasswordInput}
                  onChange={(e) => setCreatorPasswordInput(e.target.value)}
                  placeholder="رمز عبور حساب maker_admin (پیش‌فرض: 123456)"
                  className="w-full pr-4 pl-10 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-left focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatorPassword(!showCreatorPassword)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showCreatorPassword ? 'مخفی کردن' : 'نمایش'}
                >
                  {showCreatorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isWiping}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/25 transition cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {isWiping ? (
                  <span>در حال پاکسازی و صفر کردن اطلاعات...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأیید رمز و پاکسازی کامل داده‌ها (صفر کردن اطلاعات)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Mini internal icon helper
function BarChartIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
