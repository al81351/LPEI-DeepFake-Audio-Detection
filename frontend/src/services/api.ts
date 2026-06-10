import type { AnalysisResult, HistoryEntry } from '../types/analysis';

const BASE_URL = 'https://lpei-deepfake-audio-detection-f9be.onrender.com';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const json = await res.json().catch(() => ({ detail: `Erro HTTP ${res.status}` }));
    throw new Error((json as { detail?: string }).detail ?? `Erro HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function analyzeFile(
  file: File,
  threshold: number,
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append('file', file);
  return request<AnalysisResult>(`/analyze?threshold=${threshold}`, {
    method: 'POST',
    body: form,
  });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return request<HistoryEntry[]>('/history');
}

export async function clearHistory(): Promise<void> {
  await fetch(`${BASE_URL}/history`, { method: 'DELETE' });
}

export async function exportReport(): Promise<void> {
  const res = await fetch(`${BASE_URL}/export`, { method: 'POST' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({ detail: 'Erro ao exportar relatório' }));
    throw new Error((json as { detail?: string }).detail ?? 'Erro ao exportar relatório');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'digital_voice_shield_report.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
