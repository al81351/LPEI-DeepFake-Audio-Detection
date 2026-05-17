import { useState } from 'react';
import { DottedSurface } from './ui/dotted-surface';
import { HoverButton }   from './ui/hover-button';
import { AboutModal }    from './AboutModal';

interface HeroProps {
  onStartAnalysis: () => void;
}

export function Hero({ onStartAnalysis }: HeroProps) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: '100svh', background: 'var(--bg-base)' }}
    >
      {/* Animated dot-grid background */}
      <DottedSurface />

      {/* Radial glow — shifted left to complement left-aligned content */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 25% 60%, oklch(16% 0.05 250) 0%, transparent 70%)',
        }}
      />

      {/* Content — anchored to bottom-left */}
      <div className="absolute bottom-20 left-8 md:left-12 lg:left-16 z-10 max-w-xl">
        {/* Title — white gradient, no neon blur */}
        <h1
          className="font-mono font-bold leading-[1.05] mb-6"
          style={{
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(160deg, #ffffff 0%, rgba(180,210,255,0.88) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Digital Voice
          <br />
          Shield
        </h1>

        {/* Subtitle */}
        <p
          className="font-mono text-sm md:text-base mb-10"
          style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '26rem' }}
        >
          Detecção de Clonagem Vocal e Deepfakes de Áudio
          <br />
          com Inteligência Artificial em Tempo Real
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <HoverButton
            onClick={onStartAnalysis}
            className="font-mono font-semibold tracking-wide"
            style={{ color: 'white' }}
          >
            Iniciar Análise
            <svg
              className="inline ml-2 -mr-1"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </HoverButton>

          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-mono text-sm font-medium transition-all duration-200"
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.35)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Saber Mais
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        style={{ animation: 'scroll-bounce 2s ease-in-out infinite' }}
        aria-hidden
      >
        <span
          className="text-xs font-mono tracking-widest"
          style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}
        >
          SCROLL
        </span>
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* About modal */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </section>
  );
}
