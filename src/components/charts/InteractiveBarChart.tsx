import React, { useState } from 'react';

export interface BarDataPoint {
  label: string;
  subLabel?: string;
  value: number;
  target?: number;
  color?: string;
  meta?: any;
}

interface Props {
  title: string;
  subtitle?: string;
  data: BarDataPoint[];
  valueLabel?: string;
  targetLabel?: string;
  unit?: string;
  height?: number;
}

export const InteractiveBarChart: React.FC<Props> = ({
  title,
  subtitle,
  data,
  valueLabel = 'تحقق یافته',
  targetLabel = 'تارگت ماهانه',
  unit = 'AFN',
  height = 250,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-slate-400 text-xs">
        داده‌ای موجود نیست
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.value, d.target || 0)),
    100
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-black text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-sky-600" />
            <span className="text-slate-600 font-medium">{valueLabel}</span>
          </div>
          {data.some((d) => d.target !== undefined) && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-300" />
              <span className="text-slate-500 font-medium">{targetLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bars container */}
      <div className="relative pt-6 pb-2" style={{ height }}>
        <div className="h-full flex items-end justify-around gap-2 sm:gap-4 px-2 border-b border-slate-200">
          {data.map((item, idx) => {
            const hasTarget = item.target !== undefined && item.target > 0;
            const valHeightPct = Math.min(100, (item.value / maxValue) * 100);
            const targetHeightPct = hasTarget ? Math.min(100, (item.target! / maxValue) * 100) : 0;
            const isHovered = hoveredIdx === idx;
            const achievementPct = hasTarget ? Math.round((item.value / item.target!) * 100) : null;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none transform -translate-x-1/2 left-1/2">
                    <div className="font-bold text-sky-300">{item.label}</div>
                    <div>
                      {valueLabel}: {item.value.toLocaleString()} {unit}
                    </div>
                    {hasTarget && (
                      <div className="text-slate-300">
                        {targetLabel}: {item.target?.toLocaleString()} ({achievementPct}٪)
                      </div>
                    )}
                  </div>
                )}

                {/* Bars side by side or single */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                  {/* Actual Value Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                      item.color ||
                      (achievementPct !== null && achievementPct >= 100
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-500'
                        : 'bg-gradient-to-t from-sky-600 to-sky-400')
                    } ${isHovered ? 'brightness-110 shadow-md' : 'opacity-90'}`}
                    style={{ height: `${Math.max(valHeightPct, 4)}%` }}
                  />

                  {/* Target Bar (if provided) */}
                  {hasTarget && (
                    <div
                      className="w-full max-w-[28px] bg-slate-200/90 rounded-t-lg transition-all duration-500 opacity-60 group-hover:opacity-80"
                      style={{ height: `${Math.max(targetHeightPct, 4)}%` }}
                    />
                  )}
                </div>

                {/* X-axis label */}
                <div className="mt-2 text-center w-full">
                  <span
                    className={`block text-[11px] truncate ${
                      isHovered ? 'font-bold text-sky-700' : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </span>
                  {achievementPct !== null && (
                    <span
                      className={`text-[10px] font-bold ${
                        achievementPct >= 100
                          ? 'text-emerald-600'
                          : achievementPct >= 70
                          ? 'text-sky-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {achievementPct}٪
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
