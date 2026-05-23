"use client";
import { Home, BookOpen, PenSquare, Trophy, Store } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
  activeColor: string;
  activeBg: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, label: "Home", activeColor: "text-blue-600", activeBg: "bg-blue-100" },
  { path: "/learn", icon: BookOpen, label: "Learn", activeColor: "text-green-600", activeBg: "bg-green-100" },
  { path: "/quiz", icon: PenSquare, label: "Quiz", activeColor: "text-orange-600", activeBg: "bg-orange-100" },
  { path: "/leaderboard", icon: Trophy, label: "Rank", activeColor: "text-amber-600", activeBg: "bg-amber-100" },
  { path: "/shop", icon: Store, label: "Shop", activeColor: "text-purple-600", activeBg: "bg-purple-100" },
];

/**
 * Active state detection.
 * - "/" hanya match pathname tepat "/"
 * - "/learn" match "/learn", "/learn/[id]"
 * - "/quiz" match "/quiz", "/quiz/[materiId]"
 * - dst.
 */
function isActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/") return pathname === "/";
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t-2 border-blue-100 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-2xl mx-auto flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(pathname, item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 flex-1 py-1 group transition-transform active:scale-95"
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  active
                    ? `${item.activeBg} scale-110`
                    : "bg-transparent group-hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={22}
                  className={active ? item.activeColor : "text-gray-400"}
                />
              </div>
              <span
                className={`text-[10px] font-bold tracking-wide ${
                  active ? item.activeColor : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
