"use client";

import { useState, useEffect } from "react";

interface BarProps {
  value: number; // 0–1
  color: string;
  delay?: number;
  showLabel?: boolean;
}

export function Bar({ value, color, delay = 0, showLabel = false }: BarProps) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(value * 100, 100)), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="relative bg-slate-800 rounded-full h-2.5 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width 0.9s cubic-bezier(0.34,1.2,0.64,1)",
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
}
