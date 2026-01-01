import { GoogleGenerativeAI } from "@google/generative-ai";
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
  const apiKey = process.env.GEMINI_API_KEY;
  
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

    Return ONLY a valid JSON array with this structure:
    [
      {
        "hackathonTitle": "Exact Title From List",
        "matchScore": 95,
        "reason": "This hackathon focuses on AI/ML, which aligns perfectly with your Python and TensorFlow skills."
      }
    ]
  `;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const recommendations: HackathonRecommendation[] = JSON.parse(text);
      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations with Gemini (switching to Groq):", error);
    }
  } else {
    console.warn("GEMINI_API_KEY is not set, skipping Gemini.");
  }

  // Fallback to Groq
  return getGroqRecommendations(prompt);
};

const getGroqRecommendations = async (prompt: string): Promise<HackathonRecommendation[]> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set");
    return [];
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "[]";
    // Clean up potential markdown code blocks if present (though json_object mode should avoid this)
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    
    const recommendations: HackathonRecommendation[] = JSON.parse(cleanContent);
    // Ensure the response is an array (sometimes models return an object with a key like "recommendations")
    if (!Array.isArray(recommendations)) {
       // @ts-ignore
       if (recommendations.recommendations && Array.isArray(recommendations.recommendations)) {
         // @ts-ignore
         return recommendations.recommendations;
       }
       return [];
    }
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations with Groq:", error);
    return [];
  }
};
