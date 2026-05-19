import type { FormStep } from "@/types";

interface StepIndicatorProps {
  step: FormStep;
  onNavigate: (step: FormStep) => void;
}

const STEPS = [
  { num: 1, label: "Demographics", short: "Info" },
  { num: 2, label: "Symptoms", short: "Sx" },
  { num: 3, label: "Measurements", short: "Data" },
  { num: 4, label: "Results", short: "Res" },
] as const;

export function StepIndicator({ step, onNavigate }: StepIndicatorProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {STEPS.map(({ num, label, short }, i) => {
            const s = num as FormStep;
            const done = step > s;
            const active = step === s;
            const canGo = s < step;

            return (
              <div key={s} className="flex items-center flex-1">
                {/* Step bubble + label */}
                <button
                  onClick={() => canGo && onNavigate(s)}
                  disabled={!canGo}
                  className={`
                    flex items-center gap-2 sm:gap-3 group
                    ${canGo ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  <div
                    className={`
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                    text-xs sm:text-sm font-black shrink-0 transition-all duration-300
                    ${done ? "bg-sky-600 text-white ring-2 ring-sky-600/30" : ""}
                    ${active ? "bg-sky-500 text-white ring-2 ring-sky-400/40 scale-110" : ""}
                    ${!done && !active ? "bg-slate-800 text-slate-500 border border-slate-700" : ""}
                    ${canGo ? "group-hover:ring-4 group-hover:ring-sky-500/20" : ""}
                  `}
                  >
                    {done ? "✓" : num}
                  </div>
                  <div className="text-left hidden xs:block">
                    <div
                      className={`text-xs font-bold leading-none transition-colors
                      ${active ? "text-sky-400" : done ? "text-slate-400" : "text-slate-600"}`}
                    >
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{short}</span>
                    </div>
                    {active && (
                      <div className="text-[10px] text-slate-600 mt-0.5 hidden sm:block">
                        {num === 1
                          ? "Patient info"
                          : num === 2
                            ? "Select symptoms"
                            : num === 3
                              ? "FNA values"
                              : "Risk report"}
                      </div>
                    )}
                  </div>
                </button>

                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4 h-px relative">
                    <div className="absolute inset-0 bg-slate-800 rounded" />
                    <div
                      className="absolute inset-y-0 left-0 bg-sky-600 rounded transition-all duration-500"
                      style={{ width: done ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
