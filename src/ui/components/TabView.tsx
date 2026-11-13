import { useMemo } from 'react';
import { parseTab, type TabEvent } from '../../music/tab';
import type { TuningId } from '../../music/notes';
import { stringLabel, type StringNumber } from '../../music/notes';
import { STRING_COLORS } from '../theme';

/** Classic six-line tab, drawn from the same tab language the lessons are written in. */
export function TabView({ tab, tuning = 'standard', barsPerRow = 4, maxBars = 8 }: { tab: string; tuning?: TuningId; barsPerRow?: number; maxBars?: number }) {
  const parsed = useMemo(() => {
    try {
      return parseTab(tab, { tuning, strictBars: false });
    } catch {
      return null;
    }
  }, [tab, tuning]);
  if (!parsed) return null;
  const bars = Math.min(maxBars, Math.ceil(parsed.beats / 4));
  const rows = Math.ceil(bars / barsPerRow);
  const barW = 150;
  const labelW = 22;
  const rowH = 132;
  const W = labelW + barsPerRow * barW + 6;
  const H = rows * rowH;
  const lineGap = 16;
  const unit = barW / 4;

  return (
    <svg className="tabview" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Tab">
      {Array.from({ length: rows }, (_, row) => {
        const y0 = row * rowH + 30;
        const barsHere = Math.min(barsPerRow, bars - row * barsPerRow);
        const x1 = labelW + barsHere * barW;
        return (
          <g key={row}>
            {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((s) => (
              <g key={s}>
                <line x1={labelW} x2={x1} y1={y0 + (s - 1) * lineGap} y2={y0 + (s - 1) * lineGap} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
                <text x={labelW - 8} y={y0 + (s - 1) * lineGap + 4} textAnchor="middle" className="tab-label" fill={STRING_COLORS[s]}>
                  {stringLabel(tuning, s)}
                </text>
              </g>
            ))}
            {Array.from({ length: barsHere + 1 }, (_, b) => (
              <line key={b} x1={labelW + b * barW} x2={labelW + b * barW} y1={y0} y2={y0 + 5 * lineGap} stroke="rgba(255,255,255,0.4)" strokeWidth={1.4} />
            ))}
          </g>
        );
      })}
      {parsed.events.map((e, i) => {
        const bar = Math.floor(e.beat / 4 + 1e-6);
        if (bar >= bars) return null;
        const row = Math.floor(bar / barsPerRow);
        const x = labelW + (bar % barsPerRow) * barW + (e.beat - bar * 4) * unit + unit * 0.42;
        const y0 = row * rowH + 30;
        return <TabEventMark key={i} e={e} x={x} y0={y0} gap={lineGap} />;
      })}
    </svg>
  );
}

function TabEventMark({ e, x, y0, gap }: { e: TabEvent; x: number; y0: number; gap: number }) {
  if (e.kind === 'rest') return null;
  if (e.kind === 'mute') {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <text key={i} x={x} y={y0 + i * gap + 4} textAnchor="middle" className="tab-num muted-x">
            x
          </text>
        ))}
      </g>
    );
  }
  const top = Math.min(...e.notes.map((n) => n.string));
  return (
    <g>
      {e.notes.map((n) => {
        const y = y0 + (n.string - 1) * gap;
        const label = String(n.fret);
        const w = label.length * 8 + 6;
        return (
          <g key={n.string}>
            <rect x={x - w / 2} y={y - 7} width={w} height={14} fill="#17131c" />
            <text x={x} y={y + 4.5} textAnchor="middle" className="tab-num" fill={STRING_COLORS[n.string]}>
              {label}
            </text>
          </g>
        );
      })}
      {(e.pm || e.legato || e.bend || e.name) && (
        <text x={x} y={y0 + (top - 1) * gap - 9} textAnchor="middle" className="tab-tech">
          {e.name && e.kind === 'chord' ? e.name : e.pm ? 'PM' : e.legato === 'hammer' ? 'h' : e.legato === 'pull' ? 'p' : e.legato === 'slide' ? '/' : e.bend ? (e.bend === 2 ? 'full' : '½') : ''}
        </text>
      )}
    </g>
  );
}
