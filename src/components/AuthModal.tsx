import { useState, FormEvent } from 'react';
import { UserProfile } from '../types';
import { generateOtp, verifyOtp } from '../utils/otp';
import { hashPassword, getRegisteredUsers, saveRegisteredUser } from '../utils/crypto';
import { Shield, Lock, Mail, User, Phone, CheckCircle2, ArrowRight, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onSuccess?: (user: UserProfile, secretKey: string) => void;
  onAuthenticated?: (user: UserProfile, secretKey: string) => void;
  presetOtpCode?: string;
}

export function AuthModal({ onSuccess, onAuthenticated, presetOtpCode }: AuthModalProps) {
  const triggerSuccess = (user: UserProfile, secretKey: string) => {
    if (onAuthenticated) onAuthenticated(user, secretKey);
    if (onSuccess) onSuccess(user, secretKey);
  };
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<'DETAILS' | 'OTP_VERIFY'>('DETAILS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [employmentType, setEmploymentType] = useState<UserProfile['employmentType']>('Salaried');
  const [panNumber, setPanNumber] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('120000');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Switch between Login and Register
  const toggleMode = (newMode: 'LOGIN' | 'REGISTER') => {
    setMode(newMode);
    setStep('DETAILS');
    setError(null);
    setOtpCode('');
  };

  // Step 1: Submit Details & Trigger OTP Dispatch
  const handleInitiateAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const target = email.trim().toLowerCase();
    if (!target) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const users = getRegisteredUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === target || (phone && u.phone === phone));

      if (mode === 'LOGIN') {
        if (!existingUser) {
          setError('No account found with this email. Please register first.');
          setLoading(false);
          return;
        }

        const inputHash = await hashPassword(password);
        if (inputHash !== existingUser.passwordHash) {
          setError('Incorrect password. Please verify your credentials.');
          setLoading(false);
          return;
        }
      } else {
        // Registration validations
        if (existingUser) {
          setError('An account with this email or phone already exists. Please log in.');
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        if (!phone.trim() || phone.length < 10) {
          setError('Please provide a valid 10-digit mobile phone number.');
          setLoading(false);
          return;
        }
      }

      // Generate & Dispatch OTP
      generateOtp(target, mode);
      setStep('OTP_VERIFY');
      setResendTimer(45);
      
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize Auth
  const handleVerifyOtpAndProceed = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit OTP received via SMS/Email.');
      return;
    }

    setLoading(true);

    try {
      const target = email.trim().toLowerCase();
      const result = verifyOtp(target, otpCode, mode);

      if (!result.valid) {
        setError(result.error || 'Invalid OTP code.');
        setLoading(false);
        return;
      }

      // OTP is valid! Proceed with User Profile creation / retrieval
      if (mode === 'REGISTER') {
        const passwordHash = await hashPassword(password);
        const newUser = {
          id: `usr_${Date.now()}`,
          name: name.trim(),
          email: target,
          phone: phone.trim(),
          passwordHash,
          employmentType,
          taxRegimePreference: 'Auto-Calculate Best' as const,
          monthlyIncomeEstimate: parseFloat(monthlyIncome) || 100000,
          createdAt: new Date().toISOString(),
        };

        saveRegisteredUser(newUser);

        const profile: UserProfile = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          panNumber: panNumber ? panNumber.toUpperCase().trim() : undefined,
          employmentType: newUser.employmentType,
          taxRegimePreference: newUser.taxRegimePreference,
          monthlyIncomeEstimate: newUser.monthlyIncomeEstimate,
          createdAt: newUser.createdAt,
          lastLoginAt: new Date().toISOString(),
        };

        // Use password as encryption seed key
        triggerSuccess(profile, password);
      } else {
        // Login success
        const users = getRegisteredUsers();
        const existing = users.find(u => u.email.toLowerCase() === target)!;

        const profile: UserProfile = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          panNumber: panNumber ? panNumber.toUpperCase().trim() : undefined,
          employmentType: existing.employmentType,
          taxRegimePreference: existing.taxRegimePreference,
          monthlyIncomeEstimate: existing.monthlyIncomeEstimate || parseFloat(monthlyIncome) || 100000,
          createdAt: existing.createdAt,
          lastLoginAt: new Date().toISOString(),
        };

        triggerSuccess(profile, password);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const target = email.trim().toLowerCase();
    generateOtp(target, mode);
    setResendTimer(45);
    setError(null);
  };

  return (
    <div id="auth-modal-backdrop" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 relative overflow-hidden">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">NiveshSathi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bank Statement Analyzer & Indian Tax Planner
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[12px] font-medium text-indigo-700">
            <Lock className="w-3.5 h-3.5" /> 256-Bit Local AES-GCM Encrypted & 2FA Protected
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => toggleMode('LOGIN')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Login
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => toggleMode('REGISTER')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Registration
          </button>
        </div>

        {error && (
          <div id="auth-error-banner" className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'DETAILS' ? (
          /* STEP 1: Details & Password */
          <form onSubmit={handleInitiateAuth} className="space-y-4">
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="input-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Shreyash Mane"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mobile Number (for 2FA OTP)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="input-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Employment Type
                    </label>
                    <select
                      id="select-employment-type"
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none shadow-sm"
                    >
                      <option value="Salaried">Salaried Employee</option>
                      <option value="Self-Employed">Self-Employed / Freelancer</option>
                      <option value="Business">Business Owner / MSME</option>
                      <option value="Professional">Professional (Doc/CA/Lawyer)</option>
                      <option value="Senior Citizen">Senior Citizen (60+ yrs)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      PAN Card Number (Optional)
                    </label>
                    <input
                      id="input-pan"
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md px-4 py-2 text-sm text-slate-900 uppercase placeholder-slate-400 focus:outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Est. Monthly Income (₹)
                    </label>
                    <input
                      id="input-income"
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="120000"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {mode === 'REGISTER' ? 'Create Master Password' : 'Enter Password'}
                </label>
                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Vault Key
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="input-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-md pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Your password also derives your client-side AES-256 encryption key.
              </p>
            </div>

            <button
              id="submit-details-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  <span>{mode === 'REGISTER' ? 'Send Registration OTP' : 'Send Login 2FA Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: MANDATORY OTP VERIFICATION */
          <form onSubmit={handleVerifyOtpAndProceed} className="space-y-5">
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Enter 6-Digit OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verification code dispatched to <strong className="text-indigo-600">{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 text-center mb-2">
                6-Digit Security Code
              </label>
              <input
                id="input-otp-code"
                type="text"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full tracking-[0.5em] text-center font-mono text-2xl font-bold bg-white border-2 border-indigo-500 focus:border-indigo-600 rounded-lg py-3 text-indigo-700 placeholder-slate-300 focus:outline-none shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                ← Back to Details
              </button>

              <button
                id="resend-otp-btn"
                type="button"
                disabled={resendTimer > 0}
                onClick={handleResendOtp}
                className={`cursor-pointer ${
                  resendTimer > 0 ? 'text-slate-400' : 'text-indigo-600 hover:text-indigo-700 font-semibold'
                }`}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP Code'}
              </button>
            </div>

            <button
              id="verify-otp-submit-btn"
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying & Unlocking...' : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify OTP & Unlock Vault</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
