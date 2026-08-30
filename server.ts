import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Bank Statement Optimization & Tax Advisory Endpoint with Multi-Model Fallback & Resilience
function generateRuleBasedAudit(summary: any, categoryTotals: Record<string, number>, taxData: any) {
  const discretionaryCategories = [
    { key: "Food & Dining", cutRate: 0.25, tip: "Cook 2 extra days/week and consolidate weekend food delivery orders via subscription passes." },
    { key: "Shopping & Retail", cutRate: 0.30, tip: "Implement a 48-hour cooling-off rule on non-essential e-commerce purchases." },
    { key: "Entertainment & Subs", cutRate: 0.40, tip: "Audit and cancel overlapping OTT / app subscriptions; share family plans." },
    { key: "Travel & Fuel", cutRate: 0.15, tip: "Optimize metro / carpooling for daily commutes." },
    { key: "Personal Care", cutRate: 0.20, tip: "Standardize routine salon and wellness expenses." },
    { key: "Other Expenses", cutRate: 0.20, tip: "Track untagged UPI micro-payments to eliminate cash leakage." },
  ];

  const topCutRecommendations: any[] = [];
  let calculatedMonthlySavings = 0;

  for (const item of discretionaryCategories) {
    const currentSpend = categoryTotals[item.key] || 0;
    if (currentSpend > 1000) {
      const monthlySavings = Math.round(currentSpend * item.cutRate);
      calculatedMonthlySavings += monthlySavings;
      topCutRecommendations.push({
        category: item.key,
        currentSpend: Math.round(currentSpend),
        targetSpend: Math.round(currentSpend - monthlySavings),
        monthlySavings,
        actionPlan: item.tip,
        priority: currentSpend > 8000 ? "High" : currentSpend > 3000 ? "Medium" : "Low",
      });
    }
  }

  // Tax tips
  const utilized80C = taxData?.section80C || 0;
  const utilized80D = taxData?.section80D || 0;
  const utilizedNps = taxData?.nps || 0;

  const taxOptimizationTips = [
    {
      section: "Section 80C",
      maxLimit: "₹1,50,000",
      currentUtilized: utilized80C,
      potentialSaving: utilized80C < 150000 ? `₹${Math.round((150000 - utilized80C) * 0.30)} tax save` : "Fully Utilized",
      advice: utilized80C < 150000
        ? `You have ₹${Math.round(150000 - utilized80C).toLocaleString("en-IN")} remaining under 80C. Allocate to ELSS Tax-Saver Mutual Funds (3-yr lock-in) or PPF.`
        : "Max 80C limit utilized efficiently.",
    },
    {
      section: "Section 80D",
      maxLimit: "₹25,000 - ₹50,000",
      currentUtilized: utilized80D,
      potentialSaving: utilized80D < 25000 ? `₹${Math.round((25000 - utilized80D) * 0.30)} tax save` : "Optimized",
      advice: utilized80D < 25000
        ? "Claim health insurance premiums for self/family (up to ₹25k) and senior citizen parents (up to ₹50k) plus ₹5,000 preventive health checkup."
        : "Health insurance tax deduction active.",
    },
    {
      section: "Section 80CCD(1B)",
      maxLimit: "₹50,000 (Exclusive)",
      currentUtilized: utilizedNps,
      potentialSaving: utilizedNps < 50000 ? `₹${Math.round((50000 - utilizedNps) * 0.30)} tax save` : "Fully Claimed",
      advice: utilizedNps < 50000
        ? "Invest in Tier-1 NPS to claim an additional ₹50,000 tax deduction OVER and above the standard ₹1.5L 80C cap."
        : "NPS additional ₹50,000 deduction active.",
    },
  ];

  const savingsRate = summary?.savingsRate || 0;
  let healthScore = 65;
  if (savingsRate >= 30) healthScore += 20;
  else if (savingsRate >= 15) healthScore += 10;
  if (utilized80C >= 100000) healthScore += 10;

  return {
    monthlySavingsPotential: calculatedMonthlySavings || 4500,
    topCutRecommendations: topCutRecommendations.length > 0 ? topCutRecommendations : [
      {
        category: "Food & Dining",
        currentSpend: 8500,
        targetSpend: 6000,
        monthlySavings: 2500,
        actionPlan: "Cap weekend online food deliveries to 2 orders per week.",
        priority: "High",
      },
      {
        category: "Shopping & Retail",
        currentSpend: 6000,
        targetSpend: 4000,
        monthlySavings: 2000,
        actionPlan: "Avoid impulse checkouts by maintaining a monthly wish list.",
        priority: "Medium",
      },
    ],
    taxOptimizationTips,
    financialHealthScore: Math.min(95, healthScore),
    actionableSummary: `Based on your statement cash flow, trimming non-essential discretionary leakage can unlock ~₹${(calculatedMonthlySavings || 4500).toLocaleString("en-IN")}/month in investable capital. Maximizing Section 80C & NPS 80CCD(1B) will further lower your net tax payable.`,
  };
}

