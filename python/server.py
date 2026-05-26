"""
server.py — FastAPI prediction server for CancerTrack.

Start with:
    uvicorn python.server:app --reload --port 8000
"""

from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CancerTrack Model API",
    description="Breast cancer risk assessment — LR + Decision Tree ensemble (WBCD-trained).",
    version="1.0.0",
)

# Allow requests from the Next.js dev server and production URL.
# Add your Vercel URL here when deploying.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Load model bundle (once at startup) ───────────────────────────────────────
MODEL_PATH = Path(__file__).parent / "model.pkl"

if not MODEL_PATH.exists():
    raise RuntimeError(
        f"model.pkl not found at {MODEL_PATH}. "
        "Run  python python/train.py  first."
    )

_bundle        = joblib.load(MODEL_PATH)
_lr            = _bundle["lr"]
_dt            = _bundle["dt"]
_scaler        = _bundle["scaler"]
_feature_names = _bundle["feature_names"]
_metadata      = _bundle.get("metadata", {})

print(f"✅  Model loaded — LR acc {_metadata.get('lr_test_acc','?')}  |  DT acc {_metadata.get('dt_test_acc','?')}")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """10 WBCD mean-value features. All must be non-negative."""
    radius:            float = Field(..., ge=0, description="Mean tumour radius (mm)")
    texture:           float = Field(..., ge=0, description="Std dev of grey-scale values")
    perimeter:         float = Field(..., ge=0, description="Mean perimeter (mm)")
    area:              float = Field(..., ge=0, description="Mean area (mm²)")
    smoothness:        float = Field(..., ge=0, description="Local radius variation")
    compactness:       float = Field(..., ge=0, description="(perimeter² / area) − 1.0")
    concavity:         float = Field(..., ge=0, description="Severity of concave contour")
    concave_points:    float = Field(..., ge=0, description="Number of concave points")
    symmetry:          float = Field(..., ge=0, description="Tumour symmetry measure")
    fractal_dimension: float = Field(..., ge=0, description="Coastline approximation")

    def to_array(self) -> np.ndarray:
        return np.array([[
            self.radius, self.texture, self.perimeter, self.area,
            self.smoothness, self.compactness, self.concavity,
            self.concave_points, self.symmetry, self.fractal_dimension,
        ]])


class DecisionTreeOutput(BaseModel):
    malignant: bool
    prob:      float = Field(..., ge=0, le=1)
    path:      list[str]


class PredictResponse(BaseModel):
    lr_prob:       float = Field(..., ge=0, le=1, description="LR malignancy probability")
    dt_result:     DecisionTreeOutput
    ensemble:      float = Field(..., ge=0, le=1, description="Weighted ensemble score")
    z_scores:      list[float]                   = Field(..., description="Standardised feature values")
    model_version: str                           = "1.0.0-wbcd"
    lr_accuracy:   float                         = Field(default=0.0)
    dt_accuracy:   float                         = Field(default=0.0)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _trace_tree(scaled: np.ndarray) -> tuple[bool, float, list[str]]:
    """
    Walk the fitted DecisionTree node-by-node and collect a human-readable
    path of split conditions (matching what the frontend DecisionPath component renders).
    """
    tree  = _dt.tree_
    node  = 0
    path: list[str] = []

    while tree.children_left[node] != -1:          # not a leaf
        feat_idx  = tree.feature[node]
        threshold = tree.threshold[node]
        val       = scaled[0, feat_idx]

        # Shorten feature name: "mean radius" → "radius"
        fname = (
            _feature_names[feat_idx]
            .replace("mean ", "")
            .replace(" ", "_")
        )

        if val <= threshold:
            path.append(f"{fname}≤{threshold:.3f}")
            node = tree.children_left[node]
        else:
            path.append(f"{fname}>{threshold:.3f}")
            node = tree.children_right[node]

    # Leaf node: tree.value shape is (nodes, 1, n_classes)
    # WBCD class order: 0 = malignant, 1 = benign
    leaf_values    = tree.value[node][0]
    total          = leaf_values.sum()
    malignant_prob = float(leaf_values[0] / total)
    malignant      = malignant_prob >= 0.5

    return malignant, malignant_prob, path


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health() -> dict:
    """Liveness check — call this to verify the server is up before running analysis."""
    return {
        "status":       "ok",
        "model":        "wbcd-lr-dt-ensemble",
        "lr_accuracy":  _metadata.get("lr_test_acc"),
        "dt_accuracy":  _metadata.get("dt_test_acc"),
        "n_features":   len(_feature_names),
    }


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
def predict(req: PredictRequest) -> PredictResponse:
    """
    Run LR + Decision Tree inference on one patient's tumour measurements.

    Returns individual model probabilities, the ensemble score, and
    the decision tree traversal path for explainability.
    """
    raw    = req.to_array()                   # shape (1, 10)
    scaled = _scaler.transform(raw)           # StandardScaler normalisation

    # ── Logistic Regression ──────────────────────────────────────────────────
    # predict_proba returns P(class_0), P(class_1) where class_0 = malignant
    lr_proba   = _lr.predict_proba(scaled)[0]
    lr_prob    = float(lr_proba[0])           # P(malignant)

    # ── Decision Tree ────────────────────────────────────────────────────────
    malignant, dt_prob, path = _trace_tree(scaled)

    # ── Ensemble (model-only, no clinical modifier) ──────────────────────────
    # The Next.js frontend blends this with its clinical modifier layer.
    ensemble = float(lr_prob * 0.65 + dt_prob * 0.35)
    ensemble = max(0.01, min(0.99, ensemble))

    return PredictResponse(
        lr_prob      = lr_prob,
        dt_result    = DecisionTreeOutput(malignant=malignant, prob=dt_prob, path=path),
        ensemble     = ensemble,
        z_scores     = scaled[0].tolist(),
        lr_accuracy  = float(_metadata.get("lr_test_acc", 0)),
        dt_accuracy  = float(_metadata.get("dt_test_acc", 0)),
    )
