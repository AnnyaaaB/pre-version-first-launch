import React, { useState, useEffect } from "react";
import "./App.css";
import bgImage from "./assets/bg.png"; 
import userProfile from "./assets/userProfile.png";      
import autumnProfile from "./assets/autumnProfile.png";  
import logo from "./assets/logo.png";          
import teamImg from "./assets/team.png";       
import autumnHero from "./assets/autumn.png"; 

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); 
  const [modalContent, setModalContent] = useState(null);
  const [showCozy, setShowCozy] = useState(false);

  

  const API_BASE = window.location.origin;

   // Loading waitlist count on first render
  useEffect(() => {
    const loadWaitlistCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/waitlist/count`);
        const data = await res.json();
        const el = document.getElementById("waitlist-count");
        if (el) el.innerText = data.count;
      } catch (err) {
        console.error("Failed to load waitlist count", err);
      }
    };
    loadWaitlistCount();
  }, [API_BASE]);

  

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
        body: JSON.stringify({ 
          history: newHistory,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // 👈 send user timezone
        }),
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
    {/* Sidebar with integrated hamburger */}
<div className={`side-menu ${menuOpen ? "active" : ""}`}>
  {/* Hamburger inside the sidebar */}
  <div className="hamburger-inside" onClick={() => setMenuOpen(!menuOpen)}>
    <div className={`bar ${menuOpen ? "open" : ""}`}></div>
    <div className={`bar ${menuOpen ? "open" : ""}`}></div>
    <div className={`bar ${menuOpen ? "open" : ""}`}></div>
  </div>
        <h2>☻ We for You</h2>
        <ul>
          <li
            onClick={() =>
              openModal(
                <div className="modal-section">
                  <h2>🌿 Our Mission</h2>
                  <img src={logo} alt="Company Logo" className="modal-image" />
                  <p>
                    <strong>AntrAI</strong> builds compassionate AI to ease
                    suffering, bring clarity, and help people find meaning.
                    <br />
                          We will talk about the real issues; birth, disease, old age and death.
                  </p>
                </div>
              )
            }
          >
            🦚 Our Mission
          </li>

          <li
            onClick={() =>
              openModal(
                <div className="modal-section">
                  <h2>👥 Our Team</h2>
                  <img src={teamImg} alt="Our Team" className="modal-image" />
                  <p>
                    <strong>AntrAI</strong> is founded by University students, 
                    <br />who aim to shape AI for life, not
                    profit.
                  </p>
                </div>
              )
            }
          >
            🌻 Our Team
          </li>

          <li
            onClick={() =>
              openModal(
                <div className="modal-section">
                  <h2>🦋 Meet Autumn</h2>
                  <img
                    src={autumnHero}
                    alt="Autumn AI"
                    className="modal-image"
                  />
                  <p>
                    Say hi to <strong>Autumn</strong>, your soulful companion
                    for reflection, meaning, and happiness beyond screens.
                    <br />
                          ~ From <strong>AntrAI</strong>
                  </p>
                </div>
              )
            }
          >
            🦄 Meet Autumn
          </li>

      <li
  onClick={() =>
    openModal(
      <div className="modal-section join-us">
        <h2>💌 Join Us</h2>
        <img src={require("./assets/joinus.png")} alt="Join Us" className="modal-image" />
        <p>Become a <strong>club member</strong> for free 💌</p>
         <br />  Your <strong>personal care planner</strong> always with you 🍪🎧
          

        
        <form
          className="join-us-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const fullName = e.target.fullName.value;
            const email = e.target.email.value;

            try {
              const response = await fetch(`${API_BASE}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email }),
              });

              const data = await response.json();
              alert(data.message || "✅ Thanks for joining us!");
              e.target.reset();
            } catch (err) {
              alert("⚠️ Error submitting form: " + err.message);
            }
          }}
        >
          <input type="text" name="fullName" placeholder="Full Name" required />
          <input type="email" name="email" placeholder="Email Address" required />
          <button type="submit">Join Now ☃️</button>
        </form>
      </div>
    )
  }
