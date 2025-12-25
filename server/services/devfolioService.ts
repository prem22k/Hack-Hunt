import { chromium } from 'playwright';
import { NormalizedHackathon } from '../types';

const DEVFOLIO_URL = 'https://devfolio.co/hackathons';

export const scrapeDevfolio = async (): Promise<NormalizedHackathon[]> => {
  console.log('Launching browser for Devfolio...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${DEVFOLIO_URL}...`);
    await page.goto(DEVFOLIO_URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for some content to load
    try {
        await page.waitForSelector('div[role="button"], a[href*="devfolio.co"]', { timeout: 15000 });
    } catch (e) {
        console.log('Devfolio: Timeout waiting for specific selectors, proceeding with available DOM.');
    }

    const hackathons = await page.evaluate(() => {
      const data: any[] = [];
      // Strategy: Find all anchor tags that look like hackathon links
      // Devfolio hackathon links usually look like "https://hackname.devfolio.co"
      const links = Array.from(document.querySelectorAll('a'));
      
      const hackathonLinks = links.filter(a => 
        a.href.includes('.devfolio.co') && 
        !a.href.includes('devfolio.co/hackathons') && // Exclude self
        !a.href.includes('devfolio.co/blog') // Exclude blog
      );

      // Deduplicate based on href
      const uniqueLinks = new Set();
      
      hackathonLinks.forEach(link => {
        if (uniqueLinks.has(link.href)) return;
        
        // Try to find the card container (usually a parent div)
        // We'll traverse up a few levels to find a container that has text content
        let container = link.parentElement;
        let depth = 0;
        while (container && depth < 5) {
            // Heuristic: A card usually has some height and contains text
            if (container.innerText.length > 20 && container.getBoundingClientRect().height > 100) {
                break;
            }
            container = container.parentElement;
            depth++;
        }

        if (container) {
            uniqueLinks.add(link.href);
            const text = container.innerText;
            const lines = text.split('\n').filter(l => l.trim().length > 0);
            
            // Heuristic extraction
            // Title is usually the largest text or first line
            const title = lines[0] || 'Untitled Hackathon';
            
            // Date usually contains months
            const dateLine = lines.find(l => 
                /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(l) && 
                /\d/.test(l)
            ) || '';

            // Location
            const location = lines.find(l => /Online|Hybrid|In-person/i.test(l)) || 'Online';

            data.push({
                title,
                url: link.href,
                dateStr: dateLine,
                location,
                rawText: text
            });
        }
      });

      return data;
    });

    console.log(`Found ${hackathons.length} potential Devfolio hackathons.`);

    return hackathons.map(h => {
        const currentYear = new Date().getFullYear();
        let startDate = new Date();
        let endDate = new Date();

        // Basic date parsing from the extracted line
        if (h.dateStr) {
            try {
                // Remove "Apply by" etc
                const cleanDate = h.dateStr.replace(/Apply by|Starts|Ends/gi, '').trim();
                const parts = cleanDate.split('-').map((s: string) => s.trim());
                if (parts.length >= 1) {
                    startDate = new Date(`${parts[0]} ${currentYear}`);
                    endDate = parts.length > 1 ? new Date(`${parts[1]} ${currentYear}`) : startDate;
                }
            } catch (e) {
                // Keep defaults
            }
        }

        let mode: 'online' | 'offline' | 'hybrid' = 'offline';
        if (h.location.toLowerCase().includes('online')) mode = 'online';
        else if (h.location.toLowerCase().includes('hybrid')) mode = 'hybrid';

        return {
            title: h.title,
            organizer: 'Devfolio',
            description: `Check out ${h.title} on Devfolio!`,
            startDate,
            endDate,
            mode,
            isPaid: false,
            skills: [],
            registrationUrl: h.url,
            source: 'devfolio',
            location: h.location,
            prize: 'See details',
            imageUrl: ''
        };
    });

  } catch (error) {
    console.error('Error scraping Devfolio:', error);
    return [];
  } finally {
    await browser.close();
  }
};
