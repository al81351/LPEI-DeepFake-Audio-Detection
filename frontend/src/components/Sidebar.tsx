type View = 'file' | 'realtime' | 'history';

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
  analysisCount?: number;
}

const NAV_ITEMS: { key: View; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    key: 'file',
    label: 'Ficheiro',
    sublabel: 'Upload de áudio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    key: 'realtime',
    label: 'Tempo Real',
    sublabel: 'Microfone ao vivo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    key: 'history',
    label: 'Histórico',
    sublabel: 'Análises da sessão',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

import React from 'react';
import { useNavigate } from 'react-router-dom';

export function Sidebar({ view, onViewChange, analysisCount = 0 }: SidebarProps) {
  const navigate = useNavigate();
  return (
    <>
      {/* Desktop: vertical sidebar */}
      <aside
        className="hidden lg:flex flex-col sticky top-0 h-screen w-56 flex-shrink-0 border-r"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        {/* App brand */}
        <div
          className="px-5 py-5 border-b flex items-center gap-2.5"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {/* Back to hero */}
          <button
            onClick={() => navigate('/')}
            title="Voltar ao início"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'oklch(70% 0.18 250 / 0.15)',
              border: '1px solid oklch(70% 0.18 250 / 0.3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <div>
            <div className="font-mono font-bold text-xs" style={{ color: 'var(--color-accent)' }}>
              DVShield
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Análise de Áudio
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <div
            className="text-xs font-mono font-medium uppercase tracking-widest px-2 py-2 mb-1"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}
          >
            Ferramentas
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group"
                style={{
                  background: isActive ? 'oklch(70% 0.18 250 / 0.1)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
                    transition: 'color 200ms',
                  }}
                >
                  {item.icon}
                </span>
                <div>
                  <div
                    className="font-medium text-sm"
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.7)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {item.label}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Session badge */}
        {analysisCount > 0 && (
          <div
            className="px-5 py-4 border-t"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--color-safe)', boxShadow: '0 0 6px var(--color-safe)' }}
              />
              <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {analysisCount} análise{analysisCount !== 1 ? 's' : ''} nesta sessão
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile: horizontal pill tabs */}
      <div
        className="lg:hidden flex items-center gap-1 px-4 py-3 border-b"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        {/* Back button mobile */}
        <button
          onClick={() => navigate('/')}
          title="Voltar ao início"
          className="flex items-center justify-center w-8 h-8 rounded-full mr-1 transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {NAV_ITEMS.map((item) => {
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: isActive ? 'oklch(70% 0.18 250 / 0.15)' : 'transparent',
                border: isActive ? '1px solid oklch(70% 0.18 250 / 0.3)' : '1px solid transparent',
                color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)' }}>
                {React.cloneElement(item.icon as React.ReactElement, { width: 15, height: 15 })}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
