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
      for (const d of mSnap.docs) { try { await deleteDoc(d.ref); } catch(e) {} }
      // 刪除旅程資料（部分可能不存在，忽略錯誤）
      const dataKeys = ['itinerary','food','foodOptions','shopping','shopOptions','wallet','todos','notes','splitRecords','currencies'];
      for (const k of dataKeys) { try { await deleteDoc(doc(db, "tripData", `${trip.id}_${k}`)); } catch(e) {} }
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
                <div key={trip.id} style={{ ...gs.card, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: C.surface }}>
                  <button onClick={() => onEnterTrip(trip)} style={{ display:"flex", alignItems:"center", gap:14, flex:1, background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, backgroundColor: color+"22", border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {trip.emoji || "✈️"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{trip.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                        {(trip.destinations||[trip.destination]).filter(Boolean).map(d=>`📍 ${d}`).join(' · ')}
                        {trip.startDate && ` · ${fmtDate(trip.startDate)}${trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ""}`}
                      </div>
                    </div>
                    <div style={{ color: color, fontSize: 18, fontWeight: 700 }}>›</div>
                  </button>
                  <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                    <button onClick={() => setTripToEdit(trip)}
                      style={{ background:"none", border:"none", color:C.textMuted, fontSize:15, cursor:"pointer", padding:"4px 6px", opacity:0.6 }}>✏️</button>
                    <button onClick={() => { const isAdmin = trip.createdBy === user.uid; setTripToDelete({ trip, isAdmin }); }}
                      style={{ background:"none", border:"none", color:C.textMuted, fontSize:16, cursor:"pointer", padding:"4px 6px", opacity:0.5 }}>×</button>
                  </div>
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
  const [walletSelectedDate, setWalletSelectedDate] = useState('');
  const [showPoolSettlement, setShowPoolSettlement] = useState(false);
  const [showPersonalSettlement, setShowPersonalSettlement] = useState(false);
  const [walletModal, setWalletModal] = useState({ open:false, data:null });
  const [walletCalc, setWalletCalc] = useState(false);
  const [transferStates, setTransferStates] = useState({});
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
  }
  async function saveNotes(items) {
    await setDoc(doc(db,"tripData",`${trip.id}_notes`), { items:JSON.parse(JSON.stringify(items)), updatedAt:serverTimestamp() });
  }

  // ── helpers ──
  const filteredItinerary = itinerary
    .filter(i=>i.date===selectedDate)
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
              {d!=='待安排' && <button onClick={() => setConfirmDel({title:'刪除日期',message:`確定刪除 ${d} 的日期？日期內的行程不會被刪除。`,fn:()=>handleDeleteDate(d)})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:13, cursor:'pointer', opacity:0.5, padding:'0 2px' }}>×</button>}
            </div>
          ))}
        </div>
      </div>
      {/* 行程列表 */}
      <div style={{ padding:16, flex:1 }}>
        {/* 當天連結的美食 */}
        {selectedDate!=='待安排' && foodItems.filter(f=>f.linkedDate===selectedDate).length>0 && (
          <div style={{ marginBottom:14, padding:'12px 14px', backgroundColor:'#FEF3E8', borderRadius:14, border:'1px solid #FDDCB0' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#D97706', marginBottom:8 }}>🍜 今天的美食</div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
              {foodItems.filter(f=>f.linkedDate===selectedDate).map(f=>(
                <button key={f.id} onClick={() => setTab('food')}
                  style={{ flexShrink:0, padding:'8px 12px', backgroundColor:'#fff', borderRadius:10, border:'1px solid #FDDCB0', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{f.name}</div>
                  {(f.districts||[f.district]).filter(Boolean).map(d=><div key={d} style={{ fontSize:10, color:'#D97706' }}>📍 {d}</div>)}
                  {f.foodType && <div style={{ fontSize:10, color:C.textMuted }}>{f.foodType}</div>}
                </button>
              ))}
            </div>
          </div>
        )}
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
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedCity==='全部城市'?'#D97706':C.border}`, backgroundColor:foodSelectedCity==='全部城市'?'#FEF3E8':C.bg, color:foodSelectedCity==='全部城市'?'#D97706':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                全部城市
              </button>
              {cities.map(city => (
                <button key={city} onClick={() => { setFoodSelectedCity(city); setFoodSelectedDistricts([]); }}
                  style={{ flexShrink:0, padding:'5px 12px', borderRadius:10, border:`1.5px solid ${foodSelectedCity===city?'#D97706':C.border}`, backgroundColor:foodSelectedCity===city?'#D97706':C.bg, color:foodSelectedCity===city?'#fff':C.textMuted, fontSize:12, fontWeight:700, cursor:'pointer' }}>
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
                        {item.city && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'#D97706', color:'#fff', fontSize:11, fontWeight:700 }}>{item.city}</span>}
                        {itemDistricts.map(d => <span key={d} style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.blueSoft, color:C.blue, fontSize:11, fontWeight:700 }}>📍 {d}</span>)}
                        {item.foodType && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:C.greenSoft, color:C.green, border:`1px solid ${C.green}33`, fontSize:11, fontWeight:700 }}>{item.foodType}</span>}
                        {item.visited && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'#FEF3E8', color:'#D97706', fontSize:11, fontWeight:700 }}>✓ 已去</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => setFoodModal({open:true,data:{...item}})} style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:C.bg, color:C.textMuted, fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => setConfirmDel({title:'刪除美食',message:`確定刪除「${item.name}」？`,fn:()=>{const n=foodItems.filter(i=>i.id!==item.id);setFoodItems(n);saveFood(n);}})} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:14, cursor:'pointer' }}>×</button>
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{item.name}</div>
                    {item.linkedDate && <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6, backgroundColor:color+'18', marginBottom:4 }}><span style={{ fontSize:11, color, fontWeight:700 }}>🗓 {item.linkedDate}</span></div>}
                    {item.price && <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>💴 {item.price}</div>}
                    {item.note && <div style={{ fontSize:12, color:'#5A5247', backgroundColor:'#FEF3E8', borderLeft:'3px solid #D97706', padding:'8px 10px', borderRadius:'0 8px 8px 0', marginBottom:8, whiteSpace:'pre-wrap' }}>{item.note}</div>}
                    {item.photos?.length>0 && <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>{item.photos.map((p,i) => <img key={i} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="food" />)}</div>}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                      <div style={{ fontSize:10, color:C.textMuted }}>{item.editedByName||'成員'} 新增</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { const n=foodItems.map(i=>i.id===item.id?{...i,visited:!i.visited}:i); setFoodItems(n);saveFood(n); }}
                          style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${item.visited?'#D97706':C.border}`, backgroundColor:item.visited?'#FEF3E8':C.bg, color:item.visited?'#D97706':C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          {item.visited?'✓ 已去':'標記已去'}
                        </button>
                        {(item.branches||[]).filter(b=>b.mapUrl).map((b,bi)=>(
                        <button key={bi} onClick={()=>window.open(b.mapUrl,'_blank')} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #FDDCB0', backgroundColor:'#FEF3E8', color:'#D97706', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺 {b.name||'地圖'}</button>
                      ))}
                      {!(item.branches||[]).length && item.mapUrl && <button onClick={()=>window.open(item.mapUrl,'_blank')} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #FDDCB0', backgroundColor:'#FEF3E8', color:'#D97706', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺 地圖</button>}
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
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#fff', fontSize:26, cursor:'pointer', boxShadow:'0 4px 16px rgba(217,119,6,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>
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
    const activeItems = isShared ? walletItems : personalWalletItems;
    const setActiveItems = (fn) => {
      const next = typeof fn==='function' ? fn(activeItems) : fn;
      if(isShared){ setWalletItems(next); saveWallet(next); }
      else { setPersonalWalletItems(next); savePersonalWallet(next); }
    };

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
        const per=Math.floor((Number(w.amount)||0)/(ids.length||1));
        ids.forEach(id=>{memberBalance[id][w.currency]=(memberBalance[id][w.currency]||0)+per;});
      } else {
        const ids=(w.forMemberIds||allUids).filter(id=>memberBalance[id]!==undefined);
        const per=Math.floor((Number(w.amount)||0)/(ids.length||1));
        ids.forEach(id=>{memberBalance[id][w.currency]=(memberBalance[id][w.currency]||0)-per;});
      }
    });

    // 代墊結算
    const unsettled = (Array.isArray(splitRecords)?splitRecords:[]).filter(r=>!r.settled);
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
        {/* 公費錢包 */}
        <button onClick={()=>setWalletSubTab('shared-detail')}
          style={{ ...gs.card, cursor:'pointer', padding:'18px 20px', border:`1.5px solid ${C.purple}22`, background:C.purpleSoft, textAlign:'left', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.purple }}>💰 共同公費</div>
            <div style={{ fontSize:18, color:C.purple }}>›</div>
          </div>
          {Object.keys(sharedTotals).length===0 ? (
            <div style={{ fontSize:12, color:C.textMuted }}>尚無帳目，點此新增</div>
          ) : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {Object.entries(sharedTotals).map(([cur,val])=>(
                <div key={cur} style={{ padding:'6px 12px', borderRadius:10, backgroundColor:val>=0?(CurrencyBg[cur]||'#F0FFF4'):'#FFF0F0', border:`1px solid ${val>=0?(CurrencyC[cur]||C.green):C.danger}33` }}>
                  <div style={{ fontSize:10, color:C.textMuted }}>{cur}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:val>=0?(CurrencyC[cur]||C.green):C.danger }}>{val>=0?'+':''}{SYM[cur]||''}{Math.abs(val).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize:11, color:C.textMuted }}>{walletItems.length} 筆帳目・點此查看明細</div>
        </button>

        {/* 個人帳務 */}
        <button onClick={()=>setWalletSubTab('personal-detail')}
          style={{ ...gs.card, cursor:'pointer', padding:'18px 20px', border:`1.5px solid ${C.blue}22`, background:C.blueSoft, textAlign:'left', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.blue }}>👤 個人帳務</div>
            <div style={{ fontSize:18, color:C.blue }}>›</div>
          </div>
          {Object.keys(personalTotals).length===0 ? (
            <div style={{ fontSize:12, color:C.textMuted }}>尚無帳目，點此新增</div>
          ) : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {Object.entries(personalTotals).map(([cur,val])=>(
                <div key={cur} style={{ padding:'6px 12px', borderRadius:10, backgroundColor:val>=0?(CurrencyBg[cur]||'#F0FFF4'):'#FFF0F0', border:`1px solid ${val>=0?(CurrencyC[cur]||C.green):C.danger}33` }}>
                  <div style={{ fontSize:10, color:C.textMuted }}>{cur}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:val>=0?(CurrencyC[cur]||C.green):C.danger }}>{val>=0?'+':''}{SYM[cur]||''}{Math.abs(val).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          {myTransfers.length>0 && (
            <div style={{ padding:'6px 10px', borderRadius:8, backgroundColor:C.dangerSoft, border:`1px solid ${C.danger}33` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.danger }}>⚠️ 有 {myTransfers.length} 筆代墊未結清</div>
            </div>
          )}
          <div style={{ fontSize:11, color:C.textMuted }}>{personalWalletItems.length} 筆帳目・點此查看明細</div>
        </button>

        {/* 匯率資訊 + 設定 */}
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

    // ── 明細頁（共用或個人）──
    const pageColor = isShared ? C.purple : C.blue;
    const pageBg = isShared ? C.purpleSoft : C.blueSoft;
    const pageTitle = isShared ? '共同公費' : '個人帳務';

    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* 次頁 header */}
        <div style={{ padding:'12px 16px', backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>setWalletSubTab('overview')} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:C.textMuted }}>←</button>
          <div style={{ fontSize:15, fontWeight:800 }}>{pageTitle}</div>
        </div>

        {/* 餘額 + 結算按鈕 */}
        <div style={{ padding:'12px 16px', backgroundColor:pageBg, borderBottom:`1px solid ${pageColor}22` }}>
          <div style={{ display:'flex', gap:10, overflowX:'auto', marginBottom: Object.keys(calcTotals(activeItems)).length>0?10:0 }}>
            {Object.entries(calcTotals(activeItems)).map(([cur,val])=>(
              <div key={cur} style={{ flexShrink:0, padding:'8px 14px', borderRadius:12, backgroundColor:val>=0?(CurrencyBg[cur]||C.greenSoft):'#FFF0F0', border:`1px solid ${val>=0?(CurrencyC[cur]||C.green):C.danger}33` }}>
                <div style={{ fontSize:10, color:C.textMuted, marginBottom:2 }}>{cur} 餘額</div>
                <div style={{ fontSize:16, fontWeight:800, color:val>=0?(CurrencyC[cur]||C.green):C.danger }}>{val>=0?'+':''}{SYM[cur]||''}{Math.abs(val).toLocaleString()}</div>
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
          {!isShared && myTransfers.length>0 && (
            <button onClick={()=>setShowPersonalSettlement(true)} style={{ width:'100%', padding:'9px 14px', borderRadius:12, border:`1px solid ${C.danger}33`, backgroundColor:'rgba(255,255,255,0.6)', color:C.danger, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>⚠️ {myTransfers.length} 筆代墊未結清</span><span>›</span>
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
                  <span key={cur} style={{ fontSize:11, fontWeight:700, color:val>=0?C.green:C.danger }}>{cur} {val>=0?'+':''}{SYM[cur]||''}{Math.abs(val).toLocaleString()}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 帳目列表 */}
        <div style={{ padding:16, flex:1 }}>
          {filteredItems.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:C.textMuted, fontSize:13 }}>{currentDate?`${currentDate} 尚無帳目`:'尚無帳目，點右下角 ＋ 新增'}</div>
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
                  if(item.splitPayerId){ const payer=members.find(m=>m.uid===item.splitPayerId)?.displayName||'?'; const receivers=(item.splitReceiverIds||[]).map(id=>members.find(m=>m.uid===id)?.displayName).filter(Boolean); memberLabel=`${payer} 代墊 → ${receivers.join('・')}`; }
                }
                const bg = isIncome?(CurrencyBg[cur]||C.greenSoft):'#F8F6FF';
                const bc = isIncome?(CurrencyC[cur]||C.green)+'22':'#C4B0FF44';
                return (
                  <div key={item.id} style={{ ...gs.card, padding:'14px 16px', backgroundColor:bg, border:`1px solid ${bc}` }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                          <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:isIncome?C.greenSoft:C.purpleSoft, color:isIncome?C.green:C.purple, fontSize:11, fontWeight:700 }}>{item.type}</span>
                          <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'rgba(255,255,255,0.8)', color:CurrencyC[cur]||C.text, fontSize:11, fontWeight:800 }}>{cur}</span>
                          {item.date&&<span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'rgba(255,255,255,0.6)', color:C.textMuted, fontSize:11 }}>{item.date}</span>}
                          {memberLabel&&<span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'rgba(255,255,255,0.6)', color:C.textMuted, fontSize:11 }}>{memberLabel}</span>}
                        </div>
                        <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{item.name}</div>
                        {item.note&&<div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{item.note}</div>}
                        <div style={{ fontSize:10, color:C.textMuted, marginTop:6 }}>{item.editedByName||'成員'} 記帳</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:isIncome?(CurrencyC[cur]||C.green):C.purple }}>{isIncome?'+':'-'}{SYM[cur]||''}{Number(item.amount||0).toLocaleString()}</div>
                        <div style={{ display:'flex', gap:4, marginTop:6, justifyContent:'flex-end' }}>
                          <button onClick={()=>{setWalletModal({open:true,data:{...item,contributorIds:item.contributorIds||allUids,forMemberIds:item.forMemberIds||allUids}});setWalletCalc(false);}} style={{ padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:8, backgroundColor:'rgba(255,255,255,0.8)', color:C.textMuted, fontSize:11, cursor:'pointer' }}>✏️</button>
                          <button onClick={()=>setConfirmDel({title:'刪除帳目',message:`確定刪除「${item.name}」？`,fn:()=>setActiveItems(p=>p.filter(i=>i.id!==item.id))})} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'rgba(255,255,255,0.8)', color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
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
        <button onClick={()=>{ const allUids=members.map(m=>m.uid); setWalletModal({open:true,data:{type:'支出',currency:'JPY',contributorIds:allUids,forMemberIds:allUids,paidById:user.uid,splitPayerId:null,splitReceiverIds:[]}}); setWalletCalc(false); }}
          style={{ position:'fixed', bottom:90, right:20, width:52, height:52, borderRadius:16, border:'none', background:`linear-gradient(135deg,${pageColor},${C.blue})`, color:'#fff', fontSize:26, cursor:'pointer', boxShadow:`0 4px 16px ${pageColor}66`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>＋</button>

        {/* ── 公費結算 Modal ── */}
        {showPoolSettlement&&(
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:400 }}>
            <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>📊 公費結算</div>
                <button onClick={()=>setShowPoolSettlement(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:16 }}>1 JPY ≈ NT${rates.JPY}・1 KRW ≈ NT${rates.KRW}・{ratesUpdatedAt}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
                {members.map(m=>{
                  const bal=memberBalance[m.uid]||{};
                  const hasBal=Object.values(bal).some(v=>v!==0);
                  return (
                    <div key={m.uid} style={{ ...gs.card, padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:hasBal?10:0 }}>
                        <div style={{ width:36,height:36,borderRadius:'50%',backgroundColor:C.purpleSoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:C.purple,flexShrink:0 }}>{(m.displayName||'?')[0].toUpperCase()}</div>
                        <div style={{ fontSize:14, fontWeight:700 }}>{m.displayName}{m.uid===user.uid&&<span style={{ fontSize:11,color:C.textMuted,marginLeft:4 }}>（我）</span>}</div>
                      </div>
                      {!hasBal ? <div style={{ fontSize:11,color:C.textMuted }}>無異動</div> : Object.entries(bal).filter(([,v])=>v!==0).map(([cur,v])=>(
                        <div key={cur} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderTop:`1px solid ${C.border}` }}>
                          <div style={{ fontSize:12,color:C.textMuted }}>{cur}</div>
                          <div style={{ fontSize:14,fontWeight:800,color:v>=0?C.green:C.danger }}>
                            {v>=0?'+':''}{SYM[cur]||''}{Math.abs(v).toLocaleString()}
                            <span style={{ fontSize:10,color:C.textMuted,fontWeight:400,marginLeft:4 }}>≈ NT${toTWD(Math.abs(v),cur).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>setShowPoolSettlement(false)} style={{ width:'100%',padding:13,border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',backgroundColor:C.bg,color:C.text }}>關閉</button>
            </div>
          </div>
        )}

        {/* ── 代墊結算 Modal ── */}
        {showPersonalSettlement&&(
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:400 }}>
            <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'88vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>代墊結算</div>
                <button onClick={()=>setShowPersonalSettlement(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:16 }}>1 JPY ≈ NT${rates.JPY}・1 KRW ≈ NT${rates.KRW}・{ratesUpdatedAt}</div>
              {transfers.length===0 ? (
                <div style={{ textAlign:'center',padding:'40px 20px' }}>
                  <div style={{ fontSize:36,marginBottom:10 }}>🎉</div>
                  <div style={{ fontSize:15,fontWeight:700,color:C.green }}>全部結清了！</div>
                </div>
              ) : transfers.map((t,idx)=>{
                const fromM=members.find(m=>m.uid===t.from)||{displayName:'?'};
                const toM=members.find(m=>m.uid===t.to)||{displayName:'?'};
                const iAmFrom=t.from===user.uid; const iAmTo=t.to===user.uid;
                const sk=t.from+t.to+t.currency;
                const s=transferStates[sk]||{paidConfirmed:false,receivedConfirmed:false};
                const done=s.paidConfirmed&&s.receivedConfirmed;
                const settle=()=>{ const n=splitRecords.filter(r=>!((r.payerId===t.to&&r.receiverId===t.from)||(r.payerId===t.from&&r.receiverId===t.to))&&r.currency===t.currency); setSplitRecords(n);saveSplitRecords(n); setTransferStates(p=>{const np={...p};delete np[sk];return np;}); };
                return (
                  <div key={idx} style={{ ...gs.card,padding:'14px 16px',marginBottom:10,opacity:done?0.5:1,backgroundColor:iAmTo?C.greenSoft:iAmFrom?C.dangerSoft:C.surface }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14,fontWeight:700 }}>{iAmFrom?'我':fromM.displayName} → {iAmTo?'我':toM.displayName}</div>
                        <div style={{ fontSize:18,fontWeight:800,color:iAmTo?C.green:iAmFrom?C.danger:C.text,marginTop:4 }}>{SYM[t.currency]||''}{t.amount.toLocaleString()} {t.currency}<span style={{ fontSize:11,color:C.textMuted,fontWeight:400,marginLeft:6 }}>≈ NT${toTWD(t.amount,t.currency).toLocaleString()}</span></div>
                      </div>
                      {(iAmFrom||iAmTo)&&!done&&<div style={{ fontSize:11,fontWeight:700,color:iAmTo?C.green:C.danger,padding:'5px 10px',borderRadius:8,border:`1px solid ${iAmTo?C.green:C.danger}33` }}>{iAmTo?'待收款':'待還款'}</div>}
                    </div>
                    {!done&&(
                      <div style={{ display:'flex',gap:8 }}>
                        <button disabled={!iAmFrom||s.paidConfirmed} onClick={()=>{ const ns={...s,paidConfirmed:true}; setTransferStates(p=>({...p,[sk]:ns})); if(ns.receivedConfirmed)settle(); }}
                          style={{ flex:1,padding:'9px',borderRadius:10,border:`1px solid ${s.paidConfirmed?C.green:C.border}`,backgroundColor:s.paidConfirmed?C.greenSoft:C.bg,color:s.paidConfirmed?C.green:C.textMuted,fontSize:12,fontWeight:700,cursor:iAmFrom?'pointer':'default',opacity:iAmFrom?1:0.5 }}>
                          {s.paidConfirmed?'✓ 已轉帳':`${fromM.displayName} 已轉帳`}
                        </button>
                        <button disabled={!iAmTo||s.receivedConfirmed} onClick={()=>{ const ns={...s,receivedConfirmed:true}; setTransferStates(p=>({...p,[sk]:ns})); if(ns.paidConfirmed)settle(); }}
                          style={{ flex:1,padding:'9px',borderRadius:10,border:`1px solid ${s.receivedConfirmed?C.green:C.border}`,backgroundColor:s.receivedConfirmed?C.greenSoft:C.bg,color:s.receivedConfirmed?C.green:C.textMuted,fontSize:12,fontWeight:700,cursor:iAmTo?'pointer':'default',opacity:iAmTo?1:0.5 }}>
                          {s.receivedConfirmed?'✓ 已收款':'確認收款'}
                        </button>
                      </div>
                    )}
                    {done&&<div style={{ textAlign:'center',fontSize:12,color:C.green,fontWeight:700 }}>✓ 已結清</div>}
                    {!done&&<div style={{ textAlign:'center',fontSize:10,color:C.textMuted,marginTop:6 }}>{!s.paidConfirmed&&!s.receivedConfirmed?'雙方確認後自動結清':s.paidConfirmed?`等待 ${toM.displayName} 確認收款`:`等待 ${fromM.displayName} 確認轉帳`}</div>}
                  </div>
                );
              })}
              <div style={{ marginTop:8 }}>
                <button onClick={()=>setShowPersonalSettlement(false)} style={{ width:'100%',padding:13,border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',backgroundColor:C.bg,color:C.text }}>關閉</button>
              </div>
            </div>
          </div>
        )}
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
        {/* 只有多城市才顯示城市篩選，地區和商場依設定顯示 */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* 城市：多個才顯示 */}
          {(shopOptions.cities||[]).length > 1 && (
            <select value={shopFilterCity} onChange={e=>{setShopFilterCity(e.target.value);setShopFilterMall('全部商場');}}
              style={{ flex:1, minWidth:80, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterCity!=='全部城市'?'#BE185D':C.border}`, backgroundColor:shopFilterCity!=='全部城市'?'#FDE8F3':C.bg, color:shopFilterCity!=='全部城市'?'#BE185D':C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
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
                style={{ flex:1, minWidth:80, padding:'7px 6px', borderRadius:10, border:`1.5px solid ${shopFilterCity!=='全部城市'&&districts.includes(shopFilterCity)?'#BE185D':C.border}`, backgroundColor:districts.includes(shopFilterCity)?'#FDE8F3':C.bg, color:districts.includes(shopFilterCity)?'#BE185D':C.textMuted, fontSize:11, fontWeight:700, cursor:'pointer', outline:'none', textAlign:'center' }}>
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
                      {item.district && <span style={{ padding:'2px 8px', borderRadius:6, backgroundColor:'#FDE8F3', color:'#BE185D', border:'1px solid #F9B8DA', fontSize:11, fontWeight:700 }}>📍 {item.district}</span>}
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
                  {item.photos?.length > 0 && (
                    <div style={{ display:'flex', gap:6, overflowX:'auto', marginTop:8, marginBottom:4 }}>
                      {item.photos.map((p,pi) => <img key={pi} src={p} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} alt="shop" />)}
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10, color:C.textMuted }}>{item.addedByName||'成員'} 許願</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {(item.branches||[]).filter(b=>b.mapUrl).map((b,bi)=>(
                        <button key={bi} onClick={()=>window.open(b.mapUrl,'_blank')} style={{ padding:'4px 10px', borderRadius:8, border:'1px solid #F9B8DA', backgroundColor:'#FDE8F3', color:'#BE185D', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺 {b.name}</button>
                      ))}
                      {!(item.branches||[]).length && item.mapUrl && <button onClick={()=>window.open(item.mapUrl,'_blank')} style={{ padding:'4px 10px', borderRadius:8, border:'1px solid #F9B8DA', backgroundColor:'#FDE8F3', color:'#BE185D', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗺</button>}
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
      }}
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
                        <button onClick={() => { const n=sharedTodos.filter(t=>t.id!==todo.id); setSharedTodos(n);saveTodos(n); }} style={{ padding:'4px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:11, cursor:'pointer' }}>×</button>
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
                      <button onClick={() => { const n=sharedNotes.filter(x=>x.id!==note.id); setSharedNotes(n);saveNotes(n); }} style={{ padding:'5px 8px', border:`1px solid ${C.danger}33`, borderRadius:8, backgroundColor:'#FDE8E8', color:C.danger, fontSize:14, cursor:'pointer' }}>×</button>
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
                    style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${d.city===city?'#D97706':C.border}`, backgroundColor:d.city===city?'#D97706':C.bg, color:d.city===city?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
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
                  <div style={{ padding:'8px 12px', borderRadius:10, backgroundColor:'#FEF3E8', color:'#D97706', fontSize:13, fontWeight:700, flexShrink:0, minWidth:60, textAlign:'center' }}>{b.name}</div>
                  <input style={{ ...gs.input, flex:1, padding:'10px 12px', fontSize:14 }} placeholder="貼上 Google Maps 連結" value={b.mapUrl||''}
                    onChange={e => setFoodModal(p=>({...p,data:{...p.data,branches:p.data.branches.map((x,i)=>i===bi?{...x,mapUrl:e.target.value}:x)}}))} />
                </div>
              ))}
              <button type="button" onClick={() => setFoodModal(p=>({...p,data:{...p.data,branches:[...(p.data.branches||[]),{name:'',mapUrl:''}]}}))}
                style={{ fontSize:12, color:'#D97706', fontWeight:700, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>＋ 新增分店</button>
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
          }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#fff' }}>確認儲存</button>
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
                    style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${activeCity===city?'#BE185D':C.border}`, backgroundColor:activeCity===city?'#BE185D':C.bg, color:activeCity===city?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
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
                  }} style={{ padding:'7px 14px', borderRadius:10, border:`1.5px solid ${d.district===dist?'#BE185D':C.border}`, backgroundColor:d.district===dist?'#FDE8F3':C.bg, color:d.district===dist?'#BE185D':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
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
                  <div style={{ padding:'8px 12px', borderRadius:10, backgroundColor:'#FDE8F3', color:'#BE185D', fontSize:13, fontWeight:700, flexShrink:0, minWidth:60, textAlign:'center' }}>{b.name}</div>
                  <input style={{ ...gs.input, flex:1, padding:'10px 12px', fontSize:14 }} placeholder="貼上 Google Maps 連結"
                    value={b.mapUrl||''} onChange={e=>setShoppingModal(p=>({...p,data:{...p.data,branches:p.data.branches.map((x,i)=>i===bi?{...x,mapUrl:e.target.value}:x)}}))} />
                </div>
              ))}
              <button type="button" onClick={() => setShoppingModal(p=>({...p,data:{...p.data,branches:[...branches,{name:'',mapUrl:''}]}}))}
                style={{ fontSize:12, color:'#BE185D', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>＋ 新增分店</button>
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
          }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#BE185D,#EC4899)', color:'#fff' }}>確認儲存</button>
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
                <div key={`${city}-${district}`} style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', backgroundColor:'#FDE8F3', border:'1px solid #F9B8DA', borderRadius:20 }}>
                  {cities.length>1 && <span style={{ fontSize:11, color:'#BE185D', opacity:0.7 }}>{city} · </span>}
                  <span style={{ fontSize:13, fontWeight:700, color:'#BE185D' }}>{district}</span>
                  <button onClick={() => {
                    const newLocs = {...locationsMap, [city]:(locationsMap[city]||[]).filter(x=>x!==district)};
                    const newMalls = {...mallsMap};
                    if(newMalls[city]) delete newMalls[city][district];
                    updateOpts({...shopOptions, locations:newLocs, malls:newMalls});
                  }} style={{ background:'none', border:'none', color:'#BE185D', fontSize:16, cursor:'pointer', lineHeight:1, padding:0, opacity:0.7 }}>×</button>
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
              }} style={{ padding:'12px 16px', border:'none', borderRadius:12, backgroundColor:'#BE185D', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>＋</button>
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

    return (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
        <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'92vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{d.id?'編輯帳目':'新增帳目'}</div>
            <button onClick={()=>{setWalletModal({open:false,data:null});setWalletCalc(false);}} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
          </div>

          {/* 存入/支出 */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {['支出','存入'].map(t=>(
              <button key={t} type="button" onClick={()=>setWalletModal(p=>({...p,data:{...p.data,type:t}}))}
                style={{ flex:1, padding:11, borderRadius:12, border:`1.5px solid ${d.type===t?(t==='支出'?C.danger:C.green):C.border}`, backgroundColor:d.type===t?(t==='支出'?C.dangerSoft:C.greenSoft):C.bg, color:d.type===t?(t==='支出'?C.danger:C.green):C.textMuted, fontSize:14, fontWeight:700, cursor:'pointer' }}>{t}</button>
            ))}
          </div>

          {/* 名稱 */}
          <div style={{ marginBottom:12 }}><label style={gs.label}>項目名稱 *</label><ImeInput key="wallet-name" style={gs.input} placeholder="例：晚餐、計程車" value={d.name||''} onChange={v=>setWalletModal(p=>({...p,data:{...p.data,name:v}}))} /></div>

          {/* 金額 + 計算機 */}
          <div style={{ backgroundColor:C.bg, borderRadius:14, padding:14, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>金額</div>
                <input type="text" value={d.amount||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,amount:e.target.value}}))} placeholder="0" style={{ fontSize:28, fontWeight:800, color:C.text, background:'none', border:'none', outline:'none', width:'100%' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                <button onClick={()=>setWalletCalc(v=>!v)} style={{ padding:'6px 10px', borderRadius:10, border:`1px solid ${walletCalc?pageColor:C.border}`, backgroundColor:walletCalc?(isShared?C.purpleSoft:C.blueSoft):C.bg, color:walletCalc?pageColor:C.textMuted, fontSize:18, cursor:'pointer' }}>🔢</button>
                <select value={d.currency||'JPY'} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,currency:e.target.value}}))} style={{ padding:'5px 8px', borderRadius:8, border:`1px solid ${C.border}`, backgroundColor:C.bg, fontSize:13, fontWeight:700, color:pageColor, cursor:'pointer', outline:'none' }}>
                  {['JPY','KRW','TWD','USD'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          {walletCalc&&(
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
              {[1,2,3,4,5,6,7,8,9,'.',0].map(n=>(
                <button key={n} onClick={()=>setWalletModal(p=>({...p,data:{...p.data,amount:(p.data?.amount||'')+n.toString()}}))} style={{ padding:12, borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.surface, fontSize:16, fontWeight:700, cursor:'pointer' }}>{n}</button>
              ))}
              <button onClick={()=>setWalletModal(p=>({...p,data:{...p.data,amount:String(p.data?.amount||'').slice(0,-1)}}))} style={{ padding:12, borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.bg, fontSize:16, cursor:'pointer' }}>⌫</button>
            </div>
          )}

          {/* 共用公費：存入選人 / 支出選分攤對象 */}
          {isShared && d.type==='存入' && (
            <div style={{ marginBottom:12, backgroundColor:C.greenSoft, borderRadius:12, padding:'12px 14px', border:`1px solid ${C.green}22` }}>
              <label style={{ ...gs.label, color:C.green }}>誰存入（預設全員）</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                {members.map(m=>{ const sel=contributorIds.includes(m.uid); return (
                  <button key={m.uid} type="button" onClick={()=>{ const cur=contributorIds; const next=sel?cur.filter(x=>x!==m.uid):[...cur,m.uid]; if(next.length===0)return; setWalletModal(p=>({...p,data:{...p.data,contributorIds:next}})); }}
                    style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${sel?C.green:C.border}`, backgroundColor:sel?C.green:'transparent', color:sel?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                  </button>
                );})}
              </div>
              {contributorIds.length>1&&d.amount&&<div style={{ fontSize:11, color:C.green, fontWeight:700, marginTop:6 }}>每人 {Math.floor(Number(d.amount)/contributorIds.length).toLocaleString()} {d.currency||'JPY'}</div>}
            </div>
          )}
          {isShared && d.type==='支出' && (
            <div style={{ marginBottom:12, backgroundColor:C.purpleSoft, borderRadius:12, padding:'12px 14px', border:`1px solid ${C.purple}22` }}>
              <label style={{ ...gs.label, color:C.purple }}>幫誰支出（預設全員）</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                {members.map(m=>{ const sel=forMemberIds.includes(m.uid); return (
                  <button key={m.uid} type="button" onClick={()=>{ const cur=forMemberIds; const next=sel?cur.filter(x=>x!==m.uid):[...cur,m.uid]; if(next.length===0)return; setWalletModal(p=>({...p,data:{...p.data,forMemberIds:next}})); }}
                    style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${sel?C.purple:C.border}`, backgroundColor:sel?C.purple:'transparent', color:sel?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                  </button>
                );})}
              </div>
            </div>
          )}

          {/* 個人記帳：代墊設定 */}
          {!isShared && (
            <div style={{ marginBottom:12, backgroundColor:C.blueSoft, borderRadius:12, padding:'12px 14px', border:`1px solid ${C.blue}22` }}>
              <label style={{ ...gs.label, color:C.blue }}>💳 代墊設定（選填）</label>
              <div style={{ marginBottom:8, marginTop:6 }}>
                <label style={gs.label}>代墊人</label>
                <select value={d.splitPayerId||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,splitPayerId:e.target.value||null,splitReceiverIds:[]}}))} style={{ ...gs.input, cursor:'pointer' }}>
                  <option value="">無（自己的帳）</option>
                  {members.map(m=><option key={m.uid} value={m.uid}>{m.uid===user.uid?`${m.displayName}（我）`:m.displayName}</option>)}
                </select>
              </div>
              {d.splitPayerId&&(
                <div>
                  <label style={gs.label}>幫誰代墊（可多選）</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                    {members.map(m=>{ const sel=(d.splitReceiverIds||[]).includes(m.uid); return (
                      <button key={m.uid} type="button" onClick={()=>{ const cur=d.splitReceiverIds||[]; const next=sel?cur.filter(x=>x!==m.uid):[...cur,m.uid]; setWalletModal(p=>({...p,data:{...p.data,splitReceiverIds:next}})); }}
                        style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${sel?C.blue:C.border}`, backgroundColor:sel?C.blue:'transparent', color:sel?'#fff':C.textMuted, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        {m.uid===user.uid?`${m.displayName}（我）`:m.displayName}
                      </button>
                    );})}
                  </div>
                  {(d.splitReceiverIds||[]).length>0&&d.amount&&<div style={{ fontSize:11, color:C.blue, fontWeight:700, marginTop:6 }}>每人 {Math.floor(Number(d.amount)/(d.splitReceiverIds||[]).length).toLocaleString()} {d.currency||'JPY'}</div>}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom:12 }}><label style={gs.label}>日期</label><input type="date" style={gs.input} value={d.date||''} onChange={e=>setWalletModal(p=>({...p,data:{...p.data,date:e.target.value}}))} /></div>
          <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><ImeInput key="wallet-note" style={gs.input} placeholder="選填" value={d.note||''} onChange={v=>setWalletModal(p=>({...p,data:{...p.data,note:v}}))} /></div>

          <button onClick={()=>{
            if(!d.name?.trim()||!d.amount||!d.date)return;
            const allUids=members.map(m=>m.uid);
            // 格式化日期 2026-06-20 → 06/20
            const dateFormatted = d.date.includes('-') ? d.date.split('-').slice(1).join('/') : d.date;
            const fd={...d, date:dateFormatted, editedByName:user.displayName||user.email, editedById:user.uid, createdAt:d.createdAt||Date.now(),
              contributorIds:isShared&&d.type==='存入'?contributorIds:undefined,
              forMemberIds:isShared&&d.type==='支出'?forMemberIds:undefined,
            };
            // 清掉 undefined
            const clean=Object.fromEntries(Object.entries(fd).filter(([,v])=>v!==undefined));
            const curItems=isShared?walletItems:personalWalletItems; const n=d.id?curItems.map(i=>i.id===d.id?clean:i):[...curItems,{...clean,id:Date.now()}];
            if(isShared){setWalletItems(n);saveWallet(n);}else{setPersonalWalletItems(n);savePersonalWallet(n);}
            setWalletSelectedDate(dateFormatted);
            // 代墊記錄
            if(!isShared&&d.splitPayerId&&(d.splitReceiverIds||[]).length>0&&d.amount){
              const receivers=d.splitReceiverIds||[];
              const per=Math.floor(Number(d.amount)/receivers.length);
              const now=Date.now();
              const newRecs=receivers.map((rid,i)=>({ id:now+i+100, payerId:d.splitPayerId, receiverId:rid, amount:per, currency:d.currency||'JPY', note:d.name||'', createdAt:now }));
              const nr=[...splitRecords,...newRecs]; setSplitRecords(nr); saveSplitRecords(nr);
            }
            setWalletModal({open:false,data:null}); setWalletCalc(false);
          }} style={{ width:'100%', border:'none', borderRadius:13, padding:14, fontSize:15, fontWeight:700, cursor:'pointer', background:`linear-gradient(135deg,${pageColor},${C.blue})`, color:'#fff' }}>確認儲存</button>
        </div>
      </div>
    );
  };

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

  // 待辦 Modal
  const TodoModal = () => !todoModal.open ? null : (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(45,42,36,0.5)', display:'flex', alignItems:'flex-end', zIndex:200 }}>
      <div style={{ ...gs.card, width:'100%', borderBottomLeftRadius:0, borderBottomRightRadius:0, maxHeight:'80vh', overflowY:'auto', boxSizing:'border-box', borderBottom:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:800 }}>{todoModal.data?.id?'編輯':'新增項目'}</div>
          <button onClick={() => setTodoModal({open:false,data:null})} style={{ background:'none', border:'none', color:C.textMuted, fontSize:24, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}><label style={gs.label}>內容 *</label><ImeInput key="todo-content" style={gs.input} placeholder="輸入待辦事項..." value={todoModal.data?.content||''} onChange={v=>setTodoModal(p=>({...p,data:{...p.data,content:v}}))} /></div>
        <div style={{ marginBottom:16 }}><label style={gs.label}>備註</label><ImeInput key="todo-note" multiline value={todoModal.data?.note||''} onChange={v=>setTodoModal(p=>({...p,data:{...p.data,note:v}}))} rows={3} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
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
        <div style={{ marginBottom:16 }}><ImeInput key="note-content" multiline value={noteModal.data?.content||''} onChange={v=>setNoteModal(p=>({...p,data:{...p.data,content:v}}))} placeholder="輸入記事內容..." rows={5} style={{ ...gs.input, resize:'none', fontFamily:'inherit' }} /></div>
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
    <div style={{ ...gs.app, maxHeight:'100vh' }}
      onTouchStart={e => { window.__swipeStartX = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - (window.__swipeStartX||0);
        if (dx > 80) { // 右滑 80px 以上
          if (moreSection) setMoreSection(null);
          else if (walletSubTab !== 'overview') setWalletSubTab('overview');
          else onBack();
        }
      }}>
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
      {SettlementModal()}
      {CurrencySettingsModal()}
      {TodoModal()}
      {NoteModal()}
      {DatePickerModal()}
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
