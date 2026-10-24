import React, { useState, useMemo } from 'react';
import { Storage } from '../../utils/storage';
import { Store, Medicine, Order } from '../../types';
import {
  BarChart3,
  Download,
  Smartphone,
  Globe,
  UserCheck,
  Calendar,
  Layers,
  Store as StoreIcon,
  Pill,
  TrendingUp,
  Package,
  Boxes,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

type TimeFilter = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly';

export const CreatorAnalyticsAndInventory: React.FC = () => {
  const [stores] = useState<Store[]>(() => Storage.getStores());
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics
  const analytics = useMemo(() => Storage.getAppAnalytics(), []);
  
  // All medicines & all orders
  const allMedicines = useMemo(() => Storage.getAllMedicinesAcrossStores(), []);
  const allOrders = useMemo(() => Storage.getAllOrdersAcrossStores(), []);

  // Time filter timestamp threshold
  const filterDateThreshold = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      case 'weekly':
        return now.getTime() - 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return now.getTime() - 30 * 24 * 60 * 60 * 1000;
      case '3months':
        return now.getTime() - 90 * 24 * 60 * 60 * 1000;
      case '6months':
        return now.getTime() - 180 * 24 * 60 * 60 * 1000;
      case 'yearly':
        return now.getTime() - 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }, [timeFilter]);

  // Filtered orders by time
  const ordersInPeriod = useMemo(() => {
    return allOrders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      return orderTime >= filterDateThreshold;
    });
  }, [allOrders, filterDateThreshold]);

  // Aggregate stats per store for orders & sold medicines
  const storePerformance = useMemo(() => {
    return stores.map((s) => {
      const storeOrders = ordersInPeriod.filter((o) => o.storeId === s.id);
      const totalOrdersCount = storeOrders.length;
      let totalSoldUnits = 0;
      let totalRevenueAFN = 0;

      storeOrders.forEach((o) => {
        totalRevenueAFN += o.totalAFN || 0;
        (o.items || []).forEach((item) => {
          totalSoldUnits += item.quantity || 0;
        });
      });

      const storeMeds = allMedicines.filter((m) => m.storeId === s.id);
      const inventoryUnits = storeMeds.reduce((sum, m) => sum + (m.stock || 0), 0);
      const inventoryValueAFN = storeMeds.reduce(
        (sum, m) => sum + (m.stock || 0) * (m.salePrice || 0),
        0
      );

      return {
        store: s,
        totalOrdersCount,
        totalSoldUnits,
        totalRevenueAFN,
        inventoryItemsCount: storeMeds.length,
        inventoryUnits,
        inventoryValueAFN,
      };
    });
  }, [stores, ordersInPeriod, allMedicines]);

  // Overall totals across ALL stores
  const globalPerformance = useMemo(() => {
    const totalOrdersCount = ordersInPeriod.length;
    let totalSoldUnits = 0;
    let totalRevenueAFN = 0;

    ordersInPeriod.forEach((o) => {
      totalRevenueAFN += o.totalAFN || 0;
      (o.items || []).forEach((item) => {
        totalSoldUnits += item.quantity || 0;
      });
    });

    const totalInventoryUnits = allMedicines.reduce((sum, m) => sum + (m.stock || 0), 0);
    const totalInventoryValueAFN = allMedicines.reduce(
      (sum, m) => sum + (m.stock || 0) * (m.salePrice || 0),
      0
    );

    return {
      totalOrdersCount,
      totalSoldUnits,
      totalRevenueAFN,
      totalMedicinesKinds: allMedicines.length,
      totalInventoryUnits,
      totalInventoryValueAFN,
    };
  }, [ordersInPeriod, allMedicines]);

  // Medicines list for selected store
  const filteredMedicines = useMemo(() => {
    return allMedicines.filter((m) => {
      const matchStore = selectedStoreId === 'all' || m.storeId === selectedStoreId;
      const matchQuery =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.brand && m.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.code && m.code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStore && matchQuery;
    });
  }, [allMedicines, selectedStoreId, searchQuery]);

  const timeFilterLabels: Record<TimeFilter, string> = {
    daily: 'امروز (روزانه)',
    weekly: '۷ روز اخیر (هفتگی)',
    monthly: '۳۰ روز اخیر (ماهانه)',
    '3months': '۳ ماهه',
    '6months': '۶ ماهه',
    yearly: '۱ ساله (سالانه)',
  };

  return (
    <div className="space-y-6">
      {/* 1. SECTION: APP INSTALLS & TRAFFIC ANALYTICS */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-indigo-800/40">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>گزارش نصب و ترافیک PWA و وب</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>مانیتورینگ زنده</span>
              </span>
            </div>
            <h2 className="text-xl font-black">آمار نصب برنامه و میزان بازدیدها</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              تفکیک دقیق نصب‌های فعال چند روز اخیر، تعداد بازدیدهای دوره‌ای و کانال دسترسی (برنامه، مرورگر، مهمان)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-purple-200">کل نصب‌های برنامه (PWA)</div>
              <div className="text-2xl font-black text-amber-300">
                {analytics.totalInstalls.toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-400/30 text-center">
              <div className="text-[10px] text-emerald-200">نصب‌های فعال اخیر (۷ روز)</div>
              <div className="text-2xl font-black text-emerald-300">
                {analytics.activeInstalls7Days.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید امروز (روزانه)</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsDaily.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">بازدید</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید این هفته (۷ روز)</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsWeekly.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">بازدید</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید این ماه (۳۰ روز)</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsMonthly.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">بازدید</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید سالانه سامانه</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsYearly.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">بازدید</span>
            </div>
          </div>
        </div>

        {/* Traffic Channels Breakdown */}
        <div className="mt-4 pt-4 border-t border-indigo-800/40">
          <div className="text-xs font-bold text-indigo-200 mb-2.5">
            تفکیک نحوه اتصال و بازدید کاربران:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-indigo-900/40 border border-indigo-700/50 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">برنامه نصب‌شده (PWA)</div>
                  <div className="text-[10px] text-indigo-300">نصب مستقیم روی گوشی/تبلت</div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-300">
                {analytics.visitsInstalledPWA.toLocaleString()}
              </div>
            </div>

            <div className="bg-indigo-900/40 border border-indigo-700/50 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">مرورگر وب بدون نصب</div>
                  <div className="text-[10px] text-indigo-300">کروم، سافاری و فایرفاکس</div>
                </div>
              </div>
              <div className="text-sm font-black text-sky-300">
                {analytics.visitsWebBrowser.toLocaleString()}
              </div>
            </div>

            <div className="bg-indigo-900/40 border border-indigo-700/50 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">حالت مهمان / پیش‌نمایش</div>
                  <div className="text-[10px] text-indigo-300">مهمان بدون لاگین مستقیم</div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-300">
                {analytics.visitsGuestMode.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION: PERIODIC ORDERS & SOLD MEDICINES ANALYTICS WITH FILTERS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>تحلیل فروش و سفارشات دوره‌ای</span>
              </span>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              آمار سفارش‌ها، داروهای فروخته شده و گردش مالی فروشگاه‌ها
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              فیلترهای زمانی روزانه، هفتگی، ماهانه، ۳ ماهه، ۶ ماهه و سالانه
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
            {(['daily', 'weekly', 'monthly', '3months', '6months', 'yearly'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  timeFilter === f
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {timeFilterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Global Overview Cards for the Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
              کل سفارشات ثبت‌شده (همه فروشگاه‌ها)
            </div>
            <div className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">
              {globalPerformance.totalOrdersCount.toLocaleString()}{' '}
              <span className="text-xs font-normal">سفارش</span>
            </div>
            <div className="text-[11px] text-purple-600/80 mt-1">
              بازه انتخابی: {timeFilterLabels[timeFilter]}
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              تعداد کل داروهای فروخته شده (Sold Units)
            </div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
              {globalPerformance.totalSoldUnits.toLocaleString()}{' '}
              <span className="text-xs font-normal">عدد / بسته</span>
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">
              مجموع اقلام خارج شده از انبارهای تمام فروشگاه‌ها
            </div>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-sky-700 dark:text-sky-300">
              مجموع مبلغ فروش فاکتورها (AFN)
            </div>
            <div className="text-2xl font-black text-sky-900 dark:text-sky-100 mt-1">
              {globalPerformance.totalRevenueAFN.toLocaleString()}{' '}
              <span className="text-xs font-normal">AFN</span>
            </div>
            <div className="text-[11px] text-sky-600/80 mt-1">
              گردش ناخالص سفارشات ثبت‌شده در سامانه
            </div>
          </div>
        </div>

        {/* Per Store Breakdown Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <StoreIcon className="w-4 h-4 text-purple-600" />
              <span>عملکرد تفکیکی هر فروشگاه در بازه {timeFilterLabels[timeFilter]}</span>
            </span>
            <span className="text-[11px] text-slate-500">تعداد فروشگاه‌ها: {stores.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">فروشگاه دارویی</th>
                  <th className="py-2.5 px-3 font-semibold text-center">تعداد سفارش‌ها</th>
                  <th className="py-2.5 px-3 font-semibold text-center">تعداد داروی فروخته‌شده</th>
                  <th className="py-2.5 px-3 font-semibold text-center">مبلغ کل فروش (AFN)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">موجودی انبار (تعداد)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">ارزش کل موجودی انبار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {storePerformance.map((item) => (
                  <tr key={item.store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xs">
                          {item.store.name.slice(0, 1)}
                        </div>
                        <div>
                          <div>{item.store.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            شناسه: {item.store.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-purple-700 dark:text-purple-300">
                      {item.totalOrdersCount.toLocaleString()} سفارش
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {item.totalSoldUnits.toLocaleString()} عدد
                    </td>

                    <td className="py-3 px-3 text-center font-black text-slate-800 dark:text-slate-100">
                      {item.totalRevenueAFN.toLocaleString()} AFN
                    </td>

                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                      {item.inventoryUnits.toLocaleString()} عدد
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {item.inventoryValueAFN.toLocaleString()} AFN
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-purple-50/70 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800 font-bold">
                <tr>
                  <td className="py-3 px-3 text-purple-900 dark:text-purple-200 font-black">
                    جمع کل همه فروشگاه‌ها:
                  </td>
                  <td className="py-3 px-3 text-center font-black text-purple-900 dark:text-purple-200">
                    {globalPerformance.totalOrdersCount.toLocaleString()} سفارش
                  </td>
                  <td className="py-3 px-3 text-center font-black text-emerald-700 dark:text-emerald-300">
                    {globalPerformance.totalSoldUnits.toLocaleString()} عدد
                  </td>
                  <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white">
                    {globalPerformance.totalRevenueAFN.toLocaleString()} AFN
                  </td>
                  <td className="py-3 px-3 text-center font-black text-slate-700 dark:text-slate-200">
                    {globalPerformance.totalInventoryUnits.toLocaleString()} عدد
                  </td>
                  <td className="py-3 px-3 text-center font-black text-amber-700 dark:text-amber-300">
                    {globalPerformance.totalInventoryValueAFN.toLocaleString()} AFN
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* 3. SECTION: DETAILED MEDICINE CATALOG PER STORE & ACROSS ALL STORES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5" />
                <span>کاتالوگ و انبار سراسری داروها</span>
              </span>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              لیست تفصیلی دواهای ثبت شده، موجودی و قیمت فروش
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مشاهده اقلام دارویی بر اساس هر فروشگاه یا مجموع کل داروها در سراسر سامانه
            </p>
          </div>

          {/* Store Selector & Search Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              <option value="all">مجموع کل داروها (همه فروشگاه‌ها)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="relative w-48 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام، برند، کد..."
                className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Aggregate KPI for Current View */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-[11px] text-slate-500">تنوع اقلام نمایش داده شده:</div>
            <div className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
              {filteredMedicines.length.toLocaleString()} قلم
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">مجموع تعداد فیزیکی موجود:</div>
            <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">
              {filteredMedicines.reduce((s, m) => s + (m.stock || 0), 0).toLocaleString()} عدد / بسته
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">میانگین قیمت فروش:</div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {filteredMedicines.length > 0
                ? Math.round(
                    filteredMedicines.reduce((s, m) => s + (m.salePrice || 0), 0) /
                      filteredMedicines.length
                  ).toLocaleString()
                : 0}{' '}
              AFN
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">ارزش کل موجودی به قیمت فروش:</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {filteredMedicines
                .reduce((s, m) => s + (m.stock || 0) * (m.salePrice || 0), 0)
                .toLocaleString()}{' '}
              AFN
            </div>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">ردیف</th>
                  <th className="py-2.5 px-3 font-semibold">فروشگاه مالک</th>
                  <th className="py-2.5 px-3 font-semibold">نام دارو و مشخصات</th>
                  <th className="py-2.5 px-3 font-semibold">برند / شرکت</th>
                  <th className="py-2.5 px-3 font-semibold">شکل دارویی</th>
                  <th className="py-2.5 px-3 font-semibold text-center">موجودی انبار</th>
                  <th className="py-2.5 px-3 font-semibold text-center">قیمت فروش واحد (AFN)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">جمع کل ارزش موجودی (AFN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      هیچ دارویی با مشخصات وارد شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m, idx) => {
                    const store = stores.find((s) => s.id === m.storeId);
                    const lineValue = (m.stock || 0) * (m.salePrice || 0);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>

                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {store?.name || m.storeId || 'نامشخص'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                          <div>{m.name}</div>
                          {m.code && (
                            <div className="text-[10px] font-mono text-slate-400">کد: {m.code}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {m.brand || '-'}
                        </td>

                        <td className="py-2.5 px-3 text-slate-500">
                          {m.dosageForm || 'بسته'} {m.strength ? `(${m.strength})` : ''}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              m.stock <= 5
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {m.stock.toLocaleString()} {m.unit || 'عدد'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {m.salePrice.toLocaleString()} AFN
                        </td>

                        <td className="py-2.5 px-3 text-center font-black text-purple-700 dark:text-purple-300">
                          {lineValue.toLocaleString()} AFN
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
