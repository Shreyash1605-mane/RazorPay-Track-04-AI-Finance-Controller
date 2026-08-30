import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { Transaction, BankStatementMeta } from '../types';
import { categorizeTransaction } from './categorizer';

// Set up pdf.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ParseResult {
  meta: BankStatementMeta;
  transactions: Transaction[];
  rawText?: string;
  isPasswordProtected: boolean;
  unlockedWithPassword?: boolean;
}

// Clean number strings (handles Indian comma format: 1,50,000.00 or 150000.00 or CR / DR suffixes)
function parseAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  const str = String(val).trim().replace(/,/g, '').replace(/INR|Rs\.|₹/gi, '').trim();
  const cleaned = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function cleanDateStr(val: string): string {
  if (!val) return new Date().toISOString().split('T')[0];
  const str = val.trim();
  
  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // DD-MMM-YYYY (e.g. 15-Jan-2025 or 15/Jan/2025)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const ddmmmyyyy = str.match(/^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})/);
  if (ddmmmyyyy) {
    const day = ddmmmyyyy[1].padStart(2, '0');
    const mStr = ddmmmyyyy[2].toLowerCase();
    const month = monthNames[mStr] || '01';
    let year = ddmmmyyyy[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
  }

  return str;
}

// Detect bank name from text
function detectBankName(text: string): string {
  const t = text.toUpperCase();
  if (t.includes('HDFC BANK')) return 'HDFC Bank';
  if (t.includes('STATE BANK OF INDIA') || t.includes('SBI')) return 'State Bank of India (SBI)';
  if (t.includes('ICICI BANK')) return 'ICICI Bank';
  if (t.includes('AXIS BANK')) return 'Axis Bank';
  if (t.includes('KOTAK MAHINDRA') || t.includes('KOTAK')) return 'Kotak Mahindra Bank';
  if (t.includes('PUNJAB NATIONAL BANK') || t.includes('PNB')) return 'Punjab National Bank';
  if (t.includes('BANK OF BARODA') || t.includes('BOB')) return 'Bank of Baroda';
  if (t.includes('CANARA BANK')) return 'Canara Bank';
  if (t.includes('INDUSIND BANK')) return 'IndusInd Bank';
  if (t.includes('IDFC FIRST')) return 'IDFC First Bank';
  if (t.includes('UNION BANK')) return 'Union Bank of India';
  if (t.includes('YES BANK')) return 'Yes Bank';
  if (t.includes('FEDERAL BANK')) return 'Federal Bank';
  return 'Indian Scheduled Commercial Bank';
}

/**
 * Parse CSV format
 */
export async function parseCsvStatement(file: File): Promise<ParseResult> {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (!rows || rows.length === 0) {
          return reject(new Error('CSV file is empty.'));
        }

        const transactions: Transaction[] = [];
        let headerIndex = -1;
        let dateCol = -1;
        let descCol = -1;
        let refCol = -1;
        let debitCol = -1;
        let creditCol = -1;
        let amountCol = -1;
        let typeCol = -1;
        let balanceCol = -1;

        // Scan for header row
        for (let i = 0; i < Math.min(rows.length, 30); i++) {
          const row = rows[i].map(c => String(c).toLowerCase().trim());
          const hasDate = row.some((c, idx) => {
            if (c.includes('date') || c.includes('txn date') || c.includes('value date')) {
              dateCol = idx;
              return true;
            }
            return false;
          });
          const hasDesc = row.some((c, idx) => {
            if (c.includes('narration') || c.includes('description') || c.includes('particulars') || c.includes('details') || c.includes('remark')) {
              descCol = idx;
              return true;
            }
            return false;
          });

          if (hasDate && hasDesc) {
            headerIndex = i;
            // find other columns
            row.forEach((c, idx) => {
              if (c.includes('chq') || c.includes('ref') || c.includes('cheque') || c.includes('utr') || c.includes('trans id')) refCol = idx;
              if (c.includes('dr') || c.includes('debit') || c.includes('withdrawal')) debitCol = idx;
              if (c.includes('cr') || c.includes('credit') || c.includes('deposit')) creditCol = idx;
              if (c.includes('amount') || c.includes('txn amount')) amountCol = idx;
              if (c.includes('type') || c.includes('cr/dr')) typeCol = idx;
              if (c.includes('bal') || c.includes('closing')) balanceCol = idx;
            });
            break;
          }
        }

        // Fallback default column indices if no standard header
        if (headerIndex === -1) {
          dateCol = 0;
          descCol = 1;
          debitCol = 2;
          creditCol = 3;
          balanceCol = 4;
          headerIndex = 0;
        }

        let runningBalance = 0;

        for (let i = headerIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length <= 1) continue;

          const rawDate = row[dateCol] || '';
          const desc = row[descCol] || row[1] || 'Transaction';
          const ref = refCol !== -1 ? row[refCol] || '-' : '-';

          let debit = 0;
          let credit = 0;
          let type: 'DEBIT' | 'CREDIT' = 'DEBIT';
          let amount = 0;

          if (debitCol !== -1 && row[debitCol]) {
            debit = parseAmount(row[debitCol]);
          }
          if (creditCol !== -1 && row[creditCol]) {
            credit = parseAmount(row[creditCol]);
          }

          if (debit > 0) {
            type = 'DEBIT';
            amount = debit;
          } else if (credit > 0) {
            type = 'CREDIT';
            amount = credit;
          } else if (amountCol !== -1 && row[amountCol]) {
            amount = parseAmount(row[amountCol]);
            const typeStr = typeCol !== -1 ? String(row[typeCol]).toUpperCase() : '';
            type = typeStr.includes('CR') || typeStr.includes('CREDIT') ? 'CREDIT' : 'DEBIT';
          }

          if (amount === 0) continue;

          const bal = balanceCol !== -1 && row[balanceCol] ? parseAmount(row[balanceCol]) : undefined;
          if (bal !== undefined && bal > 0) runningBalance = bal;

          const cleanedDate = cleanDateStr(rawDate);
          const catInfo = categorizeTransaction(desc, type, amount);

          transactions.push({
            id: `tx_${i}_${Date.now()}`,
            date: cleanedDate,
            description: desc.trim(),
            refNo: ref.trim(),
            amount,
            type,
            balance: bal || runningBalance,
            category: catInfo.category,
            isFixedExpense: catInfo.isFixed,
            isTaxDeductible: catInfo.isTaxDeductible,
            taxSection: catInfo.taxSection,
          });
        }

        const dates = transactions.map(t => t.date).sort();
        const bankName = detectBankName(text);

        resolve({
          meta: {
            fileName: file.name,
            bankName,
            statementPeriod: {
              startDate: dates[0] || new Date().toISOString().split('T')[0],
              endDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
            },
            totalTransactions: transactions.length,
            openingBalance: transactions[0]?.balance,
            closingBalance: transactions[transactions.length - 1]?.balance,
            parsedAt: new Date().toISOString(),
            isPasswordProtected: false,
          },
          transactions,
          isPasswordProtected: false,
        });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Parse Excel format (.xlsx, .xls)
 */
export async function parseExcelStatement(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const csvContent = XLSX.utils.sheet_to_csv(sheet);

  const virtualFile = new File([csvContent], file.name.replace(/\.xlsx?$/i, '.csv'), {
    type: 'text/csv',
  });

  return parseCsvStatement(virtualFile);
}

/**
 * Parse PDF format (supports password-unlock)
 */
export async function parsePdfStatement(file: File, password?: string): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      password: password || undefined,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    if (err.name === 'PasswordException' || err.message?.includes('Password') || err.code === 1) {
      const error: any = new Error('This PDF is password-protected. Please enter your password to unlock.');
      error.isPasswordRequired = true;
      throw error;
    }
    throw err;
  }

  // Extract all text and coordinate rows from PDF pages
  let fullText = '';
  const textLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    
    // Group text items by Y coordinate to recreate rows
    const items = content.items as any[];
    const rowsMap = new Map<number, { x: number; text: string }[]>();

    for (const item of items) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      if (!rowsMap.has(y)) {
        rowsMap.set(y, []);
      }
      rowsMap.get(y)!.push({ x: item.transform[4], text: item.str });
    }

    // Sort rows from top to bottom
    const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const rowItems = rowsMap.get(y)!.sort((a, b) => a.x - b.x);
      const line = rowItems.map(i => i.text.trim()).filter(Boolean).join(' | ');
      if (line) {
        textLines.push(line);
        fullText += line + '\n';
      }
    }
  }

  const transactions: Transaction[] = [];
  const bankName = detectBankName(fullText);

  // Parse lines for Indian transaction formats
  // Typical formats:
  // Date | Narration | Chq/Ref | Value Date | Withdrawal (Dr) | Deposit (Cr) | Closing Balance
  const dateRegex = /(\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{1,2}-[A-Za-z]{3}-\d{2,4}\b)/;

  let currentTx: Partial<Transaction> | null = null;

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);

    // Check if line starts with or contains a transaction date
    const dateMatch = line.match(dateRegex);

    if (dateMatch && parts.length >= 3) {
      // If we had a previous pending transaction, commit it
      if (currentTx && currentTx.amount && currentTx.date) {
        const catInfo = categorizeTransaction(currentTx.description || '', currentTx.type || 'DEBIT', currentTx.amount);
        transactions.push({
          id: `pdf_tx_${transactions.length}_${Date.now()}`,
          date: cleanDateStr(currentTx.date),
          description: currentTx.description || 'Transaction',
          refNo: currentTx.refNo || '-',
          amount: currentTx.amount,
          type: currentTx.type || 'DEBIT',
          balance: currentTx.balance,
          category: catInfo.category,
          isFixedExpense: catInfo.isFixed,
          isTaxDeductible: catInfo.isTaxDeductible,
          taxSection: catInfo.taxSection,
        });
        currentTx = null;
      }

      // Extract numbers from the parts
      const numbersInLine: number[] = [];
      const nonNumberParts: string[] = [];

      parts.forEach(p => {
        const cleaned = p.replace(/,/g, '').replace(/INR|Rs\.|₹/gi, '').trim();
        if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
          numbersInLine.push(parseFloat(cleaned));
        } else {
          nonNumberParts.push(p);
        }
      });

      const dateStr = dateMatch[0];
      const desc = nonNumberParts.filter(p => !p.match(dateRegex)).join(' ');

      // Determine amount, type, balance
      let amount = 0;
      let type: 'DEBIT' | 'CREDIT' = 'DEBIT';
      let balance: number | undefined = undefined;

      if (line.toUpperCase().includes(' CR') || line.toUpperCase().includes('CREDIT')) {
        type = 'CREDIT';
      } else if (line.toUpperCase().includes(' DR') || line.toUpperCase().includes('DEBIT')) {
        type = 'DEBIT';
      }

      if (numbersInLine.length >= 2) {
        amount = numbersInLine[0];
        balance = numbersInLine[numbersInLine.length - 1];
      } else if (numbersInLine.length === 1) {
        amount = numbersInLine[0];
      }

      if (amount > 0) {
        currentTx = {
          date: dateStr,
          description: desc || 'Bank Transaction',
          refNo: '-',
          amount: Math.abs(amount),
          type,
          balance,
        };
      }
    } else if (currentTx && parts.length > 0 && !line.includes('Page') && !line.includes('Statement')) {
      // Append multi-line narration
      currentTx.description = (currentTx.description + ' ' + parts.join(' ')).trim();
    }
  }

  // Commit last pending transaction
  if (currentTx && currentTx.amount && currentTx.date) {
    const catInfo = categorizeTransaction(currentTx.description || '', currentTx.type || 'DEBIT', currentTx.amount);
    transactions.push({
      id: `pdf_tx_${transactions.length}_${Date.now()}`,
      date: cleanDateStr(currentTx.date),
      description: currentTx.description || 'Transaction',
      refNo: currentTx.refNo || '-',
      amount: currentTx.amount,
      type: currentTx.type || 'DEBIT',
      balance: currentTx.balance,
      category: catInfo.category,
      isFixedExpense: catInfo.isFixed,
      isTaxDeductible: catInfo.isTaxDeductible,
      taxSection: catInfo.taxSection,
    });
  }

  const dates = transactions.map(t => t.date).sort();

  return {
    meta: {
      fileName: file.name,
      bankName,
      statementPeriod: {
        startDate: dates[0] || new Date().toISOString().split('T')[0],
        endDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
      },
      totalTransactions: transactions.length,
      openingBalance: transactions[0]?.balance,
      closingBalance: transactions[transactions.length - 1]?.balance,
      parsedAt: new Date().toISOString(),
      isPasswordProtected: !!password,
    },
    transactions,
    rawText: fullText,
    isPasswordProtected: !!password,
    unlockedWithPassword: !!password,
  };
}

/**
 * Universal statement file dispatcher
 */
export async function parseStatementFile(file: File, password?: string): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    return parsePdfStatement(file, password);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelStatement(file);
  } else if (ext === 'csv' || ext === 'txt' || ext === 'ofx') {
    return parseCsvStatement(file);
  }

  // Fallback try as text/csv
  return parseCsvStatement(file);
}
