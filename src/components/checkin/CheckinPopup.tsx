"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { STREAK_XP, TOTAL_WEEK_XP, getCheckinStatus, performCheckin, CheckinStatus, CheckinResult } from "@/lib/checkin";

interface CheckinPopupProps {
  userId: string;
  onClose: () => void;
  onXpGained?: (result: CheckinResult) => void;
}

export default function CheckinPopup({ userId, onClose, onXpGained }: CheckinPopupProps) {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadStatus();
  }, [userId]);

  async function loadStatus() {
    try {
      const s = await getCheckinStatus(userId);
      setStatus(s);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin() {
    setChecking(true);
    try {
      const r = await performCheckin(userId);
      setResult(r);
      onXpGained?.(r);
    } catch {
      // already checked in
    } finally {
      setChecking(false);
    }
  }

  // Determine display state
  const isDay7 = result?.streakDay === 7;
  const checkedIn = status?.checkedInToday || result !== null;
  const streakDay = result?.streakDay ?? status?.currentStreakDay ?? 1;
  const weekXp = result
    ? STREAK_XP.slice(0, result.streakDay).reduce((a, b) => a + b, 0)
    : status?.weekXpEarned ?? 0;
  const weekPercent = Math.round((weekXp / TOTAL_WEEK_XP) * 100);
  const daysLeft = 7 - streakDay;

  // Title
  let title = "📅 Daily Check-in";
  if (result && isDay7) title = "🎊 STREAK SEMPURNA! 🎊";
  else if (result) title = "🎉 Check-in Berhasil!";

  const content = (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <p className="text-gray-500 py-8">Memuat...</p>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>

            {/* Streak Calendar */}
            <div className="flex justify-center gap-1.5 mb-4">
              {STREAK_XP.map((xp, i) => {
                const day = i + 1;
                const completed = day < streakDay || (checkedIn && day === streakDay);
                const isToday = day === streakDay && !checkedIn;
                const isGift = day === 7;

                return (
                  <div
                    key={day}
                    className={`flex flex-col items-center rounded-lg px-2 py-1.5 text-xs font-bold border-2 ${
                      completed
                        ? "bg-green-100 border-green-400 text-green-700"
                        : isToday
                        ? "bg-blue-50 border-blue-400 text-blue-700 animate-pulse"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    <span className="text-base">{completed ? "✓" : isGift ? "🎁" : "○"}</span>
                    <span>{xp}</span>
                  </div>
                );
              })}
            </div>

            {/* XP Earned Animation */}
            {result && (
              <div className="my-3 inline-block bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold text-lg animate-bounce">
                +{result.xpEarned} XP {isDay7 && "🎁"}
              </div>
            )}

            {/* Streak Info */}
            <p className="text-sm text-gray-600 mb-2">
              {checkedIn ? "✅ Sudah check-in hari ini!" : `Hari ini: +${status?.todayXp} XP`}
              {" "}🔥 Streak: {streakDay} hari
            </p>

            {/* Week Progress */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">
                📊 Total minggu ini: {weekXp} / {TOTAL_WEEK_XP} XP
              </p>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${weekPercent}%` }}
                />
              </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-500 mb-4">
              {isDay7 && result
                ? "✨ Streak reset besok, ayo ulangi!"
                : daysLeft > 0
                ? `🎯 ${daysLeft} hari lagi untuk bonus 100 XP!`
                : "💡 Streak 7 hari = 240 XP total!"}
            </p>

            {/* Action Button */}
            {!checkedIn ? (
              <button
                onClick={handleCheckin}
                disabled={checking}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {checking ? "..." : "✨ Check-in Sekarang! ✨"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                {isDay7 && result ? "Mantap! 🔥" : "Tutup"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
