import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

// inputStyle kept for dynamic-colour selects/inputs — everything else is className
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1.5px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 15,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 mb-5">
      <label className="text-xs font-bold text-slate-400 tracking-[0.12em] uppercase">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-slate-600 italic leading-snug -mt-0.5">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

/** Shared section card shell */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-900 rounded-2xl border border-slate-800 ${className}`}
    >
      {children}
    </div>
  );
}

/** Shared section heading */
export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-black text-slate-50 font-serif">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Shared nav button row */
export function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextStyle,
  nextLoading,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextStyle?: React.CSSProperties;
  nextLoading?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-7">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-slate-700 bg-transparent
                     text-slate-400 text-sm font-bold cursor-pointer hover:border-slate-500
                     hover:text-slate-300 transition-all"
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        className={`flex-[3] py-3.5 rounded-xl text-white text-base font-black
                   tracking-wide cursor-pointer transition-all
                   hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 ${nextLoading ? "opacity-60 cursor-not-allowed" : ""}`}
        style={
          nextStyle ?? {
            background: "linear-gradient(135deg,#0284c7,#0369a1)",
            border: "none",
          }
        }
      >
        {nextLabel}
      </button>
    </div>
  );
}
