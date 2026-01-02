import express, { Request, Response } from 'express';
import { db } from '../firebaseAdmin';
import { runAllScrapers } from '../cron/scheduler';
import { getRecommendedHackathons } from '../services/recommendationService';
import { NormalizedHackathon } from '../types';

const router = express.Router();

// Trigger Scrapers Manually
router.all('/scrape', async (req: Request, res: Response) => {
  try {
    console.log('Manual scrape triggered via API');
    // Run in background to avoid timeout
    runAllScrapers().catch(err => console.error('Manual scrape failed:', err));
    res.json({ message: 'Scraping started in background. Check server logs for progress.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get AI Recommendations
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { userSkills, userLocation, filters } = req.body;

    if (!userSkills || !Array.isArray(userSkills) || userSkills.length === 0) {
      res.status(400).json({ message: 'Invalid userSkills. Must be a non-empty array of strings.' });
      return;
    }

    // Fetch all hackathons to analyze
    const snapshot = await db.collection('hackathons').get();
    let hackathons = snapshot.docs.map(doc => doc.data() as NormalizedHackathon);

    // Apply User Filters (Pre-AI)
    if (filters) {
      if (filters.mode) {
        hackathons = hackathons.filter(h => h.mode && h.mode.toLowerCase() === filters.mode.toLowerCase());
      }
      if (filters.isPaid !== undefined) {
        hackathons = hackathons.filter(h => h.isPaid === filters.isPaid);
      }
      if (filters.location) {
        const filterLoc = filters.location.toLowerCase();
        hackathons = hackathons.filter(h => h.location && h.location.toLowerCase().includes(filterLoc));
      }
      // Add more filters as needed
    }

    const recommendations = await getRecommendedHackathons(userSkills, hackathons, userLocation);
    res.json(recommendations);
  } catch (err: any) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET all hackathons with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { skills, mode, isPaid, source } = req.query;
    
    let query: FirebaseFirestore.Query = db.collection('hackathons');

    // Apply filters
    if (mode) {
      query = query.where('mode', '==', mode);
    }

    if (isPaid !== undefined) {
      const isPaidBool = isPaid === 'true';
      query = query.where('isPaid', '==', isPaidBool);
    }

    if (source) {
      query = query.where('source', '==', source);
    }

    // Handle skills filter
    if (skills) {
       const skillsArray = (skills as string).split(',').map(s => s.trim());
       if (skillsArray.length > 0) {
         // Note: Firestore allows only one 'array-contains-any' per query
         query = query.where('skills', 'array-contains-any', skillsArray);
       }
    }

    const snapshot = await query.get();
    
    const hackathons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Handle Firestore Timestamps safely
        startDate: data.startDate?.toDate ? data.startDate.toDate() : data.startDate,
        endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
        lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : data.lastUpdated,
      };
    });

    res.json(hackathons);
  } catch (err: any) {
    console.error('Error fetching hackathons:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET a single hackathon
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('hackathons').doc(req.params.id).get();
    
    if (!doc.exists) {
        res.status(404).json({ message: 'Hackathon not found' });
        return;
    }
    
    const data = doc.data();
    res.json({
        id: doc.id,
        ...data,
        startDate: data?.startDate?.toDate ? data.startDate.toDate() : data?.startDate,
        endDate: data?.endDate?.toDate ? data.endDate.toDate() : data?.endDate,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
