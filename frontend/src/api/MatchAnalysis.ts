import { MatchAnalysisResponse } from '../types/MatchAnalysis';

// In-memory cache: matchId -> { data, etag, expiresAt }
const cache = new Map<number, { data: MatchAnalysisResponse; etag?: string; expiresAt: number }>();

// Optional: persist to localStorage using this namespace
const storageNs = 'matchAnalysis';

function storageKey(matchId: number) {
  return `${storageNs}:${matchId}`;
}

function parseMaxAge(cacheControl: string | null | undefined, defaultSeconds = 300): number {
  if (!cacheControl) return defaultSeconds;
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match) return defaultSeconds;
  const v = parseInt(match[1], 10);
  return Number.isFinite(v) ? v : defaultSeconds;
}

function loadFromStorage(matchId: number) {
  try {
    const raw = localStorage.getItem(storageKey(matchId));
    if (!raw) return;
    const parsed = JSON.parse(raw) as { data: MatchAnalysisResponse; etag?: string; expiresAt: number };
    cache.set(matchId, parsed);
  } catch {
    // ignore
  }
}

function saveToStorage(matchId: number) {
  try {
    const entry = cache.get(matchId);
    if (!entry) return;
    localStorage.setItem(storageKey(matchId), JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export async function fetchMatchAnalysis(matchId: number, opts?: { allowStaleOnError?: boolean }): Promise<MatchAnalysisResponse> {
  const now = Date.now();

  if (!cache.has(matchId)) {
    loadFromStorage(matchId);
  }

  const cached = cache.get(matchId);
  if (cached && now < cached.expiresAt) {
    return cached.data; // fresh cache, skip network
  }

  const headers: Record<string, string> = {};
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag;
  }

  const url = `http://${process.env.REACT_APP_BACKEND_DOMAIN}/match/analysis/${matchId}`;
  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    if (opts?.allowStaleOnError && cached?.data) {
      return cached.data;
    }
    throw err;
  }

  const cacheControl = res.headers.get('Cache-Control');
  const etag = res.headers.get('ETag') ?? undefined;
  const maxAge = parseMaxAge(cacheControl, 300);
  const safety = Math.max(0, maxAge - 2) * 1000; // small safety buffer
  const expiresAt = Date.now() + safety;

  if (res.status === 304) {
    if (!cached) {
      // No cached data but server says not modified; treat as error
      throw new Error('304 Not Modified received without cached data');
    }
    cache.set(matchId, { ...cached, etag: etag ?? cached.etag, expiresAt });
    saveToStorage(matchId);
    return cached.data;
  }

  if (!res.ok) {
    if (opts?.allowStaleOnError && cached?.data) {
      return cached.data;
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch match analysis (${res.status}): ${text}`);
  }

  const data: MatchAnalysisResponse = await res.json();
  cache.set(matchId, { data, etag, expiresAt });
  saveToStorage(matchId);
  console.log('Loaded match data from backend:', data);
  return data;
}

export function __clearMatchAnalysisCache() {
  cache.clear();
}