>
  🌴 Join Us
</li>

<li
  onClick={() =>
    openModal(
      <div className="modal-section waitlist">
        <h2>🤩 Join Waitlist</h2>
        <img
          src={require("./assets/waitlist.png")}
          alt="Join Waitlist"
          className="modal-image"
        />
        <p>Be among the first to experience Autumn 🌟</p>

        {/* Showin' live count */}
        <p>
          <strong>Already joined:</strong>{" "}
          <span id="waitlist-count">...</span> people 🎉
        </p>

        <form
          className="waitlist-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const fullName = e.target.fullName.value;
            const email = e.target.email.value;

            try {
              const response = await fetch(`${API_BASE}/waitlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email }),
              });

              const data = await response.json();
              alert(data.message || "🫶 Thanks for joining the waitlist!");
              e.target.reset();

              // Refresh count
              const countRes = await fetch(`${API_BASE}/waitlist/count`);
              const countData = await countRes.json();
              document.getElementById("waitlist-count").innerText =
                countData.count;
            } catch (err) {
              alert("⚠️ Error submitting form: " + err.message);
            }
          }}
        >
          <input type="text" name="fullName" placeholder="Full Name" required />
          <input type="email" name="email" placeholder="Email Address" required />
          <button type="submit">Join Waitlist 🌼</button>
        </form>
      </div>
    )
  }
>
  🐥 Join Waitlist
</li>


<li
  onClick={() =>
    openModal(
      <div className="modal-section connect-us">
        <h2>🥞 Connect With Us</h2>
        <img
          src={require("./assets/connect.png")}
          alt="Connect With Us"
          className="modal-image"
        />
        <p>We’d love to hear from you 🎐</p>

        <form
          className="connect-us-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const fullName = e.target.fullName.value;
            const email = e.target.email.value;
            const message = e.target.message.value;

            try {
              const response = await fetch(`${API_BASE}/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, message }),
              });

              const data = await response.json();
              alert(data.message || "✅ Thanks for reaching out!");
              e.target.reset();
            } catch (err) {
              alert("⚠️ Error submitting form: " + err.message);
            }
          }}
        >
          <input type="text" name="fullName" placeholder="Full Name" required />
          <input type="email" name="email" placeholder="Email Address" required />
          <textarea name="message" placeholder="Your Message" rows="4" required></textarea>
          <button type="submit">Send 🕊️</button>
        </form>
      </div>
    )
  }
>
  🥰 Connect With Us
</li>

        </ul>
      </div>

      <li
        className="journey-link"
        style={{ color: "#000", fontWeight: 600 }} // forcing black text
        onClick={() =>
          openModal(
            <div className="modal-section">
              <h2>🐳 Everything you need</h2>
              <div className="journey-gallery">
                <div className="journey-card">
                  <img src={require("./assets/journey1.png")} alt="Journey 1" />
                  <p>🌱 Begin with self-reflection and a fresh start.</p>
                </div>
                <div className="journey-card">
                  <img src={require("./assets/journey2.png")} alt="Journey 2" />
                  <p>🌸 Grow with compassion, love, and care.</p>
                </div>
                <div className="journey-card">
                  <img src={require("./assets/journey3.png")} alt="Journey 3" />
                  <p>☀️ Embrace challenges as opportunities for light.</p>
                </div>
                <div className="journey-card">
                  <img src={require("./assets/journey4.png")} alt="Journey 4" />
                  <p>🌌 Find meaning beyond the ordinary.</p>
                </div>
              </div>
            </div>
          )
        }
      >
        🌠 Start Your Journey
      </li>

{/* Floating Gift Box */}
<div className="cozy-gift" onClick={() => setShowCozy(true)}>
  <span>🐻‍❄️ྀིྀི</span>
</div>

