import { CategorySpend } from '../types';
import { Layers, ArrowRight, Tag } from 'lucide-react';

interface CategoryBreakdownProps {
  categorySpends: CategorySpend[];
  totalExpense: number;
}

export function CategoryBreakdown({ categorySpends, totalExpense }: CategoryBreakdownProps) {
  const formatRupee = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Granular Category Breakdown ({categorySpends.length} Small Buckets)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact breakdown of every small category where money was spent.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categorySpends.map((item) => {
          const avgSpend = item.transactionCount > 0 ? item.totalAmount / item.transactionCount : 0;
          return (
            <div
              key={item.category}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate" title={item.category}>
                    {item.category}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-slate-900 shrink-0">
                  {formatRupee(item.totalAmount)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(2, item.percentageOfExpense))}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              {/* Metrics row */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>{item.transactionCount} transactions</span>
                <span>Avg: {formatRupee(avgSpend)}</span>
                <span className="font-semibold text-slate-700">
                  {item.percentageOfExpense.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
