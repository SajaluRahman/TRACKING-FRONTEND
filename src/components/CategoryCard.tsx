"use client";

import Link from "next/link";

interface CategoryCardProps {
  id: string;
  name: string;
  color: string;
  subCategoryCount: number;
  onDelete: (id: string) => void;
}

export default function CategoryCard({
  id,
  name,
  color,
  subCategoryCount,
  onDelete,
}: CategoryCardProps) {
  return (
    <div className="group relative">
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-0 blur-lg transition-all duration-500 group-hover:opacity-60"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl transition-all duration-300 group-hover:border-white/[0.12] group-hover:bg-white/[0.05]">
        {/* Color accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}80, transparent)` }}
        />

        <Link href={`/category/${id}`} className="flex flex-1 flex-col p-5">
          {/* Icon */}
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${color}15`, color }}
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

          {/* Content */}
          <h3 className="mb-1 text-lg font-semibold text-white transition-colors group-hover:text-white/90">
            {name}
          </h3>
          <p className="text-sm text-white/40">
            {subCategoryCount} {subCategoryCount === 1 ? "subcategory" : "subcategories"}
          </p>

          {/* Arrow indicator */}
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/30 transition-all duration-300 group-hover:gap-2 group-hover:text-white/60">
            Open tracker
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </Link>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Delete "${name}" and all its subcategories?`)) {
              onDelete(id);
            }
          }}
          className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.03] text-white/20 opacity-0 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
          title="Delete category"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
