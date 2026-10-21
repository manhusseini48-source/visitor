/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { TrialBanner } from './components/common/TrialBanner';
import { AnnouncementBanner } from './components/common/AnnouncementBanner';
import { PWAInstallBar } from './components/common/PWAInstallBar';
import { AppUpdateBanner } from './components/common/AppUpdateBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { UserProfileModal } from './components/common/UserProfileModal';
import { AppLockScreen } from './components/common/AppLockScreen';
import { LoginView } from './components/auth/LoginView';
import { RegisterStoreModal } from './components/auth/RegisterStoreModal';
import { GuestView } from './components/auth/GuestView';
import { Storage } from './utils/storage';
import {
  getAppLockConfig,
  isSessionLocked,
  setSessionLocked,
  recordLastActiveTime,
  getLastActiveTime,
} from './utils/appLock';

// Store Owner Views
import { StoreDashboard } from './components/store/StoreDashboard';
import { MedicinesManager } from './components/store/MedicinesManager';
import { OrdersManager } from './components/store/OrdersManager';
import { CustomersManager } from './components/store/CustomersManager';
import { VisitorsManager } from './components/store/VisitorsManager';
import { VisitsScheduleManager } from './components/store/VisitsScheduleManager';
import { AccountingManager } from './components/store/AccountingManager';
import { MessengerView } from './components/store/MessengerView';
import { ReportsManager } from './components/store/ReportsManager';
import { SubscriptionView } from './components/store/SubscriptionView';
import { SupportView } from './components/store/SupportView';

// Visitor Views
import { VisitorDashboard } from './components/visitor/VisitorDashboard';
import { VisitorMedicineGallery } from './components/visitor/VisitorMedicineGallery';
import { VisitorMedicinesView } from './components/visitor/VisitorMedicinesView';
import { VisitorOrders } from './components/visitor/VisitorOrders';
import { VisitorCustomers } from './components/visitor/VisitorCustomers';
import { VisitorVisits } from './components/visitor/VisitorVisits';
import { VisitorCommission } from './components/visitor/VisitorCommission';

// Creator View
import { CreatorEmbeddedPanel } from './components/creator/CreatorEmbeddedPanel';
import { getAppText } from './utils/customText';

import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  MessageSquare,
  FileSpreadsheet,
  LifeBuoy,
  ShieldCheck,
  Shield,
  Menu,
  X,
  Sparkles,
  User,
  ArrowRight,
  LogOut,
  ChevronLeft,
  Lock,
} from 'lucide-react';

