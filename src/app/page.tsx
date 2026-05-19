"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CategoryCard from "@/components/CategoryCard";
import AddCategoryModal from "@/components/AddCategoryModal";
import { API_BASE } from "@/lib/config";

interface Category {
  _id: string;
  name: string;
  color: string;
  subCategoryCount?: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/subcategories?categoryId=all`),
      ]);

      const catData = await catRes.json();

      if (catData.success) {
        // Fetch subcategory counts for each category
        const categoriesWithCounts = await Promise.all(
          catData.data.map(async (cat: Category) => {
            const scRes = await fetch(
              `${API_BASE}/api/subcategories?categoryId=${cat._id}`
            );
            const scData = await scRes.json();
            return {
              ...cat,
              subCategoryCount: scData.success ? scData.data.length : 0,
            };
          })
        );
        setCategories(categoriesWithCounts);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (name: string, color: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => [
          { ...data.data, subCategoryCount: 0 },
          ...prev,
        ]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Categories
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/40 sm:text-base">
            Organize your habits into categories and track them daily
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/savings"
            className="group flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white/[0.1] hover:border-emerald-500/30"
          >
            <svg
              className="h-4 w-4 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Savings
          </Link>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/10 to-emerald-500/10 backdrop-blur-sm">
            <svg
              className="h-12 w-12 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white/60">
            No categories yet
          </h2>
          <p className="mb-6 max-w-sm text-sm text-white/30">
            Create your first category to start tracking your daily habits.
            Categories help you organize related activities.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/40"
          >
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              id={cat._id}
              name={cat.name}
              color={cat.color}
              subCategoryCount={cat.subCategoryCount || 0}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCategory}
      />
    </div>
  );
}
