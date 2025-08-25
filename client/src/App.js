import React, { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // stores full conversation
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to history
    const newHistory = [...chatHistory, { role: "user", content: message }];
    setChatHistory(newHistory);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }), // send full history
      });

      const data = await response.json();
      const aiReply = {
        role: "assistant",
        content: data.reply || "No response from Autumn.",
      };

      // Append AI reply to history
      setChatHistory((prev) => [...prev, aiReply]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (feedback, index) => {
    try {
      await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, message: chatHistory[index] }),
      });
      alert("Thanks for your feedback! 💜");
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <div className="App">
      <div className="background-overlay"></div>
      <div className="container">
        <h1>Yours Truly ~ 🎀</h1>

        <div className="chat-box">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
            >
              <p dangerouslySetInnerHTML={{ __html: msg.content }} />
              {msg.role === "assistant" && (
                <div className="feedback-buttons">
                  <button onClick={() => sendFeedback("good", i)}>👍</button>
                  <button onClick={() => sendFeedback("bad", i)}>👎</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <textarea
          rows="3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Talk to Autumn..."
          disabled={loading}
        />
        <br />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;

