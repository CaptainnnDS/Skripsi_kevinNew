"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";

export default function Learn() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Narik data pake limit(1) biar kebal badai error
      const { data: pets, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (error) {
        console.log("Catatan: Ada masalah narik data", error.message);
      }

      if (pets && pets.length > 0) {
        setPetData(pets[0]);
      } else {
        router.push("/");
        return;
      }

      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  if (isAuthLoading || !petData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-blue-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="font-bold animate-pulse">Jalan ke ruangan...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-hidden">
      <TopBar pet={petData} />
      <RoomNavigation />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center border-4 border-blue-200 w-full max-w-md">
          
          <span className="text-6xl mb-4 block animate-bounce">📚</span>
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">
            Learn
          </h1>
          <p className="text-gray-500">
            Waktunya belajar materi ITS biar Gibbey makin pinter!
          </p>
          
        </div>
      </div>

      <NavigationBar />
    </main>
  );
}