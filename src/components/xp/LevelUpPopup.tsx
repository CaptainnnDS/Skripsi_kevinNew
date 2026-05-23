"use client";
import { getBadgeFromLevel, BadgeTier } from "@/lib/xp";

interface LevelUpPopupProps {
  newLevel: number;
  onClose: () => void;
  newBadge?: BadgeTier | null;
}

export default function LevelUpPopup({ newLevel, onClose, newBadge }: LevelUpPopupProps) {
  const badge = getBadgeFromLevel(newLevel);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {newBadge ? (
          <>
            {/* Rank Up */}
            <div className="text-5xl mb-4 animate-bounce">✨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              RANK BARU TERBUKA!
            </h2>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xl font-bold mb-4"
              style={{ backgroundColor: `${newBadge.color}20`, color: newBadge.color }}
            >
              <span className="text-3xl">{newBadge.icon}</span>
              <span>{newBadge.name}</span>
            </div>
            <p className="text-gray-600 mb-6">
              Selamat! Kamu sekarang <strong>{newBadge.name}</strong>!
            </p>
          </>
        ) : (
          <>
            {/* Level Up */}
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              LEVEL UP!
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">{badge.icon}</span>
              <span className="text-4xl font-bold" style={{ color: badge.color }}>
                Level {newLevel}
              </span>
            </div>
            <p className="text-gray-600 mb-6">
              +{newLevel * 35} XP untuk level {newLevel + 1}
            </p>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          {newBadge ? "Keren!" : "Lanjutkan"}
        </button>
      </div>
    </div>
  );
}
