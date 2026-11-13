import { useEffect, useRef, useState } from 'react';
import { getEngine, hasEngine, unlockAudio } from '../../audio/engine';
import { mic } from '../../audio/mic';
import type { ToneId } from '../../content/types';
import { TONES } from '../../audio/synth/amp';
import type { TimingId } from '../../game/judge';
import { useProgress } from '../../state/progress';
import { useSettings, type Settings } from '../../state/settings';
import { Icon } from '../components/Icon';
import { enableMic, MicPanel } from '../components/MicPanel';
import { Modal } from '../components/Modal';
import { useMicEvents, useMicStatus } from '../hooks';
import { toast } from '../toasts';
import { connectGitHub, disconnectGitHub, syncNow, useSync } from '../../state/sync';
import { TOKEN_URL } from '../../sync/gist';

export function SettingsScreen() {
  const s = useSettings();
  const { status } = useMicStatus();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [calibrating, setCalibrating] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () => mic.devices().then((d) => alive && setDevices(d));
    void load();
    navigator.mediaDevices?.addEventListener?.('devicechange', load);
    return () => {
      alive = false;
      navigator.mediaDevices?.removeEventListener?.('devicechange', load);
    };
  }, [status]);

  const autoLatency = Math.round((getEngineSafe()?.outputLatency() ?? 0.02) * 1000 + mic.inputLatency() * 1000);

  return (
    <div className="page settings">
      <div className="page-head">
        <span className="eyebrow">Setup</span>
        <h1>Settings</h1>
      </div>

      <section className="card settings-section">
        <h3>
          <Icon name="headphones" /> Listening setup
        </h3>
        <Row label="I’m listening on" hint={s.output === 'headphones' ? 'Best: the full band plays and the mic only hears your guitar.' : 'On speakers the band plays drums only, so the mic is not confused by the backing.'}>
          <div className="segmented">
            <button aria-pressed={s.output === 'headphones'} onClick={() => s.set({ output: 'headphones' })}>
              Headphones
            </button>
            <button aria-pressed={s.output === 'speakers'} onClick={() => s.set({ output: 'speakers' })}>
              Speakers
            </button>
          </div>
        </Row>
        <Row label="Microphone" hint="A USB audio interface with your guitar plugged in gives the cleanest signal. The built-in mic works too.">
          <select
            value={s.inputDeviceId ?? ''}
            onChange={async (e) => {
              const id = e.target.value || undefined;
              s.set({ inputDeviceId: id });
              await unlockAudio();
              await mic.start(id);
            }}
          >
            <option value="">Default microphone</option>
            {devices
              .filter((d) => d.deviceId && d.deviceId !== 'default')
              .map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Input ${i + 1}`}
                </option>
              ))}
          </select>
        </Row>
        <MicPanel />
        <Row label="Sensitivity" hint="Raise it if quiet notes are missed, lower it in a noisy room.">
          <Slider
            value={s.sensitivity}
            min={0.2}
            max={1}
            step={0.05}
            onChange={(v) => {
              s.set({ sensitivity: v });
              mic.configure({ sensitivity: v });
            }}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </Row>
        <Row label="Timing offset" hint={s.latencyMs === null ? `Automatic (about ${autoLatency} ms). Calibrate for the tightest timing.` : 'Measured for your setup. Recalibrate if you change headphones or speakers.'}>
          <div className="row-actions">
            <span className="value">{s.latencyMs === null ? 'Auto' : `${s.latencyMs} ms`}</span>
            <button className="btn btn-sm btn-primary" onClick={() => setCalibrating(true)}>
              Calibrate
            </button>
            {s.latencyMs !== null && (
              <button className="btn btn-sm btn-ghost" onClick={() => s.set({ latencyMs: null })}>
                Auto
              </button>
            )}
          </div>
        </Row>
        {s.latencyMs !== null && (
          <Row label="Fine tune" hint="Notes judged late? Increase. Judged early? Decrease.">
            <Slider value={s.latencyMs} min={0} max={400} step={5} onChange={(v) => s.set({ latencyMs: v })} format={(v) => `${v} ms`} />
          </Row>
        )}
      </section>

      <section className="card settings-section">
        <h3>
          <Icon name="volume" /> Volume
        </h3>
        {(
          [
            ['master', 'Master'],
            ['guide', 'Guide guitar'],
            ['band', 'Band'],
            ['click', 'Metronome'],
          ] as [keyof Settings['volumes'], string][]
        ).map(([k, label]) => (
          <Row key={k} label={label} hint={k === 'guide' ? 'The guitar part played along with you (headphones only).' : undefined}>
            <Slider
              value={s.volumes[k]}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => {
                s.setVolume(k, v);
                getEngineSafe()?.setVolumes({ ...useSettings.getState().volumes });
              }}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Row>
        ))}
        <Row label="Metronome during songs">
          <Switch on={s.metronomeInSongs} onChange={(v) => s.set({ metronomeInSongs: v })} />
        </Row>
      </section>

      <section className="card settings-section">
        <h3>
          <Icon name="guitar" /> Hear yourself through an amp
        </h3>
        <p className="faint">
          Routes your input through the amp simulator into your headphones, so even a semi-acoustic can sound like a full stack. Works best with a guitar plugged into an audio interface. Headphones only, to avoid feedback.
        </p>
        <Row label="Amp monitor">
          <Switch on={s.monitor.enabled} disabled={s.output !== 'headphones'} onChange={(v) => s.set({ monitor: { ...s.monitor, enabled: v } })} />
        </Row>
        {s.monitor.enabled && (
          <>
            <Row label="Amp">
              <div className="segmented">
                {(Object.keys(TONES) as ToneId[]).map((t) => (
                  <button key={t} aria-pressed={s.monitor.tone === t} onClick={() => s.set({ monitor: { ...s.monitor, tone: t } })}>
                    {TONES[t].label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Monitor level">
              <Slider value={s.monitor.level} min={0} max={1} step={0.05} onChange={(v) => s.set({ monitor: { ...s.monitor, level: v } })} format={(v) => `${Math.round(v * 100)}%`} />
            </Row>
          </>
        )}
      </section>

      <section className="card settings-section">
        <h3>
          <Icon name="settings" /> Gameplay
        </h3>
        <Row label="Timing" hint="How close to the beat a note must be.">
          <div className="segmented">
            {(['relaxed', 'normal', 'strict'] as TimingId[]).map((t) => (
              <button key={t} aria-pressed={s.timing === t} onClick={() => s.set({ timing: t })}>
                {t}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Note speed">
          <div className="segmented">
            {(['slow', 'normal', 'fast'] as const).map((t) => (
              <button key={t} aria-pressed={s.noteSpeed === t} onClick={() => s.set({ noteSpeed: t })}>
                {t}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Show note names" hint="Adds the note name next to each fret number.">
          <Switch on={s.noteNames} onChange={(v) => s.set({ noteNames: v })} />
        </Row>
        <Row label="Left-handed" hint="Mirrors chord boxes and fretboards.">
          <Switch on={s.leftHanded} onChange={(v) => s.set({ leftHanded: v })} />
        </Row>
        <Row label="Reduce motion" hint="Fewer sparks and animations.">
          <Switch on={s.reducedMotion} onChange={(v) => s.set({ reducedMotion: v })} />
        </Row>
        <Row label="Daily goal">
          <div className="segmented">
            {[5, 10, 15, 20, 30].map((m) => (
              <button key={m} aria-pressed={s.dailyGoalMin === m} onClick={() => s.set({ dailyGoalMin: m })}>
                {m} min
              </button>
            ))}
          </div>
        </Row>
      </section>

      <SyncCard />

      <section className="card settings-section">
        <h3>
          <Icon name="map" /> Progress
        </h3>
        <Row label="Unlock everything" hint="Skip ahead if you already know the basics.">
          <Switch on={s.unlockAll} onChange={(v) => s.set({ unlockAll: v })} />
        </Row>
        <Row label="Start over" hint="Clears stars, XP and achievements on this device.">
          <button className="btn btn-sm" onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        </Row>
        <p className="faint small">
          Fretforge runs entirely in your browser. Your microphone audio is analysed on this device and never recorded or uploaded. Progress is saved in this browser, and in your own private gist if you turn on sync.
        </p>
      </section>

      {calibrating && <Calibration onClose={() => setCalibrating(false)} />}
      {confirmReset && (
        <Modal title="Reset all progress?" onClose={() => setConfirmReset(false)}>
          <p className="muted">Your stars, XP, streak and achievements on this device will be gone. Settings stay.</p>
          {useSync.getState().token && <p className="note">Sync is on, so your progress comes back from GitHub at the next sync. Disconnect sync first to really start over.</p>}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Keep it
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                useProgress.getState().resetProgress();
                setConfirmReset(false);
                toast({ title: 'Progress reset', body: 'Back to the garage. Let’s go!' });
              }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ago(t?: number) {
  if (!t) return 'never';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}

function SyncCard() {
  const sync = useSync();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      await connectGitHub(token);
      setToken('');
      toast({ title: 'Sync is on', body: 'Your progress and tabs are saved to a private gist.' });
    } catch {
      /* the error is shown in the card */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card settings-section sync-card">
      <h3>
        <Icon name="cloud" /> Sync across devices
      </h3>
      {sync.token ? (
        <>
          <div className="sync-status">
            <span className={`sync-dot ${sync.status}`} />
            <span>
              <strong>Connected as {sync.login ?? 'GitHub user'}</strong>
              <span className="faint">
                {sync.status === 'syncing' ? 'Syncing…' : sync.status === 'error' ? sync.error : `Last synced ${ago(sync.lastSync)}`}
              </span>
            </span>
          </div>
          <div className="sync-actions">
            <button className="btn btn-sm" disabled={sync.status === 'syncing'} onClick={() => void syncNow()}>
              <Icon name="refresh" /> Sync now
            </button>
            <button className="btn btn-sm btn-ghost" onClick={disconnectGitHub}>
              Disconnect
            </button>
          </div>
          <p className="faint small">
            Stars, XP, streak, achievements and your own tabs sync automatically. Settings stay per device. Disconnecting removes the token from this browser; the gist stays on your GitHub account.
          </p>
        </>
      ) : (
        <>
          <p className="muted">
            Play on your laptop and your phone with the same progress. Fretforge keeps a copy in a <strong>private gist</strong> on your own GitHub account.
          </p>
          <ol className="sync-steps">
            <li>
              <a href={TOKEN_URL} target="_blank" rel="noreferrer">
                Create a GitHub token
              </a>{' '}
              with only the <strong>gist</strong> box ticked, and copy it.
            </li>
            <li>Paste it below and connect. Do the same on your other devices.</li>
          </ol>
          <div className="sync-form">
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="ghp_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && token.trim() && void connect()}
              aria-label="GitHub token"
            />
            <button className="btn btn-primary" disabled={!token.trim() || busy} onClick={() => void connect()}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          </div>
          {sync.error && <p className="sync-error small">{sync.error}</p>}
          <p className="faint small">The token is stored only in this browser and is only ever sent to GitHub.</p>
        </>
      )}
    </section>
  );
}

function getEngineSafe() {
  return hasEngine() ? getEngine() : null;
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-label">
        <strong>{label}</strong>
        {hint && <span className="faint">{hint}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

export function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return <button className="switch" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} />;
}

export function Slider({ value, min, max, step, onChange, format }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <span className="slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ '--pct': `${pct}%` } as React.CSSProperties} />
      {format && <span className="value">{format(value)}</span>}
    </span>
  );
}

const CLICKS = 12;
const BPM = 90;

/** Play clicks and measure how late the mic hears plucks (or the clicks themselves). */
function Calibration({ onClose }: { onClose: () => void }) {
  const output = useSettings((s) => s.output);
  const [phase, setPhase] = useState<'intro' | 'running' | 'done' | 'failed'>('intro');
  const [beat, setBeat] = useState(-1);
  const [result, setResult] = useState<number | null>(null);
  const clicks = useRef<number[]>([]);
  const offsets = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMicEvents((events) => {
    if (phase !== 'running') return;
    for (const e of events) {
      if (e.type !== 'onset') continue;
      let best = Infinity;
      for (const c of clicks.current) {
        const d = e.t - c;
        if (d > -0.08 && d < 0.45 && Math.abs(d) < Math.abs(best)) best = d;
      }
      if (best !== Infinity) offsets.current.push(best);
    }
  });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = async () => {
    await unlockAudio();
    const ok = mic.running || (await enableMic());
    if (!ok) return;
    const engine = getEngine();
    const spb = 60 / BPM;
    const t0 = engine.ctx.currentTime + 0.8;
    clicks.current = Array.from({ length: CLICKS }, (_, i) => t0 + i * spb);
    offsets.current = [];
    clicks.current.forEach((t, i) => engine.playDrum(i % 4 === 0 ? 'clickAccent' : 'click', t, 1, engine.preview));
    setPhase('running');
    const startPerf = performance.now() + 800;
    const tick = () => {
      const b = Math.floor((performance.now() - startPerf) / (spb * 1000));
      setBeat(b);
      if (b < CLICKS + 1) timer.current = setTimeout(tick, 40);
      else finish();
    };
    tick();
  };

  const finish = () => {
    // Skip the first clicks while the player finds the beat.
    const vals = offsets.current.slice(2).sort((a, b) => a - b);
    if (vals.length < 5) {
      setPhase('failed');
      return;
    }
    const median = vals[Math.floor(vals.length / 2)];
    const ms = Math.max(0, Math.round(median * 1000));
    setResult(ms);
    setPhase('done');
  };

  return (
    <Modal title="Calibrate timing" onClose={onClose}>
      {phase === 'intro' && (
        <>
          <p className="muted">
            {output === 'speakers'
              ? 'Turn your speakers up a bit and stay quiet: Fretforge plays 12 clicks and listens to how long they take to come back through the mic.'
              : 'You will hear 12 clicks. Pluck a muted string exactly on every click. Fretforge measures the delay of your setup.'}
          </p>
          <MicPanel compact />
          <div className="modal-actions">
            <button className="btn btn-primary btn-lg" onClick={run}>
              <Icon name="metronome" /> Start
            </button>
          </div>
        </>
      )}
      {phase === 'running' && (
        <div className="calib-run">
          <div className="calib-beats">
            {Array.from({ length: CLICKS }, (_, i) => (
              <span key={i} className={`calib-beat ${i === beat ? 'on' : ''} ${i < beat ? 'past' : ''}`} />
            ))}
          </div>
          <p className="muted">{output === 'speakers' ? 'Listening…' : 'Pluck on every click!'}</p>
        </div>
      )}
      {phase === 'done' && result !== null && (
        <>
          <p className="calib-result">
            <strong>{result} ms</strong>
            <span className="faint">round-trip delay</span>
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setPhase('intro')}>
              Redo
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                useSettings.getState().set({ latencyMs: result });
                toast({ title: 'Timing calibrated', body: `${result} ms offset saved.` });
                onClose();
              }}
            >
              Save
            </button>
          </div>
        </>
      )}
      {phase === 'failed' && (
        <>
          <p className="muted">Not enough plucks were heard. Get a bit closer to the mic, raise the sensitivity, and try again.</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setPhase('intro')}>
              Try again
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
