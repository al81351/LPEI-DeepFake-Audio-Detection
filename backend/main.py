"""FastAPI application for the Digital Voice Shield deepfake audio detection service."""

import os
import uuid
import tempfile
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from analyzer.detector import Detector
from analyzer.feature_extractor import FeatureExtractor

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MAX_FILE_BYTES = 100 * 1024 * 1024  # 100 MB
_SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".flac"}
_MODEL_PATH = "models/classifier.pkl"

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class AnalysisResult(BaseModel):
    """Full result returned by the /analyze endpoint."""

    syntheticity_index: float
    label: str
    confidence: float
    is_alert: bool
    threshold_used: float
    mfccs: list[float]
    spectrogram: dict
    file_name: str
    timestamp: str


class HistoryEntry(BaseModel):
    """Lightweight record stored in the session history."""

    id: str
    file_name: str
    syntheticity_index: float
    label: str
    timestamp: str


class ExportReport(BaseModel):
    """Exportable JSON report covering the full session history."""

    generated_at: str
    total_analyses: int
    analyses: list[HistoryEntry]


# ---------------------------------------------------------------------------
# Application & middleware
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Digital Voice Shield",
    description="REST API for deepfake audio detection. "
    "Calculates a Syntheticity Index (0–100 %) indicating how likely "
    "a voice recording is to be AI-generated.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

_session_history: list[HistoryEntry] = []

# ---------------------------------------------------------------------------
# Singleton helpers
# ---------------------------------------------------------------------------

_detector: Detector | None = None
_extractor: FeatureExtractor = FeatureExtractor()


def _get_detector() -> Detector:
    """Returns the shared Detector instance, initialising it on first call.

    Returns:
        Initialised :class:`~analyzer.detector.Detector` ready for inference.

    Raises:
        HTTPException: 503 if ``models/classifier.pkl`` is not found.
    """
    global _detector
    if _detector is None:
        try:
            _detector = Detector(model_path=_MODEL_PATH)
        except FileNotFoundError:
            raise HTTPException(
                status_code=503,
                detail="Modelo não disponível. Corre train.py primeiro.",
            )
    return _detector


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/", summary="Health check")
def health_check() -> dict:
    """Returns a simple liveness indicator.

    Returns:
        Dictionary with ``status`` and ``service`` fields.
    """
    return {"status": "ok", "service": "Digital Voice Shield"}


@app.post("/analyze", response_model=AnalysisResult, summary="Analyse an audio file")
async def analyze_audio(
    file: UploadFile = File(..., description="Audio file (.wav, .mp3, or .flac)"),
    threshold: float = Query(
        default=50.0,
        ge=0.0,
        le=100.0,
        description="Alert threshold (0–100). Triggers is_alert when syntheticity_index >= threshold.",
    ),
    detector: Detector = Depends(_get_detector),
) -> AnalysisResult:
    """Classifies an uploaded audio file as real or synthetic (RF-01, RF-04, RF-09, RF-10, RF-13).

    Saves the upload to a temporary file, runs the SVM classifier, extracts
    the Mel spectrogram for frontend visualisation, then deletes the temp
    file before responding.

    Args:
        file: Multipart audio upload.
        threshold: Syntheticity index threshold that triggers an alert.
        detector: Injected :class:`~analyzer.detector.Detector` singleton.

    Returns:
        :class:`AnalysisResult` with classification metrics, MFCCs,
        spectrogram data, and alert status.

    Raises:
        HTTPException: 415 for unsupported file formats.
        HTTPException: 413 for files exceeding 100 MB.
        HTTPException: 500 for any internal processing error.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Formato não suportado: '{ext}'. "
                f"Formatos aceites: {', '.join(sorted(_SUPPORTED_EXTENSIONS))}."
            ),
        )

    content = await file.read()
    if len(content) > _MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Ficheiro demasiado grande. O tamanho máximo é 100 MB.",
        )

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        detection = detector.analyze_file(tmp_path)

        signal, sample_rate = _extractor.load_audio(tmp_path)
        spectrogram_raw = _extractor.extract_spectrogram(signal, sample_rate)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    timestamp = datetime.now(timezone.utc).isoformat()
    is_alert = detector.is_above_threshold(detection, threshold=threshold)

    spectrogram = {
        "data": spectrogram_raw["data"].tolist(),
        "times": spectrogram_raw["times"].tolist(),
        "frequencies": spectrogram_raw["frequencies"].tolist(),
    }

    entry = HistoryEntry(
        id=str(uuid.uuid4()),
        file_name=file.filename or "unknown",
        syntheticity_index=detection["syntheticity_index"],
        label=detection["label"],
        timestamp=timestamp,
    )
    _session_history.append(entry)

    return AnalysisResult(
        syntheticity_index=detection["syntheticity_index"],
        label=detection["label"],
        confidence=detection["confidence"],
        is_alert=is_alert,
        threshold_used=threshold,
        mfccs=detection["mfccs"],
        spectrogram=spectrogram,
        file_name=file.filename or "unknown",
        timestamp=timestamp,
    )


@app.get("/history", response_model=list[HistoryEntry], summary="Session analysis history")
def get_history() -> list[HistoryEntry]:
    """Returns all analyses performed during the current server session (RF-14).

    Returns:
        List of :class:`HistoryEntry` ordered from oldest to newest.
    """
    return _session_history


@app.delete("/history", summary="Clear session history")
def clear_history() -> dict:
    """Removes all entries from the in-memory session history.

    Returns:
        Confirmation message.
    """
    _session_history.clear()
    return {"message": "Histórico limpo"}


@app.post("/export", summary="Export session report as JSON")
def export_report() -> JSONResponse:
    """Generates a downloadable JSON report of the full session history (RF-12).

    Returns:
        :class:`~fastapi.responses.JSONResponse` with a
        ``Content-Disposition: attachment`` header so browsers trigger a
        file download.
    """
    report = ExportReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        total_analyses=len(_session_history),
        analyses=list(_session_history),
    )
    return JSONResponse(
        content=report.model_dump(),
        headers={"Content-Disposition": "attachment; filename=dvs_report.json"},
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
