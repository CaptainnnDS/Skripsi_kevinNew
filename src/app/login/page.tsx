"use client";
import { useState, useRef } from "react";
import { Eye, EyeOff, ArrowRight, Code2, Gamepad2, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // <-- IMPORT JEMBATAN SUPABASE

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // <-- Nambah state Username
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const authSectionRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = (loginState: boolean) => {
    setIsLogin(loginState);
    authSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // MESIN UTAMA BUAT LOGIN & REGISTER KE SUPABASE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin) {
      // 1. PROSES REGISTER (SIGN UP)
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username, // Simpen username ke database
          }
        }
      });

      if (error) {
        alert("Gagal daftar: " + error.message);
      } else {
        alert("Berhasil daftar! Silakan cek email lo (kalau butuh verifikasi) atau langsung login.");
        setIsLogin(true); // Pindah otomatis ke tab login
      }
    } else {
      // 2. PROSES LOGIN (SIGN IN)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        alert("Gagal login: " + error.message);
      } else {
        alert("Login Sukses! Welcome back, Bray!");
        router.push("/"); // Lempar ke halaman Home si Gibbey
      }
    }
    
    setLoading(false);
  };

  return (
    <main className="bg-[#0b1120] text-slate-300 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>

      {/* SECTION 1: HERO & ABOUT */}
      <section className="min-h-screen flex items-center relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0 py-20">
          
          {/* KIRI */}
          <div className="w-full lg:w-1/2">
            <p className="text-gray-400 mb-4 tracking-wider">Hello, I'm Gibbey</p>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              <span className="text-[#c084fc]">const</span>{" "}
              <span className="text-[#67e8f9]">=</span> <br />
              <span className="text-white">User</span>{" "}
              <span className="text-[#c084fc]">;</span>
            </h1>
            <p className="text-[#a78bfa] text-xl md:text-2xl mb-6 font-semibold">
              // Lets learning together and take care your pet!
            </p>
            <p className="text-[#94a3b8] mb-10 max-w-md leading-relaxed font-sans text-lg">
              Level up your coding skills, complete quests, and evolve your digital companion in an interactive learning environment.
            </p>

            <div className="flex gap-4">
              <button onClick={() => scrollToAuth(true)} className="flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-[#c084fc] to-[#67e8f9] text-white font-bold hover:scale-105 transition-transform">
                Login <ArrowRight size={18} />
              </button>
              <button onClick={() => scrollToAuth(false)} className="flex items-center gap-2 px-8 py-3 rounded-lg border-2 border-[#a78bfa] text-[#a78bfa] font-bold hover:bg-[#a78bfa]/10 transition-colors">
                Signup {"</>"}
              </button>
            </div>
          </div>

          {/* KANAN */}
          <div className="w-full lg:w-1/2 flex justify-center relative py-12 lg:py-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[450px] md:h-[450px] rounded-full border border-[#c084fc]/30 shadow-[0_0_80px_rgba(192,132,252,0.15)] pointer-events-none" />
            <div className="relative z-10 w-full max-w-md bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl font-sans">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gamepad2 className="text-[#67e8f9]" /> About Gibbey
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-[#0f172a] rounded-lg border border-slate-700 text-[#c084fc]">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Interactive Coding</h3>
                    <p className="text-slate-400 text-sm mt-1">Belajar sintaks dan logika pemrograman langsung dengan studi kasus.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-[#0f172a] rounded-lg border border-slate-700 text-[#67e8f9]">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">AI Companion</h3>
                    <p className="text-slate-400 text-sm mt-1">Sistem tutor cerdas (ITS) yang siap bantu ngebimbing pas lo stuck.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: FORM LOGIN/REGISTER */}
      <section ref={authSectionRef} className="min-h-[80vh] flex items-center justify-center relative z-10 pb-20">
        <div className="w-full max-w-md bg-[#1e293b]/80 backdrop-blur-xl border border-[#c084fc]/20 p-8 md:p-10 rounded-2xl shadow-[0_0_50px_rgba(192,132,252,0.1)] font-sans mx-6">
          
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {isLogin ? "System Login" : "Initialize Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-[#a78bfa] uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0f172a] border border-slate-700 rounded-xl focus:outline-none focus:border-[#67e8f9] text-white placeholder-slate-500 transition-colors"
                  placeholder="PlayerOne"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#a78bfa] uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#0f172a] border border-slate-700 rounded-xl focus:outline-none focus:border-[#67e8f9] text-white placeholder-slate-500 transition-colors"
                placeholder="admin@gibbey.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#a78bfa] uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0f172a] border border-slate-700 rounded-xl focus:outline-none focus:border-[#67e8f9] text-white placeholder-slate-500 transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#67e8f9]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-6 bg-gradient-to-r from-[#c084fc] to-[#a78bfa] hover:from-[#a78bfa] hover:to-[#c084fc] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(192,132,252,0.3)] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              {loading ? "Processing..." : (isLogin ? "Execute Login();" : "Run Register();")}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            {isLogin ? "Need an instance? " : "Already initialized? "}
            <button 
              onClick={() => scrollToAuth(!isLogin)}
              className="text-[#67e8f9] hover:underline font-bold"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </section>

    </main>
  );
}