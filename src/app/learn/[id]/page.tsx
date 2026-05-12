"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/game/TopBar";
import NavigationBar from "@/components/game/NavigationBar";
import RoomNavigation from "@/components/game/RoomNavigation";
import PdfViewer from "@/components/learn/PdfViewer";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Fredoka } from "next/font/google";

const funFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

interface Materi {
  id: number;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  duration: string;
  total_lessons: number;
  pdf_url: string;
  is_locked: boolean;
}

export default function LearnDetail() {
  const router = useRouter();
  const params = useParams();
  const materiId = params.id as string;

  const [petData, setPetData] = useState<any>(null);
  const [materi, setMateri] = useState<Materi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch pet data
      const { data: pets, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1);

      if (petError) {
        console.log("Error fetching pet:", petError.message);
      }

      if (pets && pets.length > 0) {
        setPetData(pets[0]);
      } else {
        router.push("/");
        return;
      }

      // Fetch materi by id
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select("*")
        .eq("id", materiId)
        .single();

      if (materiError || !materiData) {
        setError("Materi tidak ditemukan.");
        setIsLoading(false);
        return;
      }

      if (materiData.is_locked) {
        setError("Materi ini masih terkunci. Selesaikan materi sebelumnya dulu!");
        setIsLoading(false);
        return;
      }

      setMateri(materiData);
      setIsLoading(false);
    };

    loadData();
  }, [router, materiId]);

  // Loading state
  if (isLoading || !petData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-blue-900">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="font-bold animate-pulse">Memuat materi...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-hidden">
        <TopBar pet={petData} />
        <RoomNavigation />

        <div className="flex-1 flex flex-col items-center justify-center px-16 py-4 relative z-10">
          <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-red-100 text-center max-w-md w-full">
            <span className="text-5xl block mb-3">😢</span>
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={() => router.push("/learn")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Materi
            </button>
          </div>
        </div>

        <NavigationBar />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-blue-50 text-gray-900 pb-24 relative overflow-hidden">
      <TopBar pet={petData} />
      <RoomNavigation />

      <div className="flex-1 flex flex-col px-16 py-4 relative z-10">
        {/* Back button + Materi info */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/learn")}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{materi!.icon}</span>
            <div>
              <h1 className={`text-xl font-bold text-blue-900 ${funFont.className}`}>
                {materi!.title}
              </h1>
              <p className="text-xs text-gray-500">{materi!.description}</p>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <PdfViewer pdfUrl={materi!.pdf_url} title={materi!.title} />
      </div>

      <NavigationBar />
    </main>
  );
}
