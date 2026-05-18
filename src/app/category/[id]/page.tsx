"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import CalendarGrid from "@/components/CalendarGrid";
import AddSubCategoryModal from "@/components/AddSubCategoryModal";
import SetReminderModal from "@/components/SetReminderModal";
import { API_BASE } from "@/lib/config";

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface SubCategoryData {
  _id: string;
  name: string;
  categoryId: string;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  reminderDays?: number[];
}

interface BulkData {
  subCategories: SubCategoryData[];
  trackingMap: Record<string, number[]>;
  month: { year: number; month: number };
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;

  const [category, setCategory] = useState<Category | null>(null);
  const [bulkData, setBulkData] = useState<BulkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<SubCategoryData | null>(null);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  const fetchCategory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      if (data.success) {
        const found = data.data.find(
          (c: Category) => c._id === categoryId
        );
        if (found) setCategory(found);
      }
    } catch (error) {
      console.error("Failed to fetch category:", error);
    }
  }, [categoryId]);

  const fetchBulkData = useCallback(async () => {
    try {
      const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      const res = await fetch(
        `${API_BASE}/api/tracking/bulk?categoryId=${categoryId}&month=${monthStr}`
      );
      const data = await res.json();
      if (data.success) {
        setBulkData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tracking data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, currentYear, currentMonth]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  useEffect(() => {
    setIsLoading(true);
    fetchBulkData();
  }, [fetchBulkData]);

  const handleToggle = async (subCategoryId: string, date: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subCategoryId, date }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update the tracking map
        setBulkData((prev) => {
          if (!prev) return prev;
          const day = new Date(date).getDate();
          const newMap = { ...prev.trackingMap };

          if (data.action === "ticked") {
            newMap[subCategoryId] = [
              ...(newMap[subCategoryId] || []),
              day,
            ];
          } else {
            newMap[subCategoryId] = (newMap[subCategoryId] || []).filter(
              (d) => d !== day
            );
          }

          return { ...prev, trackingMap: newMap };
        });
      }
    } catch (error) {
      console.error("Failed to toggle tracking:", error);
    }
  };

  const handleAddSubCategory = async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh the bulk data
        await fetchBulkData();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to add subcategory:", error);
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its tracking data?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/subcategories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchBulkData();
      }
    } catch (error) {
      console.error("Failed to delete subcategory:", error);
    }
  };

  const handleSetReminder = async (time: string | null, enabled: boolean, days: number[]) => {
    if (!reminderTarget) return;
    try {
      const res = await fetch(`${API_BASE}/api/subcategories/${reminderTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderTime: time,
          reminderEnabled: enabled,
          reminderDays: days,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            subCategories: prev.subCategories.map((sc) =>
              sc._id === reminderTarget._id
                ? { ...sc, reminderTime: time, reminderEnabled: enabled, reminderDays: days }
                : sc
            ),
          };
        });
        setReminderTarget(null);
      }
    } catch (error) {
      console.error("Failed to set reminder:", error);
    }
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back navigation + header */}
      <div className="mb-8 sm:mb-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/60"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to Categories
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            {category && (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {category?.name || "Loading..."}
              </h1>
              <p className="mt-0.5 text-sm text-white/40">
                {bulkData
                  ? `${bulkData.subCategories.length} subcategories`
                  : "Loading..."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40 hover:brightness-110"
          >
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Subcategory
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]" />
          <div className="h-64 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
        </div>
      ) : bulkData ? (
        <CalendarGrid
          subCategories={bulkData.subCategories}
          trackingMap={bulkData.trackingMap}
          year={currentYear}
          month={currentMonth}
          onToggle={handleToggle}
          onMonthChange={handleMonthChange}
          categoryColor={category?.color || "#8b5cf6"}
          onDeleteSubCategory={handleDeleteSubCategory}
          onSetReminder={(sc) => setReminderTarget(sc)}
        />
      ) : (
        <p className="text-center text-white/40">Failed to load data</p>
      )}

      {/* Add Subcategory Modal */}
      <AddSubCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddSubCategory}
        categoryName={category?.name || ""}
      />

      {/* Set Reminder Modal */}
      {reminderTarget && (
        <SetReminderModal
          isOpen={true}
          onClose={() => setReminderTarget(null)}
          onSave={handleSetReminder}
          subCategoryName={reminderTarget.name}
          currentTime={reminderTarget.reminderTime || null}
          currentEnabled={reminderTarget.reminderEnabled || false}
          currentDays={reminderTarget.reminderDays || [0, 1, 2, 3, 4, 5, 6]}
        />
      )}
    </div>
  );
}
