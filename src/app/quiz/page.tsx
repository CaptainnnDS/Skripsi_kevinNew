"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";

export default function Quiz() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Wajib ambil data pet lengkap buat dikirim ke TopBar
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // INI YANG DIGANTI: Pake maybeSingle() dan pecah ke bawah biar jelas
      const { data: existingPet, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
        
      if (error) {
        console.log("Catatan: Ada masalah narik data, tapi aman udah ditangani.", error.message || error);
      }

      // INI LOGIKA PENGAMANNYA
      if (existingPet) {
        setPetData(existingPet);
      } else {
        // Kalau data Gibbey kosong, lempar balik ke Home biar dibuatin baru
        router.push("/");
        return; // Setop eksekusi kodingan di bawahnya
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
      {/* 1. Header & Status Bar */}
      <TopBar pet={petData} />
      
      {/* 2. Tombol Kiri Kanan */}
      <RoomNavigation />
      
      {/* 3. Konten Tengah Ruangan */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center border-4 border-blue-200 w-full max-w-md">
          <span className="text-6xl mb-4 block animate-bounce">🧠</span>
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">
            Quiz, Let's Play!
          </h1>
          <p className="text-gray-500">
            Belajar quiz
          </p>
        </div>
      </div>

      {/* 4. Bottom Bar Baru */}
      <NavigationBar />
    </main>
  );
}