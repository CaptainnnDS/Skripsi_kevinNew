"use client";
import { CheckCircle2, AlertCircle, Send, ArrowLeft } from "lucide-react";
import type { Question } from "@/lib/quiz";


interface QuizReviewProps {
  questions: Question[];
  answers: Record<number, number>;
  onConfirm: () => void;
  onBack: () => void;
}

export default function QuizReview({ questions, answers, onConfirm, onBack }: QuizReviewProps) {
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 p-4 text-center">
        <span className="text-4xl block mb-2">📋</span>
        <h2 className="text-lg font-bold text-blue-900">
          Review Jawaban
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Periksa jawabanmu sebelum submit. Setelah submit tidak bisa diubah.
        </p>
        {unansweredCount > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
            <AlertCircle className="w-3 h-3" />
            {unansweredCount} soal belum dijawab
          </div>
        )}
      </div>

      {/* Answer List */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 overflow-hidden">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isAnswered = userAnswer !== undefined;

          return (
            <div
              key={q.id}
              className={`px-4 py-3 flex items-start gap-3 ${idx !== questions.length - 1 ? "border-b border-blue-50" : ""}`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isAnswered ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Soal {idx + 1}</p>
                <p className="text-sm text-gray-800 font-medium truncate">{q.question}</p>
                <p className={`text-xs mt-0.5 ${isAnswered ? "text-blue-600 font-semibold" : "text-red-500"}`}>
                  {isAnswered
                    ? `Jawaban: ${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}`
                    : "Belum dijawab (dianggap salah)"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-blue-200 bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali Edit
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
          Yakin, Submit!
        </button>
      </div>
    </div>
  );
}
