import React, { useState, useId } from 'react';

export interface DataPoint {
  label: string;
  subLabel?: string;
  value: number;
  secondaryValue?: number;
  meta?: Record<string, any>;
}

interface Props {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  unit?: string;
  height?: number;
  showToggle?: boolean;
}

export const InteractiveAreaTrendChart: React.FC<Props> = ({
  title,
  subtitle,
  data,
  primaryLabel = 'فروش (AFN)',
  secondaryLabel = 'وصولی نقدی (AFN)',
  primaryColor = '#0284c7', // Sky-600
  secondaryColor = '#10b981', // Emerald-500
  unit = 'AFN',
  height = 240,
  showToggle = true,
}) => {
  const chartId = useId().replace(/:/g, '');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(Boolean(secondaryLabel));
  const [activeRange, setActiveRange] = useState<'all' | '7d' | '30d'>('all');

  // Filter based on active range
  const filteredData = React.useMemo(() => {
    if (activeRange === '7d') return data.slice(-7);
    if (activeRange === '30d') return data.slice(-30);
    return data;
  }, [data, activeRange]);

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center justify-center text-slate-400 text-xs min-h-[220px]">
        داده‌ای برای رسم نمودار یافت نشد
      </div>
    );
  }

  // Calculate scales
  const maxVal = Math.max(
    ...filteredData.map((d) =>
      Math.max(
        showPrimary ? d.value : 0,
        showSecondary && d.secondaryValue !== undefined ? d.secondaryValue : 0
      )
    ),
    100
  );

  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const width = 650;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pointsPrimary = filteredData.map((d, i) => {
    const x = padding.left + (i / Math.max(filteredData.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  const pointsSecondary = filteredData.map((d, i) => {
    const sVal = d.secondaryValue || 0;
    const x = padding.left + (i / Math.max(filteredData.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (sVal / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  // Smooth bezier curve generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePathPrimary = createSmoothPath(pointsPrimary);
  const areaPathPrimary =
    pointsPrimary.length > 0
      ? `${linePathPrimary} L ${pointsPrimary[pointsPrimary.length - 1].x} ${
          padding.top + chartHeight
        } L ${pointsPrimary[0].x} ${padding.top + chartHeight} Z`
      : '';

  const linePathSecondary = createSmoothPath(pointsSecondary);
  const areaPathSecondary =
    pointsSecondary.length > 0
      ? `${linePathSecondary} L ${pointsSecondary[pointsSecondary.length - 1].x} ${
          padding.top + chartHeight
        } L ${pointsSecondary[0].x} ${padding.top + chartHeight} Z`
      : '';

  const hoveredData = hoveredIndex !== null ? filteredData[hoveredIndex] : null;
  const hoveredPtPrimary = hoveredIndex !== null ? pointsPrimary[hoveredIndex] : null;

  // Horizontal grid lines
  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px] font-bold">
            <button
              onClick={() => setActiveRange('7d')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeRange === '7d'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ۷ روز
            </button>
            <button
              onClick={() => setActiveRange('30d')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeRange === '30d'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ۳۰ روز
            </button>
            <button
              onClick={() => setActiveRange('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeRange === 'all'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              کل دوره
            </button>
          </div>

          {/* Legend toggles */}
          {showToggle && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setShowPrimary(!showPrimary)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                  showPrimary
                    ? 'border-sky-300 bg-sky-50 text-sky-700 font-bold'
                    : 'border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span>{primaryLabel}</span>
              </button>

              {secondaryLabel && (
                <button
                  onClick={() => setShowSecondary(!showSecondary)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                    showSecondary
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span>{secondaryLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-primary-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.35" />
              <stop offset="85%" stopColor={primaryColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`grad-secondary-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.30" />
              <stop offset="85%" stopColor={secondaryColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
            </linearGradient>

            <filter id={`glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={primaryColor} floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines & Y-Axis values */}
          {gridTicks.map((tick, i) => {
            const y = padding.top + chartHeight * (1 - tick);
            const valLabel = Math.round(maxVal * tick);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={tick === 0 ? '0' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="system-ui"
                >
                  {valLabel.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Secondary Series (Area + Line) */}
          {showSecondary && (
            <g>
              <path d={areaPathSecondary} fill={`url(#grad-secondary-${chartId})`} />
              <path
                d={linePathSecondary}
                fill="none"
                stroke={secondaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Primary Series (Area + Line) */}
          {showPrimary && (
            <g>
              <path d={areaPathPrimary} fill={`url(#grad-primary-${chartId})`} />
              <path
                d={linePathPrimary}
                fill="none"
                stroke={primaryColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#glow-${chartId})`}
              />
            </g>
          )}

          {/* X-Axis labels */}
          {filteredData.map((d, i) => {
            // Show selective labels to avoid crowding
            const step = Math.ceil(filteredData.length / 7);
            const isVisible = i % step === 0 || i === filteredData.length - 1;
            if (!isVisible) return null;

            const x = padding.left + (i / Math.max(filteredData.length - 1, 1)) * chartWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - 12}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="system-ui"
              >
                {d.label}
              </text>
            );
          })}

          {/* Interactive Crosshair & Hover Columns */}
          {filteredData.map((_, i) => {
            const x = padding.left + (i / Math.max(filteredData.length - 1, 1)) * chartWidth;
            const colWidth = chartWidth / filteredData.length;
            return (
              <rect
                key={i}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onTouchStart={() => setHoveredIndex(i)}
              />
            );
          })}

          {/* Hover Crosshair vertical line */}
          {hoveredPtPrimary && (
            <g>
              <line
                x1={hoveredPtPrimary.x}
                y1={padding.top}
                x2={hoveredPtPrimary.x}
                y2={padding.top + chartHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Point highlights */}
              {showPrimary && (
                <circle
                  cx={hoveredPtPrimary.x}
                  cy={hoveredPtPrimary.y}
                  r="6"
                  fill="#ffffff"
                  stroke={primaryColor}
                  strokeWidth="3.5"
                  className="transition-all"
                />
              )}

              {showSecondary && (
                <circle
                  cx={pointsSecondary[hoveredIndex!].x}
                  cy={pointsSecondary[hoveredIndex!].y}
                  r="5"
                  fill="#ffffff"
                  stroke={secondaryColor}
                  strokeWidth="3"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredData && hoveredPtPrimary && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-100 bg-slate-900/90 text-white rounded-xl px-3.5 py-2 shadow-xl border border-slate-700/60 backdrop-blur-md text-xs"
            style={{
              left: `${Math.min(
                Math.max((hoveredPtPrimary.x / width) * 100, 15),
                85
              )}%`,
              top: `${Math.max(
                ((hoveredPtPrimary.y - 60) / height) * 100,
                5
              )}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="font-bold text-sky-300 border-b border-slate-700/80 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{hoveredData.label}</span>
              {hoveredData.subLabel && (
                <span className="text-[10px] text-slate-400 font-normal">
                  {hoveredData.subLabel}
                </span>
              )}
            </div>

            {showPrimary && (
              <div className="flex items-center justify-between gap-4 py-0.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                  {primaryLabel}:
                </span>
                <span className="font-black text-sky-400 font-mono">
                  {hoveredData.value.toLocaleString()} {unit}
                </span>
              </div>
            )}

            {showSecondary && hoveredData.secondaryValue !== undefined && (
              <div className="flex items-center justify-between gap-4 py-0.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  {secondaryLabel}:
                </span>
                <span className="font-black text-emerald-400 font-mono">
                  {hoveredData.secondaryValue.toLocaleString()} {unit}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
