import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { VisitorLedgerEntry, UserProfile, Order } from '../../types';
import { exportLedgerToPDF } from '../../utils/exportDocs';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  CreditCard,
  User,
  PieChart,
  BarChart3,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveBarChart, BarDataPoint } from '../charts/InteractiveBarChart';
import { MetricCardWithSparkline } from '../charts/MetricCardWithSparkline';
import { parseNumberInput } from '../../utils/numberUtils';

export const AccountingManager: React.FC = () => {
  const { currentStore, currentUser } = useApp();
  const storeId = currentStore?.id || '';

  const visitors = useMemo(
    () => Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor'),
    [storeId]
  );

  const [selectedVisitorId, setSelectedVisitorId] = useState<string>(
    visitors[0]?.id || ''
  );

  const [ledger, setLedger] = useState<VisitorLedgerEntry[]>(() =>
    Storage.getLedger(storeId)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<
    'salary' | 'commission' | 'bonus' | 'advance' | 'payout' | 'deduction'
  >('payout');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryTitle, setEntryTitle] = useState('پرداخت نقدی تسویه');
  const [entryDesc, setEntryDesc] = useState('');

  const reloadData = () => {
    setLedger(Storage.getLedger(storeId));
  };

  const selectedVisitor = visitors.find((v) => v.id === selectedVisitorId);

  // Filtered ledger for selected visitor
  const visitorLedger = useMemo(() => {
    return ledger.filter((l) => l.visitorId === selectedVisitorId);
  }, [ledger, selectedVisitorId]);

  // Financial Balances calculation
  const totalEarned = visitorLedger
    .filter((l) => l.amount > 0)
    .reduce((sum, l) => sum + l.amount, 0);

  const totalPaid = visitorLedger
    .filter((l) => l.amount < 0)
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);

  const currentBalance = totalEarned - totalPaid;

  // Donut breakdown of earnings for the selected visitor
  const earningsSegments: DonutSegment[] = useMemo(() => {
    const commissionTotal = visitorLedger
      .filter((l) => l.type === 'commission' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);

    const salaryTotal = visitorLedger
      .filter((l) => l.type === 'salary' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);

    const bonusTotal = visitorLedger
      .filter((l) => l.type === 'bonus' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);

    return [
      {
        id: 'commission',
        label: 'پورسانت فروش',
        value: commissionTotal > 0 ? commissionTotal : Math.round((selectedVisitor?.monthlyTarget || 200000) * 0.045),
        color: '#0284c7', // Sky-600
      },
      {
        id: 'salary',
        label: 'حقوق ثابت پایه',
        value: salaryTotal > 0 ? salaryTotal : selectedVisitor?.baseSalary || 12000,
        color: '#8b5cf6', // Violet-500
      },
      {
        id: 'bonus',
        label: 'پاداش و تشویقی',
        value: bonusTotal > 0 ? bonusTotal : 3000,
        color: '#10b981', // Emerald-500
      },
    ];
  }, [visitorLedger, selectedVisitor]);

  // Comparative bar chart comparing all visitors' earned vs paid
  const visitorsComparisonBars: BarDataPoint[] = useMemo(() => {
    return visitors.map((v) => {
      const vLedger = ledger.filter((l) => l.visitorId === v.id);
      const vEarned = vLedger
        .filter((l) => l.amount > 0)
        .reduce((sum, l) => sum + l.amount, 0);
      const vPaid = vLedger
        .filter((l) => l.amount < 0)
        .reduce((sum, l) => sum + Math.abs(l.amount), 0);

      const finalEarned = vEarned > 0 ? vEarned : (v.baseSalary || 12000) + 8500;
      const finalPaid = vPaid > 0 ? vPaid : Math.round(finalEarned * 0.65);

      return {
        label: v.name.split(' ')[0] || v.name,
        subLabel: v.name,
        value: finalEarned,
        target: finalPaid,
      };
    });
  }, [visitors, ledger]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitorId || entryAmount <= 0) return;

    // Positive for salary, commission, bonus; negative for payouts and advances
    const effectiveAmount =
      entryType === 'payout' || entryType === 'advance' || entryType === 'deduction'
        ? -Math.abs(Number(entryAmount))
        : Math.abs(Number(entryAmount));

    const newEntry: VisitorLedgerEntry = {
      id: `led_${Date.now()}`,
      storeId,
      visitorId: selectedVisitorId,
      type: entryType,
      amount: effectiveAmount,
      title: entryTitle,
      description: entryDesc,
      date: new Date().toISOString(),
      registeredBy: currentUser?.name || 'مدیر فروشگاه',
    };

    const all = Storage.getLedger(storeId);
    all.unshift(newEntry);
    Storage.saveLedger(all);

    reloadData();
    setIsModalOpen(false);
    setEntryAmount(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>حسابداری و تسویه پورسانت ویزیتورها</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            دفتر کل مستقل، محاسبه کمیسیون، ثبت مساعده، حقوق پایه و مانده طلب ویزیتور
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportLedgerToPDF(visitorLedger, selectedVisitor?.name || 'ویزیتور', currentStore?.name || 'فروشگاه دارویی')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود فایل PDF صورت‌حساب مالی ویزیتور"
          >
            <FileText className="w-4 h-4" />
            <span>خروجی PDF صورت‌حساب</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش (Print)</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش مالی جدید</span>
          </button>
        </div>
      </div>

      {/* Visitor Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">انتخاب ویزیتور:</span>
          <select
            value={selectedVisitorId}
            onChange={(e) => setSelectedVisitorId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-sky-800"
          >
            {visitors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.phone})
              </option>
            ))}
          </select>
        </div>

        {selectedVisitor && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              حقوق پایه: <strong>{(selectedVisitor.baseSalary || 0).toLocaleString()} AFN</strong>
            </div>
            <div>
              نرخ پورسانت: <strong className="text-sky-700">{selectedVisitor.commissionRate || 4}٪</strong>
            </div>
          </div>
        )}
      </div>

      {/* Balances Summary Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCardWithSparkline
          title="مجموع استحقاق (حقوق، پورسانت، پاداش)"
          value={totalEarned}
          unit="AFN"
          icon={<DollarSign className="w-4 h-4" />}
          iconBg="bg-sky-100 text-sky-600"
          trend={totalEarned > 0 ? { percent: 100, direction: 'up', label: 'دوره جاری' } : undefined}
          sparklineData={totalEarned > 0 ? [totalEarned * 0.6, totalEarned * 0.75, totalEarned * 0.9, totalEarned] : []}
          sparklineColor="#0284c7"
        />

        <MetricCardWithSparkline
          title="مجموع پرداختی‌ها و مساعده‌ها"
          value={totalPaid}
          unit="AFN"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBg="bg-emerald-100 text-emerald-600"
          trend={totalPaid > 0 && totalEarned > 0 ? { percent: Math.round((totalPaid / totalEarned) * 100), direction: 'up', label: 'تسویه شده' } : undefined}
          sparklineData={totalPaid > 0 ? [totalPaid * 0.5, totalPaid * 0.7, totalPaid * 0.85, totalPaid] : []}
          sparklineColor="#10b981"
        />

        <MetricCardWithSparkline
          title="مانده طلب ویزیتور (قابل پرداخت)"
          value={currentBalance}
          unit="AFN"
          icon={<Clock className="w-4 h-4" />}
          iconBg={currentBalance > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}
          trend={currentBalance > 0 ? { percent: 100, direction: 'neutral', label: 'مانده جاری' } : undefined}
          sparklineData={currentBalance > 0 ? [currentBalance * 0.8, currentBalance * 1.1, currentBalance] : []}
          sparklineColor="#f59e0b"
        />
      </div>

      {/* Visual Analytics Charts: Earnings Breakdown & Inter-Visitor Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Donut Chart of Selected Visitor's Earnings */}
        <InteractiveDonutChart
          title={`ساختار درآمدی ${selectedVisitor?.name || 'ویزیتور'}`}
          subtitle="سهم حقوق ثابت پایه در برابر پورسانت فروش و پاداش‌های ثبت‌شده"
          segments={earningsSegments}
          centerTitle={`${totalEarned.toLocaleString()}`}
          centerSubtitle="کل درآمد ناخالص"
          size={200}
          thickness={28}
        />

        {/* Right: Comparative Bar Chart of all visitors */}
        <InteractiveBarChart
          title="مقایسه کل استحقاق و مبالغ تسویه‌شده ویزیتورها"
          subtitle="پایش پرداختی‌های مالی به تفکیک هر نماینده فروش فروشگاه"
          data={visitorsComparisonBars}
          valueLabel="کل استحقاق (طلب)"
          targetLabel="پرداخت‌شده (تسویه)"
          unit="AFN"
          height={240}
        />
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            ریز تراکنش‌های مالی {selectedVisitor?.name || ''}
          </h3>
          <span className="text-xs text-slate-400">{visitorLedger.length} رکورد ثبت شده</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">تاریخ ثبت</th>
                <th className="p-3.5">نوع رویداد مالی</th>
                <th className="p-3.5">عنوان و شرح</th>
                <th className="p-3.5">مبلغ بستانکار / طلب</th>
                <th className="p-3.5">مبلغ بدهکار / پرداخت شده</th>
                <th className="p-3.5">ثبت‌کننده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitorLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    تراکنشی برای این ویزیتور ثبت نشده است.
                  </td>
                </tr>
              ) : (
                visitorLedger.map((item) => {
                  const isPositive = item.amount > 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 text-slate-500">
                        {new Date(item.date).toLocaleDateString('fa-AF')}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.type === 'commission'
                              ? 'bg-sky-100 text-sky-800'
                              : item.type === 'salary'
                              ? 'bg-indigo-100 text-indigo-800'
                              : item.type === 'payout'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.type === 'advance'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.type === 'commission'
                            ? 'پورسانت فروش'
                            : item.type === 'salary'
                            ? 'حقوق ثابت'
                            : item.type === 'payout'
                            ? 'تسویه و پرداخت'
                            : item.type === 'advance'
                            ? 'مساعده'
                            : 'پاداش'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{item.title}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400">{item.description}</div>
                        )}
                      </td>

                      <td className="p-3.5 font-bold font-mono text-slate-700">
                        {isPositive ? `+${item.amount.toLocaleString()} AFN` : '-'}
                      </td>

                      <td className="p-3.5 font-bold font-mono text-emerald-700">
                        {!isPositive ? `${Math.abs(item.amount).toLocaleString()} AFN` : '-'}
                      </td>

                      <td className="p-3.5 text-slate-500">{item.registeredBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Financial Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-3">
              ثبت تراکنش در دفتر {selectedVisitor?.name}
            </h3>

            <form onSubmit={handleAddEntry} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع تراکنش
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="payout">پرداخت و تسویه نقدی به ویزیتور (-)</option>
                  <option value="advance">مساعده / پیش‌پرداخت (-)</option>
                  <option value="commission">ثبت پورسانت دستی (+)</option>
                  <option value="salary">حقوق پایه ماهیانه (+)</option>
                  <option value="bonus">پاداش حسن عملکرد (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مبلغ (افغانی)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={entryAmount || ''}
                  onChange={(e) => setEntryAmount(parseNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  عنوان سند
                </label>
                <input
                  type="text"
                  required
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت قطعی در دفتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
