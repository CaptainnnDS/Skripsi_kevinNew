"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { submitQuiz, checkMateriAccess, type Question, type QuizResultData } from "@/lib/quiz";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import QuizEngine from "@/components/quiz/QuizEngine";
import QuizResult from "@/components/quiz/QuizResult";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

interface Materi {
  id: number;
  title: string;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const materiId = Number(params.materiId);

  const [petData, setPetData] = useState<any>(null);
  const [materi, setMateri] = useState<Materi | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      // Auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);

      // Fetch pet data
      const { data: pets, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (petError || !pets || pets.length === 0) {
        router.push("/");
        return;
      }
      setPetData(pets[0]);

      // Fetch materi info
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select("id, title")
        .eq("id", materiId)
        .single();

      if (materiError || !materiData) {
        setError("Materi tidak ditemukan.");
        setIsLoading(false);
        return;
      }
      setMateri(materiData);

      // Guard: cek akses user ke materi ini (per-user unlock)
      const hasAccess = await checkMateriAccess(session.user.id, materiId);
      if (!hasAccess) {
        setError("Materi ini masih terkunci. Selesaikan quiz modul sebelumnya dulu!");
        setIsLoading(false);
        return;
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("materi_id", materiId)
        .order("order", { ascending: true });

      if (questionsError || !questionsData || questionsData.length === 0) {
        setError("Belum ada soal quiz untuk materi ini.");
        setIsLoading(false);
        return;
      }

      setQuestions(questionsData);
      setIsLoading(false);
    };

    loadData();
  }, [router, materiId]);

  const handleSubmit = async (submittedAnswers: Record<number, number>) => {
    setAnswers(submittedAnswers);
    setIsSubmitting(true);

    try {
      const quizResult = await submitQuiz({
        userId,
        materiId,
        questions,
        answers: submittedAnswers,
      });
      setResult(quizResult);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Gagal submit quiz. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setError(null);
  };

  const handleBackToLearn = () => {
    router.push("/learn");
  };

  // Loading state
  if (isLoading || !petData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-blue-900">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="font-bold animate-pulse">Memuat quiz...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-hidden">
        <TopBar pet={petData} />
        <div className="flex-1 flex flex-col items-center justify-center px-16 py-4 relative z-10">
          <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-red-100 text-center max-w-md w-full">
            <span className="text-5xl block mb-3">😢</span>
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={() => router.push("/learn")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Materi
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

      <div className="flex-1 flex flex-col px-4 py-4 relative z-10 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.push(`/learn/${materiId}`)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Materi
          </button>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">🧠</span>
            </div>
            <h1 className={`text-lg font-bold text-blue-900 ${funFont.className}`}>
              Quiz: {materi!.title}
            </h1>
          </div>
        </div>

        {/* Submitting overlay — tetap dalam layout */}
        {isSubmitting && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="font-bold text-blue-900 animate-pulse">Menghitung hasil...</p>
          </div>
        )}

        {/* Quiz Content */}
        {!isSubmitting && result && (
          <QuizResult
            score={result.score}
            totalQuestions={result.totalQuestions}
            rewardCoins={result.rewardCoins}
            isPassed={result.isPassed}
            questions={questions}
            answers={answers}
            onRetry={handleRetry}
            onBackToLearn={handleBackToLearn}
          />
        )}

        {!isSubmitting && !result && (
          <QuizEngine questions={questions} onSubmit={handleSubmit} />
        )}
      </div>

      <NavigationBar />
    </main>
  );
}
