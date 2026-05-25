"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PetCharacter from "@/components/game/PetCharacter";

const EDIT_COST = 300;

const PET_COLORS = [
  { name: "Blue", value: "#60a5fa" },
  { name: "Purple", value: "#a78bfa" },
  { name: "Green", value: "#4ade80" },
  { name: "Yellow", value: "#facc15" },
  { name: "Red", value: "#f87171" },
  { name: "Pink", value: "#f472b6" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Orange", value: "#fb923c" },
];

interface PetSetupPopupProps {
  userId: string;
  mode: "setup" | "edit";
  currentName?: string;
  currentColor?: string;
  currentCoins?: number;
  onComplete: (name: string, color: string) => void;
  onClose?: () => void;
}

export default function PetSetupPopup({
  userId,
  mode,
  currentName = "",
  currentColor = "#60a5fa",
  currentCoins = 0,
  onComplete,
  onClose,
}: PetSetupPopupProps) {
  const [name, setName] = useState(currentName);
  const [color, setColor] = useState(currentColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canAfford = mode === "setup" || currentCoins >= EDIT_COST;
  const isValid = name.trim().length >= 2 && name.trim().length <= 15;

  async function handleSubmit() {
    if (!isValid || saving) return;
    if (mode === "edit" && !canAfford) {
      setError(`Koin tidak cukup! Butuh ${EDIT_COST} koin.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "setup") {
        // Create or update pet with name and color
        const { error: upsertError } = await supabase
          .from("pets")
          .upsert(
            { user_id: userId, name: name.trim(), body_color: color },
            { onConflict: "user_id" }
          );
        if (upsertError) throw upsertError;
      } else {
        // Edit: deduct coins + update name/color
        const { data: pet, error: fetchErr } = await supabase
          .from("pets")
          .select("coins")
          .eq("user_id", userId)
          .single();
        if (fetchErr) throw fetchErr;

        if ((pet?.coins || 0) < EDIT_COST) {
          setError(`Koin tidak cukup! Butuh ${EDIT_COST} koin.`);
          setSaving(false);
          return;
        }

        const { error: updateErr } = await supabase
          .from("pets")
          .update({
            name: name.trim(),
            body_color: color,
            coins: (pet?.coins || 0) - EDIT_COST,
          })
          .eq("user_id", userId);
        if (updateErr) throw updateErr;
      }

      onComplete(name.trim(), color);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={mode === "edit" ? onClose : undefined}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div />
          <h2 className="text-xl font-bold text-gray-800">
            {mode === "setup" ? "🎉 Selamat Datang!" : "✏️ Edit Pet"}
          </h2>
          {mode === "edit" ? (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          ) : <div />}
        </div>

        {mode === "setup" && (
          <p className="text-sm text-gray-500 mb-4">Yuk kenalan sama pet kamu</p>
        )}

        {mode === "edit" && (
          <p className="text-sm text-orange-600 font-medium mb-4">
            💰 Biaya: {EDIT_COST} koin (sisa: {currentCoins})
          </p>
        )}

        {/* Pet Preview */}
        <div className="w-32 h-32 mx-auto mb-4">
          <PetCharacter petData={{ body_color: color }} petMood="happy" />
        </div>

        {/* Name Input */}
        <div className="mb-4 text-left">
          <label className="text-sm font-bold text-gray-700 mb-1 block">Nama Pet</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama..."
            maxLength={15}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-gray-800 font-medium"
          />
          <p className="text-xs text-gray-400 mt-1">{name.length}/15 karakter (min. 2)</p>
        </div>

        {/* Color Picker */}
        <div className="mb-5 text-left">
          <label className="text-sm font-bold text-gray-700 mb-2 block">Pilih Warna</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {PET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${
                  color === c.value ? "border-gray-800 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || saving || (mode === "edit" && !canAfford)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving
            ? "Menyimpan..."
            : mode === "setup"
            ? "✨ Mulai Petualangan! ✨"
            : "💾 Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
