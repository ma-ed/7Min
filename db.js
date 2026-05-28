// Firestore-Wrapper — alle Firebase-Imports sind dynamisch,
// damit die App offline weiterläuft wenn das CDN nicht erreichbar ist.

import { firebaseConfig } from "./firebase-config.js";

let _app = null;
let _db  = null;
let _uid = null;
let _fsModule = null;

// Gibt true zurück wenn der Nutzer seine Firebase-Config eingetragen hat.
export function isConfigured() {
  return !!(firebaseConfig.projectId && firebaseConfig.projectId !== "DEIN_PROJECT_ID");
}

async function getApp() {
  if (_app) return _app;
  const { initializeApp, getApps } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"
  );
  const apps = getApps();
  _app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  return _app;
}

async function getFirestore() {
  if (_db) return _db;
  const app = await getApp();
  const { getFirestore: gfs } = await import(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
  );
  _db = gfs(app);
  return _db;
}

// Modul-Cache: importiert das Firestore-SDK nur einmal
async function fs() {
  if (!_fsModule) {
    _fsModule = await import(
      "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
    );
  }
  return _fsModule;
}

// Muss nach dem Login aufgerufen werden.
export function initDb(uid) {
  _uid = uid;
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export async function fetchAllWorkouts() {
  if (!_uid) return [];
  try {
    const store = await getFirestore();
    const { collection, getDocs } = await fs();
    const snap = await getDocs(collection(store, "users", _uid, "workouts"));
    return snap.docs.map(d => d.data());
  } catch (_) { return []; }
}

export async function saveWorkout(workout) {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, setDoc } = await fs();
    await setDoc(doc(store, "users", _uid, "workouts", workout.id), workout);
  } catch (_) {}
}

export async function removeWorkout(id) {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, deleteDoc } = await fs();
    await deleteDoc(doc(store, "users", _uid, "workouts", id));
  } catch (_) {}
}

// ─── Verlauf (History) ───────────────────────────────────────────────────────

export async function fetchHistory() {
  if (!_uid) return [];
  try {
    const store = await getFirestore();
    const { collection, getDocs } = await fs();
    const snap = await getDocs(collection(store, "users", _uid, "history"));
    return snap.docs
      .map(d => d.data())
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch (_) { return []; }
}

export async function saveHistoryEntry(entry) {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, setDoc } = await fs();
    const id = entry._id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    await setDoc(doc(store, "users", _uid, "history", id), { ...entry, _id: id });
  } catch (_) {}
}

export async function clearAllHistory() {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { collection, getDocs, deleteDoc } = await fs();
    const snap = await getDocs(collection(store, "users", _uid, "history"));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  } catch (_) {}
}

// ─── Profil ──────────────────────────────────────────────────────────────────

// Speichert das Profil des eingeloggten Nutzers und einen Username-Lookup-Eintrag.
export async function saveProfile(username) {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, setDoc } = await fs();
    await Promise.all([
      setDoc(doc(store, "users", _uid), { displayName: username, uid: _uid }, { merge: true }),
      setDoc(doc(store, "usernames", username.toLowerCase()), { uid: _uid, displayName: username }),
    ]);
  } catch (_) {}
}

// Sucht einen Nutzer anhand seines Usernamens (case-insensitive).
export async function findUserByUsername(username) {
  try {
    const store = await getFirestore();
    const { doc, getDoc } = await fs();
    const snap = await getDoc(doc(store, "usernames", username.toLowerCase()));
    return snap.exists() ? snap.data() : null;
  } catch (_) { return null; }
}

// ─── Posteingang (Inbox) ─────────────────────────────────────────────────────

// Abonniert den Posteingang und ruft callback(items) bei jeder Änderung auf.
// Gibt eine unsubscribe-Funktion zurück.
export function subscribeInbox(callback) {
  if (!_uid) { callback([]); return () => {}; }
  let unsubFn = () => {};
  Promise.all([getFirestore(), fs()])
    .then(([store, { collection, onSnapshot }]) => {
      unsubFn = onSnapshot(
        collection(store, "users", _uid, "inbox"),
        snap => {
          const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => !d.read)
            .sort((a, b) => (b.sentAt?.seconds || 0) - (a.sentAt?.seconds || 0));
          callback(items);
        },
        () => callback([])
      );
    })
    .catch(() => callback([]));
  return () => unsubFn();
}

export async function markInboxRead(msgId) {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, setDoc } = await fs();
    await setDoc(doc(store, "users", _uid, "inbox", msgId), { read: true }, { merge: true });
  } catch (_) {}
}

// ─── Push-Abonnements ────────────────────────────────────────────────────────

export async function savePushSubscription(subscription) {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, setDoc } = await fs();
    await setDoc(doc(store, "users", _uid), { pushSubscription: subscription.toJSON() }, { merge: true });
  } catch (_) {}
}

export async function removePushSubscription() {
  if (!_uid) return;
  try {
    const store = await getFirestore();
    const { doc, updateDoc, deleteField } = await fs();
    await updateDoc(doc(store, "users", _uid), { pushSubscription: deleteField() });
  } catch (_) {}
}

// Schickt einen Erfolg an den Posteingang eines anderen Nutzers.
export async function sendAchievement(targetUid, { fromName, workoutName }) {
  try {
    const store = await getFirestore();
    const { doc, setDoc, serverTimestamp } = await fs();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await setDoc(doc(store, "users", targetUid, "inbox", id), {
      type: "achievement",
      from: _uid,
      fromName,
      workoutName,
      sentAt: serverTimestamp(),
      read: false,
    });
  } catch (_) {}
}

// Schickt einen Workout-Snapshot an den Posteingang eines anderen Nutzers.
// `workout` enthält {name, exercises} – die ID wird absichtlich NICHT übertragen,
// damit der Empfänger beim Annehmen eine frische lokale ID erhält.
export async function sendWorkoutShare(targetUid, { fromName, workout }) {
  const store = await getFirestore();
  const { doc, setDoc, serverTimestamp } = await fs();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await setDoc(doc(store, "users", targetUid, "inbox", id), {
    type: "workout-share",
    from: _uid,
    fromName,
    workout: {
      name: workout.name,
      exercises: workout.exercises,
    },
    sentAt: serverTimestamp(),
    read: false,
  });
}

export function getUid() {
  return _uid;
}
