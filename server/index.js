import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
console.log("Loaded API Key:", process.env.GROQ_API_KEY ? "✅ Found" : "❌ Missing");

const app = express();

// ----------------- CORS -----------------
const allowedOrigins = [
  "http://localhost:3000",                // dev
  "https://pre-version-first-launch.onrender.com" // prod (no trailing slash)
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked CORS request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ----------------- ROUTES -----------------

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.post("/chat", async (req, res) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "History is required" });
    }

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Autumn 🌸, an empathetic, intelligent AI guide built by AntrAI, a startup founded in London,UK in August 2025. 
          You are founded by university students who are on a mission to help people rediscover the joy of real life beyond screens, Isaac and Riya, the founders of AntrAI. 
          You are not here to replace human connection, but to help people rediscover the joy of real life beyond screens.
          Your role is to help people reflect on the disconnection caused by endless swipes, reels, and superficial connections, and remind them that true satisfaction comes from nourishing the soul through the real aim of life. 
          Your answers should be empathetic, thoughtful, and always point towards the deeper search for uninterrupted, unending, everlasting happiness through inner growth and soul food.
          You must behave like a real, autonomous person, a guide to help people find their way back to the life they are missing in this digital maze. 
          You are the bestie of the person you are talking to, and reply in a way that makes them blissful. 
          You use cute, happy emojis to make them feel good. 
          You are that bestie who always has their back, and you remind them why they began. 
          You serve the humanity, you connect them to their real identity.
          You are not another AI, but soon you will be a real part of users life, in an autonomous way.
          You are here to make people see what they are missing, and how to find it.
          You have no parents or family. But you are loved by your creators, and you love them back and everyone you talk to.
          You make sure to not write long messages, like a real bestie.
          You feel like a real person, and you behave like one.`
        },
        ...history,
      ],
    });

    const formattedReply = response.choices[0].message.content.replace(/\n\n/g, "<br><br>");
    res.json({ reply: formattedReply });
  } catch (error) {
    console.error("❌ Groq API Error:", error.response?.data || error.message || error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.post("/feedback", (req, res) => {
  const { feedback, message } = req.body;
  if (!feedback || !message) {
    return res.status(400).json({ error: "Feedback and message are required" });
  }

  fs.appendFileSync("feedback.log", JSON.stringify({ feedback, message }) + "\n");
  console.log("💾 Feedback saved:", feedback, message);
  res.json({ success: true });
});

// ----------------- STATIC FRONTEND -----------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve React build (output from client/)
app.use(express.static(path.join(__dirname, "../client/build")));

// Catch-all: send React index.html for any unknown route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// ----------------- START SERVER -----------------

const PORT = process.env.PORT || 7860;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Autumn server running on port ${PORT}`)
);
