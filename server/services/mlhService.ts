import { chromium } from 'playwright';
import { NormalizedHackathon } from '../types';

const MLH_URL = 'https://mlh.io/seasons/2025/events';

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

    // Wait for event cards, increase timeout
    await page.waitForSelector('.event-wrapper', { timeout: 20000 }).catch(() =>
      console.log('No .event-wrapper found, page might be different or empty.')
    );

    const events = await page.evaluate(() => {
      const cards = document.querySelectorAll('.event-wrapper');
      const data: any[] = [];

      cards.forEach((card) => {
        const titleElement = card.querySelector('.event-name');
        const dateElement = card.querySelector('.event-date');
        const locationElement = card.querySelector('.event-location');
        const linkElement = card.querySelector('a.event-link');
        const imageElement = card.querySelector('.event-logo img');

        if (titleElement && linkElement) {
          const title = titleElement.textContent?.trim() || '';
          const dateStr = dateElement?.textContent?.trim() || '';
          const location = locationElement?.textContent?.trim() || 'Online';
          const url = (linkElement as HTMLAnchorElement).href;
          let imageUrl = (imageElement as HTMLImageElement)?.src || '';
          
          // Ensure absolute URL
          if (imageUrl && !imageUrl.startsWith('http')) {
              if (imageUrl.startsWith('//')) {
                  imageUrl = 'https:' + imageUrl;
              } else {
                  // If relative to domain, we might need base url, but usually they are absolute or protocol relative
                  // For now, leave as is if not protocol relative
              }
          }

          let mode: 'online' | 'offline' | 'hybrid' = 'offline';
          if (location.toLowerCase().includes('virtual') || location.toLowerCase().includes('online')) {
            mode = 'online';
          }

          // Pass raw date string to be parsed in Node.js
          data.push({
            title,
            organizer: 'MLH',
            description: `Join ${title}, an official MLH event!`,
            rawDate: dateStr, // Send raw date
            mode,
            isPaid: false,
            skills: [],
            registrationUrl: url,
            source: 'mlh',
            location,
            prize: '',
            imageUrl
          });
        }
      });
      return data;
    });

    console.log(`Found ${events.length} MLH events.`);

    // Helper to clean and parse dates
    const parseDate = (dateStr: string): { start: Date, end: Date } => {
        try {
            const currentYear = new Date().getFullYear();
            // Remove ordinal suffixes (st, nd, rd, th)
            const cleanDate = dateStr.replace(/(\d+)(st|nd|rd|th)/g, '$1').trim();
            
            let start: Date, end: Date;

            if (cleanDate.includes('-')) {
                const parts = cleanDate.split('-').map(s => s.trim());
                // Handle "Feb 10 - 12" (same month) vs "Feb 28 - Mar 2" (diff month)
                const startPart = parts[0];
                let endPart = parts[1];
                
                // If end part is just a number (e.g. "12"), append month from start
                if (/^\d+$/.test(endPart)) {
                    const startMonth = startPart.split(' ')[0];
                    endPart = `${startMonth} ${endPart}`;
                }

                start = new Date(`${startPart} ${currentYear}`);
                end = new Date(`${endPart} ${currentYear}`);
            } else {
                start = new Date(`${cleanDate} ${currentYear}`);
                end = new Date(`${cleanDate} ${currentYear}`);
            }

            // Validate dates
            if (isNaN(start.getTime())) start = new Date();
            if (isNaN(end.getTime())) end = new Date();

            return { start, end };
        } catch (e) {
            console.error(`Failed to parse date: ${dateStr}`, e);
            return { start: new Date(), end: new Date() };
        }
    };

    return events.map(e => {
        const { start, end } = parseDate(e.rawDate);
        return {
            title: e.title,
            organizer: e.organizer,
            description: e.description,
            startDate: start,
            endDate: end,
            mode: e.mode,
            isPaid: e.isPaid,
            skills: e.skills,
            registrationUrl: e.registrationUrl,
            source: e.source,
            location: e.location,
            prize: e.prize,
            imageUrl: e.imageUrl
        };
    });

  } catch (error) {
    console.error('Error scraping MLH:', error);
    return [];
  } finally {
    await browser.close();
  }
};
