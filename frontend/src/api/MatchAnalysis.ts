import { GameAnalysisResponse } from "../types/MatchAnalysis";

// In-memory cache: gameId -> { data, etag, expiresAt }
const cache = new Map<
  number,
  { data: GameAnalysisResponse; etag?: string; expiresAt: number }
>();

// Optional: persist to localStorage using this namespace
const storageNs = "matchAnalysis";

function storageKey(gameId: number) {
  return `${storageNs}:${gameId}`;
}

function parseMaxAge(
  cacheControl: string | null | undefined,
  defaultSeconds = 300
): number {
  if (!cacheControl) return defaultSeconds;
  const game = cacheControl.match(/max-age=(\d+)/i);
  if (!game) return defaultSeconds;
  const v = parseInt(game[1], 10);
  return Number.isFinite(v) ? v : defaultSeconds;
}

function loadFromStorage(gameId: number) {
  try {
    const raw = localStorage.getItem(storageKey(gameId));
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      data: GameAnalysisResponse;
      etag?: string;
      expiresAt: number;
    };
    cache.set(gameId, parsed);
  } catch {
    // ignore
  }
}

function saveToStorage(gameId: number) {
  try {
    const entry = cache.get(gameId);
    if (!entry) return;
    localStorage.setItem(storageKey(gameId), JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export async function fetchMatchAnalysis(
  gameId: number,
  opts?: { allowStaleOnError?: boolean }
): Promise<GameAnalysisResponse> {
  const now = Date.now();

  if (!cache.has(gameId)) {
    loadFromStorage(gameId);
  }

  const cached = cache.get(gameId);
  if (cached && now < cached.expiresAt) {
    return cached.data; // fresh cache, skip network
  }

  const headers: Record<string, string> = {};
  if (cached?.etag) {
    headers["If-None-Match"] = cached.etag;
  }
  const backendDomain = import.meta.env.VITE_BACKEND_DOMAIN || "domain";
  const url = `http://${backendDomain}/match/analysis/${gameId}`;
  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    if (opts?.allowStaleOnError && cached?.data) {
      return cached.data;
    }
    throw err;
  }

  const cacheControl = res.headers.get("Cache-Control");
  const etag = res.headers.get("ETag") ?? undefined;
  const maxAge = parseMaxAge(cacheControl, 300);
  const safety = Math.max(0, maxAge - 2) * 1000; // small safety buffer
  const expiresAt = Date.now() + safety;

  if (res.status === 304) {
    if (!cached) {
      // No cached data but server says not modified; treat as error
      throw new Error("304 Not Modified received without cached data");
    }
    cache.set(gameId, { ...cached, etag: etag ?? cached.etag, expiresAt });
    saveToStorage(gameId);
    return cached.data;
  }

  if (!res.ok) {
    if (opts?.allowStaleOnError && cached?.data) {
      return cached.data;
    }
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch match analysis (${res.status}): ${text}`);
  }

  const data: GameAnalysisResponse = await res.json();
  cache.set(gameId, { data, etag, expiresAt });
  saveToStorage(gameId);
  console.log("Loaded match data from backend:", data);
  return data;
}

export function __clearMatchAnalysisCache() {
  cache.clear();
}
