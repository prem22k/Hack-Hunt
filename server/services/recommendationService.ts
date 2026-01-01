import Groq from "groq-sdk";
import { NormalizedHackathon } from "../types";

// Define the structure of the recommendation result
export interface HackathonRecommendation {
  hackathonTitle: string;
  matchScore: number; // 0-100
  reason: string;
}

export const getRecommendedHackathons = async (
  userSkills: string[],
  hackathons: NormalizedHackathon[]
): Promise<HackathonRecommendation[]> => {
  const apiKey = process.env.GROQ_API_KEY;
  
  // If no API key, use fallback immediately
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not set, using local fallback.");
    return getFallbackRecommendations(userSkills, hackathons);
  }
  
  // Prepare the data for the prompt
  // We limit the description length to save tokens and focus on key details
  const hackathonList = hackathons.map((h) => ({
    title: h.title,
    description: h.description.substring(0, 300), // Truncate for efficiency
    skills: h.skills.join(", "),
    mode: h.mode,
  }));

  const prompt = `
    You are an expert career advisor and technical recruiter.
    
    User Skills: ${userSkills.join(", ")}

    Available Hackathons:
    ${JSON.stringify(hackathonList, null, 2)}

    Task:
    1. Analyze the user's skills against the available hackathons.
    2. Select the top 3 hackathons that are the best match for this user.
    3. Rank them from best match (1) to lowest match (3).
    4. Provide a "matchScore" (0-100) and a specific "reason" explaining the connection between the user's skills and the hackathon's theme or requirements.

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
        return getFallbackRecommendations(userSkills, hackathons);
      }

      let recommendations: HackathonRecommendation[] = [];

      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        recommendations = parsed.recommendations;
      } else if (Array.isArray(parsed)) {
        recommendations = parsed;
      } else if (typeof parsed === 'object' && parsed.hackathonTitle) {
        recommendations = [parsed];
      }

      if (recommendations.length === 0) {
         return getFallbackRecommendations(userSkills, hackathons);
      }

      return recommendations;
    } catch (error: any) {
      // If rate limited and we have retries left, wait and retry
      // BUT if the error message indicates daily quota exceeded (TPD), retrying won't help.
      // The error message for TPD usually contains "tokens per day (TPD)".
      const isDailyLimit = error?.error?.message?.includes("tokens per day (TPD)");
      
      if (error?.status === 429 && retries > 0 && !isDailyLimit) {
        console.warn(`Groq rate limit exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(retries - 1, delay * 2);
      }
      
      console.error("Error generating recommendations with Groq (switching to fallback):", error);
      return getFallbackRecommendations(userSkills, hackathons);
    }
  };

  return makeRequest();
};

const getFallbackRecommendations = (
  userSkills: string[],
  hackathons: NormalizedHackathon[]
): HackathonRecommendation[] => {
  console.log("Using local fallback algorithm for recommendations...");
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());

  const scoredHackathons = hackathons.map(hackathon => {
    let matchCount = 0;
    const matchedSkills: string[] = [];

    // Check skill matches
    hackathon.skills.forEach(skill => {
      if (normalizedUserSkills.some(us => skill.toLowerCase().includes(us) || us.includes(skill.toLowerCase()))) {
        matchCount++;
        matchedSkills.push(skill);
      }
    });

    // Simple scoring: 20 points per skill match, max 95
    let score = Math.min(matchCount * 20 + 10, 95);
    
    // Boost for title matches
    if (normalizedUserSkills.some(us => hackathon.title.toLowerCase().includes(us))) {
      score += 15;
    }

    return {
      hackathon,
      score: Math.min(score, 99),
      matchedSkills
    };
  });

  // Sort by score descending
  scoredHackathons.sort((a, b) => b.score - a.score);

  // Take top 3
  return scoredHackathons.slice(0, 3).map(item => ({
    hackathonTitle: item.hackathon.title,
    matchScore: item.score,
    reason: item.matchedSkills.length > 0 
      ? `Matches your skills: ${item.matchedSkills.join(", ")}`
      : "Recommended based on general popularity and availability."
  }));
};
