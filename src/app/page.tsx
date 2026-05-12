"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import PetCharacter from "@/components/game/PetCharacter"; 
import NavigationBar from "@/components/game/NavigationBar"; // <-- INI YANG KEMAREN ILANG BRAY
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export default function Home() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Tarik data pet dari database
      const { data: pets, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (pets && pets.length > 0) {
        setPetData(pets[0]);
        setIsAuthLoading(false);
      } else {
        router.push("/");
        return;
      }
    };
    loadData();
  }, [router]);

  if (isAuthLoading || !petData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-green-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mb-4"></div>
        <p className="font-bold animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-green-50 text-gray-900 pb-32 relative overflow-hidden">
      
      {/* TOPBAR */}
      <div className="relative z-[60]"><TopBar pet={petData} /></div>
      
      {/* ROOM NAVIGATION */}
      <div className="relative z-50">
        <RoomNavigation />
      </div>
      
      {/* KONTEN TENGAH (PANDA) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto">
        <h1 className={`text-4xl font-extrabold mb-8 drop-shadow-sm text-green-950 ${funFont.className}`}>
          Living Room
        </h1>
        
        <div className="relative flex flex-col items-center justify-center w-64 h-64 mb-12">
           <PetCharacter 
             petData={petData} 
             petMood="happy" 
           />
        </div>
      </div>

      {/* NAVBAR BAWAH DIMASUKIN LAGI */}
      <div className="relative z-[70]">
        <NavigationBar />
      </div>

    </main>
  );
}