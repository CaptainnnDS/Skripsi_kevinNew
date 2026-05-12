"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import PetCharacter from "@/components/game/PetCharacter"; 
import Image from "next/image";
import { Droplets, ChevronLeft, ChevronRight, X } from "lucide-react"; 
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

const emojiMap: Record<string, string> = {
  SoapBasic: "🧼", SoapFloral: "🧴", SoapBubble: "🫧", SoapBomb: "🎆"
};

const ItemEmoji = ({ iconName, size, className }: { iconName: string, size: number, className?: string }) => (
  <span style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }} className={`${className} drop-shadow-md`}>
    {emojiMap[iconName] || "📦"}
  </span>
);

export default function BathRoom() { 
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeToolInfo, setActiveToolInfo] = useState<string | null>(null);
  const [activeAnim, setActiveAnim] = useState<string>("none");
  const [isSoaped, setIsSoaped] = useState(false);
  const [pendingSoapValue, setPendingSoapValue] = useState(0); 
  
  const [activeSoapIcon, setActiveSoapIcon] = useState<string | null>(null);

  const [showRack, setShowRack] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]); 
  const [activeSoapIndexLower, setActiveSoapIndexLower] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: pets } = await supabase.from("pets").select("*").eq("user_id", session.user.id).limit(1);
      if (pets && pets.length > 0) setPetData(pets[0]);
      else { router.push("/"); return; }

      const { data: invData } = await supabase.from("inventory")
        .select(`id, quantity, items ( id, name, category, value, icon_name, color_class )`)
        .eq("user_id", session.user.id)
        .eq("items.category", "soaps") 
        .gt("quantity", 0);

      if (invData) {
        const formattedInventory = invData
          .filter(inv => inv.items !== null) 
          .map((invItem: any) => {
            const itemDef = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;
            return {
              inv_id: invItem.id, id: itemDef.id, name: itemDef.name, 
              icon_name: itemDef.icon_name, count: invItem.quantity, value: itemDef.value
            };
          });
        setInventory(formattedInventory);
        if (formattedInventory.length > 0) setActiveSoapIndexLower(0);
      }
      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  const handleDragStart = (e: React.DragEvent, toolType: string) => {
    e.dataTransfer.setData("text/plain", toolType);
    e.dataTransfer.effectAllowed = "move";
    setActiveToolInfo(toolType);
  };

  const handleDragEnd = () => setActiveToolInfo(null);

  const handleDropToPet = async (e: React.DragEvent) => {
    e.preventDefault(); 
    setActiveToolInfo(null);
    if (!petData || petData.is_sleeping) return; 
    
    const tool = e.dataTransfer.getData("text/plain");
    const currentCleanliness = petData.cleanliness || 0; 

    if (tool === "soap") {
      if (isSoaped) return alert("Udah disabunin, bilas pake shower dulu, Bray!");
      if (currentCleanliness >= 100) return alert("Panda udah kinclong banget!");
      if (activeSoapIndexLower === null || inventory.length === 0) return;

      const item = inventory[activeSoapIndexLower];
      if (item.count <= 0) return;

      await supabase.from("inventory").update({ quantity: item.count - 1 }).eq("id", item.inv_id);
      
      const updatedInv = [...inventory];
      updatedInv[activeSoapIndexLower].count -= 1;
      setInventory(updatedInv);
      
      setPendingSoapValue(item.value); 
      setIsSoaped(true); 
      setActiveSoapIcon(item.icon_name); 
      return; 
    }

    if (tool === "shower") {
      setActiveAnim("shower");

      const boost = isSoaped ? pendingSoapValue : 10;
      const newCleanliness = Math.min(100, currentCleanliness + boost);

      setTimeout(async () => {
        setActiveAnim("none");
        setIsSoaped(false); 
        setPendingSoapValue(0);
        setActiveSoapIcon(null); 

        if (currentCleanliness < 100) {
            await supabase.from("pets").update({ cleanliness: newCleanliness }).eq("id", petData.id);
            setPetData({ ...petData, cleanliness: newCleanliness });
        }
      }, 1500);
    }
  };

  const nextSoap = () => { if (activeSoapIndexLower !== null) setActiveSoapIndexLower((prev) => (prev! + 1) % inventory.length); };
  const prevSoap = () => { if (activeSoapIndexLower !== null) setActiveSoapIndexLower((prev) => (prev! - 1 + inventory.length) % inventory.length); };
  const selectItemFromRack = (index: number) => { setActiveSoapIndexLower(index); setShowRack(false); };

  // --- RENDER EFEK SABUN YANG LEBIH REALISTIS & HALUS ---
  const renderSoapEffect = () => {
    if (!isSoaped) return null;

    // 1. Sultan Bomb (Aura Glowing, Sparkles Melayang, Elegan)
    if (activeSoapIcon === 'SoapBomb') {
      return (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {/* Aura Magis */}
          <div className="anim-aura absolute w-64 h-64 rounded-full bg-gradient-to-tr from-purple-400 via-pink-300 to-yellow-300 blur-[40px]"></div>

          {/* Sparkles Emas Melayang */}
          {[...Array(10)].map((_, i) => (
            <div key={`sparkle-${i}`} className="anim-float-sparkle text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random()}s`
            }}>✨</div>
          ))}

          {/* Busa Mengkilap */}
          {[...Array(8)].map((_, i) => (
             <div key={`bubble-${i}`} className="anim-stay-bubble drop-shadow-md" style={{ 
               fontSize: `${Math.random() * 30 + 30}px`, 
               top: `${Math.random() * 80 + 10}%`, 
               left: `${Math.random() * 80 + 10}%`,
               animationDelay: `${Math.random()}s`
             }}>🫧</div>
          ))}
        </div>
      );
    }

    // 2. Bubble Bath (Busa tumpah ruah)
    if (activeSoapIcon === 'SoapBubble') {
      return (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {[...Array(15)].map((_, i) => (
             <div key={i} className="anim-stay-bubble" style={{ 
               fontSize: `${Math.random() * 40 + 30}px`, 
               top: `${Math.random() * 80 + 10}%`, 
               left: `${Math.random() * 80 + 10}%`,
               animationDelay: `${Math.random()}s`
             }}>🫧</div>
          ))}
        </div>
      );
    }

    // 3. Floral Wash (Busa + Bunga yang melayang ke atas)
    if (activeSoapIcon === 'SoapFloral') {
      return (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="anim-stay-bubble text-4xl" style={{ top: '20%', left: '30%' }}>🫧</div>
          <div className="anim-stay-bubble text-5xl" style={{ top: '50%', left: '60%' }}>🫧</div>
          <div className="anim-stay-bubble text-3xl" style={{ top: '70%', left: '40%' }}>🫧</div>
          
          {/* Bunga Melayang Soft */}
          {[...Array(5)].map((_, i) => (
             <div key={`flower-${i}`} className="anim-flower drop-shadow-md" style={{ 
               fontSize: `${Math.random() * 20 + 20}px`, 
               top: `${60 + Math.random() * 30}%`, 
               left: `${20 + Math.random() * 60}%`,
               animationDelay: `${Math.random() * 2}s`
             }}>{i % 2 === 0 ? '🌸' : '🌺'}</div>
          ))}
        </div>
      );
    }

    // 4. Basic Soap (Busa standar)
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="anim-stay-bubble text-4xl" style={{ top: '20%', left: '25%' }}>🫧</div>
          <div className="anim-stay-bubble text-5xl" style={{ top: '40%', left: '50%' }}>🫧</div>
          <div className="anim-stay-bubble text-3xl" style={{ top: '65%', left: '30%' }}>🫧</div>
          <div className="anim-stay-bubble text-4xl" style={{ top: '45%', left: '70%' }}>🫧</div>
          <div className="anim-stay-bubble text-2xl" style={{ top: '10%', left: '60%' }}>🫧</div>
      </div>
    );
  };

  if (isAuthLoading || !petData) return <div className="min-h-screen bg-white"></div>;

  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-900 pb-32 relative overflow-hidden">
      
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg/WhatsApp%20Image%202026-05-11%20at%2016.55.17.jpeg"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* CSS KEYFRAMES DI-UPGRADE BIAR LEBIH PREMIUM */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wobble { 
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; } 
          50% { transform: translateY(-8px) scale(1.05); opacity: 1; } 
        }
        @keyframes waterFall { 
          0% { transform: translateY(-100px) scaleY(1); opacity: 1; } 
          100% { transform: translateY(150px) scaleY(1.5); opacity: 0; } 
        }
        @keyframes floatUp { 
          0% { transform: translateY(20px) scale(0.8) rotate(0deg); opacity: 0; } 
          20% { opacity: 1; } 
          80% { opacity: 1; } 
          100% { transform: translateY(-80px) scale(1.2) rotate(180deg); opacity: 0; } 
        }
        @keyframes floatSparkle { 
          0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; } 
          20% { opacity: 1; transform: translateY(-10px) scale(1) rotate(45deg); } 
          80% { opacity: 1; transform: translateY(-30px) scale(1) rotate(135deg); } 
          100% { transform: translateY(-40px) scale(0.5) rotate(180deg); opacity: 0; } 
        }
        @keyframes pulseAura { 
          0%, 100% { transform: scale(1); opacity: 0.3; filter: hue-rotate(0deg); } 
          50% { transform: scale(1.1); opacity: 0.6; filter: hue-rotate(60deg); } 
        }
        
        .anim-stay-bubble { animation: wobble 2s infinite ease-in-out; position: absolute; }
        .anim-water { animation: waterFall 0.8s linear forwards; position: absolute; }
        .anim-flower { animation: floatUp 2.5s infinite ease-in; position: absolute; }
        .anim-float-sparkle { animation: floatSparkle 2s infinite ease-in-out forwards; position: absolute; }
        .anim-aura { animation: pulseAura 4s infinite ease-in-out; position: absolute; }
      `}} />

      <div className="relative z-[60]"><TopBar pet={petData} /></div>
      
      {!showRack && <div className="relative z-50"><RoomNavigation /></div>}
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto">
        {!showRack && <h1 className={`text-4xl font-extrabold text-cyan-950 mb-8 drop-shadow-sm ${funFont.className}`}>Bathroom</h1>}

        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropToPet} className="relative flex flex-col items-center justify-center w-64 h-64 mb-12">
            <div className={`transition-all duration-300 ${activeAnim === "shower" ? 'scale-110' : ''}`}>
                <PetCharacter petData={petData} petMood={activeAnim === "shower" ? "excited" : "happy"} isSleeping={petData.is_sleeping} />
            </div>

            {/* FUNGSI RENDER EFEK SABUN DIPANGGIL DI SINI */}
            {renderSoapEffect()}

            {activeAnim === "shower" && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="absolute -top-12 text-6xl opacity-80">🚿</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '30%', animationDelay: '0s' }}>|</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '50%', animationDelay: '0.1s' }}>|</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '70%', animationDelay: '0.2s' }}>|</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '40%', animationDelay: '0.3s' }}>|</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '60%', animationDelay: '0.15s' }}>|</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '20%', animationDelay: '0.25s' }}>|</div>
                    <div className="anim-water text-3xl text-blue-400 font-bold" style={{ left: '80%', animationDelay: '0.05s' }}>|</div>
                </div>
            )}
        </div>
      </div>

      {!showRack && (
        <div className={`fixed bottom-0 left-0 w-full h-28 bg-white/95 border-t-4 border-cyan-200 z-[70] flex items-center justify-between px-4 sm:px-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] ${funFont.className}`}>
            
            <button onClick={() => petData.is_sleeping ? alert("Lagi tidur woy!") : setShowRack(true)} className={`flex flex-col items-center gap-1 group w-16 ${petData.is_sleeping ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}>
                <div className="bg-pink-50 p-3 rounded-2xl border-2 border-pink-200 group-hover:scale-110 transition-transform"><Droplets size={32} className="text-pink-600" /></div>
                <span className="text-xs font-bold text-pink-700">SOAPS</span>
            </button>

            <div className={`flex-1 max-w-[280px] mx-4 flex items-center justify-between bg-cyan-50/80 rounded-[2rem] border-2 border-cyan-200 px-2 py-2 ${petData.is_sleeping ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <button onClick={prevSoap} className="p-2 text-cyan-600 hover:bg-cyan-200 rounded-full"><ChevronLeft size={28} /></button>
                <div className="flex flex-col items-center flex-1">
                    {activeSoapIndexLower !== null && inventory.length > 0 ? (() => {
                        const item = inventory[activeSoapIndexLower];
                        return (
                            <>
                                <div draggable={item.count > 0 && !petData.is_sleeping} onDragStart={(e) => handleDragStart(e, "soap")} className={`p-2 rounded-full transition-transform ${item.count > 0 && !petData.is_sleeping ? 'cursor-grab active:cursor-grabbing hover:scale-125 hover:-translate-y-2' : 'opacity-50 grayscale'}`}>
                                    <ItemEmoji iconName={item.icon_name} size={48} />
                                </div>
                                <span className="text-sm font-extrabold text-cyan-900 mt-[-4px]">x{item.count}</span>
                            </>
                        );
                    })() : <span className="font-bold text-gray-400 text-sm mt-2 text-center">Beli<br/>Sabun</span>}
                </div>
                <button onClick={nextSoap} className="p-2 text-cyan-600 hover:bg-cyan-200 rounded-full"><ChevronRight size={28} /></button>
            </div>

            <div className={`flex flex-col items-center group relative w-16 ${petData.is_sleeping ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div draggable={!petData.is_sleeping} onDragStart={(e) => handleDragStart(e, "shower")} onDragEnd={handleDragEnd} className="bg-blue-50 p-2 rounded-2xl border-2 border-blue-200 cursor-grab active:cursor-grabbing hover:scale-110 transition-all flex items-center justify-center w-14 h-14">
                    <span className="text-4xl transform -scale-x-100">🚿</span>
                </div>
                <span className="text-xs font-bold text-blue-700 mt-1">RINSE</span>
            </div>
        </div>
      )}

      {showRack && (
         <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-cyan-200 w-full max-w-sm flex flex-col h-[60vh] max-h-[500px] relative ${funFont.className}`}>
                <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-100">
                    <div className="flex items-center"><Droplets size={28} className="text-pink-500 mr-2" /><h1 className="text-2xl font-extrabold text-cyan-950">Soap Rack</h1></div>
                    <button onClick={() => setShowRack(false)} className="p-2 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-3">
                        {inventory.length > 0 ? inventory.map((item, index) => (
                            <button key={item.id} onClick={() => selectItemFromRack(index)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${item.count > 0 ? 'bg-cyan-50 border-cyan-100 hover:border-cyan-300' : 'bg-gray-100 border-gray-200 opacity-60 grayscale'}`}>
                                <ItemEmoji iconName={item.icon_name} size={36} className="mb-2" />
                                <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center">{item.name}</span>
                                <span className={`text-[10px] font-extrabold mt-1 px-2 py-0.5 rounded-full ${item.count > 0 ? 'bg-white text-gray-800 shadow-sm' : 'bg-gray-300 text-gray-500'}`}>x{item.count}</span>
                            </button>
                        )) : (
                            <div className="col-span-3 text-center text-gray-400 font-bold mt-10">Rak kosong, beli sabun di Shop dulu!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {petData.is_sleeping && (
        <div className="fixed inset-0 bg-black/60 z-[65] cursor-not-allowed transition-opacity duration-1000" onClick={() => alert("Ssst! Panda lagi tidur pulas.")}></div>
      )}
    </main>
  );
}