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
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {newBadge ? (
          <>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-400 px-8 pt-8 pb-6 text-center">
              <div className="text-5xl mb-3 animate-bounce">✨</div>
              <h2 className="text-2xl font-bold text-white tracking-wide">RANK BARU TERBUKA!</h2>
            </div>
            <div className="px-8 py-6 text-center">
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xl font-bold mb-3"
                style={{ backgroundColor: `${newBadge.color}20`, color: newBadge.color }}
              >
                <span className="text-3xl">{newBadge.icon}</span>
                <span>{newBadge.name}</span>
              </div>
              <p className="text-gray-600 font-semibold mb-6">
                Selamat! Kamu sekarang <strong>{newBadge.name}</strong>!
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-2xl font-extrabold text-base hover:opacity-90 transition-opacity shadow-md"
              >
                Keren! 🔥
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 px-8 pt-8 pb-6 text-center">
              <div className="text-5xl mb-3 animate-bounce">🎉</div>
              <h2 className="text-2xl font-bold text-white tracking-wide">LEVEL UP!</h2>
            </div>
            <div className="px-8 py-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-3xl">{badge.icon}</span>
                <span className="text-4xl font-bold" style={{ color: badge.color }}>
                  Level {newLevel}
                </span>
              </div>
              <p className="text-gray-500 font-semibold mb-6">
                +{newLevel * 35} XP untuk level {newLevel + 1}
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-2xl font-extrabold text-base hover:opacity-90 transition-opacity shadow-md shadow-blue-200"
              >
                Lanjutkan 🚀
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
