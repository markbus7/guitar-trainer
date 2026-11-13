import { useEffect, useMemo, useState } from 'react';
import type { GrooveId, ToneId } from '../../content/types';
import { importTabText, type ChordVoicing, type StrumStyle } from '../../music/import';
import { TUNINGS, type TuningId } from '../../music/notes';
import { useMyTabs, type TabDraft } from '../../state/mytabs';
import { Icon } from '../components/Icon';
import { TabView } from '../components/TabView';
import { goBack, navigate } from '../router';
import { TONE_LABEL } from './labels';

const DRUMS: [GrooveId, string][] = [
  ['click', 'Click only'],
  ['rock', 'Rock beat'],
  ['drive', 'Driving rock'],
  ['punk', 'Punk'],
  ['skate', 'Pop-punk'],
  ['metal', 'Metal'],
  ['ballad', 'Ballad'],
  ['none', 'No drums'],
];

const EXAMPLE = `Example riff (written for Fretforge)
Tuning: Standard

[Intro]
   PM------------      PM------------
e|-----------------|-----------------|
B|-----------------|-----------------|
G|-----------------|-----------------|
D|-----------------|-------------2---|
A|-------------5---|-------------0---|
E|-0-0-0-0-0-0-3---|-0-0-0-0-0-0-----|

[Chorus]
e|-----------------|-----------------|
B|-----------------|-----------------|
G|-----------------|-----------------|
D|-----------------|---------2---2---|
A|-2---2---5---5---|-2---2---0---0---|
E|-0---0---3---3---|-0---0-----------|  x2
`;

