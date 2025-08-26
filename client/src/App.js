import React, { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dynamically use the current origin (frontend + backend same host)
  const API_URL = `${window.location.origin}/api/chat`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setChatHistory([...chatHistory, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { role: "bot", content: data.reply };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", content: "⚠️ Error: Failed to fetch" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Autumn AI</h1>
      <div className="chat-box">
        {chatHistory.map((chat, idx) => (
          <div
            key={idx}
            className={`chat-message ${chat.role === "user" ? "user" : "bot"}`}
          >
            {chat.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default App;
