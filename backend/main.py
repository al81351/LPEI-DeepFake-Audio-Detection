"""FastAPI application for the Digital Voice Shield deepfake audio detection service."""

import json
import os
import random
import secrets
import uuid
import tempfile
import time
from datetime import datetime, timezone

import librosa
import numpy as np
from fastapi import Depends, FastAPI, File, HTTPException, Query, Response, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer.artifacts import ArtifactAnalyzer
from analyzer.detector import Detector
from analyzer.feature_extractor import FeatureExtractor
from analyzer.realtime import RealtimeProcessor
from analyzer.report_generator import ReportGenerator

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
    metrics: dict
    file_name: str
    timestamp: str


class HistoryEntry(BaseModel):
    """Lightweight record stored in the session history."""

    id: str
    file_name: str
    syntheticity_index: float
    label: str
    confidence: float
    is_alert: bool
    threshold_used: float
    metrics: dict
    timestamp: str


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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
_artifact_analyzer: ArtifactAnalyzer = ArtifactAnalyzer()
_report_generator: ReportGenerator = ReportGenerator()


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
        metrics = _artifact_analyzer.analyze(signal, sample_rate)

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

    # Derive the label from the user-configured threshold, not the model's
    # internal default (which is always 50 %).  This ensures the history and
    # the returned result are consistent with the gauge / is_alert flag.
    threshold_label = "synthetic" if detection["syntheticity_index"] >= threshold else "real"

    entry = HistoryEntry(
        id=str(uuid.uuid4()),
        file_name=file.filename or "unknown",
        syntheticity_index=detection["syntheticity_index"],
        label=threshold_label,
        confidence=detection["confidence"],
        is_alert=is_alert,
        threshold_used=threshold,
        metrics=metrics,
        timestamp=timestamp,
    )
    _session_history.append(entry)

    return AnalysisResult(
        syntheticity_index=detection["syntheticity_index"],
        label=threshold_label,
        confidence=detection["confidence"],
        is_alert=is_alert,
        threshold_used=threshold,
        mfccs=detection["mfccs"],
        spectrogram=spectrogram,
        metrics=metrics,
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


@app.post("/export", summary="Export session report as PDF")
async def export_report() -> Response:
    """Generates a downloadable PDF report of the full session history (RF-12).

    Returns:
        PDF binary :class:`~fastapi.responses.Response` with a
        ``Content-Disposition: attachment`` header so browsers trigger a
        file download.

    Raises:
        HTTPException: 404 if there are no analyses in the current session.
    """
    if not _session_history:
        raise HTTPException(status_code=404, detail="Sem análises para exportar.")

    pdf_bytes = _report_generator.generate_pdf(
        [entry.model_dump() for entry in _session_history]
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=digital_voice_shield_report.pdf"
        },
    )


# ---------------------------------------------------------------------------
# WebSocket — real-time stream analysis  (RF-02, RNF-01)
# ---------------------------------------------------------------------------


