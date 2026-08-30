import { TransactionCategory, TransactionType } from '../types';

interface CategorizationRule {
  category: TransactionCategory;
  keywords: string[];
  isFixed?: boolean;
  isTaxDeductible?: boolean;
  taxSection?: '80C' | '80D' | '80CCD(1B)' | '24(b)' | '80G' | '80TTA' | '80E' | 'Other';
}

const RULES: CategorizationRule[] = [
  // Salary & Inflow
  {
    category: 'Salary & Income',
    keywords: ['salary', 'sal cr', 'monthly pay', 'payroll', 'wipro', 'infosys', 'tcs', 'accenture', 'google', 'microsoft', 'dividend', 'int.pd', 'interest credit', 'interest paid', 'cashback', 'refund', 'cred cash', 'neft cr', 'rtgs cr', 'imps cr-sal'],
  },
  // Investments & Tax Saving
  {
    category: 'Investments & Mutual Funds',
    keywords: ['zerodha', 'groww', 'kuvera', 'angelone', 'upstox', 'ppf', 'elss', 'mutual fund', 'uti mf', 'hdfc mf', 'sbi mf', 'icici pru mf', 'nippon', 'mirae', 'axis mf', 'nps', 'cra-nsdl', 'sgb', 'gold bond', 'sukanya', 'epfo', 'vpf', 'shares', 'cdsl', 'nsdl'],
    isFixed: true,
    isTaxDeductible: true,
    taxSection: '80C',
  },
  // Insurance
  {
    category: 'Insurance & Protection',
    keywords: ['lic of india', 'lic premium', 'hdfc life', 'icici pru life', 'max life', 'sbi life', 'tata aia', 'star health', 'care health', 'niva bupa', 'bajaj allianz', 'icici lombard', 'hdfc ergo', 'acko', 'digit insurance', 'policybazaar'],
    isFixed: true,
    isTaxDeductible: true,
    taxSection: '80D',
  },
  // EMI & Loan Repayments
  {
    category: 'EMI & Loan Repayments',
    keywords: ['emi', 'loan', 'home loan', 'car loan', 'personal loan', 'bajaj finserv', 'hdfc loan', 'sbi home loan', 'icici home fin', 'tata capital', 'muthoot', 'idfc loan', 'kotak loan', 'chq paid-emi'],
    isFixed: true,
    isTaxDeductible: true,
    taxSection: '24(b)',
  },
  // Rent & Housing
  {
    category: 'Rent & Housing',
    keywords: ['house rent', 'flat rent', 'nobroker rent', 'cred rent', 'mygate', 'society maint', 'apartment maintenance', 'landlord', 'rent transfer'],
    isFixed: true,
  },
  // Groceries & Essentials
  {
    category: 'Groceries & Essentials',
    keywords: ['blinkit', 'zepto', 'swiggy instamart', 'bigbasket', 'bbdaily', 'dmart', 'reliance fresh', 'nature basket', 'supermarket', 'kirana', 'milk', 'country delight', 'dunzo', 'spencer', 'more retail'],
  },
  // Food & Dining
  {
    category: 'Food & Dining',
    keywords: ['swiggy', 'zomato', 'mcdonalds', 'starbucks', 'dominos', 'pizza hut', 'burger king', 'kfc', 'cafe coffee day', 'chaayos', 'chai point', 'barbeque', 'eatsure', 'subway', 'haldiram', 'restaurant', 'dining', 'bakery', 'sweet'],
  },
  // Utilities & Bills
  {
    category: 'Utilities & Bills',
    keywords: ['bescom', 'mseb', 'tata power', 'adani electricity', 'cesc', 'torrent power', 'water bill', 'bwssb', 'indane gas', 'bharat gas', 'hp gas', 'mahanagar gas', 'airtel', 'jio', 'vodafone', 'vi prepaid', 'vi postpaid', 'act fibernet', 'hathway', 'tata play', 'dth', 'electricity'],
    isFixed: true,
  },
  // Shopping & E-Commerce
  {
    category: 'Shopping & E-Commerce',
    keywords: ['amazon', 'flipkart', 'myntra', 'nykaa', 'ajio', 'tata cliq', 'zara', 'h&m', 'meesho', 'rel digital', 'croma', 'ikea', 'decathlon', 'uniqlo', 'urban company', 'lenskart'],
  },
  // Fuel & Travel
  {
    category: 'Fuel & Travel',
    keywords: ['uber', 'ola', 'rapido', 'makemytrip', 'irctc', 'indigo', 'air india', 'fastag', 'iocl', 'hpcl', 'bpcl', 'shell petrol', 'petrol pump', 'metro rail', 'redbus', 'yulu', 'fuel'],
  },
  // Subscriptions & Entertainment
  {
    category: 'Subscriptions & Entertainment',
    keywords: ['netflix', 'spotify', 'prime video', 'amazon prime', 'hotstar', 'disney+', 'youtube premium', 'apple.com', 'google play', 'sony liv', 'zee5', 'bookmyshow', 'pvr', 'inox', 'cult.fit', 'gym'],
  },
  // Healthcare & Medical
  {
    category: 'Healthcare & Medical',
    keywords: ['apollo', 'pharmeasy', '1mg', 'tata 1mg', 'medplus', 'netmeds', 'hospital', 'clinic', 'dr.', 'doctor', 'diagnostic', 'lal pathlabs', 'metropolis', 'practo', 'pharmacy', 'dental'],
    isTaxDeductible: true,
    taxSection: '80D',
  },
  // Credit Card Bill Payment
  {
    category: 'Credit Card Bill Payment',
    keywords: ['cred', 'credit card payment', 'cc bill', 'hdfc cc pay', 'sbi card pay', 'icici cc bill', 'axis cc pay', 'amex'],
  },
  // Education & Tuition
  {
    category: 'Education & Tuition',
    keywords: ['school fee', 'college fee', 'tuition', 'byjus', 'unacademy', 'upgrad', 'coursera', 'udemy', 'coaching', 'admission fee'],
    isFixed: true,
    isTaxDeductible: true,
    taxSection: '80C',
  },
  // Taxes & Govt Fees
  {
    category: 'Taxes & Govt Fees',
    keywords: ['income tax', 'advance tax', 'challan 280', 'tin-nsdl', 'gst payment', 'property tax', 'bbmp', 'traffic police', 'challan'],
  },
  // ATM & Cash
  {
    category: 'ATM & Cash Withdrawal',
    keywords: ['atm wdl', 'cash wdl', 'nfs atm', 'atm withdrawal', 'cash withdrawal', 'self cash'],
  },
  // Transfers & UPI P2P
  {
    category: 'Transfers & UPI P2P',
    keywords: ['upi/', 'upi-p2p', 'neft to', 'rtgs to', 'imps to', 'transfer to', 'paid to'],
  },
];

