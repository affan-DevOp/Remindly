import * as chrono from 'chrono-node';
import { cleanBoilerplate, sanitizeUrl } from '../services/shareIngestService';

export type ParseKind = 'datetime' | 'date_only' | 'ambiguous' | 'none';

export interface ParsedCandidate {
  matchedText: string;
  startIndex: number;
  endIndex: number;
  instantUtc: string;
  localDate: string;
  localTime: string;
  kind: 'datetime' | 'date_only';
  needsTimeConfirmation: boolean;
}

export interface ParseResult {
  kind: ParseKind;
  rawText: string;
  cleanedText: string;
  suggestedTitle: string;
  primaryCandidate: ParsedCandidate | null;
  candidates: ParsedCandidate[];
  sourceUrl?: string;
  sender?: string;
}

function pad(num: number): string {
  return num < 10 ? '0' + num : String(num);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseCaptureText(
  rawText: string,
  referenceDate: Date = new Date(),
  timezone: string = 'Asia/Kolkata',
  settings?: { defaultDateOnlyTime?: string }
): ParseResult {
  const text = (rawText || '').trim();
  const defaultTime = settings?.defaultDateOnlyTime || '09:00';
  const [defaultHour, defaultMinute] = defaultTime.split(':').map((n) => parseInt(n, 10) || 0);

  // 1. Extract embedded URLs
  let sourceUrl: string | undefined;
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    sourceUrl = sanitizeUrl(urlMatch[0]);
  }

  // 2. Clean leading message boilerplate (WhatsApp timestamps, Fwd: headers)
  const { cleaned, sender } = cleanBoilerplate(text);

  // 3. Run chrono with forwardDate: true relative to injected reference instant
  const parsedResults = chrono.parse(cleaned, { instant: referenceDate, timezone }, { forwardDate: true });

  const refMs = referenceDate.getTime();
  const validCandidates: ParsedCandidate[] = [];

  for (const res of parsedResults) {
    const matchedText = res.text;
    const lowerMatched = matchedText.toLowerCase();

    // Check if user specified explicit time or vague time of day
    const hasExplicitHour = res.start.isCertain('hour');
    const isMorning = lowerMatched.includes('morning');
    const isAfternoon = lowerMatched.includes('afternoon');
    const isEvening = lowerMatched.includes('evening');
    const isNight = lowerMatched.includes('night');

    const d = res.start.date();
    let kind: 'datetime' | 'date_only' = 'datetime';
    let needsTimeConfirmation = false;

    if (!hasExplicitHour) {
      kind = 'date_only';
      needsTimeConfirmation = true;

      if (isMorning) {
        d.setHours(9, 0, 0, 0);
      } else if (isAfternoon) {
        d.setHours(14, 0, 0, 0);
      } else if (isEvening) {
        d.setHours(18, 0, 0, 0);
      } else if (isNight) {
        d.setHours(21, 0, 0, 0);
      } else {
        d.setHours(defaultHour, defaultMinute, 0, 0);
      }
    }

    // Filter out past dates (allowing a grace margin of 30 seconds for immediate parses)
    if (d.getTime() < refMs - 30000) {
      continue;
    }

    validCandidates.push({
      matchedText,
      startIndex: res.index,
      endIndex: res.index + matchedText.length,
      instantUtc: d.toISOString(),
      localDate: formatDate(d),
      localTime: formatTime(d),
      kind,
      needsTimeConfirmation,
    });
  }

  // 4. Classify overall result
  let kind: ParseKind = 'none';
  let primaryCandidate: ParsedCandidate | null = null;

  if (validCandidates.length === 1) {
    primaryCandidate = validCandidates[0];
    kind = primaryCandidate.kind;
  } else if (validCandidates.length > 1) {
    // Check if dates are identical
    const uniqueInstants = new Set(validCandidates.map((c) => c.instantUtc));
    if (uniqueInstants.size === 1) {
      primaryCandidate = validCandidates[0];
      kind = primaryCandidate.kind;
    } else {
      kind = 'ambiguous';
      primaryCandidate = validCandidates[0];
    }
  }

  // 5. Smart Title Extraction:
  // Remove matched date/time phrase only if remaining title is meaningful (>= 4 characters)
  let titleCandidate = cleaned;
  if (primaryCandidate && kind !== 'ambiguous') {
    const stripped = (
      cleaned.slice(0, primaryCandidate.startIndex) +
      ' ' +
      cleaned.slice(primaryCandidate.endIndex)
    )
      .replace(/\s+/g, ' ')
      .replace(/^(?:by|at|on|due|for|before|until)\s+/i, '')
      .replace(/\s+(?:by|at|on|due|for|before|until)$/i, '')
      .trim();

    // If stripping date left enough meaningful words, use stripped text
    if (stripped.length >= 4 && !/^[.,:;!?-]+$/.test(stripped)) {
      titleCandidate = stripped;
    }
  }

  // Remove URLs from title candidate
  titleCandidate = titleCandidate.replace(/https?:\/\/[^\s]+/gi, '').replace(/\s+/g, ' ').trim();

  // Strip trailing & leading prepositions left behind (e.g. "by", "before", "for", "at", "on", "until")
  titleCandidate = titleCandidate
    .replace(/\s+(?:by|at|on|due|for|before|until)$/i, '')
    .replace(/^(?:by|at|on|due|for|before|until)\s+/i, '')
    .trim();

  // If titleCandidate is empty, fallback to first line of text
  if (!titleCandidate || titleCandidate.length < 3) {
    titleCandidate = cleaned.split(/\r?\n/)[0].replace(/https?:\/\/[^\s]+/gi, '').trim();
  }

  if (!titleCandidate || titleCandidate.length < 2) {
    titleCandidate = 'Follow up on shared item';
  }

  // Prefix sender if available
  const suggestedTitle = sender ? `${sender}: ${titleCandidate}` : titleCandidate;

  return {
    kind,
    rawText: text,
    cleanedText: cleaned,
    suggestedTitle,
    primaryCandidate,
    candidates: validCandidates,
    sourceUrl,
    sender,
  };
}
