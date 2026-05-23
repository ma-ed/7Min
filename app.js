import { EXERCISES, EXERCISE_BY_ID, PREPARE_SECONDS, WORK_SECONDS, REST_SECONDS } from "./exercises.js";
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  isProtectedWorkout,
  setLastUsedWorkoutId,
  getLastUsedWorkoutId,
} from "./workouts.js";

const VERSION = "v10.5";

document.getElementById("version-label").textContent = VERSION;

// --- Theme ---
const THEME_KEY = "7min.theme";
const THEME_CYCLE = ["auto", "light", "dark"];

const THEME_ICONS = {
  auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`,
  light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  dark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

const THEME_LABELS = { auto: "Systemdesign", light: "Hellmodus", dark: "Dunkelmodus" };
const metaThemeColor = document.getElementById("meta-theme-color");
const btnTheme = document.getElementById("btn-theme");

function getTheme() {
  return localStorage.getItem(THEME_KEY) || "auto";
}

function applyTheme(t) {
  if (t === "auto") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(THEME_KEY);
  } else {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
  }
  const isDark =
    t === "dark" ||
    (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  metaThemeColor.content = isDark ? "#0f172a" : "#f0f4f8";
  btnTheme.innerHTML = THEME_ICONS[t];
  btnTheme.title = THEME_LABELS[t];
  btnTheme.setAttribute("aria-label", THEME_LABELS[t]);
}

btnTheme.addEventListener("click", () => {
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(getTheme()) + 1) % THEME_CYCLE.length];
  applyTheme(next);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (getTheme() === "auto") applyTheme("auto");
});

applyTheme(getTheme());

const els = {
  // views
  viewList: document.getElementById("view-list"),
  viewEdit: document.getElementById("view-edit"),
  viewPicker: document.getElementById("view-picker"),
  viewSession: document.getElementById("view-session"),
  viewFinished: document.getElementById("view-finished"),
  // list
  workoutList: document.getElementById("workout-list"),
  btnNewWorkout: document.getElementById("btn-new-workout"),
  // editor
  btnEditBack: document.getElementById("btn-edit-back"),
  editName: document.getElementById("edit-name"),
  editLockedHint: document.getElementById("edit-locked-hint"),
  editList: document.getElementById("edit-exercise-list"),
  editEmpty: document.getElementById("edit-empty"),
  btnAddExercise: document.getElementById("btn-add-exercise"),
  btnDeleteWorkout: document.getElementById("btn-delete-workout"),
  // picker
  btnPickerBack: document.getElementById("btn-picker-back"),
  pickerSearch: document.getElementById("picker-search"),
  pickerList: document.getElementById("picker-list"),
  btnPickerAdd: document.getElementById("btn-picker-add"),
  // session
  btnPause: document.getElementById("btn-pause"),
  btnResume: document.getElementById("btn-resume"),
  btnStop: document.getElementById("btn-stop"),
  btnRestart: document.getElementById("btn-restart"),
  btnBackToList: document.getElementById("btn-back-to-list"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  btnMute: document.getElementById("btn-mute"),
  progress: document.getElementById("progress"),
  phaseLabel: document.getElementById("phase-label"),
  nextLabel: document.getElementById("next-label"),
  exerciseSvg: document.getElementById("exercise-svg"),
  exerciseName: document.getElementById("exercise-name"),
  timer: document.getElementById("timer"),
};

// --- Audio ---
let audioCtx = null;
let muted = false;
let iosSessionUnlocked = false;

function buildSilentWav() {
  const buf = new ArrayBuffer(46);
  const v = new DataView(buf);
  v.setUint32( 0, 0x52494646, false);
  v.setUint32( 4, 38,         true);
  v.setUint32( 8, 0x57415645, false);
  v.setUint32(12, 0x666d7420, false);
  v.setUint32(16, 16,         true);
  v.setUint16(20, 1,          true);
  v.setUint16(22, 1,          true);
  v.setUint32(24, 44100,      true);
  v.setUint32(28, 88200,      true);
  v.setUint16(32, 2,          true);
  v.setUint16(34, 16,         true);
  v.setUint32(36, 0x64617461, false);
  v.setUint32(40, 2,          true);
  v.setInt16( 44, 0,          true);
  return new Blob([buf], { type: "audio/wav" });
}

async function unlockIOSAudioSession() {
  if (iosSessionUnlocked) return;
  const url = URL.createObjectURL(buildSilentWav());
  const a = new Audio(url);
  a.volume = 0.001;
  try {
    await a.play();
    iosSessionUnlocked = true; // only on success — a failed play (no user gesture) leaves the flag false so the next touch retries
  } catch (_) {}
  URL.revokeObjectURL(url);
}

async function ensureAudio() {
  await unlockIOSAudioSession();
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
      // When iOS suspends or interrupts the context (phone call, background, etc.),
      // reset the unlock flag so the next user touch replays the silent WAV to re-establish the session.
      audioCtx.addEventListener("statechange", () => {
        if (audioCtx.state !== "running") iosSessionUnlocked = false;
      });
    }
  }
  if (audioCtx && audioCtx.state !== "running") {
    try { await audioCtx.resume(); } catch (_) {}
  }
}

// Full ensureAudio (not just resume) so the WAV re-unlock runs if the session was interrupted.
document.addEventListener("touchstart", () => { ensureAudio().catch(() => {}); }, { passive: true });

function beep(frequency, durationMs, when = 0, gain = 0.25) {
  if (!audioCtx || audioCtx.state !== "running" || muted) return;
  const t0 = audioCtx.currentTime + when;
  const t1 = t0 + durationMs / 1000;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.setValueAtTime(gain, t1 - 0.02);
  g.gain.linearRampToValueAtTime(0, t1);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

async function countdownBeep() {
  await ensureAudio();
  beep(880, 150);
}

async function halfTimeBeep() {
  await ensureAudio();
  beep(660, 120, 0, 0.2);
  beep(660, 120, 0.2, 0.2);
}

async function successFanfare() {
  await ensureAudio();
  beep(523.25, 180, 0);
  beep(659.25, 180, 0.2);
  beep(783.99, 180, 0.4);
  beep(1046.5, 380, 0.6, 0.3);
}

function speak(text) {
  if (!("speechSynthesis" in window) || muted) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "de-DE";
  utt.rate = 0.95;
  window.speechSynthesis.speak(utt);
}

// --- Screen Wake Lock ---
let wakeLock = null;
async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch (_) {}
}
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.status === "running") {
    ensureAudio();
    if (!wakeLock) requestWakeLock();
  }
});

// --- View routing ---
const ALL_VIEWS = [els.viewList, els.viewEdit, els.viewPicker, els.viewSession, els.viewFinished];
function show(view) {
  for (const v of ALL_VIEWS) v.classList.add("hidden");
  view.classList.remove("hidden");
}

// --- Workout list view ---
function renderWorkoutList() {
  const workouts = listWorkouts();
  els.workoutList.innerHTML = "";
  for (const w of workouts) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "workout-card";
    card.innerHTML = `
      <div class="workout-card-main">
        <div class="workout-card-name"></div>
        <div class="workout-card-sub"></div>
      </div>
      <span class="workout-card-edit" role="button" aria-label="Bearbeiten" title="Bearbeiten">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 4l6 6L8 22H2v-6L14 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    `;
    card.querySelector(".workout-card-name").textContent = w.name;
    const count = w.exerciseIds.length;
    const totalSec = count > 0 ? PREPARE_SECONDS + count * WORK_SECONDS + Math.max(0, count - 1) * REST_SECONDS : 0;
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    const durationLabel = count > 0 ? ` · ${mm}:${String(ss).padStart(2, "0")} min` : "";
    card.querySelector(".workout-card-sub").textContent = `${count} Übung${count === 1 ? "" : "en"}${durationLabel}`;

    const editEl = card.querySelector(".workout-card-edit");
    editEl.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openEditor(w.id);
    });
    card.addEventListener("click", () => {
      if (count === 0) {
        openEditor(w.id);
        return;
      }
      startWorkout(w.id);
    });
    els.workoutList.appendChild(card);
  }
}

// --- Editor state ---
const editor = {
  workoutId: null,
  name: "",
  exerciseIds: [],
};

function openEditor(workoutId) {
  const w = getWorkout(workoutId);
  if (!w) return;
  editor.workoutId = w.id;
  editor.name = w.name;
  editor.exerciseIds = [...w.exerciseIds];
  const locked = isProtectedWorkout(w.id);
  els.editName.value = w.name;
  els.editName.disabled = locked;
  els.editLockedHint.classList.toggle("hidden", !locked);
  els.btnDeleteWorkout.classList.toggle("hidden", locked);
  renderEditList();
  show(els.viewEdit);
}

function persistEditorState() {
  updateWorkout(editor.workoutId, {
    name: editor.name,
    exerciseIds: editor.exerciseIds,
  });
}

// "yes" | "no" | "pending" — memoized so we don't re-probe 404s on every render.
const exerciseImageStatus = new Map();

function exerciseImageUrl(id) {
  return `exercises/${id}.png`;
}

function makeExerciseImg(ex) {
  const img = document.createElement("img");
  img.className = "exercise-img";
  img.src = exerciseImageUrl(ex.id);
  img.alt = ex.name;
  return img;
}

function renderExerciseFigure(container, ex) {
  const status = exerciseImageStatus.get(ex.id);
  if (status === "no") {
    container.innerHTML = ex.svg;
    return;
  }
  if (status === "yes") {
    container.innerHTML = "";
    container.appendChild(makeExerciseImg(ex));
    return;
  }
  // "pending" or unknown: show <img> directly so the PNG appears without an SVG flash.
  // Fall back to SVG only if the image fails to load.
  const img = makeExerciseImg(ex);
  img.onerror = () => {
    exerciseImageStatus.set(ex.id, "no");
    container.innerHTML = ex.svg;
  };
  img.onload = () => exerciseImageStatus.set(ex.id, "yes");
  container.innerHTML = "";
  container.appendChild(img);
  if (!status) exerciseImageStatus.set(ex.id, "pending");
}

function preloadExerciseImages() {
  for (const ex of EXERCISES) {
    if (exerciseImageStatus.has(ex.id)) continue;
    exerciseImageStatus.set(ex.id, "pending");
    const img = new Image();
    img.onload = () => exerciseImageStatus.set(ex.id, "yes");
    img.onerror = () => exerciseImageStatus.set(ex.id, "no");
    img.src = exerciseImageUrl(ex.id);
  }
}

function renderEditList() {
  els.editList.innerHTML = "";
  els.editEmpty.classList.toggle("hidden", editor.exerciseIds.length > 0);
  editor.exerciseIds.forEach((exId, index) => {
    const ex = EXERCISE_BY_ID[exId];
    if (!ex) return;
    const item = document.createElement("div");
    item.className = "edit-item";
    item.dataset.index = String(index);
    item.innerHTML = `
      <span class="drag-handle" aria-label="Verschieben" title="Verschieben">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </span>
      <div class="edit-item-svg"></div>
      <div class="edit-item-name"></div>
      <button class="btn-remove" type="button" aria-label="Entfernen" title="Entfernen">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    renderExerciseFigure(item.querySelector(".edit-item-svg"), ex);
    item.querySelector(".edit-item-name").textContent = ex.name;
    item.querySelector(".btn-remove").addEventListener("click", () => {
      editor.exerciseIds.splice(index, 1);
      persistEditorState();
      renderEditList();
    });
    const handle = item.querySelector(".drag-handle");
    handle.addEventListener("pointerdown", (ev) => startDrag(ev, item, index));
    els.editList.appendChild(item);
  });
}

