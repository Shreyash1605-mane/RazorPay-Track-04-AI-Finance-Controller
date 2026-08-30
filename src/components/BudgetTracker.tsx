import { useState, FormEvent } from 'react';
import { BudgetLimit, BudgetAlert, TransactionCategory, CategorySpend } from '../types';
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  BellRing,
  Sliders,
  ShieldAlert,
  Percent,
} from 'lucide-react';

interface BudgetTrackerProps {
  budgets: BudgetLimit[];
  alerts: BudgetAlert[];
  categorySpends: CategorySpend[];
  onAddOrUpdateBudget: (budget: BudgetLimit) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export function BudgetTracker({
  budgets,
  alerts,
  categorySpends,
  onAddOrUpdateBudget,
  onDeleteBudget,
}: BudgetTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'ALL'>('Food & Dining');
  const [limitAmount, setLimitAmount] = useState('8000');
  const [warningThreshold, setWarningThreshold] = useState('80');

  const formatRupee = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const handleSaveBudget = (e: FormEvent) => {
    e.preventDefault();
    const num = parseFloat(limitAmount);
    if (isNaN(num) || num <= 0) return;

    onAddOrUpdateBudget({
      id: `budget_${selectedCategory}_${Date.now()}`,
      category: selectedCategory,
      monthlyLimit: num,
      warningThresholdPercent: parseFloat(warningThreshold) || 80,
    });

    setShowAddForm(false);
  };

  const allAvailableCategories: (TransactionCategory | 'ALL')[] = [
    'ALL',
    'Food & Dining',
    'Groceries & Essentials',
    'Shopping & E-Commerce',
    'Subscriptions & Entertainment',
    'Fuel & Travel',
    'Utilities & Bills',
    'Healthcare & Medical',
    'Miscellaneous & Others',
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Budget Tracking & Custom Spending Limit Alerts
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Set custom spending limits per category to receive live threshold alerts.
          </p>
        </div>

        <button
          id="btn-add-budget-limit"
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Set Category Limit'}</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSaveBudget} className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <select
              id="select-budget-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none shadow-sm cursor-pointer"
            >
              {allAvailableCategories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'Total Monthly Budget (All Categories)' : c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Monthly Limit (₹)
            </label>
            <input
              id="input-budget-limit"
              type="number"
              required
              min="100"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alert Trigger (% Threshold)
            </label>
            <input
              id="input-budget-threshold"
              type="number"
              min="50"
              max="100"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(e.target.value)}
              placeholder="80"
              className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none shadow-sm"
            />
          </div>

          <button
            id="btn-save-budget-submit"
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Save Limit
          </button>
        </form>
      )}

      {/* Live Alerts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => {
          const isExceeded = alert.status === 'EXCEEDED';
          const isWarning = alert.status === 'WARNING';

          return (
            <div
              key={alert.category}
              className={`rounded-xl p-4.5 border transition-all ${
                isExceeded
                  ? 'bg-rose-50/50 border-rose-200 shadow-sm'
                  : isWarning
                  ? 'bg-amber-50/50 border-amber-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    {alert.category === 'ALL' ? 'Total Monthly Spending' : alert.category}
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatRupee(alert.currentSpent)}
                    <span className="text-xs text-slate-500 font-normal"> / {formatRupee(alert.limit)}</span>
                  </div>
                </div>

                {/* Status Badge */}
                {isExceeded ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <ShieldAlert className="w-3 h-3" /> Exceeded
                  </span>
                ) : isWarning ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3 h-3" /> Warning ({alert.percentSpent.toFixed(0)}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Healthy ({alert.percentSpent.toFixed(0)}%)
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, alert.percentSpent)}%` }}
                />
              </div>

              {/* Footer info & delete */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {isExceeded
                    ? `Over limit by ${formatRupee(alert.overspentAmount)}`
                    : `${formatRupee(Math.max(0, alert.limit - alert.currentSpent))} remaining`}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const b = budgets.find(x => x.category === alert.category);
                    if (b) onDeleteBudget(b.id);
                  }}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                  title="Remove limit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
