"use client";
import { useState } from "react";
import { Trophy, RotateCcw, ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { Fredoka } from "next/font/google";
import type { Question } from "@/lib/quiz";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

interface QuizResultProps {
  score: number;
  totalQuestions: number;
  rewardCoins: number;
  isPassed: boolean;
  questions: Question[];
  answers: Record<number, number>;
  onRetry: () => void;
  onBackToLearn: () => void;
}

export default function QuizResult({
  score,
  totalQuestions,
  rewardCoins,
  isPassed,
  questions,
  answers,
  onRetry,
  onBackToLearn,
}: QuizResultProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Result Card */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-6 text-center">
        {/* Emoji & Status */}
        <div className="mb-4">
          {isPassed ? (
            <span className="text-6xl block animate-bounce">🎉</span>
          ) : (
            <span className="text-6xl block">💪</span>
          )}
        </div>

        <h2 className={`text-2xl font-bold mb-1 ${funFont.className} ${isPassed ? "text-green-600" : "text-blue-900"}`}>
          {isPassed ? "Selamat! Lulus!" : "Belum Lulus"}
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          {isPassed
            ? "Modul berikutnya sudah terbuka! 🎉"
            : "Yuk coba lagi, kamu pasti bisa! 🔥"}
        </p>

        {/* Score */}
        <div className="inline-flex items-center gap-2 bg-blue-50 px-5 py-3 rounded-2xl mb-4">
          <Trophy className="w-5 h-5 text-blue-600" />
          <span className={`text-3xl font-bold text-blue-900 ${funFont.className}`}>
            {score}
          </span>
          <span className="text-lg text-gray-400">/ {totalQuestions}</span>
        </div>

        {/* Coins earned */}
        {rewardCoins > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl px-4 py-2 inline-flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className={`text-lg font-bold text-yellow-700 ${funFont.className}`}>
              +{rewardCoins} Koin
            </span>
          </div>
        )}

        {rewardCoins === 0 && score > 0 && (
          <p className="text-xs text-gray-400">
            Tidak ada koin baru — soal yang benar sudah pernah dijawab benar sebelumnya
          </p>
        )}

        {rewardCoins === 0 && score === 0 && (
          <p className="text-xs text-gray-400">
            Belum ada jawaban yang benar, coba lagi ya!
          </p>
        )}
      </div>

      {/* Detail Toggle */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center justify-center gap-1 text-sm text-blue-600 font-semibold hover:text-blue-800 transition-colors"
      >
        {showDetail ? "Sembunyikan Detail" : "Lihat Detail Jawaban"}
        {showDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Detail Answers */}
      {showDetail && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-4 flex flex-col gap-3">
          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border-2 ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      {idx + 1}. {q.question}
                    </p>
                    {!isCorrect && (
                      <>
                        <p className="text-xs text-red-600">
                          Jawaban kamu: {userAnswer !== undefined ? q.options[userAnswer] : "(tidak dijawab)"}
                        </p>
                        <p className="text-xs text-green-700 font-semibold">
                          Jawaban benar: {q.options[q.correct_answer]}
                        </p>
                      </>
                    )}
                    {isCorrect && (
                      <p className="text-xs text-green-700">
                        ✓ {q.options[q.correct_answer]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-blue-200 bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Coba Lagi
        </button>
        <button
          onClick={onBackToLearn}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>
    </div>
  );
}
