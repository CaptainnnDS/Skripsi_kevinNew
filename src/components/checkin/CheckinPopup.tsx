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

  const isDay7 = result?.streakDay === 7;
  const checkedIn = status?.checkedInToday || result !== null;
  const streakDay = result?.streakDay ?? status?.currentStreakDay ?? 1;
  const weekXp = result
    ? STREAK_XP.slice(0, result.streakDay).reduce((a, b) => a + b, 0)
    : status?.weekXpEarned ?? 0;
  const weekPercent = Math.round((weekXp / TOTAL_WEEK_XP) * 100);
  const daysLeft = 7 - streakDay;

  let title = "Daily Check-in";
  let titleEmoji = "📅";
  if (result && isDay7) { title = "STREAK SEMPURNA!"; titleEmoji = "🎊"; }
  else if (result) { title = "Check-in Berhasil!"; titleEmoji = "🎉"; }

  const content = (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 font-semibold">Memuat...</p>
          </div>
        ) : (
          <>
            {/* Header gradient */}
            <div className={`px-6 pt-6 pb-4 text-center ${
              result && isDay7
                ? "bg-gradient-to-br from-yellow-400 to-orange-400"
                : result
                ? "bg-gradient-to-br from-green-400 to-emerald-500"
                : "bg-gradient-to-br from-blue-500 to-purple-500"
            }`}>
              <div className="text-4xl mb-1">{titleEmoji}</div>
              <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
              {checkedIn && (
                <p className="text-white/80 text-sm font-semibold mt-0.5">
                  🔥 Streak {streakDay} hari
                </p>
              )}
            </div>

            <div className="px-5 py-4">
              {/* Streak Calendar */}
              <div className="flex justify-center gap-1 mb-4">
                {STREAK_XP.map((xp, i) => {
                  const day = i + 1;
                  const completed = day < streakDay || (checkedIn && day === streakDay);
                  const isToday = day === streakDay && !checkedIn;
                  const isGift = day === 7;

                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center rounded-xl px-1.5 py-1.5 border-2 min-w-[36px] ${
                        completed
                          ? "bg-green-100 border-green-400 text-green-700"
                          : isToday
                          ? "bg-blue-50 border-blue-400 text-blue-700 animate-pulse"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="text-sm leading-none mb-0.5">
                        {completed ? "✓" : isGift ? "🎁" : "○"}
                      </span>
                      <span className="text-[10px] font-extrabold leading-none">{xp}</span>
                    </div>
                  );
                })}
              </div>

              {/* XP Earned */}
              {result && (
                <div className="flex justify-center mb-3">
                  <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-700 px-5 py-2 rounded-2xl font-extrabold text-xl animate-bounce">
                    +{result.xpEarned} XP {isDay7 && "🎁"}
                  </div>
                </div>
              )}

              {/* Streak info row */}
              {!result && (
                <div className="flex items-center justify-between bg-blue-50 rounded-2xl px-4 py-2.5 mb-3 border border-blue-100">
                  <div>
                    <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Hari ini</p>
                    <p className="text-lg font-extrabold text-blue-900">+{status?.todayXp} XP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">Streak</p>
                    <p className="text-lg font-extrabold text-orange-700">🔥 {streakDay} hari</p>
                  </div>
                </div>
              )}

              {/* Week Progress */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Minggu ini</span>
                  <span className="text-xs font-extrabold text-gray-700">{weekXp} / {TOTAL_WEEK_XP} XP</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${weekPercent}%` }}
                  />
                </div>
              </div>

              {/* Hint */}
              <p className="text-xs font-semibold text-gray-400 text-center mb-4">
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
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-2xl font-extrabold text-base tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-blue-200"
                >
                  {checking ? "Sedang check-in..." : "✨ Check-in Sekarang!"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-extrabold text-base hover:bg-gray-200 transition-colors"
                >
                  {isDay7 && result ? "Mantap! 🔥" : "Tutup"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
