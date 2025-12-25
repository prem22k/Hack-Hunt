import cron from 'node-cron';
import Hackathon from '../models/Hackathon';
import { fetchMLHHackathons } from '../services/mlhService';
import { fetchKaggleCompetitions } from '../services/kaggleService';
import { scrapeDevpost } from '../services/devpostService';
import { NormalizedHackathon } from '../types';

const saveHackathons = async (hackathons: NormalizedHackathon[]) => {
  for (const hack of hackathons) {
    try {
      await Hackathon.findOneAndUpdate(
        { title: hack.title, startDate: hack.startDate, source: hack.source },
        { ...hack, lastUpdated: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      console.error(`Error saving hackathon ${hack.title}:`, error);
    }
  }
};

export const startScheduler = () => {
  // Run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running hackathon fetch job...');
    
    console.log('Fetching MLH...');
    const mlhData = await fetchMLHHackathons();
    await saveHackathons(mlhData);

    console.log('Fetching Kaggle...');
    const kaggleData = await fetchKaggleCompetitions();
    await saveHackathons(kaggleData);

    console.log('Scraping Devpost...');
    const devpostData = await scrapeDevpost();
    await saveHackathons(devpostData);

    console.log('Hackathon fetch job completed.');
  });
};
