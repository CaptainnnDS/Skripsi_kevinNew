"use client";
import { useState } from "react";
import { X, Hand } from "lucide-react";
import { LeaderboardEntry, sendPoke } from "@/lib/leaderboard";
import PetCharacter from "@/components/game/PetCharacter";

interface ProfilePopupProps {
  entry: LeaderboardEntry;
  currentUserId: string;
  currentPetName: string;
  onClose: () => void;
}

export default function ProfilePopup({
  entry,
  currentUserId,
  currentPetName,
  onClose,
}: ProfilePopupProps) {
  const [poking, setPoking] = useState(false);
  const [pokeMessage, setPokeMessage] = useState<string | null>(null);

  const isOwnProfile = entry.userId === currentUserId;

  const handlePoke = async () => {
    if (isOwnProfile || poking) return;

    setPoking(true);
    setPokeMessage(null);

    try {
      const result = await sendPoke(currentUserId, entry.userId, currentPetName);
      setPokeMessage(result.success ? `✅ ${result.message}` : `⏳ ${result.message}`);

      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setPokeMessage(`❌ ${err.message || "Gagal mencolek. Coba lagi."}`);
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
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

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
            <p className="text-xs text-yellow-600">Total Koin</p>
            <p className="font-bold text-yellow-700">
              🏅 {entry.totalCoinsEarned.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            <p className="text-xs text-green-600">Saldo</p>
            <p className="font-bold text-green-700">
              💰 {entry.currentCoins.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold">Perlengkapan:</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-white px-3 py-1 rounded-full border">
              🛏️ {entry.equippedBed || "Default"}
            </span>
            <span className="bg-white px-3 py-1 rounded-full border">
              🌙 {entry.equippedNightlight || "Default"}
            </span>
            <span className="bg-white px-3 py-1 rounded-full border">
              🌌 {entry.equippedWallpaper || "Default"}
            </span>
          </div>
        </div>

        {/* Poke Message */}
        {pokeMessage && (
          <p className="text-center text-sm mb-3">{pokeMessage}</p>
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
