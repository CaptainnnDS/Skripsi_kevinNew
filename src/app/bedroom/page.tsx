"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, safeFetch } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import LoadingScreen from "@/components/LoadingScreen";
import { showWarning, showError } from "@/lib/alert";
import PetCharacter from "@/components/game/PetCharacter"; 
import { X, CheckCircle } from "lucide-react"; 
import { applyDecay, getPetMood, syncPetStats } from "@/lib/pet-stats";


// --- ATMOSFER LAMPU TIDUR ---
const NightlightAtmos = ({ type }: { type: string }) => {
  if (type === 'LightMoon') {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <div className="text-9xl opacity-60 filter drop-shadow-[0_0_20px_rgba(253,224,71,0.6)] -translate-x-16 -translate-y-24 animate-bounce" style={{ animationDuration: '6s' }}>🌙</div>
        <div className="absolute w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>
    );
  }
  if (type === 'LightStar') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 m-auto w-full h-full bg-yellow-300/[0.03] blur-[120px]"></div>
        <div className="absolute top-[10%] left-[5%] text-2xl animate-pulse opacity-40">✨</div>
        <div className="absolute top-[15%] left-[45%] text-3xl animate-bounce opacity-40" style={{ animationDuration: '4s' }}>⭐</div>
        <div className="absolute top-[12%] right-[10%] text-2xl animate-ping opacity-45">✨</div>
      </div>
    );
  }
  return <div className="absolute inset-0 bg-white/5 rounded-full blur-[50px] z-0 pointer-events-none"></div>;
};