{showCozy && (
  <div className="cozy-modal">
    {/* Close button */}
    <button 
      className="close-btn" 
      onClick={() => setShowCozy(false)}
      aria-label="Close"
    >
      ✖
    </button>

    <div className="cozy-ideas">
      <h2>🤎🍂🧸༄ Warm Delights</h2>
      <p className="cozy-intro">A little corner, For you 🐝🌼🍯💛</p>

      {/* Reading Section */}
      <div className="cozy-category">
        <h3>༄˖°..ೃ࿔📚* Reading</h3>
        <p className="cozy-desc">
          When the heart meets true words, it becomes nourished. Just as food strengthens the body, sound that uplifts strengthens the soul. ‧₊˚📚✩ ₊˚🎧⊹♡
        </p>
        <div className="cozy-gallery">
          <img src={require("./assets/reading1.png")} alt="Reading 1" />
          <img src={require("./assets/reading2.png")} alt="Reading 2" />
          <img src={require("./assets/reading3.png")} alt="Reading 3" />
          <img src={require("./assets/reading4.png")} alt="Reading 4" />
        </div>
      </div>

      {/* Eating Section */}
      <div className="cozy-category">
        <h3>⟡𓌉◯𓇋₊˚⊹♡ Eating</h3>
        <p className="cozy-desc">
          To share a meal is not only to feed the body, but to offer warmth to another’s heart. In such moments, even the simplest food becomes sweet. ୧ ‧₊˚ 🥗🍎🌱🔆🍮 ⋅ ☆
        </p>
        <div className="cozy-gallery">
          <img src={require("./assets/eating1.png")} alt="Eating 1" />
          <img src={require("./assets/eating2.png")} alt="Eating 2" />
          <img src={require("./assets/eating3.png")} alt="Eating 3" />
          <img src={require("./assets/eating4.png")} alt="Eating 4" />
        </div>
      </div>

      {/* Singing Section */}
      <div className="cozy-category">
        <h3>🎤✩⋆｡˚.★💿 Singing</h3>
        <p className="cozy-desc">
          Song is not ordinary sound — it carries life. When sung with sincerity, each note becomes a light, dispelling heaviness and awakening joy. ᵎᵎ( ๑˃̶ ꇴ ˂̶)♪ ⁺｡o
        </p>
        <div className="cozy-gallery">
          <img src={require("./assets/singing1.png")} alt="Singing 1" />
          <img src={require("./assets/singing2.png")} alt="Singing 2" />
          <img src={require("./assets/singing3.png")} alt="Singing 3" />
          <img src={require("./assets/singing4.png")} alt="Singing 4" />
        </div>
      </div>

      {/* Associating Section */}
      <div className="cozy-category">
        <h3>🖤⃝🦋 Associating</h3>
        <p className="cozy-desc">
          Real company is not measured by how long we sit together, but by how much purity and happiness we share. Such exchanges remain as treasures within the heart. ‧₊˚ ☁️⋅♡🪐༘⋆
        </p>
        <div className="cozy-gallery">
          <img src={require("./assets/friends1.png")} alt="Friends 1" />
          <img src={require("./assets/friends2.png")} alt="Friends 2" />
          <img src={require("./assets/friends3.png")} alt="Friends 3" />
          <img src={require("./assets/friends4.png")} alt="Friends 4" />
        </div>
      </div>

      {/* Signature Line */}
      <div className="cozy-signature">
        <p>⸝⸝ ✧˚ ༘ ⋆｡♡˚ RESA <strong>(Read, Eat, Sing, Associate)</strong>—life’s sweetest ritual. Let’s cherish it together 🤎🍂🧺</p>
      </div>
    </div>
  </div>
)}

      
      {/* our Modal */}
      {modalContent && (
        <div className="modal-overlay" onClick={() => setModalContent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalContent}
            <button onClick={() => setModalContent(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="container">
        <h1>Yours Truly ~ 𐀪𐀪</h1>

        <div className="chat-box">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`chat-message-wrapper ${msg.role}`}>
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
          {loading ? "I'm thinking..." : "Send"}
        </button>
      </div>



       {/* our Footer */}
      <footer className="footer">
        © 2025 AntrAI. All rights reserved.
      </footer>

    </div>
  );
}

export default App;
