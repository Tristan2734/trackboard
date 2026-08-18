import { useState, useEffect } from "react";
import { getUsers, saveUser, getSeances, addSeance, deleteSeance, setPresence, getLogs, saveLog, getComps, addComp, updateComp, deleteComp, getCycles, addCycle, updateCycle, deleteCycle } from "./firebase";

const DISCIPLINES = ["Sprint","Haies","Sprint long","Aérobie","Longueur","Hauteur","Perche","Plio","Poids","Javelot","Disque","Général"];
const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const NIVEAUX = ["Meeting","Départemental","Régional","National"];
const GROUPES = ["Pôle","Club","Monstres"];
const COLORS = ["#1C3326","#2D6A4F","#52796F","#354F52","#6B4226","#7B2D8B","#1A4A7A","#8B1A1A","#4A4A1A","#1A4A4A"];

const C = {
  bg:"#F4F2EC",surface:"#FFFFFF",alt:"#EDEAE3",
  green:"#1C3326",greenMid:"#2D4A35",greenLight:"#E8F0E8",greenAccent:"#9FD4A8",
  text:"#1A1A1A",muted:"#888880",light:"#BEBAB0",border:"#E5E2DA",
  danger:"#C0392B",dangerBg:"#FCEBEB",dangerBorder:"#F7C1C1",
  amber:"#854F0B",amberBg:"#FFF4E0",
};

const injectStyles = () => {
  if (document.getElementById("tb-styles")) return;
  const s = document.createElement("style");
  s.id = "tb-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800;900&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
    body{background:${C.bg};font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}
    input,textarea,select,button{font-family:'Plus Jakarta Sans',sans-serif}
    ::-webkit-scrollbar{display:none}
    .inp{width:100%;padding:13px 14px;border-radius:12px;border:1.5px solid ${C.border};background:${C.surface};font-size:15px;color:${C.text};outline:none;transition:border-color .2s}
    .inp:focus{border-color:${C.green}}
    .btn-primary{width:100%;padding:15px;border-radius:14px;background:${C.green};color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s}
    .btn-primary:active{opacity:.85}
    .btn-ghost{padding:10px 16px;border-radius:10px;border:1.5px solid ${C.border};background:transparent;color:${C.muted};font-size:13px;font-weight:600;cursor:pointer}
    .btn-danger{width:100%;padding:13px;border-radius:12px;border:1.5px solid ${C.danger};background:${C.dangerBg};color:${C.danger};font-weight:700;cursor:pointer;font-size:14px}
    .card{background:${C.surface};border-radius:16px;border:1px solid ${C.border};padding:14px 16px}
    .chip{display:inline-flex;align-items:center;padding:6px 13px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid transparent;cursor:pointer;transition:all .15s;white-space:nowrap}
    .chip-on{background:${C.green};color:#fff;border-color:${C.green}}
    .chip-off{background:transparent;color:${C.muted};border-color:${C.border}}
    .disc{padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:all .15s}
    .disc-on{background:${C.green};color:#fff}
    .disc-off{background:${C.alt};color:${C.muted}}
    .tag{font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.3px}
    .slide-up{animation:slideUp .25s cubic-bezier(.32,.72,0,1)}
    .fade{animation:fade .2s ease}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .lbl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.muted};margin-bottom:8px}
    .sep{height:1px;background:${C.border};margin:8px 0}
    .nav-btn{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 10px;transition:opacity .15s}
    .empty{font-size:13px;color:${C.light};text-align:center;padding:24px 0}
    .toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-radius:12px;cursor:pointer;transition:all .2s}
    .toggle-track{width:44px;height:24px;border-radius:12px;position:relative;transition:background .2s;flex-shrink:0}
    .toggle-thumb{position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}
  `;
  document.head.appendChild(s);
};

function weekStart(offset = 0) {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1 + offset * 7);
  d.setHours(0,0,0,0);
  return d;
}

function weekLabel(date) {
  const fmt = x => x.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
  const end = new Date(date); end.setDate(date.getDate()+6);
  const y = date.getFullYear();
  const wn = Math.ceil((((date - new Date(y,0,1))/86400000)+new Date(y,0,1).getDay()+1)/7);
  return `Sem. ${wn} · ${fmt(date)} – ${fmt(end)} ${y}`;
}

function Avatar({nom="",prenom="",size=36,photo}) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:photo?"transparent":C.greenLight,border:`2px solid ${C.greenAccent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.33,fontWeight:800,color:C.greenMid,overflow:"hidden"}}>
      {photo?<img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:`${prenom[0]||""}${nom[0]||""}`}
    </div>
  );
}

function Lbl({children}) { return <div className="lbl">{children}</div>; }

function Slider({label,value,onChange,color=C.green}) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:13,color:C.muted,fontWeight:500}}>{label}</span>
        <span style={{fontSize:16,fontWeight:800,color}}>{value}<span style={{fontSize:11,fontWeight:300,color:C.light}}>/10</span></span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value} onChange={e=>onChange(+e.target.value)} style={{width:"100%",accentColor:color,height:4}}/>
    </div>
  );
}

function Toggle({label,sub,value,onChange}) {
  return (
    <div className="toggle-wrap" onClick={()=>onChange(!value)} style={{background:value?C.greenLight:C.surface,border:`1.5px solid ${value?C.greenMid:C.border}`}}>
      <div>
        <div style={{fontSize:14,fontWeight:600,color:value?C.green:C.text}}>{label}</div>
        {sub&&<div style={{fontSize:12,color:C.muted,fontWeight:300}}>{sub}</div>}
      </div>
      <div className="toggle-track" style={{background:value?C.green:C.border}}>
        <div className="toggle-thumb" style={{left:value?22:2}}/>
      </div>
    </div>
  );
}

function Modal({children,onClose,title,full}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="slide-up" style={{width:"100%",maxWidth:480,maxHeight:full?"100vh":"92vh",overflowY:"auto",background:C.bg,borderRadius:full?"0":"20px 20px 0 0",padding:"0 0 48px"}}>
        <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:800,color:C.text}}>{title}</div>
          <button onClick={onClose} style={{background:C.alt,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"0 20px"}}>{children}</div>
      </div>
    </div>
  );
}

