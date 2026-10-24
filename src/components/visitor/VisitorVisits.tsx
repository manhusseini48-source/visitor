import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { VisitRecord, VisitOutcome, Customer } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  MapPin,
  Phone,
  X,
  FileCheck,
  RefreshCw,
  Search,
  Filter,
  MessageCircle,
  Sparkles,
  Compass,
} from 'lucide-react';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const VisitorVisits: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = currentStore?.id || currentUser?.storeId || '';

  const [visits, setVisits] = useState<VisitRecord[]>(() =>
    Storage.getVisits(storeId).filter(
      (v) => v.visitorId === visitorId || !v.visitorId
    )
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    Storage.getCustomers(storeId).filter(
      (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
    )
  );

  const [filterTab, setFilterTab] = useState<'today' | 'scheduled' | 'all' | 'followup' | 'completed'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Outcome Modal State & GPS Location
  const [outcomeModalVisit, setOutcomeModalVisit] = useState<VisitRecord | null>(null);
  const [outcome, setOutcome] = useState<VisitOutcome>('order_placed');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [capturedLocation, setCapturedLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  } | null>(null);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('مرورگر از دریافت موقعیت مکانی پشتیبانی نمی‌کند.');
      return;
    }
    setIsCapturingGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturedLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
        setIsCapturingGPS(false);
      },
      (err) => {
        setGpsError('موقعیت مکانی در دسترس نیست یا اجازه داده نشد.');
        setIsCapturingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Schedule New Visit Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [newVisitNotes, setNewVisitNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const reloadData = () => {
    const allVisits = Storage.getVisits(storeId);
    setVisits(
      allVisits.filter(
        (v) => v.visitorId === visitorId || !v.visitorId
      )
    );
    const allCusts = Storage.getCustomers(storeId);
    setCustomers(
      allCusts.filter(
        (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
      )
    );
  };

  useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storeId, visitorId]);

  // Set default customer when customers load
  useEffect(() => {
    if (customers.length > 0 && !newCustomerId) {
      setNewCustomerId(customers[0].id);
    }
  }, [customers]);

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      setFormError('لطفاً دواخانه مورد نظر را انتخاب نمایید.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === newCustomerId);
    const newVisit: VisitRecord = {
      id: `vis_${Date.now()}`,
      storeId,
      customerId: newCustomerId,
      customerName: selectedCust?.name || 'دواخانه',
      visitorId,
      visitorName: currentUser?.name || 'ویزیتور',
      scheduledTime: new Date(newScheduledTime).toISOString(),
      status: 'scheduled',
      notes: newVisitNotes,
    };

    const all = Storage.getVisits(storeId);
    all.unshift(newVisit);
    Storage.saveVisits(all, storeId);

    // Update customer next follow-up date
    const allCust = Storage.getCustomers(storeId);
    const updatedCusts = allCust.map((c) =>
      c.id === newCustomerId
        ? { ...c, nextFollowupDate: new Date(newScheduledTime).toISOString() }
        : c
    );
    Storage.saveCustomers(updatedCusts, storeId);

    reloadData();
    setIsScheduleModalOpen(false);
    setNewVisitNotes('');
    setFormError(null);
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
            location: capturedLocation || v.location,
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
    setCapturedLocation(null);
    setGpsError(null);
  };

  const isVisitToday = (scheduledTime: string) => {
    try {
      const d = new Date(scheduledTime);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  };

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchSearch =
        v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.notes && v.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchTab = true;
      if (filterTab === 'today') {
        matchTab = isVisitToday(v.scheduledTime);
      } else if (filterTab === 'scheduled') {
        matchTab = v.status === 'scheduled';
      } else if (filterTab === 'completed') {
        matchTab = v.status === 'completed';
      } else if (filterTab === 'followup') {
        matchTab = !!v.nextFollowupDate || v.outcome === 'followup_needed';
      }

      return matchSearch && matchTab;
    });
  }, [visits, searchQuery, filterTab]);

  const todayCount = visits.filter((v) => isVisitToday(v.scheduledTime)).length;
  const scheduledCount = visits.filter((v) => v.status === 'scheduled').length;
  const followupCount = visits.filter((v) => !!v.nextFollowupDate || v.outcome === 'followup_needed').length;
  const completedCount = visits.filter((v) => v.status === 'completed').length;

  const getOutcomeBadge = (out?: VisitOutcome) => {
    switch (out) {
      case 'order_placed':
        return (
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
            سفارش ثبت شد
          </span>
        );
      case 'did_not_buy':
        return (
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
            خرید نکرد
          </span>
        );
      case 'absent':
        return (
          <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded text-[10px]">
            مسئول حضور نداشت
          </span>
        );
      case 'followup_needed':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
            پیگیری لازم است
          </span>
        );
      case 'postponed':
        return (
          <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px]">
            موکول به بعد
          </span>
        );
      case 'phone_call':
        return (
          <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold px-2 py-0.5 rounded text-[10px]">
            تماس تلفنی
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
            در انتظار مراجعه
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>برنامه ویزیت و پیگیری دواخانه‌ها ({visits.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            برنامه زمان‌بندی روزانه، پیگیری مراجعات قبلی و ثبت فوری نتایج مذاکره با دواخانه‌ها (سینک کامل با فروشگاه)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>تنظیم ویزیت / پیگیری جدید</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setFilterTab('today')}
          className={`p-3 rounded-2xl border text-right transition cursor-pointer shadow-2xs ${
            filterTab === 'today'
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
          }`}
        >
          <div className="text-[10px] font-black flex items-center gap-1 text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>برنامه مراجعات امروز</span>
          </div>
          <div className="text-xl font-black mt-1 font-mono text-white">
            {todayCount}
          </div>
        </button>

        <button
          onClick={() => setFilterTab('scheduled')}
          className={`p-3 rounded-2xl border text-right transition cursor-pointer shadow-2xs ${
            filterTab === 'scheduled'
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
          }`}
        >
          <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>مقرر شده (در انتظار)</span>
          </div>
          <div className="text-xl font-black mt-1 font-mono text-sky-800 dark:text-sky-200">
            {scheduledCount}
          </div>
        </button>

        <button
          onClick={() => setFilterTab('followup')}
          className={`p-3 rounded-2xl border text-right transition cursor-pointer shadow-2xs ${
            filterTab === 'followup'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>نیازمند پیگیری</span>
          </div>
          <div className="text-xl font-black mt-1 font-mono text-amber-800 dark:text-amber-200">
            {followupCount}
          </div>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`p-3 rounded-2xl border text-right transition cursor-pointer shadow-2xs ${
            filterTab === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>انجام‌شده</span>
          </div>
          <div className="text-xl font-black mt-1 font-mono text-emerald-800 dark:text-emerald-200">
            {completedCount}
          </div>
        </button>

        <button
          onClick={() => setFilterTab('all')}
          className={`p-3 rounded-2xl border text-right transition cursor-pointer shadow-2xs col-span-2 sm:col-span-1 ${
            filterTab === 'all'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="text-[10px] font-bold opacity-80">کل ویزیت‌ها</div>
          <div className="text-xl font-black mt-1 font-mono">{visits.length}</div>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام دواخانه یا یادداشت‌های پیگیری..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              موردی در این بخش یافت نشد.
            </h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              می‌توانید با دکمه «تنظیم ویزیت / پیگیری جدید» مراجعات روزانه خود به دواخانه‌ها را ثبت و پیگیری نمایید.
            </p>
          </div>
        ) : (
          filteredVisits.map((v) => {
            const customerObj = customers.find((c) => c.id === v.customerId);

            return (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {v.customerName}
                    </h3>
                    {getOutcomeBadge(v.outcome)}
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                      {new Date(v.scheduledTime).toLocaleDateString('fa-AF')}
                    </span>
                    {v.location && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        <MapPin className="w-3 h-3 text-red-500" />
                        <span>موقعیت مکانی ثبت‌شده</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>ساعت مقرر:</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">
                        {new Date(v.scheduledTime).toLocaleTimeString('fa-AF', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </span>

                    {customerObj?.phone && (
                      <a
                        href={`tel:${customerObj.phone}`}
                        className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-mono font-bold"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{customerObj.phone}</span>
                      </a>
                    )}

                    {customerObj?.address && (
                      <span className="flex items-center gap-1 text-slate-400 truncate max-w-xs">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{customerObj.address}</span>
                      </span>
                    )}
                  </div>

                  {/* STORE ADVICE BANNER (UP TO 300 CHARACTERS) */}
                  {v.storeAdvice && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-300 dark:border-amber-700/60 p-2.5 rounded-xl text-xs space-y-1 mt-1.5">
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>توصیه فروشگاه برای ادامه مذاکره با این مشتری:</span>
                        </span>
                        <span className="text-[10px] text-amber-700/80 font-normal">
                          {v.storeAdvice.advisorName}
                        </span>
                      </div>
                      <p className="text-amber-900 dark:text-amber-100 text-[11px] leading-relaxed font-medium">
                        «{v.storeAdvice.text}»
                      </p>
                    </div>
                  )}

                  {v.notes && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong>یادداشت:</strong> {v.notes}
                    </div>
                  )}

                  {v.nextFollowupDate && (
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>
                        تاریخ پیگیری بعدی: {new Date(v.nextFollowupDate).toLocaleDateString('fa-AF')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                  {v.status === 'scheduled' ? (
                    <button
                      onClick={() => {
                        setOutcomeModalVisit(v);
                        setOutcomeNotes(v.notes || '');
                        setNextFollowupDate(v.nextFollowupDate || '');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>ثبت نتیجه مراجعه</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تکمیل شد</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule New Visit Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>تنظیم برنامه ویزیت یا پیگیری جدید</span>
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateVisit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب دواخانه / مشتری *
                </label>
                <select
                  required
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">-- انتخاب دواخانه --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.managerName}) - {c.area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ و ساعت مقرر مراجعه *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduledTime}
                  onChange={(e) => setNewScheduledTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت و هدف از ویزیت
                </label>
                <textarea
                  rows={2}
                  value={newVisitNotes}
                  onChange={(e) => setNewVisitNotes(e.target.value)}
                  placeholder="مثال: معرفی داروی جدید، دریافت چک یا پیگیری سفارش قبلی..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  ثبت نتیجه ویزیت: {outcomeModalVisit.customerName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ثبت نتیجه این مذاکره در پرونده دواخانه و پنل فروشگاه سینک می‌شود
                </p>
              </div>
              <button
                onClick={() => setOutcomeModalVisit(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOutcome} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نتیجه مذاکره حضوری *
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="order_placed">✅ سفارش ثبت شد</option>
                  <option value="followup_needed">⏳ پیگیری مجدد نیاز است</option>
                  <option value="did_not_buy">❌ مشتری خرید نکرد</option>
                  <option value="absent">🚪 مسئول دواخانه حضور نداشت</option>
                  <option value="postponed">📅 به روز دیگری موکول شد</option>
                  <option value="phone_call">📞 مذاکره تلفنی انجام شد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ پیگیری بعدی (در صورت نیاز)
                </label>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 text-left outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و گزارش تکمیلی
                </label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="توضیحات مذاکره، اقلام درخواستی یا دلایل عدم خرید..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              {/* GPS Geolocation Capture */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ثبت موقعیت مکانی حضور (GPS)
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {capturedLocation ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>موقعیت مکانی با موفقیت ثبت شد</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({capturedLocation.latitude.toFixed(3)}, {capturedLocation.longitude.toFixed(3)})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        جهت تایید حضور در محل دواخانه:
                      </span>
                      <button
                        type="button"
                        onClick={handleCaptureGPS}
                        disabled={isCapturingGPS}
                        className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                      >
                        <Compass className={`w-3.5 h-3.5 ${isCapturingGPS ? 'animate-spin' : ''}`} />
                        <span>{isCapturingGPS ? 'در حال ثبت...' : 'ثبت موقعیت GPS'}</span>
                      </button>
                    </div>
                  )}
                  {gpsError && (
                    <div className="text-[10px] text-rose-500 font-bold mt-1">
                      {gpsError}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOutcomeModalVisit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  ذخیره و همگام‌سازی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
