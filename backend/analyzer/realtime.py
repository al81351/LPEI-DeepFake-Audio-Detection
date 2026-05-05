"""Real-time audio chunk processor with sliding-window buffer.

Used by the WS /analyze-stream endpoint to provide continuous
syntheticity index updates with latency ≤ 200 ms (RNF-01, RF-02).

Protocol (WebSocket):
    1. Client → JSON config:   {"sample_rate": 22050, "threshold": 50.0}
    2. Client → binary frames: raw PCM float32 little-endian chunks
    3. Server → JSON result:   {"syntheticity_index": …, "label": …,
                                "confidence": …, "is_alert": …,
                                "buffer_seconds": …}
"""

import numpy as np

from analyzer.feature_extractor import FeatureExtractor

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

#: Minimum number of samples required to extract meaningful MFCCs.
_MIN_SAMPLES: int = 512

#: Default analysis window length in seconds (1 s gives stable MFCCs).
_WINDOW_SECONDS: float = 1.0

#: Minimum interval between consecutive analyses in seconds (≤ 200 ms → RNF-01).
_HOP_SECONDS: float = 0.2


class RealtimeProcessor:
    """Sliding-window buffer that accumulates audio chunks and triggers analysis.

    Each :meth:`push_chunk` call appends new samples to an internal ring buffer
    of fixed duration (``window_seconds``).  Once the buffer holds at least
    ``_MIN_SAMPLES`` samples *and* at least ``hop_seconds`` worth of new audio
    has arrived since the last analysis, :meth:`should_analyze` returns ``True``
    and the caller may invoke :meth:`extract_features` to obtain MFCCs ready
    for the SVM classifier.

    Args:
        sample_rate: Sample rate of the incoming audio stream in Hz.
        window_seconds: Duration of the analysis window (default 1.0 s).
        hop_seconds: Minimum inter-analysis interval (default 0.2 s / 200 ms).

    Example::

        processor = RealtimeProcessor(sample_rate=44100)
        detector  = Detector()

        for chunk in audio_stream():
            processor.push_chunk(chunk)
            if processor.should_analyze():
                mfccs  = processor.extract_features()
                result = detector._classify(mfccs)
                emit(result)
    """

    def __init__(
        self,
        sample_rate: int = 22050,
        window_seconds: float = _WINDOW_SECONDS,
        hop_seconds: float = _HOP_SECONDS,
    ) -> None:
        self.sample_rate: int = sample_rate
        self.window_samples: int = int(sample_rate * window_seconds)
        self.hop_samples: int = max(1, int(sample_rate * hop_seconds))

        self._buffer: np.ndarray = np.array([], dtype=np.float32)
        self._samples_since_last: int = 0
        self._extractor = FeatureExtractor()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def push_chunk(self, chunk: np.ndarray) -> None:
        """Appends a new audio chunk to the sliding buffer.

        The buffer is kept at most ``window_samples`` long by discarding the
        oldest samples when it overflows.

        Args:
            chunk: 1-D float32 array of PCM samples.

        Raises:
            ValueError: If ``chunk`` is not a 1-D array.
        """
        chunk = np.asarray(chunk, dtype=np.float32)
        if chunk.ndim != 1:
            raise ValueError(
                f"chunk deve ser 1-D, mas tem shape {chunk.shape}."
            )

        self._buffer = np.concatenate([self._buffer, chunk])
        self._samples_since_last += len(chunk)

        # Keep only the most recent window_samples
        if len(self._buffer) > self.window_samples:
            self._buffer = self._buffer[-self.window_samples :]

    def should_analyze(self) -> bool:
        """Returns ``True`` when there is enough data for a new analysis.

        Conditions:
        - Buffer has at least :data:`_MIN_SAMPLES` samples (≈ 12 ms at 44 100 Hz).
        - At least ``hop_samples`` new samples have arrived since the last call
          to :meth:`extract_features` (rate-limits output to ≤ 200 ms cadence).

        Returns:
            ``True`` if both conditions are met, ``False`` otherwise.
        """
        return (
            len(self._buffer) >= _MIN_SAMPLES
            and self._samples_since_last >= self.hop_samples
        )

    def extract_features(self) -> np.ndarray:
        """Extracts mean MFCCs from the current window and resets the hop counter.

        Should only be called after :meth:`should_analyze` returns ``True``.

        Returns:
            1-D numpy array of shape ``(13,)`` containing mean MFCC coefficients.
        """
        self._samples_since_last = 0
        return self._extractor.extract_mfccs(self._buffer, self.sample_rate)

    def reset(self) -> None:
        """Clears the internal buffer and resets all counters.

        Call this when a WebSocket session ends or when the client reconnects
        with a new stream to avoid contaminating the new session with stale data.
        """
        self._buffer = np.array([], dtype=np.float32)
        self._samples_since_last = 0

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def buffer_seconds(self) -> float:
        """Current buffer fill level in seconds."""
        return len(self._buffer) / self.sample_rate

    @property
    def buffer_samples(self) -> int:
        """Number of samples currently in the buffer."""
        return len(self._buffer)
