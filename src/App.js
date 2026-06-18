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
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const errMap = {
    "auth/email-already-in-use": "這個 email 已經註冊過了",
    "auth/invalid-email": "Email 格式不正確",
    "auth/weak-password": "密碼至少需要 6 個字元",
    "auth/user-not-found": "找不到這個帳號",
    "auth/wrong-password": "密碼錯誤",
    "auth/invalid-credential": "Email 或密碼錯誤",
    "auth/too-many-requests": "嘗試次數過多，請稍後再試",
  };

  async function handleSubmit() {
    setError(""); setMsg(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("請輸入你的名稱"); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          displayName: name.trim(),
          email: email.toLowerCase(),
          createdAt: serverTimestamp(),
        });
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

  const accentColor = mode === "register" ? C.green : mode === "forgot" ? C.purple : C.blue;

  return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
            boxShadow: "0 4px 20px rgba(74,127,212,0.3)",
          }}>🧳</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: C.text }}>旅遊小助理</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>和朋友一起探索世界每個角落</div>
        </div>

        <div style={gs.card}>
          {/* Tab */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 22, backgroundColor: C.bg, borderRadius: 12, padding: 4 }}>
              {[["login", "登入", C.blue], ["register", "註冊", C.green]].map(([m, label, color]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMsg(""); }}
                  style={{
                    flex: 1, border: "none", borderRadius: 9, padding: "10px",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    backgroundColor: mode === m ? color : "transparent",
                    color: mode === m ? "#fff" : C.textMuted,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === "forgot" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>重設密碼</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>輸入你的 email，我們會寄送重設連結</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <label style={gs.label}>你的名稱</label>
                <input style={gs.input} placeholder="輸入你的暱稱" value={name}
                  onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label style={gs.label}>Email</label>
              <input style={gs.input} type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div>
                <label style={gs.label}>密碼</label>
                <input style={gs.input} type="password"
                  placeholder={mode === "register" ? "至少 6 個字元" : "輸入密碼"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              </div>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.dangerSoft, borderRadius: 10, color: C.danger, fontSize: 13 }}>
              {error}
            </div>
          )}
          {msg && (
            <div style={{ marginTop: 12, padding: "10px 13px", backgroundColor: C.successSoft, borderRadius: 10, color: C.success, fontSize: 13 }}>
              {msg}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: "100%", border: "none", borderRadius: 13, padding: "14px",
              fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 18,
              background: `linear-gradient(135deg, ${accentColor}, ${mode === "register" ? C.blue : mode === "forgot" ? C.blue : C.purple})`,
              color: "#fff", opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 14px ${accentColor}40`,
            }}>
            {loading ? "處理中..." : mode === "login" ? "登入" : mode === "register" ? "建立帳戶" : "寄送重設信"}
          </button>

          {mode === "login" && (
            <button onClick={() => { setMode("forgot"); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", width: "100%", marginTop: 10, padding: "6px 0" }}>
              忘記密碼？
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => { setMode("login"); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", width: "100%", marginTop: 10, padding: "6px 0" }}>
              ← 回到登入
            </button>
          )}
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
      {/* Header */}
      <div style={{
        padding: "52px 20px 20px",
        background: `linear-gradient(160deg, ${C.blueSoft}, ${C.purpleSoft})`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 2 }}>{greeting()}，</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>{user.displayName || "旅行者"} 👋</div>
          </div>
          <button onClick={() => signOut(auth)}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 13px", color: C.textMuted, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            登出
          </button>
        </div>

        {/* 統計 */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {[
            { label: "旅程", value: trips.length, color: C.blue },
            { label: "國家", value: new Set(trips.map(t => t.destination).filter(Boolean)).size, color: C.green },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 旅程列表 */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
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
              return (
                <div key={trip.id} onClick={() => onEnterTrip(trip)}
                  style={{ ...gs.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "15px 16px" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    backgroundColor: color + "22", border: `1.5px solid ${color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                  }}>
                    {trip.emoji || "✈️"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.name}</div>
                    {trip.destination && (
                      <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>📍 {trip.destination}</div>
                    )}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: 20 }}>›</div>
                </div>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) { setError("請輸入旅程名稱"); return; }
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const tripRef = await addDoc(collection(db, "trips"), {
        name: name.trim(),
        destination: destination.trim(),
        emoji,
        color: TRIP_COLORS[colorIdx],
        inviteCode,
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
      onCreated();
    } catch (e) { setError("建立失敗，請再試一次"); }
    setLoading(false);
  }

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
              style={{
                width: 44, height: 44, borderRadius: 11, fontSize: 22, cursor: "pointer",
                border: `2px solid ${emoji === e ? TRIP_COLORS[colorIdx] : C.border}`,
                backgroundColor: emoji === e ? TRIP_COLORS[colorIdx] + "18" : C.bg,
              }}>
              {e}
            </button>
          ))}
        </div>

        {/* 顏色 */}
        <label style={gs.label}>顏色</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {TRIP_COLORS.map((c, i) => (
            <button key={c} onClick={() => setColorIdx(i)}
              style={{
                width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                backgroundColor: c, border: `3px solid ${colorIdx === i ? C.text : "transparent"}`,
              }} />
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
        </div>

        {error && <div style={{ marginTop: 10, color: C.danger, fontSize: 13 }}>{error}</div>}

        <button onClick={handleCreate} disabled={loading}
          style={{
            width: "100%", border: "none", borderRadius: 13, padding: "14px",
            fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 20,
            background: `linear-gradient(135deg, ${TRIP_COLORS[colorIdx]}, ${C.purple})`,
            color: "#fff", opacity: loading ? 0.7 : 1,
          }}>
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
function TripDetailScreen({ user, trip, onBack }) {
  const [members, setMembers] = useState([]);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const color = trip.color || C.blue;

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "tripMembers"), where("tripId", "==", trip.id));
      const snap = await getDocs(q);
      setMembers(snap.docs.map(d => d.data()));
    }
    load();
  }, [trip.id]);

  function copyCode() {
    navigator.clipboard.writeText(trip.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={gs.app}>
      {/* Header */}
      <div style={{
        padding: "52px 20px 20px",
        background: `linear-gradient(160deg, ${color}18, ${C.purpleSoft})`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text, flexShrink: 0 }}>
            ←
          </button>
          <div style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            backgroundColor: color + "22", border: `1.5px solid ${color}55`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>
            {trip.emoji || "✈️"}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{trip.name}</div>
            {trip.destination && <div style={{ fontSize: 12, color: C.textMuted }}>📍 {trip.destination}</div>}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* 邀請碼 */}
        <div style={gs.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 12 }}>
            邀請朋友
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{
              flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: "11px 14px",
              fontSize: 22, fontWeight: 800, letterSpacing: 5, textAlign: "center",
              color: inviteVisible ? color : C.textMuted,
              border: `1.5px solid ${C.border}`,
            }}>
              {inviteVisible ? trip.inviteCode : "• • • • • •"}
            </div>
            <button onClick={() => setInviteVisible(v => !v)}
              style={{ backgroundColor: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, cursor: "pointer", color: C.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>
              {inviteVisible ? "隱藏" : "顯示"}
            </button>
          </div>
          {inviteVisible && (
            <button onClick={copyCode}
              style={{
                width: "100%", border: "none", borderRadius: 10, padding: "11px",
                fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8,
                backgroundColor: copied ? C.successSoft : C.blueSoft,
                color: copied ? C.success : C.blue,
              }}>
              {copied ? "✓ 已複製！" : "複製邀請碼"}
            </button>
          )}
        </div>

        {/* 成員 */}
        <div style={gs.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 12 }}>
            成員（{members.length} 人）
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map(m => {
              const memberColors = [C.blue, C.green, C.purple, "#E0875A"];
              const ci = (m.displayName || "").charCodeAt(0) % memberColors.length;
              const mc = memberColors[ci];
              return (
                <div key={m.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: mc + "22", border: `1.5px solid ${mc}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 700, color: mc,
                  }}>
                    {(m.displayName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {m.displayName}
                      {m.uid === user.uid && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 6 }}>（我）</span>}
                    </div>
                    {m.role === "admin" && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600 }}>管理員</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 功能佔位 */}
        <div style={{ ...gs.card, textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🚧</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>旅程功能開發中</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
            行程規劃、美食紀錄<br />購物清單、帳務分攤<br />即將上線！
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