// --- Drag & drop reorder (pointer events) ---
let drag = null;

function startDrag(ev, item, index) {
  ev.preventDefault();
  const rect = item.getBoundingClientRect();
  const ghost = item.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.width = rect.width + "px";
  ghost.style.left = rect.left + "px";
  ghost.style.top = rect.top + "px";
  document.body.appendChild(ghost);
  item.classList.add("dragging");
  drag = {
    sourceIndex: index,
    currentIndex: index,
    item,
    ghost,
    pointerId: ev.pointerId,
    offsetY: ev.clientY - rect.top,
    offsetX: ev.clientX - rect.left,
  };
  try { ev.target.setPointerCapture(ev.pointerId); } catch (_) {}
  document.addEventListener("pointermove", onDragMove);
  document.addEventListener("pointerup", onDragEnd);
  document.addEventListener("pointercancel", onDragEnd);
}

function onDragMove(ev) {
  if (!drag) return;
  drag.ghost.style.left = (ev.clientX - drag.offsetX) + "px";
  drag.ghost.style.top = (ev.clientY - drag.offsetY) + "px";

  // Determine new index based on midpoint of each item except dragged
  const items = Array.from(els.editList.children).filter((el) => el !== drag.item);
  let newIndex = items.length;
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    if (ev.clientY < r.top + r.height / 2) {
      newIndex = i;
      break;
    }
  }
  if (newIndex !== drag.currentIndex) {
    drag.currentIndex = newIndex;
    // Re-insert dragged item at newIndex
    const parent = els.editList;
    parent.removeChild(drag.item);
    const ref = parent.children[newIndex] || null;
    parent.insertBefore(drag.item, ref);
  }
}

