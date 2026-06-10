import { useState, useCallback, useEffect } from 'react';
import type { HistoryEntry } from '../types/analysis';
import {
  getHistory,
  clearHistory as apiClearHistory,
  exportReport as apiExportReport,
} from '../services/api';

interface UseHistoryReturn {
  history: HistoryEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
  exportPDF: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory]     = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      // mantém o histórico existente em caso de erro de rede
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    await apiClearHistory();
    setHistory([]);
  }, []);

  const exportPDF = useCallback(async () => {
    await apiExportReport();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => { void refresh(); };
    window.addEventListener('history-refresh', handler);
    return () => window.removeEventListener('history-refresh', handler);
  }, [refresh]);

  return { history, isLoading, refresh, clear, exportPDF };
}
