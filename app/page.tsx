"use client";

import { useState } from "react";
import type {
  Demographics,
  Symptoms,
  Measurements,
  AnalysisResult,
  SymptomKey,
  FormStep,
} from "@/types";
import { SCALER_MEAN, SYMPTOM_WEIGHTS } from "@/lib/constants";
import {
  runLogisticRegression,
  runDecisionTree,
  getAgeRisk,
} from "@/lib/model";
import { StepIndicator } from "@/components/StepIndicator";
import { DemographicsStep } from "@/components/DemographicsStep";
import { SymptomsStep } from "@/components/SymptomsStep";
import { MeasurementsStep } from "@/components/MeasurementsStep";
import { ResultsStep } from "@/components/ResultsStep";

const defaultDemo = (): Demographics => ({
  name: "",
  age: "",
  gender: "Female",
  menopausal: "Pre-menopausal",
});
const defaultSymptoms = (): Symptoms => ({
  lump: false,
  nipple_discharge: false,
  skin_changes: false,
  pain: false,
  asymmetry: false,
  family_history: false,
  prev_biopsy: false,
  duration_weeks: "",
});
const defaultMeasurements = (): Measurements => ({
  radius: "",
  texture: "",
  perimeter: "",
  area: "",
  smoothness: "",
  compactness: "",
  concavity: "",
  concave_points: "",
  symmetry: "",
  fractal_dimension: "",
});

