import { useRef, useState, useCallback } from 'react';
import { useFileAnalysis } from '../hooks/useFileAnalysis';
import { ThresholdSlider }  from './ThresholdSlider';
import { SyntheticityGauge } from './SyntheticityGauge';
import { AlertBanner }       from './AlertBanner';
import { SpectrogramView }   from './SpectrogramView';
import { MetricsDashboard }  from './MetricsDashboard';
import { ArtifactScores }    from './ArtifactScores';

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

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      {/* ── Zona de drag & drop ─────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Área de upload de ficheiro de áudio"
        className="rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer"
        style={{
          borderColor:    isDragOver ? 'var(--color-accent)' : 'var(--glass-border)',
          background:     isDragOver ? 'oklch(70% 0.18 250 / 0.07)' : 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          transition: 'border-color 200ms var(--ease-out), background 200ms var(--ease-out)',
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

        {/* Ícone upload */}
        <div className="flex justify-center mb-4">
          <svg
            width="44" height="44" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: isDragOver ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)', transition: 'color 200ms' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {file ? (
          <>
            <div className="font-mono font-semibold" style={{ color: 'var(--color-accent)' }}>
              {file.name}
            </div>
            <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {formatSize(file.size)}
            </div>
          </>
        ) : (
          <>
            <div className="font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Arraste um ficheiro ou clique para seleccionar
            </div>
            <div className="text-sm font-mono mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              .wav · .mp3 · .flac · máx 100 MB
            </div>
          </>
        )}
      </div>

      {/* Erro de validação local */}
      {fileError && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{ background: 'rgba(255,51,102,0.09)', border: '1px solid rgba(255,51,102,0.3)', color: 'var(--color-danger)' }}
        >
          {fileError}
        </div>
      )}

      {/* ── Limiar + botão ──────────────────────────────────── */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <ThresholdSlider
          value={threshold}
          onChange={setThreshold}
          disabled={status === 'loading'}
        />
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="w-full py-3 px-6 rounded-lg font-semibold text-sm uppercase tracking-widest transition-all duration-200"
          style={{
            background:  canAnalyze ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
            color:       canAnalyze ? 'oklch(10% 0.01 260)' : 'rgba(255,255,255,0.25)',
            cursor:      canAnalyze ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em',
            boxShadow:   canAnalyze ? '0 0 24px oklch(70% 0.18 250 / 0.35)' : 'none',
          }}
        >
          {status === 'loading' ? 'A analisar…' : 'Analisar'}
        </button>
      </div>

      {/* ── Estado: a carregar ─────────────────────────────── */}
      {status === 'loading' && <LoadingSkeleton />}

      {/* ── Estado: erro de API ────────────────────────────── */}
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
            <div className="font-medium" style={{ color: 'var(--color-danger)' }}>
              Erro na análise
            </div>
            <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {error}
            </div>
            <button
              onClick={reset}
              className="mt-2 text-sm underline underline-offset-2"
              style={{ color: 'var(--color-accent)' }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* ── Estado: sucesso — dashboard completo ──────────── */}
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
              style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
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
