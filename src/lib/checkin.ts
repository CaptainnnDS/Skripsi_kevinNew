import { supabase } from "./supabase";
import { addXp, AddXpResult } from "./xp";

export const STREAK_XP = [10, 15, 20, 25, 30, 40, 100]; // Day 1-7
export const TOTAL_WEEK_XP = STREAK_XP.reduce((a, b) => a + b, 0); // 240

export interface CheckinStatus {
  checkedInToday: boolean;
  currentStreakDay: number; // 1-7
  todayXp: number;
  weekXpEarned: number;
}

export interface CheckinResult {
  xpEarned: number;
  streakDay: number;
  xpResult: AddXpResult;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

/** Get current check-in status for user */
export async function getCheckinStatus(userId: string): Promise<CheckinStatus> {
  const today = getToday();
  const yesterday = getYesterday();

  // Check if already checked in today
  const { data: todayCheckin } = await supabase
    .from("daily_checkin")
    .select("streak_day, xp_earned")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .maybeSingle();

  if (todayCheckin) {
    // Calculate week XP earned so far
    const weekXp = await getWeekXpEarned(userId, todayCheckin.streak_day);
    return {
      checkedInToday: true,
      currentStreakDay: todayCheckin.streak_day,
      todayXp: todayCheckin.xp_earned,
      weekXpEarned: weekXp,
    };
  }

  // Check yesterday's streak to determine current day
  const { data: yesterdayCheckin } = await supabase
    .from("daily_checkin")
    .select("streak_day")
    .eq("user_id", userId)
    .eq("checkin_date", yesterday)
    .maybeSingle();

  let nextStreakDay = 1;
  if (yesterdayCheckin) {
    nextStreakDay = yesterdayCheckin.streak_day >= 7 ? 1 : yesterdayCheckin.streak_day + 1;
  }

  const weekXp = await getWeekXpEarned(userId, nextStreakDay - 1);

  return {
    checkedInToday: false,
    currentStreakDay: nextStreakDay,
    todayXp: STREAK_XP[nextStreakDay - 1],
    weekXpEarned: weekXp,
  };
}

/** Perform daily check-in */
export async function performCheckin(userId: string): Promise<CheckinResult> {
  const status = await getCheckinStatus(userId);

  if (status.checkedInToday) {
    throw new Error("Sudah check-in hari ini");
  }

  const streakDay = status.currentStreakDay;
  const xpEarned = STREAK_XP[streakDay - 1];

  // Insert check-in record
  const { error } = await supabase.from("daily_checkin").insert({
    user_id: userId,
    checkin_date: getToday(),
    streak_day: streakDay,
    xp_earned: xpEarned,
  });

  if (error) throw new Error(`Gagal check-in: ${error.message}`);

  // Add XP
  const xpResult = await addXp(userId, xpEarned);

  return { xpEarned, streakDay, xpResult };
}

/** Calculate total XP earned in current streak cycle */
async function getWeekXpEarned(userId: string, upToDay: number): Promise<number> {
  if (upToDay <= 0) return 0;

  // Sum XP from streak days 1 to upToDay
  let total = 0;
  for (let i = 0; i < upToDay; i++) {
    total += STREAK_XP[i];
  }
  return total;
}
