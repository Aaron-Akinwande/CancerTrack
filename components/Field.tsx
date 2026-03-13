import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1.5px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: 15,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-bold text-slate-400 tracking-widest mb-2 uppercase">
        {label}
      </label>
      {hint && (
        <p className="text-sm text-slate-500 italic -mt-1 mb-2">{hint}</p>
      )}
      {children}
    </div>
  );
}
