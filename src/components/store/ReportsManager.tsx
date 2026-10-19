import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import {
  exportOrdersListToExcel,
  exportOrdersListToPDF,
  exportMedicinesToExcel,
  exportMedicinesToPDF,
  exportCustomersToExcel,
  exportCustomersToPDF,
} from '../../utils/exportDocs';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  AlertTriangle,
  Award,
  BarChart3,
  PieChart,
  Layers,
  Building,
} from 'lucide-react';
import { InteractiveAreaTrendChart, DataPoint } from '../charts/InteractiveAreaTrendChart';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveHorizontalRankChart, RankItem } from '../charts/InteractiveHorizontalRankChart';
import { InteractiveBarChart, BarDataPoint } from '../charts/InteractiveBarChart';
import { InteractiveRadialGauge } from '../charts/InteractiveRadialGauge';

export const ReportsManager: React.FC = () => {
  const { currentStore } = useApp();
  const storeId = currentStore?.id || '';

  const [activeTab, setActiveTab] = useState<'visual_bi' | 'tables_export'>('visual_bi');

  const orders = useMemo(() => Storage.getOrders(storeId), [storeId]);
  const medicines = useMemo(() => Storage.getMedicines(storeId), [storeId]);
  const customers = useMemo(() => Storage.getCustomers(storeId), [storeId]);
  const visitors = useMemo(
    () => Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor'),
    [storeId]
  );

  const totalSales = orders.reduce((s, o) => s + o.totalAFN, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paidAmountAFN, 0);
  const totalArrears = orders.reduce((s, o) => s + o.remainingAmountAFN, 0);

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  // Medicine Therapeutic Categories Distribution (Donut Chart)
  const categorySegments: DonutSegment[] = useMemo(() => {
    const catMap = new Map<string, number>();

    medicines.forEach((m) => {
      const cat = m.category || 'سایر اقلام دارویی';
      catMap.set(cat, (catMap.get(cat) || 0) + m.stock);
    });

    const palette = [
      '#0284c7', // Sky
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#f59e0b', // Amber
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#64748b', // Slate
    ];

    return Array.from(catMap.entries())
      .map(([label, value], i) => ({
        id: `cat_${i}`,
        label,
        value,
        color: palette[i % palette.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [medicines]);

  // Top Pharmacies Ranking
  const topPharmacies: RankItem[] = useMemo(() => {
    const custMap = new Map<string, { orders: number; amount: number; name: string; area: string }>();

    orders.forEach((o) => {
      const cur = custMap.get(o.customerId) || {
        orders: 0,
        amount: 0,
        name: o.customerName,
        area: 'کابل',
      };
      cur.orders += 1;
      cur.amount += o.totalAFN;
      custMap.set(o.customerId, cur);
    });

    // Supplement with existing customer records
    customers.forEach((c) => {
      if (!custMap.has(c.id)) {
        custMap.set(c.id, {
          orders: c.totalOrdersCount || 1,
          amount: c.totalOrderAmount || 15000,
          name: c.name,
          area: c.area || c.city || 'کابل',
        });
      }
    });

    return Array.from(custMap.entries())
      .map(([id, val], i) => ({
        id,
        rank: i + 1,
        title: val.name,
        subtitle: `منطقه: ${val.area}`,
        category: 'دواخانه طرف قرارداد',
        value: val.orders,
        secondaryValue: val.amount,
        unit: 'سفارش',
      }))
      .sort((a, b) => (b.secondaryValue || 0) - (a.secondaryValue || 0))
      .slice(0, 5);
  }, [orders, customers]);

  // Financial Breakdown Bar Chart (Sales, Paid, Arrears)
  const financialBars: BarDataPoint[] = useMemo(() => {
    return [
      {
        label: 'گردش کل فروش',
        value: totalSales,
        color: 'bg-gradient-to-t from-sky-600 to-sky-400',
      },
      {
        label: 'مبالغ وصولی نقدی',
        value: totalPaid,
        color: 'bg-gradient-to-t from-emerald-600 to-teal-400',
      },
      {
        label: 'مانده طلب (معوقات)',
        value: totalArrears,
        color: 'bg-gradient-to-t from-amber-500 to-amber-300',
      },
    ];
  }, [totalSales, totalPaid, totalArrears]);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>مرکز گزارش‌های هوش تجاری (BI) و خروجی‌های رسمی</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            نمودارهای تحلیلی، ارزیابی سودآوری ویزیتورها، توزیع دسته‌های دارویی و دریافت فایل‌های اکسل
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('visual_bi')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'visual_bi'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>نمودارهای تعاملی</span>
            </button>
            <button
              onClick={() => setActiveTab('tables_export')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tables_export'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>جداول و خروجی اکسل</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش (Print)</span>
          </button>
        </div>
      </div>

      {/* VISUAL BI CHARTS TAB */}
      {activeTab === 'visual_bi' && (
        <div className="space-y-6">
          {/* Grid of Interactive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Financial Health Bar Chart */}
            <InteractiveBarChart
              title="تراز مالی جامع: فروش در مقابل وصولی و مانده طلب"
              subtitle="تفکیک کل نقدینگی وصول‌شده نسبت به فاکتورهای تسویه‌نشده داروخانه‌ها"
              data={financialBars}
              valueLabel="مبلغ به افغانی"
              unit="AFN"
              height={240}
            />

            {/* Chart 2: Therapeutic Categories Share Donut */}
            <InteractiveDonutChart
              title="توزیع گروه‌های درمانی در انبار دارو"
              subtitle="سهم دسته‌بندی‌های مختلف دارویی از کل حجم موجودی بسته‌های انبار"
              segments={categorySegments}
              centerTitle={`${medicines.reduce((s, m) => s + m.stock, 0)}`}
              centerSubtitle="کل موجودی انبار"
              size={210}
              thickness={30}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Top Pharmacies Ranking */}
            <InteractiveHorizontalRankChart
              title="دواخانه‌ها و مشتریان برتر بر اساس سفارشات"
              subtitle="۵ داروخانه پرتقاضا با بیشترین حجم ثبت سفارش و همکاری مستمر با ویزیتورها"
              items={topPharmacies}
              valueLabel="تعداد سفارشات"
              secondaryValueLabel="گردش مالی فاکتورها"
              maxItems={5}
            />

            {/* Chart 4: Gauge: Successful Delivery Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InteractiveRadialGauge
                title="نرخ تحویل قطعی سفارشات"
                subtitle="سفارشات تحویل شده نسبت به کل درخواست‌ها"
                value={deliveredCount}
                maxValue={Math.max(orders.length, 1)}
                currentLabel="تحویل موفق:"
                targetLabel="کل سفارشات:"
                unit="سفارش"
                badgeText="لجستیک و توزیع"
                size={180}
              />

              <InteractiveRadialGauge
                title="نرخ تسویه مطالبات نقدی"
                subtitle="مبالغ دریافتی به کل ارزش فاکتورها"
                value={totalPaid}
                maxValue={Math.max(totalSales, 1)}
                currentLabel="وصولی قطعی:"
                targetLabel="مجموع فاکتور:"
                unit="AFN"
                badgeText="شاخص تسویه"
                size={180}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Export Cards (Always accessible) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">خروجی کامل سفارشات</h4>
            <p className="text-[11px] text-slate-500">شامل مبالغ وصولی و مانده</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOrdersListToExcel(orders, 'Comprehensive_Orders_Report')}
              className="flex-1 py-1.5 px-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition cursor-pointer text-center"
            >
              اکسل (XLSX)
            </button>
            <button
              onClick={() => exportOrdersListToPDF(orders, currentStore?.name || 'فروشگاه دارویی', 'Comprehensive_Orders_Report')}
              className="flex-1 py-1.5 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer text-center"
            >
              فایل PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">فهرست انبار داروها</h4>
            <p className="text-[11px] text-slate-500">موجودی، سری ساخت و انقضا</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportMedicinesToExcel(medicines)}
              className="flex-1 py-1.5 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition cursor-pointer text-center"
            >
              اکسل (XLSX)
            </button>
            <button
              onClick={() => exportMedicinesToPDF(medicines, currentStore?.name || 'فروشگاه دارویی')}
              className="flex-1 py-1.5 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer text-center"
            >
              فایل PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">فهرست دواخانه‌ها و مشتریان</h4>
            <p className="text-[11px] text-slate-500">شماره تماس، آدرس و مسئول</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCustomersToExcel(customers)}
              className="flex-1 py-1.5 px-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition cursor-pointer text-center"
            >
              اکسل (XLSX)
            </button>
            <button
              onClick={() => exportCustomersToPDF(customers, currentStore?.name || 'فروشگاه دارویی')}
              className="flex-1 py-1.5 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition cursor-pointer text-center"
            >
              فایل PDF
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Report Summary & Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-800">
              خلاصه عملکرد جامع {currentStore?.name}
            </h3>
            <span className="text-xs text-slate-500">
              تاریخ تهیه گزارش: {new Date().toLocaleDateString('fa-AF')}
            </span>
          </div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
            گزارش معتبر مدیریتی
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 mb-1">مجموع گردش فروش:</div>
            <div className="font-bold text-base text-slate-800 font-mono">
              {totalSales.toLocaleString()} AFN
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-emerald-700 mb-1">مجموع مطالبات وصول شده:</div>
            <div className="font-bold text-base text-emerald-800 font-mono">
              {totalPaid.toLocaleString()} AFN
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
            <div className="text-amber-700 mb-1">مانده مطالبات وصول نشده:</div>
            <div className="font-bold text-base text-amber-800 font-mono">
              {totalArrears.toLocaleString()} AFN
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 mb-1">نرخ تحویل موفق سفارشات:</div>
            <div className="font-bold text-base text-sky-800">
              {orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0}٪
            </div>
          </div>
        </div>

        {/* Visitor Contribution Table with Visual Progress Bars */}
        <div>
          <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>سهم و میزان تحقق تارگت ماهانه هر ویزیتور:</span>
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">نام ویزیتور</th>
                  <th className="p-3">تعداد سفارشات</th>
                  <th className="p-3">فروش تحقق‌یافته</th>
                  <th className="p-3">تارگت تعیین‌شده</th>
                  <th className="p-3">درصد تحقق</th>
                  <th className="p-3">نمایش بصری پیشرفت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map((v) => {
                  const vOrders = orders.filter((o) => o.visitorId === v.id);
                  const vTotal = vOrders.reduce((s, o) => s + o.totalAFN, 0);
                  const target = v.monthlyTarget || 200000;
                  const pct = Math.min(100, Math.round((vTotal / target) * 100));

                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{v.name}</td>
                      <td className="p-3 font-mono">{vOrders.length}</td>
                      <td className="p-3 font-bold text-sky-700 font-mono">
                        {vTotal.toLocaleString()} AFN
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {target.toLocaleString()} AFN
                      </td>
                      <td className="p-3 font-bold text-emerald-700">{pct}٪</td>
                      <td className="p-3 w-40">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
