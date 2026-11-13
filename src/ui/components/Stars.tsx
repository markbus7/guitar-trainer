import { Icon } from './Icon';

export function Stars({ value, max = 3, size = 16, animate = false }: { value: number; max?: number; size?: number; animate?: boolean }) {
  return (
    <span className="stars" aria-label={`${value} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`star ${i < value ? 'on' : ''} ${animate && i < value ? 'pop' : ''}`}
          style={animate ? { animationDelay: `${0.35 + i * 0.28}s` } : undefined}
        >
          <Icon name="star" width={size} height={size} />
        </span>
      ))}
    </span>
  );
}

export function ProgressRing({ value, size = 56, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd166" />
            <stop offset="1" stopColor="#ff3d5a" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="ring-label">{children}</span>
    </span>
  );
}

export function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <span className="bar">
      <span style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, background: color }} />
    </span>
  );
}
