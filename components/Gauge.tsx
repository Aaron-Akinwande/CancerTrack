"use client";

import { useState, useEffect } from "react";
import { getRisk } from "@/lib/model";

interface GaugeProps {
  prob: number;
  animate: boolean;
}

export function Gauge({ prob, animate }: GaugeProps) {
  const [display, setDisplay] = useState(0);
  const [arc, setArc] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let start: number | null = null;
    const duration = 1300;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(prob * ease);
      setArc(prob * ease * 251);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [prob, animate]);

  const risk = getRisk(display);
  const angle = -135 + display * 270;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG scales with its container via viewBox */}
      <svg viewBox="0 0 240 155" className="w-full max-w-[260px]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="33%" stopColor="#059669" />
            <stop offset="66%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = (-135 + t * 270) * (Math.PI / 180);
          const r1 = 76,
            r2 = 83;
          return (
            <line
              key={t}
              x1={120 + r1 * Math.cos(a)}
              y1={135 + r1 * Math.sin(a)}
              x2={120 + r2 * Math.cos(a)}
              y2={135 + r2 * Math.sin(a)}
              stroke="#334155"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}

        {/* Track */}
        <path
          d="M 28 135 A 92 92 0 0 1 212 135"
          fill="none"
          stroke="#1e293b"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Coloured arc */}
        <path
          d="M 28 135 A 92 92 0 0 1 212 135"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${arc} 290`}
          filter="url(#glow)"
        />

        {/* Needle */}
        <g transform={`rotate(${angle}, 120, 135)`}>
          <line
            x1="120"
            y1="138"
            x2="120"
            y2="58"
            stroke="#f1f5f9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle
            cx="120"
            cy="135"
            r="9"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle cx="120" cy="135" r="4" fill="#f1f5f9" />
        </g>

        {/* Percentage */}
        <text
          x="120"
          y="124"
          textAnchor="middle"
          fontSize="28"
          fontWeight="900"
          fill={risk.color}
          fontFamily="Georgia, serif"
        >
          {(display * 100).toFixed(0)}%
        </text>
        <text
          x="120"
          y="148"
          textAnchor="middle"
          fontSize="9"
          fill="#475569"
          letterSpacing="2"
        >
          MALIGNANCY PROBABILITY
        </text>

        {/* Scale labels */}
        <text x="22" y="150" fontSize="8" fill="#475569" textAnchor="middle">
          0%
        </text>
        <text x="218" y="150" fontSize="8" fill="#475569" textAnchor="middle">
          100%
        </text>
      </svg>

      {/* Risk badge */}
      <div
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black tracking-widest"
        style={{
          background: risk.bg,
          color: risk.color,
          border: `2px solid ${risk.border}`,
        }}
      >
        <span className="text-base">{risk.emoji}</span>
        {risk.level}
      </div>
    </div>
  );
}
