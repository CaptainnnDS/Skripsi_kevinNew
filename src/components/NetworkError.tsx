"use client";
import { WifiOff, RotateCcw } from "lucide-react";


interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function NetworkError({ message = "Gagal memuat data. Periksa koneksi internet Anda.", onRetry }: NetworkErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md border-2 border-red-100 text-center max-w-sm w-full">
        <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Koneksi Bermasalah
        </h2>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}
