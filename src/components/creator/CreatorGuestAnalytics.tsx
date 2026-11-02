import React, { useState, useMemo, useEffect } from 'react';
import { Storage } from '../../utils/storage';
import { GuestSessionLog, GuestAnalyticsSummary } from '../../types';
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Globe,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Cpu,
  Sparkles,
  Info,
} from 'lucide-react';
import { MetricCardWithSparkline } from '../charts/MetricCardWithSparkline';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';

export const CreatorGuestAnalytics: React.FC = () => {
  const [sessions, setSessions] = useState<GuestSessionLog[]>(() => Storage.getGuestSessions());
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [pwaFilter, setPwaFilter] = useState<'all' | 'pwa' | 'web'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadSessions = () => {
    setSessions(Storage.getGuestSessions());
  };

  useEffect(() => {
    const handleStorage = () => reloadSessions();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const summary = useMemo<GuestAnalyticsSummary>(() => {
    return Storage.getGuestAnalyticsSummary();
  }, [sessions]);

  // Relative time helper
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'نامشخص';
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (isNaN(diffMs)) return 'نامشخص';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'همین الان';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} دقیقه پیش`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ساعت پیش`;
    const diffDays = Math.floor(diffHour / 24);
    return `${diffDays} روز پیش`;
  };

  // Filtered Sessions List
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchDevice = deviceFilter === 'all' || s.deviceType === deviceFilter;
      const matchPwa =
        pwaFilter === 'all' ||
        (pwaFilter === 'pwa' && s.isStandalonePWA) ||
        (pwaFilter === 'web' && !s.isStandalonePWA);

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        s.os.toLowerCase().includes(q) ||
        s.browser.toLowerCase().includes(q) ||
        s.deviceType.toLowerCase().includes(q) ||
        s.userAgent.toLowerCase().includes(q) ||
        (s.shamsiDateFormatted && s.shamsiDateFormatted.includes(q));

      return matchDevice && matchPwa && matchQuery;
    });
  }, [sessions, deviceFilter, pwaFilter, searchQuery]);

  // Donut chart segments for Device Types
  const deviceDonutSegments = useMemo<DonutSegment[]>(() => {
    const total = summary.totalSessions || 1;
    return [
      {
        id: 'mobile',
        label: 'موبایل',
        value: summary.deviceCounts.mobile,
        color: '#0284c7', // Sky-600
      },
      {
        id: 'desktop',
        label: 'کامپیوتر / لپ‌تاپ',
        value: summary.deviceCounts.desktop,
        color: '#8b5cf6', // Violet-500
      },
      {
        id: 'tablet',
        label: 'تبلت',
        value: summary.deviceCounts.tablet,
        color: '#10b981', // Emerald-500
      },
    ].filter((s) => s.value > 0);
  }, [summary]);

  // Donut chart segments for Operating Systems
  const osDonutSegments = useMemo<DonutSegment[]>(() => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
    return Object.entries(summary.osCounts).map(([osName, count], idx) => ({
      id: osName,
      label: osName,
      value: count,
      color: colors[idx % colors.length],
    }));
  }, [summary]);

  // Delete single session
  const handleDeleteSession = (id: string) => {
    Storage.deleteGuestSession(id);
    reloadSessions();
    showToast('رکورد نشست مهمان حذف شد.');
  };

  // Clear all guest sessions
  const handleClearAll = () => {
    if (confirm('آیا از پاکسازی تمام رکوردهای ورود کاربران مهمان اطمینان دارید؟')) {
      Storage.clearGuestSessions();
      reloadSessions();
      showToast('تمامی آمار و رکوردهای نشست مهمان با موفقیت پاکسازی شدند.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sessions.length === 0) {
      alert('هیچ داده‌ای برای برون‌بری وجود ندارد.');
      return;
    }

    const headers = [
      'شناسه نشست',
      'نوع دستگاه',
      'سیستم‌عامل',
      'مرورگر',
      'عرض صفحه',
      'ارتفاع صفحه',
      'نحوه اجرا',
      'زبان',
      'تاریخ و زمان ورود',
      'رشته UserAgent',
    ];

    const rows = sessions.map((s) => [
      s.id,
      s.deviceType === 'mobile' ? 'موبایل' : s.deviceType === 'tablet' ? 'تبلت' : 'کامپیوتر',
      s.os,
      s.browser,
      `${s.screenWidth}x${s.screenHeight}`,
      `${s.viewportWidth}x${s.viewportHeight}`,
      s.isStandalonePWA ? 'اپلیکیشن نصبی PWA' : 'مرورگر وب',
      s.language,
      s.shamsiDateFormatted || s.timestamp,
      `"${(s.userAgent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `guest_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل اکسل/CSV آمار ورود مهمان با موفقیت دانلود شد.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-gradient-to-l from-sky-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>رصدخانه جامع ورود مهمان و تحلیل سخت‌افزار</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">آمار ورود کاربران مهمان و دستگاه‌ها</h2>
            <p className="text-xs sm:text-sm text-sky-200/80 max-w-2xl leading-relaxed">
              مشاهده بلادرنگ کاربرانی که با دکمه «مهمان؛ مشاهده امکانات» وارد سامانه شده‌اند، به همراه تفکیک نوع دستگاه (موبایل، تبلت، کامپیوتر)، سیستم‌عامل، مرورگر، ابعاد نمایشگر و نحوه اجرا (PWA یا وب).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={reloadSessions}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md border border-white/20 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بروزرسانی</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={sessions.length === 0}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی CSV</span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={sessions.length === 0}
              className="px-3.5 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی تاریخچه</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCardWithSparkline
          title="کل ورودهای مهمان"
          value={summary.totalSessions}
          unit="نشست"
          icon={<Smartphone className="w-4 h-4" />}
          iconBg="bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400"
          sparklineData={sessions.length > 0 ? [Math.round(sessions.length * 0.4), sessions.length] : []}
          sparklineColor="#0284c7"
        />

        <MetricCardWithSparkline
          title="دستگاه‌های منحصر‌به‌فرد"
          value={summary.uniqueDevices}
          unit="دستگاه"
          icon={<Cpu className="w-4 h-4" />}
          iconBg="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
          sparklineData={summary.uniqueDevices > 0 ? [Math.round(summary.uniqueDevices * 0.5), summary.uniqueDevices] : []}
          sparklineColor="#9333ea"
        />

        <MetricCardWithSparkline
          title="ورود با موبایل و تبلت"
          value={summary.deviceCounts.mobile + summary.deviceCounts.tablet}
          unit="مورد"
          icon={<Tablet className="w-4 h-4" />}
          iconBg="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
          sparklineData={summary.deviceCounts.mobile > 0 ? [summary.deviceCounts.mobile] : []}
          sparklineColor="#10b981"
        />

        <MetricCardWithSparkline
          title="ورود با کامپیوتر و لپ‌تاپ"
          value={summary.deviceCounts.desktop}
          unit="مورد"
          icon={<Laptop className="w-4 h-4" />}
          iconBg="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
          sparklineData={summary.deviceCounts.desktop > 0 ? [summary.deviceCounts.desktop] : []}
          sparklineColor="#f59e0b"
        />
      </div>

      {/* Visual Breakdowns Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device Types Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <span>سهم انواع دستگاه‌ها</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              {summary.totalSessions} نشست
            </span>
          </div>

          {summary.totalSessions > 0 ? (
            <div className="space-y-3">
              <InteractiveDonutChart
                title="سهم انواع دستگاه‌ها"
                segments={deviceDonutSegments}
                centerTitle={String(summary.totalSessions)}
                centerSubtitle="دستگاه"
                size={160}
              />
              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    <span>موبایل</span>
                  </span>
                  <span className="font-mono">
                    {summary.deviceCounts.mobile} (
                    {Math.round((summary.deviceCounts.mobile / summary.totalSessions) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-purple-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>کامپیوتر / لپ‌تاپ</span>
                  </span>
                  <span className="font-mono">
                    {summary.deviceCounts.desktop} (
                    {Math.round((summary.deviceCounts.desktop / summary.totalSessions) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>تبلت</span>
                  </span>
                  <span className="font-mono">
                    {summary.deviceCounts.tablet} (
                    {Math.round((summary.deviceCounts.tablet / summary.totalSessions) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              داده‌ای جهت نمایش نمودار ثبت نشده است
            </div>
          )}
        </div>

        {/* Operating Systems Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>سیستم‌عامل‌های بازدیدکنندگان</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              {Object.keys(summary.osCounts).length} سیستم‌عامل
            </span>
          </div>

          {summary.totalSessions > 0 ? (
            <div className="space-y-3">
              <InteractiveDonutChart
                title="توزیع سیستم‌عامل‌ها"
                segments={osDonutSegments}
                centerTitle={String(summary.totalSessions)}
                centerSubtitle="ورود"
                size={160}
              />
              <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                {Object.entries(summary.osCounts).map(([osName, count]) => (
                  <div key={osName} className="flex items-center justify-between font-bold">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                      {osName}
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} ({Math.round((count / summary.totalSessions) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              داده‌ای جهت نمایش نمودار ثبت نشده است
            </div>
          )}
        </div>

        {/* Browser & Execution Mode Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>مرورگرها و نحوه اجرا</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              PWA: {summary.pwaCount} | وب: {summary.webCount}
            </span>
          </div>

          {summary.totalSessions > 0 ? (
            <div className="space-y-3">
              {/* PWA vs Web Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-600">نسخه نصبی PWA ({summary.pwaCount})</span>
                  <span className="text-sky-600">مرورگر وب ({summary.webCount})</span>
                </div>
                <div className="w-full h-3 bg-sky-100 dark:bg-sky-950 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${summary.totalSessions > 0 ? (summary.pwaCount / summary.totalSessions) * 100 : 0}%`,
                    }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                    title={`PWA: ${summary.pwaCount}`}
                  />
                  <div
                    style={{
                      width: `${summary.totalSessions > 0 ? (summary.webCount / summary.totalSessions) * 100 : 0}%`,
                    }}
                    className="h-full bg-sky-500 transition-all duration-500"
                    title={`Web: ${summary.webCount}`}
                  />
                </div>
              </div>

              {/* Browsers List */}
              <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                {Object.entries(summary.browserCounts).map(([bName, count]) => (
                  <div key={bName} className="flex items-center justify-between font-bold">
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                      {bName}
                    </span>
                    <span className="font-mono text-slate-500">
                      {count} ({Math.round((count / summary.totalSessions) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              داده‌ای جهت نمایش مرورگرها ثبت نشده است
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس سیستم‌عامل، نام مرورگر، تاریخ یا دستگاه..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Device Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDeviceFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                deviceFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              همه ({summary.totalSessions})
            </button>
            <button
              onClick={() => setDeviceFilter('mobile')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                deviceFilter === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>موبایل</span>
            </button>
            <button
              onClick={() => setDeviceFilter('tablet')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                deviceFilter === 'tablet'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>تبلت</span>
            </button>
            <button
              onClick={() => setDeviceFilter('desktop')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                deviceFilter === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>کامپیوتر</span>
            </button>
          </div>

          {/* PWA Filter */}
          <select
            value={pwaFilter}
            onChange={(e) => setPwaFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">همه نحوه اجراها</option>
            <option value="pwa">اپلیکیشن نصبی (PWA)</option>
            <option value="web">مرورگر وب عادی</option>
          </select>
        </div>
      </div>

      {/* Guest Logins Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>فهرست نشست‌های اخیر ورود کاربران مهمان ({filteredSessions.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-bold">
            مرتب‌سازی بر اساس تازه‌ترین زمان ورود
          </span>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 font-bold">#</th>
                  <th className="p-3.5 font-bold">دستگاه</th>
                  <th className="p-3.5 font-bold">سیستم‌عامل</th>
                  <th className="p-3.5 font-bold">مرورگر</th>
                  <th className="p-3.5 font-bold">ابعاد صفحه نمایش</th>
                  <th className="p-3.5 font-bold">نحوه اجرا</th>
                  <th className="p-3.5 font-bold">تاریخ و ساعت ورود</th>
                  <th className="p-3.5 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map((s, idx) => {
                  const isMobile = s.deviceType === 'mobile';
                  const isTablet = s.deviceType === 'tablet';

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3.5 font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Device Type */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isMobile
                                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                                : isTablet
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                            }`}
                          >
                            {isMobile ? (
                              <Smartphone className="w-4 h-4" />
                            ) : isTablet ? (
                              <Tablet className="w-4 h-4" />
                            ) : (
                              <Laptop className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              {isMobile ? 'گوشی موبایل' : isTablet ? 'تبلت' : 'کامپیوتر / لپ‌تاپ'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              DPR: {s.pixelRatio}x
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* OS */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                          <Cpu className="w-3 h-3 text-sky-500" />
                          <span>{s.os || 'نامشخص'}</span>
                        </span>
                      </td>

                      {/* Browser */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {s.browser || 'مرورگر وب'}
                        </span>
                      </td>

                      {/* Screen Resolution */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-bold block" dir="ltr">
                            {s.screenWidth} × {s.screenHeight}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block" dir="ltr">
                            Viewport: {s.viewportWidth} × {s.viewportHeight}
                          </span>
                        </div>
                      </td>

                      {/* PWA / Browser */}
                      <td className="p-3.5">
                        {s.isStandalonePWA ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <Sparkles className="w-3 h-3" />
                            <span>اپ نصبی (PWA)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Globe className="w-3 h-3" />
                            <span>مرورگر وب</span>
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {s.shamsiDateFormatted || s.timestamp}
                          </span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium block">
                            {formatRelativeTime(s.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                          title="حذف این رکورد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              هنوز ورودی با اکانت مهمان ثبت نشده است
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              هنگامی که کاربران در صفحه ورود دکمه «مهمان؛ مشاهده امکانات» را انتخاب کنند، اطلاعات دستگاه و سیستم‌عامل آنها به همراه زمان ورود در این بخش ثبت و نمایش داده خواهد شد.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
