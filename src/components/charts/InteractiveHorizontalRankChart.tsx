import React, { useState } from 'react';

export interface RankItem {
  id: string;
  rank: number;
  title: string;
  category?: string;
  subtitle?: string;
  value: number; // e.g. units or amount
  secondaryValue?: number; // e.g. revenue AFN
  unit?: string;
  badge?: string;
  color?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  items: RankItem[];
  valueLabel?: string;
  secondaryValueLabel?: string;
  maxItems?: number;
  unit?: string;
}

export const InteractiveHorizontalRankChart: React.FC<Props> = ({
  title,
  subtitle,
  items,
  valueLabel = 'تعداد فروش',
  secondaryValueLabel = 'ارزش ریالی',
  maxItems = 5,
  unit = 'بسته',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayItems = (items || []).slice(0, maxItems);
  const maxValue = displayItems.length > 0 ? Math.max(...displayItems.map((i) => i.value || 0), 1) : 1;

  const rankMedals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-slate-800 text-sm">{title}</h3>
          <span className="text-[11px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full">
            {displayItems.length} قلم برتر
          </span>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
      </div>

      <div className="space-y-3 my-2">
        {displayItems.map((item, idx) => {
          const percent = Math.min(100, Math.round((item.value / maxValue) * 100));
          const isHovered = hoveredId === item.id;
          const medal = rankMedals[idx] || `#${item.rank || idx + 1}`;

          const barColor =
            item.color ||
            (idx === 0
              ? 'from-sky-500 to-indigo-600'
              : idx === 1
              ? 'from-teal-500 to-emerald-600'
              : idx === 2
              ? 'from-amber-400 to-amber-600'
              : 'from-slate-400 to-slate-600');

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                isHovered
                  ? 'bg-sky-50/60 border-sky-200 shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
              }`}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Top row info */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm font-bold flex-shrink-0">{medal}</span>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left flex-shrink-0 font-mono">
                  <span className="font-black text-slate-800 text-xs">
                    {item.value.toLocaleString()} {item.unit || unit}
                  </span>
                  {item.secondaryValue !== undefined && (
                    <span className="block text-[10px] text-emerald-600 font-bold">
                      {item.secondaryValue.toLocaleString()} AFN
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar background & animated fill */}
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Percent badge & category */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>{item.category || valueLabel}</span>
                <span className="font-bold text-slate-600">{percent}٪ نسبت به رتبه اول</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
        محاسبه بلادرنگ بر مبنای سفارشات قطعی و تسویه‌شده
      </div>
    </div>
  );
};
