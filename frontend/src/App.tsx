import { useState }        from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Hero }             from './components/Hero';
import { Sidebar }          from './components/Sidebar';
import { FileAnalysis }     from './components/FileAnalysis';
import { RealtimeAnalysis } from './components/RealtimeAnalysis';
import { AnalysisHistory }  from './components/AnalysisHistory';

type View = 'file' | 'realtime' | 'history';

// ── / ────────────────────────────────────────────────────────────────────────
function HeroPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Hero onStartAnalysis={() => navigate('/dashboard')} />
    </div>
  );
}

// ── /dashboard ───────────────────────────────────────────────────────────────
function DashboardPage() {
  const [view, setView] = useState<View>('file');

  return (
    <div
      className="flex flex-col lg:flex-row"
      style={{ background: 'var(--bg-base)', minHeight: '100vh', borderTop: '1px solid var(--glass-border)' }}
    >
      <Sidebar view={view} onViewChange={setView} />

      <main className="flex-1 min-w-0 px-6 py-10 md:px-10 md:py-12">
        <div className="max-w-4xl">
          {/* Componentes sempre montados — estado preservado ao trocar de tab */}
          <div style={{ display: view === 'file'     ? 'block' : 'none' }}><FileAnalysis /></div>
          <div style={{ display: view === 'realtime' ? 'block' : 'none' }}><RealtimeAnalysis /></div>
          <div style={{ display: view === 'history'  ? 'block' : 'none' }}><HistoryView /></div>
        </div>
      </main>
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

// ── Router ───────────────────────────────────────────────────────────────────
export function App() {
  return (
    <Routes>
      <Route path="/"          element={<HeroPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
