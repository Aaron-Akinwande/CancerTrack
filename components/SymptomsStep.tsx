"use client";

import type { Symptoms } from "@/types";
import { SYMPTOM_FIELDS } from "@/lib/constants";
import { Field, inputStyle, Card, SectionHeading, NavButtons } from "./Field";

interface SymptomsStepProps {
  symptoms: Symptoms;
  onChange: <K extends keyof Symptoms>(key: K, value: Symptoms[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

const WEIGHT_COLOR: Record<string, string> = {
  High: "text-rose-400 bg-rose-950 border-rose-900",
  Moderate: "text-amber-400 bg-amber-950 border-amber-900",
  "Low-Mod": "text-sky-400  bg-sky-950  border-sky-900",
  Low: "text-slate-400 bg-slate-800 border-slate-700",
};

export function SymptomsStep({
  symptoms,
  onChange,
  onNext,
  onBack,
}: SymptomsStepProps) {
  const activeCount = SYMPTOM_FIELDS.filter((s) => symptoms[s.key]).length;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <SectionHeading
          title="Symptom Assessment"
          subtitle="Select all symptoms currently reported. Each carries an evidence-based risk modifier."
        />
        {activeCount > 0 && (
          <div className="shrink-0 bg-sky-950 border border-sky-800 rounded-xl px-3 py-1.5 text-center">
            <div className="text-lg font-black text-sky-400 leading-none">
              {activeCount}
            </div>
            <div className="text-[10px] text-sky-600 uppercase tracking-wide">
              selected
            </div>
          </div>
        )}
      </div>

      {/* Symptom grid — 1 col mobile, 2 col tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {SYMPTOM_FIELDS.map((s) => {
          const active = symptoms[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key, !active)}
              className={`
                w-full text-left p-4 rounded-xl border transition-all duration-150 select-none
                ${
                  active
                    ? "bg-sky-950/60 border-sky-500 shadow-lg shadow-sky-950/50"
                    : "bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className={`
                  mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center
                  shrink-0 transition-all duration-150
                  ${active ? "bg-sky-500 border-sky-500" : "border-slate-600 bg-transparent"}
                `}
                >
                  {active && (
                    <span className="text-white text-xs font-black">✓</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-bold ${active ? "text-sky-200" : "text-slate-300"}`}
                    >
                      {s.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${WEIGHT_COLOR[s.weight]}`}
                    >
                      {s.weight}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {s.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Field
        label="Symptom Duration"
        hint="How long has the patient reported these symptoms?"
      >
        <select
          style={inputStyle}
          value={symptoms.duration_weeks}
          onChange={(e) => onChange("duration_weeks", e.target.value)}
        >
          <option value="">Select duration</option>
          <option value="1">Less than 2 weeks</option>
          <option value="2">2–4 weeks</option>
          <option value="8">1–3 months</option>
          <option value="16">3–6 months</option>
          <option value="26">6–12 months</option>
          <option value="52">Over 1 year</option>
        </select>
      </Field>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue → Tumour Measurements"
      />
    </Card>
  );
}