function SeanceIcon({type,size=36,color}) {
  const cfg = type==="muscu"
    ? {bg:"#F0EDE8",icon:"ti-barbell",clr:"#5A3A1A"}
    : type==="autonomie"
    ? {bg:"#EAF0F5",icon:"ti-run",clr:"#3A5A7A"}
    : {bg:"#E8F0E8",icon:"ti-run",clr:"#1C3326"};
  return (
    <div style={{width:size,height:size,borderRadius:size*.25,background:color||cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <i className={`ti ${cfg.icon}`} style={{fontSize:size*.5,color:cfg.clr}} aria-hidden="true"/>
    </div>
  );
}

function Login({onLogin}) {
  useEffect(()=>injectStyles(),[]);
  const [licence,setLicence]=useState("");
  const [users,setUsers]=useState({});
  const [notFound,setNotFound]=useState(false);
  const [newMode,setNewMode]=useState(false);
  const [prenom,setPrenom]=useState(""); const [nom,setNom]=useState("");
  const [isCoach,setIsCoach]=useState(false); const [loading,setLoading]=useState(false);

  useEffect(()=>{const u=getUsers(setUsers);return()=>u&&u();},[]);

  async function tryLogin() {
    if(!licence.trim())return;
    setLoading(true);
    const found=Object.values(users).find(u=>u.licence===licence.trim());
    if(found){localStorage.setItem("tb_user",JSON.stringify(found));onLogin(found,found.role==="coach");return;}
    setNotFound(true);setLoading(false);
  }

  async function register() {
    if(!nom.trim()||!prenom.trim()||!licence.trim())return;
    setLoading(true);
    const id=`${prenom.toLowerCase().replace(/\s/g,"")}${nom.toLowerCase().replace(/\s/g,"")}${licence.trim()}`;
    const user={id,nom:nom.trim(),prenom:prenom.trim(),licence:licence.trim(),role:isCoach?"coach":"athlete",createdAt:Date.now()};
    await saveUser(id,user);
    localStorage.setItem("tb_user",JSON.stringify(user));
    onLogin(user,isCoach);
  }

  if(newMode) return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.green,padding:"50px 24px 32px"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.4)",marginBottom:8,textTransform:"uppercase"}}>Nouveau compte</div>
        <div style={{fontSize:32,fontWeight:800,color:"#fff"}}>Track<span style={{fontWeight:200}}>Board</span></div>
      </div>
      <div style={{padding:"28px 20px",display:"flex",flexDirection:"column",gap:12}}>
        <input className="inp" placeholder="Prénom" value={prenom} onChange={e=>setPrenom(e.target.value)}/>
        <input className="inp" placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)}/>
        <input className="inp" placeholder="N° de licence" value={licence} onChange={e=>setLicence(e.target.value)}/>
        <Toggle label="Je suis coach" sub="Accès gestion complète" value={isCoach} onChange={setIsCoach}/>
        <button className="btn-primary" onClick={register} disabled={loading} style={{marginTop:8}}>{loading?"...":"Créer mon compte →"}</button>
        <button className="btn-ghost" onClick={()=>setNewMode(false)} style={{width:"100%"}}>← Retour</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.green,padding:"60px 24px 40px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.4)",marginBottom:12,textTransform:"uppercase"}}>Athlétisme</div>
        <div style={{fontSize:38,fontWeight:800,color:"#fff",lineHeight:1.1}}>Track<span style={{fontWeight:200}}>Board</span></div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginTop:8,fontWeight:300}}>Ton carnet d'entraînement</div>
      </div>
      <div style={{padding:"32px 20px",display:"flex",flexDirection:"column",gap:14,flex:1}}>
        <div style={{fontSize:15,fontWeight:600,color:C.text}}>Ton numéro de licence</div>
        <input className="inp" placeholder="Ex: 123456" value={licence} onChange={e=>{setLicence(e.target.value);setNotFound(false);}}/>
        {notFound&&<div style={{fontSize:13,color:C.danger}}>Licence introuvable — crée ton compte.</div>}
        <button className="btn-primary" onClick={tryLogin} disabled={loading}>{loading?"Recherche...":"Accéder →"}</button>
        <div style={{textAlign:"center",fontSize:13,color:C.muted,fontWeight:300}}>Première connexion ?</div>
        <button className="btn-ghost" onClick={()=>setNewMode(true)} style={{width:"100%"}}>Créer mon compte</button>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(()=>injectStyles(),[]);
  const [user,setUser]=useState(null); const [isCoach,setIsCoach]=useState(false);
  const [view,setView]=useState("planning");
  const [users,setUsers]=useState({}); const [seances,setSeances]=useState({});
  const [logs,setLogs]=useState({}); const [comps,setComps]=useState({});
  const [cycles,setCycles]=useState({});
  const [selSeance,setSelSeance]=useState(null); const [selAthlete,setSelAthlete]=useState(null);
  const [showLog,setShowLog]=useState(null); const [showAddSeance,setShowAddSeance]=useState(false);
  const [showAddComp,setShowAddComp]=useState(false); const [showProfile,setShowProfile]=useState(false);
  const [weekOffset,setWeekOffset]=useState(0);
  const [filterGroupe,setFilterGroupe]=useState("all"); const [filterAthlete,setFilterAthlete]=useState("all");

  useEffect(()=>{const s=localStorage.getItem("tb_user");if(s){const u=JSON.parse(s);setUser(u);setIsCoach(u.role==="coach");}},[]);
  useEffect(()=>{
    if(!user)return;
    const us=[getUsers(setUsers),getSeances(setSeances),getLogs(setLogs),getComps(setComps),getCycles(setCycles)];
    return()=>us.forEach(u=>u&&u());
  },[user]);

  const handleLogin=(u,coach)=>{setUser(u);setIsCoach(coach);};
  const logout=()=>{localStorage.removeItem("tb_user");setUser(null);setIsCoach(false);};

  if(!user) return <Login onLogin={handleLogin}/>;

  const athletesList=Object.values(users);
  const seancesList=Object.entries(seances).map(([id,s])=>({...s,id}));
  const cyclesList=Object.entries(cycles).map(([id,c])=>({...c,id}));

  const notifs={};
  seancesList.forEach(s=>{
    Object.entries(s.presences||{}).forEach(([uid,st])=>{
      if(st==="present"&&!logs[`${uid}_${s.id}`])notifs[`${uid}_${s.id}`]=true;
    });
  });
  const nbNotifs=isCoach?Object.keys(notifs).length:Object.keys(notifs).filter(k=>k.startsWith(user.id)).length;

  const ws=weekStart(weekOffset);
  const seancesByJour=Array.from({length:7},(_,i)=>{
    const dayDate=new Date(ws);dayDate.setDate(ws.getDate()+i);
    return seancesList.filter(s=>{
      if(s.jour!==i)return false;
      if(s.weekOffset!==undefined&&s.weekOffset!==weekOffset)return false;
      if(filterGroupe!=="all"&&s.groupe!==filterGroupe)return false;
      if(filterAthlete!=="all"&&!(s.presences||{})[filterAthlete]&&!(s.athletes||[]).includes(filterAthlete))return false;
      return true;
    }).sort((a,b)=>(a.heureDebut||"").localeCompare(b.heureDebut||""));
  });

  const TABS=[
    {key:"planning",icon:"ti-calendar-week",label:"Planning"},
    isCoach?{key:"athletes",icon:"ti-run",label:"Athlètes"}:{key:"profil",icon:"ti-user",label:"Profil"},
    {key:"comps",icon:"ti-trophy",label:"Compétitions"},
    isCoach?{key:"cycles",icon:"ti-barbell",label:"Cycles"}:null,
  ].filter(Boolean);

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.bg,paddingBottom:80}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:C.light,textTransform:"uppercase"}}>TrackBoard</div>
          <div style={{fontSize:17,fontWeight:800,color:C.text,lineHeight:1.2}}>{isCoach?"Coach · "+Object.keys(users).length+" membres":user.prenom+" "+user.nom}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {nbNotifs>0&&<div style={{background:C.danger,color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{nbNotifs}</div>}
          <div onClick={()=>setShowProfile(true)} style={{cursor:"pointer"}}><Avatar nom={user.nom} prenom={user.prenom} photo={user.photo} size={36}/></div>
        </div>
      </div>

      <div className="fade">
        {view==="planning"&&<Planning seancesByJour={seancesByJour} athletesList={athletesList} logs={logs} notifs={notifs} filterGroupe={filterGroupe} setFilterGroupe={setFilterGroupe} filterAthlete={filterAthlete} setFilterAthlete={setFilterAthlete} weekOffset={weekOffset} setWeekOffset={setWeekOffset} weekLabel={weekLabel(ws)} isCoach={isCoach} user={user} onSel={s=>{setSelSeance(s);}} onAdd={()=>setShowAddSeance(true)}/>}
        {view==="athletes"&&isCoach&&<Athletes athletesList={athletesList} seancesList={seancesList} logs={logs} notifs={notifs} onSel={setSelAthlete}/>}
        {view==="profil"&&!isCoach&&<ProfilView user={user} seancesList={seancesList} logs={logs} cyclesList={cyclesList} notifs={notifs} onShowLog={setShowLog} onEdit={()=>setShowProfile(true)}/>}
        {view==="comps"&&<Comps comps={comps} athletesList={athletesList} isCoach={isCoach} user={user} onUpdateComp={updateComp} onDeleteComp={deleteComp} onAdd={()=>setShowAddComp(true)}/>}
        {view==="cycles"&&isCoach&&<Cycles cyclesList={cyclesList} athletesList={athletesList} onAddCycle={addCycle} onDeleteCycle={deleteCycle} onUpdateCycle={updateCycle}/>}
      </div>

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 18px",zIndex:50}}>
        {TABS.map(t=>(
          <button key={t.key} className="nav-btn" onClick={()=>setView(t.key)} style={{opacity:view===t.key?1:.35}}>
            <i className={`ti ${t.icon}`} style={{fontSize:24,color:view===t.key?C.green:C.text}} aria-hidden="true"/>
            <span style={{fontSize:9,fontWeight:view===t.key?700:400,color:view===t.key?C.green:C.muted,letterSpacing:.3}}>{t.label}</span>
          </button>
        ))}
      </nav>

      {selSeance&&<SeanceModal seance={selSeance} athletesList={athletesList} logs={logs} isCoach={isCoach} user={user} notifs={notifs} cyclesList={cyclesList} onClose={()=>setSelSeance(null)} onPresence={(sid,uid,st)=>setPresence(sid,uid,st)} onShowLog={setShowLog} onDelete={id=>{deleteSeance(id);setSelSeance(null);}}/>}
      {showLog&&<LogModal seance={showLog.seance} athleteId={showLog.athleteId} existing={logs[`${showLog.athleteId}_${showLog.seance.id}`]} cyclesList={cyclesList} onClose={()=>setShowLog(null)} onSave={data=>{saveLog(showLog.seance.id,showLog.athleteId,data);setShowLog(null);}}/>}
      {showAddSeance&&<AddSeance onClose={()=>setShowAddSeance(false)} onAdd={data=>{addSeance({...data,weekOffset});setShowAddSeance(false);}} athletesList={athletesList} cyclesList={cyclesList}/>}
      {selAthlete&&<Modal onClose={()=>setSelAthlete(null)} title={`${selAthlete.prenom} ${selAthlete.nom}`} full><ProfilView user={selAthlete} seancesList={seancesList} logs={logs} cyclesList={cyclesList} notifs={notifs} onShowLog={setShowLog}/></Modal>}
      {showAddComp&&<AddComp onClose={()=>setShowAddComp(false)} onAdd={data=>{addComp(data);setShowAddComp(false);}}/>}
      {showProfile&&<ProfileModal user={user} onClose={()=>setShowProfile(false)} onSave={data=>{const u={...user,...data};saveUser(user.id,u);localStorage.setItem("tb_user",JSON.stringify(u));setUser(u);setShowProfile(false);}} onLogout={logout}/>}
    </div>
  );
}

