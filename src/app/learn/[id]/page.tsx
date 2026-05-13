"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { checkMateriAccess } from "@/lib/quiz";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import PdfViewer from "@/components/learn/PdfViewer";
import MateriQuizHistory, { type MateriAttempt } from "@/components/quiz/MateriQuizHistory";
import { ArrowLeft, Loader2, Target } from "lucide-react";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

interface Materi {
  id: number;
  title: string;
  description: string;
  pdf_url: string;
  is_locked: boolean;
}

export default function LearnDetail() {
  const router = useRouter();
  const params = useParams();
  const materiId = params.id as string;

  const [petData, setPetData] = useState<any>(null);
  const [materi, setMateri] = useState<Materi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizHistory, setQuizHistory] = useState<MateriAttempt[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Auth check
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
        console.log("Error fetching pet:", petError.message);
      }

      if (pets && pets.length > 0) {
        setPetData(pets[0]);
      } else {
        router.push("/");
        return;
      }

      // Fetch materi by id
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select("*")
        .eq("id", materiId)
        .single();

      if (materiError || !materiData) {
        setError("Materi tidak ditemukan.");
        setIsLoading(false);
        return;
      }

      // Cek akses per-user (bukan dari is_locked global)
      const hasAccess = await checkMateriAccess(session.user.id, materiData.id);
      if (!hasAccess) {
        setError("Materi ini masih terkunci. Selesaikan quiz modul sebelumnya dulu!");
        setIsLoading(false);
        return;
      }

      setMateri(materiData);

      // Cek progress quiz (sebelum setIsLoading agar tidak flash)
      const { data: progress } = await supabase
        .from("user_materi_progress")
        .select("quiz_passed")
        .eq("user_id", session.user.id)
        .eq("materi_id", materiId)
        .single();

      if (progress?.quiz_passed) {
        setQuizPassed(true);
      }

      // Fetch riwayat quiz per materi
      const { data: historyData } = await supabase
        .from("user_question_history")
        .select("is_correct, created_at")
        .eq("user_id", session.user.id)
        .eq("materi_id", materiId)
        .order("created_at", { ascending: false });

      if (historyData && historyData.length > 0) {
        // Group by date
        const grouped: Record<string, { total: number; correct: number }> = {};
        historyData.forEach((h) => {
          const date = h.created_at.split("T")[0];
          if (!grouped[date]) grouped[date] = { total: 0, correct: 0 };
          grouped[date].total++;
          if (h.is_correct) grouped[date].correct++;
        });

        const attemptList: MateriAttempt[] = Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, data]) => ({
            date,
            totalSoal: data.total,
            jawabanBenar: data.correct,
            koinDidapat: data.correct * 100,
          }));

        setQuizHistory(attemptList);
      }

      setIsLoading(false);
    };

    loadData();
  }, [router, materiId]);

  // Loading state
  if (isLoading || !petData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-blue-900">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="font-bold animate-pulse">Memuat materi...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-hidden">
        <TopBar pet={petData} />
        <RoomNavigation />

        <div className="flex-1 flex flex-col items-center justify-center px-16 py-4 relative z-10">
          <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-red-100 text-center max-w-md w-full">
            <span className="text-5xl block mb-3">😢</span>
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={() => router.push("/learn")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Materi
            </button>
          </div>
        </div>

        <NavigationBar />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-hidden">
      <TopBar pet={petData} />
      <RoomNavigation />

      <div className="flex-1 flex flex-col px-16 py-4 relative z-10">
        {/* Back button + Materi info */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/learn")}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="flex-shrink-0 bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">📖</span>
            </div>
            <div>
              <h1 className={`text-xl font-bold text-blue-900 ${funFont.className}`}>
                {materi!.title}
              </h1>
              <p className="text-xs text-gray-500">{materi!.description}</p>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <PdfViewer pdfUrl={materi!.pdf_url} title={materi!.title} />

        {/* Tombol Ikut Quiz */}
        <div className="mt-4">
          <button
            onClick={() => router.push(`/quiz/${materi!.id}`)}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md
              ${quizPassed
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              }`}
          >
            <Target className="w-5 h-5" />
            {quizPassed ? "✅ Quiz Selesai — Coba Lagi?" : "Ikut Quiz 🎯"}
          </button>
        </div>

        {/* Riwayat Quiz Per Materi */}
        <MateriQuizHistory attempts={quizHistory} />
      </div>

      <NavigationBar />
    </main>
  );
}
