"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { submitQuiz, checkMateriAccess, type Question, type QuizResultData } from "@/lib/quiz";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import QuizEngine from "@/components/quiz/QuizEngine";
import QuizReview from "@/components/quiz/QuizReview";
import QuizResult from "@/components/quiz/QuizResult";
import LevelUpPopup from "@/components/xp/LevelUpPopup";
import { ArrowLeft, Loader2 } from "lucide-react";


interface Materi {
  id: number;
  title: string;
}

/** Fisher-Yates shuffle */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Shuffle options dan update correct_answer index */
function shuffleQuestionOptions(question: Question): Question {
  const indices = question.options.map((_, i) => i);
  // Fisher-Yates shuffle indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    ...question,
    options: indices.map((i) => question.options[i]),
    correct_answer: indices.indexOf(question.correct_answer),
  };
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
  const [nextMateriId, setNextMateriId] = useState<number | undefined>(undefined);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; badge: any } | null>(null);

  // Tab switch detection
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Leave confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  // Quiz sedang aktif (belum submit, belum ada result)
  const isQuizActive = !result && !isSubmitting && !isLoading && !error;

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

      // Guard: cek akses user ke materi ini
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

      // Shuffle soal & opsi
      const shuffledQuestions = shuffleArray(questionsData).map(shuffleQuestionOptions);
      setQuestions(shuffledQuestions);

      // Fetch next materi id
      const { data: currentMateri } = await supabase
        .from("materi")
        .select("sort_order")
        .eq("id", materiId)
        .single();

      if (currentMateri) {
        const { data: nextMateri } = await supabase
          .from("materi")
          .select("id")
          .eq("sort_order", currentMateri.sort_order + 1)
          .single();

        if (nextMateri) {
          setNextMateriId(nextMateri.id);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [router, materiId]);

  // Tab switch detection
  useEffect(() => {
    if (!isQuizActive) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowTabWarning(true);
        // Auto-hide warning after 3 seconds
        setTimeout(() => setShowTabWarning(false), 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isQuizActive]);

  // beforeunload — prevent accidental close
  useEffect(() => {
    if (!isQuizActive) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isQuizActive]);

  // Intercept browser back button
  useEffect(() => {
    if (!isQuizActive) return;

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowLeaveConfirm(true);
      setPendingNav(`/learn/${materiId}`);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isQuizActive, materiId]);

  // Handle navigasi dengan konfirmasi
  const handleBackClick = useCallback((path: string) => {
    if (isQuizActive) {
      setShowLeaveConfirm(true);
      setPendingNav(path);
    } else {
      router.push(path);
    }
  }, [isQuizActive, router]);

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    if (pendingNav) router.push(pendingNav);
  };

  // Quiz flow handlers
  const handleFinish = (submittedAnswers: Record<number, number>) => {
    setAnswers(submittedAnswers);
    setShowReview(true);
  };

  const handleConfirmSubmit = async () => {
    setShowReview(false);
    setIsSubmitting(true);

    try {
      const quizResult = await submitQuiz({
        userId,
        materiId,
        questions,
        answers,
      });
      setResult(quizResult);

      // Cek level up dari XP result
      if (quizResult.xpResult?.leveledUp) {
        setLevelUpInfo({
          level: quizResult.xpResult.newLevel,
          badge: quizResult.xpResult.newBadge,
        });
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Gagal submit quiz. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEdit = () => {
    setShowReview(false);
  };

  const handleRetry = () => {
    // Re-shuffle untuk attempt baru
    setQuestions((prev) => shuffleArray(prev).map(shuffleQuestionOptions));
    setResult(null);
    setAnswers({});
    setShowReview(false);
    setError(null);
    setTabSwitchCount(0);
  };

  const handleBackToLearn = () => {
    router.push(`/learn/${materiId}`);
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

      {/* Tab switch warning toast */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold animate-bounce">
          👀 Jangan buka tab lain ya! ({tabSwitchCount}x terdeteksi)
        </div>
      )}

      <div className="flex-1 flex flex-col px-4 py-4 relative z-10 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => handleBackClick(`/learn/${materiId}`)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Materi
          </button>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">🧠</span>
            </div>
            <h1 className={`text-lg font-bold text-blue-900`}>
              Quiz: {materi!.title}
            </h1>
          </div>
        </div>

        {/* Submitting overlay */}
        {isSubmitting && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="font-bold text-blue-900 animate-pulse">Menghitung hasil...</p>
          </div>
        )}

        {/* Result */}
        {!isSubmitting && result && (
          <QuizResult
            score={result.score}
            totalQuestions={result.totalQuestions}
            rewardCoins={result.rewardCoins}
            isPassed={result.isPassed}
            questions={questions}
            answers={answers}
            nextMateriId={nextMateriId}
            onRetry={handleRetry}
            onBackToLearn={handleBackToLearn}
          />
        )}

        {/* Review Screen */}
        {!isSubmitting && !result && showReview && (
          <QuizReview
            questions={questions}
            answers={answers}
            onConfirm={handleConfirmSubmit}
            onBack={handleBackToEdit}
          />
        )}

        {/* Quiz Engine */}
        {!isSubmitting && !result && !showReview && (
          <QuizEngine questions={questions} onFinish={handleFinish} />
        )}
      </div>

      <NavigationBar />

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <span className="text-4xl block text-center mb-3">😱</span>
            <h3 className={`text-lg font-bold text-gray-900 text-center mb-2`}>
              Yakin Keluar?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-1">
              Jawaban yang belum disubmit akan hilang.
            </p>
            <p className="text-xs text-gray-400 text-center mb-4">
              Progress quiz tidak akan tersimpan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowLeaveConfirm(false); setPendingNav(null); }}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                Lanjutkan Quiz
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Popup */}
      {levelUpInfo && (
        <LevelUpPopup
          newLevel={levelUpInfo.level}
          newBadge={levelUpInfo.badge}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </main>
  );
}
