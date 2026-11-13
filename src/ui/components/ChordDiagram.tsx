import { baseFret, type ChordShape } from '../../music/chords';
import type { StringNumber } from '../../music/notes';
import { STRING_COLORS } from '../theme';

/**
 * A chord box as printed in songbooks: strings vertical (low E on the left), frets
 * horizontal, the nut on top. Dots show where fingers go, numbers say which finger.
 */
export function ChordDiagram({
  chord,
  frets: fretsProp,
  fingers: fingersProp,
  name,
  size = 150,
  leftHanded = false,
  showName = true,
}: {
  chord?: ChordShape;
  frets?: (number | null)[];
  fingers?: (number | null)[];
  name?: string;
  size?: number;
  leftHanded?: boolean;
  showName?: boolean;
}) {
  const frets = fretsProp ?? chord?.frets ?? [null, null, null, null, null, null];
  const fingers = fingersProp ?? chord?.fingers ?? [];
  const title = name ?? chord?.name ?? '';
  const base = baseFret(frets);
  const rows = 5;
  const W = 120;
  const H = 150;
  const left = 18;
  const right = W - 14;
  const top = showName ? 44 : 22;
  const bottom = H - 8;
  const sx = (right - left) / 5;
  const fy = (bottom - top) / rows;
  const col = (i: number) => left + (leftHanded ? 5 - i : i) * sx;
  const barre = chord?.barre;

  return (
    <svg className="chord-diagram" viewBox={`0 0 ${W} ${H}`} width={size} height={(size * H) / W} role="img" aria-label={`${title} chord`}>
      {showName && (
        <text x={W / 2} y={18} textAnchor="middle" className="cd-name">
          {title}
        </text>
      )}
      {/* frets */}
      {Array.from({ length: rows + 1 }, (_, r) => (
        <line key={r} x1={left} x2={right} y1={top + r * fy} y2={top + r * fy} stroke={r === 0 && base === 1 ? '#f2e9df' : 'rgba(255,255,255,0.28)'} strokeWidth={r === 0 && base === 1 ? 5 : 1.4} strokeLinecap="round" />
      ))}
      {/* strings */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={col(i)} x2={col(i)} y1={top} y2={bottom} stroke="rgba(255,255,255,0.45)" strokeWidth={1 + (5 - i) * 0.3} />
      ))}
      {base > 1 && (
        <text x={leftHanded ? right + 2 : left - 5} y={top + fy * 0.62} textAnchor={leftHanded ? 'start' : 'end'} className="cd-base">
          {base}
        </text>
      )}
      {/* open / muted markers */}
      {frets.map((f, i) => {
        const x = col(i);
        const y = top - 10;
        if (f === null) {
          return (
            <g key={i} stroke="#ff5c7a" strokeWidth={1.8} strokeLinecap="round">
              <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
              <line x1={x + 4} y1={y - 4} x2={x - 4} y2={y + 4} />
            </g>
          );
        }
        if (f === 0) return <circle key={i} cx={x} cy={y} r={4.4} fill="none" stroke="#4be3a4" strokeWidth={1.8} />;
        return null;
      })}
      {/* barre */}
      {barre && (() => {
        const a = col(6 - barre.from);
        const b = col(6 - barre.to);
        const y = top + (barre.fret - base + 0.5) * fy;
        return <rect x={Math.min(a, b) - 7} y={y - 7} width={Math.abs(b - a) + 14} height={14} rx={7} fill="#ffd166" opacity={0.9} />;
      })()}
      {/* dots */}
      {frets.map((f, i) => {
        if (f === null || f === 0) return null;
        const x = col(i);
        const y = top + (f - base + 0.5) * fy;
        const s = (6 - i) as StringNumber;
        const finger = fingers[i];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={8.2} fill={STRING_COLORS[s]} stroke="#120f16" strokeWidth={1.5} />
            {finger ? (
              <text x={x} y={y + 3.6} textAnchor="middle" className="cd-finger">
                {finger}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
