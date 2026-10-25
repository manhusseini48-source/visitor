import React, { useMemo } from 'react';
import { Storage } from '../../utils/storage';
import { UserProfile, Order, Customer, VisitRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Trophy,
  Award,
  Medal,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Target,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  storeId: string;
  currentUserId?: string;
}

export const VisitorLeaderboard: React.FC<Props> = ({ storeId, currentUserId }) => {
  const { currentUser } = useApp();

  // Strict Security: The Leaderboard and Podium is strictly for store owners/management, NOT visitors!
  if (currentUser?.role === 'visitor') {
    return null;
  }

  const visitors = useMemo(
    () => Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor'),
    [storeId]
  );

  const orders = useMemo(() => Storage.getOrders(storeId), [storeId]);
  const customers = useMemo(() => Storage.getCustomers(storeId), [storeId]);
  const visits = useMemo(() => Storage.getVisits(storeId), [storeId]);

  // Compute metrics per visitor
  const leaderboardData = useMemo(() => {
    return visitors
      .map((vis) => {
        const visOrders = orders.filter((o) => o.visitorId === vis.id);
        const deliveredOrders = visOrders.filter(
          (o) => o.status === 'delivered' || o.status === 'approved' || o.status === 'shipped'
        );
        const totalSalesAFN = deliveredOrders.reduce((sum, o) => sum + o.totalAFN, 0);

        const targetAFN = vis.monthlyTarget || 100000;
        const targetPercent = Math.min(100, Math.round((totalSalesAFN / targetAFN) * 100));

        const activeCustomersCount = customers.filter(
          (c) =>
            c.primaryVisitorId === vis.id || (c.sharedVisitorIds && c.sharedVisitorIds.includes(vis.id))
        ).length;

        const visVisits = visits.filter((v) => v.visitorId === vis.id);
        const completedVisits = visVisits.filter((v) => v.status === 'completed').length;

        // Performance Score Formula (0 to 100)
        const score = Math.round(
          Math.min(50, (totalSalesAFN / targetAFN) * 50) +
            Math.min(25, activeCustomersCount * 2.5) +
            Math.min(25, completedVisits * 2.5)
        );

        return {
          visitor: vis,
          totalSalesAFN,
          targetAFN,
          targetPercent,
          ordersCount: deliveredOrders.length,
          activeCustomersCount,
          completedVisits,
          score,
        };
      })
      .sort((a, b) => b.score - a.score || b.totalSalesAFN - a.totalSalesAFN);
  }, [visitors, orders, customers, visits]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg">
              تابلوی افتخارات و رتبه‌بندی عملکرد ویزیتورها
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            محاسبه خودکار رتبه بر اساس حجم فروش، درصد تحقق تارگت ماهانه، تعداد مشتریان فعال و ویزیت‌های موفق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 text-xs font-bold">
            {visitors.length} ویزیتور در حال رقابت
          </span>
        </div>
      </div>

      {/* Podium Top 3 (if at least 2 visitors) */}
      {leaderboardData.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Rank 2 (Silver) */}
          {leaderboardData[1] && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-300 dark:border-slate-700 shadow-xs flex flex-col items-center text-center relative order-2 md:order-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xl mb-3 shadow-inner">
                🥈
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-1">
                رتبه ۲ (نقره‌ای)
              </span>
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {leaderboardData[1].visitor.name}
              </h4>
              <div className="mt-3 w-full space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-500 text-[11px]">فروش کل:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {leaderboardData[1].totalSalesAFN.toLocaleString()} AFN
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-500 text-[11px]">تحقق تارگت:</span>
                  <span className="font-mono font-bold text-sky-600">
                    {leaderboardData[1].targetPercent}٪
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {leaderboardData[0] && (
            <div className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:to-slate-900 p-6 rounded-3xl border-2 border-amber-400 shadow-lg flex flex-col items-center text-center relative order-1 md:order-2 -translate-y-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-400 text-white flex items-center justify-center font-black text-3xl mb-3 shadow-lg shadow-amber-400/40 animate-bounce">
                👑
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 mb-1 shadow-xs">
                قهرمان فروش (رتبه ۱)
              </span>
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-base">
                {leaderboardData[0].visitor.name}
              </h4>
              <div className="mt-3.5 w-full space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60">
                  <span className="text-amber-800 dark:text-amber-200 font-bold text-[11px]">فروش کل:</span>
                  <span className="font-mono font-black text-amber-900 dark:text-amber-100 text-sm">
                    {leaderboardData[0].totalSalesAFN.toLocaleString()} AFN
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 text-[11px]">تحقق تارگت:</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {leaderboardData[0].targetPercent}٪
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {leaderboardData[2] && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-600/40 shadow-xs flex flex-col items-center text-center relative order-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 flex items-center justify-center font-black text-xl mb-3 shadow-inner">
                🥉
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-1">
                رتبه ۳ (برنز)
              </span>
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {leaderboardData[2].visitor.name}
              </h4>
              <div className="mt-3 w-full space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-500 text-[11px]">فروش کل:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {leaderboardData[2].totalSalesAFN.toLocaleString()} AFN
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-500 text-[11px]">تحقق تارگت:</span>
                  <span className="font-mono font-bold text-sky-600">
                    {leaderboardData[2].targetPercent}٪
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-500" />
            <span>جدول تفصیلی امتیازات و رتبه‌بندی</span>
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">رتبه</th>
                <th className="py-3 px-4">نام ویزیتور</th>
                <th className="py-3 px-4">فروش تاییدشده (AFN)</th>
                <th className="py-3 px-4">تحقق تارگت ماهانه</th>
                <th className="py-3 px-4">دواخانه‌های فعال</th>
                <th className="py-3 px-4">ویزیت‌های موفق</th>
                <th className="py-3 px-4 text-center">امتیاز عملکرد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboardData.map((row, idx) => {
                const isCurrent = row.visitor.id === currentUserId;

                return (
                  <tr
                    key={row.visitor.id}
                    className={`transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                      isCurrent ? 'bg-sky-50/60 dark:bg-sky-950/30 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-black text-sm">
                      {idx === 0 ? '🥇 ۱' : idx === 1 ? '🥈 ۲' : idx === 2 ? '🥉 ۳' : `${idx + 1}`}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-slate-100">{row.visitor.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-md bg-sky-600 text-white text-[10px] font-bold">
                            شما
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">@{row.visitor.username}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-slate-100">
                      {row.totalSalesAFN.toLocaleString()} AFN
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{row.targetPercent}٪</span>
                          <span className="text-[10px] text-slate-400">از {row.targetAFN.toLocaleString()} AFN</span>
                        </div>
                        <div className="w-28 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              row.targetPercent >= 100
                                ? 'bg-emerald-500'
                                : row.targetPercent >= 70
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${row.targetPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.activeCustomersCount} دواخانه
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.completedVisits} ویزیت
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">
                        {row.score} / ۱۰۰
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
