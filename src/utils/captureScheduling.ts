export type CaptureDateMode = 'today' | 'tomorrow' | 'custom' | 'inbox';

export function captureDateSelection(target: Date, now: Date = new Date()) {
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = Math.round((day(target) - day(now)) / 86400000);
  const mode: CaptureDateMode = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : 'custom';
  return { mode, offset };
}

export function futureCaptureTime(now: Date = new Date(), minutes = 10, round = true): Date {
  const target = new Date(now.getTime() + minutes * 60000);
  if (round) target.setMinutes(Math.ceil(target.getMinutes() / 5) * 5, 0, 0);
  return target;
}

export function captureDeadline(mode: CaptureDateMode, offset: number, hour: number, minute: number, period: 'AM' | 'PM', now: Date = new Date()): Date | null {
  if (mode === 'inbox') return null;
  const target = new Date(now);
  target.setDate(target.getDate() + (mode === 'tomorrow' ? 1 : mode === 'custom' ? offset : 0));
  target.setHours(hour % 12 + (period === 'PM' ? 12 : 0), minute, 0, 0);
  return target;
}
