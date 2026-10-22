import express from 'express';
import { db } from '../firebaseAdmin';
import { parseUserIntent } from '../services/intentService';
import { hasPrizeValue, matchesSearchTerm } from '../utils/searchMatch';

const router = express.Router();

router.post('/smart', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }

        // 1. Parse Intent
        const intent = await parseUserIntent(query);
        console.log("Parsed Intent:", intent);

        const hackathonsRef = db.collection('hackathons');
        
        // Fetch all hackathons to filter in memory
        // This allows for the complex "OR" logic and fuzzy matching that Firestore lacks
        const snapshot = await hackathonsRef.get();
        const allHackathons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const filtered = allHackathons.filter((h: any) => {
            // 1. Location / Mode Logic
            let locationMatch = true;
            if (intent.location) {
                const userLoc = intent.location.toLowerCase();
                const hLoc = (h.location || "").toLowerCase();
                const hMode = (h.mode || "").toLowerCase();
                
                const isLocal = hLoc.includes(userLoc);
                const isOnline = hMode === 'online' || hLoc.includes('online') || hLoc === 'worldwide';
                
                // The "OR" Logic:
                // Show if it matches location OR if it is online (and we want to include online)
                if (intent.includeOnline) {
                    locationMatch = isLocal || isOnline;
                } else {
                    locationMatch = isLocal;
                }
            } else if (intent.isOnline) {
                // If user explicitly asked for online but NO location
                const hMode = (h.mode || "").toLowerCase();
                const hLoc = (h.location || "").toLowerCase();
                locationMatch = hMode === 'online' || hLoc.includes('online');
            }

            // 2. Skills Logic
            // Case-insensitive token match across skills, title and description.
            // Sources like MLH have no skills, so the title/description fallback
            // is what lets "AI" match an MLH event named "AI for Good".
            let skillMatch = true;
            if (intent.skills && intent.skills.length > 0) {
                skillMatch = intent.skills.some(s => matchesSearchTerm(s, h));
            }

            // 3. Paid/Free Logic
            let paidMatch = true;
            if (intent.isPaid !== undefined && intent.isPaid !== null) {
                if (intent.isPaid) {
                    paidMatch = h.isPaid === true;
                } else {
                    // User wants free
                    paidMatch = !h.isPaid; 
                }
            }

            // 4. Prize Logic
            // "With prizes" is not the same as "paid entry": isPaid means the
            // event charges a fee, so only hasPrize filters on an actual prize value.
            let prizeMatch = true;
            if (intent.hasPrize === true) {
                prizeMatch = hasPrizeValue(h.prize);
            }

            return locationMatch && skillMatch && paidMatch && prizeMatch;
        });

        const count = filtered.length;

        res.json({
            intent,
            count,
            results: filtered
        });

    } catch (error) {
        console.error("Smart search error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
