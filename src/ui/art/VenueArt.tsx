import type { ReactNode } from 'react';
import type { VenueArt as VenueId } from '../../content/types';

/**
 * Illustrated scenes for the nine tour stops. Flat, layered silhouettes lit by each
 * venue's accent colour. viewBox 400×200, cropped to fill whatever box they sit in.
 */
export function VenueArt({ art, accent, className, locked }: { art: VenueId; accent: string; className?: string; locked?: boolean }) {
  const id = `v-${art}`;
  return (
    <svg className={`venue-art ${className ?? ''} ${locked ? 'locked' : ''}`} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0a12" />
          <stop offset="1" stopColor={accent} stopOpacity="0.38" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={accent} stopOpacity="0.85" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.75" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="400" height="200" fill={`url(#${id}-sky)`} />
      {SCENES[art](id, accent)}
    </svg>
  );
}

const stars = (n: number, seed: number, maxY = 90): ReactNode => {
  const out: ReactNode[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * 400;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * maxY;
    out.push(<circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 1.3 : 0.7} fill="#fff" opacity={0.35 + (i % 3) * 0.2} />);
  }
  return out;
};

const crowd = (y: number, color: string, seed = 3): ReactNode => {
  const out: ReactNode[] = [];
  let s = seed;
  for (let x = -10; x < 410; x += 13) {
    s = (s * 9301 + 49297) % 233280;
    const h = 8 + (s / 233280) * 10;
    out.push(<circle key={`h${x}`} cx={x} cy={y - h} r={6.5} fill={color} />);
    if (s % 3 === 0) out.push(<path key={`a${x}`} d={`M${x + 3} ${y - h} l6 -22 l3 1 -5 22z`} fill={color} />);
  }
  out.push(<rect key="body" x={0} y={y - 10} width={400} height={200 - y + 10} fill={color} />);
  return out;
};

