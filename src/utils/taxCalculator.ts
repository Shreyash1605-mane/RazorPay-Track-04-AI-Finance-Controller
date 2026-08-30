import { Transaction, UserProfile, IndianTaxComputation, TaxDeductionItem } from '../types';

export function calculateIndianTax(
  transactions: Transaction[],
  user: UserProfile | null,
  customDeductions: Record<string, number> = {}
): IndianTaxComputation {
  // Compute Gross Total Income from statement credits (Salary + Interest + Business Credits)
  const salaryCredits = transactions
    .filter(t => t.type === 'CREDIT' && (t.category === 'Salary & Income' || t.description.toLowerCase().includes('sal') || t.description.toLowerCase().includes('cr')))
    .reduce((sum, t) => sum + t.amount, 0);

  // If user provided a monthly income estimate and statement is short, annualized or use user estimate if larger
  const estimatedAnnualIncome = user?.monthlyIncomeEstimate ? user.monthlyIncomeEstimate * 12 : 0;
  const grossTotalIncome = Math.max(salaryCredits, estimatedAnnualIncome, 0);

  // Scan transactions for eligible deductions under Chapter VI-A
  const sec80CTransactions = transactions.filter(t => t.type === 'DEBIT' && t.taxSection === '80C');
  const sec80CAmount = sec80CTransactions.reduce((s, t) => s + t.amount, 0) + (customDeductions['80C'] || 0);

  const sec80DTransactions = transactions.filter(t => t.type === 'DEBIT' && t.taxSection === '80D');
  const sec80DAmount = sec80DTransactions.reduce((s, t) => s + t.amount, 0) + (customDeductions['80D'] || 0);

  const npsTransactions = transactions.filter(t => t.type === 'DEBIT' && t.taxSection === '80CCD(1B)');
  const npsAmount = npsTransactions.reduce((s, t) => s + t.amount, 0) + (customDeductions['80CCD(1B)'] || 0);

  const homeLoanIntTransactions = transactions.filter(t => t.type === 'DEBIT' && t.taxSection === '24(b)');
  const homeLoanIntAmount = homeLoanIntTransactions.reduce((s, t) => s + t.amount, 0) + (customDeductions['24(b)'] || 0);

  const sec80TTATransactions = transactions.filter(t => t.type === 'CREDIT' && t.taxSection === '80TTA');
  const sec80TTAAmount = sec80TTATransactions.reduce((s, t) => s + t.amount, 0) + (customDeductions['80TTA'] || 0);

  const deductionsList: TaxDeductionItem[] = [
    {
      section: '80C',
      title: 'Life Insurance, ELSS, PPF, EPF & Tuition',
      maxEligible: 150000,
      claimedFromStatement: sec80CAmount - (customDeductions['80C'] || 0),
      userManualAddition: customDeductions['80C'] || 0,
      totalClaimed: Math.min(sec80CAmount, 150000),
      transactionsLinked: sec80CTransactions.map(t => ({ id: t.id, desc: t.description, amount: t.amount, date: t.date })),
      description: 'Investments in ELSS Mutual Funds, PPF, EPF, Life Insurance Premium, Principal repayment of Home Loan.',
    },
    {
      section: '80D',
      title: 'Health Insurance Premium & Medical Checkup',
      maxEligible: user?.employmentType === 'Senior Citizen' ? 50000 : 25000,
      claimedFromStatement: sec80DAmount - (customDeductions['80D'] || 0),
      userManualAddition: customDeductions['80D'] || 0,
      totalClaimed: Math.min(sec80DAmount, user?.employmentType === 'Senior Citizen' ? 50000 : 25000),
      transactionsLinked: sec80DTransactions.map(t => ({ id: t.id, desc: t.description, amount: t.amount, date: t.date })),
      description: 'Mediclaim insurance premium paid for self, spouse, children and parents.',
    },
    {
      section: '80CCD(1B)',
      title: 'National Pension System (NPS Additional)',
      maxEligible: 50000,
      claimedFromStatement: npsAmount - (customDeductions['80CCD(1B)'] || 0),
      userManualAddition: customDeductions['80CCD(1B)'] || 0,
      totalClaimed: Math.min(npsAmount, 50000),
      transactionsLinked: npsTransactions.map(t => ({ id: t.id, desc: t.description, amount: t.amount, date: t.date })),
      description: 'Additional voluntary contribution to NPS Tier-1 accounts over and above 80C.',
    },
    {
      section: '24(b)',
      title: 'Interest on Self-Occupied Home Loan',
      maxEligible: 200000,
      claimedFromStatement: homeLoanIntAmount - (customDeductions['24(b)'] || 0),
      userManualAddition: customDeductions['24(b)'] || 0,
      totalClaimed: Math.min(homeLoanIntAmount, 200000),
      transactionsLinked: homeLoanIntTransactions.map(t => ({ id: t.id, desc: t.description, amount: t.amount, date: t.date })),
      description: 'Deduction on interest component of residential property loan.',
    },
    {
      section: '80TTA / 80TTB',
      title: 'Interest on Savings Bank Accounts',
      maxEligible: user?.employmentType === 'Senior Citizen' ? 50000 : 10000,
      claimedFromStatement: sec80TTAAmount - (customDeductions['80TTA'] || 0),
      userManualAddition: customDeductions['80TTA'] || 0,
      totalClaimed: Math.min(sec80TTAAmount, user?.employmentType === 'Senior Citizen' ? 50000 : 10000),
      transactionsLinked: sec80TTATransactions.map(t => ({ id: t.id, desc: t.description, amount: t.amount, date: t.date })),
      description: 'Interest earned on savings deposits.',
    },
  ];

  const totalDeductionsChapterVIA = deductionsList.reduce((sum, d) => sum + d.totalClaimed, 0);

  // ===================== NEW REGIME (FY 2024-25 / FY 2025-26 Section 115BAC) =====================
  const newRegimeStdDeduction = user?.employmentType === 'Salaried' || user?.employmentType === 'Senior Citizen' ? 75000 : 0;
  const newRegimeTaxable = Math.max(0, grossTotalIncome - newRegimeStdDeduction);

  let newRegimeTax = 0;
  const newSlabs: { slab: string; rate: string; taxAmount: number }[] = [];

  // Slab 1: 0 - 3,00,000 (0%)
  const newS1 = Math.min(newRegimeTaxable, 300000);
  newSlabs.push({ slab: '₹0 - ₹3,00,000', rate: '0%', taxAmount: 0 });

  // Slab 2: 3,00,001 - 7,00,000 (5%)
  if (newRegimeTaxable > 300000) {
    const amt = Math.min(newRegimeTaxable - 300000, 400000);
    const tax = amt * 0.05;
    newRegimeTax += tax;
    newSlabs.push({ slab: '₹3,00,001 - ₹7,00,000', rate: '5%', taxAmount: tax });
  }

  // Slab 3: 7,00,001 - 10,00,000 (10%)
  if (newRegimeTaxable > 700000) {
    const amt = Math.min(newRegimeTaxable - 700000, 300000);
    const tax = amt * 0.10;
    newRegimeTax += tax;
    newSlabs.push({ slab: '₹7,00,001 - ₹10,00,000', rate: '10%', taxAmount: tax });
  }

  // Slab 4: 10,00,001 - 12,00,000 (15%)
  if (newRegimeTaxable > 1000000) {
    const amt = Math.min(newRegimeTaxable - 1000000, 200000);
    const tax = amt * 0.15;
    newRegimeTax += tax;
    newSlabs.push({ slab: '₹10,00,001 - ₹12,00,000', rate: '15%', taxAmount: tax });
  }

  // Slab 5: 12,00,001 - 15,00,000 (20%)
  if (newRegimeTaxable > 1200000) {
    const amt = Math.min(newRegimeTaxable - 1200000, 300000);
    const tax = amt * 0.20;
    newRegimeTax += tax;
    newSlabs.push({ slab: '₹12,00,001 - ₹15,00,000', rate: '20%', taxAmount: tax });
  }

  // Slab 6: > 15,00,000 (30%)
  if (newRegimeTaxable > 1500000) {
    const amt = newRegimeTaxable - 1500000;
    const tax = amt * 0.30;
    newRegimeTax += tax;
    newSlabs.push({ slab: 'Above ₹15,00,000', rate: '30%', taxAmount: tax });
  }

  // Section 87A Rebate in New Regime: If taxable income <= 7,00,000, full rebate
  let newRebate87A = 0;
  if (newRegimeTaxable <= 700000 && newRegimeTax > 0) {
    newRebate87A = newRegimeTax;
  }
  const newTaxAfterRebate = Math.max(0, newRegimeTax - newRebate87A);
  const newCess = Math.round(newTaxAfterRebate * 0.04);
  const newTotalTax = newTaxAfterRebate + newCess;

  // ===================== OLD REGIME =====================
  const oldStdDeduction = user?.employmentType === 'Salaried' || user?.employmentType === 'Senior Citizen' ? 50000 : 0;
  const oldRegimeTaxable = Math.max(0, grossTotalIncome - oldStdDeduction - totalDeductionsChapterVIA);

  let oldRegimeTax = 0;
  const oldSlabs: { slab: string; rate: string; taxAmount: number }[] = [];

  const exemptionLimit = user?.employmentType === 'Senior Citizen' ? 300000 : 250000;
  oldSlabs.push({ slab: `₹0 - ₹${(exemptionLimit / 100000).toFixed(1)} Lakhs`, rate: '0%', taxAmount: 0 });

  // Slab 1: 2.5L to 5L (5%)
  if (oldRegimeTaxable > exemptionLimit) {
    const amt = Math.min(oldRegimeTaxable - exemptionLimit, 500000 - exemptionLimit);
    const tax = amt * 0.05;
    oldRegimeTax += tax;
    oldSlabs.push({ slab: `₹${(exemptionLimit / 100000).toFixed(1)}L - ₹5,00,000`, rate: '5%', taxAmount: tax });
  }

  // Slab 2: 5L to 10L (20%)
  if (oldRegimeTaxable > 500000) {
    const amt = Math.min(oldRegimeTaxable - 500000, 500000);
    const tax = amt * 0.20;
    oldRegimeTax += tax;
    oldSlabs.push({ slab: '₹5,00,001 - ₹10,00,000', rate: '20%', taxAmount: tax });
  }

  // Slab 3: > 10L (30%)
  if (oldRegimeTaxable > 1000000) {
    const amt = oldRegimeTaxable - 1000000;
    const tax = amt * 0.30;
    oldRegimeTax += tax;
    oldSlabs.push({ slab: 'Above ₹10,00,000', rate: '30%', taxAmount: tax });
  }

  // Section 87A Rebate in Old Regime: Taxable income <= 5,00,000 -> max ₹12,500 rebate
  let oldRebate87A = 0;
  if (oldRegimeTaxable <= 500000 && oldRegimeTax > 0) {
    oldRebate87A = Math.min(oldRegimeTax, 12500);
  }
  const oldTaxAfterRebate = Math.max(0, oldRegimeTax - oldRebate87A);
  const oldCess = Math.round(oldTaxAfterRebate * 0.04);
  const oldTotalTax = oldTaxAfterRebate + oldCess;

  const recommendedRegime = newTotalTax <= oldTotalTax ? 'New Regime' : 'Old Regime';
  const taxDifference = Math.abs(newTotalTax - oldTotalTax);

  return {
    financialYear: '2024-25',
    assessmentYear: '2025-26',
    grossTotalIncome,
    newRegime: {
      standardDeduction: newRegimeStdDeduction,
      taxableIncome: newRegimeTaxable,
      taxOnIncome: newRegimeTax,
      rebate87A: newRebate87A,
      healthAndEduCess: newCess,
      totalTaxPayable: newTotalTax,
      effectiveTaxRate: grossTotalIncome > 0 ? (newTotalTax / grossTotalIncome) * 100 : 0,
      breakdownSlabs: newSlabs,
    },
    oldRegime: {
      standardDeduction: oldStdDeduction,
      totalDeductionsChapterVIA,
      deductionsList,
      taxableIncome: oldRegimeTaxable,
      taxOnIncome: oldRegimeTax,
      rebate87A: oldRebate87A,
      healthAndEduCess: oldCess,
      totalTaxPayable: oldTotalTax,
      effectiveTaxRate: grossTotalIncome > 0 ? (oldTotalTax / grossTotalIncome) * 100 : 0,
      breakdownSlabs: oldSlabs,
    },
    recommendedRegime,
    taxDifference,
  };
}

