import { useState, FormEvent } from 'react';
import { Reminder } from '../types';
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  reminders: Reminder[];
  onClose: () => void;
  onAddReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
}

export function RemindersModal({
  isOpen,
  reminders,
  onClose,
  onAddReminder,
  onDeleteReminder,
  onToggleReminder,
}: RemindersModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<Reminder['category']>('Tax Deadline');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  if (!isOpen) return null;

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onAddReminder({
      id: `rem_${Date.now()}`,
      title: title.trim(),
      dueDate,
      category,
      amount: amount ? parseFloat(amount) : undefined,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      isCompleted: false,
    });

    setTitle('');
    setDueDate('');
    setAmount('');
    setShowAddForm(false);
  };

  const formatRupee = (val?: number) => {
    if (!val) return '';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Financial Deadlines & Reminders</h3>
              <p className="text-xs text-slate-500">
                Track tax calendar due dates, EMI schedules, and investment deadlines.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Active Schedules ({reminders.filter(r => !r.isCompleted).length} Pending)
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close' : 'Add Custom Reminder'}</span>
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q4 Advance Tax Payment"
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
                  >
                    <option value="Tax Deadline">Tax Deadline</option>
                    <option value="SIP Investment">SIP / Investment</option>
                    <option value="EMI Payment">Loan / EMI</option>
                    <option value="Bill Payment">Bill Payment</option>
                    <option value="Statement Review">Statement Review</option>
                    <option value="Custom">Custom Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (Optional)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="₹"
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <span>Recurring alert</span>
                </label>

                {isRecurring && (
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none shadow-sm"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                )}

                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          )}

          {/* List of Reminders */}
          <div className="space-y-2.5">
            {reminders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No scheduled reminders.</p>
            ) : (
              reminders.map((rem) => {
                const isOverdue = !rem.isCompleted && new Date(rem.dueDate).getTime() < new Date().getTime();

                return (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      rem.isCompleted
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isOverdue
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleReminder(rem.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                          rem.isCompleted
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                      >
                        {rem.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${rem.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {rem.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {rem.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3 text-indigo-600" />
                          <span>Due: {rem.dueDate}</span>
                          {rem.amount && <span className="font-mono text-slate-700 font-semibold">• {formatRupee(rem.amount)}</span>}
                          {isOverdue && <span className="text-rose-600 font-bold">• Overdue</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteReminder(rem.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
