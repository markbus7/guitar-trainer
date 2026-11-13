import type { ReactNode } from 'react';
import type { ArtId } from '../../content/types';
import { STRING_COLORS } from '../theme';

/** Teaching illustrations used in lesson walk-throughs. viewBox 360×200. */
export function LessonArt({ art }: { art: ArtId }) {
  return (
    <svg className="lesson-art" viewBox="0 0 360 200" role="img" aria-label={LABELS[art]}>
      <defs>
        <linearGradient id="la-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="0.55" stopColor="#d9531e" />
          <stop offset="1" stopColor="#7a1f12" />
        </linearGradient>
        <linearGradient id="la-neck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3226" />
          <stop offset="1" stopColor="#2a1b15" />
        </linearGradient>
        <linearGradient id="la-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2c7a5" />
          <stop offset="1" stopColor="#c98c6a" />
        </linearGradient>
        <marker id="la-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0l10 5-10 5z" fill="#ffd166" />
        </marker>
      </defs>
      {ART[art]}
    </svg>
  );
}

const LABELS: Record<ArtId, string> = {
  'guitar-parts': 'Parts of a semi-acoustic guitar',
  posture: 'Sitting posture with the guitar on the right leg',
  'pick-grip': 'Holding the pick between thumb and index finger',
  'fret-hand': 'Press just behind the fret',
  'tab-reading': 'How to read tab',
  'palm-mute': 'Palm muting at the bridge',
  'string-names': 'The six string names',
  strum: 'Down and up strums',
  bend: 'Bending a string',
  'drop-d': 'Tuning the low E string down to D',
};

const Label = ({ x, y, tx, ty, text, anchor = 'start' }: { x: number; y: number; tx: number; ty: number; text: string; anchor?: 'start' | 'end' | 'middle' }) => (
  <g>
    <line x1={x} y1={y} x2={tx} y2={ty} stroke="#ffd166" strokeWidth="1" opacity="0.8" />
    <circle cx={x} cy={y} r="2.5" fill="#ffd166" />
    <text x={tx + (anchor === 'start' ? 3 : anchor === 'end' ? -3 : 0)} y={ty + (ty < y ? -3 : 11)} textAnchor={anchor} className="la-label">
      {text}
    </text>
  </g>
);

const strings6 = (x1: number, x2: number, y0: number, gap: number, opacity = 0.9): ReactNode =>
  [1, 2, 3, 4, 5, 6].map((s) => (
    <line key={s} x1={x1} x2={x2} y1={y0 + (s - 1) * gap} y2={y0 + (s - 1) * gap} stroke={STRING_COLORS[s as 1]} strokeWidth={0.8 + s * 0.35} opacity={opacity} />
  ));

