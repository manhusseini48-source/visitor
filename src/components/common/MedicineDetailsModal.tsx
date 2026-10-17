import React, { useState } from 'react';
import { Medicine } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Pill,
  Tag,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Maximize2,
  DollarSign,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { MedicineImageViewerModal } from './MedicineImageViewerModal';

interface MedicineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  onSelectForOrder?: (med: Medicine) => void;
}

export const MedicineDetailsModal: React.FC<MedicineDetailsModalProps> = ({
  isOpen,
  onClose,
  medicine,
  onSelectForOrder,
}) => {
  const { currentUser } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  if (!isOpen || !medicine) return null;

  const isStoreOwner = currentUser?.role === 'store_owner' || currentUser?.role === 'maker_admin';

  // Expiry check
  const expiryDate = new Date(medicine.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const isExpired = daysUntilExpiry <= 0;
  const isNearExpiry = daysUntilExpiry > 0 && daysUntilExpiry <= 90;

  // Stock status
  const isOutOfStock = medicine.stock <= 0;
  const isLowStock = medicine.stock > 0 && medicine.stock <= (medicine.minStockAlert || 10);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(medicine.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const images = medicine.images && medicine.images.length > 0 ? medicine.images : [];
  const currentImageUrl = images[activeImageIndex] || null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-l from-sky-600 to-teal-600 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                <Pill className="w-5 h-5 rotate-45" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base md:text-lg text-white truncate">
                  {medicine.name}
                </h3>
                <p className="text-xs text-sky-100 font-medium truncate">
                  {medicine.brand} • {medicine.dosageForm} {medicine.strength ? `(${medicine.strength})` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
            {/* Top Grid: Image gallery & Quick Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
              {/* Image side */}
              <div className="sm:col-span-5 flex flex-col items-center">
                {currentImageUrl ? (
                  <div className="relative group w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs flex items-center justify-center">
                    <img
                      src={currentImageUrl}
                      alt={medicine.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => setIsImageViewerOpen(true)}
                      className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      title="بزرگنمایی و نمایش تصویر کامل"
                    >
                      <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs shadow-md">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>مشاهده تصویر</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-sky-50 border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Pill className="w-12 h-12 text-slate-300 mb-2 rotate-45" />
                    <span className="text-xs font-medium">تصویری ثبت نشده است</span>
                  </div>
                )}

                {/* Thumbnails if multiple images */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${
                          activeImageIndex === idx
                            ? 'border-sky-600 ring-2 ring-sky-200'
                            : 'border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specs side */}
              <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  {/* Medicine Code with copy button */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">کد اختصاصی دارو</span>
                      <span className="font-mono font-bold text-sm text-slate-800 tracking-wider">
                        {medicine.code}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
                      title="کپی کد دارو"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>کپی</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Stock & Expiry Badges */}
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={`p-2.5 rounded-2xl border flex flex-col ${
                        isOutOfStock
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : isLowStock
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <span className="text-[10px] font-semibold opacity-80">وضعیت موجودی</span>
                      <span className="text-xs font-bold mt-0.5 flex items-center gap-1">
                        {isOutOfStock ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>ناموجود (۰ {medicine.unit})</span>
                          </>
                        ) : isLowStock ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>رو به اتمام ({medicine.stock} {medicine.unit})</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>موجود ({medicine.stock} {medicine.unit})</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl border flex flex-col ${
                        isExpired
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : isNearExpiry
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold opacity-80">تاریخ انقضا</span>
                      <span className="text-xs font-bold mt-0.5 truncate">
                        {medicine.expiryDate || 'نامشخص'}
                      </span>
                      {isNearExpiry && !isExpired && (
                        <span className="text-[10px] text-amber-700 font-medium">({daysUntilExpiry} روز مانده)</span>
                      )}
                      {isExpired && (
                        <span className="text-[10px] text-rose-700 font-bold">(منقضی شده)</span>
                      )}
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-sky-800 font-medium block">قیمت فروش مصوب</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-sky-900">
                          {Number(medicine.salePrice).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-sky-700">افغانی</span>
                      </div>
                    </div>

                    {isStoreOwner && (
                      <div className="text-left border-r border-sky-200 pr-4">
                        <span className="text-[10px] text-slate-500 font-medium block">قیمت خرید (مختص مدیریت)</span>
                        <span className="text-xs font-bold text-slate-700">
                          {Number(medicine.purchasePrice).toLocaleString()} افغانی
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Attributes Table */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-200/70 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 p-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">دسته‌بندی درمانی:</span>
                  <span className="font-bold text-slate-800">{medicine.category || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">شکل دارویی:</span>
                  <span className="font-bold text-slate-800">{medicine.dosageForm || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">دوز / قدرت:</span>
                  <span className="font-bold text-slate-800">{medicine.strength || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">واحد بسته‌بندی:</span>
                  <span className="font-bold text-slate-800">{medicine.unit || 'بسته'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 p-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">شماره بچ / لات:</span>
                  <span className="font-mono font-bold text-slate-800">{medicine.batchNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">حداقل موجودی هشدار:</span>
                  <span className="font-bold text-slate-800">{medicine.minStockAlert} {medicine.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">کمپانی / برند:</span>
                  <span className="font-bold text-slate-800">{medicine.brand || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">وضعیت دارویی:</span>
                  <span className="font-bold text-emerald-700">مجاز و فعال</span>
                </div>
              </div>
            </div>

            {/* Descriptions */}
            {medicine.shortDescription && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-700 block mb-1">خلاصه مشخصات:</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {medicine.shortDescription}
                </p>
              </div>
            )}

            {medicine.fullDescription && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-700 block mb-1">توضیحات و کاربرد بالینی:</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {medicine.fullDescription}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              بستن
            </button>

            {onSelectForOrder && (
              <button
                onClick={() => {
                  onSelectForOrder(medicine);
                  onClose();
                }}
                disabled={isOutOfStock}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>افزودن به سبد سفارش</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Full Image Viewer Modal if requested */}
      <MedicineImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        imageUrl={currentImageUrl}
        title={medicine.name}
        code={medicine.code}
      />
    </>
  );
};
