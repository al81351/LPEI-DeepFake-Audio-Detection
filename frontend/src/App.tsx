import { useState, useRef } from 'react';
import { Hero }             from './components/Hero';
import { FileAnalysis }     from './components/FileAnalysis';
import { RealtimeAnalysis } from './components/RealtimeAnalysis';
import { AnalysisHistory }  from './components/AnalysisHistory';

type Tab = 'file' | 'realtime';

const TABS: { key: Tab; label: string }[] = [
  { key: 'file',     label: 'Análise de Ficheiro'    },
  { key: 'realtime', label: 'Análise em Tempo Real'  },
];

export function App() {
  const [activeTab, setActiveTab]   = useState<Tab>('file');
  const analysisSectionRef          = useRef<HTMLElement>(null);

  const handleStartAnalysis = () => {
    analysisSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <Hero onStartAnalysis={handleStartAnalysis} />

      {/* ── Análise ───────────────────────────────────────── */}
      <section
        id="analysis"
        ref={analysisSectionRef}
        className="max-w-4xl mx-auto px-4 md:px-6 py-16"
      >
        <div className="mb-10">
          <h2
            className="font-mono font-bold text-2xl mb-2"
            style={{ color: 'var(--color-accent)' }}
          >
            Análise de Áudio
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Carregue um ficheiro ou use o microfone para detecção em tempo real.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex mb-8"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
          role="tablist"
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className="px-6 py-3 font-mono text-sm font-medium transition-all duration-200 -mb-px"
              style={{
                color:       activeTab === key ? 'var(--color-accent)' : 'rgba(255,255,255,0.38)',
                borderBottom: `2px solid ${activeTab === key ? 'var(--color-accent)' : 'transparent'}`,
                background:  'none',
                cursor:      'pointer',
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo da tab com fade-in ao mudar */}
        <div key={activeTab} className="animate-fade-in" role="tabpanel">
          {activeTab === 'file' ? <FileAnalysis /> : <RealtimeAnalysis />}
        </div>
      </section>

      {/* ── Divisor ───────────────────────────────────────── */}
      <div
        className="max-w-4xl mx-auto px-4 md:px-6"
        style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 0 }}
      />

      {/* ── Histórico ─────────────────────────────────────── */}
      <section
        id="history"
        className="max-w-4xl mx-auto px-4 md:px-6 py-16 pb-28"
      >
        <div className="mb-8">
          <h2
            className="font-mono font-bold text-2xl mb-2"
            style={{ color: 'var(--color-accent)' }}
          >
            Histórico da Sessão
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Análises realizadas durante esta sessão do servidor.
          </p>
        </div>
        <AnalysisHistory />
      </section>
    </div>
  );
}
