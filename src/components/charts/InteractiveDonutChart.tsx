import React, { useState } from 'react';

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  subText?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerTitle?: string;
  centerSubtitle?: string;
  size?: number;
  thickness?: number;
}

export const InteractiveDonutChart: React.FC<Props> = ({
  title,
  subtitle,
  segments,
  centerTitle,
  centerSubtitle = 'مجموع',
  size = 220,
  thickness = 32,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // SVG Calculations
  const radius = size / 2;
  const strokeWidth = thickness;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  let accumulatedPercent = 0;

  const segmentData = segments.map((seg) => {
    const percent = total > 0 ? seg.value / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...seg,
      percent,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = segments.find((s) => s.id === hoveredId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
      <div>
        <h3 className="font-black text-slate-800 text-sm flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[11px] text-slate-400 font-normal">
            {total.toLocaleString()} قلم
          </span>
        </h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Donut graphic & interactive center */}
      <div className="my-4 flex items-center justify-center relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base background ring */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {segmentData.map((seg) => {
            const isHovered = hoveredId === seg.id;
            return (
              <circle
                key={seg.id}
                cx={radius}
                cy={radius}
                r={radius - strokeWidth / 2}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300"
                style={{
                  opacity: hoveredId && !isHovered ? 0.45 : 1,
                  filter: isHovered ? `drop-shadow(0 0 6px ${seg.color}80)` : 'none',
                }}
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })}
        </svg>

        {/* Center Metric Display */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
          style={{ width: size, height: size }}
        >
          {activeSegment ? (
            <div className="animate-in fade-in zoom-in duration-200">
              <span className="text-[11px] font-bold text-slate-500 block truncate max-w-[120px]">
                {activeSegment.label}
              </span>
              <span className="text-xl font-black text-slate-800 font-mono block">
                {activeSegment.value.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 block">
                {total > 0 ? Math.round((activeSegment.value / total) * 100) : 0}٪
              </span>
            </div>
          ) : (
            <div>
              <span className="text-[11px] text-slate-400 block">{centerSubtitle}</span>
              <span className="text-xl font-black text-slate-800 font-mono block">
                {centerTitle || total.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">مورد ثبت‌شده</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend list below */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
        {segmentData.map((seg) => {
          const isHovered = hoveredId === seg.id;
          const pct = Math.round(seg.percent * 100);
          return (
            <div
              key={seg.id}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                isHovered
                  ? 'bg-slate-50 border-slate-300 shadow-xs scale-[1.02]'
                  : 'border-transparent hover:bg-slate-50/60'
              }`}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-700 font-medium truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 font-mono">
                <span className="font-bold text-slate-800">{seg.value}</span>
                <span className="text-[10px] text-slate-400">({pct}٪)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
