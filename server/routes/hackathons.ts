import express, { Request, Response } from 'express';
import { db } from '../firebaseAdmin';

const router = express.Router();

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
