/** A tiny client for the GitHub gist API, used to keep progress in a private gist. */

export const GIST_FILE = 'fretforge-progress.json';
export const GIST_DESCRIPTION = 'Fretforge progress (synced by the Fretforge guitar game)';
export const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Fretforge%20sync';

const API = 'https://api.github.com';

export class GistError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Fetch = typeof fetch;

export class GistClient {
  constructor(
    private token: string,
    private fetchImpl: Fetch = (...args) => fetch(...args),
  ) {}

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${API}${path}`, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
    } catch {
      throw new GistError('Could not reach GitHub. Are you online?', 0);
    }
    if (res.status === 401) throw new GistError('GitHub did not accept this token. It may be mistyped or expired.', 401);
    if (res.status === 403 || res.status === 404) {
      throw new GistError(
        res.headers.get('x-ratelimit-remaining') === '0' ? 'GitHub rate limit reached. Try again in a while.' : 'This token cannot use gists. Create one with the "gist" scope.',
        res.status,
      );
    }
    if (!res.ok) throw new GistError(`GitHub answered with an error (${res.status}).`, res.status);
    return (await res.json()) as T;
  }

  user() {
    return this.call<{ login: string }>('/user');
  }

  /** The id of the gist that holds Fretforge progress, if there is one. */
  async find(): Promise<string | undefined> {
    for (let page = 1; page <= 5; page++) {
      const list = await this.call<{ id: string; files: Record<string, unknown> }[]>(`/gists?per_page=100&page=${page}`);
      const hit = list.find((g) => g.files && GIST_FILE in g.files);
      if (hit) return hit.id;
      if (list.length < 100) return undefined;
    }
    return undefined;
  }

  async read(id: string): Promise<string | undefined> {
    const g = await this.call<{ files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }> }>(`/gists/${id}`);
    const f = g.files?.[GIST_FILE];
    if (!f) return undefined;
    if (f.truncated && f.raw_url) {
      const raw = await this.fetchImpl(f.raw_url);
      return raw.ok ? raw.text() : undefined;
    }
    return f.content;
  }

  async create(content: string): Promise<string> {
    const g = await this.call<{ id: string }>('/gists', {
      method: 'POST',
      body: JSON.stringify({ description: GIST_DESCRIPTION, public: false, files: { [GIST_FILE]: { content } } }),
    });
    return g.id;
  }

  async write(id: string, content: string): Promise<void> {
    await this.call(`/gists/${id}`, { method: 'PATCH', body: JSON.stringify({ files: { [GIST_FILE]: { content } } }) });
  }
}