export function categorizeTransaction(description: string, type: TransactionType, amount: number): {
  category: TransactionCategory;
  isFixed: boolean;
  isTaxDeductible: boolean;
  taxSection?: '80C' | '80D' | '80CCD(1B)' | '24(b)' | '80G' | '80TTA' | '80E' | 'Other';
} {
  const descLower = description.toLowerCase();

  // If credit and mentions salary or high credit
  if (type === 'CREDIT') {
    if (descLower.includes('sal') || descLower.includes('payroll') || descLower.includes('wages') || descLower.includes('stipend')) {
      return { category: 'Salary & Income', isFixed: true, isTaxDeductible: false };
    }
    if (descLower.includes('int') || descLower.includes('dividend') || descLower.includes('refund') || descLower.includes('cashback')) {
      return { category: 'Salary & Income', isFixed: false, isTaxDeductible: descLower.includes('int'), taxSection: descLower.includes('int') ? '80TTA' : undefined };
    }
    return { category: 'Salary & Income', isFixed: false, isTaxDeductible: false };
  }

  // Match against predefined rules
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (descLower.includes(kw)) {
        // Refine tax section based on specific keywords
        let taxSec = rule.taxSection;
        if (rule.category === 'Investments & Mutual Funds') {
          if (descLower.includes('nps') || descLower.includes('cra-nsdl')) {
            taxSec = '80CCD(1B)';
          } else {
            taxSec = '80C';
          }
        } else if (rule.category === 'Insurance & Protection') {
          if (descLower.includes('life') || descLower.includes('lic') || descLower.includes('term')) {
            taxSec = '80C';
          } else {
            taxSec = '80D';
          }
        }

        return {
          category: rule.category,
          isFixed: !!rule.isFixed,
          isTaxDeductible: !!rule.isTaxDeductible,
          taxSection: taxSec,
        };
      }
    }
  }

  // Default fallback
  return {
    category: 'Miscellaneous & Others',
    isFixed: false,
    isTaxDeductible: false,
  };
}

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Salary & Income': '#10B981', // Emerald
  'Groceries & Essentials': '#F59E0B', // Amber
  'Food & Dining': '#EF4444', // Red
  'Utilities & Bills': '#6366F1', // Indigo
  'EMI & Loan Repayments': '#8B5CF6', // Purple
  'Investments & Mutual Funds': '#06B6D4', // Cyan
  'Shopping & E-Commerce': '#EC4899', // Pink
  'Healthcare & Medical': '#14B8A6', // Teal
  'Subscriptions & Entertainment': '#F97316', // Orange
  'Fuel & Travel': '#3B82F6', // Blue
  'Credit Card Bill Payment': '#84CC16', // Lime
  'Rent & Housing': '#64748B', // Slate
  'Insurance & Protection': '#0EA5E9', // Sky
  'Education & Tuition': '#A855F7', // Violet
  'ATM & Cash Withdrawal': '#EAB308', // Yellow
  'Transfers & UPI P2P': '#94A3B8', // Gray
  'Taxes & Govt Fees': '#DC2626', // Crimson
  'Miscellaneous & Others': '#9CA3AF', // Gray
};
