import { chromium } from 'playwright';
import { NormalizedHackathon } from '../types';

// MLH seasons start mid-year: events from ~July 2026 onwards are listed under the 2027 season.
const currentSeason = () => {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
};

const MLH_URL = `https://mlh.io/seasons/${currentSeason()}/events`;

export const fetchMLHHackathons = async (): Promise<NormalizedHackathon[]> => {
  console.log('Launching browser for MLH...');
  // Try to launch without sandbox if dependencies are missing
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${MLH_URL}...`);

    // Use 'load' instead of 'networkidle' to avoid infinite wait
    await page.goto(MLH_URL, { waitUntil: 'load', timeout: 60000 });

    // MLH marks every event card up as schema.org/Event microdata, which is far more
    // stable than their CSS class names (the old .event-wrapper selector stopped matching).
    await page.waitForSelector('[itemtype="https://schema.org/Event"]', { timeout: 20000 }).catch(() =>
      console.log('No schema.org Event cards found, page might be different or empty.')
    );

    const events = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[itemtype="https://schema.org/Event"]'));
      const data: any[] = [];

      cards.forEach((card) => {
        // Only read props that belong to this Event, not to the nested Place/PostalAddress scopes
        const prop = (name: string) => {
          const el = Array.from(card.querySelectorAll(`[itemprop="${name}"]`)).find(
            (node) => node.parentElement?.closest('[itemscope]') === card
          );
          return el ? (el.getAttribute('content') || el.textContent || '').trim() : '';
        };
        const address = (name: string) =>
          card.querySelector(`[itemprop="location"] [itemprop="${name}"]`)?.getAttribute('content') || '';

        // The Event scope has no itemprop="name" (only the nested Place does); the title is the card heading
        const title = prop('name') || card.querySelector('h1, h2, h3, h4')?.textContent?.trim() || '';
        const url = prop('url') || (card as HTMLAnchorElement).href || '';
        if (!title || !url) return;

        const attendance = prop('eventAttendanceMode');
        const mode = attendance.includes('Online') ? 'online' : attendance.includes('Mixed') ? 'hybrid' : 'offline';
        const location =
          mode === 'online' ? 'Online' : [address('addressLocality'), address('addressRegion')].filter(Boolean).join(', ') || 'TBA';

        data.push({
          title,
          organizer: 'MLH',
          description: `Join ${title}, an official MLH event!`,
          startDate: prop('startDate'),
          endDate: prop('endDate'),
          mode,
          isPaid: prop('isAccessibleForFree') === 'false',
          skills: [],
          registrationUrl: url,
          source: 'mlh',
          location,
          prize: '',
          imageUrl: prop('image')
        });
      });
      return data;
    });

    console.log(`Found ${events.length} MLH events.`);

    const toDate = (iso: string) => {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    return events.map(e => ({
      title: e.title,
      organizer: e.organizer,
      description: e.description,
      startDate: toDate(e.startDate),
      endDate: toDate(e.endDate || e.startDate),
      mode: e.mode,
      isPaid: e.isPaid,
      skills: e.skills,
      registrationUrl: e.registrationUrl,
      source: e.source,
      location: e.location,
      prize: e.prize,
      imageUrl: e.imageUrl
    }));

  } catch (error) {
    console.error('Error scraping MLH:', error);
    return [];
  } finally {
    await browser.close();
  }
};
