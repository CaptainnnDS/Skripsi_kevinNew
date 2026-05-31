"use client";
import { Home, BookOpen, PenSquare, Trophy, Store } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { showWarning } from "@/lib/alert";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/learn", icon: BookOpen, label: "Learn" },
  { path: "/quiz", icon: PenSquare, label: "Quiz" },
  { path: "/leaderboard", icon: Trophy, label: "Rank" },
  { path: "/shop", icon: Store, label: "Shop" },
];

const SLEEP_BLOCKED = new Set(["/learn", "/quiz"]);

function isActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const glareRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ x: 0, width: 0 });
  const [ready, setReady] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("pets").select("is_sleeping").eq("user_id", session.user.id).limit(1).single()
        .then(({ data }) => { if (data) setIsSleeping(data.is_sleeping); });
    });
  }, [pathname]);

  const activeIndex = navItems.findIndex((item) => isActive(pathname, item.path));

  const updatePill = useCallback(() => {
    const btn = itemsRef.current[activeIndex];
    if (!btn || !navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({
      x: btnRect.left - navRect.left,
      width: btnRect.width,
    });
  }, [activeIndex]);

  useEffect(() => {
    updatePill();
    setReady(true);
  }, [updatePill]);

  useEffect(() => {
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!navRef.current || !glareRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    glareRef.current.style.setProperty("--gx", `${e.clientX - rect.left}px`);
    glareRef.current.style.setProperty("--gy", `${e.clientY - rect.top}px`);
  };

  return (
    <nav
      ref={navRef}
      onPointerMove={handlePointerMove}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center p-[6px] rounded-[99px] select-none group"
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(50px) saturate(200%)",
        WebkitBackdropFilter: "blur(50px) saturate(200%)",
        boxShadow: [
          "0 30px 60px -15px rgba(0,0,0,0.12)",
          "0 8px 24px -8px rgba(0,0,0,0.08)",
          "inset 0 1.5px 2px -0.5px rgba(255,255,255,0.7)",
          "inset 0 -1.5px 3px -1px rgba(255,255,255,0.3)",
          "inset 0 0 0 1px rgba(255,255,255,0.35)",
        ].join(", "),
      }}
    >
      {/* Reflection overlay */}
      <div
        className="absolute top-[1px] left-[1px] right-[1px] h-[46%] rounded-[99px_99px_20px_20px] pointer-events-none z-[6]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Glare effect */}
      <div className="absolute inset-0 rounded-[99px] overflow-hidden pointer-events-none z-[5]">
        <div
          ref={glareRef}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle 70px at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.45) 0%, transparent 100%)",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      {/* Items container */}
      <div className="relative flex items-center gap-[2px] z-[3]">
        {/* Sliding pill */}
        <div
          className="absolute top-0 left-0 h-full rounded-[99px] z-[1]"
          style={{
            width: pillStyle.width,
            transform: `translateX(${pillStyle.x}px)`,
            transition: ready
              ? "transform 0.5s cubic-bezier(0.34,1.2,0.64,1), width 0.5s cubic-bezier(0.34,1.2,0.64,1)"
              : "none",
            background: "rgba(255,255,255,0.65)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)",
          }}
        />

        {navItems.map((item, i) => {
          const active = i === activeIndex;
          const Icon = item.icon;
          const blocked = isSleeping && SLEEP_BLOCKED.has(item.path);
          return (
            <button
              key={item.path}
              ref={(el) => { itemsRef.current[i] = el; }}
              onClick={() => {
                if (blocked) {
                  showWarning("💤 Pet lagi tidur! Bangunin dulu di Bedroom.");
                  return;
                }
                router.push(item.path);
              }}
              className="relative z-[2] flex items-center justify-center gap-[6px] h-[42px] rounded-[99px] border-none bg-transparent cursor-pointer transition-colors duration-300 active:scale-[0.92]"
              style={{ padding: active ? "0 18px" : "0 14px" }}
            >
              <Icon
                size={20}
                className={`transition-colors duration-300 ${active ? "text-gray-900" : blocked ? "text-gray-900/25" : "text-gray-900/40"}`}
                strokeWidth={active ? 2.4 : 2}
              />
              {active && (
                <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                  {item.label}
                </span>
              )}
              {blocked && !active && (
                <span className="absolute -top-1 -right-1 text-[10px] leading-none">💤</span>
              )}
            </button>
          );
        })}
      </div>

    </nav>
  );
}
