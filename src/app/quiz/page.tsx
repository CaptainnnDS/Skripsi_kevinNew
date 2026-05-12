"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import { BookOpen } from "lucide-react";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export default function Quiz() {
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

      const { data: existingPet, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.log("Catatan: Ada masalah narik data.", error.message);
      }

      if (existingPet) {
        setPetData(existingPet);
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
          <span className="text-6xl mb-4 block animate-bounce">🧠</span>
          <h1 className={`text-3xl font-extrabold text-blue-900 mb-2 ${funFont.className}`}>
            Quiz
          </h1>
          <p className="text-gray-500 mb-6">
            Pilih materi dulu, lalu kerjakan quiz-nya!
          </p>
          <button
            onClick={() => router.push("/learn")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            <BookOpen className="w-5 h-5" />
            Ke Halaman Materi
          </button>
        </div>
      </div>

      <NavigationBar />
    </main>
  );
}
