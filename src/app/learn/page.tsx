"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import { BookOpen, Clock, Star, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

interface Materi {
  id: number;
  title: string;
  description: string;
  icon: string;
  total_lessons: number;
  duration: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
  is_locked: boolean;
  order: number;
  pdf_url: string;
}

export default function Learn() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, boolean>>({});
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch pet data
      const { data: pets, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (petError) {
        console.log("Catatan: Ada masalah narik data pet", petError.message);
      }

      if (pets && pets.length > 0) {
        setPetData(pets[0]);
      } else {
        router.push("/");
        return;
      }

      // Fetch materi list
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select("*")
        .order("order", { ascending: true });

      if (materiError) {
        console.log("Catatan: Ada masalah narik data materi", materiError.message);
      }

      // Fetch user progress
      const { data: progressData } = await supabase
        .from("user_materi_progress")
        .select("materi_id, quiz_passed")
        .eq("user_id", session.user.id)
        .eq("quiz_passed", true);

      const passedMap: Record<number, boolean> = {};
      if (progressData) {
        progressData.forEach((p) => {
          passedMap[p.materi_id] = true;
        });
      }
      setProgressMap(passedMap);

      // Tentukan lock status per-user:
      // Modul pertama (order=1) selalu terbuka.
      // Modul lain terbuka jika modul sebelumnya sudah lulus quiz.
      if (materiData) {
        const sorted = materiData.sort((a, b) => a.order - b.order);
        const withAccess = sorted.map((m, idx) => {
          if (idx === 0) {
            return { ...m, is_locked: false };
          }
          const prevMateri = sorted[idx - 1];
          const prevPassed = passedMap[prevMateri.id] ?? false;
          return { ...m, is_locked: !prevPassed };
        });
        setMateriList(withAccess);
      }

      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Mudah": return "bg-green-100 text-green-700";
      case "Sedang": return "bg-yellow-100 text-yellow-700";
      case "Sulit": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

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

      <div className="flex-1 flex flex-col px-16 py-4 relative z-10">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className={`text-2xl font-bold text-blue-900 ${funFont.className}`}>
              Materi Belajar
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Pilih materi buat bikin Gibbey makin pinter! 🧠
          </p>
        </div>

        {/* Materi Cards */}
        <div className="flex flex-col gap-3">
          {materiList.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-8 text-center">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-gray-500 text-sm">Belum ada materi tersedia.</p>
            </div>
          )}

          {materiList.map((materi) => (
            <button
              key={materi.id}
              disabled={materi.is_locked}
              onClick={() => !materi.is_locked && router.push(`/learn/${materi.id}`)}
              className={`relative w-full text-left bg-white rounded-2xl shadow-md border-2 p-4 transition-all duration-200 
                ${materi.is_locked
                  ? "border-gray-200 opacity-60 cursor-not-allowed"
                  : "border-blue-100 hover:border-blue-300 hover:shadow-lg active:scale-[0.98]"
                }`}
            >
              {/* Lock overlay */}
              {materi.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl z-10">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-3xl flex-shrink-0 bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center">
                  {materi.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-gray-900 text-sm truncate ${funFont.className}`}>
                      {materi.title}
                    </h3>
                    {progressMap[materi.id] ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {materi.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(materi.difficulty)}`}>
                      {materi.difficulty}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {materi.duration}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3" />
                      {materi.total_lessons} lesson
                    </span>
                    {progressMap[materi.id] && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✅ Selesai
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <NavigationBar />
    </main>
  );
}
