"use client";
import { useState, useEffect } from "react";
import { X, Hand, ChevronLeft, ChevronRight } from "lucide-react";
import { LeaderboardEntry, sendPoke } from "@/lib/leaderboard";
import { getUserXp, UserXp, getBadgeFromLevel, getXpProgress } from "@/lib/xp";
import PetCharacter from "@/components/game/PetCharacter";
import LevelBadge from "@/components/xp/LevelBadge";
import XpProgressBar from "@/components/xp/XpProgressBar";

interface ProfilePopupProps {
  entry: LeaderboardEntry;
  currentUserId: string;
  currentPetName: string;
  onClose: () => void;
  onPokeSuccess?: (message: string) => void;
  // Navigasi antar profil
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function ProfilePopup({
  entry,
  currentUserId,
  currentPetName,
  onClose,
  onPokeSuccess,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ProfilePopupProps) {
  const [poking, setPoking] = useState(false);
  const [pokeError, setPokeError] = useState<string | null>(null);
  const [xpData, setXpData] = useState<UserXp | null>(null);

  const isOwnProfile = entry.userId === currentUserId;

  // Fetch XP data for this profile
  useEffect(() => {
    const fetchXp = async () => {
      try {
        const data = await getUserXp(entry.userId);
        setXpData(data);
      } catch {
        // Tabel belum ada, skip
      }
    };
    fetchXp();
  }, [entry.userId]);

  const handlePoke = async () => {
    if (isOwnProfile || poking) return;

    setPoking(true);
    setPokeError(null);

    try {
      const result = await sendPoke(currentUserId, entry.userId, currentPetName);
      
      if (result.success) {
        onPokeSuccess?.(`✅ Berhasil mencolek ${entry.petName}!`);
      } else {
        setPokeError(`⏳ ${result.message}`);
      }
    } catch (err: any) {
      setPokeError(`❌ ${err.message || "Gagal mencolek. Coba lagi."}`);
    } finally {
      setPoking(false);
    }
  };

  // Buat petData object untuk PetCharacter
  const petDataForCharacter = {
    body_color: entry.bodyColor,
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Navigation Buttons */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight size={24} className="text-gray-600" />
          </button>
        )}

        {/* Rank Badge */}
        <div className="flex justify-center mb-2">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            entry.rank === 1 ? "bg-yellow-100 text-yellow-700" :
            entry.rank === 2 ? "bg-gray-100 text-gray-700" :
            entry.rank === 3 ? "bg-amber-100 text-amber-700" :
            "bg-blue-100 text-blue-700"
          }`}>
            #{entry.rank}
          </span>
        </div>

        {/* Pet Character */}
        <div className="flex justify-center mb-4">
          <div className="w-32 h-32">
            <PetCharacter
              petData={petDataForCharacter}
              petMood="happy"
              isSleeping={false}
            />
          </div>
        </div>

        {/* Name */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {entry.petName}
          {isOwnProfile && (
            <span className="ml-2 text-sm text-blue-500">(Kamu)</span>
          )}
        </h2>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200">
            <p className="text-xs text-yellow-600 font-medium">Total Koin</p>
            <p className="font-bold text-yellow-700">
              🏅 {entry.totalCoinsEarned.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            <p className="text-xs text-green-600 font-medium">Saldo</p>
            <p className="font-bold text-green-700">
              💰 {entry.currentCoins.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Level & XP Progress */}
        {xpData && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <LevelBadge level={xpData.currentLevel} size="md" />
              <span className="text-xs text-blue-600 font-medium">
                {getBadgeFromLevel(xpData.currentLevel).icon} {getBadgeFromLevel(xpData.currentLevel).name}
              </span>
            </div>
            <XpProgressBar
              progress={getXpProgress(xpData.totalXp)}
              level={xpData.currentLevel}
              totalXp={xpData.totalXp}
              compact={true}
            />
          </div>
        )}

        {/* Equipment - Warna lebih terlihat */}
        <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
          <p className="text-sm text-purple-700 mb-3 font-bold">🎒 Perlengkapan:</p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white px-3 py-1.5 rounded-lg border-2 border-purple-200 text-sm font-medium text-gray-700">
              🛏️ {entry.equippedBed || "Default"}
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg border-2 border-purple-200 text-sm font-medium text-gray-700">
              🌙 {entry.equippedNightlight || "Default"}
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg border-2 border-purple-200 text-sm font-medium text-gray-700">
              🌌 {entry.equippedWallpaper || "Default"}
            </span>
          </div>
        </div>

        {/* Poke Error Message */}
        {pokeError && (
          <p className="text-center text-sm mb-3 text-orange-600 font-medium">{pokeError}</p>
        )}

        {/* Poke Button */}
        {!isOwnProfile && (
          <button
            onClick={handlePoke}
            disabled={poking}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Hand size={20} />
            {poking ? "Mencolek..." : "👆 Poke Gibbey-nya!"}
          </button>
        )}
      </div>
    </div>
  );
}
