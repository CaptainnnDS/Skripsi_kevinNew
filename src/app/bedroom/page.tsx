"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import PetCharacter from "@/components/game/PetCharacter"; 
import { X, CheckCircle } from "lucide-react"; 
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

// --- KOMPONEN TEMA LUAR ANGKASA (SPACE THEME) ---
const SpaceThemeLayer = ({ isDark }: { isDark: boolean }) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-1000 ${isDark ? 'brightness-[0.4] saturate-[0.8]' : ''}`}>
      <div className="absolute inset-0 bg-[#0c0a24] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#0c0a24] to-[#020617]"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px]"></div>
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute bg-white rounded-full animate-pulse opacity-40"
          style={{
            width: Math.random() * 3 + 'px',
            height: Math.random() * 3 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDuration: Math.random() * 3 + 2 + 's',
            animationDelay: Math.random() * 5 + 's'
          }}
        />
      ))}
      <div className="absolute text-6xl animate-ufo-move filter drop-shadow-[0_0_20px_rgba(34,211,238,0.9)] z-10">🛸</div>
      <div className="absolute top-[-10%] left-[30%] text-3xl animate-meteor-fall">☄️</div>
      <div className="absolute top-[-10%] left-[70%] text-2xl animate-meteor-fall" style={{ animationDelay: '3s' }}>☄️</div>
      <style jsx global>{`
        @keyframes ufoMove {
          0% { transform: translate(-150px, 150px) rotate(15deg); }
          33% { transform: translate(40vw, 80px) rotate(-10deg); }
          66% { transform: translate(70vw, 200px) rotate(15deg); }
          100% { transform: translate(110vw, 150px) rotate(15deg); }
        }
        @keyframes meteorFall {
          0% { transform: translate(0, 0) rotate(215deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-600px, 900px) rotate(215deg); opacity: 0; }
        }
        .animate-ufo-move { animation: ufoMove 18s linear infinite; }
        .animate-meteor-fall { animation: meteorFall 8s linear infinite; }
      `}</style>
    </div>
  );
};

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
      if (pets) setPetData(pets);

      const { data: invData } = await supabase.from("inventory").select(`id, quantity, items ( id, name, category, icon_name )`).eq("user_id", session.user.id).gt("quantity", 0);
      if (invData) {
        const closetItems = invData.map((inv: any) => {
          const itemDef = Array.isArray(inv.items) ? inv.items[0] : inv.items;
          return { inv_id: inv.id, id: itemDef.id, name: itemDef.name, category: itemDef.category, icon_name: itemDef.icon_name, count: inv.quantity };
        }).filter((item: any) => ['colors', 'bedroom', 'nightlight', 'wallpaper'].includes(item.category));
        setInventory(closetItems);
      }
      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  const equipItem = async (item: any) => {
    const fm: Record<string, string> = { colors: 'body_color', bedroom: 'equipped_bed', nightlight: 'equipped_nightlight', wallpaper: 'equipped_wallpaper' };
    const field = fm[item.category];
    if (field) {
      setPetData({ ...petData, [field]: item.icon_name });
      await supabase.from("pets").update({ [field]: item.icon_name }).eq("id", petData.id);
    }
  };

  const toggleSleep = async () => {
    if (!petData) return;
    const ns = !petData.is_sleeping;
    setPetData({ ...petData, is_sleeping: ns });
    await supabase.from("pets").update({ is_sleeping: ns }).eq("id", petData.id);
  };

  if (isAuthLoading || !petData) return <div className="min-h-screen bg-[#EEF2FF]"></div>;

  const isLightOn = !petData.is_sleeping;
  const currentLight = lightConfig[petData.equipped_nightlight] || lightConfig.LightStandard;
  const bStyle = bedStyles[petData.equipped_bed] || { bedStyle: 'text-[240px]', bedY: 'bottom-[-20px]', petY: 'translateY(0)' };
  const isSpace = petData.equipped_wallpaper === 'ThemeSpace';

  return (
    <main className={`flex min-h-screen flex-col transition-all duration-1000 relative overflow-hidden ${isLightOn ? '' : currentLight.glow}`} 
          style={{ backgroundColor: isLightOn && !isSpace ? (petData.equipped_wallpaper?.startsWith('#') ? petData.equipped_wallpaper : '#EEF2FF') : '' }}>
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes squishSoft { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.97); } } .anim-squish { animation: squishSoft 3s infinite ease-in-out; transform-origin: bottom center; }`}} />

      <div className="relative z-[60]"><TopBar pet={petData} /></div>
      
      <div className="flex-1 relative flex items-center justify-center">
        {isSpace && <SpaceThemeLayer isDark={!isLightOn} />}
        {isLightOn && !showCloset && <RoomNavigation />}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <h1 className={`text-4xl font-extrabold mb-12 drop-shadow-sm transition-all duration-1000 ${isLightOn ? 'text-indigo-950' : 'text-white opacity-20'} ${funFont.className}`}>Bedroom</h1>
          <div className="relative w-80 h-80 flex items-center justify-center">
             {!isLightOn && <NightlightAtmos type={petData.equipped_nightlight} />}
             {petData.equipped_bed !== 'BedNone' && (
               <div className={`absolute ${bStyle.bedY} z-0 transition-all duration-1000 flex justify-center w-full ${!isLightOn ? 'brightness-[0.3] contrast-125' : ''}`}>
                 <BedAsset type={petData.equipped_bed} className={bStyle.bedStyle} />
               </div>
             )}
             <div className="relative z-10 transition-transform duration-500" style={{ transform: petData.equipped_bed !== 'BedNone' ? bStyle.petY : 'translateY(0)' }}>
               <PetCharacter petData={petData} petMood="happy" isSleeping={petData.is_sleeping} />
             </div>
          </div>
        </div>
      </div>

      {!showCloset && (
        <div className={`fixed bottom-0 left-0 w-full h-24 border-t-2 z-[70] flex items-center px-8 transition-all duration-1000 ${isLightOn ? 'bg-white/80 border-indigo-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]' : 'bg-slate-950/90 border-slate-800'}`}>
          <button onClick={() => isLightOn ? setShowCloset(true) : alert("Nyalain lampu dulu!")} className="flex-1 flex flex-col items-center gap-1 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110 ${isLightOn ? 'bg-blue-50 border-blue-100' : 'bg-slate-900 border-slate-800 opacity-40'}`}><span className="text-2xl">🚪</span></div>
            <span className={`text-[9px] font-black tracking-widest ${isLightOn ? 'text-blue-500' : 'text-slate-600'}`}>CLOSET</span>
          </button>
          <button onClick={toggleSleep} className="flex-1 flex flex-col items-center -translate-y-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-[6px] shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isLightOn ? 'bg-yellow-400 border-white shadow-yellow-200' : 'bg-slate-800 border-slate-700 shadow-blue-900/50'}`}>
              <span className={`text-4xl transition-all ${!isLightOn ? 'brightness-75' : ''}`}>{currentLight.btnIcon}</span>
            </div>
            <span className={`text-[10px] font-black mt-2 tracking-widest ${isLightOn ? 'text-yellow-600' : 'text-slate-500'}`}>{isLightOn ? 'ON' : 'OFF'}</span>
          </button>
          <button onClick={() => isLightOn ? router.push('/shop') : alert("Nyalain lampu dulu!")} className="flex-1 flex flex-col items-center gap-1 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110 ${isLightOn ? 'bg-purple-50 border-purple-100' : 'bg-slate-900 border-slate-800 opacity-40'}`}><span className="text-2xl">🏪</span></div>
            <span className={`text-[9px] font-black tracking-widest ${isLightOn ? 'text-purple-500' : 'text-gray-500'}`}>SHOP</span>
          </button>
        </div>
      )}

      {showCloset && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <div className={`bg-white p-8 rounded-[3.5rem] shadow-2xl w-full max-w-md flex flex-col h-[80vh] relative border-[6px] border-blue-50 ${funFont.className}`}>
            <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-3"><span className="text-3xl">🚪</span><h1 className="text-3xl font-extrabold text-[#2D3663]">My Closet</h1></div><button onClick={() => setShowCloset(false)} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 transition-all"><X size={28}/></button></div>
            <div className="flex gap-1 mb-8 bg-[#F0F4FF] p-1.5 rounded-[2rem] border-2 border-white">{[ {key:'colors', l:'Warna'}, {key:'bedroom', l:'Kasur'}, {key:'nightlight', l:'Lampu'}, {key:'wallpaper', l:'Tema'} ].map(cat => (<button key={cat.key} onClick={() => setClosetCategory(cat.key)} className={`flex-1 py-3 rounded-full font-bold text-[10px] uppercase transition-all ${closetCategory === cat.key ? 'bg-white shadow-xl text-blue-600' : 'text-[#B0B8D1]'}`}>{cat.l}</button>))}</div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pr-2 custom-scrollbar">
              {inventory.filter(i => i.category === closetCategory).map(item => (
                <button key={item.id} onClick={() => equipItem(item)} className="p-6 rounded-[2.5rem] border-2 border-[#F1F4FF] bg-white hover:border-blue-300 transition-all flex flex-col items-center group relative">
                  <div className="text-4xl mb-4 h-16 flex items-center justify-center">
                    {item.category === 'colors' ? (<div style={{ backgroundColor: item.icon_name }} className="w-14 h-14 rounded-full border-4 border-white shadow-lg" />) : 
                     item.category === 'wallpaper' ? (<div className="w-14 h-14 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-xl bg-indigo-950">🌌</div>) : 
                     item.category === 'nightlight' ? (<span className="text-5xl">{lightConfig[item.icon_name]?.btnIcon || '💡'}</span>) : 
                     (<BedAsset type={item.icon_name} className="w-12 h-12" />)}
                  </div>
                  <span className="text-[10px] font-black text-[#4A5578] text-center">{item.name}</span>
                  {((item.category === 'colors' && item.icon_name === petData.body_color) || (item.category === 'bedroom' && item.icon_name === petData.equipped_bed) || (item.category === 'nightlight' && item.icon_name === petData.equipped_nightlight) || (item.category === 'wallpaper' && item.icon_name === petData.equipped_wallpaper)) && (<div className="absolute top-4 right-4 w-7 h-7 bg-[#34D399] rounded-full flex items-center justify-center border-4 border-white"><CheckCircle className="text-white" size={16} strokeWidth={4} /></div>)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}