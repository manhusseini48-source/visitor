import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Order, OrderItem, Medicine, Customer } from '../../types';
import {
  exportOrderToExcel,
  exportOrderToPDF,
  exportOrdersListToExcel,
  exportOrdersListToPDF,
  getOrderStatusTitle,
  getPaymentStatusTitle,
} from '../../utils/exportDocs';
import { MedicineDetailsModal } from '../common/MedicineDetailsModal';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';
import { parseNumberInput } from '../../utils/numberUtils';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Clock,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Package,
} from 'lucide-react';

export const VisitorOrders: React.FC = () => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = currentStore?.id || '';

  const [orders, setOrders] = useState<Order[]>(() =>
    Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId)
  );

  const customers = useMemo(
    () =>
      Storage.getCustomers(storeId).filter(
        (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
      ),
    [storeId, visitorId]
  );

  const medicines = useMemo(() => Storage.getMedicines(storeId), [storeId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );

  // Cart Items
  const [cartItems, setCartItems] = useState<
    { medicineId: string; quantity: number; discount: number }[]
  >([]);

  const [medSearch, setMedSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Detail and Image preview modals
  const [selectedDetailMed, setSelectedDetailMed] = useState<Medicine | null>(null);
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState<{
    url: string | null;
    name: string;
    code: string;
  } | null>(null);

  const reloadData = () => {
    setOrders(Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId));
  };

  const handleAddToCart = (med: Medicine) => {
    const existing = cartItems.find((i) => i.medicineId === med.id);
    if (existing) {
      setCartItems(
        cartItems.map((i) =>
          i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCartItems([...cartItems, { medicineId: med.id, quantity: 1, discount: 0 }]);
    }
  };

  const handleRemoveFromCart = (medId: string) => {
    setCartItems(cartItems.filter((i) => i.medicineId !== medId));
  };

  const handleUpdateQty = (medId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(medId);
    } else {
      setCartItems(
        cartItems.map((i) => (i.medicineId === medId ? { ...i, quantity: qty } : i))
      );
    }
  };

  // Cart Calculations
  const cartDetailed = useMemo(() => {
    return cartItems
      .map((item) => {
        const med = medicines.find((m) => m.id === item.medicineId);
        if (!med) return null;
        const subtotal = med.salePrice * item.quantity;
        const total = Math.max(0, subtotal - item.discount);
        return {
          ...item,
          medicine: med,
          subtotal,
          total,
        };
      })
      .filter(Boolean);
  }, [cartItems, medicines]);

  const cartTotalAmount = cartDetailed.reduce((sum, i) => sum + (i?.total || 0), 0);
  const cartTotalDiscount = cartItems.reduce((sum, i) => sum + (i.discount || 0), 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomerId) {
      setFormError('لطفاً مشتری / دواخانه مورد نظر را انتخاب نمایید.');
      return;
    }

    if (cartItems.length === 0) {
      setFormError('سبد سفارش خالی است. لطفاً حداقل یک دارو اضافه کنید.');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const items: OrderItem[] = cartDetailed.map((i: any) => ({
      id: `it_${Date.now()}_${Math.random()}`,
      medicineId: i.medicine.id,
      medicineName: i.medicine.name,
      unit: i.medicine.unit,
      quantity: i.quantity,
      unitPrice: i.medicine.salePrice,
      discountAFN: i.discount,
      totalAFN: i.total,
    }));

    const newOrderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: newOrderNumber,
      storeId,
      customerId: customer.id,
      customerName: customer.name,
      visitorId,
      visitorName: currentUser?.name || 'ویزیتور',
      items,
      subtotalAFN: cartTotalAmount + cartTotalDiscount,
      discountAFN: cartTotalDiscount,
      totalAFN: cartTotalAmount,
      paidAmountAFN: 0,
      remainingAmountAFN: cartTotalAmount,
      status: 'submitted',
      paymentStatus: 'unpaid',
      notes,
      history: [
        {
          status: 'submitted',
          changedBy: visitorId,
          changedByName: currentUser?.name || 'ویزیتور',
          timestamp: new Date().toISOString(),
          note: 'سفارش در اپلیکیشن ویزیتور ثبت و به فروشگاه ارسال شد.',
        },
      ],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = Storage.getOrders(storeId);
    all.unshift(newOrder);
    Storage.saveOrders(all);

    reloadData();
    setIsModalOpen(false);
    setCartItems([]);
    setNotes('');
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) =>
      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(medSearch.toLowerCase())
    );
  }, [medicines, medSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <span>سفارشات من و ثبت فاکتور جدید ({orders.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت سریع در دواخانه، مشاهده فرآیند آماده‌سازی و ارسال در انبار فروشگاه
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportOrdersListToExcel(orders, 'My_Visitor_Orders')}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود اکسل سفارشات من"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>اکسل سفارشات</span>
          </button>

          <button
            onClick={() => exportOrdersListToPDF(orders, currentStore?.name || 'فروشگاه', 'My_Visitor_Orders')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود PDF سفارشات من"
          >
            <FileText className="w-4 h-4" />
            <span>PDF سفارشات</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت فاکتور دارویی جدید</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            تاکنون سفارشی ثبت نکرده‌اید. دکمه «ثبت فاکتور دارویی جدید» را بزنید.
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sky-700 text-xs">
                    {o.orderNumber}
                  </span>
                  <span className="text-slate-300">|</span>
                  <h3 className="font-bold text-slate-800 text-sm">{o.customerName}</h3>
                </div>
                <div className="text-xs text-slate-500">
                  {o.items.length} قلم دارو • تاریخ:{' '}
                  {new Date(o.createdAt).toLocaleDateString('fa-AF')}
                </div>
              </div>

              {/* Status and Financials */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-xs">
                    {o.totalAFN.toLocaleString()} AFN
                  </div>
                  <div className="text-[10px] text-slate-400">
                    مانده: {o.remainingAmountAFN.toLocaleString()} AFN
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                    o.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : o.status === 'shipped'
                      ? 'bg-purple-100 text-purple-800'
                      : o.status === 'preparing'
                      ? 'bg-blue-100 text-blue-800'
                      : o.status === 'approved'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {getOrderStatusTitle(o.status)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => exportOrderToPDF(o, currentStore?.name || 'فروشگاه')}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="فاکتور PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportOrderToExcel(o, currentStore?.name || 'فروشگاه')}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="فاکتور Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Order Modal (Mobile-first pharmacy ordering) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <span>ثبت فاکتور دارویی جدید</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Step 1: Customer selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  انتخاب دواخانه / مشتری تحت پوشش شما *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.managerName} - {c.area})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Medicine Picker with search */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">افزودن اقلام دارویی به سفارش:</span>
                </div>

                <div className="relative mb-2.5">
                  <input
                    type="text"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="جستجوی نام یا کد دارو در انبار..."
                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>

                {/* Available medicine pills */}
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {filteredMedicines.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-sky-300 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {m.images && m.images.length > 0 ? (
                          <img
                            src={m.images[0]}
                            alt={m.name}
                            onClick={() =>
                              setSelectedPhotoViewer({
                                url: m.images![0],
                                name: m.name,
                                code: m.code,
                              })
                            }
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-sky-400 transition flex-shrink-0"
                            title="کلیک برای مشاهده تصویر بزرگ دارو"
                          />
                        ) : (
                          <div
                            onClick={() => setSelectedDetailMed(m)}
                            className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold cursor-pointer hover:bg-sky-100 transition flex-shrink-0"
                            title="مشاهده مشخصات کامل دارو"
                          >
                            <Package className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailMed(m)}
                            className="font-bold text-slate-800 hover:text-sky-600 hover:underline text-right block truncate cursor-pointer"
                            title="مشاهده مشخصات کامل دارو"
                          >
                            {m.name}
                          </button>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span className="font-mono text-sky-700 font-bold">{m.code}</span>
                            <span>•</span>
                            <span>قیمت: {m.salePrice} AFN</span>
                            <span>•</span>
                            <span className={m.stock <= 5 ? 'text-rose-600 font-bold' : ''}>
                              موجودی: {m.stock} {m.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(m)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex-shrink-0 mr-2"
                      >
                        + افزودن
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Cart List */}
              {cartDetailed.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-slate-100 font-bold text-xs text-slate-700 flex justify-between">
                    <span>اقلام سفارش ({cartDetailed.length})</span>
                    <span>مبلغ کل: {cartTotalAmount.toLocaleString()} AFN</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                    {cartDetailed.map((item: any) => (
                      <div key={item.medicineId} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{item.medicine.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.medicine.salePrice} AFN × {item.quantity} = {item.total.toLocaleString()} AFN
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity || ''}
                            onChange={(e) => handleUpdateQty(item.medicineId, Math.max(1, parseNumberInput(e.target.value, 1)))}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs font-bold font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.medicineId)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  توضیحات و شرایط تحویل (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: تحویل قبل از ساعت ۱۲ ظهر"
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
                  disabled={cartItems.length === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-40"
                >
                  ثبت قطعی و ارسال به فروشگاه
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
        onSelectForOrder={(med) => handleAddToCart(med)}
      />

      {/* Interactive Full-size Image Viewer Modal */}
      <MedicineImageViewerModal
        isOpen={Boolean(selectedPhotoViewer)}
        onClose={() => setSelectedPhotoViewer(null)}
        imageUrl={selectedPhotoViewer?.url || null}
        title={selectedPhotoViewer?.name}
        code={selectedPhotoViewer?.code}
      />
    </div>
  );
};
