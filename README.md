


# 💰 NiveshSathi - Intelligent Financial Management Platform(https://niveshsathiv3.netlify.app/)


## 🌟 Overview

**NiveshSathi** is a modern, comprehensive financial management platform designed to empower individuals with intelligent tools for tax filing, expense tracking, investment planning, and financial goal setting. Built with cutting-edge technologies and AI-powered insights, it provides a seamless experience for managing personal finances.

## ✨ Features

- 🤖 **AI-Powered Insights**: Gemini AI integration for intelligent financial recommendations
- 📊 **Advanced Analytics**: Real-time spending analysis, anomaly detection, and trend visualization
- 💰 **Tax Filing Portal**: Automated tax calculation and filing assistance for Indian tax residents
- 📈 **Investment Planning**: Goal-based investment planning and portfolio tracking
- 💸 **Expense Optimization**: Smart suggestions to reduce unnecessary spending
- 📄 **Statement Analysis**: Automatic bank statement parsing and categorization
- 🔐 **Vault Security**: Secure storage for sensitive financial documents with encryption
- 🔔 **Smart Reminders**: Personalized financial reminders and notifications
- 📱 **Fully Responsive**: Optimized for all devices and screen sizes
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations
- 🌙 **Dark Mode Support**: Eye-friendly interface with dark theme option

## 🛠️ Technologies Used

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with responsive design
- **UI Components**: Custom React components
- **Icons**: Lucide React, Font Awesome
- **Animations**: Framer Motion, CSS transitions
- **State Management**: React Context API
- **Charts & Graphs**: Recharts, Chart.js

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI Integration**: Google Generative AI (Gemini)
- **PDF Generation**: PDF libs for tax reports

### Security & Utilities
- **Encryption**: TweetNaCl.js for data encryption
- **OTP Service**: Email/SMS based OTP verification
- **File Processing**: Statement parser for bank statements
- **PDF Handling**: pdfjs-dist for document processing

## 📋 Project Structure

```
NiveshSathi/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── AuthModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── StatementUploader.tsx
│   │   ├── BudgetTracker.tsx
│   │   ├── SpendingCharts.tsx
│   │   ├── TaxFilingPortal.tsx
│   │   └── ...
│   ├── engines/             # Core business logic
│   │   ├── statementParser.ts
│   │   ├── taxFilingEngine.ts
│   │   ├── expenseOptimizer.ts
│   │   ├── anomalyDetector.ts
│   │   └── goalPlanner.ts
│   ├── context/             # React Context for state management
│   │   ├── AuthContext.tsx
│   │   └── FinancialContext.tsx
│   ├── services/            # External service integrations
│   │   └── notificationService.ts
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── AuthPage.tsx
│   │   ├── TaxFilingPortal.tsx
│   │   ├── StatementAnalyzer.tsx
│   │   └── ...
│   ├── lib/                 # Utility libraries
│   │   ├── firebase.ts
│   │   └── utils.ts
│   └── types/               # TypeScript definitions
│       └── index.ts
├── server.ts                # Backend server entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))
- Firebase Project credentials (optional for full features)


## 🎯 Key Features Explained

### 1. **Tax Filing Portal**
- Automated tax calculation based on Indian tax slabs
- Form filling assistance
- Document generation and PDF export
- Tax optimization recommendations

### 2. **Statement Analysis**
- Automatic parsing of bank statements (PDF/CSV)
- Smart expense categorization using AI
- Transaction insights and patterns
- Duplicate transaction detection

### 3. **Expense Optimization**
- Anomaly detection for unusual spending
- Spending pattern analysis
- Personalized money-saving recommendations
- Budget tracking and alerts

### 4. **Investment Planning**
- Goal-based investment recommendations
- Portfolio tracking
- Risk assessment
- Return on investment calculations

### 5. **Financial Dashboard**
- Overview of all financial metrics
- Real-time balance tracking
- Spending breakdown by category
- Monthly/yearly comparisons
- Interactive charts and visualizations

### 6. **Security Features**
- End-to-end encryption for sensitive data
- Secure OTP verification
- Firebase authentication
- Privacy-focused design



