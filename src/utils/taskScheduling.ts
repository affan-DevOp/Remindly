import { OmniTask } from '../types/task';

/**
 * Returns minutes from midnight (0 to 1439) for chronological sorting based on the visible time label.
 * Untimed tasks receive 99999 so they sort gracefully at the bottom.
 */
export function getTimeSortValue(task: OmniTask): number {
  const label = (task.timeLabel || '').trim();

  // 1. Standard 12-hour format e.g. "9:00 AM", "11:30 AM", "1:15 PM", "12:00 PM"
  const match12 = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = (match12[3] || '').toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 2. Simple hour with AM/PM e.g. "9 AM", "2 PM"
  const matchHour = label.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (matchHour) {
    let hours = parseInt(matchHour[1], 10);
    const period = matchHour[2].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60;
  }

  // 3. 24-hour format "HH:mm"
  const match24 = label.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }

  // 4. Relative snoozed times "In X min", "In X hour"
  if (label.startsWith('In ')) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const mMatch = label.match(/In\s+(\d+)\s*min/i);
    if (mMatch) return (nowMins + parseInt(mMatch[1], 10)) % 1440;
    const hMatch = label.match(/In\s+(\d+)\s*hour/i);
    if (hMatch) return (nowMins + parseInt(hMatch[1], 10) * 60) % 1440;
  }

  // 5. dueLocalTime fallback
  if (task.dueLocalTime) {
    const m = task.dueLocalTime.match(/^(\d{1,2}):(\d{2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  // 6. dueAtUtc fallback
  if (task.dueAtUtc) {
    const d = new Date(task.dueAtUtc);
    if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  }

  // 7. Untimed items sort last
  return 99999;
}

/**
 * Checks whether a given task is scheduled on the selected date.
 */
export function isTaskOnSelectedDate(
  task: OmniTask,
  selectedDateIso: string,
  isSelectedToday: boolean,
  isSelectedTomorrow: boolean,
  selectedDate: Date,
  selectedDay: number
): boolean {
  // Exclude inbox tasks from timeline date view
  if (task.status === 'inbox' || task.dateLabel === 'Inbox') {
    return false;
  }

  // 1. Explicit dueLocalDate
  if (task.dueLocalDate) {
    return task.dueLocalDate === selectedDateIso;
  }

  // 2. dueAtUtc local conversion
  if (task.dueAtUtc) {
    const d = new Date(task.dueAtUtc);
    if (!isNaN(d.getTime())) {
      const taskIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (taskIso === selectedDateIso) return true;
    }
  }

  // 3. Label matching
  const dl = (task.dateLabel || '').trim().toLowerCase();
  if (isSelectedToday) {
    if (dl === 'today') return true;
    // Active overdue tasks show up on today's view for immediate attention
    if (task.status === 'overdue') return true;
  }

  if (isSelectedTomorrow) {
    if (dl === 'tomorrow') return true;
  }

  // Custom date string check e.g. "Mon, Oct 26" or "Oct 26"
  const monthShort = selectedDate.toLocaleDateString(undefined, { month: 'short' }).toLowerCase();
  const dayStr = String(selectedDay);
  if (dl.includes(monthShort) && dl.includes(dayStr)) {
    return true;
  }

  return false;
}

/**
 * Formats a 24-hour time string like "14:30" or existing label into user-facing 12-hour AM/PM format.
 */
export function formatTimeLabel(localTime?: string | null): string {
  if (!localTime) return 'No deadline';
  const trimmed = localTime.trim();
  if (trimmed.includes('AM') || trimmed.includes('PM') || trimmed.startsWith('In ') || trimmed === 'No deadline') {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return trimmed;
}
