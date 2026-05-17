interface AboutSectionProps {
  id?: string;
}

const THREAT_CARDS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Indivíduos',
    color: 'var(--color-accent)',
    colorBg: 'oklch(70% 0.18 250 / 0.08)',
    colorBorder: 'oklch(70% 0.18 250 / 0.2)',
    threats: [
      'Fraudes de voz e chamadas falsas de familiares',
      'Phishing de áudio para roubo de credenciais',
      'Manipulação emocional com voz clonada',
      'Extorsão com gravações sintéticas',
    ],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Organizações',
    color: 'var(--color-warn)',
    colorBg: 'oklch(80% 0.18 85 / 0.08)',
    colorBorder: 'oklch(80% 0.18 85 / 0.2)',
    threats: [
      'Chamadas fraudulentas de CEO para transferências',
      'Comprometimento da autenticação biométrica',
      'Espionagem corporativa com gravações falsas',
      'Ataques de engenharia social avançados',
    ],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'Sociedade',
    color: 'var(--color-danger)',
    colorBg: 'oklch(65% 0.22 15 / 0.08)',
    colorBorder: 'oklch(65% 0.22 15 / 0.2)',
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
  { label: 'MFCC', sub: '39 coeficientes' },
  { label: 'SVM', sub: 'Classificador IA' },
  { label: 'Índice', sub: '0–100%' },
  { label: 'Alerta', sub: 'Acima do limiar' },
];

const STATS = [
  { value: '< 200ms', label: 'Latência em tempo real' },
  { value: '39', label: 'Features MFCC extraídas' },
  { value: '3', label: 'Tipos de artefactos detectados' },
];

export function AboutSection({ id }: AboutSectionProps) {
  return (
    <section
      id={id}
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: 'var(--bg-surface)' }}
    >
      {/* Subtle radial glow top */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, oklch(17% 0.035 250) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
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
            className="font-mono font-bold text-3xl md:text-4xl mb-4"
            style={{ color: 'oklch(93% 0.005 260)' }}
          >
            A Deteção de Deepfakes é Essencial
          </h2>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}
          >
            A clonagem vocal por IA tornou-se acessível a qualquer pessoa com um computador.
            Sem ferramentas de deteção, distinguir uma voz real de uma sintética é praticamente impossível.
          </p>
        </div>

        {/* Threat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {THREAT_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 group cursor-default"
              style={{
                background: card.colorBg,
                border: `1px solid ${card.colorBorder}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: card.colorBg,
                  border: `1px solid ${card.colorBorder}`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>

              <h3
                className="font-mono font-bold text-lg"
                style={{ color: card.color }}
              >
                {card.title}
              </h3>

              <ul className="flex flex-col gap-2">
                {card.threats.map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: card.color }}
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pipeline Visual */}
        <div className="mb-16">
          <h3
            className="text-center text-xs font-mono font-medium uppercase tracking-widest mb-8"
            style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}
          >
            Como Funciona a Deteção
          </h3>

          <div className="flex items-center justify-center flex-wrap gap-2">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className="px-4 py-3 rounded-xl text-center min-w-[90px]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="font-mono font-semibold text-sm"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {step.label}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {step.sub}
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <svg
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="var(--color-accent)" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ opacity: 0.35, flexShrink: 0 }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Strip */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {STATS.map((stat) => (
            <div
              key={stat.value}
              className="py-8 flex flex-col items-center gap-2"
            >
              <span
                className="font-mono font-bold text-4xl md:text-5xl"
                style={{ color: 'var(--color-accent)' }}
              >
                {stat.value}
              </span>
              <span
                className="text-sm text-center"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
