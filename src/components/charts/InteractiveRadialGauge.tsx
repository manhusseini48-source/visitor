import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  value: number; // 0 to 100 or beyond
  maxValue?: number;
  currentLabel?: string;
  targetLabel?: string;
  unit?: string;
  size?: number;
  badgeText?: string;
}

export const InteractiveRadialGauge: React.FC<Props> = ({
  title,
  subtitle,
  value,
  maxValue = 100,
  currentLabel,
  targetLabel,
  unit = 'AFN',
  size = 200,
  badgeText,
}) => {
  const safeMax = maxValue > 0 ? maxValue : 100;
  const rawPercent = Math.round(((value || 0) / safeMax) * 100);
  const percent = Number.isFinite(rawPercent) ? Math.max(0, Math.min(rawPercent, 100)) : 0;

  // Semi-circle gauge (180 degrees)
  const radius = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 18;

  // Arc math: from 180 deg to 0 deg (or 135 deg to 405 deg)
  const startAngle = 180;
  const endAngle = 0;
  const totalArc = 180;

  const arcLength = Math.PI * radius;
  const strokeDashoffset = Number.isFinite(arcLength * (1 - percent / 100))
    ? arcLength * (1 - percent / 100)
    : 0;

  // Dynamic color depending on achievement
  const gaugeColor =
    percent >= 100
      ? '#059669' // Emerald-600
      : percent >= 75
      ? '#0284c7' // Sky-600
      : percent >= 45
      ? '#f59e0b' // Amber-500
      : '#e11d48'; // Rose-600

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-black text-slate-800 text-sm">{title}</h3>
        {badgeText && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}

      {/* Semi circle gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg width={size} height={size / 2 + 25} className="overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor={gaugeColor} />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute top-[35%] flex flex-col items-center text-center">
          <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
            {percent}٪
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white mt-1 shadow-xs"
            style={{ backgroundColor: gaugeColor }}
          >
            {percent >= 100
              ? 'تکمیل عالی تارگت 🚀'
              : percent >= 75
              ? 'پیشرفت مطلوب 👏'
              : percent >= 45
              ? 'در حال پیگیری ⚡'
              : 'نیازمند تلاش بیشتر ⚠️'}
          </span>
        </div>
      </div>

      {/* Details below */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
        <div className="p-2 bg-slate-50 rounded-xl">
          <span className="text-slate-400 text-[10px] block">
            {currentLabel || 'میزان تحقق‌یافته:'}
          </span>
          <span className="font-bold text-slate-800 font-mono">
            {value.toLocaleString()} {unit}
          </span>
        </div>

        <div className="p-2 bg-slate-50 rounded-xl text-left">
          <span className="text-slate-400 text-[10px] block">
            {targetLabel || 'سقف هدف تعیین‌شده:'}
          </span>
          <span className="font-bold text-slate-600 font-mono">
            {maxValue.toLocaleString()} {unit}
          </span>
        </div>
      </div>
    </div>
  );
};
