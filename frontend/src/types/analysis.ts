// ─── Interfaces exactas do backend ────────────────────────────

export interface AcousticMetrics {
  duration_seconds: number;
  dominant_frequency: number;
  rms_energy: number;
  zero_crossing_rate: number;
}

export interface SpectralMetrics {
  spectral_centroid: number;
  spectral_rolloff: number;
  spectral_flatness: number;
}

export interface ArtifactMetrics {
  over_smoothing_score: number;
  artificial_periodicity_score: number;
  spectral_discontinuity_score: number;
  artifacts_detected: string[];
}

export interface AnalysisResult {
  syntheticity_index: number;
  label: 'real' | 'synthetic';
  confidence: number;
  is_alert: boolean;
  threshold_used: number;
  mfccs: number[];
  spectrogram: {
    data: number[][];
    times: number[];
    frequencies: number[];
  };
  metrics: {
    acoustic: AcousticMetrics;
    spectral: SpectralMetrics;
    artifacts: ArtifactMetrics;
  };
  file_name: string;
  timestamp: string;
}

export interface RealtimeUpdate {
  syntheticity_index: number;
  label: 'real' | 'synthetic';
  confidence: number;
  is_alert: boolean;
  buffer_seconds: number;
  realtime_metrics: {
    rms_energy: number;
    zero_crossing_rate: number;
  };
}

// O backend também devolve confidence e is_alert na HistoryEntry
export interface HistoryEntry {
  id: string;
  file_name: string;
  syntheticity_index: number;
  label: string;
  confidence: number;
  is_alert: boolean;
  timestamp: string;
}

// ─── Tipos auxiliares ─────────────────────────────────────────

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
export type RealtimeStatus = 'idle' | 'capturing' | 'error';
export type AlertLevel    = 'safe' | 'warn' | 'danger';

export function getAlertLevel(index: number, threshold: number): AlertLevel {
  if (index < threshold)      return 'safe';
  if (index < threshold + 20) return 'warn';
  return 'danger';
}
