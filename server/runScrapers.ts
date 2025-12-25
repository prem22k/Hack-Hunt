import dotenv from 'dotenv';
import path from 'path';

// Load .env file explicitly
const envPath = path.resolve(__dirname, '.env');
console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Warning: .env file not found or failed to load:', result.error.message);
}

import mongoose from 'mongoose';
import Hackathon from './models/Hackathon';
import { fetchMLHHackathons } from './services/mlhService';
import { fetchKaggleCompetitions } from './services/kaggleService';
import { scrapeDevpost } from './services/devpostService';
import { NormalizedHackathon } from './types';
import { connectDB } from './utils/db';

// Debug credentials (don't log the actual key in production)
console.log('Kaggle Config Check:', {
    username: process.env.KAGGLE_USERNAME || 'MISSING',
    key: process.env.KAGGLE_KEY ? 'PRESENT' : 'MISSING'
});

const saveHackathons = async (hackathons: NormalizedHackathon[], source: string) => {
  let savedCount = 0;
  let updatedCount = 0;
  
  console.log(`Processing ${hackathons.length} hackathons from ${source}...`);

  for (const hack of hackathons) {
    try {
      const result = await Hackathon.updateOne(
        { title: hack.title, startDate: hack.startDate, source: hack.source },
        { ...hack, lastUpdated: new Date() },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) savedCount++;
      else if (result.modifiedCount > 0) updatedCount++;
      
    } catch (error) {
      console.error(`Error saving hackathon ${hack.title}:`, error);
    }
  }
  console.log(`[${source}] New: ${savedCount}, Updated: ${updatedCount}, Total Fetched: ${hackathons.length}`);
  return { savedCount, updatedCount };
};

const run = async () => {
  try {
    await connectDB();
    console.log('Starting scraper job...');

    // Get arguments from command line (skipping node and script path)
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
            await saveHackathons(mlhData, 'MLH');
        } catch (e) {
            console.error('Failed to fetch MLH:', e);
        }
    } else {
        console.log('Skipping MLH...');
    }

    // Kaggle
    if (scrapersToRun.kaggle) {
        console.log('Fetching Kaggle...');
        try {
            const kaggleData = await fetchKaggleCompetitions();
            await saveHackathons(kaggleData, 'Kaggle');
        } catch (e) {
            console.error('Failed to fetch Kaggle:', e);
        }
    } else {
        console.log('Skipping Kaggle...');
    }

    // Devpost
    if (scrapersToRun.devpost) {
        console.log('Scraping Devpost...');
        try {
            const devpostData = await scrapeDevpost();
            await saveHackathons(devpostData, 'Devpost');
        } catch (e) {
            console.error('Failed to scrape Devpost:', e);
        }
    } else {
        console.log('Skipping Devpost...');
    }

    console.log('All selected scrapers completed.');
    process.exit(0);
  } catch (error) {
    console.error('Scraper job failed:', error);
    process.exit(1);
  }
};

run();
