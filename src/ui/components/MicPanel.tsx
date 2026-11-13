import { mic } from '../../audio/mic';
import { unlockAudio } from '../../audio/engine';
import { useSettings } from '../../state/settings';
import { useMicLevel, useMicStatus } from '../hooks';
import { Icon } from './Icon';

export function LevelMeter({ compact = false }: { compact?: boolean }) {
  const { db, gateDb } = useMicLevel();
  const pct = (v: number) => Math.max(0, Math.min(100, ((v + 70) / 64) * 100));
  const hot = db > -8;
  return (
    <span className={`meter ${compact ? 'meter-compact' : ''}`} aria-label="Input level">
      <span className="meter-fill" style={{ width: `${pct(db)}%`, background: hot ? 'var(--danger)' : undefined }} />
      <span className="meter-gate" style={{ left: `${pct(gateDb)}%` }} />
    </span>
  );
}

export async function enableMic() {
  await unlockAudio();
  return mic.start(useSettings.getState().inputDeviceId);
}

/** Mic status with a one-tap "allow" button and a live level meter. */
export function MicPanel({ compact = false, prompt }: { compact?: boolean; prompt?: string }) {
  const { status, error, label } = useMicStatus();
  if (status === 'running') {
    return (
      <div className={`mic-panel ok ${compact ? 'compact' : ''}`}>
        <span className="mic-icon">
          <Icon name="mic" />
        </span>
        <span className="mic-text">
          <strong>Listening</strong>
          {!compact && <span className="faint">{label || 'Microphone'}</span>}
        </span>
        <LevelMeter compact={compact} />
      </div>
    );
  }
  const failed = status === 'denied' || status === 'unavailable' || status === 'error';
  return (
    <div className={`mic-panel ${failed ? 'bad' : ''} ${compact ? 'compact' : ''}`}>
      <span className="mic-icon">
        <Icon name={failed ? 'micOff' : 'mic'} />
      </span>
      <span className="mic-text">
        <strong>{failed ? 'Microphone unavailable' : status === 'requesting' ? 'Waiting for permission…' : 'Fretforge needs to hear you'}</strong>
        <span className="faint">
          {failed
            ? status === 'denied'
              ? 'Allow the microphone in your browser’s site settings (the icon next to the address), then try again.'
              : error
            : prompt ?? 'Your guitar is heard through the microphone. Nothing is recorded or uploaded.'}
        </span>
      </span>
      <button className="btn btn-primary btn-sm" onClick={() => void enableMic()} disabled={status === 'requesting'}>
        {failed ? 'Try again' : 'Allow mic'}
      </button>
    </div>
  );
}
