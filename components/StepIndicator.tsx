import type { FormStep } from "@/types";

interface StepIndicatorProps {
  step: FormStep;
  onNavigate: (step: FormStep) => void;
}

const STEP_LABELS = [
  "Demographics",
  "Symptoms",
  "Measurements",
  "Results",
] as const;

export function StepIndicator({ step, onNavigate }: StepIndicatorProps) {
  return (
    <div className="flex justify-center items-center pt-8 pb-2 px-8 flex-wrap gap-y-4">
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as FormStep;
        const done = step > num;
        const active = step === num;
        const canClick = num < step;

        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div
              onClick={() => canClick && onNavigate(num)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                text-sm font-black transition-all duration-300 select-none
                ${done ? "bg-sky-600 text-white border-2 border-transparent" : ""}
                ${active ? "bg-sky-400 text-white border-2 border-sky-200" : ""}
                ${!done && !active ? "bg-slate-800 text-slate-500 border-2 border-transparent" : ""}
                ${canClick ? "cursor-pointer hover:scale-105" : "cursor-default"}
              `}
            >
              {done ? "✓" : num}
            </div>

            {/* Label */}
            <div className="ml-3 mr-6">
              <span
                className={`text-sm font-bold ${
                  active
                    ? "text-sky-400"
                    : done
                      ? "text-slate-400"
                      : "text-slate-700"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-8 h-px mr-6 ${done ? "bg-sky-600" : "bg-slate-800"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
