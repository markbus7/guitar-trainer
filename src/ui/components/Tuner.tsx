import { useEffect, useRef, useState } from 'react';
import { getEngine } from '../../audio/engine';
import { mic } from '../../audio/mic';
import { TUNINGS, freqToMidi, noteName, stringLabel, type StringNumber, type TuningId } from '../../music/notes';
import { useMicEvents, useMicStatus } from '../hooks';
import { STRING_COLORS } from '../theme';
import { Icon } from './Icon';
import { MicPanel } from './MicPanel';

const STRINGS: StringNumber[] = [6, 5, 4, 3, 2, 1];

interface Reading {
  cents: number;
  string: StringNumber;
  heard: string;
  at: number;
}

/**
 * Chromatic guitar tuner. Picks the closest string automatically, or the one you tap.
 * A string counts as tuned after staying within ±5 cents for a moment.
 */
export function Tuner({ tuning: tuningId = 'standard', onAllTuned, compact = false }: { tuning?: TuningId; onAllTuned?: () => void; compact?: boolean }) {
  const tuning = TUNINGS[tuningId];
  const [locked, setLocked] = useState<StringNumber | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [tuned, setTuned] = useState<Set<StringNumber>>(new Set());
  const smooth = useRef<number | null>(null);
  const inTuneSince = useRef<number | null>(null);
  const lastString = useRef<StringNumber | null>(null);
  const { status } = useMicStatus();
  const [, force] = useState(0);

  useEffect(() => {
    mic.configure({ minFreq: 55, emitPitch: true });
  }, []);

  // Let the display fade back to idle when nothing is heard.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  useMicEvents((events) => {
    const engine = getEngine();
    for (const e of events) {
      if (e.type !== 'pitch' || e.freq <= 0 || e.clarity < 0.85) continue;
      if (engine.previewPlaying()) continue;
      const m = freqToMidi(e.freq);
      let s: StringNumber = locked ?? 6;
      if (!locked) {
        let best = Infinity;
        for (const st of STRINGS) {
          const d = Math.abs(m - tuning.open[st]);
          if (d < best) {
            best = d;
            s = st;
          }
        }
        if (best > 3.5) continue; // not near any string
      }
      const target = tuning.open[s];
      const cents = (m - target) * 100;
      if (Math.abs(cents) > 600) continue;
      if (lastString.current !== s) smooth.current = null;
      lastString.current = s;
      smooth.current = smooth.current === null ? cents : smooth.current + 0.3 * (cents - smooth.current);
      const now = performance.now();
      setReading({ cents: smooth.current, string: s, heard: noteName(Math.round(m), { octave: false }), at: now });
      if (Math.abs(smooth.current) < 5) {
        if (inTuneSince.current === null) inTuneSince.current = now;
        else if (now - inTuneSince.current > 650) {
          setTuned((prev) => {
            if (prev.has(s)) return prev;
            const next = new Set(prev);
            next.add(s);
            if (next.size === 6) onAllTuned?.();
            return next;
          });
        }
      } else inTuneSince.current = null;
    }
  });

  const fresh = reading && performance.now() - reading.at < 900;
  const cents = fresh ? Math.max(-50, Math.min(50, reading!.cents)) : 0;
  const inTune = fresh && Math.abs(reading!.cents) < 5;
  const current = fresh ? reading!.string : locked;
  const angle = (cents / 50) * 60;
  const color = !fresh ? 'var(--text-3)' : inTune ? 'var(--ok)' : Math.abs(reading!.cents) < 15 ? 'var(--gold)' : 'var(--danger)';

  const playRef = (s: StringNumber) => {
    setLocked((cur) => (cur === s ? null : s));
    getEngine().previewNote(tuning.open[s], 2.2);
  };

  return (
    <div className={`tuner ${compact ? 'compact' : ''}`}>
      {status !== 'running' && <MicPanel prompt="Allow the microphone and pluck a string to tune it." />}
      <div className="tuner-gauge">
        <svg viewBox="0 0 300 170" aria-hidden="true">
          <defs>
            <linearGradient id="tg" x1="0" x2="1">
              <stop offset="0" stopColor="#ff5c7a" />
              <stop offset="0.4" stopColor="#ffd166" />
              <stop offset="0.5" stopColor="#4be3a4" />
              <stop offset="0.6" stopColor="#ffd166" />
              <stop offset="1" stopColor="#ff5c7a" />
            </linearGradient>
          </defs>
          <path d="M30 150a120 120 0 0 1 240 0" fill="none" stroke="url(#tg)" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
          {Array.from({ length: 21 }, (_, i) => {
            const a = ((i - 10) / 10) * 60 * (Math.PI / 180);
            const r1 = 104;
            const r2 = i % 5 === 0 ? 90 : 96;
            return <line key={i} x1={150 + Math.sin(a) * r1} y1={150 - Math.cos(a) * r1} x2={150 + Math.sin(a) * r2} y2={150 - Math.cos(a) * r2} stroke="rgba(255,255,255,0.35)" strokeWidth={i === 10 ? 3 : 1.5} />;
          })}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '150px 150px', transition: 'transform 0.12s linear' }}>
            <line x1="150" y1="150" x2="150" y2="44" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <circle cx="150" cy="150" r="9" fill={color} />
          </g>
          <text x="40" y="168" className="tg-side">♭ flat</text>
          <text x="260" y="168" textAnchor="end" className="tg-side">sharp ♯</text>
        </svg>
        <div className="tuner-readout">
          <span className="tuner-note" style={{ color }}>
            {current ? stringLabel(tuning, current) : '–'}
          </span>
          <span className="tuner-hint">
            {!fresh
              ? 'Pluck a string'
              : inTune
                ? 'In tune!'
                : reading!.cents < 0
                  ? `${Math.round(-reading!.cents)} cents flat: tighten`
                  : `${Math.round(reading!.cents)} cents sharp: loosen`}
          </span>
          {fresh && !inTune && <span className="faint tuner-heard">hearing {reading!.heard}</span>}
        </div>
      </div>
      <div className="tuner-strings" role="group" aria-label="Strings">
        {STRINGS.map((s) => (
          <button
            key={s}
            className={`tuner-string ${current === s ? 'active' : ''} ${tuned.has(s) ? 'done' : ''} ${locked === s ? 'locked' : ''}`}
            style={{ '--sc': STRING_COLORS[s] } as React.CSSProperties}
            onClick={() => playRef(s)}
            title="Play a reference tone and lock the tuner to this string"
          >
            <span className="ts-name">{stringLabel(tuning, s)}</span>
            <span className="ts-num">{tuned.has(s) ? <Icon name="check" width={14} height={14} /> : s}</span>
          </button>
        ))}
      </div>
      {!compact && (
        <p className="faint tuner-foot">
          {locked ? `Locked to string ${locked}. Tap it again for automatic.` : 'Automatic: picks the nearest string. Tap a string to hear it and lock to it.'}
        </p>
      )}
    </div>
  );
}
