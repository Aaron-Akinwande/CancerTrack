import type { AnalysisResult } from "@/types";
import { SCALER_MEAN, SCALER_STD, FEATURE_LABELS, SYMPTOM_WEIGHTS } from "./constants";
import { getRisk } from "./model";

/**
 * Escapes a CSV cell value — wraps in quotes if it contains commas, quotes, or newlines.
 */
function escapeCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function row(...cells: (string | number)[]): string {
  return cells.map(escapeCell).join(",");
}

/**
 * Builds a complete CSV string from an AnalysisResult.
 * Sections: Patient Info, Ensemble Results, Algorithm Detail,
 *           Clinical Factors, Feature Values, Disclaimer.
 */
export function buildCsvContent(result: AnalysisResult): string {
  const risk = getRisk(result.ensemble);
  const lines: string[] = [];

  // ── Header ──
  lines.push("CancerTrack — Breast Cancer Risk Assessment Report");
  lines.push(row("Generated", result.timestamp));
  lines.push("");

  // ── Patient Info ──
  lines.push("PATIENT INFORMATION");
  lines.push(row("Name / ID", result.patientName || "Anonymous"));
  lines.push(row("Age", result.age || "N/A"));
  lines.push(row("Biological Sex", result.demographics.gender));
  lines.push(row("Menopausal Status", result.demographics.menopausal));
  lines.push("");

  // ── Ensemble Results ──
  lines.push("ANALYSIS RESULTS");
  lines.push(row("Risk Level", risk.level));
  lines.push(row("Ensemble Malignancy Probability", `${(result.ensemble * 100).toFixed(2)}%`));
  lines.push(row("Logistic Regression Probability", `${(result.lrProb * 100).toFixed(2)}%`));
  lines.push(row("Decision Tree Probability", `${(result.dtResult.prob * 100).toFixed(2)}%`));
  lines.push(row("Decision Tree Verdict", result.dtResult.malignant ? "Malignant" : "Benign"));
  lines.push(row("Decision Tree Confidence", `${(result.dtResult.prob * 100).toFixed(0)}%`));
  lines.push(row("Decision Tree Path", result.dtResult.path.join(" → ")));
  lines.push("");

  // ── Clinical Factors ──
  lines.push("CLINICAL RISK FACTORS");
  lines.push(row("Active Symptoms", result.activeSymptoms.length.toString()));

  if (result.activeSymptoms.length > 0) {
    lines.push(row("Symptom", "Risk Weight Applied"));
    result.activeSymptoms.forEach((s) => {
      lines.push(row(
        s.replace(/_/g, " "),
        `+${(SYMPTOM_WEIGHTS[s] * 0.4 * 100).toFixed(0)}%`,
      ));
    });
  }

  lines.push(row("Symptom Duration", result.symptoms.duration_weeks
    ? `${result.symptoms.duration_weeks} weeks`
    : "Not specified"
  ));
  lines.push(row("Age-Adjusted Modifier", result.modifier.toFixed(4)));
  lines.push(row("Post-menopausal Modifier Applied",
    result.demographics.menopausal === "Post-menopausal" ? "Yes (+6%)" : "No"
  ));
  lines.push("");

  // ── Feature Values ──
  lines.push("TUMOUR FEATURE VALUES");
  lines.push(row("Feature", "Raw Value", "Standardized (z-score)", "Flagged (z > 1.5)"));
  FEATURE_LABELS.forEach((label, i) => {
    const raw = result.features[i];
    const z = (raw - SCALER_MEAN[i]) / SCALER_STD[i];
    lines.push(row(label, raw.toFixed(4), z.toFixed(4), z > 1.5 ? "YES" : "no"));
  });
  lines.push("");

  // ── Ensemble Weights ──
  lines.push("ENSEMBLE COMPOSITION");
  lines.push(row("Component", "Weight", "Contribution"));
  lines.push(row("Logistic Regression", "50%", `${(result.lrProb * 0.5 * 100).toFixed(2)}%`));
  lines.push(row("Decision Tree", "35%", `${(result.dtResult.prob * 0.35 * 100).toFixed(2)}%`));
  lines.push(row("Clinical Modifier", "15%", `${(Math.max(0, Math.min(1, 0.5 + result.modifier)) * 0.15 * 100).toFixed(2)}%`));
  lines.push("");

  // ── Disclaimer ──
  lines.push("DISCLAIMER");
  lines.push(row(
    "This report is for academic demonstration only. It is not a medical device and must not be used for clinical diagnosis.",
  ));
  lines.push(row("Model trained on Wisconsin Breast Cancer Dataset (UCI ML Repository)."));
  lines.push(row("Always consult a qualified oncologist for medical decisions."));
  lines.push(row("LASU Computer Science Final Year Project 2025"));

  return lines.join("\n");
}

/**
 * Triggers a browser download of the CSV file.
 * Filename includes patient name and timestamp.
 */
export function downloadCsv(result: AnalysisResult): void {
  const content = buildCsvContent(result);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const safeName = (result.patientName || "patient")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `cancertrack_${safeName}_${date}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
