import { useSyncExternalStore } from 'react';

/** Minimal hash router: #/chapter/garage, #/play/garage-gig?mode=play&tempo=0.8 */
export interface Route {
  path: string;
  parts: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, q] = raw.split('?');
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(q ?? '') };
}

let current: Route = parse();
let depth = 0;
const listeners = new Set<() => void>();

window.addEventListener('hashchange', () => {
  current = parse();
  listeners.forEach((l) => l());
});

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => current);
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const target = `#${path}`;
  if (window.location.hash === target) return;
  if (opts.replace) {
    window.history.replaceState(null, '', target);
    current = parse();
    listeners.forEach((l) => l());
  } else {
    depth++;
    window.location.hash = path;
  }
  window.scrollTo({ top: 0 });
}

/** Go back inside the app, or to a fallback when there is nowhere to go back to. */
export function goBack(fallback = '/') {
  if (depth > 0) {
    depth--;
    window.history.back();
  } else navigate(fallback, { replace: true });
}