@app.websocket("/analyze-stream")
async def analyze_stream(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time deepfake detection (RF-02, RNF-01).

    Processes a continuous audio stream from the browser microphone and
    pushes syntheticity index updates at ≤ 200 ms intervals.

    Protocol
    --------
    1. **Handshake** — client sends a UTF-8 JSON config frame::

        {"sample_rate": 22050, "threshold": 50.0}

       Both fields are optional; defaults are 22 050 Hz and 50.0.

    2. **Streaming** — client sends raw PCM audio as **binary** frames
       (float32, little-endian, mono).  Any number of samples per frame
       is acceptable; the processor accumulates them internally.

    3. **Results** — whenever the sliding window has ≥ 200 ms of new data
       *and* the buffer holds ≥ 512 samples, the server responds with a
       UTF-8 JSON frame::

        {
          "syntheticity_index": 73.4,
          "label":              "synthetic",
          "confidence":         73.4,
          "is_alert":           true,
          "buffer_seconds":     1.0
        }

    4. **Close** — the client closes the connection normally; the server
       resets the processor and exits cleanly.

    Error handling
    --------------
    - If the model is unavailable the server sends
      ``{"error": "…"}`` and closes with code 1011.
    - Malformed binary frames produce ``{"error": "…"}`` but keep the
      connection alive so the stream can recover.

    Args:
        websocket: The WebSocket connection injected by FastAPI.
    """
    await websocket.accept()

    try:
        detector = _get_detector()
    except HTTPException as exc:
        await websocket.send_text(json.dumps({"error": exc.detail}))
        await websocket.close(code=1011)
        return

    # ------------------------------------------------------------------
    # Step 1 — read optional config frame
    # ------------------------------------------------------------------
    sample_rate: int = 22050
    threshold: float = 50.0
    first_audio_bytes: bytes | None = None  # may hold the first audio frame

    try:
        raw = await websocket.receive()
        if raw.get("type") == "websocket.disconnect":
            return
        if raw.get("text"):
            cfg = json.loads(raw["text"])
            sample_rate = int(cfg.get("sample_rate", sample_rate))
            threshold = float(cfg.get("threshold", threshold))
            if not (0.0 <= threshold <= 100.0):
                raise ValueError(f"threshold fora do intervalo [0, 100]: {threshold}")
        elif raw.get("bytes"):
            # Client skipped the config frame — treat this as the first audio chunk
            first_audio_bytes = raw["bytes"]
    except (json.JSONDecodeError, ValueError, KeyError) as exc:
        await websocket.send_text(json.dumps({"error": f"Config inválida: {exc}"}))
        await websocket.close(code=1008)
        return

    processor = RealtimeProcessor(sample_rate=sample_rate)

    # ------------------------------------------------------------------
    # Helper — process one binary frame
    # ------------------------------------------------------------------
    async def _process_binary(data: bytes) -> None:
        try:
            chunk = np.frombuffer(data, dtype=np.float32)
        except ValueError as exc:
            await websocket.send_text(json.dumps({"error": f"Frame inválido: {exc}"}))
            return

        processor.push_chunk(chunk)

        # Probe every 3 s — full SVM + artifact analysis on the complete window
        if processor.should_probe():
            t_start = time.perf_counter()
            window = processor.get_probe_window()
            result = detector.analyze_chunk(window, processor.sample_rate)
            artifact_result = _artifact_analyzer.analyze(window, processor.sample_rate)
            latency_ms = round((time.perf_counter() - t_start) * 1000, 1)

            is_alert = detector.is_above_threshold(result, threshold=threshold)
            # Use the user-configured threshold to derive the label, not the
            # model's internal default (50 %).
            probe_label = "synthetic" if result["syntheticity_index"] >= threshold else "real"
            probe_id = f"PROBE-{secrets.token_hex(2).upper()}-{random.randint(1000, 9999)}"
            timestamp = datetime.now(timezone.utc).isoformat()

            rms = round(float(np.sqrt(np.mean(window ** 2))), 4)
            zcr = round(float(np.mean(librosa.feature.zero_crossing_rate(window))), 4)

            await websocket.send_text(
                json.dumps(
                    {
                        "type": "probe",
                        "probe_id": probe_id,
                        "syntheticity_index": round(result["syntheticity_index"], 2),
                        "label": probe_label,
                        "confidence": round(result["confidence"], 2),
                        "is_alert": is_alert,
                        "latency_ms": latency_ms,
                        "timestamp": timestamp,
                        "metrics": {
                            "rms_energy": rms,
                            "zero_crossing_rate": zcr,
                            "over_smoothing_score": artifact_result["artifacts"]["over_smoothing_score"],
                            "artificial_periodicity_score": artifact_result["artifacts"]["artificial_periodicity_score"],
                            "spectral_discontinuity_score": artifact_result["artifacts"]["spectral_discontinuity_score"],
                        },
                    }
                )
            )
            return  # probe sent — skip tick for this frame

        # Tick every 200 ms — cheap buffer indicator for the waveform animation
        if processor.should_tick():
            buf_sec, rms = processor.get_tick_data()
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "tick",
                        "buffer_seconds": round(buf_sec, 3),
                        "rms_energy": rms,
                    }
                )
            )

    # Process the first frame if it arrived before the config
    if first_audio_bytes is not None:
        await _process_binary(first_audio_bytes)

    # ------------------------------------------------------------------
    # Step 2 — main receive loop
    # ------------------------------------------------------------------
    try:
        while True:
            raw = await websocket.receive()

            if raw.get("bytes"):
                await _process_binary(raw["bytes"])
            elif raw.get("text"):
                # Accept mid-session threshold updates: {"threshold": 70}
                try:
                    msg = json.loads(raw["text"])
                    if "threshold" in msg:
                        new_thr = float(msg["threshold"])
                        if 0.0 <= new_thr <= 100.0:
                            threshold = new_thr
                except (json.JSONDecodeError, ValueError):
                    pass  # silently ignore malformed text frames

    except (WebSocketDisconnect, RuntimeError):
        processor.reset()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
