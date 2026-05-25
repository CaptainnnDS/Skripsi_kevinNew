import { supabase } from "./supabase";

// === CONSTANTS ===
export const DECAY_RATE = 15; // % per jam
export const SLEEP_ENERGY_GAIN = 20; // % per jam saat tidur
export const ENERGY_THRESHOLD = 20; // % minimum untuk akses learn/quiz

// === TYPES ===
export type PetMood = "happy" | "neutral" | "sad";

// === FUNCTIONS ===

/**
 * Hitung stat pet setelah decay berdasarkan elapsed time.
 * Return object baru (immutable).
 */
export function applyDecay(pet: any): any {
  const lastUpdate = pet.last_stat_update ? new Date(pet.last_stat_update) : new Date();
  if (isNaN(lastUpdate.getTime())) return { ...pet, _decayed: false }; // Guard: invalid date

  const now = new Date();
  const hoursElapsed = Math.max(0, (now.getTime() - lastUpdate.getTime()) / 3600000);

  if (hoursElapsed < 0.01) return { ...pet, _decayed: false }; // Skip jika < 36 detik

  const decay = DECAY_RATE * hoursElapsed;

  let energy: number;
  if (pet.is_sleeping) {
    // Tidur: energy NAIK, stat lain tetap turun
    energy = Math.min(100, Math.max(0, (pet.energy || 0) + (SLEEP_ENERGY_GAIN * hoursElapsed)));
  } else {
    energy = Math.max(0, (pet.energy || 0) - decay);
  }

  return {
    ...pet,
    hunger: Math.max(0, Math.round((pet.hunger || 0) - decay)),
    happiness: Math.max(0, Math.round((pet.happiness || 0) - decay)),
    energy: Math.round(energy),
    cleanliness: Math.max(0, Math.round((pet.cleanliness || 0) - decay)),
    last_stat_update: now.toISOString(),
    _decayed: true,
  };
}

/**
 * Hitung mood pet berdasarkan rata-rata stat.
 */
export function getPetMood(pet: any): PetMood {
  const avg = ((pet.hunger || 0) + (pet.happiness || 0) + (pet.energy || 0) + (pet.cleanliness || 0)) / 4;
  if (avg >= 70) return "happy";
  if (avg >= 40) return "neutral";
  return "sad";
}

/**
 * Cek apakah pet punya cukup energy untuk akses learning.
 */
export function canAccessLearning(pet: any): boolean {
  return (pet.energy || 0) >= ENERGY_THRESHOLD;
}

/**
 * Sync stat pet yang sudah di-decay ke database.
 * Return true jika berhasil, false jika gagal.
 */
export async function syncPetStats(petId: string, decayedPet: any): Promise<boolean> {
  try {
    const { error } = await supabase.from("pets").update({
      hunger: decayedPet.hunger,
      happiness: decayedPet.happiness,
      energy: decayedPet.energy,
      cleanliness: decayedPet.cleanliness,
      last_stat_update: decayedPet.last_stat_update,
    }).eq("id", petId);

    if (error) {
      console.error("[syncPetStats] Failed:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("[syncPetStats] Exception:", err.message);
    return false;
  }
}
