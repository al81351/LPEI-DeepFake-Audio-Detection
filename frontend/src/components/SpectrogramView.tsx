import { useRef, useEffect } from 'react';

interface SpectrogramViewProps {
  data: number[][];
  times: number[];
  frequencies: number[];
}

function normToRGB(norm: number): [number, number, number] {
  // Gradiente: azul escuro → ciano → branco
  if (norm < 0.5) {
    const t = norm * 2;
    return [0, Math.round(t * 200), Math.round(50 + t * 150)];
  }
  const t = (norm - 0.5) * 2;
  return [
    Math.round(t * 255),
    Math.round(200 + t * 55),
    Math.round(200 + t * 55),
  ];
}

export function SpectrogramView({ data, times, frequencies }: SpectrogramViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numFreqs = data.length;
    const numTimes = data[0]?.length ?? 0;
    if (numFreqs === 0 || numTimes === 0) return;

    // Dimensões nativas = dados originais para máxima fidelidade
    canvas.width  = numTimes;
    canvas.height = numFreqs;

    // Mín/máx globais para normalização
    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      for (const v of row) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    const range = max - min || 1;

    const imageData = ctx.createImageData(numTimes, numFreqs);
    const buf = imageData.data;

    for (let fi = 0; fi < numFreqs; fi++) {
      for (let ti = 0; ti < numTimes; ti++) {
        const norm = (data[fi][ti] - min) / range;
        const [r, g, b] = normToRGB(norm);
        // Inversão do eixo Y: freq[0] = frequência baixa → parte inferior
        const row = numFreqs - 1 - fi;
        const idx = (row * numTimes + ti) * 4;
        buf[idx]     = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [data]);

  const t0  = times[0]?.toFixed(2) ?? '0.00';
  const tN  = times[times.length - 1]?.toFixed(2) ?? '0.00';
  const f0  = frequencies[0] != null ? `${Math.round(frequencies[0])} Hz` : '';
  const fN  = frequencies[frequencies.length - 1] != null
    ? `${Math.round(frequencies[frequencies.length - 1])} Hz`
    : '';

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(0,0,20,0.85)', border: '1px solid var(--glass-border)' }}
    >
      {/* Cabeçalho */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <span
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}
        >
          Espectrograma Mel
        </span>
        {f0 && fN && (
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {f0} – {fN}
          </span>
        )}
      </div>

      {/* Canvas (CSS escala para 100% de largura) */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '180px',
          imageRendering: 'pixelated',
        }}
      />

      {/* Eixo do tempo */}
      <div
        className="flex justify-between px-4 py-1.5 text-xs font-mono"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <span>{t0}s</span>
        <span style={{ color: 'rgba(255,255,255,0.18)' }}>← Tempo →</span>
        <span>{tN}s</span>
      </div>
    </div>
  );
}
