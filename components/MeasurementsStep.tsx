"use client";

import type { Measurements } from "@/types";
import { MEASUREMENT_FIELDS } from "@/lib/constants";
import { inputStyle } from "./Field";

interface MeasurementsStepProps {
  measurements: Measurements;
  onChange: (key: keyof Measurements, value: string) => void;
  onAnalyze: () => void;
  onBack: () => void;
}

export function MeasurementsStep({
  measurements,
  onChange,
  onAnalyze,
  onBack,
}: MeasurementsStepProps) {
  return (
    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
      <h2
        className="text-2xl font-black text-slate-50 mb-1"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Tumour Measurements
      </h2>
      <p className="text-base text-slate-500 mb-2">
        Enter values from fine needle aspiration (FNA) cytology report. Leave
        blank to use population mean.
      </p>

      {/* Info banner */}
      <div className="bg-blue-950 border border-blue-900 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-sky-300 leading-relaxed m-0">
          ℹ These features correspond directly to Wisconsin Breast Cancer
          Dataset (WBCD) fields used to train this model. Values come from FNA
          image analysis software.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {MEASUREMENT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-bold text-slate-500 tracking-widest uppercase mb-1.5">
              {f.label}
              {f.unit && (
                <span className="text-slate-700 ml-1">({f.unit})</span>
              )}
            </label>
            <input
              style={inputStyle}
              type="number"
              step="any"
              value={measurements[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
            <p className="text-xs text-slate-700 italic mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-7">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border border-slate-700 bg-transparent
                     text-slate-400 text-base font-bold cursor-pointer hover:border-slate-500
                     transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onAnalyze}
          className="flex-3 py-4 rounded-xl text-white text-lg font-black tracking-widest
                     cursor-pointer transition-transform hover:-translate-y-0.5
                     shadow-xl shadow-emerald-900/40"
          style={{
            background: "linear-gradient(135deg, #059669, #047857)",
            border: "none",
          }}
        >
          🔬 RUN FULL ANALYSIS
        </button>
      </div>
    </div>
  );
}
