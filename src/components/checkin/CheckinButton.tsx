"use client";
import { useState, useEffect } from "react";
import { CalendarCheck, Flame, Loader2 } from "lucide-react";
import { getCheckinStatus, performCheckin, STREAK_XP, CheckinStatus } from "@/lib/checkin";

interface CheckinButtonProps {
  userId: string;
  onCheckinSuccess?: (xpEarned: number, streakDay: number) => void;
  onLevelUp?: (newLevel: number, newBadge: any) => void;
}

export default function CheckinButton({ userId, onCheckinSuccess, onLevelUp }: CheckinButtonProps) {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getCheckinStatus(userId);
        setStatus(s);
      } catch {
        // Tabel belum ada, skip
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleCheckin = async () => {
    if (checking || status?.checkedInToday) return;
    setChecking(true);

    try {
      const result = await performCheckin(userId);
      setStatus({
        checkedInToday: true,
        currentStreakDay: result.streakDay,
        todayXp: result.xpEarned,
        weekXpEarned: 0,
      });
      // Kirim ke parent untuk ditampilkan di luar overflow-hidden
      onCheckinSuccess?.(result.xpEarned, result.streakDay);

      if (result.xpResult?.leveledUp) {
        onLevelUp?.(result.xpResult.newLevel, result.xpResult.newBadge ?? null);
      }
    } catch (err) {
      console.error("Checkin error:", err);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-3 border border-gray-200 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  const nextStreakDay = status?.checkedInToday
    ? status.currentStreakDay
    : (status?.currentStreakDay ?? 0) + 1;
  const clampedDay = Math.min(Math.max(nextStreakDay, 1), 7);
  const nextXp = STREAK_XP[clampedDay - 1] || STREAK_XP[0];

  return (
    <button
      onClick={handleCheckin}
      disabled={status?.checkedInToday || checking}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
        status?.checkedInToday
          ? "bg-green-50 border-green-300 cursor-default"
          : "bg-orange-50 border-orange-300 hover:bg-orange-100 hover:scale-[1.02] active:scale-95"
      }`}
    >
      {checking ? (
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      ) : status?.checkedInToday ? (
        <CalendarCheck className="w-6 h-6 text-green-500" />
      ) : (
        <Flame className="w-6 h-6 text-orange-500" />
      )}

      <div className="flex-1 text-left">
        <p className="font-bold text-sm text-gray-800">
          {status?.checkedInToday ? "Sudah Check-in ✅" : "Daily Check-in"}
        </p>
        <p className="text-xs text-gray-500">
          {status?.checkedInToday
            ? `Day ${status.currentStreakDay} streak`
            : `Day ${clampedDay} • +${nextXp} XP`}
        </p>
      </div>

      {!status?.checkedInToday && (
        <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
          +{nextXp} XP
        </div>
      )}
    </button>
  );
}
