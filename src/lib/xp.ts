import { supabase } from "./supabase";

// === Constants ===

export const XP_PER_LEVEL_MULTIPLIER = 35;

export interface BadgeTier {
  name: string;
  minLevel: number;
  maxLevel: number;
  icon: string;
  color: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  { name: "Bronze", minLevel: 1, maxLevel: 7, icon: "🥉", color: "#CD7F32" },
  { name: "Silver", minLevel: 8, maxLevel: 18, icon: "🥈", color: "#C0C0C0" },
  { name: "Gold", minLevel: 19, maxLevel: 30, icon: "🥇", color: "#FFD700" },
  { name: "Platinum", minLevel: 31, maxLevel: 42, icon: "💎", color: "#E5E4E2" },
  { name: "Diamond", minLevel: 43, maxLevel: 54, icon: "💠", color: "#B9F2FF" },
  { name: "Master", minLevel: 55, maxLevel: Infinity, icon: "👑", color: "#9B59B6" },
];

export const QUIZ_XP_TIERS = [
  { minPercent: 90, xp: 120 },
  { minPercent: 70, xp: 70 },
  { minPercent: 0, xp: 30 },
];

// === Pure Functions ===

/** Total XP needed to reach a given level */
export function calculateTotalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return ((level - 1) * level / 2) * XP_PER_LEVEL_MULTIPLIER;
}

/** Calculate level from total XP */
export function calculateLevelFromXp(totalXp: number): number {
  // Solve: (level-1)*level/2 * 35 <= totalXp
  // level^2 - level - (2*totalXp/35) <= 0
  const discriminant = 1 + (8 * totalXp) / XP_PER_LEVEL_MULTIPLIER;
  return Math.floor((1 + Math.sqrt(discriminant)) / 2);
}

/** Get badge tier from level */
export function getBadgeFromLevel(level: number): BadgeTier {
  return BADGE_TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel) || BADGE_TIERS[0];
}

/** Get XP progress towards next level */
export interface XpProgress {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  requiredXp: number;
  xpInCurrentLevel: number;
  percentage: number;
}

export function getXpProgress(totalXp: number): XpProgress {
  const currentLevel = calculateLevelFromXp(totalXp);
  const currentLevelXp = calculateTotalXpForLevel(currentLevel);
  const nextLevelXp = calculateTotalXpForLevel(currentLevel + 1);
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const requiredXp = nextLevelXp - currentLevelXp;
  return {
    currentLevel,
    currentLevelXp: xpInCurrentLevel,
    nextLevelXp,
    requiredXp,
    xpInCurrentLevel,
    percentage: Math.min((xpInCurrentLevel / requiredXp) * 100, 100),
  };
}

/** Get XP reward for quiz based on score percentage */
export function getQuizXpReward(percentage: number): number {
  for (const tier of QUIZ_XP_TIERS) {
    if (percentage >= tier.minPercent) return tier.xp;
  }
  return 30;
}

// === Database Functions ===

export interface UserXpData {
  totalXp: number;
  currentLevel: number;
}

export type UserXp = UserXpData;

/** Get user's XP data, create if not exists */
export async function getUserXp(userId: string): Promise<UserXpData> {
  const { data, error } = await supabase
    .from("user_xp")
    .select("total_xp, current_level")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Gagal mengambil XP: ${error.message}`);

  if (!data) {
    // Create initial record
    const { error: insertError } = await supabase
      .from("user_xp")
      .insert({ user_id: userId, total_xp: 0, current_level: 1 });
    if (insertError && !insertError.message.includes("duplicate"))
      throw new Error(`Gagal membuat XP record: ${insertError.message}`);
    return { totalXp: 0, currentLevel: 1 };
  }

  return { totalXp: data.total_xp, currentLevel: data.current_level };
}

export interface AddXpResult {
  newTotalXp: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
  previousBadge: BadgeTier;
  newBadge: BadgeTier;
  rankedUp: boolean;
}

/** Add XP to user and check for level/rank up */
export async function addXp(userId: string, amount: number): Promise<AddXpResult> {
  const current = await getUserXp(userId);
  const previousLevel = current.currentLevel;
  const previousBadge = getBadgeFromLevel(previousLevel);

  const newTotalXp = current.totalXp + amount;
  const newLevel = calculateLevelFromXp(newTotalXp);
  const newBadge = getBadgeFromLevel(newLevel);

  const { error } = await supabase
    .from("user_xp")
    .upsert(
      { user_id: userId, total_xp: newTotalXp, current_level: newLevel, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Gagal update XP: ${error.message}`);

  return {
    newTotalXp,
    newLevel,
    previousLevel,
    leveledUp: newLevel > previousLevel,
    previousBadge,
    newBadge,
    rankedUp: newBadge.name !== previousBadge.name,
  };
}
