"""
train.py — Train and save the CancerTrack ML models.

Run this once before starting the server:
    python python/train.py

Outputs:
    python/model.pkl          — serialised scikit-learn bundle
    python/scaler_params.json — scaler stats (paste into lib/constants.ts to keep frontend in sync)
"""

import json
import joblib
import numpy as np
from pathlib import Path

from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)

OUT_DIR = Path(__file__).parent   # python/

# ── 1. Load dataset ───────────────────────────────────────────────────────────
print("Loading Wisconsin Breast Cancer Dataset...")
data = load_breast_cancer()

# WBCD: target 1 = benign, 0 = malignant
# We use the first 10 features (mean values) to match the frontend form fields
FEATURE_IDX   = list(range(10))          # radius_mean … fractal_dimension_mean
feature_names = [data.feature_names[i] for i in FEATURE_IDX]

X = data.data[:, FEATURE_IDX]
y = data.target                           # 1=benign, 0=malignant

print(f"  Samples : {len(X)}")
print(f"  Benign  : {y.sum()} ({y.mean()*100:.1f}%)")
print(f"  Malignant: {(1-y).sum()} ({(1-y).mean()*100:.1f}%)")
print(f"  Features: {feature_names}\n")

# ── 2. Train / test split ─────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# ── 3. Normalise ──────────────────────────────────────────────────────────────
scaler  = StandardScaler()
Xs_train = scaler.fit_transform(X_train)
Xs_test  = scaler.transform(X_test)

# ── 4. Logistic Regression ────────────────────────────────────────────────────
print("Training Logistic Regression …")
lr = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
lr.fit(Xs_train, y_train)

lr_preds = lr.predict(Xs_test)
lr_acc   = accuracy_score(y_test, lr_preds)
lr_auc   = roc_auc_score(y_test, lr.predict_proba(Xs_test)[:, 1])
lr_cv    = cross_val_score(lr, scaler.transform(X), y, cv=5, scoring="accuracy")

print(f"  Test accuracy : {lr_acc:.4f}")
print(f"  Test AUC-ROC  : {lr_auc:.4f}")
print(f"  5-fold CV     : {lr_cv.mean():.4f} ± {lr_cv.std():.4f}")
print(classification_report(y_test, lr_preds, target_names=["Malignant", "Benign"]))

# ── 5. Decision Tree ──────────────────────────────────────────────────────────
print("Training Decision Tree …")
dt = DecisionTreeClassifier(max_depth=4, random_state=42)
dt.fit(Xs_train, y_train)

dt_preds = dt.predict(Xs_test)
dt_acc   = accuracy_score(y_test, dt_preds)
dt_cv    = cross_val_score(dt, scaler.transform(X), y, cv=5, scoring="accuracy")

print(f"  Test accuracy : {dt_acc:.4f}")
print(f"  5-fold CV     : {dt_cv.mean():.4f} ± {dt_cv.std():.4f}")
print(export_text(dt, feature_names=feature_names))

# ── 6. Save model bundle ──────────────────────────────────────────────────────
model_path = OUT_DIR / "model.pkl"
joblib.dump(
    {
        "lr":            lr,
        "dt":            dt,
        "scaler":        scaler,
        "feature_names": feature_names,
        "metadata": {
            "dataset":       "Wisconsin Breast Cancer Dataset (sklearn built-in)",
            "n_samples":     len(X),
            "n_features":    len(FEATURE_IDX),
            "feature_idx":   FEATURE_IDX,
            "lr_test_acc":   round(lr_acc, 4),
            "lr_auc":        round(lr_auc, 4),
            "dt_test_acc":   round(dt_acc, 4),
        },
    },
    model_path,
)
print(f"\n✅  Saved model bundle → {model_path}")

# ── 7. Export scaler params for frontend sync ─────────────────────────────────
params = {
    "_note": "Paste SCALER_MEAN and SCALER_STD into lib/constants.ts to keep the JS fallback in sync.",
    "SCALER_MEAN": scaler.mean_.tolist(),
    "SCALER_STD":  scaler.scale_.tolist(),
    "LR_COEF":     lr.coef_[0].tolist(),
    "LR_BIAS":     float(lr.intercept_[0]),
    "feature_names": feature_names,
}
params_path = OUT_DIR / "scaler_params.json"
params_path.write_text(json.dumps(params, indent=2))
print(f"✅  Saved scaler params → {params_path}")
print("\nDone. Start the server with:")
print("    uvicorn python.server:app --reload --port 8000")
