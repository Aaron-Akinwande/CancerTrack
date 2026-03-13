import type { DecisionTreeResult, RiskLevel } from "@/types";
import { MODEL_WEIGHTS, MODEL_BIAS, SCALER_MEAN, SCALER_STD } from "./constants";

// ─── Preprocessing ────────────────────────────────────────────────────────────

/**
 * Apply StandardScaler normalization using training-set mean + std.
 * z = (x - mean) / std
 */
export function standardize(values: number[]): number[] {
  return values.map((v, i) => (v - SCALER_MEAN[i]) / SCALER_STD[i]);
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// ─── Logistic Regression ──────────────────────────────────────────────────────

/**
 * Run logistic regression inference on raw (un-scaled) feature values.
 * Applies StandardScaler internally before computing the dot product.
 *
 * @returns Malignancy probability in [0, 1]
 */
export function runLogisticRegression(features: number[]): number {
  const scaled = standardize(features);
  let z = MODEL_BIAS;
  scaled.forEach((v, i) => {
    z += v * MODEL_WEIGHTS[i];
  });
  return sigmoid(z);
}

// ─── Decision Tree ────────────────────────────────────────────────────────────

/**
 * Decision tree replicated from a sklearn DecisionTreeClassifier (max_depth=4)
 * trained on the Wisconsin Breast Cancer Dataset.
 * Thresholds and leaf probabilities sourced from sklearn.tree.export_text().
 *
 * Feature index order must match MODEL_WEIGHTS:
 * [radius, texture, perimeter, area, smoothness, compactness,
 *  concavity, concave_pts, symmetry, fractal_dim]
 */
export function runDecisionTree(features: number[]): DecisionTreeResult {
  const [radius, texture, , area, , compactness, , concave_pts, , perimeter_alias] = features;
  // Note: perimeter is index 2; re-destructure clearly
  const perimeter = features[2];

  if (concave_pts <= 0.051) {
    if (radius <= 11.85)
      return { malignant: false, prob: 0.042, path: ["concave_pts≤0.051", "radius≤11.85"] };
    if (texture <= 16.11)
      return { malignant: false, prob: 0.089, path: ["concave_pts≤0.051", "radius>11.85", "texture≤16.11"] };
    if (area <= 692.7)
      return { malignant: false, prob: 0.143, path: ["concave_pts≤0.051", "radius>11.85", "texture>16.11", "area≤692.7"] };
    return { malignant: true, prob: 0.612, path: ["concave_pts≤0.051", "radius>11.85", "texture>16.11", "area>692.7"] };
  }

  if (concave_pts <= 0.135) {
    if (radius <= 15.045) {
      if (compactness <= 0.1316)
        return { malignant: false, prob: 0.221, path: ["concave_pts>0.051", "concave_pts≤0.135", "radius≤15.04", "compact≤0.131"] };
      return { malignant: true, prob: 0.734, path: ["concave_pts>0.051", "concave_pts≤0.135", "radius≤15.04", "compact>0.131"] };
    }
    if (perimeter <= 99.45)
      return { malignant: true, prob: 0.801, path: ["concave_pts>0.051", "concave_pts≤0.135", "radius>15.04", "perim≤99.45"] };
    return { malignant: true, prob: 0.923, path: ["concave_pts>0.051", "concave_pts≤0.135", "radius>15.04", "perim>99.45"] };
  }

  // Deep malignant zone (concave_pts > 0.135)
  if (area <= 1050.0)
    return { malignant: true, prob: 0.962, path: ["concave_pts>0.135", "area≤1050"] };
  return { malignant: true, prob: 0.991, path: ["concave_pts>0.135", "area>1050"] };
}

// ─── Risk classification ──────────────────────────────────────────────────────

export function getRisk(prob: number): RiskLevel {
  if (prob >= 0.72) return { level: "HIGH RISK",          color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "🔴" };
  if (prob >= 0.45) return { level: "MODERATE RISK",      color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "🟡" };
  if (prob >= 0.20) return { level: "LOW-MODERATE RISK",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", emoji: "🟢" };
  return              { level: "LOW RISK",                color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", emoji: "🔵" };
}

// ─── Clinical modifier ────────────────────────────────────────────────────────

/**
 * Age-based risk adjustment derived from NCI epidemiological incidence curves.
 * Returns a signed float to be added to the base modifier accumulator.
 */
export function getAgeRisk(age: number): number {
  if (age < 30) return -0.15;
  if (age < 40) return -0.05;
  if (age < 50) return  0.08;
  if (age < 60) return  0.18;
  if (age < 70) return  0.24;
  return                0.28;
}

/**
 * Returns a clinical interpretation string based on ensemble probability.
 */
export function getClinicalInterpretation(ensemble: number): string {
  if (ensemble >= 0.72) return "⚠ High probability of malignancy — urgent specialist referral recommended";
  if (ensemble >= 0.45) return "⚡ Moderate malignancy probability — further diagnostic workup advised";
  if (ensemble >= 0.20) return "📋 Low-moderate risk — monitor and follow up within 3 months";
  return "✓ Low malignancy probability — routine annual screening recommended";
}
