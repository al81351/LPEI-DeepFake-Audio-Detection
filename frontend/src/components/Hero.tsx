import { useState } from 'react';

interface HeroProps {
  onStartAnalysis: () => void;
}

const PIPELINE_STEPS = [
  {
    label: 'Áudio',
    desc:  'Ficheiro .wav, .mp3 ou .flac — ou microfone em tempo real.',
  },
  {
    label: 'Análise Acústica',
    desc:  'Extracção de 39 coeficientes MFCC (base + deltas + delta-deltas).',
  },
  {
    label: 'IA (SVM)',
    desc:  'Classificador SVM treinado com amostras reais e sintéticas; devolve probabilidades calibradas.',
  },
  {
    label: 'Índice de Sinteticidade',
    desc:  'Probabilidade 0–100 % de o áudio ter sido gerado por IA. Acima do limiar configúrável → alerta.',
  },
];

export function Hero({ onStartAnalysis }: HeroProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-36"
      style={{ minHeight: '100svh' }}
    >
      {/* Glow de fundo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 45%, oklch(20% 0.055 250) 0%, transparent 70%)',
        }}
      />

      {/* Badge "SISTEMA ACTIVO" */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-medium mb-10"
        style={{
          background: 'var(--glass-bg)',
          border:     '1px solid var(--glass-border)',
          color:      'var(--color-accent)',
          backdropFilter: 'var(--glass-blur)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: 'var(--color-safe)',
            boxShadow:  '0 0 6px var(--color-safe)',
            animation:  'dot-blink 2s ease-in-out infinite',
          }}
        />
        SISTEMA ACTIVO
      </div>

      {/* Título principal */}
      <h1
        className="font-mono font-bold leading-none mb-6 neon-text animate-neon-pulse"
        style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '-0.02em' }}
      >
        Digital Voice
        <br />
        Shield
      </h1>

      {/* Subtítulo */}
      <p
        className="font-mono text-sm md:text-base mb-10 max-w-lg"
        style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}
      >
        Detecção de Clonagem Vocal e Deepfakes de Áudio em Tempo Real
      </p>

      {/* Pipeline — steps compactos */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-center mb-3">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5 md:gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
              style={{
                background:     'var(--glass-bg)',
                border:         '1px solid var(--glass-border)',
                color:          'rgba(255,255,255,0.65)',
                backdropFilter: 'var(--glass-blur)',
                whiteSpace:     'nowrap',
              }}
            >
              {step.label}
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <svg
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="var(--color-accent)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: 0.45, flexShrink: 0 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Botão "Saber mais" */}
      <button
        onClick={() => setShowModal(true)}
        className="mb-10 text-xs font-mono underline underline-offset-2 transition-opacity duration-150 hover:opacity-100"
        style={{ color: 'rgba(255,255,255,0.32)', opacity: 0.75 }}
      >
        Saber mais sobre o pipeline
      </button>

      {/* Estatística de destaque */}
      <div
        className="px-6 py-4 rounded-xl mb-12 text-sm font-mono max-w-md"
        style={{
          background:     'var(--glass-bg)',
          border:         '1px solid var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          color:          'rgba(255,255,255,0.55)',
          lineHeight:     1.65,
        }}
      >
        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          Detecta artefactos de síntese
        </span>{' '}
        imperceptíveis ao ouvido humano — sobre-suavização, periodicidade
        artificial e descontinuidades espectrais.
      </div>

      {/* CTA */}
      <button
        onClick={onStartAnalysis}
        className="px-10 py-4 rounded-xl font-bold text-base uppercase transition-all duration-200"
        style={{
          background:    'var(--color-accent)',
          color:         'oklch(10% 0.01 260)',
          letterSpacing: '0.12em',
          boxShadow:     '0 0 36px oklch(70% 0.18 250 / 0.45)',
          cursor:        'pointer',
        }}
      >
        Começar Análise
      </button>

      {/* ── Modal: pipeline detalhado ──────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card p-8 w-full max-w-lg text-left animate-slide-up"
            style={{ background: 'var(--bg-elevated)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="font-mono font-bold text-xl mb-6"
              style={{ color: 'var(--color-accent)' }}
            >
              Pipeline de Detecção
            </h2>

            <ol className="flex flex-col gap-5">
              {PIPELINE_STEPS.map((step, i) => (
                <li key={step.label} className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                    style={{
                      background: 'oklch(70% 0.18 250 / 0.12)',
                      border:     '1px solid oklch(70% 0.18 250 / 0.3)',
                      color:      'var(--color-accent)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-mono font-semibold" style={{ color: 'var(--color-accent)' }}>
                      {step.label}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {step.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div
              className="mt-6 pt-5 text-xs font-mono"
              style={{ borderTop: '1px solid var(--glass-border)', color: 'rgba(255,255,255,0.3)', lineHeight: 1.75 }}
            >
              Modelo treinado com o dataset LJSpeech (real) e amostras TTS/VC (sintético).
              Latência de análise de ficheiro: tipicamente &lt; 2 s.
              Latência em tempo real: ≤ 200 ms por chunk (RNF-01).
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                background: 'var(--glass-bg)',
                border:     '1px solid var(--glass-border)',
                color:      'rgba(255,255,255,0.55)',
                cursor:     'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
