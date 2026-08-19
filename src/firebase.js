import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, update, remove } from "firebase/database";

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

export const getUsers = (cb) => onValue(ref(db, "users"), s => cb(s.val() || {}));
export const saveUser = (id, data) => set(ref(db, `users/${id}`), data);

export const getSeances = (cb) => onValue(ref(db, "seances"), s => cb(s.val() || {}));
export const addSeance = (data) => push(ref(db, "seances"), data);
export const updateSeance = (id, data) => update(ref(db, `seances/${id}`), data);
export const deleteSeance = (id) => remove(ref(db, `seances/${id}`));
export const setPresence = (seanceId, userId, status) =>
  status === null
    ? remove(ref(db, `seances/${seanceId}/presences/${userId}`))
    : set(ref(db, `seances/${seanceId}/presences/${userId}`), status);

export const getLogs = (cb) => onValue(ref(db, "logs"), s => cb(s.val() || {}));
export const saveLog = (seanceId, athleteId, data) =>
  set(ref(db, `logs/${athleteId}_${seanceId}`), { ...data, seanceId, athleteId, ts: Date.now() });

export const getComps = (cb) => onValue(ref(db, "comps"), s => cb(s.val() || {}));
export const addComp = (data) => push(ref(db, "comps"), data);
export const updateComp = (id, data) => update(ref(db, `comps/${id}`), data);
export const deleteComp = (id) => remove(ref(db, `comps/${id}`));

export const getCycles = (cb) => onValue(ref(db, "cycles"), s => cb(s.val() || {}));
export const addCycle = (data) => push(ref(db, "cycles"), data);
export const updateCycle = (id, data) => update(ref(db, `cycles/${id}`), data);
export const deleteCycle = (id) => remove(ref(db, `cycles/${id}`));
