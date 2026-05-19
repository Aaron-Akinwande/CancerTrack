"use client";

import type { AnalysisResult } from "@/types";
import { getRisk, getClinicalInterpretation } from "@/lib/model";
import {
  SCALER_MEAN,
  SCALER_STD,
  FEATURE_LABELS,
  SYMPTOM_WEIGHTS,
} from "@/lib/constants";
import { downloadCsv } from "@/lib/exportCsv";
import { Gauge } from "./Gauge";
import { Bar } from "./Bar";
import { DecisionPath } from "./DecisionPath";

interface ResultsStepProps {
  result: AnalysisResult;
  onReset: () => void;
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ResultsStep({ result, onReset }: ResultsStepProps) {
  const risk = getRisk(result.ensemble);

  const ensembleRows = [
    {
      label: "Logistic Regression",
      val: result.lrProb,
      color: "#38bdf8",
      weight: "50%",
    },
    {
      label: "Decision Tree",
      val: result.dtResult.prob,
      color: "#a78bfa",
      weight: "35%",
    },
    {
      label: "Clinical Modifier",
      val: Math.max(0, Math.min(1, 0.5 + result.modifier)),
      color: "#fb923c",
      weight: "15%",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* ── Top toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-50 font-serif">
            Analysis Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {result.patientName} · Age {result.age || "N/A"} ·{" "}
            {result.timestamp}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCsv(result)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-800
                       bg-emerald-950 text-emerald-400 text-sm font-bold cursor-pointer
                       hover:bg-emerald-900 transition-colors"
          >
            ⬇ CSV Report
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-transparent
                       text-slate-400 text-sm font-bold cursor-pointer hover:border-slate-500
                       hover:text-slate-300 transition-all"
          >
            + New Patient
          </button>
        </div>
      </div>

      {/* ── Main result: Gauge + ensemble side by side (stack on mobile) ── */}
      <div
        className="bg-slate-900 rounded-2xl border p-5 sm:p-8"
        style={{ borderColor: risk.border }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 items-center">
          {/* Gauge — centred on its own row on mobile */}
          <div className="flex justify-center">
            <Gauge prob={result.ensemble} animate />
          </div>

          {/* Ensemble breakdown */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase mb-3">
              Ensemble Breakdown
            </p>

            {ensembleRows.map((r, i) => (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between items-baseline mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{r.label}</span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {r.weight}
                    </span>
                  </div>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: r.color }}
                  >
                    {(r.val * 100).toFixed(1)}%
                  </span>
                </div>
                <Bar value={r.val} color={r.color} delay={i * 180} />
              </div>
            ))}

            {/* Ensemble total */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm font-bold text-slate-100">
                  Final Ensemble
                </span>
                <span
                  className="text-base font-black tabular-nums"
                  style={{ color: risk.color }}
                >
                  {(result.ensemble * 100).toFixed(1)}%
                </span>
              </div>
              <Bar value={result.ensemble} color={risk.color} delay={500} />
            </div>
          </div>
        </div>

        {/* Clinical interpretation banner */}
        <div
          className="mt-6 rounded-xl px-5 py-4"
          style={{
            background: `${risk.color}10`,
            border: `1.5px solid ${risk.border}`,
          }}
        >
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.15em] uppercase mb-1.5">
            Clinical Interpretation
          </p>
          <p
            className="text-base sm:text-lg font-black leading-snug mb-2"
            style={{ color: risk.color }}
          >
            {getClinicalInterpretation(result.ensemble)}
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            Based on{" "}
            <strong style={{ color: risk.color }}>
              {(result.ensemble * 100).toFixed(1)}%
            </strong>{" "}
            ensemble probability · {result.activeSymptoms.length} symptom(s) ·
            tumour measurements · age-adjusted risk
          </p>
        </div>
      </div>

      {/* ── Two-column section row on tablet+ ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Decision tree path */}
        <SectionCard title="Decision Tree Path">
          <DecisionPath path={result.dtResult.path} />
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`text-sm font-black ${result.dtResult.malignant ? "text-rose-400" : "text-emerald-400"}`}
            >
              {result.dtResult.malignant ? "⬡ Malignant" : "✓ Benign"}
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">
              Node confidence:{" "}
              <strong className="text-slate-300">
                {(result.dtResult.prob * 100).toFixed(0)}%
              </strong>
            </span>
          </div>
        </SectionCard>

        {/* Active symptoms */}
        <SectionCard
          title={`Clinical Risk Factors (${result.activeSymptoms.length} active)`}
        >
          {result.activeSymptoms.length === 0 ? (
            <p className="text-sm text-slate-600 italic">
              No symptoms selected.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.activeSymptoms.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                             font-bold bg-amber-950/60 border border-amber-900/60 text-amber-400"
                >
                  <span className="text-amber-600">+</span>
                  {(SYMPTOM_WEIGHTS[s] * 0.4 * 100).toFixed(0)}%
                  <span className="text-amber-600">·</span>
                  {s.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Feature values grid ── */}
      <SectionCard title="Input Features — Standardized (z-score)">
        {/* 5-col on md+, 2-col on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {FEATURE_LABELS.map((label, i) => {
            const raw = result.features[i];
            const z = (raw - SCALER_MEAN[i]) / SCALER_STD[i];
            const isHigh = z > 1.5;
            const isLow = z < -1.5;
            return (
              <div
                key={label}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl border text-center
                  ${
                    isHigh
                      ? "bg-rose-950/60 border-rose-900"
                      : isLow
                        ? "bg-sky-950/40  border-sky-900/50"
                        : "bg-slate-800   border-slate-700"
                  }
                `}
              >
                <div className="text-[9px] text-slate-500 tracking-wider uppercase mb-1.5 leading-tight">
                  {label}
                </div>
                <div
                  className={`text-sm font-black tabular-nums ${
                    isHigh
                      ? "text-rose-400"
                      : isLow
                        ? "text-sky-400"
                        : "text-slate-300"
                  }`}
                >
                  {raw.toFixed(3)}
                </div>
                <div
                  className={`text-[10px] mt-1 font-mono ${
                    isHigh
                      ? "text-rose-600"
                      : isLow
                        ? "text-sky-700"
                        : "text-slate-700"
                  }`}
                >
                  z={z >= 0 ? "+" : ""}
                  {z.toFixed(2)}
                </div>
                {isHigh && (
                  <div className="mt-1 text-[9px] text-rose-500 font-bold tracking-wide">
                    ELEVATED
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-700 mt-3 italic">
          Red = z &gt; +1.5 (elevated). Blue = z &lt; −1.5 (below mean). Both
          flag clinically notable values.
        </p>
      </SectionCard>

      {/* ── Disclaimer ── */}
      <div
        className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-4
                      text-xs sm:text-sm text-slate-600 leading-relaxed"
      >
        <strong className="text-slate-500">⚠ Disclaimer: </strong>
        This tool is for academic demonstration only. It is not a medical device
        and must not be used for clinical diagnosis. Model trained on the
        Wisconsin Breast Cancer Dataset (UCI ML Repository). Always consult a
        qualified oncologist for medical decisions. LASU Computer Science ·
        Final Year Project 2025.
      </div>
    </div>
  );
}
