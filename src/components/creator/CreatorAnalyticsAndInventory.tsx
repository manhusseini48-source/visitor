import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Storage } from '../../utils/storage';
import { Store, Medicine, Order, Customer, UserProfile, VisitorCashCollection, VisitorRemittance, VisitRecord } from '../../types';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
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
  RefreshCw,
  Database,
  Users,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Sparkles,
  MapPin,
  FileText,
} from 'lucide-react';

type TimeFilter = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly' | 'all';

export const CreatorAnalyticsAndInventory: React.FC = () => {
  // Live State
  const [stores, setStores] = useState<Store[]>(() => Storage.getStores());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => Storage.getProfiles());
  const [medicines, setMedicines] = useState<Medicine[]>(() => Storage.getAllMedicinesAcrossStores());
  const [orders, setOrders] = useState<Order[]>(() => Storage.getAllOrdersAcrossStores());
  const [customers, setCustomers] = useState<Customer[]>(() => Storage.getCustomers());
  const [cashCollections, setCashCollections] = useState<VisitorCashCollection[]>(() => Storage.getCashCollections());
  const [remittances, setRemittances] = useState<VisitorRemittance[]>(() => Storage.getRemittances());
  const [visits, setVisits] = useState<VisitRecord[]>(() => Storage.getVisits());
  
  // Real Analytics
  const [analytics, setAnalytics] = useState(() => Storage.getAppAnalytics());

  // Controls
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('همین الان');
  const [dataSource, setDataSource] = useState<'cloud' | 'local'>('local');
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Fetch real data from Supabase & Storage
  const loadLiveData = useCallback(async () => {
    setIsRefreshing(true);
    const start = performance.now();

    // 1. Always load local baseline
    let localStores = Storage.getStores();
    let localProfiles = Storage.getProfiles();
    let localMeds = Storage.getAllMedicinesAcrossStores();
    let localOrders = Storage.getAllOrdersAcrossStores();
    let localCusts = Storage.getCustomers();
    let localCols = Storage.getCashCollections();
    let localRems = Storage.getRemittances();
    let localVisits = Storage.getVisits();
    let localAnalytics = Storage.getAppAnalytics();

    // 2. If Supabase is connected, query live rows
    if (supabase && isSupabaseConfigured) {
      try {
        const [
          storesRes,
          profilesRes,
          medsRes,
          ordersRes,
          custsRes,
          colsRes,
          remsRes,
          visitsRes,
        ] = await Promise.allSettled([
          supabase.from('stores').select('*'),
          supabase.from('profiles').select('*'),
          supabase.from('medicines').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('visitor_cash_collections').select('*'),
          supabase.from('visitor_remittances').select('*'),
          supabase.from('visits').select('*'),
        ]);

        const latency = Math.round(performance.now() - start);
        setPingLatency(latency);
        setDataSource('cloud');

        // Merge Stores
        if (storesRes.status === 'fulfilled' && storesRes.value.data && storesRes.value.data.length > 0) {
          const cloudStores: Store[] = storesRes.value.data.map((s: any) => ({
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
              planName: (s.subscription_plan as any) || '14-Day Trial',
              status: !s.is_active ? 'suspended' : s.subscription_expires_at && new Date(s.subscription_expires_at).getTime() < Date.now() ? 'expired' : 'active',
              startDate: s.created_at || new Date().toISOString(),
              endDate: s.subscription_expires_at || new Date(Date.now() + 14 * 86400000).toISOString(),
              trialDaysRemaining: 14,
              priceAFN: 0,
              renewalHistory: [],
            },
          }));
          cloudStores.forEach((cs) => {
            const idx = localStores.findIndex((st) => st.id === cs.id);
            if (idx >= 0) localStores[idx] = { ...localStores[idx], ...cs };
            else localStores.push(cs);
          });
          Storage.saveStores(localStores);
        }

        // Merge Profiles
        if (profilesRes.status === 'fulfilled' && profilesRes.value.data && profilesRes.value.data.length > 0) {
          const cloudProfiles: UserProfile[] = profilesRes.value.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
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
            const idx = localProfiles.findIndex((pr) => pr.id === cp.id || pr.username === cp.username);
            if (idx >= 0) localProfiles[idx] = { ...localProfiles[idx], ...cp };
            else localProfiles.push(cp);
          });
          Storage.saveProfiles(localProfiles);
        }

        // Merge Medicines
        if (medsRes.status === 'fulfilled' && medsRes.value.data && medsRes.value.data.length > 0) {
          const cloudMeds: Medicine[] = medsRes.value.data.map((m: any) => ({
            id: m.id,
            storeId: m.store_id,
            code: m.code,
            name: m.name,
            brand: m.company || m.generic_name || '',
            category: m.category || '',
            dosageForm: m.form || 'بسته',
            strength: m.strength || '',
            batchNumber: m.batch_number || '',
            expiryDate: m.expire_date || '',
            stock: Number(m.stock_quantity) || 0,
            purchasePrice: Number(m.buy_price) || 0,
            salePrice: Number(m.sale_price) || 0,
            images: m.image_url ? [m.image_url] : [],
            shortDescription: m.description || '',
            fullDescription: m.description || '',
            unit: m.form || 'بسته',
            minStockAlert: 5,
            status: Number(m.stock_quantity) > 0 ? 'active' : 'inactive',
            createdAt: m.created_at || new Date().toISOString(),
            updatedAt: m.created_at || new Date().toISOString(),
          }));
          cloudMeds.forEach((cm) => {
            const idx = localMeds.findIndex((lm) => lm.id === cm.id);
            if (idx >= 0) localMeds[idx] = { ...localMeds[idx], ...cm };
            else localMeds.push(cm);
          });
        }

        // Merge Orders
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data && ordersRes.value.data.length > 0) {
          const cloudOrders: Order[] = ordersRes.value.data.map((o: any) => ({
            id: o.id,
            orderNumber: o.id.slice(0, 8),
            storeId: o.store_id,
            visitorId: o.visitor_id,
            visitorName: 'ویزیتور',
            customerId: o.customer_id,
            customerName: o.customer_name,
            items: Array.isArray(o.items) ? o.items : [],
            subtotalAFN: Number(o.total_amount) || 0,
            discountAFN: 0,
            taxAFN: 0,
            totalAFN: Number(o.total_amount) || 0,
            paidAmountAFN: Number(o.paid_amount) || 0,
            remainingAmountAFN: Number(o.remaining_amount) || 0,
            paymentStatus: o.payment_status || 'unpaid',
            payments: Array.isArray(o.payments) ? o.payments : [],
            status: o.status || 'pending',
            notes: o.notes || '',
            history: [],
            createdAt: o.created_at || new Date().toISOString(),
            updatedAt: o.created_at || new Date().toISOString(),
          }));
          cloudOrders.forEach((co) => {
            const idx = localOrders.findIndex((lo) => lo.id === co.id);
            if (idx >= 0) localOrders[idx] = { ...localOrders[idx], ...co };
            else localOrders.push(co);
          });
        }

        // Merge Collections
        if (colsRes.status === 'fulfilled' && colsRes.value.data && colsRes.value.data.length > 0) {
          const cloudCols: VisitorCashCollection[] = colsRes.value.data.map((c: any) => ({
            id: c.id,
            storeId: c.store_id,
            visitorId: c.visitor_id,
            visitorName: c.visitor_name,
            orderId: c.order_id,
            orderNumber: c.order_number,
            customerId: c.customer_id,
            customerName: c.customer_name,
            amountAFN: Number(c.amount_afn) || 0,
            collectionType: c.collection_type,
            paymentMethod: c.payment_method,
            receiptNumber: c.receipt_number,
            notes: c.notes,
            date: c.date || c.created_at,
            status: c.status || 'in_hand',
            remittanceId: c.remittance_id,
          }));
          cloudCols.forEach((cc) => {
            const idx = localCols.findIndex((lc) => lc.id === cc.id);
            if (idx >= 0) localCols[idx] = { ...localCols[idx], ...cc };
            else localCols.push(cc);
          });
        }

        // Merge Customers
        if (custsRes.status === 'fulfilled' && custsRes.value.data && custsRes.value.data.length > 0) {
          const cloudCusts: Customer[] = custsRes.value.data.map((cu: any) => ({
            id: cu.id,
            storeId: cu.store_id,
            primaryVisitorId: cu.visitor_id,
            name: cu.name,
            managerName: cu.manager_name,
            phone: cu.phone,
            area: cu.province,
            city: cu.city,
            address: cu.address,
            createdBy: cu.visitor_id || 'system',
            sharedVisitorIds: [],
            status: 'active',
            totalOrders: 0,
            totalOrdersCount: 0,
            totalSpentAFN: 0,
            totalOrderAmount: 0,
            createdAt: cu.created_at || new Date().toISOString(),
          }));
          cloudCusts.forEach((ccu) => {
            const idx = localCusts.findIndex((lc) => lc.id === ccu.id);
            if (idx >= 0) localCusts[idx] = { ...localCusts[idx], ...ccu };
            else localCusts.push(ccu);
          });
        }

        // Merge Visits
        if (visitsRes.status === 'fulfilled' && visitsRes.value.data && visitsRes.value.data.length > 0) {
          const cloudVisits: VisitRecord[] = visitsRes.value.data.map((v: any) => ({
            id: v.id,
            storeId: v.store_id,
            visitorId: v.visitor_id,
            visitorName: 'ویزیتور',
            customerId: v.customer_id,
            customerName: v.customer_name,
            scheduledTime: v.created_at || new Date().toISOString(),
            status: 'completed',
            notes: v.notes,
            location: v.latitude && v.longitude ? { latitude: v.latitude, longitude: v.longitude } : undefined,
          }));
          cloudVisits.forEach((cv) => {
            const idx = localVisits.findIndex((lv) => lv.id === cv.id);
            if (idx >= 0) localVisits[idx] = { ...localVisits[idx], ...cv };
            else localVisits.push(cv);
          });
        }
      } catch (err) {
        console.warn('Observatory cloud fetch error:', err);
        setDataSource('local');
      }
    } else {
      setDataSource('local');
    }

    setStores([...localStores]);
    setProfiles([...localProfiles]);
    setMedicines([...localMeds]);
    setOrders([...localOrders]);
    setCustomers([...localCusts]);
    setCashCollections([...localCols]);
    setRemittances([...localRems]);
    setVisits([...localVisits]);
    setAnalytics(localAnalytics);

    const now = new Date();
    setLastUpdatedTime(`${now.toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    setIsRefreshing(false);
  }, []);

  // Mount effect & Storage listener
  useEffect(() => {
    loadLiveData();
    const handleStorageChange = () => {
      setStores(Storage.getStores());
      setProfiles(Storage.getProfiles());
      setMedicines(Storage.getAllMedicinesAcrossStores());
      setOrders(Storage.getAllOrdersAcrossStores());
      setCustomers(Storage.getCustomers());
      setAnalytics(Storage.getAppAnalytics());
      setCashCollections(Storage.getCashCollections());
      setRemittances(Storage.getRemittances());
      setVisits(Storage.getVisits());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLiveData]);

  // Time filter threshold
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
      case 'all':
      default:
        return 0;
    }
  }, [timeFilter]);

  // Orders filtered by time and store
  const ordersInPeriod = useMemo(() => {
    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      const inTime = filterDateThreshold === 0 || orderTime >= filterDateThreshold;
      const inStore = selectedStoreId === 'all' || o.storeId === selectedStoreId;
      return inTime && inStore;
    });
  }, [orders, filterDateThreshold, selectedStoreId]);

  // Cash collections filtered by time and store
  const collectionsInPeriod = useMemo(() => {
    return cashCollections.filter((c) => {
      const colTime = new Date(c.date || '').getTime();
      const inTime = filterDateThreshold === 0 || isNaN(colTime) || colTime >= filterDateThreshold;
      const inStore = selectedStoreId === 'all' || c.storeId === selectedStoreId;
      return inTime && inStore;
    });
  }, [cashCollections, filterDateThreshold, selectedStoreId]);

  // Real aggregate performance
  const globalPerformance = useMemo(() => {
    const totalOrdersCount = ordersInPeriod.length;
    let totalSoldUnits = 0;
    let totalRevenueAFN = 0;
    let totalPaidAFN = 0;
    let totalRemainingAFN = 0;

    ordersInPeriod.forEach((o) => {
      totalRevenueAFN += o.totalAFN || o.subtotalAFN || 0;
      totalPaidAFN += o.paidAmountAFN || 0;
      totalRemainingAFN += o.remainingAmountAFN || 0;
      (o.items || []).forEach((item) => {
        totalSoldUnits += item.quantity || 0;
      });
    });

    const totalCollectedAFN = collectionsInPeriod.reduce((sum, c) => sum + (c.amountAFN || 0), 0);

    const relevantMeds = medicines.filter((m) => selectedStoreId === 'all' || m.storeId === selectedStoreId);
    const totalInventoryUnits = relevantMeds.reduce((sum, m) => sum + (m.stock || 0), 0);
    const totalInventorySaleValueAFN = relevantMeds.reduce(
      (sum, m) => sum + (m.stock || 0) * (m.salePrice || 0),
      0
    );
    const totalInventoryBuyValueAFN = relevantMeds.reduce(
      (sum, m) => sum + (m.stock || 0) * (m.purchasePrice || 0),
      0
    );

    const activeVisitorsCount = profiles.filter((p) => p.role === 'visitor' && p.isActive).length;
    const storeOwnersCount = profiles.filter((p) => p.role === 'store_owner').length;

    return {
      totalOrdersCount,
      totalSoldUnits,
      totalRevenueAFN,
      totalPaidAFN,
      totalRemainingAFN,
      totalCollectedAFN,
      collectionRate: totalRevenueAFN > 0 ? Math.min(100, Math.round(((totalPaidAFN + totalCollectedAFN) / totalRevenueAFN) * 100)) : 0,
      totalMedicinesKinds: relevantMeds.length,
      totalInventoryUnits,
      totalInventorySaleValueAFN,
      totalInventoryBuyValueAFN,
      activeVisitorsCount,
      storeOwnersCount,
      totalCustomersCount: customers.filter((c) => selectedStoreId === 'all' || c.storeId === selectedStoreId).length,
      totalVisitsCount: visits.filter((v) => selectedStoreId === 'all' || v.storeId === selectedStoreId).length,
    };
  }, [ordersInPeriod, collectionsInPeriod, medicines, selectedStoreId, profiles, customers, visits]);

  // Per Store Breakdown
  const storePerformance = useMemo(() => {
    return stores.map((s) => {
      const storeOrders = orders.filter((o) => {
        const orderTime = new Date(o.createdAt).getTime();
        const inTime = filterDateThreshold === 0 || orderTime >= filterDateThreshold;
        return o.storeId === s.id && inTime;
      });

      const totalOrdersCount = storeOrders.length;
      let totalSoldUnits = 0;
      let totalRevenueAFN = 0;
      let totalPaidAFN = 0;
      let totalRemainingAFN = 0;

      storeOrders.forEach((o) => {
        totalRevenueAFN += o.totalAFN || o.subtotalAFN || 0;
        totalPaidAFN += o.paidAmountAFN || 0;
        totalRemainingAFN += o.remainingAmountAFN || 0;
        (o.items || []).forEach((item) => {
          totalSoldUnits += item.quantity || 0;
        });
      });

      const storeMeds = medicines.filter((m) => m.storeId === s.id);
      const inventoryUnits = storeMeds.reduce((sum, m) => sum + (m.stock || 0), 0);
      const inventoryValueAFN = storeMeds.reduce(
        (sum, m) => sum + (m.stock || 0) * (m.salePrice || 0),
        0
      );

      const storeCols = cashCollections.filter((c) => c.storeId === s.id);
      const collectedAFN = storeCols.reduce((sum, c) => sum + (c.amountAFN || 0), 0);

      const storeVisitors = profiles.filter((p) => p.storeId === s.id && p.role === 'visitor').length;

      return {
        store: s,
        totalOrdersCount,
        totalSoldUnits,
        totalRevenueAFN,
        totalPaidAFN,
        totalRemainingAFN,
        collectedAFN,
        inventoryItemsCount: storeMeds.length,
        inventoryUnits,
        inventoryValueAFN,
        visitorsCount: storeVisitors,
      };
    });
  }, [stores, orders, medicines, cashCollections, profiles, filterDateThreshold]);

  // Filtered medicines list
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchStore = selectedStoreId === 'all' || m.storeId === selectedStoreId;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.brand && m.brand.toLowerCase().includes(q)) ||
        (m.code && m.code.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q));
      return matchStore && matchQuery;
    });
  }, [medicines, selectedStoreId, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ردیف', 'فروشگاه', 'کد دارو', 'نام دارو', 'برند/شرکت', 'شکل دارویی', 'موجودی انبار', 'قیمت خرید (AFN)', 'قیمت فروش (AFN)', 'ارزش کل موجودی'];
    const rows = filteredMedicines.map((m, idx) => {
      const st = stores.find((s) => s.id === m.storeId)?.name || m.storeId || 'نامشخص';
      const val = (m.stock || 0) * (m.salePrice || 0);
      return [
        idx + 1,
        `"${st}"`,
        `"${m.code || ''}"`,
        `"${m.name || ''}"`,
        `"${m.brand || ''}"`,
        `"${m.dosageForm || ''}"`,
        m.stock || 0,
        m.purchasePrice || 0,
        m.salePrice || 0,
        val,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_observatory_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const timeFilterLabels: Record<TimeFilter, string> = {
    daily: 'امروز (۲۴ ساعت)',
    weekly: '۷ روز اخیر',
    monthly: '۳۰ روز اخیر',
    '3months': '۳ ماهه',
    '6months': '۶ ماهه',
    yearly: '۱ ساله',
    all: 'کل تاریخچه سیستم',
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* OBSERVATORY STATUS & LIVE CONTROLS HEADER */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-indigo-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/50 flex-shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">رصدخانه هوشمند و آمار زنده کل سامانه</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono border ${
                dataSource === 'cloud'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'cloud' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{dataSource === 'cloud' ? `Supabase Cloud (${pingLatency || 0}ms)` : 'پایگاه داده کلاینت'}</span>
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              محاسبه و نمایش ۱۰۰٪ واقعی از روی داده‌های دیتابیس (سفارشات، موجودی انبار، کاربران، وصولی‌ها و ویزیت‌ها)
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-[11px] text-indigo-200/90 bg-white/5 border border-white/10 px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>آخرین بروزرسانی: {lastUpdatedTime}</span>
          </div>

          <button
            type="button"
            onClick={loadLiveData}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-900/50 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'در حال پایش...' : 'بروزرسانی زنده داده‌ها'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95"
            title="دانلود گزارش جامع اکسل/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی اکسل</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TOP METRICS: REAL SYSTEM CORE STATS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">کل فروشگاه‌ها</span>
            <StoreIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {stores.length.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{stores.filter((s) => s.subscription?.status === 'active').length} فعال</span>
            <span>•</span>
            <span className="text-sky-600 font-bold">{stores.filter((s) => s.subscription?.status === 'trial').length} آزمایشی</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">ویزیتورهای فعال</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {globalPerformance.activeVisitorsCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            از مجموع {profiles.length} حساب کاربری
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">تنوع اقلام دارویی</span>
            <Pill className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {globalPerformance.totalMedicinesKinds.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {globalPerformance.totalInventoryUnits.toLocaleString()} عدد در انبارها
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">سفارشات ثبت‌شده</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {globalPerformance.totalOrdersCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {globalPerformance.totalSoldUnits.toLocaleString()} قلم داروی فروخته‌شده
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">مشتریان و داروخانه‌ها</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {globalPerformance.totalCustomersCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {globalPerformance.totalVisitsCount.toLocaleString()} ویزیت حضوری ثبت‌شده
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">ارزش کل انبار (فروش)</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 truncate">
            {globalPerformance.totalInventorySaleValueAFN.toLocaleString()} <span className="text-[10px] font-normal">AFN</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            خرید: {globalPerformance.totalInventoryBuyValueAFN.toLocaleString()} AFN
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. REAL APP TRAFFIC & PWA TELEMETRY SECTION */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 border border-indigo-900/60 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-800/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>رصدخانه ترافیک و دستگاه‌های متصل به سامانه</span>
              </span>
            </div>
            <h3 className="text-lg font-black text-white">آمار واقعی بازدیدها و نصب اپلیکیشن</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              ثبت رویدادهای زنده بر اساس مرورگر، برنامه نصب‌شده (PWA)، و دسترسی‌های کاربران
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-center">
              <div className="text-[10px] text-purple-200">نصب واقعی برنامه (PWA)</div>
              <div className="text-xl font-black text-amber-300">
                {analytics.totalInstalls.toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-emerald-400/30 text-center">
              <div className="text-[10px] text-emerald-200">فعال در ۷ روز اخیر</div>
              <div className="text-xl font-black text-emerald-300">
                {analytics.activeInstalls7Days.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Real Periodic Visits Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید امروز (۲۴ ساعت)</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsDaily.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">ورود</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید این هفته (۷ روز)</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsWeekly.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">ورود</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">بازدید این ماه (۳۰ روز)</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsMonthly.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">ورود</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <div className="text-[11px] text-indigo-200">کل بازدیدهای ثبت‌شده</div>
            <div className="text-lg font-black text-white mt-1">
              {analytics.visitsYearly.toLocaleString()} <span className="text-[10px] text-indigo-300 font-normal">ورود</span>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-indigo-900/40 border border-indigo-700/50 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">برنامه نصب‌شده (PWA)</div>
                <div className="text-[10px] text-indigo-300">ورود از آیکون روی صفحه گوشی</div>
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
                <div className="text-xs font-bold">مرورگر وب مستقیم</div>
                <div className="text-[10px] text-indigo-300">Chrome, Safari, Firefox</div>
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
                <div className="text-xs font-bold">پیش‌نمایش مهمان</div>
                <div className="text-[10px] text-indigo-300">ورود بدون نام کاربری</div>
              </div>
            </div>
            <div className="text-sm font-black text-amber-300">
              {analytics.visitsGuestMode.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PERIODIC ORDERS, REVENUE & FINANCIAL OBSERVATORY */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>رصدخانه مالی و گردش سفارشات</span>
              </span>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              تحلیل حجم فروش، سفارش‌ها، وصولی‌ها و معوقات
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              فیلتر زمانی فعال: {timeFilterLabels[timeFilter]}
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
            {(['daily', 'weekly', 'monthly', '3months', '6months', 'yearly', 'all'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                type="button"
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

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
              کل گردش مالی سفارشات (فاکتورها)
            </div>
            <div className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">
              {globalPerformance.totalRevenueAFN.toLocaleString()}{' '}
              <span className="text-xs font-normal">AFN</span>
            </div>
            <div className="text-[11px] text-purple-600/80 mt-1">
              تعداد {globalPerformance.totalOrdersCount.toLocaleString()} سفارش در این بازه
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              وجوه وصولی و بیعانه‌های نقدی
            </div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
              {(globalPerformance.totalPaidAFN + globalPerformance.totalCollectedAFN).toLocaleString()}{' '}
              <span className="text-xs font-normal">AFN</span>
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">
              نرخ وصولی کل: {globalPerformance.collectionRate}%
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
              مانده مطالبات و معوقات فاکتورها
            </div>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">
              {globalPerformance.totalRemainingAFN.toLocaleString()}{' '}
              <span className="text-xs font-normal">AFN</span>
            </div>
            <div className="text-[11px] text-rose-600/80 mt-1">
              مبالغ قابل تسویه در آینده
            </div>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 p-4 rounded-2xl">
            <div className="text-xs font-bold text-sky-700 dark:text-sky-300">
              اقلام دارویی فروخته‌شده (خروجی)
            </div>
            <div className="text-2xl font-black text-sky-900 dark:text-sky-100 mt-1">
              {globalPerformance.totalSoldUnits.toLocaleString()}{' '}
              <span className="text-xs font-normal">عدد / بسته</span>
            </div>
            <div className="text-[11px] text-sky-600/80 mt-1">
              مجموع داروهای خارج شده از انبارها
            </div>
          </div>
        </div>

        {/* Store Performance Matrix */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <StoreIcon className="w-4 h-4 text-purple-600" />
              <span>ماتریس عملکرد تفکیکی فروشگاه‌ها در بازه {timeFilterLabels[timeFilter]}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {storePerformance.length} شرکت/داروخانه
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">فروشگاه</th>
                  <th className="py-2.5 px-3 font-semibold text-center">وضعیت اشتراک</th>
                  <th className="py-2.5 px-3 font-semibold text-center">ویزیتورها</th>
                  <th className="py-2.5 px-3 font-semibold text-center">سفارشات</th>
                  <th className="py-2.5 px-3 font-semibold text-center">داروی فروخته‌شده</th>
                  <th className="py-2.5 px-3 font-semibold text-center">مبلغ کل فروش (AFN)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">موجودی انبار</th>
                  <th className="py-2.5 px-3 font-semibold text-center">ارزش موجودی انبار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {storePerformance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      هیچ فروشگاهی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  storePerformance.map((item) => (
                    <tr key={item.store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xs">
                            {item.store.name.slice(0, 1)}
                          </div>
                          <div>
                            <div>{item.store.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {item.store.phone || item.store.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.store.subscription?.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.store.subscription?.status === 'trial'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {item.store.subscription?.status === 'active' ? 'اشتراک فعال' : item.store.subscription?.status === 'trial' ? 'مهلت تست' : 'منقضی'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.visitorsCount} نفر
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-purple-700 dark:text-purple-300">
                        {item.totalOrdersCount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.totalSoldUnits.toLocaleString()} عدد
                      </td>

                      <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white">
                        {item.totalRevenueAFN.toLocaleString()} AFN
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                        {item.inventoryUnits.toLocaleString()} قلم
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {item.inventoryValueAFN.toLocaleString()} AFN
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-purple-50/70 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-purple-900 dark:text-purple-200 font-black">
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
                    {globalPerformance.totalInventoryUnits.toLocaleString()} قلم
                  </td>
                  <td className="py-3 px-3 text-center font-black text-amber-700 dark:text-amber-300">
                    {globalPerformance.totalInventorySaleValueAFN.toLocaleString()} AFN
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. REAL INVENTORY INSPECTOR ACROSS ALL STORES */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5" />
                <span>رصدخانه موجودی انبار و کاتالوگ داروها</span>
              </span>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              لیست تفصیلی داروها، موجودی واقعی، قیمت خرید و قیمت فروش
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              امکان مشاهده کاتالوگ تمام شرکت‌ها یا تفکیک بر اساس یک فروشگاه خاص
            </p>
          </div>

          {/* Store Selector & Live Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="all">مجموع کل داروها (همه فروشگاه‌ها)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="relative w-48 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام دارو، برند، کد..."
                className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Real KPI Cards for Filtered Medicines */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-[11px] text-slate-500">تنوع اقلام یافت‌شده:</div>
            <div className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
              {filteredMedicines.length.toLocaleString()} قلم
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">کل موجودی فیزیکی:</div>
            <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5">
              {filteredMedicines.reduce((s, m) => s + (m.stock || 0), 0).toLocaleString()} عدد / بسته
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">ارزش موجودی بر اساس خرید:</div>
            <div className="text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5">
              {filteredMedicines.reduce((s, m) => s + (m.stock || 0) * (m.purchasePrice || 0), 0).toLocaleString()} AFN
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">ارزش کل موجودی بر اساس فروش:</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {filteredMedicines.reduce((s, m) => s + (m.stock || 0) * (m.salePrice || 0), 0).toLocaleString()} AFN
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
                  <th className="py-2.5 px-3 font-semibold">شکل و دوز</th>
                  <th className="py-2.5 px-3 font-semibold text-center">موجودی انبار</th>
                  <th className="py-2.5 px-3 font-semibold text-center">قیمت خرید (AFN)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">قیمت فروش (AFN)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">حاشیه سود</th>
                  <th className="py-2.5 px-3 font-semibold text-center">ارزش کل موجودی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      هیچ دارویی با مشخصات جستجو شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m, idx) => {
                    const store = stores.find((s) => s.id === m.storeId);
                    const lineValue = (m.stock || 0) * (m.salePrice || 0);
                    const profitPerUnit = (m.salePrice || 0) - (m.purchasePrice || 0);
                    const marginPercent = m.salePrice > 0 ? Math.round((profitPerUnit / m.salePrice) * 100) : 0;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>

                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {store?.name || m.storeId || 'نامشخص'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            {m.images && m.images.length > 0 && (
                              <img
                                src={m.images[0]}
                                alt={m.name}
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                              />
                            )}
                            <div>
                              <div>{m.name}</div>
                              {m.code && (
                                <div className="text-[10px] font-mono text-slate-400">کد: {m.code}</div>
                              )}
                            </div>
                          </div>
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
                                : m.stock <= 15
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {m.stock.toLocaleString()} {m.unit || 'عدد'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">
                          {(m.purchasePrice || 0).toLocaleString()} AFN
                        </td>

                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {(m.salePrice || 0).toLocaleString()} AFN
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[11px] font-bold font-mono ${marginPercent > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {marginPercent > 0 ? `+${marginPercent}٪` : '۰٪'}
                          </span>
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
