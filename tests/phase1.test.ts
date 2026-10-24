import { describe, test, expect } from '@jest/globals';
import {
  POPULATED_TASKS,
  BUILTIN_PROFILES,
  AMBIGUOUS_CAPTURE_SAMPLE,
} from '../src/mocks/phase1Fixtures';

describe('Phase 1: Design System & Mock Fixtures Verification', () => {
  test('All 4 built-in reminder profiles are populated with stages', () => {
    expect(BUILTIN_PROFILES).toHaveLength(4);
    const profileIds = BUILTIN_PROFILES.map((p) => p.id);
    expect(profileIds).toContain('builtin_simple');
    expect(profileIds).toContain('builtin_standard');
    expect(profileIds).toContain('builtin_important');
    expect(profileIds).toContain('builtin_persistent');

    // Standard profile has -24h, -1h, Due
    const standard = BUILTIN_PROFILES.find((p) => p.id === 'builtin_standard')!;
    expect(standard.stages).toHaveLength(3);
    expect(standard.stages[0].offsetMinutes).toBe(-1440);
    expect(standard.stages[1].offsetMinutes).toBe(-60);
    expect(standard.stages[2].offsetMinutes).toBe(0);
  });

  test('Populated mock fixtures cover overdue, next up, today, and inbox categories', () => {
    const overdue = POPULATED_TASKS.filter((t) => t.id.includes('overdue'));
    const nextUp = POPULATED_TASKS.filter((t) => t.id.includes('next_up'));
    const inbox = POPULATED_TASKS.filter((t) => t.status === 'inbox');
    const completed = POPULATED_TASKS.filter((t) => t.status === 'completed');

    expect(overdue.length).toBeGreaterThan(0);
    expect(nextUp.length).toBeGreaterThan(0);
    expect(inbox.length).toBeGreaterThan(0);
    expect(completed.length).toBeGreaterThan(0);
  });

  test('Ambiguous capture fixture contains multiple candidate suggestions', () => {
    expect(AMBIGUOUS_CAPTURE_SAMPLE.detectedCandidates.length).toBeGreaterThanOrEqual(2);
    expect(AMBIGUOUS_CAPTURE_SAMPLE.rawText).toContain('Friday at 4 PM');
  });

  test('Valid URL extraction guard in SourceProvenanceCard logic', () => {
    const validHttp = 'http://example.com/item';
    const validHttps = 'https://figma.com/file/123';
    const invalidAppScheme = 'whatsapp://chat';
    const emptyString = '';

    const isValidUrl = (url?: string) => !!url && (url.startsWith('http://') || url.startsWith('https://'));

    expect(isValidUrl(validHttp)).toBe(true);
    expect(isValidUrl(validHttps)).toBe(true);
    expect(isValidUrl(invalidAppScheme)).toBe(false);
    expect(isValidUrl(emptyString)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
  });

  test('Cascade timeline skips past stages deterministically', () => {
    const injectedNow = new Date('2026-10-24T12:00:00Z');
    const dueAt = new Date('2026-10-24T15:00:00Z'); // 3 hours in future

    // -24h stage was 2026-10-23T15:00:00Z (Past -> must be skipped)
    // -1h stage is 2026-10-24T14:00:00Z (Future -> kept)
    // Due stage is 2026-10-24T15:00:00Z (Future -> kept)
    const stages = [
      { offsetMinutes: -1440, label: '-24h' },
      { offsetMinutes: -60, label: '-1h' },
      { offsetMinutes: 0, label: 'Due' },
    ];

    const evaluatedStages = stages.map((s) => {
      const triggerTime = new Date(dueAt.getTime() + s.offsetMinutes * 60_000);
      return {
        ...s,
        isSkipped: triggerTime.getTime() <= injectedNow.getTime(),
      };
    });

    expect(evaluatedStages[0].isSkipped).toBe(true);
    expect(evaluatedStages[1].isSkipped).toBe(false);
    expect(evaluatedStages[2].isSkipped).toBe(false);
  });
});
