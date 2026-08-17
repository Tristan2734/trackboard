import { useState, useEffect, useRef } from "react";
import {
  getUsers, saveUser, getSeances, addSeance, updateSeance,
  setPresence, getLogs, saveLog, getComps, addComp, updateComp,
  getCycles, addCycle, updateCycle
} from "./firebase";
import { ref, remove } from "firebase/database";
import { db } from "./firebase";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DISCIPLINES = [
  { id: "sprint", label: "Sprint" },
  { id: "haies", label: "Haies" },
  { id: "sprint_long", label: "Sprint long" },
  { id: "aerobic", label: "Aérobie" },
  { id: "longueur", label: "Longueur" },
  { id: "hauteur", label: "Hauteur" },
  { id: "perche", label: "Perche" },
  { id: "plio", label: "Plio" },
  { id: "poids", label: "Poids" },
  { id: "javelot", label: "Javelot" },
  { id: "disque", label: "Disque" },
  { id: "general", label: "Général" },
];

const TYPES = {
  piste: { label: "Piste", icon: "⚡", color: "#2D4A35", bg: "#E8F0E8" },
  muscu: { label: "Muscu", icon: "◆", color: "#1A1A1A", bg: "#F0EDE8" },
  autonomie: { label: "Autonomie", icon: "○", color: "#5A6B7A", bg: "#EAF0F5" },
};

const JOURS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const NIVEAUX_COMP = ["Meeting", "Départemental", "Régional", "National"];

const SEXE_OPTIONS = ["Homme", "Femme"];

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const C = {
  bg: "#F5F3EE",
  surface: "#FFFFFF",
  surfaceAlt: "#EDEAE3",
  green: "#2D4A35",
  greenLight: "#E8F0E8",
  greenMid: "#4A7A5A",
  text: "#1A1A1A",
  textMuted: "#888880",
  textLight: "#BEBAB0",
  border: "#E5E2DA",
  danger: "#C0392B",
  dangerBg: "#FDF0EF",
};

const T = {
  display: "'Clash Display', 'Plus Jakarta Sans', 'Inter', sans-serif",
  body: "'Plus Jakarta Sans', 'Inter', sans-serif",
};

// ─── STYLES GLOBAUX ──────────────────────────────────────────────────────────

const injectStyles = () => {
  if (document.getElementById("tb-styles")) return;
  const style = document.createElement("style");
  style.id = "tb-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { background: ${C.bg}; font-family: ${T.body}; -webkit-font-smoothing: antialiased; }
    input, textarea, select, button { font-family: ${T.body}; }
    ::-webkit-scrollbar { display: none; }
    .tb-input {
      width: 100%; padding: 14px 16px; border-radius: 12px;
      border: 1.5px solid ${C.border}; background: ${C.surface};
      font-size: 15px; color: ${C.text}; outline: none;
      transition: border-color 0.2s;
    }
    .tb-input:focus { border-color: ${C.green}; }
    .tb-btn-primary {
      width: 100%; padding: 16px; border-radius: 14px;
      background: ${C.green}; color: #fff; border: none;
      font-size: 15px; font-weight: 700; cursor: pointer;
      letter-spacing: 0.3px; transition: opacity 0.15s;
    }
    .tb-btn-primary:active { opacity: 0.85; }
    .tb-card {
      background: ${C.surface}; border-radius: 16px;
      border: 1px solid ${C.border}; padding: 16px;
    }
    .chip {
      display: inline-flex; align-items: center;
      padding: 6px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; letter-spacing: 0.2px;
      border: 1.5px solid transparent; cursor: pointer;
      transition: all 0.15s;
    }
    .chip-active { background: ${C.green}; color: #fff; border-color: ${C.green}; }
    .chip-inactive { background: transparent; color: ${C.textMuted}; border-color: ${C.border}; }
    .disc-chip { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
    .disc-chip-active { background: ${C.green}; color: #fff; }
    .disc-chip-inactive { background: ${C.surfaceAlt}; color: ${C.textMuted}; }
    .nav-btn { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 16px; transition: opacity 0.15s; }
    .row { display: flex; align-items: center; gap: 10px; }
    .fade-in { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .modal-sheet { animation: slideUp 0.25s cubic-bezier(0.32,0.72,0,1); }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  `;
  document.head.appendChild(style);
};

// ─── UI ATOMS ────────────────────────────────────────────────────────────────

function Avatar({ nom, prenom, size = 36, photo }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: photo ? "transparent" : C.greenLight,
      border: `2px solid ${C.greenLight}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: C.green,
      overflow: "hidden",
    }}>
      {photo
        ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : `${prenom?.[0] || ""}${nom?.[0] || ""}`}
    </div>
  );
}

function Label({ children, style: s }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: C.textMuted, marginBottom: 8, ...s }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;
}

function Modal({ children, onClose, title, fullscreen }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet" style={{
        width: "100%", maxWidth: 480,
        maxHeight: fullscreen ? "100vh" : "92vh",
        overflowY: "auto", background: C.bg,
        borderRadius: fullscreen ? 0 : "20px 20px 0 0",
        padding: "0 0 40px",
      }}>
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: T.display }}>{title}</div>
          <button onClick={onClose} style={{ background: C.surfaceAlt, border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "0 20px" }}>{children}</div>
      </div>
    </div>
  );
}

function TypeTag({ type }) {
  const t = TYPES[type] || TYPES.piste;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: t.bg, color: t.color, letterSpacing: 0.3 }}>
      {t.icon} {t.label}
    </span>
  );
}

