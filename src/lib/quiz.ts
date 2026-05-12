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
 * Cek apakah user punya akses ke materi tertentu.
 * Logika: materi dengan order=1 selalu terbuka.
 * Materi lain terbuka jika user sudah lulus quiz modul sebelumnya.
 */
export async function checkMateriAccess(userId: string, materiId: number): Promise<boolean> {
  // Ambil data materi
  const { data: materi, error } = await supabase
    .from("materi")
    .select("order")
    .eq("id", materiId)
    .single();

  if (error || !materi) return false;

  // Modul pertama selalu terbuka
  if (materi.order === 1) return true;

  // Cek apakah modul sebelumnya sudah lulus
  const { data: prevMateri } = await supabase
    .from("materi")
    .select("id")
    .eq("order", materi.order - 1)
    .single();

  if (!prevMateri) return true; // Tidak ada modul sebelumnya, berarti terbuka

  const { data: progress } = await supabase
    .from("user_materi_progress")
    .select("quiz_passed")
    .eq("user_id", userId)
    .eq("materi_id", prevMateri.id)
    .eq("quiz_passed", true)
    .single();

  return !!progress;
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
  const { data: previousCorrect, error } = await supabase
    .from("user_question_history")
    .select("question_id")
    .eq("user_id", userId)
    .eq("materi_id", materiId)
    .eq("is_correct", true);

  if (error) {
    throw new Error(`Gagal mengambil history: ${error.message}`);
  }

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
 * Semua operasi dicek error-nya. Jika gagal, throw error agar tidak ada state inkonsisten.
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

  // 2. Hitung skor & siapkan history rows
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

  // 3. Simpan history jawaban (batch insert) — WAJIB berhasil
  const { error: historyError } = await supabase
    .from("user_question_history")
    .insert(historyRows);

  if (historyError) {
    throw new Error(`Gagal menyimpan history jawaban: ${historyError.message}`);
  }

  // 4. Cek apakah lulus (semua benar)
  const isPassed = score === questions.length;

  // 5. Update progress kalau lulus
  if (isPassed) {
    const { error: progressError } = await supabase
      .from("user_materi_progress")
      .upsert(
        {
          user_id: userId,
          materi_id: materiId,
          quiz_passed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,materi_id" }
      );

    if (progressError) {
      throw new Error(`Gagal update progress: ${progressError.message}`);
    }
  }

  // 6. Update koin di pets (tambah, bukan replace)
  if (rewardCoins > 0) {
    const { data: pet, error: petFetchError } = await supabase
      .from("pets")
      .select("coins")
      .eq("user_id", userId)
      .single();

    if (petFetchError) {
      throw new Error(`Gagal mengambil data pet: ${petFetchError.message}`);
    }

    if (pet) {
      const { error: petUpdateError } = await supabase
        .from("pets")
        .update({ coins: (pet.coins || 0) + rewardCoins })
        .eq("user_id", userId);

      if (petUpdateError) {
        throw new Error(`Gagal update koin: ${petUpdateError.message}`);
      }
    }
  }

  return {
    score,
    totalQuestions: questions.length,
    rewardCoins,
    isPassed,
  };
}
