"use client";
import { useRouter } from "next/navigation";
import { RotateCcw, Eye, Trophy, Coins } from "lucide-react";
import { Fredoka } from "next/font/google";
import { PASS_THRESHOLD } from "@/lib/quiz";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export interface QuizAttempt {
  materiId: number;
  materiTitle: string;
  date: string; // YYYY-MM-DD (untuk display)
  totalSoal: number;
  jawabanBenar: number;
  koinDidapat: number;
}

interface QuizHistoryProps {
  attempts: QuizAttempt[];
}

export default function QuizHistory({ attempts }: QuizHistoryProps) {
  const router = useRouter();

  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-8 text-center">
        <span className="text-5xl block mb-3">📭</span>
        <p className="text-gray-500 text-sm">Belum ada riwayat quiz.</p>
        <p className="text-xs text-gray-400 mt-1">Mulai belajar dan kerjakan quiz pertamamu!</p>
      </div>
    );
  }

  // Summary stats
  const totalAttempts = attempts.length;
  const totalCoins = attempts.reduce((sum, a) => sum + a.koinDidapat, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-4 flex items-center justify-around">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600">
            <Trophy className="w-4 h-4" />
            <span className={`text-lg font-bold ${funFont.className}`}>{totalAttempts}</span>
          </div>
          <p className="text-[10px] text-gray-400">Percobaan</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-600">
            <Coins className="w-4 h-4" />
            <span className={`text-lg font-bold ${funFont.className}`}>{totalCoins.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-gray-400">Total Koin</p>
        </div>
      </div>

      {/* Attempt List */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 overflow-hidden">
        {attempts.map((attempt, idx) => {
          const ratio = attempt.totalSoal > 0 ? attempt.jawabanBenar / attempt.totalSoal : 0;
          const isPassed = ratio >= PASS_THRESHOLD;
          const progressPercent = Math.round(ratio * 100);

          return (
            <div
              key={`${attempt.materiId}-${attempt.date}-${idx}`}
              className={`p-4 ${idx !== attempts.length - 1 ? "border-b border-blue-50" : ""}`}
            >
              {/* Date & Title */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] text-gray-400">{formatDate(attempt.date)}</p>
                  <h3 className={`text-sm font-bold text-gray-900 ${funFont.className}`}>
                    {attempt.materiTitle}
                  </h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {isPassed ? "✅ Lulus" : "❌ Belum"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isPassed ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Score & Coins */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">
                  {attempt.jawabanBenar}/{attempt.totalSoal} benar
                </span>
                {attempt.koinDidapat > 0 && (
                  <span className="text-xs text-yellow-600 font-semibold">
                    💰 +{attempt.koinDidapat}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => router.push(`/quiz/${attempt.materiId}`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Ulang
                </button>
                <button
                  onClick={() => router.push(`/learn/${attempt.materiId}`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  Lihat Materi
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
