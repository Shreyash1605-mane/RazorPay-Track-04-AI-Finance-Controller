import { useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  Transaction,
  BankStatementMeta,
  FinancialSummary,
  CategorySpend,
  BudgetLimit,
  BudgetAlert,
  FinancialGoal,
  SpendingRecommendation,
  IndianTaxComputation,
  Reminder,
  TransactionCategory,
} from '../types';
import { Navbar } from './Navbar';
import { StatementUploader } from './StatementUploader';
import { FinancialSummaryCards } from './FinancialSummaryCards';
import { StatementLedgerView } from './StatementLedgerView';
import { SpendingCharts } from './SpendingCharts';
import { CategoryBreakdown } from './CategoryBreakdown';
import { BudgetTracker } from './BudgetTracker';
import { SavingsAndGoals } from './SavingsAndGoals';
import { IndianTaxFiler } from './IndianTaxFiler';
import { SpendingOptimization } from './SpendingOptimization';
import { RemindersModal } from './RemindersModal';
import { VaultSecurityModal } from './VaultSecurityModal';
import { ParseResult } from '../utils/parser';
import { computeIndianTaxLiability } from '../utils/taxCalculator';
import { CATEGORY_COLORS } from '../utils/categorizer';
import {
  encryptData,
  decryptData,
  saveEncryptedVault,
  loadEncryptedVault,
  clearLocalVault,
} from '../utils/crypto';
import {
  FileSpreadsheet,
  TrendingUp,
  Sliders,
  Target,
  Calculator,
  Lightbulb,
  Lock,
  Sparkles,
  RefreshCw,
  Layers,
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  masterPassword: string;
  onLogout: () => void;
}

