import { useRef, useState, useCallback } from 'react';
import { useFileAnalysis } from '../hooks/useFileAnalysis';
import { ThresholdSlider }  from './ThresholdSlider';
import { SyntheticityGauge } from './SyntheticityGauge';
import { AlertBanner }       from './AlertBanner';
import { SpectrogramView }   from './SpectrogramView';
import { MetricsDashboard }  from './MetricsDashboard';
import { ArtifactScores }    from './ArtifactScores';
import { WaveformDisplay }   from './WaveformDisplay';
import { NeonButton }        from './ui/neon-button';

const ACCEPTED_EXTS  = new Set(['.wav', '.mp3', '.flac']);
const MAX_BYTES      = 100 * 1024 * 1024;

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className="glass-card animate-pulse"
      style={{ height: tall ? '120px' : '80px' }}
    >
      <div className="p-4 flex flex-col gap-2 h-full justify-between">
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 10, width: '45%' }} />
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 18, width: '65%' }} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="glass-card p-5">
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 40, width: '55%', marginBottom: 20 }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} tall />)}
      </div>
    </div>
  );
}

export function FileAnalysis() {
  const [file, setFile]               = useState<File | null>(null);
  const [threshold, setThreshold]     = useState(50);
  const [isDragOver, setIsDragOver]   = useState(false);
  const [fileError, setFileError]     = useState<string | null>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);

  const { result, status, error, analyze, reset } = useFileAnalysis();

  const validateAndSet = useCallback((f: File) => {
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    if (!ACCEPTED_EXTS.has(ext)) {
      setFileError(`Formato não suportado: ${ext}. Use .wav, .mp3 ou .flac.`);
      setFile(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError(`Ficheiro demasiado grande. Máximo: 100 MB.`);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
    reset();
  }, [reset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, [validateAndSet]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  }, [validateAndSet]);

  const handleAnalyze = useCallback(() => {
    if (file) void analyze(file, threshold);
  }, [file, threshold, analyze]);

  const canAnalyze = !!file && status !== 'loading';

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <div>
        <h2
          className="font-mono font-bold text-xl mb-1"
          style={{ color: 'var(--color-accent)' }}
        >
          Análise de Ficheiro
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Carregue um ficheiro .wav, .mp3 ou .flac para detetar deepfake.
        </p>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Área de upload de ficheiro de áudio"
        className="rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden"
        style={{
          borderColor:    isDragOver ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
          background:     isDragOver ? 'oklch(70% 0.18 250 / 0.06)' : 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          padding: file ? '1rem 1.25rem' : '2.5rem 2rem',
          textAlign: 'center',
          transition: 'border-color 200ms, background 200ms, padding 300ms',
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,.flac"
          className="hidden"
          onChange={handleInput}
        />

        {file ? (
          <WaveformDisplay file={file} />
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: isDragOver ? 'oklch(70% 0.18 250 / 0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isDragOver ? 'oklch(70% 0.18 250 / 0.35)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 200ms',
                }}
              >
                <svg
                  width="26" height="26" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: isDragOver ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)', transition: 'color 200ms' }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            </div>
            <div className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Arraste um ficheiro ou clique para seleccionar
            </div>
            <div className="text-xs font-mono mt-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              .wav · .mp3 · .flac · máx 100 MB
            </div>
          </>
        )}
      </div>

      {/* Validation error */}
      {fileError && (
        <div
          className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.25)', color: 'var(--color-danger)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {fileError}
        </div>
      )}

      {/* Controls — slider + button in one row */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <ThresholdSlider
            value={threshold}
            onChange={setThreshold}
            disabled={status === 'loading'}
          />
        </div>
        <NeonButton
          variant="solid"
          size="default"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="font-mono font-semibold uppercase tracking-widest flex-shrink-0"
          style={{
            opacity: canAnalyze ? 1 : 0.38,
            cursor: canAnalyze ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              A analisar…
            </span>
          ) : 'Analisar'}
        </NeonButton>
      </div>

      {/* Loading state */}
      {status === 'loading' && <LoadingSkeleton />}

      {/* API error */}
      {status === 'error' && error && (
        <div
          className="px-5 py-4 rounded-xl flex items-start gap-3 animate-fade-in"
          style={{ background: 'rgba(255,51,102,0.07)', border: '1px solid rgba(255,51,102,0.22)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round"
            className="flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="font-medium" style={{ color: 'var(--color-danger)' }}>Erro na análise</div>
            <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{error}</div>
            <button
              onClick={reset}
              className="mt-2 text-sm underline underline-offset-2"
              style={{ color: 'var(--color-accent)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Success — full dashboard */}
      {status === 'success' && result && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <AlertBanner
            isAlert={result.is_alert}
            label={result.label}
            confidence={result.confidence}
            syntheticityIndex={result.syntheticity_index}
          />

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <SyntheticityGauge
                value={result.syntheticity_index}
                threshold={result.threshold_used}
                size="lg"
              />
            </div>
            <div className="flex-1 w-full">
              <ArtifactScores artifacts={result.metrics.artifacts} />
            </div>
          </div>

          <div>
            <h3
              className="text-xs font-mono font-medium uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}
            >
              Espectrograma Mel
            </h3>
            <SpectrogramView
              data={result.spectrogram.data}
              times={result.spectrogram.times}
              frequencies={result.spectrogram.frequencies}
            />
          </div>

          <MetricsDashboard
            acoustic={result.metrics.acoustic}
            spectral={result.metrics.spectral}
          />
        </div>
      )}
    </div>
  );
}
