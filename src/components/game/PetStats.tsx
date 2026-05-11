"use client";
import { motion } from "framer-motion";
import { Heart, Zap, Droplets, UtensilsCrossed } from "lucide-react";

const stats = [
  { key: "hunger" as const, label: "Hunger", icon: UtensilsCrossed, color: "bg-orange-500" },
  { key: "happiness" as const, label: "Happiness", icon: Heart, color: "bg-pink-500" },
  { key: "energy" as const, label: "Energy", icon: Zap, color: "bg-yellow-400" },
  { key: "cleanliness" as const, label: "Clean", icon: Droplets, color: "bg-blue-400" },
];

interface PetStatsProps {
  pet: any;
}

export default function PetStats({ pet }: PetStatsProps) {
  if (!pet) return null;

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {stats.map((stat) => {
        const value = pet[stat.key] || 0; // Ambil nilai dari data pet
        const Icon = stat.icon;
        
        return (
          <div key={stat.key} className="bg-white/60 p-3 rounded-2xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500">{stat.label}</span>
              <span className="text-xs font-bold text-gray-700 ml-auto">{value}%</span>
            </div>
            {/* Background Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              {/* Bar yang jalan */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${stat.color}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}