function onDragEnd() {
  if (!drag) return;
  document.removeEventListener("pointermove", onDragMove);
  document.removeEventListener("pointerup", onDragEnd);
  document.removeEventListener("pointercancel", onDragEnd);
  drag.ghost.remove();
  drag.item.classList.remove("dragging");

  if (drag.currentIndex !== drag.sourceIndex) {
    const [moved] = editor.exerciseIds.splice(drag.sourceIndex, 1);
    editor.exerciseIds.splice(drag.currentIndex, 0, moved);
    persistEditorState();
  }
  drag = null;
  renderEditList();
}

// --- Editor events ---
els.editName.addEventListener("input", () => {
  editor.name = els.editName.value;
});
els.editName.addEventListener("blur", () => {
  persistEditorState();
});
els.btnEditBack.addEventListener("click", () => {
  // Persist and ensure name not empty
  if (!editor.name.trim() && !isProtectedWorkout(editor.workoutId)) {
    editor.name = "Neues Training";
    els.editName.value = editor.name;
  }
  persistEditorState();
  goToList();
});
els.btnDeleteWorkout.addEventListener("click", () => {
  if (isProtectedWorkout(editor.workoutId)) return;
  if (!confirm(`Training „${editor.name}" wirklich löschen?`)) return;
  deleteWorkout(editor.workoutId);
  goToList();
});
els.btnAddExercise.addEventListener("click", () => openPicker());

