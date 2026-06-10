"""
Training script for the DeepFake audio classifier.

Run once to train the SVM model on the labeled audio samples:
    cd backend
    python train.py

Generates models/classifier.pkl, which detector.py loads at inference time.
"""

import os
import sys
import warnings
import joblib
import numpy as np
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Allow imports from the backend/ directory
sys.path.insert(0, os.path.dirname(__file__))
from analyzer.feature_extractor import FeatureExtractor

SUPPORTED_EXTENSIONS = (".wav", ".mp3", ".flac")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "classifier.pkl")
MIN_SAMPLES_PER_CLASS = 4


def collect_audio_files(folder: str) -> list[str]:
    """Collects all supported audio file paths from a directory.

    Args:
        folder: Absolute path to the directory to scan.

    Returns:
        List of absolute file paths for every .wav, .mp3, and .flac file found.

    Raises:
        FileNotFoundError: If ``folder`` does not exist.
        RuntimeError: If no supported audio files are found in ``folder``.
    """
    if not os.path.isdir(folder):
        raise FileNotFoundError(
            f"Pasta não encontrada: {folder}\n"
            f"Certifica-te de que o caminho está correto e contém ficheiros de áudio."
        )

    files = [
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS
    ]

    if not files:
        raise RuntimeError(
            f"Nenhum ficheiro de áudio encontrado em: {folder}\n"
            f"Formatos suportados: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    return files


def extract_features(file_paths: list[str], extractor: FeatureExtractor) -> tuple[list[np.ndarray], list[str]]:
    """Extracts MFCC feature vectors from a list of audio files.

    Files that cannot be loaded (corrupted, too short, unsupported) are skipped
    with a warning so the rest of the dataset is still processed.

    Args:
        file_paths: List of absolute paths to audio files.
        extractor: Initialised :class:`FeatureExtractor` instance.

    Returns:
        Tuple of (features, valid_paths) where ``features`` is a list of 1-D
        numpy arrays of shape (13,) and ``valid_paths`` contains the paths that
        were processed successfully.
    """
    features = []
    valid_paths = []

    for path in file_paths:
        try:
            signal, sample_rate = extractor.load_audio(path)
            mfccs = extractor.extract_mfccs(signal, sample_rate)
            features.append(mfccs)
            valid_paths.append(path)
        except Exception as exc:
            warnings.warn(f"Ficheiro ignorado ({os.path.basename(path)}): {exc}")

    return features, valid_paths


def build_dataset() -> tuple[np.ndarray, np.ndarray]:
    """Loads all audio samples and builds the feature matrix and label vector.

    Scans ``data/real_audio/`` (label 0) and ``data/deepfake_audio/`` (label 1),
    extracts MFCCs for each file, and stacks them into X and y arrays ready for
    scikit-learn.

    Returns:
        Tuple (X, y) where X has shape (n_samples, 13) and y has shape (n_samples,).

    Raises:
        FileNotFoundError: If either data directory is missing.
        RuntimeError: If no audio files are found in either directory.
        SystemExit: If any class ends up with fewer than
            :data:`MIN_SAMPLES_PER_CLASS` valid samples after feature extraction.
    """
    real_dir = os.path.join(DATA_DIR, "real_audio")
    fake_dir = os.path.join(DATA_DIR, "deepfake_audio")

    print("A recolher ficheiros de áudio...")
    real_files = collect_audio_files(real_dir)
    fake_files = collect_audio_files(fake_dir)
    print(f"  Real:     {len(real_files)} ficheiro(s) encontrado(s)")
    print(f"  Deepfake: {len(fake_files)} ficheiro(s) encontrado(s)")

    extractor = FeatureExtractor()

    print("\nA extrair features (MFCCs)...")
    real_features, _ = extract_features(real_files, extractor)
    fake_features, _ = extract_features(fake_files, extractor)

    if len(real_features) < MIN_SAMPLES_PER_CLASS:
        print(
            f"\nAVISO: apenas {len(real_features)} amostra(s) válida(s) de voz real "
            f"(mínimo recomendado: {MIN_SAMPLES_PER_CLASS}). "
            "O modelo pode ser pouco fiável."
        )
    if len(fake_features) < MIN_SAMPLES_PER_CLASS:
        print(
            f"\nAVISO: apenas {len(fake_features)} amostra(s) válida(s) de deepfake "
            f"(mínimo recomendado: {MIN_SAMPLES_PER_CLASS}). "
            "O modelo pode ser pouco fiável."
        )

    X = np.vstack(real_features + fake_features)
    y = np.array([0] * len(real_features) + [1] * len(fake_features))

    print(f"  {len(real_features)} amostras reais + {len(fake_features)} deepfakes = {len(y)} total")
    return X, y


def train(X: np.ndarray, y: np.ndarray) -> tuple[SVC, StandardScaler]:
    """Splits, normalises, trains and evaluates the SVM classifier.

    Args:
        X: Feature matrix of shape (n_samples, 13).
        y: Label vector of shape (n_samples,) with 0 = real, 1 = synthetic.

    Returns:
        Tuple (model, scaler) fitted on the training split.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("\nA optimizar hiperparâmetros SVM com GridSearchCV (pode demorar 1-2 min)...")
    param_grid = {
        "C":     [0.1, 1, 10, 100],
        "gamma": ["scale", 0.001, 0.01, 0.1],
    }
    grid = GridSearchCV(
        SVC(kernel="rbf", probability=True, random_state=42),
        param_grid,
        cv=3,
        scoring="accuracy",
        n_jobs=-1,
        verbose=0,
    )
    grid.fit(X_train_scaled, y_train)
    model = grid.best_estimator_
    print(f"  Melhores parâmetros: C={grid.best_params_['C']}, gamma={grid.best_params_['gamma']}")
    print(f"  Melhor accuracy CV:  {grid.best_score_:.4f} ({grid.best_score_*100:.1f}%)")

    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)

    print("\n--- Resultados no conjunto de teste ---")
    print(f"Accuracy: {accuracy:.4f} ({accuracy * 100:.1f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["real", "synthetic"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    if accuracy < 0.95:
        print(
            f"\nAVISO: accuracy de {accuracy * 100:.1f}% está abaixo do limiar de 95% "
            "(RNF-04 não atingido). Considera adicionar mais amostras de treino."
        )

    return model, scaler


def save_model(model: SVC, scaler: StandardScaler) -> None:
    """Serialises the trained model and scaler to disk.

    Saves a dictionary with keys ``model``, ``scaler``, and ``classes`` to
    :data:`MODEL_PATH` using joblib.

    Args:
        model: Fitted :class:`~sklearn.svm.SVC` instance.
        scaler: Fitted :class:`~sklearn.preprocessing.StandardScaler` instance.
    """
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    payload = {
        "model": model,
        "scaler": scaler,
        "classes": ["real", "synthetic"],
    }
    joblib.dump(payload, MODEL_PATH)
    print(f"\nModelo guardado em models/classifier.pkl")


def main() -> None:
    """Entry point: orchestrates dataset loading, training, and model persistence."""
    try:
        X, y = build_dataset()
        model, scaler = train(X, y)
        save_model(model, scaler)
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"\nERRO: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