/**
 * Generate complete Indian Tax Filing package as JSON
 */
export function generateTaxFilingJson(
  computation: IndianTaxComputation,
  user: UserProfile | null,
  transactions: Transaction[]
): string {
  const chosenRegime = computation.recommendedRegime === 'New Regime' ? computation.newRegime : computation.oldRegime;

  const taxPackage = {
    formType: 'ITR-1 (SAHAJ) / ITR-2 Indian Income Tax Computation',
    taxPayer: {
      name: user?.name || 'Tax Payer',
      email: user?.email || '',
      phone: user?.phone || '',
      panNumber: user?.panNumber || 'XXXXX0000X',
      employmentType: user?.employmentType || 'Salaried',
      financialYear: computation.financialYear,
      assessmentYear: computation.assessmentYear,
    },
    incomeDetails: {
      grossTotalIncome: computation.grossTotalIncome,
      standardDeductionClaimed: chosenRegime.standardDeduction,
      chapterVIADeductionsClaimed: computation.recommendedRegime === 'Old Regime' ? computation.oldRegime.totalDeductionsChapterVIA : 0,
      netTaxableIncome: chosenRegime.taxableIncome,
    },
    taxCalculationSummary: {
      recommendedRegime: computation.recommendedRegime,
      taxBeforeRebate: chosenRegime.taxOnIncome,
      section87ARebate: chosenRegime.rebate87A,
      taxAfterRebate: Math.max(0, chosenRegime.taxOnIncome - chosenRegime.rebate87A),
      healthAndEducationCess4Percent: chosenRegime.healthAndEduCess,
      totalTaxPayable: chosenRegime.totalTaxPayable,
      savingsOverOtherRegime: computation.taxDifference,
    },
    deductionsAuditTrail: computation.oldRegime.deductionsList.map(d => ({
      section: d.section,
      title: d.title,
      claimedAmount: d.totalClaimed,
      linkedBankTransactions: d.transactionsLinked,
    })),
    sourceTransactionsAuditCount: transactions.length,
    generatedAt: new Date().toISOString(),
    complianceNotes: 'Generated per the rules of Income Tax Act 1961, Section 115BAC (New Regime) and Chapter VI-A (Old Regime).',
  };

  return JSON.stringify(taxPackage, null, 2);
}

/**
 * Trigger browser file download
 */
export function computeIndianTaxLiability(
  grossTotalIncome: number,
  transactions: Transaction[],
  customDeductions: Record<string, number> = {}
): IndianTaxComputation {
  return calculateIndianTax(transactions, { monthlyIncomeEstimate: grossTotalIncome / 12 } as any, customDeductions);
}

export function triggerFileDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
