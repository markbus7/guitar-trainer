import { describe, expect, it } from 'vitest';
import { EMPTY_PROGRESS, type ProgressData } from '../src/game/progression';
import { GIST_FILE, GistClient, GistError } from '../src/sync/gist';
import { isPayload, mergeProgress, mergeTabs, stableJson } from '../src/sync/merge';
import type { CustomTab } from '../src/state/mytabs';

const rec = (stars: number, extra: Partial<ProgressData['lessons'][string]> = {}) => ({
  stars,
  bestScore: stars * 1000,
  bestAccuracy: stars / 3,
  plays: stars,
  lastPlayed: stars * 10,
  bestTempo: 1,
  ...extra,
});

describe('merging progress', () => {
  const a: ProgressData = {
    ...EMPTY_PROGRESS,
    lessons: { x: rec(1), y: rec(3, { lastPlayed: 5 }) },
    xp: 500,
    days: { '2026-11-12': 600, '2026-11-13': 60 },
    achievements: { first: 100 },
    lastLessonId: 'y',
    bestStreak: 40,
    notesHit: 900,
  };
  const b: ProgressData = {
    ...EMPTY_PROGRESS,
    lessons: { x: rec(2, { bestAccuracy: 0.2 }), z: rec(1) },
    xp: 450,
    days: { '2026-11-13': 300 },
    achievements: { first: 50, other: 70 },
    lastLessonId: 'x',
    bestStreak: 55,
    notesHit: 1200,
  };

  it('keeps the best of both devices', () => {
    const m = mergeProgress(a, b);
    expect(Object.keys(m.lessons).sort()).toEqual(['x', 'y', 'z']);
    expect(m.lessons.x.stars).toBe(2);
    expect(m.lessons.x.bestAccuracy).toBeCloseTo(1 / 3);
    expect(m.xp).toBe(500);
    expect(m.days).toEqual({ '2026-11-12': 600, '2026-11-13': 300 });
    expect(m.achievements).toEqual({ first: 50, other: 70 });
    expect(m.lastLessonId).toBe('x');
    expect(m.bestStreak).toBe(55);
    expect(m.notesHit).toBe(1200);
  });

  it('is the same in both directions and safe to repeat', () => {
    const ab = mergeProgress(a, b);
    expect(stableJson(mergeProgress(b, a))).toBe(stableJson(ab));
    expect(stableJson(mergeProgress(ab, b))).toBe(stableJson(ab));
    expect(stableJson(mergeProgress(ab, ab))).toBe(stableJson(ab));
  });
});

describe('merging tabs', () => {
  const tab = (id: string, updatedAt: number, extra: Partial<CustomTab> = {}): CustomTab => ({
    id,
    title: id,
    source: 'e|-0-|',
    bpm: 100,
    tuning: 'standard',
    tone: 'crunch',
    drums: 'rock',
    createdAt: 1,
    updatedAt,
    ...extra,
  });

  it('takes the newest copy and keeps deletions', () => {
    const local = { a: tab('a', 5, { title: 'new' }), b: tab('b', 2) };
    const remote = { a: tab('a', 3, { title: 'old' }), b: tab('b', 4, { deleted: true }), c: tab('c', 1) };
    const m = mergeTabs(local, remote);
    expect(m.a.title).toBe('new');
    expect(m.b.deleted).toBe(true);
    expect(m.c).toBeDefined();
  });
});

describe('gist client', () => {
  function fake(routes: Record<string, (init?: RequestInit) => { status?: number; body: unknown }>) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const impl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      const key = `${init?.method ?? 'GET'} ${url.replace('https://api.github.com', '')}`;
      const route = routes[key];
      if (!route) return new Response('not found', { status: 404 });
      const r = route(init);
      return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
    }) as typeof fetch;
    return { impl, calls };
  }

  it('sends the token and finds the progress gist', async () => {
    const { impl, calls } = fake({
      'GET /gists?per_page=100&page=1': () => ({ body: [{ id: 'g1', files: { 'notes.md': {} } }, { id: 'g2', files: { [GIST_FILE]: {} } }] }),
    });
    const id = await new GistClient('tok', impl).find();
    expect(id).toBe('g2');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('creates a private gist', async () => {
    let sent: { public: boolean; files: Record<string, { content: string }> } | undefined;
    const { impl } = fake({
      'POST /gists': (init) => {
        sent = JSON.parse(String(init?.body));
        return { status: 201, body: { id: 'new' } };
      },
    });
    expect(await new GistClient('tok', impl).create('{"a":1}')).toBe('new');
    expect(sent?.public).toBe(false);
    expect(sent?.files[GIST_FILE].content).toBe('{"a":1}');
  });

  it('reads and explains errors', async () => {
    const { impl } = fake({
      'GET /gists/g2': () => ({ body: { files: { [GIST_FILE]: { content: 'hello' } } } }),
      'GET /user': () => ({ status: 401, body: {} }),
    });
    const client = new GistClient('tok', impl);
    expect(await client.read('g2')).toBe('hello');
    await expect(client.user()).rejects.toBeInstanceOf(GistError);
    await expect(client.user()).rejects.toThrow(/token/);
  });

  it('recognises its own payload', () => {
    expect(isPayload({ app: 'fretforge', version: 1, progress: EMPTY_PROGRESS, tabs: {} })).toBe(true);
    expect(isPayload({ hello: 'world' })).toBe(false);
  });
});
