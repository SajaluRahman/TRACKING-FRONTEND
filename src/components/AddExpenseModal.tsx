import { useState, FormEvent } from "react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string) => Promise<void>;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSubmit,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !reason.trim()) return;

    setIsSubmitting(true);
    await onSubmit(Number(amount), reason);
    setIsSubmitting(false);
    setAmount("");
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-[#111] p-6 text-left align-middle shadow-xl transition-all border border-white/10">
        <h3 className="text-xl font-semibold leading-6 text-white mb-4">
          Add Expense
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expenseAmount" className="block text-sm font-medium text-white/70">
              Amount (₹)
            </label>
            <input
              type="number"
              id="expenseAmount"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label htmlFor="expenseReason" className="block text-sm font-medium text-white/70">
              Reason / Category
            </label>
            <input
              type="text"
              id="expenseReason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="e.g. Groceries"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || Number(amount) <= 0 || !reason.trim()}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