// --- FIX: BED ASSET MAPPING ---
const BedAsset = ({ type, className }: { type: string, className?: string }) => {
  if (type === 'BedPillow') {
    return (
      <svg viewBox="0 0 120 60" className={`${className} drop-shadow-xl`} xmlns="http://www.w3.org/2000/svg">
        <path d="M15 35 Q30 5 70 15 Q100 20 110 25 Q90 50 70 45 Q30 55 15 35 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M35 35 Q60 45 85 35" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    );
  }
  if (type === 'BedBeanBag') {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-2xl`} xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="bgG" cx="40%" cy="30%" r="60%"><stop offset="0%" stopColor="#d8b4fe"/><stop offset="100%" stopColor="#7e22ce"/></radialGradient></defs>
        <path d="M40 15 Q50 5 60 15" stroke="#6b21a8" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M10 80 C10 40 30 15 50 15 C70 15 90 40 90 80 C90 95 70 95 50 95 C30 95 10 95 10 80 Z" fill="url(#bgG)" stroke="#581c87" strokeWidth="2"/>
      </svg>
    );
  }
  // FIX: Mapping BedCouch diperbaiki dari teks " Couch" jadi emoji 🛋️
  const fb: Record<string, string> = { BedCloud: "☁️", BedCouch: "🛋️", BedStandard: "🛏️" };
  return <span className={className}>{fb[type] || "🛏️"}</span>;
};

const bedStyles: Record<string, any> = {
  BedPillow: { bedStyle: 'w-[870px] h-auto anim-squish', bedY: 'bottom-[-7px]', petY: 'translateY(-35px)' },
  BedCloud: { bedStyle: 'text-[360px] leading-none', bedY: 'bottom-[-90px]', petY: 'translateY(-10px)' },
  BedCouch: { bedStyle: 'text-[450px] leading-none', bedY: 'bottom-[-50px]', petY: 'translateY(20px)' }, 
  BedStandard: { bedStyle: 'text-[400px] leading-none', bedY: 'bottom-[-50px]', petY: 'translateY(-60px)' },
  BedBeanBag: { bedStyle: 'w-[350px] h-auto anim-squish', bedY: 'bottom-[-2px]', petY: 'translateY(-35px)' },
};

const lightConfig: Record<string, any> = {
  LightStandard: { glow: 'bg-[#0f172a]', btnIcon: '💡' },
  LightMoon: { glow: 'bg-[#020617]', btnIcon: '🌙' },
  LightStar: { glow: 'bg-[#1e1b4b]', btnIcon: '🌟' },
  LightLava: { glow: 'bg-[#450a0a]', btnIcon: '🌋' },
  LightNeon: { glow: 'bg-[#1e1b4b]', btnIcon: '✨' },
};

export default function Bedroom() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showCloset, setShowCloset] = useState(false);
  const [closetCategory, setClosetCategory] = useState("colors");
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: pets } = await supabase.from("pets").select("*").eq("user_id", session.user.id).single();
      if (pets) {
        const decayed = applyDecay(pets);
        if (decayed._decayed) await syncPetStats(pets.id, decayed);
        setPetData(decayed);
      }

      const { data: invData } = await supabase.from("inventory").select(`id, quantity, items ( id, name, category, icon_name )`).eq("user_id", session.user.id).gt("quantity", 0);
      if (invData) {
        const closetItems = invData.map((inv: any) => {
          const itemDef = Array.isArray(inv.items) ? inv.items[0] : inv.items;
          return { inv_id: inv.id, id: itemDef.id, name: itemDef.name, category: itemDef.category, icon_name: itemDef.icon_name, count: inv.quantity };
        }).filter((item: any) => ['colors', 'bedroom', 'nightlight'].includes(item.category));
        setInventory(closetItems);
      }
      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  const equipItem = async (item: any) => {
    const fm: Record<string, string> = { colors: 'body_color', bedroom: 'equipped_bed', nightlight: 'equipped_nightlight' };
    const field = fm[item.category];
    if (field) {
      const { error } = await safeFetch(
        supabase.from("pets").update({ [field]: item.icon_name }).eq("id", petData.id)
      );
      if (error) { showError("Gagal equip item. Coba lagi."); return; }
      setPetData({ ...petData, [field]: item.icon_name });
    }
  };

  const toggleSleep = async () => {
    if (!petData) return;
    const ns = !petData.is_sleeping;
    const { error } = await safeFetch(
      supabase.from("pets").update({ is_sleeping: ns, last_stat_update: new Date().toISOString() }).eq("id", petData.id)
    );
    if (error) { showError("Gagal update status tidur. Coba lagi."); return; }
    setPetData({ ...petData, is_sleeping: ns, last_stat_update: new Date().toISOString() });
  };

  if (isAuthLoading || !petData) return <LoadingScreen />;

  const isLightOn = !petData.is_sleeping;
  const currentLight = lightConfig[petData.equipped_nightlight] || lightConfig.LightStandard;
  const bStyle = bedStyles[petData.equipped_bed] || { bedStyle: 'text-[240px]', bedY: 'bottom-[-20px]', petY: 'translateY(0)' };
  return (
    <main className={`flex min-h-screen flex-col transition-all duration-1000 relative overflow-hidden pb-48 ${isLightOn ? '' : currentLight.glow}`} 
          style={{ backgroundColor: isLightOn ? '#EEF2FF' : '' }}>
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes squishSoft { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.97); } } .anim-squish { animation: squishSoft 3s infinite ease-in-out; transform-origin: bottom center; }`}} />

      <div className="relative z-[80]"><TopBar pet={petData} /></div>
      
      <div className="flex-1 relative flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center justify-center">
          <h1 className={`text-4xl font-extrabold mb-12 drop-shadow-sm transition-all duration-1000 ${isLightOn ? 'text-indigo-950' : 'text-white opacity-20'}`}>Bedroom</h1>
          <div className="relative w-80 h-80 flex items-center justify-center">
             {!isLightOn && <NightlightAtmos type={petData.equipped_nightlight} />}
             {petData.equipped_bed !== 'BedNone' && (
               <div className={`absolute ${bStyle.bedY} z-0 transition-all duration-1000 flex justify-center w-full ${!isLightOn ? 'brightness-[0.3] contrast-125' : ''}`}>
                 <BedAsset type={petData.equipped_bed} className={bStyle.bedStyle} />
               </div>
             )}
             <div className="relative z-10 transition-transform duration-500" style={{ transform: petData.equipped_bed !== 'BedNone' ? bStyle.petY : 'translateY(0)' }}>
               <PetCharacter petData={petData} petMood={getPetMood(petData)} isSleeping={petData.is_sleeping} />
             </div>
          </div>
        </div>
      </div>

      {!showCloset && (
        <div className="fixed bottom-20 left-0 w-full z-[70] px-4 pb-3">
          <div className={`max-w-lg mx-auto rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border p-2.5 flex items-center gap-2 transition-all duration-700 ${
            isLightOn
              ? 'bg-white border-indigo-100'
              : 'bg-slate-900/95 border-slate-700'
          }`}>

            {/* CLOSET Button */}
            <button
              onClick={() => isLightOn ? setShowCloset(true) : showWarning("Nyalain lampu dulu!")}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl shadow-md transition-all ${
                isLightOn
                  ? 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              disabled={!isLightOn}
            >
              <span className="text-xl leading-none">🚪</span>
              <span className="text-xs font-extrabold tracking-wider leading-none">CLOSET</span>
            </button>

            {/* Status / Info Center */}
            <div className={`flex-1 h-14 flex flex-col items-center justify-center rounded-xl border px-3 ${
              isLightOn
                ? 'bg-yellow-50 border-yellow-100'
                : 'bg-slate-800/60 border-slate-700'
            }`}>
              <span className={`text-xs font-extrabold tracking-widest leading-none mb-1 ${
                isLightOn ? 'text-yellow-600' : 'text-blue-300'
              }`}>
                {isLightOn ? '☀️ AWAKE' : '🌙 SLEEPING'}
              </span>
              <span className={`text-xs font-medium leading-none ${
                isLightOn ? 'text-gray-600' : 'text-slate-400'
              }`}>
                {petData.is_sleeping ? 'Lampu off untuk istirahat' : 'Tap tombol untuk tidur'}
              </span>
            </div>

            {/* Light Toggle */}
            <button
              onClick={toggleSleep}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 ${
                isLightOn
                  ? 'bg-gradient-to-br from-yellow-300 to-amber-400 shadow-yellow-200'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-blue-900/30 ring-2 ring-blue-400/30'
              }`}
              title={isLightOn ? 'Matikan lampu' : 'Nyalakan lampu'}
            >
              <span className={`text-2xl leading-none transition-transform ${!isLightOn ? 'brightness-110' : ''}`}>
                {currentLight.btnIcon}
              </span>
              <span className={`text-xs font-extrabold tracking-wider mt-0.5 leading-none ${
                isLightOn ? 'text-amber-900' : 'text-blue-300'
              }`}>
                {isLightOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      )}

      {showCloset && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className={`bg-white p-8 rounded-[3.5rem] shadow-2xl w-full max-w-md flex flex-col h-[80vh] relative border-[6px] border-blue-50`}>
            <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-3"><span className="text-3xl">🚪</span><h1 className="text-3xl font-extrabold text-[#2D3663]">My Closet</h1></div><button onClick={() => setShowCloset(false)} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 transition-all"><X size={28}/></button></div>
            <div className="flex gap-1 mb-8 bg-[#F0F4FF] p-1.5 rounded-[2rem] border-2 border-white">{[ {key:'colors', l:'Warna'}, {key:'bedroom', l:'Kasur'}, {key:'nightlight', l:'Lampu'} ].map(cat => (<button key={cat.key} onClick={() => setClosetCategory(cat.key)} className={`flex-1 py-3 rounded-full font-bold text-[10px] uppercase transition-all ${closetCategory === cat.key ? 'bg-white shadow-xl text-blue-600' : 'text-[#B0B8D1]'}`}>{cat.l}</button>))}</div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pr-2 custom-scrollbar">
              {inventory.filter(i => i.category === closetCategory).map(item => (
                <button key={item.id} onClick={() => equipItem(item)} className="p-6 rounded-[2.5rem] border-2 border-[#F1F4FF] bg-white hover:border-blue-300 transition-all flex flex-col items-center group relative">
                  <div className="text-4xl mb-4 h-16 flex items-center justify-center">
                    {item.category === 'colors' ? (<div style={{ backgroundColor: item.icon_name }} className="w-14 h-14 rounded-full border-4 border-white shadow-lg" />) : 
                     item.category === 'nightlight' ? (<span className="text-5xl">{lightConfig[item.icon_name]?.btnIcon || '💡'}</span>) : 
                     (<BedAsset type={item.icon_name} className="w-12 h-12" />)}
                  </div>
                  <span className="text-[10px] font-black text-[#4A5578] text-center">{item.name}</span>
                  {((item.category === 'colors' && item.icon_name === petData.body_color) || (item.category === 'bedroom' && item.icon_name === petData.equipped_bed) || (item.category === 'nightlight' && item.icon_name === petData.equipped_nightlight)) && (<div className="absolute top-4 right-4 w-7 h-7 bg-[#34D399] rounded-full flex items-center justify-center border-4 border-white"><CheckCircle className="text-white" size={16} strokeWidth={4} /></div>)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <NavigationBar />
    </main>
  );
}