export function Dashboard({ user, masterPassword, onLogout }: DashboardProps) {
  // State
  const [statementMeta, setStatementMeta] = useState<BankStatementMeta | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([
    { id: 'b_food', category: 'Food & Dining', monthlyLimit: 12000, warningThresholdPercent: 80 },
    { id: 'b_shop', category: 'Shopping & E-Commerce', monthlyLimit: 15000, warningThresholdPercent: 75 },
    { id: 'b_sub', category: 'Subscriptions & Entertainment', monthlyLimit: 4000, warningThresholdPercent: 85 },
  ]);
  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: 'g_emergency',
      title: '6-Month Emergency Safety Fund',
      category: 'Emergency Fund',
      targetAmount: 300000,
      currentSaved: 120000,
      targetDate: '2026-12-31',
      monthlyContribution: 18000,
      priority: 'High',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g_car',
      title: 'EV Car Down Payment',
      category: 'Vehicle',
      targetAmount: 500000,
      currentSaved: 150000,
      targetDate: '2027-08-31',
      monthlyContribution: 15000,
      priority: 'Medium',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [customTaxDeductions, setCustomTaxDeductions] = useState<Record<string, number>>({});
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 'r_adv_tax_q1',
      title: 'Q1 Advance Tax Installment (15% of estimated tax)',
      dueDate: '2025-06-15',
      category: 'Tax Deadline',
      isCompleted: false,
    },
    {
      id: 'r_itr_due',
      title: 'ITR Filing Deadline for Individual Taxpayers',
      dueDate: '2025-07-31',
      category: 'Tax Deadline',
      isCompleted: false,
    },
    {
      id: 'r_sip_date',
      title: 'Monthly Index Mutual Fund SIP Auto-Debit',
      dueDate: '2025-04-05',
      category: 'SIP Investment',
      amount: 15000,
      isRecurring: true,
      recurringFrequency: 'Monthly',
      isCompleted: false,
    },
  ]);

  // Modals state
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isVaultSecurityOpen, setIsVaultSecurityOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER' | 'BUDGETS' | 'GOALS' | 'TAX' | 'OPTIMIZATION'>('OVERVIEW');

  // Load from local encrypted storage on startup if available
  useEffect(() => {
    async function restoreVault() {
      if (!masterPassword) return;
      try {
        const encrypted = loadEncryptedVault();
        if (encrypted) {
          const decrypted = await decryptData(encrypted, masterPassword);
          if (decrypted.transactions && decrypted.transactions.length > 0) {
            setTransactions(decrypted.transactions);
            if (decrypted.meta) setStatementMeta(decrypted.meta);
            if (decrypted.budgets) setBudgets(decrypted.budgets);
            if (decrypted.goals) setGoals(decrypted.goals);
            if (decrypted.customTaxDeductions) setCustomTaxDeductions(decrypted.customTaxDeductions);
            if (decrypted.reminders) setReminders(decrypted.reminders);
          }
        }
      } catch (e) {
        console.warn('Could not restore encrypted vault from session cache:', e);
      }
    }
    restoreVault();
  }, [masterPassword]);

  // Persist encrypted vault when state updates
  useEffect(() => {
    async function persist() {
      if (!masterPassword || transactions.length === 0) return;
      try {
        const payload = {
          transactions,
          meta: statementMeta,
          budgets,
          goals,
          customTaxDeductions,
          reminders,
          updatedAt: new Date().toISOString(),
        };
        const encrypted = await encryptData(payload, masterPassword);
        saveEncryptedVault(encrypted);
      } catch (e) {
        console.error('Failed to encrypt and persist vault:', e);
      }
    }
    persist();
  }, [transactions, statementMeta, budgets, goals, customTaxDeductions, reminders, masterPassword]);

  // Handle statement parsed
  const handleStatementParsed = (result: ParseResult) => {
    setTransactions(result.transactions);
    setStatementMeta(result.meta);
    setActiveTab('OVERVIEW');
  };

  // Compute Financial Summary
  const financialSummary: FinancialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let fixedExpense = 0;
    let variableExpense = 0;
    let totalCreditsCount = 0;
    let totalDebitsCount = 0;
    let largestDebit = 0;
    let largestCredit = 0;

    transactions.forEach(t => {
      if (t.type === 'CREDIT') {
        totalIncome += t.amount;
        totalCreditsCount++;
        if (t.amount > largestCredit) largestCredit = t.amount;
      } else {
        totalExpense += t.amount;
        totalDebitsCount++;
        if (t.amount > largestDebit) largestDebit = t.amount;

        if (t.isFixedExpense) {
          fixedExpense += t.amount;
        } else {
          variableExpense += t.amount;
        }
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      fixedExpense,
      variableExpense,
      averageDailySpend: transactions.length > 0 ? totalExpense / 30 : 0,
      totalTransactions: transactions.length,
      totalDebitsCount,
      totalCreditsCount,
      largestSingleDebit: largestDebit,
      largestSingleCredit: largestCredit,
    };
  }, [transactions]);

  // Compute Category Spends
  const categorySpends: CategorySpend[] = useMemo(() => {
    const map = new Map<TransactionCategory, { total: number; count: number }>();

    transactions.forEach(t => {
      if (t.type === 'DEBIT') {
        const existing = map.get(t.category) || { total: 0, count: 0 };
        existing.total += t.amount;
        existing.count += 1;
        map.set(t.category, existing);
      }
    });

    const list: CategorySpend[] = [];
    map.forEach((val, cat) => {
      const pct = financialSummary.totalExpense > 0 ? (val.total / financialSummary.totalExpense) * 100 : 0;
      list.push({
        category: cat,
        totalAmount: val.total,
        transactionCount: val.count,
        percentageOfExpense: pct,
        color: CATEGORY_COLORS[cat] || '#9CA3AF',
      });
    });

    return list.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [transactions, financialSummary.totalExpense]);

  // Compute Budget Alerts
  const budgetAlerts: BudgetAlert[] = useMemo(() => {
    const alerts: BudgetAlert[] = [];

    budgets.forEach(b => {
      let currentSpent = 0;
      if (b.category === 'ALL') {
        currentSpent = financialSummary.totalExpense;
      } else {
        const cat = categorySpends.find(c => c.category === b.category);
        currentSpent = cat ? cat.totalAmount : 0;
      }

      const percent = b.monthlyLimit > 0 ? (currentSpent / b.monthlyLimit) * 100 : 0;
      let status: 'NORMAL' | 'WARNING' | 'EXCEEDED' = 'NORMAL';
      if (percent >= 100) status = 'EXCEEDED';
      else if (percent >= b.warningThresholdPercent) status = 'WARNING';

      alerts.push({
        category: b.category,
        limit: b.monthlyLimit,
        currentSpent,
        percentSpent: percent,
        status,
        overspentAmount: Math.max(0, currentSpent - b.monthlyLimit),
      });
    });

    return alerts;
  }, [budgets, categorySpends, financialSummary.totalExpense]);

  // Compute Indian Tax Filing Model
  const taxComputation: IndianTaxComputation = useMemo(() => {
    return computeIndianTaxLiability(financialSummary.totalIncome, transactions, customTaxDeductions);
  }, [financialSummary.totalIncome, transactions, customTaxDeductions]);

  // Compute Spending Optimization Recommendations
  const spendingRecommendations: SpendingRecommendation[] = useMemo(() => {
    const recs: SpendingRecommendation[] = [];

    // Food & Dining Leakage
    const food = categorySpends.find(c => c.category === 'Food & Dining');
    if (food && food.totalAmount > 6000) {
      const cut = food.totalAmount * 0.35;
      recs.push({
        id: 'rec_food',
        category: 'Food & Dining',
        title: 'Optimize Food Delivery & Dining Out',
        currentMonthlyAvg: food.totalAmount,
        recommendedLimit: Math.round(food.totalAmount - cut),
        potentialMonthlySavings: Math.round(cut),
        potentialAnnualSavings: Math.round(cut * 12),
        impact: food.totalAmount > 15000 ? 'High' : 'Medium',
        actionTips: [
          'Batch order or cook meal preps for 3 weekdays.',
          'Consolidate multiple small Swiggy/Zomato orders into weekend dining.',
          'Use card discount vouchers or dine-out rewards.',
        ],
      });
    }

    // Shopping E-commerce
    const shopping = categorySpends.find(c => c.category === 'Shopping & E-Commerce');
    if (shopping && shopping.totalAmount > 8000) {
      const cut = shopping.totalAmount * 0.4;
      recs.push({
        id: 'rec_shopping',
        category: 'Shopping & E-Commerce',
        title: 'Discretionary E-Commerce Control',
        currentMonthlyAvg: shopping.totalAmount,
        recommendedLimit: Math.round(shopping.totalAmount - cut),
        potentialMonthlySavings: Math.round(cut),
        potentialAnnualSavings: Math.round(cut * 12),
        impact: 'High',
        actionTips: [
          'Enforce a 48-hour cooling period for Amazon/Flipkart cart items.',
          'Unlink stored UPI payment shortcuts for non-essential shopping apps.',
        ],
      });
    }

    // Subscriptions
    const sub = categorySpends.find(c => c.category === 'Subscriptions & Entertainment');
    if (sub && sub.totalAmount > 2500) {
      const cut = sub.totalAmount * 0.45;
      recs.push({
        id: 'rec_sub',
        category: 'Subscriptions & Entertainment',
        title: 'Audit OTT & Inactive Digital Subscriptions',
        currentMonthlyAvg: sub.totalAmount,
        recommendedLimit: Math.round(sub.totalAmount - cut),
        potentialMonthlySavings: Math.round(cut),
        potentialAnnualSavings: Math.round(cut * 12),
        impact: 'Medium',
        actionTips: [
          'Cancel overlapping OTT video streaming plans.',
          'Switch to annual family bundles or shared broadband packs.',
        ],
      });
    }

    // Travel / Cabs
    const travel = categorySpends.find(c => c.category === 'Fuel & Travel');
    if (travel && travel.totalAmount > 5000) {
      const cut = travel.totalAmount * 0.25;
      recs.push({
        id: 'rec_travel',
        category: 'Fuel & Travel',
        title: 'Ride-Hailing & Commute Rationalization',
        currentMonthlyAvg: travel.totalAmount,
        recommendedLimit: Math.round(travel.totalAmount - cut),
        potentialMonthlySavings: Math.round(cut),
        potentialAnnualSavings: Math.round(cut * 12),
        impact: 'Medium',
        actionTips: [
          'Avoid peak surge pricing on Uber/Ola by scheduling rides.',
          'Consider metro passes or carpooling for regular office commute.',
        ],
      });
    }

    return recs;
  }, [categorySpends]);

  // Fixed transactions list
  const fixedTransactions = useMemo(() => {
    return transactions.filter(t => t.isFixedExpense);
  }, [transactions]);

  // Vault actions
  const handleExportEncryptedVault = () => {
    const payload = {
      user: { name: user.name, email: user.email, employmentType: user.employmentType, panNumber: user.panNumber },
      meta: statementMeta,
      transactions,
      budgets,
      goals,
      customTaxDeductions,
      reminders,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NiveshSathi_Vault_Backup_${user.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLocalVault = () => {
    clearLocalVault();
    setTransactions([]);
    setStatementMeta(null);
  };

  const pendingRemindersCount = reminders.filter(r => !r.isCompleted).length;

  // Tab navigation config
  const navItems = [
    { id: 'OVERVIEW', label: 'Financial Overview', icon: TrendingUp, badge: null },
    { id: 'LEDGER', label: 'Bank Statements', icon: FileSpreadsheet, badge: transactions.length > 0 ? `${transactions.length}` : null },
    { id: 'BUDGETS', label: 'Spending Budgets', icon: Sliders, badge: budgetAlerts.filter(a => a.status !== 'NORMAL').length > 0 ? `${budgetAlerts.filter(a => a.status !== 'NORMAL').length} alerts` : null },
    { id: 'GOALS', label: 'Future Goals', icon: Target, badge: null },
    { id: 'TAX', label: 'Tax (ITR) Filing', icon: Calculator, badge: 'ITR-1/2' },
    { id: 'OPTIMIZATION', label: 'AI Optimization', icon: Lightbulb, badge: 'AI' },
  ] as const;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm text-base">
              N
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">NiveshSathi</span>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mt-1">
            <Lock className="w-2.5 h-2.5 text-indigo-600" />
            <span>Local Encryption Active</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id.toLowerCase()}`}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Security Alert Card in Sidebar */}
        <div className="p-4 bg-slate-50 mx-4 my-2 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Alert</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-[11px] text-slate-600 leading-relaxed">
            Local database is fully encrypted with <strong>AES-256</strong>. Zero data leaves your browser.
          </div>
        </div>

        {/* User Profile & Security Footer in Sidebar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Verified via OTP</span>
                </div>
              </div>
            </div>

            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Lock Session"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Layers className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                {activeTab === 'OVERVIEW' && 'Financial Overview & Analytics'}
                {activeTab === 'LEDGER' && 'Bank Statements Ledger'}
                {activeTab === 'BUDGETS' && 'Spending Budgets & Alerts'}
                {activeTab === 'GOALS' && 'Future Goals & Net Savings'}
                {activeTab === 'TAX' && 'Tax (ITR) Filing & Deductions'}
                {activeTab === 'OPTIMIZATION' && 'AI Spending Insights & Optimization'}
              </h2>
              {statementMeta && (
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Statement: {statementMeta.bankName} ({statementMeta.statementPeriod.startDate} to {statementMeta.statementPeriod.endDate})
                </p>
              )}
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reminders Bell with Badge */}
            <button
              id="navbar-reminders-btn"
              type="button"
              onClick={() => setIsRemindersOpen(true)}
              className="relative p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Upcoming Reminders & Tax Deadlines"
            >
              <Sliders className="w-4 h-4 text-slate-600 rotate-90" />
              {pendingRemindersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            {/* Local Vault Security */}
            <button
              id="navbar-vault-btn"
              type="button"
              onClick={() => setIsVaultSecurityOpen(true)}
              className="p-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Local AES-256 Vault & Backup"
            >
              <Lock className="w-4 h-4 text-slate-600" />
            </button>

            {/* Upload Statement or Re-upload */}
            {transactions.length > 0 && (
              <button
                id="btn-reupload-statement"
                type="button"
                onClick={() => {
                  setTransactions([]);
                  setStatementMeta(null);
                }}
                className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Statement</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1 shadow-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium ${
                    isActive ? 'bg-slate-100 text-indigo-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Stage Content */}
        <section className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto bg-slate-50">
          {transactions.length === 0 ? (
            <div className="space-y-6 max-w-4xl mx-auto py-4">
              <div className="text-center max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                  <Lock className="w-3 h-3" /> Zero-Knowledge Client Encryption
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Bank Statement Analyzer & Tax Planner
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Upload your password-protected Indian bank statement (PDF, CSV, or Excel). Decrypted instantly in your browser with zero server data storage.
                </p>
              </div>

              <StatementUploader
                onParsed={handleStatementParsed}
              />
            </div>
          ) : (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Active Tab Views */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <FinancialSummaryCards
                    summary={financialSummary}
                    meta={statementMeta}
                  />

                  <SpendingCharts
                    transactions={transactions}
                    categorySpends={categorySpends}
                  />

                  <CategoryBreakdown
                    categorySpends={categorySpends}
                    totalExpense={financialSummary.totalExpense}
                  />
                </div>
              )}

              {activeTab === 'LEDGER' && (
                <div className="space-y-6">
                  <StatementLedgerView
                    transactions={transactions}
                    meta={statementMeta}
                    onUpdateTransactionCategory={(id, newCat) => {
                      setTransactions(prev =>
                        prev.map(t => (t.id === id ? { ...t, category: newCat } : t))
                      );
                    }}
                  />
                </div>
              )}

              {activeTab === 'BUDGETS' && (
                <div className="space-y-6">
                  <BudgetTracker
                    budgets={budgets}
                    alerts={budgetAlerts}
                    categorySpends={categorySpends}
                    onAddOrUpdateBudget={(b) => {
                      setBudgets(prev => {
                        const filtered = prev.filter(x => x.category !== b.category);
                        return [...filtered, b];
                      });
                    }}
                    onDeleteBudget={(id) => {
                      setBudgets(prev => prev.filter(x => x.id !== id));
                    }}
                  />
                </div>
              )}

              {activeTab === 'GOALS' && (
                <div className="space-y-6">
                  <SavingsAndGoals
                    summary={financialSummary}
                    fixedTransactions={fixedTransactions}
                    goals={goals}
                    onAddGoal={(g) => setGoals(prev => [...prev, g])}
                    onDeleteGoal={(id) => setGoals(prev => prev.filter(g => g.id !== id))}
                  />
                </div>
              )}

              {activeTab === 'TAX' && (
                <div className="space-y-6">
                  <IndianTaxFiler
                    taxComputation={taxComputation}
                    user={user}
                    transactions={transactions}
                    customDeductions={customTaxDeductions}
                    onUpdateCustomDeduction={(section, amt) => {
                      setCustomTaxDeductions(prev => ({ ...prev, [section]: amt }));
                    }}
                  />
                </div>
              )}

              {activeTab === 'OPTIMIZATION' && (
                <div className="space-y-6">
                  <SpendingOptimization
                    recommendations={spendingRecommendations}
                    transactions={transactions}
                    summary={financialSummary}
                    categorySpends={categorySpends}
                    taxComputation={taxComputation}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <RemindersModal
        isOpen={isRemindersOpen}
        reminders={reminders}
        onClose={() => setIsRemindersOpen(false)}
        onAddReminder={(r) => setReminders(prev => [...prev, r])}
        onDeleteReminder={(id) => setReminders(prev => prev.filter(r => r.id !== id))}
        onToggleReminder={(id) =>
          setReminders(prev =>
            prev.map(r => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
          )
        }
      />

      <VaultSecurityModal
        isOpen={isVaultSecurityOpen}
        onClose={() => setIsVaultSecurityOpen(false)}
        onExportVault={handleExportEncryptedVault}
        onClearLocalVault={handleClearLocalVault}
      />
    </div>
  );
}
