import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── 顏色主題（米色底 + 藍綠紫）───────────────────────────────
const C = {
  bg: "#F5F0E8",         // 米色底
  surface: "#FDFAF4",    // 卡片白米
  border: "#E2D9C8",     // 邊框
  blue: "#4A7FD4",       // 主藍
  blueSoft: "#EBF1FB",   // 淡藍背景
  green: "#3DAD8A",      // 主綠
  greenSoft: "#E8F7F2",  // 淡綠背景
  purple: "#8B5CF6",     // 主紫
  purpleSoft: "#F3EFFE", // 淡紫背景
  text: "#2D2A24",       // 深棕文字
  textMuted: "#9E9484",  // 淡棕文字
  danger: "#D95B5B",     // 錯誤紅
  dangerSoft: "#FDEAEA",
  success: "#3DAD8A",
  successSoft: "#E8F7F2",
};

const TRIP_COLORS = [C.blue, C.green, C.purple, "#E0875A", "#5AB4E0", "#AD5BBA", "#5ABF6B", "#D4A044"];
const TRIP_EMOJIS = ["✈️", "🏖️", "🗻", "🏙️", "🌏", "🚂", "🛳️", "🏕️", "🎡", "🗼", "🌸", "🍜"];

const gs = {
  app: {
    minHeight: "100vh",
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    border: `1px solid ${C.border}`,
    padding: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  input: {
    width: "100%",
    backgroundColor: C.bg,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: "13px 15px",
    color: C.text,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  label: {
    display: "block",
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 6,
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
};

// ─── Loading ──────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🧳</div>
      <div style={{ color: C.textMuted, fontSize: 14 }}>載入中...</div>
    </div>
  );
}

// ─── 登入畫面 ─────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const errMap = {
    "auth/email-already-in-use": "這個 email 已經被註冊過了，請直接登入",
    "auth/invalid-email": "Email 格式不正確",
    "auth/weak-password": "密碼至少需要 6 個字元",
    "auth/user-not-found": "找不到這個帳號，請先註冊",
    "auth/wrong-password": "密碼錯誤",
    "auth/invalid-credential": "Email 或密碼錯誤",
    "auth/too-many-requests": "嘗試次數過多，請稍後再試",
  };

  async function handleSubmit() {
    setError(""); setMsg(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("請輸入你的名稱"); setLoading(false); return; }
        if (!email.trim()) { setError("請輸入 Email"); setLoading(false); return; }
        if (password.length < 6) { setError("密碼至少需要 6 個字元"); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          displayName: name.trim(),
          email: email.toLowerCase(),
          createdAt: serverTimestamp(),
        });
        // 註冊完立刻登出，讓使用者重新登入
        await signOut(auth);
        setMsg("註冊成功！請用你的 email 和密碼登入 ✓");
        setMode("login");
        setName(""); setPassword("");
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await sendPasswordResetEmail(auth, email);
        setMsg("重設密碼信已寄出，請檢查你的信箱 📬");
        setLoading(false); return;
      }
    } catch (e) {
      setError(errMap[e.code] || "發生錯誤，請再試一次");
    }
    setLoading(false);
  }

  // 登入頁
  if (mode === "login") return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, margin: "0 auto 14px", background: `linear-gradient(135deg,${C.blue},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 4px 20px rgba(74,127,212,0.3)" }}>🧳</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>旅遊小助理</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>和朋友一起探索世界每個角落</div>
        </div>
        <div style={gs.card}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>登入</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={gs.label}>Email</label>
              <input style={gs.input} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={gs.label}>密碼</label>
              <input style={gs.input} type="password" placeholder="輸入密碼" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          </div>
          {error && <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.dangerSoft, borderRadius: 10, color: C.danger, fontSize: 13 }}>{error}</div>}
          {msg && <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.successSoft, borderRadius: 10, color: C.success, fontSize: 13 }}>{msg}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 18, background: `linear-gradient(135deg,${C.blue},${C.purple})`, color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? "登入中..." : "登入"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button onClick={() => { setMode("forgot"); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", padding: 0 }}>
              忘記密碼？
            </button>
            <button onClick={() => { setMode("register"); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: C.blue, fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 600 }}>
              還沒有帳號？點此註冊
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 註冊頁
  if (mode === "register") return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, margin: "0 auto 14px", background: `linear-gradient(135deg,${C.green},${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 4px 20px rgba(61,173,138,0.3)" }}>🧳</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>建立帳戶</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>加入旅遊小助理，開始規劃旅程</div>
        </div>
        <div style={gs.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={gs.label}>你的名稱</label>
              <input style={gs.input} placeholder="輸入暱稱" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={gs.label}>Email</label>
              <input style={gs.input} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={gs.label}>密碼</label>
              <input style={gs.input} type="password" placeholder="至少 6 個字元" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          </div>
          {error && <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.dangerSoft, borderRadius: 10, color: C.danger, fontSize: 13 }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 18, background: `linear-gradient(135deg,${C.green},${C.blue})`, color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? "建立中..." : "建立帳戶"}
          </button>
          <button onClick={() => { setMode("login"); setError(""); setMsg(""); }}
            style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", width: "100%", marginTop: 12, padding: "4px 0" }}>
            ← 返回登入
          </button>
        </div>
      </div>
    </div>
  );

  // 忘記密碼頁
  return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={gs.card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>重設密碼</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>輸入你的 email，我們會寄送重設連結</div>
          <label style={gs.label}>Email</label>
          <input style={gs.input} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          {error && <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.dangerSoft, borderRadius: 10, color: C.danger, fontSize: 13 }}>{error}</div>}
          {msg && <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.successSoft, borderRadius: 10, color: C.success, fontSize: 13 }}>{msg}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16, background: `linear-gradient(135deg,${C.purple},${C.blue})`, color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading ? "寄送中..." : "寄送重設信"}
          </button>
          <button onClick={() => { setMode("login"); setError(""); setMsg(""); }}
            style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", width: "100%", marginTop: 12, padding: "4px 0" }}>
            ← 返回登入
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 旅程列表 ─────────────────────────────────────────────────
function TripListScreen({ user, onEnterTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => { loadTrips(); }, [user.uid]);

  async function loadTrips() {
    setLoading(true);
    try {
      const q = query(collection(db, "tripMembers"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      const tripIds = snap.docs.map(d => d.data().tripId);
      if (!tripIds.length) { setTrips([]); setLoading(false); return; }
      const tripDocs = await Promise.all(tripIds.map(id => getDoc(doc(db, "trips", id))));
      const loaded = tripDocs.filter(d => d.exists())
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTrips(loaded);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "早安";
    if (h < 18) return "午安";
    return "晚安";
  };

  return (
    <div style={gs.app}>
      {/* Header 縮小版 */}
      <div style={{ padding: "52px 20px 14px", backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{greeting()}，</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user.displayName || "旅行者"} 👋</div>
          </div>
          <button onClick={() => signOut(auth)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", color: C.textMuted, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            登出
          </button>
        </div>
      </div>

      {/* 旅程列表 */}
      <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
          我的旅程
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: C.textMuted, paddingTop: 40 }}>載入中...</div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 50 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>還沒有旅程</div>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>建立第一趟旅行<br />或輸入邀請碼加入朋友的旅程</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trips.map((trip, i) => {
              const color = trip.color || TRIP_COLORS[i % TRIP_COLORS.length];
              const fmtDate = (d) => { if (!d) return null; const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; };
              return (
                <button key={trip.id} onClick={() => onEnterTrip(trip)}
                  style={{ ...gs.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", width: "100%", textAlign: "left", background: C.surface }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, backgroundColor: color+"22", border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {trip.emoji || "✈️"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{trip.name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {trip.destination && `📍 ${trip.destination}`}
                      {trip.startDate && ` · ${fmtDate(trip.startDate)}${trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ""}`}
                    </div>
                  </div>
                  <div style={{ color: color, fontSize: 18, fontWeight: 700 }}>›</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部按鈕 */}
      <div style={{ padding: "12px 20px 36px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => setShowCreate(true)}
          style={{
            width: "100%", border: "none", borderRadius: 14, padding: "15px",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
            color: "#fff", boxShadow: `0 4px 16px ${C.blue}40`,
          }}>
          ＋ 建立新旅程
        </button>
        <button onClick={() => setShowJoin(true)}
          style={{
            width: "100%", backgroundColor: C.surface, border: `1.5px solid ${C.border}`,
            borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", color: C.textMuted,
          }}>
          輸入邀請碼加入旅程
        </button>
      </div>

      {showCreate && <CreateTripModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadTrips(); }} />}
      {showJoin && <JoinTripModal user={user} onClose={() => setShowJoin(false)} onJoined={trip => { setShowJoin(false); onEnterTrip(trip); }} />}
    </div>
  );
}

// ─── 建立旅程 Modal ───────────────────────────────────────────
function CreateTripModal({ user, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [emoji, setEmoji] = useState("✈️");
  const [colorIdx, setColorIdx] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 根據開始/結束日期產生 mm/dd 陣列
  function generateDateList(start, end) {
    if (!start) return ["待安排"];
    const dates = ["待安排"];
    const s = new Date(start);
    const e = end ? new Date(end) : s;
    let cur = new Date(s);
    while (cur <= e) {
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const dd = String(cur.getDate()).padStart(2, "0");
      dates.push(`${mm}/${dd}`);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  async function handleCreate() {
    if (!name.trim()) { setError("請輸入旅程名稱"); return; }
    if (startDate && endDate && endDate < startDate) { setError("結束日期不能早於開始日期"); return; }
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const tripRef = await addDoc(collection(db, "trips"), {
        name: name.trim(),
        destination: destination.trim(),
        emoji,
        color: TRIP_COLORS[colorIdx],
        inviteCode,
        startDate: startDate || null,
        endDate: endDate || null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "tripMembers", `${tripRef.id}_${user.uid}`), {
        tripId: tripRef.id,
        uid: user.uid,
        displayName: user.displayName || user.email,
        role: "admin",
        joinedAt: serverTimestamp(),
      });
      // 自動建立行程日期頁籤
      const dates = generateDateList(startDate, endDate);
      await setDoc(doc(db, "tripData", `${tripRef.id}_itinerary`), {
        items: [],
        dates,
        updatedAt: serverTimestamp(),
      });
      onCreated();
    } catch (e) { setError("建立失敗，請再試一次"); }
    setLoading(false);
  }

  const tripColor = TRIP_COLORS[colorIdx];

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(45,42,36,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ ...gs.card, width: "100%", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box", borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>建立新旅程</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Emoji */}
        <label style={gs.label}>旅程圖示</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {TRIP_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              style={{ width: 44, height: 44, borderRadius: 11, fontSize: 22, cursor: "pointer", border: `2px solid ${emoji === e ? tripColor : C.border}`, backgroundColor: emoji === e ? tripColor + "18" : C.bg }}>
              {e}
            </button>
          ))}
        </div>

        {/* 顏色 */}
        <label style={gs.label}>顏色</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {TRIP_COLORS.map((c, i) => (
            <button key={c} onClick={() => setColorIdx(i)}
              style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer", backgroundColor: c, border: `3px solid ${colorIdx === i ? C.text : "transparent"}` }} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={gs.label}>旅程名稱 *</label>
            <input style={gs.input} placeholder="例：東京五天四夜" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={gs.label}>目的地</label>
            <input style={gs.input} placeholder="例：日本東京" value={destination} onChange={e => setDestination(e.target.value)} />
          </div>

          {/* 日期範圍 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={gs.label}>出發日期</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(""); }}
                style={gs.input} />
            </div>
            <div>
              <label style={gs.label}>回程日期</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                style={gs.input} />
            </div>
          </div>

          {/* 預覽天數 */}
          {startDate && (
            <div style={{ padding: "10px 14px", backgroundColor: tripColor + "12", borderRadius: 10, border: `1px solid ${tripColor}33` }}>
              <div style={{ fontSize: 12, color: tripColor, fontWeight: 700 }}>
                {endDate
                  ? `共 ${Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1} 天・行程日期將自動預設`
                  : "未填回程日期，將只建立出發日的行程頁籤"}
              </div>
            </div>
          )}
        </div>

        {error && <div style={{ marginTop: 10, color: C.danger, fontSize: 13 }}>{error}</div>}

        <button onClick={handleCreate} disabled={loading}
          style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 20, background: `linear-gradient(135deg,${tripColor},${C.purple})`, color: "#fff", opacity: loading ? 0.7 : 1 }}>
          {loading ? "建立中..." : "建立旅程 ✈️"}
        </button>
      </div>
    </div>
  );
}

// ─── 加入旅程 Modal ───────────────────────────────────────────
function JoinTripModal({ user, onClose, onJoined }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!code.trim()) { setError("請輸入邀請碼"); return; }
    setLoading(true);
    try {
      const q = query(collection(db, "trips"), where("inviteCode", "==", code.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) { setError("找不到這個邀請碼，請確認後再試"); setLoading(false); return; }
      const tripDoc = snap.docs[0];
      const tripId = tripDoc.id;
      const memberDoc = await getDoc(doc(db, "tripMembers", `${tripId}_${user.uid}`));
      if (!memberDoc.exists()) {
        await setDoc(doc(db, "tripMembers", `${tripId}_${user.uid}`), {
          tripId,
          uid: user.uid,
          displayName: user.displayName || user.email,
          role: "member",
          joinedAt: serverTimestamp(),
        });
      }
      onJoined({ id: tripId, ...tripDoc.data() });
    } catch (e) { setError("加入失敗，請再試一次"); }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(45,42,36,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ ...gs.card, width: "100%", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxSizing: "border-box", borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>加入旅程</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <label style={gs.label}>邀請碼</label>
        <input
          style={{ ...gs.input, fontSize: 24, letterSpacing: 6, textTransform: "uppercase", textAlign: "center", fontWeight: 700, color: C.purple }}
          placeholder="XXXXXX" value={code}
          onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
        {error && <div style={{ marginTop: 10, color: C.danger, fontSize: 13 }}>{error}</div>}
        <button onClick={handleJoin} disabled={loading}
          style={{
            width: "100%", border: "none", borderRadius: 13, padding: "14px",
            fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16,
            background: `linear-gradient(135deg, ${C.green}, ${C.blue})`,
            color: "#fff", opacity: loading ? 0.7 : 1,
          }}>
          {loading ? "加入中..." : "加入旅程"}
        </button>
      </div>
    </div>
  );
}

// ─── 旅程內頁 ─────────────────────────────────────────────────
// ─── 確認刪除 Dialog ──────────────────────────────────────────
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, backgroundColor:'rgba(45,42,36,0.5)' }} />
      <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:320, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{title || '確認刪除'}</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>{message || '此操作無法復原'}</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', border:`1px solid ${C.border}`, borderRadius:10, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:600, cursor:'pointer' }}>取消</button>
          <button onClick={() => { onClose(); setTimeout(() => onConfirm(), 50); }} style={{ flex:1, padding:'11px', border:'none', borderRadius:10, backgroundColor:C.danger, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>確認刪除</button>
        </div>
      </div>
    </div>
  );
}

// ─── 行程類別顏色 ─────────────────────────────────────────────
const getCategoryStyle = (cat) => {
  const map = {
    '景點': { bg: '#E8F7F2', color: C.green, border: '#B8E8D8' },
    '美食': { bg: '#FEF3E8', color: '#D97706', border: '#FDDCB0' },
    '購物': { bg: '#FDE8F3', color: '#BE185D', border: '#F9B8DA' },
    '交通': { bg: C.purpleSoft, color: C.purple, border: '#D4C4FF' },
    '住宿': { bg: C.blueSoft, color: C.blue, border: '#B8D0F8' },
    '其他': { bg: '#F0EDE8', color: C.textMuted, border: C.border },
  };
  return map[cat] || map['其他'];
};

// ─── 行程規劃 Tab ─────────────────────────────────────────────
function TripDetailScreen({ user, trip, onBack }) {
  const color = trip.color || C.blue;
  const [tab, setTab] = useState('itinerary');

  // ── 資料 state ──
  const [members, setMembers] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripDates, setTripDates] = useState(['待安排']);
  const [selectedDate, setSelectedDate] = useState('待安排');
  const [foodItems, setFoodItems] = useState([]);
  const [foodOptions, setFoodOptions] = useState({ categories:['必吃','咖啡甜點','居酒屋','拉麵','燒肉','海鮮','景點附近'], locations:[] });
  const [shoppingItems, setShoppingItems] = useState([]);
  const [shopOptions, setShopOptions] = useState({ cities:[], malls:{}, locations:{} });
  const [walletItems, setWalletItems] = useState([]);
  const [sharedTodos, setSharedTodos] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);

  // ── UI state ──
  const [modal, setModal] = useState({ open:false, data:null });
  const [tempPhotos, setTempPhotos] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerInput, setDatePickerInput] = useState('');
  const [foodModal, setFoodModal] = useState({ open:false, data:null });
  const [foodFilter, setFoodFilter] = useState([]);
  const [showManageFoodOptions, setShowManageFoodOptions] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState('');
  const [newFoodLocation, setNewFoodLocation] = useState('');
  const [shoppingModal, setShoppingModal] = useState({ open:false, data:null });
  const [shopFilterCity, setShopFilterCity] = useState('全部城市');
  const [shopFilterMall, setShopFilterMall] = useState('全部商場');
  const [shopFilterMember, setShopFilterMember] = useState('all');
  const [showManageShopOptions, setShowManageShopOptions] = useState(false);
  const [newShopCity, setNewShopCity] = useState('');
  const [newShopMall, setNewShopMall] = useState({});
  const [newShopLocation, setNewShopLocation] = useState({});
  const [walletModal, setWalletModal] = useState({ open:false, data:null });
  const [walletCalc, setWalletCalc] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [todoModal, setTodoModal] = useState({ open:false, data:null });
  const [noteModal, setNoteModal] = useState({ open:false, data:null });
  const [notePhoto, setNotePhoto] = useState(null);
  const [moreSection, setMoreSection] = useState(null); // null=更多首頁, 'todos','notes','members','invite'
  const [inviteVisible, setInviteVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAll();
  }, [trip.id]);

  async function loadAll() {
    try {
      await Promise.all([
        loadMembers(), loadItinerary(), loadFood(), loadFoodOptions(),
        loadShopping(), loadShopOptions(), loadWallet(), loadTodos(), loadNotes(),
      ]);
    } catch(e) { console.error(e); }
  }

  async function loadMembers() {
    const q = query(collection(db,"tripMembers"), where("tripId","==",trip.id));
    const s = await getDocs(q);
    setMembers(s.docs.map(d=>d.data()));
  }
  async function loadItinerary() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_itinerary`));
    if (s.exists()) { const d=s.data(); setItinerary(d.items||[]); setTripDates(d.dates||['待安排']); }
  }
  async function saveItinerary(items, dates) {
    await setDoc(doc(db,"tripData",`${trip.id}_itinerary`), { items:JSON.parse(JSON.stringify(items)), dates, updatedAt:serverTimestamp() });
  }
  async function loadFood() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_food`));
    if (s.exists()) setFoodItems(s.data().items||[]);
  }
  async function saveFood(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_food`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadFoodOptions() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_foodOptions`));
    if (s.exists()) setFoodOptions(s.data());
  }
  async function saveFoodOptions(opts) {
    await setDoc(doc(db,"tripData",`${trip.id}_foodOptions`), JSON.parse(JSON.stringify(opts)));
  }
  async function loadShopping() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_shopping`));
    if (s.exists()) setShoppingItems(s.data().items||[]);
  }
  async function saveShopping(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_shopping`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadShopOptions() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_shopOptions`));
    if (s.exists()) setShopOptions(s.data());
  }
  async function saveShopOptions(opts) {
    await setDoc(doc(db,"tripData",`${trip.id}_shopOptions`), JSON.parse(JSON.stringify(opts)));
  }
  async function loadWallet() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_wallet`));
    if (s.exists()) setWalletItems(s.data().items||[]);
  }
  async function saveWallet(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_wallet`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadTodos() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_todos`));
    if (s.exists()) setSharedTodos(s.data().items||[]);
  }
  async function saveTodos(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_todos`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadNotes() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_notes`));
    if (s.exists()) setSharedNotes(s.data().items||[]);
  }
  async function saveNotes(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_notes`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }

  // ── helpers ──
  const filteredItinerary = itinerary
    .filter(i=>i.date===selectedDate)
    .sort((a,b)=>selectedDate==='待安排'?(a.createdAt||0)-(b.createdAt||0):(a.time||'').localeCompare(b.time||''));

  const shopFiltered = shoppingItems.filter(item => {
    if (shopFilterCity!=='全部城市' && item.city!==shopFilterCity) return false;
    if (shopFilterMall!=='全部商場' && item.mall!==shopFilterMall) return false;
    if (shopFilterMember!=='all' && item.addedById!==shopFilterMember) return false;
    return true;
  }).sort((a,b) => a.isBought===b.isBought ? (a.createdAt||0)-(b.createdAt||0) : a.isBought?1:-1);

  const walletTotals = walletItems.reduce((acc,i) => {
    const cur=i.currency||'TWD'; const amt=Number(i.amount)||0;
    if (!acc[cur]) acc[cur]=0;
    acc[cur] += i.type==='存入'?amt:-amt;
    return acc;
  }, {});

  const sym = { JPY:'¥', KRW:'₩', TWD:'$', USD:'$' };

  function handleSelectDate(mmdd) {
    if (!tripDates.includes(mmdd)) {
      const nd=['待安排',...[...tripDates.filter(d=>d!=='待安排'),mmdd].sort()];
      setTripDates(nd); saveItinerary(itinerary,nd);
    }
    setSelectedDate(mmdd); setDatePickerOpen(false); setDatePickerInput('');
  }
  function handleDeleteDate(d) {
    const nd=tripDates.filter(x=>x!==d); setTripDates(nd);
    if(selectedDate===d) setSelectedDate('待安排');
    saveItinerary(itinerary,nd);
  }
  function handleSaveItem() {
    if(!modal.data?.name?.trim()) return;
    const fd={...modal.data, date:modal.data.date||selectedDate, photos:tempPhotos, editedByName:user.displayName||user.email, editedById:user.uid, createdAt:modal.data.createdAt||Date.now()};
    const ni=modal.data.id?itinerary.map(it=>it.id===modal.data.id?fd:it):[...itinerary,{...fd,id:Date.now()}];
    setItinerary(ni); saveItinerary(ni,tripDates); setModal({open:false,data:null}); setTempPhotos([]);
  }
  function handleDeleteItem(id) {
    const ni=itinerary.filter(it=>it.id!==id); setItinerary(ni); saveItinerary(ni,tripDates); setConfirmDel(null);
  }
  function copyCode() { navigator.clipboard.writeText(trip.inviteCode); setCopied(true); setTimeout(()=>setCopied(false),2000); }

  const getCat=(cat)=>{
    const map={'景點':{bg:'#E8F7F2',color:C.green,border:'#B8E8D8'},'美食':{bg:'#FEF3E8',color:'#D97706',border:'#FDDCB0'},'購物':{bg:'#FDE8F3',color:'#BE185D',border:'#F9B8DA'},'交通':{bg:C.purpleSoft,color:C.purple,border:'#D4C4FF'},'住宿':{bg:C.blueSoft,color:C.blue,border:'#B8D0F8'},'其他':{bg:'#F0EDE8',color:C.textMuted,border:C.border}};
    return map[cat]||map['其他'];
  };

  // ── 結算計算 ──
  const settlements = (() => {
    const balance = {};
    members.forEach(m => { balance[m.uid] = {}; });
    walletItems.forEach(w => {
      const payer = w.paidById || w.editedById;
      const splitTo = w.splitTo && w.splitTo.length > 0 ? w.splitTo : members.map(m=>m.uid);
      const amt = Number(w.amount) || 0;
      const cur = w.currency || 'TWD';
      const perPerson = Math.floor(amt / splitTo.length);
      const remainder = amt - perPerson * splitTo.length;
      splitTo.forEach((uid, idx) => {
        if (!balance[uid]) balance[uid] = {};
        if (!balance[payer]) balance[payer] = {};
        if (uid !== payer) {
          balance[uid][cur] = (balance[uid][cur]||0) - (perPerson + (idx < remainder ? 1 : 0));
          balance[payer][cur] = (balance[payer][cur]||0) + (perPerson + (idx < remainder ? 1 : 0));
        }
      });
    });
    const transfers = [];
    const currencies = [...new Set(walletItems.map(w=>w.currency||'TWD'))];
    currencies.forEach(cur => {
      const pos = [], neg = [];
      Object.entries(balance).forEach(([uid, bals]) => {
        const v = bals[cur]||0;
        if (v > 0.5) pos.push({uid, v});
        else if (v < -0.5) neg.push({uid, v: -v});
      });
      pos.sort((a,b)=>b.v-a.v); neg.sort((a,b)=>b.v-a.v);
      let i=0,j=0;
      const pc=[...pos.map(x=>({...x}))], nc=[...neg.map(x=>({...x}))];
      while(i<pc.length&&j<nc.length) {
        const amt=Math.min(pc[i].v,nc[j].v);
        if(amt>0.5) transfers.push({from:nc[j].uid,to:pc[i].uid,amount:Math.round(amt),currency:cur});
        pc[i].v-=amt; nc[j].v-=amt;
        if(pc[i].v<0.5)i++; if(nc[j].v<0.5)j++;
      }
    });
    return transfers;
  })();

  // ── 共用 Header ──
  const TripHeader = () => (
    <div style={{ padding:'52px 20px 14px', backgroundColor:color+'12', borderBottom:`1px solid ${color}33`, flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, width:36, height:36, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}>←</button>
        <div style={{ width:40, height:40, borderRadius:12, backgroundColor:color+'22', border:`1.5px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{trip.emoji||'✈️'}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{trip.name}</div>
          {trip.destination && <div style={{ fontSize:11, color:C.textMuted }}>📍 {trip.destination}</div>}
        </div>
      </div>
    </div>
  );

  // ── 底部 Tab Bar ──
  const TabBar = () => {
    const tabs = [
      { id:'itinerary', emoji:'🗓', label:'行程' },
      { id:'food', emoji:'🍜', label:'美食' },
      { id:'wallet', emoji:'💰', label:'帳務' },
      { id:'shopping', emoji:'🛍', label:'購物' },
      { id:'more', emoji:'⋯', label:'更多' },
    ];
    return (
      <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, backgroundColor:C.surface, flexShrink:0, paddingBottom:24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if(t.id!=='more') setMoreSection(null); }}
            style={{ flex:1, padding:'10px 4px 6px', border:'none', backgroundColor:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:22 }}>{t.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700, color:tab===t.id?color:C.textMuted }}>{t.label}</span>
            {tab===t.id && <div style={{ width:20, height:3, borderRadius:2, backgroundColor:color }} />}
          </button>
        ))}
      </div>
    );
  };

  // ════════════════════════════════════════
  // 行程 Tab
  // ════════════════════════════════════════
  const ItineraryTab = () => (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      {/* 日期列 */}
      <div style={{ position:'sticky', top:0, zIndex:30, backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase' }}>選擇日期</span>
          <button onClick={() => setDatePickerOpen(true)} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${color}44`, backgroundColor:color+'18', color, fontSize:12, fontWeight:700, cursor:'pointer' }}>＋ 日期</button>
        </div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
          {tripDates.map(d => (
            <div key={d} style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
              <button onClick={() => setSelectedDate(d)} style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${selectedDate===d?color:C.border}`, backgroundColor:selectedDate===d?color:C.surface, color:selectedDate===d?'#fff':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{d}</button>
              {d!=='待安排' && <button onClick={() => handleDeleteDate(d)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:13, cursor:'pointer', opacity:0.5, padding:'0 2px' }}>×</button>}
            </div>
          ))}
        </div>
      </div>
      {/* 行程列表 */}
      <div style={{ padding:16, flex:1 }}>
        {filteredItinerary.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無行程，點右下角 ＋ 新增</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12, position:'relative' }}>
            {selectedDate!=='待安排' && filteredItinerary.length>1 && (
              <div style={{ position:'absolute', left:17, top:28, bottom:28, width:2, backgroundColor:color+'33' }} />
            )}
            {filteredItinerary.map((item,idx) => {
              const cat=getCat(item.category);
              return (
                <div key={item.id} style={{ display:'flex', gap:12, position:'relative', zIndex:1 }}>
                  {selectedDate!=='待安排' && (
                    <div style={{ width:36, flexShrink:0, display:'flex', justifyContent:'center', paddingTop:14 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, border:'2px solid #fff', boxShadow:`0 2px 6px ${color}44` }}>{idx+1}</div>
                    </div>
                  )}
                  <div style={{ flex:1, ...gs.card, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
                        {item.time && <span style={{ padding:'3px 8px', borderRadius:6, backgroundColor:color+'18', color, fontSize:11, fontWeight:700 }}>{item.time}</span>}
                        <span style={{ padding:'3px 8px', borderRadius:6, backgroundColor:cat.bg, color:cat.color, border:`1px solid ${cat.border}`, fontSize:11, fontWeight:700 }}>{item.category}</span>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => { setModal({open:true,data:item}); setTempPhotos(item.photos||[]); }} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => setConfirmDel({title:'確認刪除',message:'確定刪除這個行程項目嗎？',fn:()=>handleDeleteItem(item.id)})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{item.name}</div>
                    {item.location && <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>📍 {item.location}</div>}
                    {item.note && <div style={{ fontSize:12, color:'#5A5247', backgroundColor:'#F8F4EE', borderLeft:`3px solid ${color}`, padding:'8px 10px', borderRadius:'0 8px 8px 0', marginBottom:8, whiteSpace:'pre-wrap' }}>{item.note}</div>}
                    {item.photos?.length>0 && (
                      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>
                        {item.photos.map((p,i) => <img key={i} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="pic" />)}
                      </div>
                    )}
                    <div style={{ fontSize:10, color:C.textMuted }}>{item.editedByName||'成員'} 編輯</div>
                    {item.mapUrl && <button onClick={() => window.open(item.mapUrl,'_blank')} style={{ marginTop:8, padding:'6px 12px', borderRadius:8, border:`1px solid ${color}44`, backgroundColor:color+'18', color, fontSize:12, fontWeight:700, cursor:'pointer' }}>🗺 開啟地圖</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* 新增按鈕 */}
      <button onClick={() => { setModal({open:true,data:{category:'景點',date:selectedDate}}); setTempPhotos([]); }}
        style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${color},${C.purple})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:`0 4px 16px ${color}66`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
    </div>
  );

  // ════════════════════════════════════════
  // 美食 Tab
  // ════════════════════════════════════════
  const FoodTab = () => {
    const filtered = foodItems.filter(item =>
      foodFilter.length===0 || foodFilter.some(f =>
        (item.categories||[item.category]).includes(f) || (item.locations||[item.location]).includes(f)
      )
    );
    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* 篩選 */}
        <div style={{ backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase' }}>美食清單 {filtered.length} 間</span>
            <button onClick={() => setShowManageFoodOptions(true)} style={{ fontSize:11, color:C.textMuted, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>管理選項</button>
          </div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
            <button onClick={() => setFoodFilter([])} style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodFilter.length===0?'#D97706':C.border}`, backgroundColor:foodFilter.length===0?'#FEF3E8':C.bg, color:foodFilter.length===0?'#D97706':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>全部</button>
            {foodOptions.categories.map(f => (
              <button key={f} onClick={() => setFoodFilter(prev=>prev.includes(f)?prev.filter(x=>x!==f):[...prev,f])}
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodFilter.includes(f)?'#D97706':C.border}`, backgroundColor:foodFilter.includes(f)?'#FEF3E8':C.bg, color:foodFilter.includes(f)?'#D97706':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{f}</button>
            ))}
            {foodOptions.locations.map(l => (
              <button key={l} onClick={() => setFoodFilter(prev=>prev.includes(l)?prev.filter(x=>x!==l):[...prev,l])}
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodFilter.includes(l)?C.blue:C.border}`, backgroundColor:foodFilter.includes(l)?C.blueSoft:C.bg, color:foodFilter.includes(l)?C.blue:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>📍 {l}</button>
            ))}
          </div>
        </div>
        {/* 列表 */}
        <div style={{ padding:16, flex:1 }}>
          {filtered.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無美食，點右下角 ＋ 新增</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {filtered.map(item => (
                <div key={item.id} style={{ ...gs.card, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
                      {(item.categories||(item.category?[item.category]:[])).map(c => <span key={c} style={{ padding:'3px 8px', borderRadius:6, backgroundColor:'#FEF3E8', color:'#D97706', border:'1px solid #FDDCB0', fontSize:11, fontWeight:700 }}>{c}</span>)}
                      {(item.locations||(item.location?[item.location]:[])).map(l => <span key={l} style={{ padding:'3px 8px', borderRadius:6, backgroundColor:C.blueSoft, color:C.blue, fontSize:11, fontWeight:700 }}>📍 {l}</span>)}
                      {item.visited && <span style={{ padding:'3px 8px', borderRadius:6, backgroundColor:C.greenSoft, color:C.green, fontSize:11, fontWeight:700 }}>✓ 已去</span>}
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={() => setFoodModal({open:true,data:{...item,categories:item.categories||(item.category?[item.category]:[]),locations:item.locations||(item.location?[item.location]:[])}})} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                      <button onClick={() => setConfirmDel({title:'刪除美食',message:`確定刪除「${item.name}」？`,fn:()=>{const n=foodItems.filter(i=>i.id!==item.id);setFoodItems(n);saveFood(n);}})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{item.name}</div>
                  {item.price && <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>💴 {item.price}</div>}
                  {item.note && <div style={{ fontSize:12, color:'#5A5247', backgroundColor:'#FEF3E8', borderLeft:'3px solid #D97706', padding:'8px 10px', borderRadius:'0 8px 8px 0', marginBottom:8, whiteSpace:'pre-wrap' }}>{item.note}</div>}
                  {item.photos?.length>0 && <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>{item.photos.map((p,i) => <img key={i} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="food" />)}</div>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                    <div style={{ fontSize:10, color:C.textMuted }}>{item.editedByName||'成員'} 新增</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => { const n=foodItems.map(i=>i.id===item.id?{...i,visited:!i.visited}:i); setFoodItems(n);saveFood(n); }}
                        style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${item.visited?C.green:C.border}`, backgroundColor:item.visited?C.greenSoft:C.bg, color:item.visited?C.green:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        {item.visited?'✓ 已去':'標記已去'}
                      </button>
                      {item.mapUrl && <button onClick={() => window.open(item.mapUrl,'_blank')} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #FDDCB0', backgroundColor:'#FEF3E8', color:'#D97706', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setFoodModal({open:true,data:{categories:[],locations:[],visited:false}})}
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 4px 16px rgba(217,119,6,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
      </div>
    );
  };

  // ════════════════════════════════════════
  // 帳務 Tab
  // ════════════════════════════════════════
  const WalletTab = () => {
    const sorted = [...walletItems].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* 餘額總覽 */}
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', gap:10, overflowX:'auto', marginBottom:10 }}>
            {Object.entries(walletTotals).length===0
              ? <div style={{ fontSize:12, color:C.textMuted }}>尚無帳目</div>
              : Object.entries(walletTotals).map(([cur,val]) => (
                <div key={cur} style={{ flexShrink:0, padding:'8px 14px', borderRadius:12, backgroundColor:val>=0?C.greenSoft:C.dangerSoft, border:`1px solid ${val>=0?C.green:C.danger}33` }}>
                  <div style={{ fontSize:10, color:C.textMuted, marginBottom:2 }}>{cur}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:val>=0?C.green:C.danger }}>{val>=0?'+':''}{sym[cur]||''}{Math.abs(val).toLocaleString()}</div>
                </div>
              ))
            }
          </div>
          {settlements.length>0 && (
            <button onClick={() => setShowSettlement(true)} style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1px solid ${C.purple}33`, backgroundColor:C.purpleSoft, color:C.purple, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>💸 結算：{settlements.length} 筆待還</span>
              <span>查看 ›</span>
            </button>
          )}
        </div>
        {/* 帳目列表 */}
        <div style={{ padding:16, flex:1 }}>
          {sorted.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無帳目，點右下角 ＋ 新增</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {sorted.map(item => {
                const payer = members.find(m=>m.uid===item.paidById)||{displayName:item.editedByName||'成員'};
                const splitNames = (item.splitTo||members.map(m=>m.uid)).map(uid=>members.find(m=>m.uid===uid)?.displayName||uid).join('・');
                return (
                  <div key={item.id} style={{ ...gs.card, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                          <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:item.type==='存入'?C.greenSoft:C.dangerSoft, color:item.type==='存入'?C.green:C.danger, fontSize:11, fontWeight:700 }}>{item.type}</span>
                          <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.purpleSoft, color:C.purple, fontSize:11, fontWeight:700 }}>{item.currency||'TWD'}</span>
                          {item.date && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.bg, color:C.textMuted, fontSize:11 }}>{item.date}</span>}
                        </div>
                        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{item.name}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>{payer.displayName} 付款 · 分攤：{splitNames}</div>
                        {item.note && <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{item.note}</div>}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:item.type==='存入'?C.green:C.danger }}>{item.type==='存入'?'+':'-'}{sym[item.currency||'TWD']||''}{Number(item.amount||0).toLocaleString()}</div>
                        <div style={{ display:'flex', gap:4, marginTop:6, justifyContent:'flex-end' }}>
                          <button onClick={() => setWalletModal({open:true,data:item})} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                          <button onClick={() => setConfirmDel({title:'刪除帳目',message:`確定刪除「${item.name}」？`,fn:()=>{const n=walletItems.filter(i=>i.id!==item.id);setWalletItems(n);saveWallet(n);}})} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:11, cursor:'pointer' }}>🗑</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={() => setWalletModal({open:true,data:{type:'支出',currency:'TWD',splitTo:members.map(m=>m.uid),paidById:user.uid}})}
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.purple},${C.blue})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:`0 4px 16px ${C.purple}66`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
      </div>
    );
  };

  // ════════════════════════════════════════
  // 購物 Tab
  // ════════════════════════════════════════
  const ShoppingTab = () => (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      {/* 篩選 */}
      <div style={{ backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <select value={shopFilterMember} onChange={e=>setShopFilterMember(e.target.value)}
            style={{ flex:1, padding:'7px 10px', borderRadius:10, border:`1.5px solid ${shopFilterMember!=='all'?'#BE185D':C.border}`, backgroundColor:shopFilterMember!=='all'?'#FDE8F3':C.bg, color:shopFilterMember!=='all'?'#BE185D':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer', outline:'none' }}>
            <option value="all">全員</option>
            {members.map(m=><option key={m.uid} value={m.uid}>{m.uid===user.uid?`${m.displayName}（我）`:m.displayName}</option>)}
          </select>
          <button onClick={() => setShowManageShopOptions(true)} style={{ fontSize:11, color:C.textMuted, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 10px', cursor:'pointer', fontWeight:600, flexShrink:0 }}>管理選項</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select value={shopFilterCity} onChange={e=>{setShopFilterCity(e.target.value);setShopFilterMall('全部商場');}}
            style={{ flex:1, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterCity!=='全部城市'?'#BE185D':C.border}`, backgroundColor:shopFilterCity!=='全部城市'?'#FDE8F3':C.bg, color:shopFilterCity!=='全部城市'?'#BE185D':C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
            <option value="全部城市">全部城市</option>
            {(shopOptions.cities||[]).map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={shopFilterMall} onChange={e=>setShopFilterMall(e.target.value)}
            style={{ flex:1, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterMall!=='全部商場'?'#BE185D':C.border}`, backgroundColor:shopFilterMall!=='全部商場'?'#FDE8F3':C.bg, color:shopFilterMall!=='全部商場'?'#BE185D':C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
            <option value="全部商場">全部商場</option>
            {(shopFilterCity!=='全部城市'?(shopOptions.malls||{})[shopFilterCity]||[]:[]).map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ fontSize:10, color:C.textMuted, marginTop:6 }}>共 {shopFiltered.length} 件・{shopFiltered.filter(i=>i.isBought).length} 件已買</div>
      </div>
      {/* 列表 */}
      <div style={{ padding:16, flex:1 }}>
        {shopFiltered.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無清單，點右下角 ＋ 新增</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {shopFiltered.map(item => {
              const isMine=item.addedById===user.uid;
              const mc=[C.blue,C.green,C.purple,'#E0875A'][(item.addedByName||'').charCodeAt(0)%4];
              return (
                <div key={item.id} style={{ ...gs.card, padding:'14px 16px', opacity:item.isBought?0.65:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
                      {item.city && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'#FDE8F3', color:'#BE185D', fontSize:11, fontWeight:700 }}>📍 {item.city}</span>}
                      {item.mall && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'#FDE8F3', color:'#BE185D', fontSize:11, fontWeight:700 }}>🏪 {item.mall}</span>}
                    </div>
                    {isMine && (
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => setShoppingModal({open:true,data:item})} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => setConfirmDel({title:'刪除',message:`確定刪除「${item.name}」？`,fn:()=>{const n=shoppingItems.filter(i=>i.id!==item.id);setShoppingItems(n);saveShopping(n);}})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => {
                      const n=shoppingItems.map(i=>i.id===item.id?{...i,isBought:!i.isBought,boughtAt:!i.isBought?new Date().toLocaleString('zh-TW'):null}:i);
                      setShoppingItems(n);saveShopping(n);
                    }} style={{ width:28, height:28, borderRadius:8, border:`2px solid ${item.isBought?'#BE185D':C.border}`, backgroundColor:item.isBought?'#BE185D':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                      {item.isBought && <span style={{ color:'#fff', fontSize:14, fontWeight:800 }}>✓</span>}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, textDecoration:item.isBought?'line-through':'none', color:C.text }}>{item.name}</div>
                      {item.note && <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{item.note}</div>}
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10, color:C.textMuted }}>{item.addedByName||'成員'} 許願</div>
                    {item.mapUrl && <button onClick={() => window.open(item.mapUrl,'_blank')} style={{ padding:'4px 10px', borderRadius:8, border:'1px solid #F9B8DA', backgroundColor:'#FDE8F3', color:'#BE185D', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={() => setShoppingModal({open:true,data:{city:shopFilterCity!=='全部城市'?shopFilterCity:'',mall:shopFilterMall!=='全部商場'?shopFilterMall:''}})}
        style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:'linear-gradient(135deg,#BE185D,#EC4899)', color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 4px 16px rgba(190,24,93,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
    </div>
  );

  // ════════════════════════════════════════
  // 更多 Tab
  // ════════════════════════════════════════
  const MoreTab = () => {
    if (moreSection==='todos') {
      const sorted=[...sharedTodos.filter(t=>!t.status).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)),...sharedTodos.filter(t=>t.status)];
      return (
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:C.textMuted }}>←</button>
            <div style={{ fontSize:15, fontWeight:800 }}>共同清單</div>
          </div>
          <div style={{ padding:16, flex:1 }}>
            {sorted.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無清單，點右下角 ＋ 新增</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {sorted.map(todo => (
                  <div key={todo.id} style={{ ...gs.card, padding:'14px 16px', opacity:todo.status?0.6:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <button onClick={() => { const now=new Date(); const ts=`${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}`; const n=sharedTodos.map(t=>t.id===todo.id?{...t,status:!t.status,completedByName:!t.status?(user.displayName||user.email):null,completedAt:!t.status?ts:null}:t); setSharedTodos(n);saveTodos(n); }}
                        style={{ width:28, height:28, borderRadius:8, border:`2px solid ${todo.status?C.green:C.border}`, backgroundColor:todo.status?C.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                        {todo.status && <span style={{ color:'#fff', fontSize:14, fontWeight:800 }}>✓</span>}
                      </button>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, textDecoration:todo.status?'line-through':'none' }}>{todo.content}</div>
                        {todo.note && <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{todo.note}</div>}
                        <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>{todo.editedByName} 新增{todo.status&&` · ✓ ${todo.completedByName} ${todo.completedAt}`}</div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setTodoModal({open:true,data:todo})} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => { const n=sharedTodos.filter(t=>t.id!==todo.id); setSharedTodos(n);saveTodos(n); }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:11, cursor:'pointer' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setTodoModal({open:true,data:{}})} style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.green},${C.blue})`, color:'#fff', fontSize:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
        </div>
      );
    }

    if (moreSection==='notes') {
      const sorted=[...sharedNotes].filter(Boolean).sort((a,b)=>(b.createdAtMs||0)-(a.createdAtMs||0));
      return (
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:C.textMuted }}>←</button>
            <div style={{ fontSize:15, fontWeight:800 }}>共同記事</div>
          </div>
          <div style={{ padding:16, flex:1 }}>
            {sorted.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無記事，點右下角 ＋ 新增</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {sorted.map(note => (
                  <div key={note.id} style={{ ...gs.card, padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
                      <button onClick={() => { setNoteModal({open:true,data:note}); setNotePhoto(note.photo||null); }} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                      <button onClick={() => { const n=sharedNotes.filter(x=>x.id!==note.id); setSharedNotes(n);saveNotes(n); }} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                    </div>
                    {note.photo && <img src={note.photo} style={{ width:'100%', height:160, objectFit:'cover', borderRadius:12, marginBottom:10 }} alt="note" />}
                    {note.content && <div style={{ fontSize:14, color:C.text, whiteSpace:'pre-wrap', lineHeight:1.7, marginBottom:10 }}>{note.content}</div>}
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.textMuted, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                      <span>{note.date}</span>
                      <span>{note.editedByName||'成員'} 記</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setNoteModal({open:true,data:{}}); setNotePhoto(null); }} style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.blue},${C.purple})`, color:'#fff', fontSize:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
        </div>
      );
    }

    if (moreSection==='members') return (
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:C.textMuted }}>←</button>
          <div style={{ fontSize:15, fontWeight:800 }}>成員</div>
        </div>
        <div style={{ padding:20 }}>
          <div style={gs.card}>
            <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:12 }}>成員（{members.length} 人）</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {members.map(m => {
                const mc=[C.blue,C.green,C.purple,'#E0875A'][(m.displayName||'').charCodeAt(0)%4];
                return (
                  <div key={m.uid} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', backgroundColor:mc+'22', border:`1.5px solid ${mc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:mc, flexShrink:0 }}>{(m.displayName||'?')[0].toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{m.displayName}{m.uid===user.uid&&<span style={{ fontSize:11, color:C.textMuted, marginLeft:6 }}>（我）</span>}</div>
                      <div style={{ fontSize:11, color:m.role==='admin'?C.blue:C.textMuted, fontWeight:600 }}>{m.role==='admin'?'管理員':'成員'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );

    if (moreSection==='invite') return (
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:C.textMuted }}>←</button>
          <div style={{ fontSize:15, fontWeight:800 }}>邀請碼</div>
        </div>
        <div style={{ padding:20 }}>
          <div style={gs.card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ flex:1, backgroundColor:C.bg, borderRadius:12, padding:'14px', fontSize:26, fontWeight:800, letterSpacing:6, textAlign:'center', color:inviteVisible?color:C.textMuted, border:`1.5px solid ${C.border}` }}>
                {inviteVisible?trip.inviteCode:'• • • • • •'}
              </div>
              <button onClick={() => setInviteVisible(v=>!v)} style={{ backgroundColor:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'14px', fontSize:13, cursor:'pointer', color:C.textMuted, fontWeight:600 }}>{inviteVisible?'隱藏':'顯示'}</button>
            </div>
            {inviteVisible && <button onClick={copyCode} style={{ width:'100%', border:'none', borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:'pointer', backgroundColor:copied?C.successSoft:C.blueSoft, color:copied?C.success:C.blue, marginBottom:14 }}>{copied?'✓ 已複製！':'複製邀請碼'}</button>}
            <div style={{ padding:'12px 14px', backgroundColor:C.bg, borderRadius:12, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontWeight:600 }}>朋友加入步驟</div>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>1. 開啟旅遊小助理並登入<br/>2. 點「輸入邀請碼加入旅程」<br/>3. 輸入 6 位邀請碼即可</div>
            </div>
          </div>
        </div>
      </div>
    );

    // 更多首頁
    const moreItems = [
      { id:'todos', emoji:'✅', label:'共同清單', desc:`${sharedTodos.filter(t=>!t.status).length} 件待完成`, color:C.green, bg:C.greenSoft },
      { id:'notes', emoji:'📝', label:'共同記事', desc:`${sharedNotes.length} 則`, color:C.blue, bg:C.blueSoft },
      { id:'members', emoji:'👥', label:'成員', desc:`${members.length} 人`, color:'#D97706', bg:'#FEF3E8' },
      { id:'invite', emoji:'🔑', label:'邀請碼', desc:trip.inviteCode||'...', color:C.purple, bg:C.purpleSoft },
    ];
    return (
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {moreItems.map(item => (
            <button key={item.id} onClick={() => setMoreSection(item.id)}
              style={{ ...gs.card, cursor:'pointer', textAlign:'left', padding:'16px 18px', border:`1.5px solid ${item.color}22`, background:item.bg, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:30 }}>{item.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:item.color }}>{item.label}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{item.desc}</div>
              </div>
              <div style={{ color:item.color, fontSize:18 }}>›</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════
  // Modals
  // ════════════════════════════════════════

  // 行程 Modal
  const ItineraryModal = () => !modal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{modal.data?.id?'編輯行程':'新增行程'}</div>
          <button onClick={() => setModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><label style={gs.label}>日期</label><select value={modal.data?.date||selectedDate} onChange={e=>setModal(p=>({...p,data:{...p.data,date:e.target.value}}))} style={{ ...gs.input, cursor:'pointer' }}>{tripDates.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
          <div><label style={gs.label}>時間</label><input type="time" value={modal.data?.time||''} onChange={e=>setModal(p=>({...p,data:{...p.data,time:e.target.value}}))} style={gs.input} /></div>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>類別</label><select value={modal.data?.category||'景點'} onChange={e=>setModal(p=>({...p,data:{...p.data,category:e.target.value}}))} style={{ ...gs.input, cursor:'pointer' }}>{['景點','美食','購物','交通','住宿','其他'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>項目名稱 *</label><input style={gs.input} placeholder="例：逛淺草寺" value={modal.data?.name||''} onChange={e=>setModal(p=>({...p,data:{...p.data,name:e.target.value}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>📍 地點</label><input style={gs.input} placeholder="例：淺草寺" value={modal.data?.location||''} onChange={e=>setModal(p=>({...p,data:{...p.data,location:e.target.value}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>地圖連結</label><input style={gs.input} placeholder="貼上 Google Maps 連結" value={modal.data?.mapUrl||''} onChange={e=>setModal(p=>({...p,data:{...p.data,mapUrl:e.target.value}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>備註</label><textarea value={modal.data?.note||''} onChange={e=>setModal(p=>({...p,data:{...p.data,note:e.target.value}}))} rows={3} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
        <div style={{ marginBottom:16 }}><label style={gs.label}>相片（最多5張）</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {tempPhotos.map((url,i) => (
              <div key={i} style={{ position:'relative', width:60, height:60, borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}` }}>
                <img src={url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="tmp" />
                <button onClick={() => setTempPhotos(p=>p.filter((_,j)=>j!==i))} style={{ position:'absolute', top:2, right:2, width:18, height:18, borderRadius:4, backgroundColor:'rgba(220,50,50,0.9)', border:'none', color:'#fff', fontSize:12, cursor:'pointer' }}>×</button>
              </div>
            ))}
            {tempPhotos.length<5 && <button onClick={() => document.getElementById('trip-photo-input').click()} style={{ width:60, height:60, borderRadius:10, border:`1.5px dashed ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>📷</button>}
          </div>
          <input type="file" id="trip-photo-input" style={{ display:'none' }} multiple accept="image/*" onChange={e => {
            Array.from(e.target.files).forEach(file => { const r=new FileReader(); r.onloadend=()=>{ const img=new Image(); img.src=r.result; img.onload=()=>{ const c=document.createElement('canvas'); let w=img.width,h=img.height,max=600; if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}} c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h); setTempPhotos(p=>p.length<5?[...p,c.toDataURL('image/jpeg',0.6)]:p); }; }; r.readAsDataURL(file); });
          }} />
        </div>
        <button onClick={handleSaveItem} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${color},${C.purple})`, color:'#fff' }}>確認儲存</button>
      </div>
    </div>
  );

  // 美食 Modal
  const FoodModal = () => !foodModal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{foodModal.data?.id?'編輯美食':'新增美食'}</div>
          <button onClick={() => setFoodModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom:14 }}><label style={gs.label}>店家名稱 *</label><input style={gs.input} placeholder="例：一蘭拉麵" value={foodModal.data?.name||''} onChange={e=>setFoodModal(p=>({...p,data:{...p.data,name:e.target.value}}))} /></div>
        <div style={{ marginBottom:14 }}>
          <label style={gs.label}>類別（可多選）</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {foodOptions.categories.map(c=>{ const sel=(foodModal.data?.categories||[]).includes(c); return <button key={c} type="button" onClick={() => setFoodModal(p=>{ const cur=p.data?.categories||[]; return {...p,data:{...p.data,categories:sel?cur.filter(x=>x!==c):[...cur,c]}}; })} style={{ padding:'7px 12px', borderRadius:10, border:`1.5px solid ${sel?'#D97706':C.border}`, backgroundColor:sel?'#FEF3E8':C.bg, color:sel?'#D97706':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>{c}</button>; })}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={gs.label}>地點（可多選）</label>
          {foodOptions.locations.length===0 ? <div style={{ fontSize:12, color:C.textMuted }}>請先到「管理選項」新增地點</div> : (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {foodOptions.locations.map(l=>{ const sel=(foodModal.data?.locations||[]).includes(l); return <button key={l} type="button" onClick={() => setFoodModal(p=>{ const cur=p.data?.locations||[]; return {...p,data:{...p.data,locations:sel?cur.filter(x=>x!==l):[...cur,l]}}; })} style={{ padding:'7px 12px', borderRadius:10, border:`1.5px solid ${sel?C.blue:C.border}`, backgroundColor:sel?C.blueSoft:C.bg, color:sel?C.blue:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>📍 {l}</button>; })}
            </div>
          )}
        </div>
        <div style={{ marginBottom:14 }}><label style={gs.label}>💴 價位</label><input style={gs.input} placeholder="例：¥1500" value={foodModal.data?.price||''} onChange={e=>setFoodModal(p=>({...p,data:{...p.data,price:e.target.value}}))} /></div>
        <div style={{ marginBottom:14 }}><label style={gs.label}>地圖連結</label><input style={gs.input} placeholder="貼上 Google Maps 連結" value={foodModal.data?.mapUrl||''} onChange={e=>setFoodModal(p=>({...p,data:{...p.data,mapUrl:e.target.value}}))} /></div>
        <div style={{ marginBottom:18 }}><label style={gs.label}>備註</label><textarea value={foodModal.data?.note||''} onChange={e=>setFoodModal(p=>({...p,data:{...p.data,note:e.target.value}}))} rows={3} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
        <button onClick={() => { if(!foodModal.data?.name?.trim())return; const fd={...foodModal.data,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:foodModal.data.createdAt||Date.now()}; const n=foodModal.data.id?foodItems.map(i=>i.id===foodModal.data.id?fd:i):[...foodItems,{...fd,id:Date.now()}]; setFoodItems(n);saveFood(n);setFoodModal({open:false,data:null}); }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#fff' }}>確認儲存</button>
      </div>
    </div>
  );

  // 管理美食選項 Modal
  const ManageFoodOptionsModal = () => !showManageFoodOptions ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>管理美食選項</div>
          <button onClick={() => setShowManageFoodOptions(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={gs.label}>類別</label>
          {foodOptions.categories.map(c => (
            <div key={c} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', backgroundColor:C.bg, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:6 }}>
              <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{c}</span>
              <button onClick={() => { const o={...foodOptions,categories:foodOptions.categories.filter(x=>x!==c)}; setFoodOptions(o);saveFoodOptions(o); }} style={{ background:'none', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <input style={{ ...gs.input, flex:1 }} placeholder="新增類別..." value={newFoodCategory} onChange={e=>setNewFoodCategory(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newFoodCategory.trim()){ const o={...foodOptions,categories:[...foodOptions.categories,newFoodCategory.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodCategory(''); }}} />
            <button onClick={() => { if(!newFoodCategory.trim())return; const o={...foodOptions,categories:[...foodOptions.categories,newFoodCategory.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodCategory(''); }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:'#D97706', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={gs.label}>地點</label>
          {foodOptions.locations.map(l => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', backgroundColor:C.bg, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:6 }}>
              <span style={{ flex:1, fontSize:14, fontWeight:600 }}>📍 {l}</span>
              <button onClick={() => { const o={...foodOptions,locations:foodOptions.locations.filter(x=>x!==l)}; setFoodOptions(o);saveFoodOptions(o); }} style={{ background:'none', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
            </div>
          ))}
          {foodOptions.locations.length===0 && <div style={{ fontSize:12, color:C.textMuted, padding:'4px 0' }}>尚未新增地點</div>}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <input style={{ ...gs.input, flex:1 }} placeholder="例：新宿、涉谷" value={newFoodLocation} onChange={e=>setNewFoodLocation(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newFoodLocation.trim()){ const o={...foodOptions,locations:[...foodOptions.locations,newFoodLocation.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodLocation(''); }}} />
            <button onClick={() => { if(!newFoodLocation.trim())return; const o={...foodOptions,locations:[...foodOptions.locations,newFoodLocation.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodLocation(''); }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:C.blue, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
          </div>
        </div>
        <button onClick={() => setShowManageFoodOptions(false)} style={{ width:'100%', padding:14, border:`1px solid ${C.border}`, borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', backgroundColor:C.bg, color:C.text }}>完成</button>
      </div>
    </div>
  );

  // 購物 Modal
  const ShoppingModal = () => !shoppingModal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{shoppingModal.data?.id?'編輯購物':'新增購物'}</div>
          <button onClick={() => setShoppingModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>🏙️ 城市</label>
          <select value={shoppingModal.data?.city||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,city:e.target.value,mall:''}}))} style={{ ...gs.input, cursor:'pointer' }}>
            <option value="">無特定城市</option>
            {(shopOptions.cities||[]).map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>🏪 商場</label>
          <select value={shoppingModal.data?.mall||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,mall:e.target.value}}))} style={{ ...gs.input, cursor:'pointer' }}>
            <option value="">無特定商場</option>
            {((shopOptions.malls||{})[shoppingModal.data?.city]||[]).map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>🛍️ 商品名稱 *</label><input style={gs.input} placeholder="例：Matin Kim 外套" value={shoppingModal.data?.name||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,name:e.target.value}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>🌐 地圖連結</label><input style={gs.input} placeholder="貼上 Google Maps 連結" value={shoppingModal.data?.mapUrl||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,mapUrl:e.target.value}}))} /></div>
        <div style={{ marginBottom:16 }}><label style={gs.label}>💡 備註</label><textarea value={shoppingModal.data?.note||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,note:e.target.value}}))} rows={2} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
        <button onClick={() => { if(!shoppingModal.data?.name?.trim())return; const fd={...shoppingModal.data,isBought:shoppingModal.data.isBought||false,addedByName:user.displayName||user.email,addedById:user.uid,createdAt:shoppingModal.data.createdAt||Date.now()}; const n=shoppingModal.data.id?shoppingItems.map(i=>i.id===shoppingModal.data.id?fd:i):[...shoppingItems,{...fd,id:Date.now()}]; setShoppingItems(n);saveShopping(n);setShoppingModal({open:false,data:null}); }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#BE185D,#EC4899)', color:'#fff' }}>確認儲存</button>
      </div>
    </div>
  );

  // 管理購物選項 Modal
  const ManageShopOptionsModal = () => !showManageShopOptions ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>管理購物選項</div>
          <button onClick={() => setShowManageShopOptions(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={gs.label}>🏙️ 城市</label>
          {(shopOptions.cities||[]).map(c => (
            <div key={c} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', backgroundColor:C.bg, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:6 }}>
              <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{c}</span>
              <button onClick={() => { const o={...shopOptions,cities:(shopOptions.cities||[]).filter(x=>x!==c)}; setShopOptions(o);saveShopOptions(o); }} style={{ background:'none', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <input style={{ ...gs.input, flex:1 }} placeholder="新增城市..." value={newShopCity} onChange={e=>setNewShopCity(e.target.value)} />
            <button onClick={() => { if(!newShopCity.trim())return; const o={...shopOptions,cities:[...(shopOptions.cities||[]),newShopCity.trim()]}; setShopOptions(o);saveShopOptions(o);setNewShopCity(''); }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:'#BE185D', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
          </div>
        </div>
        {(shopOptions.cities||[]).map(city => (
          <div key={city} style={{ marginBottom:20 }}>
            <label style={gs.label}>🏪 {city} 商場</label>
            {((shopOptions.malls||{})[city]||[]).map(m => (
              <div key={m} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', backgroundColor:C.bg, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:6 }}>
                <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{m}</span>
                <button onClick={() => { const o={...shopOptions,malls:{...(shopOptions.malls||{}),[city]:((shopOptions.malls||{})[city]||[]).filter(x=>x!==m)}}; setShopOptions(o);saveShopOptions(o); }} style={{ background:'none', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              <input style={{ ...gs.input, flex:1 }} placeholder={`新增 ${city} 商場...`} value={newShopMall[city]||''} onChange={e=>setNewShopMall(p=>({...p,[city]:e.target.value}))} />
              <button onClick={() => { const v=(newShopMall[city]||'').trim(); if(!v)return; const o={...shopOptions,malls:{...(shopOptions.malls||{}),[city]:[...((shopOptions.malls||{})[city]||[]),v]}}; setShopOptions(o);saveShopOptions(o);setNewShopMall(p=>({...p,[city]:''})); }} style={{ padding:'12px 14px', border:'none', borderRadius:12, backgroundColor:'#BE185D', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
            </div>
          </div>
        ))}
        <button onClick={() => setShowManageShopOptions(false)} style={{ width:'100%', padding:14, border:`1px solid ${C.border}`, borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', backgroundColor:C.bg, color:C.text }}>完成</button>
      </div>
    </div>
  );

  // 記帳 Modal
  const WalletModal = () => !walletModal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{walletModal.data?.id?'編輯帳目':'新增帳目'}</div>
          <button onClick={() => { setWalletModal({open:false,data:null}); setWalletCalc(false); }} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        {/* 存入/支出 */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {['支出','存入'].map(t => (
            <button key={t} type="button" onClick={() => setWalletModal(p=>({...p,data:{...p.data,type:t}}))}
              style={{ flex:1, padding:11, borderRadius:12, border:`1.5px solid ${walletModal.data?.type===t?(t==='支出'?C.danger:C.green):C.border}`, backgroundColor:walletModal.data?.type===t?(t==='支出'?C.dangerSoft:C.greenSoft):C.bg, color:walletModal.data?.type===t?(t==='支出'?C.danger:C.green):C.textMuted, fontSize:14, fontWeight:700, cursor:'pointer' }}>{t}</button>
          ))}
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>項目名稱 *</label><input style={gs.input} placeholder="例：晚餐、計程車" value={walletModal.data?.name||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,name:e.target.value}}))} /></div>
        {/* 金額 + 計算機 */}
        <div style={{ backgroundColor:C.bg, borderRadius:14, padding:14, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>金額</div>
              <input type="text" value={walletModal.data?.amount||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,amount:e.target.value}}))} placeholder="0" style={{ fontSize:28, fontWeight:800, color:C.text, background:'none', border:'none', outline:'none', width:'100%' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
              <button onClick={() => setWalletCalc(v=>!v)} style={{ padding:'6px 10px', borderRadius:10, border:`1px solid ${walletCalc?C.purple:C.border}`, backgroundColor:walletCalc?C.purpleSoft:C.bg, color:walletCalc?C.purple:C.textMuted, fontSize:18, cursor:'pointer' }}>🔢</button>
              <select value={walletModal.data?.currency||'TWD'} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,currency:e.target.value}}))} style={{ padding:'5px 8px', borderRadius:8, border:`1px solid ${C.border}`, backgroundColor:C.bg, fontSize:13, fontWeight:700, color:C.purple, cursor:'pointer', outline:'none' }}>
                {['TWD','JPY','KRW','USD'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        {walletCalc && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
            {[1,2,3,4,5,6,7,8,9,'.',0].map(n => (
              <button key={n} onClick={() => setWalletModal(p=>({...p,data:{...p.data,amount:(p.data?.amount||'')+n.toString()}}))} style={{ padding:12, borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.surface, fontSize:16, fontWeight:700, cursor:'pointer' }}>{n}</button>
            ))}
            <button onClick={() => setWalletModal(p=>({...p,data:{...p.data,amount:(p.data?.amount||'').slice(0,-1)}}))} style={{ padding:12, borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.bg, fontSize:16, cursor:'pointer' }}>⌫</button>
          </div>
        )}
        {/* 誰付錢 */}
        <div style={{ marginBottom:12 }}>
          <label style={gs.label}>誰付錢</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {members.map(m => {
              const sel=(walletModal.data?.paidById||user.uid)===m.uid;
              return <button key={m.uid} type="button" onClick={() => setWalletModal(p=>({...p,data:{...p.data,paidById:m.uid}}))} style={{ padding:'7px 12px', borderRadius:10, border:`1.5px solid ${sel?C.purple:C.border}`, backgroundColor:sel?C.purpleSoft:C.bg, color:sel?C.purple:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>{m.uid===user.uid?`${m.displayName}（我）`:m.displayName}</button>;
            })}
          </div>
        </div>
        {/* 分攤給誰 */}
        <div style={{ marginBottom:12 }}>
          <label style={gs.label}>分攤給誰（不選=全員均分）</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {members.map(m => {
              const splitTo=walletModal.data?.splitTo||members.map(x=>x.uid);
              const sel=splitTo.includes(m.uid);
              return <button key={m.uid} type="button" onClick={() => setWalletModal(p=>{ const cur=p.data?.splitTo||members.map(x=>x.uid); const next=sel?cur.filter(x=>x!==m.uid):[...cur,m.uid]; return {...p,data:{...p.data,splitTo:next.length===0?members.map(x=>x.uid):next}}; })} style={{ padding:'7px 12px', borderRadius:10, border:`1.5px solid ${sel?C.green:C.border}`, backgroundColor:sel?C.greenSoft:C.bg, color:sel?C.green:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>{m.uid===user.uid?`${m.displayName}（我）`:m.displayName}</button>;
            })}
          </div>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>日期</label><input type="date" style={gs.input} value={walletModal.data?.date||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,date:e.target.value}}))} /></div>
        <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><input style={gs.input} placeholder="選填" value={walletModal.data?.note||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,note:e.target.value}}))} /></div>
        <button onClick={() => {
          if(!walletModal.data?.name?.trim()||!walletModal.data?.amount)return;
          const fd={...walletModal.data,paidById:walletModal.data.paidById||user.uid,splitTo:walletModal.data.splitTo||members.map(m=>m.uid),editedByName:user.displayName||user.email,editedById:user.uid,createdAt:walletModal.data.createdAt||Date.now()};
          const n=walletModal.data.id?walletItems.map(i=>i.id===walletModal.data.id?fd:i):[...walletItems,{...fd,id:Date.now()}];
          setWalletItems(n);saveWallet(n);setWalletModal({open:false,data:null});setWalletCalc(false);
        }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${C.purple},${C.blue})`, color:'#fff' }}>確認儲存</button>
      </div>
    </div>
  );

  // 結算 Modal
  const SettlementModal = () => !showSettlement ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'85vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>結算</div>
          <button onClick={() => setShowSettlement(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        {settlements.length===0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🎉</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.green }}>全部結清了！</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {settlements.map((t,idx) => {
              const fromM=members.find(m=>m.uid===t.from)||{displayName:'?'};
              const toM=members.find(m=>m.uid===t.to)||{displayName:'?'};
              const iAmFrom=t.from===user.uid;
              const iAmTo=t.to===user.uid;
              return (
                <div key={idx} style={{ ...gs.card, padding:'14px 16px', backgroundColor: iAmTo?C.greenSoft:iAmFrom?C.dangerSoft:C.surface, border:`1px solid ${iAmTo?C.green:iAmFrom?C.danger:C.border}33` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>
                        {iAmFrom?'我':fromM.displayName} → {iAmTo?'我':toM.displayName}
                      </div>
                      <div style={{ fontSize:18, fontWeight:800, color:iAmTo?C.green:iAmFrom?C.danger:C.text, marginTop:4 }}>
                        {sym[t.currency]||''}{t.amount.toLocaleString()} {t.currency}
                      </div>
                    </div>
                    {(iAmFrom||iAmTo) && (
                      <div style={{ fontSize:12, fontWeight:700, color:iAmTo?C.green:C.danger, padding:'6px 12px', borderRadius:10, border:`1px solid ${iAmTo?C.green:C.danger}33`, backgroundColor:iAmTo?C.greenSoft:C.dangerSoft }}>
                        {iAmTo?'待收款':'待還款'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // 待辦 Modal
  const TodoModal = () => !todoModal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'80vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{todoModal.data?.id?'編輯':'新增項目'}</div>
          <button onClick={() => setTodoModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>內容 *</label><input style={gs.input} placeholder="輸入待辦事項..." value={todoModal.data?.content||''} onChange={e=>setTodoModal(p=>({...p,data:{...p.data,content:e.target.value}}))} /></div>
        <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><textarea value={todoModal.data?.note||''} onChange={e=>setTodoModal(p=>({...p,data:{...p.data,note:e.target.value}}))} rows={3} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
        <button onClick={() => {
          if(!todoModal.data?.content?.trim())return;
          const fd={...todoModal.data,status:todoModal.data.status||false,editedByName:user.displayName||user.email,createdAt:todoModal.data.createdAt||Date.now()};
          const n=todoModal.data.id?sharedTodos.map(t=>t.id===todoModal.data.id?fd:t):[...sharedTodos,{...fd,id:Date.now()}];
          setSharedTodos(n);saveTodos(n);setTodoModal({open:false,data:null});
        }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${C.green},${C.blue})`, color:'#fff' }}>確認儲存</button>
      </div>
    </div>
  );

  // 記事 Modal
  const NoteModal = () => !noteModal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{noteModal.data?.id?'編輯記事':'新增記事'}</div>
          <button onClick={() => setNoteModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        {notePhoto && (
          <div style={{ position:'relative', width:'100%', height:160, borderRadius:12, overflow:'hidden', marginBottom:12 }}>
            <img src={notePhoto} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="tmp" />
            <button onClick={() => setNotePhoto(null)} style={{ position:'absolute', top:8, right:8, background:'rgba(220,50,50,0.9)', border:'none', borderRadius:8, color:'#fff', padding:'4px 8px', cursor:'pointer', fontSize:12 }}>移除</button>
          </div>
        )}
        <div style={{ marginBottom:12 }}>
          <button onClick={() => document.getElementById('note-photo-input').click()} style={{ width:'100%', padding:'10px', border:`1.5px dashed ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.textMuted, fontSize:13, cursor:'pointer', fontWeight:600 }}>📷 新增相片</button>
          <input type="file" id="note-photo-input" style={{ display:'none' }} accept="image/*" onChange={e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onloadend=()=>{ const img=new Image(); img.src=r.result; img.onload=()=>{ const c=document.createElement('canvas'); let w=img.width,h=img.height,max=800; if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}} c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);setNotePhoto(c.toDataURL('image/jpeg',0.7)); }; }; r.readAsDataURL(f); }} />
        </div>
        <div style={{ marginBottom:16 }}><textarea value={noteModal.data?.content||''} onChange={e=>setNoteModal(p=>({...p,data:{...p.data,content:e.target.value}}))} placeholder="輸入記事內容..." rows={5} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
        <button onClick={() => {
          if(!noteModal.data?.content&&!notePhoto)return;
          const now=new Date(); const ts=`${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}`;
          const fd={...noteModal.data,photo:notePhoto,date:noteModal.data.date||ts,editedByName:user.displayName||user.email,createdAtMs:noteModal.data.createdAtMs||now.getTime()};
          const n=noteModal.data.id?sharedNotes.map(x=>x.id===noteModal.data.id?fd:x):[{...fd,id:Date.now()},...sharedNotes];
          setSharedNotes(n);saveNotes(n);setNoteModal({open:false,data:null});
        }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${C.blue},${C.purple})`, color:'#fff' }}>確認儲存</button>
      </div>
    </div>
  );

  // ── 日期選擇器 ──
  const DatePickerModal = () => !datePickerOpen ? null : (
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={() => { setDatePickerOpen(false); setDatePickerInput(''); }} style={{ position:'absolute', inset:0, backgroundColor:'rgba(45,42,36,0.5)' }} />
      <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:320 }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>新增日期</div>
        <input type="date" value={datePickerInput} onChange={e=>setDatePickerInput(e.target.value)} style={{ ...gs.input, marginBottom:16 }} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setDatePickerOpen(false); setDatePickerInput(''); }} style={{ flex:1, padding:11, border:`1px solid ${C.border}`, borderRadius:10, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:600, cursor:'pointer' }}>取消</button>
          <button onClick={() => { if(!datePickerInput)return; const d=new Date(datePickerInput); handleSelectDate(`${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`); }} disabled={!datePickerInput} style={{ flex:1, padding:11, border:'none', borderRadius:10, background:`linear-gradient(135deg,${color},${C.purple})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:datePickerInput?1:0.5 }}>新增</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // 主渲染
  // ════════════════════════════════════════
  return (
    <div style={{ ...gs.app, maxHeight:'100vh' }}>
      <TripHeader />
      {tab==='itinerary' && <ItineraryTab />}
      {tab==='food' && <FoodTab />}
      {tab==='wallet' && <WalletTab />}
      {tab==='shopping' && <ShoppingTab />}
      {tab==='more' && <MoreTab />}
      <TabBar />

      <ItineraryModal />
      <FoodModal />
      <ManageFoodOptionsModal />
      <ShoppingModal />
      <ManageShopOptionsModal />
      <WalletModal />
      <SettlementModal />
      <TodoModal />
      <NoteModal />
      <DatePickerModal />
      <ConfirmDialog isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => { confirmDel?.fn(); setConfirmDel(null); }} title={confirmDel?.title} message={confirmDel?.message} />
    </div>
  );
}


// ─── 主 App ───────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [currentTrip, setCurrentTrip] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthUser(user);
      if (!user) setCurrentTrip(null);
    });
    return unsub;
  }, []);

  if (authUser === undefined) return <LoadingScreen />;
  if (!authUser) return <AuthScreen />;
  if (currentTrip) return <TripDetailScreen user={authUser} trip={currentTrip} onBack={() => setCurrentTrip(null)} />;
  return <TripListScreen user={authUser} onEnterTrip={setCurrentTrip} />;
}
