import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { VisitRecord, VisitOutcome } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  MapPin,
  X,
} from 'lucide-react';

export const VisitorVisits: React.FC = () => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = currentStore?.id || '';

  const [visits, setVisits] = useState<VisitRecord[]>(() =>
    Storage.getVisits(storeId).filter((v) => v.visitorId === visitorId)
  );

  const [outcomeModalVisit, setOutcomeModalVisit] = useState<VisitRecord | null>(null);
  const [outcome, setOutcome] = useState<VisitOutcome>('order_placed');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');

  const reloadData = () => {
    setVisits(Storage.getVisits(storeId).filter((v) => v.visitorId === visitorId));
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeModalVisit) return;

    const all = Storage.getVisits(storeId);
    const updated = all.map((v) =>
      v.id === outcomeModalVisit.id
        ? {
            ...v,
            status: 'completed' as const,
            completedTime: new Date().toISOString(),
            outcome,
            notes: outcomeNotes || v.notes,
            nextFollowupDate: nextFollowupDate || undefined,
          }
        : v
    );

    Storage.saveVisits(updated);
    reloadData();
    setOutcomeModalVisit(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>برنامه ویزیت و مراجعات من ({visits.length})</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          برنامه روزانه مراجعه به دواخانه‌ها و ثبت فوری نتایج ویزیت
        </p>
      </div>

      <div className="space-y-3">
        {visits.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            برنامه ویزیتی برای شما تنظیم نشده است.
          </div>
        ) : (
          visits.map((v) => (
            <div
              key={v.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">{v.customerName}</h3>
                  <span className="text-xs text-slate-400">
                    {new Date(v.scheduledTime).toLocaleDateString('fa-AF')}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  ساعت مقرر:{' '}
                  <strong className="text-slate-700">
                    {new Date(v.scheduledTime).toLocaleTimeString('fa-AF', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                  {v.notes && <span className="mr-2">| یادداشت: {v.notes}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {v.status === 'scheduled' ? (
                  <button
                    onClick={() => {
                      setOutcomeModalVisit(v);
                      setOutcomeNotes(v.notes || '');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    ثبت نتیجه مراجعه
                  </button>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                    انجام شد
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Outcome Recording Modal */}
      {outcomeModalVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              ثبت نتیجه ویزیت: {outcomeModalVisit.customerName}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              نتیجه مذاکره حضوری را انتخاب نمایید:
            </p>

            <form onSubmit={handleSaveOutcome} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نتیجه ویزیت
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="order_placed">سفارش ثبت شد</option>
                  <option value="did_not_buy">مشتری خرید نکرد</option>
                  <option value="absent">مسئول دواخانه حضور نداشت</option>
                  <option value="followup_needed">پیگیری مجدد نیاز است</option>
                  <option value="postponed">به روز دیگری موکول شد</option>
                  <option value="phone_call">مذاکره تلفنی انجام شد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  توضیحات و دلایل
                </label>
                <input
                  type="text"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="نکات مطرح شده توسط مشتری..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاریخ پیگیری بعدی (اختیاری)
                </label>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOutcomeModalVisit(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت نتیجه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
