"use client";
import { XpProgress } from "@/lib/xp";

interface XpProgressBarProps {
  progress: XpProgress;
  level: number;
  totalXp: number;
  compact?: boolean;
}

export default function XpProgressBar({ progress, level, totalXp, compact = false }: XpProgressBarProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {progress.currentLevelXp}/{progress.requiredXp}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-600">
          Level {level} → {level + 1}
        </span>
        <span className="text-xs text-gray-500">
          {totalXp} XP total
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">
        {progress.currentLevelXp} / {progress.requiredXp} XP
      </p>
    </div>
  );
}
