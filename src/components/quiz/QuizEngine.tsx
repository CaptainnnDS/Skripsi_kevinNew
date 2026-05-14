"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Fredoka } from "next/font/google";
import type { Question } from "@/lib/quiz";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

interface QuizEngineProps {
  questions: Question[];
  onSubmit: (answers: Record<number, number>) => void;
}

export default function QuizEngine({ questions, onSubmit }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  };

  const handleFinish = () => {
    if (unansweredCount > 0) {
      setShowConfirm(true);
    } else {
      onSubmit(answers);
    }
  };

  // Keyboard shortcuts: 1-4 untuk pilih jawaban, ArrowLeft/Right untuk navigasi
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Jangan handle kalau modal konfirmasi terbuka
    if (showConfirm) return;

    const num = parseInt(e.key);
    if (num >= 1 && num <= currentQuestion.options.length) {
      selectOption(num - 1);
    }

    if (e.key === "ArrowLeft" && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    if (e.key === "ArrowRight" && currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions, currentQuestion, showConfirm]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const confirmSubmit = () => {
    setShowConfirm(false);
    onSubmit(answers);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Stepper */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-3">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isActive = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-all duration-200
                  ${isActive
                    ? "bg-blue-600 text-white scale-110 shadow-md"
                    : isAnswered
                      ? "bg-green-400 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          {answeredCount}/{totalQuestions} dijawab
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-5">
        <p className="text-xs text-blue-600 font-semibold mb-2">
          Soal {currentIndex + 1} dari {totalQuestions}
        </p>
        <h2 className={`text-base font-bold text-gray-900 mb-4 ${funFont.className}`}>
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = answers[currentQuestion.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 text-sm
                  ${isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50/50"
                  }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs font-bold
                  ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border-2 border-blue-100 text-blue-600 font-semibold text-sm hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <div className="flex flex-col items-end gap-1">
            {unansweredCount > 0 && (
              <span className="text-[10px] text-red-500 font-semibold">
                ⚠️ {unansweredCount} soal belum dijawab
              </span>
            )}
            <button
              onClick={handleFinish}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesaikan
            </button>
          </div>
        ) : (
          <button
            onClick={goToNext}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border-2 border-blue-100 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            Selanjutnya
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className={`text-lg font-bold text-gray-900 ${funFont.className}`}>
                Yakin submit?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Masih ada <span className="font-bold text-red-600">{unansweredCount} soal</span> yang
              belum dijawab. Soal yang belum dijawab akan dianggap salah.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