export default function CancerTrackPage() {
  const [step, setStep] = useState<FormStep>(1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [demo, setDemo] = useState<Demographics>(defaultDemo);
  const [symptoms, setSymptoms] = useState<Symptoms>(defaultSymptoms);
  const [measurements, setMeasurements] =
    useState<Measurements>(defaultMeasurements);
  const [loading, setLoading] = useState(false);

  function updateDemo<K extends keyof Demographics>(
    key: K,
    value: Demographics[K],
  ) {
    setDemo((d) => ({ ...d, [key]: value }));
  }
  function updateSymptoms<K extends keyof Symptoms>(
    key: K,
    value: Symptoms[K],
  ) {
    setSymptoms((s) => ({ ...s, [key]: value }));
  }
  function updateMeasurement(key: keyof Measurements, value: string) {
    setMeasurements((m) => ({ ...m, [key]: value }));
  }

  // function runAnalysis() {
  //   const features: number[] = [
  //     parseFloat(measurements.radius) || SCALER_MEAN[0],
  //     parseFloat(measurements.texture) || SCALER_MEAN[1],
  //     parseFloat(measurements.perimeter) || SCALER_MEAN[2],
  //     parseFloat(measurements.area) || SCALER_MEAN[3],
  //     parseFloat(measurements.smoothness) || SCALER_MEAN[4],
  //     parseFloat(measurements.compactness) || SCALER_MEAN[5],
  //     parseFloat(measurements.concavity) || SCALER_MEAN[6],
  //     parseFloat(measurements.concave_points) || SCALER_MEAN[7],
  //     parseFloat(measurements.symmetry) || SCALER_MEAN[8],
  //     parseFloat(measurements.fractal_dimension) || SCALER_MEAN[9],
  //   ];
  //   const lrProb = runLogisticRegression(features);
  //   const dtResult = runDecisionTree(features);
  //   let modifier = getAgeRisk(parseInt(demo.age) || 45);
  //   const symptomKeys = Object.keys(SYMPTOM_WEIGHTS) as SymptomKey[];
  //   symptomKeys.forEach((k) => {
  //     if (symptoms[k]) modifier += SYMPTOM_WEIGHTS[k] * 0.4;
  //   });
  //   if (demo.menopausal === "Post-menopausal") modifier += 0.06;
  //   const ensemble = Math.min(
  //     0.99,
  //     Math.max(
  //       0.01,
  //       lrProb * 0.5 +
  //         dtResult.prob * 0.35 +
  //         Math.max(0, Math.min(1, 0.5 + modifier)) * 0.15,
  //     ),
  //   );
  //   setResult({
  //     lrProb,
  //     dtResult,
  //     ensemble,
  //     features,
  //     activeSymptoms: symptomKeys.filter((k) => symptoms[k]),
  //     modifier,
  //     timestamp: new Date().toLocaleString(),
  //     patientName: demo.name || "Anonymous",
  //     age: demo.age,
  //     demographics: { ...demo },
  //     symptoms: { ...symptoms },
  //   });
  //   setStep(4);
  // }

  async function runAnalysis() {
    setLoading(true);

    // Build request body — blank fields fall back to WBCD population mean
    const body = {
      radius: parseFloat(measurements.radius) || SCALER_MEAN[0],
      texture: parseFloat(measurements.texture) || SCALER_MEAN[1],
      perimeter: parseFloat(measurements.perimeter) || SCALER_MEAN[2],
      area: parseFloat(measurements.area) || SCALER_MEAN[3],
      smoothness: parseFloat(measurements.smoothness) || SCALER_MEAN[4],
      compactness: parseFloat(measurements.compactness) || SCALER_MEAN[5],
      concavity: parseFloat(measurements.concavity) || SCALER_MEAN[6],
      concave_points: parseFloat(measurements.concave_points) || SCALER_MEAN[7],
      symmetry: parseFloat(measurements.symmetry) || SCALER_MEAN[8],
      fractal_dimension:
        parseFloat(measurements.fractal_dimension) || SCALER_MEAN[9],
    };

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Unknown server error");
      }

      const data = await res.json();
      // data shape: { lr_prob, dt_result: { malignant, prob, path }, ensemble, z_scores }

      // ── Clinical modifier (stays in the frontend — age + symptoms + menopausal) ──
      let modifier = getAgeRisk(parseInt(demo.age) || 45);
      const symptomKeys = Object.keys(SYMPTOM_WEIGHTS) as SymptomKey[];
      symptomKeys.forEach((k) => {
        if (symptoms[k]) modifier += SYMPTOM_WEIGHTS[k] * 0.4;
      });
      if (demo.menopausal === "Post-menopausal") modifier += 0.06;

      // Blend real-model ensemble (85%) with clinical modifier layer (15%)
      const clinicalScore = Math.max(0, Math.min(1, 0.5 + modifier));
      const finalEnsemble = Math.min(
        0.99,
        Math.max(0.01, data.ensemble * 0.85 + clinicalScore * 0.15),
      );

      setResult({
        lrProb: data.lr_prob,
        dtResult: {
          malignant: data.dt_result.malignant,
          prob: data.dt_result.prob,
          path: data.dt_result.path,
        },
        ensemble: finalEnsemble,
        features: Object.values(body) as number[],
        activeSymptoms: symptomKeys.filter((k) => symptoms[k]),
        modifier,
        timestamp: new Date().toLocaleString(),
        patientName: demo.name || "Anonymous",
        age: demo.age,
        demographics: { ...demo },
        symptoms: { ...symptoms },
      });

      setStep(4);
    } catch (err) {
      console.error("[runAnalysis]", err);
      const message = err instanceof Error ? err.message : String(err);
      alert(
        `Analysis failed: ${message}\n\n` +
          "Make sure the Python server is running:\n" +
          "  uvicorn python.server:app --reload --port 8000",
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setResult(null);
    setDemo(defaultDemo());
    setSymptoms(defaultSymptoms());
    setMeasurements(defaultMeasurements());
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-rose-500 text-xl">⬡</span>
              <h1 className="text-lg sm:text-xl font-black text-slate-50 tracking-tight">
                CancerTrack
              </h1>
              <span className="hidden sm:inline text-slate-600 font-light">
                |
              </span>
              <span className="hidden sm:inline text-sm text-slate-500 font-normal">
                Clinical Analysis
              </span>
            </div>
            <p className="text-[10px] text-slate-600 tracking-[0.15em] uppercase mt-0.5 hidden sm:block">
              WBCD-Trained · Logistic Regression + Decision Tree Ensemble
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              Model Active
            </span>
          </div>
        </div>
      </header>

      {/* ── Step indicator ── */}
      <StepIndicator step={step} onNavigate={(s) => setStep(s)} />

      {/* ── Page content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        {step === 1 && (
          <DemographicsStep
            demo={demo}
            onChange={updateDemo}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <SymptomsStep
            symptoms={symptoms}
            onChange={updateSymptoms}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          // <MeasurementsStep
          //   measurements={measurements}
          //   onChange={updateMeasurement}
          //   onAnalyze={runAnalysis}
          //   onBack={() => setStep(2)}
          // />
          <MeasurementsStep
            measurements={measurements}
            onChange={updateMeasurement}
            onAnalyze={runAnalysis}
            onBack={() => setStep(2)}
            loading={loading}
          />
        )}
        {step === 4 && result && (
          <ResultsStep result={result} onReset={reset} />
        )}
      </main>
    </div>
  );
}
