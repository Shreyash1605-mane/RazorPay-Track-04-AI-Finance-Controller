import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { parseStatementFile, ParseResult } from '../utils/parser';
import {
  UploadCloud,
  Lock,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface StatementUploaderProps {
  onParsed: (result: ParseResult) => void;
}

export function StatementUploader({ onParsed }: StatementUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequiredModal, setShowPasswordRequiredModal] = useState(false);
  const [selectedBankHint, setSelectedBankHint] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankPasswordHints = [
    { bank: 'HDFC Bank', hint: 'Customer ID (e.g. 12345678) OR Date of Birth (DDMMYYYY)' },
    { bank: 'SBI (State Bank of India)', hint: 'Last 5 digits of Registered Mobile No + DOB (DDMMYY) or 11-digit Pass' },
    { bank: 'ICICI Bank', hint: 'First 4 letters of Name (lowercase) + DOB (DDMM)' },
    { bank: 'Axis Bank', hint: 'First 4 characters of Name (UPPERCASE) + Last 4 digits of Mobile No' },
    { bank: 'Kotak Mahindra', hint: 'CRN Number (Customer Relationship Number)' },
    { bank: 'Punjab National Bank', hint: '16-digit Account Number (without spaces)' },
  ];

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setShowPasswordRequiredModal(false);
  };

  const handleProcessFile = async (providedPassword?: string) => {
    if (!selectedFile) {
      setError('Please select or drag a bank statement file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const activePassword = providedPassword !== undefined ? providedPassword : password;

    try {
      const result = await parseStatementFile(selectedFile, activePassword);
      if (result.transactions.length === 0) {
        setError('No transactions could be parsed from this file. Please verify format.');
        setIsProcessing(false);
        return;
      }
      setShowPasswordRequiredModal(false);
      onParsed(result);
    } catch (err: any) {
      if (err.isPasswordRequired || err.name === 'PasswordException' || err.message?.includes('password')) {
        setShowPasswordRequiredModal(true);
        setError('This statement is password-protected. Please provide the PDF password below.');
      } else {
        setError(err.message || 'Failed to parse the bank statement.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-600" />
          Upload Bank Statement
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Supports PDF (with password unlock), CSV, Excel (.xlsx/.xls), and Text/OFX from all Indian banks.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        id="statement-dropzone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          accept=".pdf,.csv,.xlsx,.xls,.txt,.ofx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            {selectedFile ? (
              <FileSpreadsheet className="w-8 h-8 text-indigo-600 animate-pulse" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          {selectedFile ? (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> File Selected
              </div>
              <p className="text-base font-bold text-slate-900 mt-1">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready to parse
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-slate-900">
                Drag and drop your bank statement here, or <span className="text-indigo-600 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Supports password-protected e-Statements (SBI, HDFC, ICICI, Axis, Kotak, PNB, etc.)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Password Input & Bank Hints Bar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            File Password (If Protected)
          </label>
          <span className="text-[11px] text-slate-500">Leave blank if statement is not password-locked</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              id="input-statement-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter bank statement unlock password..."
              className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md pl-4 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            id="btn-process-statement"
            type="button"
            disabled={!selectedFile || isProcessing}
            onClick={() => handleProcessFile()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isProcessing ? (
              <span>Decrypting & Parsing...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Unlock & Parse Statement</span>
              </>
            )}
          </button>
        </div>

        {/* Bank Presets Password Accordion / Help */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Common Indian Bank default password conventions:</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bankPasswordHints.map((item) => (
              <button
                key={item.bank}
                type="button"
                onClick={() => setSelectedBankHint(selectedBankHint === item.bank ? null : item.bank)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedBankHint === item.bank
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {item.bank}
              </button>
            ))}
          </div>

          {selectedBankHint && (
            <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
              <strong>{selectedBankHint} convention:</strong>{' '}
              {bankPasswordHints.find(b => b.bank === selectedBankHint)?.hint}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div id="statement-error-box" className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Password Required Modal if dropped without password */}
      {showPasswordRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Protected PDF</h3>
            <p className="text-xs text-slate-500 mt-1">
              This statement requires a password to decrypt. Please enter the password to parse your transactions.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                PDF Unlock Password
              </label>
              <input
                id="modal-pdf-password"
                type="text"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md px-4 py-2.5 text-sm text-slate-900 focus:outline-none shadow-sm"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordRequiredModal(false)}
                className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="modal-submit-unlock-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => handleProcessFile(password)}
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                {isProcessing ? 'Decrypting...' : 'Unlock & Parse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