function ScoreSlider({ label, value, onChange, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}<span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>/10</span></span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 4 }} />
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  useEffect(() => { injectStyles(); }, []);
  const [step, setStep] = useState("login"); // login | register
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [licence, setLicence] = useState("");
  const [isCoach, setIsCoach] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!nom.trim() || !prenom.trim() || !licence.trim()) { setErr("Remplis tous les champs."); return; }
    setLoading(true); setErr("");
    const id = `${prenom.toLowerCase().replace(/\s/g,"")}${nom.toLowerCase().replace(/\s/g,"")}${licence}`;
    const user = { id, nom: nom.trim(), prenom: prenom.trim(), licence: licence.trim(), role: isCoach ? "coach" : "athlete", createdAt: Date.now() };
    await saveUser(id, user);
    localStorage.setItem("tb_user", JSON.stringify(user));
    onLogin(user, isCoach);
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{ background: C.green, padding: "60px 28px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "rgba(255,255,255,0.5)", marginBottom: 12, textTransform: "uppercase" }}>Athlétisme</div>
        <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1.1, fontFamily: T.display }}>Track<span style={{ fontWeight: 200 }}>Board</span></div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 300 }}>Ton carnet d'entraînement</div>
      </div>

      {/* Form */}
      <div style={{ padding: "32px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <input className="tb-input" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
        <input className="tb-input" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} />
        <input className="tb-input" placeholder="N° de licence" value={licence} onChange={e => setLicence(e.target.value)} />

        {/* Coach toggle */}
        <div onClick={() => setIsCoach(!isCoach)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: isCoach ? C.greenLight : C.surface, border: `1.5px solid ${isCoach ? C.green : C.border}`, cursor: "pointer", transition: "all 0.2s" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isCoach ? C.green : C.text }}>Je suis coach</div>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>Accès à la gestion complète</div>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: isCoach ? C.green : C.border, position: "relative", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 2, left: isCoach ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </div>

        {err && <div style={{ fontSize: 13, color: C.danger }}>{err}</div>}

        <button className="tb-btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Connexion..." : "Accéder →"}
        </button>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => { injectStyles(); }, []);

  const [currentUser, setCurrentUser] = useState(null);
  const [isCoach, setIsCoach] = useState(false);
  const [view, setView] = useState("planning");

  const [users, setUsers] = useState({});
  const [seances, setSeances] = useState({});
  const [logs, setLogs] = useState({});
  const [comps, setComps] = useState({});
  const [cycles, setCycles] = useState({});

  const [selectedSeance, setSelectedSeance] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showLog, setShowLog] = useState(null);
  const [showAddSeance, setShowAddSeance] = useState(false);
  const [showAddComp, setShowAddComp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [filterGroupe, setFilterGroupe] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("tb_user");
    if (saved) { const u = JSON.parse(saved); setCurrentUser(u); setIsCoach(u.role === "coach"); }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubs = [
      getUsers(setUsers), getSeances(setSeances), getLogs(setLogs),
      getComps(setComps), getCycles(setCycles),
    ];
    return () => unsubs.forEach(u => u && u());
  }, [currentUser]);

  function handleLogin(user, coach) { setCurrentUser(user); setIsCoach(coach); }
  function logout() { localStorage.removeItem("tb_user"); setCurrentUser(null); setIsCoach(false); }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const athletesList = Object.values(users);
  const seancesList = Object.entries(seances).map(([id, s]) => ({ ...s, id }));

  const notifBadges = {};
  seancesList.forEach(s => {
    Object.entries(s.presences || {}).forEach(([uid, status]) => {
      if (status === "present" && !logs[`${uid}_${s.id}`]) notifBadges[`${uid}_${s.id}`] = true;
    });
  });
  const nbNonLogges = isCoach
    ? Object.keys(notifBadges).length
    : Object.keys(notifBadges).filter(k => k.startsWith(currentUser.id)).length;

  const seancesByJour = Array.from({ length: 7 }, (_, i) =>
    seancesList.filter(s => s.jour === i && (filterGroupe === "all" || s.groupe === filterGroupe))
      .sort((a, b) => (a.heureDebut || "").localeCompare(b.heureDebut || ""))
  );

  const TABS = [
    { key: "planning", icon: "▦", label: "Planning" },
    isCoach ? { key: "athletes", icon: "◉", label: "Athlètes" } : { key: "dashboard", icon: "◈", label: "Mon bilan" },
    { key: "comps", icon: "◎", label: "Compèts" },
    isCoach ? { key: "muscu", icon: "◆", label: "Cycles" } : null,
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.textLight, textTransform: "uppercase" }}>TrackBoard</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: T.display, lineHeight: 1.2 }}>
            {isCoach ? "Coach" : currentUser.prenom}
            {isCoach && <span style={{ fontWeight: 200 }}> · vue ensemble</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {nbNonLogges > 0 && (
            <div style={{ background: C.danger, color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{nbNonLogges}</div>
          )}
          <div onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}>
            <Avatar nom={currentUser.nom} prenom={currentUser.prenom} photo={currentUser.photo} size={36} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {view === "planning" && <PlanningView seancesByJour={seancesByJour} athletesList={athletesList} logs={logs} notifBadges={notifBadges} filterGroupe={filterGroupe} setFilterGroupe={setFilterGroupe} isCoach={isCoach} currentUser={currentUser} onSelectSeance={setSelectedSeance} onAddSeance={() => setShowAddSeance(true)} />}
        {view === "athletes" && isCoach && <AthletesView athletesList={athletesList} seancesList={seancesList} logs={logs} notifBadges={notifBadges} onSelect={setSelectedAthlete} />}
        {view === "dashboard" && !isCoach && <DashboardView athlete={currentUser} seancesList={seancesList} logs={logs} cycles={cycles} notifBadges={notifBadges} onShowLog={setShowLog} />}
        {view === "comps" && <CompsView comps={comps} athletesList={athletesList} isCoach={isCoach} currentUser={currentUser} onUpdateComp={updateComp} onAdd={() => setShowAddComp(true)} />}
        {view === "muscu" && isCoach && <CyclesView cycles={cycles} athletesList={athletesList} onAddCycle={addCycle} onUpdateCycle={updateCycle} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "10px 0 18px", zIndex: 50 }}>
        {TABS.map(tab => (
          <button key={tab.key} className="nav-btn" onClick={() => setView(tab.key)}
            style={{ opacity: view === tab.key ? 1 : 0.35 }}>
            <span style={{ fontSize: 20, color: view === tab.key ? C.green : C.text }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === tab.key ? 700 : 400, color: view === tab.key ? C.green : C.textMuted, letterSpacing: 0.3 }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {selectedSeance && <SeanceModal seance={selectedSeance} athletesList={athletesList} logs={logs} isCoach={isCoach} currentUser={currentUser} notifBadges={notifBadges} onClose={() => setSelectedSeance(null)} onTogglePresence={(sid, uid, status) => setPresence(sid, uid, status)} onShowLog={setShowLog} onDelete={(id) => { remove(ref(db, `seances/${id}`)); setSelectedSeance(null); }} />}
      {showLog && <LogModal seance={showLog.seance} athleteId={showLog.athleteId} existingLog={logs[`${showLog.athleteId}_${showLog.seance.id}`]} onClose={() => setShowLog(null)} onSave={(data) => { saveLog(showLog.seance.id, showLog.athleteId, data); setShowLog(null); }} />}
      {showAddSeance && <AddSeanceModal onClose={() => setShowAddSeance(false)} onAdd={(data) => { addSeance(data); setShowAddSeance(false); }} />}
      {selectedAthlete && <Modal onClose={() => setSelectedAthlete(null)} title={`${selectedAthlete.prenom} ${selectedAthlete.nom}`}><DashboardView athlete={selectedAthlete} seancesList={seancesList} logs={logs} cycles={cycles} notifBadges={notifBadges} onShowLog={setShowLog} /></Modal>}
      {showAddComp && <AddCompModal onClose={() => setShowAddComp(false)} onAdd={(data) => { addComp(data); setShowAddComp(false); }} />}
      {showProfile && <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} onSave={(data) => { const updated = { ...currentUser, ...data }; saveUser(currentUser.id, updated); localStorage.setItem("tb_user", JSON.stringify(updated)); setCurrentUser(updated); setShowProfile(false); }} onLogout={logout} />}
    </div>
  );
}

// ─── PLANNING ────────────────────────────────────────────────────────────────

function PlanningView({ seancesByJour, athletesList, logs, notifBadges, filterGroupe, setFilterGroupe, isCoach, currentUser, onSelectSeance, onAddSeance }) {
  const groupes = ["all", "Pôle", "Club", "Monstres"];

  return (
    <div className="fade-in">
      {/* Filtre */}
      <div style={{ padding: "16px 20px 8px", display: "flex", gap: 8, overflowX: "auto" }}>
        {groupes.map(g => (
          <button key={g} onClick={() => setFilterGroupe(g === "all" ? "all" : g)}
            className={`chip ${filterGroupe === (g === "all" ? "all" : g) ? "chip-active" : "chip-inactive"}`}>
            {g === "all" ? "Tous" : g}
          </button>
        ))}
      </div>

      {seancesByJour.map((seances, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ padding: "12px 20px 6px", fontSize: 11, fontWeight: 700, color: C.textLight, letterSpacing: 1.5, textTransform: "uppercase" }}>{JOURS_FULL[i]}</div>
          {seances.length === 0 && <div style={{ padding: "0 20px 8px", fontSize: 13, color: C.textLight }}>—</div>}
          {seances.map(s => {
            const nbPresents = Object.values(s.presences || {}).filter(v => v === "present").length;
            const nbNonLog = Object.entries(s.presences || {}).filter(([uid, v]) => v === "present" && notifBadges[`${uid}_${s.id}`]).length;
            const myStatus = currentUser ? (s.presences || {})[currentUser.id] : null;
            const t = TYPES[s.type] || TYPES.piste;
            const discs = s.disciplines || [];
            return (
              <div key={s.id} onClick={() => onSelectSeance(s)}
                style={{ margin: "0 16px 8px", padding: "14px 16px", borderRadius: 16, background: C.surface, border: `1px solid ${nbNonLog > 0 ? "#F0C0BC" : C.border}`, cursor: "pointer", position: "relative" }}>
                {nbNonLog > 0 && <div style={{ position: "absolute", top: 10, right: 12, width: 8, height: 8, borderRadius: "50%", background: C.danger }} />}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, color: t.color, fontWeight: 900 }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: T.display }}>{s.heureDebut}–{s.heureFin}</span>
                      <TypeTag type={s.type} />
                      {s.groupe && s.groupe !== "all" && <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, background: C.surfaceAlt, padding: "2px 8px", borderRadius: 6 }}>{s.groupe}</span>}
                    </div>
                    {s.contenu && <div style={{ fontSize: 13, color: C.textMuted, marginBottom: discs.length ? 6 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 300 }}>{s.contenu}</div>}
                    {discs.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {discs.map(d => <span key={d} className="disc-chip disc-chip-active" style={{ fontSize: 10 }}>{DISCIPLINES.find(x => x.id === d)?.label || d}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: nbPresents > 0 ? C.green : C.textLight }}>{nbPresents}</div>
                    <div style={{ fontSize: 10, color: C.textLight, fontWeight: 300 }}>présent{nbPresents > 1 ? "s" : ""}</div>
                    {!isCoach && <div style={{ fontSize: 10, marginTop: 4, color: myStatus === "present" ? C.green : C.textLight, fontWeight: myStatus === "present" ? 700 : 300 }}>{myStatus === "present" ? "✓" : "—"}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {isCoach && (
        <div style={{ padding: "8px 16px 20px" }}>
          <button onClick={onAddSeance} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `2px dashed ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            + Nouvelle séance
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SÉANCE MODAL ─────────────────────────────────────────────────────────────

function SeanceModal({ seance, athletesList, logs, isCoach, currentUser, notifBadges, onClose, onTogglePresence, onShowLog, onDelete }) {
  const t = TYPES[seance.type] || TYPES.piste;
  const presents = athletesList.filter(a => (seance.presences || {})[a.id] === "present");
  const myStatus = (seance.presences || {})[currentUser?.id];
  const discs = seance.disciplines || [];

  return (
    <Modal onClose={onClose} title={`${seance.heureDebut} – ${seance.heureFin}`}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <TypeTag type={seance.type} />
        {seance.groupe && <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, background: C.surfaceAlt, padding: "4px 10px", borderRadius: 6 }}>{seance.groupe}</span>}
        {seance.lieu && <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, background: C.surfaceAlt, padding: "4px 10px", borderRadius: 6 }}>📍 {seance.lieu}</span>}
      </div>

      {seance.contenu && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: C.surfaceAlt, marginBottom: 16, fontSize: 14, color: C.text, lineHeight: 1.6, fontWeight: 300 }}>
          {seance.contenu}
        </div>
      )}

      {discs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Label>Disciplines</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {discs.map(d => <span key={d} className="disc-chip disc-chip-active">{DISCIPLINES.find(x => x.id === d)?.label || d}</span>)}
          </div>
        </div>
      )}

      {/* Ma présence */}
      <div style={{ marginBottom: 16 }}>
        <Label>Ma présence</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onTogglePresence(seance.id, currentUser.id, myStatus === "present" ? null : "present")}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${myStatus === "present" ? C.green : C.border}`, background: myStatus === "present" ? C.greenLight : C.surface, color: myStatus === "present" ? C.green : C.textMuted, fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}>
            ✓ Je viens
          </button>
          <button onClick={() => onTogglePresence(seance.id, currentUser.id, myStatus === "absent" ? null : "absent")}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${myStatus === "absent" ? C.danger : C.border}`, background: myStatus === "absent" ? C.dangerBg : C.surface, color: myStatus === "absent" ? C.danger : C.textMuted, fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}>
            ✗ Absent
          </button>
        </div>
        {myStatus === "present" && (
          <button onClick={() => onShowLog({ seance, athleteId: currentUser.id })}
            style={{ marginTop: 10, width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${notifBadges[`${currentUser.id}_${seance.id}`] ? C.danger : C.green}`, background: notifBadges[`${currentUser.id}_${seance.id}`] ? C.dangerBg : C.greenLight, color: notifBadges[`${currentUser.id}_${seance.id}`] ? C.danger : C.green, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            {logs[`${currentUser.id}_${seance.id}`] ? "✏️ Modifier mon bilan" : "📝 Remplir mon bilan"}
          </button>
        )}
      </div>

      {/* Présents */}
      <Label>Présents ({presents.length})</Label>
      {presents.length === 0 && <div style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>Personne n'a coché pour l'instant.</div>}
      <div style={{ marginBottom: 16 }}>
        {presents.map(a => {
          const logged = logs[`${a.id}_${seance.id}`];
          const needsLog = notifBadges[`${a.id}_${seance.id}`];
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.prenom} {a.nom}</div>
                {logged ? <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>Forme {logged.forme}/10 · Fatigue {logged.fatigue}/10</div>
                  : <div style={{ fontSize: 12, color: C.danger, fontWeight: 500 }}>Bilan non rempli</div>}
              </div>
              {isCoach && (
                <button onClick={() => onShowLog({ seance, athleteId: a.id })}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${needsLog ? C.danger : C.border}`, background: needsLog ? C.dangerBg : C.surfaceAlt, color: needsLog ? C.danger : C.textMuted, cursor: "pointer", fontWeight: 600 }}>
                  {logged ? "Voir" : "Saisir"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Supprimer (coach) */}
      {isCoach && (
        <button onClick={() => { if (window.confirm("Supprimer cette séance ?")) onDelete(seance.id); }}
          style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${C.danger}`, background: C.dangerBg, color: C.danger, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          Supprimer la séance
        </button>
      )}
    </Modal>
  );
}

// ─── LOG MODAL ────────────────────────────────────────────────────────────────

function LogModal({ seance, athleteId, existingLog, onClose, onSave }) {
  const [forme, setForme] = useState(existingLog?.forme ?? 7);
  const [fatigue, setFatigue] = useState(existingLog?.fatigue ?? 5);
  const [rpe, setRpe] = useState(existingLog?.rpe ?? 6);
  const [notes, setNotes] = useState(existingLog?.notes ?? "");
  const [exos, setExos] = useState(existingLog?.exos ?? []);

  function updateExo(i, f, v) { setExos(prev => prev.map((e, idx) => idx === i ? { ...e, [f]: v } : e)); }

  function save() {
    const data = seance.type === "muscu"
      ? { type: "muscu", rpe, notes, exos }
      : { type: seance.type, forme, fatigue, rpe, notes };
    onSave(data);
  }

  return (
    <Modal onClose={onClose} title="Bilan de séance">
      {seance.type !== "muscu" ? (
        <>
          <ScoreSlider label="Forme générale" value={forme} onChange={setForme} color={C.green} />
          <ScoreSlider label="Fatigue ressentie" value={fatigue} onChange={setFatigue} color={C.danger} />
          <ScoreSlider label="RPE global" value={rpe} onChange={setRpe} color="#7A5A9A" />
          <div style={{ marginBottom: 20 }}>
            <Label>Notes libres</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Marques, sensations, intentions, gênes..."
              className="tb-input" style={{ resize: "none", lineHeight: 1.6 }} />
          </div>
        </>
      ) : (
        <>
          <ScoreSlider label="RPE global" value={rpe} onChange={setRpe} color="#7A5A9A" />
          <Label>Exercices</Label>
          {exos.map((e, i) => (
            <div key={i} style={{ padding: "12px", borderRadius: 12, background: C.surfaceAlt, marginBottom: 8 }}>
              <input value={e.nom} onChange={ev => updateExo(i, "nom", ev.target.value)} placeholder="Exercice" className="tb-input" style={{ marginBottom: 8, background: C.surface }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {["series", "reps", "charge", "rpe"].map(f => (
                  <input key={f} type="number" value={e[f] || ""} onChange={ev => updateExo(i, f, ev.target.value)}
                    placeholder={{ series: "×", reps: "reps", charge: "kg", rpe: "rpe" }[f]}
                    className="tb-input" style={{ textAlign: "center", padding: "8px 4px", fontSize: 13 }} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setExos(prev => [...prev, { nom: "", series: "", reps: "", charge: "", rpe: "" }])}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: `2px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            + Ajouter un exercice
          </button>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes globales..."
            className="tb-input" style={{ resize: "none", marginBottom: 12 }} />
        </>
      )}
      <button className="tb-btn-primary" onClick={save}>Sauvegarder</button>
    </Modal>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardView({ athlete, seancesList, logs, cycles, notifBadges, onShowLog }) {
  if (!athlete) return null;
  const mySeances = seancesList.filter(s => (s.presences || {})[athlete.id] === "present");
  const cyclesList = Object.entries(cycles || {}).map(([id, c]) => ({ ...c, id }));
  const myCycles = cyclesList.filter(c => (c.assignes || []).includes(athlete.id));

  return (
    <div className="fade-in" style={{ padding: "16px 20px" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Séances", val: mySeances.length },
          { label: "Bilans remplis", val: mySeances.filter(s => logs[`${athlete.id}_${s.id}`]).length },
        ].map(stat => (
          <div key={stat.label} style={{ padding: "16px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: C.textLight, textTransform: "uppercase", marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: T.display }}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Records */}
      {(athlete.records || athlete.sexe) && (
        <div style={{ marginBottom: 24 }}>
          <Label>Records personnels</Label>
          <div className="tb-card">
            {athlete.sexe && <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, fontWeight: 300 }}>{athlete.sexe}</div>}
            {athlete.records && Object.entries(athlete.records).map(([k, v]) => v ? (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 300 }}>{k}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{v}</span>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Cycles */}
      {myCycles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Label>Cycles muscu en cours</Label>
          {myCycles.map(c => (
            <div key={c.id} className="tb-card" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: T.display, marginBottom: 4 }}>{c.nom}</div>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300, marginBottom: 12 }}>{c.duree} semaines</div>
              {(c.exercices || []).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{e.nom}</span>
                  <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 300 }}>{e.series}×{e.reps}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Séances */}
      <Label>Mes séances</Label>
      {mySeances.length === 0 && <div style={{ color: C.textLight, fontSize: 13 }}>Aucune séance cochée.</div>}
      {mySeances.map(s => {
        const log = logs[`${athlete.id}_${s.id}`];
        const needsLog = notifBadges[`${athlete.id}_${s.id}`];
        const t = TYPES[s.type] || TYPES.piste;
        return (
          <div key={s.id} onClick={() => onShowLog({ seance: s, athleteId: athlete.id })}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: needsLog ? C.dangerBg : C.surface, border: `1px solid ${needsLog ? "#F0C0BC" : C.border}`, marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: t.color, fontWeight: 900 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{JOURS_FULL[s.jour]} · {s.heureDebut}</div>
              {log ? <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>Forme {log.forme}/10 · Fatigue {log.fatigue}/10</div>
                : <div style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>Bilan à remplir</div>}
            </div>
            <span style={{ color: C.textLight, fontSize: 18 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ATHLÈTES ────────────────────────────────────────────────────────────────

function AthletesView({ athletesList, seancesList, logs, notifBadges, onSelect }) {
  const [filter, setFilter] = useState("all");
  const groupes = ["all", "Pôle", "Club", "Monstres"];
  const filtered = filter === "all" ? athletesList : athletesList.filter(a => a.groupe === filter);

  return (
    <div className="fade-in" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {groupes.map(g => (
          <button key={g} onClick={() => setFilter(g === "all" ? "all" : g)}
            className={`chip ${filter === (g === "all" ? "all" : g) ? "chip-active" : "chip-inactive"}`}>
            {g === "all" ? `Tous (${athletesList.length})` : `${g} (${athletesList.filter(a => a.groupe === g).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div style={{ color: C.textLight, fontSize: 13 }}>Aucun athlète.</div>}
      {filtered.map(a => {
        const myNotifs = Object.keys(notifBadges).filter(k => k.startsWith(a.id)).length;
        const nbSeances = seancesList.filter(s => (s.presences || {})[a.id] === "present").length;
        return (
          <div key={a.id} onClick={() => onSelect(a)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 8, cursor: "pointer" }}>
            <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.display }}>{a.prenom} {a.nom}</div>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300, marginTop: 2 }}>{nbSeances} séance{nbSeances > 1 ? "s" : ""} · {a.role === "coach" ? "Coach" : a.groupe || "—"}</div>
            </div>
            {myNotifs > 0 && <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.danger, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{myNotifs}</div>}
            <span style={{ color: C.textLight, fontSize: 20 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMPÉTITIONS ─────────────────────────────────────────────────────────────

function CompsView({ comps, athletesList, isCoach, currentUser, onUpdateComp, onAdd }) {
  const compsList = Object.entries(comps || {}).map(([id, c]) => ({ ...c, id })).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  return (
    <div className="fade-in" style={{ padding: "16px 20px" }}>
      {isCoach && (
        <button onClick={onAdd} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `2px dashed ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
          + Ajouter une compétition
        </button>
      )}
      {compsList.length === 0 && <div style={{ color: C.textLight, fontSize: 13 }}>Aucune compétition.</div>}
      {compsList.map(c => {
        const inscrits = Object.entries(c.inscriptions || {});
        return (
          <div key={c.id} className="tb-card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: T.display, flex: 1, marginRight: 8 }}>{c.nom}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: C.greenLight, color: C.green, flexShrink: 0 }}>{c.niveau}</span>
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 300, marginBottom: 14 }}>📅 {c.date} · 📍 {c.lieu}</div>

            {/* Mon inscription */}
            <CompInscription
              compId={c.id}
              existing={(c.inscriptions || {})[currentUser?.id]}
              onSave={(data) => { onUpdateComp(c.id, { inscriptions: { ...(c.inscriptions || {}), [currentUser.id]: data } }); }}
            />

            {/* Liste inscrits (coach) */}
            {isCoach && inscrits.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Label>Inscrits ({inscrits.length})</Label>
                {inscrits.map(([uid, info]) => {
                  const a = athletesList.find(x => x.id === uid);
                  if (!a) return null;
                  return (
                    <div key={uid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                      <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo} size={28} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>{info.epreuves} · {info.transport === "voiture" ? `🚗 ${info.places} place(s)` : info.transport === "commun" ? "🚌 Transport en commun" : "🙋 Besoin d'être amené"}</div>
                      </div>
                    </div>
                  );
                })}
                {/* Résumé transport */}
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: C.surfaceAlt, fontSize: 12, color: C.textMuted, fontWeight: 300 }}>
                  🚗 {inscrits.filter(([, i]) => i.transport === "voiture").reduce((s, [, i]) => s + (Number(i.places) || 0), 0)} places dispo ·
                  🙋 {inscrits.filter(([, i]) => i.transport === "amener").length} à amener ·
                  🚌 {inscrits.filter(([, i]) => i.transport === "commun").length} en commun
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompInscription({ existing, onSave }) {
  const [epreuves, setEpreuves] = useState(existing?.epreuves ?? "");
  const [transport, setTransport] = useState(existing?.transport ?? "amener");
  const [places, setPlaces] = useState(existing?.places ?? 1);
  const [saved, setSaved] = useState(!!existing);

  const transportOptions = [
    { id: "amener", label: "🙋 Besoin d'être amené" },
    { id: "voiture", label: "🚗 J'ai une voiture" },
    { id: "commun", label: "🚌 Transport en commun" },
  ];

  function save() { onSave({ epreuves, transport, places: transport === "voiture" ? Number(places) : 0 }); setSaved(true); }

  return (
    <div style={{ padding: "12px", borderRadius: 12, background: C.surfaceAlt, marginBottom: 4 }}>
      <Label style={{ marginBottom: 10 }}>Mon inscription</Label>
      <input value={epreuves} onChange={e => { setEpreuves(e.target.value); setSaved(false); }}
        placeholder="Épreuves visées (ex: 110mH, Longueur)" className="tb-input" style={{ marginBottom: 10, background: C.surface }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {transportOptions.map(opt => (
          <button key={opt.id} onClick={() => { setTransport(opt.id); setSaved(false); }}
            style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${transport === opt.id ? C.green : C.border}`, background: transport === opt.id ? C.greenLight : C.surface, color: transport === opt.id ? C.green : C.textMuted, fontWeight: transport === opt.id ? 700 : 400, fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            {opt.label}
          </button>
        ))}
      </div>
      {transport === "voiture" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 300 }}>Places disponibles :</span>
          <input type="number" min={1} max={8} value={places} onChange={e => { setPlaces(e.target.value); setSaved(false); }}
            className="tb-input" style={{ width: 70, textAlign: "center", padding: "8px" }} />
        </div>
      )}
      <button onClick={save} className="tb-btn-primary" style={{ background: saved ? C.greenMid : C.green }}>
        {saved ? "✓ Inscription enregistrée" : "M'inscrire"}
      </button>
    </div>
  );
}

// ─── CYCLES MUSCU ─────────────────────────────────────────────────────────────

function CyclesView({ cycles, athletesList, onAddCycle, onUpdateCycle }) {
  const [showAdd, setShowAdd] = useState(false);
  const cyclesList = Object.entries(cycles || {}).map(([id, c]) => ({ ...c, id }));

  return (
    <div className="fade-in" style={{ padding: "16px 20px" }}>
      <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `2px dashed ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
        + Créer un cycle muscu
      </button>
      {cyclesList.length === 0 && <div style={{ color: C.textLight, fontSize: 13 }}>Aucun cycle créé.</div>}
      {cyclesList.map(c => {
        const assignes = athletesList.filter(a => (c.assignes || []).includes(a.id));
        const seancesCycle = c.seances || [{ exercices: c.exercices || [] }];
        return (
          <div key={c.id} className="tb-card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: T.display, marginBottom: 4 }}>{c.nom}</div>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300, marginBottom: 12 }}>{c.duree} semaines · {seancesCycle.length} séance{seancesCycle.length > 1 ? "s" : ""}</div>
            {seancesCycle.map((sc, si) => (
              <div key={si} style={{ marginBottom: 12 }}>
                {seancesCycle.length > 1 && <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 6, letterSpacing: 0.5 }}>SÉANCE {si + 1} {sc.nom ? `— ${sc.nom}` : ""}</div>}
                {(sc.exercices || []).map((e, ei) => (
                  <div key={ei} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{e.nom}</span>
                    <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 300 }}>{e.series}×{e.reps} {e.notes && `· ${e.notes}`}</span>
                  </div>
                ))}
              </div>
            ))}
            <Label style={{ marginTop: 8 }}>Assigné à ({assignes.length})</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {assignes.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: C.surfaceAlt, fontSize: 12, fontWeight: 500 }}>
                  <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo} size={18} />{a.prenom}
                </div>
              ))}
              {assignes.length === 0 && <span style={{ fontSize: 12, color: C.textLight }}>Personne assigné</span>}
            </div>
          </div>
        );
      })}
      {showAdd && <AddCycleModal athletesList={athletesList} onClose={() => setShowAdd(false)} onAdd={(data) => { onAddCycle(data); setShowAdd(false); }} />}
    </div>
  );
}

// ─── ADD SÉANCE ───────────────────────────────────────────────────────────────

function AddSeanceModal({ onClose, onAdd }) {
  const [jour, setJour] = useState(0);
  const [heureDebut, setHeureDebut] = useState("10:00");
  const [heureFin, setHeureFin] = useState("12:00");
  const [type, setType] = useState("piste");
  const [groupe, setGroupe] = useState("");
  const [contenu, setContenu] = useState("");
  const [lieu, setLieu] = useState("");
  const [disciplines, setDisciplines] = useState([]);

  function toggleDisc(id) { setDisciplines(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  return (
    <Modal onClose={onClose} title="Nouvelle séance" fullscreen>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <Label>Jour</Label>
          <select value={jour} onChange={e => setJour(Number(e.target.value))} className="tb-input">
            {JOURS_FULL.map((j, i) => <option key={i} value={i}>{j}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><Label>Début</Label><input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)} className="tb-input" /></div>
          <div><Label>Fin</Label><input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)} className="tb-input" /></div>
        </div>
        <div>
          <Label>Type</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(TYPES).map(([k, t]) => (
              <button key={k} onClick={() => setType(k)}
                style={{ flex: 1, padding: "10px 4px", borderRadius: 10, border: `1.5px solid ${type === k ? t.color : C.border}`, background: type === k ? t.bg : C.surface, color: type === k ? t.color : C.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Groupe</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Pôle", "Club", "Monstres", "Tous"].map(g => (
              <button key={g} onClick={() => setGroupe(g === groupe ? "" : g)}
                className={`chip ${groupe === g ? "chip-active" : "chip-inactive"}`} style={{ flex: 1, justifyContent: "center" }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Lieu</Label>
          <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Stade, CREPS, Salle..." className="tb-input" />
        </div>
        {(type === "piste" || type === "autonomie") && (
          <div>
            <Label>Disciplines</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DISCIPLINES.map(d => (
                <button key={d.id} onClick={() => toggleDisc(d.id)}
                  className={`disc-chip ${disciplines.includes(d.id) ? "disc-chip-active" : "disc-chip-inactive"}`}
                  style={{ cursor: "pointer", border: "none" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <Label>Contenu / description</Label>
          <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={3}
            placeholder="Ex: Haies 110m + triple saut, séries de 60m..."
            className="tb-input" style={{ resize: "none" }} />
        </div>
        <button className="tb-btn-primary" onClick={() => onAdd({ jour, heureDebut, heureFin, type, groupe, contenu, lieu, disciplines, presences: {} })}>
          Créer la séance
        </button>
      </div>
    </Modal>
  );
}

// ─── ADD COMP ─────────────────────────────────────────────────────────────────

function AddCompModal({ onClose, onAdd }) {
  const [nom, setNom] = useState("");
  const [date, setDate] = useState("");
  const [lieu, setLieu] = useState("");
  const [niveau, setNiveau] = useState("Régional");

  return (
    <Modal onClose={onClose} title="Nouvelle compétition">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><Label>Nom</Label><input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de la compétition" className="tb-input" /></div>
        <div><Label>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="tb-input" /></div>
        <div><Label>Lieu</Label><input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Ville / lieu" className="tb-input" /></div>
        <div>
          <Label>Niveau</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NIVEAUX_COMP.map(n => (
              <button key={n} onClick={() => setNiveau(n)}
                className={`chip ${niveau === n ? "chip-active" : "chip-inactive"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button className="tb-btn-primary" onClick={() => onAdd({ nom, date, lieu, niveau, inscriptions: {} })}>
          Ajouter
        </button>
      </div>
    </Modal>
  );
}

// ─── ADD CYCLE ────────────────────────────────────────────────────────────────

function AddCycleModal({ athletesList, onClose, onAdd }) {
  const [nom, setNom] = useState("");
  const [duree, setDuree] = useState(4);
  const [assignes, setAssignes] = useState([]);
  const [seances, setSeances] = useState([{ nom: "", exercices: [{ nom: "", series: 4, reps: 8, notes: "" }] }]);

  function addSeanceTocycle() { setSeances(prev => [...prev, { nom: "", exercices: [{ nom: "", series: 4, reps: 8, notes: "" }] }]); }
  function updateSeanceName(si, v) { setSeances(prev => prev.map((s, i) => i === si ? { ...s, nom: v } : s)); }
  function addExo(si) { setSeances(prev => prev.map((s, i) => i === si ? { ...s, exercices: [...s.exercices, { nom: "", series: 4, reps: 8, notes: "" }] } : s)); }
  function updateExo(si, ei, f, v) { setSeances(prev => prev.map((s, i) => i === si ? { ...s, exercices: s.exercices.map((e, j) => j === ei ? { ...e, [f]: v } : e) } : s)); }
  function toggleAssign(id) { setAssignes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  return (
    <Modal onClose={onClose} title="Nouveau cycle muscu" fullscreen>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><Label>Nom du cycle</Label><input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Force Max — Cycle 3" className="tb-input" /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Label style={{ marginBottom: 0 }}>Durée :</Label>
          <input type="number" min={1} max={16} value={duree} onChange={e => setDuree(Number(e.target.value))} className="tb-input" style={{ width: 70, textAlign: "center", padding: "8px" }} />
          <Label style={{ marginBottom: 0 }}>semaines</Label>
        </div>

        {seances.map((sc, si) => (
          <div key={si} style={{ padding: "14px", borderRadius: 14, background: C.surfaceAlt }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 10, letterSpacing: 0.5 }}>SÉANCE {si + 1}</div>
            <input value={sc.nom} onChange={e => updateSeanceName(si, e.target.value)} placeholder="Nom séance (ex: Jour A, Bas du corps...)" className="tb-input" style={{ marginBottom: 10, background: C.surface }} />
            {sc.exercices.map((e, ei) => (
              <div key={ei} style={{ padding: "10px", borderRadius: 10, background: C.surface, marginBottom: 8 }}>
                <input value={e.nom} onChange={ev => updateExo(si, ei, "nom", ev.target.value)} placeholder="Exercice" className="tb-input" style={{ marginBottom: 6 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[["series", "Séries"], ["reps", "Reps"], ["notes", "Notes"]].map(([f, ph]) => (
                    <input key={f} value={e[f]} onChange={ev => updateExo(si, ei, f, ev.target.value)} placeholder={ph} className="tb-input" style={{ textAlign: "center", padding: "8px 4px", fontSize: 12 }} />
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => addExo(si)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1.5px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              + Exercice
            </button>
          </div>
        ))}

        <button onClick={addSeanceTocycle} style={{ width: "100%", padding: "12px", borderRadius: 12, border: `2px dashed ${C.green}`, background: C.greenLight, color: C.green, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          + Ajouter une séance au cycle
        </button>

        <div>
          <Label>Assigner à</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {athletesList.map(a => (
              <button key={a.id} onClick={() => toggleAssign(a.id)}
                style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${assignes.includes(a.id) ? C.green : C.border}`, background: assignes.includes(a.id) ? C.greenLight : C.surface, color: assignes.includes(a.id) ? C.green : C.textMuted, fontSize: 13, fontWeight: assignes.includes(a.id) ? 700 : 400, cursor: "pointer" }}>
                {a.prenom} {a.nom[0]}.
              </button>
            ))}
          </div>
        </div>

        <button className="tb-btn-primary" onClick={() => onAdd({ nom, duree, seances, assignes, createdAt: Date.now() })}>
          Créer le cycle
        </button>
      </div>
    </Modal>
  );
}

// ─── PROFIL ───────────────────────────────────────────────────────────────────

function ProfileModal({ user, onClose, onSave, onLogout }) {
  const [prenom, setPrenom] = useState(user.prenom || "");
  const [nom, setNom] = useState(user.nom || "");
  const [sexe, setSexe] = useState(user.sexe || "");
  const [groupe, setGroupe] = useState(user.groupe || "");
  const [photo, setPhoto] = useState(user.photo || "");
  const [records, setRecords] = useState(user.records || {});

  const recordKeys = user.sexe === "Femme"
    ? ["Pentathlon", "Heptathlon"]
    : ["Pentathlon", "Décathlon"];

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  function updateRecord(k, v) { setRecords(prev => ({ ...prev, [k]: v })); }

  return (
    <Modal onClose={onClose} title="Mon profil" fullscreen>
      {/* Photo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Avatar nom={nom} prenom={prenom} photo={photo} size={80} />
          <label style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: "#fff" }}>
            +<input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </label>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300 }}>Appuie sur + pour changer la photo</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><Label>Prénom</Label><input value={prenom} onChange={e => setPrenom(e.target.value)} className="tb-input" /></div>
          <div><Label>Nom</Label><input value={nom} onChange={e => setNom(e.target.value)} className="tb-input" /></div>
        </div>

        <div>
          <Label>Licence</Label>
          <div className="tb-input" style={{ color: C.textMuted, fontWeight: 300 }}>{user.licence}</div>
        </div>

        <div>
          <Label>Sexe</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {SEXE_OPTIONS.map(s => (
              <button key={s} onClick={() => setSexe(s)}
                className={`chip ${sexe === s ? "chip-active" : "chip-inactive"}`} style={{ flex: 1, justifyContent: "center" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {user.role !== "coach" && (
          <div>
            <Label>Groupe principal</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Pôle", "Club", "Monstres"].map(g => (
                <button key={g} onClick={() => setGroupe(g)}
                  className={`chip ${groupe === g ? "chip-active" : "chip-inactive"}`} style={{ flex: 1, justifyContent: "center" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Records personnels</Label>
          {(sexe === "Femme" ? ["Pentathlon", "Heptathlon"] : ["Pentathlon", "Décathlon"]).map(k => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 300, marginBottom: 4 }}>{k}</div>
              <input value={records[k] || ""} onChange={e => updateRecord(k, e.target.value)}
                placeholder={`Record ${k} (points)`} className="tb-input" />
            </div>
          ))}
        </div>

        <button className="tb-btn-primary" onClick={() => onSave({ prenom, nom, sexe, groupe, photo, records })}>
          Sauvegarder
        </button>

        <button onClick={onLogout} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1.5px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
          Se déconnecter
        </button>
      </div>
    </Modal>
  );
}
