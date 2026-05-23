"use client";
import { ScrollText } from "lucide-react";
import { PASS_THRESHOLD } from "@/lib/quiz";


export interface MateriAttempt {
  date: string; // YYYY-MM-DD
  totalSoal: number;
  jawabanBenar: number;
  koinDidapat: number;
}

interface MateriQuizHistoryProps {
  attempts: MateriAttempt[];
}

export default function MateriQuizHistory({ attempts }: MateriQuizHistoryProps) {
  if (attempts.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  // Best score ratio
  const bestRatio = Math.max(...attempts.map((a) => (a.totalSoal > 0 ? a.jawabanBenar / a.totalSoal : 0)));

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <ScrollText className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-blue-900">
          Riwayat Percobaan
        </h3>
      </div>

      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 overflow-hidden">
        {attempts.map((attempt, idx) => {
          const ratio = attempt.totalSoal > 0 ? attempt.jawabanBenar / attempt.totalSoal : 0;
          const isPassed = ratio >= PASS_THRESHOLD;
          const progressPercent = Math.round(ratio * 100);
          const isBest = ratio === bestRatio && ratio > 0;

          return (
            <div
              key={`${attempt.date}-${idx}`}
              className={`px-4 py-3 ${idx !== attempts.length - 1 ? "border-b border-blue-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{formatDate(attempt.date)}</span>
                  {isBest && (
                    <span className="text-[10px] text-yellow-600 font-bold">🏆 Terbaik</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {isPassed ? "✅ Lulus" : "❌"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full ${isPassed ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">
                  {attempt.jawabanBenar}/{attempt.totalSoal} benar
                </span>
                {attempt.koinDidapat > 0 && (
                  <span className="text-[10px] text-yellow-600 font-semibold">
                    💰 +{attempt.koinDidapat}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
