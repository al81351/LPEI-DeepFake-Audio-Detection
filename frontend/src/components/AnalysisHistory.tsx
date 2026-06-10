import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { useHistory }          from '../hooks/useHistory';
import type { HistoryEntry }   from '../types/analysis';

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return ts;
  }
}

function truncate(name: string, max = 14): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

interface TooltipPayload {
  payload?: HistoryEntry;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  const isSynth = entry.is_alert;
  return (
    <div
      className="glass-card px-3 py-2 text-sm"
      style={{ minWidth: 180 }}
    >
      <div className="font-mono font-semibold truncate" style={{ color: 'var(--color-accent)' }}>
        {entry.file_name}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.65)' }}>
        Índice: {entry.syntheticity_index.toFixed(1)}%
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
        Limiar: {entry.threshold_used ?? 50}%
      </div>
      <div style={{ color: isSynth ? 'var(--color-danger)' : 'var(--color-safe)' }}>
        {isSynth ? 'Sintético' : 'Real'}
      </div>
    </div>
  );
}

export function AnalysisHistory() {
  const { history, isLoading, clear, exportPDF } = useHistory();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="font-mono text-sm animate-dot-blink" style={{ color: 'rgba(255,255,255,0.3)' }}>
          A carregar histórico…
        </span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1" strokeLinecap="round"
          style={{ color: 'rgba(255,255,255,0.12)' }}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Sem análises na sessão actual
        </p>
      </div>
    );
  }

  const chartData = history.map((h) => ({
    ...h,
    shortName: truncate(h.file_name),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Botões de acção ────────────────────────────────── */}
      <div className="flex gap-3 justify-end flex-wrap">
        <button
          onClick={() => void clear()}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          style={{
            background: 'rgba(255,51,102,0.09)',
            border:     '1px solid rgba(255,51,102,0.3)',
            color:      'var(--color-danger)',
            cursor:     'pointer',
          }}
        >
          Limpar Histórico
        </button>
        <button
          onClick={() => void exportPDF()}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{
            background: 'var(--color-accent)',
            color:      'oklch(10% 0.01 260)',
            boxShadow:  '0 0 16px oklch(70% 0.18 250 / 0.3)',
            cursor:     'pointer',
          }}
        >
          Exportar Relatório PDF
        </button>
      </div>

      {/* ── Gráfico de barras ──────────────────────────────── */}
      <div className="glass-card p-5">
        <h3
          className="text-xs font-mono font-medium uppercase tracking-widest mb-5"
          style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
        >
          Índice de Sinteticidade por Análise
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="shortName"
              tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              angle={-35}
              textAnchor="end"
              interval={0}
              stroke="rgba(255,255,255,0.08)"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              stroke="rgba(255,255,255,0.08)"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            {/* Reference lines per unique threshold value used across analyses */}
            {Array.from(new Set(chartData.map(e => e.threshold_used ?? 50))).map(thr => (
              <ReferenceLine
                key={thr}
                y={thr}
                stroke="rgba(255,183,0,0.45)"
                strokeDasharray="5 4"
                label={{ value: `Limiar ${thr}%`, fill: 'rgba(255,183,0,0.55)', fontSize: 10, fontFamily: 'monospace' }}
              />
            ))}
            <Bar dataKey="syntheticity_index" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.is_alert ? 'var(--color-danger)' : 'var(--color-safe)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tabela ─────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Ficheiro', 'Índice', 'Resultado', 'Confiança', 'Hora'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono font-medium uppercase"
                    style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', letterSpacing: '0.08em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => {
                const isSynth = entry.is_alert;
                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: i < history.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                      background: isSynth ? 'rgba(255,51,102,0.04)' : 'transparent',
                    }}
                  >
                    <td
                      className="px-4 py-3 font-mono"
                      style={{
                        color: 'rgba(255,255,255,0.75)',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.file_name}
                    </td>
                    <td
                      className="px-4 py-3 font-mono font-semibold tabular"
                      style={{ color: isSynth ? 'var(--color-danger)' : 'var(--color-safe)' }}
                    >
                      {entry.syntheticity_index.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold"
                        style={{
                          background: isSynth ? 'rgba(255,51,102,0.14)' : 'rgba(0,255,136,0.11)',
                          color:      isSynth ? 'var(--color-danger)'   : 'var(--color-safe)',
                        }}
                      >
                        {isSynth ? 'Sintético' : 'Real'}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 font-mono tabular"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {entry.confidence.toFixed(1)}%
                    </td>
                    <td
                      className="px-4 py-3 font-mono"
                      style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}
                    >
                      {formatTimestamp(entry.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
