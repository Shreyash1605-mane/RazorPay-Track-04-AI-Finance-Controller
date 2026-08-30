import { useState, useMemo } from 'react';
import { Transaction, CategorySpend } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { CATEGORY_COLORS } from '../utils/categorizer';
import { BarChart3, PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react';

interface SpendingChartsProps {
  transactions: Transaction[];
  categorySpends: CategorySpend[];
}

export function SpendingCharts({ transactions, categorySpends }: SpendingChartsProps) {
  const [activeTab, setActiveTab] = useState<'MONTHLY' | 'CATEGORIES' | 'CASHFLOW'>('MONTHLY');

  // Monthly Aggregate calculation
  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, { month: string; income: number; expense: number; net: number }>();

    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, { month: monthKey, income: 0, expense: 0, net: 0 });
      }
      const record = monthsMap.get(monthKey)!;
      if (t.type === 'CREDIT') {
        record.income += t.amount;
      } else {
        record.expense += t.amount;
      }
      record.net = record.income - record.expense;
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // Cashflow Burn Rate Trend by Day
  const dailyCashFlowData = useMemo(() => {
    const daysMap = new Map<string, { date: string; cumulativeExpense: number; cumulativeIncome: number }>();
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    let runExp = 0;
    let runInc = 0;

    sorted.forEach(t => {
      if (t.type === 'DEBIT') runExp += t.amount;
      if (t.type === 'CREDIT') runInc += t.amount;
      daysMap.set(t.date, {
        date: t.date.substring(5), // MM-DD
        cumulativeExpense: runExp,
        cumulativeIncome: runInc,
      });
    });

    return Array.from(daysMap.values());
  }, [transactions]);

  // Top 8 categories for clean pie chart
  const pieData = useMemo(() => {
    const top = categorySpends.slice(0, 8);
    const rest = categorySpends.slice(8);
    const restTotal = rest.reduce((s, c) => s + c.totalAmount, 0);

    const result: { name: string; value: number; color: string }[] = top.map(c => ({
      name: c.category as string,
      value: c.totalAmount,
      color: c.color,
    }));

    if (restTotal > 0) {
      result.push({
        name: 'Other Small Categories',
        value: restTotal,
        color: '#64748B',
      });
    }

    return result;
  }, [categorySpends]);

  const formatTooltipRupee = (value: number) => {
    return '₹' + Math.round(value).toLocaleString('en-IN');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Spending & Cashflow Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive visualization of month-over-month trends, category distribution, and inflow velocity.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60 self-stretch sm:self-auto">
          <button
            id="tab-chart-monthly"
            type="button"
            onClick={() => setActiveTab('MONTHLY')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'MONTHLY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Monthly Trends</span>
          </button>
          <button
            id="tab-chart-categories"
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'CATEGORIES' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Category Share</span>
          </button>
          <button
            id="tab-chart-cashflow"
            type="button"
            onClick={() => setActiveTab('CASHFLOW')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'CASHFLOW' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cash Flow Trajectory</span>
          </button>
        </div>
      </div>

      {/* Charts Area */}
      <div className="h-[320px] w-full">
        {activeTab === 'MONTHLY' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#0f172a',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatTooltipRupee(Number(val)), '']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#475569' }} />
              <Bar dataKey="income" name="Incoming Credits (₹)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Outgoing Debits (₹)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'CATEGORIES' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#0f172a',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatTooltipRupee(Number(val)), 'Spent']}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: '11px', color: '#475569', paddingTop: '15px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'CASHFLOW' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyCashFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#0f172a',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatTooltipRupee(Number(val)), '']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#475569' }} />
              <Area
                type="monotone"
                dataKey="cumulativeIncome"
                name="Cumulative Inflow (₹)"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="cumulativeExpense"
                name="Cumulative Outflow (₹)"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
