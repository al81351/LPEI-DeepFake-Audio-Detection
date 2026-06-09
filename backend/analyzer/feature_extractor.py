import os
import numpy as np
import librosa

class FeatureExtractor:
    """
    Extracts acoustic features from audio signals for DeepFake detection.
    """
    
    SUPPORTED_FORMATS = ('.wav', '.mp3', '.flac')

    def load_audio(self, file_path: str) -> tuple[np.ndarray, int]:
        """
        Loads an audio file and returns its signal and sample rate.

        Args:
            file_path (str): The path to the audio file.

        Returns:
            tuple[np.ndarray, int]: A tuple containing the audio signal (as a 1D numpy array) 
                                    and the sample rate.

        Raises:
            FileNotFoundError: If the specified file does not exist.
            ValueError: If the file format is not supported or if the signal is too short (< 0.5s).
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        _, ext = os.path.splitext(file_path)
        if ext.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported audio format: {ext}. Supported formats are: {', '.join(self.SUPPORTED_FORMATS)}")

        try:
            # Resample to 22 050 Hz so features are in the same space as
            # real-time inference (WebSocket stream is also at 22 050 Hz).
            signal, sample_rate = librosa.load(file_path, sr=22050)
        except Exception as e:
            raise ValueError(f"Error loading audio file: {e}")

        # Check if signal is at least 0.5 seconds long
        duration = librosa.get_duration(y=signal, sr=sample_rate)
        if duration < 0.5:
            raise ValueError(f"Audio signal is too short ({duration:.2f}s). Minimum required duration is 0.5s.")

        return signal, sample_rate

    def extract_fft(self, signal: np.ndarray, sample_rate: int) -> dict:
        """
        Applies FFT to the audio signal and extracts frequency domain features.

        Args:
            signal (np.ndarray): The audio signal.
            sample_rate (int): The sample rate of the audio signal.

        Returns:
            dict: A dictionary containing 'frequencies', 'magnitudes', and 'dominant_frequency'.
        """
        n = len(signal)
        # Apply Fast Fourier Transform
        fft_result = np.fft.fft(signal)
        # Take the absolute value to get the magnitudes and normalize
        magnitudes = np.abs(fft_result) / n
        
        # Get corresponding frequencies
        frequencies = np.fft.fftfreq(n, d=1/sample_rate)
        
        # Only take the positive half of the spectrum
        half_n = n // 2
        magnitudes = magnitudes[:half_n]
        frequencies = frequencies[:half_n]
        
        # Find the dominant frequency
        dominant_frequency = frequencies[np.argmax(magnitudes)]
        
        return {
            "frequencies": frequencies,
            "magnitudes": magnitudes,
            "dominant_frequency": float(dominant_frequency)
        }

    def extract_mfccs(self, signal: np.ndarray, sample_rate: int, n_mfccs: int = 13) -> np.ndarray:
        """
        Extracts Mel-frequency cepstral coefficients (MFCCs) plus spectral features.

        Feature vector (48 dimensions):
          - 13 MFCC means + 13 delta means + 13 delta² means  = 39
          - spectral centroid  mean / delta mean / delta² mean =  3
          - spectral rolloff   mean / delta mean / delta² mean =  3
          - zero crossing rate mean / delta mean / delta² mean =  3
                                                               ─────
                                                                 48

        Args:
            signal (np.ndarray): The audio signal.
            sample_rate (int): The sample rate of the audio signal.
            n_mfccs (int, optional): The number of MFCCs to extract. Defaults to 13.

        Returns:
            np.ndarray: A 1D array of shape (48,) ready for the SVM classifier.
        """
        # ── Amplitude normalisation ───────────────────────────────────────────
        # Peak-normalise to [-1, 1] so that MFCC energy coefficients are
        # consistent regardless of recording level.  Audio files decoded by
        # librosa are already close to this range; microphone captures via
        # WebAudio can be 10–100× quieter (OS gain), causing a large shift in
        # MFCC[0] (energy) that pushes the feature vector away from the
        # training distribution and biases the SVM towards "real".
        # Applying this uniformly during both training AND inference ensures
        # the scaler is fitted and applied on the same amplitude scale.
        peak = float(np.max(np.abs(signal)))
        if peak > 1e-8:
            signal = signal / peak

        # ── MFCCs ────────────────────────────────────────────────────────────
        mfccs   = librosa.feature.mfcc(y=signal, sr=sample_rate, n_mfcc=n_mfccs)
        d_mfcc  = librosa.feature.delta(mfccs)
        d2_mfcc = librosa.feature.delta(mfccs, order=2)

        # ── Spectral centroid ─────────────────────────────────────────────────
        centroid   = librosa.feature.spectral_centroid(y=signal, sr=sample_rate)   # (1, T)
        d_cent     = librosa.feature.delta(centroid)
        d2_cent    = librosa.feature.delta(centroid, order=2)

        # ── Spectral rolloff ──────────────────────────────────────────────────
        rolloff    = librosa.feature.spectral_rolloff(y=signal, sr=sample_rate)    # (1, T)
        d_roll     = librosa.feature.delta(rolloff)
        d2_roll    = librosa.feature.delta(rolloff, order=2)

        # ── Zero crossing rate ────────────────────────────────────────────────
        zcr        = librosa.feature.zero_crossing_rate(y=signal)                  # (1, T)
        d_zcr      = librosa.feature.delta(zcr)
        d2_zcr     = librosa.feature.delta(zcr, order=2)

        combined = np.concatenate([
            # MFCCs (39)
            np.mean(mfccs,   axis=1),
            np.mean(d_mfcc,  axis=1),
            np.mean(d2_mfcc, axis=1),
            # Spectral centroid (3)
            np.mean(centroid,  axis=1),
            np.mean(d_cent,    axis=1),
            np.mean(d2_cent,   axis=1),
            # Spectral rolloff (3)
            np.mean(rolloff,   axis=1),
            np.mean(d_roll,    axis=1),
            np.mean(d2_roll,   axis=1),
            # ZCR (3)
            np.mean(zcr,       axis=1),
            np.mean(d_zcr,     axis=1),
            np.mean(d2_zcr,    axis=1),
        ])
        return combined

    def extract_spectrogram(self, signal: np.ndarray, sample_rate: int) -> dict:
        """
        Generates a Mel spectrogram of the audio signal.

        Args:
            signal (np.ndarray): The audio signal.
            sample_rate (int): The sample rate of the audio signal.

        Returns:
            dict: A dictionary containing 'data' (2D array in dB), 'times', and 'frequencies'.
        """
        # Compute the Mel spectrogram
        mel_spectrogram = librosa.feature.melspectrogram(y=signal, sr=sample_rate)
        # Convert to log scale (dB)
        mel_spectrogram_db = librosa.power_to_db(mel_spectrogram, ref=np.max)
        
        # Calculate frequencies and times for the axes
        frequencies = librosa.mel_frequencies(n_mels=mel_spectrogram.shape[0], fmin=0.0, fmax=sample_rate/2.0)
        times = librosa.frames_to_time(np.arange(mel_spectrogram.shape[1]), sr=sample_rate)
        
        return {
            "data": mel_spectrogram_db,
            "times": times,
            "frequencies": frequencies
        }

    def extract_all(self, file_path: str) -> dict:
        """
        Convenience method to load audio and extract all features.

        Args:
            file_path (str): The path to the audio file.

        Returns:
            dict: A dictionary containing 'fft', 'mfccs', and 'spectrogram' features.
        """
        signal, sample_rate = self.load_audio(file_path)
        
        fft_features = self.extract_fft(signal, sample_rate)
        mfcc_features = self.extract_mfccs(signal, sample_rate)
        spectrogram_features = self.extract_spectrogram(signal, sample_rate)
        
        return {
            "fft": fft_features,
            "mfccs": mfcc_features,
            "spectrogram": spectrogram_features
        }
