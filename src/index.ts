import express from "express";
import cors from "cors";
import "dotenv/config";
import { getAIResponse } from "./geminiService";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["*"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "dork-ai-backend" });
});

app.post("/api/gemini", async (req, res) => {
  try {
    const query = String(req.body?.query ?? "").trim();
    if (!query) return res.status(400).json({ message: "query is required" });

    const data = await getAIResponse(query);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({
      type: "chat",
      message: "Server error",
    });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Server running on :${port}`));
