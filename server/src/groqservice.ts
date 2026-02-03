import Groq from "groq-sdk";
import { AIResponse } from "./types";
import { DORK_AI_INSTRUCTIONS } from "./systemInstructions";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY env var");
}

const groq = new Groq({ apiKey });

export async function getAIResponse(query: string): Promise<AIResponse> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
${DORK_AI_INSTRUCTIONS}

CRITICAL OUTPUT RULES (NO EXCEPTIONS):
- Return ONLY valid JSON
- NO greeting text
- NO markdown
- NO explanation
- NO text before or after JSON
- If you break JSON format, the response is INVALID

Respond ONLY in this format:
{
  "type": "chat" | "dorks",
  "message": "string",
  "dorks": [{ "dork": "string", "description": "string" }]
}
          `.trim(),
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty Groq response");

    // 🔥 HARD JSON EXTRACTION (even if model misbehaves)
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Groq response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIResponse;

    return {
      type: parsed.type ?? "chat",
      message: parsed.message ?? "No response generated.",
      dorks: parsed.dorks ?? [],
      sources: [],
    };
  } catch (err) {
    console.error("Groq error:", err);
    return {
      type: "chat",
      message: "Error processing AI response.",
      dorks: [],
      sources: [],
    };
  }
}
