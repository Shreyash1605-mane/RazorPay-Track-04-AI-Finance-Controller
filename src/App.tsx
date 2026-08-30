import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { AuthModal } from './components/AuthModal';
import { OtpNotificationBanner } from './components/OtpNotificationBanner';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [masterPassword, setMasterPassword] = useState<string>('');

  // Restore active user session from local storage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('niveshshathi_user_profile');
    const savedKey = sessionStorage.getItem('niveshshathi_session_key');
    if (savedUser && savedKey) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setMasterPassword(savedKey);
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
  }, []);

  const handleAuthenticated = (user: UserProfile, pass: string) => {
    setCurrentUser(user);
    setMasterPassword(pass);
    localStorage.setItem('niveshshathi_user_profile', JSON.stringify(user));
    sessionStorage.setItem('niveshshathi_session_key', pass);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMasterPassword('');
    sessionStorage.removeItem('niveshshathi_session_key');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Real-time Simulated SMS/Email OTP Delivery Banner */}
      <OtpNotificationBanner />

      {/* Main View: If not logged in, show Auth modal; else show Main Dashboard */}
      {!currentUser || !masterPassword ? (
        <AuthModal onAuthenticated={handleAuthenticated} />
      ) : (
        <Dashboard
          user={currentUser}
          masterPassword={masterPassword}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
