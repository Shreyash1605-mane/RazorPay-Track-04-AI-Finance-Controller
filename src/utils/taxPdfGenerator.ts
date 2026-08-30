import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IndianTaxComputation, UserProfile, Transaction } from '../types';

export function generateItrReportPdf(
  computation: IndianTaxComputation,
  user: UserProfile | null,
  transactions: Transaction[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formatInr = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'Rs. 0';
    return 'Rs. ' + Math.round(val).toLocaleString('en-IN');
  };

  const taxPayerName = (user?.name || 'Assessee / Tax Payer').toUpperCase();
  const panNumber = (user?.panNumber || 'XXXXX0000X').toUpperCase();
  const email = user?.email || 'N/A';
  const phone = user?.phone || 'N/A';
  const employmentType = user?.employmentType || 'Salaried Individual';
  const docRefId = `ITR-${computation.financialYear.replace('-', '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Top Color Banner
  doc.setFillColor(30, 41, 59); // Slate-900
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFillColor(79, 70, 229); // Indigo-600 accent bar
  doc.rect(0, 24, 210, 2, 'F');

  // Header Titles
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('INCOME TAX COMPUTATION & FILING REPORT', 14, 11);

  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  doc.setFont('helvetica', 'normal');
  doc.text(`Assessment Year: ${computation.assessmentYear}  |  Financial Year: ${computation.financialYear}  |  Form: ITR-1 / ITR-2 Computation`, 14, 18);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8);
  doc.text(`Ref: ${docRefId}`, 196, 11, { align: 'right' });
  doc.text(`Generated: ${currentDate} ${currentTime}`, 196, 18, { align: 'right' });

  // 1. Taxpayer Profile Box
  let currentY = 32;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. TAXPAYER / ASSESSEE IDENTIFICATION', 18, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Name: `, 18, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(taxPayerName, 30, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`PAN: `, 95, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(panNumber, 105, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: `, 150, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(employmentType, 162, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: `, 18, currentY + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(email, 30, currentY + 18);

  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: `, 95, currentY + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(phone, 108, currentY + 18);

  doc.setTextColor(71, 85, 105);
  doc.text(`Verification: `, 150, currentY + 18);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('Statement Verified', 168, currentY + 18);

  // 2. Executive Recommendation Card
  currentY += 27;
  const isNewOptimal = computation.recommendedRegime === 'New Regime';
  const optimalTax = isNewOptimal ? computation.newRegime.totalTaxPayable : computation.oldRegime.totalTaxPayable;
  const optimalTaxable = isNewOptimal ? computation.newRegime.taxableIncome : computation.oldRegime.taxableIncome;

  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(`RECOMMENDED TAX FILING REGIME: ${computation.recommendedRegime.toUpperCase()}`, 18, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  if (computation.taxDifference > 0) {
    doc.text(`Assessee saves ${formatInr(computation.taxDifference)} in total income tax by selecting ${computation.recommendedRegime}.`, 18, currentY + 12);
  } else {
    doc.text(`Both tax regimes produce identical tax liabilities for the computed income level.`, 18, currentY + 12);
  }

  doc.text(`Gross Income: ${formatInr(computation.grossTotalIncome)}   |   Net Taxable: ${formatInr(optimalTaxable)}   |   Effective Tax Rate: ${((optimalTax / (computation.grossTotalIncome || 1)) * 100).toFixed(2)}%`, 18, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text(`Net Tax: ${formatInr(optimalTax)}`, 190, currentY + 12, { align: 'right' });

  // 3. Regime Comparison Table
  currentY += 27;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. COMPARATIVE TAX COMPUTATION (NEW REGIME VS OLD REGIME)', 14, currentY);

  const comparisonRows = [
    [
      'Gross Total Income (Salary & Credits)',
      formatInr(computation.grossTotalIncome),
      formatInr(computation.grossTotalIncome),
    ],
    [
      'Less: Standard Deduction u/s 16(ia)',
      `- ${formatInr(computation.newRegime.standardDeduction)} (Rs. 75k)`,
      `- ${formatInr(computation.oldRegime.standardDeduction)} (Rs. 50k)`,
    ],
    [
      'Less: Chapter VI-A Total Deductions (80C, 80D, etc.)',
      'Nil (Not allowable u/s 115BAC)',
      `- ${formatInr(computation.oldRegime.totalDeductionsChapterVIA)}`,
    ],
    [
      'Net Taxable Income',
      formatInr(computation.newRegime.taxableIncome),
      formatInr(computation.oldRegime.taxableIncome),
    ],
    [
      'Tax on Total Income (Computed on Slabs)',
      formatInr(computation.newRegime.taxOnIncome),
      formatInr(computation.oldRegime.taxOnIncome),
    ],
    [
      'Less: Tax Rebate u/s 87A',
      computation.newRegime.rebate87A > 0 ? `- ${formatInr(computation.newRegime.rebate87A)}` : 'Nil',
      computation.oldRegime.rebate87A > 0 ? `- ${formatInr(computation.oldRegime.rebate87A)}` : 'Nil',
    ],
    [
      'Tax Payable after 87A Rebate',
      formatInr(Math.max(0, computation.newRegime.taxOnIncome - computation.newRegime.rebate87A)),
      formatInr(Math.max(0, computation.oldRegime.taxOnIncome - computation.oldRegime.rebate87A)),
    ],
    [
      'Add: Health & Education Cess (4%)',
      formatInr(computation.newRegime.healthAndEduCess),
      formatInr(computation.oldRegime.healthAndEduCess),
    ],
    [
      'TOTAL TAX PAYABLE (NET LIABILITY)',
      formatInr(computation.newRegime.totalTaxPayable),
      formatInr(computation.oldRegime.totalTaxPayable),
    ],
  ];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Income Head / Tax Computation Item', 'New Regime (Sec 115BAC)', 'Old Tax Regime']],
    body: comparisonRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 84 },
      1: { cellWidth: 49, halign: 'right' },
      2: { cellWidth: 49, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.row.index === 3 || data.row.index === 8) {
        data.cell.styles.fontStyle = 'bold';
        if (data.row.index === 8) {
          data.cell.styles.textColor = [79, 70, 229];
        }
      }
    },
  });

  const lastTableY = (doc as any).lastAutoTable.finalY || 135;

  // 4. Chapter VI-A Deductions Audit Trail Table
  let deductionsStartY = lastTableY + 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. CHAPTER VI-A DEDUCTIONS AUDIT TRAIL (OLD REGIME SUPPORTING)', 14, deductionsStartY);

  const deductionsRows = computation.oldRegime.deductionsList.map((d) => [
    `Sec ${d.section}`,
    d.title,
    formatInr(d.maxEligible),
    formatInr(d.claimedFromStatement),
    formatInr(d.userManualAddition),
    formatInr(d.totalClaimed),
  ]);

  deductionsRows.push([
    'TOTAL',
    'Total Chapter VI-A Deductions Eligible to be Claimed',
    '-',
    '-',
    '-',
    formatInr(computation.oldRegime.totalDeductionsChapterVIA),
  ]);

  autoTable(doc, {
    startY: deductionsStartY + 3,
    head: [['Section', 'Description / Eligible Investment Category', 'Max Cap', 'Statement Ref', 'Manual Ref', 'Claimed']],
    body: deductionsRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [30, 41, 59] },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 72 },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.row.index === deductionsRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [238, 242, 255];
      }
    },
  });

  const deductionsTableY = (doc as any).lastAutoTable.finalY || 195;

  // 5. Page 2: Statement Linked Transactions Schedule & Legal Declaration
  doc.addPage();

  // Page 2 Header Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHEDULE 1: TAX-SAVING STATEMENT AUDIT TRANSACTIONS', 14, 10);
  doc.setFontSize(7.5);
  doc.setTextColor(199, 210, 254);
  doc.setFont('helvetica', 'normal');
  doc.text(`PAN: ${panNumber}  |  Ref: ${docRefId}`, 196, 10, { align: 'right' });

  // Filter tax-linked transactions
  const taxTxns = transactions.filter((t) => t.taxSection);
  const scheduleRows = taxTxns.length > 0
    ? taxTxns.slice(0, 25).map((t) => [
        t.date,
        t.description,
        t.type,
        `Sec ${t.taxSection}`,
        formatInr(t.amount),
      ])
    : [
        ['-', 'No explicit tax sections tagged in statement debits', '-', '-', '-']
      ];

  autoTable(doc, {
    startY: 22,
    head: [['Date', 'Bank Statement Narration / Transaction Reference', 'Type', 'Tax Section Tag', 'Amount']],
    body: scheduleRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 95 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
      4: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
    },
  });

  const scheduleTableY = (doc as any).lastAutoTable.finalY || 120;

  // Verification & Statutory Declaration Box with Dedicated Spacious Signature Panels
  let declY = scheduleTableY + 8;
  if (declY + 88 > 275) {
    doc.addPage();
    declY = 22;
  }

  // Statutory Declaration Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, declY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('4. STATUTORY DECLARATION & AUDIT VERIFICATION', 18, declY + 5.5);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const declarationText = `I, ${taxPayerName} (PAN: ${panNumber}), solemnly declare that to the best of my knowledge and belief, the information given in this computation report is true, correct, and in accordance with the provisions of the Income Tax Act, 1961. The deductions claimed under Chapter VI-A are supported by legitimate banking transactions, receipts, and investment certificates.`;
  doc.text(declarationText, 18, declY + 11, { maxWidth: 174 });

  doc.text('Computation Standard: Finance Act for FY 2024-25 & AY 2025-26  |  Zero-Knowledge Encrypted Local Computation', 18, declY + 19);

  // Dedicated Spacious Signature Boxes for User & CA
  const sigBoxY = declY + 26;
  const boxWidth = 88;
  const boxHeight = 56;

  // 1. Assessee / Taxpayer Signature Box (Left)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, sigBoxY, boxWidth, boxHeight, 2, 2, 'FD');

  // Header tag inside box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, sigBoxY, boxWidth, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ASSESSEE / TAXPAYER SIGN-OFF', 18, sigBoxY + 5);

  // Signature drawing / signing space
  doc.setDrawColor(226, 232, 240);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(18, sigBoxY + 10, boxWidth - 8, 22, 1, 1, 'D');
  doc.setLineDashPattern([], 0); // reset line dash

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('[ Affix Assessee Physical / Digital Signature Here ]', 14 + boxWidth / 2, sigBoxY + 22, { align: 'center' });

  // Details below signature line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`Name: ${taxPayerName}`, 18, sigBoxY + 37);
  doc.text(`PAN: ${panNumber}`, 18, sigBoxY + 42);
  doc.text(`Date: ____ / ____ / 202___`, 18, sigBoxY + 47);
  doc.text(`Place: _____________________`, 18, sigBoxY + 52);

  // 2. Chartered Accountant / Tax Auditor Box (Right)
  const caBoxX = 14 + boxWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(caBoxX, sigBoxY, boxWidth, boxHeight, 2, 2, 'FD');

  // Header tag inside box
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.rect(caBoxX, sigBoxY, boxWidth, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('CHARTERED ACCOUNTANT / AUDITOR VERIFICATION', caBoxX + 4, sigBoxY + 5);

  // Signature & Seal drawing space
  doc.setDrawColor(199, 210, 254);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(caBoxX + 4, sigBoxY + 10, boxWidth - 8, 22, 1, 1, 'D');
  doc.setLineDashPattern([], 0); // reset line dash

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(129, 140, 248);
  doc.text('[ Authorized CA Signature & Professional Seal / Stamp ]', caBoxX + boxWidth / 2, sigBoxY + 22, { align: 'center' });

  // Details below signature line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`CA / Practitioner: ________________________`, caBoxX + 4, sigBoxY + 37);
  doc.text(`ICAI Membership No: ____________________`, caBoxX + 4, sigBoxY + 42);
  doc.text(`Firm Regn No (FRN): _____________________`, caBoxX + 4, sigBoxY + 47);
  doc.text(`UDIN / Ref No: __________________________`, caBoxX + 4, sigBoxY + 52);

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Official Indian Income Tax Filing Computation Report  |  AY ${computation.assessmentYear}  |  Assessee: ${taxPayerName}`, 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }

  // Save the PDF
  const safeName = user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'TaxPayer';
  const fileName = `ITR_Tax_Computation_Report_${safeName}_AY${computation.assessmentYear}_FY${computation.financialYear}.pdf`;
  doc.save(fileName);
}
