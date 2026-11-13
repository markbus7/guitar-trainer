import type { Figure as FigureData } from '../../content/types';
import { CHORDS } from '../../music/chords';
import { LessonArt } from '../art/LessonArt';
import { ChordDiagram } from './ChordDiagram';
import { Fretboard } from './Fretboard';
import { TabView } from './TabView';
import { useSettings } from '../../state/settings';

export function Figure({ figure }: { figure: FigureData }) {
  const leftHanded = useSettings((s) => s.leftHanded);
  let body: React.ReactNode = null;
  let caption: string | undefined;
  switch (figure.type) {
    case 'chord':
      body = CHORDS[figure.chord] ? <ChordDiagram chord={CHORDS[figure.chord]} size={150} leftHanded={leftHanded} /> : null;
      break;
    case 'chords':
      body = (
        <div className="figure-chords">
          {figure.chords.map((c) => (CHORDS[c] ? <ChordDiagram key={c} chord={CHORDS[c]} size={120} leftHanded={leftHanded} /> : null))}
        </div>
      );
      break;
    case 'fretboard':
      body = <Fretboard marks={figure.marks} frets={figure.frets} leftHanded={leftHanded} height={150} />;
      caption = figure.caption;
      break;
    case 'tab':
      body = <TabView tab={figure.tab} tuning={figure.tuning} />;
      caption = figure.caption;
      break;
    case 'art':
      body = <LessonArt art={figure.art} />;
      caption = figure.caption;
      break;
  }
  return (
    <figure className={`figure figure-${figure.type}`}>
      <div className="figure-body">{body}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
