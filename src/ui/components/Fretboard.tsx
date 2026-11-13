import type { FretMark } from '../../content/types';
import { stringLabel, type StringNumber, type TuningId } from '../../music/notes';
import { STRING_COLORS } from '../theme';

/**
 * A stretch of the neck seen like tab: thin high e on top, low E at the bottom,
 * the nut on the left (right when left-handed). Marks show where to fret.
 */
export function Fretboard({
  marks,
  frets,
  tuning = 'standard',
  leftHanded = false,
  height = 150,
}: {
  marks: (FretMark & { finger?: number; color?: string })[];
  frets?: [number, number];
  tuning?: TuningId;
  leftHanded?: boolean;
  height?: number;
}) {
  const used = marks.map((m) => m.fret).filter((f) => f > 0);
  const [from, to] = frets ?? autoRange(used);
  const count = to - from + 1;
  const labelW = 26;
  const fretW = 54;
  const startX = labelW + 12;
  const W = startX + count * fretW + 10;
  const H = 150;
  const top = 18;
  const bottom = H - 24;
  const gap = (bottom - top) / 5;
  const y = (s: number) => top + (s - 1) * gap;
  const mirror = (x: number) => (leftHanded ? W - x : x);
  /** x of the wire that closes fret k (k = from - 1 is the left edge / nut). */
  const wire = (k: number) => mirror(startX + (k - from + 1) * fretW);
  /** Centre of fret f. */
  const cell = (f: number) => mirror(startX + (f - from + 0.5) * fretW);
  const openX = mirror(startX - 13);
  const boardX = leftHanded ? W - startX - count * fretW : startX;
  const inlays = [3, 5, 7, 9, 15, 17, 19, 21];
  const fretsShown = Array.from({ length: count }, (_, i) => from + i);

  return (
    <svg className="fretboard" viewBox={`0 0 ${W} ${H}`} height={height} width={(height * W) / H} role="img" aria-label="Fretboard">
      <defs>
        <linearGradient id="fb-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2a22" />
          <stop offset="1" stopColor="#1b1412" />
        </linearGradient>
      </defs>
      <rect x={boardX} y={top - 9} width={count * fretW} height={bottom - top + 18} rx={6} fill="url(#fb-wood)" />
      {fretsShown
        .filter((f) => inlays.includes(f) || f % 12 === 0)
        .map((f) =>
          f % 12 === 0 ? (
            <g key={f} fill="rgba(255,255,255,0.13)">
              <circle cx={cell(f)} cy={y(2) + gap / 2} r={5} />
              <circle cx={cell(f)} cy={y(4) + gap / 2} r={5} />
            </g>
          ) : (
            <circle key={f} cx={cell(f)} cy={(top + bottom) / 2} r={5.5} fill="rgba(255,255,255,0.13)" />
          ),
        )}
      {Array.from({ length: count + 1 }, (_, i) => {
        const k = from - 1 + i;
        const nut = k === 0;
        return <line key={k} x1={wire(k)} x2={wire(k)} y1={top - 9} y2={bottom + 9} stroke={nut ? '#efe4d4' : '#9c9690'} strokeWidth={nut ? 5 : 2} />;
      })}
      {fretsShown.map((f) => (
        <text key={f} x={cell(f)} y={H - 5} textAnchor="middle" className="fb-num">
          {f}
        </text>
      ))}
      {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((s) => (
        <g key={s}>
          <line x1={boardX} x2={boardX + count * fretW} y1={y(s)} y2={y(s)} stroke={STRING_COLORS[s]} strokeOpacity={0.75} strokeWidth={0.9 + s * 0.35} />
          <text x={mirror(11)} y={y(s) + 4} textAnchor="middle" className="fb-label" fill={STRING_COLORS[s]}>
            {stringLabel(tuning, s)}
          </text>
        </g>
      ))}
      {marks.map((m, i) => {
        const open = m.fret === 0;
        const cx = open ? openX : cell(m.fret);
        const cy = y(m.string);
        const color = m.color ?? STRING_COLORS[m.string];
        const text = m.label ?? (m.finger ? String(m.finger) : '');
        return (
          <g key={i}>
            {m.root && <circle cx={cx} cy={cy} r={13} fill="none" stroke="#ffd166" strokeWidth={2} />}
            <circle cx={cx} cy={cy} r={open ? 8 : 10} fill={open ? '#120f16' : color} stroke={open ? color : '#120f16'} strokeWidth={open ? 2.5 : 1.5} />
            {text && (
              <text x={cx} y={cy + 4} textAnchor="middle" className="fb-mark" fill={open ? color : '#120f16'}>
                {text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function autoRange(used: number[]): [number, number] {
  if (!used.length) return [1, 5];
  const lo = Math.min(...used);
  const hi = Math.max(...used);
  if (hi <= 5) return [1, 5];
  const from = Math.max(1, lo - 1);
  return [from, Math.max(from + 4, hi + 1)];
}
