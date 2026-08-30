import { useState, FormEvent } from 'react';
import { FinancialGoal, FinancialSummary, Transaction } from '../types';
import {
  Target,
  PiggyBank,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SavingsAndGoalsProps {
  summary: FinancialSummary;
  fixedTransactions: Transaction[];
  goals: FinancialGoal[];
  onAddGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function SavingsAndGoals({
  summary,
  fixedTransactions,
  goals,
  onAddGoal,
  onDeleteGoal,
}: SavingsAndGoalsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FinancialGoal['category']>('Emergency Fund');
  const [targetAmount, setTargetAmount] = useState('500000');
  const [currentSaved, setCurrentSaved] = useState('100000');
  const [targetDate, setTargetDate] = useState('2027-12-31');
  const [priority, setPriority] = useState<FinancialGoal['priority']>('High');

  const formatRupee = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const handleCreateGoal = (e: FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const saved = parseFloat(currentSaved) || 0;
    if (isNaN(target) || target <= 0) return;

    // Calculate months remaining
    const diffMonths = Math.max(
      1,
      Math.round((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    );
    const requiredMonthly = Math.max(0, (target - saved) / diffMonths);

    onAddGoal({
      id: `goal_${Date.now()}`,
      title: title.trim() || category,
      category,
      targetAmount: target,
      currentSaved: saved,
      targetDate,
      monthlyContribution: Math.round(requiredMonthly),
      priority,
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setTitle('');
  };

  const totalGoalMonthlyDemand = goals.reduce((s, g) => s + g.monthlyContribution, 0);
  const savingsSurplusOrDeficit = summary.netSavings - totalGoalMonthlyDemand;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Fixed Expenditure, Savings Engine & Future Goals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic savings computation derived from fixed obligations and future target feasibility.
          </p>
        </div>

        <button
          id="btn-add-financial-goal"
          type="button"
          onClick={() => setShowAddModal(!showAddModal)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Future Goal</span>
        </button>
      </div>

      {/* Fixed vs Savings Equation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Incoming */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            1. Total Incoming (A)
          </span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {formatRupee(summary.totalIncome)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Salary, interest, and incoming cashflow.
          </p>
        </div>

        {/* Fixed Expenditures */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            2. Fixed Commitments (B)
          </span>
          <div className="text-xl font-bold text-indigo-600 mt-1">
            {formatRupee(summary.fixedExpense)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {fixedTransactions.length} fixed debits (EMI, SIPs, Rent, Insurance, Bills).
          </p>
        </div>

        {/* Available Automated Savings */}
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          <span className="text-xs font-semibold text-indigo-900">
            3. Net Monthly Savings (A - B - Variable)
          </span>
          <div className="text-xl font-bold text-indigo-700 mt-1">
            {formatRupee(summary.netSavings)}
          </div>
          <p className="text-[11px] text-indigo-700/80 mt-1">
            {savingsSurplusOrDeficit >= 0
              ? `Surplus of ${formatRupee(savingsSurplusOrDeficit)} after funding all goals.`
              : `Deficit of ${formatRupee(Math.abs(savingsSurplusOrDeficit))} for target goals.`}
          </p>
        </div>
      </div>

      {/* Add Goal Modal / Form */}
      {showAddModal && (
        <form onSubmit={handleCreateGoal} className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Create New Future Financial Goal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Goal Title
              </label>
              <input
                id="input-goal-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 6-Month Emergency Fund"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="select-goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm cursor-pointer"
              >
                <option value="Emergency Fund">Emergency Fund</option>
                <option value="House Down Payment">House Down Payment</option>
                <option value="Retirement">Retirement Wealth</option>
                <option value="Vehicle">Vehicle Purchase</option>
                <option value="Child Education">Child Education Fund</option>
                <option value="Vacation">Vacation / Travel</option>
                <option value="Wealth Creation">Long-term Compounding</option>
                <option value="Other">Other Goal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Amount (₹)
              </label>
              <input
                id="input-goal-target"
                type="number"
                required
                min="1000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="500000"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Saved (₹)
              </label>
              <input
                id="input-goal-current"
                type="number"
                value={currentSaved}
                onChange={(e) => setCurrentSaved(e.target.value)}
                placeholder="100000"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Completion Date
              </label>
              <input
                id="input-goal-date"
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="select-goal-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm cursor-pointer"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-create-goal-btn"
              type="submit"
              className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white cursor-pointer shadow-sm"
            >
              Save Financial Goal
            </button>
          </div>
        </form>
      )}

      {/* Financial Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentSaved / goal.targetAmount) * 100);
          const isFundable = summary.netSavings >= goal.monthlyContribution;

          return (
            <div
              key={goal.id}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1">
                      {goal.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{goal.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    title="Remove goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-lg font-bold text-slate-900">
                    {formatRupee(goal.currentSaved)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Target: {formatRupee(goal.targetAmount)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Target Date:</span>
                    <span className="font-mono text-[11px]">{goal.targetDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Req. Monthly Run:</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      {formatRupee(goal.monthlyContribution)}/mo
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                {isFundable ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fundable from savings
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Needs {formatRupee(goal.monthlyContribution - summary.netSavings)} more
                  </span>
                )}
                <span className="text-slate-500 font-mono">{progress.toFixed(0)}% Done</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
