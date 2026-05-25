"use client";
import { User, Utensils, Zap, Heart, Droplets, LogOut, Bell, Check, CalendarCheck, PenLine } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserXp, UserXp } from "@/lib/xp";
import LevelBadge from "@/components/xp/LevelBadge";
import CheckinPopup from "@/components/checkin/CheckinPopup";
import PetSetupPopup from "@/components/game/PetSetupPopup";
import {
  getUnreadNotificationCount,
  getNotifications,
  markAllNotificationsRead,
  Notification,
} from "@/lib/leaderboard";

export default function TopBar({ pet }: { pet: any }) {
  const currentPet = pet || { coins: 0, hunger: 0, energy: 0, happiness: 0, cleanliness: 0 };
  
  // State buat ngatur Dropdown dan nyimpen Email
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userEmail, setUserEmail] = useState("Loading...");
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [userXp, setUserXp] = useState<UserXp | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showEditPet, setShowEditPet] = useState(false);
  const router = useRouter();

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "User");
          setUserId(user.id);
          // Fetch XP data
          try {
            const xp = await getUserXp(user.id);
            setUserXp(xp);
          } catch {
            // Tabel belum ada, skip
          }
        }
      } catch {
        setUserEmail("User");
      }
    };
    fetchUser();
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    const count = await getUnreadNotificationCount(userId);
    setUnreadCount(count);
  }, [userId]);

  // Polling notifikasi setiap 30 detik
  useEffect(() => {
    if (!userId) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowDropdown(false);

    if (!showNotifications && userId) {
      setLoadingNotifications(true);
      try {
        const notifs = await getNotifications(userId);
        setNotifications(notifs);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsRead(userId);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

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
      
      {/* KIRI: Foto Profil, Notifikasi & Koin */}
      <div className="flex items-center gap-4">
        
        {/* Wrapper Profil + Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
            }}
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
              
              {/* Tombol Edit Pet */}
              <button 
                onClick={() => { setShowEditPet(true); setShowDropdown(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm font-bold text-purple-500 hover:bg-purple-50 hover:text-purple-600 transition-colors border-b border-gray-100"
              >
                <PenLine size={16} />
                Edit Pet (300 🪙)
              </button>

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

        {/* Tombol Notifikasi */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="relative bg-gray-100 hover:bg-gray-200 transition-colors p-2.5 rounded-full text-gray-600"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notifikasi */}
          {showNotifications && (
            <div className="absolute top-14 left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">📬 Notifikasi</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1"
                  >
                    <Check size={14} />
                    Tandai Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Memuat...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gray-50 ${
                        !notif.is_read ? "bg-blue-50" : ""
                      }`}
                    >
                      <p className="text-sm text-gray-800">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Koin */}
        <div className="bg-yellow-100 px-5 py-2.5 rounded-2xl border-2 border-yellow-400 flex items-center shadow-sm">
          <span className="text-yellow-600 font-extrabold text-lg">💰 {currentPet.coins}</span>
        </div>

        {/* Level Badge */}
        {userXp && (
          <LevelBadge level={userXp.currentLevel} size="md" />
        )}

        {/* Check-in Button */}
        <button
          onClick={() => { setShowCheckin(true); setShowDropdown(false); setShowNotifications(false); }}
          className="bg-green-100 hover:bg-green-200 transition-colors p-2.5 rounded-full text-green-600"
          title="Daily Check-in"
        >
          <CalendarCheck size={22} />
        </button>
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

      {/* Check-in Popup */}
      {showCheckin && userId && (
        <CheckinPopup
          userId={userId}
          onClose={() => setShowCheckin(false)}
          onXpGained={async () => {
            try {
              const xp = await getUserXp(userId);
              setUserXp(xp);
            } catch {}
          }}
        />
      )}

      {/* Edit Pet Popup */}
      {showEditPet && userId && (
        <PetSetupPopup
          userId={userId}
          mode="edit"
          currentName={currentPet.name || ""}
          currentColor={currentPet.body_color || "#60a5fa"}
          currentCoins={currentPet.coins || 0}
          onClose={() => setShowEditPet(false)}
          onComplete={() => {
            setShowEditPet(false);
            window.location.reload();
          }}
        />
      )}
    </nav>
  );
}