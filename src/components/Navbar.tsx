import { UserProfile, BankStatementMeta } from '../types';
import { ShieldCheck, Lock, Bell, LogOut, KeyRound } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  statementMeta: BankStatementMeta | null;
  pendingRemindersCount: number;
  onOpenReminders: () => void;
  onOpenVaultSecurity: () => void;
  onLogout: () => void;
}

export function Navbar({
  user,
  statementMeta,
  pendingRemindersCount,
  onOpenReminders,
  onOpenVaultSecurity,
  onLogout,
}: NavbarProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                  NiveshSathi
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  <Lock className="w-2.5 h-2.5" /> AES-256 Local Encrypted
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Bank Statement Ledger & Indian Tax Optimizer
              </p>
            </div>
          </div>

          {/* Action Tools & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reminders Bell with Badge */}
            <button
              id="navbar-reminders-btn"
              onClick={onOpenReminders}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Upcoming Reminders & Tax Deadlines"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {pendingRemindersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            {/* Local Vault / Encryption Security Settings */}
            <button
              id="navbar-vault-btn"
              onClick={onOpenVaultSecurity}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Local AES-256 Vault & Backup"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </button>

            {/* User Profile Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-none">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {user.employmentType} {user.panNumber ? `• ${user.panNumber}` : ''}
                </div>
              </div>
            </div>

            {/* Lock / Log out */}
            <button
              id="navbar-logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-medium transition-colors cursor-pointer"
              title="Lock Session & Encrypt"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
