import * as Linking from 'expo-linking';
import { TaskSource } from '../types/task';

export interface NormalizedSharePayload {
  rawText: string;
  cleanedText: string;
  suggestedTitle: string;
  sourceUrl?: string;
  source: TaskSource;
  subject?: string;
  sender?: string;
  ingestKey: string;
}

export function sanitizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  // Only accept http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  // Strip trailing punctuation often caught in regex from natural sentences (.,)
  return trimmed.replace(/[.,;!?]+$/, '');
}

export function cleanBoilerplate(text: string): { cleaned: string; sender?: string } {
  let cleaned = text.trim();
  let sender: string | undefined;

  // 1. WhatsApp forwarded header: e.g. "[14:20, 24/10/2026] Rahul: Message" or "[23/10/26, 8:40 PM] Aarav: Message"
  const waMatch = cleaned.match(/^\[(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?,?\s+\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s*([^:]+):\s*/);
  if (waMatch) {
    sender = waMatch[1].trim();
    cleaned = cleaned.slice(waMatch[0].length).trim();
  }

  // 2. Outlook forwarded header blocks
  const outlookRegex = /^From:\s*([^\r\n<]+)(?:<[^>]+>)?\s*[\r\n]+(?:Sent|Date):\s*[^\r\n]+[\r\n]+(?:To:\s*[^\r\n]+[\r\n]+)?Subject:\s*([^\r\n]+)[\r\n]+/i;
  const outlookHeader = cleaned.match(outlookRegex);
  if (outlookHeader) {
    sender = outlookHeader[1].trim();
    cleaned = cleaned.slice(outlookHeader[0].length).trim();
  }

  // 3. Email Forwarded/Reply headers: "Fwd:", "Re:", "Subject:"
  const emailMatch = cleaned.match(/^(?:fwd|re|fw):\s*/i);
  if (emailMatch) {
    cleaned = cleaned.slice(emailMatch[0].length).trim();
  }

  // 4. Strip Outlook signature footers (e.g. "Sent from Outlook for Android", "Get Outlook for iOS")
  cleaned = cleaned.replace(/\s*(?:Get Outlook for (?:Android|iOS)|Sent from (?:my (?:phone using )?)?Outlook)[\s\S]*$/i, '').trim();

  return { cleaned: cleaned || text.trim(), sender };
}

export class ShareIngestService {
  private processedKeys = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 15000; // 15 seconds window

  public normalizePayload(
    rawText: string,
    providedUrl?: string,
    providedSource?: TaskSource,
    subject?: string,
    callerPackage?: string
  ): NormalizedSharePayload | null {
    const raw = rawText || '';
    const text = raw.trim();
    const cleanProvidedUrl = sanitizeUrl(providedUrl);

    if (!text && !cleanProvidedUrl && !subject?.trim()) {
      return null;
    }

    // Detect embedded URL in text if not explicitly provided
    let sourceUrl = cleanProvidedUrl;
    if (!sourceUrl && text) {
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) {
        sourceUrl = sanitizeUrl(urlMatch[0]);
      }
    }

    // Clean leading message noise
    const { cleaned, sender } = cleanBoilerplate(text);

    // Infer source application if not provided
    let source: TaskSource = providedSource || 'Manual';
    if (!providedSource) {
      // 1. Android caller package / referrer inspection (highest fidelity)
      const pkg = (callerPackage || '').toLowerCase();
      if (pkg.includes('outlook') || pkg.includes('microsoft.office.outlook') || pkg.includes('microsoft.teams')) {
        source = 'Outlook';
      } else if (pkg.includes('google.android.gm') || pkg.includes('gmail')) {
        source = 'Gmail';
      } else if (pkg.includes('whatsapp')) {
        source = 'WhatsApp';
      } else if (pkg.includes('telegram') || pkg.includes('org.thunderdog.challegram')) {
        source = 'Telegram';
      } else if (pkg.includes('slack')) {
        source = 'Slack';
      } else if (pkg.includes('keep') || pkg.includes('onenote') || pkg.includes('notion')) {
        source = 'Notes';
      } else if (pkg.includes('chrome') || pkg.includes('firefox') || pkg.includes('browser') || pkg.includes('edge')) {
        source = 'Web';
      }

      if (source === 'Manual') {
        const lower = text.toLowerCase();
        const subjLower = (subject || '').toLowerCase();
        const urlLower = (sourceUrl || '').toLowerCase();

        // 2. Chat Container format (WhatsApp forwarded message headers)
        if (
          lower.includes('whatsapp') ||
          raw.match(/\[\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},/) ||
          raw.match(/\[\d{1,2}:\d{2}/) ||
          (sender && raw.match(/\[/))
        ) {
          source = 'WhatsApp';
        } else if (
          // 3. Outlook / Microsoft signatures
          lower.includes('outlook') ||
          lower.includes('hotmail') ||
          lower.includes('@live.com') ||
          lower.includes('@microsoft.com') ||
          lower.includes('@outlook.com') ||
          lower.includes('sent from outlook') ||
          lower.includes('get outlook') ||
          subjLower.includes('outlook') ||
          subjLower.includes('teams') ||
          /from:\s*[^\r\n]+[\r\n]+(?:sent|date):/i.test(raw) ||
          (sourceUrl && (/(?:outlook|teams|sharepoint|live|hotmail)\.(?:office|live|com)/i.test(urlLower) || /office\.com|microsoft\.com/i.test(urlLower)))
        ) {
          source = 'Outlook';
        } else if (
          // 4. Telegram signatures
          lower.includes('telegram') ||
          lower.includes('t.me/') ||
          (sourceUrl && /(?:t\.me|telegram\.me|telegram\.org)/i.test(urlLower)) ||
          /forwarded from @/i.test(lower)
        ) {
          source = 'Telegram';
        } else if (
          // 5. Slack signatures
          lower.includes('slack') ||
          lower.includes('channel:') ||
          lower.includes('@channel') ||
          lower.includes('@here') ||
          (sourceUrl && /(?:[a-z0-9-]+\.)?slack\.com/i.test(urlLower))
        ) {
          source = 'Slack';
        } else if (
          // 6. Gmail / Google signatures & general email fallback
          lower.includes('gmail') ||
          lower.includes('@google.com') ||
          (sourceUrl && /(?:mail)\.google\.com|gmail\.com/i.test(urlLower)) ||
          lower.includes('fwd:') ||
          lower.includes('from:') ||
          subject
        ) {
          source = 'Gmail';
        } else if (sourceUrl) {
          // 7. Standalone URL fallback -> Notes / Web
          source = 'Notes';
        }
      }
    }

    // Generate suggested title
    const effectiveSubject = subject ? subject.replace(/^(?:fwd|re):\s*/i, '').trim() : undefined;
    let suggestedTitle = '';

    if (effectiveSubject && effectiveSubject.length > 2) {
      suggestedTitle = effectiveSubject;
    } else {
      // Use cleaned text first line / first sentence
      const singleSpaced = (cleaned || text).replace(/\s+/g, ' ');
      const firstSentence = singleSpaced.split(/[.!?](?:\s|$)/)[0];
      const baseTitle = sender ? `${sender}: ${firstSentence}` : firstSentence;
      suggestedTitle = baseTitle.length > 74
        ? `${baseTitle.slice(0, 71).trim()}...`
        : baseTitle;
    }

    if (!suggestedTitle || suggestedTitle.length < 2) {
      suggestedTitle = 'Follow up on shared item';
    }

    // Deterministic ingest key: source + initial 32 chars + 15-second time bucket
    const timeBucket = Math.floor(Date.now() / this.DEDUP_WINDOW_MS);
    const keySeed = `${sourceUrl || ''}${cleaned.slice(0, 48)}${effectiveSubject || ''}`;
    const ingestKey = `${source}_${encodeURIComponent(keySeed)}_${timeBucket}`;

    return {
      rawText: raw,
      cleanedText: cleaned,
      suggestedTitle,
      sourceUrl,
      source,
      subject: effectiveSubject,
      sender,
      ingestKey,
    };
  }

  public shouldProcess(key: string, nowMs: number = Date.now()): boolean {
    // Purge expired keys
    for (const [k, timestamp] of Array.from(this.processedKeys.entries())) {
      if (nowMs - timestamp > this.DEDUP_WINDOW_MS) {
        this.processedKeys.delete(k);
      }
    }

    if (this.processedKeys.has(key)) {
      return false; // Duplicate within window
    }

    this.processedKeys.set(key, nowMs);
    return true;
  }

  public async getInitialShareIntent(): Promise<NormalizedSharePayload | null> {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (!initialUrl) return null;

      const parsed = Linking.parse(initialUrl);
      const query = parsed.queryParams || {};
      const rawText = String(
        query.text ||
        query.title ||
        query['android.intent.extra.TEXT'] ||
        query.extra_text ||
        ''
      );
      const url = query.url ? String(query.url) : undefined;
      const subject = query.subject || query['android.intent.extra.SUBJECT']
        ? String(query.subject || query['android.intent.extra.SUBJECT'])
        : undefined;
      const callerPackage = query.package || query.caller || query['android.intent.extra.PACKAGE_NAME'] || query['android.intent.extra.REFERRER']
        ? String(query.package || query.caller || query['android.intent.extra.PACKAGE_NAME'] || query['android.intent.extra.REFERRER'])
        : undefined;

      return this.normalizePayload(rawText, url, undefined, subject, callerPackage);
    } catch (e) {
      console.warn('[ShareIngestService] Failed to read initial share intent:', e);
      return null;
    }
  }
}

export const shareIngestService = new ShareIngestService();
