import { supabase } from "./supabase";

export interface Question {
  id: number;
  materi_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

export interface QuizResultData {
  score: number;
  totalQuestions: number;
  rewardCoins: number;
  isPassed: boolean;
}

/**
 * Hitung koin incremental berdasarkan history jawaban user.
 * Soal yang PERTAMA KALI dijawab benar → +100 koin.
 * Soal yang sudah pernah benar sebelumnya → 0 koin.
 */
export async function calculateReward(params: {
  userId: string;
  materiId: number;
  questions: Question[];
  answers: Record<number, number>;
}): Promise<number> {
  const { userId, materiId, questions, answers } = params;
  let rewardCoins = 0;

  // Ambil semua question_id yang PERNAH dijawab benar oleh user di materi ini
  const { data: previousCorrect } = await supabase
    .from("user_question_history")
    .select("question_id")
    .eq("user_id", userId)
    .eq("materi_id", materiId)
    .eq("is_correct", true);

  const previouslyCorrectIds = new Set(
    previousCorrect?.map((row) => row.question_id) ?? []
  );

  // Hitung koin untuk setiap soal
  for (const question of questions) {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correct_answer;

    // Kalau benar DAN belum pernah benar sebelumnya → +100
    if (isCorrect && !previouslyCorrectIds.has(question.id)) {
      rewardCoins += 100;
    }
  }

  return rewardCoins;
}

/**
 * Submit quiz: simpan history, hitung koin, update progress & pet coins.
 */
export async function submitQuiz(params: {
  userId: string;
  materiId: number;
  questions: Question[];
  answers: Record<number, number>;
}): Promise<QuizResultData> {
  const { userId, materiId, questions, answers } = params;

  // 1. Hitung koin incremental
  const rewardCoins = await calculateReward(params);

  // 2. Hitung skor
  let score = 0;
  const historyRows: {
    user_id: string;
    question_id: number;
    materi_id: number;
    is_correct: boolean;
  }[] = [];

  for (const question of questions) {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correct_answer;
    if (isCorrect) score++;

    historyRows.push({
      user_id: userId,
      question_id: question.id,
      materi_id: materiId,
      is_correct: isCorrect,
    });
  }

  // 3. Simpan history jawaban (batch insert)
  await supabase.from("user_question_history").insert(historyRows);

  // 4. Cek apakah lulus (15/15)
  const isPassed = score === questions.length;

  // 5. Update progress kalau lulus
  if (isPassed) {
    // Upsert progress
    await supabase.from("user_materi_progress").upsert(
      {
        user_id: userId,
        materi_id: materiId,
        quiz_passed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,materi_id" }
    );

    // Unlock modul berikutnya
    const { data: currentMateri } = await supabase
      .from("materi")
      .select("order")
      .eq("id", materiId)
      .single();

    if (currentMateri) {
      // Cari modul dengan order berikutnya
      const { data: nextMateri } = await supabase
        .from("materi")
        .select("id")
        .eq("order", currentMateri.order + 1)
        .single();

      if (nextMateri) {
        await supabase
          .from("materi")
          .update({ is_locked: false })
          .eq("id", nextMateri.id);
      }
    }
  }

  // 6. Update koin di pets (tambah, bukan replace)
  if (rewardCoins > 0) {
    const { data: pet } = await supabase
      .from("pets")
      .select("coins")
      .eq("user_id", userId)
      .single();

    if (pet) {
      await supabase
        .from("pets")
        .update({ coins: (pet.coins || 0) + rewardCoins })
        .eq("user_id", userId);
    }
  }

  return {
    score,
    totalQuestions: questions.length,
    rewardCoins,
    isPassed,
  };
}
