import { useState } from 'react';
import {
  IndianTaxComputation,
  UserProfile,
  Transaction,
  TaxDeductionItem,
} from '../types';
import { generateItrReportPdf } from '../utils/taxPdfGenerator';
import {
  Calculator,
  Download,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IndianTaxFilerProps {
  taxComputation: IndianTaxComputation;
  user: UserProfile | null;
  transactions: Transaction[];
  customDeductions: Record<string, number>;
  onUpdateCustomDeduction: (section: string, amount: number) => void;
}

export function IndianTaxFiler({
  taxComputation,
  user,
  transactions,
  customDeductions,
  onUpdateCustomDeduction,
}: IndianTaxFilerProps) {
  const [activeRegimeView, setActiveRegimeView] = useState<'RECOMMENDED' | 'COMPARISON'>('COMPARISON');
  const [expandedSection, setExpandedSection] = useState<string | null>('80C');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const formatRupee = (val?: number) => {
    if (val === undefined || isNaN(val)) return '₹0';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateItrReportPdf(taxComputation, user, transactions);
    } catch (err) {
      console.error('Failed to generate ITR PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Indian Tax Filing Optimizer (FY {taxComputation.financialYear} / AY {taxComputation.assessmentYear})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              IT Act Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-detects tax-saving debits from your bank statement and compares New vs Old Tax Regimes.
          </p>
        </div>

        {/* Download PDF Button */}
        <button
          id="btn-download-tax-pdf"
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download ITR PDF Report'}</span>
        </button>
      </div>

      {/* Recommended Regime Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Recommended Tax Filing Option
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-600 text-white">
                {taxComputation.recommendedRegime}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {taxComputation.taxDifference > 0 ? (
                <>
                  You save <strong className="text-indigo-700">{formatRupee(taxComputation.taxDifference)}</strong> in taxes by opting for the {taxComputation.recommendedRegime}.
                </>
              ) : (
                'Both regimes result in the same tax liability for your current income level.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-xs text-slate-500">Final Tax Payable:</div>
            <div className="text-xl font-bold text-indigo-700 font-mono">
              {formatRupee(
                taxComputation.recommendedRegime === 'New Regime'
                  ? taxComputation.newRegime.totalTaxPayable
                  : taxComputation.oldRegime.totalTaxPayable
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Regime Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEW REGIME CARD (Section 115BAC) */}
        <div
          className={`rounded-xl p-5 border transition-all ${
            taxComputation.recommendedRegime === 'New Regime'
              ? 'bg-white border-2 border-indigo-600 shadow-sm'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">New Tax Regime (Section 115BAC)</h3>
                {taxComputation.recommendedRegime === 'New Regime' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Optimal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Default regime with ₹75,000 standard deduction & zero tax up to ₹7 Lakhs (Sec 87A).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Gross Total Income:</span>
              <span className="font-mono font-semibold text-slate-900">{formatRupee(taxComputation.grossTotalIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Standard Deduction:</span>
              <span className="font-mono text-emerald-600">- {formatRupee(taxComputation.newRegime.standardDeduction)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span className="text-slate-900 font-semibold">Net Taxable Income:</span>
              <span className="font-mono font-bold text-slate-900">{formatRupee(taxComputation.newRegime.taxableIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Tax on Slabs:</span>
              <span className="font-mono text-slate-900">{formatRupee(taxComputation.newRegime.taxOnIncome)}</span>
            </div>
            {taxComputation.newRegime.rebate87A > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500">Section 87A Full Rebate:</span>
                <span className="font-mono text-emerald-600">- {formatRupee(taxComputation.newRegime.rebate87A)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Health & Education Cess (4%):</span>
              <span className="font-mono text-slate-900">{formatRupee(taxComputation.newRegime.healthAndEduCess)}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm font-bold">
              <span className="text-slate-900">Total Tax Liability:</span>
              <span className="font-mono text-indigo-600 text-base">
                {formatRupee(taxComputation.newRegime.totalTaxPayable)}
              </span>
            </div>
          </div>

          {/* Slabs list */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Slab-wise breakdown
            </span>
            <div className="space-y-1 text-[11px]">
              {taxComputation.newRegime.breakdownSlabs.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-slate-500">
                  <span>{s.slab} ({s.rate}):</span>
                  <span className="font-mono text-slate-700">{formatRupee(s.taxAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div
          className={`rounded-xl p-5 border transition-all ${
            taxComputation.recommendedRegime === 'Old Regime'
              ? 'bg-white border-2 border-indigo-600 shadow-sm'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Old Tax Regime (With Deductions)</h3>
                {taxComputation.recommendedRegime === 'Old Regime' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Optimal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Allows Chapter VI-A deductions (80C up to 1.5L, 80D, NPS, Home Loan Interest).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Gross Total Income:</span>
              <span className="font-mono font-semibold text-slate-900">{formatRupee(taxComputation.grossTotalIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Standard Deduction:</span>
              <span className="font-mono text-emerald-600">- {formatRupee(taxComputation.oldRegime.standardDeduction)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Total Chapter VI-A Deductions:</span>
              <span className="font-mono text-emerald-600">- {formatRupee(taxComputation.oldRegime.totalDeductionsChapterVIA)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span className="text-slate-900 font-semibold">Net Taxable Income:</span>
              <span className="font-mono font-bold text-slate-900">{formatRupee(taxComputation.oldRegime.taxableIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Tax on Slabs:</span>
              <span className="font-mono text-slate-900">{formatRupee(taxComputation.oldRegime.taxOnIncome)}</span>
            </div>
            {taxComputation.oldRegime.rebate87A > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500">Section 87A Rebate:</span>
                <span className="font-mono text-emerald-600">- {formatRupee(taxComputation.oldRegime.rebate87A)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Health & Education Cess (4%):</span>
              <span className="font-mono text-slate-900">{formatRupee(taxComputation.oldRegime.healthAndEduCess)}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm font-bold">
              <span className="text-slate-900">Total Tax Liability:</span>
              <span className="font-mono text-indigo-600 text-base">
                {formatRupee(taxComputation.oldRegime.totalTaxPayable)}
              </span>
            </div>
          </div>

          {/* Slabs list */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Slab-wise breakdown
            </span>
            <div className="space-y-1 text-[11px]">
              {taxComputation.oldRegime.breakdownSlabs.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-slate-500">
                  <span>{s.slab} ({s.rate}):</span>
                  <span className="font-mono text-slate-700">{formatRupee(s.taxAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deductions Audit Trail & Manual Adjustment Section */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Statement Deductions Audit Trail & Additional Proofs
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Amounts auto-identified from your statement with attached transaction refs, plus fields to add off-statement deductions.
        </p>

        <div className="space-y-3">
          {taxComputation.oldRegime.deductionsList.map((ded) => {
            const isExpanded = expandedSection === ded.section;
            return (
              <div
                key={ded.section}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm"
              >
                <div
                  onClick={() => setExpandedSection(isExpanded ? null : ded.section)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Section {ded.section}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{ded.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{ded.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Claimed:</div>
                      <div className="text-sm font-bold font-mono text-indigo-600">
                        {formatRupee(ded.totalClaimed)} / {formatRupee(ded.maxEligible)}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-4">
                    {/* Linked Statement Transactions */}
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-2">
                        Linked Statement Transactions ({ded.transactionsLinked.length})
                      </span>
                      {ded.transactionsLinked.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No direct statement debits found matching Section {ded.section}. You can add manual receipts below.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {ded.transactionsLinked.map((tx, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 text-[11px]">{tx.date}</span>
                                <span className="text-slate-800">{tx.desc}</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-600">
                                {formatRupee(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manual additions input */}
                    <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Add Off-Statement Deductions (₹)
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Add off-statement EPF/PPF/Rent receipts not in this specific account statement.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id={`input-deduction-${ded.section}`}
                          type="number"
                          min="0"
                          max={ded.maxEligible}
                          value={customDeductions[ded.section] || ''}
                          onChange={(e) => onUpdateCustomDeduction(ded.section, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-32 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
