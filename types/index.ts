// ─── Patient form state types ─────────────────────────────────────────────────

export interface Demographics {
  name: string;
  age: string;
  gender: "Female" | "Male" | "Other";
  menopausal: "Pre-menopausal" | "Peri-menopausal" | "Post-menopausal" | "Unknown / N/A";
}

export interface Symptoms {
  lump: boolean;
  nipple_discharge: boolean;
  skin_changes: boolean;
  pain: boolean;
  asymmetry: boolean;
  family_history: boolean;
  prev_biopsy: boolean;
  duration_weeks: string;
}

export type SymptomKey = keyof Omit<Symptoms, "duration_weeks">;

export interface Measurements {
  radius: string;
  texture: string;
  perimeter: string;
  area: string;
  smoothness: string;
  compactness: string;
  concavity: string;
  concave_points: string;
  symmetry: string;
  fractal_dimension: string;
}

export type MeasurementKey = keyof Measurements;

// ─── Model output types ───────────────────────────────────────────────────────

export interface DecisionTreeResult {
  malignant: boolean;
  prob: number;
  /** Each string is one node condition, e.g. "concave_pts≤0.051" */
  path: string[];
}

export interface RiskLevel {
  level: "HIGH RISK" | "MODERATE RISK" | "LOW-MODERATE RISK" | "LOW RISK";
  color: string;
  bg: string;
  border: string;
  emoji: string;
}

export interface AnalysisResult {
  lrProb: number;
  dtResult: DecisionTreeResult;
  ensemble: number;
  /** Raw (un-standardized) feature values in order */
  features: number[];
  /** Keys of symptoms that were active */
  activeSymptoms: SymptomKey[];
  modifier: number;
  timestamp: string;
  patientName: string;
  age: string;
  demographics: Demographics;
  symptoms: Symptoms;
}

// ─── UI / step types ──────────────────────────────────────────────────────────

export type FormStep = 1 | 2 | 3 | 4;

export interface MeasurementFieldConfig {
  key: MeasurementKey;
  label: string;
  unit: string;
  placeholder: string;
  hint: string;
}

export interface SymptomConfig {
  key: SymptomKey;
  label: string;
  desc: string;
  weight: "High" | "Moderate" | "Low-Mod" | "Low";
}
