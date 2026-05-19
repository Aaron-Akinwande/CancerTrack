"use client";

import type { Demographics } from "@/types";
import { Field, inputStyle, Card, SectionHeading, NavButtons } from "./Field";

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
    <Card className="p-6 sm:p-8">
      <SectionHeading
        title="Patient Demographics"
        subtitle="Basic patient information used for age-adjusted clinical risk scoring."
      />

      <Field
        label="Patient Name / ID"
        hint="Optional — used for the downloaded report only"
      >
        <input
          style={inputStyle}
          value={demo.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Patient 001 or Jane D."
        />
      </Field>

      {/* Age + Sex — stack to 1-col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Age" >
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
        hint="Post-menopausal status carries an additional +6% modifier"
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

      {/* Risk modifier preview chips */}
      <div className="flex flex-wrap gap-2 mt-1 mb-2">
        {[
          {
            label: "Age modifier",
            value: demo.age
              ? parseInt(demo.age) >= 60
                ? "High ↑"
                : parseInt(demo.age) >= 40
                  ? "Moderate"
                  : "Low"
              : "—",
          },
          {
            label: "Menopausal",
            value:
              demo.menopausal === "Post-menopausal"
                ? "+6% applied"
                : "No modifier",
          },
        ].map((chip) => (
          <div
            key={chip.label}
            className="flex items-center gap-1.5 bg-slate-800 border border-slate-700
                                           rounded-full px-3 py-1"
          >
            <span className="text-xs text-slate-500">{chip.label}:</span>
            <span className="text-xs font-bold text-slate-300">
              {chip.value}
            </span>
          </div>
        ))}
      </div>

      <NavButtons onNext={onNext} nextLabel="Continue → Symptom Assessment" />
    </Card>
  );
}
