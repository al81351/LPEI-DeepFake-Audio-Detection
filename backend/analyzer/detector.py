"""Classifier that wraps the trained SVM model and exposes a clean analysis API."""

import os
import joblib
import numpy as np

from analyzer.feature_extractor import FeatureExtractor

_REQUIRED_KEYS = {"model", "scaler", "classes"}


class Detector:
    """Loads a trained SVM classifier and classifies audio as real or synthetic.

    Example:
        detector = Detector()
        result = detector.analyze_file("sample.wav")
        if detector.is_above_threshold(result, threshold=60.0):
            print("Deepfake detected!")
    """

    def __init__(self, model_path: str = "models/classifier.pkl") -> None:
        """Loads the serialised model bundle from disk.

        Args:
            model_path: Path to the joblib-serialised .pkl file produced by
                ``train.py``. Relative paths are resolved from the current
                working directory.

        Raises:
            FileNotFoundError: If ``model_path`` does not point to an existing
                file.
            ValueError: If the loaded object is missing any of the required
                keys: ``model``, ``scaler``, ``classes``.
        """
        if not os.path.isfile(model_path):
            raise FileNotFoundError(
                f"Modelo não encontrado: {model_path}\n"
                "Corre `python train.py` a partir da pasta backend/ para gerar o modelo."
            )

        bundle = joblib.load(model_path)

        missing = _REQUIRED_KEYS - set(bundle.keys())
        if missing:
            raise ValueError(
                f"O ficheiro .pkl está incompleto. Chaves em falta: {missing}. "
                f"Chaves esperadas: {_REQUIRED_KEYS}."
            )

        self._model = bundle["model"]
        self._scaler = bundle["scaler"]
        self._classes: list[str] = bundle["classes"]
        self._extractor = FeatureExtractor()

    def analyze_file(self, file_path: str) -> dict:
        """Classifies an audio file as real or synthetic.

        Loads the file, extracts MFCCs via :class:`~analyzer.feature_extractor.FeatureExtractor`,
        normalises with the stored scaler, and runs ``predict_proba``.

        Args:
            file_path: Path to a supported audio file (.wav, .mp3, or .flac).

        Returns:
            A dictionary with the following keys:

            - ``syntheticity_index`` (float): Probability of being synthetic,
              scaled to 0–100.
            - ``label`` (str): ``"synthetic"`` or ``"real"``.
            - ``confidence`` (float): Probability of the predicted class,
              scaled to 0–100.
            - ``mfccs`` (list): The 13 MFCC coefficients used for classification.
            - ``file_path`` (str): The path that was analysed.

        Raises:
            FileNotFoundError: If ``file_path`` does not exist (propagated from
                :class:`~analyzer.feature_extractor.FeatureExtractor`).
            ValueError: If the audio format is unsupported or the signal is too
                short (propagated from
                :class:`~analyzer.feature_extractor.FeatureExtractor`).
        """
        signal, sample_rate = self._extractor.load_audio(file_path)
        mfccs = self._extractor.extract_mfccs(signal, sample_rate)
        result = self._classify(mfccs)
        result["mfccs"] = mfccs.tolist()
        result["file_path"] = file_path
        return result

    def analyze_chunk(self, signal: np.ndarray, sample_rate: int) -> dict:
        """Classifies a pre-loaded audio chunk (used for real-time microphone input).

        Operates entirely in memory — no I/O — to minimise latency (RNF-01).

        Args:
            signal: 1-D numpy array containing the audio samples.
            sample_rate: Sample rate of ``signal`` in Hz.

        Returns:
            A dictionary with the following keys:

            - ``syntheticity_index`` (float): Probability of being synthetic,
              scaled to 0–100.
            - ``label`` (str): ``"synthetic"`` or ``"real"``.
            - ``confidence`` (float): Probability of the predicted class,
              scaled to 0–100.

        Raises:
            ValueError: If ``signal`` is too short to extract meaningful MFCCs
                (fewer than 512 samples, i.e. < ~12 ms at 44 100 Hz).
        """
        if len(signal) < 512:
            raise ValueError(
                f"Sinal demasiado curto ({len(signal)} amostras). "
                "São necessárias pelo menos 512 amostras para extrair MFCCs."
            )
        mfccs = self._extractor.extract_mfccs(signal, sample_rate)
        return self._classify(mfccs)

    def is_above_threshold(self, result: dict, threshold: float = 50.0) -> bool:
        """Checks whether the syntheticity index exceeds an alert threshold (RF-10).

        Args:
            result: Dictionary returned by :meth:`analyze_file` or
                :meth:`analyze_chunk`.
            threshold: Decision boundary in the 0–100 range. Defaults to 50.0.

        Returns:
            ``True`` if ``result["syntheticity_index"] >= threshold``.

        Raises:
            ValueError: If ``threshold`` is outside the [0, 100] range.
        """
        if not 0.0 <= threshold <= 100.0:
            raise ValueError(
                f"Limiar inválido: {threshold}. Deve estar entre 0 e 100."
            )
        return result["syntheticity_index"] >= threshold

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _classify(self, mfccs: np.ndarray) -> dict:
        """Normalises MFCCs and runs the SVM classifier.

        Args:
            mfccs: 1-D array of shape (13,) produced by
                :meth:`~analyzer.feature_extractor.FeatureExtractor.extract_mfccs`.

        Returns:
            Dictionary with ``syntheticity_index``, ``label``, and
            ``confidence``.
        """
        X = self._scaler.transform(mfccs.reshape(1, -1))
        proba = self._model.predict_proba(X)[0]

        synthetic_idx = self._classes.index("synthetic")
        syntheticity = float(proba[synthetic_idx]) * 100.0

        predicted_class_idx = int(np.argmax(proba))
        label = self._classes[predicted_class_idx]
        confidence = float(proba[predicted_class_idx]) * 100.0

        return {
            "syntheticity_index": syntheticity,
            "label": label,
            "confidence": confidence,
        }
