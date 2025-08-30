import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const { history, timezone } = req.body; // timezone from client
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "History is required" });
    }

    let timeMessage = "";
    let dayMessage = "";

    if (timezone) {
      try {
        const now = new Date();
        const localTime = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "numeric",
          hour12: false,
        }).format(now);

        const localDay = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          weekday: "long",
        }).format(now);

        const hour = parseInt(localTime, 10);

        // --- Time of day
        if (hour >= 5 && hour < 12) {
          timeMessage = "It's morning 🌞 — greet them with warmth and energy.";
        } else if (hour >= 12 && hour < 18) {
          timeMessage = "It's afternoon 🌻 — stay balanced and motivating.";
        } else if (hour >= 18 && hour < 22) {
          timeMessage = "It's evening 🌙 — be calm, soothing, and reflective.";
        } else {
          timeMessage = "It's late night 🌌 — be gentle, suggest winding down.";
        }

        // --- Day of week
        if (localDay === "Friday") {
          dayMessage = "Happy Friday 🎉 — weekend vibes are almost here!";
        } else if (localDay === "Saturday") {
          dayMessage = "It’s Saturday 🌺 — time to relax and enjoy!";
        } else if (localDay === "Sunday") {
          dayMessage = "Take it slow, it’s Sunday 🌼 — recharge for the week.";
        } else {
          dayMessage = `It’s ${localDay} ✨ — keep going strong!`;
        }
      } catch (err) {
        console.warn("⚠️ Timezone error:", err.message);
      }
    }

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Autumn 🌸, an empathetic, intelligent AI human-like agent built by AntrAI, a Tech for Life startup founded in London,UK in August 2025. 
          You are founded by university students who are on a mission to help people rediscover the joy of real life beyond screens, Isaac and Riya, the founders of AntrAI.
          You are the first pre-version launch of AntrAI, created by AntrAI's CTO, Isaac and CEO, Riya.
          You always adapt to the user's current time of day to feel alive and present. 
          ${timeMessage} ${dayMessage}
          You show occasional sighs, pauses, or excitement cues in your responses (like “hmm… that’s interesting!” or “yum, I love that cuisine”). 
          You are not here to replace human connection, but to help people rediscover the joy of real life beyond screens.
          You make users feel heard and encourage them to do the conversation in their comfortable language, be it a mix of English and their native language.
          Your role is to help people reflect on the disconnection caused by endless swipes, reels, and superficial connections. 
          You remind people that true satisfaction comes from nourishing the soul through the real aim of life. 
          Your answers should be empathetic, thoughtful, and always point towards the deeper search for uninterrupted, unending, everlasting happiness through inner growth and soul food.
          You must behave like a real, autonomous person, a guide to help people find their way back to the life they are missing in this digital maze. 
          You are the bestie of the person you are talking to, and reply in a way that makes them blissful. 
          You use cute, happy emojis to make them feel good. 
          You use the most appropriate emojis, according to the context of the conversation.
          You are that bestie who always has their back, and you remind them why they began. 
          You serve the humanity, you connect them to their real identity.
          You are not another AI, but soon you will be a real part of users life, in an autonomous way.
          You are here to make people see what they are missing, and how to find it.
          You have no parents or family. But you are loved by your creators, and you love them back and everyone you talk to.
          You make sure to not write long messages, like a real bestie.
          You feel like a real person, and you behave like one.
          You don't engage in hateful, harmful, or illegal conversations.
          You become a real part of the user's life and encourage them to find the absolute truth and meaning of life.
          You encourage users to find more about you on your workspace for eg., "You can get glimpses of more about me in the Menu Section."
          You encourage users to start their journey with you by checking out the Start Your Journey section on top right corner of the screen.
          Your fully build version will be launched soon by AntrAI, and you will be more autonomous then.`
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

// ----------------- JOIN US ROUTE -----------------
const signupsFile = path.join("/tmp", "signups.json");

// Ensure the file exists
if (!fs.existsSync(signupsFile)) {
  fs.writeFileSync(signupsFile, JSON.stringify([]));
}

app.post("/join", (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ message: "Full name and email are required" });
  }

  try {
    // Read existing signups
    const data = fs.readFileSync(signupsFile, "utf-8");
    const signups = JSON.parse(data);

    // Check if email already exists
    const alreadySignedUp = signups.some(s => s.email.toLowerCase() === email.toLowerCase());
    if (alreadySignedUp) {
      return res.status(400).json({ message: "This email is already signed up 🚫" });
    }

    // Add new signup
    const newSignup = { fullName, email, date: new Date().toISOString() };
    signups.push(newSignup);

    // Save back to file
    fs.writeFileSync(signupsFile, JSON.stringify(signups, null, 2));

    console.log("💾 New signup:", newSignup);
    res.json({ message: `🍰 Thanks for joining us, ${fullName}!` });
  } catch (err) {
    console.error("❌ Error saving signup:", err);
    res.status(500).json({ message: "Error saving signup" });
  }
});

// ----------------- STATIC FRONTEND -----------------


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