export function ImportTabScreen({ editId }: { editId?: string }) {
  const existing = useMyTabs((s) => (editId ? s.tabs[editId] : undefined));
  const save = useMyTabs((s) => s.save);
  const [source, setSource] = useState(existing?.source ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [artist, setArtist] = useState(existing?.artist ?? '');
  const [bpm, setBpm] = useState(existing?.bpm ?? 100);
  const [tuning, setTuning] = useState<TuningId>(existing?.tuning ?? 'standard');
  const [tuningTouched, setTuningTouched] = useState(!!existing);
  const [tone, setTone] = useState<ToneId>(existing?.tone ?? 'crunch');
  const [drums, setDrums] = useState<GrooveId>(existing?.drums ?? 'rock');
  const [strum, setStrum] = useState<StrumStyle>(existing?.strum ?? 'quarters');
  const [voicing, setVoicing] = useState<ChordVoicing>(existing?.voicing ?? 'open');
  const [bpmTouched, setBpmTouched] = useState(!!existing);

  const result = useMemo(() => importTabText(source, { tuning, strum, voicing }), [source, tuning, strum, voicing]);

  // Take the tuning and tempo the tab mentions, until the player picks their own.
  useEffect(() => {
    if (!tuningTouched && result.tuning && result.tuning !== tuning) setTuning(result.tuning);
    if (!bpmTouched && result.bpm && result.bpm !== bpm) setBpm(result.bpm);
  }, [result.tuning, result.bpm, tuningTouched, bpmTouched, tuning, bpm]);

  if (editId && !existing) {
    return (
      <div className="page empty">
        <h2>Tab not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/songs?tab=mine')}>
          Back to My tabs
        </button>
      </div>
    );
  }

  const canSave = result.sections.length > 0 && source.trim().length > 0;
  const onSave = () => {
    const draft: TabDraft = { title: title.trim() || 'Untitled tab', artist: artist.trim() || undefined, source, bpm, tuning, tone, drums, strum, voicing };
    const id = save(draft, editId);
    navigate(`/lesson/${id}`, { replace: true });
  };
  const preview = result.sections[0];

  return (
    <div className="page import-tab">
      <header className="import-head">
        <button className="btn btn-icon btn-ghost" onClick={() => goBack('/songs?tab=mine')} aria-label="Back">
          <Icon name="back" />
        </button>
        <div>
          <span className="eyebrow">My tabs</span>
          <h1>{editId ? 'Edit tab' : 'Add a tab'}</h1>
        </div>
      </header>

      <div className="import-grid">
        <section className="card import-main">
          <div className="field">
            <label htmlFor="tab-source">Paste the tab or chord sheet</label>
            <textarea
              id="tab-source"
              className="tab-input"
              spellCheck={false}
              placeholder={'e|-----------------|\nB|-----------------|\nG|-----------------|\nD|-----------------|\nA|-------------3---|\nE|-0-0-0-0-0-0-3---|\n\nor chords:  G  D  Em  C'}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <span className="faint small">
              Six lines of tab with the thin high e on top, like you find on most tab sites. Lines of chord names work too.{' '}
              {!source && (
                <button className="link-btn" onClick={() => setSource(EXAMPLE)}>
                  Try an example
                </button>
              )}
            </span>
          </div>

          <div className="import-fields">
            <div className="field">
              <label htmlFor="tab-title">Song title</label>
              <input id="tab-title" type="text" value={title} placeholder="Untitled tab" onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="tab-artist">Artist</label>
              <input id="tab-artist" type="text" value={artist} placeholder="Optional" onChange={(e) => setArtist(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="tab-bpm">
                Tempo <span className="faint">{bpm} bpm</span>
              </label>
              <input
                id="tab-bpm"
                type="range"
                min={50}
                max={220}
                step={2}
                value={bpm}
                style={{ '--pct': `${((bpm - 50) / 170) * 100}%` } as React.CSSProperties}
                onChange={(e) => (setBpm(Number(e.target.value)), setBpmTouched(true))}
              />
            </div>
            <div className="field">
              <label htmlFor="tab-tuning">Tuning</label>
              <select id="tab-tuning" value={tuning} onChange={(e) => (setTuning(e.target.value as TuningId), setTuningTouched(true))}>
                {Object.values(TUNINGS).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tab-tone">Guitar sound</label>
              <select id="tab-tone" value={tone} onChange={(e) => setTone(e.target.value as ToneId)}>
                {(Object.keys(TONE_LABEL) as ToneId[]).map((t) => (
                  <option key={t} value={t}>
                    {TONE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tab-drums">Drums</label>
              <select id="tab-drums" value={drums} onChange={(e) => setDrums(e.target.value as GrooveId)}>
                {DRUMS.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {result.kind === 'chords' && (
              <>
                <div className="field">
                  <span className="label">Strumming</span>
                  <div className="segmented">
                    {(
                      [
                        ['quarters', 'Quarter notes'],
                        ['eighths', 'Eighth notes'],
                        ['campfire', 'Campfire strum'],
                      ] as [StrumStyle, string][]
                    ).map(([id, label]) => (
                      <button key={id} aria-pressed={strum === id} onClick={() => setStrum(id)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="label">Chords</span>
                  <div className="segmented">
                    <button aria-pressed={voicing === 'open'} onClick={() => setVoicing('open')}>
                      As written
                    </button>
                    <button aria-pressed={voicing === 'power'} onClick={() => setVoicing('power')}>
                      Power chords
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="card import-side">
          <h3>Preview</h3>
          {result.kind === 'none' ? (
            <p className="muted">{source.trim() ? 'No tab found yet.' : 'Paste a tab and it shows up here.'}</p>
          ) : (
            <>
              <div className="chapter-stats">
                <span className="chip chip-accent">{result.kind === 'chords' ? 'Chord sheet' : 'Tab'}</span>
                <span className="chip">{result.bars} bars</span>
                <span className="chip">
                  {result.events} {result.kind === 'chords' ? 'strums' : 'notes'}
                </span>
                <span className="chip">{result.sections.length} parts</span>
              </div>
              {preview && (
                <div className="import-preview">
                  <span className="faint small">{preview.name ?? 'Start'}</span>
                  <TabView tab={preview.tab} tuning={tuning} maxBars={4} barsPerRow={2} />
                </div>
              )}
            </>
          )}
          {result.warnings.length > 0 && source.trim() && (
            <ul className="import-warnings">
              {result.warnings.map((w) => (
                <li key={w}>
                  <Icon name="info" width={16} height={16} /> {w}
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-primary btn-lg btn-block" disabled={!canSave} onClick={onSave}>
            <Icon name="check" /> {editId ? 'Save changes' : 'Save and play'}
          </button>
          <p className="faint small">Saved in this browser only, unless you turn on sync in Settings.</p>
        </aside>
      </div>
    </div>
  );
}