// --- Picker state ---
const picker = {
  selected: new Set(),
  query: "",
};

function openPicker() {
  picker.selected.clear();
  picker.query = "";
  els.pickerSearch.value = "";
  renderPicker();
  show(els.viewPicker);
  updatePickerAddButton();
}

function renderPicker() {
  els.pickerList.innerHTML = "";
  const existing = new Set(editor.exerciseIds);
  const q = picker.query.trim().toLowerCase();
  const available = EXERCISES.filter((ex) => !existing.has(ex.id) && (q === "" || ex.name.toLowerCase().includes(q)));
  if (available.length === 0) {
    const empty = document.createElement("div");
    empty.className = "picker-empty";
    empty.textContent = existing.size >= EXERCISES.length
      ? "Alle Übungen sind bereits im Training."
      : "Keine Treffer.";
    els.pickerList.appendChild(empty);
    return;
  }
  for (const ex of available) {
    const item = document.createElement("div");
    item.className = "picker-item";
    if (picker.selected.has(ex.id)) item.classList.add("checked");
    item.innerHTML = `
      <div class="picker-item-svg"></div>
      <div class="picker-item-name"></div>
      <span class="picker-check">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    `;
    renderExerciseFigure(item.querySelector(".picker-item-svg"), ex);
    item.querySelector(".picker-item-name").textContent = ex.name;
    item.addEventListener("click", () => {
      if (picker.selected.has(ex.id)) picker.selected.delete(ex.id);
      else picker.selected.add(ex.id);
      item.classList.toggle("checked");
      updatePickerAddButton();
    });
    els.pickerList.appendChild(item);
  }
}

function updatePickerAddButton() {
  const n = picker.selected.size;
  els.btnPickerAdd.textContent = n === 0 ? "Hinzufügen" : `Hinzufügen (${n})`;
  els.btnPickerAdd.disabled = n === 0;
}

els.pickerSearch.addEventListener("input", () => {
  picker.query = els.pickerSearch.value;
  renderPicker();
});
els.btnPickerBack.addEventListener("click", () => show(els.viewEdit));
els.btnPickerAdd.addEventListener("click", () => {
  if (picker.selected.size === 0) return;
  // Preserve order of EXERCISES for added items (consistent ordering)
  const ordered = EXERCISES.map((e) => e.id).filter((id) => picker.selected.has(id));
  editor.exerciseIds.push(...ordered);
  persistEditorState();
  renderEditList();
  show(els.viewEdit);
});

function goToList() {
  renderWorkoutList();
  show(els.viewList);
}

