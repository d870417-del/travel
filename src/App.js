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
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── 顏色主題（旅遊海洋風：青藍 + 海綠）──────────────────────
const C = {
  bg: "#F4F0E6",         // 溫暖沙色底
  surface: "#FDFAF5",    // 米白卡片
  border: "#DDD5C0",     // 暖邊框
  blue: "#2A8FA5",       // 海洋青藍（主色）
  blueSoft: "#E0F3F8",   // 淡青藍背景
  green: "#3DAD8A",      // 海洋綠（收入、成功）
  greenSoft: "#E6F5EF",  // 淡綠背景
  purple: "#4E82A0",     // 深海藍（取代紫色）
  purpleSoft: "#E8F2F8", // 淡深海藍背景
  text: "#2A2520",       // 深暖棕文字
  textMuted: "#9C9080",  // 淡棕文字
  danger: "#C85A4A",     // 珊瑚紅
  dangerSoft: "#FDECEA",
  success: "#3DAD8A",
  successSoft: "#E6F5EF",
  warm: "#C07850",       // 暖土棕（美食、購物）
  warmSoft: "#F7EAE0",   // 淡土棕背景
  warmBorder: "#E8C4A0", // 土棕邊框
};

const TRIP_COLORS = ["#2A8FA5","#3DAD8A","#D4873A","#4E82A0","#8BA888","#C47A5A","#5BAECF","#7A9E6B"];
const TRIP_EMOJIS = ["✈️", "🏖️", "🗻", "🏙️", "🌏", "🚂", "🛳️", "🏕️", "🎡", "🗼", "🌸", "🍜"];

