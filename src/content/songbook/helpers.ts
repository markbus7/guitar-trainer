/** Small builders that keep long riffs readable. Each returns tab-language text. */

/** The same token n times. */
export const rep = (token: string, n: number) => Array(n).fill(token).join(' ');

/** A bar of eight eighth notes of one chord or note (sets the length to eighths). */
export const E8 = (t: string) => `e ${rep(t, 8)}`;

/** A bar of eight palm-muted eighths. */
export const PM8 = (t: string) => `e ${rep(`${t}pm`, 8)}`;

/** Two chords, four eighths each, in one bar. */
export const E44 = (a: string, b: string) => `e ${rep(a, 4)} ${rep(b, 4)}`;

/** The go-to campfire strum (down, down-up, up-down-up) on one chord: one bar. */
export const STRUM = (c: string) => `e [${c}]d r [${c}]d [${c}]u r [${c}]u [${c}]d [${c}]u`;

/** Four down-strums on one chord: one bar. */
export const DOWN4 = (c: string) => `q [${c}]d [${c}]d [${c}]d [${c}]d`;

/** A gallop (eighth + two sixteenths) on one note or chord: one beat. */
export const GALLOP = (t: string) => `e ${t} s ${t} ${t}`;

/** Join bars with bar lines (each part is one full bar). */
export const bars = (...parts: string[]) => `${parts.join(' | ')} |`;
