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
  updateDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── 顏色主題 ───────────────────────────────────────────────
const COLORS = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceHover: "#22263a",
  border: "#2a2d3e",
  accent: "#6c8fff",
  accentSoft: "#1e2a4a",
  text: "#e8eaf0",
  textMuted: "#7a7f99",
  success: "#4caf87",
  danger: "#e05c5c",
  warning: "#e0a85c",
};

const TRIP_COLORS = [
  "#6c8fff", "#4caf87", "#e0a85c", "#e05c5c",
  "#a06cff", "#5cc4e0", "#e05ca8", "#7acf6c",
];

// ─── 全域樣式 ────────────────────────────────────────────────
const gs = {
  app: {
    minHeight: "100vh",
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    border: `1px solid ${COLORS.border}`,
    padding: "20px",
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "12px 14px",
    color: COLORS.text,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    backgroundColor: COLORS.accent,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnGhost: {
    background: "none",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: "12px 14px",
    color: COLORS.textMuted,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  },
  label: {
    display: "block",
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: 500,
  },
};

// ─── Loading ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
      <div style={{ color: COLORS.textMuted, fontSize: 14 }}>載入中...</div>
    </div>
  );
}

// ─── 登入 / 註冊畫面 ─────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | register | forgot
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
        setMsg("重設密碼信已寄出，請檢查你的信箱");
        setLoading(false); return;
      }
    } catch (e) {
      setError(errMap[e.code] || "發生錯誤，請再試一次");
    }
    setLoading(false);
  }

  return (
    <div style={{ ...gs.app, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧳</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>TripMate</div>
          <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 4 }}>和朋友一起規劃每一趟旅行</div>
        </div>

        <div style={gs.card}>
          {/* Tab 切換 */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 24, backgroundColor: COLORS.bg, borderRadius: 10, padding: 4 }}>
              {["login", "register"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMsg(""); }}
                  style={{
                    flex: 1, border: "none", borderRadius: 8, padding: "9px",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    backgroundColor: mode === m ? COLORS.surface : "transparent",
                    color: mode === m ? COLORS.text : COLORS.textMuted,
                    transition: "all 0.2s",
                  }}>
                  {m === "login" ? "登入" : "註冊"}
                </button>
              ))}
            </div>
          )}

          {mode === "forgot" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>重設密碼</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>輸入你的 email，我們會寄送重設連結</div>
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
                <input style={gs.input} type="password" placeholder={mode === "register" ? "至少 6 個字元" : "輸入密碼"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              </div>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "10px 12px", backgroundColor: "#2a1a1a", borderRadius: 8, color: COLORS.danger, fontSize: 13 }}>
              {error}
            </div>
          )}
          {msg && (
            <div style={{ marginTop: 12, padding: "10px 12px", backgroundColor: "#1a2a1a", borderRadius: 8, color: COLORS.success, fontSize: 13 }}>
              {msg}
            </div>
          )}

          <button style={{ ...gs.btn, marginTop: 20, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? "處理中..." : mode === "login" ? "登入" : mode === "register" ? "建立帳戶" : "寄送重設信"}
          </button>

          {mode === "login" && (
            <button onClick={() => { setMode("forgot"); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", width: "100%", marginTop: 12, padding: "6px 0" }}>
              忘記密碼？
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => { setMode("login"); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", width: "100%", marginTop: 12, padding: "6px 0" }}>
              ← 回到登入
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 旅程列表畫面 ─────────────────────────────────────────────
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
      if (tripIds.length === 0) { setTrips([]); setLoading(false); return; }
      const tripDocs = await Promise.all(tripIds.map(id => getDoc(doc(db, "trips", id))));
      const loaded = tripDocs
        .filter(d => d.exists())
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTrips(loaded);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSignOut() {
    if (window.confirm("確定要登出嗎？")) await signOut(auth);
  }

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div style={{ ...gs.app }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>我的旅程</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{user.displayName || user.email}</div>
        </div>
        <button onClick={handleSignOut}
          style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", color: COLORS.textMuted, fontSize: 13, cursor: "pointer" }}>
          登出
        </button>
      </div>

      {/* 旅程列表 */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: COLORS.textMuted, paddingTop: 40 }}>載入中...</div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>還沒有旅程</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted }}>建立第一趟旅行，或輸入邀請碼加入朋友的旅程</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trips.map((trip, i) => (
              <div key={trip.id} onClick={() => onEnterTrip(trip)}
                style={{
                  ...gs.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px", transition: "background 0.15s",
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  backgroundColor: trip.color || TRIP_COLORS[i % TRIP_COLORS.length],
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>
                  {trip.emoji || "✈️"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>{trip.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {trip.destination && `📍 ${trip.destination}`}
                    {trip.startDate && ` · ${formatDate(trip.startDate)}`}
                  </div>
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 18 }}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部按鈕 */}
      <div style={{ padding: "12px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={gs.btn} onClick={() => setShowCreate(true)}>＋ 建立新旅程</button>
        <button style={gs.btnGhost} onClick={() => setShowJoin(true)}>輸入邀請碼加入旅程</button>
      </div>

      {showCreate && <CreateTripModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadTrips(); }} />}
      {showJoin && <JoinTripModal user={user} onClose={() => setShowJoin(false)} onJoined={(trip) => { setShowJoin(false); onEnterTrip(trip); }} />}
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

  const EMOJIS = ["✈️", "🏖️", "🗻", "🏙️", "🌏", "🚂", "🛳️", "🏕️", "🎡", "🗼"];

  async function handleCreate() {
    if (!name.trim()) { setError("請輸入旅程名稱"); return; }
    setLoading(true);
    try {
      // 產生邀請碼
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
      // 加入成員
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ ...gs.card, width: "100%", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>建立新旅程</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        {/* Emoji 選擇 */}
        <div style={{ marginBottom: 16 }}>
          <label style={gs.label}>旅程圖示</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{ width: 42, height: 42, borderRadius: 10, border: `2px solid ${emoji === e ? COLORS.accent : COLORS.border}`, background: emoji === e ? COLORS.accentSoft : COLORS.bg, fontSize: 20, cursor: "pointer" }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 顏色選擇 */}
        <div style={{ marginBottom: 16 }}>
          <label style={gs.label}>顏色</label>
          <div style={{ display: "flex", gap: 8 }}>
            {TRIP_COLORS.map((c, i) => (
              <button key={c} onClick={() => setColorIdx(i)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${colorIdx === i ? COLORS.text : "transparent"}`, backgroundColor: c, cursor: "pointer" }} />
            ))}
          </div>
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

        {error && <div style={{ marginTop: 10, color: COLORS.danger, fontSize: 13 }}>{error}</div>}

        <button style={{ ...gs.btn, marginTop: 20, opacity: loading ? 0.7 : 1 }}
          onClick={handleCreate} disabled={loading}>
          {loading ? "建立中..." : "建立旅程"}
        </button>
      </div>
    </div>
  );
}

// ─── 輸入邀請碼 Modal ─────────────────────────────────────────
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
      // 檢查是否已加入
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
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", zIndex: 100 }}>
      <div style={{ ...gs.card, width: "100%", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>加入旅程</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <label style={gs.label}>邀請碼</label>
        <input style={{ ...gs.input, fontSize: 20, letterSpacing: 4, textTransform: "uppercase", textAlign: "center" }}
          placeholder="輸入 6 位邀請碼" value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={6} />
        {error && <div style={{ marginTop: 10, color: COLORS.danger, fontSize: 13 }}>{error}</div>}
        <button style={{ ...gs.btn, marginTop: 16, opacity: loading ? 0.7 : 1 }}
          onClick={handleJoin} disabled={loading}>
          {loading ? "加入中..." : "加入旅程"}
        </button>
      </div>
    </div>
  );
}

// ─── 旅程內頁（暫時的佔位畫面）────────────────────────────────
function TripDetailScreen({ user, trip, onBack }) {
  const [members, setMembers] = useState([]);
  const [inviteVisible, setInviteVisible] = useState(false);

  useEffect(() => { loadMembers(); }, [trip.id]);

  async function loadMembers() {
    const q = query(collection(db, "tripMembers"), where("tripId", "==", trip.id));
    const snap = await getDocs(q);
    setMembers(snap.docs.map(d => d.data()));
  }

  return (
    <div style={gs.app}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 22, cursor: "pointer", padding: 0 }}>
          ←
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: trip.color || COLORS.accent,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          {trip.emoji || "✈️"}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{trip.name}</div>
          {trip.destination && <div style={{ fontSize: 12, color: COLORS.textMuted }}>📍 {trip.destination}</div>}
        </div>
      </div>

      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
        {/* 邀請碼 */}
        <div style={{ ...gs.card, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>邀請朋友加入</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, backgroundColor: COLORS.bg, borderRadius: 8, padding: "10px 14px",
              fontSize: 20, fontWeight: 700, letterSpacing: 4, textAlign: "center", color: COLORS.accent,
            }}>
              {inviteVisible ? trip.inviteCode : "••••••"}
            </div>
            <button onClick={() => setInviteVisible(v => !v)}
              style={{ ...gs.btnGhost, width: "auto", padding: "10px 14px", whiteSpace: "nowrap" }}>
              {inviteVisible ? "隱藏" : "顯示"}
            </button>
            {inviteVisible && (
              <button onClick={() => { navigator.clipboard.writeText(trip.inviteCode); alert("邀請碼已複製！"); }}
                style={{ ...gs.btnGhost, width: "auto", padding: "10px 14px" }}>
                複製
              </button>
            )}
          </div>
        </div>

        {/* 成員列表 */}
        <div style={gs.card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>成員（{members.length} 人）</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map(m => (
              <div key={m.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", backgroundColor: COLORS.accentSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 600, color: COLORS.accent, flexShrink: 0,
                }}>
                  {(m.displayName || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.displayName}</div>
                  {m.role === "admin" && <div style={{ fontSize: 11, color: COLORS.accent }}>管理員</div>}
                </div>
                {m.uid === user.uid && <div style={{ fontSize: 12, color: COLORS.textMuted }}>（我）</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 佔位提示 */}
        <div style={{ marginTop: 24, textAlign: "center", color: COLORS.textMuted, fontSize: 13, lineHeight: 1.6 }}>
          🚧 旅程功能開發中<br />
          行程、美食、帳務等功能即將上線
        </div>
      </div>
    </div>
  );
}

// ─── 主 App ───────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = 載入中
  const [currentTrip, setCurrentTrip] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
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
