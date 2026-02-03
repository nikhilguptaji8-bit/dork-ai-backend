import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, GroundingSource } from "./types";
import { DORK_AI_INSTRUCTIONS } from "./systemInstructions";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY env var");
}

const ai = new GoogleGenAI({ apiKey });

export async function getAIResponse(query: string): Promise<AIResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    // Keep your schema enforcement (like you did in Vite)
    v: {
      systemInstruction: DORK_AI_INSTRUCTIONS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "The type of response: 'chat' or 'dorks'.",
          },
          message: {
            type: Type.STRING,
            description: "The conversational response or explanation.",
          },
          dorks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dork: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              propertyOrdering: ["dork", "description"],
            },
          },
        },
        propertyOrdering: ["type", "message", "dorks"],
      },
    },
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    const parsed = JSON.parse(jsonStr) as AIResponse;

    // Collect grounding sources (if any)
    const sources: GroundingSource[] = [];
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      });
    }

    if (sources.length > 0) parsed.sources = sources;

    // Basic hardening: ensure required fields exist
    if (!parsed.type || !parsed.message) {
      return { type: "chat", message: "Invalid AI JSON response." };
    }

    return parsed;
  } catch (err) {
    return {
      type: "chat",
      message: "Error processing AI response.",
    };
  }
}
