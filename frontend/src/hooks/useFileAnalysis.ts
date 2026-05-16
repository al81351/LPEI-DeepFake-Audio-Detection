import { useState, useCallback } from 'react';
import type { AnalysisResult, AnalysisStatus } from '../types/analysis';
import { analyzeFile as apiAnalyzeFile } from '../services/api';

interface UseFileAnalysisReturn {
  result: AnalysisResult | null;
  status: AnalysisStatus;
  error: string | null;
  analyze: (file: File, threshold: number) => Promise<void>;
  reset: () => void;
}

export function useFileAnalysis(): UseFileAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [error, setError]   = useState<string | null>(null);

  const analyze = useCallback(async (file: File, threshold: number) => {
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      const data = await apiAnalyzeFile(file, threshold);
      setResult(data);
      setStatus('success');
      window.dispatchEvent(new Event('history-refresh'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { result, status, error, analyze, reset };
}
