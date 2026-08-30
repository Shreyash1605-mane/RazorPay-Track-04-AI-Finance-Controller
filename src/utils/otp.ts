/**
 * OTP Generation, Simulation & Verification Service
 * Enforces mandatory Two-Factor / Registration OTP verification.
 */

export interface ActiveOtpSession {
  target: string; // email or phone
  code: string;
  expiresAt: number;
  purpose: 'REGISTER' | 'LOGIN';
}

const activeSessions: Map<string, ActiveOtpSession> = new Map();

// Listeners for UI notification banners when an OTP is dispatched
type OtpListener = (session: { target: string; code: string; purpose: 'REGISTER' | 'LOGIN' }) => void;
const listeners: Set<OtpListener> = new Set();

export function subscribeToOtpEvents(listener: OtpListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Generate a cryptographically random 6-digit OTP
export function generateOtp(target: string, purpose: 'REGISTER' | 'LOGIN'): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (100000 + (array[0] % 900000)).toString();

  const session: ActiveOtpSession = {
    target: target.toLowerCase().trim(),
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    purpose,
  };

  activeSessions.set(session.target, session);

  // Broadcast to visual alert banner so the user receives their OTP instantly in-app
  listeners.forEach(fn => fn({ target, code, purpose }));

  return code;
}

export function verifyOtp(target: string, inputCode: string, purpose: 'REGISTER' | 'LOGIN'): { valid: boolean; error?: string } {
  const normalizedTarget = target.toLowerCase().trim();
  const session = activeSessions.get(normalizedTarget);

  if (!session) {
    return { valid: false, error: 'No active OTP request found. Please request a new OTP.' };
  }

  if (session.purpose !== purpose) {
    return { valid: false, error: 'Invalid OTP session context.' };
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(normalizedTarget);
    return { valid: false, error: 'OTP has expired. Please generate a new code.' };
  }

  if (session.code !== inputCode.trim()) {
    return { valid: false, error: 'Incorrect OTP code entered. Please check and retry.' };
  }

  // Success - consume OTP
  activeSessions.delete(normalizedTarget);
  return { valid: true };
}
