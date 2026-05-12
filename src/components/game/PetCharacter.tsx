"use client";
import { useRef, useEffect, useState } from 'react';

interface PetCharacterProps {
  petData?: any; 
  petMood?: "happy" | "neutral" | "sad" | "excited";
  isSleeping?: boolean; 
}

export default function PetCharacter({ petData, petMood = "happy", isSleeping = false }: PetCharacterProps) {
  const petContainerRef = useRef<HTMLDivElement>(null);
  const leftPupilGroupRef = useRef<SVGGElement>(null);
  const rightPupilGroupRef = useRef<SVGGElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  // AMBIL WARNA DARI DATABASE (Default ke ungu pastel kalo data belum ada)
  const baseColor = petData?.body_color || "#A7B3E6"; 
  const outlineColor = "#2C2B4D";

  useEffect(() => {
    if (isSleeping) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!petContainerRef.current) return;
      const containerRect = petContainerRef.current.getBoundingClientRect();
      const containerW = containerRect.width;
      const mouseRelX_svg = ((e.clientX - (containerRect.left + containerW / 2)) / containerW) * 100;
      const mouseRelY_svg = ((e.clientY - (containerRect.top + containerRect.height / 2)) / containerRect.height) * 100;

      const movePupil = (pupilGroupRef: React.RefObject<SVGGElement | null>, offsetFromCenterSVG_X: number, eyeSocketRadius_svg: number, pupilGroupRadius_svg: number) => {
        if (!pupilGroupRef.current) return;
        const dx = mouseRelX_svg - offsetFromCenterSVG_X;
        const dy = mouseRelY_svg + 15; 
        const angle = Math.atan2(dy, dx);
        const maxMoveMag = eyeSocketRadius_svg - pupilGroupRadius_svg;
        const currentMag = Math.sqrt(dx * dx + dy * dy);
        const pupilMag = Math.min(currentMag, maxMoveMag);
        pupilGroupRef.current.style.transform = `translate(${Math.cos(angle) * pupilMag}px, ${Math.sin(angle) * pupilMag}px)`;
      };

      movePupil(leftPupilGroupRef, -20, 20, 12);
      movePupil(rightPupilGroupRef, 20, 20, 12);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isSleeping]);

  const getMouthPath = () => {
    if (isSleeping) return "M 46 65 Q 50 68, 54 65"; 
    if (isDraggedOver) return "M 36 62 Q 50 84, 64 62 Q 50 68, 36 62 Z"; 
    switch (petMood) {
      case "happy": return "M 44 65 Q 47 70, 50 65 Q 53 70, 56 65"; 
      case "excited": return "M 40 60 Q 50 80, 60 60 Q 50 70, 40 60 Z"; 
      case "sad": return "M 44 68 Q 50 60, 56 68"; 
      case "neutral": return "M 45 65 H 55"; 
      default: return "M 44 65 Q 47 70, 50 65 Q 53 70, 56 65";
    }
  };

  return (
    <div ref={petContainerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[200px] drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          {` @keyframes floatZ { 0% { opacity: 0; transform: translate(0, 0px) scale(0.8); } 50% { opacity: 1; transform: translate(5px, -10px) scale(1.1); } 100% { opacity: 0; transform: translate(10px, -20px) scale(1.4); } } .anim-z1 { animation: floatZ 2s infinite ease-in-out; } .anim-z2 { animation: floatZ 2s infinite ease-in-out 0.6s; } .anim-z3 { animation: floatZ 2s infinite ease-in-out 1.2s; } `}
        </style>

        <circle cx="20" cy="20" r="14" fill={baseColor} stroke={outlineColor} strokeWidth="2.5" />
        <circle cx="80" cy="20" r="14" fill={baseColor} stroke={outlineColor} strokeWidth="2.5" />
        <path d="M 15 88 C 5 88, 0 98, 20 98 C 30 98, 30 88, 15 88 Z" fill={baseColor} stroke={outlineColor} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 85 88 C 95 88, 100 98, 80 98 C 70 98, 70 88, 85 88 Z" fill={baseColor} stroke={outlineColor} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="50" cy="60" r="38" fill={baseColor} stroke={outlineColor} strokeWidth="2.5" />
        <path d="M 15 60 C 15 25, 85 25, 85 60 C 85 80, 50 90, 15 60 Z" fill="#FFFFFF" />
        <circle cx="50" cy="60" r="38" fill="none" stroke={outlineColor} strokeWidth="2.5" />
        <rect x="36" y="70" width="8" height="15" rx="4" fill={baseColor} stroke={outlineColor} strokeWidth="2" />
        <rect x="56" y="70" width="8" height="15" rx="4" fill={baseColor} stroke={outlineColor} strokeWidth="2" />

        {!isSleeping ? (
          <>
            <circle cx="32" cy="40" r="18" fill="white" stroke={outlineColor} strokeWidth="2.5" />
            <circle cx="68" cy="40" r="18" fill="white" stroke={outlineColor} strokeWidth="2.5" />
            <g ref={leftPupilGroupRef} style={{ transition: 'transform 0.05s linear' }}>
              <circle cx="32" cy="40" r="12" fill={outlineColor} />
              <circle cx="35" cy="37" r="4.5" fill="#00BFFF" />
              <circle cx="35" cy="36" r="1" fill="white" />
              <circle cx="28" cy="44" r="1.5" fill="white" />
            </g>
            <g ref={rightPupilGroupRef} style={{ transition: 'transform 0.05s linear' }}>
              <circle cx="68" cy="40" r="12" fill={outlineColor} />
              <circle cx="71" cy="37" r="4.5" fill="#00BFFF" />
              <circle cx="71" cy="36" r="1" fill="white" />
              <circle cx="64" cy="44" r="1.5" fill="white" />
            </g>
          </>
        ) : (
          <>
            <path d="M 18 45 Q 32 55, 46 45" stroke={outlineColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 54 45 Q 68 55, 82 45" stroke={outlineColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <g fill={outlineColor} className="font-bold" style={{ fontFamily: 'sans-serif' }}>
              <text x="65" y="25" fontSize="8" className="anim-z1">Z</text>
              <text x="75" y="15" fontSize="12" className="anim-z2">Z</text>
              <text x="88" y="5" fontSize="16" className="anim-z3">Z</text>
            </g>
          </>
        )}
        <path d="M 48 55 L 52 55 L 50 58 Z" fill={outlineColor} stroke={outlineColor} strokeWidth="1" strokeLinejoin="round" />
        <path d={getMouthPath()} stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" fill={(!isSleeping && (isDraggedOver || petMood === 'excited')) ? "#FF9EAA" : "none"} />
        {!isSleeping && (
          <circle cx="50" cy="65" r="20" fill="transparent" onDragEnter={() => setIsDraggedOver(true)} onDragLeave={() => setIsDraggedOver(false)} onDrop={() => setIsDraggedOver(false)} onDragOver={(e) => e.preventDefault()} />
        )}
      </svg>
    </div>
  );
}