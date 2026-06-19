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
  const [page, setPage] = useState(null);
  const navigateTo = async (newPage) => {
    setPage(newPage);
    if (newPage === 'shared-wallet') {
      try { const s=await getDoc(doc(db,"tripData",`${trip.id}_sharedWallet`)); setWalletItemsLocal(s.exists()?s.data().items||[]:[]);} catch(e){}
    } else if (newPage === 'personal-wallet') {
      const k = `personalWallet_${user.uid}`;
      try { const s=await getDoc(doc(db,"tripData",`${trip.id}_${k}`)); setWalletItemsLocal(s.exists()?s.data().items||[]:[]);} catch(e){}
    }
  };
  // data
  const [members, setMembers] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripDates, setTripDates] = useState(['待安排']);
  const [foodItems, setFoodItems] = useState([]);
  const [foodOptions, setFoodOptions] = useState({ categories: ['必吃','咖啡甜點','居酒屋','拉麵','燒肉','海鮮','景點附近'], locations: [] });
  const [shoppingItems, setShoppingItems] = useState([]);
  const [sharedTodos, setSharedTodos] = useState([]);
  const [personalTodos, setPersonalTodos] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  // ui state
  const [selectedDate, setSelectedDate] = useState('待安排');
  const [viewMode, setViewMode] = useState('list');
  const [activeMapItem, setActiveMapItem] = useState(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  // modals
  const [modal, setModal] = useState({ open: false, data: null });
  const [tempPhotos, setTempPhotos] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerInput, setDatePickerInput] = useState('');
  const [foodModal, setFoodModal] = useState({ open: false, data: null });
  const [foodFilter, setFoodFilter] = useState([]);
  const [showManageFoodOptions, setShowManageFoodOptions] = useState(false);
  const [newFoodCategory, setNewFoodCategory] = useState('');
  const [newFoodLocation, setNewFoodLocation] = useState('');
  const [shoppingModal, setShoppingModal] = useState({ open: false, data: null });
  const [todoModal, setTodoModal] = useState({ open: false, data: null });
  const [noteModal, setNoteModal] = useState({ open: false, data: null });
  const [notePhoto, setNotePhoto] = useState(null);
  const [walletItems, setWalletItemsLocal] = useState([]);
  const [walletModal, setWalletModal] = useState({ open: false, data: null });
  const [walletKey, setWalletKey] = useState('');

  useEffect(() => {
    loadAll();
  }, [trip.id]);

  async function loadAll() {
    await Promise.all([
      loadMembers(), loadItinerary(), loadFood(), loadFoodOptions(),
      loadShopping(), loadTodos(), loadNotes(),
    ]);
  }

  async function loadMembers() {
    try {
      const q = query(collection(db, "tripMembers"), where("tripId", "==", trip.id));
      const snap = await getDocs(q);
      setMembers(snap.docs.map(d => d.data()));
    } catch(e) {}
  }

  async function loadItinerary() {
    try {
      const snap = await getDoc(doc(db, "tripData", `${trip.id}_itinerary`));
      if (snap.exists()) { const d = snap.data(); setItinerary(d.items||[]); setTripDates(d.dates||['待安排']); }
    } catch(e) {}
  }
  async function saveItinerary(items, dates) {
    try { await setDoc(doc(db, "tripData", `${trip.id}_itinerary`), { items: JSON.parse(JSON.stringify(items)), dates, updatedAt: serverTimestamp() }); } catch(e) {}
  }

  async function loadFood() {
    try { const s = await getDoc(doc(db, "tripData", `${trip.id}_food`)); if (s.exists()) setFoodItems(s.data().items||[]); } catch(e) {}
  }
  async function saveFood(items) {
    try { await setDoc(doc(db, "tripData", `${trip.id}_food`), { items: JSON.parse(JSON.stringify(items)), updatedAt: serverTimestamp() }); } catch(e) {}
  }
  async function loadFoodOptions() {
    try { const s = await getDoc(doc(db, "tripData", `${trip.id}_foodOptions`)); if (s.exists()) setFoodOptions(s.data()); } catch(e) {}
  }
  async function saveFoodOptions(opts) {
    try { await setDoc(doc(db, "tripData", `${trip.id}_foodOptions`), JSON.parse(JSON.stringify(opts))); } catch(e) {}
  }

  async function loadShopping() {
    try { const s = await getDoc(doc(db, "tripData", `${trip.id}_shopping`)); if (s.exists()) setShoppingItems(s.data().items||[]); } catch(e) {}
  }
  async function saveShopping(items) {
    try { await setDoc(doc(db, "tripData", `${trip.id}_shopping`), { items: JSON.parse(JSON.stringify(items)), updatedAt: serverTimestamp() }); } catch(e) {}
  }

  async function loadTodos() {
    try {
      const s = await getDoc(doc(db, "tripData", `${trip.id}_todos`));
      if (s.exists()) { const d = s.data(); setSharedTodos(d.shared||[]); setPersonalTodos(d.personal||[]); }
    } catch(e) {}
  }
  async function saveTodos(shared, personal) {
    try { await setDoc(doc(db, "tripData", `${trip.id}_todos`), { shared: JSON.parse(JSON.stringify(shared)), personal: JSON.parse(JSON.stringify(personal)), updatedAt: serverTimestamp() }); } catch(e) {}
  }

  async function loadNotes() {
    try {
      const s = await getDoc(doc(db, "tripData", `${trip.id}_notes`));
      if (s.exists()) { const d = s.data(); setSharedNotes(d.shared||[]); setPersonalNotes(d.personal||[]); }
    } catch(e) {}
  }
  async function saveNotes(shared, personal) {
    try { await setDoc(doc(db, "tripData", `${trip.id}_notes`), { shared: JSON.parse(JSON.stringify(shared)), personal: JSON.parse(JSON.stringify(personal)), updatedAt: serverTimestamp() }); } catch(e) {}
  }

  async function loadWallet(key) {
    try { const s=await getDoc(doc(db,"tripData",`${trip.id}_${key}`)); setWalletItemsLocal(s.exists() ? s.data().items||[] : []); } catch(e) {}
  }

  // helpers
  const filteredItems = itinerary.filter(i => i.date === selectedDate)
    .sort((a,b) => selectedDate==='待安排' ? (a.createdAt||0)-(b.createdAt||0) : (a.time||'').localeCompare(b.time||''));

  function handleSelectDate(mmdd) {
    if (!tripDates.includes(mmdd)) { const nd=['待安排',...[...tripDates.filter(d=>d!=='待安排'),mmdd].sort()]; setTripDates(nd); saveItinerary(itinerary,nd); }
    setSelectedDate(mmdd); setDatePickerOpen(false); setDatePickerInput('');
  }
  function handleDeleteDate(d) {
    const nd=tripDates.filter(x=>x!==d); setTripDates(nd); if(selectedDate===d) setSelectedDate('待安排'); saveItinerary(itinerary,nd);
  }
  function handleSaveItem() {
    if (!modal.data?.name?.trim()) return;
    const fd={...modal.data, date:modal.data.date||selectedDate, photos:tempPhotos, editedByName:user.displayName||user.email, editedById:user.uid, createdAt:modal.data.createdAt||Date.now()};
    const ni=modal.data.id ? itinerary.map(it=>it.id===modal.data.id?fd:it) : [...itinerary,{...fd,id:Date.now()}];
    setItinerary(ni); saveItinerary(ni,tripDates); setModal({open:false,data:null}); setTempPhotos([]);
  }
  function handleDeleteItem(id) { const ni=itinerary.filter(it=>it.id!==id); setItinerary(ni); saveItinerary(ni,tripDates); setConfirmDel(null); }
  function copyCode() { navigator.clipboard.writeText(trip.inviteCode); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  const getCat=(cat)=>{const map={'景點':{bg:'#E8F7F2',color:C.green,border:'#B8E8D8'},'美食':{bg:'#FEF3E8',color:'#D97706',border:'#FDDCB0'},'購物':{bg:'#FDE8F3',color:'#BE185D',border:'#F9B8DA'},'交通':{bg:C.purpleSoft,color:C.purple,border:'#D4C4FF'},'住宿':{bg:C.blueSoft,color:C.blue,border:'#B8D0F8'},'其他':{bg:'#F0EDE8',color:C.textMuted,border:C.border}};return map[cat]||map['其他'];};

  // Shared header component
  const Header = ({ title, onBack: goBack, extra }) => (
    <div style={{ padding:'16px 20px 14px', backgroundColor:color+'12', borderBottom:`1px solid ${color}33`, flexShrink:0, paddingTop:52 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={goBack} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, width:36, height:36, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, flexShrink:0 }}>←</button>
        <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, backgroundColor:color+'22', border:`1.5px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{trip.emoji||'✈️'}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{title}</div>
          {title===trip.name && trip.destination && <div style={{ fontSize:11, color:C.textMuted }}>📍 {trip.destination}</div>}
        </div>
        {extra && <div style={{ flexShrink:0 }}>{extra}</div>}
      </div>
    </div>
  );

  // ── 首頁 ──────────────────────────────────────────────────────
  if (!page) {
    const menuItems = [
      { id:'itinerary', emoji:'🗓', label:'行程規劃', desc:`${itinerary.length} 個行程`, color:C.blue, bg:C.blueSoft },
      { id:'food', emoji:'🍜', label:'美食紀錄', desc:`${foodItems.length} 間店`, color:'#D97706', bg:'#FEF3E8' },
      { id:'shopping', emoji:'🛍', label:'購物清單', desc:`${shoppingItems.filter(i=>!i.bought).length} 件待買`, color:'#BE185D', bg:'#FDE8F3' },
      { id:'shared', emoji:'👥', label:'共同', desc:'記帳・清單・記事', color:C.green, bg:C.greenSoft },
      { id:'personal', emoji:'👤', label:'個人', desc:'記帳・清單・記事', color:C.purple, bg:C.purpleSoft },
      { id:'members', emoji:'🙋', label:'成員', desc:`${members.length} 人`, color:'#D97706', bg:'#FEF3E8' },
      { id:'invite', emoji:'🔑', label:'邀請碼', desc:trip.inviteCode||'...', color:C.blue, bg:C.blueSoft },
    ];
    return (
      <div style={gs.app}>
        <Header title={trip.name} onBack={onBack} />
        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {trip.startDate && (
            <div style={{ ...gs.card, marginBottom:16, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:22 }}>📅</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>
                  {(()=>{const d=new Date(trip.startDate);return `${d.getMonth()+1}/${d.getDate()}`;})()}
                  {trip.endDate&&(()=>{const d=new Date(trip.endDate);return ` – ${d.getMonth()+1}/${d.getDate()}`;})()}
                </div>
                {trip.startDate&&trip.endDate&&<div style={{ fontSize:11, color:C.textMuted }}>共 {Math.round((new Date(trip.endDate)-new Date(trip.startDate))/86400000)+1} 天</div>}
              </div>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {menuItems.map(item => (
              <button key={item.id} onClick={() => navigateTo(item.id)}
                style={{ ...gs.card, cursor:'pointer', textAlign:'left', padding:'18px 16px', border:`1.5px solid ${item.color}22`, background:item.bg, display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontSize:28 }}>{item.emoji}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 行程規劃 ──────────────────────────────────────────────────
  if (page === 'itinerary') return (
    <div style={gs.app}>
      <Header title="行程規劃" onBack={() => setPage(null)} />
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ position:'sticky', top:0, zIndex:30, backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase' }}>選擇日期</span>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ display:'flex', backgroundColor:C.bg, borderRadius:8, padding:3, border:`1px solid ${C.border}` }}>
                {[['list','≡'],['map','⊙']].map(([m,icon]) => (
                  <button key={m} onClick={() => setViewMode(m)} style={{ padding:'5px 10px', borderRadius:6, border:'none', backgroundColor:viewMode===m?C.surface:'transparent', color:viewMode===m?color:C.textMuted, fontSize:14, cursor:'pointer', fontWeight:700 }}>{icon}</button>
                ))}
              </div>
              <button onClick={() => setDatePickerOpen(true)} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${color}44`, backgroundColor:color+'18', color, fontSize:12, fontWeight:700, cursor:'pointer' }}>＋ 日期</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
            {tripDates.map(d => (
              <div key={d} style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <button onClick={() => setSelectedDate(d)} style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${selectedDate===d?color:C.border}`, backgroundColor:selectedDate===d?color:C.surface, color:selectedDate===d?'#fff':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{d}</button>
                {d!=='待安排' && <button onClick={() => handleDeleteDate(d)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:14, cursor:'pointer', padding:'0 2px', opacity:0.6 }}>×</button>}
              </div>
            ))}
          </div>
        </div>
        {viewMode==='map' ? (
          <div style={{ padding:16 }}>
            <div style={{ height:280, borderRadius:16, overflow:'hidden', border:`1px solid ${C.border}`, marginBottom:12 }}>
              {activeMapItem ? <iframe width="100%" height="100%" frameBorder="0" allowFullScreen title="map" style={{ border:'none' }} src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD8V5bJLigATt1WJ8esgapLIIbKEAYOUXc&q=${encodeURIComponent(activeMapItem.location||activeMapItem.name)}&language=zh-TW`} />
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:C.textMuted, fontSize:13 }}>請選擇行程項目</div>}
            </div>
            <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
              {filteredItems.map(item => (
                <div key={item.id} onClick={() => setActiveMapItem(item)} style={{ minWidth:180, padding:'12px 14px', borderRadius:14, flexShrink:0, border:`1.5px solid ${activeMapItem?.id===item.id?color:C.border}`, backgroundColor:activeMapItem?.id===item.id?color+'18':C.surface, cursor:'pointer' }}>
                  <div style={{ fontSize:11, color:activeMapItem?.id===item.id?color:C.textMuted, fontWeight:700, marginBottom:4 }}>{item.time||'待定'} · {item.category}</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding:16 }}>
            {filteredItems.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無行程，點右下角 ＋ 新增</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {filteredItems.map((item,idx) => {
                  const cat=getCat(item.category);
                  return (
                    <div key={item.id} style={{ display:'flex', gap:12 }}>
                      {selectedDate!=='待安排' && <div style={{ width:36, flexShrink:0, display:'flex', justifyContent:'center', paddingTop:14 }}><div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, border:'2px solid #fff', boxShadow:`0 2px 6px ${color}44` }}>{idx+1}</div></div>}
                      <div style={{ flex:1, ...gs.card, padding:'14px 16px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
                            {item.time && <span style={{ padding:'3px 8px', borderRadius:6, backgroundColor:color+'18', color, fontSize:11, fontWeight:700 }}>{item.time}</span>}
                            <span style={{ padding:'3px 8px', borderRadius:6, backgroundColor:cat.bg, color:cat.color, border:`1px solid ${cat.border}`, fontSize:11, fontWeight:700 }}>{item.category}</span>
                          </div>
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button onClick={() => { setModal({open:true,data:item}); setTempPhotos(item.photos||[]); }} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                            <button onClick={() => setConfirmDel(item.id)} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                          </div>
                        </div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{item.name}</div>
                        {item.location && <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>📍 {item.location}</div>}
                        {item.note && <div style={{ fontSize:12, color:'#5A5247', backgroundColor:'#F8F4EE', borderLeft:`3px solid ${color}`, padding:'8px 10px', borderRadius:'0 8px 8px 0', marginBottom:8, whiteSpace:'pre-wrap' }}>{item.note}</div>}
                        {item.photos?.length>0 && <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>{item.photos.map((p,i)=><img key={i} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="pic" />)}</div>}
                        <div style={{ fontSize:10, color:C.textMuted }}>{item.editedByName||'成員'} 編輯</div>
                        {item.mapUrl && <button onClick={() => window.open(item.mapUrl,'_blank')} style={{ marginTop:8, padding:'6px 12px', borderRadius:8, border:`1px solid ${color}44`, backgroundColor:color+'18', color, fontSize:12, fontWeight:700, cursor:'pointer' }}>🗺 開啟地圖</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <button onClick={() => { setModal({open:true,data:{category:'景點',date:selectedDate}}); setTempPhotos([]); }} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:18, border:'none', background:`linear-gradient(135deg,${color},${C.purple})`, color:'#fff', fontSize:28, cursor:'pointer', boxShadow:`0 4px 16px ${color}66`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>＋</button>
      {modal.open && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
          <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
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
                {tempPhotos.map((url,i)=>(
                  <div key={i} style={{ position:'relative', width:60, height:60, borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}` }}>
                    <img src={url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="tmp" />
                    <button onClick={() => setTempPhotos(p=>p.filter((_,j)=>j!==i))} style={{ position:'absolute', top:2, right:2, width:18, height:18, borderRadius:4, backgroundColor:'rgba(220,50,50,0.9)', border:'none', color:'#fff', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  </div>
                ))}
                {tempPhotos.length<5 && <button onClick={() => document.getElementById('trip-photo-input').click()} style={{ width:60, height:60, borderRadius:10, border:`1.5px dashed ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>📷</button>}
              </div>
              <input type="file" id="trip-photo-input" style={{ display:'none' }} multiple accept="image/*" onChange={e => {
                Array.from(e.target.files).forEach(file => { const r=new FileReader(); r.onloadend=()=>{ const img=new Image(); img.src=r.result; img.onload=()=>{ const c=document.createElement('canvas'); let w=img.width,h=img.height,max=600; if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}} c.width=w;c.height=h; c.getContext('2d').drawImage(img,0,0,w,h); setTempPhotos(p=>p.length<5?[...p,c.toDataURL('image/jpeg',0.6)]:p); }; }; r.readAsDataURL(file); });
              }} />
            </div>
            <button onClick={handleSaveItem} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${color},${C.purple})`, color:'#fff' }}>確認儲存</button>
          </div>
        </div>
      )}
      {datePickerOpen && (
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
      )}
      <ConfirmDialog isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => handleDeleteItem(confirmDel)} title="確認刪除" message="確定要刪除這個行程項目嗎？" />
    </div>
  );

  // ── 美食 ──────────────────────────────────────────────────────
  if (page === 'food') return (
    <div style={gs.app}>
      <Header title="美食紀錄" onBack={() => setPage(null)} extra={<button onClick={() => setShowManageFoodOptions(true)} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 10px', fontSize:12, color:C.textMuted, cursor:'pointer', fontWeight:600 }}>管理選項</button>} />
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ padding:'10px 16px 0', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:10 }}>
            <button onClick={() => setFoodFilter([])} style={{ flexShrink:0, padding:'6px 12px', borderRadius:10, border:`1.5px solid ${foodFilter.length===0?'#D97706':C.border}`, backgroundColor:foodFilter.length===0?'#FEF3E8':C.bg, color:foodFilter.length===0?'#D97706':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>全部</button>
            {foodOptions.categories.map(f=>(
              <button key={f} onClick={() => setFoodFilter(prev=>prev.includes(f)?prev.filter(x=>x!==f):[...prev,f])} style={{ flexShrink:0, padding:'6px 12px', borderRadius:10, border:`1.5px solid ${foodFilter.includes(f)?'#D97706':C.border}`, backgroundColor:foodFilter.includes(f)?'#FEF3E8':C.bg, color:foodFilter.includes(f)?'#D97706':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{f}</button>
            ))}
            {foodOptions.locations.map(l=>(
              <button key={l} onClick={() => setFoodFilter(prev=>prev.includes(l)?prev.filter(x=>x!==l):[...prev,l])} style={{ flexShrink:0, padding:'6px 12px', borderRadius:10, border:`1.5px solid ${foodFilter.includes(l)?C.blue:C.border}`, backgroundColor:foodFilter.includes(l)?C.blueSoft:C.bg, color:foodFilter.includes(l)?C.blue:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>📍 {l}</button>
            ))}
          </div>
        </div>
        <div style={{ padding:16 }}>
          {foodItems.filter(item=>foodFilter.length===0||foodFilter.some(f=>(item.categories||[item.category]).includes(f)||(item.locations||[item.location]).includes(f))).length===0
            ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無美食，點右下角 ＋ 新增</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {foodItems.filter(item=>foodFilter.length===0||foodFilter.some(f=>(item.categories||[item.category]).includes(f)||(item.locations||[item.location]).includes(f))).map(item=>(
                <div key={item.id} style={{ ...gs.card, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
                      {(item.categories||(item.category?[item.category]:[])).map(c=><span key={c} style={{ padding:'3px 8px', borderRadius:6, backgroundColor:'#FEF3E8', color:'#D97706', border:'1px solid #FDDCB0', fontSize:11, fontWeight:700 }}>{c}</span>)}
                      {(item.locations||(item.location?[item.location]:[])).map(l=><span key={l} style={{ padding:'3px 8px', borderRadius:6, backgroundColor:C.blueSoft, color:C.blue, border:`1px solid ${C.blue}33`, fontSize:11, fontWeight:700 }}>📍 {l}</span>)}
                      {item.visited && <span style={{ padding:'3px 8px', borderRadius:6, backgroundColor:C.greenSoft, color:C.green, fontSize:11, fontWeight:700 }}>✓ 已去</span>}
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={() => setFoodModal({open:true,data:{...item,categories:item.categories||(item.category?[item.category]:[]),locations:item.locations||(item.location?[item.location]:[])}})} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                      <button onClick={() => { const n=foodItems.filter(i=>i.id!==item.id); setFoodItems(n); saveFood(n); }} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{item.name}</div>
                  {item.price && <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>💴 {item.price}</div>}
                  {item.note && <div style={{ fontSize:12, color:'#5A5247', backgroundColor:'#FEF3E8', borderLeft:'3px solid #D97706', padding:'8px 10px', borderRadius:'0 8px 8px 0', marginBottom:8, whiteSpace:'pre-wrap' }}>{item.note}</div>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                    <div style={{ fontSize:10, color:C.textMuted }}>{item.editedByName||'成員'} 新增</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => { const n=foodItems.map(i=>i.id===item.id?{...i,visited:!i.visited}:i); setFoodItems(n); saveFood(n); }} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${item.visited?C.green:C.border}`, backgroundColor:item.visited?C.greenSoft:C.bg, color:item.visited?C.green:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer' }}>{item.visited?'✓ 已去':'標記已去'}</button>
                      {item.mapUrl && <button onClick={() => window.open(item.mapUrl,'_blank')} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #FDDCB0', backgroundColor:'#FEF3E8', color:'#D97706', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      </div>
      <button onClick={() => setFoodModal({open:true,data:{categories:[],locations:[],visited:false}})} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:18, border:'none', background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#fff', fontSize:28, cursor:'pointer', boxShadow:'0 4px 16px rgba(217,119,6,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>＋</button>
      {foodModal.open && (
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
              {foodOptions.locations.length===0 ? <div style={{ fontSize:12, color:C.textMuted, padding:'8px 0' }}>尚無地點，請到「管理選項」新增</div> : (
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
      )}
      {showManageFoodOptions && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
          <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:800 }}>管理選項</div>
              <button onClick={() => setShowManageFoodOptions(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={gs.label}>類別</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
                {foodOptions.categories.map(c=>(
                  <div key={c} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', backgroundColor:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
                    <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{c}</span>
                    <button onClick={() => { const o={...foodOptions,categories:foodOptions.categories.filter(x=>x!==c)}; setFoodOptions(o);saveFoodOptions(o); }} style={{ background:'none', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input style={{ ...gs.input, flex:1 }} placeholder="新增類別..." value={newFoodCategory} onChange={e=>setNewFoodCategory(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newFoodCategory.trim()){ const o={...foodOptions,categories:[...foodOptions.categories,newFoodCategory.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodCategory(''); } }} />
                <button onClick={() => { if(!newFoodCategory.trim())return; const o={...foodOptions,categories:[...foodOptions.categories,newFoodCategory.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodCategory(''); }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:'#D97706', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={gs.label}>地點</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
                {foodOptions.locations.map(l=>(
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', backgroundColor:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
                    <span style={{ flex:1, fontSize:14, fontWeight:600 }}>📍 {l}</span>
                    <button onClick={() => { const o={...foodOptions,locations:foodOptions.locations.filter(x=>x!==l)}; setFoodOptions(o);saveFoodOptions(o); }} style={{ background:'none', border:'none', color:C.danger, fontSize:16, cursor:'pointer' }}>×</button>
                  </div>
                ))}
                {foodOptions.locations.length===0 && <div style={{ fontSize:12, color:C.textMuted }}>尚未新增地點</div>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input style={{ ...gs.input, flex:1 }} placeholder="例：新宿、涉谷" value={newFoodLocation} onChange={e=>setNewFoodLocation(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newFoodLocation.trim()){ const o={...foodOptions,locations:[...foodOptions.locations,newFoodLocation.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodLocation(''); } }} />
                <button onClick={() => { if(!newFoodLocation.trim())return; const o={...foodOptions,locations:[...foodOptions.locations,newFoodLocation.trim()]}; setFoodOptions(o);saveFoodOptions(o);setNewFoodLocation(''); }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:C.blue, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
              </div>
            </div>
            <button onClick={() => setShowManageFoodOptions(false)} style={{ width:'100%', padding:14, border:`1px solid ${C.border}`, borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', backgroundColor:C.bg, color:C.text }}>完成</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── 購物清單 ──────────────────────────────────────────────────
  if (page === 'shopping') return (
    <div style={gs.app}>
      <Header title="購物清單" onBack={() => setPage(null)} />
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {/* 統計 */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          {[{label:'待買',val:shoppingItems.filter(i=>!i.bought).length,color:'#BE185D',bg:'#FDE8F3'},{label:'已買',val:shoppingItems.filter(i=>i.bought).length,color:C.green,bg:C.greenSoft}].map(s=>(
            <div key={s.label} style={{ flex:1, padding:'10px 14px', borderRadius:12, backgroundColor:s.bg, border:`1px solid ${s.color}22` }}>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
        {shoppingItems.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無清單，點右下角 ＋ 新增</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {shoppingItems.map(item=>(
              <div key={item.id} style={{ ...gs.card, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, opacity:item.bought?0.6:1 }}>
                <button onClick={() => { const n=shoppingItems.map(i=>i.id===item.id?{...i,bought:!i.bought}:i); setShoppingItems(n);saveShopping(n); }} style={{ width:28, height:28, borderRadius:8, border:`2px solid ${item.bought?C.green:C.border}`, backgroundColor:item.bought?C.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                  {item.bought && <span style={{ color:'#fff', fontSize:14, fontWeight:800 }}>✓</span>}
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, textDecoration:item.bought?'line-through':'none' }}>{item.name}</div>
                  {item.store && <div style={{ fontSize:11, color:C.textMuted }}>🏪 {item.store}</div>}
                  {item.note && <div style={{ fontSize:11, color:C.textMuted }}>{item.note}</div>}
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{item.addedByName||'成員'} 新增</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => setShoppingModal({open:true,data:item})} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                  <button onClick={() => { const n=shoppingItems.filter(i=>i.id!==item.id); setShoppingItems(n);saveShopping(n); }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:11, cursor:'pointer' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => setShoppingModal({open:true,data:{}})} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:18, border:'none', background:'linear-gradient(135deg,#BE185D,#EC4899)', color:'#fff', fontSize:28, cursor:'pointer', boxShadow:'0 4px 16px rgba(190,24,93,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>＋</button>
      {shoppingModal.open && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
          <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'80vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:16, fontWeight:800 }}>{shoppingModal.data?.id?'編輯清單':'新增清單'}</div>
              <button onClick={() => setShoppingModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom:12 }}><label style={gs.label}>商品名稱 *</label><input style={gs.input} placeholder="例：Matin Kim 外套" value={shoppingModal.data?.name||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,name:e.target.value}}))} /></div>
            <div style={{ marginBottom:12 }}><label style={gs.label}>🏪 店家/地點</label><input style={gs.input} placeholder="例：唐吉訶德、心齋橋" value={shoppingModal.data?.store||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,store:e.target.value}}))} /></div>
            <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><input style={gs.input} placeholder="例：幫媽媽帶、尺寸M" value={shoppingModal.data?.note||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,note:e.target.value}}))} /></div>
            <button onClick={() => {
              if(!shoppingModal.data?.name?.trim())return;
              const fd={...shoppingModal.data, bought:shoppingModal.data.bought||false, addedByName:user.displayName||user.email, createdAt:shoppingModal.data.createdAt||Date.now()};
              const n=shoppingModal.data.id?shoppingItems.map(i=>i.id===shoppingModal.data.id?fd:i):[...shoppingItems,{...fd,id:Date.now()}];
              setShoppingItems(n);saveShopping(n);setShoppingModal({open:false,data:null});
            }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#BE185D,#EC4899)', color:'#fff' }}>確認儲存</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── 共同 ──────────────────────────────────────────────────────
  if (page === 'shared') {
    const sharedMenu = [
      { id:'shared-wallet', emoji:'💰', label:'共同記帳', desc:`${sharedNotes.length} 筆`, color:C.purple, bg:C.purpleSoft },
      { id:'shared-todos', emoji:'✅', label:'共同清單', desc:`${sharedTodos.filter(t=>!t.status).length} 件待完成`, color:C.green, bg:C.greenSoft },
      { id:'shared-notes', emoji:'📝', label:'共同記事', desc:`${sharedNotes.length} 則`, color:C.blue, bg:C.blueSoft },
    ];
    return (
      <div style={gs.app}>
        <Header title="共同" onBack={() => setPage(null)} />
        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {sharedMenu.map(item=>(
              <button key={item.id} onClick={() => navigateTo(item.id)}
                style={{ ...gs.card, cursor:'pointer', textAlign:'left', padding:'18px 16px', border:`1.5px solid ${item.color}22`, background:item.bg, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:32 }}>{item.emoji}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{item.desc}</div>
                </div>
                <div style={{ marginLeft:'auto', color:item.color, fontSize:18 }}>›</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 個人 ──────────────────────────────────────────────────────
  if (page === 'personal') {
    const personalMenu = [
      { id:'personal-wallet', emoji:'💳', label:'個人記帳', desc:'我的消費', color:C.purple, bg:C.purpleSoft },
      { id:'personal-todos', emoji:'📋', label:'個人清單', desc:`${personalTodos.filter(t=>t.ownerId===user.uid&&!t.status).length} 件待完成`, color:C.green, bg:C.greenSoft },
      { id:'personal-notes', emoji:'🗒', label:'個人記事', desc:`${personalNotes.length} 則`, color:C.blue, bg:C.blueSoft },
    ];
    return (
      <div style={gs.app}>
        <Header title="個人" onBack={() => setPage(null)} />
        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {personalMenu.map(item=>(
              <button key={item.id} onClick={() => navigateTo(item.id)}
                style={{ ...gs.card, cursor:'pointer', textAlign:'left', padding:'18px 16px', border:`1.5px solid ${item.color}22`, background:item.bg, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:32 }}>{item.emoji}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{item.desc}</div>
                </div>
                <div style={{ marginLeft:'auto', color:item.color, fontSize:18 }}>›</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 共同清單 ──────────────────────────────────────────────────
  if (page === 'shared-todos' || page === 'personal-todos') {
    const isShared = page === 'shared-todos';
    const todos = isShared ? sharedTodos : personalTodos.filter(t => t.ownerId === user.uid);
    const setTodos = isShared
      ? (fn) => { const next = typeof fn==='function'?fn(sharedTodos):fn; setSharedTodos(next); saveTodos(next, personalTodos); }
      : (fn) => { const next = typeof fn==='function'?fn(personalTodos):fn; setPersonalTodos(next); saveTodos(sharedTodos, next); };
    const acColor = C.green;
    const sorted = [...todos.filter(t=>!t.status).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)), ...todos.filter(t=>t.status).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))];
    return (
      <div style={gs.app}>
        <Header title={isShared?'共同清單':'個人清單'} onBack={() => setPage(isShared?'shared':'personal')} />
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {sorted.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無清單，點右下角 ＋ 新增</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {sorted.map(todo=>(
                <div key={todo.id} style={{ ...gs.card, padding:'14px 16px', opacity:todo.status?0.6:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <button onClick={() => { const now=new Date(); const ts=`${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}`; setTodos(p=>p.map(t=>t.id===todo.id?{...t,status:!t.status,completedByName:!t.status?(user.displayName||user.email):null,completedAt:!t.status?ts:null}:t)); }} style={{ width:28, height:28, borderRadius:8, border:`2px solid ${todo.status?acColor:C.border}`, backgroundColor:todo.status?acColor:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:2 }}>
                      {todo.status && <span style={{ color:'#fff', fontSize:14, fontWeight:800 }}>✓</span>}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text, textDecoration:todo.status?'line-through':'none' }}>{todo.content}</div>
                      {todo.note && <div style={{ fontSize:12, color:C.textMuted, marginTop:4, backgroundColor:'#F8F4EE', padding:'6px 10px', borderRadius:8, borderLeft:`3px solid ${acColor}`, whiteSpace:'pre-wrap' }}>{todo.note}</div>}
                      <div style={{ fontSize:10, color:C.textMuted, marginTop:6 }}>
                        {todo.editedByName||'成員'} 新增
                        {todo.status && ` · ✓ ${todo.completedByName||'成員'} ${todo.completedAt||''}`}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={() => setTodoModal({open:true,data:todo})} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                      <button onClick={() => setTodos(p=>p.filter(t=>t.id!==todo.id))} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setTodoModal({open:true,data:{}})} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:18, border:'none', background:`linear-gradient(135deg,${acColor},${C.blue})`, color:'#fff', fontSize:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>＋</button>
        {todoModal.open && (
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
                const fd={...todoModal.data, status:todoModal.data.status||false, ownerId:user.uid, editedByName:user.displayName||user.email, createdAt:todoModal.data.createdAt||Date.now()};
                setTodos(p=>todoModal.data.id?p.map(t=>t.id===todoModal.data.id?fd:t):[...p,{...fd,id:Date.now()}]);
                setTodoModal({open:false,data:null});
              }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${acColor},${C.blue})`, color:'#fff' }}>確認儲存</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 共同/個人記事 ──────────────────────────────────────────────
  if (page === 'shared-notes' || page === 'personal-notes') {
    const isShared = page === 'shared-notes';
    const notes = isShared ? sharedNotes : personalNotes;
    const setNotes = isShared
      ? (fn) => { const next=typeof fn==='function'?fn(sharedNotes):fn; setSharedNotes(next); saveNotes(next,personalNotes); }
      : (fn) => { const next=typeof fn==='function'?fn(personalNotes):fn; setPersonalNotes(next); saveNotes(sharedNotes,next); };
    const acColor = C.blue;
    const sorted = [...notes].filter(Boolean).sort((a,b)=>(b.createdAtMs||0)-(a.createdAtMs||0));
    return (
      <div style={gs.app}>
        <Header title={isShared?'共同記事':'個人記事'} onBack={() => setPage(isShared?'shared':'personal')} />
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {sorted.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無記事，點右下角 ＋ 新增</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {sorted.map(note=>(
                <div key={note.id} style={{ ...gs.card, padding:'16px' }}>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
                    <button onClick={() => { setNoteModal({open:true,data:note}); setNotePhoto(note.photo||null); }} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                    <button onClick={() => setNotes(p=>p.filter(n=>n.id!==note.id))} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer' }}>🗑</button>
                  </div>
                  {note.photo && <img src={note.photo} style={{ width:'100%', height:180, objectFit:'cover', borderRadius:12, marginBottom:10, cursor:'pointer' }} alt="note" />}
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
        <button onClick={() => { setNoteModal({open:true,data:{}}); setNotePhoto(null); }} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:18, border:'none', background:`linear-gradient(135deg,${acColor},${C.purple})`, color:'#fff', fontSize:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>＋</button>
        {noteModal.open && (
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
                const fd={...noteModal.data, photo:notePhoto, date:noteModal.data.date||ts, editedByName:user.displayName||user.email, editedById:user.uid, createdAtMs:noteModal.data.createdAtMs||now.getTime()};
                setNotes(p=>noteModal.data.id?p.map(n=>n.id===noteModal.data.id?fd:n):[{...fd,id:Date.now()},...p]);
                setNoteModal({open:false,data:null});
              }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${acColor},${C.purple})`, color:'#fff' }}>確認儲存</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 共同/個人記帳 (簡易版) ────────────────────────────────────
  if (page === 'shared-wallet' || page === 'personal-wallet') {
    const isShared = page === 'shared-wallet';
    const acColor = C.purple;
    const currentWalletKey = isShared ? 'sharedWallet' : `personalWallet_${user.uid}`;

    async function saveWallet(items) {
      try { await setDoc(doc(db,"tripData",`${trip.id}_${currentWalletKey}`),{items:JSON.parse(JSON.stringify(items)),updatedAt:serverTimestamp()}); } catch(e) {}
    }

    const totals = walletItems.reduce((acc,i) => {
      const cur = i.currency||'TWD'; const amt = Number(i.amount)||0;
      if (!acc[cur]) acc[cur]=0;
      acc[cur] += i.type==='存入' ? amt : -amt;
      return acc;
    }, {});
    const sym = { JPY:'¥', KRW:'₩', TWD:'$' };

    return (
      <div style={gs.app}>
        <Header title={isShared?'共同記帳':'個人記帳'} onBack={() => setPage(isShared?'shared':'personal')} />
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {/* 餘額總覽 */}
          {Object.keys(totals).length > 0 && (
            <div style={{ display:'flex', gap:10, marginBottom:16, overflowX:'auto' }}>
              {Object.entries(totals).map(([cur,val]) => (
                <div key={cur} style={{ flexShrink:0, padding:'10px 14px', borderRadius:12, backgroundColor:val>=0?C.greenSoft:C.dangerSoft, border:`1px solid ${val>=0?C.green:C.danger}33` }}>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:2 }}>{cur} 餘額</div>
                  <div style={{ fontSize:17, fontWeight:800, color:val>=0?C.green:C.danger }}>{val>=0?'+':''}{sym[cur]||''}{Math.abs(val).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          {walletItems.length===0 ? <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無記帳，點右下角 ＋ 新增</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...walletItems].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(item=>(
                <div key={item.id} style={{ ...gs.card, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:item.type==='存入'?C.greenSoft:C.dangerSoft, color:item.type==='存入'?C.green:C.danger, fontSize:11, fontWeight:700 }}>{item.type}</span>
                        <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.purpleSoft, color:C.purple, fontSize:11, fontWeight:700 }}>{item.currency||'TWD'}</span>
                        {item.date && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.bg, color:C.textMuted, fontSize:11 }}>{item.date}</span>}
                      </div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{item.name}</div>
                      {item.note && <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{item.note}</div>}
                      <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>{item.editedByName||'成員'}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:18, fontWeight:800, color:item.type==='存入'?C.green:C.danger }}>{item.type==='存入'?'+':'-'}{sym[item.currency||'TWD']||''}{Number(item.amount||0).toLocaleString()}</div>
                      <div style={{ display:'flex', gap:4, marginTop:4, justifyContent:'flex-end' }}>
                        <button onClick={() => setWalletModal({open:true,data:item})} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => { const n=walletItems.filter(i=>i.id!==item.id); setWalletItemsLocal(n);saveWallet(n); }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:11, cursor:'pointer' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setWalletModal({open:true,data:{type:'支出',currency:'TWD'}})} style={{ position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:18, border:'none', background:`linear-gradient(135deg,${acColor},${C.blue})`, color:'#fff', fontSize:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>＋</button>
        {walletModal.open && (
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
            <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>{walletModal.data?.id?'編輯記帳':'新增記帳'}</div>
                <button onClick={() => setWalletModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {['支出','存入'].map(t=>(
                  <button key={t} type="button" onClick={() => setWalletModal(p=>({...p,data:{...p.data,type:t}}))} style={{ flex:1, padding:11, borderRadius:12, border:`1.5px solid ${walletModal.data?.type===t?(t==='支出'?C.danger:C.green):C.border}`, backgroundColor:walletModal.data?.type===t?(t==='支出'?C.dangerSoft:C.greenSoft):C.bg, color:walletModal.data?.type===t?(t==='支出'?C.danger:C.green):C.textMuted, fontSize:14, fontWeight:700, cursor:'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ marginBottom:12 }}><label style={gs.label}>項目名稱 *</label><input style={gs.input} placeholder="例：晚餐、計程車" value={walletModal.data?.name||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,name:e.target.value}}))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:12 }}>
                <div><label style={gs.label}>金額 *</label><input type="number" style={gs.input} placeholder="0" value={walletModal.data?.amount||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,amount:e.target.value}}))} /></div>
                <div><label style={gs.label}>幣別</label>
                  <select value={walletModal.data?.currency||'TWD'} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,currency:e.target.value}}))} style={{ ...gs.input, cursor:'pointer' }}>
                    {['TWD','JPY','KRW','USD'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:12 }}><label style={gs.label}>日期</label><input type="date" style={gs.input} value={walletModal.data?.date||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,date:e.target.value}}))} /></div>
              <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><input style={gs.input} placeholder="選填" value={walletModal.data?.note||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,note:e.target.value}}))} /></div>
              <button onClick={() => {
                if(!walletModal.data?.name?.trim()||!walletModal.data?.amount)return;
                const fd={...walletModal.data,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:walletModal.data.createdAt||Date.now()};
                const n=walletModal.data.id?walletItems.map(i=>i.id===walletModal.data.id?fd:i):[...walletItems,{...fd,id:Date.now()}];
                setWalletItemsLocal(n);saveWallet(n);setWalletModal({open:false,data:null});
              }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${acColor},${C.blue})`, color:'#fff' }}>確認儲存</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 成員 ──────────────────────────────────────────────────────
  if (page === 'members') return (
    <div style={gs.app}>
      <Header title="成員" onBack={() => setPage(null)} />
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>
        <div style={gs.card}>
          <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:12 }}>成員（{members.length} 人）</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {members.map(m=>{
              const mc=[C.blue,C.green,C.purple,'#E0875A'][(m.displayName||'').charCodeAt(0)%4];
              return (
                <div key={m.uid} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', backgroundColor:mc+'22', border:`1.5px solid ${mc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:mc, flexShrink:0 }}>{(m.displayName||'?')[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600 }}>{m.displayName}{m.uid===user.uid&&<span style={{ fontSize:11, color:C.textMuted, marginLeft:6 }}>（我）</span>}</div>
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

  // ── 邀請碼 ──────────────────────────────────────────────────────
  return (
    <div style={gs.app}>
      <Header title="邀請碼" onBack={() => setPage(null)} />
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>
        <div style={gs.card}>
          <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:16 }}>邀請朋友加入</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ flex:1, backgroundColor:C.bg, borderRadius:12, padding:'14px', fontSize:26, fontWeight:800, letterSpacing:6, textAlign:'center', color:inviteVisible?color:C.textMuted, border:`1.5px solid ${C.border}` }}>
              {inviteVisible?trip.inviteCode:'• • • • • •'}
            </div>
            <button onClick={() => setInviteVisible(v=>!v)} style={{ backgroundColor:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'14px', fontSize:13, cursor:'pointer', color:C.textMuted, fontWeight:600 }}>{inviteVisible?'隱藏':'顯示'}</button>
          </div>
          {inviteVisible && <button onClick={copyCode} style={{ width:'100%', border:'none', borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:'pointer', backgroundColor:copied?C.successSoft:C.blueSoft, color:copied?C.success:C.blue, marginBottom:16 }}>{copied?'✓ 已複製！':'複製邀請碼'}</button>}
          <div style={{ padding:'14px', backgroundColor:C.bg, borderRadius:12, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontWeight:600 }}>朋友加入步驟</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>1. 開啟旅遊小助理並登入<br />2. 點「輸入邀請碼加入旅程」<br />3. 輸入 6 位邀請碼即可</div>
          </div>
        </div>
      </div>
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
