import { useState, FormEvent, useEffect } from "react";

interface EditSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fixedSalary: number, updateCurrentMonth: boolean) => Promise<void>;
  currentSalary: number;
}

export default function EditSalaryModal({
  isOpen,
  onClose,
  onSubmit,
  currentSalary,
}: EditSalaryModalProps) {
  const [salary, setSalary] = useState(currentSalary.toString());
  const [updateCurrentMonth, setUpdateCurrentMonth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setSalary(currentSalary.toString());
  }, [isOpen, currentSalary]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(salary);
    if (isNaN(amount) || amount < 0) return;

    setIsSubmitting(true);
    await onSubmit(amount, updateCurrentMonth);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-[#111] p-6 text-left align-middle shadow-xl transition-all border border-white/10">
        <h3 className="text-xl font-semibold leading-6 text-white mb-4">
          Edit Fixed Salary
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-white/70">
              Monthly Fixed Salary (₹)
            </label>
            <input
              type="number"
              id="salary"
              step="0.01"
              min="0"
              required
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 50000"
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <input
              type="checkbox"
              id="updateCurrent"
              checked={updateCurrentMonth}
              onChange={(e) => setUpdateCurrentMonth(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-[#111]"
            />
            <label htmlFor="updateCurrent" className="text-sm text-white/70">
              Apply this change to the current month immediately
            </label>
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
              disabled={isSubmitting || !salary || Number(salary) < 0}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Salary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
