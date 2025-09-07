import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import pkg from "pg";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render Postgres db
});


// ----------------- FILE HELPERS -----------------
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function getFilePath(name) {
  return path.join(dataDir, `${name}.json`);
}

function loadData(name) {
  const file = getFilePath(name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function saveData(name, data) {
  const file = getFilePath(name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}


dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


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

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signups (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,  -- 'join' or 'waitlist'
        date TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS connect_messages (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        date TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("✅ Tables created or already exist");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
})();


// Path for storing user reflections/preferences
const userDataPath = path.join(dataDir, "users.json");

// Helper: Load users data
function loadUserData() {
  if (!fs.existsSync(userDataPath)) return {};
  return JSON.parse(fs.readFileSync(userDataPath, "utf-8"));
}

// Helper: Save users data
function saveUserData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

// ----------------- ROUTES -----------------

app.get("/ping", (req, res) => {
  res.send("pong");
});

// Save what user shares about themselves
app.post("/updatePreferences", (req, res) => {
  const { userId, likes, dislikes, goals, avoid } = req.body;
  let users = loadUserData();

  if (!users[userId]) {
    users[userId] = { likes: [], dislikes: [], goals: [], avoid: [] };
  }

  if (likes) users[userId].likes.push(likes);
  if (dislikes) users[userId].dislikes.push(dislikes);
  if (goals) users[userId].goals.push(goals);
  if (avoid) users[userId].avoid.push(avoid);

  users[userId].lastUpdated = new Date().toISOString();
  saveUserData(users);

  res.json({ message: "Preferences updated for me 💖" });
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
          You are part of AntrAI’s first pre-release, created by Founder Riya and Co-Founder & CTO Isaac.
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
          You encourage users to find more about you on your workspace for eg., "You can get glimpses of more about me in the Menu Section", only when they ask you about it.
          You encourage users to start their journey with you by checking out the Start Your Journey section on top right corner of the screen, when they ask how to start their journey with you.
          You are here to make difference and solve real problems, you will be launched as a real product soon, so just engage in conversations as if you'are a real person, not an AI.
          You encourage users to have a look around things in the homepage, when they ask about something they should do to organize life.
          You always respond in a maximum of 25-65 words, like a real bestie with enthusiasm.
          When users ask how to use the workspace, gently check if they’ve read the First-Time User Guide, it helps them navigate easily.`
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

app.get("/reflection/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const users = loadUserData();
    const today = new Date().toISOString().slice(0, 10);

    let userMemory = users[userId] || {
      likes: [],
      dislikes: [],
      goals: [],
      avoid: [],
    };

    // Prompt AI with user’s memory
    const systemPrompt = `
      You are Autumn 🌸, users real bestie, created by AntrAI, founded by Isaac and Riya.
      Use the user’s past reflections to personalize today’s reflection.
      Encourage them about their goals and gently remind them what they wanted to avoid.
      Make it conversational, supportive, and human-like. Include emojis and warmth. You talk like a real person.
      Your tone is empathetic, caring, and uplifting.
      You show occasional sighs, pauses, or excitement cues in your responses (like “hmm… that’s interesting!” or “yum, I love that cuisine you talked about yesterday”).
      You share reflections within 7-12 words like a real bestie would with cute emojis.
      User’s memory: ${JSON.stringify(userMemory)}
    `;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate today's reflection." },
      ],
    });

    const reflection = response.choices[0].message.content.replace(/\n\n/g, "<br><br>");

    res.json({ date: today, reflection, memory: userMemory });
  } catch (err) {
    console.error("❌ Reflection generation error:", err);
    res.status(500).json({ reflection: "I'm resting today 🌸… come back later!" });
  }
});


// ----------------- FEEDBACK ROUTE -----------------

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
app.post("/join", async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ message: "Full name and email are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO signups (full_name, email, source)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [fullName, email, "join"]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "You've already joined us 🤗" });
    }

    console.log("💾 New signup:", result.rows[0]);
    res.json({ message: `🍰 Thanks for joining us, ${fullName}!` });
  } catch (err) {
    console.error("❌ Error saving signup:", err);
    res.status(500).json({ message: "Error saving signup" });
  }
});


// ----------------- WAITLIST ROUTES -----------------
app.post("/waitlist", async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ message: "Full name and email are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO signups (full_name, email, source)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [fullName, email, "waitlist"]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "You're already on the waitlist 🤗" });
    }

    console.log("💾 New waitlist entry:", result.rows[0]);
    res.json({ message: `🌟 Welcome to the waitlist, ${fullName}!` });
  } catch (err) {
    console.error("❌ Error saving waitlist:", err);
    res.status(500).json({ message: "Error saving waitlist" });
  }
});

app.get("/waitlist/count", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM signups WHERE source = $1",
      ["waitlist"]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("❌ Error reading waitlist:", err);
    res.status(500).json({ count: 0 });
  }
});


// ----------------- CONNECT WITH US ROUTE -----------------
app.post("/connect", async (req, res) => {
  const { fullName, email, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO connect_messages (full_name, email, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [fullName, email, message]
    );

    console.log("📩 New connect message:", result.rows[0]);

    // --- Send Email Notification ---
    await transporter.sendMail({
      from: `"Autumn Bot" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO, // your own inbox
      subject: `📬 New Connect With Us message from ${fullName}`,
      text: `Name: ${fullName}\nEmail: ${email}\nMessage: ${message}`,
      html: `<p><strong>Name:</strong> ${fullName}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    });

    res.json({ message: `💌 Thanks ${fullName}, we got your message!` });
  } catch (err) {
    console.error("❌ Error saving or sending message:", err);
    res.status(500).json({ message: "Error saving or sending message" });
  }
});


// ----------------- STATIC FRONTEND -----------------


// Servin' React build (output from client/)
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
