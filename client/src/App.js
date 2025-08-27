import React, { useState } from "react";
import "./App.css";
import bgImage from "./assets/bg.png"; 
import userProfile from "./assets/userProfile.png";      
import autumnProfile from "./assets/autumnProfile.png";  

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); 
  const [modalContent, setModalContent] = useState(null); // 👈 For modal

  const API_BASE = window.location.origin;

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newHistory = [...chatHistory, { role: "user", content: message }];
    setChatHistory(newHistory);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }),
      });

      const data = await response.json();
      const aiReply = {
        role: "assistant",
        content: data.reply || "No response from Autumn.",
      };

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
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, message: chatHistory[index] }),
      });
      alert("Thanks for your feedback! 💜");
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const openModal = (content) => {
    setModalContent(content);
    setMenuOpen(false);
  };

  return (
    <div
      className="App"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
      }}
    >
      {/* 🔹 Hamburger Button */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <div className={`bar ${menuOpen ? "open" : ""}`}></div>
        <div className={`bar ${menuOpen ? "open" : ""}`}></div>
        <div className={`bar ${menuOpen ? "open" : ""}`}></div>
      </div>

      {/* 🔹 Side Menu */}
      <div className={`side-menu ${menuOpen ? "active" : ""}`}>
        <h2>🌟 We for You</h2>
        <ul>
          <li onClick={() => openModal("🪷 Our Mission:\nAntrAI builds compassionate AI to ease suffering, bring clarity, and help people find meaning.")}>
            🦚 Our Mission
          </li>
          <li onClick={() => openModal("👥 Our Team:\nNot your usual founders, curious students shaping AI for life, not profit.")}>
            🌻 Our Team
          </li>
          <li onClick={() => openModal("🦋 Meet Autumn from AntrAI:\nSay hi to Autumn, your soulful companion for reflection, meaning, and happiness beyond screens.")}>
            🦄 How to use Autumn
          </li>
        </ul>
      </div>

      {/* 🔹 Modal */}
      {modalContent && (
        <div className="modal-overlay" onClick={() => setModalContent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p>{modalContent}</p>
            <button onClick={() => setModalContent(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="container">
        <h1>Yours Truly ~ 🎀</h1>

        <div className="chat-box">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-message-wrapper ${msg.role}`}
            >
              <img
                src={msg.role === "user" ? userProfile : autumnProfile}
                alt={msg.role}
                className="profile-pic"
              />
              <div className={`chat-message ${msg.role}`}>
                <p dangerouslySetInnerHTML={{ __html: msg.content }} />
                {msg.role === "assistant" && (
                  <div className="feedback-buttons">
                    <button onClick={() => sendFeedback("good", i)}>👍</button>
                    <button onClick={() => sendFeedback("bad", i)}>👎</button>
                  </div>
                )}
              </div>
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
