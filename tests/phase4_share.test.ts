import { describe, test, expect, beforeEach } from '@jest/globals';
import { shareIngestService, sanitizeUrl, cleanBoilerplate } from '../src/services/shareIngestService';

describe('Phase 4 — Android Share Target & Cross-App Ingest Normalization', () => {
  describe('Sanitize URL Utility', () => {
    test('Accepts valid HTTP and HTTPS URLs', () => {
      expect(sanitizeUrl('https://github.com/expo/expo')).toBe('https://github.com/expo/expo');
      expect(sanitizeUrl('http://inbox.google.com')).toBe('http://inbox.google.com');
    });

    test('Strips trailing punctuation caught from sentences', () => {
      expect(sanitizeUrl('https://example.com/doc.')).toBe('https://example.com/doc');
      expect(sanitizeUrl('https://example.com/file,')).toBe('https://example.com/file');
      expect(sanitizeUrl('https://example.com/test!?')).toBe('https://example.com/test');
    });

    test('Rejects non-HTTP schemes and broken strings', () => {
      expect(sanitizeUrl('ftp://server.org/file')).toBeUndefined();
      expect(sanitizeUrl('file:///sdcard/test.txt')).toBeUndefined();
      expect(sanitizeUrl('customapp://open')).toBeUndefined();
      expect(sanitizeUrl('')).toBeUndefined();
      expect(sanitizeUrl(null)).toBeUndefined();
    });
  });

  describe('Clean Boilerplate & Sender Extraction', () => {
    test('Strips WhatsApp timestamps and extracts sender name', () => {
      const raw = '[14:20, 24/10/2026] Rahul: Please check the invoice and send payment proof';
      const result = cleanBoilerplate(raw);

      expect(result.sender).toBe('Rahul');
      expect(result.cleaned).toBe('Please check the invoice and send payment proof');
    });

    test('Handles 12-hour AM/PM WhatsApp timestamp format', () => {
      const raw = '[23/10/26, 8:40 PM] Aarav: We need to file the quarterly GST report tomorrow';
      const result = cleanBoilerplate(raw);

      expect(result.sender).toBe('Aarav');
      expect(result.cleaned).toBe('We need to file the quarterly GST report tomorrow');
    });

    test('Strips email forwarding and reply prefixes', () => {
      expect(cleanBoilerplate('Fwd: Q3 Financial Summary').cleaned).toBe('Q3 Financial Summary');
      expect(cleanBoilerplate('Re: Vendor meeting reschedule').cleaned).toBe('Vendor meeting reschedule');
      expect(cleanBoilerplate('FW: Project status update').cleaned).toBe('Project status update');
    });
  });

  describe('Share Payload Normalization', () => {
    test('Normalizes text-only share payload', () => {
      const text = 'Remember to renew passport before December trip';
      const payload = shareIngestService.normalizePayload(text);

      expect(payload).not.toBeNull();
      expect(payload?.suggestedTitle).toBe('Remember to renew passport before December trip');
      expect(payload?.sourceUrl).toBeUndefined();
      expect(payload?.source).toBe('Manual');
    });

    test('Normalizes URL-only share payload and classifies as Notes/Web', () => {
      const url = 'https://reactnative.dev/docs/components-and-apis';
      const payload = shareIngestService.normalizePayload('', url);

      expect(payload).not.toBeNull();
      expect(payload?.sourceUrl).toBe(url);
      expect(payload?.source).toBe('Notes');
    });

    test('Extracts embedded URL from natural sentence and cleans punctuation', () => {
      const raw = 'Review this Figma spec https://figma.com/file/xyz123. before tomorrow 10am.';
      const payload = shareIngestService.normalizePayload(raw);

      expect(payload).not.toBeNull();
      expect(payload?.sourceUrl).toBe('https://figma.com/file/xyz123');
      expect(payload?.rawText).toBe(raw);
    });

    test('Prefers email subject as title when present', () => {
      const body = 'Hi team, please find attached the revised NDA contract for sign-off.';
      const payload = shareIngestService.normalizePayload(body, undefined, undefined, 'Fwd: NDA Contract Final Sign-off');

      expect(payload).not.toBeNull();
      expect(payload?.suggestedTitle).toBe('NDA Contract Final Sign-off');
      expect(payload?.source).toBe('Gmail');
    });

    test('Preserves Unicode characters and emojis verbatim without corruption', () => {
      const unicodeText = '🚀 Launch Remindly v2.0 • 庆祝发布 • ¡Vamos equipo! 🇮🇳';
      const payload = shareIngestService.normalizePayload(unicodeText);

      expect(payload).not.toBeNull();
      expect(payload?.rawText).toBe(unicodeText);
      expect(payload?.suggestedTitle).toContain('Launch Remindly');
    });

    test('Returns null for empty or whitespace-only shares', () => {
      expect(shareIngestService.normalizePayload('')).toBeNull();
      expect(shareIngestService.normalizePayload('   \n\t  ')).toBeNull();
    });
  });

    test('Detects Outlook from Android callerPackage', () => {
      const text = 'Budget review meeting at 4pm';
      const payload = shareIngestService.normalizePayload(text, undefined, undefined, undefined, 'com.microsoft.office.outlook');

      expect(payload).not.toBeNull();
      expect(payload?.source).toBe('Outlook');
    });

    test('Detects Outlook from text containing Sent from Outlook', () => {
      const raw = 'Please review the Q4 financial presentation.\n\nSent from Outlook for Android';
      const payload = shareIngestService.normalizePayload(raw);

      expect(payload).not.toBeNull();
      expect(payload?.source).toBe('Outlook');
      expect(payload?.cleanedText).toBe('Please review the Q4 financial presentation.');
    });

    test('Detects Outlook from forwarded header block and extracts sender', () => {
      const raw = 'From: Sarah Connor <sarah@skynet.com>\nSent: Thursday, October 22, 2026 2:15 PM\nTo: Kyle Reese <kyle@resistance.org>\nSubject: Urgent: Server migration checklist\n\nHi Kyle, please check the servers.';
      const payload = shareIngestService.normalizePayload(raw);

      expect(payload).not.toBeNull();
      expect(payload?.source).toBe('Outlook');
      expect(payload?.sender).toBe('Sarah Connor');
      expect(payload?.cleanedText).toContain('Hi Kyle, please check the servers.');
    });

    test('Detects Telegram from t.me link and handles Telegram shares', () => {
      const text = 'Join the channel update at https://t.me/remindly';
      const payload = shareIngestService.normalizePayload(text);

      expect(payload).not.toBeNull();
      expect(payload?.source).toBe('Telegram');
      expect(payload?.sourceUrl).toBe('https://t.me/remindly');
    });

    test('Detects Web from browser caller package', () => {
      const text = 'Interesting article on state machines';
      const url = 'https://news.ycombinator.com/item?id=123';
      const payload = shareIngestService.normalizePayload(text, url, undefined, undefined, 'com.android.chrome');

      expect(payload).not.toBeNull();
      expect(payload?.source).toBe('Web');
    });

    test('Preserves explicit manual source override', () => {
      const text = 'Shared text from unknown app';
      const payload = shareIngestService.normalizePayload(text, undefined, 'Outlook');

      expect(payload).not.toBeNull();
      expect(payload?.source).toBe('Outlook');
    });

  describe('Deduplication Window Engine', () => {
    test('Deduplicates repeated share intents within 15-second window', () => {
      const text = 'Unique share content ' + Date.now();
      const payload = shareIngestService.normalizePayload(text)!;

      const t0 = 100000;
      expect(shareIngestService.shouldProcess(payload.ingestKey, t0)).toBe(true);
      // Immediately subsequent intent with same key
      expect(shareIngestService.shouldProcess(payload.ingestKey, t0 + 2000)).toBe(false);
      // After window expiration (16s later)
      expect(shareIngestService.shouldProcess(payload.ingestKey, t0 + 16000)).toBe(true);
    });
  });
});
