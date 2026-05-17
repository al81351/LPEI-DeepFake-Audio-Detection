import { useEffect, useRef, useState } from 'react';
import { getAlertLevel } from '../types/analysis';

interface SyntheticityGaugeProps {
  value: number;
  threshold: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { vb: 160, cx: 80,  cy: 80,  r: 60,  sw: 10, numSz: 28, labSz: 8,  labOff: 18 },
  md: { vb: 220, cx: 110, cy: 110, r: 88,  sw: 13, numSz: 40, labSz: 11, labOff: 22 },
  lg: { vb: 300, cx: 150, cy: 150, r: 118, sw: 17, numSz: 54, labSz: 14, labOff: 30 },
} as const;

const COLOR_MAP = {
  safe:   'var(--color-safe)',
  warn:   'var(--color-warn)',
  danger: 'var(--color-danger)',
};

const LABEL_MAP = {
  safe:   'REAL',
  warn:   'INCERTO',
  danger: 'SINTÉTICO',
};

export function SyntheticityGauge({
  value,
  threshold,
  size = 'md',
}: SyntheticityGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef        = useRef<number | null>(null);
  const startTimeRef  = useRef<number | null>(null);
  const currentValRef = useRef(0);

  useEffect(() => {
    const duration = 400;
    const from = currentValRef.current;
    const to   = value;
    startTimeRef.current = null;

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed  = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const newVal   = from + (to - from) * eased;
      currentValRef.current = newVal;
      setDisplayValue(newVal);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const { vb, cx, cy, r, sw, numSz, labSz, labOff } = SIZE_MAP[size];
  const circumference  = 2 * Math.PI * r;
  const arcLength      = circumference * 0.75;
  // visible dash starts at path-start (7:30 position) and grows clockwise
  const visibleLength  = (displayValue / 100) * arcLength;
  const alertLevel     = getAlertLevel(displayValue, threshold);
  const color         = COLOR_MAP[alertLevel];
  const centerLabel   = LABEL_MAP[alertLevel];

  const glowRadius = 3;

  // Threshold marker angle: 135° start + (threshold/100)*270°
  const thresholdAngleDeg = 135 + (threshold / 100) * 270;
  const thresholdAngleRad = (thresholdAngleDeg * Math.PI) / 180;
  const innerR = r - sw / 2 - 2;
  const outerR = r + sw / 2 + 4;
  const tx1 = cx + innerR * Math.cos(thresholdAngleRad);
  const ty1 = cy + innerR * Math.sin(thresholdAngleRad);
  const tx2 = cx + outerR * Math.cos(thresholdAngleRad);
  const ty2 = cy + outerR * Math.sin(thresholdAngleRad);

  // Outer decorative ring radius
  const outerRingR = r + sw / 2 + 10;

  return (
    <svg
      viewBox={`0 0 ${vb} ${vb}`}
      width={vb}
      height={vb}
      style={{ maxWidth: '100%', overflow: 'visible' }}
      aria-label={`Índice de sinteticidade: ${Math.round(displayValue)}%`}
      role="img"
    >
      <defs>
        {/* Gradient for the arc */}
        <linearGradient id={`gaugeGrad-${size}`} gradientUnits="userSpaceOnUse"
          x1={cx - r} y1={cy} x2={cx + r} y2={cy}
        >
          <stop offset="0%"   stopColor="var(--color-safe)"   stopOpacity="0.9" />
          <stop offset="45%"  stopColor="var(--color-warn)"   stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-danger)"  stopOpacity="0.9" />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={glowRadius} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer decorative dashed ring */}
      <circle
        cx={cx} cy={cy} r={outerRingR}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        strokeDasharray="3 6"
        transform={`rotate(135 ${cx} ${cy})`}
      />

      {/* Track arc — neutral, so it never bleeds color into the progress arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={sw}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />

      {/* Progress arc — starts at path-start, grows clockwise */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={`${visibleLength} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        filter={`url(#glow-${size})`}
        style={{ transition: 'stroke 250ms ease' }}
      />

      {/* Threshold marker line */}
      <line
        x1={tx1} y1={ty1}
        x2={tx2} y2={ty2}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Threshold label */}
      <text
        x={cx + (outerRingR + 10) * Math.cos(thresholdAngleRad)}
        y={cy + (outerRingR + 10) * Math.sin(thresholdAngleRad)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.3)"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={labSz - 1}
        fontWeight="500"
      >
        {threshold}%
      </text>

      {/* Center: value number */}
      <text
        x={cx}
        y={cy - labOff * 0.6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fontSize={numSz}
        fontWeight="700"
        style={{ fontVariantNumeric: 'tabular-nums', transition: 'fill 250ms ease' }}
      >
        {Math.round(displayValue)}%
      </text>

      {/* Center: "SINTETICIDADE" small label */}
      <text
        x={cx}
        y={cy + numSz * 0.42}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.28)"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={labSz - 1}
        fontWeight="500"
        letterSpacing="2"
      >
        SINTETICIDADE
      </text>

      {/* Center: REAL / SINTÉTICO badge */}
      {displayValue > 0 && (
        <>
          {/* Badge background */}
          <rect
            x={cx - 40}
            y={cy + numSz * 0.42 + labOff}
            width={80}
            height={labSz + 6}
            rx={4}
            fill={color}
            opacity="0.12"
          />
          <text
            x={cx}
            y={cy + numSz * 0.42 + labOff + (labSz + 6) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontFamily="'JetBrains Mono', monospace"
            fontSize={labSz}
            fontWeight="700"
            letterSpacing="1.5"
            style={{ transition: 'fill 250ms ease' }}
          >
            {centerLabel}
          </text>
        </>
      )}
    </svg>
  );
}
