import {
  CLASSIC_EXERCISE_IDS,
  EXERCISE_BY_ID,
  WORK_MIN, WORK_MAX,
  REST_MIN, REST_MAX,
} from "./exercises.js";

const STORAGE_KEY = "7min.workouts.v2";
const LAST_USED_KEY = "7min.workouts.lastUsed";

// Optionale Firestore-Sync-Funktionen – werden von app.js nach dem Login gesetzt.
const _db = {
  saveWorkout:      null, // (workout) => Promise
  removeWorkout:    null, // (id)      => Promise
  saveHistoryEntry: null, // (entry)   => Promise
  clearAllHistory:  null, // ()        => Promise
};

export function setDbSync(fns) {
  Object.assign(_db, fns);
}

export const CLASSIC_WORKOUT_ID = "classic";

function makeClassicWorkout() {
  return {
    id: CLASSIC_WORKOUT_ID,
    name: "Klassisches 7-Minute-Workout",
    exercises: CLASSIC_EXERCISE_IDS.map((id) => ({ exerciseId: id })),
  };
}

function sanitizeSeconds(value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const v = Math.round(value);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function sanitizeEntry(e) {
  if (!e || typeof e.exerciseId !== "string" || !EXERCISE_BY_ID[e.exerciseId]) return null;
  const out = { exerciseId: e.exerciseId };
  const w = sanitizeSeconds(e.workSeconds, WORK_MIN, WORK_MAX);
  if (w !== undefined) out.workSeconds = w;
  const r = sanitizeSeconds(e.restSeconds, REST_MIN, REST_MAX);
  if (r !== undefined) out.restSeconds = r;
  return out;
}

function sanitizeWorkout(w) {
  if (!w || typeof w.id !== "string" || typeof w.name !== "string" || !Array.isArray(w.exercises)) {
    return null;
  }
  return {
    id: w.id,
    name: w.name,
    exercises: w.exercises.map(sanitizeEntry).filter(Boolean),
  };
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  let workouts = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        workouts = parsed.map(sanitizeWorkout).filter(Boolean);
      }
    } catch (_) {}
  }
  if (!workouts || workouts.length === 0) {
    workouts = [makeClassicWorkout()];
    persist(workouts);
    return workouts;
  }
  const classicIdx = workouts.findIndex((w) => w.id === CLASSIC_WORKOUT_ID);
  if (classicIdx < 0) {
    workouts.unshift(makeClassicWorkout());
    persist(workouts);
  } else {
    const canonical = makeClassicWorkout();
    if (workouts[classicIdx].name !== canonical.name) {
      workouts[classicIdx] = { ...workouts[classicIdx], name: canonical.name };
      persist(workouts);
    }
  }
  return workouts;
}

function persist(workouts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts)); } catch (_) {}
}

export function listWorkouts() {
  return load();
}

export function getWorkout(id) {
  return load().find((w) => w.id === id) || null;
}

export function isProtectedWorkout(id) {
  return id === CLASSIC_WORKOUT_ID;
}

export function isNameTaken(name, excludeId) {
  const normalized = name.trim().toLowerCase();
  return load().some((w) => w.id !== excludeId && w.name.trim().toLowerCase() === normalized);
}

function genId() {
  return "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

export function createWorkout(name = "Neues Training", exercises = []) {
  const workouts = load();
  const w = {
    id: genId(),
    name,
    exercises: exercises.map(sanitizeEntry).filter(Boolean),
  };
  workouts.push(w);
  persist(workouts);
  _db.saveWorkout?.(w)?.catch?.(() => {});
  return w;
}

export function updateWorkout(id, patch) {
  const workouts = load();
  const idx = workouts.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  const target = workouts[idx];
  const next = { ...target };
  if (typeof patch.name === "string" && !isProtectedWorkout(id)) {
    next.name = patch.name;
  }
  if (Array.isArray(patch.exercises)) {
    next.exercises = patch.exercises.map(sanitizeEntry).filter(Boolean);
  }
  workouts[idx] = next;
  persist(workouts);
  _db.saveWorkout?.(next)?.catch?.(() => {});
  return next;
}

export function deleteWorkout(id) {
  if (isProtectedWorkout(id)) return false;
  const workouts = load().filter((w) => w.id !== id);
  persist(workouts);
  _db.removeWorkout?.(id)?.catch?.(() => {});
  return true;
}

export function setLastUsedWorkoutId(id) {
  try { localStorage.setItem(LAST_USED_KEY, id); } catch (_) {}
}

export function getLastUsedWorkoutId() {
  try { return localStorage.getItem(LAST_USED_KEY); } catch (_) { return null; }
}

// --- Training history ---

const HISTORY_KEY = "7min.history";

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function logCompletion({ workoutId, workoutName, exerciseCount, totalSeconds }) {
  const history = loadHistory();
  const entry = { date: localDateStr(), workoutId, workoutName, exerciseCount, totalSeconds };
  history.unshift(entry);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (_) {}
  _db.saveHistoryEntry?.(entry)?.catch?.(() => {});
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch (_) {}
  _db.clearAllHistory?.()?.catch?.(() => {});
}

// Ersetzt den gesamten localStorage-Workoutbestand durch Firestore-Daten.
export function importWorkouts(workouts) {
  const sanitized = workouts.map(sanitizeWorkout).filter(Boolean);
  if (sanitized.length === 0) return;
  if (!sanitized.find(w => w.id === CLASSIC_WORKOUT_ID)) {
    sanitized.unshift(makeClassicWorkout());
  }
  persist(sanitized);
}

// Ersetzt den History-Cache durch Firestore-Daten.
export function importHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (_) {}
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

// Löscht alle lokalen Nutzerdaten (beim Abmelden aufrufen, bevor ein anderer User einloggt).
export function clearLocalData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  try { localStorage.removeItem(LAST_USED_KEY); } catch (_) {}
  try { localStorage.removeItem(HISTORY_KEY); } catch (_) {}
}

export function getStats() {
  const history = loadHistory();
  if (history.length === 0) return null;

  const totalSessions = history.length;
  const totalSeconds = history.reduce((s, e) => s + (e.totalSeconds || 0), 0);
  const totalMins = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const totalTimeStr = hours > 0 ? `${hours} Std ${mins} Min` : `${mins} Min`;
  const totalExercises = history.reduce((s, e) => s + (e.exerciseCount || 0), 0);

  // Current streak: count consecutive days backwards from today
  const dates = new Set(history.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  while (dates.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Favorite: workout with most completions
  const counts = {};
  for (const e of history) {
    counts[e.workoutName] = (counts[e.workoutName] || 0) + 1;
  }
  const favoriteName = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return { totalSessions, totalTimeStr, totalExercises, streak, favoriteName };
}
