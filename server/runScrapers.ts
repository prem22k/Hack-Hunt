import dotenv from 'dotenv';
import path from 'path';

// Load .env file explicitly
const envPath = path.resolve(__dirname, '.env');
console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Warning: .env file not found or failed to load:', result.error.message);
}

import { db } from './firebaseAdmin';
import { fetchMLHHackathons } from './services/mlhService';
import { fetchKaggleCompetitions } from './services/kaggleService';
import { scrapeDevpost } from './services/devpostService';
import { NormalizedHackathon } from './types';

// Debug credentials
console.log('Kaggle Config Check:', {
    username: process.env.KAGGLE_USERNAME || 'MISSING',
    key: process.env.KAGGLE_KEY ? 'PRESENT' : 'MISSING'
});

const saveToFirestore = async (hackathons: NormalizedHackathon[], source: string) => {
  if (hackathons.length === 0) {
    console.log(`No hackathons to save for ${source}.`);
    return;
  }

  console.log(`Saving ${hackathons.length} hackathons from ${source} to Firestore...`);
  
  const batchSize = 500; // Firestore batch limit
  let batch = db.batch();
  let count = 0;
  let totalSaved = 0;

  for (const hack of hackathons) {
    // Create a unique ID: source-slugified_title
    const slug = hack.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const docId = `${source.toLowerCase()}-${slug}`;
    const docRef = db.collection('hackathons').doc(docId);

    batch.set(docRef, {
      ...hack,
      updatedAt: new Date()
    }, { merge: true });

    count++;

    if (count >= batchSize) {
      await batch.commit();
      totalSaved += count;
      console.log(`Committed batch of ${count} documents.`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    totalSaved += count;
    console.log(`Committed final batch of ${count} documents.`);
  }

  console.log(`[${source}] Successfully saved ${totalSaved} documents.`);
};

const run = async () => {
  try {
    console.log('Starting scraper job...');

    // Get arguments from command line
    const args = process.argv.slice(2);
    const runAll = args.length === 0;
    
    const scrapersToRun = {
        mlh: runAll || args.includes('mlh'),
        kaggle: runAll || args.includes('kaggle'),
        devpost: runAll || args.includes('devpost')
    };

    console.log('Scrapers selected:', Object.keys(scrapersToRun).filter(k => scrapersToRun[k as keyof typeof scrapersToRun]).join(', '));

    // MLH
    if (scrapersToRun.mlh) {
        console.log('Fetching MLH...');
        try {
            const mlhData = await fetchMLHHackathons();
            await saveToFirestore(mlhData, 'MLH');
        } catch (e) {
            console.error('Failed to fetch MLH:', e);
        }
    }

    // Kaggle
    if (scrapersToRun.kaggle) {
        console.log('Fetching Kaggle...');
        try {
            const kaggleData = await fetchKaggleCompetitions();
            await saveToFirestore(kaggleData, 'Kaggle');
        } catch (e) {
            console.error('Failed to fetch Kaggle:', e);
        }
    }

    // Devpost
    if (scrapersToRun.devpost) {
        console.log('Scraping Devpost...');
        try {
            const devpostData = await scrapeDevpost();
            await saveToFirestore(devpostData, 'Devpost');
        } catch (e) {
            console.error('Failed to scrape Devpost:', e);
        }
    }

    console.log('Scraping job finished.');
    process.exit(0);

  } catch (error) {
    console.error('Fatal error in scraper job:', error);
    process.exit(1);
  }
};

run();
