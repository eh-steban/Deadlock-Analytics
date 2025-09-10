export function formatSecondstoMMSS(currentTick: number | string): string {
  const minutes = Math.floor(Number(currentTick) / 60);
  const seconds = Math.floor(Number(currentTick) % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
