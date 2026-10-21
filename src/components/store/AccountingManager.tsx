import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage, getEffectiveStoreId } from '../../utils/storage';
import {
  VisitorLedgerEntry,
  UserProfile,
  Order,
  VisitorCashCollection,
  VisitorRemittance,
  Customer,
} from '../../types';
import { exportLedgerToPDF } from '../../utils/exportDocs';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  CreditCard,
  User,
  PieChart,
  BarChart3,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Building2,
  Send,
  Check,
  Ban,
  Receipt,
  Users,
  Search,
  Sparkles,
} from 'lucide-react';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveBarChart, BarDataPoint } from '../charts/InteractiveBarChart';
import { MetricCardWithSparkline } from '../charts/MetricCardWithSparkline';

export const AccountingManager: React.FC = () => {
  const { currentStore, currentUser, updateStoreSettings } = useApp();
  const storeId = getEffectiveStoreId(currentUser, currentStore);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'remittance_approvals' | 'visitors_cash' | 'pharmacies_debts' | 'visitor_payroll'
  >('remittance_approvals');

  // Core Data
  const [visitors, setVisitors] = useState<UserProfile[]>(() =>
    Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor')
  );

  const [selectedVisitorId, setSelectedVisitorId] = useState<string>(
    visitors[0]?.id || ''
  );

  const [ledger, setLedger] = useState<VisitorLedgerEntry[]>(() =>
    Storage.getLedger(storeId)
  );

  const [orders, setOrders] = useState<Order[]>(() =>
    Storage.getOrders(storeId)
  );

  const [collections, setCollections] = useState<VisitorCashCollection[]>(() =>
    Storage.getCashCollections(storeId)
  );

  const [remittances, setRemittances] = useState<VisitorRemittance[]>(() =>
    Storage.getRemittances(storeId)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    Storage.getCustomers(storeId)
  );

  // Search in debts
  const [debtSearch, setDebtSearch] = useState('');

  // Remittance Rejection Modal
  const [selectedRemittanceForReject, setSelectedRemittanceForReject] =
    useState<VisitorRemittance | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Manual Ledger Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<
    'salary' | 'commission' | 'bonus' | 'advance' | 'payout' | 'deduction'
  >('payout');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryTitle, setEntryTitle] = useState('پرداخت نقدی تسویه');
  const [entryDesc, setEntryDesc] = useState('');

  // Direct Pharmacy Debt Collection Modal
  const [isPharmacyPaymentModalOpen, setIsPharmacyPaymentModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [pharmacyPayAmount, setPharmacyPayAmount] = useState<number>(0);
  const [pharmacyPayReceipt, setPharmacyPayReceipt] = useState('');
  const [pharmacyPayNote, setPharmacyPayNote] = useState('');

  const reloadData = () => {
    setVisitors(
      Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor')
    );
    setLedger(Storage.getLedger(storeId));
    setOrders(Storage.getOrders(storeId));
    setCollections(Storage.getCashCollections(storeId));
    setRemittances(Storage.getRemittances(storeId));
    setCustomers(Storage.getCustomers(storeId));
  };

  useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storeId]);

  // Keep selectedVisitorId valid
  useEffect(() => {
    if (visitors.length > 0 && (!selectedVisitorId || !visitors.find((v) => v.id === selectedVisitorId))) {
      setSelectedVisitorId(visitors[0].id);
    }
  }, [visitors, selectedVisitorId]);

  // ==========================================
  // MACRO FINANCIAL CALCULATIONS
  // ==========================================
  // 1. Total Gross Sales
  const totalGrossSalesAFN = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAFN, 0),
    [orders]
  );

  // 2. Total Direct Collections Paid on Orders (by pharmacies)
  const totalPaidOnOrdersAFN = useMemo(
    () => orders.reduce((sum, o) => sum + (o.paidAmountAFN || 0), 0),
    [orders]
  );

  // 3. Outstanding Debts from Pharmacies
  const totalOutstandingDebtsAFN = useMemo(
    () => Math.max(0, totalGrossSalesAFN - totalPaidOnOrdersAFN),
    [totalGrossSalesAFN, totalPaidOnOrdersAFN]
  );

  // 4. In-Hand Cash currently in Visitors' Hands
  // (Total collections by visitors minus approved remittances to store)
  const approvedRemittancesTotal = useMemo(
    () =>
      remittances
        .filter((r) => r.status === 'approved')
        .reduce((sum, r) => sum + r.amountAFN, 0),
    [remittances]
  );

  const totalCollectedByVisitors = useMemo(
    () => collections.reduce((sum, c) => sum + c.amountAFN, 0),
    [collections]
  );

  const totalCashInVisitorsHandsAFN = Math.max(
    0,
    totalCollectedByVisitors - approvedRemittancesTotal
  );

  // 5. Pending Remittance Approvals
  const pendingRemittances = useMemo(
    () => remittances.filter((r) => r.status === 'pending'),
    [remittances]
  );

  const pendingRemittancesTotalAFN = useMemo(
    () => pendingRemittances.reduce((sum, r) => sum + r.amountAFN, 0),
    [pendingRemittances]
  );

  // ==========================================
  // REMITTANCE APPROVAL / REJECTION ACTIONS
  // ==========================================
  const handleApproveRemittance = (rem: VisitorRemittance) => {
    const updatedRemittances = remittances.map((r) =>
      r.id === rem.id
        ? {
            ...r,
            status: 'approved' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser?.id,
            reviewedByName: currentUser?.name || 'مدیر فروشگاه',
          }
        : r
    );

    // Calculate total approved remittances for this visitor
    const visitorApprovedTotal = updatedRemittances
      .filter((r) => r.visitorId === rem.visitorId && r.status === 'approved')
      .reduce((sum, r) => sum + r.amountAFN, 0);

    // Chronologically mark collections as remitted based on cumulative approved remittance budget
    let runningBudget = visitorApprovedTotal;
    const sortedCollections = [...collections].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const markedIds = new Set<string>();
    sortedCollections.forEach((c) => {
      if (c.visitorId === rem.visitorId) {
        if (runningBudget >= c.amountAFN) {
          runningBudget -= c.amountAFN;
          markedIds.add(c.id);
        }
      }
    });

    const updatedCollections = collections.map((c) => {
      if (c.visitorId === rem.visitorId) {
        const isRemitted = markedIds.has(c.id);
        return {
          ...c,
          status: isRemitted ? ('remitted' as const) : ('in_hand' as const),
          remittanceId: isRemitted ? (c.remittanceId || rem.id) : undefined,
        };
      }
      return c;
    });

    // Save remittances & collections to store treasury
    Storage.saveRemittances(updatedRemittances, storeId);
    Storage.saveCashCollections(updatedCollections, storeId);

    // NOTE: Visitor remittances of collected pharmacy cash belong to Store Treasury.
    // They are NOT deductions/payouts from the visitor's personal salary or commission.
    // Thus, no entry is added to VisitorLedgerEntry, preventing any false shortage (کسری الکی).

    reloadData();
  };

  const handleRejectRemittance = () => {
    if (!selectedRemittanceForReject) return;

    const updatedRemittances = remittances.map((r) =>
      r.id === selectedRemittanceForReject.id
        ? {
            ...r,
            status: 'rejected' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser?.id,
            reviewedByName: currentUser?.name || 'مدیر فروشگاه',
            rejectionReason: rejectionReason.trim() || 'عدم تطابق مبلغ یا فیش با حساب بانکی فروشگاه',
          }
        : r
    );

    Storage.saveRemittances(updatedRemittances, storeId);
    setSelectedRemittanceForReject(null);
    setRejectionReason('');
    reloadData();
  };

  // Toggle Store-level Cash Collection setting
  const handleToggleStoreCashCollection = () => {
    const currentVal = currentStore?.allowVisitorCashCollection ?? true;
    updateStoreSettings({ allowVisitorCashCollection: !currentVal });
  };

  // ==========================================
  // PHARMACY DEBT DIRECT COLLECTION
  // ==========================================
  const handleRecordPharmacyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || pharmacyPayAmount <= 0) return;

    // Find unpaid orders of this customer and apply payment
    let remainingPay = pharmacyPayAmount;
    const allOrders = Storage.getOrders(storeId);
    const updatedOrders = allOrders.map((o) => {
      if (o.customerId === selectedCustomerForPayment.id && o.remainingAmountAFN > 0 && remainingPay > 0) {
        const canPay = Math.min(o.remainingAmountAFN, remainingPay);
        remainingPay -= canPay;
        const newPaid = o.paidAmountAFN + canPay;
        const newRem = Math.max(0, o.totalAFN - newPaid);
        return {
          ...o,
          paidAmountAFN: newPaid,
          remainingAmountAFN: newRem,
          paymentStatus: newRem === 0 ? ('paid' as const) : ('partial' as const),
          payments: [
            ...o.payments,
            {
              id: `pay_${Date.now()}_${Math.random()}`,
              amountAFN: canPay,
              date: new Date().toISOString(),
              registeredBy: currentUser?.name || 'مدیر فروشگاه',
              receiptNumber: pharmacyPayReceipt || 'DIRECT-STORE',
              note: pharmacyPayNote || 'دریافت مستقیم طلب دواخانه توسط مدیریت فروشگاه',
            },
          ],
        };
      }
      return o;
    });

    Storage.saveOrders(updatedOrders, storeId);
    setIsPharmacyPaymentModalOpen(false);
    setSelectedCustomerForPayment(null);
    setPharmacyPayAmount(0);
    setPharmacyPayReceipt('');
    setPharmacyPayNote('');
    reloadData();
  };

  // Filtered Debtors list
  const pharmacyDebtorsList = useMemo(() => {
    const map = new Map<
      string,
      {
        customer: Customer;
        totalOrdersCount: number;
        totalOrdersAFN: number;
        totalPaidAFN: number;
        totalDebtAFN: number;
      }
    >();

    // Initial populate from customers
    customers.forEach((c) => {
      map.set(c.id, {
        customer: c,
        totalOrdersCount: 0,
        totalOrdersAFN: 0,
        totalPaidAFN: 0,
        totalDebtAFN: 0,
      });
    });

    // Populate from orders
    orders.forEach((o) => {
      const entry = map.get(o.customerId) || {
        customer: {
          id: o.customerId,
          name: o.customerName,
          managerName: '',
          phone: '',
          address: '',
          city: '',
          area: '',
          createdBy: '',
          sharedVisitorIds: [],
          status: 'active' as const,
          createdAt: '',
          totalOrdersCount: 0,
          totalOrderAmount: 0,
          storeId,
        },
        totalOrdersCount: 0,
        totalOrdersAFN: 0,
        totalPaidAFN: 0,
        totalDebtAFN: 0,
      };

      entry.totalOrdersCount += 1;
      entry.totalOrdersAFN += o.totalAFN;
      entry.totalPaidAFN += o.paidAmountAFN || 0;
      entry.totalDebtAFN = Math.max(0, entry.totalOrdersAFN - entry.totalPaidAFN);
      map.set(o.customerId, entry);
    });

    const list = Array.from(map.values());
    if (!debtSearch.trim()) return list;

    const query = debtSearch.trim().toLowerCase();
    return list.filter(
      (item) =>
        item.customer.name.toLowerCase().includes(query) ||
        (item.customer.managerName && item.customer.managerName.toLowerCase().includes(query)) ||
        (item.customer.phone && item.customer.phone.includes(query))
    );
  }, [customers, orders, debtSearch, storeId]);

  // ==========================================
  // VISITOR PAYROLL & COMMISSIONS DETAILS
  // ==========================================
  const selectedVisitor = visitors.find((v) => v.id === selectedVisitorId);

  const visitorLedger = useMemo(() => {
    return ledger.filter((l) => l.visitorId === selectedVisitorId);
  }, [ledger, selectedVisitorId]);

  const totalEarned = visitorLedger
    .filter((l) => l.amount > 0)
    .reduce((sum, l) => sum + l.amount, 0);

  const totalPaid = visitorLedger
    .filter((l) => l.amount < 0)
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);

  const currentBalance = totalEarned - totalPaid;

  const visitorOrders = useMemo(() => {
    return orders.filter((o) => o.visitorId === selectedVisitorId);
  }, [orders, selectedVisitorId]);

  const deliveredOrders = useMemo(
    () => visitorOrders.filter((o) => o.status === 'delivered'),
    [visitorOrders]
  );
  const approvedOrders = useMemo(
    () => visitorOrders.filter((o) => o.status === 'approved' || o.status === 'delivered'),
    [visitorOrders]
  );

  const eligibleOrders =
    selectedVisitor?.commissionBasis === 'approved_order'
      ? approvedOrders
      : deliveredOrders;

  const totalEligibleSales = useMemo(
    () => eligibleOrders.reduce((sum, o) => sum + o.totalAFN, 0),
    [eligibleOrders]
  );

  const calculatedCommissionAFN = useMemo(() => {
    const rate = selectedVisitor?.commissionRate ?? 4;
    return Math.round((totalEligibleSales * rate) / 100);
  }, [totalEligibleSales, selectedVisitor?.commissionRate]);

  const alreadyCreditedCommission = useMemo(() => {
    return visitorLedger
      .filter((l) => l.type === 'commission' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);
  }, [visitorLedger]);

  const uncreditedCommission = Math.max(0, calculatedCommissionAFN - alreadyCreditedCommission);

  const handleAutoCreditCommission = () => {
    if (uncreditedCommission <= 0) return;
    const newEntry: VisitorLedgerEntry = {
      id: `led_${Date.now()}`,
      storeId,
      visitorId: selectedVisitorId,
      type: 'commission',
      amount: uncreditedCommission,
      title: `پورسانت کارکرد فروش واقعی (${selectedVisitor?.commissionRate || 4}٪)`,
      description: `محاسبه‌شده بر اساس ${eligibleOrders.length} فاکتور فروش به مبلغ کل ${totalEligibleSales.toLocaleString()} AFN`,
      date: new Date().toISOString(),
      registeredBy: currentUser?.name || 'مدیر فروشگاه',
    };
    const all = Storage.getLedger(storeId);
    all.unshift(newEntry);
    Storage.saveLedger(all, storeId);
    reloadData();
  };

  const handleAddManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitorId || entryAmount <= 0) return;

    const isCredit = ['salary', 'commission', 'bonus'].includes(entryType);
    const finalAmount = isCredit ? Math.abs(entryAmount) : -Math.abs(entryAmount);

    const newEntry: VisitorLedgerEntry = {
      id: `led_${Date.now()}`,
      storeId,
      visitorId: selectedVisitorId,
      type: entryType,
      amount: finalAmount,
      title: entryTitle.trim() || 'سند مالی',
      description: entryDesc.trim() || undefined,
      date: new Date().toISOString(),
      registeredBy: currentUser?.name || 'مدیر فروشگاه',
    };

    const all = Storage.getLedger(storeId);
    all.unshift(newEntry);
    Storage.saveLedger(all, storeId);

    setIsModalOpen(false);
    setEntryAmount(0);
    setEntryDesc('');
    reloadData();
  };

  // Donut breakdown for selected visitor
  const earningsSegments: DonutSegment[] = useMemo(() => {
    const commissionTotal = visitorLedger
      .filter((l) => l.type === 'commission' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);

    const salaryTotal = visitorLedger
      .filter((l) => l.type === 'salary' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);

    const bonusTotal = visitorLedger
      .filter((l) => l.type === 'bonus' && l.amount > 0)
      .reduce((s, l) => s + l.amount, 0);

    const total = commissionTotal + salaryTotal + bonusTotal;
    if (total === 0) {
      return [
        {
          id: 'zero',
          label: 'هنوز استحقاقی ثبت نشده (۰ AFN)',
          value: 1,
          color: '#cbd5e1',
          subText: '۰ AFN',
        },
      ];
    }

    const segments: DonutSegment[] = [];
    if (commissionTotal > 0) {
      segments.push({
        id: 'comm',
        label: 'پورسانت فروش',
        value: commissionTotal,
        color: '#0284c7',
        subText: `${commissionTotal.toLocaleString()} AFN`,
      });
    }
    if (salaryTotal > 0) {
      segments.push({
        id: 'salary',
        label: 'حقوق ثابت',
        value: salaryTotal,
        color: '#10b981',
        subText: `${salaryTotal.toLocaleString()} AFN`,
      });
    }
    if (bonusTotal > 0) {
      segments.push({
        id: 'bonus',
        label: 'پاداش و تشویقی',
        value: bonusTotal,
        color: '#8b5cf6',
        subText: `${bonusTotal.toLocaleString()} AFN`,
      });
    }
    return segments;
  }, [visitorLedger]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>حسابداری حرفه‌ای، تایید واریزی‌ها و صندوق ویزیتورها</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تایید انتقال وجوه بیعانه ویزیتورها، مدیریت مطالبات داروخانه‌ها، حقوق و پورسانت کارکرد
          </p>
        </div>

        {/* Global Store Permission Toggle */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            دریافت بیعانه و وجه نقد توسط ویزیتورها:
          </span>
          <button
            type="button"
            onClick={handleToggleStoreCashCollection}
            className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              (currentStore?.allowVisitorCashCollection ?? true)
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {(currentStore?.allowVisitorCashCollection ?? true) ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>مجاز / فعال</span>
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5" />
                <span>غیرفعال</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Macro Financial KPI Cards - 5-Pillar Accounting Transparency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Gross Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                کل فروش فاکتورها
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
              {totalGrossSalesAFN.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">AFN</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            مجموع {orders.length} فاکتور ثبت‌شده
          </p>
        </div>

        {/* 2. Approved Store Treasury Receipts (وجوه واریز شده و تایید شده به حساب فروشگاه) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-emerald-500/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                واریز قطعی به صندوق فروشگاه
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 font-mono mt-2">
              {approvedRemittancesTotal.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">AFN</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-emerald-200/40">
            وجوه تحویل‌شده و تسویه‌شده ویزیتورها
          </p>
        </div>

        {/* 3. In-Hand Cash with Visitors */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-amber-500/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                بیعانه و نقد نزد ویزیتورها
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-amber-800 dark:text-amber-200 font-mono mt-2">
              {totalCashInVisitorsHandsAFN.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">AFN</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-amber-200/40">
            وصولی‌های نقدی در انتظار تسویه
          </p>
        </div>

        {/* 4. Outstanding Debts from Pharmacies */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                مطالبات معوق از دواخانه‌ها
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono mt-2">
              {totalOutstandingDebtsAFN.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">AFN</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            مانده تسویه‌نشده مشتریان
          </p>
        </div>

        {/* 5. Pending Remittances awaiting store approval */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                فیش‌های در انتظار بررسی
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono mt-2">
              {pendingRemittancesTotalAFN.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">AFN</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {pendingRemittances.length} انتقال در صف تایید حسابداری
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('remittance_approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            activeTab === 'remittance_approvals'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تایید واریزی‌های ویزیتورها (تسویه صندوق)</span>
          {pendingRemittances.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-bold animate-pulse">
              {pendingRemittances.length} منتظر تایید
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visitors_cash')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            activeTab === 'visitors_cash'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>صندوق و موجودی نقدی ویزیتورها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pharmacies_debts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            activeTab === 'pharmacies_debts'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>دفتر حسابداری داروخانه‌ها و بدهکاران</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visitor_payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            activeTab === 'visitor_payroll'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>کمیسیون، حقوق و دفتر مالی ویزیتورها</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: REMITTANCE APPROVALS (HIGH PRIORITY) */}
      {/* ======================================================== */}
      {activeTab === 'remittance_approvals' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Pending Review Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 bg-gradient-to-l from-purple-50 via-indigo-50/50 to-white dark:from-slate-850 dark:to-slate-900 border-b border-purple-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>صف تایید واریزی‌های ارسال‌شده توسط ویزیتورها ({pendingRemittances.length} مورد)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تا قبل از تایید شما، این مبالغ در تعهد ویزیتور باقی می‌ماند و به عنوان وصولی قطعی فروشگاه منظور نمی‌گردد.
                </p>
              </div>
            </div>

            {pendingRemittances.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                در حال حاضر هیچ درخواست واریزی در انتظار بررسی نیست. تمام واریزی‌های قبلی تعیین تکلیف شده‌اند.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingRemittances.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400 text-xs bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-200">
                          {rem.remittanceNumber}
                        </span>
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                          {rem.visitorName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({new Date(rem.submittedAt).toLocaleDateString('fa-IR')} ساعت{' '}
                          {new Date(rem.submittedAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          )
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                        <span>
                          روش انتقال:{' '}
                          <strong>
                            {rem.paymentMethod === 'bank_transfer'
                              ? 'واریز بانکی'
                              : rem.paymentMethod === 'cash_in_person'
                              ? 'تحویل نقدی حضوری'
                              : 'حواله صرافی'}
                          </strong>
                        </span>
                        <span>
                          کد پیگیری / فیش: <strong className="font-mono text-purple-700 dark:text-purple-400">{rem.trackingNumber}</strong>
                        </span>
                        {rem.bankName && (
                          <span>
                            بانک مقصد: <strong>{rem.bankName}</strong>
                          </span>
                        )}
                      </div>

                      {rem.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 max-w-2xl">
                          توضیحات ویزیتور: {rem.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="text-left">
                        <span className="text-xs text-slate-400 block">مبلغ واریزی:</span>
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {rem.amountAFN.toLocaleString()} <span className="text-xs font-normal">AFN</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveRemittance(rem)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>تایید واریزی و تسویه</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRemittanceForReject(rem);
                            setRejectionReason('');
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-4 h-4" />
                          <span>رد درخواست</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Historical Remittances Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-600" />
                  <span>سابقه کل تراکنش‌های تسویه و انتقال ویزیتورها ({remittances.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  آرشیو کامل درخواست‌های تاییدشده و ردشده همراه با جزییات رسیدها
                </p>
              </div>
            </div>

            {remittances.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                تاکنون تراکنش تسویه‌ای ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">شماره سند</th>
                      <th className="py-3 px-4">نام ویزیتور</th>
                      <th className="py-3 px-4">تاریخ ثبت</th>
                      <th className="py-3 px-4">مبلغ واریزی</th>
                      <th className="py-3 px-4">روش انتقال</th>
                      <th className="py-3 px-4">کد رهگیری / فیش</th>
                      <th className="py-3 px-4">وضعیت بررسی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {remittances.map((rem) => (
                      <tr key={rem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                          {rem.remittanceNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {rem.visitorName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(rem.submittedAt).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                          {rem.amountAFN.toLocaleString()} <span className="text-[10px] font-normal">AFN</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {rem.paymentMethod === 'bank_transfer'
                            ? 'واریز بانکی'
                            : rem.paymentMethod === 'cash_in_person'
                            ? 'نقدی حضوری'
                            : 'حواله صرافی'}
                        </td>
                        <td className="py-3 px-4 font-mono text-purple-700 dark:text-purple-400 font-bold">
                          {rem.trackingNumber}
                        </td>
                        <td className="py-3 px-4">
                          {rem.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300">
                              در انتظار تایید
                            </span>
                          )}
                          {rem.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                              تایید شده توسط {rem.reviewedByName || 'فروشگاه'}
                            </span>
                          )}
                          {rem.status === 'rejected' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300" title={rem.rejectionReason}>
                              رد شده
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VISITORS CASH IN HAND & PERMISSIONS */}
      {/* ======================================================== */}
      {activeTab === 'visitors_cash' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>تراز صندوق و وجوه نقد در اختیار ویزیتورها ({visitors.length} ویزیتور)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  مشاهده موجودی نقد نزد هر ویزیتور و کنترل مجوز دریافت بیعانه از دواخانه‌ها
                </p>
              </div>
            </div>

            {visitors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هیچ ویزیتوری در سیستم ثبت نشده است. از منوی «ویزیتورها» می‌توانید بازاریاب اضافه کنید.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">نام و مشخصات ویزیتور</th>
                      <th className="py-3 px-4">تلفن تماس</th>
                      <th className="py-3 px-4">کل وصولی‌های از مشتریان</th>
                      <th className="py-3 px-4">واریز قطعی به فروشگاه</th>
                      <th className="py-3 px-4">فیش در انتظار بررسی</th>
                      <th className="py-3 px-4">موجودی نقدی نزد ویزیتور</th>
                      <th className="py-3 px-4">وضعیت تراز صندوق</th>
                      <th className="py-3 px-4">مجوز بیعانه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visitors.map((vis) => {
                      const visCollections = collections
                        .filter((c) => c.visitorId === vis.id)
                        .reduce((s, c) => s + c.amountAFN, 0);

                      const visApprovedRemittances = remittances
                        .filter((r) => r.visitorId === vis.id && r.status === 'approved')
                        .reduce((s, r) => s + r.amountAFN, 0);

                      const visPendingRemittances = remittances
                        .filter((r) => r.visitorId === vis.id && r.status === 'pending')
                        .reduce((s, r) => s + r.amountAFN, 0);

                      const inHand = Math.max(0, visCollections - visApprovedRemittances);

                      return (
                        <tr key={vis.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 dark:text-slate-100 block">
                              {vis.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              شناسه: {vis.username}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {vis.phone}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {visCollections.toLocaleString()} AFN
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {visApprovedRemittances.toLocaleString()} AFN
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                            {visPendingRemittances > 0 ? `${visPendingRemittances.toLocaleString()} AFN` : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-amber-700 dark:text-amber-400 text-sm">
                            {inHand.toLocaleString()} AFN
                          </td>
                          <td className="py-3 px-4">
                            {inHand === 0 ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>تسویه کامل (تراز صفر)</span>
                              </span>
                            ) : visPendingRemittances >= inHand ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>فیش در صف تایید</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>در انتظار واریز فیش</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                                (vis.allowCashCollection ?? true)
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                                  : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                              }`}
                            >
                              {(vis.allowCashCollection ?? true) ? 'مجاز به دریافت' : 'غیرمجاز'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PHARMACIES LEDGER & DEBTORS (بدهکاران داروخانه‌ها) */}
      {/* ======================================================== */}
      {activeTab === 'pharmacies_debts' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-rose-600" />
                  <span>دفتر حسابداری داروخانه‌ها و وصول مطالبات معوق</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  فهرست مشتریان، کل خریدها، مبالغ پرداختی (بیعانه + نقدی) و مانده بدهی هر دواخانه
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={debtSearch}
                  onChange={(e) => setDebtSearch(e.target.value)}
                  placeholder="جستجوی دواخانه یا مسئول..."
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">نام دواخانه و مشخصات</th>
                    <th className="py-3 px-4">تلفن و شهر</th>
                    <th className="py-3 px-4">تعداد فاکتورها</th>
                    <th className="py-3 px-4">مجموع خرید (AFN)</th>
                    <th className="py-3 px-4">کل مبالغ پرداختی</th>
                    <th className="py-3 px-4">مانده بدهی معوق</th>
                    <th className="py-3 px-4">عملیات وصول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pharmacyDebtorsList.map((item) => (
                    <tr key={item.customer.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 dark:text-slate-100 block">
                          {item.customer.name}
                        </span>
                        {item.customer.managerName && (
                          <span className="text-[10px] text-slate-400">
                            دکتر / مسئول: {item.customer.managerName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {item.customer.phone || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.totalOrdersCount}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.totalOrdersAFN.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.totalPaidAFN.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {item.totalDebtAFN > 0 ? (
                          <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                            {item.totalDebtAFN.toLocaleString()} AFN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                            تسویه کامل
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.totalDebtAFN > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForPayment(item.customer);
                              setPharmacyPayAmount(item.totalDebtAFN);
                              setIsPharmacyPaymentModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>ثبت دریافت طلب</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: VISITOR PAYROLL & COMMISSIONS */}
      {/* ======================================================== */}
      {activeTab === 'visitor_payroll' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Visitor Selector & Actions */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                انتخاب پرونده مالی ویزیتور:
              </label>
              <select
                value={selectedVisitorId}
                onChange={(e) => setSelectedVisitorId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {visitors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.phone}) • پورسانت: {v.commissionRate || 4}٪
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت سند مالی جدید (پرداخت / حقوق / پاداش)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportLedgerToPDF(
                    visitorLedger,
                    selectedVisitor?.name || 'ویزیتور',
                    currentStore?.name || 'فروشگاه دارویی'
                  )
                }
                className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ صورت‌حساب</span>
              </button>
            </div>
          </div>

          {/* Real Performance & Commission Banner */}
          <div className="bg-gradient-to-r from-slate-50 via-sky-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950/40 p-5 rounded-3xl border border-sky-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">
                  محاسبه دقیق پورسانت بر مبنای فاکتورهای واقعی {selectedVisitor?.name}
                </h4>
              </div>

              {uncreditedCommission > 0 && (
                <button
                  type="button"
                  onClick={handleAutoCreditCommission}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت پورسانت در دفتر ({uncreditedCommission.toLocaleString()} AFN)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">تعداد کل فاکتورها</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">
                  {visitorOrders.length}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">کل فروش ثبت‌شده</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">
                  {visitorOrders.reduce((s, o) => s + o.totalAFN, 0).toLocaleString()} AFN
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">فروش مشمول پورسانت</div>
                <div className="font-mono font-bold text-sky-700 dark:text-sky-400 text-sm mt-1">
                  {totalEligibleSales.toLocaleString()} AFN
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">
                  پورسانت کل استحقاقی ({selectedVisitor?.commissionRate || 4}٪)
                </div>
                <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-1">
                  {calculatedCommissionAFN.toLocaleString()} AFN
                </div>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 mb-1">کل استحقاقی ثبت‌شده در دفتر</div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {totalEarned.toLocaleString()} <span className="text-xs font-normal">AFN</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 mb-1">کل مبالغ پرداختی تسویه‌شده</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {totalPaid.toLocaleString()} <span className="text-xs font-normal">AFN</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 mb-1">مانده طلب ویزیتور</div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                {currentBalance.toLocaleString()} <span className="text-xs font-normal">AFN</span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>دفتر کل مالی ویزیتور: {selectedVisitor?.name}</span>
                </h3>
              </div>
            </div>

            {visitorLedger.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هنوز تراکنشی در دفتر مالی این ویزیتور ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">تاریخ</th>
                      <th className="py-3 px-4">نوع سند</th>
                      <th className="py-3 px-4">شرح سند</th>
                      <th className="py-3 px-4">مبلغ (AFN)</th>
                      <th className="py-3 px-4">ثبت‌کننده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visitorLedger.map((entry) => {
                      const isCredit = entry.amount > 0;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(entry.date).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                entry.type === 'commission'
                                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                                  : entry.type === 'salary'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {entry.type === 'commission'
                                ? 'پورسانت'
                                : entry.type === 'salary'
                                ? 'حقوق'
                                : entry.type === 'bonus'
                                ? 'پاداش'
                                : 'پرداخت نقدی تسویه'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              {entry.title}
                            </span>
                            {entry.description && (
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {entry.description}
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-black text-sm ${
                              isCredit
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isCredit
                              ? `+${entry.amount.toLocaleString()}`
                              : `-${Math.abs(entry.amount).toLocaleString()}`}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{entry.registeredBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Direct Pharmacy Debt Collection */}
      {isPharmacyPaymentModalOpen && selectedCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-l from-emerald-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm text-white">
                  ثبت دریافت طلب مستقیم از {selectedCustomerForPayment.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPharmacyPaymentModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPharmacyPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ وصولی (AFN): *
                </label>
                <input
                  type="number"
                  min={1}
                  value={pharmacyPayAmount || ''}
                  onChange={(e) => setPharmacyPayAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره قبض / رسید بانکی:
                </label>
                <input
                  type="text"
                  value={pharmacyPayReceipt}
                  onChange={(e) => setPharmacyPayReceipt(e.target.value)}
                  placeholder="شماره فیش واریزی دواخانه"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  یادداشت و توضیحات:
                </label>
                <textarea
                  rows={2}
                  value={pharmacyPayNote}
                  onChange={(e) => setPharmacyPayNote(e.target.value)}
                  placeholder="تسویه طلب فاکتورها..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPharmacyPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  ثبت دریافت و کسر از بدهی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remittance Rejection Reason */}
      {selectedRemittanceForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-black text-sm text-white">
                رد درخواست واریز {selectedRemittanceForReject.remittanceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRemittanceForReject(null)}
                className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                لطفاً دلیل عدم تایید فیش را وارد کنید تا ویزیتور بتواند آن را اصلاح یا پیگیری نماید:
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثلاً: مبلغ فیش به حساب واریز نشده است / شماره پیگیری نامعتبر است..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRemittanceForReject(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleRejectRemittance}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  ثبت رد درخواست
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Visitor Ledger Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-gradient-to-l from-slate-900 to-sky-950 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-black text-sm text-white">
                ثبت سند مالی جدید برای {selectedVisitor?.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualEntry} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع سند:
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="payout">پرداخت نقدی تسویه به ویزیتور (کسر از طلب)</option>
                  <option value="salary">حقوق ثابت ماهانه (افزایش استحقاق)</option>
                  <option value="commission">پورسانت فروش دستی (افزایش استحقاق)</option>
                  <option value="bonus">پاداش و تشویقی (افزایش استحقاق)</option>
                  <option value="advance">مساعده پرداختی (کسر از طلب)</option>
                  <option value="deduction">کسورات قانونی / جریمه (کسر از طلب)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ (AFN): *
                </label>
                <input
                  type="number"
                  min={1}
                  value={entryAmount || ''}
                  onChange={(e) => setEntryAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان سند:
                </label>
                <input
                  type="text"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات تکمیلی:
                </label>
                <textarea
                  rows={2}
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  ثبت در دفتر مالی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
