import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { VisitRecord, VisitOutcome, Customer } from '../../types';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  MapPin,
  X,
  FileCheck,
} from 'lucide-react';

export const VisitsScheduleManager: React.FC = () => {
  const { currentStore, currentUser } = useApp();
  const storeId = currentStore?.id || '';

  const [visits, setVisits] = useState<VisitRecord[]>(() =>
    Storage.getVisits(storeId)
  );

  const customers = useMemo(() => Storage.getCustomers(storeId), [storeId]);
  const visitors = useMemo(
    () => Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor'),
    [storeId]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outcomeModalVisit, setOutcomeModalVisit] = useState<VisitRecord | null>(null);

  // New Visit Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [visitorId, setVisitorId] = useState(visitors[0]?.id || '');
  const [scheduledTime, setScheduledTime] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState('');

  // Outcome Form
  const [outcome, setOutcome] = useState<VisitOutcome>('order_placed');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');

  const reloadData = () => {
    setVisits(Storage.getVisits(storeId));
  };

  React.useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storeId]);

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const vis = visitors.find((v) => v.id === visitorId);

    const newVisit: VisitRecord = {
      id: `vis_${Date.now()}`,
      storeId,
      customerId,
      customerName: cust?.name || 'دواخانه',
      visitorId,
      visitorName: vis?.name || 'ویزیتور',
      scheduledTime: new Date(scheduledTime).toISOString(),
      status: 'scheduled',
      notes,
    };

    const all = Storage.getVisits(storeId);
    all.unshift(newVisit);
    Storage.saveVisits(all, storeId);

    // Update customer next followup
    if (customerId) {
      const custs = Storage.getCustomers(storeId);
      const updatedCusts = custs.map((c) =>
        c.id === customerId
          ? { ...c, nextFollowupDate: new Date(scheduledTime).toISOString() }
          : c
      );
      Storage.saveCustomers(updatedCusts, storeId);
    }

    reloadData();
    setIsModalOpen(false);
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

    Storage.saveVisits(updated, storeId);

    // Also update Customer's lastVisitDate and nextFollowupDate
    if (outcomeModalVisit.customerId) {
      const allCust = Storage.getCustomers(storeId);
      const updatedCusts = allCust.map((c) =>
        c.id === outcomeModalVisit.customerId
          ? {
              ...c,
              lastVisitDate: new Date().toISOString(),
              nextFollowupDate: nextFollowupDate || c.nextFollowupDate,
            }
          : c
      );
      Storage.saveCustomers(updatedCusts, storeId);
    }

    reloadData();
    setOutcomeModalVisit(null);
  };

  const getOutcomeBadge = (out?: VisitOutcome) => {
    switch (out) {
      case 'order_placed':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">سفارش ثبت شد</span>;
      case 'did_not_buy':
        return <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">خرید نکرد</span>;
      case 'absent':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">مسئول حضور نداشت</span>;
      case 'followup_needed':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">پیگیری لازم است</span>;
      case 'postponed':
        return <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">موکول به بعد</span>;
      case 'phone_call':
        return <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">تماس تلفنی</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 text-[10px]">در انتظار مراجعه</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            <span>برنامه ویزیت و پیگیری دواخانه‌ها ({visits.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            زمان‌بندی مراجعات حضوری ویزیتورها و ثبت نتایج بازاریابی و فروش
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تنظیم ویزیت جدید</span>
        </button>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">زمان مقرر</th>
                <th className="p-3.5">دواخانه / مشتری</th>
                <th className="p-3.5">ویزیتور مسئول</th>
                <th className="p-3.5">نتیجه و وضعیت مراجعه</th>
                <th className="p-3.5">یادداشت ویزیتور</th>
                <th className="p-3.5">پیگیری بعدی</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    ویزیت زمان‌بندی شده‌ای ثبت نشده است.
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">
                        {new Date(v.scheduledTime).toLocaleDateString('fa-AF')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(v.scheduledTime).toLocaleTimeString('fa-AF', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-slate-800">{v.customerName}</td>

                    <td className="p-3.5 text-slate-600">{v.visitorName}</td>

                    <td className="p-3.5">{getOutcomeBadge(v.outcome)}</td>

                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {v.notes || '-'}
                    </td>

                    <td className="p-3.5 text-slate-500">
                      {v.nextFollowupDate
                        ? new Date(v.nextFollowupDate).toLocaleDateString('fa-AF')
                        : '-'}
                    </td>

                    <td className="p-3.5 text-center">
                      {v.status === 'scheduled' ? (
                        <button
                          onClick={() => {
                            setOutcomeModalVisit(v);
                            setOutcomeNotes(v.notes || '');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                        >
                          ثبت نتیجه
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">تکمیل شده</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-3">تنظیم مأموریت ویزیت جدید</h3>
            <form onSubmit={handleCreateVisit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  انتخاب دواخانه / مشتری
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ویزیتور مجری
                </label>
                <select
                  value={visitorId}
                  onChange={(e) => setVisitorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {visitors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تاریخ و ساعت مراجعه
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  هدف و یادداشت ویزیت
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: معرفی آنتی‌بیوتیک جدید و دریافت چک"
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
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت در تقویم کاری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outcome Recording Modal */}
      {outcomeModalVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              ثبت نتیجه ویزیت: {outcomeModalVisit.customerName}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              ویزیتور: {outcomeModalVisit.visitorName}
            </p>

            <form onSubmit={handleSaveOutcome} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نتیجه نهایی مراجعه
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
                  توضیحات و علت نتیجه
                </label>
                <input
                  type="text"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="علت خرید نکردن یا توافقات انجام شده..."
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
                  ذخیره نتیجه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
