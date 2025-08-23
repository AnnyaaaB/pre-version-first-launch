export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { feedback, message } = req.body;

  if (!feedback || !message) {
    return res.status(400).json({ error: "Feedback and message are required" });
  }

  // On Vercel you can’t write to disk, so we just log it
  console.log("💾 Feedback:", feedback, message);

  res.status(200).json({ success: true });
}
