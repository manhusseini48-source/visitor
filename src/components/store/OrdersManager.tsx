import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  exportOrderToExcel,
  exportOrderToPDF,
  getOrderStatusTitle,
  getPaymentStatusTitle,
  exportOrdersListToExcel,
  exportOrdersListToPDF,
} from '../../utils/exportDocs';
import { MedicineDetailsModal } from '../common/MedicineDetailsModal';
import { OrdersOperationalPipeline } from '../common/OrdersOperationalPipeline';
import { parseNumberInput } from '../../utils/numberUtils';
import {
  ShoppingCart,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  DollarSign,
  Send,
  Eye,
  Plus,
  AlertCircle,
  X,
  Share2,
  Boxes,
  List,
} from 'lucide-react';

interface Props {
  onShareInChat?: (order: Order) => void;
}

export const OrdersManager: React.FC<Props> = ({ onShareInChat }) => {
  const { currentStore, currentUser } = useApp();
  const storeId = currentStore?.id || '';

  const [orders, setOrders] = useState<Order[]>(() => Storage.getOrders(storeId));
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Selected Order for detail & status update
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Payment Recording State
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentNote, setPaymentNote] = useState('دریافت نقدی در دفتر');

  // Interactive medicine details preview modal
  const [selectedDetailMed, setSelectedDetailMed] = useState<any | null>(null);

  const handleOpenMedicineDetails = (medId: string, medName: string) => {
    const medicines = Storage.getMedicines(storeId);
    const found =
      medicines.find((m) => m.id === medId) ||
      medicines.find((m) => m.name.toLowerCase() === medName.toLowerCase());

    if (found) {
      setSelectedDetailMed(found);
    } else {
      // Create minimal medicine object if deleted from inventory
      setSelectedDetailMed({
        id: medId,
        storeId,
        name: medName,
        brand: 'فروشگاه دارویی',
        dosageForm: 'دارو',
        strength: '',
        code: 'ORDER-ITEM',
        unit: 'بسته',
        purchasePrice: 0,
        salePrice: 0,
        stock: 0,
        minStockAlert: 0,
        category: 'سفارشات',
        expiryDate: '',
        batchNumber: '',
        status: 'active',
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const reloadData = () => {
    const list = Storage.getOrders(storeId);
    setOrders(list);
    if (selectedOrder) {
      const refreshed = list.find((o) => o.id === selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.visitorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Update order status (with history logging)
  const handleUpdateStatus = (newStatus: OrderStatus, note?: string) => {
    if (!selectedOrder) return;

    const all = Storage.getOrders(storeId);
    const updated = all.map((o) => {
      if (o.id === selectedOrder.id) {
        const history = [
          ...o.history,
          {
            status: newStatus,
            changedBy: currentUser?.id || 'owner',
            changedByName: currentUser?.name || 'مدیریت فروشگاه',
            timestamp: new Date().toISOString(),
            note: note || `تغییر وضعیت به ${getOrderStatusTitle(newStatus)}`,
          },
        ];

        return {
          ...o,
          status: newStatus,
          history,
          deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : o.deliveredAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    Storage.saveOrders(updated);
    reloadData();
  };

  // Record received payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder || paymentAmount <= 0) return;

    const all = Storage.getOrders(storeId);
    const updated = all.map((o) => {
      if (o.id === paymentModalOrder.id) {
        const newPaid = o.paidAmountAFN + Number(paymentAmount);
        const newRemaining = Math.max(0, o.totalAFN - newPaid);
        let newPaymentStatus: PaymentStatus = 'partial';
        if (newRemaining === 0) newPaymentStatus = 'paid';
        if (newPaid === 0) newPaymentStatus = 'unpaid';

        const payments = [
          ...o.payments,
          {
            id: `pay_${Date.now()}`,
            amountAFN: Number(paymentAmount),
            date: new Date().toISOString(),
            registeredBy: currentUser?.name || 'صاحب فروشگاه',
            receiptNumber: receiptNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
            note: paymentNote,
          },
        ];

        return {
          ...o,
          paidAmountAFN: newPaid,
          remainingAmountAFN: newRemaining,
          paymentStatus: newPaymentStatus,
          payments,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    Storage.saveOrders(updated);
    reloadData();
    setPaymentModalOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-sky-600" />
            <span>مدیریت سفارشات و ارسال دارو ({orders.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            گردش کار سفارش: تأیید، انبار، ارسال، تحویل، وصول مبالغ و صدور فاکتور رسمی
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>پایپ‌لاین مراحل دارو</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>جدول و فاکتورها</span>
            </button>
          </div>

          <button
            onClick={() => exportOrdersListToExcel(orders)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={() => exportOrdersListToPDF(orders, currentStore?.name || 'فروشگاه دارویی')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>خروجی PDF</span>
          </button>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        <OrdersOperationalPipeline storeId={storeId} />
      ) : (
        <>
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره سفارش، مشتری یا ویزیتور..."
            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="all">همه مراحل سفارش</option>
          <option value="submitted">ثبت‌شده</option>
          <option value="pending_review">در انتظار بررسی</option>
          <option value="approved">تأییدشده</option>
          <option value="preparing">در حال آماده‌سازی</option>
          <option value="shipped">ارسال شده</option>
          <option value="delivered">تحویل داده شده</option>
          <option value="cancelled">لغوشده</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="all">همه وضعیت‌های مالی</option>
          <option value="unpaid">پرداخت نشده</option>
          <option value="partial">وصول جزئی</option>
          <option value="paid">وصول کامل</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">شماره سفارش</th>
                <th className="p-3.5">مشتری / دواخانه</th>
                <th className="p-3.5">ویزیتور</th>
                <th className="p-3.5">تاریخ ثبت</th>
                <th className="p-3.5">مبلغ کل (افغانی)</th>
                <th className="p-3.5">وضعیت پردازش</th>
                <th className="p-3.5">وضعیت وصول وجه</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    سفارشی با این شرایط پیدا نشد.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-sky-700">
                      {o.orderNumber}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400">{o.items.length} قلم دارو</div>
                    </td>

                    <td className="p-3.5 text-slate-700 font-medium">{o.visitorName}</td>

                    <td className="p-3.5 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString('fa-AF')}
                    </td>

                    <td className="p-3.5 font-bold text-slate-800">
                      {o.totalAFN.toLocaleString()} AFN
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          o.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : o.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : o.status === 'approved'
                            ? 'bg-sky-100 text-sky-800'
                            : o.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {getOrderStatusTitle(o.status)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {getPaymentStatusTitle(o.paymentStatus)}
                        </span>
                        {o.remainingAmountAFN > 0 && (
                          <button
                            onClick={() => {
                              setPaymentModalOrder(o);
                              setPaymentAmount(o.remainingAmountAFN);
                            }}
                            className="text-[10px] text-sky-600 hover:underline font-bold"
                          >
                            + وصول
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        دریافتی: {o.paidAmountAFN.toLocaleString()} AFN
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="جزئیات و تغییر وضعیت"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportOrderToPDF(o, currentStore?.name || 'فروشگاه دارو')}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="دانلود PDF فاکتور"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportOrderToExcel(o, currentStore?.name || 'فروشگاه دارو')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="دانلود اکسل فاکتور"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Order Details & Pipeline Workflow Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>جزئیات سفارش {selectedOrder.orderNumber}</span>
                  <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    {selectedOrder.customerName}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ثبت شده توسط {selectedOrder.visitorName} در{' '}
                  {new Date(selectedOrder.createdAt).toLocaleDateString('fa-AF')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Action Buttons */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
              <div className="text-xs font-bold text-slate-700 mb-2">
                انتقال مرحله سفارش (اطلاع‌رسانی خودکار به ویزیتور):
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={selectedOrder.status === 'approved'}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                >
                  ✓ تأیید سفارش
                </button>
                <button
                  onClick={() => handleUpdateStatus('preparing')}
                  disabled={selectedOrder.status === 'preparing'}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                >
                  آماده‌سازی در انبار
                </button>
                <button
                  onClick={() => handleUpdateStatus('shipped')}
                  disabled={selectedOrder.status === 'shipped'}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                >
                  ارسال به پیک
                </button>
                <button
                  onClick={() => handleUpdateStatus('delivered')}
                  disabled={selectedOrder.status === 'delivered'}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                >
                  تحویل داده شد
                </button>
                <button
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={selectedOrder.status === 'cancelled'}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                >
                  لغو سفارش
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">نام دارو</th>
                    <th className="p-2.5">شکل دارویی</th>
                    <th className="p-2.5">واحد</th>
                    <th className="p-2.5">تعداد</th>
                    <th className="p-2.5">قیمت واحد</th>
                    <th className="p-2.5">مبلغ کل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpenMedicineDetails(it.medicineId, it.medicineName)}
                          className="font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer text-right block"
                          title="کلیک برای مشاهده مشخصات کامل دارو"
                        >
                          {it.medicineName}
                        </button>
                        {it.strength && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            دوز: {it.strength}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200">
                          {it.dosageForm || 'قرص'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{it.unit}</td>
                      <td className="p-2.5 font-bold">{it.quantity}</td>
                      <td className="p-2.5">{it.unitPrice.toLocaleString()} AFN</td>
                      <td className="p-2.5 font-bold text-emerald-700">
                        {it.totalAFN.toLocaleString()} AFN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total & Balances */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center mb-4">
              <div>
                <span className="text-slate-500">جمع کل: </span>
                <strong className="text-slate-800 text-sm">
                  {selectedOrder.totalAFN.toLocaleString()} AFN
                </strong>
                <span className="text-slate-400 mx-2">|</span>
                <span className="text-emerald-700">وصول شده: {selectedOrder.paidAmountAFN.toLocaleString()} AFN</span>
              </div>
              <div className="font-bold text-amber-700">
                مانده بدهی: {selectedOrder.remainingAmountAFN.toLocaleString()} AFN
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-slate-700">تاریخچه تغییر وضعیت‌ها:</div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
                {selectedOrder.history.map((h, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                    <div>
                      <strong className="text-sky-800">{getOrderStatusTitle(h.status)}</strong>
                      <span className="text-slate-500 mr-2">توسط {h.changedByName}</span>
                      {h.note && <span className="text-slate-400 mr-1">({h.note})</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(h.timestamp).toLocaleTimeString('fa-AF')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document export & Share buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportOrderToPDF(selectedOrder, currentStore?.name || 'فروشگاه')}
                  className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>دانلود فاکتور PDF</span>
                </button>
                <button
                  onClick={() => exportOrderToExcel(selectedOrder, currentStore?.name || 'فروشگاه')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>دانلود فاکتور Excel</span>
                </button>
              </div>

              {onShareInChat && (
                <button
                  onClick={() => {
                    onShareInChat(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-3.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>ارسال سند سفارش در پیام‌رسان داخلی</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              ثبت وصول وجه: {paymentModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              مشتری: <strong className="text-slate-800">{paymentModalOrder.customerName}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مبلغ دریافتی (افغانی)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-emerald-700"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شماره رسید / قبض (اختیاری)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="REC-9081"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  توضیحات و بابت
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت وصولی قطعی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Interactive Medicine Details Modal */}
      <MedicineDetailsModal
        isOpen={Boolean(selectedDetailMed)}
        onClose={() => setSelectedDetailMed(null)}
        medicine={selectedDetailMed}
      />
    </div>
  );
};
