import type { ReactNode } from 'react';

export type CoverMotif = 'pop-punk' | 'punk' | 'rock' | 'metal' | 'acoustic' | 'blues' | 'riff' | 'tab';

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small seeded random generator, so every song keeps the same cover. */
function seeded(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INK = '#0c0a0f';
const PAPER = '#fff3e6';

function star(cx: number, cy: number, r: number, points = 5, inner = 0.45) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return pts.join(' ');
}

function motif(kind: CoverMotif, r: () => number, color: string): ReactNode {
  switch (kind) {
    case 'punk': {
      const angle = -35 + r() * 20;
      return (
        <>
          <g transform={`rotate(${angle} 50 50)`}>
            {[18, 40, 62].map((y, i) => (
              <rect key={y} x={-30} y={y + r() * 6} width={160} height={i === 1 ? 14 : 8} fill={INK} opacity={0.42} />
            ))}
          </g>
          <polygon points={star(30 + r() * 40, 34 + r() * 30, 22, 8, 0.42)} fill={PAPER} opacity={0.88} />
          <circle cx={78} cy={78} r={9} fill="none" stroke={PAPER} strokeWidth={3} opacity={0.55} />
        </>
      );
    }
    case 'pop-punk': {
      const y = 52 + r() * 18;
      const squares: ReactNode[] = [];
      for (let i = 0; i < 12; i++) {
        squares.push(<rect key={`a${i}`} x={i * 10} y={y} width={10} height={10} fill={i % 2 ? PAPER : INK} opacity={0.75} />);
        squares.push(<rect key={`b${i}`} x={i * 10} y={y + 10} width={10} height={10} fill={i % 2 ? INK : PAPER} opacity={0.75} />);
      }
      return (
        <>
          <g transform={`rotate(${-8 + r() * 16} 50 ${y})`}>{squares}</g>
          <polygon points={star(28 + r() * 44, 24 + r() * 12, 13)} fill={PAPER} opacity={0.92} />
          <polygon points={star(78 - r() * 10, 30 + r() * 8, 6)} fill={PAPER} opacity={0.6} />
        </>
      );
    }
    case 'rock': {
      const dx = -8 + r() * 16;
      return (
        <>
          {[38, 28, 18].map((rad) => (
            <circle key={rad} cx={50} cy={50} r={rad} fill="none" stroke={INK} strokeWidth={rad === 18 ? 10 : 3} opacity={0.32} />
          ))}
          <polygon
            transform={`translate(${dx} 0) rotate(${-10 + r() * 20} 50 50)`}
            points="56,8 28,56 46,56 38,92 74,40 54,40 64,8"
            fill={PAPER}
            opacity={0.92}
          />
        </>
      );
    }
    case 'metal': {
      const peaks: string[] = ['0,100'];
      let x = 0;
      while (x < 100) {
        const w = 8 + r() * 12;
        peaks.push(`${(x + w / 2).toFixed(1)},${(38 + r() * 34).toFixed(1)}`);
        x += w;
        peaks.push(`${Math.min(100, x).toFixed(1)},${(78 + r() * 10).toFixed(1)}`);
      }
      peaks.push('100,100');
      return (
        <>
          <circle cx={30 + r() * 40} cy={30} r={15} fill={PAPER} opacity={0.85} />
          <circle cx={36 + r() * 30} cy={26} r={13} fill={color} opacity={0.9} />
          <polygon points={peaks.join(' ')} fill={INK} opacity={0.85} />
          <line x1={0} y1={96} x2={100} y2={96} stroke={color} strokeWidth={2} opacity={0.6} />
        </>
      );
    }
    case 'acoustic': {
      const cx = 36 + r() * 28;
      const cy = 40 + r() * 10;
      return (
        <>
          {[30, 24, 19].map((rad) => (
            <circle key={rad} cx={cx} cy={cy} r={rad} fill="none" stroke={PAPER} strokeWidth={rad === 24 ? 3 : 1.5} opacity={0.5} />
          ))}
          <circle cx={cx} cy={cy} r={14} fill={INK} opacity={0.75} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={cx - 22 + i * 3} y1={cy + 30} x2={cx - 22 + i * 3 + 50} y2={cy - 40} stroke={PAPER} strokeWidth={0.8} opacity={0.35} />
          ))}
          <path d={`M0 ${86 - r() * 6} Q 25 ${76 - r() * 6} 50 86 T 100 84 V 100 H 0 Z`} fill={INK} opacity={0.5} />
        </>
      );
    }
    case 'blues': {
      return (
        <>
          <circle cx={70 - r() * 10} cy={28} r={14} fill={PAPER} opacity={0.88} />
          <circle cx={76 - r() * 10} cy={24} r={13} fill={color} />
          {[52, 64, 76].map((y, i) => (
            <path
              key={y}
              d={`M-5 ${y} Q 12 ${y - 9} 25 ${y} T 55 ${y} T 85 ${y} T 115 ${y}`}
              fill="none"
              stroke={i === 1 ? PAPER : INK}
              strokeWidth={i === 1 ? 4 : 6}
              opacity={i === 1 ? 0.75 : 0.4}
            />
          ))}
        </>
      );
    }
    case 'riff': {
      return (
        <>
          {[20, 34, 48, 62, 76, 90].map((x) => (
            <line key={x} x1={x} y1={0} x2={x} y2={100} stroke={INK} strokeWidth={2} opacity={0.3} />
          ))}
          {[30, 55, 80].map((y) => (
            <line key={y} x1={0} y1={y} x2={100} y2={y} stroke={PAPER} strokeWidth={1} opacity={0.3} />
          ))}
          <path
            transform={`rotate(${-20 + r() * 40} 50 52)`}
            d="M50 86 C 34 70 22 52 22 36 C 22 22 36 16 50 16 C 64 16 78 22 78 36 C 78 52 66 70 50 86 Z"
            fill={PAPER}
            opacity={0.9}
          />
        </>
      );
    }
    case 'tab': {
      const lines = [22, 33, 44, 55, 66, 77];
      return (
        <>
          <rect x={12} y={12} width={76} height={76} rx={6} fill={PAPER} opacity={0.92} />
          {lines.map((y) => (
            <line key={y} x1={18} y1={y} x2={82} y2={y} stroke={INK} strokeWidth={1.4} opacity={0.5} />
          ))}
          {Array.from({ length: 5 }, (_, i) => {
            const y = lines[Math.floor(r() * 6)];
            return (
              <g key={i}>
                <rect x={22 + i * 12} y={y - 5} width={9} height={10} fill={PAPER} />
                <text x={26.5 + i * 12} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
                  {Math.floor(r() * 10)}
                </text>
              </g>
            );
          })}
        </>
      );
    }
  }
}