const ART: Record<ArtId, ReactNode> = {
  'guitar-parts': (
    <g>
      {/* body: semi-hollow double cutaway */}
      <path
        d="M30 100c0-38 22-58 52-58 18 0 26 10 40 10 10 0 14-8 24-8 12 0 18 12 18 22 0 6-4 10-4 16s4 10 4 16c0 10-6 22-18 22-10 0-14-8-24-8-14 0-22 10-40 10-30 0-52-20-52-58z"
        fill="url(#la-body)"
        stroke="#2a1208"
        strokeWidth="2"
      />
      <path d="M60 78c4-4 10-4 10 2s-10 10-8 18 10 10 6 16-12 2-10-4" fill="none" stroke="#1a0b06" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 78c4-4 10-4 10 2s-10 10-8 18 10 10 6 16-12 2-10-4" fill="none" stroke="#1a0b06" strokeWidth="3" strokeLinecap="round" transform="translate(0 200) scale(1 -1)" opacity="0" />
      <rect x="96" y="86" width="16" height="28" rx="3" fill="#20140f" stroke="#c9c2b8" strokeWidth="1.5" />
      <rect x="122" y="86" width="16" height="28" rx="3" fill="#20140f" stroke="#c9c2b8" strokeWidth="1.5" />
      <rect x="78" y="90" width="6" height="20" rx="2" fill="#c9c2b8" />
      {/* neck */}
      <rect x="150" y="91" width="150" height="18" fill="url(#la-neck)" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={160 + i * 12} x2={160 + i * 12} y1="91" y2="109" stroke="#bdb5aa" strokeWidth="1.4" />
      ))}
      {[3, 5, 7, 9].map((f) => (
        <circle key={f} cx={160 + (f - 0.5) * 12} cy="100" r="2" fill="#e8dccb" opacity="0.7" />
      ))}
      <rect x="298" y="90" width="4" height="20" fill="#efe4d4" />
      {/* headstock */}
      <path d="M302 88h40c6 0 8 4 6 8l-4 8 4 8c2 4 0 8-6 8h-40z" fill="#2a1b15" stroke="#140c09" strokeWidth="1.5" />
      {[312, 324, 336].map((x) => (
        <g key={x}>
          <circle cx={x} cy="86" r="3.5" fill="#c9c2b8" />
          <circle cx={x} cy="114" r="3.5" fill="#c9c2b8" />
        </g>
      ))}
      {/* strings */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="80" x2="342" y1={93 + i * 2.8} y2={93 + i * 2.8} stroke="#e8e2d8" strokeWidth="0.6" opacity="0.8" />
      ))}
      <Label x={62} y={92} tx={40} ty={30} text="F-hole" anchor="middle" />
      <Label x={117} y={88} tx={118} ty={26} text="Pickups" anchor="middle" />
      <Label x={81} y={110} tx={70} ty={176} text="Bridge" anchor="middle" />
      <Label x={46} y={130} tx={20} ty={168} text="Body" anchor="start" />
      <Label x={220} y={109} tx={220} ty={160} text="Neck & frets" anchor="middle" />
      <Label x={300} y={110} tx={290} ty={176} text="Nut" anchor="middle" />
      <Label x={324} y={86} tx={318} ty={36} text="Tuning pegs" anchor="middle" />
    </g>
  ),
  posture: (
    <g>
      {/* chair */}
      <rect x="120" y="128" width="90" height="8" rx="3" fill="#3a2f40" />
      <rect x="126" y="136" width="6" height="52" fill="#2a2230" />
      <rect x="198" y="136" width="6" height="52" fill="#2a2230" />
      <rect x="200" y="60" width="6" height="74" fill="#2a2230" />
      {/* person */}
      <circle cx="176" cy="38" r="15" fill="url(#la-skin)" />
      <path d="M176 54c-12 0-18 10-18 24v48h36V78c0-14-6-24-18-24z" fill="#5b6cff" opacity="0.85" />
      <path d="M160 124h-40l-4 60h10l4-48h30z" fill="#2f3a66" />
      <path d="M194 124h-34l-6 6h-2" fill="#2f3a66" />
      {/* guitar on right leg */}
      <ellipse cx="128" cy="112" rx="34" ry="26" fill="url(#la-body)" stroke="#2a1208" strokeWidth="2" />
      <ellipse cx="150" cy="104" rx="22" ry="18" fill="url(#la-body)" stroke="#2a1208" strokeWidth="2" />
      <rect x="160" y="74" width="110" height="10" fill="url(#la-neck)" transform="rotate(-16 160 80)" />
      <rect x="262" y="40" width="24" height="12" rx="3" fill="#2a1b15" transform="rotate(-16 262 46)" />
      {/* arms */}
      <path d="M168 64c-14 14-26 30-30 48" stroke="url(#la-skin)" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M184 62c20 6 40 4 62-4" stroke="url(#la-skin)" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M118 52l-4 20M232 32l16 12" stroke="#ffd166" strokeWidth="2" markerEnd="url(#la-arrow)" />
      <text x="40" y="44" className="la-label">Shoulders relaxed</text>
      <text x="226" y="22" className="la-label">Neck tilted up</text>
      <text x="22" y="160" className="la-label">Waist on your right leg</text>
    </g>
  ),
  'pick-grip': (
    <g>
      <path d="M150 60c30-6 70 0 70 40 0 44-52 82-60 90-8-8-60-46-60-90 0-30 24-38 50-40z" fill="#ff6a2b" stroke="#3a1206" strokeWidth="3" />
      <path d="M150 64c18-2 40 2 46 18" stroke="#ffd2b0" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />
      {/* index finger curling under */}
      <path d="M60 40c40 0 90 10 110 40 8 12 4 26-10 28-20 2-40-10-60-14-20-4-40-4-56-8" fill="url(#la-skin)" stroke="#9a6648" strokeWidth="2" />
      {/* thumb on top */}
      <path d="M20 110c30-20 70-30 110-30 20 0 34 8 34 20s-14 20-34 20c-40 0-70 10-100 18" fill="url(#la-skin)" stroke="#9a6648" strokeWidth="2" />
      <ellipse cx="148" cy="98" rx="14" ry="8" fill="#f7d9c2" opacity="0.7" />
      <path d="M160 168l0 22" stroke="#ffd166" strokeWidth="2" markerEnd="url(#la-arrow)" />
      <text x="232" y="150" className="la-label">Only the tip shows</text>
      <text x="232" y="166" className="la-label faint">(2–3 mm)</text>
      <text x="230" y="72" className="la-label">Thumb pad on top,</text>
      <text x="230" y="88" className="la-label">side of index below</text>
    </g>
  ),
  'fret-hand': (
    <g>
      <rect x="20" y="70" width="320" height="70" rx="6" fill="url(#la-neck)" />
      {[60, 140, 220, 300].map((x) => (
        <rect key={x} x={x} y="68" width="5" height="74" rx="2" fill="#cfc8bd" />
      ))}
      {strings6(20, 340, 78, 11, 0.85)}
      {/* good finger: just behind fret at x=140 */}
      <ellipse cx="126" cy="111" rx="11" ry="9" fill="url(#la-skin)" stroke="#9a6648" strokeWidth="1.5" />
      <path d="M120 30c2 30 0 60 6 76" stroke="url(#la-skin)" strokeWidth="20" strokeLinecap="round" fill="none" />
      <circle cx="126" cy="111" r="15" fill="none" stroke="#4be3a4" strokeWidth="2.5" />
      <path d="M114 166l8 8 16-16" stroke="#4be3a4" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text x="146" y="172" className="la-label">Right behind the fret: clean</text>
      {/* bad finger: middle of the fret space */}
      <ellipse cx="260" cy="100" rx="11" ry="9" fill="url(#la-skin)" stroke="#9a6648" strokeWidth="1.5" opacity="0.8" />
      <path d="M262 26c0 30 -2 50 -2 66" stroke="url(#la-skin)" strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.8" />
      <circle cx="260" cy="100" r="15" fill="none" stroke="#ff5c7a" strokeWidth="2.5" />
      <path d="M244 30l14 14m0-14-14 14" stroke="#ff5c7a" strokeWidth="3" strokeLinecap="round" />
      <text x="208" y="62" className="la-label">Too far: buzzes</text>
    </g>
  ),
  'tab-reading': (
    <g>
      {strings6(60, 330, 40, 22)}
      {['e', 'B', 'G', 'D', 'A', 'E'].map((n, i) => (
        <text key={n + i} x="44" y={44 + i * 22} textAnchor="middle" className="la-label" fill={STRING_COLORS[(i + 1) as 1]}>
          {n}
        </text>
      ))}
      {[
        [110, 6, '0'],
        [160, 6, '3'],
        [210, 5, '2'],
        [260, 4, '0'],
        [300, 1, '5'],
      ].map(([x, s, f]) => (
        <g key={String(x)}>
          <circle cx={x as number} cy={40 + ((s as number) - 1) * 22} r="10" fill={STRING_COLORS[s as 1]} stroke="#120f16" strokeWidth="1.5" />
          <text x={x as number} y={44.5 + ((s as number) - 1) * 22} textAnchor="middle" className="la-num">
            {f}
          </text>
        </g>
      ))}
      <text x="110" y="188" textAnchor="middle" className="la-label">0 = open string</text>
      <text x="168" y="168" textAnchor="start" className="la-label">3 = press the 3rd fret</text>
      <text x="336" y="26" textAnchor="end" className="la-label">thin string on top</text>
      <text x="336" y="196" textAnchor="end" className="la-label faint">thick string at the bottom</text>
      <path d="M100 18h220" stroke="#ffd166" strokeWidth="2" markerEnd="url(#la-arrow)" />
      <text x="96" y="22" textAnchor="end" className="la-label">time</text>
    </g>
  ),
  'palm-mute': (
    <g>
      <rect x="0" y="110" width="360" height="90" fill="url(#la-body)" opacity="0.9" />
      <rect x="196" y="96" width="70" height="18" rx="3" fill="#cfc8bd" />
      <rect x="276" y="98" width="20" height="14" rx="2" fill="#8d877f" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="0" x2="300" y1={98 + i * 3} y2={98 + i * 3} stroke="#efe8dd" strokeWidth={0.7 + i * 0.2} />
      ))}
      {/* hand side */}
      <path d="M120 96c30-20 70-30 110-24 14 2 20 10 18 22l-4 8c-30-4-70 0-110 6z" fill="url(#la-skin)" stroke="#9a6648" strokeWidth="2" />
      <path d="M150 76c10-26 30-40 50-42" stroke="url(#la-skin)" strokeWidth="22" strokeLinecap="round" fill="none" />
      <circle cx="226" cy="98" r="18" fill="none" stroke="#ffd166" strokeWidth="2" strokeDasharray="4 3" />
      <text x="236" y="150" className="la-label">Edge of your palm rests</text>
      <text x="236" y="166" className="la-label">on the strings, right by the bridge</text>
      <text x="20" y="40" className="la-label">Too far forward = dead thud.</text>
      <text x="20" y="56" className="la-label">Too far back = no mute.</text>
    </g>
  ),
  'string-names': (
    <g>
      {[
        [1, 'e', 'high e'],
        [2, 'B', ''],
        [3, 'G', ''],
        [4, 'D', ''],
        [5, 'A', ''],
        [6, 'E', 'low E'],
      ].map(([s, n, extra]) => {
        const y = 30 + ((s as number) - 1) * 28;
        return (
          <g key={String(s)}>
            <line x1="90" x2="330" y1={y} y2={y} stroke={STRING_COLORS[s as 1]} strokeWidth={1 + (s as number) * 0.6} />
            <circle cx="60" cy={y} r="13" fill="#17131c" stroke={STRING_COLORS[s as 1]} strokeWidth="2" />
            <text x="60" y={y + 5} textAnchor="middle" className="la-num" fill={STRING_COLORS[s as 1]}>
              {n as string}
            </text>
            <text x="22" y={y + 5} textAnchor="middle" className="la-label faint">
              {s as number}
            </text>
            {extra && (
              <text x="336" y={y + 5} textAnchor="end" className="la-label" dy={-10}>
                {extra as string}
              </text>
            )}
          </g>
        );
      })}
    </g>
  ),
  strum: (
    <g>
      {strings6(40, 320, 40, 16, 0.7)}
      <path d="M110 22v110" stroke="#ff6a2b" strokeWidth="6" strokeLinecap="round" markerEnd="url(#la-arrow)" />
      <path d="M200 140V30" stroke="#5cc8ff" strokeWidth="6" strokeLinecap="round" markerEnd="url(#la-arrow)" />
      <text x="110" y="168" textAnchor="middle" className="la-big">
        DOWN
      </text>
      <text x="110" y="186" textAnchor="middle" className="la-label faint">
        thick → thin, on the beat
      </text>
      <text x="200" y="168" textAnchor="middle" className="la-big">
        UP
      </text>
      <text x="200" y="186" textAnchor="middle" className="la-label faint">
        thin → thick, on the "&"
      </text>
      <text x="290" y="100" textAnchor="middle" className="la-label">
        Keep the arm
      </text>
      <text x="290" y="116" textAnchor="middle" className="la-label">
        swinging
      </text>
    </g>
  ),
  bend: (
    <g>
      <rect x="20" y="40" width="320" height="120" rx="6" fill="url(#la-neck)" />
      {[80, 180, 280].map((x) => (
        <rect key={x} x={x} y="38" width="5" height="124" rx="2" fill="#cfc8bd" />
      ))}
      {[1, 2, 4, 5, 6].map((s) => (
        <line key={s} x1="20" x2="340" y1={50 + (s - 1) * 20} y2={50 + (s - 1) * 20} stroke={STRING_COLORS[s as 1]} strokeWidth={0.8 + s * 0.35} opacity="0.6" />
      ))}
      <path d="M20 90H180q50 0 60 -34 10 34 100 34" stroke={STRING_COLORS[3]} strokeWidth="2.6" fill="none" />
      <circle cx="240" cy="62" r="11" fill="url(#la-skin)" stroke="#9a6648" strokeWidth="1.5" />
      <path d="M240 112V70" stroke="#ffd166" strokeWidth="3" markerEnd="url(#la-arrow)" />
      <text x="252" y="128" className="la-label">Push the string up</text>
      <text x="252" y="144" className="la-label">until it sounds a step higher</text>
      <text x="30" y="186" className="la-label faint">Use 2–3 fingers together for strength</text>
    </g>
  ),
  'drop-d': (
    <g>
      <path d="M60 70h200c20 0 28 10 28 30s-8 30-28 30H60z" fill="#2a1b15" stroke="#140c09" strokeWidth="2" />
      {[100, 150, 200].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="60" r="12" fill="#c9c2b8" stroke="#3a3530" />
          <circle cx={x} cy="140" r="12" fill={i === 0 ? '#ff4d4d' : '#c9c2b8'} stroke="#3a3530" />
        </g>
      ))}
      <path d="M78 160a26 26 0 1 0 44 0" stroke="#ffd166" strokeWidth="3" fill="none" markerEnd="url(#la-arrow)" />
      <text x="100" y="196" textAnchor="middle" className="la-label">
        Low E peg: loosen a whole step
      </text>
      <text x="230" y="40" className="la-big">
        E → D
      </text>
      <text x="230" y="176" className="la-label faint">
        Check it with the tuner
      </text>
    </g>
  ),
};
