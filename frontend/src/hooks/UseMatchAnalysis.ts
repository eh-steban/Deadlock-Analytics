import { useEffect, useState, useCallback } from 'react';
import { fetchGameAnalysis } from '../api/MatchAnalysis';
import { GameAnalysisResponse } from '../types/MatchAnalysis';

export function useGameAnalysis(matchId: number) {
  const [data, setData] = useState<GameAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGameAnalysis(matchId);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId == null) return;
    load();
  }, [matchId, load]);

  return { data, loading, error, refetch: load } as const;
}
