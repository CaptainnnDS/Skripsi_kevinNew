"use client";
import { LeaderboardEntry } from "@/lib/leaderboard";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  onSelect: (entry: LeaderboardEntry) => void;
}

export default function LeaderboardTable({
  entries,
  currentUserId,
  onSelect,
}: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={20} />;
      case 2:
        return <Medal className="text-gray-400" size={20} />;
      case 3:
        return <Award className="text-amber-600" size={20} />;
      default:
        return <span className="text-gray-500 font-bold text-sm">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-blue-50 border-blue-300";
    switch (rank) {
      case 1:
        return "bg-yellow-50 border-yellow-300";
      case 2:
        return "bg-gray-50 border-gray-300";
      case 3:
        return "bg-amber-50 border-amber-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada pemain lain.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isCurrentUser = entry.userId === currentUserId;
        return (
          <button
            key={entry.userId}
            onClick={() => onSelect(entry)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-md ${getRankBg(
              entry.rank,
              isCurrentUser
            )}`}
          >
            {/* Rank */}
            <div className="w-10 h-10 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Pet Color Preview */}
            <div
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: entry.bodyColor }}
            />

            {/* Name */}
            <div className="flex-1 text-left">
              <p className="font-bold text-gray-800">
                {entry.petName}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-blue-500">(Kamu)</span>
                )}
              </p>
            </div>

            {/* Total Coins */}
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
              <span className="text-yellow-600 font-bold">
                🏅 {entry.totalCoinsEarned.toLocaleString()}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
