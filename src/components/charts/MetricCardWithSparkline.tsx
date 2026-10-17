import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: {
    percent: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  sparklineData?: number[];
  sparklineColor?: string;
  onClick?: () => void;
}

export const MetricCardWithSparkline: React.FC<Props> = ({
  title,
  value,
  unit,
  icon,
  iconBg = 'bg-sky-100 text-sky-600',
  trend,
  sparklineData = [],
  sparklineColor = '#0284c7',
  onClick,
}) => {
  // Sparkline calculations safely guarded
  const safeData = sparklineData && sparklineData.length > 0 ? sparklineData : [];
  const hasData = safeData.length > 1 && safeData.some((d) => d > 0);
  const width = 90;
  const height = 36;
  const min = hasData ? Math.min(...safeData) : 0;
  const max = hasData ? Math.max(...safeData) : 1;
  const range = max - min || 1;

  const points = hasData
    ? safeData
        .map((d, i) => {
          const divisor = Math.max(safeData.length - 1, 1);
          const x = (i / divisor) * width;
          const y = height - ((d - min) / range) * (height - 8) - 4;
          return `${Number.isFinite(x) ? x : 0},${Number.isFinite(y) ? y : 0}`;
        })
        .join(' ')
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs transition hover:shadow-md relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-sky-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 mt-1">
        <div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
            {typeof value === 'number' ? value.toLocaleString() : value}{' '}
            {unit && <span className="text-xs font-normal text-slate-500 font-sans">{unit}</span>}
          </div>

          {trend && (
            <div className="flex items-center gap-1 text-[11px] font-bold mt-1.5">
              {trend.direction === 'up' ? (
                <span className="text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{trend.percent}٪</span>
                </span>
              ) : trend.direction === 'down' ? (
                <span className="text-rose-600 flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded-md">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>-{trend.percent}٪</span>
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded-md">
                  <Minus className="w-3.5 h-3.5" />
                  <span>{trend.percent}٪</span>
                </span>
              )}
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Mini Sparkline SVG */}
        {hasData && (
          <div className="w-[90px] h-[36px] flex-shrink-0 opacity-80 hover:opacity-100 transition">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                fill="none"
                stroke={sparklineColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {/* Last point dot */}
              <circle
                cx={width}
                cy={height - ((safeData[safeData.length - 1] - min) / range) * (height - 8) - 4}
                r="3.5"
                fill="#ffffff"
                stroke={sparklineColor}
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
