"use client";
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NavigationBar() {
  const router = useRouter();

  return (
    // justify-end bakal otomatis ngedorong isi kontennya ke paling kanan
    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t-2 border-blue-100 p-2 flex justify-end items-center z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 pb-safe">
      
      {/* Area kosong di sini nanti bisa lo isi fitur lain (Quest, Leaderboard, dll) */}

      {/* Tombol SHOP - Paling Kanan */}
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