import { useState, useMemo } from 'react';
import { Transaction, TransactionCategory, BankStatementMeta } from '../types';
import { CATEGORY_COLORS } from '../utils/categorizer';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Tag,
  Receipt,
  FileText,
  Calendar,
} from 'lucide-react';

interface StatementLedgerViewProps {
  transactions: Transaction[];
  meta: BankStatementMeta | null;
  onUpdateTransactionCategory: (txId: string, newCategory: TransactionCategory) => void;
}

export function StatementLedgerView({
  transactions,
  meta,
  onUpdateTransactionCategory,
}: StatementLedgerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'balance'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.date.includes(searchTerm);

      const matchType = selectedType === 'ALL' || tx.type === selectedType;
      const matchCategory = selectedCategory === 'ALL' || tx.category === selectedCategory;

      return matchSearch && matchType && matchCategory;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [transactions, searchTerm, selectedType, selectedCategory, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatRupee = (num?: number) => {
    if (num === undefined || isNaN(num)) return '-';
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Narration / Description', 'Chq/Ref No', 'Type', 'Category', 'Debit (Withdrawal)', 'Credit (Deposit)', 'Balance'];
    const rows = filteredTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.refNo,
      t.type,
      t.category,
      t.type === 'DEBIT' ? t.amount : '',
      t.type === 'CREDIT' ? t.amount : '',
      t.balance !== undefined ? t.balance : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Parsed_Statement_${meta?.bankName || 'Bank'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header & Meta */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Parsed Statement Ledger
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {transactions.length} Records
            </span>
          </div>
          {meta && (
            <p className="text-xs text-slate-500 mt-1">
              Bank: <strong className="text-slate-800">{meta.bankName}</strong> • Period:{' '}
              <span className="text-slate-600">{meta.statementPeriod.startDate} to {meta.statementPeriod.endDate}</span> • File:{' '}
              <span className="text-slate-600">{meta.fileName}</span>
            </p>
          )}
        </div>

        <button
          id="btn-export-ledger-csv"
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Export Filtered Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="ledger-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search narration, ref, or amount..."
            className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
          />
        </div>

        {/* Type Filter */}
        <select
          id="ledger-type-filter"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as any);
            setCurrentPage(1);
          }}
          className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="ALL">All Transaction Types</option>
          <option value="DEBIT">Only Withdrawals (Debits)</option>
          <option value="CREDIT">Only Deposits (Credits)</option>
        </select>

        {/* Category Filter */}
        <select
          id="ledger-category-filter"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="ALL">All Categories ({categoriesList.length})</option>
          {categoriesList.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <select
            id="ledger-sort-field"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="balance">Sort by Balance</option>
          </select>
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-sm cursor-pointer"
            title={sortAsc ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Display */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 min-w-[220px]">Narration / Description</th>
              <th className="py-3 px-4">Ref / Chq No</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Debit (Withdrawal)</th>
              <th className="py-3 px-4 text-right">Credit (Deposit)</th>
              <th className="py-3 px-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No transactions match your current search or filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const catColor = CATEGORY_COLORS[tx.category] || '#64748B';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{tx.description}</div>
                      {tx.taxSection && (
                        <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Sec {tx.taxSection}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {tx.refNo || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${catColor}15`,
                          color: catColor,
                          border: `1px solid ${catColor}30`,
                        }}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                      {tx.type === 'DEBIT' ? formatRupee(tx.amount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">
                      {tx.type === 'CREDIT' ? formatRupee(tx.amount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatRupee(tx.balance)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
            {filteredTransactions.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-medium cursor-pointer shadow-sm"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-mono text-slate-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-medium cursor-pointer shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
