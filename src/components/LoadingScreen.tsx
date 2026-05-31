export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-green-200" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-green-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-green-700/70">Memuat...</p>
      </div>
    </div>
  );
}
