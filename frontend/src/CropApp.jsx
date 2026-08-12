import { useState, useEffect, useRef } from "react";

const API = "http://localhost:5000/api";
const WEATHER_KEY = ""; // Add your OpenWeatherMap API key here when ready

// ─── CROP EMOJIS ──────────────────────────────────────────────────────────────
const CROP_EMOJI = {
  rice:"🌾",wheat:"🌾",maize:"🌽",chickpea:"🫘",kidneybeans:"🫘",pigeonpeas:"🫘",
  mothbeans:"🫘",mungbean:"🫘",blackgram:"🫘",lentil:"🫘",pomegranate:"🍎",
  banana:"🍌",mango:"🥭",grapes:"🍇",watermelon:"🍉",muskmelon:"🍈",apple:"🍎",
  orange:"🍊",papaya:"🍑",coconut:"🥥",cotton:"🌿",jute:"🌿",coffee:"☕"
};

// ─── SOIL SCORE COLOR ─────────────────────────────────────────────────────────
function soilColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("cs_token") || "");
  const [user, setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem("cs_user")); } catch { return null; } });
  const [page, setPage]   = useState("predict");
  const [isGuest, setIsGuest] = useState(false);

  function login(tok, usr) {
    setToken(tok); setUser(usr); setIsGuest(false);
    localStorage.setItem("cs_token", tok);
    localStorage.setItem("cs_user", JSON.stringify(usr));
  }
  function continueAsGuest() {
    setIsGuest(true);
  }
  function logout() {
    setToken(""); setUser(null); setIsGuest(false);
    localStorage.removeItem("cs_token");
    localStorage.removeItem("cs_user");
    setPage("predict");
  }

  // Show auth page only if not logged in AND not guest
  if (!token && !isGuest) return <AuthPage onLogin={login} onGuest={continueAsGuest} />;

  return (
    <div style={styles.root}>
      <Navbar user={user} page={page} setPage={setPage} onLogout={logout} isGuest={isGuest} />
      {isGuest && (
        <div style={styles.guestBanner}>
          You are browsing as a Guest — predictions will not be saved.
          <button style={styles.guestLoginBtn} onClick={() => { setIsGuest(false); setPage("predict"); }}>
            Sign In to Save History
          </button>
        </div>
      )}
      <main style={styles.main}>
        {page === "predict" && <PredictPage token={token} isGuest={isGuest} />}
        {page === "history" && !isGuest && <HistoryPage token={token} />}
        {page === "history" && isGuest  && (
          <div style={styles.centered}>
            <div style={{ fontSize:48 }}>🔒</div>
            <p style={{ color:"#6b7280", textAlign:"center" }}>
              Sign in to view your prediction history.
            </p>
            <button style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => { setIsGuest(false); setPage("predict"); }}>
              Sign In
            </button>
          </div>
        )}
        {page === "chat" && <ChatPage token={token} user={user} isGuest={isGuest} />}
      </main>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin, onGuest }) {
  const [mode, setMode]     = useState("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(""); setLoading(true);
    try {
      const body = mode === "register" ? { name, email, password } : { email, password };
      const r = await fetch(`${API}/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onLogin(data.token, data.user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>🌱</div>
        <h1 style={styles.authTitle}>CropSmart</h1>
        <p style={styles.authSub}>Climate-intelligent crop prediction</p>

        <div style={styles.tabRow}>
          {["login","register"].map(m => (
            <button key={m} style={{ ...styles.tab, ...(mode===m ? styles.tabActive : {}) }}
              onClick={() => { setMode(m); setError(""); }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <input style={styles.input} placeholder="Full Name" value={name}
            onChange={e => setName(e.target.value)} />
        )}
        <input style={styles.input} placeholder="Email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} placeholder="Password" type="password" value={password}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />

        {error && <p style={styles.errorMsg}>{error}</p>}

        <button style={{ ...styles.btn, ...styles.btnPrimary, width:"100%", marginTop:8 }}
          onClick={submit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div style={styles.divider}><span>or</span></div>

        <button style={{ ...styles.btn, ...styles.btnGuest, width:"100%" }}
          onClick={onGuest}>
          Continue as Guest
        </button>
        <p style={{ textAlign:"center", fontSize:12, color:"#9ca3af", margin:0 }}>
          Predictions will not be saved in guest mode
        </p>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, page, setPage, onLogout, isGuest }) {
  const navItems = [
    { id: "predict", label: "🌾 Predict" },
    { id: "history", label: "📋 History" },
    { id: "chat",    label: "🤖 AI Chat" },
  ];
  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>🌱 CropSmart</div>
      <div style={styles.navLinks}>
        {navItems.map(n => (
          <button key={n.id} style={{ ...styles.navLink, ...(page===n.id ? styles.navLinkActive : {}) }}
            onClick={() => setPage(n.id)}>{n.label}</button>
        ))}
      </div>
      <div style={styles.navUser}>
        {isGuest
          ? <span style={styles.guestBadge}>Guest Mode</span>
          : <span style={styles.navUserName}>👤 {user?.name}</span>
        }
        <button style={styles.btnLogout} onClick={onLogout}>
          {isGuest ? "Sign In" : "Logout"}
        </button>
      </div>
    </nav>
  );
}

// ─── PREDICT PAGE ─────────────────────────────────────────────────────────────
function PredictPage({ token, isGuest }) {
  const [form, setForm] = useState({
    nitrogen:60, phosphorus:40, potassium:40,
    temperature:25, humidity:65, ph:6.5, rainfall:100,
    season:"kharif", location:""
  });
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(false);
  const [error, setError]           = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function autoFillWeather() {
    setFetching(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej));
      const { latitude: lat, longitude: lon } = pos.coords;
      const r = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric`
      );
      const d = await r.json();
      if (!r.ok) throw new Error("Weather fetch failed");
      setForm(f => ({
        ...f,
        temperature: Math.round(d.main.temp),
        humidity:    d.main.humidity,
        rainfall:    d.rain ? Math.round(d.rain["1h"] || 0) : 0,
        location:    d.name
      }));
    } catch { alert("Could not fetch weather. Check your API key and location permissions."); }
    finally { setFetching(false); }
  }

  async function predict() {
    setLoading(true); setError(""); setResult(null); setValidationErrors([]);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const endpoint = token ? `${API}/predict` : `${API}/predict/guest`;
      const r = await fetch(endpoint, {
        method: "POST", headers, body: JSON.stringify(form)
      });
      const data = await r.json();
      if (r.status === 422) {
        setValidationErrors(data.validationErrors || []);
        return;
      }
      if (!r.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const fields = [
    { key:"nitrogen",    label:"Nitrogen (N)",    unit:"mg/kg", min:0,   max:200, step:1  },
    { key:"phosphorus",  label:"Phosphorus (P)",  unit:"mg/kg", min:0,   max:150, step:1  },
    { key:"potassium",   label:"Potassium (K)",   unit:"mg/kg", min:0,   max:250, step:1  },
    { key:"temperature", label:"Temperature",     unit:"°C",    min:-10, max:55,  step:0.5},
    { key:"humidity",    label:"Humidity",        unit:"%",     min:0,   max:100, step:1  },
    { key:"ph",          label:"Soil pH",         unit:"",      min:0,   max:14,  step:0.1},
    { key:"rainfall",    label:"Rainfall",        unit:"mm",    min:0,   max:500, step:1  },
  ];

  return (
    <div style={styles.pageWrap}>
      <div style={styles.twoCol}>
        {/* INPUT CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Soil & Climate Inputs</h2>
            {WEATHER_KEY
              ? <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={autoFillWeather} disabled={fetching}>
                  {fetching ? "Fetching..." : "📍 Auto-fill Weather"}
                </button>
              : <span style={styles.weatherNote}>📍 Enter values manually</span>
            }
          </div>

          {fields.map(f => (
            <div key={f.key} style={styles.fieldRow}>
              <label style={styles.fieldLabel}>{f.label}</label>
              <div style={styles.fieldInputWrap}>
                <input type="number" style={styles.numInput}
                  value={form[f.key]} min={f.min} max={f.max} step={f.step}
                  onChange={e => set(f.key, parseFloat(e.target.value))} />
                <span style={styles.fieldUnit}>{f.unit}</span>
              </div>
              <input type="range" style={styles.slider}
                value={form[f.key]} min={f.min} max={f.max} step={f.step}
                onChange={e => set(f.key, parseFloat(e.target.value))} />
            </div>
          ))}

          <div style={styles.fieldRow}>
            <label style={styles.fieldLabel}>Season</label>
            <select style={styles.select} value={form.season} onChange={e => set("season", e.target.value)}>
              <option value="kharif">Kharif (Jun–Nov)</option>
              <option value="rabi">Rabi (Nov–Apr)</option>
              <option value="zaid">Zaid (Apr–Jun)</option>
            </select>
          </div>

          {error && <p style={styles.errorMsg}>{error}</p>}

          {validationErrors.length > 0 && (
            <div style={styles.validationBox}>
              <p style={styles.validationTitle}>⚠️ Invalid Input Values Detected</p>
              <p style={styles.validationSubtitle}>Please correct the following before predicting:</p>
              {validationErrors.map((e, i) => (
                <div key={i} style={styles.validationRow}>
                  <span style={styles.validationDot}>●</span>
                  <span style={styles.validationMsg}>{e.message}</span>
                </div>
              ))}
            </div>
          )}

          <button style={{ ...styles.btn, ...styles.btnPrimary, width:"100%", marginTop:16 }}
            onClick={predict} disabled={loading}>
            {loading ? "Analysing soil..." : "🔍 Predict Best Crop"}
          </button>
        </div>

        {/* RESULTS */}
        <div>
          {!result && (
            <div style={styles.emptyResult}>
              <div style={{ fontSize:64 }}>🌱</div>
              <p style={styles.emptyText}>Enter your soil and climate data, then click Predict.</p>
            </div>
          )}
          {result && <ResultPanel result={result} />}
        </div>
      </div>
    </div>
  );
}

// ─── RESULT PANEL ─────────────────────────────────────────────────────────────
function ResultPanel({ result }) {
  const { topCrop, confidence, topFive, soilHealthScore, soilTips, fertilizerRecommendation: fert } = result;
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* TOP CROP */}
      <div style={{ ...styles.card, background:"linear-gradient(135deg,#14532d,#166534)", color:"#fff" }}>
        <div style={{ fontSize:56, textAlign:"center" }}>{CROP_EMOJI[topCrop] || "🌿"}</div>
        <h2 style={{ textAlign:"center", fontSize:28, fontWeight:700, margin:"8px 0 4px", textTransform:"capitalize" }}>
          {topCrop}
        </h2>
        <p style={{ textAlign:"center", opacity:0.85, margin:0 }}>Best crop for your conditions</p>
        <div style={styles.confidenceBadge}>{confidence}% match</div>
      </div>

      {/* TABS */}
      <div style={styles.tabRow}>
        {[["overview","📊 Overview"],["fertilizer","🧪 Fertilizer"],["soil","🪨 Soil Health"]].map(([id,label]) => (
          <button key={id} style={{ ...styles.tab, ...(tab===id ? styles.tabActive : {}) }}
            onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Top 5 Crop Matches</h3>
          {topFive.map((c, i) => (
            <div key={c.crop} style={styles.cropRow}>
              <span style={styles.cropRank}>#{i+1}</span>
              <span style={{ fontSize:20 }}>{CROP_EMOJI[c.crop] || "🌿"}</span>
              <span style={{ ...styles.cropName, textTransform:"capitalize" }}>{c.crop}</span>
              <div style={styles.barWrap}>
                <div style={{ ...styles.bar, width:`${c.confidence}%`, background: i===0?"#16a34a":"#86efac" }} />
              </div>
              <span style={styles.cropPct}>{c.confidence}%</span>
            </div>
          ))}
        </div>
      )}

      {tab === "fertilizer" && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Fertilizer Recommendation</h3>
          <div style={styles.fertGrid}>
            <FertCard icon="🧴" label="Fertilizer" value={fert.name} />
            <FertCard icon="⚗️" label="NPK Ratio"  value={fert.npkRatio} />
            <FertCard icon="⚖️" label="Quantity"   value={fert.quantity} />
          </div>
          <div style={styles.fertDetail}>
            <p><strong>⏰ Timing:</strong> {fert.timing}</p>
            <p><strong>📝 Notes:</strong> {fert.notes}</p>
          </div>
        </div>
      )}

      {tab === "soil" && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Soil Health Score</h3>
          <div style={styles.scoreWrap}>
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke={soilColor(soilHealthScore)}
                strokeWidth="10" strokeDasharray={`${soilHealthScore * 3.14} 314`}
                strokeDashoffset="78.5" strokeLinecap="round" transform="rotate(-90 60 60)"/>
              <text x="60" y="65" textAnchor="middle" fontSize="22" fontWeight="bold"
                fill={soilColor(soilHealthScore)}>{soilHealthScore}</text>
            </svg>
            <div>
              <p style={{ fontWeight:600, fontSize:16, color: soilColor(soilHealthScore) }}>
                {soilHealthScore >= 80 ? "Excellent" : soilHealthScore >= 60 ? "Good" : soilHealthScore >= 40 ? "Fair" : "Needs Attention"}
              </p>
              <p style={{ color:"#6b7280", fontSize:13 }}>Soil health rating out of 100</p>
            </div>
          </div>
          <h4 style={{ marginTop:16, marginBottom:8, color:"#374151" }}>Improvement Tips</h4>
          {soilTips.map((tip, i) => (
            <div key={i} style={styles.tipRow}>
              <span style={{ color:"#16a34a", fontWeight:700 }}>✓</span>
              <span style={{ fontSize:14, color:"#374151" }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FertCard({ icon, label, value }) {
  return (
    <div style={styles.fertCard}>
      <div style={{ fontSize:24 }}>{icon}</div>
      <div style={{ fontSize:11, color:"#6b7280", textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
      <div style={{ fontWeight:600, fontSize:14, color:"#111827" }}>{value}</div>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setHistory(data);
    } catch {}
    finally { setLoading(false); }
  }

  async function del(id) {
    await fetch(`${API}/history/${id}`, { method:"DELETE", headers: { Authorization: `Bearer ${token}` } });
    setHistory(h => h.filter(p => p._id !== id));
  }

  if (loading) return <div style={styles.centered}>Loading history...</div>;

  if (!history.length) return (
    <div style={styles.centered}>
      <div style={{ fontSize:48 }}>📋</div>
      <p style={{ color:"#6b7280" }}>No predictions yet. Run your first prediction!</p>
    </div>
  );

  return (
    <div style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>Prediction History</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {history.map(p => (
          <div key={p._id} style={styles.historyCard}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:32 }}>{CROP_EMOJI[p.result?.topCrop] || "🌿"}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:16, textTransform:"capitalize", color:"#111827" }}>
                  {p.result?.topCrop}
                </div>
                <div style={{ fontSize:12, color:"#6b7280" }}>
                  {new Date(p.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                  {p.inputs?.location && ` · ${p.inputs.location}`}
                </div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ ...styles.badge, background:"#dcfce7", color:"#166534" }}>
                  {p.result?.confidence}% match
                </span>
                <span style={{ ...styles.badge, background:"#fef9c3", color:"#854d0e" }}>
                  Soil: {p.result?.soilHealthScore}/100
                </span>
                <button style={{ ...styles.btn, background:"#fee2e2", color:"#dc2626", fontSize:12, padding:"4px 10px" }}
                  onClick={() => del(p._id)}>Delete</button>
              </div>
            </div>
            <div style={styles.historyDetails}>
              {[
                ["N", p.inputs?.nitrogen], ["P", p.inputs?.phosphorus], ["K", p.inputs?.potassium],
                ["Temp", `${p.inputs?.temperature}°C`], ["Humidity", `${p.inputs?.humidity}%`],
                ["pH", p.inputs?.ph], ["Rainfall", `${p.inputs?.rainfall}mm`]
              ].map(([k, v]) => (
                <span key={k} style={styles.detailPill}><strong>{k}:</strong> {v}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
function ChatPage({ user }) {
  const [messages, setMessages] = useState([
    { role:"assistant", text:`Hello ${user?.name?.split(" ")[0] || "Farmer"} 👋 I'm your AI farming assistant. Ask me anything about crops, soil, fertilizers, weather, or pest management!` }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role:"user", text:userMsg }]);
    setLoading(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are CropSmart AI, an expert agricultural assistant specializing in Indian farming, crop recommendations, soil health, fertilizers, weather impacts on crops, irrigation, and pest management. Give practical, actionable advice in simple language. Keep responses concise and helpful. When recommending crops or fertilizers, be specific with quantities and timing.`,
          messages: [
            ...messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await r.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages(m => [...m, { role:"assistant", text:reply }]);
    } catch {
      setMessages(m => [...m, { role:"assistant", text:"Connection error. Please check your network and try again." }]);
    }
    finally { setLoading(false); }
  }

  const suggestions = [
    "What crops grow best in black soil?",
    "How to improve soil pH naturally?",
    "Best time to sow wheat in India?",
    "How much water does rice need?",
  ];

  return (
    <div style={styles.chatWrap}>
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.msgRow, justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && <div style={styles.avatarBot}>🌱</div>}
            <div style={{ ...styles.bubble, ...(m.role==="user" ? styles.bubbleUser : styles.bubbleBot) }}>
              {m.text}
            </div>
            {m.role === "user" && <div style={styles.avatarUser}>👤</div>}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.msgRow, justifyContent:"flex-start" }}>
            <div style={styles.avatarBot}>🌱</div>
            <div style={styles.bubbleBot}>
              <span style={styles.typing}>● ● ●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div style={styles.suggestRow}>
          {suggestions.map((s, i) => (
            <button key={i} style={styles.suggestBtn} onClick={() => { setInput(s); }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={styles.chatInputRow}>
        <input style={styles.chatInput} placeholder="Ask anything about farming..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()} />
        <button style={{ ...styles.btn, ...styles.btnPrimary, padding:"10px 20px" }}
          onClick={send} disabled={loading || !input.trim()}>Send</button>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  root:       { minHeight:"100vh", background:"#f0fdf4", fontFamily:"system-ui,sans-serif" },
  main:       { maxWidth:1200, margin:"0 auto", padding:"24px 16px" },
  nav:        { background:"#166534", color:"#fff", padding:"0 24px", display:"flex", alignItems:"center", gap:16, height:60 },
  navBrand:   { fontWeight:700, fontSize:20, marginRight:16 },
  navLinks:   { display:"flex", gap:4, flex:1 },
  navLink:    { background:"none", border:"none", color:"rgba(255,255,255,0.75)", cursor:"pointer", padding:"6px 14px", borderRadius:8, fontSize:14 },
  navLinkActive:{ background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:600 },
  navUser:    { display:"flex", alignItems:"center", gap:12 },
  navUserName:{ fontSize:14, opacity:0.85 },
  btnLogout:  { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", borderRadius:8, padding:"4px 12px", cursor:"pointer", fontSize:13 },
  authWrap:   { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)" },
  authCard:   { background:"#fff", borderRadius:16, padding:36, width:380, boxShadow:"0 8px 32px rgba(0,0,0,0.1)", display:"flex", flexDirection:"column", gap:12 },
  authLogo:   { fontSize:48, textAlign:"center" },
  authTitle:  { textAlign:"center", fontSize:26, fontWeight:800, color:"#14532d", margin:0 },
  authSub:    { textAlign:"center", color:"#6b7280", fontSize:14, margin:0 },
  input:      { border:"1px solid #d1d5db", borderRadius:8, padding:"10px 14px", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" },
  errorMsg:   { color:"#dc2626", fontSize:13, margin:0 },
  btn:        { border:"none", borderRadius:8, padding:"10px 16px", cursor:"pointer", fontWeight:600, fontSize:14 },
  btnPrimary: { background:"#16a34a", color:"#fff" },
  btnSecondary:{ background:"#f0fdf4", color:"#166534", border:"1px solid #86efac" },
  tabRow:     { display:"flex", gap:4, background:"#f9fafb", borderRadius:10, padding:4 },
  tab:        { flex:1, border:"none", background:"none", cursor:"pointer", padding:"8px 12px", borderRadius:8, fontSize:13, color:"#6b7280" },
  tabActive:  { background:"#fff", color:"#166534", fontWeight:700, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  pageWrap:   { maxWidth:1100, margin:"0 auto" },
  pageTitle:  { fontWeight:800, fontSize:22, color:"#14532d", marginBottom:16 },
  twoCol:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 },
  card:       { background:"#fff", borderRadius:16, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  cardHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 },
  cardTitle:  { fontWeight:700, fontSize:16, color:"#14532d", margin:0 },
  fieldRow:   { marginBottom:14 },
  fieldLabel: { display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:4 },
  fieldInputWrap:{ display:"flex", gap:8, alignItems:"center", marginBottom:4 },
  numInput:   { border:"1px solid #d1d5db", borderRadius:8, padding:"6px 10px", fontSize:14, width:90 },
  fieldUnit:  { color:"#6b7280", fontSize:12, minWidth:40 },
  slider:     { width:"100%", accentColor:"#16a34a" },
  select:     { border:"1px solid #d1d5db", borderRadius:8, padding:"8px 12px", fontSize:14, width:"100%", background:"#fff" },
  emptyResult:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:300, gap:12 },
  emptyText:  { color:"#6b7280", textAlign:"center", fontSize:14 },
  confidenceBadge:{ background:"rgba(255,255,255,0.25)", color:"#fff", borderRadius:20, padding:"4px 16px", textAlign:"center", fontSize:14, fontWeight:600, marginTop:8, alignSelf:"center", display:"inline-block", margin:"8px auto 0", width:"fit-content" },
  sectionTitle:{ fontWeight:700, fontSize:15, color:"#14532d", marginTop:0, marginBottom:12 },
  cropRow:    { display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  cropRank:   { width:24, fontSize:12, color:"#9ca3af", fontWeight:600 },
  cropName:   { width:90, fontSize:14, fontWeight:600, color:"#111827" },
  barWrap:    { flex:1, background:"#f0fdf4", borderRadius:20, height:10, overflow:"hidden" },
  bar:        { height:"100%", borderRadius:20, transition:"width 0.6s ease" },
  cropPct:    { width:40, textAlign:"right", fontSize:13, color:"#374151" },
  fertGrid:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 },
  fertCard:   { background:"#f0fdf4", borderRadius:12, padding:14, textAlign:"center", display:"flex", flexDirection:"column", gap:4, alignItems:"center" },
  fertDetail: { background:"#f9fafb", borderRadius:12, padding:14, fontSize:14, color:"#374151", lineHeight:1.8 },
  scoreWrap:  { display:"flex", alignItems:"center", gap:20, marginBottom:16 },
  tipRow:     { display:"flex", gap:8, alignItems:"flex-start", padding:"8px 0", borderBottom:"1px solid #f0f0f0" },
  badge:      { borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600 },
  historyCard:{ background:"#fff", borderRadius:14, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", gap:10 },
  historyDetails:{ display:"flex", gap:6, flexWrap:"wrap" },
  detailPill: { background:"#f0fdf4", color:"#166534", borderRadius:20, padding:"3px 10px", fontSize:12 },
  centered:   { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:300, gap:12, color:"#6b7280" },
  chatWrap:   { maxWidth:700, margin:"0 auto", display:"flex", flexDirection:"column", gap:12 },
  chatBox:    { background:"#fff", borderRadius:16, padding:20, height:460, overflowY:"auto", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", gap:12 },
  msgRow:     { display:"flex", gap:8, alignItems:"flex-end" },
  avatarBot:  { fontSize:20, flexShrink:0 },
  avatarUser: { fontSize:20, flexShrink:0 },
  bubble:     { maxWidth:"80%", padding:"10px 14px", borderRadius:14, fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap" },
  bubbleBot:  { background:"#f0fdf4", color:"#111827", borderBottomLeftRadius:4 },
  bubbleUser: { background:"#16a34a", color:"#fff", borderBottomRightRadius:4 },
  typing:     { letterSpacing:4, animation:"pulse 1s infinite" },
  suggestRow: { display:"flex", gap:8, flexWrap:"wrap" },
  suggestBtn: { background:"#fff", border:"1px solid #86efac", borderRadius:20, padding:"6px 14px", fontSize:13, color:"#166534", cursor:"pointer" },
  chatInputRow:{ display:"flex", gap:8 },
  chatInput:    { flex:1, border:"1px solid #d1d5db", borderRadius:10, padding:"10px 14px", fontSize:14, outline:"none" },
  weatherNote:  { fontSize:12, color:"#9ca3af", fontStyle:"italic" },
  guestBanner:    { background:"#fef9c3", borderBottom:"1px solid #fde68a", padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"center", gap:16, fontSize:14, color:"#854d0e" },
  validationBox:  { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:16, marginTop:8 },
  validationTitle:{ fontWeight:700, color:"#dc2626", fontSize:14, margin:"0 0 4px" },
  validationSubtitle:{ color:"#6b7280", fontSize:12, margin:"0 0 10px" },
  validationRow:  { display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 },
  validationDot:  { color:"#dc2626", fontSize:10, marginTop:3, flexShrink:0 },
  validationMsg:  { fontSize:13, color:"#374151", lineHeight:1.5 },
  guestLoginBtn:{ background:"#16a34a", color:"#fff", border:"none", borderRadius:8, padding:"6px 16px", cursor:"pointer", fontWeight:600, fontSize:13 },
  guestBadge:   { background:"rgba(255,255,255,0.2)", color:"#fff", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:600 },
  divider:      { textAlign:"center", color:"#d1d5db", fontSize:13, position:"relative", margin:"4px 0" },
  btnGuest:     { background:"#f9fafb", color:"#374151", border:"1px solid #d1d5db", borderRadius:8 },
};
