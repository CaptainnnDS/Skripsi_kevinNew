import { supabase } from "./supabase";

export const PASS_THRESHOLD = 0.7;

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
 * Cek apakah user lulus suatu materi berdasarkan nilai percobaan TERBAIK.
 * Mengelompokkan history per attempt (created_at), cek rasio tiap attempt.
 */
export async function checkMateriPassedFromHistory(userId: string, materiId: number): Promise<boolean> {
  console.log(`[checkMateriPassedFromHistory] userId=${userId}, materiId=${materiId}`);

  const { count: totalQuestions } = await supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("materi_id", materiId);

  console.log(`[checkMateriPassedFromHistory] totalQuestions=${totalQuestions}`);

  if (!totalQuestions || totalQuestions === 0) {
    console.log(`[checkMateriPassedFromHistory] return false: no questions`);
    return false;
  }

  const { data: history, error: historyError } = await supabase
    .from("user_question_history")
    .select("created_at, is_correct")
    .eq("user_id", userId)
    .eq("materi_id", materiId)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.log(`[checkMateriPassedFromHistory] history error: ${historyError.message}`);
  }

  console.log(`[checkMateriPassedFromHistory] history rows=${history?.length ?? 0}`);

  if (!history || history.length === 0) {
    console.log(`[checkMateriPassedFromHistory] return false: no history`);
    return false;
  }

  const attempts: Record<string, { correct: number; total: number }> = {};
  for (const row of history) {
    const key = String(row.created_at);
    if (!attempts[key]) attempts[key] = { correct: 0, total: 0 };
    attempts[key].total++;
    if (row.is_correct) attempts[key].correct++;
  }

  console.log(`[checkMateriPassedFromHistory] attempts count=${Object.keys(attempts).length}`, attempts);

  for (const [ts, attempt] of Object.entries(attempts)) {
    const ratio = attempt.correct / attempt.total;
    const totalQuest = totalQuestions ?? attempt.total;
    console.log(`[checkMateriPassedFromHistory] attempt ts=${ts} correct=${attempt.correct}/${totalQuest} ratio=${ratio.toFixed(3)} threshold=${PASS_THRESHOLD}`);
    if (attempt.correct / totalQuest >= PASS_THRESHOLD) {
      console.log(`[checkMateriPassedFromHistory] return true: passed`);
      return true;
    }
  }

  console.log(`[checkMateriPassedFromHistory] return false: no attempt passed`);
  return false;
}

/**
 * Cek apakah user punya akses ke materi tertentu.
 * Logika: materi dengan order=1 selalu terbuka.
 * Materi lain terbuka jika user sudah lulus quiz modul sebelumnya.
 */
export async function checkMateriAccess(userId: string, materiId: number): Promise<boolean> {
  console.log(`[checkMateriAccess] userId=${userId}, materiId=${materiId}`);

  // Ambil data materi
  const { data: materi, error } = await supabase
    .from("materi")
    .select("sort_order")
    .eq("id", materiId)
    .maybeSingle();

  if (error || !materi) {
    console.log(`[checkMateriAccess] return false: materi not found, error=${error?.message}`);
    return false;
  }

  console.log(`[checkMateriAccess] materi sort_order=${materi.sort_order}`);

  // Modul pertama selalu terbuka
  if (materi.sort_order === 1) {
    console.log(`[checkMateriAccess] return true: sort_order=1`);
    return true;
  }

  // Cek apakah modul sebelumnya sudah lulus
  const { data: prevMateri, error: prevError } = await supabase
    .from("materi")
    .select("id")
    .eq("sort_order", materi.sort_order - 1)
    .maybeSingle();

  if (prevError) {
    console.log(`[checkMateriAccess] return false: prevError=${prevError.message}`);
    return false;
  }

  if (!prevMateri) {
    console.log(`[checkMateriAccess] return true: no prev materi`);
    return true;
  }

  console.log(`[checkMateriAccess] prevMateri id=${prevMateri.id}`);

  // Cek via progress table (fast path)
  const { data: progress, error: progressError } = await supabase
    .from("user_materi_progress")
    .select("quiz_passed")
    .eq("user_id", userId)
    .eq("materi_id", prevMateri.id)
    .eq("quiz_passed", true)
    .maybeSingle();

  if (progressError) {
    console.log(`[checkMateriAccess] progress error: ${progressError.message}`);
  }

  if (!progressError && progress) {
    console.log(`[checkMateriAccess] return true: progress found`);
    return true;
  }

  console.log(`[checkMateriAccess] progress not found, falling back to history`);

  // Fallback: cek akumulasi history dari semua percobaan
  return checkMateriPassedFromHistory(userId, prevMateri.id);
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

  // 4. Cek lulus berdasarkan akumulasi history (semua percobaan, bukan cuma yang sekarang)
  const isPassed = await checkMateriPassedFromHistory(userId, materiId);

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
