import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { DollarSign, CheckCircle2, Calendar, TrendingUp, Sparkles, PieChart, FileText } from 'lucide-react';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveRadialGauge } from '../charts/InteractiveRadialGauge';
import { exportLedgerToPDF } from '../../utils/exportDocs';

export const VisitorCommission: React.FC = () => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = currentStore?.id || '';

  const ledger = useMemo(
    () => Storage.getLedger(storeId).filter((l) => l.visitorId === visitorId),
    [storeId, visitorId]
  );

  const totalEarned = ledger
    .filter((l) => l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  const totalPaid = ledger
    .filter((l) => l.amount < 0)
    .reduce((s, l) => s + Math.abs(l.amount), 0);

  const currentBalance = totalEarned - totalPaid;

  const commissionPortion = ledger
    .filter((l) => l.type === 'commission' && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  const salaryPortion = ledger
    .filter((l) => l.type === 'salary' && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  const segments: DonutSegment[] = useMemo(() => {
    return [
      {
        id: 'comm',
        label: 'پورسانت فروش',
        value: Math.max(commissionPortion, 1),
        color: '#0284c7',
        subText: `${commissionPortion.toLocaleString()} AFN`,
      },
      {
        id: 'salary',
        label: 'حقوق ثابت',
        value: Math.max(salaryPortion, 1),
        color: '#10b981',
        subText: `${salaryPortion.toLocaleString()} AFN`,
      },
      {
        id: 'balance',
        label: 'مانده طلب تسویه‌نشده',
        value: Math.max(currentBalance, 1),
        color: '#f59e0b',
        subText: `${currentBalance.toLocaleString()} AFN`,
      },
    ];
  }, [commissionPortion, salaryPortion, currentBalance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>حساب مالی و پورسانت من</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ریز تراکنش‌ها، مبالغ پورسانت محاسبه‌شده و تسویه‌های پرداختی توسط فروشگاه
          </p>
        </div>

        <button
          onClick={() => exportLedgerToPDF(ledger, currentUser?.name || 'ویزیتور', currentStore?.name || 'فروشگاه دارویی')}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
          title="دانلود فایل PDF صورت‌حساب"
        >
          <FileText className="w-4 h-4" />
          <span>دانلود PDF صورت‌حساب</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 mb-1">کل استحقاق (حقوق و پورسانت)</div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {totalEarned.toLocaleString()} <span className="text-xs font-normal">AFN</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 mb-1">کل مبالغ دریافتی من</div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {totalPaid.toLocaleString()} <span className="text-xs font-normal">AFN</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 mb-1">مانده طلب آماده تسویه</div>
          <div className="text-xl font-black text-amber-700 font-mono">
            {currentBalance.toLocaleString()} <span className="text-xs font-normal">AFN</span>
          </div>
        </div>
      </div>

      {/* Visual Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InteractiveRadialGauge
          title="نسبت تسویه و دریافت پورسانت"
          subtitle="درصد کل مبالغ دریافتی نسبت به مجموع کارکرد"
          value={totalEarned > 0 ? totalPaid : 0}
          maxValue={Math.max(totalEarned, 1)}
          currentLabel="دریافتی نقدی"
          targetLabel="کل استحقاق"
          unit="AFN"
          size={200}
          badgeText="شاخص تسویه"
        />

        <InteractiveDonutChart
          title="ترکیب درآمدهای پورسانتی و حقوق"
          subtitle="تفکیک سهم هر بخش از مطالبات کاری شما"
          segments={segments}
          centerTitle={`${totalEarned.toLocaleString()}`}
          centerSubtitle="کل درآمد AFN"
          size={210}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700">
          دفتر گردش حساب شخصی شما
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">تاریخ</th>
                <th className="p-3.5">شرح تراکنش</th>
                <th className="p-3.5">نوع رویداد</th>
                <th className="p-3.5">مبلغ بستانکار (+)</th>
                <th className="p-3.5">مبلغ بدهکار (-)</th>
                <th className="p-3.5">ثبت‌کننده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    تراکنشی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500">
                      {new Date(l.date).toLocaleDateString('fa-AF')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{l.title}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                        {l.type === 'commission'
                          ? 'پورسانت'
                          : l.type === 'salary'
                          ? 'حقوق'
                          : l.type === 'payout'
                          ? 'تسویه نقدی'
                          : 'مساعده'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-emerald-700">
                      {l.amount > 0 ? `+${l.amount.toLocaleString()} AFN` : '-'}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-700">
                      {l.amount < 0 ? `${Math.abs(l.amount).toLocaleString()} AFN` : '-'}
                    </td>
                    <td className="p-3.5 text-slate-500">{l.registeredBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
