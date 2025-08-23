import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMatchAnalysis, __clearMatchAnalysisCache } from '../src/api/MatchAnalysis';

type AnyObject = Record<string, unknown>;

type DamageRecord = {
  damage: number;
  type: number;
  citadel_type: number;
  ability_id: number;
  attacker_class: number;
  victim_class: number;
};

type DamageWindow = {
  [attackerId: number]: {
    [victimId: number]: DamageRecord[];
  };
};

type DamagePerTick = DamageWindow[];

type ParsedGameData = {
  damage_per_tick: DamagePerTick;
  players: AnyObject[];
};

type MatchAnalysisResponse = {
  match_metadata: AnyObject;
  parsed_game_data: ParsedGameData;
  players: AnyObject[];
  npcs: AnyObject[];
};

const baseUrl = `http://${process.env.REACT_APP_BACKEND_DOMAIN}`;

const sample: MatchAnalysisResponse = {
  match_metadata: {},
  parsed_game_data: { players: [], damage_per_tick: [] },
  players: [],
  npcs: [],
};

function makeResponse(body: unknown, init: ResponseInit & { headers?: Record<string, string> } = {}) {
  const { status = 200, headers = {} } = init;
  return new Response(JSON.stringify(body), {
    status,
    headers: new Headers(headers),
  });
}

function make304(headers: Record<string, string> = {}) {
  return new Response(null, { status: 304, headers: new Headers(headers) });
}

// Helpers used by multiple tests to read headers from either a Headers instance or a plain object
function getHeaderValue(headersArg: any, key: string): string | null | undefined {
  if (!headersArg) return undefined;
  if (typeof headersArg.get === 'function') return headersArg.get(key);
  return headersArg[key] ?? headersArg[key.toLowerCase()];
}

function normalizeETag(v: string | null | undefined) {
  return v == null ? undefined : v.replace(/^W\//, '').replace(/^"|"$/g, '');
}

describe('fetchMatchAnalysis ETag cache', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    __clearMatchAnalysisCache();
    // mock localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: vi.fn((k: string) => { delete store[k]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    } as unknown as Storage;
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('populates cache on 200 and returns data', async () => {
  (fetch as any).mockResolvedValueOnce(
      makeResponse(sample, { status: 200, headers: { 'ETag': 'W/"abc"', 'Cache-Control': 'public, max-age=300' } })
    );

    const data = await fetchMatchAnalysis(1);
    expect(data).toEqual(sample);
    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/match/analysis/1`, { headers: {} });
  });

  it('returns cached data on 304 and updates expiry', async () => {
    // Seed cache via initial 200 with very short max-age so we can force expiry
  (fetch as any).mockResolvedValueOnce(
      makeResponse(sample, { status: 200, headers: { 'ETag': 'etag1', 'Cache-Control': 'max-age=1' } })
    );
    await fetchMatchAnalysis(2);

    // Advance time so the cache is considered expired
    const realNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(realNow() + 5_000);

    // Conditional GET -> 304
  (fetch as any).mockResolvedValueOnce(
      make304({ 'ETag': 'etag1', 'Cache-Control': 'max-age=120' })
    );

    const data = await fetchMatchAnalysis(2);
    expect(data).toEqual(sample);
    const lastCall = (fetch as any).mock.calls.at(-1);
    const raw = getHeaderValue(lastCall?.[1]?.headers, 'If-None-Match');
    expect(normalizeETag(raw)).toBe('etag1');
  });

  it('skips network when cache is fresh', async () => {
    // First call fills cache
  (fetch as any).mockResolvedValueOnce(
      makeResponse(sample, { status: 200, headers: { 'ETag': 'etagX', 'Cache-Control': 'max-age=300' } })
    );
    await fetchMatchAnalysis(3);

    // Second call should use cache immediately
    const data = await fetchMatchAnalysis(3);
    expect(data).toEqual(sample);
  expect((fetch as any)).toHaveBeenCalledTimes(1);
  });

  it('issues conditional GET when expired', async () => {
    // Initial 200 with very short max-age to force expiry
  (fetch as any).mockResolvedValueOnce(
      makeResponse(sample, { status: 200, headers: { 'ETag': 'old', 'Cache-Control': 'max-age=1' } })
    );
    await fetchMatchAnalysis(4);

    // Advance time by mocking Date.now
    const realNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(realNow() + 5_000);

  (fetch as any).mockResolvedValueOnce(
      makeResponse(sample, { status: 200, headers: { 'ETag': 'new', 'Cache-Control': 'max-age=300' } })
    );

    const data = await fetchMatchAnalysis(4);
    expect(data).toEqual(sample);
  const lastCall = (fetch as any).mock.calls.at(-1);
    expect(lastCall?.[1]?.headers?.['If-None-Match']).toBe('old');
  });

  it('returns stale on network error if allowed', async () => {
  (fetch as any).mockResolvedValueOnce(
      makeResponse(sample, { status: 200, headers: { 'ETag': 'ok', 'Cache-Control': 'max-age=300' } })
    );
    await fetchMatchAnalysis(5);

  (fetch as any).mockRejectedValueOnce(new Error('boom'));

    const data = await fetchMatchAnalysis(5, { allowStaleOnError: true });
    expect(data).toEqual(sample);
  });
});
