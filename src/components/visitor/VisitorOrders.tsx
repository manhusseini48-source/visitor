import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage, getEffectiveStoreId } from '../../utils/storage';
import { SupabaseSync } from '../../utils/supabaseSync';
import { Order, OrderItem, Medicine, Customer, VisitorCashCollection, OrderPaymentRecord } from '../../types';
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
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Pill,
  CreditCard,
} from 'lucide-react';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const VisitorOrders: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = getEffectiveStoreId(currentUser, currentStore);

  const isCashCollectionAllowed =
    (currentStore?.allowVisitorCashCollection ?? true) &&
    (currentUser?.allowCashCollection ?? true);

  const [orders, setOrders] = useState<Order[]>(() =>
    Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId)
  );

  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    Storage.getMedicines(storeId)
  );

  const customers = useMemo(
    () =>
      Storage.getCustomers(storeId).filter(
        (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
      ),
    [storeId, visitorId]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );

  // Expanded order card ID
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cart Items
  const [cartItems, setCartItems] = useState<
    { medicineId: string; quantity: number; discount: number }[]
  >([]);

  const [medSearch, setMedSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Payment Collection inside order creation
  const [paymentType, setPaymentType] = useState<'credit' | 'deposit' | 'full'>('credit');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_to_card' | 'bank_receipt'>('cash');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Detail and Image preview modals
  const [selectedDetailMed, setSelectedDetailMed] = useState<Medicine | null>(null);
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState<{
    url: string | null;
    name: string;
    code: string;
  } | null>(null);

  // In-person debt/installment collection on existing order modal
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [orderPaymentAmount, setOrderPaymentAmount] = useState<number>(0);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'cash' | 'card_to_card' | 'bank_receipt'>('cash');
  const [orderPaymentReceipt, setOrderPaymentReceipt] = useState('');
  const [orderPaymentNote, setOrderPaymentNote] = useState('');
  const [orderPaymentError, setOrderPaymentError] = useState<string | null>(null);

  const reloadData = () => {
    setOrders(Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId));
    setMedicines(Storage.getMedicines(storeId));
  };

  useEffect(() => {
    reloadData();
    SupabaseSync.pullStoreCloudData(storeId)
      .then((res) => {
        if (res.medicines && res.medicines.length > 0) {
          Storage.mergeCloudMedicines(res.medicines, storeId);
        }
        if (res.orders && res.orders.length > 0) {
          Storage.mergeCloudOrders(res.orders, storeId);
        }
        reloadData();
      })
      .catch(() => {});

    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storeId, visitorId]);

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

  // Sync deposit default
  useEffect(() => {
    if (paymentType === 'full') {
      setDepositAmount(cartTotalAmount);
    } else if (paymentType === 'credit') {
      setDepositAmount(0);
    }
  }, [paymentType, cartTotalAmount]);

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

    // Check collected amount
    let collectedAmount = 0;
    if (isCashCollectionAllowed) {
      if (paymentType === 'full') {
        collectedAmount = cartTotalAmount;
      } else if (paymentType === 'deposit') {
        if (depositAmount <= 0) {
          setFormError('لطفاً مبلغ معتبر بیعانه را وارد کنید.');
          return;
        }
        if (depositAmount > cartTotalAmount) {
          setFormError('مبلغ بیعانه نمی‌تواند از کل مبلغ بیشتر باشد.');
          return;
        }
        collectedAmount = depositAmount;
      }
    }

    const items: OrderItem[] = cartDetailed.map((i: any) => ({
      id: `it_${Date.now()}_${Math.random()}`,
      medicineId: i.medicine.id,
      medicineName: i.medicine.name,
      dosageForm: i.medicine.dosageForm || 'قرص',
      strength: i.medicine.strength || '',
      unit: i.medicine.unit || 'بسته',
      quantity: i.quantity,
      unitPrice: i.medicine.salePrice,
      discountAFN: i.discount,
      totalAFN: i.total,
      batchNumber: i.medicine.batchNumber || '',
    }));

    const newOrderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = `ord_${Date.now()}`;

    const paymentsList: OrderPaymentRecord[] = [];
    if (collectedAmount > 0) {
      paymentsList.push({
        id: `pay_${Date.now()}`,
        amountAFN: collectedAmount,
        date: new Date().toISOString(),
        registeredBy: currentUser?.name || 'ویزیتور',
        receiptNumber: receiptNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        note:
          paymentType === 'full'
            ? 'تسویه نقدی کامل توسط ویزیتور'
            : `بیعانه نقدی دریافتی توسط ویزیتور (${paymentMethod === 'cash' ? 'نقدی' : paymentMethod === 'card_to_card' ? 'کارت‌به‌کارت' : 'فیش'})`,
      });
    }

    const remainingAmount = Math.max(0, cartTotalAmount - collectedAmount);

    const newOrder: Order = {
      id: newOrderId,
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
      paidAmountAFN: collectedAmount,
      remainingAmountAFN: remainingAmount,
      status: 'submitted',
      paymentStatus:
        collectedAmount >= cartTotalAmount
          ? 'paid'
          : collectedAmount > 0
          ? 'partial'
          : 'unpaid',
      notes,
      history: [
        {
          status: 'submitted',
          changedBy: visitorId,
          changedByName: currentUser?.name || 'ویزیتور',
          timestamp: new Date().toISOString(),
          note:
            collectedAmount > 0
              ? `ثبت سفارش همراه با دریافت ${collectedAmount.toLocaleString()} AFN بیعانه/نقد`
              : 'سفارش در اپلیکیشن ویزیتور ثبت و به فروشگاه ارسال شد.',
        },
      ],
      payments: paymentsList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = Storage.getOrders(storeId);
    all.unshift(newOrder);
    Storage.saveOrders(all, storeId);

    // If money was collected, record in VisitorCashCollection
    if (collectedAmount > 0) {
      const collectionRecord: VisitorCashCollection = {
        id: `col_${Date.now()}`,
        storeId,
        visitorId,
        visitorName: currentUser?.name || 'ویزیتور',
        orderId: newOrderId,
        orderNumber: newOrderNumber,
        customerId: customer.id,
        customerName: customer.name,
        amountAFN: collectedAmount,
        collectionType: paymentType === 'full' ? 'full_payment' : 'deposit',
        paymentMethod: paymentMethod,
        receiptNumber: receiptNumber || undefined,
        notes: `دریافت هنگام ثبت سفارش ${newOrderNumber}`,
        date: new Date().toISOString(),
        status: 'in_hand',
      };

      const allCols = Storage.getCashCollections(storeId);
      allCols.unshift(collectionRecord);
      Storage.saveCashCollections(allCols, storeId);
    }

    reloadData();
    setIsModalOpen(false);
    setCartItems([]);
    setNotes('');
    setPaymentType('credit');
    setDepositAmount(0);
    setReceiptNumber('');
  };

  const handleRecordOrderPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderPaymentError(null);
    if (!selectedOrderForPayment || orderPaymentAmount <= 0) {
      setOrderPaymentError('لطفاً مبلغ معتبر برای دریافت وارد نمایید.');
      return;
    }

    if (orderPaymentAmount > selectedOrderForPayment.remainingAmountAFN) {
      setOrderPaymentError(
        `مبلغ دریافتی نمی‌تواند بیشتر از مانده طلب فاکتور (${selectedOrderForPayment.remainingAmountAFN.toLocaleString()} AFN) باشد.`
      );
      return;
    }

    const payAmount = orderPaymentAmount;
    const newPaid = selectedOrderForPayment.paidAmountAFN + payAmount;
    const newRemaining = Math.max(0, selectedOrderForPayment.totalAFN - newPaid);
    const newPaymentStatus = newRemaining === 0 ? ('paid' as const) : ('partial' as const);

    const paymentRecord: OrderPaymentRecord = {
      id: `pay_${Date.now()}`,
      amountAFN: payAmount,
      date: new Date().toISOString(),
      registeredBy: currentUser?.name || 'ویزیتور',
      receiptNumber: orderPaymentReceipt.trim() || undefined,
      note: orderPaymentNote.trim() || `دریافت طلب فاکتور توسط ${currentUser?.name || 'ویزیتور'}`,
    };

    const updatedOrder: Order = {
      ...selectedOrderForPayment,
      paidAmountAFN: newPaid,
      remainingAmountAFN: newRemaining,
      paymentStatus: newPaymentStatus,
      payments: [...(selectedOrderForPayment.payments || []), paymentRecord],
      updatedAt: new Date().toISOString(),
    };

    const allOrders = Storage.getOrders(storeId);
    const updatedAllOrders = allOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    Storage.saveOrders(updatedAllOrders, storeId);

    // Record cash collection for this visitor in hand
    const collectionRecord: VisitorCashCollection = {
      id: `col_${Date.now()}`,
      storeId,
      visitorId,
      visitorName: currentUser?.name || 'ویزیتور',
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customerId: updatedOrder.customerId,
      customerName: updatedOrder.customerName,
      amountAFN: payAmount,
      collectionType: 'installment',
      paymentMethod: orderPaymentMethod,
      receiptNumber: orderPaymentReceipt.trim() || undefined,
      notes: orderPaymentNote.trim() || `دریافت مانده طلب فاکتور ${updatedOrder.orderNumber}`,
      date: new Date().toISOString(),
      status: 'in_hand',
    };
    const allCols = Storage.getCashCollections(storeId);
    allCols.unshift(collectionRecord);
    Storage.saveCashCollections(allCols, storeId);

    setSelectedOrderForPayment(null);
    setOrderPaymentAmount(0);
    setOrderPaymentReceipt('');
    setOrderPaymentNote('');
    setOrderPaymentError(null);
    reloadData();
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) =>
      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(medSearch.toLowerCase()) ||
      (m.dosageForm && m.dosageForm.toLowerCase().includes(medSearch.toLowerCase()))
    );
  }, [medicines, medSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <span>سفارشات من و ثبت فاکتور دارویی ({orders.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            فهرست فاکتورهای ثبت‌شده، پیگیری وضعیت آماده‌سازی در انبار و صدور فاکتور جدید
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('gallery')}
              className="px-3.5 py-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>گالری داروها و صدور فاکتور</span>
            </button>
          )}

          <button
            onClick={() => exportOrdersListToExcel(orders, 'My_Visitor_Orders')}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود اکسل سفارشات من"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>اکسل سفارشات</span>
          </button>

          <button
            onClick={() =>
              exportOrdersListToPDF(
                orders,
                currentStore?.name || 'فروشگاه',
                'My_Visitor_Orders'
              )
            }
            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
            <span>ثبت سریع فاکتور</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs">
            تاکنون سفارشی ثبت نکرده‌اید. با دکمه «گالری داروها و صدور فاکتور» یا «ثبت سریع فاکتور» شروع کنید.
          </div>
        ) : (
          orders.map((o) => {
            const isExpanded = expandedOrderId === o.id;

            return (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition"
              >
                {/* Order Summary Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-700 dark:text-sky-400 text-xs bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-200/60 dark:border-sky-800/60">
                        {o.orderNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        {o.customerName}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span>{o.items.length} قلم دارو</span>
                      <span>•</span>
                      <span>تاریخ: {new Date(o.createdAt).toLocaleDateString('fa-AF')}</span>
                      {o.paidAmountAFN > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            بیعانه دریافتی: {o.paidAmountAFN.toLocaleString()} AFN
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status, Financials & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm font-mono">
                        {o.totalAFN.toLocaleString()} AFN
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        مانده: {o.remainingAmountAFN.toLocaleString()} AFN
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl font-bold text-xs ${
                        o.status === 'delivered'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : o.status === 'shipped'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                          : o.status === 'preparing'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : o.status === 'approved'
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {getOrderStatusTitle(o.status)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportOrderToPDF(o, currentStore?.name || 'فروشگاه')}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
                        title="چاپ فاکتور رسمی PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportOrderToExcel(o, currentStore?.name || 'فروشگاه')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition cursor-pointer"
                        title="دانلود اکسل فاکتور"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                        className="px-2.5 py-1.5 text-xs text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>اقلام فاکتور</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isCashCollectionAllowed && o.remainingAmountAFN > 0 && (
                        <button
                          onClick={() => {
                            setSelectedOrderForPayment(o);
                            setOrderPaymentAmount(o.remainingAmountAFN);
                            setOrderPaymentReceipt('');
                            setOrderPaymentNote('');
                            setOrderPaymentError(null);
                          }}
                          className="px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                          title="ثبت دریافت وجه نقد یا بیعانه مجدد از دواخانه"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>دریافت طلب</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Items Table (Strictly showing medicine type, quantity, unit price, total) */}
                {isExpanded && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-sky-600" />
                      <span>ریز اقلام دارویی ثبت‌شده در فاکتور:</span>
                    </h4>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-900">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3">ردیف</th>
                            <th className="py-2.5 px-3">شرح دارو</th>
                            <th className="py-2.5 px-3">نوع / شکل دارو</th>
                            <th className="py-2.5 px-3">واحد</th>
                            <th className="py-2.5 px-3">تعداد</th>
                            <th className="py-2.5 px-3">قیمت واحد (AFN)</th>
                            <th className="py-2.5 px-3">تخفیف (AFN)</th>
                            <th className="py-2.5 px-3">مبلغ کل (AFN)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {o.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                  {item.medicineName}
                                </span>
                                {item.strength && (
                                  <span className="text-[10px] text-sky-600 font-mono">
                                    دوز: {item.strength}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[11px] border border-sky-200/50">
                                  {item.dosageForm || 'قرص'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{item.unit || 'بسته'}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                                {item.unitPrice.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-rose-500">
                                {item.discountAFN ? `-${item.discountAFN.toLocaleString()}` : '۰'}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {item.totalAFN.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {o.notes && (
                      <p className="text-[11px] text-slate-500 mt-2">
                        یادداشت سفارش: {o.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <span>ثبت فاکتور دارویی سریع</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب دواخانه / مشتری تحت پوشش شما *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.managerName} - {c.area})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Medicine Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    افزودن اقلام دارویی از انبار
                  </label>
                </div>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="جستجو بر اساس نام دارو، کد یا شکل دارویی..."
                    className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
                  {filteredMedicines.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {med.name} ({med.dosageForm || 'قرص'})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          قیمت: {med.salePrice.toLocaleString()} AFN • موجودی: {med.stock} {med.unit}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(med)}
                        disabled={med.stock <= 0}
                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold disabled:opacity-30 cursor-pointer"
                      >
                        + افزودن
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Cart Items */}
              {cartItems.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اقلام انتخابی فاکتور:
                  </div>
                  {cartDetailed.map((item: any) => (
                    <div
                      key={item.medicine.id}
                      className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate text-slate-800 dark:text-slate-100">
                          {item.medicine.name} ({item.medicine.dosageForm || 'قرص'})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          فی: {item.medicine.salePrice.toLocaleString()} AFN
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={item.medicine.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQty(item.medicine.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.medicine.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>جمع کل فاکتور:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {cartTotalAmount.toLocaleString()} AFN
                    </span>
                  </div>
                </div>
              )}

              {/* Step 4: Advance Payment Collection */}
              {isCashCollectionAllowed && cartItems.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                  <div className="text-xs font-black text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>دریافت بیعانه یا وجه نقدی توسط ویزیتور:</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType('credit')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        paymentType === 'credit'
                          ? 'bg-sky-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      نسیه (بدون بیعانه)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('deposit')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        paymentType === 'deposit'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      دریافت بیعانه
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('full')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        paymentType === 'full'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      تسویه کل مبلغ
                    </button>
                  </div>

                  {paymentType !== 'credit' && (
                    <div className="space-y-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            مبلغ دریافتی (AFN):
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={cartTotalAmount}
                            value={depositAmount || ''}
                            onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            روش دریافت:
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                          >
                            <option value="cash">نقدی حضوری</option>
                            <option value="card_to_card">کارت به کارت</option>
                            <option value="bank_receipt">فیش بانکی</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300">
                        مبلغ به صندوق وصولی شما اضافه می‌شود و پس از انتقال به فروشگاه و تایید مدیریت تسویه می‌گردد.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و شرایط ارسال:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="یادداشت‌های سفارش..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-40 cursor-pointer"
                >
                  ثبت قطعی و ارسال به فروشگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt / Installment Collection Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    دریافت وجه نقد / طلب از دواخانه
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    فاکتور: {selectedOrderForPayment.orderNumber} ({selectedOrderForPayment.customerName})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderPaymentError && (
              <div className="mb-4 bg-rose-50 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{orderPaymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordOrderPayment} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">مانده فعلی فاکتور:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                  {selectedOrderForPayment.remainingAmountAFN.toLocaleString()} AFN
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ دریافتی از دواخانه (AFN) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={orderPaymentAmount || ''}
                  onChange={(e) => setOrderPaymentAmount(parseNumberInput(e.target.value))}
                  placeholder="مبلغ پرداختی را وارد کنید"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  روش دریافت وجه
                </label>
                <select
                  value={orderPaymentMethod}
                  onChange={(e) => setOrderPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="cash">نقدی حضوری</option>
                  <option value="card_to_card">انتقال کارت به کارت</option>
                  <option value="bank_receipt">فیش بانکی مستقیم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره رسید یا فیش (اختیاری)
                </label>
                <input
                  type="text"
                  value={orderPaymentReceipt}
                  onChange={(e) => setOrderPaymentReceipt(e.target.value)}
                  placeholder="مثال: REF-98745"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و بابت (اختیاری)
                </label>
                <input
                  type="text"
                  value={orderPaymentNote}
                  onChange={(e) => setOrderPaymentNote(e.target.value)}
                  placeholder="مثال: تسویه قسط اول دواخانه"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  ثبت دریافت و افزودن به صندوق
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
