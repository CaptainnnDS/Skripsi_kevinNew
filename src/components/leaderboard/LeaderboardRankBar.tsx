"use client";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";


interface LeaderboardRankBarProps {
  rank: number;
  total: number;
  totalCoinsEarned: number;
  currentCoins: number;
}

export default function LeaderboardRankBar({
  rank,
  total,
  totalCoinsEarned,
  currentCoins,
}: LeaderboardRankBarProps) {
  const router = useRouter();
  const isOutsideTop10 = rank > 10;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-blue-100 text-sm">Peringkatmu</p>
          <p className="text-2xl font-bold">
            #{rank}{" "}
            <span className="text-sm font-normal text-blue-200">
              dari {total} pemain
            </span>
          </p>
        </div>
        {isOutsideTop10 && (
          <button
            onClick={() => router.push("/learn")}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors"
          >
            <Flame size={18} />
            <span className="font-bold text-sm">Kejar Top 10!</span>
          </button>
        )}
      </div>

      <div className="flex gap-4 mt-3">
        <div className="bg-white/10 rounded-xl px-4 py-2 flex-1">
          <p className="text-blue-200 text-xs">Total Koin Terkumpul</p>
          <p className="font-bold text-lg">🏅 {totalCoinsEarned.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-xl px-4 py-2 flex-1">
          <p className="text-blue-200 text-xs">Saldo Saat Ini</p>
          <p className="font-bold text-lg">💰 {currentCoins.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
