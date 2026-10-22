import axios from 'axios';
import { NormalizedHackathon } from '../types';

// Devpost exposes a public JSON endpoint for hackathons, so no headless
// browser is required: `GET https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&page=N`
const DEVPOST_API_URL = 'https://devpost.com/api/hackathons';
const MAX_PAGES = 3;

const MONTHS: Record<string, number | undefined> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

interface MonthDayYear {
  month: number;
  day: number;
  year: number | null;
}

interface DevpostApiLocation {
  icon?: string;
  location?: string;
}

interface DevpostApiHackathon {
  id?: number;
  title?: string;
  url?: string;
  displayed_location?: DevpostApiLocation | null;
  open_state?: string;
  thumbnail_url?: string;
  submission_period_dates?: string;
  themes?: Array<{ id?: number; name?: string }> | null;
  prize_amount?: string | null;
  organization_name?: string | null;
  registrations_count?: number;
  invite_only?: boolean;
}

interface DevpostApiResponse {
  hackathons?: DevpostApiHackathon[] | null;
  meta?: Record<string, unknown>;
}

// Pure helper: parses Devpost submission periods such as
// "Aug 31 - Oct 23, 2026", "Oct 05 - 27, 2026", "Sep 30 - Oct 30, 2026",
// "Dec 20, 2026 - Jan 05, 2027" or a single date like "Nov 02, 2026".
// Dates are built in UTC so parsing is independent of the server timezone.
export const parseDevpostPeriod = (
  period: string
): { start: Date; end: Date } | null => {
  if (typeof period !== 'string') return null;
  const raw = period.replace(/[\u2013\u2014]/g, '-').trim();
  if (!raw) return null;

  const currentYear = new Date().getUTCFullYear();

  const toDate = (month: number, day: number, year: number): Date | null => {
    if (
      month < 0 || month > 11 ||
      day < 1 || day > 31 ||
      year < 2000 || year > 2100
    ) {
      return null;
    }
    const date = new Date(Date.UTC(year, month, day));
    // Reject rollovers such as Feb 30 silently becoming Mar 2.
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date;
  };

  const segments = raw
    .split('-')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  // Single date: "Nov 02, 2026"
  if (segments.length === 1) {
    const parsed = parseMonthDayYear(raw);
    if (!parsed) return null;
    const date = toDate(parsed.month, parsed.day, parsed.year ?? currentYear);
    return date ? { start: date, end: date } : null;
  }

  if (segments.length !== 2) return null;
  const [left, right] = segments;

  const startParsed = parseMonthDayYear(left);
  if (!startParsed) return null;

  // The right side is either a full date ("Oct 23, 2026"), a day-only
  // token ("27, 2026"), or something unparseable.
  const rightParsed = parseMonthDayYear(right);
  const rightDayOnly = rightParsed ? null : parseDayOnly(right);

  const startYear =
    startParsed.year ?? rightParsed?.year ?? rightDayOnly?.year ?? currentYear;
  const startDate = toDate(startParsed.month, startParsed.day, startYear);
  if (!startDate) return null;

  let endMonth: number;
  let endDay: number;
  let endYear: number;

  if (rightParsed) {
    endMonth = rightParsed.month;
    endDay = rightParsed.day;
    // Cross-year range without an explicit end year: "Dec 20, 2026 - Jan 05"
    endYear = rightParsed.year ?? (endMonth < startParsed.month ? startYear + 1 : startYear);
  } else if (rightDayOnly) {
    // Day-only end stays within the start month: "Oct 05 - 27, 2026"
    endMonth = startParsed.month;
    endDay = rightDayOnly.day;
    endYear = rightDayOnly.year ?? startYear;
  } else {
    return null;
  }

  const endDate = toDate(endMonth, endDay, endYear);
  if (!endDate || endDate.getTime() < startDate.getTime()) return null;

  return { start: startDate, end: endDate };
};

// "Aug 31", "Oct 23, 2026", "Jan 05" -> month/day (year only from the same token).
// Anchored to the whole token so leftover text (e.g. "Jan 01, 9999") is rejected
// instead of being silently ignored.
const parseMonthDayYear = (text: string): MonthDayYear | null => {
  const match = text
    .trim()
    .match(
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/i
    );
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (month === undefined) return null;
  const day = Number(match[2]);
  if (day < 1 || day > 31) return null;
  return { month, day, year: match[3] ? Number(match[3]) : null };
};

// "27, 2026" or "05" -> day only (start month/year provide the rest).
// Anchored to the whole token so trailing junk is rejected.
const parseDayOnly = (text: string): { day: number; year: number | null } | null => {
  const match = text.trim().match(/^(\d{1,2})(?:\s*,?\s*(\d{4}))?$/);
  if (!match) return null;
  const day = Number(match[1]);
  if (day < 1 || day > 31) return null;
  return { day, year: match[2] ? Number(match[2]) : null };
};

// prize_amount arrives as HTML, e.g. "$<span data-currency-value>138,000</span>"
const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

// thumbnail_url is protocol-relative (e.g. "//d112y698adiu2z.cloudfront.net/...png")
const toHttpUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  return url.startsWith('//') ? `https:${url}` : url;
};

// KEPT EXPORT NAME: scrapeDevpost — runScrapers.ts and the cron depend on it.
export const scrapeDevpost = async (): Promise<NormalizedHackathon[]> => {
  const rawHackathons: DevpostApiHackathon[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      console.log(`Fetching Devpost hackathons page ${page}...`);
      const response = await axios.get<DevpostApiResponse>(
        `${DEVPOST_API_URL}?status[]=upcoming&status[]=open&page=${page}`,
        {
          headers: { Accept: 'application/json' },
          timeout: 15000
        }
      );
      const items = response.data?.hackathons;
      if (!Array.isArray(items) || items.length === 0) break;
      rawHackathons.push(...items);
    } catch (error) {
      console.error(`Error fetching Devpost page ${page}:`, error);
      break;
    }
  }

  if (rawHackathons.length === 0) {
    console.warn('No Devpost hackathons were returned by the API.');
    return [];
  }

  console.log(`Received ${rawHackathons.length} Devpost hackathons from the API.`);

  const hackathons: NormalizedHackathon[] = [];

  for (const item of rawHackathons) {
    if (item.invite_only) continue;
    const title = item.title?.trim();
    const url = item.url?.trim();
    if (!title || !url) continue;

    const period = parseDevpostPeriod(item.submission_period_dates || '');
    if (!period) {
      console.warn(`Skipping "${title}": unparseable submission period "${item.submission_period_dates}".`);
      continue;
    }

    const location = item.displayed_location?.location?.trim() || 'Online';
    const prize = item.prize_amount ? stripHtml(item.prize_amount) : '';
    const imageUrl = toHttpUrl(item.thumbnail_url);

    const hackathon: NormalizedHackathon = {
      title,
      organizer: item.organization_name?.trim() || 'Devpost',
      description: `${title} — hosted on Devpost`,
      startDate: period.start,
      endDate: period.end,
      mode: location.toLowerCase().includes('online') ? 'online' : 'offline',
      isPaid: false,
      skills: (item.themes ?? [])
        .map((theme) => theme?.name?.trim())
        .filter((name): name is string => typeof name === 'string' && name.length > 0),
      registrationUrl: url,
      source: 'devpost',
      location
    };

    if (prize) hackathon.prize = prize;
    if (imageUrl) hackathon.imageUrl = imageUrl;

    hackathons.push(hackathon);
  }

  console.log(`Found ${hackathons.length} normalized Devpost hackathons.`);

  return hackathons;
};