const SCENES: Record<VenueId, (id: string, accent: string) => ReactNode> = {
  garage: (id, a) => (
    <>
      {stars(40, 7, 80)}
      <circle cx="340" cy="38" r="14" fill="#fff4dc" opacity="0.85" />
      <path d="M40 200V92l120-50 120 50v108Z" fill="#1a1520" />
      <path d="M30 96 160 40l130 56" stroke="#2c2433" strokeWidth="8" fill="none" />
      <rect x="78" y="104" width="164" height="96" fill="#0c0a0f" />
      <rect x="78" y="150" width="164" height="50" fill={`url(#${id}-glow)`} opacity="0.9" />
      <rect x="78" y="104" width="164" height="50" fill="#2a2230" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="78" x2="242" y1={112 + i * 9} y2={112 + i * 9} stroke="#3b3142" strokeWidth="2" />
      ))}
      <rect x="96" y="160" width="40" height="40" rx="3" fill="#120e16" stroke={a} strokeOpacity="0.5" />
      <rect x="101" y="166" width="30" height="22" rx="2" fill="#2a2230" />
      <path d="M182 200l14-48h6l-2 48z" fill="#120e16" />
      <ellipse cx="196" cy="186" rx="15" ry="13" fill="#120e16" />
      <path d="M78 200 40 200 0 200l30 0 48-46h164l48 46H0" fill={a} opacity="0.12" />
      <circle cx="160" cy="150" r="3" fill="#fff6d6" />
      <circle cx="160" cy="150" r="14" fill={`url(#${id}-glow)`} />
    </>
  ),
  basement: (id, a) => (
    <>
      <rect width="400" height="200" fill="#16111a" />
      {Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 12 }, (_, c) => (
          <rect key={`${r}-${c}`} x={c * 36 - (r % 2 ? 18 : 0)} y={r * 18} width="33" height="15" rx="2" fill="#2a1f25" opacity={0.6 + ((r * 7 + c * 3) % 5) * 0.08} />
        )),
      )}
      <rect width="400" height="200" fill={`url(#${id}-sky)`} opacity="0.6" />
      <rect x="0" y="16" width="400" height="7" fill="#3a3038" />
      <rect x="0" y="28" width="400" height="4" fill="#2f262e" />
      <circle cx="300" cy="40" r="60" fill={`url(#${id}-glow)`} opacity="0.7" />
      <path d="M288 40h24l-6 18h-12z" fill="#e0c38a" />
      <rect x="298" y="58" width="4" height="110" fill="#120e16" />
      <rect x="286" y="166" width="28" height="6" rx="3" fill="#120e16" />
      <path d="M40 200v-48c0-10 8-16 18-16h120c10 0 18 6 18 16v48z" fill="#120e16" />
      <rect x="30" y="150" width="30" height="50" rx="10" fill="#0e0b11" />
      <rect x="176" y="150" width="30" height="50" rx="10" fill="#0e0b11" />
      <ellipse cx="250" cy="176" rx="22" ry="22" fill="#0e0b11" />
      <ellipse cx="250" cy="176" rx="16" ry="16" fill="none" stroke={a} strokeOpacity="0.45" />
      <rect x="226" y="128" width="12" height="4" fill="#0e0b11" transform="rotate(-12 232 130)" />
      <ellipse cx="220" cy="128" rx="18" ry="4" fill="#0e0b11" />
    </>
  ),
  divebar: (id, a) => (
    <>
      <rect width="400" height="200" fill="#120c12" />
      <rect width="400" height="200" fill={`url(#${id}-sky)`} opacity="0.5" />
      <g filter={`url(#${id}-blur)`} stroke={a} strokeWidth="4" fill="none" opacity="0.9">
        <path d="M150 70c-10-14 2-30 18-26 10 2 12 12 22 12h48l10-6 6 6-6 6-10-6h-48c-10 0-12 10-22 12-16 4-28-12-18-26" />
        <path d="M250 40h50M250 52h40" />
      </g>
      <g stroke="#ffe3ec" strokeWidth="2" fill="none">
        <path d="M150 70c-10-14 2-30 18-26 10 2 12 12 22 12h48l10-6 6 6-6 6-10-6h-48c-10 0-12 10-22 12-16 4-28-12-18-26" />
      </g>
      <text x="300" y="100" textAnchor="middle" fontFamily="Oswald Variable, sans-serif" fontWeight="700" fontSize="30" fill="#ffe3ec" stroke={a} strokeWidth="1.5" filter={`url(#${id}-blur)`} opacity="0.9">
        LIVE
      </text>
      <text x="300" y="100" textAnchor="middle" fontFamily="Oswald Variable, sans-serif" fontWeight="700" fontSize="30" fill="#ffe3ec">
        LIVE
      </text>
      {[40, 58, 74, 92, 340, 356, 372].map((x, i) => (
        <path key={x} d={`M${x} 140v-${18 + (i % 3) * 6}c0-4 2-6 3-8v-6h4v6c1 2 3 4 3 8v${18 + (i % 3) * 6}z`} fill="#0b080c" opacity="0.9" />
      ))}
      <rect x="0" y="140" width="400" height="12" fill="#2b1d24" />
      <rect x="0" y="152" width="400" height="48" fill="#0b080c" />
      {[70, 160, 250, 330].map((x) => (
        <g key={x} fill="#1d151b">
          <ellipse cx={x} cy="166" rx="16" ry="4" />
          <rect x={x - 2} y="166" width="4" height="34" />
        </g>
      ))}
    </>
  ),
  skatepark: (id, a) => (
    <>
      <rect width="400" height="200" fill="#1a0f22" />
      <rect width="400" height="200" fill={`url(#${id}-sky)`} />
      <circle cx="300" cy="110" r="46" fill={a} opacity="0.85" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="250" y={100 + i * 10} width="100" height="3" fill="#1a0f22" />
      ))}
      <path d="M0 200V120c60 0 90 40 100 80z" fill="#241830" />
      <path d="M400 200V110c-70 0-110 44-120 90z" fill="#2b1d39" />
      <rect x="0" y="182" width="400" height="18" fill="#140c1a" />
      <path d="M0 120c60 0 90 40 100 80" stroke={a} strokeWidth="3" fill="none" opacity="0.8" />
      <path d="M400 110c-70 0-110 44-120 90" stroke={a} strokeWidth="3" fill="none" opacity="0.8" />
      <g transform="rotate(-24 190 70)">
        <rect x="160" y="66" width="62" height="8" rx="4" fill="#0e0812" />
        <circle cx="170" cy="78" r="5" fill={a} />
        <circle cx="212" cy="78" r="5" fill={a} />
      </g>
      <path d="M40 60l18-20-4 14 14-4-18 22 4-14z" fill={a} opacity="0.9" />
      <path d="M100 168c10-12 22-12 30 0s20 12 30 0" stroke="#ff5ea8" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  campfire: (id, a) => (
    <>
      <rect width="400" height="200" fill="#0b0c18" />
      {stars(70, 11, 120)}
      <circle cx="70" cy="40" r="16" fill="#f5ecd2" opacity="0.9" />
      <circle cx="78" cy="35" r="15" fill="#0b0c18" />
      {[20, 70, 120, 290, 340, 380].map((x, i) => (
        <path key={x} d={`M${x} 170l${-16 - (i % 2) * 6} 0 ${16 + (i % 2) * 6}-${60 + (i % 3) * 14} ${16 + (i % 2) * 6} ${60 + (i % 3) * 14}z`} fill="#070810" />
      ))}
      <rect x="0" y="168" width="400" height="32" fill="#08070d" />
      <circle cx="200" cy="160" r="70" fill={`url(#${id}-glow)`} opacity="0.75" />
      <path d="M200 168c-22 0-30-16-22-34 4 8 10 10 12 6-4-14 4-28 14-34-2 12 8 18 14 30 4-6 4-12 2-18 10 10 14 22 10 32-4 12-14 18-30 18z" fill={a} />
      <path d="M200 168c-12 0-16-10-12-20 4 4 8 4 8 0 0-8 4-14 8-18 0 8 6 12 8 18 2 10-2 20-12 20z" fill="#fff3c4" />
      <rect x="166" y="166" width="70" height="8" rx="4" fill="#3b2418" transform="rotate(8 200 170)" />
      <rect x="166" y="166" width="70" height="8" rx="4" fill="#4a2c1c" transform="rotate(-8 200 170)" />
    </>
  ),
  furnace: (id, a) => (
    <>
      <rect width="400" height="200" fill="#120909" />
      <rect width="400" height="200" fill={`url(#${id}-sky)`} opacity="0.7" />
      {[60, 110, 300, 350].map((x) => (
        <g key={x}>
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx={x} cy={i * 11 + 4} rx="4" ry="6" fill="none" stroke="#3a2420" strokeWidth="2.5" />
          ))}
        </g>
      ))}
      <path d="M130 200V96a70 70 0 0 1 140 0v104z" fill="#24120e" />
      <path d="M150 200v-96a50 50 0 0 1 100 0v96z" fill={a} />
      <path d="M150 200v-96a50 50 0 0 1 100 0v96z" fill="#ffd166" opacity="0.35" />
      <circle cx="200" cy="140" r="90" fill={`url(#${id}-glow)`} opacity="0.65" />
      <path d="M120 200l10-26h50l6-14h-40v-10h110v10h-40l6 14h50l10 26z" fill="#0c0606" />
      {Array.from({ length: 18 }, (_, i) => (
        <circle key={i} cx={170 + ((i * 37) % 70)} cy={30 + ((i * 53) % 90)} r={1 + (i % 3) * 0.6} fill="#ffd166" opacity={0.5 + (i % 4) * 0.12} />
      ))}
    </>
  ),
  theater: (id, a) => (
    <>
      <rect width="400" height="200" fill="#0e0914" />
      <path d="M140 0h120l60 200H80z" fill={`url(#${id}-beam)`} opacity="0.55" />
      <ellipse cx="200" cy="186" rx="80" ry="12" fill={a} opacity="0.4" />
      <path d="M0 0h110c-10 40 10 70-10 120 18 30 10 60 20 80H0z" fill="#3a0f2a" />
      <path d="M400 0H290c10 40-10 70 10 120-18 30-10 60-20 80h120z" fill="#3a0f2a" />
      {[18, 46, 74].map((x) => (
        <path key={x} d={`M${x} 0c-6 60 8 120 -4 200`} stroke="#250a1c" strokeWidth="6" fill="none" />
      ))}
      {[326, 354, 382].map((x) => (
        <path key={x} d={`M${x} 0c6 60 -8 120 4 200`} stroke="#250a1c" strokeWidth="6" fill="none" />
      ))}
      <path d="M0 0h400v22c-40 10-80-6-100 6-20-12-60 6-100-4-40 10-80-6-100 4C80 16 40 32 0 22z" fill="#4a1236" />
      <rect x="198" y="120" width="4" height="66" fill="#120a16" />
      <circle cx="200" cy="116" r="7" fill="#120a16" />
      <rect x="186" y="184" width="28" height="4" rx="2" fill="#120a16" />
      <rect x="0" y="188" width="400" height="12" fill="#1b0f1f" />
    </>
  ),
  arena: (id) => (
    <>
      <rect width="400" height="200" fill="#070b14" />
      <rect width="400" height="200" fill={`url(#${id}-sky)`} opacity="0.6" />
      {[
        [60, -30],
        [140, 15],
        [260, -15],
        [340, 30],
      ].map(([x, rot]) => (
        <path key={x} d={`M${x - 10} 22h20l40 180h-100z`} fill={`url(#${id}-beam)`} opacity="0.45" transform={`rotate(${rot} ${x} 22)`} />
      ))}
      <rect x="20" y="14" width="360" height="10" fill="#18202e" />
      <path d="M20 14l10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10" stroke="#2a3446" fill="none" />
      {[60, 140, 260, 340].map((x) => (
        <circle key={x} cx={x} cy={26} r="6" fill="#e6f6ff" />
      ))}
      {crowd(172, '#04060b', 5)}
    </>
  ),
  mainstage: (id, a) => (
    <>
      <rect width="400" height="200" fill="#0b0810" />
      {stars(30, 21, 70)}
      {[-50, -30, -10, 10, 30, 50].map((rot, i) => (
        <line key={i} x1="200" y1="120" x2="200" y2="-80" stroke={i % 2 ? '#7cf7ff' : '#ff5ea8'} strokeWidth="1.6" opacity="0.7" transform={`rotate(${rot} 200 120)`} />
      ))}
      {[
        [80, 40],
        [330, 30],
      ].map(([x, y]) => (
        <g key={x} stroke={a} strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const ang = (i / 12) * Math.PI * 2;
            return <line key={i} x1={x + Math.cos(ang) * 6} y1={y + Math.sin(ang) * 6} x2={x + Math.cos(ang) * 20} y2={y + Math.sin(ang) * 20} />;
          })}
        </g>
      ))}
      <rect x="60" y="118" width="280" height="30" fill="#1d1622" />
      <rect x="60" y="118" width="280" height="4" fill={a} opacity="0.8" />
      {[20, 340].map((x) => (
        <g key={x}>
          <rect x={x} y="70" width="40" height="78" fill="#120d16" stroke="#2a2030" />
          {[0, 1, 2].map((r) => (
            <circle key={r} cx={x + 20} cy={84 + r * 24} r="9" fill="#0a070c" stroke="#2a2030" />
          ))}
        </g>
      ))}
      {[90, 150, 250, 310].map((x) => (
        <path key={x} d={`M${x} 118c-8-10-4-20 0-30 2 8 6 10 6 4 4 8 6 18-6 26z`} fill="#ffb347" opacity="0.9" />
      ))}
      <circle cx="200" cy="118" r="80" fill={`url(#${id}-glow)`} opacity="0.4" />
      {crowd(186, '#050407', 9)}
    </>
  ),
};
