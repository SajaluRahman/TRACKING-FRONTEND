"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/config";

interface AnalyticsData {
  savings: {
    total: number;
  };
  salary: {
    remaining: number;
    spent: number;
    profit: number;
    initial: number;
  };
  habits: {
    categories: number;
    subCategories: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-white/5 border border-white/10" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Savings Card */}
      <Link href="/savings" className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-emerald-900/30 hover:border-emerald-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        <h3 className="text-sm font-medium text-emerald-400/80 mb-2 uppercase tracking-wider">Total Savings</h3>
        <div className="text-3xl font-black text-white tracking-tight">
          ₹{data.savings.total.toLocaleString()}
        </div>
        <div className="mt-4 flex items-center text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
          View Details &rarr;
        </div>
      </Link>

      {/* Salary Card */}
      <Link href="/salary" className="group relative overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-950/20 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-blue-900/30 hover:border-blue-500/30">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all" />
        <h3 className="text-sm font-medium text-blue-400/80 mb-2 uppercase tracking-wider">Remaining Salary</h3>
        <div className={`text-3xl font-black tracking-tight ${data.salary.remaining < 0 ? 'text-red-400' : 'text-white'}`}>
          ₹{data.salary.remaining.toLocaleString()}
        </div>
        <div className="mt-4 flex items-center text-xs font-medium text-blue-400 group-hover:text-blue-300">
          Manage Budget &rarr;
        </div>
      </Link>

      {/* Expenses Card */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-red-950/10 p-6 shadow-lg backdrop-blur-sm">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />
        <h3 className="text-sm font-medium text-red-400/80 mb-2 uppercase tracking-wider">Month Spent</h3>
        <div className="text-3xl font-black text-white tracking-tight">
          ₹{data.salary.spent.toLocaleString()}
        </div>
        {data.salary.profit > 0 && (
          <div className="mt-4 flex items-center text-xs font-medium text-emerald-400">
            +{data.salary.profit.toLocaleString()} Profit recorded
          </div>
        )}
      </div>

      {/* Habits Card */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-violet-950/20 p-6 shadow-lg backdrop-blur-sm">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
        <h3 className="text-sm font-medium text-violet-400/80 mb-2 uppercase tracking-wider">Active Habits</h3>
        <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
          {data.habits.subCategories}
          <span className="text-sm font-medium text-white/40 tracking-normal">across {data.habits.categories} categories</span>
        </div>
        <div className="mt-4 flex items-center text-xs font-medium text-violet-400">
          Keep it up!
        </div>
      </div>
    </div>
  );
}