// --- New workout button ---
els.btnNewWorkout.addEventListener("click", () => {
  const w = createWorkout("Neues Training", []);
  openEditor(w.id);
  // Pre-focus the name input on next tick
  setTimeout(() => {
    els.editName.focus();
    els.editName.select();
  }, 0);
});

// --- Session ---
function buildSchedule(exercises) {
  const phases = [];
  if (exercises.length === 0) return phases;
  phases.push({ kind: "prepare", duration: PREPARE_SECONDS, exerciseIndex: 0 });
  for (let i = 0; i < exercises.length; i++) {
    phases.push({ kind: "work", duration: WORK_SECONDS, exerciseIndex: i });
    if (i < exercises.length - 1) {
      phases.push({ kind: "rest", duration: REST_SECONDS, exerciseIndex: i + 1 });
    }
  }
  return phases;
}

const state = {
  status: "idle",
  exercises: [],
  schedule: [],
  phaseIndex: 0,
  phaseEndAt: 0,
  remainingMs: 0,
  lastSecondShown: -1,
  intervalId: 0,
  workoutId: null,
};

function setPhaseUI(phase) {
  const ex = state.exercises[phase.exerciseIndex];
  renderExerciseFigure(els.exerciseSvg, ex);
  els.exerciseName.textContent = ex.name;
  els.progress.textContent = `${Math.min(phase.exerciseIndex + 1, state.exercises.length)} / ${state.exercises.length}`;

  if (phase.kind === "prepare") {
    els.phaseLabel.textContent = "Bereitmachen";
    els.nextLabel.textContent = "Erste Übung:";
    els.timer.classList.remove("work", "warn");
    speak(`Erste Übung: ${ex.name}`);
  } else if (phase.kind === "work") {
    els.phaseLabel.textContent = "Übung";
    // NBSP placeholder keeps the line's height so the figure below doesn't jump.
    els.nextLabel.textContent = " ";
    els.timer.classList.add("work");
    els.timer.classList.remove("warn");
  } else if (phase.kind === "rest") {
    els.phaseLabel.textContent = "Pause";
    els.nextLabel.textContent = "Nächste Übung:";
    els.timer.classList.remove("work", "warn");
    speak(`Nächste Übung: ${ex.name}`);
  }
}

function startPhase(index) {
  state.phaseIndex = index;
  const phase = state.schedule[index];
  state.phaseEndAt = performance.now() + phase.duration * 1000;
  state.lastSecondShown = -1;
  setPhaseUI(phase);
  updateSkipButtons();
}

function currentExerciseIndex() {
  return state.schedule[state.phaseIndex]?.exerciseIndex ?? 0;
}

function findPhaseBeforeExercise(exerciseIndex) {
  if (exerciseIndex === 0) {
    return state.schedule.findIndex((p) => p.kind === "prepare");
  }
  return state.schedule.findIndex(
    (p) => p.kind === "rest" && p.exerciseIndex === exerciseIndex
  );
}

function jumpToExercise(targetExerciseIndex) {
  if (state.status !== "running" && state.status !== "paused") return;
  if (targetExerciseIndex >= state.exercises.length) {
    finish();
    return;
  }
  if (targetExerciseIndex < 0) return;
  const phaseIdx = findPhaseBeforeExercise(targetExerciseIndex);
  if (phaseIdx < 0) return;
  const phase = state.schedule[phaseIdx];
  state.phaseIndex = phaseIdx;
  state.lastSecondShown = -1;
  setPhaseUI(phase);
  if (state.status === "paused") {
    state.remainingMs = phase.duration * 1000;
    els.timer.textContent = String(phase.duration);
    els.phaseLabel.textContent = "Pausiert";
  } else {
    state.phaseEndAt = performance.now() + phase.duration * 1000;
    els.timer.textContent = String(phase.duration);
  }
  updateSkipButtons();
}

function updateSkipButtons() {
  const ex = currentExerciseIndex();
  els.btnPrev.disabled = ex <= 0;
  els.btnNext.disabled = false;
}

