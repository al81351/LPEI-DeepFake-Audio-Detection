"""Real-time audio chunk processor with sliding-window buffer.

Used by the WS /analyze-stream endpoint to emit two types of messages:
- **tick** every ~200 ms: lightweight buffer-level + RMS update for the waveform.
- **probe** every ~3 s: full-window SVM classification with artifact metrics.

Protocol (WebSocket):
    1. Client → JSON config:   {"sample_rate": 22050, "threshold": 50.0}
    2. Client → binary frames: raw PCM float32 little-endian chunks
    3. Server → JSON tick:     {"type": "tick", "buffer_seconds": …, "rms_energy": …}
    4. Server → JSON probe:    {"type": "probe", "probe_id": …, "syntheticity_index": …,
                                "label": …, "confidence": …, "is_alert": …,
                                "latency_ms": …, "timestamp": …, "metrics": {…}}
"""

import numpy as np

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

#: Minimum number of samples required to extract meaningful MFCCs.
_MIN_SAMPLES: int = 512

#: Default analysis window length in seconds.
#: 3 s gives statistics closer to the full-file training distribution.
_WINDOW_SECONDS: float = 3.0

#: Minimum interval between consecutive tick messages in seconds (≤ 200 ms → RNF-01).
_HOP_SECONDS: float = 0.2


class RealtimeProcessor:
    """Sliding-window buffer that accumulates audio chunks and triggers ticks/probes.

    Two independent cadences are tracked:
    - **Tick** (every ``hop_seconds`` ≈ 200 ms): cheap buffer-level update sent
      to drive the waveform animation on the frontend.
    - **Probe** (every ``window_seconds`` ≈ 3 s of *new* audio since last probe):
      full SVM classification + artifact analysis on the complete 3-second window.

    Args:
        sample_rate: Sample rate of the incoming audio stream in Hz.
        window_seconds: Duration of the analysis window (default 3.0 s).
        hop_seconds: Minimum inter-tick interval (default 0.2 s / 200 ms).
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
        self._samples_since_last_tick: int = 0
        self._samples_since_last_probe: int = 0

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
        self._samples_since_last_tick += len(chunk)
        self._samples_since_last_probe += len(chunk)

        # Keep only the most recent window_samples
        if len(self._buffer) > self.window_samples:
            self._buffer = self._buffer[-self.window_samples:]

    def should_tick(self) -> bool:
        """Returns ``True`` when a lightweight tick update should be sent.

        Conditions:
        - Buffer has at least :data:`_MIN_SAMPLES` samples.
        - At least ``hop_samples`` new samples have arrived since the last tick.

        Returns:
            ``True`` if both conditions are met, ``False`` otherwise.
        """
        return (
            len(self._buffer) >= _MIN_SAMPLES
            and self._samples_since_last_tick >= self.hop_samples
        )

    def get_tick_data(self) -> tuple[float, float]:
        """Returns (buffer_seconds, rms_energy) for the current buffer and resets tick counter.

        Should only be called after :meth:`should_tick` returns ``True``.

        Returns:
            Tuple of (buffer_seconds, rms_energy).
        """
        self._samples_since_last_tick = 0
        buf_sec = self.buffer_seconds
        rms = float(np.sqrt(np.mean(self._buffer ** 2))) if len(self._buffer) > 0 else 0.0
        return buf_sec, round(rms, 4)

    def should_probe(self) -> bool:
        """Returns ``True`` when a full 3-second probe analysis should be sent.

        Conditions:
        - Buffer holds a complete window (≥ ``window_samples`` samples).
        - At least ``window_samples`` new samples have arrived since the last probe.

        Returns:
            ``True`` if both conditions are met, ``False`` otherwise.
        """
        return (
            len(self._buffer) >= self.window_samples
            and self._samples_since_last_probe >= self.window_samples
        )

    def get_probe_window(self) -> np.ndarray:
        """Returns the full 3-second analysis window and resets both counters.

        Should only be called after :meth:`should_probe` returns ``True``.

        Returns:
            Copy of the current buffer as a 1-D float32 array.
        """
        self._samples_since_last_probe = 0
        self._samples_since_last_tick = 0
        return self._buffer.copy()

    def reset(self) -> None:
        """Clears the internal buffer and resets all counters.

        Call this when a WebSocket session ends or when the client reconnects
        with a new stream to avoid contaminating the new session with stale data.
        """
        self._buffer = np.array([], dtype=np.float32)
        self._samples_since_last_tick = 0
        self._samples_since_last_probe = 0

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