function Planning({seancesByJour,athletesList,logs,notifs,filterGroupe,setFilterGroupe,filterAthlete,setFilterAthlete,weekOffset,setWeekOffset,weekLabel,isCoach,user,onSel,onAdd}) {
  const [showFilters,setShowFilters]=useState(false);

  return (
    <div>
      {/* Semaine nav */}
      <div style={{padding:"12px 20px 8px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <button onClick={()=>setWeekOffset(w=>w-1)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-chevron-left" style={{fontSize:18,color:C.text}} aria-hidden="true"/>
          </button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text}}>{weekLabel}</div>
            {weekOffset!==0&&<button onClick={()=>setWeekOffset(0)} style={{fontSize:11,color:C.green,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>← Semaine actuelle</button>}
          </div>
          <button onClick={()=>setWeekOffset(w=>w+1)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <i className="ti ti-chevron-right" style={{fontSize:18,color:C.text}} aria-hidden="true"/>
          </button>
        </div>

        {/* Filtres */}
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          <button onClick={()=>setShowFilters(!showFilters)} className={`chip ${showFilters||filterAthlete!=="all"?"chip-on":"chip-off"}`} style={{flexShrink:0}}>
            <i className="ti ti-adjustments-horizontal" style={{fontSize:13,marginRight:4}} aria-hidden="true"/>
            Filtres
          </button>
          {["all",...GROUPES].map(g=>(
            <button key={g} onClick={()=>setFilterGroupe(g)} className={`chip ${filterGroupe===g?"chip-on":"chip-off"}`} style={{flexShrink:0}}>
              {g==="all"?"Tous":g}
            </button>
          ))}
        </div>
        {showFilters&&(
          <div style={{marginTop:8,padding:"12px",background:C.surface,borderRadius:12,border:`1px solid ${C.border}`}}>
            <div className="lbl">Filtrer par athlète</div>
            <select value={filterAthlete} onChange={e=>setFilterAthlete(e.target.value)} className="inp" style={{padding:"10px 12px",fontSize:14}}>
              <option value="all">Tous les athlètes</option>
              {athletesList.map(a=><option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Jours */}
      {seancesByJour.map((seances,i)=>{
        const ws=weekStart(weekOffset);
        const dayDate=new Date(ws);dayDate.setDate(ws.getDate()+i);
        const dateStr=dayDate.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
        const isToday=new Date().toDateString()===dayDate.toDateString();
        return (
          <div key={i}>
            <div style={{padding:"10px 20px 4px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:10,fontWeight:700,color:isToday?C.green:C.light,letterSpacing:1,textTransform:"uppercase"}}>{JOURS[i]}</div>
              <div style={{fontSize:10,color:isToday?C.green:C.light,fontWeight:isToday?700:300}}>{dateStr}</div>
              {isToday&&<div style={{fontSize:9,background:C.green,color:"#fff",borderRadius:4,padding:"1px 6px",fontWeight:700}}>Aujourd'hui</div>}
            </div>
            {seances.length===0&&<div style={{padding:"0 20px 6px",fontSize:12,color:C.light}}>—</div>}
            {seances.map(s=>{
              const coaches=athletesList.filter(a=>a.role==="coach"&&(s.presences||{})[a.id]==="present");
              const nbP=Object.values(s.presences||{}).filter(v=>v==="present").length;
              const nbNL=Object.entries(s.presences||{}).filter(([uid,v])=>v==="present"&&notifs[`${uid}_${s.id}`]).length;
              const myStatus=(s.presences||{})[user.id];
              const isCoachCard=coaches.length>0;
              const seanceColor=s.color||null;
              return (
                <div key={s.id} onClick={()=>onSel(s)} style={{margin:"0 16px 8px",padding:"12px 14px",borderRadius:16,background:isCoachCard?C.green:C.surface,border:`1px solid ${isCoachCard?C.green:nbNL>0?C.dangerBorder:seanceColor||C.border}`,cursor:"pointer",position:"relative",borderLeft:seanceColor?`4px solid ${seanceColor}`:undefined}}>
                  {nbNL>0&&<div style={{position:"absolute",top:10,right:12,width:8,height:8,borderRadius:"50%",background:C.danger}}/>}
                  {isCoachCard&&<div style={{fontSize:8,fontWeight:800,color:"#9FD4A8",letterSpacing:1,marginBottom:6}}>COACH · {coaches.map(c=>c.prenom).join(", ")}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <SeanceIcon type={s.type} size={36} color={isCoachCard?"rgba(255,255,255,0.15)":undefined}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                        <span style={{fontSize:15,fontWeight:800,color:isCoachCard?"#fff":C.text}}>{s.heureDebut}–{s.heureFin}</span>
                        {s.groupe&&<span className="tag" style={{background:isCoachCard?"rgba(255,255,255,0.15)":C.alt,color:isCoachCard?"rgba(255,255,255,0.7)":C.muted}}>{s.groupe}</span>}
                      </div>
                      {(s.disciplines||[]).length>0?(
                        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                          {(s.disciplines||[]).map(d=><span key={d} style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:5,background:isCoachCard?"rgba(255,255,255,0.15)":C.greenLight,color:isCoachCard?"rgba(255,255,255,0.8)":C.greenMid}}>{d}</span>)}
                        </div>
                      ):(s.cycleId?<div style={{fontSize:11,color:isCoachCard?"rgba(255,255,255,0.5)":C.muted,fontWeight:300}}>◆ {s.cycleName||"Muscu"}{s.seanceName?` · ${s.seanceName}`:""}</div>:null)}
                    </div>
                    <div style={{flexShrink:0,textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:800,color:isCoachCard?"#fff":nbP>0?C.green:C.light}}>{nbP}</div>
                      <div style={{fontSize:9,color:isCoachCard?"rgba(255,255,255,0.4)":C.light}}>présent{nbP>1?"s":""}</div>
                      {!isCoach&&<div style={{fontSize:10,marginTop:3,color:myStatus==="present"?isCoachCard?"#9FD4A8":C.green:C.light,fontWeight:myStatus==="present"?700:300}}>{myStatus==="present"?"✓":"—"}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {isCoach&&<div style={{padding:"8px 16px 24px"}}><button onClick={onAdd} style={{width:"100%",padding:"14px",borderRadius:14,border:`2px dashed ${C.border}`,background:"transparent",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Nouvelle séance</button></div>}
    </div>
  );
}

function SeanceModal({seance,athletesList,logs,isCoach,user,notifs,cyclesList,onClose,onPresence,onShowLog,onDelete}) {
  const myStatus=(seance.presences||{})[user.id];
  const presents=athletesList.filter(a=>(seance.presences||{})[a.id]==="present");
  const cycle=seance.cycleId?cyclesList.find(c=>c.id===seance.cycleId):null;

  return (
    <Modal onClose={onClose} title={`${seance.heureDebut} – ${seance.heureFin}`}>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <SeanceIcon type={seance.type} size={32}/>
        <span style={{fontSize:14,fontWeight:700,color:C.text,textTransform:"capitalize"}}>{seance.type}</span>
        {seance.groupe&&<span className="tag" style={{background:C.alt,color:C.muted,padding:"5px 10px"}}>{seance.groupe}</span>}
        {seance.lieu&&<span className="tag" style={{background:C.alt,color:C.muted,padding:"5px 10px"}}>📍 {seance.lieu}</span>}
        {seance.color&&<div style={{width:16,height:16,borderRadius:"50%",background:seance.color,flexShrink:0}}/>}
      </div>

      {seance.contenu&&<div style={{padding:"10px 14px",borderRadius:10,background:C.alt,marginBottom:14,fontSize:14,color:C.text,lineHeight:1.6,fontWeight:300}}>{seance.contenu}</div>}

      {(seance.disciplines||[]).length>0&&(
        <div style={{marginBottom:14}}>
          <Lbl>Disciplines</Lbl>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(seance.disciplines||[]).map(d=><span key={d} className="disc disc-on">{d}</span>)}</div>
        </div>
      )}

      {cycle&&(
        <div style={{marginBottom:14,padding:"10px 12px",borderRadius:10,background:C.greenLight,border:`1px solid ${C.greenAccent}44`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.green,marginBottom:2}}>◆ {cycle.nom}</div>
          {seance.seanceName&&<div style={{fontSize:11,color:C.greenMid,fontWeight:300}}>Séance : {seance.seanceName}</div>}
        </div>
      )}

      <Lbl>Ma présence</Lbl>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={()=>onPresence(seance.id,user.id,myStatus==="present"?null:"present")} style={{flex:1,padding:"12px",borderRadius:12,border:`1.5px solid ${myStatus==="present"?C.green:C.border}`,background:myStatus==="present"?C.greenLight:C.surface,color:myStatus==="present"?C.green:C.muted,fontWeight:700,cursor:"pointer",fontSize:14}}>✓ Je viens</button>
        <button onClick={()=>onPresence(seance.id,user.id,myStatus==="absent"?null:"absent")} style={{flex:1,padding:"12px",borderRadius:12,border:`1.5px solid ${myStatus==="absent"?C.danger:C.border}`,background:myStatus==="absent"?C.dangerBg:C.surface,color:myStatus==="absent"?C.danger:C.muted,fontWeight:700,cursor:"pointer",fontSize:14}}>✗ Absent</button>
      </div>
      {myStatus==="present"&&<button onClick={()=>onShowLog({seance,athleteId:user.id})} style={{width:"100%",padding:"12px",borderRadius:12,border:`1.5px solid ${notifs[`${user.id}_${seance.id}`]?C.danger:C.green}`,background:notifs[`${user.id}_${seance.id}`]?C.dangerBg:C.greenLight,color:notifs[`${user.id}_${seance.id}`]?C.danger:C.green,fontWeight:700,cursor:"pointer",fontSize:14,marginBottom:14}}>{logs[`${user.id}_${seance.id}`]?"✏️ Modifier mon bilan":"📝 Remplir mon bilan"}</button>}

      <Lbl>Présents ({presents.length})</Lbl>
      {presents.length===0&&<p className="empty">Personne n'a coché pour l'instant.</p>}
      <div style={{marginBottom:14}}>
        {presents.map(a=>{
          const logged=logs[`${a.id}_${seance.id}`];
          const need=notifs[`${a.id}_${seance.id}`];
          return (
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700}}>{a.prenom} {a.nom}{a.role==="coach"&&<span style={{marginLeft:6,fontSize:10,background:C.amberBg,color:C.amber,padding:"2px 6px",borderRadius:5,fontWeight:700}}>COACH</span>}</div>
                {logged?<div style={{fontSize:12,color:C.muted,fontWeight:300}}>Forme {logged.forme}/10 · Diff. {logged.difficulte}/10 · Fatigue {logged.fatigue}/10</div>:<div style={{fontSize:12,color:need?C.danger:C.light,fontWeight:need?600:300}}>{need?"Bilan non rempli":"—"}</div>}
              </div>
              {isCoach&&<button onClick={()=>onShowLog({seance,athleteId:a.id})} style={{fontSize:12,padding:"5px 10px",borderRadius:8,border:`1px solid ${need?C.danger:C.border}`,background:need?C.dangerBg:C.alt,color:need?C.danger:C.muted,cursor:"pointer",fontWeight:600}}>{logged?"Voir":"Saisir"}</button>}
            </div>
          );
        })}
      </div>
      {isCoach&&<button className="btn-danger" onClick={()=>{if(window.confirm("Supprimer cette séance ?"))onDelete(seance.id);}}>Supprimer la séance</button>}
    </Modal>
  );
}

function LogModal({seance,athleteId,existing,cyclesList,onClose,onSave}) {
  const cycle=seance.cycleId?cyclesList.find(c=>c.id===seance.cycleId):null;
  const seanceIdx=seance.seanceIdx||0;
  const cycleExos=cycle?(cycle.seances||[{exercices:cycle.exercices||[]}])[seanceIdx]?.exercices||[]:[];

  const [forme,setForme]=useState(existing?.forme??7);
  const [difficulte,setDifficulte]=useState(existing?.difficulte??6);
  const [fatigue,setFatigue]=useState(existing?.fatigue??5);
  const [notes,setNotes]=useState(existing?.notes??"");
  const [exos,setExos]=useState(()=>{
    if(existing?.exos&&existing.exos.length>0)return existing.exos;
    if(cycleExos.length>0)return cycleExos.map(e=>({nom:e.nom,seriesPrev:e.series,repsPrev:e.reps,series:"",poids:"",rpe:""}));
    return[];
  });

  function updExo(i,f,v){setExos(p=>p.map((e,j)=>j===i?{...e,[f]:v}:e));}

  function save(){
    const data=seance.type==="muscu"?{type:"muscu",forme,difficulte,fatigue,notes,exos}:{type:seance.type,forme,difficulte,fatigue,notes};
    onSave(data);
  }

  return (
    <Modal onClose={onClose} title="Bilan de séance" full>
      <Slider label="Forme pendant la séance" value={forme} onChange={setForme} color={C.green}/>
      <Slider label="Difficulté de la séance" value={difficulte} onChange={setDifficulte} color={C.amber}/>
      <Slider label="Fatigue après la séance" value={fatigue} onChange={setFatigue} color={C.danger}/>

      {seance.type==="muscu"&&(
        <>
          {cycle&&<div style={{padding:"8px 12px",borderRadius:10,background:C.greenLight,marginBottom:14,fontSize:12,fontWeight:700,color:C.green}}>◆ {cycle.nom}{seance.seanceName?` · ${seance.seanceName}`:""}</div>}
          <Lbl>Exercices</Lbl>
          {exos.map((e,i)=>(
            <div key={i} style={{padding:"12px",borderRadius:12,background:C.alt,marginBottom:8}}>
              <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <input value={e.nom} onChange={ev=>updExo(i,"nom",ev.target.value)} placeholder="Exercice" className="inp" style={{flex:1,padding:"8px 10px",fontSize:14}}/>
                <button onClick={()=>setExos(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>✕</button>
              </div>
              {(e.seriesPrev||e.repsPrev)&&<div style={{fontSize:11,color:C.muted,fontWeight:300,marginBottom:6}}>Prévu : {e.seriesPrev}×{e.repsPrev}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>Séries</div>
                  <input type="number" value={e.series||""} onChange={ev=>updExo(i,"series",ev.target.value)} placeholder="0" className="inp" style={{textAlign:"center",padding:"8px 4px",fontSize:14}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>Poids (kg)</div>
                  <input value={e.poids||""} onChange={ev=>updExo(i,"poids",ev.target.value)} placeholder="Ex: 80/85/90" className="inp" style={{textAlign:"center",padding:"8px 4px",fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>RPE</div>
                  <input type="number" min={1} max={10} value={e.rpe||""} onChange={ev=>updExo(i,"rpe",ev.target.value)} placeholder="0" className="inp" style={{textAlign:"center",padding:"8px 4px",fontSize:14}}/>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>setExos(p=>[...p,{nom:"",series:"",poids:"",rpe:""}])} style={{width:"100%",padding:"9px",borderRadius:10,border:`2px dashed ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:12}}>+ Exercice</button>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Notes globales..." className="inp" style={{resize:"none",marginBottom:12}}/>
        </>
      )}
      {seance.type!=="muscu"&&(
        <div style={{marginBottom:20}}>
          <Lbl>Notes libres</Lbl>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} placeholder="Marques, sensations, intentions, gênes..." className="inp" style={{resize:"none",lineHeight:1.6}}/>
        </div>
      )}
      <button className="btn-primary" onClick={save}>Sauvegarder</button>
    </Modal>
  );
}

function ProfilView({user,seancesList,logs,cyclesList,notifs,onShowLog,onEdit}) {
  const mySeances=seancesList.filter(s=>(s.presences||{})[user.id]==="present");
  const myCycles=cyclesList.filter(c=>(c.assignes||[]).includes(user.id));

  const byWeek={};
  mySeances.forEach(s=>{
    const log=logs[`${user.id}_${s.id}`];
    const ts=log?.ts||0;
    const d=ts?new Date(ts):new Date();
    const wStart=new Date(d);wStart.setDate(d.getDate()-((d.getDay()||7)-1));wStart.setHours(0,0,0,0);
    const wk=weekLabel(wStart);
    if(!byWeek[wk])byWeek[wk]=[];
    byWeek[wk].push({s,log,ts});
  });

  return (
    <div style={{padding:"16px 20px"}}>
      {onEdit&&<button className="btn-ghost" onClick={onEdit} style={{marginBottom:16,width:"100%"}}>Modifier mon profil</button>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[{l:"Séances",v:mySeances.length},{l:"Bilans remplis",v:mySeances.filter(s=>logs[`${user.id}_${s.id}`]).length}].map(st=>(
          <div key={st.l} style={{padding:"14px",borderRadius:12,background:C.surface,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:C.light,textTransform:"uppercase",marginBottom:4}}>{st.l}</div>
            <div style={{fontSize:28,fontWeight:800,color:C.text}}>{st.v}</div>
          </div>
        ))}
      </div>

      {(user.records&&Object.values(user.records).some(Boolean))&&(
        <div style={{marginBottom:20}}>
          <Lbl>Records</Lbl>
          <div className="card">
            {Object.entries(user.records||{}).map(([k,v])=>v?(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.muted,fontWeight:300}}>{k}</span>
                <span style={{fontSize:14,fontWeight:800,color:C.green}}>{v}</span>
              </div>
            ):null)}
          </div>
        </div>
      )}

      {myCycles.length>0&&(
        <div style={{marginBottom:20}}>
          <Lbl>Cycles muscu en cours</Lbl>
          {myCycles.map(c=>(
            <div key={c.id} className="card" style={{marginBottom:8}}>
              <div style={{fontSize:15,fontWeight:800,marginBottom:8}}>{c.nom}</div>
              {(c.seances||[{exercices:c.exercices||[]}]).map((sc,si)=>(
                <div key={si} style={{marginBottom:8}}>
                  {(c.seances||[]).length>1&&<div style={{fontSize:11,fontWeight:700,color:C.green,marginBottom:4}}>{sc.nom||`Séance ${si+1}`}</div>}
                  {(sc.exercices||[]).map((e,ei)=>(
                    <div key={ei} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:`1px solid ${C.border}`}}>
                      <span style={{fontSize:13}}>{e.nom}</span>
                      <span style={{fontSize:12,color:C.muted,fontWeight:300}}>{e.series}×{e.reps}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Lbl>Historique des séances</Lbl>
      {Object.keys(byWeek).length===0&&<p className="empty">Aucune séance cochée.</p>}
      {Object.entries(byWeek).map(([wk,items])=>(
        <div key={wk} style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.green,letterSpacing:.5,marginBottom:6,padding:"4px 10px",background:C.greenLight,borderRadius:8,display:"inline-block"}}>{wk}</div>
          {items.map(({s,log})=>{
            const need=notifs[`${user.id}_${s.id}`];
            return (
              <div key={s.id} onClick={()=>onShowLog({seance:s,athleteId:user.id})} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:14,background:need?C.dangerBg:C.surface,border:`1px solid ${need?C.dangerBorder:C.border}`,marginBottom:6,cursor:"pointer"}}>
                <SeanceIcon type={s.type} size={34}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700}}>{JOURS[s.jour]} · {s.heureDebut}</div>
                  {log?<div style={{fontSize:12,color:C.muted,fontWeight:300}}>Forme {log.forme}/10 · Diff. {log.difficulte}/10 · Fatigue {log.fatigue}/10</div>:<div style={{fontSize:12,color:need?C.danger:C.light,fontWeight:need?600:300}}>{need?"Bilan à remplir":"—"}</div>}
                </div>
                <i className="ti ti-chevron-right" style={{fontSize:16,color:C.light}} aria-hidden="true"/>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Athletes({athletesList,seancesList,logs,notifs,onSel}) {
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=athletesList.filter(a=>{
    if(filter!=="all"&&a.groupe!==filter)return false;
    if(search&&!`${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  return (
    <div style={{padding:"16px 20px"}}>
      <input className="inp" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto"}}>
        {["all",...GROUPES].map(g=><button key={g} onClick={()=>setFilter(g)} className={`chip ${filter===g?"chip-on":"chip-off"}`} style={{flexShrink:0}}>{g==="all"?`Tous (${athletesList.length})`:`${g} (${athletesList.filter(a=>a.groupe===g).length})`}</button>)}
      </div>
      {filtered.length===0&&<p className="empty">Aucun athlète trouvé.</p>}
      {filtered.map(a=>{
        const nb=seancesList.filter(s=>(s.presences||{})[a.id]==="present").length;
        const nbn=Object.keys(notifs).filter(k=>k.startsWith(a.id)).length;
        return (
          <div key={a.id} onClick={()=>onSel(a)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,background:C.surface,border:`1px solid ${C.border}`,marginBottom:8,cursor:"pointer"}}>
            <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo} size={44}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700}}>{a.prenom} {a.nom}{a.role==="coach"&&<span style={{marginLeft:6,fontSize:10,background:C.amberBg,color:C.amber,padding:"2px 6px",borderRadius:5,fontWeight:700}}>COACH</span>}</div>
              <div style={{fontSize:12,color:C.muted,fontWeight:300,marginTop:2}}>{nb} séance{nb>1?"s":""}{a.groupe?" · "+a.groupe:""}</div>
            </div>
            {nbn>0&&<div style={{width:22,height:22,borderRadius:"50%",background:C.danger,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{nbn}</div>}
            <i className="ti ti-chevron-right" style={{fontSize:18,color:C.light}} aria-hidden="true"/>
          </div>
        );
      })}
    </div>
  );
}

function Comps({comps,athletesList,isCoach,user,onUpdateComp,onDeleteComp,onAdd}) {
  const list=Object.entries(comps||{}).map(([id,c])=>({...c,id})).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  return (
    <div style={{padding:"16px 20px"}}>
      {isCoach&&<button onClick={onAdd} style={{width:"100%",padding:"14px",borderRadius:14,border:`2px dashed ${C.border}`,background:"transparent",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:16}}>+ Ajouter une compétition</button>}
      {list.length===0&&<p className="empty">Aucune compétition.</p>}
      {list.map(c=>{
        const ins=Object.entries(c.inscriptions||{});
        return (
          <div key={c.id} className="card" style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontSize:17,fontWeight:800,flex:1,marginRight:8}}>{c.nom}</div>
              <span className="tag" style={{background:C.greenLight,color:C.green,padding:"4px 10px",flexShrink:0}}>{c.niveau}</span>
            </div>
            <div style={{fontSize:13,color:C.muted,fontWeight:300,marginBottom:14}}>📅 {c.date} · 📍 {c.lieu}</div>
            <CompInsc existing={(c.inscriptions||{})[user?.id]} onSave={data=>onUpdateComp(c.id,{inscriptions:{...(c.inscriptions||{}),[user.id]:data}})}/>
            {isCoach&&ins.length>0&&(
              <div style={{marginTop:12}}>
                <Lbl>Inscrits ({ins.length})</Lbl>
                {ins.map(([uid,info])=>{const a=athletesList.find(x=>x.id===uid);if(!a)return null;return(
                  <div key={uid} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
                    <Avatar nom={a.nom} prenom={a.prenom} photo={a.photo} size={28}/>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{a.prenom} {a.nom}</div><div style={{fontSize:11,color:C.muted,fontWeight:300}}>{info.epreuves} · {info.transport==="voiture"?`🚗 ${info.places} place(s)`:info.transport==="commun"?"🚌 Commun":"🙋 Besoin transport"}</div></div>
                  </div>
                );})}
                <div style={{marginTop:8,padding:"7px 10px",borderRadius:8,background:C.alt,fontSize:11,color:C.muted,fontWeight:300}}>
                  🚗 {ins.filter(([,i])=>i.transport==="voiture").reduce((s,[,i])=>s+(+i.places||0),0)} places · 🙋 {ins.filter(([,i])=>i.transport==="amener").length} à amener · 🚌 {ins.filter(([,i])=>i.transport==="commun").length} en commun
                </div>
              </div>
            )}
            {isCoach&&<button className="btn-danger" onClick={()=>{if(window.confirm("Supprimer ?"))onDeleteComp(c.id);}} style={{marginTop:12,padding:"10px"}}>Supprimer</button>}
          </div>
        );
      })}
    </div>
  );
}

function CompInsc({existing,onSave}) {
  const [ep,setEp]=useState(existing?.epreuves??"");
  const [tr,setTr]=useState(existing?.transport??"amener");
  const [pl,setPl]=useState(existing?.places??1);
  const [saved,setSaved]=useState(!!existing);
  const opts=[["amener","🙋 Besoin d'être amené"],["voiture","🚗 J'ai une voiture"],["commun","🚌 Transport en commun"]];
  function save(){onSave({epreuves:ep,transport:tr,places:tr==="voiture"?+pl:0});setSaved(true);}
  return (
    <div style={{padding:"12px",borderRadius:12,background:C.alt,marginBottom:4}}>
      <Lbl>Mon inscription</Lbl>
      <input value={ep} onChange={e=>{setEp(e.target.value);setSaved(false);}} placeholder="Épreuves (ex: 110mH, Longueur)" className="inp" style={{marginBottom:10,background:C.surface}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
        {opts.map(([v,l])=><button key={v} onClick={()=>{setTr(v);setSaved(false);}} style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${tr===v?C.green:C.border}`,background:tr===v?C.greenLight:C.surface,color:tr===v?C.green:C.muted,fontWeight:tr===v?700:400,fontSize:13,cursor:"pointer",textAlign:"left"}}>{l}</button>)}
      </div>
      {tr==="voiture"&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:13,color:C.muted,fontWeight:300}}>Places :</span><input type="number" min={1} max={8} value={pl} onChange={e=>{setPl(e.target.value);setSaved(false);}} className="inp" style={{width:70,textAlign:"center",padding:"8px"}}/></div>}
      <button className="btn-primary" onClick={save} style={{background:saved?C.greenMid:C.green}}>{saved?"✓ Inscription enregistrée":"M'inscrire"}</button>
    </div>
  );
}

function Cycles({cyclesList,athletesList,onAddCycle,onDeleteCycle,onUpdateCycle}) {
  const [showAdd,setShowAdd]=useState(false);
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("nom");
  const [selCycle,setSelCycle]=useState(null);

  const filtered=cyclesList
    .filter(c=>!search||c.nom?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sortBy==="nom")return(a.nom||"").localeCompare(b.nom||"");
      if(sortBy==="athletes"){const na=(a.assignes||[]).length;const nb=(b.assignes||[]).length;return nb-na;}
      return 0;
    });

  return (
    <div style={{padding:"16px 20px"}}>
      <div style={{display:"flex",gap:10,marginBottom:10}}>
        <input className="inp" placeholder="Rechercher un cycle..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}}/>
        <button className="btn-primary" onClick={()=>setShowAdd(true)} style={{width:"auto",padding:"12px 16px",flexShrink:0}}>+</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["nom","Par nom"],["athletes","Par athlètes"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSortBy(v)} className={`chip ${sortBy===v?"chip-on":"chip-off"}`}>{l}</button>
        ))}
      </div>
      {filtered.length===0&&<p className="empty">Aucun cycle. Crée-en un !</p>}
      {filtered.map(c=>{
        const asgn=athletesList.filter(a=>(c.assignes||[]).includes(a.id));
        const nbEx=(c.seances||[{exercices:c.exercices||[]}]).reduce((s,sc)=>s+(sc.exercices||[]).length,0);
        const nbSc=(c.seances||[]).length||1;
        return (
          <div key={c.id} className="card" style={{marginBottom:10,cursor:"pointer"}} onClick={()=>setSelCycle(c)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,marginBottom:2}}>{c.nom}</div>
                <div style={{fontSize:12,color:C.muted,fontWeight:300}}>{nbSc} séance{nbSc>1?"s":""} · {nbEx} exercices</div>
              </div>
              <button onClick={e=>{e.stopPropagation();if(window.confirm("Supprimer ce cycle ?"))onDeleteCycle(c.id);}} style={{background:C.dangerBg,border:"none",color:C.danger,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700,flexShrink:0}}>✕</button>
            </div>
            {asgn.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
                {asgn.map(a=><div key={a.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:8,background:C.alt,fontSize:11,fontWeight:600}}><Avatar nom={a.nom} prenom={a.prenom} size={16}/>{a.prenom}</div>)}
              </div>
            )}
          </div>
        );
      })}
      {showAdd&&<AddCycle athletesList={athletesList} onClose={()=>setShowAdd(false)} onAdd={data=>{onAddCycle(data);setShowAdd(false);}}/>}
      {selCycle&&<CycleDetail cycle={selCycle} athletesList={athletesList} onClose={()=>setSelCycle(null)} onUpdate={data=>{onUpdateCycle(selCycle.id,data);setSelCycle(null);}}/>}
    </div>
  );
}

function CycleDetail({cycle,athletesList,onClose,onUpdate}) {
  const [assignes,setAssignes]=useState(cycle.assignes||[]);
  function toggle(id){setAssignes(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  return (
    <Modal onClose={onClose} title={cycle.nom} full>
      <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:16}}>{(cycle.seances||[]).length||1} séance(s) · {(cycle.seances||[{exercices:cycle.exercices||[]}]).reduce((s,sc)=>s+(sc.exercices||[]).length,0)} exercices</div>
      {(cycle.seances||[{exercices:cycle.exercices||[]}]).map((sc,si)=>(
        <div key={si} style={{marginBottom:14}}>
          {(cycle.seances||[]).length>1&&<div style={{fontSize:12,fontWeight:800,color:C.green,marginBottom:6,padding:"4px 10px",background:C.greenLight,borderRadius:8,display:"inline-block"}}>{sc.nom||`Séance ${si+1}`}</div>}
          <div className="card">
            {(sc.exercices||[]).map((e,ei)=>(
              <div key={ei} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:14,fontWeight:500}}>{e.nom}</span>
                <span style={{fontSize:13,color:C.muted,fontWeight:300}}>{e.series}×{e.reps}{e.notes?` · ${e.notes}`:""}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Lbl>Assigner à</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
        {athletesList.map(a=>(
          <button key={a.id} onClick={()=>toggle(a.id)} style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${assignes.includes(a.id)?C.green:C.border}`,background:assignes.includes(a.id)?C.greenLight:C.surface,color:assignes.includes(a.id)?C.green:C.muted,fontSize:13,fontWeight:assignes.includes(a.id)?700:400,cursor:"pointer"}}>
            {a.prenom} {a.nom[0]}.
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={()=>onUpdate({...cycle,assignes})}>Sauvegarder</button>
    </Modal>
  );
}

function AddSeance({onClose,onAdd,athletesList,cyclesList}) {
  const [jour,setJour]=useState(0);const [hD,setHD]=useState("10:00");const [hF,setHF]=useState("12:00");
  const [type,setType]=useState("piste");const [groupe,setGroupe]=useState("");const [lieu,setLieu]=useState("");
  const [contenu,setContenu]=useState("");const [discs,setDiscs]=useState([]);
  const [selAthletes,setSelAthletes]=useState([]);const [mode,setMode]=useState("groupe");
  const [cycleId,setCycleId]=useState("");const [seanceIdx,setSeanceIdx]=useState(0);
  const [cycleSearch,setCycleSearch]=useState("");const [color,setColor]=useState("");

  const selCycle=cycleId?cyclesList.find(c=>c.id===cycleId):null;
  const cycleSeances=selCycle?(selCycle.seances||[]):[];
  const filteredCycles=cyclesList.filter(c=>!cycleSearch||c.nom?.toLowerCase().includes(cycleSearch.toLowerCase()));

  function toggleDisc(d){setDiscs(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);}
  function toggleAth(id){setSelAthletes(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}

  function submit(){
    const presences={};
    if(mode==="athletes")selAthletes.forEach(id=>presences[id]="present");
    const cycleName=selCycle?.nom||"";
    const seanceName=cycleSeances[seanceIdx]?.nom||"";
    onAdd({jour,heureDebut:hD,heureFin:hF,type,groupe:mode==="groupe"?groupe:"",athletes:mode==="athletes"?selAthletes:[],lieu,contenu,disciplines:discs,cycleId:type==="muscu"?cycleId:"",seanceIdx:type==="muscu"?seanceIdx:0,cycleName,seanceName,color,presences});
  }

  return (
    <Modal onClose={onClose} title="Nouvelle séance" full>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><Lbl>Jour</Lbl><select value={jour} onChange={e=>setJour(+e.target.value)} className="inp">{JOURS.map((j,i)=><option key={i} value={i}>{j}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><Lbl>Début</Lbl><input type="time" value={hD} onChange={e=>setHD(e.target.value)} className="inp"/></div>
          <div><Lbl>Fin</Lbl><input type="time" value={hF} onChange={e=>setHF(e.target.value)} className="inp"/></div>
        </div>
        <div>
          <Lbl>Type</Lbl>
          <div style={{display:"flex",gap:8}}>
            {[["piste","Piste","ti-run"],["muscu","Muscu","ti-barbell"],["autonomie","Autonomie","ti-run"]].map(([k,l,ic])=>(
              <button key={k} onClick={()=>setType(k)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:`1.5px solid ${type===k?C.green:C.border}`,background:type===k?C.greenLight:C.surface,color:type===k?C.green:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <i className={`ti ${ic}`} style={{fontSize:18}} aria-hidden="true"/>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Lbl>Couleur de la séance</Lbl>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setColor("")} style={{width:28,height:28,borderRadius:"50%",background:C.alt,border:`2px solid ${color===""?C.green:C.border}`,cursor:"pointer"}}/>
            {COLORS.map(col=><button key={col} onClick={()=>setColor(col)} style={{width:28,height:28,borderRadius:"50%",background:col,border:`2px solid ${color===col?"#fff":col}`,cursor:"pointer",outline:color===col?`2px solid ${col}`:""}}/>)}
          </div>
        </div>

        <div>
          <Lbl>Pour qui</Lbl>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[["groupe","Par groupe"],["athletes","Athlètes spécifiques"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMode(v)} className={`chip ${mode===v?"chip-on":"chip-off"}`} style={{flex:1,justifyContent:"center"}}>{l}</button>
            ))}
          </div>
          {mode==="groupe"?(
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Tous",...GROUPES].map(g=><button key={g} onClick={()=>setGroupe(g===groupe?"":g)} className={`chip ${groupe===g?"chip-on":"chip-off"}`}>{g}</button>)}
            </div>
          ):(
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {athletesList.map(a=><button key={a.id} onClick={()=>toggleAth(a.id)} style={{padding:"6px 12px",borderRadius:10,border:`1.5px solid ${selAthletes.includes(a.id)?C.green:C.border}`,background:selAthletes.includes(a.id)?C.greenLight:C.surface,color:selAthletes.includes(a.id)?C.green:C.muted,fontSize:12,fontWeight:selAthletes.includes(a.id)?700:400,cursor:"pointer"}}>{a.prenom} {a.nom[0]}.</button>)}
            </div>
          )}
        </div>

        <div><Lbl>Lieu</Lbl><input value={lieu} onChange={e=>setLieu(e.target.value)} placeholder="Stade, CREPS, Salle..." className="inp"/></div>

        {(type==="piste"||type==="autonomie")&&(
          <div>
            <Lbl>Disciplines</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {DISCIPLINES.map(d=><button key={d} onClick={()=>toggleDisc(d)} className={`disc ${discs.includes(d)?"disc-on":"disc-off"}`}>{d}</button>)}
            </div>
          </div>
        )}

        {type==="muscu"&&(
          <div>
            <Lbl>Cycle muscu associé</Lbl>
            <input className="inp" placeholder="Rechercher un cycle..." value={cycleSearch} onChange={e=>setCycleSearch(e.target.value)} style={{marginBottom:8}}/>
            <div style={{maxHeight:160,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:10,marginBottom:cycleSeances.length>1?8:0}}>
              <div onClick={()=>{setCycleId("");setSeanceIdx(0);}} style={{padding:"10px 14px",background:cycleId===""?C.greenLight:C.surface,cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:cycleId===""?700:400,color:cycleId===""?C.green:C.muted}}>Saisie libre</span>
              </div>
              {filteredCycles.map(c=>(
                <div key={c.id} onClick={()=>{setCycleId(c.id);setSeanceIdx(0);}} style={{padding:"10px 14px",background:cycleId===c.id?C.greenLight:C.surface,cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontSize:13,fontWeight:cycleId===c.id?700:400,color:cycleId===c.id?C.green:C.text}}>{c.nom}</div>
                  <div style={{fontSize:11,color:C.muted,fontWeight:300}}>{(c.seances||[]).length||1} séance(s)</div>
                </div>
              ))}
            </div>
            {cycleSeances.length>1&&(
              <div>
                <Lbl>Quelle séance du cycle ?</Lbl>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {cycleSeances.map((sc,si)=>(
                    <button key={si} onClick={()=>setSeanceIdx(si)} style={{padding:"10px 14px",borderRadius:10,border:`1.5px solid ${seanceIdx===si?C.green:C.border}`,background:seanceIdx===si?C.greenLight:C.surface,color:seanceIdx===si?C.green:C.muted,fontSize:13,fontWeight:seanceIdx===si?700:400,cursor:"pointer",textAlign:"left"}}>
                      {sc.nom||`Séance ${si+1}`} · {(sc.exercices||[]).length} exercices
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div><Lbl>Contenu / description</Lbl><textarea value={contenu} onChange={e=>setContenu(e.target.value)} rows={3} placeholder="Description de la séance..." className="inp" style={{resize:"none"}}/></div>
        <button className="btn-primary" onClick={submit}>Créer la séance</button>
      </div>
    </Modal>
  );
}

function AddCycle({athletesList,onClose,onAdd}) {
  const [nom,setNom]=useState("");const [assignes,setAssignes]=useState([]);
  const [seances,setSeances]=useState([{nom:"",exercices:[{nom:"",series:4,reps:8,notes:""}]}]);

  function addSc(){setSeances(p=>[...p,{nom:"",exercices:[{nom:"",series:4,reps:8,notes:""}]}]);}
  function updScNom(si,v){setSeances(p=>p.map((s,i)=>i===si?{...s,nom:v}:s));}
  function addEx(si){setSeances(p=>p.map((s,i)=>i===si?{...s,exercices:[...s.exercices,{nom:"",series:4,reps:8,notes:""}]}:s));}
  function updEx(si,ei,f,v){setSeances(p=>p.map((s,i)=>i===si?{...s,exercices:s.exercices.map((e,j)=>j===ei?{...e,[f]:v}:e)}:s));}
  function delEx(si,ei){setSeances(p=>p.map((s,i)=>i===si?{...s,exercices:s.exercices.filter((_,j)=>j!==ei)}:s));}
  function toggle(id){setAssignes(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}

  return (
    <Modal onClose={onClose} title="Nouveau cycle" full>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><Lbl>Nom du cycle</Lbl><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex: Force Max — Cycle 3" className="inp"/></div>
        {seances.map((sc,si)=>(
          <div key={si} style={{padding:"14px",borderRadius:14,background:C.alt}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:800,color:C.green}}>SÉANCE {si+1}</div>
              {seances.length>1&&<button onClick={()=>setSeances(p=>p.filter((_,i)=>i!==si))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:13}}>✕ Supprimer</button>}
            </div>
            <input value={sc.nom} onChange={e=>updScNom(si,e.target.value)} placeholder="Nom (ex: Jour A, Bas du corps...)" className="inp" style={{marginBottom:10,background:C.surface}}/>
            {sc.exercices.map((e,ei)=>(
              <div key={ei} style={{padding:"10px",borderRadius:10,background:C.surface,marginBottom:6}}>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <input value={e.nom} onChange={ev=>updEx(si,ei,"nom",ev.target.value)} placeholder="Exercice" className="inp" style={{flex:1}}/>
                  <button onClick={()=>delEx(si,ei)} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:16,flexShrink:0}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {[["series","Séries"],["reps","Reps"],["notes","Notes"]].map(([f,ph])=>(
                    <input key={f} value={e[f]} onChange={ev=>updEx(si,ei,f,ev.target.value)} placeholder={ph} className="inp" style={{textAlign:"center",padding:"8px 4px",fontSize:12}}/>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={()=>addEx(si)} style={{width:"100%",padding:"8px",borderRadius:8,border:`1.5px dashed ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>+ Exercice</button>
          </div>
        ))}
        <button onClick={addSc} style={{width:"100%",padding:"12px",borderRadius:12,border:`2px dashed ${C.green}`,background:C.greenLight,color:C.green,cursor:"pointer",fontSize:13,fontWeight:700}}>+ Ajouter une séance au cycle</button>
        <div>
          <Lbl>Assigner à (optionnel)</Lbl>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {athletesList.map(a=><button key={a.id} onClick={()=>toggle(a.id)} style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${assignes.includes(a.id)?C.green:C.border}`,background:assignes.includes(a.id)?C.greenLight:C.surface,color:assignes.includes(a.id)?C.green:C.muted,fontSize:13,fontWeight:assignes.includes(a.id)?700:400,cursor:"pointer"}}>{a.prenom} {a.nom[0]}.</button>)}
          </div>
        </div>
        <button className="btn-primary" onClick={()=>onAdd({nom,seances,assignes,createdAt:Date.now()})}>Créer le cycle</button>
      </div>
    </Modal>
  );
}

function AddComp({onClose,onAdd}) {
  const [nom,setNom]=useState("");const [date,setDate]=useState("");const [lieu,setLieu]=useState("");const [niveau,setNiveau]=useState("Régional");
  return (
    <Modal onClose={onClose} title="Nouvelle compétition">
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><Lbl>Nom</Lbl><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Nom de la compétition" className="inp"/></div>
        <div><Lbl>Date</Lbl><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="inp"/></div>
        <div><Lbl>Lieu</Lbl><input value={lieu} onChange={e=>setLieu(e.target.value)} placeholder="Ville / lieu" className="inp"/></div>
        <div><Lbl>Niveau</Lbl><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{NIVEAUX.map(n=><button key={n} onClick={()=>setNiveau(n)} className={`chip ${niveau===n?"chip-on":"chip-off"}`}>{n}</button>)}</div></div>
        <button className="btn-primary" onClick={()=>onAdd({nom,date,lieu,niveau,inscriptions:{}})}>Ajouter</button>
      </div>
    </Modal>
  );
}

function ProfileModal({user,onClose,onSave,onLogout}) {
  const [prenom,setPrenom]=useState(user.prenom||"");const [nom,setNom]=useState(user.nom||"");
  const [sexe,setSexe]=useState(user.sexe||"");const [groupe,setGroupe]=useState(user.groupe||"");
  const [photo,setPhoto]=useState(user.photo||"");const [records,setRecords]=useState(user.records||{});

  const recKeys=sexe==="Femme"?["Pentathlon","Heptathlon"]:["Pentathlon","Décathlon"];
  function handlePhoto(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}

  return (
    <Modal onClose={onClose} title="Mon profil" full>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24,gap:10}}>
        <div style={{position:"relative"}}>
          <Avatar nom={nom} prenom={prenom} photo={photo} size={80}/>
          <label style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:C.green,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#fff"}}>
            +<input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
          </label>
        </div>
        <div style={{fontSize:12,color:C.muted,fontWeight:300}}>Licence : {user.licence}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><Lbl>Prénom</Lbl><input value={prenom} onChange={e=>setPrenom(e.target.value)} className="inp"/></div>
          <div><Lbl>Nom</Lbl><input value={nom} onChange={e=>setNom(e.target.value)} className="inp"/></div>
        </div>
        <div><Lbl>Sexe</Lbl><div style={{display:"flex",gap:8}}>{["Homme","Femme"].map(s=><button key={s} onClick={()=>setSexe(s)} className={`chip ${sexe===s?"chip-on":"chip-off"}`} style={{flex:1,justifyContent:"center"}}>{s}</button>)}</div></div>
        {user.role!=="coach"&&<div><Lbl>Groupe</Lbl><div style={{display:"flex",gap:8}}>{GROUPES.map(g=><button key={g} onClick={()=>setGroupe(g)} className={`chip ${groupe===g?"chip-on":"chip-off"}`} style={{flex:1,justifyContent:"center"}}>{g}</button>)}</div></div>}
        <div>
          <Lbl>Records</Lbl>
          {recKeys.map(k=>(
            <div key={k} style={{marginBottom:8}}>
              <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:4}}>{k}</div>
              <input value={records[k]||""} onChange={e=>setRecords(p=>({...p,[k]:e.target.value}))} placeholder={`Record ${k}`} className="inp"/>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={()=>onSave({prenom,nom,sexe,groupe,photo,records})}>Sauvegarder</button>
        <button onClick={onLogout} className="btn-ghost" style={{width:"100%"}}>Se déconnecter</button>
      </div>
    </Modal>
  );
}