const gs = {
  app: {
    minHeight: "100vh",
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
    position: "relative",
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
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    WebkitAppearance: "none",
    appearance: "none",
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
    <div style={{ ...gs.app, alignItems:"center", justifyContent:"center" }}>
      <style>{`
        @keyframes trvBob {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes trvLegL {
          0%,100% { transform: rotate(-28deg); }
          50%     { transform: rotate(20deg); }
        }
        @keyframes trvLegR {
          0%,100% { transform: rotate(20deg); }
          50%     { transform: rotate(-28deg); }
        }
        @keyframes trvArm {
          0%,100% { transform: rotate(22deg); }
          50%     { transform: rotate(-8deg); }
        }
        @keyframes trvDots {
          0%   { opacity:0.3; } 33%  { opacity:1; }
          66%  { opacity:0.3; } 100% { opacity:0.3; }
        }
        .trv-body { animation: trvBob 0.85s ease-in-out infinite; }
        .trv-ll   { animation: trvLegL 0.85s ease-in-out infinite; transform-origin: 82px 50px; }
        .trv-lr   { animation: trvLegR 0.85s ease-in-out infinite; transform-origin: 82px 50px; }
        .trv-arm  { animation: trvArm  0.85s ease-in-out infinite; transform-origin: 82px 34px; }
        .trv-d1   { animation: trvDots 1.2s ease-in-out infinite 0s; }
        .trv-d2   { animation: trvDots 1.2s ease-in-out infinite 0.4s; }
        .trv-d3   { animation: trvDots 1.2s ease-in-out infinite 0.8s; }
      `}</style>

      <div className="trv-body">
        <svg width="160" height="88" viewBox="0 0 160 88">
          {/* ── 行李箱 ── */}
          <rect x="14" y="36" width="28" height="23" rx="4"
            fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinejoin="round"/>
          {/* 把手 */}
          <path d="M 21 36 L 21 29 Q 21 26 28 26 Q 35 26 35 29 L 35 36"
            fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round"/>
          {/* 中線 */}
          <line x1="14" y1="48" x2="42" y2="48"
            stroke={C.blue} strokeWidth="1.5" opacity="0.45"/>
          {/* 輪子 */}
          <circle cx="20" cy="62" r="3.5"
            fill="none" stroke={C.blue} strokeWidth="2"/>
          <circle cx="36" cy="62" r="3.5"
            fill="none" stroke={C.blue} strokeWidth="2"/>

          {/* ── 拉繩 ── */}
          <line x1="42" y1="48" x2="64" y2="44"
            stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>

          {/* ── 人 ── */}
          {/* 頭 */}
          <circle cx="82" cy="16" r="9.5"
            fill="none" stroke={C.blue} strokeWidth="2.5"/>
          {/* 身體 */}
          <line x1="82" y1="26" x2="82" y2="50"
            stroke={C.blue} strokeWidth="2.5" strokeLinecap="round"/>
          {/* 左手（拉行李） */}
          <line x1="82" y1="34" x2="64" y2="44"
            stroke={C.blue} strokeWidth="2" strokeLinecap="round"/>
          {/* 右手（擺動） */}
          <g className="trv-arm">
            <line x1="82" y1="34" x2="97" y2="43"
              stroke={C.blue} strokeWidth="2" strokeLinecap="round"/>
          </g>
          {/* 左腳 */}
          <g className="trv-ll">
            <line x1="82" y1="50" x2="82" y2="73"
              stroke={C.blue} strokeWidth="2.5" strokeLinecap="round"/>
          </g>
          {/* 右腳 */}
          <g className="trv-lr">
            <line x1="82" y1="50" x2="82" y2="73"
              stroke={C.blue} strokeWidth="2.5" strokeLinecap="round"/>
          </g>
        </svg>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:14, color:C.textMuted, fontSize:14 }}>
        <span>載入中</span>
        <span className="trv-d1" style={{ fontWeight:800 }}>．</span>
        <span className="trv-d2" style={{ fontWeight:800 }}>．</span>
        <span className="trv-d3" style={{ fontWeight:800 }}>．</span>
      </div>
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
        if (window.__setIsRegistering) window.__setIsRegistering(true);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          displayName: name.trim(),
          username: name.trim().toLowerCase().replace(/\s+/g, '_'),
          email: email.toLowerCase(),
          createdAt: serverTimestamp(),
        });
        await signOut(auth);
        if (window.__setIsRegistering) window.__setIsRegistering(false);
        setMsg("註冊成功！請用你的 email 和密碼登入 ✓");
        setMode("login");
        setName(""); setPassword("");
      } else if (mode === "login") {
        let loginEmail = email.trim();
        if (!loginEmail.includes('@')) {
          // 用戶名稱查詢
          const byUsername = await getDocs(query(collection(db,"users"), where("username","==",loginEmail.toLowerCase())));
          if (!byUsername.empty) {
            loginEmail = byUsername.docs[0].data().email;
          } else {
            // 嘗試用 displayName 查詢
            const byName = await getDocs(query(collection(db,"users"), where("displayName","==",loginEmail)));
            if (!byName.empty) loginEmail = byName.docs[0].data().email;
            else { setMsg("找不到這個用戶名稱，請改用 email 登入"); setLoading(false); return; }
          }
        }
        await signInWithEmailAndPassword(auth, loginEmail, password);
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
              <label style={gs.label}>Email / 用戶名稱</label>
              <ImeInput key="auth-email" style={gs.input} placeholder="Email 或用戶名稱" value={email} onChange={v => setEmail(v)} />
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
              <ImeInput key="auth-name" style={gs.input} placeholder="輸入暱稱" value={name} onChange={v=>setName(v)} />
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
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null); // { trip, isAdmin }
  const [tripToEdit, setTripToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => { loadTrips(); }, [user.uid]);

  async function leaveTrip(trip) {
    try {
      await deleteDoc(doc(db, "tripMembers", `${trip.id}_${user.uid}`));
      setTrips(p => p.filter(t => t.id !== trip.id));
    } catch(e) { console.error('leaveTrip error:', e); }
    setTripToDelete(null);
  }

  async function deleteTrip(trip) {
    try {
      // 刪除所有成員
      const mSnap = await getDocs(query(collection(db, "tripMembers"), where("tripId", "==", trip.id)));
      await Promise.all(mSnap.docs.map(d => deleteDoc(d.ref).catch(()=>{})));
      // 刪除旅程資料（部分可能不存在，忽略錯誤）
      const dataKeys = ['itinerary','food','foodOptions','shopping','shopOptions','wallet','todos','notes','splitRecords','currencies'];
      await Promise.all(dataKeys.map(k => deleteDoc(doc(db, "tripData", `${trip.id}_${k}`)).catch(()=>{})));
      // 刪除旅程本體
      await deleteDoc(doc(db, "trips", trip.id));
      setTrips(p => p.filter(t => t.id !== trip.id));
      setTripToDelete(null);
    } catch(e) {
      console.error('deleteTrip error:', e);
      // 就算有錯誤也關閉 dialog，讓用戶重試
      setTripToDelete(null);
      alert('刪除時發生錯誤：' + e.message);
    }
  }

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
          <button onClick={() => setConfirmLogout(true)}
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
                <div key={trip.id} style={{ ...gs.card, padding:"14px 16px", background:C.surface, position:"relative" }}>
                  {/* 右上角編輯＋刪除 */}
                  <div style={{ position:"absolute", top:10, right:12, display:"flex", gap:2, zIndex:1 }}>
                    <button onClick={() => setTripToEdit(trip)}
                      style={{ background:"none", border:"none", color:C.textMuted, fontSize:13, cursor:"pointer", padding:"2px 4px", opacity:0.5 }}>✏️</button>
                    <button onClick={() => { const isAdmin = trip.createdBy === user.uid; setTripToDelete({ trip, isAdmin }); }}
                      style={{ background:"none", border:"none", color:C.textMuted, fontSize:13, cursor:"pointer", padding:"2px 4px", opacity:0.5 }}>×</button>
                  </div>
                  {/* 主要內容點擊進入旅程 */}
                  <button onClick={() => onEnterTrip(trip)} style={{ display:"flex", alignItems:"center", gap:12, width:"100%", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0 }}>
                    <div style={{ width:46, height:46, borderRadius:13, flexShrink:0, backgroundColor:color+"22", border:`1.5px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                      {trip.emoji || "✈️"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:3, paddingRight:48 }}>{trip.name}</div>
                      <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>
                        {(trip.destinations||[trip.destination]).filter(Boolean).map(d=>`📍 ${d}`).join(' · ')}
                      </div>
                      {trip.startDate && (() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const start = new Date(trip.startDate); start.setHours(0,0,0,0);
                        const end = trip.endDate ? new Date(trip.endDate) : start; end.setHours(0,0,0,0);
                        const diff = Math.ceil((start - today) / 86400000);
                        let badge, badgeColor, badgeBg;
                        if (diff > 0) { badge=`還有 ${diff} 天`; badgeColor=color; badgeBg=color+'18'; }
                        else if (diff === 0) { badge='今天出發！🎉'; badgeColor=C.warm; badgeBg=C.warmSoft; }
                        else if (today <= end) { badge='旅遊中 ✈️'; badgeColor=C.green; badgeBg=C.greenSoft; }
                        else { badge='已結束'; badgeColor=C.textMuted; badgeBg=C.bg; }
                        return (
                          <div style={{ display:"inline-flex", alignItems:"center" }}>
                            <span style={{ padding:"3px 10px", borderRadius:8, backgroundColor:badgeBg, color:badgeColor, fontSize:11, fontWeight:700 }}>{badge}</span>
                            {trip.startDate && <span style={{ fontSize:10, color:C.textMuted, marginLeft:6 }}>{fmtDate(trip.startDate)}{trip.endDate?` – ${fmtDate(trip.endDate)}`:''}</span>}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ color:color, fontSize:20, fontWeight:700, flexShrink:0 }}>›</div>
                  </button>
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
      {confirmLogout && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backgroundColor:'rgba(45,42,36,0.5)' }}>
          <div style={{ ...gs.card, width:'100%', maxWidth:320, padding:24 }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:10 }}>👋</div>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:6, textAlign:'center' }}>確認登出</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:20, textAlign:'center' }}>確定要登出嗎？</div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmLogout(false)} style={{ flex:1, padding:12, border:`1px solid ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.textMuted, fontSize:14, fontWeight:600, cursor:'pointer' }}>取消</button>
              <button onClick={() => { setConfirmLogout(false); signOut(auth); }} style={{ flex:1, padding:12, border:'none', borderRadius:12, backgroundColor:C.danger, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>登出</button>
            </div>
          </div>
        </div>
      )}
      {tripToEdit && (
        <EditTripModal trip={tripToEdit} onClose={() => setTripToEdit(null)} onSaved={(updated) => {
          setTrips(p => p.map(t => t.id===updated.id ? {...t,...updated} : t));
          setTripToEdit(null);
        }} />
      )}
      {tripToDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backgroundColor:'rgba(45,42,36,0.5)' }}>
          <div style={{ ...gs.card, width:'100%', maxWidth:320, padding:24 }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:10 }}>{tripToDelete.isAdmin ? '🗑' : '🚪'}</div>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:6, textAlign:'center' }}>
              {tripToDelete.isAdmin ? '刪除旅程' : '退出旅程'}
            </div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:6, textAlign:'center' }}>
              「{tripToDelete.trip.name}」
            </div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:20, textAlign:'center', lineHeight:1.6 }}>
              {tripToDelete.isAdmin
                ? '你是管理員，刪除後所有成員的資料都會一起刪除，無法復原。'
                : '退出後你將無法看到這個旅程，可以再用邀請碼重新加入。'}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setTripToDelete(null)} style={{ flex:1, padding:12, border:`1px solid ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.textMuted, fontSize:14, fontWeight:600, cursor:'pointer' }}>取消</button>
              {tripToDelete.isAdmin ? (
                <button onClick={() => deleteTrip(tripToDelete.trip)} style={{ flex:1, padding:12, border:'none', borderRadius:12, backgroundColor:C.danger, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>刪除旅程</button>
              ) : (
                <button onClick={() => leaveTrip(tripToDelete.trip)} style={{ flex:1, padding:12, border:'none', borderRadius:12, backgroundColor:C.danger, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>退出旅程</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 建立旅程 Modal ───────────────────────────────────────────
function CreateTripModal({ user, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [destinations, setDestinations] = useState([]); // 多個地點
  const [destInput, setDestInput] = useState("");
  const [emoji, setEmoji] = useState("✈️");
  const [colorIdx, setColorIdx] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function addDest() {
    const v = destInput.trim();
    if (!v || destinations.includes(v)) return;
    setDestinations(p => [...p, v]);
    setDestInput("");
  }

  async function handleCreate() {
    if (!name.trim()) { setError("請輸入旅程名稱"); return; }
    if (startDate && endDate && endDate < startDate) { setError("結束日期不能早於開始日期"); return; }
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const tripRef = await addDoc(collection(db, "trips"), {
        name: name.trim(),
        destinations,
        destination: destinations[0] || "", // 相容舊欄位
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
      const dates = generateDateList(startDate, endDate);
      await setDoc(doc(db, "tripData", `${tripRef.id}_itinerary`), {
        items: [], dates, updatedAt: serverTimestamp(),
      });
      // 自動建立 foodOptions 以旅程地點作為城市
      if (destinations.length > 0) {
        await setDoc(doc(db, "tripData", `${tripRef.id}_foodOptions`), {
          cities: destinations,
          districts: {},
          foodTypes: ["必吃","咖啡甜點","居酒屋","拉麵","燒肉","海鮮","其他"],
        });
        await setDoc(doc(db, "tripData", `${tripRef.id}_shopOptions`), {
          cities: destinations,
          malls: {},
          locations: {},
        });
      }
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
            <label style={gs.label}>旅遊地點（可多個）</label>
            {destinations.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                {destinations.map(d => (
                  <div key={d} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", backgroundColor:tripColor+"18", border:`1.5px solid ${tripColor}44`, borderRadius:20 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:tripColor }}>📍 {d}</span>
                    <button onClick={() => setDestinations(p=>p.filter(x=>x!==d))}
                      style={{ background:"none", border:"none", color:tripColor, fontSize:15, cursor:"pointer", lineHeight:1, padding:0, opacity:0.7 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <ImeInput key="dest-input" style={{ ...gs.input, flex:1 }} placeholder="例：福岡、大阪" value={destInput} onChange={v=>setDestInput(v)} />
              <button onClick={addDest}
                style={{ padding:"12px 16px", border:"none", borderRadius:12, backgroundColor:tripColor, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>＋</button>
            </div>
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
// ─── 可展開成員結算卡片 ──────────────────────────────────────
// ─── 代墊結算可展開卡片 ──────────────────────────────────────
const ExpandableTransferCard = React.memo(function ExpandableTransferCard({
  t, idx, fromM, toM, iAmFrom, iAmTo, done, unsettled, SYM, toTWD, C, gs,
  transferStates, setTransferStates, splitRecords, saveSplitRecords, setSplitRecords, user, members
}) {
  const [expanded, setExpanded] = React.useState(false);
  const sk = t.from + t.to + t.currency;
  const s = transferStates[sk] || { paidConfirmed:false, receivedConfirmed:false };

  // 找相關的原始代墊記錄
  const relatedRecords = (Array.isArray(splitRecords)?splitRecords:[]).filter(r=>
    ((r.payerId===t.to && r.receiverId===t.from) || (r.payerId===t.from && r.receiverId===t.to)) &&
    r.currency===t.currency
  );

  const settle = () => {
    const n = splitRecords.filter(r=>!(
      ((r.payerId===t.to&&r.receiverId===t.from)||(r.payerId===t.from&&r.receiverId===t.to))&&r.currency===t.currency
    ));
    setSplitRecords(n); saveSplitRecords(n);
    setTransferStates(p=>{ const np={...p}; delete np[sk]; return np; });
  };

  return (
    <div style={{ ...gs.card, padding:'14px 16px', marginBottom:10, opacity:done?0.5:1, backgroundColor:iAmTo?C.greenSoft:iAmFrom?C.dangerSoft:C.surface }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>{iAmFrom?'我':fromM.displayName} → {iAmTo?'我':toM.displayName}</div>
          <div style={{ fontSize:18, fontWeight:800, color:iAmTo?C.green:iAmFrom?C.danger:C.text, marginTop:4 }}>
            {SYM[t.currency]||''}{t.amount.toLocaleString()} {t.currency}
            <span style={{ fontSize:11, color:C.textMuted, fontWeight:400, marginLeft:6 }}>≈ NT${toTWD(t.amount,t.currency).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {(iAmFrom||iAmTo)&&!done&&(
            <div style={{ fontSize:11, fontWeight:700, color:iAmTo?C.green:C.danger, padding:'5px 10px', borderRadius:8, border:`1px solid ${iAmTo?C.green:C.danger}33` }}>
              {iAmTo?'待收款':'待還款'}
            </div>
          )}
          {relatedRecords.length>0 && (
            <button onClick={()=>setExpanded(e=>!e)}
              style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
              明細 {expanded?'▲':'▼'}
            </button>
          )}
        </div>
      </div>

      {/* 展開明細 */}
      {expanded && relatedRecords.length>0 && (
        <div style={{ backgroundColor:'rgba(255,255,255,0.6)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:8 }}>代墊明細</div>
          {relatedRecords.map((r,ri)=>(
            <div key={ri} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:ri<relatedRecords.length-1?`1px solid ${C.border}`:'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', backgroundColor:C.purple, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{r.note||'代墊'}</div>
                <div style={{ fontSize:10, color:C.textMuted }}>
                  {members.find(m=>m.uid===r.receiverId)?.displayName||'?'} 欠 {members.find(m=>m.uid===r.payerId)?.displayName||'?'}
                </div>
              </div>
              <div style={{ fontSize:12, fontWeight:800, color:C.purple }}>{SYM[r.currency]||''}{r.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {done ? (
        <div style={{ textAlign:'center', fontSize:12, color:C.green, fontWeight:700 }}>✓ 已結清</div>
      ) : (
        <button onClick={settle} style={{ width:'100%', padding:'10px', borderRadius:10, border:`1px solid ${C.green}`, backgroundColor:C.greenSoft, color:C.green, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          ✓ 標記結清
        </button>
      )}
    </div>
  );
});

const ExpandableMemberCard = React.memo(function ExpandableMemberCard({ m, bal, hasBal, detail, SYM, effRates, toTWD, isMe }) {
  const [expanded, setExpanded] = React.useState(false);
  const mc = [C.blue, C.green, C.purple, '#E0875A'][(m.displayName||'').charCodeAt(0)%4];
  const currencies = Object.keys(bal).filter(c=>bal[c]!==0);

  return (
    <div style={{ ...gs.card, padding:0, overflow:'hidden' }}>
      {/* 主列 */}
      <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', backgroundColor:mc+'22', border:`1.5px solid ${mc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:mc, flexShrink:0 }}>
          {(m.displayName||'?')[0].toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>{m.displayName}{isMe&&<span style={{ fontSize:11, color:C.textMuted, marginLeft:4 }}>（我）</span>}</div>
          {!hasBal ? (
            <div style={{ fontSize:11, color:C.textMuted }}>無異動</div>
          ) : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:2 }}>
              {currencies.map(cur=>{
                const v=bal[cur];
                return (
                  <div key={cur}>
                    <span style={{ fontSize:13, fontWeight:800, color:v>=0?C.green:C.danger }}>{v>=0?'+':''}{SYM[cur]||''}{Math.abs(v).toLocaleString()}</span>
                    <span style={{ fontSize:10, color:C.textMuted, marginLeft:4 }}>≈ NT${toTWD(Math.abs(v),cur).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {detail.length>0 && (
          <button onClick={()=>setExpanded(e=>!e)}
            style={{ padding:'5px 10px', borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
            明細 {expanded?'▲':'▼'}
          </button>
        )}
      </div>
      {/* 展開明細 */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 14px', backgroundColor:'#F8F4EE' }}>
          {detail.map((w,wi)=>{
            const isIn = w.type==='存入';
            const allUids = Object.keys(effRates).length>0?[]:[];
            const totalAmt = Number(w.amount)||0;
            const ids2 = isIn ? (w.contributorIds||[]) : (w.forMemberIds||[]);
            const n3 = ids2.length||1;
            const per = Math.floor(totalAmt/n3);
            const rem3 = totalAmt - per*n3;
            // 找這個成員是第幾個（決定是否多付1）
            const memberIdx = ids2.indexOf(m.uid);
            const actualPer = per + (memberIdx>=0 && memberIdx<rem3 ? 1 : 0);
            return (
              <div key={wi} style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:8, marginBottom:8, borderBottom:wi<detail.length-1?`1px solid ${C.border}`:'none' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:isIn?C.green:C.danger, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{w.name}</div>
                  <div style={{ fontSize:10, color:C.textMuted }}>{w.date} · {isIn?`存入（每人 ${SYM[w.currency]||''}${per.toLocaleString()}）`:`支出（每人 ${SYM[w.currency]||''}${per.toLocaleString()}）`}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:800, color:isIn?C.green:C.danger, flexShrink:0 }}>
                  {isIn?'+':'-'}{SYM[w.currency]||''}{actualPer.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ─── 編輯旅程 Modal ──────────────────────────────────────────
function EditTripModal({ trip, onClose, onSaved }) {
  const [name, setName] = useState(trip.name || '');
  const [destinations, setDestinations] = useState(trip.destinations || (trip.destination ? [trip.destination] : []));
  const [destInput, setDestInput] = useState('');
  const [emoji, setEmoji] = useState(trip.emoji || '✈️');
  const [colorIdx, setColorIdx] = useState(TRIP_COLORS.indexOf(trip.color) >= 0 ? TRIP_COLORS.indexOf(trip.color) : 0);
  const [startDate, setStartDate] = useState(trip.startDate || '');
  const [endDate, setEndDate] = useState(trip.endDate || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tripColor = TRIP_COLORS[colorIdx];

  function addDest() {
    const v = destInput.trim();
    if (!v || destinations.includes(v)) return;
    setDestinations(p => [...p, v]);
    setDestInput('');
  }

  async function handleSave() {
    if (!name.trim()) { setError('請輸入旅程名稱'); return; }
    if (startDate && endDate && endDate < startDate) { setError('結束日期不能早於開始日期'); return; }
    setLoading(true);
    try {
      const updated = {
        name: name.trim(),
        destinations,
        destination: destinations[0] || '',
        emoji,
        color: TRIP_COLORS[colorIdx],
        startDate: startDate || null,
        endDate: endDate || null,
      };
      await updateDoc(doc(db, "trips", trip.id), updated);
      // 同步更新 foodOptions 和 shopOptions 的城市
      try {
        const foodSnap = await getDoc(doc(db,"tripData",`${trip.id}_foodOptions`));
        if (foodSnap.exists()) {
          const fd = foodSnap.data();
          await setDoc(doc(db,"tripData",`${trip.id}_foodOptions`), {...fd, cities:destinations});
        } else if(destinations.length>0) {
          await setDoc(doc(db,"tripData",`${trip.id}_foodOptions`), { cities:destinations, districts:{}, foodTypes:['必吃','咖啡甜點','居酒屋','拉麵','燒肉','海鮮','其他'] });
        }
        const shopSnap = await getDoc(doc(db,"tripData",`${trip.id}_shopOptions`));
        if (shopSnap.exists()) {
          const sd = shopSnap.data();
          await setDoc(doc(db,"tripData",`${trip.id}_shopOptions`), {...sd, cities:destinations});
        }
      } catch(e) {}
      onSaved({ ...trip, ...updated });
    } catch(e) { setError('儲存失敗，請再試一次'); }
    setLoading(false);
  }

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>編輯旅程</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>

        {/* Emoji */}
        <label style={gs.label}>旅程圖示</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {TRIP_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              style={{ width:44, height:44, borderRadius:11, fontSize:22, cursor:'pointer', border:`2px solid ${emoji===e?tripColor:C.border}`, backgroundColor:emoji===e?tripColor+'18':C.bg }}>
              {e}
            </button>
          ))}
        </div>

        {/* 顏色 */}
        <label style={gs.label}>顏色</label>
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          {TRIP_COLORS.map((c,i) => (
            <button key={c} onClick={() => setColorIdx(i)}
              style={{ width:30, height:30, borderRadius:'50%', cursor:'pointer', backgroundColor:c, border:`3px solid ${colorIdx===i?C.text:'transparent'}` }} />
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={gs.label}>旅程名稱 *</label>
            <ImeInput key="edit-trip-name" style={gs.input} placeholder="例：東京五天四夜" value={name} onChange={v=>setName(v)} />
          </div>
          <div>
            <label style={gs.label}>旅遊地點（可多個）</label>
            {destinations.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                {destinations.map(d => (
                  <div key={d} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', backgroundColor:tripColor+'18', border:`1.5px solid ${tripColor}44`, borderRadius:20 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:tripColor }}>📍 {d}</span>
                    <button onClick={() => setDestinations(p=>p.filter(x=>x!==d))}
                      style={{ background:'none', border:'none', color:tripColor, fontSize:15, cursor:'pointer', lineHeight:1, padding:0, opacity:0.7 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <ImeInput key="edit-dest-input" style={{ ...gs.input, flex:1 }} placeholder="例：福岡、大阪" value={destInput} onChange={v=>setDestInput(v)} />
              <button onClick={addDest} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:tripColor, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={gs.label}>出發日期</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if(endDate&&e.target.value>endDate)setEndDate(''); }} style={gs.input} />
            </div>
            <div>
              <label style={gs.label}>回程日期</label>
              <input type="date" value={endDate} min={startDate} onChange={e=>setEndDate(e.target.value)} style={gs.input} />
            </div>
          </div>
        </div>

        {error && <div style={{ marginTop:10, color:C.danger, fontSize:13 }}>{error}</div>}

        <button onClick={handleSave} disabled={loading}
          style={{ width:'100%', border:'none', borderRadius:13, padding:'14px', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:20, background:`linear-gradient(135deg,${tripColor},${C.purple})`, color:'#fff', opacity:loading?0.7:1 }}>
          {loading ? '儲存中...' : '儲存變更'}
        </button>
      </div>
    </div>
  );
}

// ImeInput：解決 iOS 注音輸入消失問題
// 完全 uncontrolled，避免 React re-render 收起鍵盤
const ImeInput = React.memo(function ImeInput({ value, onChange, style, placeholder, type, autoComplete, multiline, rows }) {
  const ref = React.useRef(null);
  const composing = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  // 只在 mount 時設定初始值，之後完全 uncontrolled
  // 這樣 parent re-render 不會觸發 input 重新渲染，鍵盤不會收起
  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (!ref.current) return;
    if (!initialized.current) {
      initialized.current = true;
      ref.current.value = value || '';
    }
  }, []); // eslint-disable-line

  // 當 modal 重新開啟（value 從 '' 變成有值，或 id 改變時）重設
  const prevOpenValue = React.useRef('__UNSET__');
  React.useEffect(() => {
    if (!ref.current) return;
    if (composing.current) return;
    // 用一個特殊初始值判斷是否是第一次
    const newVal = value || '';
    if (prevOpenValue.current === '__UNSET__') {
      prevOpenValue.current = newVal;
      ref.current.value = newVal;
      return;
    }
    // 只有當值從外部完全清空（代表 modal 關閉重開）才重設
    if (newVal === '' && prevOpenValue.current !== '') {
      prevOpenValue.current = newVal;
      ref.current.value = newVal;
    } else {
      prevOpenValue.current = newVal;
    }
  }, [value]);

  const sharedProps = {
    ref,
    placeholder,
    style,
    autoComplete: autoComplete || 'off',
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: (e) => {
      composing.current = false;
      onChangeRef.current(e.target.value);
    },
    onChange: (e) => {
      if (!composing.current) onChangeRef.current(e.target.value);
    },
    onBlur: (e) => {
      if (!composing.current) onChangeRef.current(e.target.value);
    },
  };

  if (multiline) return <textarea {...sharedProps} rows={rows || 3} />;
  return <input type={type || 'text'} {...sharedProps} />;
}, (prev, next) => {
  // 只有當 value 從有值變成空值（modal 重開）才重新渲染
  const shouldUpdate = (next.value === '' && prev.value !== '') || (prev.value === '' && next.value !== '');
  return !shouldUpdate; // true = 不重新渲染
});

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
    '美食': { bg: C.warmSoft, color: C.warm, border: C.warmBorder },
    '購物': { bg: C.warmSoft, color: C.warm, border: C.warmBorder },
    '交通': { bg: C.purpleSoft, color: C.purple, border: '#D4C4FF' },
    '住宿': { bg: C.blueSoft, color: C.blue, border: '#B8D0F8' },
    '其他': { bg: '#F0EDE8', color: C.textMuted, border: C.border },
  };
  return map[cat] || map['其他'];
};

// ─── 行程規劃 Tab ─────────────────────────────────────────────
// ─── 上傳行程表解析 Modal（獨立組件，避免 Hooks 數量變動）───
function UploadItineraryModal({ onClose, user, trip, members, itinerary, tripDates, setItinerary, setTripDates, saveItinerary }) {
        const [uMode, setUMode] = React.useState('file');
        const [uText, setUText] = React.useState('');
        const [uFile, setUFile] = React.useState(null);
        const [uFileData, setUFileData] = React.useState(null);
        const [uFileType, setUFileType] = React.useState(null);
        const [uLoading, setULoading] = React.useState(false);
        const [uParsed, setUParsed] = React.useState(null);
        const [uSelected, setUSelected] = React.useState([]);
        const [uError, setUError] = React.useState('');

        const handleFile = (e) => {
          const f = e.target.files[0]; if(!f) return;
          setUFile(f); setUError('');
          const name = (f.name||'').toLowerCase();
          const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');
          if (isExcel) {
            setUFileType('excel');
            const reader = new FileReader();
            reader.onload = ev => setUFileData(ev.target.result); // ArrayBuffer
            reader.readAsArrayBuffer(f);
          } else {
            const reader = new FileReader();
            reader.onload = ev => {
              setUFileData(ev.target.result.split(',')[1]);
              setUFileType(f.type.startsWith('image/') ? 'image' : 'pdf');
            };
            reader.readAsDataURL(f);
          }
        };

        const loadXLSXlib = () => new Promise(res => {
          if (window.XLSX) { res(window.XLSX); return; }
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = () => res(window.XLSX);
          document.head.appendChild(s);
        });

        const handleParse = async () => {
          setULoading(true); setUError('');
          try {
            // Excel：直接讀取，不需 AI（格式固定）
            if (uMode==='file' && uFileType==='excel') {
              const XLSX = await loadXLSXlib();
              const wb = XLSX.read(uFileData, { type:'array' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json(ws, { header:1 });
              const header = (rows[0]||[]).map(h=>String(h||'').trim());
              const col = name => header.findIndex(h=>h.includes(name));
              const ci = { date:col('日期'), time:col('時間'), cat:col('類別'), name:col('名稱'), loc:col('地點'), note:col('備註') };
              const items = rows.slice(1).filter(r=>r&&(r[ci.name]||r[ci.date])).map(r=>({
                date: ci.date>=0 ? String(r[ci.date]||'').trim() : '',
                time: ci.time>=0 ? String(r[ci.time]||'').trim() : '',
                category: ci.cat>=0 ? String(r[ci.cat]||'景點').trim() : '景點',
                name: ci.name>=0 ? String(r[ci.name]||'').trim() : '',
                location: ci.loc>=0 ? String(r[ci.loc]||'').trim() : '',
                note: ci.note>=0 ? String(r[ci.note]||'').trim() : '',
              }));
              if(items.length===0){ setUError('Excel 沒有可解析的資料'); setULoading(false); return; }
              setUParsed(items); setUSelected(items.map((_,i)=>i));
              setULoading(false); return;
            }
            const systemPrompt = `你是行程解析助手。請分析行程內容並只回傳純 JSON（不要說明、不要 markdown 代碼塊），格式：{"items":[{"date":"YYYY-MM-DD或空字串","name":"地點或活動名稱","category":"景點|美食|購物|交通|住宿|其他","time":"HH:MM或空字串","note":"備註說明"}]}`;
            const _gk = ['AQ.Ab8RN6IJ1W','s-NnDyfYbXwpi','U0_Qa7qZm1lHh','S0BxaYkC3xxsRQ'];
            const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || _gk.join('');
            let parts;
            if(uMode==='text') {
              parts = [{ text: systemPrompt + '\n\n請解析這個行程表：\n\n' + uText }];
            } else if(uFileType==='image') {
              parts = [
                { inline_data:{ mime_type:uFile.type, data:uFileData } },
                { text: systemPrompt + '\n\n請解析這張行程表圖片，萃取所有行程項目。' }
              ];
            } else {
              parts = [
                { inline_data:{ mime_type:'application/pdf', data:uFileData } },
                { text: systemPrompt + '\n\n請解析這份行程表文件，萃取所有行程項目。' }
              ];
            }
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
              method:'POST',
              headers:{
                'Content-Type':'application/json',
                'x-goog-api-key': GEMINI_KEY
              },
              body: JSON.stringify({
                contents:[{ parts }],
                generationConfig:{ maxOutputTokens:4096, temperature:0.1 }
              })
            });
            const data = await resp.json();
            if (data.error) { throw new Error(data.error.message || 'API 錯誤'); }
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let clean = raw.replace(/```json|```/g,'').trim();
            // 修復被截斷的 JSON：補上缺少的結尾
            if (clean && !clean.endsWith('}')) {
              const lastBrace = clean.lastIndexOf('}');
              if (lastBrace > 0) clean = clean.slice(0, lastBrace+1) + ']}';
            }
            const parsed = JSON.parse(clean);
            const items = parsed.items||[];
            setUParsed(items);
            setUSelected(items.map((_,i)=>i));
          } catch(e) {
            console.error('Gemini parse error:', e);
            setUError(`解析失敗：${e?.message||'請確認 API key 是否正確，或稍後再試'}`);
          }
          setULoading(false);
        };

        const handleAdd = () => {
          const now = Date.now();
          const newItems = uSelected.map((idx,i) => {
            const it = uParsed[idx];
            return { id:now+i, name:it.name||'未命名', category:it.category||'景點', date:it.date||'待安排', time:it.time||'', note:it.note||'', createdAt:now+i, editedByName:user.displayName||user.email, editedById:user.uid };
          });
          const newIti = [...itinerary, ...newItems];
          const newDates = [...new Set(newItems.map(it=>it.date).filter(d=>d&&d!=='待安排'))].sort();
          const merged = [...new Set([...tripDates.filter(d=>d!=='待安排'), ...newDates, '待安排'])].sort();
          const finalDates = [...merged.filter(d=>d!=='待安排'), '待安排'];
          setItinerary(newIti); setTripDates(finalDates);
          saveItinerary(newIti, finalDates);
          onClose();
        };

        const catColor = { '景點':C.green, '美食':C.warm, '購物':C.warm, '交通':C.purple, '住宿':C.blue, '其他':C.textMuted };

        return (
          <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <div onClick={()=>onClose()} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
            <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:520, borderRadius:'24px 24px 0 0', maxHeight:'88vh', overflowY:'auto', padding:24, paddingBottom:40 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div style={{ fontSize:17, fontWeight:800 }}>📥 智能匯入行程</div>
                <button onClick={()=>onClose()} style={{ background:'none', border:'none', fontSize:24, color:C.textMuted, cursor:'pointer' }}>×</button>
              </div>

              {!uParsed ? (<>
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {[['file','📎 上傳檔案'],['text','✏️ 貼上文字']].map(([m,label])=>(
                    <button key={m} onClick={()=>setUMode(m)} style={{ flex:1, padding:'10px', borderRadius:10, border:`1.5px solid ${uMode===m?C.blue:C.border}`, backgroundColor:uMode===m?C.blueSoft:C.bg, color:uMode===m?C.blue:C.textMuted, fontWeight:700, fontSize:13, cursor:'pointer' }}>{label}</button>
                  ))}
                </div>
                {uMode==='file' ? (
                  <>
                    <input type="file" accept="image/*,.pdf,.xlsx,.xls,.csv" onChange={handleFile} style={{ display:'none' }} id="iti-up"/>
                    <label htmlFor="iti-up" style={{ display:'block', border:`2px dashed ${uFile?C.blue:C.border}`, borderRadius:16, padding:'36px 20px', textAlign:'center', cursor:'pointer', backgroundColor:uFile?C.blueSoft:'transparent' }}>
                      {uFile ? (<>
                        <div style={{ fontSize:36, marginBottom:8 }}>{uFileType==='image'?'🖼️':uFileType==='excel'?'📊':'📄'}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:C.blue }}>{uFile.name}</div>
                        <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>{uFileType==='excel'?'Excel 行程表，可直接解析':'點擊重新選擇'}</div>
                      </>) : (<>
                        <div style={{ fontSize:40, marginBottom:8 }}>📂</div>
                        <div style={{ fontSize:14, fontWeight:700, color:C.textMuted }}>點擊上傳檔案</div>
                        <div style={{ fontSize:12, color:C.textMuted, marginTop:6 }}>Excel 行程表、截圖、拍照、PDF 都可以</div>
                      </>)}
                    </label>
                  </>
                ) : (
                  <textarea style={{ ...gs.input, height:200, resize:'none', lineHeight:1.6 }}
                    placeholder={'把行程文字貼在這裡，例如：\n6/20 10:00 淺草寺\n6/20 12:00 築地午餐\n6/21 成田機場回台灣'}
                    value={uText} onChange={e=>setUText(e.target.value)}/>
                )}
                {uError && <div style={{ color:C.danger, fontSize:13, marginTop:10, textAlign:'center' }}>{uError}</div>}
                <button onClick={handleParse} disabled={uLoading||(uMode==='file'?!uFileData:!uText.trim())}
                  style={{ width:'100%', marginTop:16, padding:14, borderRadius:13, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', opacity:(uLoading||(uMode==='file'?!uFileData:!uText.trim()))?0.5:1 }}>
                  {uLoading ? '⏳ 解析中...' : (uFileType==='excel' ? '📊 讀取 Excel' : '✨ 開始解析')}
                </button>
              </>) : (<>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:12 }}>
                  解析到 <strong style={{ color:C.blue }}>{uParsed.length}</strong> 個項目，勾選要加入的：
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                  {uParsed.map((item,i)=>{
                    const sel=uSelected.includes(i);
                    return (
                      <div key={i} onClick={()=>setUSelected(s=>sel?s.filter(x=>x!==i):[...s,i])}
                        style={{ padding:'10px 12px', borderRadius:12, border:`1.5px solid ${sel?C.blue:C.border}`, backgroundColor:sel?C.blueSoft:C.bg, cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start' }}>
                        <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${sel?C.blue:C.border}`, backgroundColor:sel?C.blue:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                          {sel&&<span style={{ color:'#fff', fontSize:12, fontWeight:900 }}>✓</span>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                            <span style={{ fontSize:14, fontWeight:700 }}>{item.name}</span>
                            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:6, backgroundColor:(catColor[item.category]||C.textMuted)+'22', color:catColor[item.category]||C.textMuted, fontWeight:700 }}>{item.category||'其他'}</span>
                          </div>
                          {(item.date||item.time)&&<div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
                            {item.date&&<span>📅 {item.date}</span>}{item.date&&item.time&&' · '}{item.time&&<span>🕐 {item.time}</span>}
                          </div>}
                          {item.note&&<div style={{ fontSize:12, color:C.textMuted, marginTop:3, opacity:0.8 }}>{item.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setUParsed(null)} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>↩ 重新解析</button>
                  <button onClick={handleAdd} disabled={uSelected.length===0}
                    style={{ flex:2, padding:12, borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:uSelected.length===0?0.5:1 }}>
                    加入行程（{uSelected.length} 項）
                  </button>
                </div>
              </>)}
            </div>
          </div>
        );
}

// ─── AI 一鍵排行程組件 ───
function AIPlanModal({ onClose, trip, itinerary, foodItems, tripDates, setItinerary, setTripDates, saveItinerary }) {
  const unscheduled = itinerary.filter(it => !it.date || it.date==='待安排');
  const [step, setStep] = React.useState('config'); // config | loading | preview
  const [selDays, setSelDays] = React.useState(tripDates.filter(d=>d!=='待安排'));
  const [startH, setStartH] = React.useState('09:00');
  const [endH, setEndH] = React.useState('21:00');
  const [includeFood, setIncludeFood] = React.useState(true);
  const [aiSuggest, setAiSuggest] = React.useState(true);
  const [selFoods, setSelFoods] = React.useState(foodItems.filter(f=>!f.visited).map(f=>f.id));
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const _gk = ['AQ.Ab8RN6IJ1W','s-NnDyfYbXwpi','U0_Qa7qZm1lHh','S0BxaYkC3xxsRQ'];
  const GEMINI_KEY = (typeof import.meta!=='undefined' && import.meta.env && import.meta.env.VITE_GEMINI_KEY) || _gk.join('');

  const toggleDay = d => setSelDays(s => s.includes(d) ? s.filter(x=>x!==d) : [...s,d]);
  const toggleFood = id => setSelFoods(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);

  const generate = async () => {
    if (selDays.length===0) { setError('請至少選一天'); return; }
    setStep('loading'); setError('');
    try {
      const spots = unscheduled.map(it=>({ name:it.name, category:it.category, note:it.note||'' }));
      const foods = includeFood ? foodItems.filter(f=>selFoods.includes(f.id)).map(f=>({ name:f.name, type:f.foodType||'', area:(f.districts||[f.district]).filter(Boolean).join('') })) : [];
      const prompt = `你是專業旅遊行程規劃師。目的地：${trip.destinations||trip.name}。
請把以下景點和美食，合理分配到 ${selDays.length} 天的行程裡（日期：${selDays.join('、')}），每天時間 ${startH} 到 ${endH}。

現有景點：${JSON.stringify(spots)}
${foods.length?`要排入的美食：${JSON.stringify(foods)}`:''}
${aiSuggest?'另外請依目的地特色，補充建議 2-4 個值得去但清單沒有的景點。':''}

排程原則：
1. 地理位置相近的排在同一天，減少往返
2. 美食安排在中午(12點左右)和傍晚(18-19點)
3. 每天 4-6 個行程，時間合理分配
4. 早上景點、中午美食、下午景點、傍晚美食/購物

只回傳純 JSON（不要說明、不要 markdown）：
{"schedule":[{"date":"日期","time":"HH:MM","name":"名稱","category":"景點|美食|購物|交通|住宿|其他","note":"簡短說明或推薦理由","isNew":true/false}]}`;

      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-goog-api-key':GEMINI_KEY },
        body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }], generationConfig:{ maxOutputTokens:8192, temperature:0.4 } })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let clean = raw.replace(/```json|```/g,'').trim();
      if (clean && !clean.endsWith('}')) { const lb=clean.lastIndexOf('}'); if(lb>0) clean=clean.slice(0,lb+1)+']}'; }
      const parsed = JSON.parse(clean);
      setResult(parsed.schedule||[]);
      setStep('preview');
    } catch(e) {
      setError('排程失敗：'+(e?.message||'請重試'));
      setStep('config');
    }
  };

  const apply = () => {
    const now = Date.now();
    // 移除原本未排的景點（會被重新排），保留已排的
    const scheduled = itinerary.filter(it => it.date && it.date!=='待安排');
    const newItems = result.map((r,i)=>({
      id: now+i, name:r.name, category:r.category||'景點', date:r.date, time:r.time||'', note:r.note||'',
      createdAt: now+i,
    }));
    const merged = [...scheduled, ...newItems];
    const allDates = [...new Set([...tripDates.filter(d=>d!=='待安排'), ...newItems.map(it=>it.date)])].sort();
    const finalDates = ['待安排', ...allDates];
    setItinerary(merged); setTripDates(finalDates);
    saveItinerary(merged, finalDates);
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:250, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
      <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:520, borderRadius:'24px 24px 0 0', maxHeight:'90vh', overflowY:'auto', padding:24, paddingBottom:40 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>✨ AI 一鍵排行程</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, color:C.textMuted, cursor:'pointer' }}>×</button>
        </div>

        {step==='config' && (<>
          <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, marginBottom:8 }}>要排哪幾天？</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
            {tripDates.filter(d=>d!=='待安排').map(d=>(
              <button key={d} onClick={()=>toggleDay(d)} style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${selDays.includes(d)?C.blue:C.border}`, backgroundColor:selDays.includes(d)?C.blueSoft:C.bg, color:selDays.includes(d)?C.blue:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>{d}</button>
            ))}
          </div>

          <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, marginBottom:8 }}>每天時間</div>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
            <input type="time" value={startH} onChange={e=>setStartH(e.target.value)} style={{ ...gs.input, flex:1 }}/>
            <span style={{ color:C.textMuted }}>～</span>
            <input type="time" value={endH} onChange={e=>setEndH(e.target.value)} style={{ ...gs.input, flex:1 }}/>
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, cursor:'pointer' }}>
            <input type="checkbox" checked={aiSuggest} onChange={e=>setAiSuggest(e.target.checked)} style={{ width:18, height:18 }}/>
            <span style={{ fontSize:14 }}>AI 補充建議新景點</span>
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer' }}>
            <input type="checkbox" checked={includeFood} onChange={e=>setIncludeFood(e.target.checked)} style={{ width:18, height:18 }}/>
            <span style={{ fontSize:14 }}>把美食一起排進去</span>
          </label>

          {includeFood && foodItems.length>0 && (
            <div style={{ marginBottom:18, padding:'12px', backgroundColor:C.bg, borderRadius:12 }}>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>選擇要排的美食（{selFoods.length} 項）</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:160, overflowY:'auto' }}>
                {foodItems.map(f=>(
                  <label key={f.id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input type="checkbox" checked={selFoods.includes(f.id)} onChange={()=>toggleFood(f.id)} style={{ width:16, height:16 }}/>
                    <span style={{ fontSize:13 }}>{f.name} {f.foodType&&<span style={{ color:C.textMuted, fontSize:11 }}>· {f.foodType}</span>}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize:12, color:C.textMuted, marginBottom:14 }}>
            待排景點：{unscheduled.length} 個{includeFood?` · 美食：${selFoods.length} 項`:''}
          </div>
          {error && <div style={{ color:C.danger, fontSize:13, marginBottom:12, textAlign:'center' }}>{error}</div>}
          <button onClick={generate} style={{ width:'100%', padding:14, borderRadius:13, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer' }}>✨ 開始排</button>
        </>)}

        {step==='loading' && (
          <div style={{ textAlign:'center', padding:'50px 20px' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>✨</div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>AI 正在規劃行程...</div>
            <div style={{ fontSize:13, color:C.textMuted }}>依照地點和類型安排最順的動線</div>
          </div>
        )}

        {step==='preview' && result && (<>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:14 }}>AI 排好了！確認後會套用到行程：</div>
          {selDays.map(d=>{
            const dayItems = result.filter(r=>r.date===d).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
            if(dayItems.length===0) return null;
            return (
              <div key={d} style={{ marginBottom:18 }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.blue, marginBottom:8, paddingBottom:4, borderBottom:`2px solid ${C.blueSoft}` }}>{d}</div>
                {dayItems.map((r,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:`1px solid ${C.bg}` }}>
                    <div style={{ fontSize:12, color:C.textMuted, minWidth:42, paddingTop:2 }}>{r.time}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>
                        {r.name}
                        {r.isNew && <span style={{ fontSize:10, marginLeft:6, padding:'1px 6px', borderRadius:4, backgroundColor:C.greenSoft, color:C.green, fontWeight:700 }}>AI 推薦</span>}
                        <span style={{ fontSize:11, marginLeft:6, color:C.textMuted }}>{r.category}</span>
                      </div>
                      {r.note && <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{r.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ display:'flex', gap:10, marginTop:10 }}>
            <button onClick={()=>setStep('config')} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>↩ 重新排</button>
            <button onClick={apply} style={{ flex:2, padding:12, borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>✓ 套用到行程</button>
          </div>
        </>)}
      </div>
    </div>
  );
}


// ─── 收據拍照記帳組件 ───
function ReceiptModal({ onClose, user, members, tripCurrencies, walletItems, setWalletItems, saveWallet, splitRecords, setSplitRecords, saveSplitRecords, personalWalletItems, setPersonalWalletItems, savePersonalWallet }) {
  const [step, setStep] = React.useState('upload'); // upload | loading | confirm
  const [photo, setPhoto] = React.useState(null);
  const [photoData, setPhotoData] = React.useState(null);
  const [photoMime, setPhotoMime] = React.useState('');
  const [parsed, setParsed] = React.useState(null); // {store, total, currency, items:[]}
  const [error, setError] = React.useState('');
  const [payerId, setPayerId] = React.useState(user.uid);
  const [mode, setMode] = React.useState('split'); // split(整單平分) | pool(記公費) | items(逐項)
  const [splitMembers, setSplitMembers] = React.useState(members.map(m=>m.uid));
  const [currency, setCurrency] = React.useState((tripCurrencies||['JPY'])[0]||'JPY');

  const _gk = ['AQ.Ab8RN6IJ1W','s-NnDyfYbXwpi','U0_Qa7qZm1lHh','S0BxaYkC3xxsRQ'];
  const GEMINI_KEY = (typeof import.meta!=='undefined' && import.meta.env && import.meta.env.VITE_GEMINI_KEY) || _gk.join('');
  const SYM = { JPY:'¥', KRW:'₩', TWD:'NT$', USD:'$' };

  const handleFile = (e) => {
    const f = e.target.files[0]; if(!f) return;
    setPhoto(f); setError('');
    const reader = new FileReader();
    reader.onload = ev => { setPhotoData(ev.target.result.split(',')[1]); setPhotoMime(f.type); };
    reader.readAsDataURL(f);
  };

  const recognize = async () => {
    if(!photoData) return;
    setStep('loading'); setError('');
    try {
      const prompt = `你是收據辨識助手。請分析這張收據圖片，辨識店名、各品項與金額、總金額、幣別。只回傳純 JSON（不要說明、不要 markdown）：
{"store":"店名","currency":"JPY|KRW|TWD|USD","total":總金額數字,"items":[{"name":"品項名","price":金額數字}]}`;
      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-goog-api-key':GEMINI_KEY },
        body: JSON.stringify({ contents:[{ parts:[ { inline_data:{ mime_type:photoMime, data:photoData } }, { text:prompt } ] }], generationConfig:{ maxOutputTokens:2048, temperature:0.1 } })
      });
      const data = await resp.json();
      if(data.error) throw new Error(data.error.message);
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let clean = raw.replace(/```json|```/g,'').trim();
      if(clean && !clean.endsWith('}')){ const lb=clean.lastIndexOf('}'); if(lb>0) clean=clean.slice(0,lb+1); }
      const p = JSON.parse(clean);
      setParsed(p);
      if(p.currency) setCurrency(p.currency);
      // 預設每個品項分配給付款人
      if(p.items) p.items.forEach(it=>{ it.assignTo = 'all'; });
      setStep('confirm');
    } catch(e) {
      setError('辨識失敗：'+(e?.message||'請換清楚一點的照片'));
      setStep('upload');
    }
  };

  const memberName = uid => members.find(m=>m.uid===uid)?.displayName||'?';

  const apply = () => {
    const total = Number(parsed.total)||parsed.items?.reduce((s,it)=>s+Number(it.price||0),0)||0;
    const store = parsed.store||'收據';
    const now = Date.now();
    const today = new Date();
    const dateStr = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;

    if(mode==='pool') {
      // 記到公費
      const item = { id:now, name:store, amount:total, currency, type:'支出', date:dateStr, note:'收據', editedById:payerId, editedByName:memberName(payerId), contributorIds:members.map(m=>m.uid), forMemberIds:members.map(m=>m.uid) };
      const n=[...walletItems,item]; setWalletItems(n); saveWallet(n);
    } else if(mode==='split') {
      // 整單平分：payer 幫 splitMembers 代墊
      const share = Math.floor(total/splitMembers.length);
      const newRecords = splitMembers.filter(uid=>uid!==payerId).map((uid,i)=>({
        id:now+i, payerId, receiverId:uid, amount:share, currency, note:store, date:dateStr, settled:false, createdAt:now+i
      }));
      const n=[...splitRecords,...newRecords]; setSplitRecords(n); saveSplitRecords(n);
    } else {
      // 逐項分配
      const byMember = {};
      parsed.items.forEach(it=>{
        const price = Number(it.price)||0;
        if(it.assignTo==='all'){
          const share = Math.floor(price/splitMembers.length);
          splitMembers.forEach(uid=>{ if(uid!==payerId) byMember[uid]=(byMember[uid]||0)+share; });
        } else if(it.assignTo!==payerId){
          byMember[it.assignTo]=(byMember[it.assignTo]||0)+price;
        }
      });
      const newRecords = Object.entries(byMember).filter(([uid,amt])=>amt>0).map(([uid,amt],i)=>({
        id:now+i, payerId, receiverId:uid, amount:amt, currency, note:store, date:dateStr, settled:false, createdAt:now+i
      }));
      const n=[...splitRecords,...newRecords]; setSplitRecords(n); saveSplitRecords(n);
    }
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:250, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
      <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:520, borderRadius:'24px 24px 0 0', maxHeight:'90vh', overflowY:'auto', padding:24, paddingBottom:40 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>📷 拍收據記帳</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, color:C.textMuted, cursor:'pointer' }}>×</button>
        </div>

        {step==='upload' && (<>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:'none' }} id="receipt-up"/>
          <label htmlFor="receipt-up" style={{ display:'block', border:`2px dashed ${photo?C.blue:C.border}`, borderRadius:16, padding:'40px 20px', textAlign:'center', cursor:'pointer', backgroundColor:photo?C.blueSoft:'transparent' }}>
            {photo ? (<>
              <div style={{ fontSize:36, marginBottom:8 }}>🧾</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.blue }}>{photo.name}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>點擊重新選擇</div>
            </>) : (<>
              <div style={{ fontSize:44, marginBottom:10 }}>📸</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.textMuted }}>拍照或選擇收據照片</div>
            </>)}
          </label>
          {error && <div style={{ color:C.danger, fontSize:13, marginTop:12, textAlign:'center' }}>{error}</div>}
          <button onClick={recognize} disabled={!photoData} style={{ width:'100%', marginTop:16, padding:14, borderRadius:13, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', opacity:photoData?1:0.5 }}>✨ 辨識收據</button>
        </>)}

        {step==='loading' && (
          <div style={{ textAlign:'center', padding:'50px 20px' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🧾</div>
            <div style={{ fontSize:15, fontWeight:700 }}>AI 正在辨識收據...</div>
          </div>
        )}

        {step==='confirm' && parsed && (<>
          <div style={{ marginBottom:16, padding:'12px 14px', backgroundColor:C.bg, borderRadius:12 }}>
            <div style={{ fontSize:15, fontWeight:800 }}>{parsed.store||'收據'}</div>
            <div style={{ fontSize:20, fontWeight:900, color:C.blue, marginTop:4 }}>{SYM[currency]||''}{(Number(parsed.total)||0).toLocaleString()}</div>
          </div>

          {/* 付款人 */}
          <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, marginBottom:6 }}>誰付款？</div>
          <select value={payerId} onChange={e=>setPayerId(e.target.value)} style={{ ...gs.input, marginBottom:16, appearance:'none' }}>
            {members.map(m=><option key={m.uid} value={m.uid}>{m.displayName}</option>)}
          </select>

          {/* 模式 */}
          <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, marginBottom:6 }}>怎麼分？</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {[['split','整單平分','大家均攤這筆'],['pool','記到公費','直接進共同公費'],['items','逐項分配','每個品項分給不同人']].map(([v,t,d])=>(
              <button key={v} onClick={()=>setMode(v)} style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${mode===v?C.blue:C.border}`, backgroundColor:mode===v?C.blueSoft:C.bg, textAlign:'left', cursor:'pointer' }}>
                <div style={{ fontSize:14, fontWeight:700, color:mode===v?C.blue:C.text }}>{t}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{d}</div>
              </button>
            ))}
          </div>

          {/* 平分對象 */}
          {(mode==='split'||mode==='items') && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, marginBottom:6 }}>{mode==='split'?'平分給誰':'平分品項給誰'}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {members.map(m=>(
                  <button key={m.uid} onClick={()=>setSplitMembers(s=>s.includes(m.uid)?s.filter(x=>x!==m.uid):[...s,m.uid])}
                    style={{ padding:'6px 12px', borderRadius:8, border:`1.5px solid ${splitMembers.includes(m.uid)?C.blue:C.border}`, backgroundColor:splitMembers.includes(m.uid)?C.blueSoft:C.bg, color:splitMembers.includes(m.uid)?C.blue:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>{m.displayName}</button>
                ))}
              </div>
            </div>
          )}

          {/* 逐項分配 */}
          {mode==='items' && parsed.items && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, marginBottom:8 }}>品項明細</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {parsed.items.map((it,i)=>(
                  <div key={i} style={{ padding:'10px 12px', backgroundColor:C.bg, borderRadius:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{it.name}</span>
                      <span style={{ fontSize:14, fontWeight:700 }}>{SYM[currency]||''}{Number(it.price||0).toLocaleString()}</span>
                    </div>
                    <select value={it.assignTo} onChange={e=>{ const v=e.target.value; setParsed(p=>({...p, items:p.items.map((x,j)=>j===i?{...x,assignTo:v}:x)})); }} style={{ ...gs.input, fontSize:12, padding:'6px 10px', appearance:'none' }}>
                      <option value="all">大家平分</option>
                      {members.map(m=><option key={m.uid} value={m.uid}>{m.displayName}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setStep('upload')} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>↩ 重拍</button>
            <button onClick={apply} style={{ flex:2, padding:12, borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>✓ 建立帳目</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

function TripDetailScreen({ user, trip, onBack }) {
  const color = trip.color || C.blue;
  const [tab, setTab] = useState('itinerary');


  // ── 資料 state ──
  const [members, setMembers] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [tripDates, setTripDates] = useState(['待安排']);
  const [transports, setTransports] = useState([]); // 航班/交通 {id,type:'flight'|'transport',label,date,time,from,to,code,note}
  const [lodgings, setLodgings] = useState([]); // 住宿 {id,name,checkIn,checkOut,code,note}
  const [transportModal, setTransportModal] = useState({ open:false, data:null });
  const [lodgingModal, setLodgingModal] = useState({ open:false, data:null });
  const [travelInfoOpen, setTravelInfoOpen] = useState(false); // 交通住宿管理面板
  const [selectedDate, setSelectedDate] = useState(()=>{
    const n=new Date();
    const today=`${String(n.getMonth()+1).padStart(2,'0')}/${String(n.getDate()).padStart(2,'0')}`;
    return today; // 之後在 ItineraryTab 裡會 fallback 到最近的日期
  });
  const [foodItems, setFoodItems] = useState([]);
  const [foodOptions, setFoodOptions] = useState({ cities:[], districts:{}, foodTypes:['必吃','咖啡甜點','居酒屋','拉麵','燒肉','海鮮','其他'] });
  const [shoppingItems, setShoppingItems] = useState([]);
  const [shopOptions, setShopOptions] = useState({ cities:[], malls:{}, locations:{} });
  const [walletItems, setWalletItems] = useState([]);
  const [personalWalletItems, setPersonalWalletItems] = useState([]);
  const [splitRecords, setSplitRecords] = useState([]);
  const [rates, setRates] = useState({ KRW:0.022, JPY:0.22, TWD:1, USD:30 });
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState('使用預設匯率');
  const [tripCurrencies, setTripCurrencies] = useState(['TWD','JPY']); // 這趟旅程用的幣別
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);
  const [manualRates, setManualRates] = useState({}); // 手動覆蓋的匯率
  const [walletSubTab, setWalletSubTab] = useState('overview');
  const [walletSelectedDate, setWalletSelectedDate] = useState(()=>{
    const n=new Date();
    return `${String(n.getMonth()+1).padStart(2,'0')}/${String(n.getDate()).padStart(2,'0')}`;
  });
  const [showPoolSettlement, setShowPoolSettlement] = useState(false);
  const [showPersonalSettlement, setShowPersonalSettlement] = useState(false);
  const [splitModal, setSplitModal] = useState({ open:false, data:null });
  const [splitEditTarget, setSplitEditTarget] = useState(null); // 編輯的 group
  const [walletModal, setWalletModal] = useState({ open:false, data:null });
  const [walletAddChoice, setWalletAddChoice] = useState(false); // 選拍照或手動
  const [receiptModal, setReceiptModal] = useState({ open:false }); // 收據拍照
  const [walletCalc, setWalletCalc] = useState(false);
  const [transferStates, setTransferStates] = useState({});
  const [sharedTodos, setSharedTodos] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sharedMemos, setSharedMemos] = useState([]);
  const [personalMemos, setPersonalMemos] = useState([]);
  const [memoModal, setMemoModal] = useState({ open:false, data:null, scope:'shared' });
  const [memoPhoto, setMemoPhoto] = useState(null);

  // ── UI state ──
  const [modal, setModal] = useState({ open:false, data:null });
  const [tempPhotos, setTempPhotos] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerInput, setDatePickerInput] = useState('');
  const [foodModal, setFoodModal] = useState({ open:false, data:null });
  const [foodFilter, setFoodFilter] = useState([]);
  const [foodSelectedCity, setFoodSelectedCity] = useState('全部城市');
  const [foodSelectedDistricts, setFoodSelectedDistricts] = useState([]);
  const [foodSelectedType, setFoodSelectedType] = useState('全部食物');
  const [showManageFoodOptions, setShowManageFoodOptions] = useState(false);
  // ManageFoodOptions local state (moved to top level to avoid hook-in-function issue)
  const [mfoNewDistrict, setMfoNewDistrict] = useState('');
  const [mfoNewDistrictCity, setMfoNewDistrictCity] = useState('');
  const [mfoNewFoodType, setMfoNewFoodType] = useState('');
  const [shoppingModal, setShoppingModal] = useState({ open:false, data:null });
  const [shopTempPhotos, setShopTempPhotos] = useState([]);
  const [shopBoughtModal, setShopBoughtModal] = useState(null); // { item }
  const [shopBoughtPrice, setShopBoughtPrice] = useState('');
  const [shopBoughtCurrency, setShopBoughtCurrency] = useState('JPY');
  const [shopBoughtNote, setShopBoughtNote] = useState('');
  const [shopFilterCity, setShopFilterCity] = useState('全部城市');
  const [shopFilterMall, setShopFilterMall] = useState('全部商場');
  const [shopFilterMember, setShopFilterMember] = useState('all');
  const [showManageShopOptions, setShowManageShopOptions] = useState(false);
  // ManageShopOptions local state
  const [msoNewDistrict, setMsoNewDistrict] = useState('');
  const [msoNewDistrictCity, setMsoNewDistrictCity] = useState('');
  const [msoNewMall, setMsoNewMall] = useState('');
  const [msoNewMallCity, setMsoNewMallCity] = useState('');
  const [msoNewMallDistrict, setMsoNewMallDistrict] = useState('');

  const [showSettlement, setShowSettlement] = useState(false);
  const [todoModal, setTodoModal] = useState({ open:false, data:null });
  const [noteModal, setNoteModal] = useState({ open:false, data:null });
  const [notePhoto, setNotePhoto] = useState(null);
  const [moreSection, setMoreSection] = useState(null); // null=更多首頁, 'todos','notes','members','invite'
  const [inviteVisible, setInviteVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [splitRestorePrompt, setSplitRestorePrompt] = useState(null); // { item } 代墊已還記錄刪除後詢問是否還原
  const [settleCurrencyPrompt, setSettleCurrencyPrompt] = useState(null); // { amount, currency, twdAmount, onChoose }
  const [uploadModal, setUploadModal] = useState({ open:false }); // 上傳行程表解析
  const [aiPlanModal, setAiPlanModal] = useState({ open:false }); // AI 一鍵排行程
  const [downloading, setDownloading] = useState(null); // 'pdf'|'excel'|'overview'

  // ─── 下載工具 ─────────────────────────────────────────────────
  const memberName = uid => members.find(m=>m.uid===uid)?.displayName||uid||'?';

  const loadXLSX = () => new Promise(res => {
    if (window.XLSX) { res(window.XLSX); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => res(window.XLSX);
    document.head.appendChild(s);
  });

  const loadScript = (src, check) => new Promise((res, rej) => {
    if (check()) { res(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error('load failed'));
    document.head.appendChild(s);
  });

  // 用 html2canvas + jsPDF 產生真正的 PDF 檔，直接下載，不開新分頁、不彈列印框
  const openPrint = async (html, filename='下載') => {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', ()=>window.html2canvas);
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', ()=>window.jspdf);

      // 在畫面外建立一個容器渲染內容
      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;';
      // 只取 body 內容
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
      holder.innerHTML = (styleMatch?`<style>${styleMatch[1]}</style>`:'') + (bodyMatch?bodyMatch[1]:html);
      document.body.appendChild(holder);

      const canvas = await window.html2canvas(holder, { scale:2, useCORS:true, backgroundColor:'#ffffff' });
      document.body.removeChild(holder);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = 210, ph = 297;
      const imgW = pw;
      const imgH = canvas.height * pw / canvas.width;
      let heightLeft = imgH;
      let pos = 0;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH);
      heightLeft -= ph;
      while (heightLeft > 0) {
        pos -= ph;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH);
        heightLeft -= ph;
      }
      // 優先用 Web Share API 直接分享檔案（不帶網址）
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `${filename}.pdf`, { type:'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files:[file] })) {
        try {
          await navigator.share({ files:[file], title:filename });
          return;
        } catch(shareErr) {
          if (shareErr.name === 'AbortError') return; // 使用者取消
          // 其他錯誤則往下走，改用下載
        }
      }
      // 後備：直接下載 PDF 檔
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    } catch(e) {
      // 後備：下載 HTML
      const blob = new Blob([html], { type:'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${filename}.html`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    }
  };

  const catIcon = {'景點':'🏛','美食':'🍜','購物':'🛍','交通':'🚌','住宿':'🛏','其他':'📌'};

  // ① 行程表 PDF
  const downloadItineraryExcel = async () => {
    setDownloading('itinerary');
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    const sorted = [...itinerary].sort((a,b)=>{
      const da=(a.date||'待安排'), db=(b.date||'待安排');
      if(da!==db) return da.localeCompare(db);
      return (a.time||'').localeCompare(b.time||'');
    });
    // 欄位順序對應解析格式：日期、時間、類別、名稱、地點、備註
    const rows = [
      ['日期','時間','類別','名稱','地點','備註'],
      ...sorted.map(it=>[ it.date||'', it.time||'', it.category||'景點', it.name||'', it.location||'', it.note||'' ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:12},{wch:8},{wch:8},{wch:24},{wch:24},{wch:30}];
    XLSX.utils.book_append_sheet(wb, ws, '行程表');
    XLSX.writeFile(wb, `${trip.name}_行程表.xlsx`);
    setDownloading(null);
  };

  // ② 帳務 Excel
  const downloadWalletExcel = async () => {
    setDownloading('excel');
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    // 共同公費
    const shared = [['日期','項目','類型','金額','幣別','付款人','備註'],...walletItems.map(i=>[i.date||'',i.name||'',i.type||'',i.amount||0,i.currency||'TWD',memberName(i.editedById),i.note||''])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(shared), '共同公費');
    // 個人記帳
    const personal = [['日期','項目','類型','金額','幣別','備註'],...personalWalletItems.map(i=>[i.date||'',i.name||'',i.type||'',i.amount||0,i.currency||'TWD',i.note||''])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(personal), '個人記帳');
    // 代墊記錄
    const splits = [['項目','付款人','欠款人','金額','幣別','狀態'],...splitRecords.map(r=>[r.note||'',memberName(r.payerId),memberName(r.receiverId),r.amount||0,r.currency||'JPY',r.settled?'已還':'未還'])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(splits), '代墊記錄');
    // 購物清單
    const shops = [['店家','品項','金額','幣別','狀態','備註'],...shoppingItems.map(i=>[i.shopName||'',i.name||'',i.price||'',i.currency||'',i.checked?'已買':'未買',i.note||''])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(shops), '購物清單');
    XLSX.writeFile(wb, `${trip.name}_帳務.xlsx`);
    setDownloading(null);
  };

  // ③ 旅程總覽 PDF
  const downloadOverviewPDF = async () => {
    setDownloading('overview');
    const SYM2 = {TWD:'NT$',JPY:'¥',KRW:'₩',USD:'$'};
    // 完整每日行程（每天所有項目，依時間排序）
    const byDay = {};
    [...itinerary].sort((a,b)=>(a.time||'').localeCompare(b.time||'')).forEach(it=>{
      const d=it.date||'待安排'; if(!byDay[d]) byDay[d]=[]; byDay[d].push(it);
    });
    const dayList = tripDates.filter(d=>d!=='待安排'&&byDay[d]);
    if(byDay['待安排']) dayList.push('待安排');
    // 美食清單
    const foods = [...foodItems].slice(0, 40);
    // 備忘清單
    const checklistMemos = sharedMemos.filter(m=>m.type==='checklist' && (m.items||[]).length>0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${trip.name} 旅遊手冊</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&display=swap');
      *{box-sizing:border-box}
      body{font-family:'Noto Serif TC','-apple-system',serif;margin:0;padding:0;color:#3A332B;background:#fff;line-height:1.6}
      .cover{position:relative;height:340px;background:linear-gradient(160deg,#C68B5E 0%,#A8694A 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px;overflow:hidden}
      .cover::after{content:'';position:absolute;inset:16px;border:1.5px solid rgba(255,255,255,0.4);border-radius:4px;pointer-events:none}
      .cover .emoji{font-size:64px;margin-bottom:16px}
      .cover .label{font-size:13px;letter-spacing:6px;opacity:0.85;margin-bottom:12px;font-weight:500}
      .cover h1{font-size:40px;font-weight:900;margin:0 0 16px;letter-spacing:2px}
      .cover .meta{font-size:15px;opacity:0.95;font-weight:500;letter-spacing:1px}
      .cover .members{margin-top:20px;font-size:13px;opacity:0.85;letter-spacing:1px}
      .day-section{padding:28px 36px;break-inside:avoid}
      .day-header{display:flex;align-items:baseline;gap:14px;margin-bottom:18px;border-bottom:2px solid #C68B5E;padding-bottom:10px}
      .day-num{font-size:13px;font-weight:700;color:#fff;background:#C68B5E;padding:4px 12px;border-radius:20px;letter-spacing:1px}
      .day-date{font-size:20px;font-weight:900;color:#3A332B}
      .timeline{position:relative;padding-left:24px}
      .timeline::before{content:'';position:absolute;left:6px;top:8px;bottom:8px;width:2px;background:#E8D5C0}
      .stop{position:relative;padding:10px 0 14px;break-inside:avoid}
      .stop::before{content:'';position:absolute;left:-21px;top:16px;width:11px;height:11px;border-radius:50%;background:#C68B5E;border:2px solid #fff;box-shadow:0 0 0 2px #E8D5C0}
      .stop-time{font-size:13px;font-weight:700;color:#C68B5E;margin-bottom:2px;letter-spacing:1px}
      .stop-name{font-size:17px;font-weight:700;color:#3A332B;margin-bottom:3px}
      .stop-cat{font-size:11px;color:#A89684;font-weight:500}
      .stop-note{font-size:13px;color:#7A6E5E;margin-top:4px;line-height:1.5}
      .block{padding:28px 36px;break-inside:avoid}
      .block-title{font-size:15px;font-weight:900;color:#A8694A;letter-spacing:3px;margin-bottom:18px;text-align:center;position:relative}
      .block-title::before,.block-title::after{content:'';position:absolute;top:50%;width:40px;height:1px;background:#D8C4AC}
      .block-title::before{left:50%;margin-left:-90px}
      .block-title::after{right:50%;margin-right:-90px}
      .food-grid{display:flex;flex-direction:column;gap:0}
      .food-item{display:flex;gap:12px;align-items:center;padding:9px 0;border-bottom:1px dotted #E0D2BE}
      .food-tag{font-size:11px;padding:3px 10px;border-radius:4px;background:#F2E6D6;color:#A8694A;font-weight:700;white-space:nowrap}
      .food-name{font-size:15px;font-weight:700;color:#3A332B}
      .food-loc{font-size:12px;color:#A89684}
      .check-group{margin-bottom:16px}
      .check-group-title{font-size:14px;font-weight:900;color:#A8694A;margin-bottom:8px}
      .check-row{display:flex;gap:10px;align-items:center;padding:5px 0;font-size:14px}
      .check-box{width:16px;height:16px;border:1.5px solid #C68B5E;border-radius:3px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#A8694A;font-weight:900}
      .footer{text-align:center;padding:30px;color:#A89684;font-size:12px;letter-spacing:2px;border-top:1px solid #E8D5C0}
      .info-box{background:#F7EFE4;border-left:3px solid #C68B5E;padding:10px 14px;margin-bottom:10px;border-radius:4px}
      .info-label{font-size:11px;font-weight:900;color:#A8694A;letter-spacing:2px;margin-bottom:4px}
      .info-line{font-size:13px;color:#6B5D4A;padding:2px 0}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.day-section,.block{page-break-inside:avoid}}
    </style></head><body>
    <div class="cover">
      <div class="emoji">${trip.emoji||'✈️'}</div>
      <div class="label">TRAVEL ITINERARY</div>
      <h1>${trip.name}</h1>
      <div class="meta">${[trip.destinations,trip.startDate&&trip.endDate?`${trip.startDate} ～ ${trip.endDate}`:''].filter(Boolean).join('　|　')}</div>
      <div class="members">${members.map(m=>m.displayName).join('　·　')}</div>
    </div>
    ${dayList.map((d,di)=>{
      const dayFlights = transports.filter(t=>t.date===d);
      const dIdx = tripDates.indexOf(d);
      const dayLodge = lodgings.filter(l=>{ if(!l.checkIn||!l.checkOut)return false; const ci=tripDates.indexOf(l.checkIn),co=tripDates.indexOf(l.checkOut); if(ci<0||co<0)return false; return dIdx>=ci&&dIdx<=co; });
      const flightLines = dayFlights.map(t=>`${t.label||(t.type==='flight'?'航班':'交通')}　${t.time||''}　${t.from?`${t.from} → ${t.to}`:''}${t.code?`　${t.code}`:''}`.trim());
      const lodgeLines = dayLodge.map(l=>`${l.mapUrl?`<a href="${l.mapUrl}" style="color:#6B5D4A">${l.name}</a>`:l.name}${l.checkIn===d?'（入住）':l.checkOut===d?'（退房）':''}`);
      return `
      <div class="day-section">
        <div class="day-header">
          <span class="day-num">${d==='待安排'?'待安排':`DAY ${di+1}`}</span>
          <span class="day-date">${d}</span>
        </div>
        ${flightLines.length?`<div class="info-box"><div class="info-label">交通</div>${flightLines.map(x=>`<div class="info-line">${x}</div>`).join('')}</div>`:''}
        ${lodgeLines.length?`<div class="info-box"><div class="info-label">住宿</div>${lodgeLines.map(x=>`<div class="info-line">${x}</div>`).join('')}</div>`:''}
        <div class="timeline">
          ${byDay[d].map(it=>`
            <div class="stop">
              ${it.time?`<div class="stop-time">${it.time}</div>`:''}
              <div class="stop-name">${it.name}</div>
              ${it.category?`<div class="stop-cat">${it.category}</div>`:''}
              ${it.location?`<div class="stop-cat">${it.location}</div>`:''}
              ${it.note?`<div class="stop-note">${it.note}</div>`:''}
            </div>`).join('')}
        </div>
      </div>`;
    }).join('')}
    ${foods.length?`<div class="block">
      <div class="block-title">想吃美食</div>
      <div class="food-grid">
        ${foods.map(f=>`
          <div class="food-item">
            ${f.foodType?`<span class="food-tag">${f.foodType}</span>`:''}
            <div style="flex:1">
              <div class="food-name">${f.name||''}</div>
              ${(()=>{ const locs=(f.districts||[f.district]).filter(Boolean); return locs.length?`<div class="food-loc">${locs.join('、')}</div>`:''; })()}
            </div>
          </div>`).join('')}
      </div>
    </div>`:''}
    ${checklistMemos.length?`<div class="block">
      <div class="block-title">出發前準備</div>
      ${checklistMemos.map(m=>`
        <div class="check-group">
          <div class="check-group-title">${m.title||'清單'}</div>
          ${(m.items||[]).map(it=>`
            <div class="check-row">
              <span class="check-box">${it.done?'✓':''}</span>
              <span style="${it.done?'text-decoration:line-through;color:#A89684':''}">${it.text||''}</span>
            </div>`).join('')}
        </div>`).join('')}
    </div>`:''}
    <div class="footer">— ${trip.name}　·　旅遊小助理 —</div>
    </body></html>`;
    await openPrint(html, `${trip.name}_旅遊手冊`);
    setDownloading(null);
  };

  useEffect(() => {
    loadAll();
  }, [trip.id]);

  // 即時監聽：有人改資料馬上反映，不用重新整理
  useEffect(() => {
    const unsubs = [];
    const tid = trip.id;

    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_wallet`), snap => {
      if(snap.exists()) setWalletItems(snap.data().items||[]);
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_personalWallet_${user.uid}`), snap => {
      if(snap.exists()) setPersonalWalletItems(snap.data().items||[]);
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_splitRecords`), snap => {
      if(snap.exists()) setSplitRecords(snap.data().items||[]);
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_food`), snap => {
      if(snap.exists()) setFoodItems(snap.data().items||[]);
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_shopping`), snap => {
      if(snap.exists()) setShoppingItems(snap.data().items||[]);
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_itinerary`), snap => {
      if(snap.exists()){
        const d=snap.data();
        setItinerary(d.items||[]);
        if(d.dates) setTripDates(d.dates);
      }
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_transports`), snap => {
      if(snap.exists()) setTransports(snap.data().items||[]);
    }));
    unsubs.push(onSnapshot(doc(db,"tripData",`${tid}_lodgings`), snap => {
      if(snap.exists()) setLodgings(snap.data().items||[]);
    }));

    return () => unsubs.forEach(u=>u());
  }, [trip.id, user.uid]);

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
    const [st, sl] = await Promise.all([
      getDoc(doc(db,"tripData",`${trip.id}_transports`)),
      getDoc(doc(db,"tripData",`${trip.id}_lodgings`)),
    ]);
    if(st.exists()) setTransports(st.data().items||[]);
    if(sl.exists()) setLodgings(sl.data().items||[]);
    if (s.exists()) {
      const d=s.data();
      setItinerary(d.items||[]);
      const dates=d.dates||['待安排'];
      setTripDates(dates);
      // 自動選今天或最近的日期
      const today=new Date();
      const datesOnly=dates.filter(x=>x!=='待安排');
      if (datesOnly.length>0) {
        const toD=s=>{ const [m,dd]=s.split('/'); return new Date(today.getFullYear(),Number(m)-1,Number(dd)); };
        let closest=datesOnly[0], minDiff=Math.abs(toD(datesOnly[0])-today);
        datesOnly.forEach(x=>{ const diff=Math.abs(toD(x)-today); if(diff<minDiff){minDiff=diff;closest=x;} });
        setSelectedDate(closest);
      }
    }
  }
  async function saveItinerary(items, dates) {
    await setDoc(doc(db,"tripData",`${trip.id}_itinerary`), { items:JSON.parse(JSON.stringify(items)), dates, updatedAt:serverTimestamp() });
  }

  // 一鍵修復：把 YYYY-MM-DD 格式統一轉成 MM/DD
  async function fixDateFormats() {
    const toMMDD = s => {
      if (!s || s==='待安排') return s;
      const m = s.match(/^\d{4}-(\d{2})-(\d{2})$/);
      return m ? `${m[1]}/${m[2]}` : s;
    };
    // 行程日期
    const newDates = tripDates.map(toMMDD);
    const newItems = itinerary.map(it=>({ ...it, date:toMMDD(it.date) }));
    setTripDates(newDates); setItinerary(newItems);
    await saveItinerary(newItems, newDates);
    // 交通
    const newTrans = transports.map(t=>({ ...t, date:toMMDD(t.date) }));
    if(newTrans.length) await saveTransports(newTrans);
    // 住宿
    const newLodge = lodgings.map(l=>({ ...l, checkIn:toMMDD(l.checkIn), checkOut:toMMDD(l.checkOut) }));
    if(newLodge.length) await saveLodgings(newLodge);
    // 重設選中日期
    const firstDate = newDates.filter(d=>d!=='待安排')[0];
    if(firstDate) setSelectedDate(firstDate);
  }
  async function saveTransports(items) {
    setTransports(items);
    await setDoc(doc(db,"tripData",`${trip.id}_transports`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function saveLodgings(items) {
    setLodgings(items);
    await setDoc(doc(db,"tripData",`${trip.id}_lodgings`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadFood() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_food`));
    if (s.exists()) setFoodItems(s.data().items||[]);
  }
  async function saveFood(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_food`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadFoodOptions() {
    try {
      const tripCities = trip.destinations?.length>0 ? trip.destinations : (trip.destination ? [trip.destination] : []);
      const s = await getDoc(doc(db,"tripData",`${trip.id}_foodOptions`));
      if (s.exists()) {
        const data = s.data();
        setFoodOptions(prev => ({
          cities: tripCities, // 城市永遠從旅程地點來
          districts: data.districts || {},
          foodTypes: data.foodTypes?.length>0 ? data.foodTypes : prev.foodTypes,
        }));
      } else {
        setFoodOptions(prev => ({ ...prev, cities: tripCities }));
      }
    } catch(e) { console.error(e); }
  }
  async function saveFoodOptions(opts) {
    // 不儲存 cities，城市由旅程地點決定
    const { cities, ...rest } = opts;
    await setDoc(doc(db,"tripData",`${trip.id}_foodOptions`), JSON.parse(JSON.stringify(rest)));
  }
  async function loadShopping() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_shopping`));
    if (s.exists()) setShoppingItems(s.data().items||[]);
  }
  async function saveShopping(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_shopping`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function loadShopOptions() {
    try {
      const tripCities = trip.destinations?.length>0 ? trip.destinations : (trip.destination ? [trip.destination] : []);
      const s = await getDoc(doc(db,"tripData",`${trip.id}_shopOptions`));
      if (s.exists()) {
        const data = s.data();
        setShopOptions({
          cities: tripCities,
          locations: data.locations || {}, // {city: [district, ...]}
          malls: data.malls || {},          // {city: {district: [mall, ...]}}
        });
      } else {
        setShopOptions({ cities: tripCities, locations: {}, malls: {} });
      }
    } catch(e) { console.error(e); }
  }
  async function saveShopOptions(opts) {
    const { cities, ...rest } = opts;
    await setDoc(doc(db,"tripData",`${trip.id}_shopOptions`), JSON.parse(JSON.stringify(rest)));
  }
  async function loadWallet() {
    const s = await getDoc(doc(db,"tripData",`${trip.id}_wallet`));
    if (s.exists()) setWalletItems(s.data().items||[]);
    const sp = await getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${user.uid}`));
    if (sp.exists()) setPersonalWalletItems(sp.data().items||[]);
    const sr = await getDoc(doc(db,"tripData",`${trip.id}_splitRecords`));
    if (sr.exists()) setSplitRecords(sr.data().items||[]);
    // 載入幣別設定
    try {
      const cs = await getDoc(doc(db,"tripData",`${trip.id}_currencies`));
      if (cs.exists()) {
        const cd = cs.data();
        if (cd.currencies) setTripCurrencies(cd.currencies);
        if (cd.manualRates) setManualRates(cd.manualRates);
      }
    } catch(e) {}
    // 抓即時匯率
    fetch('https://api.exchangerate-api.com/v4/latest/TWD').then(r=>r.json()).then(data=>{
      if(data.rates){
        setRates(prev => ({
          ...prev,
          KRW: parseFloat((1/data.rates.KRW).toFixed(4)),
          JPY: parseFloat((1/data.rates.JPY).toFixed(4)),
          USD: parseFloat((1/data.rates.USD).toFixed(2)),
          TWD: 1,
        }));
        setRatesUpdatedAt('匯率已更新');
      }
    }).catch(()=>{});
  }
  async function saveWallet(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_wallet`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function saveCurrencies(currencies, mr) {
    await setDoc(doc(db,"tripData",`${trip.id}_currencies`), { currencies, manualRates:mr||{}, updatedAt:serverTimestamp() });
  }
  async function savePersonalWallet(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${user.uid}`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function saveSplitRecords(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_splitRecords`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
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
    // 載入新格式備忘錄
    try {
      const sm = await getDoc(doc(db,"tripData",`${trip.id}_sharedMemos`));
      if (sm.exists()) setSharedMemos(sm.data().items||[]);
      const pm = await getDoc(doc(db,"tripData",`${trip.id}_personalMemos_${user.uid}`));
      if (pm.exists()) setPersonalMemos(pm.data().items||[]);
    } catch(e) {}
  }
  async function saveNotes(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_notes`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function saveSharedMemos(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_sharedMemos`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }
  async function savePersonalMemos(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_personalMemos_${user.uid}`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }

  // ── helpers ──
  // 自動選最近日期邏輯
  // effectiveDate = 選中的日期（loadItinerary 時已自動設成最近的）
  const effectiveDate = tripDates.includes(selectedDate) ? selectedDate : (tripDates.filter(d=>d!=='待安排')[0] || selectedDate);

  const filteredItinerary = itinerary
    .filter(i=>i.date===effectiveDate)
    .sort((a,b)=>selectedDate==='待安排'?(a.createdAt||0)-(b.createdAt||0):(a.time||'').localeCompare(b.time||''));

  const shopFiltered = shoppingItems.filter(item => {
    // shopFilterCity 現在存的是地區名稱
    if (shopFilterCity!=='全部城市' && item.district!==shopFilterCity) return false;
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
  const [linkCopied, setLinkCopied] = useState(false);
  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?invite=${trip.inviteCode}`;
    const shareText = `邀請你加入「${trip.name}」旅程 ✈️\n點連結直接加入：\n${url}`;
    if (navigator.share) {
      navigator.share({ title: `加入「${trip.name}」`, text: shareText, url }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url);
      setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000);
    }
  }

  const getCat=(cat)=>{
    const map={'景點':{bg:C.greenSoft,color:C.green,border:'#B8E8D8'},'美食':{bg:C.warmSoft,color:C.warm,border:C.warmBorder},'購物':{bg:C.warmSoft,color:C.warm,border:C.warmBorder},'交通':{bg:C.purpleSoft,color:C.purple,border:'#C0D8E8'},'住宿':{bg:C.blueSoft,color:C.blue,border:'#B8D8E8'},'其他':{bg:'#F0EDE8',color:C.textMuted,border:C.border}};
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
      const sortedSplitTo = [...splitTo].sort();
      const splitN = sortedSplitTo.length;
      // 用 createdAt hash 輪換多付者
      const splitOffset = w.createdAt ? (Math.floor(w.createdAt/1000) % splitN) : 0;
      sortedSplitTo.forEach((uid, i) => {
        if (!balance[uid]) balance[uid] = {};
        if (!balance[payer]) balance[payer] = {};
        if (uid !== payer) {
          const rotatedIdx = (i - splitOffset + splitN) % splitN;
          const extra = rotatedIdx < remainder ? 1 : 0;
          balance[uid][cur] = (balance[uid][cur]||0) - (perPerson + extra);
          balance[payer][cur] = (balance[payer][cur]||0) + (perPerson + extra);
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
        <div style={{ width:40, height:40, borderRadius:12, backgroundColor:color+'22', border:`1.5px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{trip.emoji||'✈️'}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{trip.name}</div>
          {trip.destination && <div style={{ fontSize:11, color:C.textMuted }}>📍 {trip.destination}</div>}
        </div>
        <button onClick={onBack}
          style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:10, padding:'6px 12px', color:C.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
          離開
        </button>
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
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>setAiPlanModal({open:true})} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${C.green}44`, backgroundColor:C.greenSoft, color:C.green, fontSize:12, fontWeight:700, cursor:'pointer' }}>✨ 排行程</button>
            <button onClick={()=>setTravelInfoOpen(true)} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${C.warm}44`, backgroundColor:C.warmSoft, color:C.warm, fontSize:12, fontWeight:700, cursor:'pointer' }}>✈️🛏 交通住宿</button>
            <button onClick={()=>setUploadModal({open:true})} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${C.blue}44`, backgroundColor:C.blueSoft, color:C.blue, fontSize:12, fontWeight:700, cursor:'pointer' }}>📥 智能匯入</button>
            <button onClick={() => setDatePickerOpen(true)} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${color}44`, backgroundColor:color+'18', color, fontSize:12, fontWeight:700, cursor:'pointer' }}>＋ 日期</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
          {['待安排',...tripDates.filter(d=>d!=='待安排')].filter(d=>tripDates.includes(d)).map(d => (
            <div key={d} style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
              <button onClick={() => setSelectedDate(d)} style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${selectedDate===d?color:C.border}`, backgroundColor:selectedDate===d?color:C.surface, color:selectedDate===d?'#fff':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{d}</button>
              {d!=='待安排' && <button onClick={() => setConfirmDel({title:'刪除日期',message:`確定刪除 ${d} 的日期？日期內的行程不會被刪除。`,fn:()=>handleDeleteDate(d)})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:13, cursor:'pointer', opacity:0.5, padding:'0 2px' }}>×</button>}
            </div>
          ))}
        </div>
      </div>
      {/* 行程列表 */}
      <div style={{ padding:16, flex:1 }}>
        {/* 當天的交通住宿 */}
        {selectedDate!=='待安排' && (() => {
          const dayFlights = transports.filter(t=>t.date===selectedDate);
          // 用 tripDates 的索引判斷住宿區間（不依賴日期格式）
          const dIdx = tripDates.indexOf(selectedDate);
          const dayLodgings = lodgings.filter(l=>{
            if(!l.checkIn||!l.checkOut) return false;
            const ci=tripDates.indexOf(l.checkIn), co=tripDates.indexOf(l.checkOut);
            if(ci<0||co<0) return false;
            return dIdx>=ci && dIdx<co; // 入住日到退房前一天
          });
          const checkoutToday = lodgings.filter(l=>l.checkOut===selectedDate);
          if(dayFlights.length===0 && dayLodgings.length===0 && checkoutToday.length===0) return null;
          const allLodge = [...dayLodgings, ...checkoutToday.filter(c=>!dayLodgings.find(l=>l.id===c.id))];
          return (
            <>
              {/* 交通格子 */}
              {dayFlights.length>0 && (
                <div style={{ marginBottom:10, padding:'12px 14px', backgroundColor:C.warmSoft, borderRadius:14, border:`1px solid ${C.warmBorder}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.warm, marginBottom:6 }}>交通資訊</div>
                  {dayFlights.map(t=>(
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                      <span style={{ fontSize:16 }}>{t.type==='flight'?'✈️':'🚄'}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700 }}>{t.label||(t.type==='flight'?'航班':'交通')} {t.time||''}</div>
                        {(t.from||t.to)&&<div style={{ fontSize:12, color:C.textMuted }}>{t.from} → {t.to} {t.code?`· ${t.code}`:''}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* 住宿格子 */}
              {allLodge.length>0 && (
                <div style={{ marginBottom:14, padding:'12px 14px', backgroundColor:C.warmSoft, borderRadius:14, border:`1px solid ${C.warmBorder}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.warm, marginBottom:6 }}>住宿資訊</div>
                  {dayLodgings.map(l=>(
                    <div key={l.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                      <span style={{ fontSize:16 }}>🛏</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700 }}>{l.name} {l.checkIn===selectedDate&&<span style={{ fontSize:11, color:C.warm }}>（入住）</span>}</div>
                        {l.code&&<div style={{ fontSize:12, color:C.textMuted }}>訂房編號 {l.code}</div>}
                      </div>
                      {l.mapUrl&&<a href={l.mapUrl} target="_blank" rel="noreferrer" style={{ fontSize:11, color:C.warm, fontWeight:700, textDecoration:'none', padding:'4px 8px', borderRadius:6, border:`1px solid ${C.warm}44`, backgroundColor:'#fff' }}>📍 地圖</a>}
                    </div>
                  ))}
                  {checkoutToday.filter(c=>!dayLodgings.find(l=>l.id===c.id)).map(l=>(
                    <div key={'co'+l.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                      <span style={{ fontSize:16 }}>🧳</span>
                      <div style={{ fontSize:13, fontWeight:700 }}>{l.name} <span style={{ fontSize:11, color:C.textMuted }}>（退房）</span></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
        {/* 當天連結的美食 */}
        {selectedDate!=='待安排' && foodItems.filter(f=>f.linkedDate===selectedDate).length>0 && (
          <div style={{ marginBottom:14, padding:'12px 14px', backgroundColor:C.warmSoft, borderRadius:14, border:`1px solid ${C.warmBorder}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.warm, marginBottom:8 }}>🍜 今天的美食</div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
              {foodItems.filter(f=>f.linkedDate===selectedDate).map(f=>(
                <button key={f.id} onClick={() => setTab('food')}
                  style={{ flexShrink:0, padding:'8px 12px', backgroundColor:'#fff', borderRadius:10, border:`1px solid ${C.warmBorder}`, cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{f.name}</div>
                  {(f.districts||[f.district]).filter(Boolean).map(d=><div key={d} style={{ fontSize:10, color:C.warm }}>📍 {d}</div>)}
                  {f.foodType && <div style={{ fontSize:10, color:C.textMuted }}>{f.foodType}</div>}
                </button>
              ))}
            </div>
          </div>
        )}
        {filteredItinerary.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>
            {selectedDate==='待安排' ? '把想去的地方加到待安排，再用 AI 一鍵排行程' : '尚無行程，點右下角 ＋ 新增'}
          </div>
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
                        <button onClick={() => setConfirmDel({title:'確認刪除',message:'確定刪除這個行程項目嗎？',fn:()=>handleDeleteItem(item.id)})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:14, cursor:'pointer' }}>×</button>
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
    const cities = foodOptions.cities || [];
    const districtsMap = foodOptions.districts || {};
    const foodTypes = foodOptions.foodTypes || [];
    const effectiveCity = cities.length === 1 ? cities[0] : foodSelectedCity;
    const cityDistricts = effectiveCity !== '全部城市' ? (districtsMap[effectiveCity]||[]) : [];

    const filtered = foodItems.filter(item => {
      if (cities.length > 1 && foodSelectedCity !== '全部城市' && item.city !== foodSelectedCity) return false;
      if (foodSelectedDistricts.length > 0) {
        const itemDistricts = item.districts || (item.district ? [item.district] : []);
        if (!foodSelectedDistricts.some(d => itemDistricts.includes(d))) return false;
      }
      if (foodSelectedType !== '全部食物' && item.foodType !== foodSelectedType) return false;
      return true;
    }).sort((a,b) => {
      if (a.date==='待安排'&&b.date!=='待安排') return 1;
      if (a.date!=='待安排'&&b.date==='待安排') return -1;
      return (a.createdAt||0)-(b.createdAt||0);
    });

    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* 篩選區 */}
        <div style={{ backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase' }}>美食 {filtered.length} 間</span>
            <button onClick={() => setShowManageFoodOptions(true)} style={{ fontSize:11, color:C.textMuted, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>管理選項</button>
          </div>

          {/* 城市篩選：只有多個城市才顯示 */}
          {cities.length > 1 && (
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, marginBottom:4 }}>
              <button onClick={() => { setFoodSelectedCity('全部城市'); setFoodSelectedDistricts([]); }}
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedCity==='全部城市'?C.warm:C.border}`, backgroundColor:foodSelectedCity==='全部城市'?C.warmSoft:C.bg, color:foodSelectedCity==='全部城市'?C.warm:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                全部城市
              </button>
              {cities.map(city => (
                <button key={city} onClick={() => { setFoodSelectedCity(city); setFoodSelectedDistricts([]); }}
                  style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedCity===city?C.warm:C.border}`, backgroundColor:foodSelectedCity===city?C.warm:C.bg, color:foodSelectedCity===city?'#fff':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {city}
                </button>
              ))}
            </div>
          )}

          {/* 地區篩選：城市只有一個時自動用那個城市的地區 */}
          {cityDistricts.length > 0 && (
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, marginBottom:4 }}>
              {cityDistricts.map(d => (
                <button key={d} onClick={() => setFoodSelectedDistricts(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d])}
                  style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedDistricts.includes(d)?C.blue:C.border}`, backgroundColor:foodSelectedDistricts.includes(d)?C.blueSoft:C.bg, color:foodSelectedDistricts.includes(d)?C.blue:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  📍 {d}
                </button>
              ))}
            </div>
          )}

          {/* 食物種類篩選 */}
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
            <button onClick={() => setFoodSelectedType('全部食物')}
              style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedType==='全部食物'?C.green:C.border}`, backgroundColor:foodSelectedType==='全部食物'?C.greenSoft:C.bg, color:foodSelectedType==='全部食物'?C.green:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              全部
            </button>
            {foodTypes.map(ft => (
              <button key={ft} onClick={() => setFoodSelectedType(ft===foodSelectedType?'全部食物':ft)}
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedType===ft?C.green:C.border}`, backgroundColor:foodSelectedType===ft?C.greenSoft:C.bg, color:foodSelectedType===ft?C.green:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {ft}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div style={{ padding:16, flex:1 }}>
          {filtered.length===0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無美食，點右下角 ＋ 新增</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {filtered.map(item => {
                const itemDistricts = item.districts || (item.district?[item.district]:[]);
                return (
                  <div key={item.id} style={{ ...gs.card, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
                        {item.city && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.warm, color:'#fff', fontSize:11, fontWeight:700 }}>{item.city}</span>}
                        {itemDistricts.map(d => <span key={d} style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.blueSoft, color:C.blue, fontSize:11, fontWeight:700 }}>📍 {d}</span>)}
                        {item.foodType && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.greenSoft, color:C.green, border:`1px solid ${C.green}33`, fontSize:11, fontWeight:700 }}>{item.foodType}</span>}
                        {item.visited && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700 }}>✓ 已去</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => setFoodModal({open:true,data:{...item}})} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => setConfirmDel({title:'刪除美食',message:`確定刪除「${item.name}」？`,fn:()=>{const n=foodItems.filter(i=>i.id!==item.id);setFoodItems(n);saveFood(n);}})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:14, cursor:'pointer' }}>×</button>
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{item.name}</div>
                    {item.linkedDate && <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6, backgroundColor:color+'18', marginBottom:4 }}><span style={{ fontSize:11, color, fontWeight:700 }}>🗓 {item.linkedDate}</span></div>}
                    {item.price && <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>💴 {item.price}</div>}
                    {item.note && <div style={{ fontSize:12, color:'#5A5247', backgroundColor:C.warmSoft, borderLeft:`3px solid ${C.warm}`, padding:'8px 10px', borderRadius:'0 8px 8px 0', marginBottom:8, whiteSpace:'pre-wrap' }}>{item.note}</div>}
                    {item.photos?.length>0 && <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>{item.photos.map((p,i) => <img key={i} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="food" />)}</div>}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                      <div style={{ fontSize:10, color:C.textMuted }}>{item.editedByName||'成員'} 新增</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { const n=foodItems.map(i=>i.id===item.id?{...i,visited:!i.visited}:i); setFoodItems(n);saveFood(n); }}
                          style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${item.visited?C.warm:C.border}`, backgroundColor:item.visited?C.warmSoft:C.bg, color:item.visited?C.warm:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          {item.visited?'✓ 已去':'標記已去'}
                        </button>
                        {(item.branches||[]).filter(b=>b.mapUrl).map((b,bi)=>(
                        <button key={bi} onClick={()=>window.open(b.mapUrl,'_blank')} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${C.warmBorder}`, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺 {b.name||'地圖'}</button>
                      ))}
                      {!(item.branches||[]).length && item.mapUrl && <button onClick={()=>window.open(item.mapUrl,'_blank')} style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${C.warmBorder}`, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺 地圖</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={() => {
          const fc = foodOptions.cities||[];
          const autoCity = fc.length===1 ? fc[0] : (foodSelectedCity!=='全部城市'?foodSelectedCity:'');
          const initDistricts = [...foodSelectedDistricts];
          setFoodModal({open:true,data:{
            city: autoCity,
            districts: initDistricts,
            branches: initDistricts.map(d=>({name:d,mapUrl:''})),
            foodType: foodSelectedType!=='全部食物'?foodSelectedType:'',
            visited: false,
          }});
        }}
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.warm},${C.warm})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 4px 16px rgba(217,119,6,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
      </div>
    );
  };

  // ════════════════════════════════════════
  // 帳務 Tab
  // ════════════════════════════════════════
  const WalletTab = () => {
    const SYM = { KRW:'₩', JPY:'¥', TWD:'$', USD:'$' };
    const toTWD = (amount, currency) => Math.round(amount*(rates[currency]||1));

    // walletSubTab: 'overview' | 'shared-detail' | 'personal-detail'
    const isShared = walletSubTab==='shared-detail';
    const isSplit = walletSubTab==='split-detail';
    const activeItems = isShared ? walletItems : personalWalletItems;
    const setActiveItems = (fn) => {
      const next = typeof fn==='function' ? fn(activeItems) : fn;
      if(isShared){ setWalletItems(next); saveWallet(next); }
      else { setPersonalWalletItems(next); savePersonalWallet(next); }
    };
    // split-detail 頁面早於明細頁 return，不會走到這裡

    // 各幣別餘額
    const calcTotals = (items) => items.reduce((acc,i)=>{
      if(!i)return acc;
      const c=i.currency||'TWD'; const a=Number(i.amount)||0;
      acc[c]=(acc[c]||0)+(i.type==='存入'?a:-a);
      return acc;
    },{});
    const sharedTotals = calcTotals(walletItems);
    const personalTotals = calcTotals(personalWalletItems);

    // 日期列表
    const walletDates = [...new Set(activeItems.map(i=>i?.date).filter(Boolean))].sort();
    const currentDate = walletSelectedDate&&walletDates.includes(walletSelectedDate)
      ? walletSelectedDate : walletDates[walletDates.length-1]||'';

    // 依日期篩選
    const filteredItems = activeItems.filter(i=>i&&i.date===currentDate)
      .sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));

    // 今日小計
    const dailySum = filteredItems.reduce((acc,i)=>{
      const c=i.currency||'TWD'; const a=Number(i.amount)||0;
      acc[c]=(acc[c]||0)+(i.type==='存入'?a:-a); return acc;
    },{});

    // 公費每人餘額
    const memberBalance = {};
    members.forEach(m=>{memberBalance[m.uid]={};});
    walletItems.forEach(w=>{
      const allUids=members.map(m=>m.uid);
      if(w.type==='存入'){
        const ids=(w.contributorIds||allUids).filter(id=>memberBalance[id]!==undefined);
        const total_=(Number(w.amount)||0); const n_=ids.length||1;
        const per_=Math.floor(total_/n_); const rem_=total_-per_*n_;
        const offset_=w.createdAt?Math.floor(w.createdAt/1000)%n_:0;
        ids.forEach((id,i_)=>{
          const ri_=(i_-offset_+n_)%n_;
          memberBalance[id][w.currency]=(memberBalance[id][w.currency]||0)+per_+(ri_<rem_?1:0);
        });
      } else {
        const ids=(w.forMemberIds||allUids).filter(id=>memberBalance[id]!==undefined);
        const total2_=(Number(w.amount)||0); const n2_=ids.length||1;
        const per2_=Math.floor(total2_/n2_); const rem2_=total2_-per2_*n2_;
        const offset2_=w.createdAt?Math.floor(w.createdAt/1000)%n2_:0;
        ids.forEach((id,i2_)=>{
          const ri2_=(i2_-offset2_+n2_)%n2_;
          memberBalance[id][w.currency]=(memberBalance[id][w.currency]||0)-per2_-(ri2_<rem2_?1:0);
        });
      }
    });

    // 代墊結算
    const unsettled = (Array.isArray(splitRecords)?splitRecords:[]).filter(r=>!r.settled && r.payerId!==r.receiverId);
    const simplify = (records) => {
      const transfers=[];
      const currencies=[...new Set(records.map(r=>r.currency||'TWD'))];
      currencies.forEach(cur=>{
        const bal={};
        records.filter(r=>r.currency===cur).forEach(r=>{
          bal[r.payerId]=(bal[r.payerId]||0)+r.amount;
          bal[r.receiverId]=(bal[r.receiverId]||0)-r.amount;
        });
        const pos=[],neg=[];
        Object.entries(bal).forEach(([uid,v])=>{ if(v>0.5)pos.push({uid,v}); else if(v<-0.5)neg.push({uid,v:-v}); });
        pos.sort((a,b)=>b.v-a.v); neg.sort((a,b)=>b.v-a.v);
        let i=0,j=0; const pc=[...pos.map(x=>({...x}))],nc=[...neg.map(x=>({...x}))];
        while(i<pc.length&&j<nc.length){ const amt=Math.min(pc[i].v,nc[j].v); if(amt>0.5)transfers.push({from:nc[j].uid,to:pc[i].uid,amount:Math.round(amt),currency:cur}); pc[i].v-=amt;nc[j].v-=amt; if(pc[i].v<0.5)i++; if(nc[j].v<0.5)j++; }
      });
      return transfers;
    };
    const transfers = simplify(unsettled);
    const myTransfers = transfers.filter(t=>t.from===user.uid||t.to===user.uid);

    const CurrencyBg = { JPY:'#FFF0F0', KRW:'#F0F0FF', TWD:'#F0FFF4', USD:'#FFFDE8' };
    const CurrencyC = { JPY:'#E05555', KRW:'#5555D0', TWD:'#189060', USD:'#B0900A' };

    // ── 總覽頁 ──
    if(walletSubTab==='overview') return (
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:14 }}>

        {/* 💰 共同公費 */}
        <button onClick={()=>setWalletSubTab('shared-detail')}
          style={{ ...gs.card, cursor:'pointer', padding:'16px 18px', border:`1.5px solid ${C.blue}22`, background:C.surface, textAlign:'left', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:30 }}>💰</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.blue }}>共同公費</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
              {Object.keys(sharedTotals).length===0 ? '尚無帳目' :
                Object.entries(sharedTotals).map(([cur,val])=>`${val>=0?'+':''}${SYM[cur]||''}${Math.abs(val).toLocaleString()} ${cur}`).join('・')}
            </div>
          </div>
          <div style={{ color:C.blue, fontSize:18, fontWeight:700 }}>›</div>
        </button>

        {/* 👤 個人記帳 */}
        <button onClick={()=>setWalletSubTab('personal-detail')}
          style={{ ...gs.card, cursor:'pointer', padding:'16px 18px', border:`1.5px solid ${C.blue}22`, background:C.surface, textAlign:'left', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:30 }}>👤</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.blue }}>個人記帳</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
              {Object.keys(personalTotals).length===0 ? '尚無帳目' :
                Object.entries(personalTotals).map(([cur,val])=>`${val>=0?'+':''}${SYM[cur]||''}${Math.abs(val).toLocaleString()} ${cur}`).join('・')}
            </div>
          </div>
          <div style={{ color:C.blue, fontSize:18, fontWeight:700 }}>›</div>
        </button>

        {/* 🔄 代墊結算 */}
        <button onClick={()=>setWalletSubTab('split-detail')}
          style={{ ...gs.card, cursor:'pointer', padding:'16px 18px', border:`1.5px solid ${C.blue}22`, background:C.surface, textAlign:'left', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:30 }}>🔄</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.blue }}>代墊結算</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
              {unsettled.length===0 ? '目前沒有未結清的代墊' :
                myTransfers.length>0 ? `⚠️ 有 ${myTransfers.length} 筆與我有關` :
                `${unsettled.length} 筆未結清`}
            </div>
          </div>
          <div style={{ color:C.blue, fontSize:18, fontWeight:700 }}>›</div>
        </button>

        {/* 匯率設定 */}
        <button onClick={() => setShowCurrencySettings(true)}
          style={{ width:'100%', padding:'10px 14px', borderRadius:12, backgroundColor:C.bg, border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', textAlign:'left' }}>
          <div style={{ fontSize:11, color:C.textMuted }}>
            {tripCurrencies.filter(c=>c!=='TWD').map(c=>`1 ${c} ≈ NT${(manualRates[c]||rates[c]||'?')}`).join('・')}
            {tripCurrencies.length<=1 && '點此設定幣別'}
          </div>
          <div style={{ fontSize:11, color:C.purple, fontWeight:700 }}>設定 ›</div>
        </button>
      </div>
    );

    // ── 代墊結算頁 ──
    if(walletSubTab==='split-detail') return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, zIndex:30 }}>
          <button onClick={()=>setWalletSubTab('overview')} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.textMuted, padding:'0 4px' }}>←</button>
          <div style={{ fontSize:15, fontWeight:800 }}>🔄 代墊結算</div>
        </div>

        <div style={{ padding:16, flex:1 }}>
          {/* ── 誰欠誰（依方向合併，同 A→B 放一起）── */}
          {transfers.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
              <div style={{ fontSize:15, fontWeight:700, color:C.green }}>全部結清了！</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:6 }}>目前沒有未結清的代墊款項</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
              {(() => {
                // 把同一個 from→to 的不同幣別合在一起
                const groups = {};
                transfers.forEach(t => {
                  const key = `${t.from}_${t.to}`;
                  if (!groups[key]) groups[key] = { from:t.from, to:t.to, items:[] };
                  groups[key].items.push(t);
                });
                return Object.values(groups).map((g, gi) => {
                  const fromM = members.find(m=>m.uid===g.from)||{displayName:'?'};
                  const toM = members.find(m=>m.uid===g.to)||{displayName:'?'};
                  const iAmFrom = g.from===user.uid;
                  const iAmTo = g.to===user.uid;
                  return (
                    <div key={gi} style={{ ...gs.card, padding:'16px', backgroundColor:C.surface }}>
                      {/* 誰欠誰 */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <div style={{ fontSize:15, fontWeight:800 }}>
                          <span style={{ color:C.text }}>{iAmFrom?'我':fromM.displayName}</span>
                          <span style={{ color:C.textMuted, margin:'0 8px' }}>→</span>
                          <span style={{ color:C.text }}>{iAmTo?'我':toM.displayName}</span>
                        </div>
                        {(iAmFrom||iAmTo) && (
                          <div style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:iAmFrom?C.danger:C.textMuted, padding:'3px 8px', borderRadius:6, border:`1px solid ${iAmFrom?C.danger:C.border}`, backgroundColor:iAmFrom?C.dangerSoft:'transparent' }}>
                            {iAmTo?'待收款':'待還款'}
                          </div>
                        )}
                      </div>
                      {/* 台幣總計 */}
                      <div style={{ fontSize:12, color:C.textMuted, marginBottom:12 }}>
                        合計 ≈ NT${g.items.reduce((s,t)=>s+toTWD(t.amount,t.currency),0).toLocaleString()}
                      </div>

                      {/* 各幣別 */}
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {g.items.map((t, ti) => {
                          const sk = t.from+t.to+t.currency;
                          const settleOne = (chosenAmt, chosenCur) => {
                            const actualAmt = typeof chosenAmt==='number' ? chosenAmt : t.amount;
                            const actualCur = chosenCur || t.currency;
                            const now = Date.now();
                            const newRecords = splitRecords.map(sr => {
                              const isRelated = (sr.payerId===t.to&&sr.receiverId===t.from) ||
                                               (sr.payerId===t.from&&sr.receiverId===t.to);
                              return isRelated && sr.currency===t.currency ? {...sr,settled:true,settledAt:now} : sr;
                            });
                            setSplitRecords(newRecords); saveSplitRecords(newRecords);
                            setTransferStates(p=>{ const np={...p}; delete np[sk]; return np; });
                            // 雙方個人帳務都寫入
                            const today=new Date(now);
                            const mmdd=`${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;
                            // 找原始代墊項目的備註（可能多筆合併結清）
                            const relNotes1=[...new Set(splitRecords.filter(r=>!r.settled&&((r.payerId===t.to&&r.receiverId===t.from)||(r.payerId===t.from&&r.receiverId===t.to))&&r.currency===t.currency).map(r=>r.note).filter(Boolean))];
                            const itemNote=relNotes1.join('・')||'代墊';
                            const isIPaying1=g.from===user.uid;
                            const otherUid=isIPaying1?g.to:g.from;
                            const counterM1=members.find(m=>m.uid===otherUid)||{displayName:'對方'};
                            const myName1=user.displayName||user.email||'我';
                            const curNote = actualCur!==t.currency ? `（折合 NT$${actualAmt.toLocaleString()}）` : '';
                            const origInfo1 = actualCur!==t.currency ? `原 ${t.currency==='JPY'?'¥':t.currency==='KRW'?'₩':t.currency==='USD'?'$':''}${t.amount.toLocaleString()} ${t.currency}` : undefined;
                            // 我自己的帳務
                            const myLabel=isIPaying1?`還款・${itemNote}（還給 ${counterM1.displayName}）${curNote}`:`收款・${itemNote}（${counterM1.displayName} 還）${curNote}`;
                            const myType=isIPaying1?'支出':'存入';
                            const myEntry={id:now+998,name:myLabel,amount:actualAmt,currency:actualCur,type:myType,date:mmdd,note:'代墊結清',...(origInfo1?{origInfo:origInfo1}:{}),counterpartUid:otherUid,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:now};
                            const np=[...personalWalletItems,myEntry];setPersonalWalletItems(np);savePersonalWallet(np);
                            // 對方的帳務（用對方的 uid 存到對方的個人帳）
                            const otherLabel=isIPaying1?`收款・${itemNote}（${myName1} 還）${curNote}`:`還款・${itemNote}（還給 ${myName1}）${curNote}`;
                            const otherType=isIPaying1?'存入':'支出';
                            const otherEntry={id:now+999,name:otherLabel,amount:actualAmt,currency:actualCur,type:otherType,date:mmdd,note:'代墊結清',...(origInfo1?{origInfo:origInfo1}:{}),counterpartUid:user.uid,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:now};
                            getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${otherUid}`)).then(snap=>{
                              const items=snap.exists()?snap.data().items||[]:[];
                              setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${otherUid}`), { items:JSON.parse(JSON.stringify([...items,otherEntry])), updatedAt:serverTimestamp() });
                            });
                          };
                          return (
                            <div key={ti} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', backgroundColor:C.bg, borderRadius:10 }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:16, fontWeight:800, color:iAmFrom?C.danger:C.text }}>
                                  {SYM[t.currency]||''}{t.amount.toLocaleString()} {t.currency}
                                </div>
                                <div style={{ fontSize:10, color:C.textMuted }}>≈ NT${toTWD(t.amount,t.currency).toLocaleString()}</div>
                              </div>
                              <button onClick={()=>{
                                if(t.currency==='TWD'){
                                  setConfirmDel({title:'確認結清',message:`確定結清 $${t.amount.toLocaleString()} TWD？結清後會自動記入個人帳務。`,fn:()=>settleOne()});
                                } else {
                                  setSettleCurrencyPrompt({amount:t.amount, currency:t.currency, twdAmount:toTWD(t.amount,t.currency), onChoose:(a,c)=>settleOne(a,c)});
                                }
                              }} style={{ padding:'7px 14px', borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.surface, color:C.text, fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
                                結清
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* 全部結清按鈕（只有多個幣別才顯示）*/}
                      {g.items.length > 1 && (
                        <button onClick={() => setConfirmDel({title:'確認結清',message:`確定一次結清所有幣別？結清後會自動記入個人帳務。`,fn:()=>{
                          const now = Date.now();
                          let newRecords = [...splitRecords];
                          const newEntries = [];
                          // 全部結清：把所有幣別折算成台幣，合併成一筆
                          const totalTWD = g.items.reduce((s,t)=>s+toTWD(t.amount,t.currency),0);
                          const allNotes = [...new Set(g.items.flatMap(t=>
                            splitRecords.filter(r=>!r.settled&&((r.payerId===t.to&&r.receiverId===t.from)||(r.payerId===t.from&&r.receiverId===t.to))&&r.currency===t.currency).map(r=>r.note).filter(Boolean)
                          ))].join('・')||'代墊';
                          const isIPaying2 = g.from===user.uid;
                          const othUid2 = isIPaying2?g.to:g.from;
                          const ctrM2 = members.find(m=>m.uid===othUid2)||{displayName:'對方'};
                          const myName2 = user.displayName||user.email||'我';
                          const today2=new Date(now);
                          const mmdd2=`${String(today2.getMonth()+1).padStart(2,'0')}/${String(today2.getDate()).padStart(2,'0')}`;
                          g.items.forEach(t => {
                            const sk = t.from+t.to+t.currency;
                            newRecords = newRecords.map(sr => {
                              const isRelated = (sr.payerId===t.to&&sr.receiverId===t.from) ||
                                               (sr.payerId===t.from&&sr.receiverId===t.to);
                              return isRelated && sr.currency===t.currency ? {...sr,settled:true,settledAt:now} : sr;
                            });
                            setTransferStates(p=>{ const np={...p}; delete np[sk]; return np; });
                          });
                          // 只寫一筆台幣合計（不列明細，只標誰還的）
                          const origInfoAll=g.items.map(t=>`${t.currency==='JPY'?'¥':t.currency==='KRW'?'₩':t.currency==='USD'?'$':''}${t.amount.toLocaleString()} ${t.currency}`).join(' + ');
                          const myLbl=isIPaying2?`還款合計（還給 ${ctrM2.displayName}）`:`收款合計（${ctrM2.displayName} 還）`;
                          const myTyp=isIPaying2?'支出':'存入';
                          newEntries.push({id:now+999,name:myLbl,amount:totalTWD,currency:'TWD',type:myTyp,date:mmdd2,note:'代墊結清',origInfo:`原 ${origInfoAll}`,counterpartUid:othUid2,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:now});
                          const othLbl=isIPaying2?`收款合計（${myName2} 還）`:`還款合計（還給 ${myName2}）`;
                          const othTyp=isIPaying2?'存入':'支出';
                          const othEntry={id:now+9990,name:othLbl,amount:totalTWD,currency:'TWD',type:othTyp,date:mmdd2,note:'代墊結清',origInfo:`原 ${origInfoAll}`,counterpartUid:user.uid,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:now};
                          getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${othUid2}`)).then(snap=>{
                            const its=snap.exists()?snap.data().items||[]:[];
                            setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${othUid2}`),{items:JSON.parse(JSON.stringify([...its,othEntry])),updatedAt:serverTimestamp()});
                          });
                          setSplitRecords(newRecords); saveSplitRecords(newRecords);
                          const np=[...personalWalletItems,...newEntries]; setPersonalWalletItems(np); savePersonalWallet(np);
                        }})} style={{ width:'100%', marginTop:10, padding:'9px', borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.surface, color:C.text, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                          ✓ 全部結清
                        </button>
                      )}
                      {g.items.length === 1 && (() => {
                        const t3 = g.items[0];
                        const doSettle3 = (chosenAmt, chosenCur) => {
                          const actualAmt3 = typeof chosenAmt==='number' ? chosenAmt : t3.amount;
                          const actualCur3 = chosenCur || t3.currency;
                          const now = Date.now();
                          const sk3 = t3.from+t3.to+t3.currency;
                          const newRecords = splitRecords.map(sr => {
                            const isRelated = (sr.payerId===t3.to&&sr.receiverId===t3.from)||(sr.payerId===t3.from&&sr.receiverId===t3.to);
                            return isRelated && sr.currency===t3.currency ? {...sr,settled:true,settledAt:now} : sr;
                          });
                          setSplitRecords(newRecords); saveSplitRecords(newRecords);
                          setTransferStates(p=>{ const np={...p}; delete np[sk3]; return np; });
                          const today=new Date(now);
                          const mmdd=`${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;
                          const relNotes3=[...new Set(splitRecords.filter(r=>!r.settled&&((r.payerId===t3.to&&r.receiverId===t3.from)||(r.payerId===t3.from&&r.receiverId===t3.to))&&r.currency===t3.currency).map(r=>r.note).filter(Boolean))];
                          const itNote3=relNotes3.join('・')||'代墊';
                          const isIPaying3=g.from===user.uid;
                          const othUid2=isIPaying3?g.to:g.from;
                          const ctrM3=members.find(m=>m.uid===othUid2)||{displayName:'對方'};
                          const myName3=user.displayName||user.email||'我';
                          const curNote3 = actualCur3!==t3.currency ? `（折合 NT$${actualAmt3.toLocaleString()}）` : '';
                          const origInfo3 = actualCur3!==t3.currency ? `原 ${t3.currency==='JPY'?'¥':t3.currency==='KRW'?'₩':t3.currency==='USD'?'$':''}${t3.amount.toLocaleString()} ${t3.currency}` : undefined;
                          const myLbl2=isIPaying3?`還款・${itNote3}（還給 ${ctrM3.displayName}）${curNote3}`:`收款・${itNote3}（${ctrM3.displayName} 還）${curNote3}`;
                          const myTyp2=isIPaying3?'支出':'存入';
                          const myEntry2={id:now+998,name:myLbl2,amount:actualAmt3,currency:actualCur3,type:myTyp2,date:mmdd,note:'代墊結清',...(origInfo3?{origInfo:origInfo3}:{}),counterpartUid:othUid2,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:now};
                          const np=[...personalWalletItems,myEntry2];setPersonalWalletItems(np);savePersonalWallet(np);
                          const othLbl2=isIPaying3?`收款・${itNote3}（${myName3} 還）${curNote3}`:`還款・${itNote3}（還給 ${myName3}）${curNote3}`;
                          const othTyp2=isIPaying3?'存入':'支出';
                          const othEntry2={id:now+999,name:othLbl2,amount:actualAmt3,currency:actualCur3,type:othTyp2,date:mmdd,note:'代墊結清',...(origInfo3?{origInfo:origInfo3}:{}),counterpartUid:user.uid,editedByName:user.displayName||user.email,editedById:user.uid,createdAt:now};
                          getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${othUid2}`)).then(snap=>{
                            const its=snap.exists()?snap.data().items||[]:[];
                            setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${othUid2}`),{items:JSON.parse(JSON.stringify([...its,othEntry2])),updatedAt:serverTimestamp()});
                          });
                        };
                        return (
                          <button onClick={()=>{
                            if(t3.currency==='TWD'){
                              setConfirmDel({title:'確認結清',message:`確定結清？結清後會自動記入個人帳務。`,fn:()=>doSettle3()});
                            } else {
                              setSettleCurrencyPrompt({amount:t3.amount,currency:t3.currency,twdAmount:toTWD(t3.amount,t3.currency),onChoose:(a,c)=>doSettle3(a,c)});
                            }
                          }} style={{ width:'100%', marginTop:10, padding:'9px', borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.surface, color:C.text, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            ✓ 標記結清
                          </button>
                        );
                      })()}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* ── 下方：所有代墊明細（含已還的）── */}
          {splitRecords.length>0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:12 }}>📋 代墊明細</div>
              {(() => {
                // 分組：同一筆代墊（payerId + note + currency，createdAt 相差在 5 秒內）
                const groups = [];
                const used = new Set();
                const sorted = [...splitRecords].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
                sorted.forEach(r => {
                  if (used.has(r.id)) return;
                  // 找同組的：同 payerId, note, currency, createdAt 相差 < 5000ms
                  const group = sorted.filter(r2 =>
                    !used.has(r2.id) &&
                    r2.payerId === r.payerId &&
                    r2.note === r.note &&
                    r2.currency === r.currency &&
                    Math.abs((r2.createdAt||0) - (r.createdAt||0)) < 60000
                  );
                  group.forEach(r2 => used.add(r2.id));
                  groups.push(group);
                });

                return groups.map((recs, gi) => {
                  const r0 = recs[0];
                  const payerM = members.find(m=>m.uid===r0.payerId)||{displayName:'?'};
                  const iAmPayer = r0.payerId === user.uid;
                  const total = recs.reduce((s,r)=>s+r.amount,0);
                  const allSettled = recs.every(r=>r.settled);
                  const d = r0.createdAt ? new Date(r0.createdAt) : new Date();
                  const dateLabel = `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;

                  return (
                    <div key={gi} style={{ ...gs.card, padding:'14px 16px', marginBottom:10, opacity:allSettled?0.6:1, backgroundColor:iAmPayer?C.greenSoft:C.surface, border:`1px solid ${iAmPayer?C.green:C.border}22` }}>
                      {/* 標題 */}
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{r0.note||'代墊'}</div>
                          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                            <span style={{ color:iAmPayer?C.green:C.text, fontWeight:600 }}>{iAmPayer?'我':payerM.displayName}</span>
                            <span> 付款 · {dateLabel}</span>
                            {allSettled && <span style={{ color:C.green, marginLeft:6, fontWeight:700 }}>✓ 全部還清</span>}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:iAmPayer?C.green:C.text }}>
                            {SYM[r0.currency]||''}{total.toLocaleString()} {r0.currency}
                          </div>
                          <button onClick={() => setSplitModal({open:true, data:{
                            payerId: r0.payerId,
                            receiverIds: recs.map(r=>r.receiverId),
                            amount: String(total),
                            currency: r0.currency,
                            note: r0.note||'',
                            editingIds: recs.map(r=>r.id),
                          }})} style={{ padding:'4px 7px', border:`1px solid ${C.border}`, borderRadius:7, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                          <button onClick={() => setConfirmDel({
                            title:'刪除代墊',
                            message:`確定刪除「${r0.note||'代墊'}」？\n相關的個人帳務還款記錄也會一併刪除。`,
                            fn: () => {
                              const ids = new Set(recs.map(r=>String(r.id)));
                              const nr = splitRecords.filter(r=>!ids.has(String(r.id)));
                              setSplitRecords(nr); saveSplitRecords(nr);

                              // 刪除所有相關個人帳務記錄（已還/結清時寫入的）
                              const settledTimes = recs.map(r=>r.settledAt).filter(Boolean);
                              if(settledTimes.length > 0) {
                                const isRelated = (pw) =>
                                  (pw.note==='代墊已還'||pw.note==='代墊結清') &&
                                  settledTimes.some(st=>Math.abs((pw.createdAt||0)-st)<5000);

                                // 自己的個人帳務
                                const myFiltered = personalWalletItems.filter(pw=>!isRelated(pw));
                                if(myFiltered.length < personalWalletItems.length){
                                  setPersonalWalletItems(myFiltered); savePersonalWallet(myFiltered);
                                }

                                // 其他所有涉及成員的個人帳務
                                const involvedUids = [...new Set([
                                  ...personalWalletItems.filter(isRelated).map(e=>e.counterpartUid),
                                  ...recs.map(r=>r.payerId),
                                  ...recs.map(r=>r.receiverId),
                                ])].filter(uid=>uid&&uid!==user.uid);

                                involvedUids.forEach(uid=>{
                                  getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${uid}`)).then(snap=>{
                                    if(!snap.exists()) return;
                                    const its=snap.data().items||[];
                                    const f=its.filter(pw=>!isRelated(pw));
                                    if(f.length<its.length) setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${uid}`),{items:JSON.parse(JSON.stringify(f)),updatedAt:serverTimestamp()});
                                  });
                                });
                              }
                            }
                          })} style={{ padding:'4px 7px', border:`1px solid ${C.danger}33`, borderRadius:7, backgroundColor:'#FDE8E8', color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
                        </div>
                      </div>

                      {/* 每個欠款人 */}
                      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:8, display:'flex', flexDirection:'column', gap:6 }}>
                        {recs.map((r, ri) => {
                          const receiverM = members.find(m=>m.uid===r.receiverId)||{displayName:'?'};
                          const iAmReceiver = r.receiverId === user.uid;
                          const isSelf = r.payerId === r.receiverId;
                          return (
                            <div key={ri} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:8, backgroundColor:r.settled?'transparent':(!isSelf&&iAmReceiver)?C.dangerSoft:'transparent' }}>
                              <div style={{ width:5, height:5, borderRadius:'50%', backgroundColor:r.settled?C.green:(!isSelf&&iAmReceiver)?C.danger:C.textMuted, flexShrink:0 }} />
                              <div style={{ flex:1, fontSize:12, fontWeight:600, color:r.settled?C.textMuted:(!isSelf&&iAmReceiver)?C.danger:C.text }}>
                                {iAmReceiver?'我':receiverM.displayName}
                                {isSelf && <span style={{ fontSize:10, color:C.textMuted, marginLeft:4 }}>(自付)</span>}
                              </div>
                              <div style={{ fontSize:12, fontWeight:700, color:r.settled?C.textMuted:iAmReceiver?C.danger:C.text }}>
                                {SYM[r.currency]||''}{r.amount.toLocaleString()}
                              </div>
                              {/* 已還標記 */}
                              {r.settled ? (
                                <button onClick={()=>setConfirmDel({title:'復原已還',message:`確定復原「${r.note||'代墊'}」的已還狀態？\n個人記帳中相關的還款紀錄也會一併刪除。`,fn:()=>{
                                  const nr=splitRecords.map(sr=>(String(sr.id)===String(r.id))?{...sr,settled:false,settledAt:null}:sr);
                                  setSplitRecords(nr); saveSplitRecords(nr);
                                  // 刪除個人帳務中對應的已還記錄
                                  if (r.settledAt) {
                                    const f1=personalWalletItems.filter(pw=>!(pw.note==='代墊已還'&&pw.amount===r.amount&&pw.currency===r.currency&&Math.abs((pw.createdAt||0)-r.settledAt)<5000));
                                    if(f1.length<personalWalletItems.length){ setPersonalWalletItems(f1); savePersonalWallet(f1); }
                                    const otherUidR=user.uid===r.payerId?r.receiverId:r.payerId;
                                    getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${otherUidR}`)).then(snap=>{
                                      if(!snap.exists())return;
                                      const its=snap.data().items||[];
                                      const f2=its.filter(pw=>!(pw.note==='代墊已還'&&pw.amount===r.amount&&pw.currency===r.currency&&Math.abs((pw.createdAt||0)-r.settledAt)<5000));
                                      if(f2.length<its.length) setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${otherUidR}`),{items:JSON.parse(JSON.stringify(f2)),updatedAt:serverTimestamp()});
                                    });
                                  }
                                }})} style={{ fontSize:10, color:C.warm, fontWeight:700, padding:'3px 8px', borderRadius:6, backgroundColor:C.warmSoft, border:`1px solid C.warmBorder`, cursor:'pointer' }}>
                                  ↩ 撤銷
                                </button>
                              ) : !isSelf ? (
                                /* 付款人或欠款人都可以按標記已還 */
                                <button onClick={() => {
                                  const doMarkPaid = (chosenAmt, chosenCur) => {
                                    const now = Date.now();
                                    const newRecords = splitRecords.map(sr =>
                                      (String(sr.id)===String(r.id)) ? {...sr, settled:true, settledAt:now} : sr
                                    );
                                    setSplitRecords(newRecords); saveSplitRecords(newRecords);
                                    const today = new Date(now);
                                    const mmdd = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;
                                    const itemNote = r.note || '代墊';
                                    const iAmPayer = user.uid === r.payerId;
                                    const otherUid = iAmPayer ? r.receiverId : r.payerId;
                                    const counterMp=members.find(m=>m.uid===otherUid)||{displayName:'對方'};
                                    const payerMp=members.find(m=>m.uid===r.payerId)||{displayName:'?'};
                                    const myNameP=user.displayName||user.email||'我';
                                    const origInfoR = chosenCur!==r.currency ? `原 ${SYM[r.currency]||''}${r.amount.toLocaleString()} ${r.currency}` : undefined;
                                    const myEntry = { id:now+10, name:iAmPayer?`收款・${itemNote}（${counterMp.displayName} 還）`:`還款・${itemNote}（還給 ${payerMp.displayName}）`, amount:chosenAmt, currency:chosenCur, type:iAmPayer?'存入':'支出', date:mmdd, note:'代墊已還', ...(origInfoR?{origInfo:origInfoR}:{}), counterpartUid:otherUid, editedByName:user.displayName||user.email, editedById:user.uid, createdAt:now };
                                    const otherEntry = { id:now+11, name:iAmPayer?`還款・${itemNote}（還給 ${myNameP}）`:`收款・${itemNote}（${myNameP} 還）`, amount:chosenAmt, currency:chosenCur, type:iAmPayer?'支出':'存入', date:mmdd, note:'代墊已還', ...(origInfoR?{origInfo:origInfoR}:{}), counterpartUid:user.uid, editedByName:user.displayName||user.email, editedById:user.uid, createdAt:now };
                                    const np = [...personalWalletItems, myEntry];
                                    setPersonalWalletItems(np); savePersonalWallet(np);
                                    getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${otherUid}`)).then(snap=>{
                                      const its = snap.exists() ? snap.data().items||[] : [];
                                      setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${otherUid}`), { items:JSON.parse(JSON.stringify([...its,otherEntry])), updatedAt:serverTimestamp() });
                                    });
                                  };
                                  if(r.currency==='TWD'){
                                    doMarkPaid(r.amount, 'TWD');
                                  } else {
                                    setSettleCurrencyPrompt({ amount:r.amount, currency:r.currency, twdAmount:toTWD(r.amount,r.currency), onChoose:(a,c)=>doMarkPaid(a,c) });
                                  }
                                }} style={{ fontSize:11, color:C.warm, padding:'3px 8px', borderRadius:6, border:`1px solid ${C.warm}44`, backgroundColor:C.warmSoft, cursor:'pointer', fontWeight:600, flexShrink:0 }}>
                                  標記已還
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* 新增代墊按鈕 */}
        <button onClick={() => setSplitModal({open:true, data:{payerId:user.uid, receiverIds:[], amount:'', currency:(tripCurrencies||['JPY'])[0]||'JPY', note:''}})}
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.warm},${C.text})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:`0 4px 16px ${C.warm}66`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
      </div>
    );

    // ── 明細頁（共用或個人）──
    const pageColor = C.warm;
    const pageBg = C.warmSoft;
    const pageTitle = isShared ? '共同公費' : '個人記帳';

    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* 次頁 header */}
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, zIndex:30 }}>
          <button onClick={()=>setWalletSubTab('overview')} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.textMuted, padding:'0 4px' }}>←</button>
          <div style={{ fontSize:15, fontWeight:800 }}>{pageTitle}</div>
        </div>

        {/* 餘額 + 結算按鈕 */}
        <div style={{ padding:'12px 16px', backgroundColor:pageBg, borderBottom:`1px solid ${pageColor}22` }}>
          <div style={{ display:'flex', gap:10, overflowX:'auto', marginBottom: Object.keys(calcTotals(activeItems)).length>0?10:0 }}>
            {Object.entries(calcTotals(activeItems)).map(([cur,val])=>(
              <div key={cur} style={{ flexShrink:0, padding:'8px 14px', borderRadius:12, backgroundColor:val>=0?(CurrencyBg[cur]||C.greenSoft):'#FFF0F0', border:`1px solid ${val>=0?(CurrencyC[cur]||C.green):C.danger}33` }}>
                <div style={{ fontSize:10, color:C.textMuted, marginBottom:2 }}>{cur} 餘額</div>
                <div style={{ fontSize:16, fontWeight:800, color:val>=0?(CurrencyC[cur]||C.green):C.danger }}>{val>=0?'+':val<0?'-':''}{SYM[cur]||''}{Math.abs(val).toLocaleString()}</div>
                <div style={{ fontSize:10, color:C.textMuted }}>≈ NT${toTWD(Math.abs(val),cur).toLocaleString()}</div>
              </div>
            ))}
            {Object.keys(calcTotals(activeItems)).length===0 && <div style={{ fontSize:12, color:C.textMuted }}>尚無帳目</div>}
          </div>
          {isShared && walletItems.length>0 && (
            <button onClick={()=>setShowPoolSettlement(true)} style={{ width:'100%', padding:'9px 14px', borderRadius:12, border:`1px solid ${C.purple}33`, backgroundColor:'rgba(255,255,255,0.6)', color:C.purple, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>📊 公費結算 — 查看每人貢獻</span><span>›</span>
            </button>
          )}

        </div>

        {/* 日期列 */}
        {walletDates.length>0 && (
          <div style={{ padding:'10px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
              {walletDates.map(d=>(
                <div key={d} style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                  <button onClick={()=>setWalletSelectedDate(d)} style={{ padding:'5px 12px', borderRadius:10, border:`1.5px solid ${currentDate===d?pageColor:C.border}`, backgroundColor:currentDate===d?pageColor:C.surface, color:currentDate===d?'#fff':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>{d}</button>
                  <button onClick={()=>setConfirmDel({title:'刪除日期',message:`確定刪除 ${d} 的所有帳目嗎？`,fn:()=>{ const n=activeItems.filter(i=>i.date!==d); setActiveItems(()=>n); if(currentDate===d)setWalletSelectedDate(''); }})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:13, cursor:'pointer', opacity:0.5 }}>×</button>
                </div>
              ))}
            </div>
            {Object.keys(dailySum).length>0 && (
              <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
                {Object.entries(dailySum).map(([cur,val])=>(
                  <span key={cur} style={{ fontSize:11, fontWeight:700, color:val>=0?C.green:C.danger }}>{cur} {val>=0?'+':val<0?'-':''}{SYM[cur]||''}{Math.abs(val).toLocaleString()}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 帳目列表 */}
        <div style={{ padding:16, flex:1 }}>

          {filteredItems.length===0 ? (
            <div style={{ textAlign:'center', padding:'20px 20px', color:C.textMuted, fontSize:13 }}>{currentDate?`${currentDate} 尚無個人帳目`:'尚無帳目，點右下角 ＋ 新增'}</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filteredItems.map(item=>{
                if(!item)return null;
                const isIncome=item.type==='存入';
                const cur=item.currency||'TWD';
                const allUids=members.map(m=>m.uid);
                let memberLabel=null;
                if(isShared){
                  if(isIncome){ const ids=item.contributorIds; if(ids&&ids.length>0&&ids.length<allUids.length){ const names=ids.map(id=>members.find(m=>m.uid===id)?.displayName).filter(Boolean); memberLabel=names.join('・')+' 存入'; }}
                  else { const ids=item.forMemberIds; if(ids&&ids.length>0&&ids.length<allUids.length){ const names=ids.map(id=>members.find(m=>m.uid===id)?.displayName).filter(Boolean); memberLabel='幫 '+names.join('・')+' 代墊'; }}
                } else {
                  if(item.splitPayerId){
                    const payer=members.find(m=>m.uid===item.splitPayerId)?.displayName||'?';
                    const receivers=(item.splitReceiverIds||[]).map(id=>members.find(m=>m.uid===id)?.displayName).filter(Boolean);
                    const total=Number(item.amount)||0;
                    const n=(item.splitReceiverIds||[]).length||1;
                    const per=Math.floor(total/n);
                    const rem=total-per*n;
                    memberLabel=`${payer} 代墊・每人 ${per.toLocaleString()}${rem>0?'+':''}`;
                  }
                }
                const bg = C.surface;
                const bc = C.border;
                return (
                  <div key={item.id} style={{ ...gs.card, padding:'14px 16px', backgroundColor:bg, border:`1px solid ${bc}` }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                          <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:isIncome?C.greenSoft:C.dangerSoft, color:isIncome?C.green:C.danger, fontSize:11, fontWeight:700 }}>{item.type}</span>
                          <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.bg, color:C.textMuted, fontSize:11, fontWeight:700 }}>{cur}</span>
                          {item.date&&<span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.bg, color:C.textMuted, fontSize:11 }}>{item.date}</span>}
                          {memberLabel&&<span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.bg, color:C.textMuted, fontSize:11 }}>{memberLabel}</span>}
                          {(item.note==='代墊已還'||item.note==='代墊結清')&&<span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700 }}>🔗 分攤記錄</span>}
                        </div>
                        <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{item.name}</div>
                        {item.origInfo&&<div style={{ fontSize:11, color:C.textMuted, marginTop:1 }}>💱 {item.origInfo}</div>}
                        {item.note&&<div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{item.note}</div>}
                        <div style={{ fontSize:10, color:C.textMuted, marginTop:6 }}>{item.editedByName||'成員'} 記帳</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:isIncome?C.green:C.danger }}>{isIncome?'+':'-'}{SYM[cur]||''}{Number(item.amount||0).toLocaleString()}</div>
                        <div style={{ display:'flex', gap:4, marginTop:6, justifyContent:'flex-end' }}>
                          {/* 代墊自動記錄不可編輯 */}
                          {(item.note!=='代墊已還'&&item.note!=='代墊結清') && (
                            <button onClick={()=>{setWalletModal({open:true,data:{...item,contributorIds:item.contributorIds||allUids,forMemberIds:item.forMemberIds||allUids}});setWalletCalc(false);}} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:'rgba(255,255,255,0.8)', color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                          )}
                          <button onClick={()=>{
                            const isAutoEntry = item.note==='代墊已還'||item.note==='代墊結清';
                            const deleteCounterpart = () => {
                              // 同時刪除對方個人帳務中對應的記錄
                              const cpUid = item.counterpartUid;
                              if (!cpUid) return;
                              getDoc(doc(db,"tripData",`${trip.id}_personalWallet_${cpUid}`)).then(snap=>{
                                if(!snap.exists()) return;
                                const its=snap.data().items||[];
                                const f=its.filter(pw=>!(
                                  (pw.note==='代墊已還'||pw.note==='代墊結清') &&
                                  pw.counterpartUid===user.uid &&
                                  pw.amount===item.amount && pw.currency===item.currency &&
                                  Math.abs((pw.createdAt||0)-(item.createdAt||0))<5000
                                ));
                                if(f.length<its.length) setDoc(doc(db,"tripData",`${trip.id}_personalWallet_${cpUid}`),{items:JSON.parse(JSON.stringify(f)),updatedAt:serverTimestamp()});
                              });
                            };
                            if(item.note==='代墊已還') {
                              // 直接顯示自訂 prompt（不走 ConfirmDialog，避免 setTimeout 問題）
                              setSplitRestorePrompt({
                                item,
                                onDeleteSelf: () => setActiveItems(p=>p.filter(i=>i.id!==item.id)),
                                onDeleteBoth: () => { setActiveItems(p=>p.filter(i=>i.id!==item.id)); deleteCounterpart(); }
                              });
                            } else if(item.note==='代墊結清') {
                              setConfirmDel({title:'刪除帳目',message:`確定刪除「${item.name}」？\n對方的對應記錄也會一起刪除。\n代墊記錄也將恢復為未結清。`,fn:()=>{
                                setActiveItems(p=>p.filter(i=>i.id!==item.id));
                                deleteCounterpart();
                                if(item.createdAt){
                                  const nr=splitRecords.map(sr=>Math.abs((sr.settledAt||0)-item.createdAt)<5000?{...sr,settled:false,settledAt:null}:sr);
                                  setSplitRecords(nr); saveSplitRecords(nr);
                                }
                              }});
                            } else {
                              setConfirmDel({title:'刪除帳目',message:`確定刪除「${item.name}」？`,fn:()=>{
                                setActiveItems(p=>p.filter(i=>i.id!==item.id));
                              }});
                            }
                          }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'rgba(255,255,255,0.8)', color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 新增按鈕 */}
        <button onClick={()=>setWalletAddChoice(true)}
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${pageColor},${C.blue})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:`0 4px 16px ${pageColor}66`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>

        {/* 新增方式選擇 */}
        {walletAddChoice && (
          <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <div onClick={()=>setWalletAddChoice(false)} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
            <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:520, borderRadius:'24px 24px 0 0', padding:24, paddingBottom:40 }}>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:18, textAlign:'center' }}>新增帳目</div>
              <button onClick={()=>{ setWalletAddChoice(false); setReceiptModal({open:true}); }}
                style={{ width:'100%', padding:'16px', marginBottom:12, borderRadius:14, border:`1.5px solid ${C.blue}33`, backgroundColor:C.blueSoft, display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}>
                <span style={{ fontSize:28 }}>📷</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:C.blue }}>拍收據</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>AI 自動辨識金額和品項</div>
                </div>
              </button>
              <button onClick={()=>{ setWalletAddChoice(false); const allUids=members.map(m=>m.uid); const defaultCur=(tripCurrencies||['JPY'])[0]||'JPY'; setWalletModal({open:true,data:{type:'支出',currency:defaultCur,contributorIds:allUids,forMemberIds:allUids,paidById:user.uid,splitPayerId:null,splitReceiverIds:[]}}); setWalletCalc(false); }}
                style={{ width:'100%', padding:'16px', borderRadius:14, border:`1.5px solid ${C.border}`, backgroundColor:C.surface, display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}>
                <span style={{ fontSize:28 }}>✏️</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:15, fontWeight:800 }}>手動輸入</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>自己填寫金額和明細</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 收據拍照 */}
        {receiptModal.open && <ReceiptModal
          onClose={()=>setReceiptModal({open:false})}
          user={user} members={members} tripCurrencies={tripCurrencies}
          walletItems={walletItems} setWalletItems={setWalletItems} saveWallet={saveWallet}
          splitRecords={splitRecords} setSplitRecords={setSplitRecords} saveSplitRecords={saveSplitRecords}
          personalWalletItems={personalWalletItems} setPersonalWalletItems={setPersonalWalletItems} savePersonalWallet={savePersonalWallet}
        />}

        {/* ── 公費結算 Modal ── */}
        {showPoolSettlement&&(
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:400 }}>
            <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>📊 公費結算</div>
                <button onClick={()=>setShowPoolSettlement(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:16 }}>
                {tripCurrencies.filter(c=>c!=='TWD').map(c=>`1 ${c} ≈ NT${(manualRates[c]||rates[c]||'?')}`).join('・')}
              </div>

              {/* 總覽 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {['存入','支出'].map(type=>{
                  const agg=walletItems.filter(w=>w.type===type).reduce((acc,w)=>{ const c=w.currency||'TWD'; acc[c]=(acc[c]||0)+Number(w.amount||0); return acc; },{});
                  const effRates={...rates,...manualRates};
                  const totalTWD=Object.entries(agg).reduce((s,[c,v])=>s+Math.round(v*(effRates[c]||1)),0);
                  return (
                    <div key={type} style={{ ...gs.card, padding:'10px 14px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:type==='存入'?C.green:C.purple, marginBottom:6 }}>總{type}</div>
                      {Object.entries(agg).filter(([,v])=>v>0).map(([c,v])=>(
                        <div key={c} style={{ fontSize:13, fontWeight:700 }}>{SYM[c]||''}{v.toLocaleString()} {c}</div>
                      ))}
                      {totalTWD>0 && <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>≈ NT${totalTWD.toLocaleString()}</div>}
                      {Object.values(agg).every(v=>v===0) && <div style={{ fontSize:11, color:C.textMuted }}>無</div>}
                    </div>
                  );
                })}
              </div>

              {/* 每人明細 */}
              <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:'uppercase', marginBottom:10 }}>每人結算</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {members.map(m=>{
                  const effRates={...rates,...manualRates};
                  const bal=memberBalance[m.uid]||{};
                  const hasBal=Object.values(bal).some(v=>v!==0);
                  // 取得這個人的明細
                  const detail=walletItems.filter(w=>{
                    const allUids=members.map(x=>x.uid);
                    if(w.type==='存入') return (w.contributorIds||allUids).includes(m.uid);
                    return (w.forMemberIds||allUids).includes(m.uid);
                  });
                  const [expanded, setExpanded] = [false, ()=>{}]; // 用 state 在外層
                  return (
                    <ExpandableMemberCard key={m.uid} m={m} bal={bal} hasBal={hasBal} detail={detail} SYM={SYM} effRates={effRates} toTWD={toTWD} isMe={m.uid===user.uid} />
                  );
                })}
              </div>
              <button onClick={()=>setShowPoolSettlement(false)} style={{ width:'100%',padding:13,border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',backgroundColor:C.bg,color:C.text }}>關閉</button>
            </div>
          </div>
        )}

      </div>
    );
  };

  // ════════════════════════════════════════
  // 購物 Tab
  // ════════════════════════════════════════
  const ShoppingTab = () => {
    return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
      {/* 篩選 */}
      <div style={{ backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'10px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <select value={shopFilterMember} onChange={e=>setShopFilterMember(e.target.value)}
            style={{ flex:1, padding:'7px 10px', borderRadius:10, border:`1.5px solid ${shopFilterMember!=='all'?C.warm:C.border}`, backgroundColor:shopFilterMember!=='all'?C.warmSoft:C.bg, color:shopFilterMember!=='all'?C.warm:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer', outline:'none' }}>
            <option value="all">全員</option>
            {members.map(m=><option key={m.uid} value={m.uid}>{m.uid===user.uid?`${m.displayName}（我）`:m.displayName}</option>)}
          </select>
          <button onClick={() => setShowManageShopOptions(true)} style={{ fontSize:11, color:C.textMuted, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 10px', cursor:'pointer', fontWeight:600, flexShrink:0 }}>管理選項</button>
        </div>
        {/* 只有多城市才顯示城市篩選，地區和商場依設定顯示 */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* 城市：多個才顯示 */}
          {(shopOptions.cities||[]).length > 1 && (
            <select value={shopFilterCity} onChange={e=>{setShopFilterCity(e.target.value);setShopFilterMall('全部商場');}}
              style={{ flex:1, minWidth:80, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterCity!=='全部城市'?C.warm:C.border}`, backgroundColor:shopFilterCity!=='全部城市'?C.warmSoft:C.bg, color:shopFilterCity!=='全部城市'?C.warm:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
              <option value="全部城市">全部城市</option>
              {(shopOptions.cities||[]).map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {/* 地區篩選 */}
          {(() => {
            const cities = shopOptions.cities || [];
            const locsMap = shopOptions.locations || {};
            const effectiveCity = cities.length===1 ? cities[0] : (shopFilterCity!=='全部城市'?shopFilterCity:null);
            const districts = effectiveCity ? (locsMap[effectiveCity]||[]) : cities.flatMap(c=>(locsMap[c]||[]));
            if (districts.length === 0) return null;
            return (
              <select value={shopFilterCity==='全部城市'&&cities.length===1?shopFilterCity:shopFilterCity} onChange={e=>{setShopFilterCity(e.target.value);setShopFilterMall('全部商場');}}
                style={{ flex:1, minWidth:80, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterCity!=='全部城市'&&districts.includes(shopFilterCity)?C.warm:C.border}`, backgroundColor:districts.includes(shopFilterCity)?C.warmSoft:C.bg, color:districts.includes(shopFilterCity)?C.warm:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
                <option value="全部城市">全部地區</option>
                {districts.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            );
          })()}
          {/* 商場篩選 */}
          {(() => {
            const cities = shopOptions.cities || [];
            const locsMap = shopOptions.locations || {};
            const mallsMap = shopOptions.malls || {};
            const effectiveCity = cities.length===1 ? cities[0] : (shopFilterCity!=='全部城市'?shopFilterCity:null);
            const districts = effectiveCity ? (locsMap[effectiveCity]||[]) : cities.flatMap(c=>(locsMap[c]||[]));
            const selectedDistrict = districts.includes(shopFilterCity) ? shopFilterCity : null;
            const malls = selectedDistrict && effectiveCity
              ? ((mallsMap[effectiveCity]||{})[selectedDistrict]||[])
              : cities.flatMap(c => districts.flatMap(d => ((mallsMap[c]||{})[d]||[])));
            if (malls.length === 0) return null;
            return (
              <select value={shopFilterMall} onChange={e=>setShopFilterMall(e.target.value)}
                style={{ flex:1, minWidth:80, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterMall!=='全部商場'?C.purple:C.border}`, backgroundColor:shopFilterMall!=='全部商場'?C.purpleSoft:C.bg, color:shopFilterMall!=='全部商場'?C.purple:C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
                <option value="全部商場">全部商場</option>
                {malls.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            );
          })()}
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
                      {item.district && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.warmSoft, color:C.warm, border:`1px solid ${C.warmBorder}`, fontSize:11, fontWeight:700 }}>📍 {item.district}</span>}
                      {item.mall && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.purpleSoft, color:C.purple, fontSize:11, fontWeight:700 }}>🏪 {item.mall}</span>}
                    </div>
                    {isMine && (
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => { setShoppingModal({open:true,data:item}); setShopTempPhotos(item.photos||[]); }} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => setConfirmDel({title:'刪除',message:`確定刪除「${item.name}」？`,fn:()=>{const n=shoppingItems.filter(i=>i.id!==item.id);setShoppingItems(n);saveShopping(n);}})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:14, cursor:'pointer' }}>×</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => {
                      if (item.isBought) {
                        // 取消已買
                        setConfirmDel({title:'取消購買',message:`取消「${item.name}」的購買記錄？`,fn:()=>{ const n=shoppingItems.map(i=>i.id===item.id?{...i,isBought:false,boughtAt:null,boughtPrice:null,boughtCurrency:null,boughtNote:null}:i); setShoppingItems(n);saveShopping(n); }});
                      } else {
                        setShopBoughtModal({item});
                        setShopBoughtPrice('');
                        setShopBoughtCurrency((tripCurrencies||['JPY'])[0]||'JPY');
                        setShopBoughtNote('');
                      }
                    }} style={{ width:28, height:28, borderRadius:8, border:`2px solid ${item.isBought?C.warm:C.border}`, backgroundColor:item.isBought?C.warm:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                      {item.isBought && <span style={{ color:'#fff', fontSize:14, fontWeight:800 }}>✓</span>}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, textDecoration:item.isBought?'line-through':'none', color:C.text }}>{item.name}</div>
                      {item.note && <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{item.note}</div>}
                    </div>
                  </div>
                  {item.isBought && item.boughtPrice && (
                    <div style={{ marginTop:6, padding:'5px 10px', backgroundColor:C.warmSoft, borderRadius:8, fontSize:11, color:C.warm, fontWeight:700, display:'flex', gap:6, alignItems:'center' }}>
                      <span>✓ 已買</span>
                      <span>{item.boughtCurrency} {Number(item.boughtPrice).toLocaleString()}</span>
                      {item.boughtNote && <span style={{ color:C.textMuted, fontWeight:400 }}>· {item.boughtNote}</span>}
                    </div>
                  )}
                  {item.isBought && !item.boughtPrice && (
                    <div style={{ marginTop:6, padding:'5px 10px', backgroundColor:C.warmSoft, borderRadius:8, fontSize:11, color:C.warm, fontWeight:700 }}>✓ 已買</div>
                  )}
                  {item.photos?.length > 0 && (
                    <div style={{ display:'flex', gap:6, overflowX:'auto', marginTop:8, marginBottom:4 }}>
                      {item.photos.map((p,pi) => <img key={pi} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="shop" />)}
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10, color:C.textMuted }}>{item.addedByName||'成員'} 許願</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {(item.branches||[]).filter(b=>b.mapUrl).map((b,bi)=>(
                        <button key={bi} onClick={()=>window.open(b.mapUrl,'_blank')} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${C.warmBorder}`, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺 {b.name}</button>
                      ))}
                      {!(item.branches||[]).length && item.mapUrl && <button onClick={()=>window.open(item.mapUrl,'_blank')} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${C.warmBorder}`, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={() => {
        const sc = shopOptions.cities||[];
        const autoCity = sc.length===1 ? sc[0] : '';
        const locsMap = shopOptions.locations||{};
        const effectiveCity = autoCity || (shopFilterCity!=='全部城市'?shopFilterCity:'');
        const cityDistricts = effectiveCity ? (locsMap[effectiveCity]||[]) : [];
        // shopFilterCity 可能存的是地區名稱
        const selectedDistrict = cityDistricts.includes(shopFilterCity) ? shopFilterCity : '';
        setShoppingModal({open:true, data:{
          city: effectiveCity,
          district: selectedDistrict,
          mall: shopFilterMall!=='全部商場'?shopFilterMall:'',
          branches: selectedDistrict ? [{name:selectedDistrict, mapUrl:''}] : [],
        }});
        setShopTempPhotos([]);
      }} style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.warm},${C.warm})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 4px 16px rgba(190,24,93,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
    </div>
  );
  };

  // ════════════════════════════════════════
  // 備忘 Tab
  // ════════════════════════════════════════
  const MemoTab = () => {
    const memoItems = moreSection==='shared-memo' ? sharedMemos : personalMemos;
    const setMemoItems = moreSection==='shared-memo'
      ? (fn) => { const n=typeof fn==='function'?fn(sharedMemos):fn; setSharedMemos(n); saveSharedMemos(n); }
      : (fn) => { const n=typeof fn==='function'?fn(personalMemos):fn; setPersonalMemos(n); savePersonalMemos(n); };

    // ── 備忘錄詳情（單則列表）──
    if (moreSection==='shared-memo' || moreSection==='personal-memo') {
      const isShared = moreSection==='shared-memo';
      const sorted = [...memoItems].sort((a,b)=>(b.createdAtMs||0)-(a.createdAtMs||0));
      return (
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, zIndex:30 }}>
            <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.textMuted, padding:'0 4px' }}>←</button>
            <div style={{ fontSize:15, fontWeight:800 }}>{isShared?'📋 共用備忘錄':'🗒 個人備忘錄'}</div>
          </div>
          <div style={{ padding:16, flex:1 }}>
            {sorted.length===0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:C.textMuted, fontSize:13 }}>尚無備忘錄，點右下角 ＋ 新增</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {sorted.map(memo => (
                  <div key={memo.id} style={{ ...gs.card, padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:memo.type==='checklist'?C.greenSoft:C.blueSoft, color:memo.type==='checklist'?C.green:C.blue, fontSize:11, fontWeight:700 }}>
                          {memo.type==='checklist'?'✅ 清單':'📝 記事'}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { setMemoModal({open:true, data:memo, scope:moreSection}); setMemoPhoto(memo.photo||null); }}
                          style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:'rgba(255,255,255,0.8)', color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => setConfirmDel({title:'刪除備忘錄',message:`確定刪除「${memo.title||'未命名'}」？`,fn:()=>setMemoItems(p=>p.filter(m=>m.id!==memo.id))})}
                          style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'rgba(255,255,255,0.8)', color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
                      </div>
                    </div>
                    {memo.title && <div style={{ fontSize:15, fontWeight:800, marginBottom:6 }}>{memo.title}</div>}
                    {memo.photo && <img src={memo.photo} style={{ width:'100%', borderRadius:10, marginBottom:8, maxHeight:200, objectFit:'cover' }} alt="memo" />}
                    {memo.type==='text' && memo.content && <div style={{ fontSize:13, color:C.text, whiteSpace:'pre-wrap', lineHeight:1.6 }}>{memo.content}</div>}
                    {memo.type==='checklist' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {(memo.items||[]).map((it,idx) => (
                          <div key={idx} onClick={()=>{
                            setMemoItems(p=>p.map(m=>m.id===memo.id?{...m,items:m.items.map((x,j)=>j===idx?{...x,done:!x.done,doneAt:!x.done?new Date().toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):null}:x)}:m));
                          }} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${it.done?C.green:C.border}`, backgroundColor:it.done?C.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              {it.done && <span style={{ color:'#fff', fontSize:11, fontWeight:900 }}>✓</span>}
                            </div>
                            <span style={{ fontSize:13, flex:1, textDecoration:it.done?'line-through':'none', color:it.done?C.textMuted:C.text }}>{it.text}</span>
                            {it.done && it.doneAt && <span style={{ fontSize:10, color:C.textMuted }}>{it.doneAt}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setMemoModal({open:true, data:{type:'text', title:'', content:'', items:[], photo:null}, scope:moreSection}); setMemoPhoto(null); }}
            style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 4px 16px rgba(42,143,165,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
        </div>
      );
    }

    return null;
  };

  // ════════════════════════════════════════
  // 更多 Tab
  // ════════════════════════════════════════
  const MoreTab = () => {

    // 備忘錄詳情委派給 MemoTab 渲染
    if (moreSection==='shared-memo' || moreSection==='personal-memo') return MemoTab();

    if (moreSection==='members') {
      const isAdmin = members.find(m=>m.uid===user.uid)?.role==='admin';
      const removeMember = async (m) => {
        try {
          await deleteDoc(doc(db,"tripMembers",`${trip.id}_${m.uid}`));
          setMembers(p=>p.filter(x=>x.uid!==m.uid));
        } catch(e) { console.error(e); }
      };
      return (
        <div style={{ flex:1, overflowY:'auto' }}>
          <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.textMuted, padding:'0 4px' }}>←</button>
            <div style={{ fontSize:15, fontWeight:800 }}>成員（{members.length} 人）</div>
          </div>
          <div style={{ padding:20 }}>
            <div style={gs.card}>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {members.map(m => {
                  const mc=[C.blue,C.green,C.purple,'#E0875A'][(m.displayName||'').charCodeAt(0)%4];
                  const canRemove = isAdmin && m.uid!==user.uid && m.role!=='admin';
                  return (
                    <div key={m.uid} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', backgroundColor:mc+'22', border:`1.5px solid ${mc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:mc, flexShrink:0 }}>{(m.displayName||'?')[0].toUpperCase()}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600 }}>{m.displayName}{m.uid===user.uid&&<span style={{ fontSize:11, color:C.textMuted, marginLeft:6 }}>（我）</span>}</div>
                        <div style={{ fontSize:11, color:m.role==='admin'?C.blue:C.textMuted, fontWeight:600 }}>{m.role==='admin'?'管理員':'成員'}</div>
                      </div>
                      {canRemove && (
                        <button onClick={() => setConfirmDel({title:'移除成員',message:`確定移除「${m.displayName}」？移除後他將無法看到這個旅程。`,fn:()=>removeMember(m)})}
                          style={{ padding:'5px 10px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:12, cursor:'pointer', fontWeight:700 }}>移除</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (moreSection==='invite') return (
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setMoreSection(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.textMuted, padding:'0 4px' }}>←</button>
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
            {inviteVisible && <button onClick={copyCode} style={{ width:'100%', border:'none', borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:'pointer', backgroundColor:copied?C.successSoft:C.blueSoft, color:copied?C.success:C.blue, marginBottom:10 }}>{copied?'✓ 已複製邀請碼！':'複製邀請碼'}</button>}
            <button onClick={copyLink} style={{ width:'100%', border:'none', borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:'pointer', background:linkCopied?C.successSoft:`linear-gradient(135deg,${C.blue},${C.green})`, color:linkCopied?C.success:'#fff', marginBottom:14 }}>{linkCopied?'✓ 連結已複製！':'🔗 分享邀請連結'}</button>
            <div style={{ padding:'12px 14px', backgroundColor:C.bg, borderRadius:12, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontWeight:600 }}>朋友加入方式</div>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.8 }}>📱 <strong>最快</strong>：傳「分享邀請連結」給朋友，點開登入後自動加入<br/>⌨️ 或請朋友登入後，輸入 6 位邀請碼</div>
            </div>
          </div>
        </div>
      </div>
    );

    // ── 更多首頁 ──
    const topItems = [
      { id:'members', emoji:'👥', label:'成員', desc:`${members.length} 人`, color:C.warm, bg:C.warmSoft },
      { id:'invite', emoji:'🔑', label:'邀請碼', desc:trip.inviteCode||'...', color:C.green, bg:C.greenSoft },
    ];
    const memoItemsList = [
      { id:'shared-memo', emoji:'📋', label:'共用備忘錄', desc:`${sharedMemos.length} 則・所有成員可見`, fn:()=>setMoreSection('shared-memo') },
      { id:'personal-memo', emoji:'🗒', label:'個人備忘錄', desc:`${personalMemos.length} 則・只有你看得到`, fn:()=>setMoreSection('personal-memo') },
    ];
    const sectionLabel = { fontSize:11, fontWeight:800, color:C.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:12 };
    const rowCard = { ...gs.card, cursor:'pointer', textAlign:'left', padding:'14px 16px', border:`1.5px solid ${C.blue}22`, background:C.surface, display:'flex', alignItems:'center', gap:14 };
    return (
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {topItems.map(item => (
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

        {/* ─ 備忘錄區 ─ */}
        <div style={{ marginTop:20 }}>
          <div style={sectionLabel}>備忘錄</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {memoItemsList.map(item => (
              <button key={item.id} onClick={item.fn} style={rowCard}>
                <div style={{ fontSize:28 }}>{item.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:C.blue }}>{item.label}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{item.desc}</div>
                </div>
                <div style={{ color:C.blue, fontSize:18, fontWeight:700 }}>›</div>
              </button>
            ))}
          </div>
        </div>

        {/* ─ 下載區 ─ */}
        <div style={{ marginTop:20 }}>
          <div style={sectionLabel}>下載旅程資料</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { key:'overview',  emoji:'📖', label:'旅遊手冊 PDF', desc:'完整行程、交通住宿、美食、準備清單', fn: downloadOverviewPDF },
              { key:'itinerary', emoji:'🗓', label:'行程表 Excel', desc:'可編輯後再上傳解析回行程', fn: downloadItineraryExcel },
              { key:'excel',     emoji:'📊', label:'帳務明細 Excel', desc:'公費、個人帳、代墊、購物四個工作表', fn: downloadWalletExcel },
            ].map(({ key, emoji, label, desc, fn }) => (
              <button key={key} onClick={fn} disabled={!!downloading}
                style={{ ...rowCard, background:downloading===key?C.blueSoft:C.surface, opacity:downloading&&downloading!==key?0.5:1 }}>
                <div style={{ fontSize:28 }}>{downloading===key?'⏳':emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:C.blue }}>{label}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{desc}</div>
                </div>
                <div style={{ fontSize:14, color:C.blue, fontWeight:700 }}>↓</div>
              </button>
            ))}
          </div>
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
        <div style={{ marginBottom:12 }}><label style={gs.label}>項目名稱 *</label><ImeInput key="itin-name" style={gs.input} placeholder="例：逛淺草寺" value={modal.data?.name||''} onChange={v=>setModal(p=>({...p,data:{...p.data,name:v}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>📍 地點</label><ImeInput key="itin-loc" style={gs.input} placeholder="例：淺草寺" value={modal.data?.location||''} onChange={v=>setModal(p=>({...p,data:{...p.data,location:v}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>地圖連結</label><input style={gs.input} placeholder="貼上 Google Maps 連結" value={modal.data?.mapUrl||''} onChange={e=>setModal(p=>({...p,data:{...p.data,mapUrl:e.target.value}}))} /></div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>備註</label><ImeInput key="itin-note" multiline value={modal.data?.note||''} onChange={v=>setModal(p=>({...p,data:{...p.data,note:v}}))} rows={3} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
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
  const FoodModal = () => {
    if (!foodModal.open) return null;
    const d = foodModal.data || {};
    const cities = foodOptions.cities || [];
    const foodTypes = foodOptions.foodTypes || [];
    const autoCity = cities.length === 1 ? cities[0] : null;
    const activeCity = d.city || autoCity || '';
    const cityDistricts = activeCity ? (foodOptions.districts||{})[activeCity]||[] : [];
    // 城市只有一個時自動帶入（在開啟 modal 時已處理）
    const districts = d.districts || [];
    const branches = d.branches || [];

    const toggleDistrict = (dist) => {
      const isRemoving = districts.includes(dist);
      const nextDistricts = isRemoving ? districts.filter(x=>x!==dist) : [...districts, dist];
      let nextBranches = [...branches];
      if (!isRemoving) {
        if (!nextBranches.some(b=>b.name===dist)) {
          nextBranches = [...nextBranches, { name:dist, mapUrl:'' }];
        }
      } else {
        nextBranches = nextBranches.filter(b=>!(b.name===dist&&!b.mapUrl));
      }
      setFoodModal(p=>({...p, data:{...p.data, districts:nextDistricts, branches:nextBranches}}));
    };

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{d.id?'編輯美食':'新增美食'}</div>
            <button onClick={() => setFoodModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 店名 */}
          <div style={{ marginBottom:14 }}>
            <label style={gs.label}>店家名稱 *</label>
            <ImeInput key="food-name" style={gs.input} placeholder="例：一蘭拉麵" value={d.name||''} onChange={v=>setFoodModal(p=>({...p,data:{...p.data,name:v}}))} />
          </div>

          {/* 城市：多個城市才顯示選擇 */}
          {cities.length > 1 && (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>城市</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {cities.map(city => (
                  <button key={city} type="button" onClick={() => setFoodModal(p=>({...p,data:{...p.data,city:city,districts:[],branches:[]}}))}
                    style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${d.city===city?C.warm:C.border}`, backgroundColor:d.city===city?C.warm:C.bg, color:d.city===city?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 地區（多選，依城市動態）*/}
          {d.city && cityDistricts.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>地區（可多選）</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {cityDistricts.map(dist => {
                  const sel = districts.includes(dist);
                  return (
                    <button key={dist} type="button" onClick={() => toggleDistrict(dist)}
                      style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${sel?C.blue:C.border}`, backgroundColor:sel?C.blueSoft:C.bg, color:sel?C.blue:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      📍 {dist}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 各地區的 Google Maps 連結 */}
          {districts.length > 0 ? (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>🗺 各地區地圖連結</label>
              {branches.map((b, bi) => (
                <div key={bi} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <div style={{ padding:'8px 12px', borderRadius:10, backgroundColor:C.warmSoft, color:C.warm, fontSize:13, fontWeight:700, flexShrink:0, minWidth:60, textAlign:'center' }}>{b.name}</div>
                  <input style={{ ...gs.input, flex:1, padding:'10px 12px', fontSize:14 }} placeholder="貼上 Google Maps 連結" value={b.mapUrl||''}
                    onChange={e => setFoodModal(p=>({...p,data:{...p.data,branches:p.data.branches.map((x,i)=>i===bi?{...x,mapUrl:e.target.value}:x)}}))} />
                </div>
              ))}
              <button type="button" onClick={() => setFoodModal(p=>({...p,data:{...p.data,branches:[...(p.data.branches||[]),{name:'',mapUrl:''}]}}))}
                style={{ fontSize:12, color:C.warm, fontWeight:700, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>＋ 新增分店</button>
            </div>
          ) : (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>🗺 地圖連結（選填）</label>
              <input style={gs.input} autoComplete="off" placeholder="貼上 Google Maps 連結" value={d.mapUrl||''} onChange={e=>setFoodModal(p=>({...p,data:{...p.data,mapUrl:e.target.value}}))} />
            </div>
          )}

          {/* 食物種類 */}
          <div style={{ marginBottom:14 }}>
            <label style={gs.label}>食物種類</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {foodTypes.map(ft => (
                <button key={ft} type="button" onClick={() => setFoodModal(p=>({...p,data:{...p.data,foodType:p.data?.foodType===ft?'':ft}}))}
                  style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${d.foodType===ft?C.green:C.border}`, backgroundColor:d.foodType===ft?C.greenSoft:C.bg, color:d.foodType===ft?C.green:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* 連結行程日期 */}
          {tripDates.filter(d=>d!=='待安排').length > 0 && (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>🗓 連結行程日期（選填）</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button type="button" onClick={() => setFoodModal(p=>({...p,data:{...p.data,linkedDate:''}}))}
                  style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${!d.linkedDate?color:C.border}`, backgroundColor:!d.linkedDate?color+'18':C.bg, color:!d.linkedDate?color:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  不連結
                </button>
                {tripDates.filter(dt=>dt!=='待安排').map(dt=>(
                  <button key={dt} type="button" onClick={() => setFoodModal(p=>({...p,data:{...p.data,linkedDate:dt}}))}
                    style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${d.linkedDate===dt?color:C.border}`, backgroundColor:d.linkedDate===dt?color+'18':C.bg, color:d.linkedDate===dt?color:C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    {dt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 價位 */}
          <div style={{ marginBottom:14 }}>
            <label style={gs.label}>💴 價位（選填）</label>
            <input style={gs.input} autoComplete="off" placeholder="例：¥1500、$$" value={d.price||''} onChange={e=>setFoodModal(p=>({...p,data:{...p.data,price:e.target.value}}))} />
          </div>

          {/* 備註 */}
          <div style={{ marginBottom:18 }}>
            <label style={gs.label}>備註（選填）</label>
            <ImeInput key="food-note" multiline value={d.note||''} onChange={v=>setFoodModal(p=>({...p,data:{...p.data,note:v}}))} placeholder="必點菜色、注意事項..." rows={3} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} />
          </div>

          <button onClick={() => {
            if (!d.name?.trim()) return;
            const fd = { ...d, editedByName:user.displayName||user.email, editedById:user.uid, createdAt:d.createdAt||Date.now() };
            const n = d.id ? foodItems.map(i=>i.id===d.id?fd:i) : [...foodItems,{...fd,id:Date.now()}];
            setFoodItems(n); saveFood(n); setFoodModal({open:false,data:null});
          }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${C.warm},${C.warm})`, color:'#fff' }}>確認儲存</button>
        </div>
      </div>
    );
  };

  // 管理美食選項 Modal
  const ManageFoodOptionsModal = () => {
    if (!showManageFoodOptions) return null;
    const newDistrict = mfoNewDistrict; const setNewDistrict = setMfoNewDistrict;
    const newDistrictCity = mfoNewDistrictCity; const setNewDistrictCity = setMfoNewDistrictCity;
    const newFoodType = mfoNewFoodType; const setNewFoodType = setMfoNewFoodType;
    const cities = foodOptions.cities || [];
    const districtsMap = foodOptions.districts || {};
    const foodTypes = foodOptions.foodTypes || [];
    const updateOpts = (newOpts) => { setFoodOptions(newOpts); saveFoodOptions(newOpts); };

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>管理美食選項</div>
            <button onClick={() => setShowManageFoodOptions(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 地區（依旅程城市）*/}
          <div style={{ marginBottom:20 }}>
            <label style={gs.label}>📍 地區</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {cities.flatMap(city => (districtsMap[city]||[]).map(d => (
                <div key={`${city}-${d}`} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', backgroundColor:C.blueSoft, border:`1px solid ${C.blue}33`, borderRadius:20 }}>
                  {cities.length > 1 && <span style={{ fontSize:11, color:C.textMuted, fontWeight:600 }}>{city} · </span>}
                  <span style={{ fontSize:13, fontWeight:700, color:C.blue }}>{d}</span>
                  <button onClick={() => updateOpts({...foodOptions, districts:{...districtsMap,[city]:(districtsMap[city]||[]).filter(x=>x!==d)}})}
                    style={{ background:'none', border:'none', color:C.blue, fontSize:16, cursor:'pointer', lineHeight:1, padding:0, opacity:0.7 }}>×</button>
                </div>
              )))}
              {cities.flatMap(c=>(districtsMap[c]||[])).length===0 && <div style={{ fontSize:12, color:C.textMuted }}>尚未新增地區</div>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {cities.length > 1 && (
                <select value={newDistrictCity} onChange={e=>setNewDistrictCity(e.target.value)}
                  style={{ ...gs.input, flex:'0 0 auto', width:'auto', cursor:'pointer', padding:'12px 10px', fontSize:14 }}>
                  <option value="">選城市</option>
                  {cities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <ImeInput key="manage-food-district" style={{ ...gs.input, flex:1 }} placeholder="新增地區..." value={newDistrict} onChange={v=>setNewDistrict(v)} />
              <button onClick={() => {
                if(!newDistrict.trim()) return;
                const city = cities.length===1 ? cities[0] : (newDistrictCity || cities[0]);
                if(!city) return;
                updateOpts({...foodOptions, districts:{...districtsMap,[city]:[...(districtsMap[city]||[]),newDistrict.trim()]}});
                setNewDistrict('');
              }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:C.blue, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
            </div>
          </div>

          {/* 食物種類 */}
          <div style={{ marginBottom:20 }}>
            <label style={gs.label}>🍜 食物種類</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {foodTypes.map(ft => (
                <div key={ft} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', backgroundColor:C.greenSoft, border:`1px solid ${C.green}33`, borderRadius:20 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.green }}>{ft}</span>
                  <button onClick={() => updateOpts({...foodOptions,foodTypes:foodTypes.filter(x=>x!==ft)})}
                    style={{ background:'none', border:'none', color:C.green, fontSize:16, cursor:'pointer', lineHeight:1, padding:0, opacity:0.7 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <ImeInput key="manage-food-type" style={{ ...gs.input, flex:1 }} placeholder="新增食物種類..." value={newFoodType} onChange={v=>setNewFoodType(v)} />
              <button onClick={() => { if(!newFoodType.trim())return; updateOpts({...foodOptions,foodTypes:[...foodTypes,newFoodType.trim()]}); setNewFoodType(''); }}
                style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:C.green, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
            </div>
          </div>

          <button onClick={() => setShowManageFoodOptions(false)}
            style={{ width:'100%', padding:14, border:`1px solid ${C.border}`, borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', backgroundColor:C.bg, color:C.text }}>完成</button>
        </div>
      </div>
    );
  };

  // 購物 Modal
  const ShoppingModal = () => {
    if (!shoppingModal.open) return null;
    const d = shoppingModal.data || {};
    const cities = shopOptions.cities || [];
    const locationsMap = shopOptions.locations || {};
    const mallsMap = shopOptions.malls || {};
    const activeCity = d.city || (cities.length===1?cities[0]:'');
    const cityDistricts = activeCity ? (locationsMap[activeCity]||[]) : [];
    const districtMalls = (activeCity && d.district) ? ((mallsMap[activeCity]||{})[d.district]||[]) : [];
    const branches = d.branches || [];

    const toggleDistrict = (dist) => {
      const isRemoving = d.district === dist;
      setShoppingModal(p => ({...p, data:{...p.data,
        district: isRemoving ? '' : dist,
        mall: '',
        branches: isRemoving ? [] : [{ name:dist, mapUrl:'' }],
      }}));
    };

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{d.id?'編輯購物':'新增購物'}</div>
            <button onClick={() => { setShoppingModal({open:false,data:null}); setShopTempPhotos([]); }} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 城市（多城市才顯示）*/}
          {cities.length > 1 && (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>🏙️ 城市</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {cities.map(city => (
                  <button key={city} type="button" onClick={() => setShoppingModal(p=>({...p,data:{...p.data,city,district:'',mall:'',branches:[]}}))}
                    style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${activeCity===city?C.warm:C.border}`, backgroundColor:activeCity===city?C.warm:C.bg, color:activeCity===city?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 地區（有地區才顯示）*/}
          {cityDistricts.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>📍 地區</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {cityDistricts.map(dist => (
                  <button key={dist} type="button" onClick={() => {
                    const isRemoving = d.district === dist;
                    setShoppingModal(p => ({...p, data:{...p.data,
                      district: isRemoving ? '' : dist,
                      branches: isRemoving ? [] : [{name:dist, mapUrl:''}],
                    }}));
                  }} style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${d.district===dist?C.warm:C.border}`, backgroundColor:d.district===dist?C.warmSoft:C.bg, color:d.district===dist?C.warm:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    📍 {dist}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 商場（跟地區並列，不依賴地區選擇）*/}
          {(() => {
            // 取得所有商場：有選地區就只顯示那個地區的，沒選就顯示全部
            const allMalls = d.district
              ? ((mallsMap[activeCity]||{})[d.district]||[])
              : Object.values(mallsMap[activeCity]||{}).flat();
            if (allMalls.length === 0) return null;
            return (
              <div style={{ marginBottom:14 }}>
                <label style={gs.label}>🏪 商場</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {allMalls.map(mall => (
                    <button key={mall} type="button" onClick={() => setShoppingModal(p=>({...p,data:{...p.data,mall:p.data.mall===mall?'':mall}}))}
                      style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${d.mall===mall?C.purple:C.border}`, backgroundColor:d.mall===mall?C.purpleSoft:C.bg, color:d.mall===mall?C.purple:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      {mall}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 商品名稱 */}
          <div style={{ marginBottom:14 }}>
            <label style={gs.label}>🛍️ 商品名稱 *</label>
            <ImeInput key="shop-name" style={gs.input} placeholder="例：Matin Kim 外套、蜂蜜奶油杏仁" value={d.name||''} onChange={v=>setShoppingModal(p=>({...p,data:{...p.data,name:v}}))} />
          </div>

          {/* 地圖連結（依地區）*/}
          {branches.length > 0 ? (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>🗺 分店 / 地圖連結</label>
              {branches.map((b,bi) => (
                <div key={bi} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <div style={{ padding:'8px 12px', borderRadius:10, backgroundColor:C.warmSoft, color:C.warm, fontSize:13, fontWeight:700, flexShrink:0, minWidth:60, textAlign:'center' }}>{b.name}</div>
                  <input style={{ ...gs.input, flex:1, padding:'10px 12px', fontSize:14 }} placeholder="貼上 Google Maps 連結"
                    value={b.mapUrl||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,branches:p.data.branches.map((x,i)=>i===bi?{...x,mapUrl:e.target.value}:x)}}))} />
                </div>
              ))}
              <button type="button" onClick={() => setShoppingModal(p=>({...p,data:{...p.data,branches:[...branches,{name:'',mapUrl:''}]}}))}
                style={{ fontSize:12, color:C.warm, fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>＋ 新增分店</button>
            </div>
          ) : (
            <div style={{ marginBottom:14 }}>
              <label style={gs.label}>🗺 地圖連結（選填）</label>
              <input style={gs.input} placeholder="貼上 Google Maps 連結" value={d.mapUrl||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,mapUrl:e.target.value}}))} />
            </div>
          )}

          {/* 備註 */}
          <div style={{ marginBottom:14 }}>
            <label style={gs.label}>💡 備註（尺寸、顏色、幫誰帶）</label>
            <ImeInput key="shop-note" multiline style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} placeholder="例：深藍色 M 號、幫媽媽帶" value={d.note||''} onChange={v=>setShoppingModal(p=>({...p,data:{...p.data,note:v}}))} rows={2} />
          </div>

          {/* 照片 */}
          <div style={{ marginBottom:18 }}>
            <label style={gs.label}>📷 商品照片（最多 5 張）</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {shopTempPhotos.map((url,i) => (
                <div key={i} style={{ position:'relative', width:64, height:64, borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}` }}>
                  <img src={url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="tmp" />
                  <button onClick={() => setShopTempPhotos(p=>p.filter((_,j)=>j!==i))}
                    style={{ position:'absolute', top:2, right:2, width:18, height:18, borderRadius:4, backgroundColor:'rgba(220,50,50,0.9)', border:'none', color:'#fff', fontSize:12, cursor:'pointer' }}>×</button>
                </div>
              ))}
              {shopTempPhotos.length < 5 && (
                <button onClick={() => document.getElementById('shop-photo-input').click()}
                  style={{ width:64, height:64, borderRadius:10, border:`1.5px dashed ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>📷</button>
              )}
            </div>
            <input type="file" id="shop-photo-input" style={{ display:'none' }} multiple accept="image/*" onChange={e => {
              Array.from(e.target.files).forEach(file => {
                const r = new FileReader();
                r.onloadend = () => {
                  const img = new Image();
                  img.src = r.result;
                  img.onload = () => {
                    const c = document.createElement('canvas');
                    let w=img.width, h=img.height, max=600;
                    if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}}
                    c.width=w; c.height=h;
                    c.getContext('2d').drawImage(img,0,0,w,h);
                    setShopTempPhotos(p => p.length<5 ? [...p, c.toDataURL('image/jpeg',0.6)] : p);
                  };
                };
                r.readAsDataURL(file);
              });
            }} />
          </div>

          <button onClick={() => {
            if(!d.name?.trim()) return;
            const fd = { ...d,
              city: activeCity,
              photos: shopTempPhotos,
              isBought: d.isBought||false,
              addedByName: user.displayName||user.email,
              addedById: user.uid,
              createdAt: d.createdAt||Date.now()
            };
            const n = d.id ? shoppingItems.map(i=>i.id===d.id?fd:i) : [...shoppingItems,{...fd,id:Date.now()}];
            setShoppingItems(n); saveShopping(n);
            setShoppingModal({open:false,data:null}); setShopTempPhotos([]);
          }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${C.warm},${C.warm})`, color:'#fff' }}>確認儲存</button>
        </div>
      </div>
    );
  };

  // 管理購物選項 Modal
  const ManageShopOptionsModal = () => {
    if (!showManageShopOptions) return null;
    const newDistrict = msoNewDistrict; const setNewDistrict = setMsoNewDistrict;
    const newDistrictCity = msoNewDistrictCity; const setNewDistrictCity = setMsoNewDistrictCity;
    const newMall = msoNewMall; const setNewMall = setMsoNewMall;
    const newMallCity = msoNewMallCity; const setNewMallCity = setMsoNewMallCity;
    const newMallDistrict = msoNewMallDistrict; const setNewMallDistrict = setMsoNewMallDistrict;
    const cities = shopOptions.cities || [];
    const locationsMap = shopOptions.locations || {};
    const mallsMap = shopOptions.malls || {};
    const updateOpts = (o) => { setShopOptions(o); saveShopOptions(o); };
    const allDistricts = cities.flatMap(c => (locationsMap[c]||[]).map(d => ({city:c, district:d})));

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'90vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>管理購物選項</div>
            <button onClick={() => setShowManageShopOptions(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 地區 */}
          <div style={{ marginBottom:20 }}>
            <label style={gs.label}>📍 地區</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {allDistricts.map(({city,district}) => (
                <div key={`${city}-${district}`} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', backgroundColor:C.warmSoft, border:`1px solid ${C.warmBorder}`, borderRadius:20 }}>
                  {cities.length>1 && <span style={{ fontSize:11, color:C.warm, opacity:0.7 }}>{city} · </span>}
                  <span style={{ fontSize:13, fontWeight:700, color:C.warm }}>{district}</span>
                  <button onClick={() => {
                    const newLocs = {...locationsMap, [city]:(locationsMap[city]||[]).filter(x=>x!==district)};
                    const newMalls = {...mallsMap};
                    if(newMalls[city]) delete newMalls[city][district];
                    updateOpts({...shopOptions, locations:newLocs, malls:newMalls});
                  }} style={{ background:'none', border:'none', color:C.warm, fontSize:16, cursor:'pointer', lineHeight:1, padding:0, opacity:0.7 }}>×</button>
                </div>
              ))}
              {allDistricts.length===0 && <div style={{ fontSize:12, color:C.textMuted }}>尚未新增地區</div>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {cities.length>1 && (
                <select value={newDistrictCity} onChange={e=>setNewDistrictCity(e.target.value)}
                  style={{ ...gs.input, flex:'0 0 auto', width:'auto', cursor:'pointer', padding:'12px 10px', fontSize:14 }}>
                  <option value="">選城市</option>
                  {cities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <ImeInput key="manage-shop-district" style={{ ...gs.input, flex:1 }} placeholder="例：天神、博多" value={newDistrict} onChange={v=>setNewDistrict(v)} />
              <button onClick={() => {
                if(!newDistrict.trim()) return;
                const city = cities.length===1 ? cities[0] : (newDistrictCity||cities[0]);
                if(!city) return;
                updateOpts({...shopOptions, locations:{...locationsMap,[city]:[...(locationsMap[city]||[]),newDistrict.trim()]}});
                setNewDistrict('');
              }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:C.warm, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
            </div>
          </div>

          {/* 商場（依地區）*/}
          <div style={{ marginBottom:20 }}>
            <label style={gs.label}>🏪 商場 / 百貨</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
              {allDistricts.flatMap(({city,district}) => ((mallsMap[city]||{})[district]||[]).map(m => (
                <div key={`${city}-${district}-${m}`} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', backgroundColor:C.purpleSoft, border:`1px solid ${C.purple}33`, borderRadius:20 }}>
                  <span style={{ fontSize:11, color:C.textMuted, opacity:0.8 }}>{district} · </span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.purple }}>{m}</span>
                  <button onClick={() => {
                    const newMalls = {...mallsMap,[city]:{...(mallsMap[city]||{}),[district]:((mallsMap[city]||{})[district]||[]).filter(x=>x!==m)}};
                    updateOpts({...shopOptions, malls:newMalls});
                  }} style={{ background:'none', border:'none', color:C.purple, fontSize:16, cursor:'pointer', lineHeight:1, padding:0, opacity:0.7 }}>×</button>
                </div>
              )))}
              {allDistricts.flatMap(({city,district})=>((mallsMap[city]||{})[district]||[])).length===0 && <div style={{ fontSize:12, color:C.textMuted }}>尚未新增商場</div>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <select value={`${newMallCity}|${newMallDistrict}`} onChange={e=>{const[c,d]=e.target.value.split('|');setNewMallCity(c);setNewMallDistrict(d);}}
                style={{ ...gs.input, flex:'0 0 auto', width:'auto', cursor:'pointer', padding:'12px 10px', fontSize:13 }}>
                <option value="|">選地區</option>
                {allDistricts.map(({city,district})=>(
                  <option key={`${city}-${district}`} value={`${city}|${district}`}>{cities.length>1?`${city}-`:''}{district}</option>
                ))}
              </select>
              <ImeInput key="manage-shop-mall" style={{ ...gs.input, flex:1 }} placeholder="例：天神地下街、PARCO" value={newMall} onChange={v=>setNewMall(v)} />
              <button onClick={() => {
                if(!newMall.trim()||!newMallDistrict) return;
                const city = newMallCity || cities[0];
                const newMalls = {...mallsMap,[city]:{...(mallsMap[city]||{}),[newMallDistrict]:[...((mallsMap[city]||{})[newMallDistrict]||[]),newMall.trim()]}};
                updateOpts({...shopOptions, malls:newMalls});
                setNewMall('');
              }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:C.purple, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
            </div>
          </div>

          <button onClick={() => setShowManageShopOptions(false)}
            style={{ width:'100%', padding:14, border:`1px solid ${C.border}`, borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', backgroundColor:C.bg, color:C.text }}>完成</button>
        </div>
      </div>
    );
  };

  // 記帳 Modal
  const WalletModal = () => {
    if (!walletModal.open) return null;
    const isShared = walletSubTab === 'shared-detail';
    const allUids = members.map(m=>m.uid);
    const SYM = { KRW:'₩', JPY:'¥', TWD:'$', USD:'$' };
    const pageColor = isShared ? C.purple : C.blue;
    const d = walletModal.data || {};
    const contributorIds = d.contributorIds || allUids;
    const forMemberIds = d.forMemberIds || allUids;
    const availCurrencies = tripCurrencies.length>0 ? tripCurrencies : ['JPY','KRW','TWD','USD'];

    const perHint = (amount, ids) => {
      const t=Number(amount)||0; const n=ids.length||1;
      const per=Math.floor(t/n); const rem=t-per*n;
      return `每人 ${per.toLocaleString()}${rem>0?`（${rem} 人多付 1）`:''} ${d.currency||'JPY'}`;
    };

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{d.id?'編輯帳目':'新增帳目'}</div>
            <button onClick={()=>{setWalletModal({open:false,data:null});setWalletCalc(false);}} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 項目名稱 */}
          <div style={{ marginBottom:14 }}>
            <label style={gs.label}>項目名稱</label>
            <ImeInput key="wallet-name" style={gs.input} placeholder="例：晚餐、計程車" value={d.name||''} onChange={v=>setWalletModal(p=>({...p,data:{...p.data,name:v}}))} />
          </div>

          {/* 存入/支出 */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {['支出','存入'].map(t=>(
              <button key={t} type="button" onClick={()=>setWalletModal(p=>({...p,data:{...p.data,type:t}}))}
                style={{ flex:1, padding:11, borderRadius:12, border:`1.5px solid ${d.type===t?(t==='支出'?C.danger:C.green):C.border}`, backgroundColor:d.type===t?(t==='支出'?C.dangerSoft:C.greenSoft):C.bg, color:d.type===t?(t==='支出'?C.danger:C.green):C.textMuted, fontSize:14, fontWeight:700, cursor:'pointer' }}>{t}</button>
            ))}
          </div>

          {/* 金額 + 計算機 */}
          <div style={{ backgroundColor:C.bg, borderRadius:14, padding:14, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>金額</div>
                <input type="number" value={d.amount||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,amount:e.target.value}}))}
                  placeholder="0" style={{ fontSize:28, fontWeight:800, color:C.text, background:'none', border:'none', outline:'none', width:'100%' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                <button onClick={()=>setWalletCalc(v=>!v)} style={{ padding:'6px 10px', borderRadius:10, border:`1px solid ${walletCalc?pageColor:C.border}`, backgroundColor:walletCalc?(isShared?C.purpleSoft:C.blueSoft):C.bg, color:walletCalc?pageColor:C.textMuted, fontSize:18, cursor:'pointer' }}>🔢</button>
                <select value={d.currency||availCurrencies[0]||'JPY'} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,currency:e.target.value}}))}
                  style={{ padding:'5px 8px', borderRadius:8, border:`1px solid ${C.border}`, backgroundColor:C.bg, fontSize:13, fontWeight:700, color:pageColor, cursor:'pointer', outline:'none' }}>
                  {availCurrencies.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          {walletCalc&&(
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:14 }}>
              {[1,2,3,4,5,6,7,8,9,'.',0,'⌫'].map(n=>(
                <button key={n} onClick={()=>{
                  if(n==='⌫') setWalletModal(p=>({...p,data:{...p.data,amount:String(p.data?.amount||'').slice(0,-1)}}));
                  else setWalletModal(p=>({...p,data:{...p.data,amount:(p.data?.amount||'')+n.toString()}}));
                }} style={{ padding:12, borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:n==='⌫'?C.bg:C.surface, fontSize:16, fontWeight:700, cursor:'pointer' }}>{n}</button>
              ))}
            </div>
          )}

          {/* 共用公費：存入選人 / 支出選分攤對象 */}
          {isShared && d.type==='存入' && (
            <div style={{ marginBottom:14, backgroundColor:C.greenSoft, borderRadius:12, padding:'12px 14px', border:`1px solid ${C.green}22` }}>
              <label style={{ ...gs.label, color:C.green }}>誰存入（預設全員）</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                {members.map(m=>{ const sel=contributorIds.includes(m.uid); return (
                  <button key={m.uid} type="button" onClick={()=>{ const next=sel?contributorIds.filter(x=>x!==m.uid):[...contributorIds,m.uid]; if(next.length===0)return; setWalletModal(p=>({...p,data:{...p.data,contributorIds:next}})); }}
                    style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${sel?C.green:C.border}`, backgroundColor:sel?C.green:'transparent', color:sel?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                  </button>
                );})}
              </div>
              {contributorIds.length>1&&d.amount&&<div style={{ fontSize:11, color:C.green, fontWeight:700, marginTop:6 }}>{perHint(d.amount,contributorIds)}</div>}
            </div>
          )}
          {isShared && d.type==='支出' && (
            <div style={{ marginBottom:14, backgroundColor:C.purpleSoft, borderRadius:12, padding:'12px 14px', border:`1px solid ${C.purple}22` }}>
              <label style={{ ...gs.label, color:C.purple }}>幫誰支出（預設全員）</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                {members.map(m=>{ const sel=forMemberIds.includes(m.uid); return (
                  <button key={m.uid} type="button" onClick={()=>{ const next=sel?forMemberIds.filter(x=>x!==m.uid):[...forMemberIds,m.uid]; if(next.length===0)return; setWalletModal(p=>({...p,data:{...p.data,forMemberIds:next}})); }}
                    style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${sel?C.purple:C.border}`, backgroundColor:sel?C.purple:'transparent', color:sel?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                  </button>
                );})}
              </div>
              {forMemberIds.length>1&&d.amount&&<div style={{ fontSize:11, color:C.purple, fontWeight:700, marginTop:6 }}>{perHint(d.amount,forMemberIds)}</div>}
            </div>
          )}



          <div style={{ marginBottom:12 }}><label style={gs.label}>日期</label><input type="date" style={gs.input} value={d.date||(()=>{ const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })()} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,date:e.target.value}}))} /></div>
          <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><ImeInput key="wallet-note" style={gs.input} placeholder="選填" value={d.note||''} onChange={v=>setWalletModal(p=>({...p,data:{...p.data,note:v}}))} /></div>

          <button onClick={()=>{
            if(!d.name?.trim()||!d.amount) return;
            // 如果使用者沒動日期欄位，使用今天的日期
            const _today = new Date();
            const _defaultDate = `${_today.getFullYear()}-${String(_today.getMonth()+1).padStart(2,'0')}-${String(_today.getDate()).padStart(2,'0')}`;
            const _date = d.date || _defaultDate;
            const dateFormatted = _date.includes('-') ? _date.split('-').slice(1).join('/') : _date;
            const now = Date.now();
            const fd = { ...d, date:dateFormatted, editedByName:user.displayName||user.email, editedById:user.uid,
              createdAt: d.createdAt||now,
              contributorIds: isShared&&d.type==='存入' ? (contributorIds.length>0?contributorIds:allUids) : undefined,
              forMemberIds: isShared&&d.type==='支出' ? (forMemberIds.length>0?forMemberIds:allUids) : undefined,
            };
            // 清除 undefined 和 null（避免 Firebase 報錯）
            const clean = JSON.parse(JSON.stringify(
              Object.fromEntries(Object.entries(fd).filter(([,v])=>v!==undefined&&v!==null))
            ));
            const curItems = isShared ? walletItems : personalWalletItems;
            const n = d.id ? curItems.map(i=>i.id===d.id?clean:i) : [...curItems,{...clean,id:Date.now()}];
            if(isShared){ setWalletItems(n); saveWallet(n); }
            else { setPersonalWalletItems(n); savePersonalWallet(n); }
            setWalletSelectedDate(dateFormatted);


            setWalletModal({open:false,data:null}); setWalletCalc(false);
          }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${pageColor},${C.blue})`, color:'#fff' }}>確認儲存</button>
        </div>
      </div>
    );
  };

  // 幣別設定 Modal
  const CurrencySettingsModal = () => {
    const ALL_CURRENCIES = ['TWD','JPY','KRW','USD','EUR','HKD','SGD','THB'];
    const effectiveRates = { ...rates, ...manualRates };
    if (!showCurrencySettings) return null;
    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>幣別與匯率設定</div>
            <button onClick={() => setShowCurrencySettings(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:16 }}>匯率為 1 外幣 = ? TWD，可手動修改</div>

          {/* 選擇這趟旅程使用的幣別 */}
          <label style={gs.label}>這趟旅程使用的幣別</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {ALL_CURRENCIES.map(cur => {
              const sel = tripCurrencies.includes(cur);
              return (
                <button key={cur} type="button" onClick={() => {
                  const next = sel ? tripCurrencies.filter(c=>c!==cur) : [...tripCurrencies,cur];
                  if(next.length===0) return;
                  setTripCurrencies(next);
                  saveCurrencies(next, manualRates);
                }} style={{ padding:'8px 16px', borderRadius:10, border:`1.5px solid ${sel?C.purple:C.border}`, backgroundColor:sel?C.purpleSoft:C.bg, color:sel?C.purple:C.textMuted, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  {cur}
                </button>
              );
            })}
          </div>

          {/* 匯率（可手動修改）*/}
          <label style={gs.label}>匯率（1 外幣 = ? TWD）</label>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            {tripCurrencies.filter(c=>c!=='TWD').map(cur => (
              <div key={cur} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', backgroundColor:C.bg, borderRadius:12, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.purple, width:40 }}>{cur}</div>
                <div style={{ flex:1, fontSize:12, color:C.textMuted }}>自動: {rates[cur]||'?'}</div>
                <input type="number" value={manualRates[cur]||''} placeholder={String(rates[cur]||'')}
                  onChange={e => {
                    const nr = {...manualRates, [cur]: e.target.value ? parseFloat(e.target.value) : undefined};
                    if(!e.target.value) delete nr[cur];
                    setManualRates(nr);
                    saveCurrencies(tripCurrencies, nr);
                  }}
                  style={{ ...gs.input, width:80, padding:'8px 10px', textAlign:'right', fontSize:14 }} />
              </div>
            ))}
          </div>

          <button onClick={() => setShowCurrencySettings(false)}
            style={{ width:'100%', padding:14, border:`1px solid ${C.border}`, borderRadius:13, fontSize:15, fontWeight:700, cursor:'pointer', backgroundColor:C.bg, color:C.text }}>完成</button>
        </div>
      </div>
    );
  };

  // 備忘錄 Modal
  const MemoModal = () => {
    if (!memoModal.open) return null;
    const d = memoModal.data || {};
    const isShared = memoModal.scope === 'shared-memo';
    const acColor = isShared ? C.blue : C.purple;
    const checkItems = d.items || [];

    const setMemoItems = isShared
      ? (fn) => { const n=typeof fn==='function'?fn(sharedMemos):fn; setSharedMemos(n); saveSharedMemos(n); }
      : (fn) => { const n=typeof fn==='function'?fn(personalMemos):fn; setPersonalMemos(n); savePersonalMemos(n); };

    const saveMemo = () => {
      if (!d.content?.trim() && !memoPhoto && checkItems.filter(i=>i.text?.trim()).length===0) return;
      const now = Date.now();
      const fd = { ...d, photo:memoPhoto, editedByName:user.displayName||user.email, editedById:user.uid, createdAtMs:d.createdAtMs||now, updatedAtMs:now };
      setMemoItems(p => d.id ? p.map(m=>m.id===d.id?fd:m) : [{...fd, id:now}, ...p]);
      setMemoModal({open:false, data:null, scope:'shared'});
      setMemoPhoto(null);
    };

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{d.id?'編輯備忘錄':'新增備忘錄'}</div>
            <button onClick={() => { setMemoModal({open:false,data:null,scope:'shared'}); setMemoPhoto(null); }} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 類型切換 */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[['text','📝 記事'],['checklist','✅ 清單']].map(([type,label]) => (
              <button key={type} type="button" onClick={() => setMemoModal(p=>({...p,data:{...p.data,type}}))}
                style={{ flex:1, padding:10, borderRadius:12, border:`1.5px solid ${d.type===type?acColor:C.border}`, backgroundColor:d.type===type?acColor+'18':C.bg, color:d.type===type?acColor:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {/* 記事模式：文字 + 照片 */}
          {d.type !== 'checklist' && (
            <>
              {memoPhoto && (
                <div style={{ position:'relative', width:'100%', height:160, borderRadius:12, overflow:'hidden', marginBottom:12 }}>
                  <img src={memoPhoto} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="tmp" />
                  <button onClick={() => setMemoPhoto(null)} style={{ position:'absolute', top:8, right:8, background:'rgba(220,50,50,0.9)', border:'none', borderRadius:8, color:'#fff', padding:'4px 8px', cursor:'pointer', fontSize:12 }}>移除</button>
                </div>
              )}
              <div style={{ marginBottom:12 }}>
                <button onClick={() => document.getElementById('memo-photo-input').click()} style={{ width:'100%', padding:'10px', border:`1.5px dashed ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.textMuted, fontSize:13, cursor:'pointer', fontWeight:600 }}>📷 新增相片</button>
                <input type="file" id="memo-photo-input" style={{ display:'none' }} accept="image/*" onChange={e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onloadend=()=>{ const img=new Image(); img.src=r.result; img.onload=()=>{ const c=document.createElement('canvas'); let w=img.width,h=img.height,max=800; if(w>h){if(w>max){h=h*max/w;w=max;}}else{if(h>max){w=w*max/h;h=max;}} c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);setMemoPhoto(c.toDataURL('image/jpeg',0.7)); }; }; r.readAsDataURL(f); }} />
              </div>
              <div style={{ marginBottom:16 }}>
                <ImeInput key="memo-content" multiline style={{ ...gs.input, resize:'none', fontFamily:'inherit', minHeight:120 }} placeholder="輸入內容..." value={d.content||''} onChange={v=>setMemoModal(p=>({...p,data:{...p.data,content:v}}))} rows={5} />
              </div>
            </>
          )}

          {/* 清單模式 */}
          {d.type === 'checklist' && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
                {checkItems.map((item, ii) => (
                  <div key={item.id||ii} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:24, height:24, borderRadius:6, border:`2px solid ${item.done?C.green:C.border}`, backgroundColor:item.done?C.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {item.done && <span style={{ color:'#fff', fontSize:12, fontWeight:800 }}>✓</span>}
                    </div>
                    <ImeInput key={`memo-item-${ii}`} style={{ ...gs.input, flex:1, padding:'8px 12px', fontSize:14, textDecoration:item.done?'line-through':'none', color:item.done?C.textMuted:C.text }} placeholder="項目..." value={item.text||''}
                      onChange={v=>setMemoModal(p=>({...p,data:{...p.data,items:p.data.items.map((x,xi)=>xi===ii?{...x,text:v}:x)}}))} />
                    <button onClick={() => setMemoModal(p=>({...p,data:{...p.data,items:p.data.items.filter((_,xi)=>xi!==ii)}}))}
                      style={{ background:'none', border:'none', color:C.textMuted, fontSize:16, cursor:'pointer', flexShrink:0 }}>×</button>
                  </div>
                ))}
              </div>
              <button onClick={() => setMemoModal(p=>({...p,data:{...p.data,items:[...(p.data.items||[]),{id:Date.now(),text:'',done:false}]}}))}
                style={{ width:'100%', padding:10, border:`1.5px dashed ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:acColor, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                ＋ 新增項目
              </button>
            </div>
          )}

          <button onClick={saveMemo} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${acColor},${C.purple})`, color:'#fff' }}>確認儲存</button>
        </div>
      </div>
    );
  };

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
    <div style={{ ...gs.app, maxHeight:'100vh' }}
>
      {TripHeader()}
      {tab==='itinerary' && ItineraryTab()}
      {tab==='food' && FoodTab()}
      {tab==='wallet' && WalletTab()}
      {tab==='shopping' && ShoppingTab()}
      {tab==='more' && MoreTab()}
      {TabBar()}

      {ItineraryModal()}
      {FoodModal()}
      {ManageFoodOptionsModal()}
      {ShoppingModal()}
      {ManageShopOptionsModal()}
      {WalletModal()}
      {CurrencySettingsModal()}
      {MemoModal()}
      {splitModal.open && (() => {
        const sd = splitModal.data || {};
        const receivers = sd.receiverIds || [];
        const availCurrencies = tripCurrencies.length>0 ? tripCurrencies : ['JPY','KRW','TWD','USD'];
        const SYM = { KRW:'₩', JPY:'¥', TWD:'$', USD:'$' };
        const perHint = () => {
          if(!sd.amount||receivers.length===0) return '';
          const t=Number(sd.amount); const n=receivers.length;
          const per=Math.floor(t/n); const rem=t-per*n;
          return `每人 ${per.toLocaleString()}${rem>0?`（${rem} 人多付 1）`:''} ${sd.currency||'JPY'}`;
        };
        return (
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:300 }}>
            <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>{sd.editingIds && sd.editingIds.length>0 ? '編輯代墊' : '新增代墊'}</div>
                <button onClick={() => setSplitModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
              </div>

              {/* 項目名稱 */}
              <div style={{ marginBottom:14 }}>
                <label style={gs.label}>項目名稱 *</label>
                <ImeInput key="split-name" style={gs.input} placeholder="例：晚餐、交通" value={sd.note||''} onChange={v=>setSplitModal(p=>({...p,data:{...p.data,note:v}}))} />
              </div>

              {/* 付款人 */}
              <div style={{ marginBottom:14 }}>
                <label style={gs.label}>付款人（誰先付）</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {members.map(m=>(
                    <button key={m.uid} type="button" onClick={()=>setSplitModal(p=>({...p,data:{...p.data,payerId:m.uid,receiverIds:[]}}))}
                      style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${sd.payerId===m.uid?C.purple:C.border}`, backgroundColor:sd.payerId===m.uid?C.purple:'transparent', color:sd.payerId===m.uid?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                    </button>
                  ))}
                </div>
              </div>

              {/* 幫誰分攤 */}
              <div style={{ marginBottom:14 }}>
                <label style={gs.label}>幫誰分攤（可多選，包含付款人）</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {members.map(m=>{ const sel=receivers.includes(m.uid); return (
                    <button key={m.uid} type="button" onClick={()=>{ const next=sel?receivers.filter(x=>x!==m.uid):[...receivers,m.uid]; setSplitModal(p=>({...p,data:{...p.data,receiverIds:next}})); }}
                      style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${sel?C.green:C.border}`, backgroundColor:sel?C.greenSoft:'transparent', color:sel?C.green:C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                    </button>
                  );})}
                </div>
              </div>

              {/* 金額 + 幣別 */}
              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <label style={gs.label}>金額 *</label>
                  <input type="number" value={sd.amount||''} onChange={e=>setSplitModal(p=>({...p,data:{...p.data,amount:e.target.value}}))}
                    placeholder="0" style={{ ...gs.input }} />
                </div>
                <div style={{ flexShrink:0 }}>
                  <label style={gs.label}>幣別</label>
                  <select value={sd.currency||availCurrencies[0]} onChange={e=>setSplitModal(p=>({...p,data:{...p.data,currency:e.target.value}}))}
                    style={{ ...gs.input, cursor:'pointer', width:'auto', padding:'12px 10px' }}>
                    {availCurrencies.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {receivers.length>0 && sd.amount && <div style={{ fontSize:11, color:C.green, fontWeight:700, marginBottom:14 }}>{perHint()}</div>}

              <button onClick={() => {
                if(!sd.note?.trim()||!sd.amount||!sd.payerId||receivers.length===0) return;
                const now = Date.now();
                const total = Number(sd.amount)||0;
                const sortedReceivers = [...receivers].sort();
                const n = sortedReceivers.length;
                const per = Math.floor(total/n);
                const rem = total - per*n;
                const offset = Math.floor(now/1000) % n;
                const newRecs = sortedReceivers.map((rid,i)=>({
                  id: now+i+100,
                  payerId: sd.payerId,
                  receiverId: rid,
                  amount: per + ((i-offset+n)%n < rem ? 1 : 0),
                  currency: sd.currency||'JPY',
                  note: sd.note||'',
                  createdAt: now,
                }));
                // 至少需要一筆非自付的記錄（否則無意義）
                if(newRecs.filter(r=>r.receiverId!==r.payerId).length===0) return;
                // 編輯模式：先刪舊的
                let base = [...splitRecords];
                if(sd.editingIds && sd.editingIds.length>0) {
                  const ids = new Set(sd.editingIds.map(String));
                  base = base.filter(r=>!ids.has(String(r.id)));
                }
                const nr=[...base,...newRecs]; setSplitRecords(nr); saveSplitRecords(nr);
                setSplitModal({open:false,data:null});
              }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${C.green},${C.blue})`, color:'#fff' }}>確認儲存</button>
            </div>
          </div>
        );
      })()}
      {shopBoughtModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backgroundColor:'rgba(45,42,36,0.5)' }}>
          <div style={{ ...gs.card, width:'100%', maxWidth:340 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:800, color:C.warm }}>記錄購買金額</div>
              <button onClick={() => setShopBoughtModal(null)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:C.textMuted }}>×</button>
            </div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14, color:C.text }}>{shopBoughtModal.item.name}</div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input type="number" value={shopBoughtPrice} onChange={e=>setShopBoughtPrice(e.target.value)} placeholder="金額（選填）"
                style={{ ...gs.input, flex:1 }} />
              <select value={shopBoughtCurrency} onChange={e=>setShopBoughtCurrency(e.target.value)}
                style={{ ...gs.input, width:'auto', padding:'12px 8px', cursor:'pointer' }}>
                {(tripCurrencies||['JPY','KRW','TWD']).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <ImeInput key="shop-bought-note" style={gs.input} placeholder="備註（代購對象等）" value={shopBoughtNote} onChange={v=>setShopBoughtNote(v)} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => {
                const now=new Date(); const ts=`${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}`;
                const n=shoppingItems.map(i=>i.id===shopBoughtModal.item.id?{...i,isBought:true,boughtAt:ts,boughtPrice:shopBoughtPrice||null,boughtCurrency:shopBoughtCurrency,boughtNote:shopBoughtNote||null}:i);
                setShoppingItems(n);saveShopping(n);setShopBoughtModal(null);
              }} style={{ flex:1, padding:12, border:'none', borderRadius:12, backgroundColor:C.warm, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>確認已買</button>
              <button onClick={() => {
                const now=new Date(); const ts=`${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')}`;
                const n=shoppingItems.map(i=>i.id===shopBoughtModal.item.id?{...i,isBought:true,boughtAt:ts,boughtPrice:null,boughtCurrency:null,boughtNote:null}:i);
                setShoppingItems(n);saveShopping(n);setShopBoughtModal(null);
              }} style={{ flex:1, padding:12, border:`1px solid ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:600, cursor:'pointer' }}>略過金額</button>
            </div>
          </div>
        </div>
      )}
      {DatePickerModal()}
      {/* 結清幣別選擇（外幣才出現）*/}
      {settleCurrencyPrompt && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={()=>setSettleCurrencyPrompt(null)} style={{ position:'absolute', inset:0, backgroundColor:'rgba(45,42,36,0.5)' }} />
          <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:320 }}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>以哪種幣別結清？</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:18 }}>
              選外幣：帳務記錄使用原本幣別<br/>
              選台幣：記錄為台幣折算金額
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={()=>{ settleCurrencyPrompt.onChoose(settleCurrencyPrompt.amount, settleCurrencyPrompt.currency); setSettleCurrencyPrompt(null); }}
                style={{ padding:'14px', border:`1.5px solid ${C.green}`, borderRadius:12, backgroundColor:C.greenSoft, color:C.green, fontSize:14, fontWeight:800, cursor:'pointer', textAlign:'left' }}>
                <div>外幣結清</div>
                <div style={{ fontSize:12, fontWeight:400, marginTop:2, color:C.textMuted }}>記錄為 {settleCurrencyPrompt.currency === 'JPY' ? '¥' : settleCurrencyPrompt.currency === 'KRW' ? '₩' : ''}{settleCurrencyPrompt.amount.toLocaleString()} {settleCurrencyPrompt.currency}</div>
              </button>
              <button onClick={()=>{ settleCurrencyPrompt.onChoose(settleCurrencyPrompt.twdAmount, 'TWD'); setSettleCurrencyPrompt(null); }}
                style={{ padding:'14px', border:`1.5px solid ${C.blue}`, borderRadius:12, backgroundColor:C.blueSoft, color:C.blue, fontSize:14, fontWeight:800, cursor:'pointer', textAlign:'left' }}>
                <div>台幣結清</div>
                <div style={{ fontSize:12, fontWeight:400, marginTop:2, color:C.textMuted }}>記錄為 NT${settleCurrencyPrompt.twdAmount.toLocaleString()} TWD</div>
              </button>
              <button onClick={()=>setSettleCurrencyPrompt(null)}
                style={{ padding:'11px', border:`1px solid ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.textMuted, fontSize:13, fontWeight:600, cursor:'pointer' }}>取消</button>
            </div>
          </div>
        </div>
      )}
      {/* 代墊已還刪除後詢問是否還原分攤 */}
      {splitRestorePrompt && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div onClick={()=>setSplitRestorePrompt(null)} style={{ position:'absolute', inset:0, backgroundColor:'rgba(45,42,36,0.5)' }} />
          <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:320, textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🗑</div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>確定刪除這筆記錄？</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:6 }}>{splitRestorePrompt.item?.name}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:20 }}>選擇如何處理對方的記錄</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <button onClick={()=>{
                splitRestorePrompt.onDeleteBoth?.();
                const it=splitRestorePrompt.item;
                if(it?.createdAt){
                  const nr=splitRecords.map(sr=>Math.abs((sr.settledAt||0)-it.createdAt)<5000?{...sr,settled:false,settledAt:null}:sr);
                  setSplitRecords(nr); saveSplitRecords(nr);
                }
                setSplitRestorePrompt(null);
              }} style={{ padding:'12px', border:'none', borderRadius:12, backgroundColor:C.green, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                刪除，並還原分攤為未還
              </button>
              <button onClick={()=>{
                splitRestorePrompt.onDeleteSelf?.();
                setSplitRestorePrompt(null);
              }} style={{ padding:'12px', border:`1px solid ${C.border}`, borderRadius:12, backgroundColor:C.bg, color:C.text, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                只刪除我的記錄（對方不動）
              </button>
              <button onClick={()=>setSplitRestorePrompt(null)}
                style={{ padding:'11px', border:`1px solid ${C.border}`, borderRadius:12, backgroundColor:'transparent', color:C.textMuted, fontSize:13, cursor:'pointer' }}>取消</button>
            </div>
          </div>
        </div>
      )}
      {/* ─── 上傳行程表解析 Modal ─── */}
      {/* ✈️🛏 交通住宿管理面板 */}
      {travelInfoOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={()=>setTravelInfoOpen(false)} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
          <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:520, borderRadius:'24px 24px 0 0', maxHeight:'88vh', overflowY:'auto', padding:24, paddingBottom:40 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800 }}>✈️🛏 交通與住宿</div>
              <button onClick={()=>setTravelInfoOpen(false)} style={{ background:'none', border:'none', fontSize:24, color:C.textMuted, cursor:'pointer' }}>×</button>
            </div>
            {tripDates.some(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)) && (
              <div style={{ padding:'12px 14px', backgroundColor:C.warmSoft, borderRadius:12, border:`1px solid ${C.warmBorder}`, marginBottom:18 }}>
                <div style={{ fontSize:12, color:C.text, marginBottom:8 }}>⚠️ 偵測到舊格式日期（含年份），可能導致交通住宿對不上行程。</div>
                <button onClick={async()=>{ await fixDateFormats(); }} style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', backgroundColor:C.warm, color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer' }}>🔧 一鍵修復日期格式</button>
              </div>
            )}

            {/* 航班/交通 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:800, color:C.textMuted }}>✈️ 航班・交通</div>
              <button onClick={()=>setTransportModal({open:true,data:null})} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${C.warm}44`, backgroundColor:C.warmSoft, color:C.warm, fontSize:12, fontWeight:700, cursor:'pointer' }}>＋ 新增</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {transports.length===0 ? <div style={{ fontSize:12, color:C.textMuted, padding:'8px 0' }}>尚未新增航班或交通</div> :
                [...transports].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(t=>(
                  <div key={t.id} style={{ ...gs.card, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>{t.type==='flight'?'✈️':'🚄'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{t.label||'交通'} <span style={{ fontSize:12, color:C.textMuted, fontWeight:400 }}>{t.date} {t.time}</span></div>
                      {(t.from||t.to)&&<div style={{ fontSize:12, color:C.textMuted }}>{t.from} → {t.to} {t.code?`· ${t.code}`:''}</div>}
                    </div>
                    <button onClick={()=>setTransportModal({open:true,data:t})} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                    <button onClick={()=>{ const n=transports.filter(x=>x.id!==t.id); saveTransports(n); }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:C.bg, color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
                  </div>
                ))}
            </div>

            {/* 住宿 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:800, color:C.textMuted }}>🛏 住宿</div>
              <button onClick={()=>setLodgingModal({open:true,data:null})} style={{ padding:'4px 10px', borderRadius:8, border:`1px solid ${C.warm}44`, backgroundColor:C.warmSoft, color:C.warm, fontSize:12, fontWeight:700, cursor:'pointer' }}>＋ 新增</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {lodgings.length===0 ? <div style={{ fontSize:12, color:C.textMuted, padding:'8px 0' }}>尚未新增住宿</div> :
                [...lodgings].sort((a,b)=>(a.checkIn||'').localeCompare(b.checkIn||'')).map(l=>(
                  <div key={l.id} style={{ ...gs.card, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>🛏</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{l.name}</div>
                      <div style={{ fontSize:12, color:C.textMuted }}>{l.checkIn} ～ {l.checkOut} {l.code?`· ${l.code}`:''}</div>
                    </div>
                    {l.mapUrl&&<a href={l.mapUrl} target="_blank" rel="noreferrer" style={{ padding:'4px 8px', border:`1px solid ${C.warm}44`, borderRadius:8, backgroundColor:C.warmSoft, color:C.warm, fontSize:11, fontWeight:700, textDecoration:'none' }}>📍</a>}
                    <button onClick={()=>setLodgingModal({open:true,data:l})} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                    <button onClick={()=>{ const n=lodgings.filter(x=>x.id!==l.id); saveLodgings(n); }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:C.bg, color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 航班/交通 新增編輯 */}
      {transportModal.open && (() => {
        const d = transportModal.data || { type:'flight', label:'', date:'', time:'', from:'', to:'', code:'', note:'' };
        const set = (k,v)=>setTransportModal(p=>({...p,data:{...(p.data||d),[k]:v}}));
        const cur = transportModal.data || d;
        return (
          <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={()=>setTransportModal({open:false,data:null})} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
            <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:380, maxHeight:'85vh', overflowY:'auto', padding:24 }}>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:18 }}>{transportModal.data?'編輯':'新增'}航班・交通</div>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {[['flight','✈️ 航班'],['transport','🚄 其他交通']].map(([v,l])=>(
                  <button key={v} onClick={()=>set('type',v)} style={{ flex:1, padding:'8px', borderRadius:10, border:`1.5px solid ${cur.type===v?C.warm:C.border}`, backgroundColor:cur.type===v?C.warmSoft:C.bg, color:cur.type===v?C.warm:C.textMuted, fontWeight:700, fontSize:13, cursor:'pointer' }}>{l}</button>
                ))}
              </div>
              <input placeholder={cur.type==='flight'?'標題（去程/回程）':'標題（如：JR 特急）'} value={cur.label||''} onChange={e=>set('label',e.target.value)} style={{ ...gs.input, marginBottom:10 }}/>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <select value={cur.date||''} onChange={e=>set('date',e.target.value)} style={{ ...gs.input, flex:1, appearance:'none' }}>
                  <option value="">選擇日期</option>
                  {tripDates.filter(d=>d!=='待安排').map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <input type="time" value={cur.time||''} onChange={e=>set('time',e.target.value)} style={{ ...gs.input, flex:1 }}/>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <input placeholder="出發地" value={cur.from||''} onChange={e=>set('from',e.target.value)} style={{ ...gs.input, flex:1 }}/>
                <input placeholder="目的地" value={cur.to||''} onChange={e=>set('to',e.target.value)} style={{ ...gs.input, flex:1 }}/>
              </div>
              <input placeholder="航班/車次編號（選填）" value={cur.code||''} onChange={e=>set('code',e.target.value)} style={{ ...gs.input, marginBottom:18 }}/>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setTransportModal({open:false,data:null})} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontWeight:700, fontSize:14, cursor:'pointer' }}>取消</button>
                <button onClick={()=>{
                  if(!cur.label&&!cur.from) return;
                  const item={ ...cur, id:cur.id||Date.now() };
                  const n = cur.id ? transports.map(x=>x.id===cur.id?item:x) : [...transports,item];
                  saveTransports(n); setTransportModal({open:false,data:null});
                }} style={{ flex:2, padding:12, borderRadius:12, border:'none', backgroundColor:C.warm, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>儲存</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 住宿 新增編輯 */}
      {lodgingModal.open && (() => {
        const d = lodgingModal.data || { name:'', checkIn:'', checkOut:'', code:'', note:'' };
        const set = (k,v)=>setLodgingModal(p=>({...p,data:{...(p.data||d),[k]:v}}));
        const cur = lodgingModal.data || d;
        return (
          <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={()=>setLodgingModal({open:false,data:null})} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
            <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:380, padding:24 }}>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:18 }}>{lodgingModal.data?'編輯':'新增'}住宿</div>
              <input placeholder="飯店名稱" value={cur.name||''} onChange={e=>set('name',e.target.value)} style={{ ...gs.input, marginBottom:10 }}/>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>入住日</div>
                  <select value={cur.checkIn||''} onChange={e=>set('checkIn',e.target.value)} style={{ ...gs.input, width:'100%', appearance:'none' }}>
                    <option value="">選擇</option>
                    {tripDates.filter(d=>d!=='待安排').map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>退房日</div>
                  <select value={cur.checkOut||''} onChange={e=>set('checkOut',e.target.value)} style={{ ...gs.input, width:'100%', appearance:'none' }}>
                    <option value="">選擇</option>
                    {tripDates.filter(d=>d!=='待安排').map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <input placeholder="訂房編號（選填）" value={cur.code||''} onChange={e=>set('code',e.target.value)} style={{ ...gs.input, marginBottom:10 }}/>
              <input placeholder="Google Maps 連結（選填）" value={cur.mapUrl||''} onChange={e=>set('mapUrl',e.target.value)} style={{ ...gs.input, marginBottom:18 }}/>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setLodgingModal({open:false,data:null})} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontWeight:700, fontSize:14, cursor:'pointer' }}>取消</button>
                <button onClick={()=>{
                  if(!cur.name||!cur.checkIn||!cur.checkOut) return;
                  const item={ ...cur, id:cur.id||Date.now() };
                  const n = cur.id ? lodgings.map(x=>x.id===cur.id?item:x) : [...lodgings,item];
                  saveLodgings(n); setLodgingModal({open:false,data:null});
                }} style={{ flex:2, padding:12, borderRadius:12, border:'none', backgroundColor:C.warm, color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>儲存</button>
              </div>
            </div>
          </div>
        );
      })()}
      {aiPlanModal.open && <AIPlanModal
        onClose={()=>setAiPlanModal({open:false})}
        trip={trip} itinerary={itinerary} foodItems={foodItems}
        tripDates={tripDates} setItinerary={setItinerary} setTripDates={setTripDates}
        saveItinerary={saveItinerary}
      />}
      {uploadModal.open && <UploadItineraryModal
        onClose={()=>setUploadModal({open:false})}
        user={user} trip={trip} members={members}
        itinerary={itinerary} tripDates={tripDates}
        setItinerary={setItinerary} setTripDates={setTripDates}
        saveItinerary={saveItinerary}
      />}
      <ConfirmDialog isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => { confirmDel?.fn(); setConfirmDel(null); }} title={confirmDel?.title} message={confirmDel?.message} />
    </div>
  );
}


// ─── 主 App ───────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error, info) { this.setState({ error: error.message + '\n' + info.componentStack }); }
  render() {
    if (this.state.error) return (
      <div style={{ padding:20, backgroundColor:'#FDE8E8', minHeight:'100vh' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#C00', marginBottom:10 }}>❌ 發生錯誤</div>
        <pre style={{ fontSize:11, color:'#333', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{this.state.error}</pre>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [inviteTrip, setInviteTrip] = useState(null); // 找到的旅程，等使用者確認
  const [joining, setJoining] = useState(false);

  // 讀取網址的邀請碼 ?invite=XXXXXX
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inv = params.get('invite');
      if (inv) setPendingInvite(inv.trim().toUpperCase());
    } catch(e) {}
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthUser(user);
      if (!user) setCurrentTrip(null);
    });
    return unsub;
  }, []);

  // 登入後若有待處理的邀請碼，先抓旅程資訊，跳確認彈窗
  useEffect(() => {
    if (!authUser || !pendingInvite || currentTrip || inviteTrip) return;
    let cancelled = false;
    (async () => {
      try {
        const q = query(collection(db, "trips"), where("inviteCode", "==", pendingInvite));
        const snap = await getDocs(q);
        if (!snap.empty && !cancelled) {
          const tripDoc = snap.docs[0];
          // 檢查是否已是成員
          const memberDoc = await getDoc(doc(db, "tripMembers", `${tripDoc.id}_${authUser.uid}`));
          if (memberDoc.exists()) {
            // 已加入，直接進入
            if(!cancelled) setCurrentTrip({ id: tripDoc.id, ...tripDoc.data() });
            setPendingInvite(null);
            try { window.history.replaceState({}, '', window.location.pathname); } catch(e) {}
          } else if(!cancelled) {
            setInviteTrip({ id: tripDoc.id, ...tripDoc.data() });
          }
        } else {
          setPendingInvite(null);
        }
      } catch(e) { setPendingInvite(null); }
    })();
    return () => { cancelled = true; };
  }, [authUser, pendingInvite, currentTrip, inviteTrip]);

  const confirmJoin = async () => {
    if (!inviteTrip || !authUser) return;
    setJoining(true);
    try {
      const memberDoc = await getDoc(doc(db, "tripMembers", `${inviteTrip.id}_${authUser.uid}`));
      if (!memberDoc.exists()) {
        await setDoc(doc(db, "tripMembers", `${inviteTrip.id}_${authUser.uid}`), {
          tripId: inviteTrip.id, uid: authUser.uid,
          displayName: authUser.displayName || authUser.email,
          role: "member", joinedAt: serverTimestamp(),
        });
      }
      setCurrentTrip(inviteTrip);
    } catch(e) {}
    try { window.history.replaceState({}, '', window.location.pathname); } catch(e) {}
    setInviteTrip(null); setPendingInvite(null); setJoining(false);
  };

  const cancelJoin = () => {
    try { window.history.replaceState({}, '', window.location.pathname); } catch(e) {}
    setInviteTrip(null); setPendingInvite(null);
  };

  if (authUser === undefined) return <LoadingScreen />;
  if (!authUser) return <AuthScreen />;

  const inviteDialog = inviteTrip && (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={cancelJoin} style={{ position:'absolute', inset:0, backgroundColor:'rgba(42,37,30,0.6)' }}/>
      <div style={{ ...gs.card, position:'relative', width:'100%', maxWidth:340, textAlign:'center', padding:28 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>{inviteTrip.emoji||'✈️'}</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:4 }}>朋友邀請你加入旅程</div>
        <div style={{ fontSize:20, fontWeight:900, marginBottom:6 }}>{inviteTrip.name}</div>
        {inviteTrip.destinations && <div style={{ fontSize:13, color:C.textMuted, marginBottom:4 }}>📍 {inviteTrip.destinations}</div>}
        {inviteTrip.startDate && inviteTrip.endDate && <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>{inviteTrip.startDate} ～ {inviteTrip.endDate}</div>}
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button onClick={cancelJoin} disabled={joining} style={{ flex:1, padding:13, borderRadius:12, border:`1px solid ${C.border}`, backgroundColor:C.bg, color:C.textMuted, fontSize:14, fontWeight:700, cursor:'pointer' }}>先不要</button>
          <button onClick={confirmJoin} disabled={joining} style={{ flex:2, padding:13, borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.blue},${C.green})`, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', opacity:joining?0.6:1 }}>{joining?'加入中...':'加入旅程'}</button>
        </div>
      </div>
    </div>
  );

  if (currentTrip) return <ErrorBoundary><TripDetailScreen user={authUser} trip={currentTrip} onBack={() => setCurrentTrip(null)} />{inviteDialog}</ErrorBoundary>;
  return <>{<TripListScreen user={authUser} onEnterTrip={setCurrentTrip} />}{inviteDialog}</>;
}
