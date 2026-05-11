"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import PetCharacter from "@/components/game/PetCharacter"; 
import { Refrigerator, ChevronLeft, ChevronRight, Store, X } from "lucide-react"; 
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

const emojiMap: Record<string, string> = {
  Apple: "🍎", Pizza: "🍕", Cake: "🍰", Carrot: "🥕", IceCream: "🍦",
  Beef: "🥓", Candy: "🍬", Egg: "🥚", HotDog: "🌭", Cookie: "🍫",
  StrawberryFake: "🍓", Grape: "🍇", Cherry: "🍒",
  Zap: "⚡", FlaskConical: "🧪", Beaker: "🫧", FlaskRound: "🪄"
};

const ItemEmoji = ({ iconName, size, className }: { iconName: string, size: number, className?: string }) => (
  <span style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }} className={`${className} drop-shadow-md`}>
    {emojiMap[iconName] || "📦"}
  </span>
);

export default function Kitchen() { 
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showFridge, setShowFridge] = useState(false); 
  const [inventory, setInventory] = useState<any[]>([]); 
  const [activeFoodIndexLower, setActiveFoodIndexLower] = useState<number | null>(null); 
  const [fridgeCategory, setFridgeCategory] = useState("food"); 

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: pets } = await supabase.from("pets").select("*").eq("user_id", session.user.id).limit(1);
      if (pets && pets.length > 0) setPetData(pets[0]);
      else { router.push("/"); return; }

      const { data: invData } = await supabase.from("inventory").select(`id, quantity, items ( id, name, category, value, stat_type, icon_name, color_class )`).eq("user_id", session.user.id).gt("quantity", 0);

      if (invData) {
        const formattedInventory = invData.map((invItem: any) => {
          const itemDef = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;
          const colorParts = itemDef.color_class.split('-');
          const bgClass = colorParts.length >= 2 ? `bg-${colorParts[1]}-100` : 'bg-gray-100';

          return {
            inv_id: invItem.id, id: itemDef.id, name: itemDef.name, category: itemDef.category,
            icon_name: itemDef.icon_name, bg: bgClass, count: invItem.quantity, value: itemDef.value, type: itemDef.stat_type
          };
        });
        setInventory(formattedInventory);
        if (formattedInventory.length > 0) setActiveFoodIndexLower(0);
      }
      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", "food");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropToPet = async (e: React.DragEvent) => {
    e.preventDefault(); 
    if (activeFoodIndexLower === null || !petData || petData.is_sleeping) return; // Ga bisa disuapin kalo tidur
    
    const item = inventory[activeFoodIndexLower];
    if (item.count <= 0) return;

    const currentStatValue = petData[item.type] || 0; 
    if (currentStatValue >= 100 && item.value > 0) {
      alert(`Panda udah full ${item.type}-nya!`); return;
    }

    const newStatValue = Math.max(0, Math.min(100, currentStatValue + item.value));

    await supabase.from("pets").update({ [item.type]: newStatValue }).eq("id", petData.id);
    await supabase.from("inventory").update({ quantity: item.count - 1 }).eq("id", item.inv_id);

    const updatedInventory = [...inventory];
    updatedInventory[activeFoodIndexLower] = { ...item, count: item.count - 1 };
    setInventory(updatedInventory);
    setPetData({ ...petData, [item.type]: newStatValue });
  };

  const nextFoodLower = () => { if (activeFoodIndexLower !== null) setActiveFoodIndexLower((prev) => (prev! + 1) % inventory.length); };
  const prevFoodLower = () => { if (activeFoodIndexLower !== null) setActiveFoodIndexLower((prev) => (prev! - 1 + inventory.length) % inventory.length); };
  const selectItemFromFridge = (globalIndex: number) => { setActiveFoodIndexLower(globalIndex); setShowFridge(false); };

  if (isAuthLoading || !petData) return <div className="min-h-screen bg-orange-50"></div>;

  return (
    <main className="flex min-h-screen flex-col bg-orange-50 text-gray-900 pb-32 relative overflow-hidden">
      <div className="relative z-[60]"><TopBar pet={petData} /></div>
      
      {!showFridge && <RoomNavigation />}
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto">
        {!showFridge && (
          <>
            <h1 className={`text-4xl font-extrabold text-orange-950 mb-8 drop-shadow-sm ${funFont.className}`}>Kitchen</h1>
            <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropToPet} className="relative flex flex-col items-center justify-center w-64 h-64 mb-12">
               {/* FIX: MASUKIN petData={petData} BIAR WARNA KEBACA */}
               <PetCharacter petData={petData} petMood="happy" isSleeping={petData.is_sleeping} />
            </div>
          </>
        )}
      </div>

      {/* NAVBAR BAWAH KITCHEN */}
      {!showFridge && (
        <div className={`fixed bottom-0 left-0 w-full h-28 bg-white/95 border-t-4 border-orange-200 z-[70] flex items-center justify-between px-4 sm:px-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] ${funFont.className}`}>
            <button 
              onClick={() => petData.is_sleeping ? alert("Panda lagi tidur! Bangunin di Bedroom dulu.") : setShowFridge(true)} 
              className={`flex flex-col items-center gap-1 group w-16 ${petData.is_sleeping ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
            >
                <div className="bg-cyan-50 p-3 rounded-2xl border-2 border-cyan-200 group-hover:scale-110 transition-transform"><Refrigerator size={32} className="text-cyan-600" /></div>
                <span className="text-xs font-bold text-cyan-700">FRIDGE</span>
            </button>

            <div className={`flex-1 max-w-[280px] mx-4 flex items-center justify-between bg-orange-50/80 rounded-[2rem] border-2 border-orange-200 px-2 py-2 ${petData.is_sleeping ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <button onClick={prevFoodLower} className="p-2 text-orange-600 hover:bg-orange-200 rounded-full"><ChevronLeft size={28} /></button>
                <div className="flex flex-col items-center flex-1">
                    {activeFoodIndexLower !== null && inventory.length > 0 ? (() => {
                        const item = inventory[activeFoodIndexLower];
                        return (
                            <>
                                <div draggable={item.count > 0 && !petData.is_sleeping} onDragStart={handleDragStart} className={`p-2 rounded-full transition-transform ${item.count > 0 && !petData.is_sleeping ? 'cursor-grab active:cursor-grabbing hover:scale-125 hover:-translate-y-2' : 'opacity-50 grayscale'}`}>
                                    <ItemEmoji iconName={item.icon_name} size={56} />
                                </div>
                                <span className="text-sm font-extrabold text-orange-900 mt-[-8px]">x{item.count}</span>
                            </>
                        );
                    })() : <span className="font-bold text-gray-400">Kosong</span>}
                </div>
                <button onClick={nextFoodLower} className="p-2 text-orange-600 hover:bg-orange-200 rounded-full"><ChevronRight size={28} /></button>
            </div>

            <button onClick={() => router.push('/shop')} className="flex flex-col items-center gap-1 group w-16">
                <div className="bg-purple-50 p-3 rounded-2xl border-2 border-purple-200 group-hover:scale-110 transition-transform"><Store size={32} className="text-purple-600" /></div>
                <span className="text-xs font-bold text-purple-700">SHOP</span>
            </button>
        </div>
      )}

      {/* Kalo showFridge true */}
      {showFridge && (
         /* Kodingan Fridge popup lo ttp sama... (Bisa diisi kalo perlu) */
         <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-cyan-200 w-full max-w-sm flex flex-col h-[70vh] max-h-[600px] relative ${funFont.className}`}>
                <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-100">
                    <div className="flex items-center"><Refrigerator size={28} className="text-cyan-500 mr-2" /><h1 className="text-2xl font-extrabold text-cyan-950">Fridge</h1></div>
                    <button onClick={() => setShowFridge(false)} className="p-2 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-2xl">
                    <button onClick={() => setFridgeCategory("food")} className={`flex-1 py-2 rounded-xl font-bold transition-all ${fridgeCategory === "food" ? "bg-white shadow-sm text-orange-600 border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>🍕 Food</button>
                    <button onClick={() => setFridgeCategory("potions")} className={`flex-1 py-2 rounded-xl font-bold transition-all ${fridgeCategory === "potions" ? "bg-white shadow-sm text-pink-600 border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>🧪 Potions</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-3">
                        {inventory.map((item, index) => {
                            if (item.category !== fridgeCategory) return null;
                            return (
                                <button key={item.id} onClick={() => selectItemFromFridge(index)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${item.count > 0 ? `${item.bg} border-transparent hover:border-blue-300` : 'bg-gray-100 border-gray-200 opacity-60 grayscale'}`}>
                                    <ItemEmoji iconName={item.icon_name} size={36} className="mb-2" />
                                    <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center">{item.name}</span>
                                    <span className={`text-[10px] font-extrabold mt-1 px-2 py-0.5 rounded-full ${item.count > 0 ? 'bg-white text-gray-800 shadow-sm' : 'bg-gray-300 text-gray-500'}`}>x{item.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* TAMENG GELAP KITCHEN (Biar beneran dikunci pas tidur) */}
      {petData.is_sleeping && (
        <div 
          className="fixed inset-0 bg-black/60 z-[65] cursor-not-allowed transition-opacity duration-1000"
          onClick={() => alert("Ssst! Panda lagi tidur pulas buat ngisi energi. Nyalain lampu di Bedroom dulu gih.")}
        ></div>
      )}
    </main>
  );
}