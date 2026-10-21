import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage, getEffectiveStoreId } from '../../utils/storage';
import { Medicine } from '../../types';
import { MedicineDetailsModal } from '../common/MedicineDetailsModal';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';
import { exportMedicinesToExcel, exportMedicinesToPDF } from '../../utils/exportDocs';
import { SupabaseSync } from '../../utils/supabaseSync';
import {
  Pill,
  Search,
  Filter,
  Layers,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
  Calendar,
  Tag,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const VisitorMedicinesView: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentStore, currentUser } = useApp();
  const storeId = getEffectiveStoreId(currentUser, currentStore);

  const [medicines, setMedicines] = useState<Medicine[]>(() =>
    Storage.getMedicines(storeId)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Detail & Photo Viewer Modals
  const [selectedDetailMed, setSelectedDetailMed] = useState<Medicine | null>(null);
  const [selectedPhotoViewer, setSelectedPhotoViewer] = useState<{
    url: string | null;
    name: string;
    code: string;
  } | null>(null);

  const reloadData = () => {
    const list = Storage.getMedicines(storeId);
    setMedicines(list);
  };

  useEffect(() => {
    reloadData();
    // Pull fresh data from cloud in background to guarantee cross-device sync
    SupabaseSync.pullStoreCloudData(storeId).then((res) => {
      if (res.medicines && res.medicines.length > 0) {
        Storage.mergeCloudMedicines(res.medicines, storeId);
        reloadData();
      }
    }).catch(() => {});

    const handleStorageChange = () => reloadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storeId]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.strength && m.strength.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter === 'all' || m.category === categoryFilter;

      return matchSearch && matchCat;
    });
  }, [medicines, searchQuery, categoryFilter]);

  const inStockCount = medicines.filter((m) => m.stock > (m.minStockAlert || 10)).length;
  const lowStockCount = medicines.filter((m) => m.stock > 0 && m.stock <= (m.minStockAlert || 10)).length;
  const outOfStockCount = medicines.filter((m) => m.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Pill className="w-5 h-5 text-sky-600 dark:text-sky-400 rotate-45" />
            <span>کاتالوگ و موجودی زنده داروها ({medicines.length} قلم دارو)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مشاهده موجودی لحظه‌ای انبار فروشگاه، قیمت فروش، تاریخ انقضا و بسته‌بندی جهت معرفی به دواخانه‌ها
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportMedicinesToExcel(filteredMedicines, currentStore?.name || 'فروشگاه دارویی')}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود فایل اکسل فهرست داروها"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>اکسل لیست داروها</span>
          </button>

          <button
            onClick={() => exportMedicinesToPDF(filteredMedicines, currentStore?.name || 'فروشگاه دارویی')}
            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود کاتالوگ PDF رسمی داروها"
          >
            <FileText className="w-4 h-4" />
            <span>کاتالوگ PDF</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('gallery')}
              className="px-3.5 py-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>حالت گالری پرزنتیشن مشتری</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>ثبت سفارش جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">کل اقلام دارویی</div>
          <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
            {medicines.length} <span className="text-xs font-normal text-slate-400">قلم</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>موجودی کافی در انبار</span>
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
            {inStockCount} <span className="text-xs font-normal text-slate-400">قلم</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>موجودی رو به اتمام</span>
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">
            {lowStockCount} <span className="text-xs font-normal text-slate-400">قلم</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>اتمام موجودی (ناموجود)</span>
          </div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1 font-mono">
            {outOfStockCount} <span className="text-xs font-normal text-slate-400">قلم</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام دارو، برند تجارتی، دوز یا کد اختصاصی..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={reloadData}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
              title="بروزرسانی مجدد فهرست داروها"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Cards Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Pill className="w-7 h-7 rotate-45" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {medicines.length === 0
              ? 'هنوز دارویی در انبار فروشگاه ثبت نشده است'
              : 'دارویی مطابق با فیلتر جستجو یافت نشد'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {medicines.length === 0
              ? 'مدیر فروشگاه با ثبت دارو در بخش انبار و موجودی، اقلام دارویی را بلافاصله در این بخش برای ویزیتورها فعال می‌نماید.'
              : 'عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicines.map((med) => {
            const hasStock = med.stock > 0;
            const isLowStock = med.stock > 0 && med.stock <= (med.minStockAlert || 10);
            const mainImg = med.images && med.images.length > 0 ? med.images[0] : null;

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  {/* Top: Image, Name, Code */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPhotoViewer({
                          url: mainImg,
                          name: med.name,
                          code: med.code,
                        })
                      }
                      className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 flex-shrink-0 cursor-pointer hover:border-sky-500 transition relative group"
                      title="مشاهده تصویر بزرگ دارو"
                    >
                      {mainImg ? (
                        <img
                          src={mainImg}
                          alt={med.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <Pill className="w-7 h-7 text-sky-500/70 rotate-45" />
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                          کد: {med.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            !hasStock
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {!hasStock ? 'ناموجود' : isLowStock ? 'موجودی محدود' : 'موجود'}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedDetailMed(med)}
                        className="font-black text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-sky-600 transition"
                        title={med.name}
                      >
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {med.brand} {med.strength ? `(${med.strength})` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Details Badges */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">بسته‌بندی:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{med.unit}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">قیمت فروش مصوب:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-xs font-black">
                        {med.salePrice.toLocaleString()} AFN
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">موجودی فعلی انبار:</span>
                      <strong
                        className={`font-mono font-bold ${
                          !hasStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {med.stock.toLocaleString()} واحد
                      </strong>
                    </div>

                    {med.expiryDate && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>انقضا:</span>
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {med.expiryDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailMed(med)}
                    className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    مشاهده مشخصات کامل
                  </button>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('orders')}
                      className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="ثبت در سفارش"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>سفارش</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedDetailMed && (
        <MedicineDetailsModal
          isOpen={!!selectedDetailMed}
          medicine={selectedDetailMed}
          onClose={() => setSelectedDetailMed(null)}
        />
      )}

      {selectedPhotoViewer && (
        <MedicineImageViewerModal
          isOpen={!!selectedPhotoViewer}
          imageUrl={selectedPhotoViewer.url}
          title={selectedPhotoViewer.name}
          code={selectedPhotoViewer.code}
          onClose={() => setSelectedPhotoViewer(null)}
        />
      )}
    </div>
  );
};
