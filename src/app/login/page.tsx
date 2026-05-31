"use client";
import { useState, useRef } from "react";
import { Eye, EyeOff, ArrowRight, Sparkles, BookOpen, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const authSectionRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = (loginState: boolean) => {
    setIsLogin(loginState);
    authSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        alert("Gagal daftar: " + error.message);
      } else {
        alert("Berhasil daftar! Silakan login.");
        setIsLogin(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Gagal login: " + error.message);
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  };

  const features = [
    { icon: BookOpen, color: "from-green-400 to-emerald-500", label: "Belajar Coding", desc: "Kuasai pemrograman lewat materi interaktif yang seru!" },
    { icon: Sparkles, color: "from-amber-400 to-orange-400", label: "Rawat Petmu", desc: "Jaga pet digitalmu tetap happy, sehat, dan berkembang." },
    { icon: Trophy, color: "from-purple-400 to-pink-400", label: "Naik Level", desc: "Kumpulkan XP, raih badge, dan panjat leaderboard!" },
  ];

  return (
    <main className="relative overflow-hidden">
      {/* Shared background */}
      <div className="fixed inset-0 z-0">
        <Image src="/bg/living room 2.png" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-green-950/55" />
      </div>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-6 md:px-12 w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-20">

          {/* Kiri — copy */}
          <div className="w-full lg:w-1/2 text-white">
            {/* Floating pet */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-6 select-none"
            >
              🐾
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 drop-shadow-lg">
              Selamat Datang di<br />
              <span className="text-green-300">Dunia Gibbey!</span>
            </h1>
            <p className="text-green-100 text-lg md:text-xl mb-10 max-w-md leading-relaxed">
              Belajar coding sambil merawat pet virtualmu. Setiap pelajaran yang kamu selesaikan bikin Gibbey makin bahagia! 🌿
            </p>

            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => scrollToAuth(true)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Masuk <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollToAuth(false)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold backdrop-blur-sm hover:scale-105 active:scale-95 transition-all"
              >
                Daftar Sekarang ✨
              </button>
            </div>
          </div>

          {/* Kanan — feature cards */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            {features.map(({ icon: Icon, color, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg shrink-0`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1">{label}</h3>
                  <p className="text-green-100 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── SECTION 2: FORM ── */}
      <section ref={authSectionRef} className="relative z-10 min-h-screen flex items-center justify-center pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/85 backdrop-blur-xl border border-green-200 rounded-3xl shadow-2xl p-8 md:p-10"
        >
          {/* Tab toggle */}
          <div className="flex bg-green-100 rounded-2xl p-1 mb-8">
            {["Masuk", "Daftar"].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isLogin === (i === 0)
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-green-500 hover:text-green-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{isLogin ? "👋" : "🌱"}</div>
            <h2 className="text-2xl font-bold text-green-900">
              {isLogin ? "Halo, selamat datang kembali!" : "Buat akun barumu!"}
            </h2>
            <p className="text-green-600 text-sm mt-1">
              {isLogin ? "Gibbey kangen kamu 🐾" : "Petualanganmu dimulai dari sini ✨"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <label className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-green-900 placeholder-green-300 transition-all"
                    placeholder="PetMaster123"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-green-900 placeholder-green-300 transition-all"
                placeholder="kamu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-green-900 placeholder-green-300 transition-all pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-lg transition-all ${
                loading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading
                ? "Sebentar ya... 🌀"
                : isLogin
                ? "Masuk ke Dunia Gibbey! 🚀"
                : "Buat Akun & Mulai Petualangan! 🌱"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-green-600">
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-700 font-bold hover:underline"
            >
              {isLogin ? "Daftar sekarang" : "Masuk di sini"}
            </button>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
