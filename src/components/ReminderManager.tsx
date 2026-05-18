"use client";

import { useEffect, useRef, useCallback, useState } from "react";

import { API_BASE } from "@/lib/config";

interface ReminderData {
  _id: string;
  name: string;
  categoryName: string;
  reminderTime: string;
  reminderDays: number[];
}

let globalAudioCtx: AudioContext | null = null;

// Clean up and initialize AudioContext safely
function unlockAudioContext() {
  if (globalAudioCtx && globalAudioCtx.state !== "closed") {
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch((err) => console.warn("[Alarm] Context resume failed:", err));
    }
    return;
  }

  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
  if (!AC) return;

  try {
    globalAudioCtx = new AC();
    const buffer = globalAudioCtx.createBuffer(1, 1, 22050);
    const node = globalAudioCtx.createBufferSource();
    node.buffer = buffer;
    node.connect(globalAudioCtx.destination);
    node.start(0);
    console.log("[Alarm] Audio Context unlocked successfully.");
  } catch (e) {
    console.warn("[Alarm] Context unlock failed:", e);
  }
}

// Generate continuous alarm siren
function startAlarmSound(): { stop: () => void } {
  unlockAudioContext();
  const ctx = globalAudioCtx;
  if (!ctx || ctx.state === "closed") {
    console.warn("[Alarm] No active AudioContext to play sound.");
    return { stop: () => {} };
  }

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isPlaying = true;

  const playBeep = () => {
    if (!isPlaying || !ctx || ctx.state === "closed") return;

    try {
      const now = ctx.currentTime;

      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain1.gain.linearRampToValueAtTime(0, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Pulse 2 (harmonized second beep)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1100, now + 0.3);
      gain2.gain.setValueAtTime(0, now + 0.3);
      gain2.gain.linearRampToValueAtTime(0.5, now + 0.35);
      gain2.gain.linearRampToValueAtTime(0, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn("[Alarm] Beep failed:", err);
    }
  };

  playBeep();
  intervalId = setInterval(playBeep, 1000); // alarm sound every 1s

  return {
    stop: () => {
      isPlaying = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}

export default function ReminderManager() {
  const firedReminders = useRef<Set<string>>(new Set());
  const alarmRef = useRef<{ stop: () => void } | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<ReminderData | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [testActive, setTestActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  // Load and clean up fired reminders from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("fired_reminders");
        const todayKey = new Date().toDateString();
        if (stored) {
          const arr = JSON.parse(stored) as string[];
          // Only preserve keys that belong to today to prevent memory leak
          const validTodayKeys = arr.filter((key) => key.includes(todayKey));
          validTodayKeys.forEach((key) => firedReminders.current.add(key));
          
          // Save cleaned list back
          localStorage.setItem("fired_reminders", JSON.stringify(validTodayKeys));
        }
      } catch (err) {
        console.warn("[Alarm Engine] Failed to load from localStorage:", err);
      }
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      console.log("[Alarm Engine] Screen Wake Lock acquired successfully.");
    } catch (err) {
      console.warn("[Alarm Engine] Screen Wake Lock request failed:", err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("[Alarm Engine] Screen Wake Lock released.");
      } catch (err) {
        console.warn("[Alarm Engine] Failed to release screen wake lock:", err);
      }
    }
  }, []);

  // Set interaction listener
  useEffect(() => {
    const handleInteraction = () => {
      unlockAudioContext();
      requestWakeLock();
      setHasInteracted(true);
    };

    window.addEventListener("click", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [requestWakeLock]);

  // Request Wake Lock on visibility change so it re-activates when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  const checkReminders = useCallback(async () => {
    if (activeAlarm) return;

    try {
      const res = await fetch(`${API_BASE}/api/reminders`);
      const data = await res.json();
      if (!data.success) return;

      const now = new Date();
      const currentDay = now.getDay();
      const todayKey = now.toDateString();

      for (const reminder of data.data as ReminderData[]) {
        const fireKey = `${reminder._id}-${todayKey}-${reminder.reminderTime}`;

        const days = reminder.reminderDays || [0, 1, 2, 3, 4, 5, 6];
        if (!days.includes(currentDay)) continue;

        const [hh, mm] = reminder.reminderTime.split(":").map(Number);
        const targetTime = new Date(now);
        targetTime.setHours(hh, mm, 0, 0);

        const timeDiffMs = now.getTime() - targetTime.getTime();
        const minutesDiff = timeDiffMs / (1000 * 60);

        // Debug output to trace alarm matching
        console.log(
          `[Alarm Engine] Checking: ${reminder.name} at ${reminder.reminderTime}. Diff: ${minutesDiff.toFixed(2)} mins.`
        );

        if (minutesDiff >= 0 && minutesDiff < 10 && !firedReminders.current.has(fireKey)) {
          console.log(`[Alarm Engine] Triggering alarm: ${reminder.name}`);
          firedReminders.current.add(fireKey);
          
          // Persist to localStorage immediately
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                "fired_reminders",
                JSON.stringify(Array.from(firedReminders.current))
              );
            } catch (err) {
              console.warn("[Alarm Engine] Failed to save to localStorage:", err);
            }
          }

          setActiveAlarm(reminder);

          // Force play
          if (alarmRef.current) alarmRef.current.stop();
          alarmRef.current = startAlarmSound();

          // Native browser notification
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(`⏰ ${reminder.name}`, {
              body: `Time to track: ${reminder.name} (${reminder.categoryName})!`,
              icon: "/favicon.ico",
              tag: fireKey,
              requireInteraction: true,
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error("[Alarm Engine] Check error:", error);
    }
  }, [activeAlarm]);

  // Request notification permissions
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Reset midnight tracker
  useEffect(() => {
    const clearTracker = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        firedReminders.current.clear();
        if (typeof window !== "undefined") {
          localStorage.removeItem("fired_reminders");
        }
      }
    };
    const interval = setInterval(clearTracker, 60000);
    return () => clearInterval(interval);
  }, []);

  // Interval check (every 5 seconds for rapid fire)
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const dismissAlarm = () => {
    console.log("[Alarm Engine] Dismissing alarm.");
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current = null;
    }
    setActiveAlarm(null);
  };

  const handleTestSound = () => {
    if (testActive) {
      if (alarmRef.current) {
        alarmRef.current.stop();
        alarmRef.current = null;
      }
      setTestActive(false);
    } else {
      unlockAudioContext();
      alarmRef.current = startAlarmSound();
      setTestActive(true);
      // Automatically stop test sound after 4 seconds
      setTimeout(() => {
        if (alarmRef.current) {
          alarmRef.current.stop();
          alarmRef.current = null;
        }
        setTestActive(false);
      }, 4000);
    }
  };

  return (
    <>
      {/* Visual floating status helper with sound check */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {!hasInteracted && (
          <button
            onClick={() => {
              unlockAudioContext();
              setHasInteracted(true);
            }}
            className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-400 shadow-lg backdrop-blur-md transition-all hover:bg-amber-500/20 active:scale-95 animate-bounce"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            Enable Alarm Sounds
          </button>
        )}
        {hasInteracted && (
          <button
            onClick={handleTestSound}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              testActive
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:bg-white/[0.05]"
            }`}
          >
            {testActive ? "⏹️ Stop Test" : "🔔 Test Alarm"}
          </button>
        )}
      </div>

      {/* FULL-SCREEN ALARM POPUP */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Pulsing red/amber overlay backdrop */}
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xl animate-pulse duration-1000" />
          
          <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-300">
            <div className="overflow-hidden rounded-3xl border border-red-500/30 bg-[#0f0f1b]/98 p-6 text-center shadow-2xl shadow-red-500/20 backdrop-blur-2xl sm:p-8">
              {/* Pulsing top bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />

              {/* Siren Bell Icon */}
              <div className="mx-auto mb-5 flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-red-500/10">
                <svg className="h-10 w-10 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>

              {/* Time display */}
              <p className="mb-1 text-3xl font-extrabold tracking-tight text-white">
                {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
              </p>
              
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                Alarm Ringing
              </div>

              {/* Habit Details */}
              <h2 className="mb-1 text-2xl font-black text-white">{activeAlarm.name}</h2>
              <p className="mb-8 text-sm font-medium text-white/40">{activeAlarm.categoryName}</p>

              {/* High-impact Dismiss Button */}
              <button
                onClick={dismissAlarm}
                className="w-full rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-red-600 py-4 text-base font-bold text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:shadow-red-500/50 hover:brightness-110 active:scale-95"
              >
                ⏹️ STOP ALARM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
