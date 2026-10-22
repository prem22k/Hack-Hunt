import Groq from "groq-sdk";

// Created lazily: constructing Groq without a key throws at import time and took the
// whole API down; without a key smart search just falls back to no parsed intent.
let groq: Groq | null = null;
const getGroq = () => {
    if (!process.env.GROQ_API_KEY) return null;
    groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
    return groq;
};

export interface SearchIntent {
    location?: string;
    skills?: string[];
    isOnline?: boolean;
    isPaid?: boolean;
    includeOnline?: boolean;
}

export const parseUserIntent = async (query: string): Promise<SearchIntent> => {
    const client = getGroq();
    if (!client) {
        console.warn("GROQ_API_KEY is not set; skipping intent parsing.");
        return {};
    }
    try {
        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a search parser. Extract structured data from the user's query.
                    Return ONLY valid JSON with these keys:
                    - location (string or null)
                    - skills (array of strings)
                    - isOnline (boolean or null)
                    - isPaid (boolean or null)
                    
                    If the user mentions a specific country or city, set 'location'.
                    If they mention 'remote' or 'online', set 'isOnline' to true.
                    If they mention 'paid' or 'prizes', set 'isPaid' to true.
                    `
                },
                {
                    role: "user",
                    content: query
                }
            ],
            model: "llama3-8b-8192",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return {};

        const parsed = JSON.parse(content);
        
        // Logic: If location is specified, we should also include online events
        // because online events are accessible from everyone.
        if (parsed.location) {
            parsed.includeOnline = true;
        }

        return parsed;
    } catch (error) {
        console.error("Error parsing intent:", error);
        return {}; 
    }
};
