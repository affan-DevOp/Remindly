import { describe, test, expect } from '@jest/globals';
import { lightColors, darkColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { layout } from '../src/theme/spacing';

describe('Remindly Foundation & Anti-AI-Slop Checks', () => {
  test('Typography system enforces 3-tier font families', () => {
    expect(typography.fonts.displayBold).toBe('PlusJakartaSans_700Bold');
    expect(typography.fonts.bodyRegular).toBe('Inter_400Regular');
    expect(typography.fonts.monoMedium).toBe('JetBrainsMono_500Medium');
  });

  test('Anti-AI-Slop rule: No generic AI purple (#6366F1 / #8B5CF6) in palette', () => {
    const prohibitedPurples = ['#6366F1', '#8B5CF6', '#7C3AED', '#A855F7'];

    const checkColors = (obj: Record<string, any>) => {
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string') {
          for (const purple of prohibitedPurples) {
            expect(val.toUpperCase()).not.toBe(purple.toUpperCase());
          }
        } else if (typeof val === 'object' && val !== null) {
          checkColors(val);
        }
      }
    };

    checkColors(lightColors);
    checkColors(darkColors);
  });

  test('Touch targets adhere to Android minimum 48x48dp standard', () => {
    expect(layout.minTouchTarget).toBeGreaterThanOrEqual(48);
  });

  test('Deterministic clock calculation for reminder stage offsets', () => {
    // Stage offset calculation: triggerAt = dueAt + offsetMinutes * 60_000
    const dueAt = new Date('2026-10-25T15:00:00Z');
    const offset24h = -1440; // -24 hours
    const offset1h = -60;    // -1 hour

    const trigger24h = new Date(dueAt.getTime() + offset24h * 60_000);
    const trigger1h = new Date(dueAt.getTime() + offset1h * 60_000);

    expect(trigger24h.toISOString()).toBe('2026-10-24T15:00:00.000Z');
    expect(trigger1h.toISOString()).toBe('2026-10-25T14:00:00.000Z');
  });

  test('Past stages relative to now clock are skipped cleanly', () => {
    const dueAt = new Date('2026-10-25T15:00:00Z');
    const now = new Date('2026-10-25T10:00:00Z'); // 5 hours before deadline

    const stages = [
      { offsetMinutes: -1440, label: '-24h' }, // 2026-10-24T15:00:00Z (in the past!)
      { offsetMinutes: -60, label: '-1h' },    // 2026-10-25T14:00:00Z (in the future)
      { offsetMinutes: 0, label: '0m' },       // 2026-10-25T15:00:00Z (in the future)
    ];

    const activeStages = stages.filter((s) => {
      const triggerTime = new Date(dueAt.getTime() + s.offsetMinutes * 60_000);
      return triggerTime.getTime() > now.getTime();
    });

    expect(activeStages).toHaveLength(2);
    expect(activeStages[0].label).toBe('-1h');
    expect(activeStages[1].label).toBe('0m');
  });
});
