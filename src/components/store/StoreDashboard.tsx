import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Users,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Truck,
  Building,
  Calendar,
  Sparkles,
  BarChart3,
  PieChart,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { InteractiveAreaTrendChart, DataPoint } from '../charts/InteractiveAreaTrendChart';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveHorizontalRankChart, RankItem } from '../charts/InteractiveHorizontalRankChart';
import { InteractiveBarChart, BarDataPoint } from '../charts/InteractiveBarChart';
import { InteractiveRadialGauge } from '../charts/InteractiveRadialGauge';
import { MetricCardWithSparkline } from '../charts/MetricCardWithSparkline';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const StoreDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentStore, trialDaysRemaining, shamsiDate, currentUser } = useApp();

  const storeId = currentStore?.id || '';

  // Eisenhower Matrix Tasks for the logged-in user
  const eisenhowerTasks = useMemo(() => Storage.getEisenhowerTasks(currentUser?.id), [currentUser?.id]);
  const pendingTasksCount = eisenhowerTasks.filter((t) => !t.isCompleted).length;
  const urgentImportantCount = eisenhowerTasks.filter((t) => !t.isCompleted && t.quadrant === 'q1_urgent_important').length;

  // Real data calculations
  const orders = useMemo(() => Storage.getOrders(storeId), [storeId]);
  const medicines = useMemo(() => Storage.getMedicines(storeId), [storeId]);
  const customers = useMemo(() => Storage.getCustomers(storeId), [storeId]);
  const profiles = useMemo(
    () => Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor'),
    [storeId]
  );
  const visits = useMemo(() => Storage.getVisits(storeId), [storeId]);

  // Financial KPIs
  const totalSales = orders.reduce((sum, o) => sum + o.totalAFN, 0);
  const totalCollected = orders.reduce((sum, o) => sum + o.paidAmountAFN, 0);
  const totalUncollected = orders.reduce((sum, o) => sum + o.remainingAmountAFN, 0);

  // Today's orders
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAFN, 0);

  // Status counts
  const pendingOrders = orders.filter((o) => o.status === 'pending_review' || o.status === 'submitted');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const shippedOrders = orders.filter((o) => o.status === 'shipped');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled' || o.status === 'returned');

  // Low stock and Near Expiry
  const lowStockMeds = medicines.filter((m) => m.stock <= m.minStockAlert);
  const nowMs = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const nearExpiryMeds = medicines.filter((m) => {
    const exp = new Date(m.expiryDate).getTime();
    return exp - nowMs <= ninetyDaysMs && exp >= nowMs;
  });

  // Calculate Sales Trend Data Points (Daily / Historical)
  const salesTrendData: DataPoint[] = useMemo(() => {
    // Generate dates for the last 10 days
    const days: { dateStr: string; displayLabel: string }[] = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const displayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      days.push({ dateStr, displayLabel });
    }

    // Map each day with actual orders
    return days.map(({ dateStr, displayLabel }) => {
      const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
      const daySales = dayOrders.reduce((s, o) => s + o.totalAFN, 0);
      const dayCollected = dayOrders.reduce((s, o) => s + o.paidAmountAFN, 0);

      return {
        label: displayLabel,
        subLabel: dateStr,
        value: daySales,
        secondaryValue: dayCollected,
      };
    });
  }, [orders]);

  // Order Status Donut Segments
  const orderStatusSegments: DonutSegment[] = useMemo(() => {
    return [
      {
        id: 'delivered',
        label: 'تحویل نهایی شده',
        value: deliveredOrders.length,
        color: '#10b981', // emerald-500
      },
      {
        id: 'shipped',
        label: 'ارسال شده (در مسیر)',
        value: shippedOrders.length,
        color: '#8b5cf6', // purple-500
      },
      {
        id: 'preparing',
        label: 'در حال آماده‌سازی',
        value: preparingOrders.length,
        color: '#0284c7', // sky-600
      },
      {
        id: 'pending',
        label: 'در انتظار تأیید',
        value: pendingOrders.length,
        color: '#f59e0b', // amber-500
      },
      {
        id: 'cancelled',
        label: 'لغو / مرجوع',
        value: cancelledOrders.length,
        color: '#f43f5e', // rose-500
      },
    ].filter((s) => s.value > 0);
  }, [deliveredOrders, shippedOrders, preparingOrders, pendingOrders, cancelledOrders]);

  // Top Selling Medicines Ranking
  const topSellingMedicines: RankItem[] = useMemo(() => {
    const medSalesMap = new Map<string, { qty: number; revenue: number; name: string; unit: string; category: string }>();

    // Scan order items
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const current = medSalesMap.get(item.medicineId) || {
          qty: 0,
          revenue: 0,
          name: item.medicineName,
          unit: item.unit,
          category: 'دارویی',
        };
        current.qty += item.quantity;
        current.revenue += item.totalAFN;
        medSalesMap.set(item.medicineId, current);
      });
    });

    const sorted = Array.from(medSalesMap.entries())
      .map(([id, val], i) => ({
        id,
        rank: i + 1,
        title: val.name,
        category: val.category,
        value: val.qty,
        secondaryValue: val.revenue,
        unit: val.unit,
      }))
      .sort((a, b) => (b.secondaryValue || 0) - (a.secondaryValue || 0));

    return sorted.slice(0, 5);
  }, [orders]);

  // Visitor Performance vs Target Bar Chart Data
  const visitorBarData: BarDataPoint[] = useMemo(() => {
    return profiles.map((v) => {
      const vOrders = orders.filter((o) => o.visitorId === v.id);
      const vTotal = vOrders.reduce((sum, o) => sum + o.totalAFN, 0);
      const target = v.monthlyTarget || 250000;
      return {
        label: v.name.split(' ')[0] || v.name,
        subLabel: v.phone,
        value: vTotal,
        target,
      };
    });
  }, [profiles, orders]);

  // Cash collection efficiency percentage
  const collectionRate = totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs bg-white/20 text-white px-3 py-0.5 rounded-full font-bold backdrop-blur-xs">
                سامانه هوشمند هوش تجاری و مدیریت عمده‌فروشی
              </span>
              {currentStore?.subscription?.status === 'active' && currentStore?.subscription?.planName !== '14-Day Trial' ? (
                <span className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>اشتراک فعال: {currentStore?.subscription?.planName}</span>
                  <span className="bg-emerald-600/80 px-2 py-0.5 rounded-full text-[11px] font-mono">
                    {trialDaysRemaining} روز اعتبار
                  </span>
                </span>
              ) : currentStore?.subscription?.status === 'trial' || currentStore?.subscription?.planName === '14-Day Trial' ? (
                <span className="text-xs bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full font-black">
                  مهلت تست رایگان: {trialDaysRemaining} روز
                </span>
              ) : (
                <span className="text-xs bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                  اشتراک منقضی شده
                </span>
              )}
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white px-3 py-0.5 rounded-full text-xs font-bold backdrop-blur-xs">
                <Calendar className="w-3.5 h-3.5 text-sky-200" />
                <span>امروز: {shamsiDate.textDate}</span>
                <span className="text-white/40">|</span>
                <span className="font-mono text-sky-200 tracking-wider font-black dir-ltr">
                  {shamsiDate.numericDate}
                </span>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <span>{currentStore?.name}</span>
            </h1>
            <p className="text-xs text-sky-200 mt-1 max-w-xl">
              داشبورد پایش لحظه‌ای فروش دارویی، جریان وصولی نقدی، ارزیابی تحقق تارگت ویزیتورها و هشدارهای انبار
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateTab('reports')}
              className="px-4 py-2.5 bg-sky-600/40 hover:bg-white/20 border border-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-sky-300" />
              <span>گزارشات و نمودارهای تکمیلی</span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2.5 bg-white text-sky-900 rounded-xl text-xs font-black hover:bg-sky-50 shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <span>سفارش‌ها ({orders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Mobile Navigation Grid (میانبرهای سریع دسترسی به بخش‌های اصلی) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              دسترسی سریع و میانبر بخش‌های پنل
            </span>
          </div>
          <span className="text-[11px] text-slate-400">یک لمس تا بخش مورد نظر</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {/* 1. داروها و موجودی انبار */}
          <button
            type="button"
            onClick={() => onNavigateTab('medicines')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-100 dark:border-sky-900/50 text-right transition cursor-pointer active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-sky-600/30 group-hover:scale-105 transition">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">داروها و موجودی</div>
              <div className="text-[10px] text-sky-700 dark:text-sky-300 font-bold">{medicines.length} قلم دارو</div>
            </div>
          </button>

          {/* 2. ویزیتورها */}
          <button
            type="button"
            onClick={() => onNavigateTab('visitors')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/50 text-right transition cursor-pointer active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">ویزیتورها</div>
              <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">{profiles.length} نفر رسمی</div>
            </div>
          </button>

          {/* 3. حسابداری و پورسانت */}
          <button
            type="button"
            onClick={() => onNavigateTab('accounting')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-100 dark:border-emerald-900/50 text-right transition cursor-pointer active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">حسابداری</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">تسویه و کمیسیون</div>
            </div>
          </button>

          {/* 4. سفارش‌ها */}
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-100 dark:border-amber-900/50 text-right transition cursor-pointer active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-600/30 group-hover:scale-105 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">سفارش‌ها</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">{orders.length} فاکتور</div>
            </div>
          </button>

          {/* 5. گزارشات و آمار مالی */}
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-100 dark:border-purple-900/50 text-right transition cursor-pointer active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-purple-600/30 group-hover:scale-105 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">گزارشات مالی</div>
              <div className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">نمودار و تحلیل</div>
            </div>
          </button>

          {/* 6. مشتریان و دواخانه‌ها */}
          <button
            type="button"
            onClick={() => onNavigateTab('customers')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-teal-50/70 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-100 dark:border-teal-900/50 text-right transition cursor-pointer active:scale-95 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-600/30 group-hover:scale-105 transition">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">داروخانه‌ها</div>
              <div className="text-[10px] text-teal-700 dark:text-teal-300 font-bold">{customers.length} مرکز فعال</div>
            </div>
          </button>
        </div>
      </div>

      {/* Eisenhower Matrix & Personal Notes Widget */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 border border-purple-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center font-black flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-sm">ماتریس اولویت‌بندی آیزنهاور و یادداشت‌های شخصی</h4>
              <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full font-bold">
                برنامه‌ریزی کارها
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              شما دارای <strong>{pendingTasksCount}</strong> کار ثبت‌شده در دست اقدام هستید{' '}
              {urgentImportantCount > 0 && (
                <span className="bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-bold text-[11px] mr-1">
                  {urgentImportantCount} کار فوری و مهم (Q1)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('notes')}
          className="px-4 py-2.5 bg-white text-purple-950 hover:bg-purple-50 font-black rounded-xl text-xs shadow-md transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5 active:scale-95"
        >
          <span>ورود به ماتریس و دفترچه یادداشت</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main KPI Cards with Interactive Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardWithSparkline
          title="مجموع گردش فروش ثبت‌شده"
          value={totalSales}
          unit="AFN"
          icon={<TrendingUp className="w-4 h-4" />}
          iconBg="bg-sky-100 text-sky-600"
          trend={totalSales > 0 && todaySales > 0 ? { percent: Math.round((todaySales / totalSales) * 100), direction: 'up', label: 'سهم فروش امروز' } : undefined}
          sparklineData={totalSales > 0 ? [totalSales * 0.6, totalSales * 0.72, totalSales * 0.68, totalSales * 0.85, totalSales * 0.92, totalSales] : []}
          sparklineColor="#0284c7"
          onClick={() => onNavigateTab('orders')}
        />

        <MetricCardWithSparkline
          title="مبالغ وصول‌شده نقدی"
          value={totalCollected}
          unit="AFN"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBg="bg-emerald-100 text-emerald-600"
          trend={totalSales > 0 && totalCollected > 0 ? { percent: collectionRate, direction: 'up', label: 'درصد تسویه نقدی' } : undefined}
          sparklineData={totalCollected > 0 ? [totalCollected * 0.5, totalCollected * 0.65, totalCollected * 0.75, totalCollected * 0.88, totalCollected] : []}
          sparklineColor="#10b981"
          onClick={() => onNavigateTab('accounting')}
        />

        <MetricCardWithSparkline
          title="مانده طلب ویزیتورها"
          value={totalUncollected}
          unit="AFN"
          icon={<Clock className="w-4 h-4" />}
          iconBg="bg-amber-100 text-amber-600"
          trend={totalSales > 0 && totalUncollected > 0 ? { percent: 100 - collectionRate, direction: 'down', label: 'درصد معوقه' } : undefined}
          sparklineData={totalUncollected > 0 ? [totalUncollected * 1.2, totalUncollected * 1.15, totalUncollected * 1.05, totalUncollected] : []}
          sparklineColor="#f59e0b"
          onClick={() => onNavigateTab('accounting')}
        />

        <MetricCardWithSparkline
          title="کل سفارشات دارویی"
          value={orders.length}
          unit="سفارش"
          icon={<ShoppingCart className="w-4 h-4" />}
          iconBg="bg-indigo-100 text-indigo-600"
          trend={orders.length > 0 && todayOrders.length > 0 ? { percent: todayOrders.length, direction: 'up', label: 'سفارش امروز' } : undefined}
          sparklineData={orders.length > 0 ? [orders.length * 0.4, orders.length * 0.6, orders.length * 0.8, orders.length] : []}
          sparklineColor="#6366f1"
          onClick={() => onNavigateTab('orders')}
        />
      </div>

      {/* SECTION 1: Dynamic Sales & Cash Collection Trend Chart */}
      <InteractiveAreaTrendChart
        title="نمودار تحلیل روند فروش دارویی و وصولی نقدی"
        subtitle="بررسی جریان فروش کل در برابر دریافتی‌های قطعی جهت مدیریت هوشمند نقدینگی فروشگاه"
        data={salesTrendData}
        primaryLabel="فروش کل (AFN)"
        secondaryLabel="وصولی نقدی (AFN)"
        primaryColor="#0284c7"
        secondaryColor="#10b981"
        height={260}
      />

      {/* SECTION 2: Two Interactive Visual Charts Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pipeline Donut Chart */}
        <InteractiveDonutChart
          title="تفکیک وضعیت چرخه پردازش سفارشات"
          subtitle="توزیع سفارشات در صف تأیید، بسته‌بندی انبار، ارسال و تحویل قطعی به دواخانه‌ها"
          segments={orderStatusSegments}
          centerTitle={`${orders.length}`}
          centerSubtitle="کل سفارشات"
          size={210}
          thickness={30}
        />

        {/* Right: Top 5 Best-Selling Medicines Rank Chart */}
        <InteractiveHorizontalRankChart
          title="پرفروش‌ترین داروهای سبد انبار"
          subtitle="رتبه‌بندی اقلام پرتقاضا بر اساس تعداد بسته و مجموع ارزش ناخالص فروش"
          items={topSellingMedicines}
          valueLabel="تعداد بسته فروخته‌شده"
          secondaryValueLabel="مجموع ارزش فروش"
          maxItems={5}
        />
      </div>

      {/* SECTION 3: Visitor Performance Bar Chart & Radial Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Sales vs Monthly Target Comparative Bar Chart (Spans 2 cols) */}
        <div className="lg:col-span-2">
          <InteractiveBarChart
            title="مقایسه عملکرد فروش ویزیتورها با تارگت ماهانه"
            subtitle="میزان تحقق هدف فروش تعیین‌شده برای هر ویزیتور فعال در حوزه کابل"
            data={visitorBarData}
            valueLabel="فروش محقق‌شده"
            targetLabel="تارگت تعیین‌شده"
            unit="AFN"
            height={260}
          />
        </div>

        {/* Radial Speedometer Gauge: Cash Collection Rate */}
        <div>
          <InteractiveRadialGauge
            title="نرخ سلامت وصول مطالبات"
            subtitle="نسبت کل وجوه تسویه‌شده به مجموع کل فاکتورهای صادرشده"
            value={totalCollected}
            maxValue={Math.max(totalSales, 1)}
            currentLabel="مجموع وصولی:"
            targetLabel="کل فروش:"
            unit="AFN"
            badgeText="شاخص سلامت مالی"
            size={210}
          />
        </div>
      </div>

      {/* Order Status Action Pipeline Pills */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>پایپ‌لاین عملیاتی پردازش و تحویل دارو:</span>
          </h3>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-sky-600 hover:underline font-bold"
          >
            مشاهده جزییات سفارشات
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 rounded-2xl text-center cursor-pointer transition"
          >
            <div className="text-xs text-amber-800 font-bold">در انتظار تأیید</div>
            <div className="text-xl font-black text-amber-900 mt-1">{pendingOrders.length}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">نیازمند بررسی مدیر</div>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 rounded-2xl text-center cursor-pointer transition"
          >
            <div className="text-xs text-blue-800 font-bold">در حال آماده‌سازی</div>
            <div className="text-xl font-black text-blue-900 mt-1">{preparingOrders.length}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">بسته‌بندی در انبار</div>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/60 rounded-2xl text-center cursor-pointer transition"
          >
            <div className="text-xs text-purple-800 font-bold">ارسال شده (در مسیر)</div>
            <div className="text-xl font-black text-purple-900 mt-1">{shippedOrders.length}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">تحویل به راننده/پیک</div>
          </div>
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-2xl text-center cursor-pointer transition"
          >
            <div className="text-xs text-emerald-800 font-bold">تحویل نهایی شده</div>
            <div className="text-xl font-black text-emerald-900 mt-1">{deliveredOrders.length}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">رسید امضاشده دواخانه</div>
          </div>
        </div>
      </div>

      {/* Critical Stock & Expiry Alerts */}
      {(lowStockMeds.length > 0 || nearExpiryMeds.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Low Stock Alert */}
          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4.5 shadow-xs">
            <div className="flex items-center justify-between text-rose-800 font-bold text-xs mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>هشدار کسری موجودی انبار ({lowStockMeds.length} قلم دارو)</span>
              </div>
              <button
                onClick={() => onNavigateTab('medicines')}
                className="text-rose-700 hover:underline text-[11px]"
              >
                انبار داروها
              </button>
            </div>
            <div className="space-y-2">
              {lowStockMeds.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-2.5 rounded-xl border border-rose-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">کد: {m.code}</div>
                  </div>
                  <div className="text-left">
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                      موجودی: {m.stock} {m.unit}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      حداقل هشدار: {m.minStockAlert}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Near Expiry Alert */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4.5 shadow-xs">
            <div className="flex items-center justify-between text-amber-800 font-bold text-xs mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>داروهای نزدیک تاریخ انقضا ({nearExpiryMeds.length} قلم دارو)</span>
              </div>
              <button
                onClick={() => onNavigateTab('medicines')}
                className="text-amber-700 hover:underline text-[11px]"
              >
                بررسی تاریخ‌ها
              </button>
            </div>
            <div className="space-y-2">
              {nearExpiryMeds.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-2.5 rounded-xl border border-amber-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-500">سری: {m.batchNumber}</div>
                  </div>
                  <div className="text-left">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      انقضا: {m.expiryDate}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">موجودی: {m.stock} {m.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
