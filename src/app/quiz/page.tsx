"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, safeFetch } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import QuizHistory, { type QuizAttempt } from "@/components/quiz/QuizHistory";
import { ScrollText, BookOpen } from "lucide-react";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export default function QuizHistoryPage() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch pet data
      const { data: pets } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (!pets || pets.length === 0) {
        router.push("/");
        return;
      }
      setPetData(pets[0]);

      // Fetch history + materi title
      const { data: history } = await supabase
        .from("user_question_history")
        .select("materi_id, is_correct, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      // Fetch materi titles
      const { data: materiList } = await supabase
        .from("materi")
        .select("id, title");

      const materiMap: Record<number, string> = {};
      if (materiList) {
        materiList.forEach((m) => {
          materiMap[m.id] = m.title;
        });
      }

      // Group by materi_id + date
      if (history && history.length > 0) {
        const grouped: Record<string, { materiId: number; materiTitle: string; date: string; total: number; correct: number }> = {};

        history.forEach((h) => {
          const date = h.created_at.split("T")[0];
          const key = `${h.materi_id}-${date}`;
          if (!grouped[key]) {
            grouped[key] = {
              materiId: h.materi_id,
              materiTitle: materiMap[h.materi_id] || `Materi #${h.materi_id}`,
              date,
              total: 0,
              correct: 0,
            };
          }
          grouped[key].total++;
          if (h.is_correct) grouped[key].correct++;
        });

        // Sort by date descending
        const attemptList: QuizAttempt[] = Object.values(grouped)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((g) => ({
            materiId: g.materiId,
            materiTitle: g.materiTitle,
            date: g.date,
            totalSoal: g.total,
            jawabanBenar: g.correct,
            koinDidapat: g.correct * 100, // Estimasi (actual koin bisa beda karena incremental)
          }));

        setAttempts(attemptList);
      }

      setIsLoading(false);
    };

    loadData();
  }, [router]);

  if (isLoading || !petData) {
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
            <ScrollText className="w-6 h-6 text-blue-600" />
            <h1 className={`text-2xl font-bold text-blue-900 ${funFont.className}`}>
              Riwayat Quiz
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Semua percobaan quiz kamu ada di sini 📜
          </p>
        </div>

        {/* History */}
        <QuizHistory attempts={attempts} />

        {/* CTA to learn */}
        <div className="mt-4">
          <button
            onClick={() => router.push("/learn")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Ke Halaman Materi
          </button>
        </div>
      </div>

      <NavigationBar />
    </main>
  );
}
