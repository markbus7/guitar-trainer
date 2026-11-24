import { useEffect, useRef, useState } from 'react';
import { unlockAudio } from '../../audio/engine';
import { Metronome, tapTempo, type MetronomeOptions, type Subdivision } from '../../audio/metronome';
import { useProgress } from '../../state/progress';
import { Icon } from '../components/Icon';
import { goBack } from '../router';

const KEY = 'fretforge.metronome.v1';
const DEFAULTS: MetronomeOptions = {
  bpm: 80,
  beatsPerBar: 4,
  subdivision: 1,
  accent: true,
  trainer: { enabled: false, step: 4, everyBars: 4, target: 120 },
};

function load(): MetronomeOptions {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<MetronomeOptions>;
    return { ...DEFAULTS, ...p, trainer: { ...DEFAULTS.trainer, ...(p.trainer ?? {}) } };
  } catch {
    return DEFAULTS;
  }
}

function save(o: MetronomeOptions) {
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* private mode: fine */
  }
}

const SUBDIVISIONS: { id: Subdivision; label: string; hint: string }[] = [
  { id: 1, label: '♩', hint: 'Quarter notes' },
  { id: 2, label: '♫', hint: 'Eighth notes' },
  { id: 3, label: '3', hint: 'Triplets' },
  { id: 4, label: '♬', hint: 'Sixteenths' },
];

const PRESETS = [60, 80, 100, 120, 140, 160, 180];

function feel(bpm: number) {
  if (bpm < 70) return 'Ballad';
  if (bpm < 95) return 'Groove';
  if (bpm < 120) return 'Rock';
  if (bpm < 150) return 'Punk';
  if (bpm < 185) return 'Skate punk';
  return 'Thrash';
}

const clampBpm = (n: number) => Math.max(30, Math.min(260, Math.round(n)));

