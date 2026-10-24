import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage, getEffectiveStoreId } from '../../utils/storage';
import { VisitorLedgerEntry, Order, VisitorCashCollection, VisitorRemittance, Medicine } from '../../types';
import {
  DollarSign,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Sparkles,
  PieChart,
  FileText,
  Clock,
  ShoppingCart,
  Award,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Send,
  Building2,
  CreditCard,
  Plus,
  X,
  Check,
  Ban,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { InteractiveDonutChart, DonutSegment } from '../charts/InteractiveDonutChart';
import { InteractiveRadialGauge } from '../charts/InteractiveRadialGauge';
import { exportLedgerToPDF } from '../../utils/exportDocs';

export const VisitorCommission: React.FC = () => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = getEffectiveStoreId(currentUser, currentStore);

  // Tab State: 'wallet' (صندوق وصولی و تسویه) or 'earnings' (پورسانت و درآمد شخصی)
  const [activeSubTab, setActiveSubTab] = useState<'wallet' | 'earnings'>('wallet');

  // Ledger for personal earnings
  const [ledger, setLedger] = useState<VisitorLedgerEntry[]>(() =>
    Storage.getLedger(storeId).filter((l) => l.visitorId === visitorId)
  );

  // Orders created by this visitor
  const [orders, setOrders] = useState<Order[]>(() =>
    Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId)
  );

  // Cash collections & deposits received by this visitor from pharmacies
  const [collections, setCollections] = useState<VisitorCashCollection[]>(() =>
    Storage.getCashCollections(storeId).filter((c) => c.visitorId === visitorId)
  );

  // Remittance transfers to store
  const [remittances, setRemittances] = useState<VisitorRemittance[]>(() =>
    Storage.getRemittances(storeId).filter((r) => r.visitorId === visitorId)
  );

  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    Storage.getMedicines(storeId)
  );

  // Transfer to store modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferMethod, setTransferMethod] = useState<
    'bank_transfer' | 'cash_in_person' | 'exchange_remittance' | 'check'
  >('bank_transfer');
  const [bankName, setBankName] = useState('بانک ملی / حساب رسمی فروشگاه');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const reloadData = () => {
    setLedger(Storage.getLedger(storeId).filter((l) => l.visitorId === visitorId));
    setOrders(Storage.getOrders(storeId).filter((o) => o.visitorId === visitorId));
    setCollections(
      Storage.getCashCollections(storeId).filter((c) => c.visitorId === visitorId)
    );
    setRemittances(
      Storage.getRemittances(storeId).filter((r) => r.visitorId === visitorId)
    );
    setMedicines(Storage.getMedicines(storeId));
  };

  useEffect(() => {
    reloadData();
    const handleStorage = () => reloadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storeId, visitorId]);

  // Wallet / In-Hand Cash Calculations:
  // Total cash & deposits collected from pharmacies by this visitor
  const totalCollectedFromCustomers = collections.reduce((s, c) => s + c.amountAFN, 0);

  // Remittances approved by store (officially deducted from visitor liability)
  const approvedRemittancesTotal = remittances
    .filter((r) => r.status === 'approved')
    .reduce((s, r) => s + r.amountAFN, 0);

  // Remittances currently pending review by store
  const pendingRemittancesTotal = remittances
    .filter((r) => r.status === 'pending')
    .reduce((s, r) => s + r.amountAFN, 0);

  // Current In-Hand Cash liability (Total collected minus approved remittances)
  const currentCashInHand = Math.max(0, totalCollectedFromCustomers - approvedRemittancesTotal);

  // Set default transfer amount to total in hand when opening modal
  useEffect(() => {
    if (isTransferModalOpen && currentCashInHand > 0) {
      setTransferAmount(currentCashInHand);
    }
  }, [isTransferModalOpen, currentCashInHand]);

  // Personal Earnings & Ledger Calculations
  const totalEarned = ledger
    .filter((l) => l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  const totalPaid = ledger
    .filter((l) => l.amount < 0)
    .reduce((s, l) => s + Math.abs(l.amount), 0);

  const currentBalance = totalEarned - totalPaid;

  const commissionPortion = ledger
    .filter((l) => l.type === 'commission' && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  const salaryPortion = ledger
    .filter((l) => l.type === 'salary' && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  const bonusPortion = ledger
    .filter((l) => l.type === 'bonus' && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  // Real orders analysis
  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === 'delivered'),
    [orders]
  );
  const approvedOrders = useMemo(
    () => orders.filter((o) => o.status === 'approved' || o.status === 'delivered'),
    [orders]
  );

  const eligibleOrders =
    currentUser?.commissionBasis === 'approved_order'
      ? approvedOrders
      : deliveredOrders;

  const totalSales = orders.reduce((s, o) => s + o.totalAFN, 0);
  const eligibleSales = eligibleOrders.reduce((s, o) => s + o.totalAFN, 0);
  const calculatedCommissionFromOrders = useMemo(() => {
    const defaultRate = currentUser?.commissionRate || 4;
    const medMap = new Map<string, Medicine>(medicines.map((m) => [m.id, m]));
    let totalComm = 0;
    eligibleOrders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const med = medMap.get(item.medicineId);
          const effectiveRate =
            med && typeof med.customCommissionRate === 'number' && med.customCommissionRate > 0
              ? med.customCommissionRate
              : defaultRate;
          totalComm += ((item.totalAFN || (item.unitPrice * item.quantity)) * effectiveRate) / 100;
        });
      } else {
        totalComm += (order.totalAFN * defaultRate) / 100;
      }
    });
    return Math.round(totalComm);
  }, [eligibleOrders, currentUser?.commissionRate, medicines]);

  // Donut segments: ONLY REAL DATA
  const segments: DonutSegment[] = useMemo(() => {
    if (totalEarned === 0) {
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

    const res: DonutSegment[] = [];
    if (commissionPortion > 0) {
      res.push({
        id: 'comm',
        label: 'پورسانت فروش',
        value: commissionPortion,
        color: '#0284c7',
        subText: `${commissionPortion.toLocaleString()} AFN`,
      });
    }
    if (salaryPortion > 0) {
      res.push({
        id: 'salary',
        label: 'حقوق ثابت',
        value: salaryPortion,
        color: '#10b981',
        subText: `${salaryPortion.toLocaleString()} AFN`,
      });
    }
    if (bonusPortion > 0) {
      res.push({
        id: 'bonus',
        label: 'پاداش و تشویقی',
        value: bonusPortion,
        color: '#8b5cf6',
        subText: `${bonusPortion.toLocaleString()} AFN`,
      });
    }
    return res;
  }, [commissionPortion, salaryPortion, bonusPortion, totalEarned]);

  // Handle Transfer Submission by Visitor
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (transferAmount <= 0) {
      setTransferError('لطفاً مبلغ معتبر برای انتقال وارد نمایید.');
      return;
    }

    if (currentCashInHand <= 0) {
      setTransferError('در حال حاضر وجه نقدی یا بیعانه‌ای از دواخانه‌ها نزد شما برای انتقال وجود ندارد (تراز تسویه است).');
      return;
    }

    if (transferAmount > currentCashInHand) {
      setTransferError(
        `مبلغ انتقال نمی‌تواند بیشتر از کل موجودی نقد نزد شما (${currentCashInHand.toLocaleString()} AFN) باشد تا اضافه واریزی کاذب ایجاد نشود.`
      );
      return;
    }

    if (!trackingNumber.trim()) {
      setTransferError('وارد کردن شماره فیش، شماره ارجاع یا پیگیری بانکی الزامی است.');
      return;
    }

    const newRemittanceNumber = `REM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRemittance: VisitorRemittance = {
      id: `rem_${Date.now()}`,
      remittanceNumber: newRemittanceNumber,
      storeId,
      visitorId,
      visitorName: currentUser?.name || 'ویزیتور',
      amountAFN: transferAmount,
      paymentMethod: transferMethod,
      bankName: bankName.trim() || undefined,
      destinationAccount: destinationAccount.trim() || undefined,
      trackingNumber: trackingNumber.trim(),
      notes: transferNotes.trim() || undefined,
      submittedAt: new Date().toISOString(),
      status: 'pending', // IMPORTANT: Store must verify and approve before funds are settled
    };

    const allRemittances = Storage.getRemittances(storeId);
    allRemittances.unshift(newRemittance);
    Storage.saveRemittances(allRemittances, storeId);

    setTransferSuccess(
      `درخواست انتقال ${transferAmount.toLocaleString()} AFN با شماره پیگیری ${newRemittanceNumber} ثبت شد. پس از بررسی و تایید مدیریت فروشگاه، از موجودی نزد شما کسر و تسویه خواهد شد.`
    );
    setIsTransferModalOpen(false);
    setTrackingNumber('');
    setTransferNotes('');
    reloadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>مرکز مالی، حسابداری و صندوق ویزیتور</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مدیریت بیعانه‌ها و وجوه نقدی وصول‌شده از دواخانه‌ها، انتقال به فروشگاه و پیگیری کارمزد و پورسانت
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              exportLedgerToPDF(
                ledger,
                currentUser?.name || 'ویزیتور',
                currentStore?.name || 'فروشگاه دارویی'
              )
            }
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود فایل PDF صورت‌حساب"
          >
            <FileText className="w-4 h-4" />
            <span>دانلود PDF صورت‌حساب</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('wallet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'wallet'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>صندوق وصولی‌ها و واریز به فروشگاه (بیعانه‌ها)</span>
          {currentCashInHand > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-bold">
              {currentCashInHand.toLocaleString()} AFN
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('earnings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'earnings'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>پورسانت و حقوق شخصی من</span>
        </button>
      </div>

      {/* Success Banner */}
      {transferSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{transferSuccess}</span>
          </div>
          <button
            onClick={() => setTransferSuccess(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: VISITOR CASH WALLET & REMITTANCES TO STORE */}
      {/* ======================================================== */}
      {activeSubTab === 'wallet' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Cash In Hand & Collection KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Cash In Hand (Primary Focus) */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-amber-500/40 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                    موجودی وصولی نزد شما (نقد/بیعانه)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
                  {currentCashInHand.toLocaleString()} <span className="text-xs font-normal text-slate-400">AFN</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-amber-200/40">
                وجوهی که از دواخانه‌ها تحویل گرفته‌اید و باید به فروشگاه واریز گردد.
              </p>
            </div>

            {/* 2. Pending Remittances */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    واریزی‌های در انتظار تایید فروشگاه
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-700 dark:text-sky-400 font-mono mt-2">
                  {pendingRemittancesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">AFN</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                فیش‌هایی که ثبت کرده‌اید و در کارتابل بررسی حسابداری فروشگاه قرار دارد.
              </p>
            </div>

            {/* 3. Approved & Settled */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    مجموع واریزی‌های تاییدشده
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-2">
                  {approvedRemittancesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">AFN</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                تسویه‌هایی که فروشگاه تایید و به حساب خود منظور نموده است.
              </p>
            </div>

            {/* 4. Total Collections */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    کل وصولی‌های تاریخی از آغاز
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-2">
                  {totalCollectedFromCustomers.toLocaleString()} <span className="text-xs font-normal text-slate-400">AFN</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {collections.length} فقره بیعانه و تسویه فاکتور از مشتریان.
              </p>
            </div>
          </div>

          {/* Action Callout: Remit Funds to Store */}
          <div className="bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white p-5 rounded-3xl border border-sky-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm md:text-base text-white">
                  انتقال و تسویه مبالغ وصول‌شده به حساب فروشگاه
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                هر زمان که بیعانه‌ها یا مبالغ نقدی را به حساب بانکی فروشگاه واریز کردید یا نقداً تحویل دادید، اطلاعات فیش را در این بخش ثبت کنید تا مدیریت فروشگاه آن را تایید کند.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTransferError(null);
                setIsTransferModalOpen(true);
              }}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs md:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>ثبت انتقال وجه به فروشگاه</span>
            </button>
          </div>

          {/* Section: Remittance Requests & Approvals Status */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  <span>تاریخچه و وضعیت انتقال‌های وجه به فروشگاه ({remittances.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  تا زمانی که فروشگاه درخواست را تایید نکند، وضعیت «در انتظار تایید» باقی خواهد ماند.
                </p>
              </div>
            </div>

            {remittances.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                تاکنون انتقال وجهی به فروشگاه ثبت نکرده‌اید. با دکمه «ثبت انتقال وجه به فروشگاه» می‌توانید فیش واریزی خود را ارسال کنید.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">شماره سند</th>
                      <th className="py-3 px-4">تاریخ ثبت</th>
                      <th className="py-3 px-4">مبلغ واریزی</th>
                      <th className="py-3 px-4">روش انتقال</th>
                      <th className="py-3 px-4">شماره پیگیری / فیش</th>
                      <th className="py-3 px-4">توضیحات و بانک</th>
                      <th className="py-3 px-4">وضعیت تایید فروشگاه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {remittances.map((rem) => {
                      const isPending = rem.status === 'pending';
                      const isApproved = rem.status === 'approved';
                      const isRejected = rem.status === 'rejected';

                      return (
                        <tr key={rem.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                            {rem.remittanceNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(rem.submittedAt).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                            {rem.amountAFN.toLocaleString()} <span className="text-[10px] font-normal">AFN</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {rem.paymentMethod === 'bank_transfer'
                              ? 'واریز به حساب بانکی'
                              : rem.paymentMethod === 'cash_in_person'
                              ? 'تحویل نقدی حضوری'
                              : rem.paymentMethod === 'exchange_remittance'
                              ? 'حواله صرافی'
                              : 'چک / سند'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                            {rem.trackingNumber || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {rem.bankName && <span className="block font-medium">{rem.bankName}</span>}
                            {rem.notes && <span className="block text-slate-400">{rem.notes}</span>}
                          </td>
                          <td className="py-3 px-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                <span>در انتظار تایید فروشگاه</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>تایید شده توسط فروشگاه</span>
                              </span>
                            )}
                            {isRejected && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>رد شده توسط فروشگاه</span>
                                </span>
                                {rem.rejectionReason && (
                                  <p className="text-[10px] text-rose-600 block">
                                    دلیل: {rem.rejectionReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: List of Collections & Advance Deposits from Pharmacies */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>ریز بیعانه‌ها و وجوه نقدی دریافتی از دواخانه‌ها ({collections.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  فهرست فاکتورهایی که بیعانه یا کل مبلغ آن مستقیماً توسط شما دریافت و وارد سیستم شده است.
                </p>
              </div>
            </div>

            {collections.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                تاکنون بیعانه‌ای از مشتریان دریافت نشده است. هنگام صدور فاکتور در گالری داروها می‌توانید بیعانه یا کل مبلغ را ثبت نمایید.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">تاریخ</th>
                      <th className="py-3 px-4">شماره فاکتور</th>
                      <th className="py-3 px-4">نام دواخانه</th>
                      <th className="py-3 px-4">نوع دریافتی</th>
                      <th className="py-3 px-4">مبلغ وصولی (AFN)</th>
                      <th className="py-3 px-4">روش پرداخت</th>
                      <th className="py-3 px-4">شماره رسید</th>
                      <th className="py-3 px-4">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {collections.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(col.date).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                          {col.orderNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {col.customerName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              col.collectionType === 'deposit'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {col.collectionType === 'deposit' ? 'بیعانه فاکتور' : 'تسویه کامل فاکتور'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {col.amountAFN.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {col.paymentMethod === 'cash'
                            ? 'نقدی حضوری'
                            : col.paymentMethod === 'card_to_card'
                            ? 'کارت به کارت'
                            : 'فیش بانکی'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {col.receiptNumber || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {col.status === 'in_hand' ? 'موجود در صندوق ویزیتور' : 'منتقل‌شده به فروشگاه'}
                          </span>
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
      {/* TAB 2: PERSONAL EARNINGS, SALARY & COMMISSIONS */}
      {/* ======================================================== */}
      {activeSubTab === 'earnings' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Real Performance & Commission Banner */}
          <div className="bg-gradient-to-r from-slate-50 via-sky-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950/40 p-5 rounded-3xl border border-sky-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600" />
              <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                گزارش عملکرد واقعی فروش شما (محاسبه دقیق بر اساس فاکتورها)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">تعداد کل سفارشات شما</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">
                  {orders.length} <span className="text-[10px] font-normal text-slate-400">فاکتور</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">مجموع فروش ثبت‌شده</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">
                  {totalSales.toLocaleString()} AFN
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">فروش مشمول پورسانت</div>
                <div className="font-mono font-bold text-sky-700 dark:text-sky-400 text-sm mt-1">
                  {eligibleSales.toLocaleString()} AFN
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <div className="text-[11px] text-slate-400">
                  پورسانت استحقاقی ({currentUser?.commissionRate || 4}٪)
                </div>
                <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-1">
                  {calculatedCommissionFromOrders.toLocaleString()} AFN
                </div>
              </div>
            </div>
          </div>

          {/* Financial Balances Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 mb-1">کل استحقاق در دفتر (حقوق و پورسانت)</div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {totalEarned.toLocaleString()} <span className="text-xs font-normal">AFN</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 mb-1">کل مبالغ دریافتی من (تسویه‌شده)</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {totalPaid.toLocaleString()} <span className="text-xs font-normal">AFN</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 mb-1">مانده طلب آماده تسویه</div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                {currentBalance.toLocaleString()} <span className="text-xs font-normal">AFN</span>
              </div>
            </div>
          </div>

          {/* Visual Interactive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <InteractiveRadialGauge
              title="شاخص تسویه و وصولی‌ها"
              subtitle="درصد کل مبالغ دریافتی نسبت به استحقاق ثبت‌شده"
              value={totalEarned > 0 ? totalPaid : 0}
              maxValue={Math.max(totalEarned, 1)}
              currentLabel="دریافتی نقدی"
              targetLabel="کل استحقاق"
              unit="AFN"
              size={200}
              badgeText={totalEarned > 0 ? 'شاخص تسویه' : 'بدون استحقاق'}
            />

            <InteractiveDonutChart
              title="ترکیب درآمدهای پورسانتی و حقوق"
              subtitle="تفکیک سهم هر بخش بر اساس تراکنش‌های ثبت‌شده شما"
              segments={segments}
              centerTitle={`${totalEarned.toLocaleString()}`}
              centerSubtitle="کل درآمد AFN"
              size={210}
            />
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>دفتر کل و ریز تراکنش‌های حسابداری شخصی ({ledger.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  تمام دریافتی‌ها، پورسانت‌ها، حقوق و مساعده‌های ثبت‌شده توسط مدیریت فروشگاه
                </p>
              </div>
            </div>

            {ledger.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                تاکنون تراکنشی در دفتر مالی شخصی شما ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">تاریخ</th>
                      <th className="py-3 px-4">نوع سند</th>
                      <th className="py-3 px-4">شرح تراکنش</th>
                      <th className="py-3 px-4">مبلغ (AFN)</th>
                      <th className="py-3 px-4">ثبت‌کننده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ledger.map((entry) => {
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
                                  : entry.type === 'bonus'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {entry.type === 'commission'
                                ? 'پورسانت فروش'
                                : entry.type === 'salary'
                                ? 'حقوق ماهانه'
                                : entry.type === 'bonus'
                                ? 'پاداش عملکرد'
                                : 'پرداخت تسویه'}
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
                            {isCredit ? `+${entry.amount.toLocaleString()}` : `-${Math.abs(entry.amount).toLocaleString()}`}
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

      {/* Modal: Transfer Funds to Store */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 md:p-5 bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-base text-white">
                    ثبت انتقال و واریز وجه به فروشگاه
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    ارسال فیش واریز بیعانه‌ها یا وجه نقد تحویلی به کارتابل حسابداری فروشگاه
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitTransfer} className="p-4 md:p-6 space-y-4">
              {transferError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* In-Hand Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                    موجودی کل وصولی نزد شما:
                  </span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-100 font-mono">
                    {currentCashInHand.toLocaleString()} AFN
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTransferAmount(currentCashInHand)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  انتقال کل موجودی
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ واریزی به فروشگاه (AFN): *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={transferAmount || ''}
                    onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
                    placeholder="مبلغ به افغانی"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    روش انتقال وجه: *
                  </label>
                  <select
                    value={transferMethod}
                    onChange={(e) => setTransferMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="bank_transfer">واریز به حساب بانکی فروشگاه</option>
                    <option value="cash_in_person">تحویل نقدی حضوری در دفتر فروشگاه</option>
                    <option value="exchange_remittance">حواله صرافی معتبر</option>
                    <option value="check">چک / سند تجاری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره فیش / شماره پیگیری تراکنش: *
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="کد پیگیری بانکی یا شماره قبض"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام بانک یا حساب مقصد فروشگاه:
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثلاً بانک ملی افغان، کابل بانک..."
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    توضیحات و یادداشت برای حسابداری فروشگاه:
                  </label>
                  <textarea
                    rows={2}
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="مثلاً: واریز بیعانه‌های مربوط به داروخانه‌های غرب شهر..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Crucial Note about Store Approval */}
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 rounded-2xl border border-sky-200 dark:border-sky-800 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-300">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-sky-600" />
                <span className="leading-relaxed">
                  <strong>قانون تایید مالی:</strong> این مبلغ تا زمانی که توسط مدیریت فروشگاه بررسی و تایید نشود، تسویه نخواهد شد و در وضعیت «در انتظار تایید» باقی می‌ماند.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ارسال و ثبت درخواست انتقال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
