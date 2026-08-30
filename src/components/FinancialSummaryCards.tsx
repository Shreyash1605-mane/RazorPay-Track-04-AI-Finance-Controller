import { FinancialSummary, BankStatementMeta } from '../types';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  PiggyBank,
  TrendingDown,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
  meta: BankStatementMeta | null;
}

export function FinancialSummaryCards({ summary, meta }: FinancialSummaryCardsProps) {
  const formatRupee = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Monthly Income / Credits */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium mb-1">Monthly Income</div>
          <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          {formatRupee(summary.totalIncome)}
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <span className="font-semibold text-emerald-600">{summary.totalCreditsCount} credits</span>
          <span>• Inflow velocity</span>
        </div>
      </div>

      {/* Fixed Commitments */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium mb-1">Fixed Expenditure</div>
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-700 tracking-tight mt-1">
          {formatRupee(summary.fixedExpense)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>Variable: {formatRupee(summary.variableExpense)}</span>
        </div>
      </div>

      {/* Projected Savings */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium mb-1">Projected Savings</div>
          <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${summary.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatRupee(summary.netSavings)}
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 font-semibold text-emerald-700 border border-emerald-100">
            {summary.savingsRate.toFixed(1)}%
          </span>
          <span>Savings rate</span>
        </div>
      </div>

      {/* Total Outflow */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Outgoing (Expenses)</div>
          <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          {formatRupee(summary.totalExpense)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span>{summary.totalDebitsCount} total debits</span>
        </div>
      </div>
    </div>
  );
}
