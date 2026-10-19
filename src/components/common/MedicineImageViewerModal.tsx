import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface MedicineImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  code?: string;
}

export const MedicineImageViewerModal: React.FC<MedicineImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  code,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <ZoomIn className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm md:text-base text-white truncate">
                {title || 'تصویر داروی انتخابی'}
              </h3>
              {code && (
                <span className="text-xs text-slate-400 font-mono">
                  کد: {code}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={`${code || 'medicine'}_image.jpg`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="مشاهده با کیفیت اصلی"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Container - Clean borderless */}
        <div className="relative flex items-center justify-center p-4 md:p-8 bg-slate-950/80 min-h-[300px] max-h-[75vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={title || 'دارو'}
            className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>برای بستن می‌توانید روی دکمه ضربدر یا فضای خالی کلیک کنید</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition cursor-pointer"
          >
            بستن تصویر
          </button>
        </div>
      </div>
    </div>
  );
};
