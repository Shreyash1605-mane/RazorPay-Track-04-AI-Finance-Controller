export type TransactionType = 'DEBIT' | 'CREDIT';

export type TransactionCategory =
  | 'Salary & Income'
  | 'Groceries & Essentials'
  | 'Food & Dining'
  | 'Utilities & Bills'
  | 'EMI & Loan Repayments'
  | 'Investments & Mutual Funds'
  | 'Shopping & E-Commerce'
  | 'Healthcare & Medical'
  | 'Subscriptions & Entertainment'
  | 'Fuel & Travel'
  | 'Credit Card Bill Payment'
  | 'Rent & Housing'
  | 'Insurance & Protection'
  | 'Education & Tuition'
  | 'ATM & Cash Withdrawal'
  | 'Transfers & UPI P2P'
  | 'Taxes & Govt Fees'
  | 'Miscellaneous & Others';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD or formatted date
  valueDate?: string;
  description: string;
  refNo: string;
  amount: number;
  type: TransactionType;
  balance?: number;
  category: TransactionCategory;
  isFixedExpense?: boolean;
  isTaxDeductible?: boolean;
  taxSection?: '80C' | '80D' | '80CCD(1B)' | '24(b)' | '80G' | '80TTA' | '80E' | 'Other';
  notes?: string;
}

export interface BankStatementMeta {
  fileName: string;
  bankName: string;
  accountNumber?: string;
  accountHolder?: string;
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  totalTransactions: number;
  openingBalance?: number;
  closingBalance?: number;
  parsedAt: string;
  isPasswordProtected: boolean;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage
  fixedExpense: number;
  variableExpense: number;
  totalDebitsCount: number;
  totalCreditsCount: number;
  averageDailyExpense: number;
  largestExpense: number;
  largestExpenseDesc: string;
}

export interface CategorySpend {
  category: TransactionCategory;
  totalAmount: number;
  transactionCount: number;
  percentageOfExpense: number;
  color: string;
}

export interface BudgetLimit {
  id: string;
  category: TransactionCategory | 'ALL';
  monthlyLimit: number;
  warningThresholdPercent: number; // default 80%
}

export interface BudgetAlert {
  category: TransactionCategory | 'ALL';
  currentSpent: number;
  limit: number;
  percentSpent: number;
  status: 'NORMAL' | 'WARNING' | 'EXCEEDED';
  overspentAmount: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: 'Emergency Fund' | 'House Down Payment' | 'Retirement' | 'Vehicle' | 'Vacation' | 'Child Education' | 'Wealth Creation' | 'Other';
  targetAmount: number;
  currentSaved: number;
  targetDate: string; // YYYY-MM-DD
  monthlyContribution: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  panNumber?: string;
  employmentType: 'Salaried' | 'Self-Employed' | 'Business' | 'Professional' | 'Senior Citizen';
  taxRegimePreference: 'Old Regime' | 'New Regime' | 'Auto-Calculate Best';
  monthlyIncomeEstimate?: number;
  fixedMonthlyCommitments?: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface TaxDeductionItem {
  section: string;
  title: string;
  maxEligible: number;
  claimedFromStatement: number;
  userManualAddition: number;
  totalClaimed: number;
  transactionsLinked: { id: string; desc: string; amount: number; date: string }[];
  description: string;
}

export interface IndianTaxComputation {
  financialYear: '2024-25' | '2025-26';
  assessmentYear: '2025-26' | '2026-27';
  grossTotalIncome: number;
  
  // New Regime (Section 115BAC)
  newRegime: {
    standardDeduction: number;
    taxableIncome: number;
    taxOnIncome: number;
    rebate87A: number;
    healthAndEduCess: number;
    totalTaxPayable: number;
    effectiveTaxRate: number;
    breakdownSlabs: { slab: string; rate: string; taxAmount: number }[];
  };

  // Old Regime
  oldRegime: {
    standardDeduction: number;
    totalDeductionsChapterVIA: number;
    deductionsList: TaxDeductionItem[];
    taxableIncome: number;
    taxOnIncome: number;
    rebate87A: number;
    healthAndEduCess: number;
    totalTaxPayable: number;
    effectiveTaxRate: number;
    breakdownSlabs: { slab: string; rate: string; taxAmount: number }[];
  };

  recommendedRegime: 'Old Regime' | 'New Regime';
  taxDifference: number; // Savings between the two
}

export interface SpendingRecommendation {
  id: string;
  title: string;
  category: TransactionCategory;
  currentMonthlyAvg: number;
  recommendedLimit: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  actionTips: string[];
  impact: 'High' | 'Medium' | 'Low';
}

export interface ReminderItem {
  id: string;
  title: string;
  type?: 'BILL' | 'EMI' | 'TAX_DEADLINE' | 'SIP' | 'CUSTOM';
  category?: 'Tax Deadline' | 'SIP Investment' | 'EMI Payment' | 'Bill Payment' | 'Statement Review' | 'Custom';
  dueDate: string; // YYYY-MM-DD
  amount?: number;
  isRecurring: boolean;
  recurringFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  isCompleted: boolean;
  notes?: string;
}

export type Reminder = ReminderItem;

export interface AppStoredData {
  user: UserProfile | null;
  statementMeta: BankStatementMeta | null;
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: FinancialGoal[];
  reminders: ReminderItem[];
  customTaxDeductions?: Record<string, number>;
  lastSavedAt: string;
}
