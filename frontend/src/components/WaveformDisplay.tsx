import { useEffect, useRef, useState, useCallback } from 'react';

interface WaveformDisplayProps {
  file: File;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WaveformDisplay({ file }: WaveformDisplayProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const audioRef    = useRef<HTMLAudioElement>(null);
  const waveDataRef = useRef<Float32Array | null>(null);

  const [duration,    setDuration]    = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [error,       setError]       = useState(false);

  const drawWaveform = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !waveDataRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (W === 0 || H === 0) return;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const data    = waveDataRef.current;
    const step    = Math.ceil(data.length / W);
    const amp     = H / 2;
    const headX   = Math.floor(progress * W);

    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < W; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const s = data[i * step + j] ?? 0;
        if (s < min) min = s;
        if (s > max) max = s;
      }
      const barH = Math.max(2, (max - min) * amp * 0.9);
      const y    = amp - barH / 2;

      ctx.fillStyle = i < headX
        ? 'rgba(82,163,255,0.95)'
        : 'rgba(82,163,255,0.22)';
      ctx.fillRect(i, y, 1, barH);
    }

    // Centre line
    ctx.strokeStyle = 'rgba(82,163,255,0.08)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(W, amp);
    ctx.stroke();

    // Playhead
    if (headX > 0 && headX < W) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(headX, 0);
      ctx.lineTo(headX, H);
      ctx.stroke();
    }
  }, []);

  // Create object URL for the <audio> element
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (audioRef.current) audioRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Decode audio → waveform
  useEffect(() => {
    let cancelled = false;
    setDuration(null);
    setError(false);
    setCurrentTime(0);
    setIsPlaying(false);
    waveDataRef.current = null;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (cancelled || !e.target?.result) return;
      try {
        const audioCtx = new AudioContext();
        const buffer   = await audioCtx.decodeAudioData(e.target.result as ArrayBuffer);
        await audioCtx.close();
        if (cancelled) return;
        setDuration(buffer.duration);
        waveDataRef.current = buffer.getChannelData(0);
        drawWaveform(0);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    reader.onerror = () => { if (!cancelled) setError(true); };
    reader.readAsArrayBuffer(file);
    return () => { cancelled = true; };
  }, [file, drawWaveform]);

  // Redraw waveform when playhead moves
  useEffect(() => {
    if (duration && duration > 0) drawWaveform(currentTime / duration);
  }, [currentTime, duration, drawWaveform]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const audio  = audioRef.current;
    if (!canvas || !audio || !duration) return;
    const rect  = canvas.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const time  = Math.max(0, Math.min(ratio * duration, duration));
    audio.currentTime = time;
    setCurrentTime(time);
  };

  if (error) {
    return (
      <div
        className="flex items-center justify-center text-xs font-mono"
        style={{ height: '72px', color: 'rgba(255,255,255,0.3)' }}
      >
        {file.name}
      </div>
    );
  }

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        preload="metadata"
      />

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ display: 'block', height: '72px', cursor: 'pointer' }}
        onClick={handleCanvasClick}
        title="Clique para saltar para esse ponto"
      />

      {/* Player controls */}
      <div className="flex items-center gap-3 mt-2">
        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: isPlaying ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${isPlaying ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
            cursor: 'pointer',
          }}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#000">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)" style={{ marginLeft: '1px' }}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Time */}
        <span className="font-mono text-xs tabular" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {formatTime(currentTime)}
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>
            {' / '}{duration !== null ? formatTime(duration) : '--:--'}
          </span>
        </span>

        {/* File info — right side */}
        <span
          className="font-mono text-xs truncate"
          style={{ flex: 1, textAlign: 'right', color: 'rgba(255,255,255,0.28)' }}
        >
          {file.name} · {formatSize(file.size)}
        </span>
      </div>
    </div>
  );
}
