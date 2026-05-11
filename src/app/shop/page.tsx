"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import { Pizza, FlaskConical, Droplets, Shirt, Bed, Palette, ArrowLeft, Store, Coins, CheckCircle, Lightbulb, Image as ImageIcon } from "lucide-react"; 
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

const emojiMap: Record<string, string> = {
  // Makanan & Minuman
  Apple: "🍎", Pizza: "🍕", Cake: "🍰", Carrot: "🥕", IceCream: "🍦",
  Beef: "🥓", Candy: "🍬", Egg: "🥚", HotDog: "🌭", Cookie: "🍫",
  StrawberryFake: "🍓", Grape: "🍇", Cherry: "🍒",
  
  // Ramuan & Sabun
  Zap: "⚡", FlaskConical: "🧪", Beaker: "🫧", FlaskRound: "🪄",
  SoapBasic: "🧼", SoapFloral: "🧴", SoapBubble: "🫧", SoapBomb: "🎆",
  
  // Warna Body
  '#FFB6C1': "🌸", '#B2F2BB': "🌿", '#FFF3BF': "☀️", '#A5D8FF': "💧", '#E0BBE4': "🍇", '#A7B3E6': "💜",
  
  // Kasur (FIXED: Sofa sekarang ngerender emoji 🛋️)
  BedCloud: "☁️", BedCouch: "🛋️", BedStandard: "🛏️",
  BedBox: "📦", BedTent: "⛺", BedLeaf: "🍃", BedNest: "🪹",

  // Lampu Tidur (Custom Lights)
  LightMoon: "🌙", LightStar: "🌟", LightDisco: "🪩", LightLava: "🌋",

  // Wallpaper / Tema Kamar
  '#FFF9C4': "🌅", '#E8F5E9': "🌿", '#FCE4EC': "🌇", '#1A237E': "🌌"
};

// --- BedAsset ---
const BedAsset = ({ type, className }: { type: string, className?: string }) => {
  if (type === 'BedPillow') {
    return (
      <svg viewBox="0 0 120 60" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M85 40 L105 25 L95 18 Z" fill="#38bdf8" />
        <path d="M88 38 L102 26" stroke="#0284c7" strokeWidth="1.5" />
        <path d="M85 32 L95 24" stroke="#0284c7" strokeWidth="1.5" />
        <path d="M15 35 Q30 5 70 15 Q100 20 110 25 Q90 50 70 45 Q30 55 15 35 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        <path d="M35 35 Q60 45 85 35" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="15" cy="35" r="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5"/>
        <circle cx="110" cy="25" r="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (type === 'BedBeanBag') {
    return (
      <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="bgGShop" cx="40%" cy="30%" r="60%"><stop offset="0%" stopColor="#d8b4fe"/><stop offset="100%" stopColor="#7e22ce"/></radialGradient></defs>
        <path d="M40 15 Q50 5 60 15" stroke="#6b21a8" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M10 80 C10 40 30 15 50 15 C70 15 90 40 90 80 C90 95 70 95 50 95 C30 95 10 95 10 80 Z" fill="url(#bgGShop)" stroke="#581c87" strokeWidth="2"/>
        <path d="M50 15 C40 40 45 70 50 95" stroke="#9333ea" strokeWidth="2" fill="none"/>
      </svg>
    );
  }
  return null;
};

const ItemDisplay = ({ iconName, category, size, className }: { iconName: string, category: string, size: number, className?: string }) => {
  if (category === 'colors' || (category === 'wallpaper' && iconName.startsWith('#'))) {
    return <div style={{ width: size, height: size, backgroundColor: iconName }} className={`${className} rounded-full border-4 border-gray-200 drop-shadow-md mb-2`} />;
  }
  // FIXED: Bedroom sekarang ngerender BedAsset (SVG) atau Fallback Emoji (Sofa/Cloud)
  if (category === 'bedroom') {
     if (iconName === 'BedPillow' || iconName === 'BedBeanBag') {
        return <BedAsset type={iconName} className={`${className} w-16 h-16 mb-2`} />;
     }
  }
  return <span style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }} className={`${className} drop-shadow-md mb-2`}>{emojiMap[iconName] || "📦"}</span>;
};

