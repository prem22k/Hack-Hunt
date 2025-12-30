import cron from 'node-cron';
import { db } from '../firebaseAdmin';
import { fetchMLHHackathons } from '../services/mlhService';
import { fetchKaggleCompetitions } from '../services/kaggleService';
import { scrapeDevpost } from '../services/devpostService';
import { NormalizedHackathon } from '../types';

const saveToFirestore = async (hackathons: NormalizedHackathon[], source: string) => {
  if (hackathons.length === 0) {
    console.log(`No hackathons to save for ${source}.`);
    return;
  }

  console.log(`Saving ${hackathons.length} hackathons from ${source} to Firestore...`);
  
  const batchSize = 400; // Conservative batch limit
  const chunks = [];
  
  for (let i = 0; i < hackathons.length; i += batchSize) {
      chunks.push(hackathons.slice(i, i + batchSize));
  }

  for (const chunk of chunks) {
      const batch = db.batch();
      
      chunk.forEach(hack => {
          const slug = hack.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const docId = `${source.toLowerCase()}-${slug}`;
          const docRef = db.collection('hackathons').doc(docId);
          
          batch.set(docRef, {
              ...hack,
              updatedAt: new Date()
          }, { merge: true });
      });

      try {
          await batch.commit();
          console.log(`Batch committed successfully.`);
      } catch (error) {
          console.error(`Error committing batch for ${source}:`, error);
      }
  }
};

export const startScheduler = () => {
  // Run every 24 hours at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily hackathon fetch job...');
    
    try {
      console.log('Fetching MLH...');
      const mlhData = await fetchMLHHackathons();
      await saveToFirestore(mlhData, 'MLH');
    } catch (e) { console.error('Error fetching MLH:', e); }

    try {
      console.log('Fetching Kaggle...');
      const kaggleData = await fetchKaggleCompetitions();
      await saveToFirestore(kaggleData, 'Kaggle');
    } catch (e) { console.error('Error fetching Kaggle:', e); }

    try {
      console.log('Scraping Devpost...');
      const devpostData = await scrapeDevpost();
      await saveToFirestore(devpostData, 'Devpost');
    } catch (e) { console.error('Error fetching Devpost:', e); }

    console.log('Hackathon fetch job completed.');
  });
};
