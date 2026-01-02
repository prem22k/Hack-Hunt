import Groq from "groq-sdk";
import { NormalizedHackathon } from "../types";

// Define the structure of the recommendation result
export interface HackathonRecommendation {
  hackathonTitle: string;
  matchScore: number; // 0-100
  reason: string;
}

// Helper to calculate basic string similarity (for location matching)
const isLocationMatch = (hackathonLocation: string | undefined, userLocation: string) => {
  if (!hackathonLocation || !userLocation) return false;
  const hLoc = hackathonLocation.toLowerCase();
  const uLoc = userLocation.toLowerCase();
  return hLoc.includes(uLoc) || uLoc.includes(hLoc);
};

export const getRecommendedHackathons = async (
  userSkills: string[],
  hackathons: NormalizedHackathon[],
  userLocation?: string
): Promise<HackathonRecommendation[]> => {
  const apiKey = process.env.GROQ_API_KEY;
  
  // If no API key, return empty array
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not set.");
    return [];
  }

  // 1. PRE-FILTERING STRATEGY
  let filteredHackathons = hackathons;

  // A. Location Filter (Priority)
  if (userLocation) {
    const localHackathons = hackathons.filter(h => 
      h.location && isLocationMatch(h.location, userLocation)
    );
    
    // If we found local hackathons, prioritize them, but keep some global/online ones for variety
    if (localHackathons.length > 0) {
      const onlineHackathons = hackathons.filter(h => h.location?.toLowerCase().includes('online') || h.mode === 'online');
      // Mix: All local + up to 10 online
      filteredHackathons = [...localHackathons, ...onlineHackathons.slice(0, 10)];
    }
  }

  // B. Token Limit Protection (Hard Cap)
  // Cap at 30 candidates to ensure high-quality reasoning and speed.
  if (filteredHackathons.length > 30) {
    // Sort by date (soonest first) before slicing to ensure relevance
    filteredHackathons.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    filteredHackathons = filteredHackathons.slice(0, 30);
  }
  
  // Prepare the data for the prompt
  // We limit the description length to save tokens and focus on key details
  const hackathonList = filteredHackathons.map((h) => ({
    title: h.title,
    description: h.description.substring(0, 300), // Truncate for efficiency
    skills: h.skills.join(", "),
    mode: h.mode,
    location: h.location
  }));

  const prompt = `
    You are an expert career advisor and technical recruiter.
    
    User Skills: ${userSkills.join(", ")}
    User Location: ${userLocation || "Not specified"}

    Available Hackathons (Pre-filtered):
    ${JSON.stringify(hackathonList, null, 2)}

    Task:
    1. Analyze the user's skills and location against the available hackathons.
    2. Select the top 3 hackathons that are the best match for this user.
    3. Rank them from best match (1) to lowest match (3).
    4. Provide a "matchScore" (0-100) and a specific "reason" explaining the connection between the user's skills and the hackathon's theme or requirements. Mention if it is a local match.

    Return ONLY a valid JSON object with a "recommendations" key containing an array:
    {
      "recommendations": [
        {
          "hackathonTitle": "Exact Title From List",
          "matchScore": 95,
          "reason": "This hackathon focuses on AI/ML, which aligns perfectly with your Python and TensorFlow skills."
        }
      ]
    }
  `;

  const makeRequest = async (retries = 3, delay = 1000): Promise<HackathonRecommendation[]> => {
    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that outputs JSON."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content || "{}";
      // Clean up potential markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      
      console.log("Groq Raw Response:", cleanContent.substring(0, 200) + "..."); // Log start of response for debugging

      let parsed: any;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (e) {
        console.error("Failed to parse Groq JSON:", e);
        return [];
      }

      let recommendations: HackathonRecommendation[] = [];

      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        recommendations = parsed.recommendations;
      } else if (Array.isArray(parsed)) {
        recommendations = parsed;
      } else if (typeof parsed === 'object' && parsed.hackathonTitle) {
        recommendations = [parsed];
      }

      return recommendations;
    } catch (error: any) {
      // If rate limited and we have retries left, wait and retry
      const isDailyLimit = error?.error?.message?.includes("tokens per day (TPD)");
      
      if (error?.status === 429 && retries > 0 && !isDailyLimit) {
        console.warn(`Groq rate limit exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(retries - 1, delay * 2);
      }
      
      console.error("Error generating recommendations with Groq:", error);
      return [];
    }
  };

  return makeRequest();
};
