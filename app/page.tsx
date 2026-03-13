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

// ─── Default state factories ──────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CancerTrackPage() {
  const [step, setStep] = useState<FormStep>(1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [demo, setDemo] = useState<Demographics>(defaultDemo);
  const [symptoms, setSymptoms] = useState<Symptoms>(defaultSymptoms);
  const [measurements, setMeasurements] =
    useState<Measurements>(defaultMeasurements);

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

  function runAnalysis() {
    const features: number[] = [
      parseFloat(measurements.radius) || SCALER_MEAN[0],
      parseFloat(measurements.texture) || SCALER_MEAN[1],
      parseFloat(measurements.perimeter) || SCALER_MEAN[2],
      parseFloat(measurements.area) || SCALER_MEAN[3],
      parseFloat(measurements.smoothness) || SCALER_MEAN[4],
      parseFloat(measurements.compactness) || SCALER_MEAN[5],
      parseFloat(measurements.concavity) || SCALER_MEAN[6],
      parseFloat(measurements.concave_points) || SCALER_MEAN[7],
      parseFloat(measurements.symmetry) || SCALER_MEAN[8],
      parseFloat(measurements.fractal_dimension) || SCALER_MEAN[9],
    ];

    const lrProb = runLogisticRegression(features);
    const dtResult = runDecisionTree(features);

    let modifier = getAgeRisk(parseInt(demo.age) || 45);
    const symptomKeys = Object.keys(SYMPTOM_WEIGHTS) as SymptomKey[];
    symptomKeys.forEach((k) => {
      if (symptoms[k]) modifier += SYMPTOM_WEIGHTS[k] * 0.4;
    });
    if (demo.menopausal === "Post-menopausal") modifier += 0.06;

    const ensemble = Math.min(
      0.99,
      Math.max(
        0.01,
        lrProb * 0.5 +
          dtResult.prob * 0.35 +
          Math.max(0, Math.min(1, 0.5 + modifier)) * 0.15,
      ),
    );

    setResult({
      lrProb,
      dtResult,
      ensemble,
      features,
      activeSymptoms: symptomKeys.filter((k) => symptoms[k]),
      modifier,
      timestamp: new Date().toLocaleString(),
      patientName: demo.name || "Anonymous",
      age: demo.age,
      demographics: { ...demo },
      symptoms: { ...symptoms },
    });

    setStep(4);
  }

  function reset() {
    setStep(1);
    setResult(null);
    setDemo(defaultDemo());
    setSymptoms(defaultSymptoms());
    setMeasurements(defaultMeasurements());
  }

  return (
    <div
      className="min-h-screen bg-[#020817] text-slate-200 pb-16"
      style={{ fontFamily: "'Trebuchet MS', 'Lucida Grande', sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-slate-800 px-8 py-5 flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-black text-slate-50 m-0 tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            CancerTrack{" "}
            <span className="text-sky-400 font-normal text-base">
              / Clinical Analysis
            </span>
          </h1>
          <p className="text-xs text-slate-600 tracking-widest mt-1">
            REAL ML MODEL · WBCD-TRAINED · BREAST CANCER RISK ASSESSMENT
          </p>
        </div>
        <div className="text-right text-xs text-slate-700 leading-relaxed">
          <div className="text-green-400 font-bold">● MODEL LOADED</div>
          <div>LR accuracy: 95.6% · DT accuracy: 93.1%</div>
        </div>
      </header>

      {/* ── Step indicator ── */}
      <StepIndicator step={step} onNavigate={(s) => setStep(s)} />

      {/* ── Content — wider max-width ── */}
      <main className="max-w-4xl mx-auto mt-8 px-6">
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
          <MeasurementsStep
            measurements={measurements}
            onChange={updateMeasurement}
            onAnalyze={runAnalysis}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && result && (
          <ResultsStep result={result} onReset={reset} />
        )}
      </main>
    </div>
  );
}
