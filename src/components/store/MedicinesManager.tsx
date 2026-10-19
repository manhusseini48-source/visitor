import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Medicine } from '../../types';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompressor';
import { exportMedicinesToExcel, exportMedicinesToPDF } from '../../utils/exportDocs';
import { MedicineDetailsModal } from '../common/MedicineDetailsModal';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';
import { parseNumberInput } from '../../utils/numberUtils';
import {
  Pill,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  AlertTriangle,
  Upload,
  CheckCircle,
  X,
  Layers,
  ArrowUpDown,
  Image as ImageIcon,
} from 'lucide-react';

export const MedicinesManager: React.FC = () => {
  const { currentStore, currentUser, isSubscriptionExpired } = useApp();
  const storeId = currentStore?.id || currentUser?.storeId || '';

  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    Storage.getMedicines(storeId)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  // Stock Adjustment Modal
  const [adjustModalMed, setAdjustModalMed] = useState<Medicine | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('رسید فاکتور خرید جدید');

  // Interactive Medicine Details & Image Viewer Modal states
  const [selectedDetailMed, setSelectedDetailMed] = useState<Medicine | null>(null);
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState<{
    url: string | null;
    name: string;
    code: string;
  } | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [dosageForm, setDosageForm] = useState('قرص');
  const [strength, setStrength] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('بسته ۱۰۰ عددی');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(100);
  const [minStockAlert, setMinStockAlert] = useState<number>(20);
  const [category, setCategory] = useState('عمومی');
  const [expiryDate, setExpiryDate] = useState('2028-01-01');
  const [batchNumber, setBatchNumber] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reloadData = () => {
    const list = Storage.getMedicines(storeId);
    setMedicines(list);
  };

  useEffect(() => {
    reloadData();
    const handleStorageChange = () => reloadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storeId]);

  // Open Add/Edit Modal
  const openModal = (med?: Medicine) => {
    setFormError(null);
    if (med) {
      setEditingMed(med);
      setName(med.name);
      setBrand(med.brand);
      setDosageForm(med.dosageForm);
      setStrength(med.strength);
      setCode(med.code);
      setUnit(med.unit);
      setPurchasePrice(med.purchasePrice);
      setSalePrice(med.salePrice);
      setStock(med.stock);
      setMinStockAlert(med.minStockAlert);
      setCategory(med.category);
      setExpiryDate(med.expiryDate);
      setBatchNumber(med.batchNumber);
      setShortDescription(med.shortDescription || '');
      setFullDescription(med.fullDescription || '');
      setImages(med.images || []);
    } else {
      setEditingMed(null);
      setName('');
      setBrand('');
      setDosageForm('قرص');
      setStrength('');
      setCode(`MED-${Math.floor(100 + Math.random() * 900)}`);
      setUnit('بسته');
      setPurchasePrice(100);
      setSalePrice(140);
      setStock(50);
      setMinStockAlert(15);
      setCategory('آنتی‌بیوتیک');
      setExpiryDate('2027-12-31');
      setBatchNumber(`BT-${Math.floor(1000 + Math.random() * 9000)}`);
      setShortDescription('');
      setFullDescription('');
      setImages([]);
    }
    setIsModalOpen(true);
  };

  // Handle Image Upload with < 300KB compression and Cloudinary storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 5) {
      setFormError('حداکثر ۵ تصویر برای هر محصول مجاز است.');
      return;
    }

    try {
      setUploadingImage(true);
      setFormError(null);

      // Compress strictly under 300KB
      const result = await compressImage(file, 300);

      // Upload to Cloudinary helper
      const cloudUrl = await uploadToCloudinary(result.file, 'medicines');

      setImages([...images, cloudUrl]);
    } catch (err: any) {
      setFormError(err.message || 'خطا در بارگذاری تصویر دارو.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubscriptionExpired) {
      setFormError('مهلت استفاده پایان یافته است. لطفاً اشتراک را تمدید فرمایید.');
      return;
    }

    if (!name.trim() || !brand.trim() || !code.trim()) {
      setFormError('تکمیل نام، برند و کد الزامی است.');
      return;
    }

    if (name.length > 40) {
      setFormError('نام دارو حداکثر ۴۰ کاراکتر مجاز است.');
      return;
    }

    if (shortDescription.length > 200) {
      setFormError('توضیح کوتاه حداکثر ۲۰۰ کاراکتر مجاز است.');
      return;
    }

    const all = Storage.getMedicines(storeId);

    // Prevent duplicate medicine code
    const duplicateCode = all.find(
      (m) => m.code.trim().toLowerCase() === code.trim().toLowerCase() && m.id !== editingMed?.id
    );
    if (duplicateCode) {
      setFormError(`کد داروی «${code}» تکراری است. هر دارو باید دارای کد یکتای اختصاصی باشد.`);
      return;
    }

    // Prevent duplicate medicine name
    const duplicateName = all.find(
      (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase() && m.id !== editingMed?.id
    );
    if (duplicateName) {
      setFormError(`دارویی با نام «${name}» قبلاً در سیستم انبار ثبت شده است.`);
      return;
    }

    if (editingMed) {
      const updatedList = all.map((m) =>
        m.id === editingMed.id
          ? {
              ...m,
              name,
              brand,
              dosageForm,
              strength,
              code,
              unit,
              purchasePrice: Number(purchasePrice),
              salePrice: Number(salePrice),
              stock: Number(stock),
              minStockAlert: Number(minStockAlert),
              category,
              expiryDate,
              batchNumber,
              shortDescription,
              fullDescription,
              images,
              updatedAt: new Date().toISOString(),
            }
          : m
      );
      Storage.saveMedicines(updatedList, storeId);
    } else {
      const newMed: Medicine = {
        id: `med_${Date.now()}`,
        storeId,
        name,
        brand,
        dosageForm,
        strength,
        code,
        unit,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        category,
        expiryDate,
        batchNumber,
        shortDescription,
        fullDescription,
        images,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(newMed);
      Storage.saveMedicines(all, storeId);
    }

    reloadData();
    setIsModalOpen(false);
  };

  const handleDeleteMedicine = (id: string) => {
    if (confirm('آیا از حذف این قلم دارو از فهرست اطمینان دارید؟')) {
      const all = Storage.getMedicines(storeId).filter((m) => m.id !== id);
      Storage.saveMedicines(all, storeId);
      reloadData();
    }
  };

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalMed) return;

    const all = Storage.getMedicines(storeId);
    const updated = all.map((m) => {
      if (m.id === adjustModalMed.id) {
        return {
          ...m,
          stock: Math.max(0, m.stock + Number(adjustAmount)),
          updatedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    Storage.saveMedicines(updated, storeId);
    reloadData();
    setAdjustModalMed(null);
  };

  // Filtered List
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = categoryFilter === 'all' || m.category === categoryFilter;

      return matchSearch && matchCat;
    });
  }, [medicines, searchQuery, categoryFilter]);

  const categories = Array.from(new Set(medicines.map((m) => m.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Pill className="w-5 h-5 text-sky-600" />
            <span>مدیریت انبار و اقلام دارویی ({medicines.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت مشخصات تخصصی دارو، موجودی، تاریخ انقضا و سری ساخت
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportMedicinesToExcel(medicines)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل (XLSX)</span>
          </button>

          <button
            onClick={() => exportMedicinesToPDF(medicines, currentStore?.name || 'فروشگاه دارویی')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>خروجی PDF انبار</span>
          </button>

          <button
            onClick={() => openModal()}
            disabled={isSubscriptionExpired}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن داروی جدید</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام دارو، کد، برند یا سری ساخت..."
            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 text-slate-700"
          >
            <option value="all">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">کد / تصویر</th>
                <th className="p-3.5">نام دارو و شرکت سازنده</th>
                <th className="p-3.5">فرم / دوز</th>
                <th className="p-3.5">واحد بسته‌بندی</th>
                <th className="p-3.5">قیمت خرید / فروش</th>
                <th className="p-3.5">موجودی انبار</th>
                <th className="p-3.5">انقضا / سری ساخت</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    دارویی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((m) => {
                  const isLow = m.stock <= m.minStockAlert;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
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
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-sky-400 transition"
                              title="کلیک برای مشاهده تصویر بزرگ دارو"
                            />
                          ) : (
                            <div
                              onClick={() => setSelectedDetailMed(m)}
                              className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold cursor-pointer hover:bg-sky-100 transition"
                              title="مشاهده مشخصات کامل دارو"
                            >
                              <Pill className="w-5 h-5 rotate-45" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailMed(m)}
                            className="font-mono font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer text-right text-xs"
                            title="مشاهده مشخصات کامل دارو"
                          >
                            {m.code}
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailMed(m)}
                          className="font-bold text-slate-800 hover:text-sky-600 hover:underline text-[13px] text-right cursor-pointer block"
                          title="مشاهده مشخصات کامل دارو"
                        >
                          {m.name}
                        </button>
                        <div className="text-[11px] text-slate-400">{m.brand} • {m.category}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {m.dosageForm} {m.strength}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600 font-medium">{m.unit}</td>

                      <td className="p-3.5">
                        <div className="font-bold text-emerald-700">{m.salePrice} AFN</div>
                        <div className="text-[10px] text-slate-400">خرید: {m.purchasePrice} AFN</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold ${
                              isLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {m.stock}
                          </span>
                          <button
                            onClick={() => {
                              setAdjustModalMed(m);
                              setAdjustAmount(0);
                            }}
                            className="text-[10px] text-sky-600 hover:underline"
                            title="اصلاح موجودی"
                          >
                            اصلاح
                          </button>
                        </div>
                        {isLow && (
                          <div className="text-[10px] text-red-600 mt-0.5">حداقل: {m.minStockAlert}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-slate-700">{m.expiryDate}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Lot: {m.batchNumber}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openModal(m)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="ویرایش دارو"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(m.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="حذف دارو"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-sky-600" />
                <span>{editingMed ? 'ویرایش داروی موجود' : 'افزودن داروی جدید به انبار'}</span>
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

            <form onSubmit={handleSaveMedicine} className="space-y-4">
              {/* Row 1: Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>نام دارو *</span>
                    <span className="text-[10px] text-slate-400">{name.length}/40</span>
                  </div>
                  <input
                    type="text"
                    maxLength={40}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: آموکسی سیلین ۵۰۰"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    شرکت سازنده / برند *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="مثال: GSK Pharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 2: Dosage Form, Strength, Code */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    شکل دارویی
                  </label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="قرص">قرص</option>
                    <option value="کپسول">کپسول</option>
                    <option value="شربت و سوسپانسیون">شربت و سوسپانسیون</option>
                    <option value="آمپول و ویال">آمپول و ویال</option>
                    <option value="پماد و ژل">پماد و ژل</option>
                    <option value="قطره">قطره</option>
                    <option value="سرم">سرم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    دوز / غلظت
                  </label>
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="500 mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">کد کالا *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="AMX-500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Row 3: Unit, Purchase Price, Sale Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    واحد بسته‌بندی
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="بسته ۱۰۰ عددی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    قیمت خرید (افغانی)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    قیمت فروش (افغانی) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={salePrice || ''}
                    onChange={(e) => setSalePrice(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Row 4: Stock, Alert, Expiry, Batch */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">موجودی انبار</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stock || ''}
                    onChange={(e) => setStock(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">حداقل هشدار</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minStockAlert || ''}
                    onChange={(e) => setMinStockAlert(parseNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ انقضا</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سری ساخت (Lot)</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="BT-9901"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Short & Full Description with counters */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>توضیح کوتاه (حداکثر ۲۰۰ کاراکتر)</span>
                  <span className="text-[10px] text-slate-400">{shortDescription.length}/200</span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="معرفی اجمالی دارو و موارد مصرف..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Image Upload with <300KB compression and Cloudinary storage */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span>تصاویر دارو (حداکثر ۵ تصویر)</span>
                  <span className="text-[10px] text-sky-700 font-bold">{images.length} از ۵</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {images.map((imgUrl, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                      <img src={imgUrl} alt="med" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100 flex flex-col items-center justify-center cursor-pointer transition text-sky-700">
                      <Upload className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-bold">
                        {uploadingImage ? 'بارگذاری...' : 'افزودن'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
                >
                  ذخیره دارو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustModalMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              اصلاح موجودی انبار: {adjustModalMed.name}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              موجودی کنونی: <strong className="text-slate-800">{adjustModalMed.stock}</strong> {adjustModalMed.unit}
            </p>

            <form onSubmit={handleApplyStockAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  میزان تغییر (مثبت برای ورود، منفی برای کسر)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={adjustAmount || ''}
                  onChange={(e) => setAdjustAmount(parseNumberInput(e.target.value))}
                  placeholder="مثال: +20 یا -5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  علت ثبت در گردش کالا
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="مثال: فاکتور خرید ورودی یا انبارگردانی"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalMed(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت تغییر موجودی
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
