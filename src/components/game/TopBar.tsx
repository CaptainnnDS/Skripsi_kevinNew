"use client";
import { User, Utensils, Zap, Heart, Droplets, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TopBar({ pet }: { pet: any }) {
  const currentPet = pet || { coins: 0, hunger: 0, energy: 0, happiness: 0, cleanliness: 0 };
  
  // State buat ngatur Dropdown dan nyimpen Email
  const [showDropdown, setShowDropdown] = useState(false);
  const [userEmail, setUserEmail] = useState("Loading...");
  const router = useRouter();

  // Efek buat narik email user langsung dari Supabase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "User");
        }
      } catch {
        setUserEmail("User");
      }
    };
    fetchUser();
  }, []);

  // Fungsi buat ngehancurin sesi (Log Out) dan nendang balik ke halaman Login
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Tetap redirect meskipun signOut gagal
    }
    router.push("/login");
  };

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm border-b border-blue-100">
      
      {/* KIRI: Foto Profil & Koin */}
      <div className="flex items-center gap-4">
        
        {/* Wrapper Profil + Dropdown (Pake relative biar dropdownnya nempel di bawah tombol) */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-blue-500 hover:bg-blue-600 transition-colors p-2.5 rounded-full text-white shadow-sm border-2 border-blue-300"
          >
            <User size={24} />
          </button>

          {/* Kotak Dropdown */}
          {showDropdown && (
            <div className="absolute top-14 left-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in duration-200">
              
              {/* Bagian Atas Dropdown (Info Akun) */}
              <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
                <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-blue-950 truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
              
              {/* Tombol Log Out */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={16} />
                Log Out
              </button>
              
            </div>
          )}
        </div>
        
        {/* Koin */}
        <div className="bg-yellow-100 px-5 py-2.5 rounded-2xl border-2 border-yellow-400 flex items-center shadow-sm">
          <span className="text-yellow-600 font-extrabold text-lg">💰 {currentPet.coins}</span>
        </div>
      </div>

      {/* KANAN: 4 Kotak Status Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border-2 border-orange-200 text-orange-600 font-bold shadow-sm">
          <Utensils size={18} /> <span>{currentPet.hunger}%</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border-2 border-yellow-200 text-yellow-500 font-bold shadow-sm">
          <Zap size={18} /> <span>{currentPet.energy}%</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 border-2 border-pink-200 text-pink-500 font-bold shadow-sm">
          <Heart size={18} /> <span>{currentPet.happiness}%</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-50 border-2 border-cyan-200 text-cyan-500 font-bold shadow-sm">
          <Droplets size={18} /> <span>{currentPet.cleanliness}%</span>
        </div>
      </div>
      
    </nav>
  );
}