const shopCategories = [
  { id: "food", name: "Food", icon: Pizza, color: "text-orange-500", bg: "bg-orange-100" },
  { id: "potions", name: "Potions", icon: FlaskConical, color: "text-red-500", bg: "bg-red-100" },
  { id: "soaps", name: "Soaps", icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-100" },
  { id: "bedroom", name: "Beds", icon: Bed, color: "text-indigo-500", bg: "bg-indigo-100" },
  { id: "nightlight", name: "Lights", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-100" },
  { id: "wallpaper", name: "Themes", icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-100" },
  { id: "colors", name: "Body", icon: Palette, color: "text-green-500", bg: "bg-green-100" },
];

export default function Shop() {
  const router = useRouter();
  const [petData, setPetData] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [shopItems, setShopItems] = useState<any[]>([]); 
  const [isBuying, setIsBuying] = useState(false); 
  const [popupMsg, setPopupMsg] = useState(""); 

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: pets } = await supabase.from("pets").select("*").eq("user_id", session.user.id).limit(1);
      if (pets && pets.length > 0) setPetData(pets[0]);
      else { router.push("/"); return; }

      const { data: items } = await supabase
        .from("items")
        .select("*")
        .in("category", ["food", "potions", "soaps", "bedroom", "clothes", "colors", "nightlight", "wallpaper"])
        .order('price', { ascending: true });
        
      if (items) {
        // FIXED: Hilangin duplikasi item (Lampu, dll) dengan filter unik berdasarkan icon_name
        const uniqueItems = items.filter((v, i, a) => a.findIndex(t => t.icon_name === v.icon_name) === i);
        setShopItems(uniqueItems);
      }
      setIsAuthLoading(false);
    };
    loadData();
  }, [router]);

  const buyItem = async (item: any) => {
    if (!petData) return;
    const currentCoins = petData.coins || 0; 
    if (currentCoins < item.price) { alert("Koin lo kurang, Bray!"); return; }

    setIsBuying(true);
    const newCoins = currentCoins - item.price;

    const { error: updateError } = await supabase.from("pets").update({ coins: newCoins }).eq("id", petData.id);
    if (updateError) { setIsBuying(false); return; }

    const { data: existingInv } = await supabase.from("inventory").select("*").eq("user_id", petData.user_id).eq("item_id", item.id).single();
    if (existingInv) {
      await supabase.from("inventory").update({ quantity: existingInv.quantity + 1 }).eq("id", existingInv.id);
    } else {
      await supabase.from("inventory").insert({ user_id: petData.user_id, item_id: item.id, quantity: 1 });
    }

    setPetData({ ...petData, coins: newCoins });
    setIsBuying(false);
    setPopupMsg(`Berhasil beli ${item.name}! Cek Closet ya.`);
    setTimeout(() => setPopupMsg(""), 2500); 
  };

  if (isAuthLoading || !petData) return <div className="min-h-screen bg-blue-50"></div>;
  const displayedItems = shopItems.filter(item => item.category === activeCategory);

  return (
    <main className="fixed inset-0 flex flex-col bg-blue-50 text-gray-900 pb-24">
      <TopBar pet={petData} />
      {!activeCategory && <RoomNavigation />}
      {popupMsg && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce ${funFont.className}`}>
          <CheckCircle size={20} /> {popupMsg}
        </div>
      )}
      <div className="flex-1 overflow-hidden p-6 relative w-full max-w-md mx-auto flex flex-col">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border-4 border-blue-200 w-full h-full flex flex-col overflow-hidden">
          {!activeCategory ? (
            <>
              <h1 className={`text-3xl font-extrabold text-center text-blue-900 mb-6 flex items-center justify-center gap-2 shrink-0 ${funFont.className}`}><Store size={32} className="text-purple-500" /> Shop</h1>
              <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-1">
                {shopCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="flex flex-col items-center justify-center p-2 rounded-2xl hover:scale-105 transition-transform group">
                    <div className={`${cat.bg} p-4 rounded-2xl mb-2 shadow-sm border-2 border-transparent group-hover:border-blue-300 transition-colors`}><cat.icon size={36} className={cat.color} /></div>
                    <span className={`text-[10px] font-bold text-gray-700 tracking-wide uppercase ${funFont.className}`}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={`flex flex-col h-full overflow-hidden ${funFont.className}`}>
              <div className="flex items-center mb-4 pb-4 border-b-2 border-gray-100 shrink-0">
                <button onClick={() => setActiveCategory(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-gray-600" /></button>
                <h1 className="text-2xl ml-4 capitalize text-blue-900 font-extrabold flex-1">{activeCategory}</h1>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {displayedItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 pb-4">
                    {displayedItems.map((item) => (
                        <div key={item.id} className="bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl flex flex-col items-center text-center shadow-sm">
                          <ItemDisplay iconName={item.icon_name} category={item.category} size={48} />
                          <h2 className="text-sm font-extrabold text-gray-800 mb-1 leading-tight">{item.name}</h2>
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold mb-3"><Coins size={14} /> {item.price}</div>
                          <button onClick={() => buyItem(item)} disabled={isBuying} className="w-full py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-xl text-sm font-extrabold transition-all active:scale-95 shadow-md shadow-blue-200">Beli</button>
                        </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10"><span className="text-5xl mb-4 opacity-50">📦</span><p className="text-gray-500 font-bold">Belum ada stok nih.</p></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <NavigationBar />
    </main>
  );
}