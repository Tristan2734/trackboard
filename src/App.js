import { useState, useEffect } from "react";
import {
  db, getUsers, saveUser, getSeances, addSeance, updateSeance,
  setPresence, getLogs, saveLog, getComps, addComp, updateComp,
  getCycles, addCycle, updateCycle
} from "./firebase";

const GROUPES = {
  pole: { label: "Pôle", color: "#185FA5", bg: "#E6F1FB", text: "#0C447C" },
  club: { label: "Club", color: "#3B6D11", bg: "#EAF3DE", text: "#27500A" },
  monstres: { label: "Monstres", color: "#993C1D", bg: "#FAECE7", text: "#712B13" },
};

const TYPES = {
  piste: { label: "Piste", icon: "🏃", color: "#185FA5", bg: "#E6F1FB" },
  muscu: { label: "Muscu", icon: "🏋️", color: "#3B6D11", bg: "#EAF3DE" },
  autonomie: { label: "Autonomie", icon: "🔓", color: "#884FAB", bg: "#EEEDFE" },
};

const JOURS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function Avatar({ nom, prenom, size = 36, groupe }) {
  const g = GROUPES[groupe];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: g ? g.bg : "#E6F1FB",
      color: g ? g.text : "#0C447C",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 500, fontSize: size * 0.35, flexShrink: 0,
      border: `1.5px solid ${g ? g.color : "#185FA5"}33`,
    }}>
      {prenom?.[0]}{nom?.[0]}
    </div>
  );
}

function Badge({ groupe }) {
  const g = GROUPES[groupe];
  if (!g) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: g.bg, color: g.text, border: `0.5px solid ${g.color}44` }}>
      {g.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = TYPES[type];
  if (!t) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: t.bg, color: t.color }}>
      {t.icon} {t.label}
    </span>
  );
}

