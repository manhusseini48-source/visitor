import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Medicine, Customer, Order, OrderItem, OrderPaymentRecord, VisitorCashCollection } from '../../types';
import { parseNumberInput } from '../../utils/numberUtils';
import { exportOrderToPDF } from '../../utils/exportDocs';
import { MedicineDetailsModal } from '../common/MedicineDetailsModal';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';
import {
  Sparkles,
  Search,
  Filter,
  ShoppingCart,
  Pill,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Phone,
  MapPin,
  FileText,
  Clock,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Package,
} from 'lucide-react';

interface CartItemState {
  medicine: Medicine;
  quantity: number;
  discount: number;
}

interface Props {
  onNavigateTab?: (tab: string) => void;
  initialSelectedCustomerId?: string;
}

export const VisitorMedicineGallery: React.FC<Props> = ({
  onNavigateTab,
  initialSelectedCustomerId,
}) => {
  const { currentStore, currentUser } = useApp();
  const storeId = currentStore?.id || currentUser?.storeId || '';
  const visitorId = currentUser?.id || '';

  // Store setting for allowing visitor to collect cash/deposit
  const isCashCollectionAllowed =
    (currentStore?.allowVisitorCashCollection ?? true) &&
    (currentUser?.allowCashCollection ?? true);

  // Load medicines and customers
  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    Storage.getMedicines(storeId)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    Storage.getCustomers(storeId).filter(
      (c) =>
        c.primaryVisitorId === visitorId ||
        (c.sharedVisitorIds || []).includes(visitorId)
    )
  );

  const reloadData = () => {
    setMedicines(Storage.getMedicines(storeId));
    setCustomers(
      Storage.getCustomers(storeId).filter(
        (c) =>
          c.primaryVisitorId === visitorId ||
          (c.sharedVisitorIds || []).includes(visitorId)
      )
    );
  };

  useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storeId, visitorId]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dosageFilter, setDosageFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock'>('name');

  // Detail & Photo Modals
  const [selectedDetailMed, setSelectedDetailMed] = useState<Medicine | null>(null);
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState<{
    url: string | null;
    name: string;
    code: string;
  } | null>(null);

  // Cart / Order Builder State
  const [cart, setCart] = useState<Record<string, CartItemState>>({});
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

  // Customer selection / Creation in Invoice
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialSelectedCustomerId || (customers[0]?.id || '')
  );

  // New Customer Form
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('کابل');
  const [saveAsRegisteredCustomer, setSaveAsRegisteredCustomer] = useState(true);

  // Payment / Deposit collection state
  const [paymentType, setPaymentType] = useState<'credit' | 'deposit' | 'full'>('credit');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_to_card' | 'bank_receipt'>('cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Extract unique categories and dosage forms
  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [medicines]);

  const dosageForms = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach((m) => {
      if (m.dosageForm) set.add(m.dosageForm);
    });
    return Array.from(set);
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((m) => {
        const query = searchQuery.trim().toLowerCase();
        const matchSearch =
          !query ||
          m.name.toLowerCase().includes(query) ||
          m.brand.toLowerCase().includes(query) ||
          m.code.toLowerCase().includes(query) ||
          (m.strength && m.strength.toLowerCase().includes(query)) ||
          (m.dosageForm && m.dosageForm.toLowerCase().includes(query));

        const matchCat = categoryFilter === 'all' || m.category === categoryFilter;
        const matchDosage = dosageFilter === 'all' || m.dosageForm === dosageFilter;

        return matchSearch && matchCat && matchDosage;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.salePrice - b.salePrice;
        if (sortBy === 'price_desc') return b.salePrice - a.salePrice;
        if (sortBy === 'stock') return b.stock - a.stock;
        return a.name.localeCompare(b.name, 'fa');
      });
  }, [medicines, searchQuery, categoryFilter, dosageFilter, sortBy]);

  // Cart helper functions
  const addToCart = (med: Medicine, delta = 1) => {
    setCart((prev) => {
      const existing = prev[med.id];
      const newQty = (existing?.quantity || 0) + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[med.id];
        return next;
      }
      return {
        ...prev,
        [med.id]: {
          medicine: med,
          quantity: newQty,
          discount: existing?.discount || 0,
        },
      };
    });
  };

  const updateCartQty = (medId: string, qty: number) => {
    setCart((prev) => {
      if (!prev[medId]) return prev;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[medId];
        return next;
      }
      return {
        ...prev,
        [medId]: {
          ...prev[medId],
          quantity: qty,
        },
      };
    });
  };

  const updateCartDiscount = (medId: string, disc: number) => {
    setCart((prev) => {
      if (!prev[medId]) return prev;
      return {
        ...prev,
        [medId]: {
          ...prev[medId],
          discount: Math.max(0, disc),
        },
      };
    });
  };

  const removeFromCart = (medId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[medId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Cart calculations
  const cartList = useMemo(() => Object.values(cart), [cart]);
  const cartItemsCount = cartList.length;
  const cartTotalQuantity = cartList.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cartList.reduce(
    (sum, item) => sum + item.medicine.salePrice * item.quantity,
    0
  );

  const cartTotalDiscount = cartList.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );

  const cartGrandTotal = Math.max(0, cartSubtotal - cartTotalDiscount);

  // Sync deposit default when switching payment type
  useEffect(() => {
    if (paymentType === 'full') {
      setDepositAmount(cartGrandTotal);
    } else if (paymentType === 'credit') {
      setDepositAmount(0);
    }
  }, [paymentType, cartGrandTotal]);

  // Submit Order / Invoice Handler
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cartItemsCount === 0) {
      setFormError('سبد فاکتور خالی است. لطفاً ابتدا داروها را به فاکتور اضافه کنید.');
      return;
    }

    let customerIdToUse = '';
    let customerNameToUse = '';

    if (customerMode === 'existing') {
      if (!selectedCustomerId) {
        setFormError('لطفاً دواخانه مورد نظر را انتخاب نمایید.');
        return;
      }
      const existing = customers.find((c) => c.id === selectedCustomerId);
      if (!existing) {
        setFormError('دواخانه انتخاب‌شده یافت نشد.');
        return;
      }
      customerIdToUse = existing.id;
      customerNameToUse = existing.name;
    } else {
      // New Customer
      if (!newCustomerName.trim()) {
        setFormError('لطفاً نام دواخانه را وارد کنید.');
        return;
      }
      if (!newPhone.trim()) {
        setFormError('شماره تماس دواخانه الزامی است.');
        return;
      }

      customerIdToUse = `cust_${Date.now()}`;
      customerNameToUse = newCustomerName.trim();

      // If user selected to save as registered customer
      if (saveAsRegisteredCustomer) {
        const newCustomerObj: Customer = {
          id: customerIdToUse,
          storeId,
          name: customerNameToUse,
          managerName: newDoctorName.trim() || 'دکتر / مسئول دواخانه',
          phone: newPhone.trim(),
          address: newAddress.trim() || 'آدرس ثبت‌شده توسط ویزیتور',
          city: newCity.trim() || 'کابل',
          area: 'مرکز',
          createdBy: visitorId,
          primaryVisitorId: visitorId,
          sharedVisitorIds: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          totalOrdersCount: 1,
          totalOrderAmount: cartGrandTotal,
        };
        const allCust = Storage.getCustomers(storeId);
        allCust.unshift(newCustomerObj);
        Storage.saveCustomers(allCust);
        setCustomers((prev) => [newCustomerObj, ...prev]);
        setSelectedCustomerId(newCustomerObj.id);
      }
    }

    // Verify Deposit Amount
    let collectedAmount = 0;
    if (isCashCollectionAllowed) {
      if (paymentType === 'full') {
        collectedAmount = cartGrandTotal;
      } else if (paymentType === 'deposit') {
        if (depositAmount <= 0) {
          setFormError('لطفاً مبلغ معتبر بیعانه را وارد کنید.');
          return;
        }
        if (depositAmount > cartGrandTotal) {
          setFormError('مبلغ بیعانه نمی‌تواند بیشتر از کل مبلغ فاکتور باشد.');
          return;
        }
        collectedAmount = depositAmount;
      }
    }

    // Build Order Items
    const orderItems: OrderItem[] = cartList.map((item) => {
      const lineSubtotal = item.medicine.salePrice * item.quantity;
      const lineTotal = Math.max(0, lineSubtotal - item.discount);
      return {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        dosageForm: item.medicine.dosageForm || 'قرص',
        strength: item.medicine.strength || '',
        unit: item.medicine.unit || 'بسته',
        quantity: item.quantity,
        unitPrice: item.medicine.salePrice,
        discountAFN: item.discount,
        totalAFN: lineTotal,
        batchNumber: item.medicine.batchNumber || '',
      };
    });

    const newOrderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = `ord_${Date.now()}`;

    // Payments Record
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
            ? 'تسویه نقدی کامل توسط ویزیتور در دواخانه'
            : `بیعانه نقدی دریافتی توسط ویزیتور (${paymentMethod === 'cash' ? 'نقدی' : paymentMethod === 'card_to_card' ? 'کارت‌به‌کارت' : 'فیش'})`,
      });
    }

    const remainingAmount = Math.max(0, cartGrandTotal - collectedAmount);

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      storeId,
      customerId: customerIdToUse,
      customerName: customerNameToUse,
      visitorId,
      visitorName: currentUser?.name || 'ویزیتور',
      items: orderItems,
      subtotalAFN: cartSubtotal,
      discountAFN: cartTotalDiscount,
      totalAFN: cartGrandTotal,
      paidAmountAFN: collectedAmount,
      remainingAmountAFN: remainingAmount,
      status: 'submitted',
      paymentStatus:
        collectedAmount >= cartGrandTotal
          ? 'paid'
          : collectedAmount > 0
          ? 'partial'
          : 'unpaid',
      notes: orderNotes.trim() || undefined,
      history: [
        {
          status: 'submitted',
          changedBy: visitorId,
          changedByName: currentUser?.name || 'ویزیتور',
          timestamp: new Date().toISOString(),
          note:
            collectedAmount > 0
              ? `ثبت فاکتور از گالری همراه با دریافت ${collectedAmount.toLocaleString()} AFN بیعانه/وجه نقد`
              : 'ثبت فاکتور دارویی از گالری پرزنتیشن مشتری',
        },
      ],
      payments: paymentsList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save Order
    const allOrders = Storage.getOrders(storeId);
    allOrders.unshift(newOrder);
    Storage.saveOrders(allOrders);

    // If money was collected, record in VisitorCashCollection
    if (collectedAmount > 0) {
      const collectionRecord: VisitorCashCollection = {
        id: `col_${Date.now()}`,
        storeId,
        visitorId,
        visitorName: currentUser?.name || 'ویزیتور',
        orderId: newOrderId,
        orderNumber: newOrderNumber,
        customerId: customerIdToUse,
        customerName: customerNameToUse,
        amountAFN: collectedAmount,
        collectionType: paymentType === 'full' ? 'full_payment' : 'deposit',
        paymentMethod: paymentMethod,
        receiptNumber: receiptNumber || undefined,
        notes: `دریافت هنگام صدور فاکتور ${newOrderNumber}`,
        date: new Date().toISOString(),
        status: 'in_hand', // Must be transferred and approved by store
      };

      const allCols = Storage.getCashCollections(storeId);
      allCols.unshift(collectionRecord);
      Storage.saveCashCollections(allCols, storeId);
    }

    // Success State
    setCompletedOrder(newOrder);
    setCart({});
    setIsInvoiceDrawerOpen(false);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header & Presentation Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-sky-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-black border border-sky-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                حالت ویژه پرزنتیشن و نمایش به داکتر و مشتری
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-300 text-xs font-mono">{medicines.length} قلم دارو در انبار</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <Pill className="w-6 h-6 text-sky-400 rotate-45" />
              <span>گالری داروها و صدور فاکتور مشتری</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              داروها را با عکس، دوز، شکل دارویی و قیمت واحد به دکتر یا صاحب دواخانه نشان دهید، با یک کلیک به پیش‌فاکتور اضافه کنید و فاکتور رسمی را بلافاصله صادر نمایید.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Cash collection status indicator */}
            <div
              className={`px-3 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                isCashCollectionAllowed
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>
                {isCashCollectionAllowed
                  ? 'دریافت بیعانه و پول نقد: فعال'
                  : 'دریافت بیعانه: غیرفعال توسط فروشگاه'}
              </span>
            </div>

            {cartItemsCount > 0 && (
              <button
                type="button"
                onClick={() => setIsInvoiceDrawerOpen(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>مشاهده فاکتور ({cartTotalQuantity})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Modal when order is completed */}
      {completedOrder && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/60 p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <span>فاکتور دارویی رسمی با موفقیت ثبت و ارسال شد!</span>
                <span className="font-mono text-xs bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-lg font-bold">
                  {completedOrder.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                دواخانه: <strong>{completedOrder.customerName}</strong> • مبلغ کل: {completedOrder.totalAFN.toLocaleString()} AFN •
                بیعانه دریافتی: {completedOrder.paidAmountAFN.toLocaleString()} AFN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportOrderToPDF(completedOrder, currentStore?.name || 'فروشگاه دارویی')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور رسمی PDF</span>
            </button>
            <button
              onClick={() => {
                setCompletedOrder(null);
                if (onNavigateTab) onNavigateTab('orders');
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>مشاهده در سفارشات</span>
            </button>
            <button
              onClick={() => setCompletedOrder(null)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سریع دارو، نام تجاری، دوز (مثلاً 500mg) یا کد کالا..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Dosage Form Filter */}
          <div className="flex items-center gap-2">
            <select
              value={dosageFilter}
              onChange={(e) => setDosageFilter(e.target.value)}
              aria-label="فیلتر بر اساس شکل دارویی"
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">همه اشکال دارویی</option>
              {dosageForms.map((d) => (
                <option key={d} value={d}>
                  شکل: {d}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="فیلتر بر اساس دسته‌بندی دارویی"
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  دسته: {c}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="مرتب‌سازی داروها"
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="name">مرتب‌سازی: نام دارو</option>
              <option value="price_asc">قیمت: ارزان‌ترین</option>
              <option value="price_desc">قیمت: گران‌ترین</option>
              <option value="stock">بیشترین موجودی</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 ml-1">دسترسی سریع شکل دارو:</span>
          {['قرص', 'کپسول', 'شربت', 'آمپول', 'پماد', 'قطره', 'سرم'].map((form) => (
            <button
              key={form}
              type="button"
              onClick={() => setDosageFilter(dosageFilter === form ? 'all' : form)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                dosageFilter === form
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {form}
            </button>
          ))}
          {(categoryFilter !== 'all' || dosageFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setDosageFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-rose-500 hover:underline mr-auto cursor-pointer"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Medicines Gallery Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Pill className="w-8 h-8 rotate-45" />
          </div>
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">
            دارویی با این مشخصات یافت نشد
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            عبارت جستجو یا فیلترهای انتخابی را تغییر دهید تا لیست داروها نمایش داده شود.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedicines.map((med) => {
            const inCartItem = cart[med.id];
            const currentQty = inCartItem?.quantity || 0;
            const isOutOfStock = med.stock <= 0;

            return (
              <div
                key={med.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition duration-200 flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md ${
                  currentQty > 0
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800'
                }`}
              >
                {/* Medicine Presentation Image / Header */}
                <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 p-4 pb-3 flex items-center justify-center min-h-[140px] overflow-hidden">
                  {/* Category & Dosage Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white shadow-2xs">
                      {med.dosageForm || 'دارو'}
                    </span>
                    {med.strength && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 shadow-2xs font-mono">
                        {med.strength}
                      </span>
                    )}
                  </div>

                  {/* Stock Status Pill */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs ${
                        isOutOfStock
                          ? 'bg-rose-500 text-white'
                          : med.stock <= (med.minStockAlert || 10)
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isOutOfStock
                        ? 'ناموجود'
                        : `موجودی: ${med.stock} ${med.unit || 'بسته'}`}
                    </span>
                  </div>

                  {/* Product Image or Fallback Visual Icon */}
                  {med.images && med.images.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPhotoViewer({
                          url: med.images[0],
                          name: med.name,
                          code: med.code,
                        })
                      }
                      className="cursor-zoom-in group-hover:scale-105 transition duration-300 w-full h-28 flex items-center justify-center"
                    >
                      <img
                        src={med.images[0]}
                        alt={med.name}
                        className="max-h-28 max-w-full object-contain drop-shadow-sm rounded-lg"
                      />
                    </button>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-sky-100/70 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-105 transition">
                      <Pill className="w-10 h-10 rotate-45" />
                    </div>
                  )}

                  {/* Expiry Badge */}
                  {med.expiryDate && (
                    <div className="absolute bottom-1.5 right-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>انقضا: {med.expiryDate}</span>
                    </div>
                  )}
                </div>

                {/* Card Content & Scientific Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-snug">
                          {med.name}
                        </h4>
                        <div className="text-[11px] font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                          {med.brand || 'برند رسمی'} • <span className="font-mono text-slate-400 text-[10px]">کد: {med.code}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDetailMed(med)}
                        className="text-[10px] text-sky-600 hover:text-sky-700 font-bold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 px-2 py-1 rounded-lg border border-sky-200/60 dark:border-sky-800 transition cursor-pointer flex-shrink-0"
                        title="مشاهده اطلاعات علمی و مشخصات دارو"
                      >
                        جزئیات
                      </button>
                    </div>

                    {med.shortDescription && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {med.shortDescription}
                      </p>
                    )}
                  </div>

                  {/* Price Tag & Customer Add to Invoice */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-400">قیمت واحد به مشتری:</span>
                      <div className="text-left">
                        <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                          {med.salePrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 mr-1">AFN</span>
                      </div>
                    </div>

                    {/* Quantity Selector / Add Button */}
                    {currentQty > 0 ? (
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-1">
                        <button
                          type="button"
                          onClick={() => addToCart(med, 1)}
                          disabled={med.stock <= currentQty}
                          className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <div className="text-center font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                          {currentQty} <span className="text-[10px] font-normal">{med.unit || 'بسته'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart(med, -1)}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-base hover:bg-slate-100 transition cursor-pointer"
                        >
                          {currentQty === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(med, 1)}
                        disabled={isOutOfStock}
                        className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                          isOutOfStock
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20 active:scale-98'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>افزودن به فاکتور مشتری</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Bar for Invoice Checkout */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-3 left-4 right-4 md:left-8 md:right-8 z-40 max-w-5xl mx-auto">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 md:p-4 rounded-3xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>پیش‌فاکتور مشتری</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold text-emerald-400">
                    {cartItemsCount} قلم دارو ({cartTotalQuantity} عدد)
                  </span>
                </div>
                <div className="text-base md:text-lg font-black text-white font-mono mt-0.5">
                  {cartGrandTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">AFN</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="px-3 py-2 text-slate-400 hover:text-rose-400 text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => setIsInvoiceDrawerOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs md:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>تکمیل و ثبت نهایی فاکتور</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Finalization Modal / Drawer */}
      {isInvoiceDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 md:p-5 bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-base text-white">
                    ثبت نهایی فاکتور دارویی و دریافت وجه
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    بررسی اقلام فاکتور، ورود اطلاعات دواخانه و ثبت بیعانه نقدی ویزیتور
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmitInvoice} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Medicines Detailed Table (Strictly showing dosage form, quantity, unit price, total) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-sky-600" />
                    <span>اقلام دارویی فاکتور ({cartItemsCount} قلم)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    مجموع تعداد: {cartTotalQuantity} عدد
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">ردیف</th>
                        <th className="py-2.5 px-3">نام دارو و مشخصات</th>
                        <th className="py-2.5 px-3">نوع / شکل دارو</th>
                        <th className="py-2.5 px-3">واحد</th>
                        <th className="py-2.5 px-3">تعداد</th>
                        <th className="py-2.5 px-3">قیمت فی (AFN)</th>
                        <th className="py-2.5 px-3">تخفیف (AFN)</th>
                        <th className="py-2.5 px-3">مبلغ کل</th>
                        <th className="py-2.5 px-2">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cartList.map((item, index) => {
                        const lineSub = item.medicine.salePrice * item.quantity;
                        const lineTotal = Math.max(0, lineSub - item.discount);

                        return (
                          <tr key={item.medicine.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{index + 1}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {item.medicine.name}
                              </span>
                              {item.medicine.strength && (
                                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                                  دوز: {item.medicine.strength}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[11px] border border-sky-200/50 dark:border-sky-800/50">
                                {item.medicine.dosageForm || 'قرص'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{item.medicine.unit || 'بسته'}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={item.medicine.stock}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateCartQty(item.medicine.id, parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono font-bold text-xs"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.medicine.salePrice.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min={0}
                                value={item.discount || ''}
                                placeholder="۰"
                                onChange={(e) =>
                                  updateCartDiscount(item.medicine.id, parseInt(e.target.value) || 0)
                                }
                                className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono text-xs"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {lineTotal.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.medicine.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Discount Summary Bar */}
                <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span>جمع اقلام: <strong>{cartSubtotal.toLocaleString()} AFN</strong></span>
                    {cartTotalDiscount > 0 && (
                      <span className="text-rose-500">
                        مجموع تخفیف: <strong>-{cartTotalDiscount.toLocaleString()} AFN</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">مبلغ نهایی فاکتور:</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                      {cartGrandTotal.toLocaleString()} AFN
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Customer / Pharmacy Information Section */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>اطلاعات دواخانه و مشتری تحویل‌گیرنده</span>
                  </h4>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('existing')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        customerMode === 'existing'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      دواخانه‌های من
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('new')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        customerMode === 'new'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      + ثبت دواخانه جدید
                    </button>
                  </div>
                </div>

                {customerMode === 'existing' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      انتخاب دواخانه / مشتری:
                    </label>
                    {customers.length === 0 ? (
                      <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-200">
                        شما هنوز دواخانه‌ای در لیست خود ندارید. گزینه «+ ثبت دواخانه جدید» را انتخاب کنید.
                      </div>
                    ) : (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.managerName || 'دکتر'}) • تلفن: {c.phone} • {c.address}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نام دواخانه: *
                      </label>
                      <input
                        type="text"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="مثلاً: دواخانه شفا، دواخانه ملت..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نام دکتر / مسئول فنی:
                      </label>
                      <input
                        type="text"
                        value={newDoctorName}
                        onChange={(e) => setNewDoctorName(e.target.value)}
                        placeholder="نام داکتر فارمسست یا مسئول دواخانه"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        شماره تماس دواخانه: *
                      </label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="07xxxxxxxx"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        شهر / ولایت:
                      </label>
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="کابل، هرات، مزار..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        آدرس دقیق دواخانه:
                      </label>
                      <input
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="سرک، ناحیه، نام مارکت یا چهارراهی"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={saveAsRegisteredCustomer}
                          onChange={(e) => setSaveAsRegisteredCustomer(e.target.checked)}
                          className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>این دواخانه در لیست دواخانه‌های من برای ویزیت‌های بعدی نیز ثبت و ذخیره شود</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Advance Payment / Cash Collection Feature */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 md:p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-100">
                        دریافت بیعانه یا کل مبلغ فاکتور توسط ویزیتور
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {isCashCollectionAllowed
                          ? 'مبلغ دریافتی مستقیماً به صندوق و حساب ویزیتور واریز می‌شود و تا زمان تایید مدیریت در حساب می‌ماند'
                          : 'قابلیت دریافت بیعانه توسط مدیر فروشگاه غیرفعال شده است.'}
                      </p>
                    </div>
                  </div>
                </div>

                {isCashCollectionAllowed ? (
                  <div className="space-y-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition ${
                          paymentType === 'credit'
                            ? 'bg-white dark:bg-slate-800 border-sky-500 shadow-2xs'
                            : 'bg-emerald-100/40 dark:bg-slate-900/40 border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentType"
                          checked={paymentType === 'credit'}
                          onChange={() => setPaymentType('credit')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                            نسیه و دفتری
                          </div>
                          <div className="text-[10px] text-slate-500">بدون بیعانه نقدی در محل</div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition ${
                          paymentType === 'deposit'
                            ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-2xs'
                            : 'bg-emerald-100/40 dark:bg-slate-900/40 border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentType"
                          checked={paymentType === 'deposit'}
                          onChange={() => setPaymentType('deposit')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                            دریافت بیعانه (پیش‌پرداخت)
                          </div>
                          <div className="text-[10px] text-slate-500">دریافت بخشی از مبلغ فاکتور</div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition ${
                          paymentType === 'full'
                            ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-2xs'
                            : 'bg-emerald-100/40 dark:bg-slate-900/40 border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentType"
                          checked={paymentType === 'full'}
                          onChange={() => setPaymentType('full')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                            دریافت کل مبلغ
                          </div>
                          <div className="text-[10px] text-slate-500">تسویه کامل نقدی فاکتور</div>
                        </div>
                      </label>
                    </div>

                    {/* Deposit Amount & Details Input */}
                    {paymentType !== 'credit' && (
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              مبلغ دریافتی ویزیتور (AFN): *
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={cartGrandTotal}
                              value={depositAmount || ''}
                              onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                              placeholder="مبلغ به افغانی"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-slate-100"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              از کل {cartGrandTotal.toLocaleString()} AFN
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              روش دریافت:
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                            >
                              <option value="cash">نقدی حضوری (در دست ویزیتور)</option>
                              <option value="card_to_card">واریز به کارت ویزیتور</option>
                              <option value="bank_receipt">فیش واریزی بانکی</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              شماره رسید / شماره پیگیری:
                            </label>
                            <input
                              type="text"
                              value={receiptNumber}
                              onChange={(e) => setReceiptNumber(e.target.value)}
                              placeholder="شماره فیش یا سند دستی"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                          <span>
                            این مبلغ در «صندوق وصولی‌های ویزیتور» ثبت می‌شود. ویزیتور می‌تواند بعداً از بخش حسابداری، فیش واریز به حساب فروشگاه را ارسال کند تا پس از تایید مدیریت فروشگاه تسویه گردد.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-3 rounded-2xl border border-amber-200">
                    مدیریت فروشگاه دریافت بیعانه نقدی توسط ویزیتورها را غیرفعال کرده است. فاکتور بدون دریافت بیعانه نقدی ثبت و به انبار ارسال می‌شود.
                  </div>
                )}
              </div>

              {/* 4. Notes & Delivery Information */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و شرایط ارسال سفارش:
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="مثلاً: تحویل نوبت بعدازظهر، ارسال همراه با بسته قبلی یا یادداشت دکتر..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsInvoiceDrawerOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  بازگشت به گالری
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تایید و صدور نهایی فاکتور دارویی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medicine Details Modal */}
      {selectedDetailMed && (
        <MedicineDetailsModal
          medicine={selectedDetailMed}
          isOpen={!!selectedDetailMed}
          onClose={() => setSelectedDetailMed(null)}
        />
      )}

      {/* Photo Viewer Modal */}
      {selectedPhotoViewer && (
        <MedicineImageViewerModal
          isOpen={!!selectedPhotoViewer}
          onClose={() => setSelectedPhotoViewer(null)}
          imageUrl={selectedPhotoViewer.url}
          title={selectedPhotoViewer.name}
          code={selectedPhotoViewer.code}
        />
      )}
    </div>
  );
};
