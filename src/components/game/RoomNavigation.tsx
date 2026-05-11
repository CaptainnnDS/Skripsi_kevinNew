"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// Daftar urutan ruangan (Looping)
const rooms = [
  { path: "/", name: "Home" },
  { path: "/bedroom", name: "Bedroom" },
  { path: "/bathroom", name: "Bathroom" },
  { path: "/quiz", name: "Quiz" },
  { path: "/learn", name: "Learn" },
  { path: "/kitchen", name: "Kitchen" },
  { path: "/shop", name: "Shop" },
];

export default function RoomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Cari posisi ruangan kita sekarang ada di nomor berapa
  const currentIndex = rooms.findIndex((r) => r.path === pathname);
  
  // Kalau ternyata halaman gak ada di daftar (misal pas lagi di /login), jangan tampilin panah
  if (currentIndex === -1) return null;

  // Logika Looping: Kalau mentok kiri balik ke kanan, kalau mentok kanan balik ke kiri
  const prevIndex = currentIndex === 0 ? rooms.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === rooms.length - 1 ? 0 : currentIndex + 1;

  return (
    <>
      {/* Panah KIRI */}
      <button 
        onClick={() => router.push(rooms[prevIndex].path)}
        className="fixed left-8 top-1/2 -translate-y-1/2 p-5 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-xl border-4 border-blue-100 transition-all hover:scale-110 z-40 group"
      >
        <ChevronLeft size={40} className="text-blue-400 group-hover:text-blue-600" />
        {/* Tooltip nama ruangan tujuan */}
        <span className="absolute left-20 bg-gray-900 text-white font-bold text-sm py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
          Ke {rooms[prevIndex].name}
        </span>
      </button>

      {/* Panah KANAN */}
      <button 
        onClick={() => router.push(rooms[nextIndex].path)}
        className="fixed right-8 top-1/2 -translate-y-1/2 p-5 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-xl border-4 border-blue-100 transition-all hover:scale-110 z-40 group"
      >
        <ChevronRight size={40} className="text-blue-400 group-hover:text-blue-600" />
        {/* Tooltip nama ruangan tujuan */}
        <span className="absolute right-20 bg-gray-900 text-white font-bold text-sm py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
          Ke {rooms[nextIndex].name}
        </span>
      </button>
    </>
  );
}