import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Order, OrderStatus, OrderStatusHistoryItem } from '../../types';
import {
  exportOrderToExcel,
  exportOrderToPDF,
  getOrderStatusTitle,
  getPaymentStatusTitle,
} from '../../utils/exportDocs';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Check,
  AlertTriangle,
  Search,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Building2,
  User,
  DollarSign,
  ArrowRight,
  Sparkles,
  Inbox,
  Send,
  Boxes,
} from 'lucide-react';

interface Props {
  isVisitorView?: boolean;
  visitorId?: string;
  storeId: string;
}

interface PipelineStageConfig {
  id: OrderStatus;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  nextStage?: OrderStatus;
  nextActionLabel?: string;
}

const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'submitted',
    title: 'ثبت‌شده (جدید)',
    subtitle: 'در انتظار تأیید اولیه',
    icon: Inbox,
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-700/60',
    nextStage: 'approved',
    nextActionLabel: 'تأیید سفارش',
  },
  {
    id: 'approved',
    title: 'تأیید سفارش',
    subtitle: 'آماده ورود به چرخه انبار',
    icon: CheckCircle2,
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80',
    badgeText: 'text-sky-800 dark:text-sky-300',
    borderColor: 'border-sky-300 dark:border-sky-700/60',
    nextStage: 'preparing',
    nextActionLabel: 'ارسال به انبارداری',
  },
  {
    id: 'preparing',
    title: 'انبار و بسته‌بندی',
    subtitle: 'آماده‌سازی اقلام دارویی',
    icon: Boxes,
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
    badgeText: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-700/60',
    nextStage: 'ready_to_ship',
    nextActionLabel: 'پایان بسته‌بندی',
  },
  {
    id: 'ready_to_ship',
    title: 'آماده خروج از انبار',
    subtitle: 'در انتظار تحویل به موزع',
    icon: Package,
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-300 dark:border-indigo-700/60',
    nextStage: 'shipped',
    nextActionLabel: 'تحویل به پیک/موزع',
  },
  {
    id: 'shipped',
    title: 'در مسیر ارسال',
    subtitle: 'در حال توزیع به دواخانه',
    icon: Truck,
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-700/60',
    nextStage: 'delivered',
    nextActionLabel: 'ثبت تحویل نهایی',
  },
  {
    id: 'delivered',
    title: 'تحویل شده قطعی',
    subtitle: 'دریافت توسط دواخانه',
    icon: Check,
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-700/60',
  },
];

