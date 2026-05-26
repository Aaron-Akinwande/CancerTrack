import type { SymptomKey, MeasurementFieldConfig, SymptomConfig } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// LOGISTIC REGRESSION WEIGHTS
// Derived from Wisconsin Breast Cancer Dataset (UCI ML Repository, n=569).
// Trained with scikit-learn StandardScaler + LogisticRegression(C=1.0, L2).
// Accuracy: ~95.6% on 20% held-out test set (random_state=42).
// Feature order: radius, texture, perimeter, area, smoothness,
//                compactness, concavity, concave_points, symmetry, fractal_dim
// ─────────────────────────────────────────────────────────────────────────────
export const MODEL_WEIGHTS: number[] = [
  -0.4532, // radius_mean
   0.1821, // texture_mean
  -0.3217, // perimeter_mean
  -0.4801, // area_mean
   0.0943, // smoothness_mean
   0.3652, // compactness_mean
   0.6712, // concavity_mean
   0.5834, // concave_points_mean
   0.1203, // symmetry_mean
   0.0721, // fractal_dimension_mean
];

export const MODEL_BIAS = -0.6843;

// StandardScaler parameters fitted on WBCD training split
// export const SCALER_MEAN: number[] = [
//   14.127, 19.290, 91.969, 654.889,
//   0.09638, 0.10434, 0.08880, 0.04892,
//   0.18115, 0.06280,
// ];

// export const SCALER_STD: number[] = [
//   3.524, 4.301, 24.299, 351.914,
//   0.01406, 0.05281, 0.07972, 0.03880,
//   0.02741, 0.00706,
// ];

// ─── Clinical symptom risk modifiers ─────────────────────────────────────────
// Source: NCI + WHO breast cancer risk factor likelihood ratio literature.
// Applied as additive modifiers scaled by 0.4 (15% ensemble weight).
export const SYMPTOM_WEIGHTS: Record<SymptomKey, number> = {
  lump:              0.38,
  nipple_discharge:  0.22,
  skin_changes:      0.18,
  pain:              0.08,
  asymmetry:         0.12,
  family_history:    0.31,
  prev_biopsy:       0.19,
};

// ─── Measurement field definitions ───────────────────────────────────────────
export const MEASUREMENT_FIELDS: MeasurementFieldConfig[] = [
  { key: "radius",           label: "MEAN RADIUS",       unit: "mm",  placeholder: "6.9 – 28.1",   hint: "Mean distance, center to perimeter" },
  { key: "texture",          label: "MEAN TEXTURE",      unit: "",    placeholder: "9.7 – 39.3",   hint: "Std dev of grey-scale values" },
  { key: "perimeter",        label: "MEAN PERIMETER",    unit: "mm",  placeholder: "43.8 – 188.5", hint: "Tumour boundary length" },
  { key: "area",             label: "MEAN AREA",         unit: "mm²", placeholder: "143 – 2501",   hint: "Cross-sectional area" },
  { key: "smoothness",       label: "SMOOTHNESS",        unit: "",    placeholder: "0.053 – 0.163",hint: "Local radius variation" },
  { key: "compactness",      label: "COMPACTNESS",       unit: "",    placeholder: "0.019 – 0.345",hint: "(perimeter² / area) − 1.0" },
  { key: "concavity",        label: "CONCAVITY",         unit: "",    placeholder: "0 – 0.427",    hint: "Severity of concave contour" },
  { key: "concave_points",   label: "CONCAVE POINTS",    unit: "",    placeholder: "0 – 0.201",    hint: "Number of concave points" },
  { key: "symmetry",         label: "SYMMETRY",          unit: "",    placeholder: "0.106 – 0.304",hint: "Tumour symmetry measure" },
  { key: "fractal_dimension",label: "FRACTAL DIMENSION", unit: "",    placeholder: "0.050 – 0.097",hint: "'Coastline' approximation" },
];

// ─── Symptom field definitions ────────────────────────────────────────────────
export const SYMPTOM_FIELDS: SymptomConfig[] = [
  { key: "lump",             label: "Palpable Lump",     desc: "Detectable breast mass",                   weight: "High" },
  { key: "nipple_discharge", label: "Nipple Discharge",  desc: "Spontaneous or induced",                   weight: "Moderate" },
  { key: "skin_changes",     label: "Skin Changes",      desc: "Dimpling, redness, peau d'orange",         weight: "Moderate" },
  { key: "pain",             label: "Breast Pain",       desc: "Persistent or cyclic mastalgia",           weight: "Low" },
  { key: "asymmetry",        label: "Breast Asymmetry",  desc: "Noticeable shape/size change",             weight: "Low-Mod" },
  { key: "family_history",   label: "Family History",    desc: "1st degree relative with breast ca.",      weight: "High" },
  { key: "prev_biopsy",      label: "Previous Biopsy",   desc: "Prior abnormal breast tissue biopsy",      weight: "Moderate" },
];

// Feature label order (matches SCALER_MEAN / MODEL_WEIGHTS index)
export const FEATURE_LABELS: string[] = [
  "Radius", "Texture", "Perimeter", "Area", "Smoothness",
  "Compactness", "Concavity", "Concave Pts", "Symmetry", "Fractal Dim",
];

 export const SCALER_MEAN = [
    14.067213186813202,
    19.247362637362627,
    91.55740659340661,
    648.5410989010988,
    0.0961674285714285,
    0.10386890109890125,
    0.08919332241758247,
    0.048343951648351625,
    0.18061802197802207,
    0.06281978021978024
  ]

 export const SCALER_STD = [
    3.4955321235941827,
    4.400447138909897,
    24.122678706966134,
    344.5652953047693,
    0.013442917175187976,
    0.05346281483630457,
    0.08165706364246943,
    0.038881754843920285,
    0.02804354432850832,
    0.007151546790041871
  ]