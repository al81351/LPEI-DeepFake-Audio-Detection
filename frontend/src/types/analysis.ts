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

export interface RealtimeTick {
  type: 'tick';
  buffer_seconds: number;
  rms_energy: number;
}

export interface RealtimeProbe {
  type: 'probe';
  probe_id: string;
  syntheticity_index: number;
  label: 'real' | 'synthetic';
  confidence: number;
  is_alert: boolean;
  latency_ms: number;
  timestamp: string;
  metrics: {
    rms_energy: number;
    zero_crossing_rate: number;
    over_smoothing_score: number;
    artificial_periodicity_score: number;
    spectral_discontinuity_score: number;
  };
}

export type RealtimeMessage = RealtimeTick | RealtimeProbe;

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
