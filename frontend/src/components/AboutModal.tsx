import { useEffect } from 'react';

interface AboutModalProps {
  onClose: () => void;
}

const THREAT_CARDS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Indivíduos',
    color: 'var(--color-accent)',
    colorBg: 'oklch(70% 0.18 250 / 0.07)',
    colorBorder: 'oklch(70% 0.18 250 / 0.18)',
    threats: [
      'Fraudes de voz e chamadas falsas de familiares',
      'Phishing de áudio para roubo de credenciais',
      'Manipulação emocional com voz clonada',
      'Extorsão com gravações sintéticas',
    ],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Organizações',
    color: 'var(--color-warn)',
    colorBg: 'oklch(80% 0.18 85 / 0.07)',
    colorBorder: 'oklch(80% 0.18 85 / 0.18)',
    threats: [
      'Chamadas fraudulentas de CEO para transferências',
      'Comprometimento da autenticação biométrica',
      'Espionagem corporativa com gravações falsas',
      'Ataques de engenharia social avançados',
    ],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'Sociedade',
    color: 'var(--color-danger)',
    colorBg: 'oklch(65% 0.22 15 / 0.07)',
    colorBorder: 'oklch(65% 0.22 15 / 0.18)',
    threats: [
      'Desinformação em larga escala',
      'Manipulação eleitoral com discursos falsos',
      'Erosão da confiança pública nos media',
      'Evidências forjadas em contextos judiciais',
    ],
  },
];

const PIPELINE_STEPS = [
  { label: 'Áudio', sub: '.wav · .mp3 · .flac' },
  { label: 'Features', sub: '48 extraídas' },
  { label: 'SVM', sub: 'Classificador IA' },
  { label: 'Índice', sub: '0–100%' },
  { label: 'Resultado', sub: 'Verde · Incerto · Vermelho' },
];

const STATS = [
  { value: '< 200ms', label: 'Latência em tempo real' },
  { value: '48', label: 'Features de áudio extraídas' },
  { value: '3', label: 'Tipos de artefactos detectados' },
];

export function AboutModal({ onClose }: AboutModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl my-auto animate-slide-up"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
          aria-label="Fechar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-10">
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-mono font-medium mb-4"
              style={{
                background: 'oklch(70% 0.18 250 / 0.1)',
                border: '1px solid oklch(70% 0.18 250 / 0.25)',
                color: 'var(--color-accent)',
              }}
            >
              POR QUE ISTO IMPORTA
            </div>
            <h2
              className="font-mono font-bold text-2xl md:text-3xl mb-3"
              style={{ color: 'oklch(93% 0.005 260)' }}
            >
              A Deteção de Deepfakes é Essencial
            </h2>
            <p className="text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
              A clonagem vocal por IA tornou-se acessível a qualquer pessoa com um computador.
              Sem ferramentas de deteção, distinguir uma voz real de uma sintética é praticamente impossível.
            </p>
          </div>

          {/* Threat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {THREAT_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-5 flex flex-col gap-3"
                style={{
                  background: card.colorBg,
                  border: `1px solid ${card.colorBorder}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: card.colorBg,
                      border: `1px solid ${card.colorBorder}`,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-mono font-bold" style={{ color: card.color }}>
                    {card.title}
                  </h3>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {card.threats.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: card.color }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div className="mb-10">
            <h3
              className="text-xs font-mono uppercase tracking-widest mb-5 text-center"
              style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}
            >
              Como Funciona a Deteção
            </h3>
            <div className="flex items-center justify-center flex-wrap gap-2">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div
                    className="px-4 py-2.5 rounded-xl text-center min-w-[80px]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <div className="font-mono font-semibold text-sm" style={{ color: 'var(--color-accent)' }}>
                      {step.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {step.sub}
                    </div>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 divide-x rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {STATS.map((stat) => (
              <div key={stat.value} className="py-6 flex flex-col items-center gap-1.5">
                <span className="font-mono font-bold text-3xl md:text-4xl" style={{ color: 'var(--color-accent)' }}>
                  {stat.value}
                </span>
                <span className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
