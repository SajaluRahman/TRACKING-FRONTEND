import { useState, FormEvent } from "react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string, type: "expense" | "extra") => Promise<void>;
  type: "expense" | "extra";
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  type,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !reason.trim()) return;

    setIsSubmitting(true);
    await onSubmit(Number(amount), reason, type);
    setIsSubmitting(false);
    setAmount("");
    setReason("");
  };

  const isExtra = type === "extra";
  const colorClass = isExtra ? "emerald" : "red";
  const title = isExtra ? "Add Extra Fund" : "Add Expense";
  const reasonPlaceholder = isExtra ? "e.g. Bonus, Sold item" : "e.g. Groceries";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-[#111] p-6 text-left align-middle shadow-xl transition-all border border-white/10">
        <h3 className="text-xl font-semibold leading-6 text-white mb-4">
          {title}
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
              className={`mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-${colorClass}-500 focus:outline-none focus:ring-1 focus:ring-${colorClass}-500`}
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label htmlFor="expenseReason" className="block text-sm font-medium text-white/70">
              Reason / Source
            </label>
            <input
              type="text"
              id="expenseReason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-${colorClass}-500 focus:outline-none focus:ring-1 focus:ring-${colorClass}-500`}
              placeholder={reasonPlaceholder}
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
              className={`flex-1 rounded-xl ${isExtra ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"} px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50`}
            >
              {isSubmitting ? "Adding..." : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