function AppContent() {
  const {
    currentUser,
    currentStore,
    isGuest,
    platformConfig,
    setGuestMode,
    isSubscriptionExpired,
    isProfileOpen,
    setIsProfileOpen,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const u = Storage.getCurrentUser();
      if (u) {
        return 'dashboard';
      }
      return localStorage.getItem('visitor_app_active_tab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sharedOrderForChat, setSharedOrderForChat] = useState<any>(null);

  // App Lock State
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    return isSessionLocked();
  });

  // Evaluate initial lock state once user is available
  useEffect(() => {
    if (!currentUser) {
      setIsAppLocked(false);
      return;
    }
    const lockCfg = getAppLockConfig(currentUser.id);
    if (lockCfg.enabled && lockCfg.pin) {
      if (isSessionLocked()) {
        setIsAppLocked(true);
      } else if (lockCfg.autoLockDelay === 0) {
        setIsAppLocked(true);
        setSessionLocked(true);
      } else {
        const lastActive = getLastActiveTime();
        const diffSeconds = (Date.now() - lastActive) / 1000;
        if (diffSeconds >= lockCfg.autoLockDelay) {
          setIsAppLocked(true);
          setSessionLocked(true);
        }
      }
    }
  }, [currentUser]);

  // Handle auto-lock on page visibility change (minimizing app or switching tabs)
  useEffect(() => {
    if (!currentUser) return;
    const lockCfg = getAppLockConfig(currentUser.id);
    if (!lockCfg.enabled || !lockCfg.pin) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        recordLastActiveTime();
      } else if (document.visibilityState === 'visible') {
        const lastActive = getLastActiveTime();
        const diffSeconds = (Date.now() - lastActive) / 1000;
        if (lockCfg.autoLockDelay === 0 || diffSeconds >= lockCfg.autoLockDelay) {
          setIsAppLocked(true);
          setSessionLocked(true);
        }
      }
    };

    const handleCustomTrigger = () => {
      setIsAppLocked(true);
      setSessionLocked(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('app_lock_triggered', handleCustomTrigger);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('app_lock_triggered', handleCustomTrigger);
    };
  }, [currentUser]);

  const handleUnlockApp = () => {
    setIsAppLocked(false);
    setSessionLocked(false);
    recordLastActiveTime();
  };

  // Navigate tab with optional history state push
  const handleNavigateTab = (tab: string, pushHistory = true) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('visitor_app_active_tab', tab);
      if (pushHistory && typeof window !== 'undefined') {
        window.history.pushState({ type: 'tab', tab }, '', '');
      }
    } catch {}
  };

  const handleSelectTabFromMenu = (tab: string) => {
    setIsMobileMenuOpen(false);
    handleNavigateTab(tab);
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined') {
        window.history.pushState({ type: 'modal', modal: 'mobileMenu' }, '', '');
      }
      return next;
    });
  };

  // Open modal handlers with history state push
  const handleOpenAuth = () => {
    setIsAuthOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ type: 'modal', modal: 'auth' }, '', '');
    }
  };

  const handleOpenRegister = () => {
    setIsRegisterOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ type: 'modal', modal: 'register' }, '', '');
    }
  };

  const handleOpenProfile = () => {
    setIsProfileOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ type: 'modal', modal: 'profile' }, '', '');
    }
  };

  // In-app Back button click handler (synchronized with browser/phone history)
  const handleGoBack = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      return;
    }
    if (isProfileOpen) {
      setIsProfileOpen(false);
      return;
    }
    if (isAuthOpen) {
      setIsAuthOpen(false);
      return;
    }
    if (isRegisterOpen) {
      setIsRegisterOpen(false);
      return;
    }
    if (activeTab !== 'dashboard') {
      handleNavigateTab('dashboard', false);
    }
  };

  // Anchor browser history whenever user logs in or registers
  useEffect(() => {
    if (currentUser) {
      setIsAuthOpen(false);
      setIsRegisterOpen(false);
      setActiveTab('dashboard');
      try {
        localStorage.setItem('visitor_app_active_tab', 'dashboard');
        window.history.replaceState({ type: 'tab', tab: 'dashboard' }, '', '');
        window.history.pushState({ type: 'tab', tab: 'dashboard' }, '', '');
      } catch {}
    }
  }, [currentUser?.id]);

  // Synchronize Phone Hardware / Gesture Back Button with the App
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!window.history.state) {
          window.history.replaceState({ type: 'root', tab: activeTab }, '', '');
        }
      } catch {}
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If mobile menu or any modal is open, close it
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        return;
      }
      if (isProfileOpen) {
        setIsProfileOpen(false);
        return;
      }
      if (isAuthOpen) {
        setIsAuthOpen(false);
        return;
      }
      if (isRegisterOpen) {
        setIsRegisterOpen(false);
        return;
      }

      // 2. If authenticated, never allow navigating back to guest or splash screen
      const effectiveUser = currentUser || Storage.getCurrentUser();
      if (effectiveUser) {
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
          try {
            localStorage.setItem('visitor_app_active_tab', 'dashboard');
            window.history.pushState({ type: 'tab', tab: 'dashboard' }, '', '');
          } catch {}
        } else {
          // User is on dashboard, prevent leaving or going to pre-login view
          try {
            window.history.pushState({ type: 'tab', tab: 'dashboard' }, '', '');
          } catch {}
        }
        return;
      }

      // 3. For guest mode or initial splash
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMobileMenuOpen, isProfileOpen, isAuthOpen, isRegisterOpen, activeTab, currentUser]);

  // Shared order redirect to messenger
  const handleShareOrderInChat = (order: any) => {
    setSharedOrderForChat(order);
    handleNavigateTab('messenger');
  };

  // If initial state (no user and not guest), show welcoming splash selection
  const authenticatedUser = currentUser || Storage.getCurrentUser();
  if (!authenticatedUser && !isGuest) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
        <AppUpdateBanner />
        <PWAInstallBar />
        <AnnouncementBanner />
        <Header
          onOpenAuth={handleOpenAuth}
          onOpenRegister={handleOpenRegister}
        />

        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8 my-auto">
          <div className="w-20 h-20 bg-sky-500/20 text-sky-400 border border-sky-400/30 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-sky-500/10">
            <Pill className="w-10 h-10 rotate-45" />
          </div>

          <div className="space-y-3">
            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3.5 py-1 rounded-full text-xs font-semibold">
              پلتفرم جامع عمده‌فروشی دارو و مدیریت ویزیتورها
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              {platformConfig.appName}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              {platformConfig.shortDescription} — سفارش‌گیری آنلاین، انبار دارویی، ردیابی وصول مطالبات و حسابداری پورسانت
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleOpenAuth}
              className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-600/30 transition cursor-pointer"
            >
              ورود به حساب کاربری
            </button>

            <button
              onClick={handleOpenRegister}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ثبت‌نام فروشگاه جدید</span>
              <span className="bg-emerald-800/60 text-[11px] px-2 py-0.5 rounded-full font-bold">
                ۲ هفته تست رایگان
              </span>
            </button>

            <button
              onClick={setGuestMode}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-2xl font-bold text-sm transition cursor-pointer"
            >
              مهمان؛ مشاهده امکانات
            </button>
          </div>
        </div>

        <footer className="text-center p-6 text-xs text-slate-500 border-t border-slate-900">
          سامانه اختصاصی ویزیتور دارو • طراحی شده برای بازار دارویی افغانستان • نرخ ارز افغانی (AFN)
        </footer>

        {isAuthOpen && (
          <LoginView
            onClose={() => setIsAuthOpen(false)}
            onOpenRegister={() => {
              setIsAuthOpen(false);
              handleOpenRegister();
            }}
            onContinueAsGuest={() => {
              setIsAuthOpen(false);
              setGuestMode();
            }}
          />
        )}

        {isRegisterOpen && (
          <RegisterStoreModal
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            onSuccess={() => {
              setIsRegisterOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // Store Owner Navigation items
  const storeMenuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'orders', label: 'سفارش‌ها و ارسال', icon: ShoppingCart },
    { id: 'medicines', label: 'داروها و موجودی', icon: Pill },
    { id: 'customers', label: 'مشتریان', icon: Users },
    { id: 'visitors', label: 'ویزیتورها', icon: UserCheck },
    { id: 'visits', label: 'برنامه ویزیت', icon: Calendar },
    { id: 'accounting', label: 'حسابداری و پورسانت', icon: DollarSign },
    { id: 'messenger', label: 'پیام‌رسان', icon: MessageSquare },
    { id: 'reports', label: 'گزارش‌ها', icon: FileSpreadsheet },
    { id: 'subscription', label: 'اشتراک فروشگاه', icon: ShieldCheck },
    { id: 'support', label: 'پشتیبانی', icon: LifeBuoy },
  ];

  // Visitor Navigation items
  const visitorMenuItems = [
    { id: 'dashboard', label: 'داشبورد من', icon: LayoutDashboard },
    { id: 'gallery', label: 'گالری دارو و صدور فاکتور', icon: Sparkles },
    { id: 'medicines', label: 'کاتالوگ و موجودی داروها', icon: Pill },
    { id: 'orders', label: 'سفارشات من', icon: ShoppingCart },
    { id: 'customers', label: 'دواخانه‌های من', icon: Users },
    { id: 'visits', label: 'برنامه ویزیت و مراجعات', icon: Calendar },
    { id: 'accounting', label: 'حسابداری، صندوق و پورسانت', icon: DollarSign },
    { id: 'messenger', label: 'پیام‌رسان کاری', icon: MessageSquare },
  ];

  const currentMenuItems =
    currentUser?.role === 'visitor' ? visitorMenuItems : storeMenuItems;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* App Update Banner (Shown when a new version is published by the creator) */}
      <AppUpdateBanner />

      {/* PWA Install Bar (Appears on every load until installed) */}
      <PWAInstallBar />

      {/* Top Header */}
      <Header
        onOpenAuth={handleOpenAuth}
        onOpenRegister={handleOpenRegister}
        onOpenProfile={handleOpenProfile}
        onNavigateTab={(t) => handleNavigateTab(t)}
        onToggleMobileMenu={handleToggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Platform Public Announcement Banner */}
      <AnnouncementBanner />

      {/* Trial Countdown or Expiration Banner */}
      <TrialBanner onNavigateSubscription={() => handleNavigateTab('subscription')} />

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-32 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-6 flex flex-col md:flex-row gap-6">
        {/* Guest View */}
        {isGuest ? (
          <div className="flex-1">
            <GuestView
              onOpenLogin={handleOpenAuth}
              onOpenRegister={handleOpenRegister}
            />
          </div>
        ) : currentUser?.role === 'maker_admin' ? (
          /* Maker Admin Super Panel View */
          <div className="flex-1">
            <CreatorEmbeddedPanel />
          </div>
        ) : (
          /* Normal Authenticated User (Store Owner or Visitor) */
          <>
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs h-fit sticky top-20">
              <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2">
                {currentUser?.role === 'store_owner' ? 'پنل فروشگاه' : 'پنل ویزیتور'}
              </div>

              <nav className="space-y-1">
                {currentMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigateTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-right cursor-pointer ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* Profile & Security Shortcut Button */}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <button
                    onClick={handleOpenProfile}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-right text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-800 dark:hover:text-sky-300 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    <span>پروفایل و تنظیمات امنیت</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Mobile View Title Bar (نوار عنوان بخش در موبایل بدون دکمه تکراری منو) */}
            <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-3.5 py-2.5 rounded-2xl shadow-2xs mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {currentMenuItems.find((m) => m.id === activeTab)?.label || 'داشبورد'}
                </span>
              </div>
              <span className="text-[11px] text-sky-700 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800/60">
                {currentUser?.role === 'store_owner' ? 'مدیریت داروخانه' : 'ویزیتور'}
              </span>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              {/* Synchronized In-App Back Button */}
              {activeTab !== 'dashboard' && (
                <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-2xs">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-sky-300 px-3.5 py-1.5 rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
                    title="بازگشت به داشبورد اصلی"
                  >
                    <ArrowRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>بازگشت به داشبورد</span>
                  </button>
                </div>
              )}

              <ErrorBoundary
                inline
                fallbackMessage="خطایی در بارگذاری این صفحه رخ داد"
                onReset={() => handleNavigateTab('dashboard', false)}
              >
                {currentUser?.role === 'visitor' ? (
                  /* Visitor Screens */
                  activeTab === 'dashboard' ? (
                    <VisitorDashboard onNavigateTab={(t) => handleNavigateTab(t)} />
                  ) : activeTab === 'gallery' ? (
                    <VisitorMedicineGallery onNavigateTab={(t) => handleNavigateTab(t)} />
                  ) : activeTab === 'medicines' ? (
                    <VisitorMedicinesView onNavigateTab={(t) => handleNavigateTab(t)} />
                  ) : activeTab === 'orders' ? (
                    <VisitorOrders />
                  ) : activeTab === 'customers' ? (
                    <VisitorCustomers />
                  ) : activeTab === 'visits' ? (
                    <VisitorVisits />
                  ) : activeTab === 'accounting' ? (
                    <VisitorCommission />
                  ) : activeTab === 'messenger' ? (
                    <MessengerView initialSharedOrder={sharedOrderForChat} />
                  ) : (
                    <VisitorDashboard onNavigateTab={(t) => handleNavigateTab(t)} />
                  )
                ) : (
                  /* Store Owner Screens */
                  activeTab === 'dashboard' ? (
                    <StoreDashboard onNavigateTab={(t) => handleNavigateTab(t)} />
                  ) : activeTab === 'orders' ? (
                    <OrdersManager onShareInChat={handleShareOrderInChat} />
                  ) : activeTab === 'medicines' ? (
                    <MedicinesManager />
                  ) : activeTab === 'customers' ? (
                    <CustomersManager />
                  ) : activeTab === 'visitors' ? (
                    <VisitorsManager />
                  ) : activeTab === 'visits' ? (
                    <VisitsScheduleManager />
                  ) : activeTab === 'accounting' ? (
                    <AccountingManager />
                  ) : activeTab === 'messenger' ? (
                    <MessengerView initialSharedOrder={sharedOrderForChat} />
                  ) : activeTab === 'reports' ? (
                    <ReportsManager />
                  ) : activeTab === 'subscription' ? (
                    <SubscriptionView />
                  ) : activeTab === 'support' ? (
                    <SupportView />
                  ) : (
                    <StoreDashboard onNavigateTab={(t) => handleNavigateTab(t)} />
                  )
                )}
              </ErrorBoundary>
            </main>
          </>
        )}
      </div>

      {/* Global Modals */}
      {isProfileOpen && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isAuthOpen && (
        <LoginView
          onClose={() => setIsAuthOpen(false)}
          onOpenRegister={() => {
            setIsAuthOpen(false);
            handleOpenRegister();
          }}
          onContinueAsGuest={() => {
            setIsAuthOpen(false);
            setGuestMode();
          }}
        />
      )}

      {isRegisterOpen && (
        <RegisterStoreModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={() => {
            setIsRegisterOpen(false);
          }}
        />
      )}

      {/* Mobile Navigation Drawer (منوی کشویی پنل در حالت موبایل) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop with dark blur */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Sheet */}
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-l from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-600 border border-sky-400/30 flex items-center justify-center font-bold text-white text-base overflow-hidden flex-shrink-0">
                  {currentUser?.avatarUrl ? (
                    currentUser.avatarUrl.length < 10 ? (
                      <span>{currentUser.avatarUrl}</span>
                    ) : (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span>{currentUser?.name?.slice(0, 1) || 'U'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{currentUser?.name}</h4>
                  <div className="text-[11px] text-sky-300 flex items-center gap-1 font-medium">
                    <span>{currentUser?.role === 'store_owner' ? 'مدیریت فروشگاه' : 'ویزیتور رسمی'}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{currentStore?.name}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                بخش‌های پنل {currentUser?.role === 'store_owner' ? 'فروشگاه' : 'ویزیتور'}
              </div>

              {currentMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTabFromMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-right cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleOpenProfile();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-800 dark:hover:text-sky-300 rounded-xl text-xs font-bold transition text-right cursor-pointer shadow-2xs"
              >
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span>پروفایل و تنظیمات امنیت</span>
              </button>



              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition text-right cursor-pointer"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>خروج از حساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (نوار منوی سریع پایین صفحه در موبایل - راست دست و داشبورد در وسط) */}
      {!isGuest && currentUser && currentUser.role !== 'maker_admin' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-lg px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around">
          {/* 1. منوی پنل در سمت راست (نزدیک انگشت شست افراد راست‌دست در چیدمان راست به چپ) */}
          <button
            onClick={handleToggleMobileMenu}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
              isMobileMenuOpen ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-700 dark:text-slate-300 font-bold'
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
              isMobileMenuOpen ? 'bg-sky-600 text-white' : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
            }`}>
              <Menu className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px]">منوی پنل</span>
          </button>

          {/* 2. سفارش‌ها */}
          <button
            onClick={() => handleNavigateTab('orders')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'orders' ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px]">سفارش‌ها</span>
          </button>

          {/* 3. آیکون داشبورد در وسط (مرکز نوار ناوبری) با استایل مشخص */}
          <button
            onClick={() => handleNavigateTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-sky-600 dark:text-sky-400 font-black -translate-y-1'
                : 'text-slate-600 dark:text-slate-300 font-bold'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-2xs ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px]">داشبورد</span>
          </button>

          {/* 4. مشتریان */}
          <button
            onClick={() => handleNavigateTab('customers')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'customers' ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">مشتریان</span>
          </button>

          {/* 5. پیام‌ها */}
          <button
            onClick={() => handleNavigateTab('messenger')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'messenger' ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">پیام‌ها</span>
          </button>
        </nav>
      )}

      {/* App PIN Lock Screen Overlay */}
      {isAppLocked && currentUser && (
        <AppLockScreen onUnlock={handleUnlockApp} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
