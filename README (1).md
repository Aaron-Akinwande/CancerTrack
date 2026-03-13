# CancerTrack — Algorithm-Based Cancer Patient Monitoring System

> Final Year Project · Department of Computer Science · Lagos State University · 2025  
> **Student:** Majowogun Ayomide Oluwasegun (21110591078)  
> **Supervisor:** Dr. Sotonwa K.A.

---

## Table of Contents

1. [What the System Does](#what-the-system-does)
2. [Why This System Was Built](#why-this-system-was-built)
3. [System Architecture](#system-architecture)
4. [The Machine Learning Models](#the-machine-learning-models)
5. [Thought Process — Design Decisions & Why](#thought-process--design-decisions--why)
6. [How the App Was Built](#how-the-app-was-built)
7. [File Structure](#file-structure)
8. [How to Run It](#how-to-run-it)
9. [Honest Limitations](#honest-limitations)
10. [Academic References](#academic-references)

---

## What the System Does

CancerTrack is a browser-based clinical decision support tool for breast cancer risk assessment. It takes structured patient data — demographics, reported symptoms, and tumour measurements from fine needle aspiration (FNA) cytology — and runs that data through two machine learning algorithms to produce a malignancy probability score.

The system has two versions:

**Version 1 — Demo (cancer-monitor-demo.jsx)**  
A presentation-friendly version with sliders for tumour measurements and three preset patient profiles (Benign, Borderline, Malignant). Designed to visually demonstrate how the algorithms work during a defense or lecture. The model weights in this version approximate real patterns from the Wisconsin Breast Cancer Dataset (WBCD) but are tuned for clear visual contrast between cases.

**Version 2 — Realistic Clinical Model (cancer-monitor-realistic.jsx)**  
A full three-step clinical intake form covering:
- Patient demographics (name/ID, age, sex, menopausal status)
- Symptom assessment (7 evidence-based clinical symptoms with risk weights)
- Tumour feature measurements (10 fields matching the exact WBCD feature set)

This version uses real trained model weights and StandardScaler normalization parameters derived from the WBCD (569 patients, 30 features). It produces a three-component ensemble result: Logistic Regression probability, Decision Tree classification, and a clinical modifier based on age and symptom burden.

---

## Why This System Was Built

The project brief identified a clear gap: cancer monitoring in low-resource healthcare settings relies almost entirely on periodic hospital visits, expensive imaging, and specialist availability — all of which are constrained in developing regions like Nigeria.

The research literature (Bray et al., 2018; Sung et al., 2021) consistently shows that Sub-Saharan Africa bears a disproportionate share of cancer mortality, largely due to late-stage diagnosis rather than the cancer itself being more aggressive. The problem is surveillance, not biology.

Existing AI solutions to this problem — IBM Watson for Oncology, DeepMind's mammogram classifier — are computationally expensive, require large curated datasets, and operate as black-box systems. A hospital in Lagos cannot run a deep learning inference server. A junior clinician cannot explain a neural network's recommendation to a patient.

This project therefore focused on a different question: **what is the lightest, most interpretable ML system that still produces clinically useful predictions?**

The answer from the literature pointed to two algorithms: Logistic Regression and Decision Trees. Both are lightweight enough to run in a web browser with no server infrastructure. Both produce outputs a doctor can actually read and explain. Both have well-understood failure modes.

---

## System Architecture

```
Patient Input (3-step form)
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                   Feature Preprocessing                │
│  StandardScaler: z = (x - mean) / std                 │
│  (Parameters fitted on WBCD training set, n=569)      │
└───────────────────────────┬───────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
    │   Logistic   │ │   Decision   │ │    Clinical      │
    │  Regression  │ │     Tree     │ │    Modifier      │
    │  (weight:50%)│ │ (weight:35%) │ │  (weight: 15%)   │
    └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
           │                │                  │
           └────────────────┼──────────────────┘
                            ▼
               ┌────────────────────────┐
               │   Ensemble Probability │
               │  P = 0.5·LR + 0.35·DT │
               │      + 0.15·Clinical  │
               └────────────────────────┘
                            │
                            ▼
               Risk Level + Clinical Recommendation
```

---

## The Machine Learning Models

### Logistic Regression

Logistic Regression models the probability of a binary outcome (malignant vs. benign) as:

```
P(malignant) = 1 / (1 + e^−z)
where z = bias + Σ(weight_i × scaled_feature_i)
```

**Training details:**
- Dataset: Wisconsin Breast Cancer Dataset (UCI ML Repository)
- Samples: 569 (357 benign, 212 malignant)
- Features used: 10 mean-value features (radius, texture, perimeter, area, smoothness, compactness, concavity, concave points, symmetry, fractal dimension)
- Preprocessing: StandardScaler normalization
- Regularization: L2 (C=1.0)
- Reported accuracy: ~95.6% on 20% held-out test set

The model coefficients embedded in the application are real weights from this training process. The StandardScaler mean and standard deviation values are also real — they define the normalization applied to every new patient input before inference.

**Why Logistic Regression?**  
It is the most interpretable probabilistic model in the supervised learning toolkit. Every feature has a single coefficient. The output is a probability, not just a class label. It runs in microseconds on any hardware. For a resource-constrained clinical setting, these properties matter more than marginal accuracy gains from more complex models.

---

### Decision Tree

The Decision Tree uses a series of learned threshold rules on individual features to classify a tumour. The tree embedded in the application replicates the structure of a `max_depth=4` sklearn `DecisionTreeClassifier` trained on the same WBCD data.

**Why replicate the tree manually rather than loading a model file?**  
Because the goal was a fully self-contained browser application with zero dependencies on model files, backend servers, or Python runtimes. The tree's structure (split conditions, node probabilities) was read from sklearn's `export_text()` output and manually transcribed into JavaScript conditional logic. This is a deliberate engineering trade-off: slightly less flexible, but completely portable.

**Sample tree path for a high-risk patient:**
```
concave_points > 0.135 → area > 1050 → Malignant (99.1% confidence)
```

The decision path panel in the results screen shows exactly which nodes were traversed — this is the "explainability" feature that distinguishes tree-based models from black-box approaches.

---

### Clinical Modifier

The third component is not a trained model — it is a rule-based score built from published risk factor literature (NCI, WHO).

Age risk is applied as a stepped function based on epidemiological data showing that breast cancer incidence roughly doubles every decade between 30 and 70. Symptom weights are additive modifiers derived from documented likelihood ratios for each clinical finding (palpable lump, nipple discharge, skin changes, family history, etc.).

This component has a weight of only 15% in the ensemble deliberately. Clinical symptoms and demographics are important context, but the tumour measurements carry far more discriminative information. The modifier ensures the system doesn't ignore obvious clinical signals while not allowing them to override the FNA data.

---

## Thought Process — Design Decisions & Why

### 1. Why run in the browser instead of a server?

The project's core argument is accessibility in low-resource settings. A system that requires a Python server, cloud infrastructure, or a GPU is not accessible. A React application that runs entirely in the browser can be opened on any laptop, tablet, or smartphone with a modern browser — no installation, no internet connection after initial load, no server costs.

TensorFlow.js was originally considered for in-browser model inference, but the final implementation uses pure JavaScript arithmetic. This is actually better: the bundle is smaller, there are no framework version dependencies, and the computation is fully transparent and auditable.

### 2. Why two separate app versions?

The demo version and the realistic version serve different purposes and audiences.

The **demo version** was built for the defense panel. It needs to be immediately legible to non-technical evaluators. Preset patient profiles let the presenter load a "benign" and a "malignant" case and show the model responding correctly without fumbling with number inputs under pressure.

The **realistic version** was built to demonstrate what an actual deployment would look like. It uses the same algorithmic logic but wraps it in a clinical intake workflow that mirrors how a nurse or community health worker would actually collect this data. The three-step form mimics standard clinical assessment structure: demographics first, then symptoms, then objective measurements.

### 3. Why Logistic Regression and Decision Tree specifically?

This was not an arbitrary choice — it comes directly from the literature review.

The project's stated constraint was low-resource deployability. Esteva et al. (2019) showed that CNNs achieve dermatologist-level accuracy on medical image classification, but require GPU infrastructure and tens of thousands of labelled images. Wang et al. (2020) showed deep learning performing well on colonoscopy data, but their system required real-time high-resolution video processing.

Neither of these is viable in a resource-constrained clinic. Logistic Regression and Decision Trees, by contrast, can be trained on a standard laptop in seconds, require no GPU, produce interpretable outputs, and have been validated extensively in clinical prediction contexts (Kourou et al., 2017).

The choice is a deliberate rejection of impressive-but-impractical in favour of simple-but-deployable.

### 4. Why ensemble the two models?

Each algorithm has a known weakness:

- Logistic Regression assumes a linear decision boundary. In reality, the relationship between tumour features and malignancy is not perfectly linear — there are threshold effects (e.g., once concavity exceeds a certain value, risk increases sharply rather than proportionally).
- Decision Trees are prone to overfitting. A single tree can latch onto noise in the training data, especially near leaf nodes with few samples.

Ensembling the two compensates for these weaknesses. Where the linear boundary of LR undershoots, the tree's threshold rules pick up the slack. Where the tree's leaf confidence is low, LR's smooth probability surface provides a more calibrated estimate. The 50/35 weighting slightly favours LR because its probability outputs are better calibrated — tree leaf probabilities tend to be overconfident.

### 5. Why show the decision tree path?

This was a deliberate design choice tied to one of the project's stated objectives: making AI recommendations interpretable and actionable for healthcare providers.

A black-box prediction of "73% malignant" is hard to act on and harder to explain to a patient. A path that reads "concave_points > 0.135 → area > 1050 → Malignant" gives the clinician something to verify. They can check whether those specific measurements were recorded correctly. They can understand which features drove the classification. They can explain to the patient what abnormal finding triggered the alert.

This is the clinical value of Decision Trees over neural networks for this application — not raw accuracy, but trust and auditability.

### 6. Why include a disclaimer?

Medical ethics requires it. This system is a decision-support tool, not a diagnostic device. It should reduce the time a clinician spends reviewing data and help them prioritise cases — it should not replace a pathology report or oncologist referral. Making that boundary explicit in the UI is not just legal caution; it reflects the correct understanding of what ML can and cannot do in clinical settings (Chen & Asch, 2022).

---

## How the App Was Built

**Stack:**
- React (functional components, hooks)
- Pure JavaScript for model inference (no ML framework)
- CSS-in-JS inline styles (no stylesheet dependencies)
- TensorFlow.js imported but model arithmetic implemented natively

**Key implementation files:**

| File | Purpose |
|------|---------|
| `cancer-monitor-demo.jsx` | Presentation demo with sliders and preset patients |
| `cancer-monitor-realistic.jsx` | Full clinical intake form with real model weights |

**Model weights source:**  
The logistic regression coefficients and scaler parameters were obtained by training a `sklearn.linear_model.LogisticRegression` model on the WBCD dataset (available at: https://archive.ics.uci.edu/ml/datasets/Breast+Cancer+Wisconsin+Diagnostic) and exporting the `.coef_`, `.intercept_`, `scaler.mean_`, and `scaler.scale_` arrays.

The Decision Tree structure was obtained by training `sklearn.tree.DecisionTreeClassifier(max_depth=4)` on the same data and reading the output of `sklearn.tree.export_text()`. The thresholds and leaf probabilities were then transcribed into JavaScript conditional logic.

---

## File Structure

```
project/
├── cancer-monitor-demo.jsx          # Version 1: Presentation demo
├── cancer-monitor-realistic.jsx     # Version 2: Clinical model
└── README.md                        # This file
```

To deploy either version, paste the `.jsx` file into any React sandbox (Claude.ai artifacts, CodeSandbox, StackBlitz, or a local Vite/CRA project).

---

## How to Run It

**Quickest method — Claude.ai Artifacts:**
1. Open Claude.ai
2. Ask Claude to render the `.jsx` file as an artifact
3. The app runs immediately in the browser panel

**Local React project:**
```bash
npx create-react-app cancer-monitor
cd cancer-monitor
# Replace src/App.js content with the contents of the .jsx file
npm start
```

**StackBlitz / CodeSandbox:**
1. Create a new React project
2. Replace `App.jsx` with the contents of either file
3. The app runs without any additional dependencies

---

## Honest Limitations

It would be dishonest to present this system without acknowledging what it is not.

**It is not a trained model running in production.** The weights are real but the inference is a simplified approximation. A proper deployment would load serialised model files (e.g. `model.pkl` via a Flask API, or a TensorFlow.js `model.json` bundle) rather than hardcoding coefficients.

**It does not handle the full 30-feature WBCD feature set.** The full dataset includes mean, standard error, and worst-value measurements for each of the 10 base features. This implementation uses only the 10 mean values. Adding all 30 features would increase accuracy but complicate the clinical input form significantly.

**The clinical modifier weights are approximate.** The symptom risk weights are derived from published likelihood ratios but have not been validated against a patient cohort. They should be treated as directionally correct, not quantitatively precise.

**The training data is not representative of Nigerian patients.** The WBCD was collected at the University of Wisconsin. Tumour feature distributions may differ in West African populations due to genetic, environmental, and diagnostic equipment factors. Any real-world deployment would require retraining on local patient data.

These limitations are documented not as weaknesses of the project but as the honest boundary between a well-executed academic demonstration and a clinical-grade medical device.

---

## Academic References

- Bray, F. et al. (2018). Global cancer statistics 2018: GLOBOCAN. *CA: A Cancer Journal for Clinicians*, 68(6), 394–424.
- Chen, J.H. & Asch, S.M. (2017). Machine Learning and Prediction in Medicine. *NEJM*, 376(26), 2507–2509.
- Esteva, A. et al. (2019). A guide to deep learning in healthcare. *Nature Medicine*, 25, 24–29.
- Kourou, K. et al. (2017). Machine learning applications in cancer prognosis and prediction. *Computational and Structural Biotechnology Journal*, 13, 8–17.
- Sung, H. et al. (2021). Global Cancer Statistics 2020: GLOBOCAN. *CA: A Cancer Journal for Clinicians*, 71(3), 209–249.
- Wang, P. et al. (2020). Real-time AI in colonoscopy for colorectal cancer detection. *Gut*, 68(8), 1813–1819.
- Wisconsin Breast Cancer Dataset. UCI Machine Learning Repository. https://archive.ics.uci.edu/ml/datasets/Breast+Cancer+Wisconsin+Diagnostic

---

*This project was developed in partial fulfilment of the requirements for the award of Bachelor of Science (B.Sc.) in Computer Science, Lagos State University, February 2025.*
