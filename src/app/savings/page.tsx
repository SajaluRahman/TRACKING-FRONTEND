"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SavingsTransactionModal from "@/components/SavingsTransactionModal";
import { API_BASE } from "@/lib/config";

interface Transaction {
  _id: string;
  amount: number;
  type: "add" | "loss";
  reason?: string;
  date: string;
}

export default function SavingsPage() {
  const [total, setTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);

  const fetchSavings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/savings`);
      const data = await res.json();
      if (data.success) {
        setTotal(data.data.total);
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch savings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const handleTransaction = async (amount: number, type: "add" | "loss", reason?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/savings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setTransactions((prev) => [data.data, ...prev]);
        setTotal((prev) => (type === "add" ? prev + amount : prev - amount));
        if (type === "add") setIsAddModalOpen(false);
        else setIsLossModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to process transaction:", error);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
              Your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Savings
              </span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-white/40">Track your financial progress and keep a history of additions and withdrawals.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Balance */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-8 shadow-lg backdrop-blur-sm">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <h2 className="text-sm font-medium text-emerald-400/80 mb-2 uppercase tracking-widest">Total Balance</h2>
          <div className="text-5xl font-black text-white tracking-tight">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 justify-center">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/50 transition-all hover:scale-[1.02] hover:shadow-emerald-900/80 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Money
          </button>
          
          <button
            onClick={() => setIsLossModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
            Record Loss
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="mb-6 text-xl font-semibold text-white">Transaction History</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-white/60">No transactions yet. Start saving today!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tx.type === "add" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {tx.type === "add" ? (
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
                      {tx.type === "add" ? "Deposit" : "Withdrawal"}
                    </div>
                    <div className="text-sm text-white/40">
                      {new Date(tx.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end ml-16 sm:ml-0">
                  <div className={`text-xl font-bold ${tx.type === "add" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "add" ? "+" : "-"}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {tx.type === "loss" && tx.reason && (
                    <div className="text-sm text-white/60 mt-1 max-w-xs text-left sm:text-right">
                      Reason: <span className="italic">{tx.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SavingsTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleTransaction}
        type="add"
      />
      <SavingsTransactionModal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        onSubmit={handleTransaction}
        type="loss"
      />
    </div>
  );
}