export const OrdersOperationalPipeline: React.FC<Props> = ({
  isVisitorView = false,
  visitorId,
  storeId,
}) => {
  const { currentUser, currentStore } = useApp();
  const [orders, setOrders] = useState<Order[]>(() => {
    const all = Storage.getOrders(storeId);
    return isVisitorView && visitorId ? all.filter((o) => o.visitorId === visitorId) : all;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageTab, setActiveStageTab] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const reloadData = () => {
    const all = Storage.getOrders(storeId);
    const filtered = isVisitorView && visitorId ? all.filter((o) => o.visitorId === visitorId) : all;
    setOrders(filtered);
    if (selectedOrderDetails) {
      const fresh = filtered.find((o) => o.id === selectedOrderDetails.id);
      if (fresh) setSelectedOrderDetails(fresh);
    }
  };

  const handleAdvanceStage = (order: Order, targetStage: OrderStatus, note?: string) => {
    const allOrders = Storage.getOrders(storeId);
    const updated = allOrders.map((o) => {
      if (o.id === order.id) {
        const history: OrderStatusHistoryItem[] = [
          ...(o.history || []),
          {
            status: targetStage,
            changedBy: currentUser?.id || '',
            changedByName: currentUser?.name || 'مدیر فروشگاه',
            timestamp: new Date().toISOString(),
            note: note || `تغییر مرحله پردازش به «${getOrderStatusTitle(targetStage)}»`,
          },
        ];

        return {
          ...o,
          status: targetStage,
          history,
          deliveredAt: targetStage === 'delivered' ? new Date().toISOString() : o.deliveredAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    Storage.saveOrders(updated, storeId);
    reloadData();
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (q) {
        const match =
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.visitorName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (activeStageTab !== 'all' && o.status !== activeStageTab) {
        return false;
      }
      return true;
    });
  }, [orders, searchQuery, activeStageTab]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
              پایپلاین عملیاتی پردازش، بسته‌بندی و ارسال دارو
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">
              {orders.length} سفارش
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isVisitorView
              ? 'مشاهده لحظه‌ای وضعیت آماده‌سازی سفارشات شما در انبار مرکزی و پیگیری وضعیت ارسال تا تحویل'
              : 'گردش کار یکپارچه: ثبت سفارش → تأیید سفارش → بسته‌بندی انبار → خروج و ارسال → تحویل نهایی به دواخانه'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره سفارش، دواخانه..."
              className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Stage Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_STAGES.map((stg) => {
          const count = orders.filter((o) => o.status === stg.id).length;
          const Icon = stg.icon;
          const isSelected = activeStageTab === stg.id;

          return (
            <button
              key={stg.id}
              onClick={() => setActiveStageTab(isSelected ? 'all' : stg.id)}
              className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stg.badgeBg} ${stg.badgeText}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-100">
                  {count}
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{stg.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{stg.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageOrders = filteredOrders.filter((o) => o.status === stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`bg-slate-50/70 dark:bg-slate-900/50 rounded-3xl p-3 border ${stage.borderColor} flex flex-col min-w-[260px] max-h-[800px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800 mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${stage.badgeBg} ${stage.badgeText}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-black text-xs text-slate-800 dark:text-slate-100">{stage.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  {stageOrders.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 pl-0.5">
                {stageOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    سفارشی در این مرحله نیست
                  </div>
                ) : (
                  stageOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-md transition space-y-2.5"
                    >
                      {/* Order Number & Price */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200/60">
                          {ord.orderNumber}
                        </span>
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                          {ord.totalAFN.toLocaleString()} AFN
                        </span>
                      </div>

                      {/* Pharmacy Info */}
                      <div>
                        <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{ord.customerName}</span>
                        </h4>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>ویزیتور: {ord.visitorName}</span>
                          <span>{ord.items.length} قلم دارو</span>
                        </div>
                      </div>

                      {/* Financial Status */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[10px] flex items-center justify-between">
                        <span className="text-slate-500">وصولی / بیعانه:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {ord.paidAmountAFN > 0 ? `${ord.paidAmountAFN.toLocaleString()} AFN` : '۰ AFN'}
                        </span>
                      </div>

                      {/* Advance Stage Button (Store owner only, or view history) */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="مشاهده فاکتور و تاریخچه"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[10px]">اقلام</span>
                        </button>

                        {!isVisitorView && stage.nextStage && stage.nextActionLabel && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(ord, stage.nextStage!)}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                          >
                            <span>{stage.nextActionLabel}</span>
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}

                        {isVisitorView && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {stage.title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Details & History Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <span>گردش کار فاکتور دارویی {selectedOrderDetails.orderNumber}</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  مشتری: {selectedOrderDetails.customerName} | ویزیتور: {selectedOrderDetails.visitorName}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stage Progress Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                وضعیت فعلی سفارش: <strong className="text-purple-600 font-black">{getOrderStatusTitle(selectedOrderDetails.status)}</strong>
              </div>
              <div className="flex items-center gap-1">
                {PIPELINE_STAGES.map((s, idx) => {
                  const stageIdx = PIPELINE_STAGES.findIndex((st) => st.id === selectedOrderDetails.status);
                  const isDone = stageIdx >= idx;
                  const isCurrent = s.id === selectedOrderDetails.status;

                  return (
                    <div
                      key={s.id}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        isCurrent
                          ? 'bg-purple-600 ring-2 ring-purple-400/40'
                          : isDone
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      title={s.title}
                    />
                  );
                })}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">ریز اقلام سفارش:</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
                {selectedOrderDetails.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{it.medicineName}</span>
                      <span className="text-[10px] text-slate-400 mr-2">
                        {it.quantity} {it.unit || 'بسته'} × {it.unitPrice.toLocaleString()} AFN
                      </span>
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                      {it.totalAFN.toLocaleString()} AFN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* History Logs */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">تاریخچه مراحل تغییر وضعیت:</h4>
              <div className="space-y-1 max-h-36 overflow-y-auto text-[11px]">
                {(selectedOrderDetails.history || []).map((h, hIdx) => (
                  <div
                    key={hIdx}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-purple-700 dark:text-purple-400">
                        {getOrderStatusTitle(h.status)}
                      </span>
                      <span className="text-slate-400 text-[10px] mr-2">توسط {h.changedByName}</span>
                      {h.note && <p className="text-[10px] text-slate-500 mt-0.5">{h.note}</p>}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(h.timestamp).toLocaleDateString('fa-AF')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportOrderToPDF(selectedOrderDetails, currentStore?.name || 'فروشگاه')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>چاپ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportOrderToExcel(selectedOrderDetails, currentStore?.name || 'فروشگاه')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>اکسل</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
