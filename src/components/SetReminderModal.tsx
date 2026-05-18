"use client";

import { useState, useEffect } from "react";

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: string | null, enabled: boolean, days: number[]) => void;
  subCategoryName: string;
  currentTime: string | null;
  currentEnabled: boolean;
  currentDays: number[];
}

const DAY_LABELS = [
  { short: "S", full: "Sun", value: 0 },
  { short: "M", full: "Mon", value: 1 },
  { short: "T", full: "Tue", value: 2 },
  { short: "W", full: "Wed", value: 3 },
  { short: "T", full: "Thu", value: 4 },
  { short: "F", full: "Fri", value: 5 },
  { short: "S", full: "Sat", value: 6 },
];

export default function SetReminderModal({
  isOpen,
  onClose,
  onSave,
  subCategoryName,
  currentTime,
  currentEnabled,
  currentDays,
}: SetReminderModalProps) {
  const [time, setTime] = useState(currentTime || "09:00");
  const [enabled, setEnabled] = useState(currentEnabled);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    currentDays.length > 0 ? currentDays : [0, 1, 2, 3, 4, 5, 6]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState("");

  // Live countdown timer
  useEffect(() => {
    if (!enabled || selectedDays.length === 0 || !time) {
      setCountdown("");
      return;
    }

    const calcCountdown = () => {
      const now = new Date();
      const [hh, mm] = time.split(":").map(Number);
      const currentDay = now.getDay();

      // Find the next matching day
      let daysAhead = 0;
      for (let i = 0; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (selectedDays.includes(checkDay)) {
          if (i === 0) {
            // Today: check if time hasn't passed
            const target = new Date(now);
            target.setHours(hh, mm, 0, 0);
            if (target > now) {
              daysAhead = 0;
              break;
            }
            // Time already passed today, find next day
            continue;
          }
          daysAhead = i;
          break;
        }
      }

      const target = new Date(now);
      target.setDate(target.getDate() + daysAhead);
      target.setHours(hh, mm, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Alarm now!");
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const parts: string[] = [];
      if (hrs > 0) parts.push(`${hrs}h`);
      if (mins > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);

      const dayLabel = daysAhead === 0 ? "today" : daysAhead === 1 ? "tomorrow" : DAY_LABELS[(currentDay + daysAhead) % 7].full;
      setCountdown(`${parts.join(" ")} to go (${dayLabel})`);
    };

    calcCountdown();
    const interval = setInterval(calcCountdown, 1000);
    return () => clearInterval(interval);
  }, [enabled, time, selectedDays]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const selectAllDays = () => setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  const selectWeekdays = () => setSelectedDays([1, 2, 3, 4, 5]);
  const selectWeekends = () => setSelectedDays([0, 6]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(enabled ? time : null, enabled, selectedDays);
    setIsSaving(false);
  };

  const handleRemove = async () => {
    setIsSaving(true);
    await onSave(null, false, []);
    setIsSaving(false);
  };

  const getDaysSummary = () => {
    if (selectedDays.length === 7) return "Every day";
    if (selectedDays.length === 0) return "No days selected";
    const weekdays = [1, 2, 3, 4, 5];
    const weekends = [0, 6];
    if (weekdays.every((d) => selectedDays.includes(d)) && !weekends.some((d) => selectedDays.includes(d))) return "Weekdays";
    if (weekends.every((d) => selectedDays.includes(d)) && !weekdays.some((d) => selectedDays.includes(d))) return "Weekends";
    return selectedDays.map((d) => DAY_LABELS[d].full).join(", ");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111127]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Set Reminder</h2>
                <p className="text-xs text-white/30">{subCategoryName}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Toggle */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-white/60">Enable Alarm</span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${enabled ? "bg-amber-500" : "bg-white/10"}`}
            >
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200" style={{ left: "2px", transform: enabled ? "translateX(21px)" : "translateX(0)" }} />
            </button>
          </div>

          <div className={`space-y-4 transition-opacity duration-200 ${enabled ? "opacity-100" : "pointer-events-none opacity-30"}`}>
            {/* Time Picker */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/50">Alarm Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-lg font-semibold text-white outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-amber-500/20 [color-scheme:dark]"
              />
            </div>

            {/* Day Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/50">Repeat On</label>
              <div className="mb-2 grid grid-cols-7 gap-1.5">
                {DAY_LABELS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex h-10 flex-col items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      selectedDays.includes(day.value)
                        ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                        : "bg-white/[0.03] text-white/30 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="text-[11px] font-bold">{day.short}</span>
                    <span className="text-[8px] opacity-60">{day.full}</span>
                  </button>
                ))}
              </div>
              {/* Quick select */}
              <div className="flex gap-2">
                <button type="button" onClick={selectAllDays} className="rounded-md bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/30 hover:bg-white/[0.06] hover:text-white/50">All</button>
                <button type="button" onClick={selectWeekdays} className="rounded-md bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/30 hover:bg-white/[0.06] hover:text-white/50">Weekdays</button>
                <button type="button" onClick={selectWeekends} className="rounded-md bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/30 hover:bg-white/[0.06] hover:text-white/50">Weekends</button>
              </div>
            </div>
          </div>

          {/* Preview + Countdown */}
          {enabled && selectedDays.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-300/90">
                    {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                  </p>
                  <p className="truncate text-[11px] text-white/30">{getDaysSummary()}</p>
                </div>
              </div>
              {countdown && (
                <div className="flex items-center gap-2 rounded-lg bg-violet-500/5 border border-violet-500/10 px-3 py-2">
                  <svg className="h-3.5 w-3.5 shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs font-medium text-violet-300/80">{countdown}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-2.5">
            {currentEnabled && (
              <button onClick={handleRemove} disabled={isSaving} className="rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                Remove
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (enabled && selectedDays.length === 0)}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-40"
            >
              {isSaving ? "Saving..." : "Save Alarm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