/** A little record sleeve drawn from the song's id, so every song gets its own cover. */
export function SongCover({ id, kind, color, size = 72, className = '' }: { id: string; kind: CoverMotif; color: string; size?: number; className?: string }) {
  const seed = hash(id);
  const r = seeded(seed);
  const uid = `cv${seed.toString(36)}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`song-cover ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-bg`} x1={seed % 2} y1="0" x2={1 - (seed % 2)} y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="0.55" stopColor={color} stopOpacity={0.55} />
          <stop offset="1" stopColor="#1a1320" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect width={100} height={100} rx={14} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <rect width={100} height={100} fill="#1a1320" />
        <rect width={100} height={100} fill={`url(#${uid}-bg)`} />
        <circle cx={r() * 100} cy={r() * 100} r={30 + r() * 30} fill="#fff" opacity={0.05 + r() * 0.05} />
        <g transform={kind === 'punk' || kind === 'rock' ? `rotate(${Math.floor(r() * 4) * 90} 50 50)` : r() < 0.5 && kind !== 'tab' ? 'translate(100 0) scale(-1 1)' : undefined}>{motif(kind, r, color)}</g>
        <rect width={100} height={100} fill={`url(#${uid}-shine)`} />
      </g>
      <rect x={0.5} y={0.5} width={99} height={99} rx={13.5} fill="none" stroke="rgba(255,255,255,0.14)" />
    </svg>
  );
}
