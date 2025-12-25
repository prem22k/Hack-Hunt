import express, { Request, Response } from 'express';
import Hackathon from '../models/Hackathon';

const router = express.Router();

// GET all hackathons with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { skills, mode, isPaid, source } = req.query;
    const query: any = {};

    if (skills) {
      // Assuming skills is a comma-separated string
      const skillsArray = (skills as string).split(',').map(s => s.trim());
      query.skills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
    }

    if (mode) {
      query.mode = mode;
    }

    if (isPaid !== undefined) {
      query.isPaid = isPaid === 'true';
    }

    if (source) {
      query.source = source;
    }

    const hackathons = await Hackathon.find(query).sort({ startDate: 1 });
    res.json(hackathons);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single hackathon
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
        res.status(404).json({ message: 'Hackathon not found' });
        return;
    }
    res.json(hackathon);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
