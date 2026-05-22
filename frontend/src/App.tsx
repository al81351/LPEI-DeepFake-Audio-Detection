import { useState, useRef } from 'react';
import { Hero }             from './components/Hero';
import { Sidebar }          from './components/Sidebar';
import { FileAnalysis }     from './components/FileAnalysis';
import { RealtimeAnalysis } from './components/RealtimeAnalysis';
import { AnalysisHistory }  from './components/AnalysisHistory';

type View = 'file' | 'realtime' | 'history';

export function App() {
  const [view, setView] = useState<View>('file');
  const appSectionRef   = useRef<HTMLDivElement>(null);

  const handleStartAnalysis = () => {
    appSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Hero — full viewport */}
      <Hero onStartAnalysis={handleStartAnalysis} />

      {/* App: sidebar + content */}
      <div
        id="app"
        ref={appSectionRef}
        className="flex flex-col lg:flex-row"
        style={{ minHeight: '100vh', borderTop: '1px solid var(--glass-border)' }}
      >
        <Sidebar view={view} onViewChange={setView} />

        <main className="flex-1 min-w-0 px-6 py-10 md:px-10 md:py-12">
          <div key={view} className="animate-fade-in max-w-4xl">
            {view === 'file'     && <FileAnalysis />}
            {view === 'realtime' && <RealtimeAnalysis />}
            {view === 'history'  && <HistoryView />}
          </div>
        </main>
      </div>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="font-mono font-bold text-xl mb-1"
          style={{ color: 'var(--color-accent)' }}
        >
          Histórico da Sessão
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Análises realizadas de ficheiros de áudio durante esta sessão do servidor.
        </p>
      </div>
      <AnalysisHistory />
    </div>
  );
}
