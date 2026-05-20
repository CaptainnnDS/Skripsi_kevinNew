"use client";
import { Store, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NavigationBar() {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t-2 border-blue-100 p-2 flex justify-center items-center gap-6 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 pb-safe">
      
      {/* Tombol LEADERBOARD */}
      <button 
        onClick={() => router.push("/leaderboard")}
        className="flex flex-col items-center group"
      >
        <div className="bg-gradient-to-tr from-yellow-500 to-amber-500 p-3 rounded-xl text-white shadow-[0_4px_10px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
          <Trophy size={24} />
        </div>
        <span className="text-[11px] font-extrabold text-amber-600 mt-1 tracking-wide">RANKING</span>
      </button>

      {/* Tombol SHOP */}
      <button 
        onClick={() => router.push("/shop")}
        className="flex flex-col items-center group"
      >
        <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-3 rounded-xl text-white shadow-[0_4px_10px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
          <Store size={24} />
        </div>
        <span className="text-[11px] font-extrabold text-purple-600 mt-1 tracking-wide">SHOP</span>
      </button>

    </div>
  );
}