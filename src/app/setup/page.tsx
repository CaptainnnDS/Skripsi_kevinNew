"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, [router]);

  const createPet = async () => {
    setLoading(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const petPayload = {
      user_id: session.user.id,
      coins: 100,
      hunger: 70,
      energy: 60,
      happiness: 50,
      cleanliness: 50,
      body_color: "#A7B3E6",
      equipped_bed: "BedNone",
      equipped_nightlight: "LightStandard",
      equipped_wallpaper: "none",
      is_sleeping: false,
    };

    const { error: insertError } = await supabase.from("pets").insert(petPayload);
    if (insertError) {
      setError("Gagal bikin pet: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-gray-900 p-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border-4 border-indigo-200 p-10 w-full max-w-md text-center">
        <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: "3s" }}>🐼</div>
        <h1 className={`text-4xl font-extrabold text-indigo-900 mb-3 ${funFont.className}`}>
          Selamat Datang!
        </h1>
        <p className="text-gray-500 mb-2 font-semibold">
          Kamu belum punya teman belajar nih.
        </p>
        <p className="text-gray-400 mb-8 text-sm">
          Tekan tombol di bawah buat ngadopsi Gibbey si Panda Coding!
        </p>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={createPet}
          disabled={loading}
          className={`w-full py-4 px-8 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-extrabold text-lg rounded-2xl shadow-lg transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
          } ${funFont.className}`}
        >
          {loading ? "Ngadopsi..." : "Adopsi Gibbey! 🐼"}
        </button>
      </div>
    </main>
  );
}