function ScoreSlider({ label, value, onChange, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 500, color }}>{value}/10</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }} />
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [licence, setLicence] = useState("");
  const [coachCode, setCoachCode] = useState("");
  const [groupe, setGroupe] = useState("club");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!nom.trim() || !prenom.trim() || !licence.trim()) { setErr("Remplis tous les champs."); return; }
    setLoading(true);
    setErr("");
    if (coachCode.trim() === "COACH2025") {
      const user = { id: "coach", nom: "Coach", prenom: "Principal", groupe: "pole", role: "coach" };
      localStorage.setItem("tb_user", JSON.stringify(user));
      onLogin(user, true);
      return;
    }
    const id = `${prenom.toLowerCase()}_${nom.toLowerCase()}_${licence}`.replace(/\s/g, "");
    const user = { id, nom: nom.trim(), prenom: prenom.trim(), licence: licence.trim(), groupe, role: "athlete", createdAt: Date.now() };
    await saveUser(id, user);
    localStorage.setItem("tb_user", JSON.stringify(user));
    onLogin(user, false);
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px", background: "#f8f8f6" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#111", marginBottom: 4 }}>TrackBoard 🏃</div>
        <div style={{ fontSize: 15, color: "#666" }}>Ton carnet d'entraînement</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)}
          style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, background: "#fff" }} />
        <input placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)}
          style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, background: "#fff" }} />
        <input placeholder="N° de licence" value={licence} onChange={e => setLicence(e.target.value)}
          style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, background: "#fff" }} />
        <div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Ton groupe</div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(GROUPES).map(([k, g]) => (
              <button key={k} onClick={() => setGroupe(k)}
                style={{ flex: 1, padding: "9px 4px", borderRadius: 8, border: `1.5px solid ${groupe === k ? g.color : "#ddd"}`, background: groupe === k ? g.bg : "#fff", color: groupe === k ? g.text : "#666", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <input placeholder="Code coach (optionnel)" value={coachCode} onChange={e => setCoachCode(e.target.value)} type="password"
          style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, background: "#fff" }} />
        {err && <div style={{ color: "#E24B4A", fontSize: 13 }}>{err}</div>}
        <button onClick={submit} disabled={loading}
          style={{ marginTop: 8, padding: "15px", borderRadius: 10, background: "#185FA5", color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Connexion..." : "Accéder →"}
        </button>
        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center" }}>Code coach : COACH2025</div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPALE ──────────────────────────────────────────────────────────

export default function App() {
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
  const [filterGroupe, setFilterGroupe] = useState("all");

  // Auto-login depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tb_user");
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      setIsCoach(user.role === "coach");
    }
  }, []);

  // Listeners Firebase temps réel
  useEffect(() => {
    if (!currentUser) return;
    const unsubs = [
      getUsers(setUsers),
      getSeances(setSeances),
      getLogs(setLogs),
      getComps(setComps),
      getCycles(setCycles),
    ];
    return () => unsubs.forEach(u => u && u());
  }, [currentUser]);

  function handleLogin(user, coach) {
    setCurrentUser(user);
    setIsCoach(coach);
  }

  function logout() {
    localStorage.removeItem("tb_user");
    setCurrentUser(null);
    setIsCoach(false);
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const athletesList = Object.values(users).filter(u => u.role !== "coach");
  const seancesList = Object.entries(seances).map(([id, s]) => ({ ...s, id }));
  const logsList = logs;

  // Badges non loggés
  const notifBadges = {};
  seancesList.forEach(s => {
    Object.entries(s.presences || {}).forEach(([uid, status]) => {
      if (status === "present" && !logsList[`${uid}_${s.id}`]) {
        notifBadges[`${uid}_${s.id}`] = true;
      }
    });
  });
  const nbNonLogges = isCoach
    ? Object.keys(notifBadges).length
    : Object.keys(notifBadges).filter(k => k.startsWith(currentUser.id)).length;

  const seancesByJour = Array.from({ length: 7 }, (_, i) =>
    seancesList.filter(s => s.jour === i && (filterGroupe === "all" || s.groupe === filterGroupe))
      .sort((a, b) => a.heureDebut?.localeCompare(b.heureDebut))
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f8f8f6", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>TrackBoard</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{isCoach ? "Vue coach 🎯" : `${currentUser.prenom} ${currentUser.nom}`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {nbNonLogges > 0 && (
            <div style={{ background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
              {nbNonLogges}
            </div>
          )}
          <button onClick={logout} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#888", cursor: "pointer" }}>Déco</button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ paddingBottom: 16 }}>
        {view === "planning" && (
          <PlanningView
            seancesByJour={seancesByJour}
            athletesList={athletesList}
            logsList={logsList}
            notifBadges={notifBadges}
            filterGroupe={filterGroupe}
            setFilterGroupe={setFilterGroupe}
            isCoach={isCoach}
            currentUser={currentUser}
            onSelectSeance={setSelectedSeance}
            onShowLog={setShowLog}
            onAddSeance={() => setShowAddSeance(true)}
          />
        )}
        {view === "athletes" && isCoach && (
          <AthletesView
            athletesList={athletesList}
            seancesList={seancesList}
            logsList={logsList}
            notifBadges={notifBadges}
            onSelect={setSelectedAthlete}
          />
        )}
        {view === "dashboard" && !isCoach && (
          <DashboardView
            athlete={currentUser}
            seancesList={seancesList}
            logsList={logsList}
            cycles={cycles}
            notifBadges={notifBadges}
            onShowLog={setShowLog}
          />
        )}
        {view === "comps" && (
          <CompsView
            comps={comps}
            athletesList={athletesList}
            isCoach={isCoach}
            currentUser={currentUser}
            onUpdateComp={updateComp}
            onAdd={() => setShowAddComp(true)}
          />
        )}
        {view === "muscu" && isCoach && (
          <CyclesView cycles={cycles} athletesList={athletesList} onAdd={() => {}} onAddCycle={addCycle} onUpdateCycle={updateCycle} />
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", padding: "8px 0 16px", zIndex: 20 }}>
        {[
          { key: "planning", icon: "📅", label: "Planning" },
          isCoach ? { key: "athletes", icon: "👥", label: "Athlètes" } : { key: "dashboard", icon: "📊", label: "Mon bilan" },
          { key: "comps", icon: "🏆", label: "Compèts" },
          isCoach ? { key: "muscu", icon: "🏋️", label: "Cycles" } : null,
        ].filter(Boolean).map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: view === tab.key ? 1 : 0.4, color: view === tab.key ? "#185FA5" : "#333", fontWeight: view === tab.key ? 600 : 400, fontSize: 10, padding: "4px 12px" }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {selectedSeance && (
        <SeanceModal
          seance={selectedSeance}
          athletesList={athletesList}
          logsList={logsList}
          isCoach={isCoach}
          currentUser={currentUser}
          notifBadges={notifBadges}
          onClose={() => setSelectedSeance(null)}
          onTogglePresence={(sid, uid, status) => setPresence(sid, uid, status)}
          onShowLog={setShowLog}
        />
      )}
      {showLog && (
        <LogModal
          seance={showLog.seance}
          athleteId={showLog.athleteId}
          existingLog={logsList[`${showLog.athleteId}_${showLog.seance.id}`]}
          onClose={() => setShowLog(null)}
          onSave={(data) => { saveLog(showLog.seance.id, showLog.athleteId, data); setShowLog(null); }}
        />
      )}
      {showAddSeance && (
        <AddSeanceModal
          onClose={() => setShowAddSeance(false)}
          onAdd={(data) => { addSeance(data); setShowAddSeance(false); }}
        />
      )}
      {selectedAthlete && (
        <Modal onClose={() => setSelectedAthlete(null)} title={`${selectedAthlete.prenom} ${selectedAthlete.nom}`}>
          <DashboardView
            athlete={selectedAthlete}
            seancesList={seancesList}
            logsList={logsList}
            cycles={cycles}
            notifBadges={notifBadges}
            onShowLog={setShowLog}
          />
        </Modal>
      )}
      {showAddComp && (
        <AddCompModal onClose={() => setShowAddComp(false)} onAdd={(data) => { addComp(data); setShowAddComp(false); }} />
      )}
    </div>
  );
}

// ─── PLANNING ────────────────────────────────────────────────────────────────

function PlanningView({ seancesByJour, athletesList, logsList, notifBadges, filterGroupe, setFilterGroupe, isCoach, currentUser, onSelectSeance, onShowLog, onAddSeance }) {
  return (
    <div>
      <div style={{ padding: "12px 16px 8px", display: "flex", gap: 8, overflowX: "auto" }}>
        {[["all", "Tous", "#185FA5", "#E6F1FB", "#0C447C"], ...Object.entries(GROUPES).map(([k, g]) => [k, g.label, g.color, g.bg, g.text])].map(([k, label, color, bg, text]) => (
          <button key={k} onClick={() => setFilterGroupe(k)}
            style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filterGroupe === k ? color : "#ddd"}`, background: filterGroupe === k ? bg : "transparent", color: filterGroupe === k ? text : "#666", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {seancesByJour.map((seances, i) => (
        <div key={i}>
          <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8 }}>{JOURS_FULL[i]}</div>
          {seances.length === 0 && <div style={{ padding: "4px 16px 8px", fontSize: 13, color: "#ccc" }}>—</div>}
          {seances.map(s => {
            const nbPresents = Object.values(s.presences || {}).filter(v => v === "present").length;
            const nbNonLog = Object.entries(s.presences || {}).filter(([uid, v]) => v === "present" && notifBadges[`${uid}_${s.id}`]).length;
            const myStatus = currentUser ? (s.presences || {})[currentUser.id] : null;
            const t = TYPES[s.type] || TYPES.piste;
            return (
              <div key={s.id} onClick={() => onSelectSeance(s)}
                style={{ margin: "4px 16px 0", padding: "10px 14px", borderRadius: 12, background: "#fff", border: `1px solid ${nbNonLog > 0 ? "#F7C1C1" : "#eee"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                {nbNonLog > 0 && <div style={{ position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: "50%", background: "#E24B4A" }} />}
                <div style={{ width: 38, height: 38, borderRadius: 8, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.heureDebut}–{s.heureFin}</span>
                    <Badge groupe={s.groupe} />
                  </div>
                  <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.contenu || "Contenu à venir"}</div>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontWeight: 600, color: nbPresents > 0 ? "#185FA5" : "#ccc" }}>{nbPresents} présent{nbPresents > 1 ? "s" : ""}</div>
                  {!isCoach && <div style={{ fontSize: 11, color: myStatus === "present" ? "#3B6D11" : "#ccc", marginTop: 2 }}>{myStatus === "present" ? "✓ Je viens" : "Non coché"}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {isCoach && (
        <div style={{ padding: "16px" }}>
          <button onClick={onAddSeance} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "2px dashed #ddd", background: "transparent", color: "#aaa", fontSize: 14, cursor: "pointer" }}>
            + Ajouter une séance
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SÉANCE MODAL ─────────────────────────────────────────────────────────────

function SeanceModal({ seance, athletesList, logsList, isCoach, currentUser, notifBadges, onClose, onTogglePresence, onShowLog }) {
  const t = TYPES[seance.type] || TYPES.piste;
  const presents = athletesList.filter(a => (seance.presences || {})[a.id] === "present");
  const myStatus = (seance.presences || {})[currentUser?.id];

  return (
    <Modal onClose={onClose} title={`${t.icon} ${seance.heureDebut}–${seance.heureFin}`}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <TypeBadge type={seance.type} />
        <Badge groupe={seance.groupe} />
      </div>
      {seance.contenu && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f5f5f3", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
          {seance.contenu}
        </div>
      )}

      {/* Présence athlète */}
      {!isCoach && currentUser && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>Ma présence</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onTogglePresence(seance.id, currentUser.id, myStatus === "present" ? "absent" : "present")}
              style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${myStatus === "present" ? "#3B6D11" : "#ddd"}`, background: myStatus === "present" ? "#EAF3DE" : "#fff", color: myStatus === "present" ? "#27500A" : "#666", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              ✓ Je viens
            </button>
            <button onClick={() => onTogglePresence(seance.id, currentUser.id, myStatus === "absent" ? null : "absent")}
              style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${myStatus === "absent" ? "#E24B4A" : "#ddd"}`, background: myStatus === "absent" ? "#FCEBEB" : "#fff", color: myStatus === "absent" ? "#A32D2D" : "#666", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              ✗ Absent
            </button>
          </div>
          {myStatus === "present" && (
            <button onClick={() => onShowLog({ seance, athleteId: currentUser.id })}
              style={{ marginTop: 10, width: "100%", padding: "11px", borderRadius: 10, border: `1.5px solid ${notifBadges[`${currentUser.id}_${seance.id}`] ? "#E24B4A" : "#185FA5"}`, background: notifBadges[`${currentUser.id}_${seance.id}`] ? "#FCEBEB" : "#E6F1FB", color: notifBadges[`${currentUser.id}_${seance.id}`] ? "#A32D2D" : "#0C447C", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              {logsList[`${currentUser.id}_${seance.id}`] ? "✏️ Modifier mon bilan" : "📝 Remplir mon bilan"}
            </button>
          )}
        </div>
      )}

      {/* Liste présents (coach) */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>Présents ({presents.length})</div>
      {presents.length === 0 && <div style={{ fontSize: 13, color: "#ccc" }}>Personne n'a coché pour l'instant.</div>}
      {presents.map(a => {
        const logged = logsList[`${a.id}_${seance.id}`];
        const needsLog = notifBadges[`${a.id}_${seance.id}`];
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f0f0f0" }}>
            <Avatar nom={a.nom} prenom={a.prenom} groupe={a.groupe} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{a.prenom} {a.nom}</div>
              {logged
                ? <div style={{ fontSize: 12, color: "#666" }}>Forme {logged.forme}/10 · Fatigue {logged.fatigue}/10</div>
                : <div style={{ fontSize: 12, color: "#E24B4A" }}>Bilan non rempli</div>}
            </div>
            {isCoach && (
              <button onClick={() => onShowLog({ seance, athleteId: a.id })}
                style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: `1px solid ${needsLog ? "#E24B4A" : "#ddd"}`, background: needsLog ? "#FCEBEB" : "#f8f8f8", color: needsLog ? "#A32D2D" : "#666", cursor: "pointer" }}>
                {logged ? "Voir" : "Saisir"}
              </button>
            )}
          </div>
        );
      })}
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
  const t = TYPES[seance.type] || TYPES.piste;

  function updateExo(idx, field, value) {
    setExos(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function save() {
    const data = seance.type === "muscu"
      ? { type: "muscu", rpe, notes, exos }
      : { type: seance.type, forme, fatigue, rpe, notes };
    onSave(data);
  }

  return (
    <Modal onClose={onClose} title={`${t.icon} Bilan — ${seance.heureDebut}`}>
      {seance.type !== "muscu" ? (
        <>
          <ScoreSlider label="Forme générale" value={forme} onChange={setForme} color="#185FA5" />
          <ScoreSlider label="Fatigue ressentie" value={fatigue} onChange={setFatigue} color="#E24B4A" />
          <ScoreSlider label="RPE global" value={rpe} onChange={setRpe} color="#884FAB" />
          <div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Notes libres</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Marques, sensations, intentions, gênes..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, lineHeight: 1.5, resize: "none", boxSizing: "border-box" }} />
          </div>
        </>
      ) : (
        <>
          <ScoreSlider label="RPE global" value={rpe} onChange={setRpe} color="#884FAB" />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#666", margin: "12px 0 8px" }}>Exercices</div>
          {exos.map((e, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "#f8f8f6", marginBottom: 8 }}>
              <input value={e.nom} onChange={ev => updateExo(i, "nom", ev.target.value)} placeholder="Exercice"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {["series", "reps", "charge", "rpe"].map(f => (
                  <input key={f} type="number" value={e[f] || ""} onChange={ev => updateExo(i, f, ev.target.value)}
                    placeholder={{ series: "Séries", reps: "Reps", charge: "Kg", rpe: "RPE" }[f]}
                    style={{ padding: "7px 4px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, textAlign: "center" }} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setExos(prev => [...prev, { nom: "", series: "", reps: "", charge: "", rpe: "" }])}
            style={{ width: "100%", padding: "9px", borderRadius: 10, border: "2px dashed #ddd", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: 13, marginBottom: 10 }}>
            + Ajouter un exercice
          </button>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes globales..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
        </>
      )}
      <button onClick={save} style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 10, background: "#185FA5", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Sauvegarder
      </button>
    </Modal>
  );
}

// ─── DASHBOARD ATHLÈTE ────────────────────────────────────────────────────────

function DashboardView({ athlete, seancesList, logsList, cycles, notifBadges, onShowLog }) {
  if (!athlete) return null;
  const mySeances = seancesList.filter(s => (s.presences || {})[athlete.id] === "present");
  const cyclesList = Object.entries(cycles || {}).map(([id, c]) => ({ ...c, id }));
  const myCycle = cyclesList.find(c => (c.assignes || []).includes(athlete.id));

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Avatar nom={athlete.nom} prenom={athlete.prenom} groupe={athlete.groupe} size={50} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{athlete.prenom} {athlete.nom}</div>
          <Badge groupe={athlete.groupe} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Séances", val: mySeances.length },
          { label: "Bilans remplis", val: mySeances.filter(s => logsList[`${athlete.id}_${s.id}`]).length },
        ].map(stat => (
          <div key={stat.label} style={{ padding: "14px", borderRadius: 12, background: "#fff", border: "1px solid #eee" }}>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.val}</div>
          </div>
        ))}
      </div>

      {myCycle && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Cycle muscu en cours</div>
          <div style={{ padding: "14px", borderRadius: 12, background: "#fff", border: "1px solid #eee" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{myCycle.nom}</div>
            {(myCycle.exercices || []).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 14 }}>{e.nom}</span>
                <span style={{ fontSize: 13, color: "#888" }}>{e.series}×{e.reps} {e.notes && `· ${e.notes}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Mes séances</div>
      {mySeances.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>Aucune séance cochée.</div>}
      {mySeances.map(s => {
        const log = logsList[`${athlete.id}_${s.id}`];
        const needsLog = notifBadges[`${athlete.id}_${s.id}`];
        const t = TYPES[s.type] || TYPES.piste;
        return (
          <div key={s.id} onClick={() => onShowLog({ seance: s, athleteId: athlete.id })}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: needsLog ? "#FCEBEB" : "#fff", border: `1px solid ${needsLog ? "#F7C1C1" : "#eee"}`, marginBottom: 8, cursor: "pointer" }}>
            <div style={{ fontSize: 22 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{JOURS_FULL[s.jour]} · {s.heureDebut}</div>
              {log
                ? <div style={{ fontSize: 12, color: "#666" }}>Forme {log.forme}/10 · Fatigue {log.fatigue}/10</div>
                : <div style={{ fontSize: 12, color: "#E24B4A" }}>Bilan à remplir</div>}
            </div>
            <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── VUE ATHLÈTES (coach) ─────────────────────────────────────────────────────

function AthletesView({ athletesList, seancesList, logsList, notifBadges, onSelect }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? athletesList : athletesList.filter(a => a.groupe === filter);

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        <button onClick={() => setFilter("all")} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filter === "all" ? "#185FA5" : "#ddd"}`, background: filter === "all" ? "#E6F1FB" : "transparent", color: filter === "all" ? "#0C447C" : "#666", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Tous ({athletesList.length})
        </button>
        {Object.entries(GROUPES).map(([k, g]) => {
          const n = athletesList.filter(a => a.groupe === k).length;
          return (
            <button key={k} onClick={() => setFilter(k)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filter === k ? g.color : "#ddd"}`, background: filter === k ? g.bg : "transparent", color: filter === k ? g.text : "#666", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              {g.label} ({n})
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>Aucun athlète pour l'instant.</div>}
      {filtered.map(a => {
        const myNotifs = Object.keys(notifBadges).filter(k => k.startsWith(a.id)).length;
        const nbSeances = seancesList.filter(s => (s.presences || {})[a.id] === "present").length;
        return (
          <div key={a.id} onClick={() => onSelect(a)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "#fff", border: "1px solid #eee", marginBottom: 8, cursor: "pointer" }}>
            <Avatar nom={a.nom} prenom={a.prenom} groupe={a.groupe} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{a.prenom} {a.nom}</div>
              <div style={{ fontSize: 12, color: "#888", display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                <span>{nbSeances} séance{nbSeances > 1 ? "s" : ""}</span>
                <Badge groupe={a.groupe} />
              </div>
            </div>
            {myNotifs > 0 && (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#E24B4A", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {myNotifs}
              </div>
            )}
            <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMPÉTITIONS ─────────────────────────────────────────────────────────────

function CompsView({ comps, athletesList, isCoach, currentUser, onUpdateComp, onAdd }) {
  const compsList = Object.entries(comps || {}).map(([id, c]) => ({ ...c, id }))
    .sort((a, b) => a.date?.localeCompare(b.date));

  return (
    <div style={{ padding: "16px" }}>
      {isCoach && (
        <button onClick={onAdd} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "2px dashed #ddd", background: "transparent", color: "#aaa", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
          + Ajouter une compétition
        </button>
      )}
      {compsList.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>Aucune compétition pour l'instant.</div>}
      {compsList.map(c => {
        const inscrits = Object.entries(c.inscriptions || {});
        const myInscription = (c.inscriptions || {})[currentUser?.id];
        return (
          <div key={c.id} style={{ padding: "14px", borderRadius: 14, background: "#fff", border: "1px solid #eee", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{c.nom}</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>📅 {c.date} · 📍 {c.lieu} · {c.niveau}</div>

            {!isCoach && currentUser && (
              <CompInscription
                compId={c.id}
                existing={myInscription}
                onSave={(data) => {
                  const newInscriptions = { ...(c.inscriptions || {}), [currentUser.id]: data };
                  onUpdateComp(c.id, { inscriptions: newInscriptions });
                }}
              />
            )}

            {isCoach && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>Inscrits ({inscrits.length})</div>
                {inscrits.length === 0 && <div style={{ fontSize: 13, color: "#ccc" }}>Personne pour l'instant.</div>}
                {inscrits.map(([uid, info]) => {
                  const a = athletesList.find(x => x.id === uid);
                  if (!a) return null;
                  return (
                    <div key={uid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid #f0f0f0" }}>
                      <Avatar nom={a.nom} prenom={a.prenom} groupe={a.groupe} size={30} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{info.epreuves} · {info.transport === "voiture" ? `🚗 ${info.places} place(s)` : "🚌 besoin transport"}</div>
                      </div>
                    </div>
                  );
                })}
                {/* Logistique transport */}
                {inscrits.length > 0 && (
                  <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "#f8f8f6", fontSize: 12, color: "#666" }}>
                    🚗 {inscrits.filter(([, i]) => i.transport === "voiture").reduce((s, [, i]) => s + (Number(i.places) || 0), 0)} places dispo ·
                    🚌 {inscrits.filter(([, i]) => i.transport === "amener").length} à transporter
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompInscription({ compId, existing, onSave }) {
  const [epreuves, setEpreuves] = useState(existing?.epreuves ?? "");
  const [transport, setTransport] = useState(existing?.transport ?? "amener");
  const [places, setPlaces] = useState(existing?.places ?? 1);
  const [saved, setSaved] = useState(!!existing);

  function save() {
    onSave({ epreuves, transport, places: transport === "voiture" ? Number(places) : 0 });
    setSaved(true);
  }

  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f8f8f6", marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mon inscription</div>
      <input value={epreuves} onChange={e => { setEpreuves(e.target.value); setSaved(false); }}
        placeholder="Épreuves visées (ex: 110mH, Longueur, 400m)"
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {[["amener", "🚌 M'amener"], ["voiture", "🚗 J'ai une voiture"]].map(([opt, label]) => (
          <button key={opt} onClick={() => { setTransport(opt); setSaved(false); }}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 8, border: `1.5px solid ${transport === opt ? "#185FA5" : "#ddd"}`, background: transport === opt ? "#E6F1FB" : "#fff", color: transport === opt ? "#0C447C" : "#666", fontSize: 12, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
      {transport === "voiture" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#666" }}>Places disponibles :</span>
          <input type="number" min={1} max={8} value={places} onChange={e => { setPlaces(e.target.value); setSaved(false); }}
            style={{ width: 60, padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, textAlign: "center" }} />
        </div>
      )}
      <button onClick={save} style={{ width: "100%", padding: "10px", borderRadius: 8, background: saved ? "#3B6D11" : "#185FA5", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
    <div style={{ padding: "16px" }}>
      <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "2px dashed #ddd", background: "transparent", color: "#aaa", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
        + Créer un cycle muscu
      </button>
      {cyclesList.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>Aucun cycle créé.</div>}
      {cyclesList.map(c => {
        const assignes = athletesList.filter(a => (c.assignes || []).includes(a.id));
        return (
          <div key={c.id} style={{ padding: "14px", borderRadius: 14, background: "#fff", border: "1px solid #eee", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{c.nom}</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>Durée : {c.duree} semaines</div>
            {(c.exercices || []).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 14 }}>{e.nom}</span>
                <span style={{ fontSize: 13, color: "#888" }}>{e.series}×{e.reps} {e.notes && `· ${e.notes}`}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 6 }}>Assigné à ({assignes.length})</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {assignes.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: "#f5f5f3", fontSize: 12 }}>
                  <Avatar nom={a.nom} prenom={a.prenom} groupe={a.groupe} size={18} />{a.prenom}
                </div>
              ))}
              {assignes.length === 0 && <span style={{ fontSize: 12, color: "#ccc" }}>Personne assigné</span>}
            </div>
          </div>
        );
      })}
      {showAdd && (
        <AddCycleModal
          athletesList={athletesList}
          onClose={() => setShowAdd(false)}
          onAdd={(data) => { onAddCycle(data); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

// ─── ADD MODALS ───────────────────────────────────────────────────────────────

function AddSeanceModal({ onClose, onAdd }) {
  const [jour, setJour] = useState(0);
  const [heureDebut, setHeureDebut] = useState("10:00");
  const [heureFin, setHeureFin] = useState("12:00");
  const [type, setType] = useState("piste");
  const [groupe, setGroupe] = useState("pole");
  const [contenu, setContenu] = useState("");
  const [lieu, setLieu] = useState("Stade");

  return (
    <Modal onClose={onClose} title="Nouvelle séance">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Jour</div>
          <select value={jour} onChange={e => setJour(Number(e.target.value))}
            style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}>
            {JOURS_FULL.map((j, i) => <option key={i} value={i}>{j}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Début</div>
            <input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Fin</div>
            <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Type</div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(TYPES).map(([k, t]) => (
              <button key={k} onClick={() => setType(k)}
                style={{ flex: 1, padding: "9px 4px", borderRadius: 8, border: `1.5px solid ${type === k ? t.color : "#ddd"}`, background: type === k ? t.bg : "#fff", color: type === k ? t.color : "#666", fontSize: 12, cursor: "pointer" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Groupe</div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(GROUPES).map(([k, g]) => (
              <button key={k} onClick={() => setGroupe(k)}
                style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${groupe === k ? g.color : "#ddd"}`, background: groupe === k ? g.bg : "#fff", color: groupe === k ? g.text : "#666", fontSize: 12, cursor: "pointer" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Lieu</div>
          <input value={lieu} onChange={e => setLieu(e.target.value)}
            style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Contenu de la séance</div>
          <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={3}
            placeholder="Ex: Haies 110m + triple saut, séries de 60m..."
            style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={() => onAdd({ jour, heureDebut, heureFin, type, groupe, contenu, lieu, presences: {} })}
          style={{ padding: "14px", borderRadius: 10, background: "#185FA5", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Créer la séance
        </button>
      </div>
    </Modal>
  );
}

function AddCompModal({ onClose, onAdd }) {
  const [nom, setNom] = useState("");
  const [date, setDate] = useState("");
  const [lieu, setLieu] = useState("");
  const [niveau, setNiveau] = useState("Régional");

  return (
    <Modal onClose={onClose} title="Nouvelle compétition">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de la compétition"
          style={{ padding: "11px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: "11px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
        <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Ville / lieu"
          style={{ padding: "11px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
        <select value={niveau} onChange={e => setNiveau(e.target.value)}
          style={{ padding: "11px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}>
          {["Départemental", "Régional", "Interrégional", "National", "International"].map(n => <option key={n}>{n}</option>)}
        </select>
        <button onClick={() => onAdd({ nom, date, lieu, niveau, inscriptions: {} })}
          style={{ padding: "14px", borderRadius: 10, background: "#185FA5", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Ajouter
        </button>
      </div>
    </Modal>
  );
}

function AddCycleModal({ athletesList, onClose, onAdd }) {
  const [nom, setNom] = useState("");
  const [duree, setDuree] = useState(4);
  const [exercices, setExercices] = useState([{ nom: "", series: 4, reps: 8, notes: "" }]);
  const [assignes, setAssignes] = useState([]);

  function updateEx(i, f, v) {
    setExercices(prev => prev.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
  }

  function toggleAssign(id) {
    setAssignes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <Modal onClose={onClose} title="Nouveau cycle muscu">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du cycle (ex: Force Max S3)"
          style={{ padding: "11px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#666" }}>Durée :</span>
          <input type="number" min={1} max={16} value={duree} onChange={e => setDuree(Number(e.target.value))}
            style={{ width: 60, padding: "8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, textAlign: "center" }} />
          <span style={{ fontSize: 13, color: "#666" }}>semaines</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#666" }}>Exercices</div>
        {exercices.map((e, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "#f8f8f6" }}>
            <input value={e.nom} onChange={ev => updateEx(i, "nom", ev.target.value)} placeholder="Nom de l'exercice"
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, marginBottom: 6, boxSizing: "border-box" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[["series", "Séries"], ["reps", "Reps"], ["notes", "Notes"]].map(([f, ph]) => (
                <input key={f} value={e[f]} onChange={ev => updateEx(i, f, ev.target.value)} placeholder={ph}
                  style={{ padding: "7px 6px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, textAlign: "center" }} />
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => setExercices(prev => [...prev, { nom: "", series: 4, reps: 8, notes: "" }])}
          style={{ padding: "9px", borderRadius: 8, border: "2px dashed #ddd", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: 13 }}>
          + Ajouter un exercice
        </button>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#666" }}>Assigner à</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {athletesList.map(a => (
            <button key={a.id} onClick={() => toggleAssign(a.id)}
              style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${assignes.includes(a.id) ? "#185FA5" : "#ddd"}`, background: assignes.includes(a.id) ? "#E6F1FB" : "#fff", color: assignes.includes(a.id) ? "#0C447C" : "#666", fontSize: 12, cursor: "pointer" }}>
              {a.prenom} {a.nom[0]}.
            </button>
          ))}
        </div>
        <button onClick={() => onAdd({ nom, duree, exercices, assignes, createdAt: Date.now() })}
          style={{ padding: "14px", borderRadius: 10, background: "#185FA5", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Créer le cycle
        </button>
      </div>
    </Modal>
  );
}
