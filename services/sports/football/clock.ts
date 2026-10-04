export interface FootballClockSample {
  period?: number;
  clock?: string;
  observedAt: number;
}

export function parseFootballClock(value?: string) {
  if (!value) return undefined;
  const match = value.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return undefined;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || seconds > 59) return undefined;
  return minutes * 60 + seconds;
}

export function formatFootballClock(seconds?: number) {
  if (seconds === undefined) return undefined;
  const bounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(bounded / 60)}:${String(bounded % 60).padStart(2, "0")}`;
}

export function interpolateFootballClock(authoritativeClock: string | undefined, elapsedMs: number, running: boolean) {
  const seconds = parseFootballClock(authoritativeClock);
  if (seconds === undefined) return authoritativeClock;
  return formatFootballClock(running ? seconds - Math.max(0, elapsedMs) / 1_000 : seconds);
}

export function clockSampleProgressed(previous: FootballClockSample | undefined, next: FootballClockSample) {
  const previousSeconds = parseFootballClock(previous?.clock);
  const nextSeconds = parseFootballClock(next.clock);
  if (!previous || previous.period !== next.period || previousSeconds === undefined || nextSeconds === undefined) return false;
  return nextSeconds < previousSeconds;
}