function tick() {
  if (state.status !== "running") return;
  const now = performance.now();
  const remainMs = state.phaseEndAt - now;
  const secLeft = Math.max(0, Math.ceil(remainMs / 1000));

  if (secLeft !== state.lastSecondShown) {
    els.timer.textContent = String(secLeft);
    if (state.lastSecondShown !== -1 && secLeft >= 1 && secLeft <= 3) {
      countdownBeep();
      els.timer.classList.add("warn");
      els.timer.style.animation = "none";
      void els.timer.offsetWidth;
      els.timer.style.animation = "";
    } else if (secLeft > 3) {
      els.timer.classList.remove("warn");
    }
    if (state.lastSecondShown !== -1 && secLeft === 15 && state.schedule[state.phaseIndex]?.kind === "work") {
      halfTimeBeep();
    }
    state.lastSecondShown = secLeft;
  }

  if (remainMs <= 0) {
    advancePhase();
  }
}

function startTimerLoop() {
  stopTimerLoop();
  state.intervalId = setInterval(tick, 100);
}

function stopTimerLoop() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = 0;
  }
}

function advancePhase() {
  const next = state.phaseIndex + 1;
  if (next >= state.schedule.length) {
    finish();
    return;
  }
  startPhase(next);
}

function startWorkout(workoutId) {
  const w = getWorkout(workoutId);
  if (!w) return;
  const exercises = w.exerciseIds.map((id) => EXERCISE_BY_ID[id]).filter(Boolean);
  if (exercises.length === 0) return;
  setLastUsedWorkoutId(workoutId);
  ensureAudio();
  state.workoutId = workoutId;
  state.exercises = exercises;
  state.schedule = buildSchedule(exercises);
  state.status = "running";
  show(els.viewSession);
  els.btnPause.classList.remove("hidden");
  els.btnResume.classList.add("hidden");
  startPhase(0);
  requestWakeLock();
  startTimerLoop();
}

function pauseSession() {
  if (state.status !== "running") return;
  state.status = "paused";
  state.remainingMs = Math.max(0, state.phaseEndAt - performance.now());
  stopTimerLoop();
  els.btnPause.classList.add("hidden");
  els.btnResume.classList.remove("hidden");
  els.phaseLabel.textContent = "Pausiert";
  releaseWakeLock();
}

function resumeSession() {
  if (state.status !== "paused") return;
  ensureAudio();
  state.status = "running";
  state.phaseEndAt = performance.now() + state.remainingMs;
  setPhaseUI(state.schedule[state.phaseIndex]);
  els.btnPause.classList.remove("hidden");
  els.btnResume.classList.add("hidden");
  requestWakeLock();
  startTimerLoop();
}

function stopSession() {
  stopTimerLoop();
  state.status = "idle";
  releaseWakeLock();
  goToList();
}

function finish() {
  stopTimerLoop();
  state.status = "finished";
  releaseWakeLock();
  show(els.viewFinished);
  successFanfare();
}

// --- Wire up session events ---
els.btnPause.addEventListener("click", pauseSession);
els.btnResume.addEventListener("click", resumeSession);
els.btnStop.addEventListener("click", stopSession);
els.btnRestart.addEventListener("click", () => {
  if (state.workoutId) startWorkout(state.workoutId);
});
els.btnBackToList.addEventListener("click", goToList);
els.btnPrev.addEventListener("click", () => jumpToExercise(currentExerciseIndex() - 1));
els.btnNext.addEventListener("click", () => jumpToExercise(currentExerciseIndex() + 1));
els.btnMute.addEventListener("click", () => {
  muted = !muted;
  els.btnMute.querySelector(".icon-sound").classList.toggle("hidden", muted);
  els.btnMute.querySelector(".icon-muted").classList.toggle("hidden", !muted);
  els.btnMute.classList.toggle("muted", muted);
  els.btnMute.setAttribute("aria-label", muted ? "Ton einschalten" : "Ton stumm schalten");
  els.btnMute.title = muted ? "Ton einschalten" : "Ton stumm schalten";
  if (muted) window.speechSynthesis?.cancel();
});

// --- Service Worker & manual update ---
let swReg = null;
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => { swReg = reg; })
      .catch(() => {});
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

document.getElementById("version-label").addEventListener("click", async () => {
  const el = document.getElementById("version-label");
  el.textContent = "↻";
  try {
    if (swReg) await swReg.update();
  } catch (_) {}
  window.location.reload(true);
});

// --- Boot ---
preloadExerciseImages();
renderWorkoutList();
show(els.viewList);
// Suppress unused-warning for getLastUsedWorkoutId; reserved for future quick-start UX
void getLastUsedWorkoutId;
