import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, update, remove, query, orderByKey, orderByChild, startAt, endAt, onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNOOPClvGZAxouTnki9bPe6zsL7sNClT0",
  authDomain: "trackboard-57c6e.firebaseapp.com",
  databaseURL: "https://trackboard-57c6e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "trackboard-57c6e",
  storageBucket: "trackboard-57c6e.firebasestorage.app",
  messagingSenderId: "1080561819756",
  appId: "1:1080561819756:web:81798570a6c8d602f17849"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Ecoute une collection element par element : une modification ne fait
// transiter que l'element concerne, pas toute la collection.
function subscribeCollection(target, cb) {
  const store = {};
  let pending = null;
  const emit = () => {
    if (pending) return;
    pending = setTimeout(() => { pending = null; cb({ ...store }); }, 0);
  };
  const unsubs = [
    onChildAdded(target, s => { store[s.key] = s.val(); emit(); }),
    onChildChanged(target, s => { store[s.key] = s.val(); emit(); }),
    onChildRemoved(target, s => { delete store[s.key]; emit(); })
  ];
  // Garantit un premier rendu meme si la collection est vide
  onValue(target, () => emit(), { onlyOnce: true });
  return () => {
    if (pending) clearTimeout(pending);
    unsubs.forEach(u => u && u());
  };
}

export const getUsers = (cb) => onValue(ref(db, "users"), s => cb(s.val() || {}));
export const saveUser = (id, data) => set(ref(db, `users/${id}`), data);

// Fenetre glissante : on n'ecoute que les seances des 6 derniers mois
// et toutes les seances futures. Empeche le volume de croitre sans fin.
const SEANCES_WEEKS_BACK = 26;
function seancesWindowStart() {
  const d = new Date();
  d.setDate(d.getDate() - SEANCES_WEEKS_BACK * 7);
  return d.toISOString().slice(0, 10);
}

export const getSeances = (cb) => subscribeCollection(
  query(ref(db, "seances"), orderByChild("dateISO"), startAt(seancesWindowStart())),
  cb
);
export const addSeance = (data) => push(ref(db, "seances"), data);
export const updateSeance = (id, data) => update(ref(db, `seances/${id}`), data);
export const deleteSeance = (id) => remove(ref(db, `seances/${id}`));
export const setPresence = (seanceId, userId, status) =>
  status === null
    ? remove(ref(db, `seances/${seanceId}/presences/${userId}`))
    : set(ref(db, `seances/${seanceId}/presences/${userId}`), status);

export const getLogs = (cb) => subscribeCollection(ref(db, "logs"), cb);
// Ne telecharge que les bilans d'un seul athlete (cles "athleteId_seanceId")
export const getLogsForUser = (uid, cb) => subscribeCollection(
  query(ref(db, "logs"), orderByKey(), startAt(`${uid}_`), endAt(`${uid}_\uf8ff`)),
  cb
);
export const saveLog = (seanceId, athleteId, data) =>
  set(ref(db, `logs/${athleteId}_${seanceId}`), { ...data, seanceId, athleteId, ts: Date.now() });

export const getComps = (cb) => subscribeCollection(ref(db, "comps"), cb);
export const addComp = (data) => push(ref(db, "comps"), data);
export const updateComp = (id, data) => update(ref(db, `comps/${id}`), data);
export const deleteComp = (id) => remove(ref(db, `comps/${id}`));

export const getCycles = (cb) => subscribeCollection(ref(db, "cycles"), cb);
export const addCycle = (data) => push(ref(db, "cycles"), data);
export const updateCycle = (id, data) => update(ref(db, `cycles/${id}`), data);
export const deleteCycle = (id) => remove(ref(db, `cycles/${id}`));
