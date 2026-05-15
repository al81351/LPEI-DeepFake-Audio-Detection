"""Acoustic artifact analysis for deepfake detection dashboards."""

import numpy as np
import librosa

# ---------------------------------------------------------------------------
# Normalization thresholds for artifact scores
# ---------------------------------------------------------------------------

# Variance (dB²) of the mel spectrogram below which over-smoothing is
# suspected.  A typical natural-speech mel spectrogram has variance well
# above this; TTS-generated speech tends to be unnaturally flat.
_MEL_VAR_THRESHOLD: float = 100.0

# Mean frame-to-frame mel spectrogram change (dB) mapped to a score of 1.0.
# Values above this threshold indicate strong spectral discontinuities.
_DISCONTINUITY_THRESHOLD: float = 5.0


class ArtifactAnalyzer:
    """Computes acoustic and synthesis-artifact metrics from a raw audio signal.

    All computations are pure in-memory operations — no I/O (RNF-01).
    Short or silent signals are handled gracefully: individual metrics
    default to 0.0 rather than raising exceptions.

    Typical usage::

        analyzer = ArtifactAnalyzer()
        metrics  = analyzer.analyze(signal, sample_rate)
        badges   = metrics["artifacts"]["artifacts_detected"]
        # → ["over_smoothing", "artificial_periodicity"]
    """

    def analyze(self, signal: np.ndarray, sample_rate: int) -> dict:
        """Computes all acoustic and artifact metrics for the given audio signal.

        Args:
            signal: 1-D float32 numpy array of PCM samples.
            sample_rate: Sample rate in Hz.

        Returns:
            Dictionary with three top-level keys:

            - ``acoustic`` — basic acoustic measurements (duration, dominant
              frequency, RMS energy, zero-crossing rate).
            - ``spectral`` — spectral shape descriptors (centroid, rolloff,
              flatness).
            - ``artifacts`` — synthesis artifact scores and a list of detected
              artifact names for frontend badge rendering (RF-07).
        """
        return {
            "acoustic": self._compute_acoustic(signal, sample_rate),
            "spectral": self._compute_spectral(signal, sample_rate),
            "artifacts": self._compute_artifacts(signal, sample_rate),
        }

    # ------------------------------------------------------------------
    # Group 1 — Acoustic basics
    # ------------------------------------------------------------------

    def _compute_acoustic(self, signal: np.ndarray, sample_rate: int) -> dict:
        duration = round(len(signal) / sample_rate, 4)

        try:
            fft_mag = np.abs(np.fft.rfft(signal))
            freqs = np.fft.rfftfreq(len(signal), d=1.0 / sample_rate)
            dominant_frequency = round(float(freqs[np.argmax(fft_mag)]), 4)
        except Exception:
            dominant_frequency = 0.0

        try:
            rms_energy = round(float(np.sqrt(np.mean(signal ** 2))), 4)
        except Exception:
            rms_energy = 0.0

        try:
            zcr = librosa.feature.zero_crossing_rate(signal)
            zero_crossing_rate = round(float(np.mean(zcr)), 4)
        except Exception:
            zero_crossing_rate = 0.0

        return {
            "duration_seconds": duration,
            "dominant_frequency": dominant_frequency,
            "rms_energy": rms_energy,
            "zero_crossing_rate": zero_crossing_rate,
        }

    # ------------------------------------------------------------------
    # Group 2 — Spectral descriptors
    # ------------------------------------------------------------------

    def _compute_spectral(self, signal: np.ndarray, sample_rate: int) -> dict:
        try:
            spectral_centroid = round(
                float(np.mean(librosa.feature.spectral_centroid(y=signal, sr=sample_rate))), 4
            )
        except Exception:
            spectral_centroid = 0.0

        try:
            spectral_rolloff = round(
                float(np.mean(
                    librosa.feature.spectral_rolloff(y=signal, sr=sample_rate, roll_percent=0.85)
                )), 4
            )
        except Exception:
            spectral_rolloff = 0.0

        try:
            spectral_flatness = round(
                float(np.mean(librosa.feature.spectral_flatness(y=signal))), 4
            )
        except Exception:
            spectral_flatness = 0.0

        return {
            "spectral_centroid": spectral_centroid,
            "spectral_rolloff": spectral_rolloff,
            "spectral_flatness": spectral_flatness,
        }

    # ------------------------------------------------------------------
    # Group 3 — Synthesis artifact scores (RF-07)
    # ------------------------------------------------------------------

    def _compute_artifacts(self, signal: np.ndarray, sample_rate: int) -> dict:
        over_smoothing = self._over_smoothing_score(signal, sample_rate)
        periodicity = self._artificial_periodicity_score(signal, sample_rate)
        discontinuity = self._spectral_discontinuity_score(signal, sample_rate)

        detected = [
            name
            for name, score in [
                ("over_smoothing", over_smoothing),
                ("artificial_periodicity", periodicity),
                ("spectral_discontinuity", discontinuity),
            ]
            if score > 0.5
        ]

        return {
            "over_smoothing_score": over_smoothing,
            "artificial_periodicity_score": periodicity,
            "spectral_discontinuity_score": discontinuity,
            "artifacts_detected": detected,
        }

    def _over_smoothing_score(self, signal: np.ndarray, sample_rate: int) -> float:
        """Detects over-smoothing via mel spectrogram variance.

        Low variance in the dB-scaled mel spectrogram indicates that spectral
        transitions are unnaturally flat — a common trait of parametric and
        neural TTS systems.

        Args:
            signal: 1-D audio samples.
            sample_rate: Sample rate in Hz.

        Returns:
            Score in [0.0, 1.0]; higher means more over-smoothed.
        """
        try:
            mel = librosa.feature.melspectrogram(y=signal, sr=sample_rate)
            mel_db = librosa.power_to_db(mel, ref=np.max)
            score = 1.0 - np.clip(np.var(mel_db) / _MEL_VAR_THRESHOLD, 0.0, 1.0)
            return round(float(score), 4)
        except Exception:
            return 0.0

    def _artificial_periodicity_score(self, signal: np.ndarray, sample_rate: int) -> float:
        """Detects unnaturally regular harmonic periodicity via autocorrelation.

        Human speech has natural pitch variation; many TTS systems produce
        overly regular pitch patterns.  This score measures the peak
        normalized autocorrelation in the pitch-frequency range (50–500 Hz):
        a strong, isolated peak suggests artificial periodicity.

        Args:
            signal: 1-D audio samples.
            sample_rate: Sample rate in Hz.

        Returns:
            Score in [0.0, 1.0]; higher means more artificial periodicity.
        """
        try:
            min_lag = max(1, sample_rate // 500)   # lag for 500 Hz
            max_lag = sample_rate // 50             # lag for 50 Hz

            corr = librosa.autocorrelate(signal, max_size=max_lag + 1)
            if corr[0] == 0 or len(corr) <= min_lag:
                return 0.0

            corr_norm = corr / (corr[0] + 1e-10)
            peak = float(np.max(corr_norm[min_lag:]))
            return round(float(np.clip(peak, 0.0, 1.0)), 4)
        except Exception:
            return 0.0

    def _spectral_discontinuity_score(self, signal: np.ndarray, sample_rate: int) -> float:
        """Detects abrupt spectral changes between consecutive frames.

        Some vocoders and neural TTS systems produce audible glitches at frame
        boundaries, visible as large jumps in the mel spectrogram.  The score
        is the mean absolute frame-to-frame difference, normalized by
        :data:`_DISCONTINUITY_THRESHOLD`.

        Args:
            signal: 1-D audio samples.
            sample_rate: Sample rate in Hz.

        Returns:
            Score in [0.0, 1.0]; higher means more discontinuities.
        """
        try:
            mel = librosa.feature.melspectrogram(y=signal, sr=sample_rate)
            mel_db = librosa.power_to_db(mel, ref=np.max)
            if mel_db.shape[1] < 2:
                return 0.0
            mean_diff = float(np.mean(np.abs(np.diff(mel_db, axis=1))))
            return round(float(np.clip(mean_diff / _DISCONTINUITY_THRESHOLD, 0.0, 1.0)), 4)
        except Exception:
            return 0.0
