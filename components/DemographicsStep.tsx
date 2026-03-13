"use client";

import type { Demographics } from "@/types";
import { Field, inputStyle } from "./Field";

interface DemographicsStepProps {
  demo: Demographics;
  onChange: <K extends keyof Demographics>(
    key: K,
    value: Demographics[K],
  ) => void;
  onNext: () => void;
}

export function DemographicsStep({
  demo,
  onChange,
  onNext,
}: DemographicsStepProps) {
  return (
    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
      <h2
        className="text-2xl font-black text-slate-50 mb-6"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Patient Demographics
      </h2>

      <Field
        label="Patient Name / ID"
        hint="Optional — for record keeping only"
      >
        <input
          style={inputStyle}
          value={demo.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Patient 001 or Jane D."
        />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Age" hint="Risk increases significantly after 40">
          <input
            style={inputStyle}
            type="number"
            min="18"
            max="100"
            value={demo.age}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="e.g. 52"
          />
        </Field>
        <Field label="Biological Sex">
          <select
            style={inputStyle}
            value={demo.gender}
            onChange={(e) =>
              onChange("gender", e.target.value as Demographics["gender"])
            }
          >
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </Field>
      </div>

      <Field
        label="Menopausal Status"
        hint="Post-menopausal status is associated with higher risk"
      >
        <select
          style={inputStyle}
          value={demo.menopausal}
          onChange={(e) =>
            onChange("menopausal", e.target.value as Demographics["menopausal"])
          }
        >
          <option>Pre-menopausal</option>
          <option>Peri-menopausal</option>
          <option>Post-menopausal</option>
          <option>Unknown / N/A</option>
        </select>
      </Field>

      <button
        onClick={onNext}
        className="w-full py-4 mt-2 rounded-xl text-white text-base font-black tracking-wider
                   cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0
                   shadow-lg shadow-sky-900/40"
        style={{
          background: "linear-gradient(135deg, #0284c7, #0369a1)",
          border: "none",
        }}
      >
        Continue → Symptom Assessment
      </button>
    </div>
  );
}
