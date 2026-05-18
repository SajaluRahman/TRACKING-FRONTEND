"use client";

import { useState, useCallback } from "react";

interface SubCategoryData {
  _id: string;
  name: string;
  categoryId: string;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  reminderDays?: number[];
}

interface CalendarGridProps {
  subCategories: SubCategoryData[];
  trackingMap: Record<string, number[]>;
  year: number;
  month: number;
  onToggle: (subCategoryId: string, date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  categoryColor: string;
  onDeleteSubCategory: (id: string, name: string) => void;
  onSetReminder: (subCategory: SubCategoryData) => void;
}

export default function CalendarGrid({
  subCategories,
  trackingMap,
  year,
  month,
  onToggle,
  onMonthChange,
  categoryColor,
  onDeleteSubCategory,
  onSetReminder,
}: CalendarGridProps) {
  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set());

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const dayNamesFull = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const handleNextMonth = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > todayYear || (nextYear === todayYear && nextMonth > todayMonth)) return;
    onMonthChange(nextYear, nextMonth);
  };

  const handleToggle = useCallback(
    async (subCategoryId: string, day: number) => {
      const cellKey = `${subCategoryId}-${day}`;
      if (togglingCells.has(cellKey)) return;
      setTogglingCells((prev) => new Set(prev).add(cellKey));
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      await onToggle(subCategoryId, dateStr);
      setTogglingCells((prev) => { const next = new Set(prev); next.delete(cellKey); return next; });
    },
    [year, month, onToggle, togglingCells]
  );

  const getCellStatus = (subCategoryId: string, day: number) => {
    const completedDays = trackingMap[subCategoryId] || [];
    const isCompleted = completedDays.includes(day);
    if (year > todayYear || (year === todayYear && month > todayMonth)) return "future";
    if (isCurrentMonth && day > todayDay) return "future";
    const isToday = isCurrentMonth && day === todayDay;
    if (isCompleted) return isToday ? "completed-today" : "completed";
    return isToday ? "missed-today" : "missed";
  };

  const isNextDisabled = (month === todayMonth && year === todayYear) || (year > todayYear);

  if (subCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03]">
          <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <p className="text-sm text-white/40">No subcategories yet</p>
        <p className="mt-1 text-xs text-white/20">Add subcategories to start tracking</p>
      </div>
    );
  }

  // Cell button component for reuse
  const CellButton = ({ scId, day, size = "md" }: { scId: string; day: number; size?: "sm" | "md" }) => {
    const status = getCellStatus(scId, day);
    const cellKey = `${scId}-${day}`;
    const isToggling = togglingCells.has(cellKey);
    const isFuture = status === "future";
    const isClickable = !isFuture && !isToggling;
    const sz = size === "sm" ? "h-8 w-8" : "h-7 w-7";

    return (
      <button
        onClick={() => isClickable && handleToggle(scId, day)}
        disabled={!isClickable}
        className={`relative flex ${sz} items-center justify-center rounded-full transition-all duration-200 ${
          isToggling ? "animate-pulse" : ""
        } ${
          status === "completed" || status === "completed-today"
            ? "bg-emerald-500/90 shadow-md shadow-emerald-500/30"
            : status === "missed" || status === "missed-today"
            ? "bg-red-500/80 shadow-md shadow-red-500/20"
            : "bg-white/[0.04]"
        } ${
          status === "completed-today" || status === "missed-today"
            ? "ring-2 ring-violet-400/60 ring-offset-1 ring-offset-[#0a0a1a]"
            : ""
        } ${isFuture ? "cursor-default" : "cursor-pointer active:scale-90"}`}
      >
        {(status === "completed" || status === "completed-today") && (
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
        {(status === "missed" || status === "missed-today") && (
          <svg className="h-3 w-3 text-white/70" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrevMonth} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/60 transition-all hover:bg-white/[0.06] hover:text-white active:scale-95">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white sm:text-lg">{monthNames[month - 1]} {year}</h3>
          {isCurrentMonth && <p className="mt-0.5 text-xs text-white/30">Current month</p>}
        </div>
        <button onClick={handleNextMonth} disabled={isNextDisabled} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/60 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 active:scale-95">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[11px] text-white/40 sm:gap-4 sm:px-4 sm:py-2.5 sm:text-xs">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 sm:h-3 sm:w-3"></span>Done</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 sm:h-3 sm:w-3"></span>Missed</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white/10 sm:h-3 sm:w-3"></span>Future</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-violet-400 sm:h-3 sm:w-3"></span>Today</div>
      </div>

      {/* ===== MOBILE: Card-based layout (below sm) ===== */}
      <div className="space-y-3 sm:hidden">
        {subCategories.map((sc) => {
          const completedDays = (trackingMap[sc._id] || []).length;
          const totalTrackableDays = isCurrentMonth ? todayDay : daysInMonth;
          const percentage = totalTrackableDays > 0 ? Math.round((completedDays / totalTrackableDays) * 100) : 0;

          return (
            <div key={sc._id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              {/* Card header: name + actions */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-semibold text-white/70">{sc.name}</span>
                  <span className="shrink-0 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/30">
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSetReminder(sc)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                      sc.reminderEnabled
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-white/[0.04] text-white/30"
                    }`}
                  >
                    <svg className="h-4 w-4" fill={sc.reminderEnabled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteSubCategory(sc._id, sc.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:bg-red-500/15 hover:text-red-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {sc.reminderEnabled && sc.reminderTime && (
                <div className="mb-2.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  Alarm at {sc.reminderTime}
                </div>
              )}

              {/* Day grid: 7 columns like a calendar */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day name headers */}
                {dayNames.map((d, i) => (
                  <div key={i} className="flex items-center justify-center py-1 text-[10px] font-medium text-white/20">{d}</div>
                ))}
                {/* Empty slots for first day offset */}
                {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const isTodayCell = isCurrentMonth && day === todayDay;
                  return (
                    <div key={day} className={`flex flex-col items-center justify-center rounded-lg py-1 ${isTodayCell ? "bg-violet-500/10" : ""}`}>
                      <span className={`mb-0.5 text-[9px] ${isTodayCell ? "font-bold text-violet-400" : "text-white/25"}`}>{day}</span>
                      <CellButton scId={sc._id} day={day} size="sm" />
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: percentage >= 80 ? "#22c55e" : percentage >= 50 ? "#eab308" : categoryColor }} />
                </div>
                <span className="text-[11px] text-white/30">{completedDays}/{totalTrackableDays}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== DESKTOP: Table layout (sm and above) ===== */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="flex border-b border-white/[0.04]">
              <div className="flex w-48 shrink-0 items-center border-r border-white/[0.04] px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/30">Subcategory</span>
              </div>
              <div className="flex flex-1">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateObj = new Date(year, month - 1, day);
                  const dayName = dayNamesFull[dateObj.getDay()];
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  const isTodayCol = isCurrentMonth && day === todayDay;
                  return (
                    <div key={day} className={`flex flex-1 flex-col items-center justify-center py-2 text-center ${isTodayCol ? "bg-violet-500/10" : isWeekend ? "bg-white/[0.01]" : ""}`}>
                      <span className={`text-[10px] ${isWeekend ? "text-white/20" : "text-white/25"}`}>{dayName}</span>
                      <span className={`text-xs font-medium ${isTodayCol ? "text-violet-400" : "text-white/40"}`}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subcategory rows */}
            {subCategories.map((sc, rowIdx) => (
              <div key={sc._id} className={`flex ${rowIdx < subCategories.length - 1 ? "border-b border-white/[0.03]" : ""} transition-colors hover:bg-white/[0.01]`}>
                <div className="group/row flex w-48 shrink-0 items-center border-r border-white/[0.04] px-3 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/60">{sc.name}</span>
                  <button onClick={() => onSetReminder(sc)} className={`ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${sc.reminderEnabled ? "bg-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/10 hover:bg-amber-500/30" : "bg-white/[0.04] text-white/30 hover:bg-amber-500/10 hover:text-amber-400"}`} title={sc.reminderEnabled && sc.reminderTime ? `Alarm at ${sc.reminderTime}` : "Set reminder"}>
                    <svg className="h-3.5 w-3.5" fill={sc.reminderEnabled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  </button>
                  <button onClick={() => onDeleteSubCategory(sc._id, sc.name)} className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/20 transition-all hover:bg-red-500/15 hover:text-red-400" title={`Delete ${sc.name}`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex flex-1">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const isTodayCol = isCurrentMonth && day === todayDay;
                    return (
                      <div key={day} className={`flex flex-1 items-center justify-center py-2.5 ${isTodayCol ? "bg-violet-500/10" : ""}`}>
                        <CellButton scId={sc._id} day={day} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {subCategories.map((sc) => {
            const completedDays = (trackingMap[sc._id] || []).length;
            const totalTrackableDays = isCurrentMonth ? todayDay : daysInMonth;
            const percentage = totalTrackableDays > 0 ? Math.round((completedDays / totalTrackableDays) * 100) : 0;
            return (
              <div key={sc._id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="truncate text-xs font-medium text-white/40">{sc.name}</p>
                  {sc.reminderEnabled && sc.reminderTime && (
                    <span className="ml-1 flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                      {sc.reminderTime}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{percentage}%</span>
                  <span className="text-xs text-white/30">{completedDays}/{totalTrackableDays}</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: percentage >= 80 ? "#22c55e" : percentage >= 50 ? "#eab308" : categoryColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
