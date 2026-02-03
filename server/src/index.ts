import express from "express";
import cors from "cors";
import "dotenv/config";
import { getAIResponse } from "./groqservice";
import type { AIResponse } from "./types";

const app = express();

/* ---------- CORS (HARD FIX) ---------- */
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 🔥 PRE-FLIGHT FIX

/* ---------- BODY ---------- */
app.use(express.json({ limit: "1mb" }));

/* ---------- HEALTH ---------- */
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "dork-ai-backend" });
});

/* ---------- API ---------- */
app.post("/api/gemini", async (req, res) => {
  try {
    const query = String(req.body?.query ?? "").trim();

    if (!query) {
      const response: AIResponse = {
        type: "chat",
        message: "Query is required.",
        dorks: [],
        sources: [],
      };
      return res.status(400).json(response);
    }

    const data = await getAIResponse(query);

    const safeResponse: AIResponse = {
      type: data?.type ?? "chat",
      message: data?.message ?? "No response generated.",
      dorks: data?.dorks ?? [],
      sources: data?.sources ?? [],
    };

    return res.json(safeResponse);
  } catch (err) {
    console.error("Gemini error:", err);

    const response: AIResponse = {
      type: "chat",
      message: "Error processing AI response.",
      dorks: [],
      sources: [],
    };

    return res.status(500).json(response);
  }
});

/* ---------- START ---------- */
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
});
