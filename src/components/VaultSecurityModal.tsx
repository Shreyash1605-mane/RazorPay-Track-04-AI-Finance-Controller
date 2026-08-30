import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Database,
  Cpu,
} from 'lucide-react';

interface VaultSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportVault: () => void;
  onClearLocalVault: () => void;
}

export function VaultSecurityModal({
  isOpen,
  onClose,
  onExportVault,
  onClearLocalVault,
}: VaultSecurityModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Local AES-256 Vault & Encryption</h3>
              <p className="text-xs text-slate-500">Zero-Knowledge Client-Side Cryptography</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Security Features Overview */}
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero-Knowledge Architecture Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              All bank statement transactions, personal PAN numbers, and financial goals are encrypted locally on your device using <strong>AES-GCM (256-bit key length)</strong> and <strong>PBKDF2 SHA-256 (100,000 iterations)</strong>.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-slate-600">
              <div className="p-2 rounded bg-white border border-slate-200 shadow-sm">
                Algorithm: <strong>AES-GCM-256</strong>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200 shadow-sm">
                KDF: <strong>PBKDF2 100k rounds</strong>
              </div>
            </div>
          </div>

          {/* Backup & Portability */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Encrypted Backup & Portability
            </h4>
            <p className="text-slate-500 text-[11px]">
              Download an encrypted ciphertext snapshot of your entire financial workspace.
            </p>
            <button
              type="button"
              onClick={onExportVault}
              className="w-full py-2 px-3 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-200 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Encrypted Vault File (.enc.json)</span>
            </button>
          </div>

          {/* Danger zone: Clear data */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Erase Local Encrypted State
            </h4>
            <p className="text-slate-600 text-[11px]">
              Permanently wipe the encrypted statement records from this browser session.
            </p>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearLocalVault();
                    setConfirmClear(false);
                    onClose();
                  }}
                  className="flex-1 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  Confirm Permanent Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full py-2 px-3 rounded-md bg-white hover:bg-rose-100/50 border border-rose-200 text-rose-700 font-semibold cursor-pointer shadow-sm transition-colors"
              >
                Clear Encrypted Cache
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
