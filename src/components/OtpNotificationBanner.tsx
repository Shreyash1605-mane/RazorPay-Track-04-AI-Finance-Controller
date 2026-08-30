import { useState, useEffect } from 'react';
import { subscribeToOtpEvents } from '../utils/otp';
import { ShieldCheck, Copy, Check, X, Smartphone } from 'lucide-react';

export function OtpNotificationBanner({ onFillOtp }: { onFillOtp?: (code: string) => void }) {
  const [activeAlert, setActiveAlert] = useState<{
    target: string;
    code: string;
    purpose: 'REGISTER' | 'LOGIN';
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOtpEvents((session) => {
      setActiveAlert(session);
      setCopied(false);
    });
    return () => unsubscribe();
  }, []);

  if (!activeAlert) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeAlert.code);
    setCopied(true);
    if (onFillOtp) {
      onFillOtp(activeAlert.code);
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      id="otp-notification-banner"
      className="fixed top-4 right-4 z-50 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-emerald-500/50 p-4 animate-bounce-short transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {activeAlert.purpose === 'REGISTER' ? 'Registration OTP' : 'Login 2FA Code'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              SMS & Email Sent
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Verification code sent to <strong className="text-white">{activeAlert.target}</strong>:
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-emerald-300 font-mono text-xl font-bold tracking-widest">
              {activeAlert.code}
            </div>
            <button
              id="copy-otp-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied & Applied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Auto-Fill Code
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Valid for 5 minutes. Enforces strict zero-unauthorized access policy.
          </p>
        </div>
        <button
          id="close-otp-banner-btn"
          onClick={() => setActiveAlert(null)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
