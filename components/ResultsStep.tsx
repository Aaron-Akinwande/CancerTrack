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

export function ResultsStep({ result, onReset }: ResultsStepProps) {
  const risk = getRisk(result.ensemble);

  const ensembleRows = [
    { label: "Logistic Regression", val: result.lrProb, color: "#38bdf8" },
    { label: "Decision Tree", val: result.dtResult.prob, color: "#a78bfa" },
    {
      label: "Clinical Modifier",
      val: Math.max(0, Math.min(1, 0.5 + result.modifier)),
      color: "#fb923c",
    },
    { label: "Final Ensemble", val: result.ensemble, color: risk.color },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Main result card ── */}
      <div
        className="bg-slate-900 rounded-2xl p-8"
        style={{ border: `1px solid ${risk.border}` }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-7">
          <div>
            <h2
              className="text-2xl font-black text-slate-50 mb-1"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Analysis Report
            </h2>
            <p className="text-sm text-slate-500">
              {result.patientName} · Age {result.age || "N/A"} ·{" "}
              {result.timestamp}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => downloadCsv(result)}
              title="Download full report as CSV"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-800
                         bg-green-950 text-green-400 text-sm font-bold cursor-pointer
                         hover:bg-green-900 transition-colors"
            >
              ⬇ Download CSV
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-transparent
                         text-slate-400 text-sm font-bold cursor-pointer
                         hover:border-slate-500 transition-colors"
            >
              + New Patient
            </button>
          </div>
        </div>

        {/* Gauge + breakdown */}
        <div className="grid grid-cols-2 gap-8 items-center mb-7">
          <Gauge prob={result.ensemble} animate />

          <div>
            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">
              Ensemble Breakdown
            </p>
            {ensembleRows.map((r, i) => (
              <div key={r.label} className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span
                    className={`text-sm ${i === 3 ? "text-slate-100 font-bold" : "text-slate-400"}`}
                  >
                    {r.label}
                  </span>
                  <span
                    className="text-sm font-black"
                    style={{ color: r.color, fontFamily: "'Georgia', serif" }}
                  >
                    {(r.val * 100).toFixed(1)}%
                  </span>
                </div>
                <Bar value={r.val} color={r.color} delay={i * 150} />
              </div>
            ))}
          </div>
        </div>

        {/* Clinical interpretation */}
        <div
          className="rounded-xl px-6 py-5"
          style={{
            background: `${risk.color}14`,
            border: `1.5px solid ${risk.border}`,
          }}
        >
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">
            Clinical Interpretation
          </p>
          <p
            className="text-lg font-black mb-2"
            style={{ color: risk.color, fontFamily: "'Georgia', serif" }}
          >
            {getClinicalInterpretation(result.ensemble)}
          </p>
          <p className="text-sm text-slate-500 m-0">
            Ensemble probability:{" "}
            <strong style={{ color: risk.color }}>
              {(result.ensemble * 100).toFixed(1)}%
            </strong>{" "}
            · Based on {result.activeSymptoms.length} reported symptom(s) +
            tumour measurements + age-adjusted risk
          </p>
        </div>
      </div>

      {/* ── Decision tree path ── */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">
          Decision Tree Path Taken
        </p>
        <DecisionPath path={result.dtResult.path} />
        <p className="mt-3 text-sm text-slate-500">
          Tree verdict:{" "}
          <strong
            style={{ color: result.dtResult.malignant ? "#ef4444" : "#4ade80" }}
          >
            {result.dtResult.malignant ? "Malignant" : "Benign"}
          </strong>{" "}
          · Node confidence: {(result.dtResult.prob * 100).toFixed(0)}%
        </p>
      </div>

      {/* ── Active symptoms ── */}
      {result.activeSymptoms.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">
            Clinical Risk Factors Applied
          </p>
          <div className="flex flex-wrap gap-2">
            {result.activeSymptoms.map((s) => (
              <span
                key={s}
                className="px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800
                           border border-orange-900 text-orange-400"
              >
                +{(SYMPTOM_WEIGHTS[s] * 0.4 * 100).toFixed(0)}% ·{" "}
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Feature values (standardized) ── */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-5">
          Input Features (Standardized)
        </p>
        <div className="grid grid-cols-5 gap-3">
          {FEATURE_LABELS.map((label, i) => {
            const raw = result.features[i];
            const z = (raw - SCALER_MEAN[i]) / SCALER_STD[i];
            const isHigh = z > 1.5;
            return (
              <div
                key={label}
                className={`text-center px-2 py-3 rounded-lg border ${
                  isHigh
                    ? "bg-red-950 border-red-900"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-500 tracking-wider uppercase mb-1">
                  {label}
                </div>
                <div
                  className={`text-base font-black ${isHigh ? "text-red-400" : "text-slate-400"}`}
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {raw.toFixed(3)}
                </div>
                <div
                  className={`text-xs mt-1 ${isHigh ? "text-red-500" : "text-slate-700"}`}
                >
                  z={z.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="bg-blue-950 border border-blue-900 rounded-xl px-5 py-4 text-sm text-slate-500 leading-relaxed">
        ⚠ <strong className="text-slate-400">Disclaimer:</strong> This tool is
        for academic demonstration only. It is not a medical device and must not
        be used for clinical diagnosis. Model trained on Wisconsin Breast Cancer
        Dataset (UCI ML Repository). Always consult a qualified oncologist for
        medical decisions.
      </div>
    </div>
  );
}
