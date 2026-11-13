import { useMemo, useState } from 'react';
import { getEngine, unlockAudio } from '../../audio/engine';
import { CHORD_LIST, chordMidis, shapeNotes, type ChordShape } from '../../music/chords';
import { TUNINGS, fretMidi, type TuningId } from '../../music/notes';
import { useSettings } from '../../state/settings';
import { ChordDiagram } from '../components/ChordDiagram';
import { Icon } from '../components/Icon';
import { MicPanel } from '../components/MicPanel';
import { Modal } from '../components/Modal';
import { Tuner } from '../components/Tuner';
import { useMicStatus } from '../hooks';
import { useListenFor } from '../listen';

export function TunerScreen() {
  const [tuning, setTuning] = useState<TuningId>('standard');
  return (
    <div className="page tuner-page">
      <div className="page-head">
        <span className="eyebrow">Tools</span>
        <h1>Tuner</h1>
        <p className="muted">{TUNINGS[tuning].description}</p>
      </div>
      <div className="segmented tuning-select">
        {(Object.keys(TUNINGS) as TuningId[]).map((t) => (
          <button key={t} aria-pressed={tuning === t} onClick={() => setTuning(t)}>
            {TUNINGS[t].name}
          </button>
        ))}
      </div>
      <div className="card tuner-card">
        <Tuner key={tuning} tuning={tuning} />
      </div>
      <div className="card tips-card">
        <h3>Tuning tips</h3>
        <ul>
          <li>Pluck one string and let it ring. The needle settles after a moment.</li>
          <li>Flat (left): tighten the peg. Sharp (right): loosen it a little past, then come back up.</li>
          <li>Tap a string button to hear its note and lock the tuner to it.</li>
          <li>A semi-acoustic drifts with temperature: tune at the start of every session.</li>
        </ul>
      </div>
    </div>
  );
}

const CATEGORIES: { id: ChordShape['category']; label: string; blurb: string }[] = [
  { id: 'open', label: 'Open chords', blurb: 'The campfire classics. Open strings ring out.' },
  { id: 'power', label: 'Power chords', blurb: 'Root and fifth. The engine of rock, punk and metal.' },
  { id: 'color', label: 'Colour chords', blurb: 'Sevenths, suspended and add9 shapes for extra flavour.' },
  { id: 'barre', label: 'Barre chords', blurb: 'Movable full chords. Tough at first, then unlimited.' },
];

export function ChordsScreen() {
  const [cat, setCat] = useState<ChordShape['category']>('open');
  const [open, setOpen] = useState<ChordShape | null>(null);
  const leftHanded = useSettings((s) => s.leftHanded);
  const list = CHORD_LIST.filter((c) => c.category === cat);
  const info = CATEGORIES.find((c) => c.id === cat)!;
  return (
    <div className="page chords-page">
      <div className="page-head">
        <span className="eyebrow">Tools</span>
        <h1>Chord library</h1>
        <p className="muted">{info.blurb}</p>
      </div>
      <div className="segmented">
        {CATEGORIES.map((c) => (
          <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="chord-grid">
        {list.map((c, i) => (
          <button key={c.id} className="chord-card card rise" style={{ animationDelay: `${i * 0.02}s` }} onClick={() => setOpen(c)}>
            <ChordDiagram chord={c} size={118} leftHanded={leftHanded} />
            <span className="chord-level">{'●'.repeat(c.level)}</span>
          </button>
        ))}
      </div>
      {open && <ChordModal chord={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ChordModal({ chord, onClose }: { chord: ChordShape; onClose: () => void }) {
  const leftHanded = useSettings((s) => s.leftHanded);
  const [testing, setTesting] = useState(false);
  const [wins, setWins] = useState(0);
  const { status } = useMicStatus();
  const notes = useMemo(() => shapeNotes(chord.frets), [chord]);
  const midis = useMemo(() => chordMidis(notes), [notes]);
  const heard = useListenFor(testing ? { kind: 'chord', midis, name: chord.name } : null, () => setWins((w) => w + 1));

  const hear = async () => {
    await unlockAudio();
    getEngine().previewChord(
      notes.map((n) => ({ midi: fretMidi('standard', n.string, n.fret), string: n.string })).sort((a, b) => b.string - a.string),
      2.2,
    );
  };

  return (
    <Modal title={chord.name} onClose={onClose}>
      <div className="chord-modal">
        <ChordDiagram chord={chord} size={200} leftHanded={leftHanded} showName={false} />
        <div className="chord-modal-side">
          {chord.tip && <p className="muted">{chord.tip}</p>}
          <p className="faint small">Numbers are fingers: 1 index, 2 middle, 3 ring, 4 pinky. ○ ring open, ✕ do not play.</p>
          <div className="modal-actions">
            <button className="btn" onClick={hear}>
              <Icon name="volume" /> Hear it
            </button>
            <button className={`btn ${testing ? '' : 'btn-primary'}`} onClick={() => setTesting((t) => !t)}>
              <Icon name="ear" /> {testing ? 'Stop' : 'Test me'}
            </button>
          </div>
          {testing && (
            <div className={`check card ${wins > 0 ? 'passed' : ''}`}>
              {status !== 'running' ? (
                <MicPanel compact />
              ) : (
                <>
                  <strong>{wins > 0 ? `Clean ${chord.name}! (${wins})` : `Strum ${chord.name}…`}</strong>
                  {heard.heard && heard.wrong && <span className="check-heard bad">That sounded like {heard.heard}. Check every string rings.</span>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
