import {
  CLASSIC_EXERCISE_IDS,
  EXERCISE_BY_ID,
  WORK_MIN, WORK_MAX,
  REST_MIN, REST_MAX,
} from "./exercises.js";

const STORAGE_KEY = "7min.workouts.v2";
const LAST_USED_KEY = "7min.workouts.lastUsed";

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
  return next;
}

export function deleteWorkout(id) {
  if (isProtectedWorkout(id)) return false;
  const workouts = load().filter((w) => w.id !== id);
  persist(workouts);
  return true;
}

export function setLastUsedWorkoutId(id) {
  try { localStorage.setItem(LAST_USED_KEY, id); } catch (_) {}
}

export function getLastUsedWorkoutId() {
  try { return localStorage.getItem(LAST_USED_KEY); } catch (_) { return null; }
}
