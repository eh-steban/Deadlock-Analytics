import { TimeRange } from '../../domain/timeline';

/**
 * Calculate tick range based on total match duration and selected time phase
 * @param totalMatchTicks Total duration of match in ticks/seconds
 * @param phase Selected time range phase
 * @returns Tuple of [startTick, endTick]
 */
export function getTimeRangeTicks(
  totalMatchTicks: number,
  phase: TimeRange
): [number, number] {
  switch (phase) {
    case 'laning':
      // First 33% of match
      return [0, Math.floor(totalMatchTicks * 0.33)];
    case 'mid':
      // 33% to 66% of match
      return [
        Math.floor(totalMatchTicks * 0.33),
        Math.floor(totalMatchTicks * 0.66),
      ];
    case 'late':
      // 66% to end of match
      return [Math.floor(totalMatchTicks * 0.66), totalMatchTicks];
    case 'full':
    default:
      // Entire match
      return [0, totalMatchTicks];
  }
}

/**
 * Get human-readable label for time range
 * @param totalMatchTicks Total duration of match in ticks/seconds
 * @param phase Selected time range phase
 * @returns Formatted string like "0:00 - 10:00"
 */
export function getTimeRangeLabel(
  totalMatchTicks: number,
  phase: TimeRange
): string {
  const [start, end] = getTimeRangeTicks(totalMatchTicks, phase);

  const formatTime = (ticks: number): string => {
    const minutes = Math.floor(ticks / 60);
    const seconds = ticks % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}
