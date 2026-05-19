import { useState, FormEvent } from "react";

interface SavingsTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: "add" | "loss", reason?: string) => Promise<void>;
  type: "add" | "loss";
}

export default function SavingsTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  type,
}: SavingsTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    if (type === "loss" && !reason.trim()) return;

    setIsSubmitting(true);
    await onSubmit(Number(amount), type, type === "loss" ? reason : undefined);
    setIsSubmitting(false);
    setAmount("");
    setReason("");
  };

  const isAdd = type === "add";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-[#111] p-6 text-left align-middle shadow-xl transition-all border border-white/10">
        <h3 className="text-xl font-semibold leading-6 text-white mb-4">
          {isAdd ? "Add to Savings" : "Record Savings Loss"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-white/70">
              Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 100"
            />
          </div>

          {type === "loss" && (
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-white/70">
                Reason (Required)
              </label>
              <textarea
                id="reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Why was this money taken?"
              />
            </div>
          )}

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
              disabled={isSubmitting || !amount || Number(amount) <= 0 || (type === "loss" && !reason.trim())}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                isAdd
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isSubmitting ? "Saving..." : isAdd ? "Add Money" : "Record Loss"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
