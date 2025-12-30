import { chromium } from 'playwright';
import { NormalizedHackathon } from '../types';

const DEVPOST_URL = 'https://devpost.com/hackathons';

export const scrapeDevpost = async (): Promise<NormalizedHackathon[]> => {
  console.log('Launching browser for Devpost...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${DEVPOST_URL}...`);
    await page.goto(DEVPOST_URL, { waitUntil: 'domcontentloaded' });

    // Wait for tiles
    // Devpost often uses .hackathon-tile or similar.
    // Let's try to wait for something generic if specific class fails, but .hackathon-tile is standard.
    try {
        await page.waitForSelector('.hackathon-tile', { timeout: 10000 });
    } catch (e) {
        console.log('Timeout waiting for .hackathon-tile. Page might have changed layout.');
    }

    const hackathons = await page.evaluate(() => {
      const tiles = document.querySelectorAll('.hackathon-tile');
      const data: any[] = [];

      tiles.forEach((tile) => {
        const titleElement = tile.querySelector('.main-content h3');
        const urlElement = tile.querySelector('a.tile-anchor'); // Usually the whole tile is a link or has an anchor
        const locationElement = tile.querySelector('.info .location');
        const prizeElement = tile.querySelector('.prize-amount');
        const dateElement = tile.querySelector('.submission-period');
        const imageElement = tile.querySelector('.tile-img');

        if (titleElement && urlElement) {
          const title = titleElement.textContent?.trim() || '';
          const url = (urlElement as HTMLAnchorElement).href;
          const location = locationElement?.textContent?.trim() || 'Online';
          const prize = prizeElement?.textContent?.trim() || '';
          const dateStr = dateElement?.textContent?.trim() || '';
          
          // Image extraction: Try img src first, then background-image
          let imageUrl = (imageElement as HTMLImageElement)?.src || '';
          if (!imageUrl) {
             const bgElement = tile.querySelector('.hackathon-tile-background');
             if (bgElement) {
                 const style = window.getComputedStyle(bgElement);
                 const bgImage = style.backgroundImage; // url("...")
                 if (bgImage && bgImage !== 'none') {
                     imageUrl = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
                 }
             }
          }
          // Fallback to a default Devpost image if needed, or keep empty
          if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
          }

          // Devpost dates are tricky "Feb 10 - 12, 2025" or "Feb 10 - Mar 1, 2025"
          // Placeholder dates for now as parsing is complex without a library
          const startDate = new Date().toISOString(); 
          const endDate = new Date().toISOString();

          let mode: 'online' | 'offline' | 'hybrid' = 'offline';
          if (location.toLowerCase().includes('online')) {
            mode = 'online';
          }

          data.push({
            title,
            organizer: 'Devpost',
            description: `Check out ${title} on Devpost!`,
            startDate,
            endDate,
            mode,
            isPaid: false,
            skills: [],
            registrationUrl: url,
            source: 'devpost',
            location,
            prize,
            imageUrl
          });
        }
      });
      return data;
    });

    console.log(`Found ${hackathons.length} Devpost hackathons.`);

    return hackathons.map(h => ({
        ...h,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate)
    }));

  } catch (error) {
    console.error('Error scraping Devpost:', error);
    return [];
  } finally {
    await browser.close();
  }
};
