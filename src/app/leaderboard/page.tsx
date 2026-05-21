"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trophy, RefreshCw } from "lucide-react";
import { supabase, safeFetch } from "@/lib/supabase";
import { getLeaderboard, LeaderboardEntry, LeaderboardData } from "@/lib/leaderboard";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import LeaderboardRankBar from "@/components/leaderboard/LeaderboardRankBar";
import ProfilePopup from "@/components/leaderboard/ProfilePopup";
import NetworkError from "@/components/NetworkError";

export default function LeaderboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [petData, setPetData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derived state: selected profile from index
  const selectedProfile = selectedProfileIndex !== null && leaderboardData
    ? leaderboardData.top10[selectedProfileIndex] || null
    : null;

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Cek auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // 2. Ambil data pet user
      const { data: pet, error: petError } = await safeFetch(
        supabase.from("pets").select("*").eq("user_id", user.id).single()
      );

      if (petError) {
        setError("Gagal memuat data pet. Periksa koneksi.");
        setIsLoading(false);
        return;
      }

      if (!pet) {
        router.push("/setup");
        return;
      }

      setPetData(pet);

      // 3. Ambil data leaderboard
      const data = await getLeaderboard(user.id);
      setLeaderboardData(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handler untuk select profile dari table
  const handleSelectProfile = useCallback((entry: LeaderboardEntry) => {
    if (!leaderboardData) return;
    const index = leaderboardData.top10.findIndex(e => e.userId === entry.userId);
    setSelectedProfileIndex(index >= 0 ? index : null);
  }, [leaderboardData]);

  // Navigation handlers
  const handlePrevProfile = useCallback(() => {
    if (selectedProfileIndex !== null && selectedProfileIndex > 0) {
      setSelectedProfileIndex(selectedProfileIndex - 1);
    }
  }, [selectedProfileIndex]);

  const handleNextProfile = useCallback(() => {
    if (selectedProfileIndex !== null && leaderboardData && selectedProfileIndex < leaderboardData.top10.length - 1) {
      setSelectedProfileIndex(selectedProfileIndex + 1);
    }
  }, [selectedProfileIndex, leaderboardData]);

  const hasPrev = selectedProfileIndex !== null && selectedProfileIndex > 0;
  const hasNext = selectedProfileIndex !== null && leaderboardData !== null && selectedProfileIndex < leaderboardData.top10.length - 1;
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat papan peringkat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center p-4">
        <NetworkError message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      <TopBar pet={petData} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-400 p-3 rounded-2xl shadow-lg">
            <Trophy className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Papan Peringkat</h1>
            <p className="text-gray-500 text-sm">
              Top 10 pemain dengan koin terbanyak
            </p>
          </div>
          <button
            onClick={loadData}
            className="ml-auto p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Leaderboard Table */}
        {leaderboardData && (
          <>
            <LeaderboardTable
              entries={leaderboardData.top10}
              currentUserId={userId || ""}
              onSelect={handleSelectProfile}
            />

            {/* User Rank Bar */}
            {leaderboardData.userEntry && (
              <div className="mt-6">
                <LeaderboardRankBar
                  rank={leaderboardData.userEntry.rank}
                  total={leaderboardData.totalPlayers}
                  totalCoinsEarned={leaderboardData.userEntry.totalCoinsEarned}
                  currentCoins={leaderboardData.userEntry.currentCoins}
                />
              </div>
            )}
          </>
        )}
      </main>

      <NavigationBar />

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Profile Popup */}
      {selectedProfile && userId && petData && (
        <ProfilePopup
          entry={selectedProfile}
          currentUserId={userId}
          currentPetName={petData.name || "Gibbey"}
          onClose={() => setSelectedProfileIndex(null)}
          onPokeSuccess={setToastMessage}
          onPrev={handlePrevProfile}
          onNext={handleNextProfile}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </div>
  );
}
