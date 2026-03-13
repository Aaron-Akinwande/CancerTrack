"use client";

import type { Symptoms } from "@/types";
import { SYMPTOM_FIELDS } from "@/lib/constants";
import { Field, inputStyle } from "./Field";

interface SymptomsStepProps {
  symptoms: Symptoms;
  onChange: <K extends keyof Symptoms>(key: K, value: Symptoms[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SymptomsStep({
  symptoms,
  onChange,
  onNext,
  onBack,
}: SymptomsStepProps) {
  return (
    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
      <h2
        className="text-2xl font-black text-slate-50 mb-1"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Clinical Symptom Assessment
      </h2>
      <p className="text-base text-slate-500 mb-6">
        Select all symptoms currently reported by the patient
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {SYMPTOM_FIELDS.map((s) => {
          const active = symptoms[s.key];
          return (
            <div
              key={s.key}
              onClick={() => onChange(s.key, !active)}
              className={`
                p-4 rounded-xl cursor-pointer transition-all duration-200 select-none
                ${
                  active
                    ? "bg-blue-950 border border-sky-400"
                    : "bg-slate-800 border border-slate-700 hover:border-slate-500"
                }
              `}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-bold mb-1 ${active ? "text-sky-300" : "text-slate-300"}`}
                  >
                    {s.label}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug">
                    {s.desc}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs font-black
                      ${
                        active
                          ? "bg-sky-400 border-2 border-sky-400 text-slate-900"
                          : "border-2 border-slate-600 bg-transparent text-transparent"
                      }`}
                  >
                    ✓
                  </div>
                  <span className="text-xs text-slate-600 tracking-wide">
                    {s.weight}
                  </span>
                </div>
              </div>
            </div>
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

      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border border-slate-700 bg-transparent
                     text-slate-400 text-base font-bold cursor-pointer hover:border-slate-500
                     transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="flex-3 py-3.5 rounded-xl text-white text-base font-black tracking-wider
                     cursor-pointer transition-transform hover:-translate-y-0.5 shadow-lg shadow-sky-900/40"
          style={{
            background: "linear-gradient(135deg, #0284c7, #0369a1)",
            border: "none",
          }}
        >
          Continue → Tumour Measurements
        </button>
      </div>
    </div>
  );
}
