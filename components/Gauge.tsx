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
    const duration = 1200;

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
    <div className="text-center">
      <svg viewBox="0 0 240 150" width="240" height="150">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="35%" stopColor="#059669" />
            <stop offset="65%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d="M 28 135 A 90 90 0 0 1 212 135"
          fill="none"
          stroke="#1e293b"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Coloured arc */}
        <path
          d="M 28 135 A 90 90 0 0 1 212 135"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${arc} 283`}
        />

        {/* Needle */}
        <g transform={`rotate(${angle}, 120, 135)`}>
          <line
            x1="120"
            y1="135"
            x2="120"
            y2="55"
            stroke="#f8fafc"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="120" cy="135" r="8" fill="#f8fafc" />
          <circle cx="120" cy="135" r="5" fill="#0f172a" />
        </g>

        <text
          x="120"
          y="126"
          textAnchor="middle"
          fontSize="26"
          fontWeight="900"
          fill={risk.color}
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {(display * 100).toFixed(0)}%
        </text>
        <text
          x="120"
          y="143"
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          letterSpacing="1"
        >
          MALIGNANCY PROB.
        </text>
      </svg>

      {/* Risk badge — dynamic colour from JS so kept as inline style */}
      <div
        className="inline-block px-5 py-1.5 rounded-full text-sm font-bold tracking-widest"
        style={{
          background: risk.bg,
          color: risk.color,
          border: `1.5px solid ${risk.border}`,
        }}
      >
        {risk.emoji} {risk.level}
      </div>
    </div>
  );
}
