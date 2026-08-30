import { useState } from 'react';
import {
  SpendingRecommendation,
  Transaction,
  FinancialSummary,
  CategorySpend,
  IndianTaxComputation,
} from '../types';
import {
  Sparkles,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Brain,
  RefreshCw,
} from 'lucide-react';

interface SpendingOptimizationProps {
  recommendations: SpendingRecommendation[];
  transactions: Transaction[];
  summary: FinancialSummary;
  categorySpends: CategorySpend[];
  taxComputation: IndianTaxComputation;
}

export function SpendingOptimization({
  recommendations,
  transactions,
  summary,
  categorySpends,
  taxComputation,
}: SpendingOptimizationProps) {
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const formatRupee = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const totalPotentialMonthlySavings = recommendations.reduce((s, r) => s + r.potentialMonthlySavings, 0);
  const totalPotentialAnnualSavings = recommendations.reduce((s, r) => s + r.potentialAnnualSavings, 0);

  const handleRunAiAudit = async () => {
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const categoryTotals: Record<string, number> = {};
      categorySpends.forEach(c => {
        categoryTotals[c.category] = c.totalAmount;
      });

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.slice(0, 50),
          summary,
          categoryTotals,
          taxData: {
            section80C: taxComputation.oldRegime.deductionsList.find(d => d.section === '80C')?.totalClaimed,
            section80D: taxComputation.oldRegime.deductionsList.find(d => d.section === '80D')?.totalClaimed,
            nps: taxComputation.oldRegime.deductionsList.find(d => d.section === '80CCD(1B)')?.totalClaimed,
            homeLoanInterest: taxComputation.oldRegime.deductionsList.find(d => d.section === '24(b)')?.totalClaimed,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiError(data.error || 'AI deep analysis is unavailable. Displaying rule-based optimization engine.');
      }
    } catch (err: any) {
      setAiError('Network error connecting to AI advisory service.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              Upcoming Months Spending Reduction & Optimization
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Save up to {formatRupee(totalPotentialMonthlySavings)}/mo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted recommendations to curb discretionary leakage and boost monthly net savings.
          </p>
        </div>

        <button
          id="btn-run-ai-audit"
          type="button"
          disabled={isLoadingAi}
          onClick={handleRunAiAudit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isLoadingAi ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Statement with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Run AI CA Financial Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Savings Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Potential Monthly Savings
          </span>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {formatRupee(totalPotentialMonthlySavings)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            By optimizing non-essential categories.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Annual Wealth Impact
          </span>
          <div className="text-2xl font-bold text-indigo-600 font-mono mt-1">
            {formatRupee(totalPotentialAnnualSavings)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Direct increase in annual investing power.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Projected New Savings Rate
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {summary.totalIncome > 0
              ? `${(((summary.netSavings + totalPotentialMonthlySavings) / summary.totalIncome) * 100).toFixed(1)}%`
              : '0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Up from current {summary.savingsRate.toFixed(1)}%.
          </p>
        </div>
      </div>

      {/* AI Advisory Panel (If Triggered) */}
      {aiAnalysis && (
        <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 text-sm font-bold">
              <Brain className="w-5 h-5 text-indigo-600" />
              <span>Chartered Accountant AI Advisory Insights</span>
            </div>
            {aiAnalysis.financialHealthScore && (
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm">
                Health Score: {aiAnalysis.financialHealthScore}/100
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {aiAnalysis.actionableSummary}
          </p>

          {aiAnalysis.topCutRecommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {aiAnalysis.topCutRecommendations.map((rec: any, i: number) => (
                <div key={i} className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{rec.category}</span>
                    <span className="text-emerald-600 font-mono">Save {formatRupee(rec.monthlySavings)}/mo</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{rec.actionPlan}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aiError && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          return (
            <div
              key={rec.id}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {rec.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.impact === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {rec.impact} Priority
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>

                <div className="mt-3 grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current Spend:</span>
                    <span className="font-bold text-rose-600 font-mono">{formatRupee(rec.currentMonthlyAvg)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Recommended Cap:</span>
                    <span className="font-bold text-emerald-600 font-mono">{formatRupee(rec.recommendedLimit)}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    Action Plan:
                  </span>
                  {rec.actionTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Monthly Cut:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  + {formatRupee(rec.potentialMonthlySavings)} / month
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
