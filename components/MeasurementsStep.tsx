"use client";

import type { Measurements } from "@/types";
import { MEASUREMENT_FIELDS } from "@/lib/constants";
import { inputStyle, Card, SectionHeading, NavButtons } from "./Field";

interface MeasurementsStepProps {
  measurements: Measurements;
  onChange: (key: keyof Measurements, value: string) => void;
  onAnalyze: () => void;
  onBack: () => void;
  loading?: boolean;
}

export function MeasurementsStep({
  measurements,
  onChange,
  onAnalyze,
  onBack,
  loading
}: MeasurementsStepProps) {
  const filled = Object.values(measurements).filter(Boolean).length;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <SectionHeading
          title="Tumour Measurements"
          subtitle="Enter values from the FNA cytology report. Blank fields default to the WBCD population mean."
        />
        {filled > 0 && (
          <div className="shrink-0 bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-1.5 text-center">
            <div className="text-lg font-black text-emerald-400 leading-none">
              {filled}/10
            </div>
            <div className="text-[10px] text-emerald-700 uppercase tracking-wide">
              filled
            </div>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 bg-blue-950/60 border border-blue-900/60 rounded-xl px-4 py-3 mb-6">
        <span className="text-blue-400 text-base shrink-0 mt-0.5">ℹ</span>
        <p className="text-xs text-slate-400 leading-relaxed">
          These 10 features correspond exactly to the Wisconsin Breast Cancer
          Dataset (WBCD) mean-value fields used to train the model. Values are
          produced by FNA image analysis software.
        </p>
      </div>

      {/* Field grid — 1-col on mobile, 2-col sm+  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-2">
        {MEASUREMENT_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 tracking-[0.1em] uppercase">
              {f.label}
              {f.unit && (
                <span className="text-slate-700 ml-1 normal-case font-normal">
                  ({f.unit})
                </span>
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
            <p className="text-[11px] text-slate-700 italic">{f.hint}</p>
          </div>
        ))}
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onAnalyze}
        nextLabel={loading ? "⏳ Analysing…" : "🔬 Run Full Analysis"}
        nextStyle={{
          background: "linear-gradient(135deg,#059669,#047857)",
          border: "none",
        }}
        nextLoading={loading}
      />
    </Card>
  );
}
