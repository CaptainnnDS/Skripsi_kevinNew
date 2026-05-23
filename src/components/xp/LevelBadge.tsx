"use client";
import { getBadgeFromLevel, BadgeTier } from "@/lib/xp";


interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function LevelBadge({ level, size = "md", showLabel = true }: LevelBadgeProps) {
  const badge = getBadgeFromLevel(level);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSize = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClasses[size]}`}
      style={{ backgroundColor: `${badge.color}20`, color: badge.color, border: `2px solid ${badge.color}40` }}
      title={`${badge.name} - Level ${level}`}
    >
      <span className={iconSize[size]}>{badge.icon}</span>
      {showLabel && (
        <span className="font-bold">Lv.{level}</span>
      )}
    </div>
  );
}
