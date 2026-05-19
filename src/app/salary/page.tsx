"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import EditSalaryModal from "@/components/EditSalaryModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import { API_BASE } from "@/lib/config";

interface Expense {
  _id: string;
  amount: number;
  reason: string;
  date: string;
  month: string;
  type?: "expense" | "extra";
}

export default function SalaryPage() {
  const [fixedSalary, setFixedSalary] = useState<number>(0);
  const [initialSalary, setInitialSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);

  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  const fetchSalaryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/salary?month=${currentMonthStr}`);
      const data = await res.json();
      if (data.success) {
        setFixedSalary(data.data.fixedSalary);
        setInitialSalary(data.data.initialSalary);
        setExpenses(data.data.expenses);
      }
    } catch (error) {
      console.error("Failed to fetch salary data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonthStr]);

  useEffect(() => {
    fetchSalaryData();
  }, [fetchSalaryData]);

  const handleUpdateSettings = async (amount: number, updateCurrentMonth: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/salary/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixedSalary: amount, updateCurrentMonth }),
      });
      const data = await res.json();
      if (data.success) {
        setFixedSalary(data.data.fixedSalary);
        setIsSalaryModalOpen(false);
        // Refresh to get updated initialSalary if it was applied
        fetchSalaryData();
      }
    } catch (error) {
      console.error("Failed to update salary settings:", error);
    }
  };

  const handleAddExpense = async (amount: number, reason: string, type: "expense" | "extra" = "expense") => {
    try {
      const res = await fetch(`${API_BASE}/api/salary/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason, month: currentMonthStr, type }),
      });
      const data = await res.json();
      if (data.success) {
        setExpenses((prev) => [data.data, ...prev]);
        if (type === "expense") setIsExpenseModalOpen(false);
        else setIsExtraModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const totalExpenses = expenses.filter(e => !e.type || e.type === "expense").reduce((sum, exp) => sum + exp.amount, 0);
  const totalExtra = expenses.filter(e => e.type === "extra").reduce((sum, exp) => sum + exp.amount, 0);
  const remainingSalary = initialSalary + totalExtra - totalExpenses;

  const monthDisplay = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Salary &{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Expenses
              </span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-white/40">Track your monthly fixed salary against your daily expenses.</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-8">
        <button onClick={prevMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white min-w-[150px] text-center">{monthDisplay}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Remaining Balance */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-950/20 p-8 shadow-lg backdrop-blur-sm">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h2 className="text-sm font-medium text-blue-400/80 uppercase tracking-widest">Remaining Salary</h2>
            <div className="text-xs font-semibold text-white/50 bg-white/5 px-3 py-1 rounded-full">
              Total Salary: ₹{initialSalary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`text-5xl font-black tracking-tight relative z-10 ${remainingSalary < 0 ? 'text-red-400' : 'text-white'}`}>
            ₹{remainingSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 justify-center">
          <button
            onClick={() => setIsExtraModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/50 transition-all hover:scale-[1.02] hover:shadow-emerald-900/80 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Extra Fund
          </button>
          
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 p-4 text-sm font-bold text-white shadow-lg shadow-red-900/50 transition-all hover:scale-[1.02] hover:shadow-red-900/80 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
            Add Expense
          </button>
          
          <button
            onClick={() => setIsSalaryModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-400 transition-all hover:bg-blue-500/20 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
            Edit Fixed Salary
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-semibold text-white">Transactions this Month</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-medium text-white/50">Spent: <span className="text-red-400">₹{totalExpenses.toLocaleString()}</span></span>
            {totalExtra > 0 && <span className="text-sm font-medium text-white/50">Extra: <span className="text-emerald-400">₹{totalExtra.toLocaleString()}</span></span>}
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V4.22c0-.756-.728-1.293-1.454-1.096a59.769 59.769 0 0 1-5.013.916c-1.924-.43-3.904-.81-5.922-1.133-1.042-.166-2.083-.287-3.131-.362C2.923 2.476 2.25 3.162 2.25 4v14.75ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <p className="text-white/60">No expenses recorded for this month.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => {
              const isExtra = exp.type === "extra";
              return (
              <div
                key={exp._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isExtra ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isExtra ? (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white text-lg">
                      {exp.reason} <span className="text-xs text-white/30 ml-2 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">{isExtra ? 'Extra' : 'Expense'}</span>
                    </div>
                    <div className="text-sm text-white/40">
                      {new Date(exp.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end ml-16 sm:ml-0">
                  <div className={`text-xl font-bold ${isExtra ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isExtra ? '+' : '-'}₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <EditSalaryModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        onSubmit={handleUpdateSettings}
        currentSalary={fixedSalary}
      />
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
        type="expense"
      />
      <AddExpenseModal
        isOpen={isExtraModalOpen}
        onClose={() => setIsExtraModalOpen(false)}
        onSubmit={handleAddExpense}
        type="extra"
      />
    </div>
  );
}
