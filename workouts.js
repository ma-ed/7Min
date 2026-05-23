import { CLASSIC_EXERCISE_IDS, EXERCISE_BY_ID } from "./exercises.js";

const STORAGE_KEY = "7min.workouts.v1";
const LAST_USED_KEY = "7min.workouts.lastUsed";

export const CLASSIC_WORKOUT_ID = "classic";

function makeClassicWorkout() {
  return {
    id: CLASSIC_WORKOUT_ID,
    name: "Klassisches Training",
    exerciseIds: [...CLASSIC_EXERCISE_IDS],
  };
}

function isValidWorkout(w) {
  return w && typeof w.id === "string" && typeof w.name === "string" && Array.isArray(w.exerciseIds);
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  let workouts = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isValidWorkout)) workouts = parsed;
    } catch (_) {}
  }
  if (!workouts || workouts.length === 0) {
    workouts = [makeClassicWorkout()];
    persist(workouts);
    return workouts;
  }
  // Ensure classic always present
  if (!workouts.some((w) => w.id === CLASSIC_WORKOUT_ID)) {
    workouts.unshift(makeClassicWorkout());
    persist(workouts);
  }
  // Filter unknown exercise ids defensively
  for (const w of workouts) {
    w.exerciseIds = w.exerciseIds.filter((id) => EXERCISE_BY_ID[id]);
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

function genId() {
  return "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

export function createWorkout(name = "Neues Training", exerciseIds = []) {
  const workouts = load();
  const w = { id: genId(), name, exerciseIds: [...exerciseIds] };
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
  if (Array.isArray(patch.exerciseIds)) {
    next.exerciseIds = patch.exerciseIds.filter((eid) => EXERCISE_BY_ID[eid]);
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
