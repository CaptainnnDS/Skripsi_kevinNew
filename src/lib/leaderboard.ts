import { supabase, safeFetch } from "./supabase";
import { calculateLevelFromXp } from "./xp";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  petName: string;
  totalCoinsEarned: number;
  currentCoins: number;
  bodyColor: string;
  equippedBed: string | null;
  equippedNightlight: string | null;
  equippedWallpaper: string | null;
  level: number;
}

export interface LeaderboardData {
  top10: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  totalPlayers: number;
}

/**
 * Ambil data leaderboard: top 10 + posisi user sendiri
 */
export async function getLeaderboard(userId: string): Promise<LeaderboardData> {
  const { data: pets, error } = await safeFetch(
    supabase
      .from("pets")
      .select("user_id, name, total_coins_earned, coins, body_color, equipped_bed, equipped_nightlight, equipped_wallpaper")
      .order("total_coins_earned", { ascending: false })
  );

  if (error) {
    throw new Error(`Gagal memuat papan peringkat: ${error.message}`);
  }

  if (!pets || pets.length === 0) {
    return { top10: [], userEntry: null, totalPlayers: 0 };
  }

  // Fetch XP data for all users (untuk level badge)
  const userIds = pets.map((p: any) => p.user_id);
  const { data: xpData } = await safeFetch(
    supabase
      .from("user_xp")
      .select("user_id, total_xp, current_level")
      .in("user_id", userIds)
  );

  const xpMap = new Map<string, number>();
  if (xpData) {
    for (const row of xpData) {
      xpMap.set(row.user_id, row.current_level || 1);
    }
  }

  const entries: LeaderboardEntry[] = pets.map((pet: any, index: number) => ({
    rank: index + 1,
    userId: pet.user_id,
    petName: pet.name || "Gibbey",
    totalCoinsEarned: pet.total_coins_earned || 0,
    currentCoins: pet.coins || 0,
    bodyColor: pet.body_color || "#60a5fa",
    equippedBed: pet.equipped_bed,
    equippedNightlight: pet.equipped_nightlight,
    equippedWallpaper: pet.equipped_wallpaper,
    level: xpMap.get(pet.user_id) || 1,
  }));

  const top10 = entries.slice(0, 10);
  const userEntry = entries.find((e) => e.userId === userId) || null;

  return {
    top10,
    userEntry,
    totalPlayers: entries.length,
  };
}

/**
 * Kirim poke ke user lain dengan cooldown 5 menit
 */
export async function sendPoke(
  fromUserId: string,
  toUserId: string,
  fromName: string
): Promise<{ success: boolean; message: string }> {
  // Cek cooldown: apakah sudah poke user ini dalam 5 menit terakhir?
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: recentPoke, error: cooldownError } = await safeFetch(
    supabase
      .from("notifications")
      .select("created_at")
      .eq("from_user_id", fromUserId)
      .eq("user_id", toUserId)
      .eq("type", "poke")
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
  );

  if (cooldownError) {
    throw new Error(`Gagal mengecek cooldown: ${cooldownError.message}`);
  }

  if (recentPoke && recentPoke.length > 0) {
    return { success: false, message: "Tunggu 5 menit sebelum colek lagi" };
  }

  // Kirim notifikasi poke
  const { error: insertError } = await safeFetch(
    supabase.from("notifications").insert({
      user_id: toUserId,
      from_user_id: fromUserId,
      type: "poke",
      message: `👆 ${fromName} menyapa Gibbey-mu!`,
    })
  );

  if (insertError) {
    throw new Error(`Gagal mengirim poke: ${insertError.message}`);
  }

  return { success: true, message: "Berhasil mencolek!" };
}

/**
 * Ambil jumlah notifikasi yang belum dibaca
 * Mengembalikan 0 jika tabel belum ada atau error lainnya
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    // Jika error (termasuk tabel belum ada), return 0 tanpa spam console
    if (error) {
      // Hanya log jika bukan error "relation does not exist" (tabel belum dibuat)
      if (!error.message?.includes("does not exist")) {
        console.error("Error fetching unread count:", error.message);
      }
      return 0;
    }

    return count || 0;
  } catch {
    // Catch any unexpected errors
    return 0;
  }
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  from_user_id: string;
}

/**
 * Ambil daftar notifikasi user
 * Mengembalikan array kosong jika tabel belum ada
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await safeFetch(
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
    );

    if (error) {
      // Jika tabel belum ada, return array kosong
      if (error.message?.includes("does not exist")) {
        return [];
      }
      throw new Error(`Gagal memuat notifikasi: ${error.message}`);
    }

    return data || [];
  } catch (err: any) {
    // Jika error karena tabel belum ada, return array kosong
    if (err.message?.includes("does not exist")) {
      return [];
    }
    throw err;
  }
}

/**
 * Tandai semua notifikasi sebagai sudah dibaca
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await safeFetch(
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
  );

  if (error) {
    throw new Error(`Gagal menandai notifikasi: ${error.message}`);
  }
}
