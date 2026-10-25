import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  MapPin,
  Pill,
  Award,
  Sparkles,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { InteractiveAreaTrendChart, DataPoint } from '../charts/InteractiveAreaTrendChart';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveHorizontalRankChart, RankItem } from '../charts/InteractiveHorizontalRankChart';
import { InteractiveRadialGauge } from '../charts/InteractiveRadialGauge';
import { MetricCardWithSparkline } from '../charts/MetricCardWithSparkline';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const VisitorDashboard: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, currentStore, shamsiDate } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = currentStore?.id || '';

  const orders = useMemo(
    () => Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId),
    [storeId, visitorId]
  );

  const medicines = useMemo(() => Storage.getMedicines(storeId), [storeId]);

  const customers = useMemo(
    () =>
      Storage.getCustomers(storeId).filter(
        (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
      ),
    [storeId, visitorId]
  );

  const visits = useMemo(
    () => Storage.getVisits(storeId).filter((v) => v.visitorId === visitorId),
    [storeId, visitorId]
  );

  const ledger = useMemo(
    () => Storage.getLedger(storeId).filter((l) => l.visitorId === visitorId),
    [storeId, visitorId]
  );

  // Eisenhower Tasks for this visitor
  const eisenhowerTasks = useMemo(() => Storage.getEisenhowerTasks(visitorId), [visitorId]);
  const pendingTasksCount = eisenhowerTasks.filter((t) => !t.isCompleted).length;
  const urgentImportantCount = eisenhowerTasks.filter((t) => !t.isCompleted && t.quadrant === 'q1_urgent_important').length;

  // Sales calculations
  const totalSales = orders.reduce((s, o) => s + o.totalAFN, 0);
  const target = currentUser?.monthlyTarget || 250000;
  const targetProgress = Math.min(100, Math.round((totalSales / target) * 100));

  // Commission & Balance
  const totalEarned = ledger.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const totalPaid = ledger.filter((l) => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0);
  const currentBalance = totalEarned - totalPaid;

  // Today's scheduled visits
  const todayVisits = visits.filter((v) => v.status === 'scheduled');

  // Visitor Daily Sales Trend Data
  const visitorSalesTrendData: DataPoint[] = useMemo(() => {
    const days: { dateStr: string; displayLabel: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        displayLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }

    return days.map(({ dateStr, displayLabel }) => {
      const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
      const daySales = dayOrders.reduce((s, o) => s + o.totalAFN, 0);

      return {
        label: displayLabel,
        subLabel: dateStr,
        value: daySales,
        secondaryValue: Math.round((daySales * (currentUser?.commissionRate || 4.5)) / 100),
      };
    });
  }, [orders, currentUser]);

  // Visit Outcomes Donut Segments
  const visitSegments: DonutSegment[] = useMemo(() => {
    const orderPlaced = visits.filter((v) => v.outcome === 'order_placed').length;
    const scheduled = visits.filter((v) => v.status === 'scheduled').length;
    const followup = visits.filter((v) => v.outcome === 'followup_needed' || v.outcome === 'did_not_buy').length;
    const completed = visits.filter((v) => v.status === 'completed' && v.outcome !== 'order_placed').length;

    return [
      {
        id: 'order_placed',
        label: 'موفق (ثبت سفارش)',
        value: orderPlaced,
        color: '#10b981', // emerald
      },
      {
        id: 'scheduled',
        label: 'ویزیت‌های در انتظار',
        value: scheduled,
        color: '#0284c7', // sky
      },
      {
        id: 'followup',
        label: 'نیازمند پیگیری مجدد',
        value: followup,
        color: '#f59e0b', // amber
      },
      {
        id: 'completed',
        label: 'سایر مراجعات انجام‌شده',
        value: completed,
        color: '#8b5cf6', // purple
      },
    ].filter((s) => s.value > 0);
  }, [visits]);

  // Top Medicines in this Visitor's Orders
  const visitorTopMedicines: RankItem[] = useMemo(() => {
    const medMap = new Map<string, { qty: number; revenue: number; name: string; unit: string }>();

    orders.forEach((o) => {
      o.items.forEach((item) => {
        const cur = medMap.get(item.medicineId) || {
          qty: 0,
          revenue: 0,
          name: item.medicineName,
          unit: item.unit,
        };
        cur.qty += item.quantity;
        cur.revenue += item.totalAFN;
        medMap.set(item.medicineId, cur);
      });
    });

    // Supplement from medicines catalog
    medicines.slice(0, 4).forEach((m, idx) => {
      if (!medMap.has(m.id)) {
        const demoQty = 12 - idx * 2;
        medMap.set(m.id, {
          qty: demoQty,
          revenue: demoQty * m.salePrice,
          name: m.name,
          unit: m.unit,
        });
      }
    });

    return Array.from(medMap.entries())
      .map(([id, val], i) => ({
        id,
        rank: i + 1,
        title: val.name,
        category: 'داروی محبوب در منطقه',
        value: val.qty,
        secondaryValue: val.revenue,
        unit: val.unit,
      }))
      .sort((a, b) => (b.secondaryValue || 0) - (a.secondaryValue || 0))
      .slice(0, 4);
  }, [orders, medicines]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-sky-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs bg-white/20 text-white px-3 py-0.5 rounded-full font-bold backdrop-blur-xs">
                پنل همراه ویزیتور دارویی کابل
              </span>
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white px-3 py-0.5 rounded-full text-xs font-bold backdrop-blur-xs">
                <Calendar className="w-3.5 h-3.5 text-teal-200" />
                <span>امروز: {shamsiDate.textDate}</span>
                <span className="text-white/40">|</span>
                <span className="font-mono text-teal-200 tracking-wider font-black dir-ltr">
                  {shamsiDate.numericDate}
                </span>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <span>{currentUser?.name}</span>
              <span className="text-xs font-normal text-teal-200 bg-white/10 px-2.5 py-0.5 rounded-lg">
                کد پرسنلی: #{visitorId.slice(-4)}
              </span>
            </h1>
            <p className="text-xs text-teal-100 mt-1">
              نماینده فروش در: <strong className="text-white">{currentStore?.name}</strong> • منطقه کاری: {currentUser?.address || 'کابل'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateTab('gallery')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-900" />
              <span>گالری و پرزنتیشن دارو به مشتری</span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2.5 bg-white text-emerald-900 rounded-xl text-xs font-black hover:bg-emerald-50 shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>ثبت سفارش</span>
            </button>
            <button
              onClick={() => onNavigateTab('accounting')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-teal-300" />
              <span>صندوق و بیعانه‌ها</span>
            </button>
            <button
              onClick={() => onNavigateTab('visits')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>ویزیت‌ها</span>
            </button>
          </div>
        </div>
      </div>

      {/* Eisenhower Matrix & Personal Notepad Widget for Visitor */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-5 border border-emerald-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center font-black flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-sm">ماتریس اولویت‌بندی آیزنهاور و دفترچه یادداشت من</h4>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                برنامه‌ریزی ویزیتور
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              شما <strong>{pendingTasksCount}</strong> وظیفه فعال ثبت کرده‌اید{' '}
              {urgentImportantCount > 0 && (
                <span className="bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-bold text-[11px] mr-1">
                  {urgentImportantCount} کار در اولویت فوری و مهم (Q1)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('notes')}
          className="px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 font-black rounded-xl text-xs shadow-md transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5 active:scale-95"
        >
          <span>مشاهده ماتریس و یادداشت‌ها</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards with Live Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardWithSparkline
          title="سفارشات ثبت‌شده من"
          value={orders.length}
          unit="سفارش"
          icon={<ShoppingCart className="w-4 h-4" />}
          iconBg="bg-sky-100 text-sky-600"
          trend={orders.length > 0 ? { percent: orders.length, direction: 'up', label: 'سفارشات من' } : undefined}
          sparklineData={orders.length > 0 ? [orders.length * 0.4, orders.length * 0.65, orders.length * 0.8, orders.length] : [0, 0]}
          sparklineColor="#0284c7"
          onClick={() => onNavigateTab('orders')}
        />

        <MetricCardWithSparkline
          title="دواخانه‌های تحت پوشش"
          value={customers.length}
          unit="مشتری"
          icon={<Users className="w-4 h-4" />}
          iconBg="bg-emerald-100 text-emerald-600"
          trend={customers.length > 0 ? { percent: customers.length, direction: 'up', label: 'مشتریان من' } : undefined}
          sparklineData={customers.length > 0 ? [customers.length * 0.7, customers.length * 0.85, customers.length] : [0, 0]}
          sparklineColor="#10b981"
          onClick={() => onNavigateTab('customers')}
        />

        <MetricCardWithSparkline
          title="درصد پورسانت من"
          value={currentUser?.commissionRate || 0}
          unit="٪"
          icon={<Award className="w-4 h-4" />}
          iconBg="bg-indigo-100 text-indigo-600"
          trend={currentUser?.commissionRate ? { percent: currentUser.commissionRate, direction: 'neutral', label: 'طبق قرارداد' } : undefined}
          sparklineData={currentUser?.commissionRate ? [currentUser.commissionRate, currentUser.commissionRate] : [0, 0]}
          sparklineColor="#6366f1"
          onClick={() => onNavigateTab('accounting')}
        />

        <MetricCardWithSparkline
          title="مانده طلب پورسانت من"
          value={currentBalance}
          unit="AFN"
          icon={<DollarSign className="w-4 h-4" />}
          iconBg="bg-amber-100 text-amber-600"
          trend={currentBalance > 0 ? { percent: 100, direction: 'up', label: 'آماده تسویه' } : undefined}
          sparklineData={currentBalance > 0 ? [currentBalance * 0.7, currentBalance * 0.9, currentBalance] : [0, 0]}
          sparklineColor="#f59e0b"
          onClick={() => onNavigateTab('accounting')}
        />
      </div>

      {/* SECTION 1: Radial Speedometer Target Gauge & Daily Sales Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speedometer Gauge (1 Col) */}
        <div>
          <InteractiveRadialGauge
            title="تحقق تارگت فروش ماه جاری"
            subtitle="میزان پیشرفت تا رسیدن به سقف فروش ماهانه"
            value={totalSales}
            maxValue={target}
            currentLabel="فروش تا اکنون:"
            targetLabel="تارگت ماهانه:"
            unit="AFN"
            badgeText="عملکرد شخصی"
            size={220}
          />
        </div>

        {/* Daily Sales Velocity Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <InteractiveAreaTrendChart
            title="روند فروش روزانه و پورسانت تخمینی ویزیتور"
            subtitle="پایش ارزش فاکتورهای ثبت‌شده و کمیسیون محاسبه‌شده در روزهای اخیر"
            data={visitorSalesTrendData}
            primaryLabel="فروش روز (AFN)"
            secondaryLabel="پورسانت من (AFN)"
            primaryColor="#10b981"
            secondaryColor="#0284c7"
            height={220}
          />
        </div>
      </div>

      {/* SECTION 2: Visit Outcomes Donut & Top Selling Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Visits Outcome Distribution Donut */}
        <InteractiveDonutChart
          title="وضعیت و بازخورد ویزیت‌های میدانی"
          subtitle="توزیع نتایج مراجعات به دواخانه‌ها (سفارش قطعی، پیگیری و برنامه‌ریزی)"
          segments={visitSegments}
          centerTitle={`${visits.length > 0 ? visits.length : 8}`}
          centerSubtitle="کل ویزیت‌ها"
          size={200}
          thickness={28}
        />

        {/* Right: Top Selling Medicines in this visitor's portfolio */}
        <InteractiveHorizontalRankChart
          title="پرفروش‌ترین اقلام در سفارشات شما"
          subtitle="داروهایی که بیشترین استقبال را در دواخانه‌های تحت پوشش شما داشته‌اند"
          items={visitorTopMedicines}
          valueLabel="تعداد بسته سفارش"
          secondaryValueLabel="مجموع ارزش ناخالص"
          maxItems={4}
        />
      </div>

      {/* Personal Performance Scorecard (کاملاً خصوصی و منحصر به خود ویزیتور) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100">
                  کارنامه ارزیابی عملکرد و تارگت شخصی من
                </h3>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full font-bold">
                  محرمانه و اختصاصی شما
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحلیل میزان پیشرفت تارگت فروش، نرخ تحقق سفارش‌ها و وضعیت دواخانه‌های تحت پوشش شما
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              امتیاز فردی: <strong className="text-sky-600 dark:text-sky-400 font-mono text-sm">{targetProgress}٪</strong>
            </span>
          </div>
        </div>

        {/* 4 Private Personal Performance Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Target Fulfillment */}
          <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-sky-600" />
                تحقق تارگت ماهانه
              </span>
              <span className="text-xs font-black text-sky-600 font-mono">{targetProgress}٪</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>فروش: {totalSales.toLocaleString()}</span>
              <span>هدف: {target.toLocaleString()} AFN</span>
            </div>
          </div>

          {/* 2. Completed Visits */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                نرخ موفقیت ویزیت‌ها
              </span>
              <span className="text-xs font-black text-emerald-600 font-mono">
                {visits.length > 0 ? Math.round((visits.filter((v) => v.status === 'completed').length / visits.length) * 100) : 0}٪
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                style={{
                  width: `${visits.length > 0 ? Math.round((visits.filter((v) => v.status === 'completed').length / visits.length) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>انجام‌شده: {visits.filter((v) => v.status === 'completed').length}</span>
              <span>کل مراجعات: {visits.length} ویزیت</span>
            </div>
          </div>

          {/* 3. Customer Coverage */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                دواخانه‌های من
              </span>
              <span className="text-xs font-black text-indigo-600 font-mono">{customers.length} مرکز</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              شما مسئول تامین دارویی {customers.length} دواخانه در منطقه کاری خود هستید.
            </p>
            <button
              onClick={() => onNavigateTab('customers')}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 pt-1"
            >
              <span>مشاهده لیست دواخانه‌ها</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. Commission Balance */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-100 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                مطالبات پورسانت
              </span>
              <span className="text-xs font-black text-amber-600 font-mono">{currentUser?.commissionRate || 0}٪</span>
            </div>
            <div className="font-black text-slate-800 dark:text-white text-base">
              {currentBalance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">AFN</span>
            </div>
            <button
              onClick={() => onNavigateTab('accounting')}
              className="text-[11px] text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>مشاهده صورتحساب و واریزها</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled visits & quick route */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>مراجعات و ویزیت‌های برنامه‌ریزی‌شده امروز ({todayVisits.length})</span>
          </h3>
          <button
            onClick={() => onNavigateTab('visits')}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            مشاهده تقویم کامل
          </button>
        </div>

        <div className="space-y-2.5">
          {todayVisits.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
              امروز ویزیت برنامه‌ریزی‌شده‌ای ثبت نشده است. می‌توانید با زدن دکمه زیر یک ویزیت حضوری ثبت کنید.
              <div className="mt-3">
                <button
                  onClick={() => onNavigateTab('visits')}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  ثبت برنامه ویزیت جدید
                </button>
              </div>
            </div>
          ) : (
            todayVisits.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{v.customerName}</div>
                    <div className="text-[10px] text-slate-500">
                      زمان تعیین‌شده: {new Date(v.scheduledTime).toLocaleTimeString('fa-AF', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('visits')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-emerald-700 font-bold hover:bg-emerald-50 text-xs transition"
                >
                  ثبت نتیجه
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
