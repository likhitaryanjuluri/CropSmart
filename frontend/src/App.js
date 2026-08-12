import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";

const TABS = ["overview", "fertilizer", "soil"];
const TAB_INTERVAL = 5000;
const API = "http://localhost:5000/api";

// ─── CROP EMOJIS ──────────────────────────────────────────────────────────────
const CROP_EMOJI = {
  rice: "🌾", wheat: "🌿", maize: "🌽", chickpea: "🫘", kidneybeans: "🫘", pigeonpeas: "🟤",
  mothbeans: "🟠", mungbean: "🟢", blackgram: "⚫", lentil: "🔶", pomegranate: "🍎",
  banana: "🍌", mango: "🥭", grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍎",
  orange: "🍊", papaya: "🍑", coconut: "🥥", cotton: "☁️", jute: "🧵", coffee: "☕"
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
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("cs_user")); } catch { return null; } });
  const [page, setPage] = useState("predict");
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
        {page === "history" && isGuest && (
          <div style={styles.centered}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <p style={{ color: "#6b7280", textAlign: "center" }}>
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
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(""); setLoading(true);
    if (mode === "register") {
      if (!name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }
      if (!email.trim() && !phone.trim()) {
        setError("Provide either email or phone number");
        setLoading(false);
        return;
      }
    }

    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const body = mode === "register" ? {
        name: name.trim(), email: email.trim(), phone: phone.trim(), password
      } : {
        identifier: identifier.trim(), password
      };
      const r = await fetch(`${API}/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Something went wrong");
      onLogin(data.token, data.user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <h1 style={styles.authTitle}>CropSmart</h1>
        <p style={styles.authSub}>Climate-intelligent crop prediction</p>

        <div style={styles.tabRow}>
          {["login", "register"].map(m => (
            <button key={m} style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              onClick={() => {
                setMode(m); setError(""); setName(""); setEmail(""); setPhone(""); setIdentifier(""); setPassword("");
              }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <>
            <input style={styles.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={styles.input} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={styles.input} placeholder="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}

        {mode === "login" && (
          <input style={styles.input} placeholder="Email or Phone Number" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        )}
        <input style={styles.input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        {error && <p style={styles.errorMsg}>{error}</p>}

        <button style={{ ...styles.btn, ...styles.btnPrimary, width: "100%", marginTop: 8 }} onClick={submit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div style={styles.divider}><span>or</span></div>

        <button style={{ ...styles.btn, ...styles.btnGuest, width: "100%" }} onClick={onGuest}>
          Continue as Guest
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "8px 0 0" }}>
          Predictions will not be saved in guest mode
        </p>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, page, setPage, onLogout, isGuest }) {
  const { t } = useTranslation();
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  const navItems = [
    { id: "predict", label: t("nav.predict") },
    { id: "history", label: t("nav.history") },
    { id: "chat", label: t("nav.chat") },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>🌱 {t("appName")}</div>
      <div style={styles.navLinks}>
        {navItems.map(n => (
          <button key={n.id} style={{ ...styles.navLink, ...(page === n.id ? styles.navLinkActive : {}) }} onClick={() => setPage(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <div style={{ marginRight: "10px" }}>
        <select value={i18n.language} onChange={(e) => changeLanguage(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #d1d5db" }}>
          <option value="en">English</option>
          <option value="te">తెలుగు</option>
        </select>
      </div>
      <div style={styles.navUser}>
        {isGuest ? (
          <span style={styles.guestBadge}>{t("signIn")}</span>
        ) : (
          <span style={styles.navUserName}>👤 {user?.name}</span>
        )}
        <button
          style={styles.btnLogout}
          onClick={() => {
            if (isGuest) {
              window.location.reload();
            } else {
              onLogout();
            }
          }}
        >
          {isGuest ? t("signIn") : t("logout")}
        </button>
      </div>
    </nav>
  );
}

// ─── PREDICT PAGE ─────────────────────────────────────────────────────────────
function PredictPage({ token, isGuest }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    nitrogen: 60, phosphorus: 40, potassium: 40,
    temperature: 25, humidity: 65, ph: "", rainfall: 100,
    season: "kharif", location: null
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);


  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function autoFillWeather() {
    setError("")
    setFetching(true);
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, timeout: 5000, maximumAge: 300000
        })
      );
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const response = await fetch(`${API}/weather?lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setForm((prev) => ({
        ...prev,
        temperature: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        location: data.location
      }));
    } catch (err) {
      console.error(err);

      if (err.code === 1) {
        setError("Location permission denied.");
      } else if (err.code === 2) {
        setError("Unable to determine location.");
      } else if (err.code === 3) {
        setError("Location request timed out.");
      } else {
        setError(err.message || "Unable to fetch weather data.");
      }
    } finally { setFetching(false); }
  }

  async function predict() {
    if (
      form.ph === "" ||
      form.ph === null ||
      form.ph === undefined
    ) {
      setError("Please enter soil pH value.");
      return;
    }

    if (form.ph < 3.5 || form.ph > 9.5) {
      setError("pH value must be between 3.5 and 9.5.");
      return;
    }

    setLoading(true); setError(""); setResult(null); setValidationErrors([]);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const endpoint = token ? `${API}/predict` : `${API}/predict/guest`;
      const payload = {
        nitrogen: form.nitrogen,
        phosphorus: form.phosphorus,
        potassium: form.potassium,
        temperature: form.temperature,
        humidity: form.humidity,
        ph: form.ph,
        rainfall: form.rainfall,
        season: form.season,
        location: form.location
          ? `${form.location.latitude},${form.location.longitude}`
          : ""
      };

      const r = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      if (r.status === 422) {
        setValidationErrors(data.validationErrors || []);
        return;
      }
      if (!r.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const fields = [
    { key: "nitrogen", label: t("fields.nitrogen"), unit: "mg/kg", min: 10, max: 200, step: 1 },
    { key: "phosphorus", label: t("fields.phosphorus"), unit: "mg/kg", min: 5, max: 150, step: 1 },
    { key: "potassium", label: t("fields.potassium"), unit: "mg/kg", min: 5, max: 205, step: 1 },
    { key: "temperature", label: t("fields.temperature"), unit: "°C", min: 8, max: 45, step: 0.5 },
    { key: "humidity", label: t("fields.humidity"), unit: "%", min: 14, max: 99, step: 1 },
    { key: "ph", label: t("fields.ph"), unit: "pH", min: 3.5, max: 9.5, step: 0.1 },
    { key: "rainfall", label: t("fields.rainfall"), unit: "mm", min: 0, max: 298, step: 1 }
  ];

  return (
    <div style={styles.pageWrap}>
      <div style={styles.twoCol}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Soil & Climate Inputs</h2>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={autoFillWeather} disabled={fetching}>
              {fetching ? "Fetching..." : "📍 Auto-fill Weather"}
            </button>
          </div>
          {form.location && (
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 8
              }}
            >
              📍 {form.location?.latitude?.toFixed(4)},
              {" "}
              {form.location?.longitude?.toFixed(4)}
            </p>
          )}


          {fields.map(f => (
            <div key={f.key} style={styles.fieldRow}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={styles.fieldLabel}>{f.label}</label>
                <div style={styles.fieldInputWrap}>
                  <input type="number"
                    style={styles.numInput}
                    value={form[f.key]} min={f.min} max={f.max} step={f.step}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "") {
                        set(f.key, "");
                        return;
                      }

                      set(f.key, parseFloat(value));
                    }}
                  />
                  <span style={styles.fieldUnit}>{f.unit}</span>
                </div>
              </div>
              <input type="range" style={styles.slider} min={f.min} max={f.max} step={f.step}
                value={form[f.key] === "" ? f.min : form[f.key]}
                onChange={e => set(f.key, parseFloat(e.target.value))} />
            </div>
          ))}

          <div style={styles.fieldRow}>
            <label style={styles.fieldLabel}>{t("season.label")}</label>
            <select style={styles.select} value={form.season} onChange={e => set("season", e.target.value)}>
              <option value="kharif">{t("season.kharif")}</option>
              <option value="rabi">{t("season.rabi")}</option>
              <option value="zaid">{t("season.zaid")}</option>
            </select>
          </div>
          {error && <div style={{ marginTop: 12, color: "#dc2626", fontSize: 14, fontWeight: 500 }}>{error}</div>}
          <button style={{ ...styles.btn, ...styles.btnPrimary, width: "100%", marginTop: 16 }} onClick={predict} disabled={loading}>
            {loading ? t("predict.loading") : t("predict.button")}
          </button>
        </div>

        <div>
          {!result && validationErrors.length === 0 && (
            <div style={styles.emptyResult}>
              <div style={{ fontSize: 64 }}>🌱</div>
              <p style={styles.emptyText}>{t("predict.empty")}</p>
            </div>
          )}
          {!result && validationErrors.length > 0 && (
            <div style={styles.validationBox}>
              <div style={styles.validationHeader}>
                <span style={{ fontSize: 36 }}>⚠️</span>
                <div>
                  <p style={styles.validationTitle}>Invalid Input Values Detected</p>
                  <p style={styles.validationSubtitle}>Prediction cannot be made. Please correct the following:</p>
                </div>
              </div>
              {validationErrors.map((e, i) => (
                <div key={i} style={styles.validationRow}>
                  <span style={styles.validationIndex}>{i + 1}</span>
                  <div style={styles.validationMsgWrap}>
                    <span style={styles.validationField}>{e.field !== "combination" ? e.field.toUpperCase() : "⚠ Combination Error"}</span>
                    <span style={styles.validationMsg}>{e.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result && <ResultPanel result={result} />}
        </div>
      </div>
    </div>
  );
}

function getMatchSymbol(conf) {
  if (conf >= 25) return "🟢";
  if (conf >= 20) return "🟡";
  if (conf >= 0) return "🟠";
  return "🔴";
}

function useAutoTabs(initialTab = "overview", enabled = true) {
  const [tab, setTab] = useState(initialTab);
  const intervalRef = useRef(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (!enabled || userInteractedRef.current) return;
    intervalRef.current = setInterval(() => {
      setTab((current) => {
        const index = TABS.indexOf(current);
        return TABS[(index + 1) % TABS.length];
      });
    }, TAB_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [enabled]);

  const changeTab = (newTab) => {
    userInteractedRef.current = true;
    setTab(newTab);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return { tab, setTab: changeTab };
}

export function ResultPanel({ result }) {
  const { topCrop, confidence, topFive, soilHealthScore, soilTips, fertilizerRecommendation: fert } = result;
  const { tab, setTab } = useAutoTabs("overview", true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...styles.card, background: "linear-gradient(135deg,#14532d,#166534)", color: "#fff" }}>
        <div style={{ fontSize: 56, textAlign: "center" }}>{CROP_EMOJI[topCrop] || "🌿"}</div>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 700, margin: "8px 0 4px", textTransform: "capitalize" }}>{topCrop}</h2>
        <div style={styles.confidenceBadge}>{confidence}% match</div>
      </div>

      <div style={styles.tabRow}>
        {TABS.map((id) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...styles.tab, ...(tab === id ? styles.tabActive : {}) }}>
            {id === "overview" ? "📊 Overview" : id === "fertilizer" ? "🧪 Fertilizer" : "🪨 Soil Health"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Top 5 Crop Matches</h3>
          {topFive.map((c, i) => (
            <div key={c.crop} style={styles.cropRow}>
              <span style={styles.cropRank}>#{i + 1}</span>
              <span style={{ fontSize: 20 }}>{getMatchSymbol(c.confidence)}</span>
              <span style={{ ...styles.cropName, textTransform: "capitalize" }}>{c.crop}</span>
              <div style={styles.barWrap}>
                <div style={{ ...styles.bar, width: `${c.confidence}%`, background: i === 0 ? "#16a34a" : "#86efac" }} />
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
            <FertCard icon="⚗️" label="NPK Ratio" value={fert.npkRatio} />
            <FertCard icon="⚖️" label="Quantity" value={fert.quantity} />
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
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={soilColor(soilHealthScore)} strokeWidth="10" strokeDasharray="314.16" strokeDashoffset={314.16 - (soilHealthScore / 100) * 314.16} strokeLinecap="round" transform="rotate(-90 60 60)" />
              <text x="60" y="65" textAnchor="middle" fontSize="22" fontWeight="bold" fill={soilColor(soilHealthScore)}>{soilHealthScore}</text>
            </svg>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16, color: soilColor(soilHealthScore) }}>
                {soilHealthScore >= 80 ? "Excellent" : soilHealthScore >= 60 ? "Good" : soilHealthScore >= 40 ? "Fair" : "Needs Attention"}
              </p>
            </div>
          </div>
          <h4 style={{ marginTop: 16, marginBottom: 8, color: "#374151" }}>Improvement Tips</h4>
          {soilTips.map((tip, i) => (
            <div key={i} style={styles.tipRow}>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 14, color: "#374151" }}>{tip}</span>
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
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{value}</div>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ token }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setHistory(data);
    } catch { }
    finally { setLoading(false); }
  }

  async function del(id) {
    await fetch(`${API}/history/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setHistory(h => h.filter(p => p._id !== id));
  }

  if (loading) return <div style={styles.centered}>Loading history...</div>;
  if (!history.length) return <div style={styles.centered}><p>{t("history.empty")}</p></div>;

  return (
    <div style={styles.pageWrap}>
      <h2 style={styles.pageTitle}>{t("history.title")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {history.map(p => (
          <div key={p._id} style={styles.historyCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32 }}>{CROP_EMOJI[p.result?.topCrop] || "🌿"}</span>
              <div>
                <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{p.result?.topCrop}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {new Date(p.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                <span style={styles.badge}>{p.result?.confidence}% match</span>
                <button style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }} onClick={() => del(p._id)}>Delete</button>
              </div>
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
    { role: "assistant", text: `Hello ${user?.name?.split(" ")[0] || "Farmer"} 👋 I'm your AI farming assistant. Ask me anything about agriculture!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      // NOTE: Calling Anthropic directly via frontend will hit CORS blocks.
      // In production, change this endpoint route to go through your local Express backend.
      const r = await fetch(`${API}/chat` || "https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages })
      });
      const data = await r.json();
      const reply = data.reply || data.content?.[0]?.text || "Response parsed successfully.";
      setMessages(m => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Connection error. Please check your network and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "What crops grow best in black soil?",
    "How to improve soil pH naturally?",
    "Best time to sow wheat in India?",
  ];

  return (
    <div style={styles.chatWrap}>
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && <div style={styles.avatarBot}>🌱</div>}
            <div style={{ ...styles.bubble, ...(m.role === "user" ? styles.bubbleUser : styles.bubbleBot) }}>
              {m.text}
            </div>
            {m.role === "user" && <div style={styles.avatarUser}>👤</div>}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
            <div style={styles.avatarBot}>🌱</div>
            <div style={styles.bubbleBot}><span style={styles.typing}>● ● ●</span></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div style={styles.suggestRow}>
          {suggestions.map((s, i) => (
            <button key={i} style={styles.suggestBtn} onClick={() => setInput(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={styles.chatInputRow}>
        <input style={styles.chatInput} placeholder="Ask anything about farming..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <button style={{ ...styles.btn, ...styles.btnPrimary, marginLeft: 8 }} onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}

// ─── COMPLETE APPLICATION STYLING OBJECT ──────────────────────────────────────
const styles = {
  root: { fontFamily: "system-ui, sans-serif", background: "#f3f4f6", minHeight: "100vh", color: "#1f2937" },
  main: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
  nav: { display: "flex", alignItems: "center", background: "#ffffff", padding: "12px 24px", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  navBrand: { fontSize: "20px", fontWeight: "bold", color: "#16a34a", marginRight: "32px" },
  navLinks: { display: "flex", gap: "16px", flexGrow: 1 },
  navLink: { background: "none", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", color: "#4b5563", fontWeight: 500 },
  navLinkActive: { background: "#e0f2fe", color: "#0369a1" },
  navUser: { display: "flex", alignItems: "center", gap: "12px" },
  navUserName: { fontWeight: 500, fontSize: "14px" },
  guestBanner: { background: "#dbeafe", color: "#1e40af", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" },
  guestLoginBtn: { background: "#1e40af", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" },
  guestBadge: { background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" },
  btnLogout: { background: "#f3f4f6", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" },
  authWrap: { display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f3f4f6" },
  authCard: { background: "#fff", padding: "32px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  authTitle: { fontSize: "28px", fontWeight: "bold", color: "#111827", textAlign: "center", margin: "0 0 4px 0" },
  authSub: { color: "#6b7280", textAlign: "center", margin: "0 0 24px 0", fontSize: "14px" },
  input: { width: "100%", padding: "10px 12px", margin: "8px 0", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box" },
  errorMsg: { color: "#dc2626", fontSize: "14px", margin: "8px 0" },
  divider: { display: "flex", alignItems: "center", textAlign: "center", color: "#9ca3af", margin: "16px 0" },
  pageWrap: { padding: "8px 0" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },
  card: { background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  cardTitle: { fontSize: "18px", fontWeight: 600, margin: 0 },
  fieldRow: { marginBottom: "16px", display: "flex", flexDirection: "column" },
  fieldLabel: { fontSize: "14px", fontWeight: 500, color: "#374151" },
  fieldInputWrap: { display: "flex", alignItems: "center", gap: "6px" },
  numInput: { width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db", textAlign: "right" },
  fieldUnit: { fontSize: "12px", color: "#6b7280" },
  slider: { width: "100%", marginTop: "6px", cursor: "pointer" },
  select: { width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff" },
  btn: { padding: "10px 16px", borderRadius: "6px", fontWeight: 500, cursor: "pointer", border: "none" },
  btnPrimary: { background: "#16a34a", color: "#fff" },
  btnSecondary: { background: "#f3f4f6", border: "1px solid #d1d5db", color: "#374151" },
  btnGuest: { background: "#fff", border: "1px solid #d1d5db", color: "#374151" },
  confidenceBadge: { background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", display: "inline-block", margin: "8px auto 0", fontSize: "14px" },
  tabRow: { display: "flex", gap: "8px", background: "#e5e7eb", padding: "4px", borderRadius: "8px" },
  tab: { flex: 1, padding: "8px", background: "none", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  cropRow: { display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
  cropRank: { color: "#9ca3af", width: "24px", fontWeight: 600 },
  cropName: { flexGrow: 1, fontWeight: 500 },
  barWrap: { width: "100px", background: "#e5e7eb", height: "8px", borderRadius: "4px", overflow: "hidden" },
  bar: { height: "100%" },
  fertGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", margin: "16px 0" },
  fertCard: { background: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center", border: "1px solid #ebdfee" },
  chatWrap: { background: "#fff", borderRadius: "12px", height: "550px", display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", overflow: "hidden" },
  chatBox: { flexGrow: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" },
  msgRow: { display: "flex", gap: "10px", alignItems: "end" },
  bubble: { padding: "10px 14px", borderRadius: "12px", maxWidth: "70%", fontSize: "14px", lineHeight: "1.4" },
  bubbleBot: { background: "#f3f4f6", color: "#1f2937" },
  bubbleUser: { background: "#16a34a", color: "#fff" },
  chatInputRow: { padding: "12px", borderTop: "1px solid #e5e7eb", display: "flex" },
  chatInput: { flexGrow: 1, padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" },
  suggestRow: { padding: "0 12px 8px", display: "flex", gap: "8px", flexWrap: "wrap" },
  suggestBtn: { background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px" },
  emptyResult: { background: "#fff", padding: "48px", textAlign: "center", borderRadius: "12px" }
};