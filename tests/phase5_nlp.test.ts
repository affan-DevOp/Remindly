import { describe, test, expect } from '@jest/globals';
import { parseCaptureText } from '../src/domain/nlpParser';

describe('Phase 5 — Local NLP Date/Time Parsing Engine (chrono-node)', () => {
  // Deterministic reference instant: Saturday, 24 Oct 2026, 10:00:00 local time
  const refDate = new Date('2026-10-24T10:00:00.000Z');

  describe('Explicit Date & Time (datetime)', () => {
    test("Parses 'tomorrow at 3 PM' accurately", () => {
      const res = parseCaptureText('Please call Maya tomorrow at 3 PM', refDate);
      expect(res.kind).toBe('datetime');
      expect(res.primaryCandidate).not.toBeNull();
      expect(res.primaryCandidate?.matchedText.toLowerCase()).toContain('tomorrow at 3 pm');
      expect(res.primaryCandidate?.needsTimeConfirmation).toBe(false);
      expect(res.suggestedTitle).toBe('Please call Maya');
    });

    test("Parses relative 'in 45 minutes'", () => {
      const res = parseCaptureText('Check the oven in 45 minutes', refDate);
      expect(res.kind).toBe('datetime');
      expect(res.primaryCandidate).not.toBeNull();
      const expectedMs = refDate.getTime() + 45 * 60 * 1000;
      expect(new Date(res.primaryCandidate!.instantUtc).getTime()).toBe(expectedMs);
      expect(res.suggestedTitle).toBe('Check the oven');
    });

    test("Parses absolute '28 Oct 2026 at 16:30'", () => {
      const res = parseCaptureText('Board meeting scheduled for 28 Oct 2026 at 16:30', refDate);
      expect(res.kind).toBe('datetime');
      expect(res.primaryCandidate?.localTime).toBe('16:30');
      expect(res.primaryCandidate?.localDate).toBe('2026-10-28');
      expect(res.suggestedTitle).toBe('Board meeting scheduled');
    });
  });

  describe('Date-Only Commitments & Configured Default Time', () => {
    test("Parses 'by Wednesday' and applies default 09:00 time", () => {
      const res = parseCaptureText('Submit timesheet by Wednesday', refDate, 'Asia/Kolkata', {
        defaultDateOnlyTime: '09:00',
      });
      expect(res.kind).toBe('date_only');
      expect(res.primaryCandidate?.needsTimeConfirmation).toBe(true);
      expect(res.primaryCandidate?.localTime).toBe('09:00');
      expect(res.suggestedTitle).toBe('Submit timesheet');
    });

    test("Parses vague 'Friday morning' and maps to 09:00 with confirmation flag", () => {
      const res = parseCaptureText('Team standup next Friday morning', refDate);
      expect(res.kind).toBe('date_only');
      expect(res.primaryCandidate?.needsTimeConfirmation).toBe(true);
      expect(res.primaryCandidate?.localTime).toBe('09:00');
    });

    test("Parses vague 'tomorrow evening' and maps to 18:00 with confirmation flag", () => {
      const res = parseCaptureText('Dinner with family tomorrow evening', refDate);
      expect(res.kind).toBe('date_only');
      expect(res.primaryCandidate?.needsTimeConfirmation).toBe(true);
      expect(res.primaryCandidate?.localTime).toBe('18:00');
      expect(res.suggestedTitle).toBe('Dinner with family');
    });
  });

  describe('Ambiguity & Past Dates in Forwarded Messages', () => {
    test('Flags conflicting multiple future dates as ambiguous', () => {
      const thread = 'Can we meet on Tuesday at 11am or Friday at 4pm to discuss?';
      const res = parseCaptureText(thread, refDate);

      expect(res.kind).toBe('ambiguous');
      expect(res.candidates.length).toBeGreaterThanOrEqual(2);
    });

    test('Ignores past dates from old forwarded messages', () => {
      const text = 'Forwarded: meeting was on Oct 10 2026. Please prepare new slides.';
      const res = parseCaptureText(text, refDate);

      // Oct 10 2026 is before Oct 24 2026 (reference date)
      expect(res.kind).toBe('none');
      expect(res.primaryCandidate).toBeNull();
    });

    test('Returns kind none when no dates exist in shared message', () => {
      const text = 'Great catch on that design token bug!';
      const res = parseCaptureText(text, refDate);

      expect(res.kind).toBe('none');
      expect(res.primaryCandidate).toBeNull();
      expect(res.suggestedTitle).toBe('Great catch on that design token bug!');
    });
  });

  describe('Title Extraction Safety & URL Sanitization', () => {
    test('Cleans WhatsApp timestamp prefix and preserves sender in suggested title', () => {
      const waText = '[14:20, 24/10/2026] Rahul: Please check the invoice tomorrow at 10am';
      const res = parseCaptureText(waText, refDate);

      expect(res.sender).toBe('Rahul');
      expect(res.suggestedTitle).toBe('Rahul: Please check the invoice');
      expect(res.kind).toBe('datetime');
    });

    test('Extracts embedded URL and strips it from suggested title', () => {
      const text = 'Check out this design https://www.figma.com/file/123 before tomorrow 2pm';
      const res = parseCaptureText(text, refDate);

      expect(res.sourceUrl).toBe('https://www.figma.com/file/123');
      expect(res.suggestedTitle).not.toContain('https://');
      expect(res.suggestedTitle).toBe('Check out this design');
    });

    test('Title fallback safety ensures title is never blank when date stripping leaves empty string', () => {
      const dateOnly = 'Tomorrow at 3pm';
      const res = parseCaptureText(dateOnly, refDate);

      expect(res.suggestedTitle).toBeTruthy();
      expect(res.suggestedTitle.length).toBeGreaterThanOrEqual(3);
    });

    test('Handles Unicode, emojis, and multiline text safely', () => {
      const text = '🎉 Celebrate team launch 🚀\nTomorrow at 5:00 PM with everyone!';
      const res = parseCaptureText(text, refDate);

      expect(res.kind).toBe('datetime');
      expect(res.suggestedTitle).toContain('Celebrate team launch');
    });
  });
});