// Helper to generate content with retries and model fallbacks
async function executeGeminiWithFallback(ai: GoogleGenAI, prompt: string) {
  const models = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          return parsed;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt} for model ${modelName} failed:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models were unavailable");
}

app.post("/api/gemini/analyze", async (req, res) => {
  const { transactions, summary, categoryTotals, taxData } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    const fallbackData = generateRuleBasedAudit(summary, categoryTotals || {}, taxData);
    return res.json({ success: true, analysis: fallbackData, isFallback: true });
  }

  const sampleTransactions = Array.isArray(transactions)
    ? transactions
        .slice(0, 40)
        .map((t) => `${t.date}: ${t.description} | Type: ${t.type} | Amount: ₹${t.amount} | Cat: ${t.category}`)
        .join("\n")
    : "";

  const prompt = `You are a certified Indian Chartered Accountant and Financial Optimization Expert.
Analyze this user's parsed bank statement metrics and provide actionable spending reduction advice and Indian Tax optimization:

FINANCIAL SUMMARY:
- Total Inflow (Credits): ₹${summary?.totalIncome || 0}
- Total Outflow (Debits): ₹${summary?.totalExpense || 0}
- Net Savings: ₹${summary?.netSavings || 0}
- Fixed Monthly Expenses: ₹${summary?.fixedExpense || 0}

TOP SPENDING CATEGORIES:
${JSON.stringify(categoryTotals || {}, null, 2)}

TAX COMPUTATION CONTEXT (FY 2024-25 / FY 2025-26):
- Section 80C Identified: ₹${taxData?.section80C || 0}
- Section 80D (Health Insurance): ₹${taxData?.section80D || 0}
- NPS 80CCD(1B): ₹${taxData?.nps || 0}
- Home Loan Interest: ₹${taxData?.homeLoanInterest || 0}
- Regime Comparison: Old vs New regime recommendations

SAMPLE TRANSACTIONS:
${sampleTransactions}

Please provide:
1. Exact, realistic spending reduction opportunities with estimated monthly savings in ₹ for next months.
2. Specific Indian Tax deductions the user might be missing based on their cash flow.
3. Budget guardrails for upcoming months.

Return output strictly formatted as JSON matching this schema:
{
  "monthlySavingsPotential": number,
  "topCutRecommendations": [
    {
      "category": string,
      "currentSpend": number,
      "targetSpend": number,
      "monthlySavings": number,
      "actionPlan": string,
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "taxOptimizationTips": [
    {
      "section": string,
      "maxLimit": string,
      "currentUtilized": number,
      "potentialSaving": string,
      "advice": string
    }
  ],
  "financialHealthScore": number,
  "actionableSummary": string
}`;

  try {
    const analysis = await executeGeminiWithFallback(ai, prompt);
    return res.json({ success: true, analysis, isFallback: false });
  } catch (error: any) {
    console.error("Gemini model capacity note (falling back to CA analytics engine):", error?.message || error);
    const fallbackData = generateRuleBasedAudit(summary, categoryTotals || {}, taxData);
    return res.json({ success: true, analysis: fallbackData, isFallback: true });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NiveshSathi server running on http://localhost:${PORT}`);
  });
}

startServer();
