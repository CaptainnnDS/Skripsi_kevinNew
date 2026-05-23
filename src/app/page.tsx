"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, safeFetch } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import PetCharacter from "@/components/game/PetCharacter"; 
import NavigationBar from "@/components/game/NavigationBar";
import NetworkError from "@/components/NetworkError";
import CheckinButton from "@/components/checkin/CheckinButton";
import LevelUpPopup from "@/components/xp/LevelUpPopup";
import Image from "next/image";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export default function Home() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; badge: any } | null>(null);
  const [checkinToast, setCheckinToast] = useState<{ xp: number; day: number } | null>(null);

  const loadData = useCallback(async () => {
    setNetworkError(null);
    setIsAuthLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);

      const { data: pets, error } = await safeFetch(
        supabase.from("pets").select("*").eq("user_id", session.user.id).limit(1)
      );

      if (error) {
        setNetworkError(error.message || "Gagal memuat data. Periksa koneksi.");
        setIsAuthLoading(false);
        return;
      }

      if (pets && pets.length > 0) {
        setPetData(pets[0]);
      } else {
        // Pet belum ada — arahkan ke setup
        router.push("/setup");
        return;
      }
    } catch (err: any) {
      setNetworkError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsAuthLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (networkError) {
    return <NetworkError message={networkError} onRetry={loadData} />;
  }

  if (isAuthLoading || !petData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-green-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mb-4"></div>
        <p className="font-bold animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <>
    <main className="fixed inset-0 flex flex-col bg-green-50 text-gray-900 overflow-hidden">
      
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg/living room 2.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* TOPBAR */}
      <div className="relative z-[60]"><TopBar pet={petData} /></div>

      {/* KONTEN TENGAH — flex-1 agar mengisi sisa ruang antara TopBar dan NavigationBar */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-lg mx-auto overflow-hidden">
        <h1 className={`text-3xl font-extrabold mb-4 drop-shadow-sm text-green-950 ${funFont.className}`}>
          Living Room
        </h1>
        
        <div className="relative flex flex-col items-center justify-center w-52 h-52 mb-4">
           <PetCharacter 
             petData={petData} 
             petMood="happy" 
           />
        </div>

        {/* Room Cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-4">
          <button
            onClick={() => router.push("/bedroom")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-2xl">🛏️</span>
            <span className="text-[11px] font-bold tracking-wide">Bedroom</span>
          </button>
          <button
            onClick={() => router.push("/bathroom")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-400 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-2xl">🛁</span>
            <span className="text-[11px] font-bold tracking-wide">Bathroom</span>
          </button>
          <button
            onClick={() => router.push("/kitchen")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br from-orange-400 to-red-400 text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-2xl">🍳</span>
            <span className="text-[11px] font-bold tracking-wide">Kitchen</span>
          </button>
        </div>

        {/* Daily Check-in */}
        {userId && (
          <div className="w-full max-w-xs">
            <CheckinButton
              userId={userId}
              onCheckinSuccess={(xp, day) => {
                setCheckinToast({ xp, day });
                setTimeout(() => setCheckinToast(null), 3000);
              }}
              onLevelUp={(level, badge) => setLevelUpInfo({ level, badge })}
            />
          </div>
        )}
      </div>

      {/* NAVBAR */}
      <NavigationBar />

    </main>

    {/* Check-in Toast — di luar <main> agar tidak terpotong overflow-hidden */}
    {checkinToast && (
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-base shadow-2xl animate-in zoom-in-95 fade-in duration-300 whitespace-nowrap">
        🔥 Day {checkinToast.day} • +{checkinToast.xp} XP!
      </div>
    )}

    {/* Level Up Popup — di luar <main> agar tidak terpotong */}
    {levelUpInfo && (
      <LevelUpPopup
        newLevel={levelUpInfo.level}
        newBadge={levelUpInfo.badge}
        onClose={() => setLevelUpInfo(null)}
      />
    )}
  </>
  );
}