export function MetronomeScreen() {
  const [opts, setOpts] = useState<MetronomeOptions>(load);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState<{ beat: number; bar: number; bpm: number } | null>(null);
  const metro = useRef<Metronome | null>(null);
  const taps = useRef<number[]>([]);
  const startedAt = useRef(0);

  const patch = (p: Partial<MetronomeOptions>) => setOpts((o) => ({ ...o, ...p }));
  const patchTrainer = (p: Partial<MetronomeOptions['trainer']>) => setOpts((o) => ({ ...o, trainer: { ...o.trainer, ...p } }));

  useEffect(() => {
    save(opts);
    metro.current?.update(opts);
  }, [opts]);

  const stop = () => {
    if (!metro.current?.running) return;
    metro.current.stop();
    setRunning(false);
    setTick(null);
    const seconds = (performance.now() - startedAt.current) / 1000;
    // Practising to a click counts towards the daily goal.
    if (seconds >= 20) useProgress.getState().addTime(Math.round(seconds));
  };

  const toggle = async () => {
    if (metro.current?.running) {
      stop();
      return;
    }
    await unlockAudio();
    if (!metro.current) {
      metro.current = new Metronome(opts);
      metro.current.onTick = setTick;
    }
    metro.current.update(opts);
    metro.current.start();
    startedAt.current = performance.now();
    setRunning(true);
  };
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        void toggleRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stopRef.current();
    };
  }, []);

  const tap = () => {
    const now = performance.now();
    if (taps.current.length && now - taps.current[taps.current.length - 1] > 2000) taps.current = [];
    taps.current.push(now);
    const bpm = tapTempo(taps.current);
    if (bpm) patch({ bpm });
  };

  const shownBpm = running && tick ? tick.bpm : opts.bpm;
  const { trainer } = opts;

  return (
    <div className="page metronome-page">
      <header className="learn-top">
        <button className="btn btn-icon btn-ghost" onClick={() => goBack('/training')} aria-label="Back">
          <Icon name="back" />
        </button>
        <div>
          <span className="eyebrow">Training · Timing</span>
          <h2>Metronome</h2>
        </div>
      </header>

      <div className="metro-grid">
        <section className="card metro-main">
          <div className="metro-beats" aria-hidden="true">
            {Array.from({ length: opts.beatsPerBar }, (_, i) => (
              <span key={i} className={`metro-dot ${tick && running && tick.beat === i ? 'on' : ''} ${i === 0 && opts.accent ? 'accent' : ''}`} />
            ))}
          </div>
          <div className="metro-bpm">
            <button className="btn btn-icon" onClick={() => patch({ bpm: clampBpm(opts.bpm - 5) })} aria-label="5 slower">
              −5
            </button>
            <button className="btn btn-icon" onClick={() => patch({ bpm: clampBpm(opts.bpm - 1) })} aria-label="1 slower">
              <Icon name="minus" />
            </button>
            <div className="metro-number">
              <strong>{shownBpm}</strong>
              <span className="faint">bpm · {feel(shownBpm)}</span>
            </div>
            <button className="btn btn-icon" onClick={() => patch({ bpm: clampBpm(opts.bpm + 1) })} aria-label="1 faster">
              <Icon name="plus" />
            </button>
            <button className="btn btn-icon" onClick={() => patch({ bpm: clampBpm(opts.bpm + 5) })} aria-label="5 faster">
              +5
            </button>
          </div>
          <input
            className="metro-slider"
            type="range"
            min={30}
            max={260}
            value={opts.bpm}
            onChange={(e) => patch({ bpm: Number(e.target.value) })}
            aria-label="Tempo"
            style={{ '--pct': `${((opts.bpm - 30) / 230) * 100}%` } as React.CSSProperties}
          />
          <div className="metro-presets">
            {PRESETS.map((b) => (
              <button key={b} className={`chip ${opts.bpm === b ? 'chip-accent' : ''}`} onClick={() => patch({ bpm: b })}>
                {b}
              </button>
            ))}
          </div>
          <div className="metro-actions">
            <button className={`btn btn-lg ${running ? '' : 'btn-primary'} metro-go`} onClick={() => void toggle()}>
              <Icon name={running ? 'pause' : 'play'} /> {running ? 'Stop' : 'Start'}
            </button>
            <button className="btn btn-lg" onClick={tap}>
              <Icon name="hand" /> Tap tempo
            </button>
          </div>
          <p className="faint small">Space starts and stops. Tap along to a song to find its tempo.</p>
        </section>

        <aside className="metro-side">
          <section className="card metro-opts">
            <div className="field">
              <span className="label">Beats per bar</span>
              <div className="segmented">
                {[2, 3, 4, 6].map((b) => (
                  <button key={b} aria-pressed={opts.beatsPerBar === b} onClick={() => patch({ beatsPerBar: b })}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="label">
                Clicks <span className="faint">{SUBDIVISIONS.find((s) => s.id === opts.subdivision)?.hint}</span>
              </span>
              <div className="segmented">
                {SUBDIVISIONS.map((s) => (
                  <button key={s.id} aria-pressed={opts.subdivision === s.id} onClick={() => patch({ subdivision: s.id })} title={s.hint}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="inline-toggle">
              <span>Accent the first beat</span>
              <button className="switch" role="switch" aria-checked={opts.accent} onClick={() => patch({ accent: !opts.accent })} />
            </label>
          </section>

          <section className="card metro-opts">
            <label className="inline-toggle">
              <span>
                <strong>Speed trainer</strong>
                <span className="faint small block">Speeds up by itself while you play. The fastest way to build speed that stays clean.</span>
              </span>
              <button className="switch" role="switch" aria-checked={trainer.enabled} onClick={() => patchTrainer({ enabled: !trainer.enabled })} />
            </label>
            {trainer.enabled && (
              <div className="metro-trainer">
                <Stepper label="Add" unit="bpm" value={trainer.step} min={1} max={20} onChange={(step) => patchTrainer({ step })} />
                <Stepper label="Every" unit="bars" value={trainer.everyBars} min={1} max={16} onChange={(everyBars) => patchTrainer({ everyBars })} />
                <Stepper label="Up to" unit="bpm" value={trainer.target} min={40} max={260} step={5} onChange={(target) => patchTrainer({ target })} />
                <p className="faint small">
                  {opts.bpm} → {trainer.target} bpm takes about {Math.ceil(Math.abs(trainer.target - opts.bpm) / trainer.step) * trainer.everyBars} bars.
                </p>
              </div>
            )}
          </section>

          <section className="card metro-opts tips-card">
            <h3>How to use it</h3>
            <ul>
              <li>Find the speed where a riff is clean, then go up 4–5 bpm at a time.</li>
              <li>Clean at 80 beats sloppy at 120. Speed follows accuracy.</li>
              <li>Pop-punk lives around 150–190 bpm, thrash goes past 180 with eighth notes. Start at half.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stepper({ label, unit, value, min, max, step = 1, onChange }: { label: string; unit: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <span className="faint">{label}</span>
      <button className="btn btn-icon btn-sm" onClick={() => onChange(Math.max(min, value - step))} aria-label={`Less ${label}`}>
        <Icon name="minus" width={16} height={16} />
      </button>
      <strong>
        {value} <small className="faint">{unit}</small>
      </strong>
      <button className="btn btn-icon btn-sm" onClick={() => onChange(Math.min(max, value + step))} aria-label={`More ${label}`}>
        <Icon name="plus" width={16} height={16} />
      </button>
    </div>
  );
}
