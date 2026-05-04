import os
import tempfile
import pytest
import numpy as np
import soundfile as sf
from analyzer.feature_extractor import FeatureExtractor

@pytest.fixture
def feature_extractor():
    return FeatureExtractor()

@pytest.fixture
def valid_audio_file():
    # Create a temporary valid wav file
    fd, path = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    
    # Generate a 1-second synthetic sine wave (440 Hz) at 22050 Hz sample rate
    sample_rate = 22050
    t = np.linspace(0, 1, sample_rate, endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * 440 * t)
    
    # Save using soundfile
    sf.write(path, signal, sample_rate)
    
    yield path
    
    # Cleanup
    if os.path.exists(path):
        os.remove(path)

@pytest.fixture
def invalid_format_file():
    fd, path = tempfile.mkstemp(suffix='.txt')
    os.close(fd)
    with open(path, 'w') as f:
        f.write("This is not an audio file.")
    
    yield path
    
    if os.path.exists(path):
        os.remove(path)

@pytest.fixture
def short_audio_file():
    fd, path = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    
    # Generate a 0.1-second synthetic signal
    sample_rate = 22050
    t = np.linspace(0, 0.1, int(sample_rate * 0.1), endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * 440 * t)
    
    sf.write(path, signal, sample_rate)
    
    yield path
    
    if os.path.exists(path):
        os.remove(path)

def test_load_audio_success(feature_extractor, valid_audio_file):
    signal, sample_rate = feature_extractor.load_audio(valid_audio_file)
    assert isinstance(signal, np.ndarray)
    assert isinstance(sample_rate, int)
    assert len(signal) > 0
    assert sample_rate == 22050

def test_load_audio_unsupported_format(feature_extractor, invalid_format_file):
    with pytest.raises(ValueError, match="Unsupported audio format"):
        feature_extractor.load_audio(invalid_format_file)

def test_load_audio_file_not_found(feature_extractor):
    with pytest.raises(FileNotFoundError, match="Audio file not found"):
        feature_extractor.load_audio("nonexistent_file.wav")

def test_load_audio_too_short(feature_extractor, short_audio_file):
    with pytest.raises(ValueError, match="Audio signal is too short"):
        feature_extractor.load_audio(short_audio_file)

def test_extract_mfccs_shape(feature_extractor, valid_audio_file):
    signal, sample_rate = feature_extractor.load_audio(valid_audio_file)
    mfccs = feature_extractor.extract_mfccs(signal, sample_rate, n_mfccs=13)
    
    assert isinstance(mfccs, np.ndarray)
    assert mfccs.ndim == 1
    assert mfccs.shape == (13,)

def test_extract_all_keys(feature_extractor, valid_audio_file):
    results = feature_extractor.extract_all(valid_audio_file)
    
    assert isinstance(results, dict)
    assert "fft" in results
    assert "mfccs" in results
    assert "spectrogram" in results
    
    assert isinstance(results["mfccs"], np.ndarray)
    assert results["mfccs"].shape == (13,)
    
    assert "frequencies" in results["fft"]
    assert "magnitudes" in results["fft"]
    assert "dominant_frequency" in results["fft"]
    
    assert "data" in results["spectrogram"]
    assert "times" in results["spectrogram"]
    assert "frequencies" in results["spectrogram"]
