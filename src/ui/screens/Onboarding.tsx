import { useState } from 'react';
import { unlockAudio } from '../../audio/engine';
import { useSettings, type GuitarKind } from '../../state/settings';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Logo';
import { enableMic, LevelMeter } from '../components/MicPanel';
import { useMicStatus } from '../hooks';
import { useListenFor } from '../listen';
import { navigate } from '../router';

const GUITARS: { id: GuitarKind; title: string; text: string }[] = [
  { id: 'acoustic', title: 'Acoustic', text: 'Steel strings, no plug. The mic hears it great.' },
  { id: 'semi', title: 'Semi-acoustic', text: 'Hollow body with pickups. Play it unplugged or through an amp.' },
  { id: 'electric', title: 'Electric', text: 'Through an amp near the mic, or an audio interface.' },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const s = useSettings();
  const { status, error } = useMicStatus();
  const [heardPluck, setHeardPluck] = useState(false);
  useListenFor(step === 3 ? { kind: 'any' } : null, () => setHeardPluck(true));

  const finish = (lesson = 'garage-meet') => {
    s.set({ onboarded: true });
    navigate(`/lesson/${lesson}`, { replace: true });
  };

  const steps = [
    <div key="welcome" className="ob-step ob-welcome">
      <Logo size={64} />
      <h1>Forge your sound</h1>
      <p className="muted ob-lead">
        Learn guitar by playing real riffs: rock, pop-punk and metal. Fretforge listens through your microphone and tells you how you did, note by note.
      </p>
      <ul className="ob-points">
        <li>
          <Icon name="map" /> A tour of nine venues, from the garage to the main stage
        </li>
        <li>
          <Icon name="flame" /> 13 original songs and dozens of riffs
        </li>
        <li>
          <Icon name="hand" /> Practice mode waits for you, note by note
        </li>
      </ul>
      <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>
        Let’s go <Icon name="next" />
      </button>
    </div>,
    <div key="guitar" className="ob-step">
      <span className="eyebrow">1 of 3</span>
      <h2>What are you playing?</h2>
      <div className="ob-options">
        {GUITARS.map((g) => (
          <button key={g.id} className={`mode-card ${s.guitar === g.id ? 'on' : ''}`} onClick={() => s.set({ guitar: g.id })}>
            <Icon name="guitar" />
            <span>
              <strong>{g.title}</strong>
              <span className="faint">{g.text}</span>
            </span>
          </button>
        ))}
      </div>
      {s.guitar === 'semi' && <p className="note">Great choice for this game: unplugged it is loud enough for the mic, and later you can plug it in and hear it through the built-in amp simulator.</p>}
      <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
        Next <Icon name="next" />
      </button>
    </div>,
    <div key="output" className="ob-step">
      <span className="eyebrow">2 of 3</span>
      <h2>How will you hear the band?</h2>
      <div className="ob-options">
        {(
          [
            ['headphones', 'headphones', 'Headphones', 'Recommended. You get the full band and the mic only hears your guitar.'],
            ['speakers', 'speakers', 'Speakers', 'Works too. The band plays drums only so your guitar stays easy to hear.'],
          ] as ['headphones' | 'speakers', IconName, string, string][]
        ).map(([id, icon, title, text]) => (
          <button key={id} className={`mode-card ${s.output === id ? 'on' : ''}`} onClick={() => s.set({ output: id })}>
            <Icon name={icon} />
            <span>
              <strong>{title}</strong>
              <span className="faint">{text}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
        Next <Icon name="next" />
      </button>
    </div>,
    <div key="mic" className="ob-step">
      <span className="eyebrow">3 of 3</span>
      <h2>Let Fretforge hear you</h2>
      <p className="muted">Allow the microphone, then pluck any string. Your audio stays on this device.</p>
      {status !== 'running' ? (
        <>
          <button
            className="btn btn-primary btn-lg"
            onClick={async () => {
              await unlockAudio();
              await enableMic();
            }}
            disabled={status === 'requesting'}
          >
            <Icon name="mic" /> {status === 'requesting' ? 'Waiting…' : 'Allow microphone'}
          </button>
          {(status === 'denied' || status === 'error' || status === 'unavailable') && <p className="check-heard bad">{status === 'denied' ? 'Access was blocked. Allow it from the icon next to the address bar.' : error}</p>}
        </>
      ) : (
        <div className={`check card ${heardPluck ? 'passed' : ''}`}>
          <div className="check-head">
            <span className={`check-icon ${heardPluck ? 'ok' : ''}`}>
              <Icon name={heardPluck ? 'check' : 'ear'} />
            </span>
            <div>
              <strong>{heardPluck ? 'Loud and clear!' : 'Pluck any string…'}</strong>
              <span className="faint">{heardPluck ? 'You are ready to rock.' : 'Watch the meter move.'}</span>
            </div>
          </div>
          <LevelMeter />
        </div>
      )}
      <div className="ob-actions">
        <button className="btn btn-primary btn-lg" onClick={() => finish()} disabled={status === 'running' && !heardPluck}>
          Start lesson 1 <Icon name="next" />
        </button>
        <button className="btn btn-ghost" onClick={() => finish()}>
          {status === 'running' ? 'Skip' : 'Set up the mic later'}
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="onboarding">
      <div className="ob-card card rise" key={step}>
        {steps[step]}
      </div>
      {step > 0 && (
        <button className="btn btn-ghost ob-back" onClick={() => setStep((x) => x - 1)}>
          <Icon name="back" /> Back
        </button>
      )}
    </div>
  );
}
