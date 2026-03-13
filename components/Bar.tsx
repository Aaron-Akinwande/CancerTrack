"use client";

import { useState, useEffect } from "react";

interface BarProps {
  value: number; // 0–1
  color: string;
  delay?: number;
}

export function Bar({ value, color, delay = 0 }: BarProps) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(value * 100, 100)), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="bg-slate-800 rounded h-2 overflow-hidden">
      <div
        className="h-full rounded"
        style={{
          width: `${w}%`,
          background: color,
          transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
    </div>
  );
}
