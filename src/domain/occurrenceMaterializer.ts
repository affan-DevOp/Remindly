import {
  TaskRecord,
  ReminderProfileRecord,
  ProfileStageRecord,
  ReminderOccurrenceRecord,
  OccurrenceStatus,
} from './types';

export function formatStageLabel(offsetMinutes: number, stageKind: string, repeatIndex?: number, maxRepeats?: number): string {
  if (stageKind === 'persistent_follow_up' && repeatIndex !== undefined && maxRepeats) {
    return `+${offsetMinutes}m (${repeatIndex}/${maxRepeats})`;
  }
  if (offsetMinutes === 0) return 'Due';
  if (offsetMinutes === -1440) return '-24h';
  if (offsetMinutes < 0) {
    const abs = Math.abs(offsetMinutes);
    if (abs % 1440 === 0) return `-${abs / 1440}d`;
    if (abs % 60 === 0) return `-${abs / 60}h`;
    return `-${abs}m`;
  }
  if (offsetMinutes % 60 === 0) return `+${offsetMinutes / 60}h`;
  return `+${offsetMinutes}m`;
}

export function materializeOccurrences(
  task: TaskRecord,
  stages: ProfileStageRecord[],
  profile?: ReminderProfileRecord | null,
  now: Date = new Date()
): ReminderOccurrenceRecord[] {
  if (task.due_precision === 'none' || !task.due_at_utc) {
    return [];
  }

  const dueTimeMs = Date.parse(task.due_at_utc);
  if (isNaN(dueTimeMs)) {
    return [];
  }

  const enabledStages = stages
    .filter((s) => s.enabled === 1 || s.enabled === undefined)
    .sort((a, b) => a.sort_order - b.sort_order);

  const isTerminalTask = task.status === 'completed' || task.status === 'archived';
  const nowMs = now.getTime();
  const occurrences: ReminderOccurrenceRecord[] = [];
  const seenTimestamps = new Set<string>();

  for (let i = 0; i < enabledStages.length; i++) {
    const stage = enabledStages[i];
    const triggerTimeMs = dueTimeMs + stage.offset_minutes * 60 * 1000;
    const triggerUtc = new Date(triggerTimeMs).toISOString();

    if (seenTimestamps.has(triggerUtc)) {
      continue;
    }
    seenTimestamps.add(triggerUtc);

    let status: OccurrenceStatus = 'pending';

    if (isTerminalTask) {
      status = 'cancelled';
    } else if (triggerTimeMs <= nowMs) {
      status = 'skipped';
    }

    const label = formatStageLabel(
      stage.offset_minutes,
      stage.stage_kind,
      stage.stage_kind === 'persistent_follow_up' ? i - 2 : undefined,
      profile?.max_repeats
    );

    occurrences.push({
      id: `occ-${task.id}-${stage.id || i}-${triggerTimeMs}`,
      task_id: task.id,
      profile_stage_id: stage.id || null,
      trigger_at_utc: triggerUtc,
      stage_label: label,
      status,
      os_notification_id: null,
      schedule_attempt_count: 0,
      last_error: null,
      created_at_utc: task.created_at_utc,
      updated_at_utc: task.updated_at_utc,
    });
  }

  return occurrences;
}
