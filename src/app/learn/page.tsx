"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import { BookOpen, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { PASS_THRESHOLD } from "@/lib/quiz";
import LoadingScreen from "@/components/LoadingScreen";
import { Fredoka } from "next/font/google";
import { applyDecay, syncPetStats, canAccessLearning, ENERGY_THRESHOLD } from "@/lib/pet-stats";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });


interface Materi {
  id: number;
  title: string;
  description: string;
  is_locked: boolean;
  sort_order: number;
  pdf_url: string;
}

export default function Learn() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, boolean>>({});
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [energyBlocked, setEnergyBlocked] = useState(false);
  const [sleepBlocked, setSleepBlocked] = useState(false);

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
        const decayed = applyDecay(pets[0]);
        if (decayed._decayed) await syncPetStats(pets[0].id, decayed);
        setPetData(decayed);
        if (decayed.is_sleeping) {
          setSleepBlocked(true);
        } else if (!canAccessLearning(decayed)) {
          setEnergyBlocked(true);
        }
      } else {
        router.push("/");
        return;
      }

      // Fetch materi list
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select("*")
        .order("sort_order", { ascending: true });

      if (materiError) {
        console.log("Catatan: Ada masalah narik data materi", materiError.message);
      }

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from("user_materi_progress")
        .select("materi_id, quiz_passed")
        .eq("user_id", session.user.id)
        .eq("quiz_passed", true);

      const passedMap: Record<number, boolean> = {};
      if (!progressError && progressData) {
        progressData.forEach((p) => {
          passedMap[p.materi_id] = true;
        });
      } else if (progressError) {
        console.log("Catatan: Ada masalah narik data progress", progressError.message);
      }

      console.log(`[LearnPage] progressMap dari DB:`, passedMap);

      // Fallback: cek history percobaan terbaik untuk materi yang belum ada di progress table
      if (materiData && Object.keys(passedMap).length < materiData.length) {
        const { data: historyData } = await supabase
          .from("user_question_history")
          .select("materi_id, created_at, is_correct")
          .eq("user_id", session.user.id);

        if (historyData && historyData.length > 0) {
          const { data: questionCounts } = await supabase
            .from("quiz_questions")
            .select("materi_id");

          if (questionCounts) {
            const totalPerMateri: Record<number, number> = {};
            for (const q of questionCounts) {
              totalPerMateri[q.materi_id] = (totalPerMateri[q.materi_id] || 0) + 1;
            }

            // Group per materi + attempt (created_at)
            const attempts: Record<string, { correct: number; total: number; materiId: number }> = {};
            for (const h of historyData) {
              const key = `${h.materi_id}_${h.created_at}`;
              if (!attempts[key]) attempts[key] = { correct: 0, total: 0, materiId: h.materi_id };
              attempts[key].total++;
              if (h.is_correct) attempts[key].correct++;
            }

            // Cek tiap attempt, jika ≥70% tandai materi lulus
            for (const [key, attempt] of Object.entries(attempts)) {
              const total = totalPerMateri[attempt.materiId] || 0;
              const ratio = total > 0 ? attempt.correct / total : 0;
              console.log(`[LearnPage] fallback attempt key=${key} materiId=${attempt.materiId} correct=${attempt.correct}/${total} ratio=${ratio.toFixed(3)} threshold=${PASS_THRESHOLD}`);
              if (total > 0 && !passedMap[attempt.materiId] && ratio >= PASS_THRESHOLD) {
                console.log(`[LearnPage] fallback: materi ${attempt.materiId} passed via history`);
                passedMap[attempt.materiId] = true;
              }
            }
          }
        }
      }
      setProgressMap(passedMap);

      // Tentukan lock status per-user:
      // Modul pertama (sort_order=1) selalu terbuka.
      // Modul lain terbuka jika modul sebelumnya sudah lulus quiz.
      if (materiData) {
        const sorted = materiData.sort((a, b) => a.sort_order - b.sort_order);
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

  if (isAuthLoading || !petData) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-x-hidden">
      <TopBar pet={petData} />

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
        <div className="flex flex-col gap-3 overflow-x-clip">
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
              {/* Lock badge (subtle, di pojok) */}
              {materi.is_locked && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-full">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Numbered badge */}
                <div className="flex-shrink-0 bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">{materi.sort_order}</span>
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

                  {progressMap[materi.id] && (
                    <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      ✅ Selesai
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <NavigationBar />

      {/* Sleep Gate Overlay */}
      {sleepBlocked && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className={`bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${funFont.className}`}>
            <span className="text-6xl mb-4 block">💤</span>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Pet Lagi Tidur!</h2>
            <p className="text-gray-500 font-semibold mb-6">Bangunin pet dulu di Bedroom sebelum belajar.</p>
            <button onClick={() => router.push("/bedroom")} className="w-full py-3 rounded-xl bg-indigo-400 text-white font-extrabold hover:bg-indigo-500 transition-colors">🛏️ Ke Bedroom</button>
          </div>
        </div>
      )}

      {/* Energy Gate Overlay */}
      {energyBlocked && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className={`bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${funFont.className}`}>
            <span className="text-6xl mb-4 block">⚡</span>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Energy Terlalu Rendah!</h2>
            <p className="text-gray-500 font-semibold mb-2">Pet kamu butuh energy minimal {ENERGY_THRESHOLD}% untuk belajar.</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
              <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${petData?.energy || 0}%` }} />
            </div>
            <p className="text-sm text-gray-400 font-medium mb-6">Beri makan di Kitchen atau istirahatkan di Bedroom!</p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/kitchen")} className="flex-1 py-3 rounded-xl bg-orange-400 text-white font-extrabold hover:bg-orange-500 transition-colors">🍳 Kitchen</button>
              <button onClick={() => router.push("/bedroom")} className="flex-1 py-3 rounded-xl bg-indigo-400 text-white font-extrabold hover:bg-indigo-500 transition-colors">🛏️ Bedroom</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
