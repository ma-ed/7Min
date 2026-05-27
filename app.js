import {
  EXERCISES, EXERCISE_BY_ID,
  WORK_SECONDS, REST_SECONDS,
  WORK_MIN, WORK_MAX, WORK_STEP,
  REST_MIN, REST_MAX, REST_STEP,
} from "./exercises.js";
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  isProtectedWorkout,
  isNameTaken,
  setLastUsedWorkoutId,
  getLastUsedWorkoutId,
} from "./workouts.js";

const VERSION = "v12";

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
  editNameError: document.getElementById("edit-name-error"),
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
  // duration dialog
  durDialog: document.getElementById("duration-dialog"),
  durTitle: document.getElementById("duration-title"),
  durWork: document.getElementById("duration-work"),
  durWorkValue: document.getElementById("duration-work-value"),
  durRest: document.getElementById("duration-rest"),
  durRestValue: document.getElementById("duration-rest-value"),
  durFirstHint: document.getElementById("duration-first-hint"),
  durReset: document.getElementById("duration-reset"),
  durCancel: document.getElementById("duration-cancel"),
  durSave: document.getElementById("duration-save"),
};

// --- Audio ---
let audioCtx = null;
let muted = false;
let iosSessionUnlocked = false;

function buildSilentWav() {
  // 100 ms mono PCM — long enough for iOS to register as real media playback
  // and upgrade the audio session to "playback" category (bypasses ringer switch).
  // Amplitude 1/32767 ≈ −90 dBFS: technically non-silent so iOS doesn't discard it.
  const rate = 44100;
  const n    = Math.round(rate * 0.1); // 4410 samples = 100 ms
  const data = n * 2;                   // 16-bit mono → 2 bytes per sample
  const buf  = new ArrayBuffer(44 + data);
  const v    = new DataView(buf);
  v.setUint32( 0, 0x52494646, false); // "RIFF"
  v.setUint32( 4, 36 + data,  true);
  v.setUint32( 8, 0x57415645, false); // "WAVE"
  v.setUint32(12, 0x666d7420, false); // "fmt "
  v.setUint32(16, 16,         true);
  v.setUint16(20, 1,          true);  // PCM
  v.setUint16(22, 1,          true);  // mono
  v.setUint32(24, rate,       true);
  v.setUint32(28, rate * 2,   true);
  v.setUint16(32, 2,          true);
  v.setUint16(34, 16,         true);
  v.setUint32(36, 0x64617461, false); // "data"
  v.setUint32(40, data,       true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, 1, true);
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

// Safe to call from timers and non-gesture contexts.
// Only resumes an already-created AudioContext — never creates one, never plays the WAV.
async function ensureAudio() {
  if (audioCtx && audioCtx.state !== "running") {
    try { await audioCtx.resume(); } catch (_) {}
  }
}

// Must be called from a real click/tap handler (NOT touchstart).
// iOS only upgrades the audio session to "playback" category (which bypasses the
// ringer/mute switch) when <audio>.play() is triggered from a click or touchend event,
// not from touchstart.  Creating the AudioContext here — before any await — keeps it
// inside the user-gesture window so iOS allows resume() afterwards.
async function ensureAudioSession() {
  // 1. Create AudioContext synchronously (still within the user-gesture call stack).
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  // 2. Play the WAV to upgrade the iOS audio session to "playback" category.
  await unlockIOSAudioSession();
  // 3. Resume the context (session is now "playback", so beeps bypass the ringer switch).
  if (audioCtx && audioCtx.state !== "running") {
    try { await audioCtx.resume(); } catch (_) {}
  }
}

// touchstart: only resume — do NOT play the WAV here.
// touchstart is insufficient for the iOS "playback" session upgrade; using it would
// consume the iosSessionUnlocked flag and prevent the proper upgrade on the later click.
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
    // Mark session as needing re-unlock; the next touchstart will replay the
    // silent WAV (user gesture) to re-establish the iOS audio session.
    iosSessionUnlocked = false;
    ensureAudio(); // best-effort resume without WAV (may work, may not)
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
      <span class="workout-card-edit" role="button" aria-label="${isProtectedWorkout(w.id) ? "Ansehen" : "Bearbeiten"}" title="${isProtectedWorkout(w.id) ? "Ansehen" : "Bearbeiten"}">
        ${isProtectedWorkout(w.id)
          ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
          : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4l6 6L8 22H2v-6L14 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
      </span>
    `;
    card.querySelector(".workout-card-name").textContent = w.name;
    const count = w.exercises.length;
    const totalSec = w.exercises.reduce(
      (sum, e) => sum + (e.workSeconds ?? WORK_SECONDS) + (e.restSeconds ?? REST_SECONDS),
      0
    );
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
  exercises: [],
};

function openEditor(workoutId) {
  const w = getWorkout(workoutId);
  if (!w) return;
  editor.workoutId = w.id;
  editor.name = w.name;
  editor.exercises = w.exercises.map((e) => ({ ...e }));
  const locked = isProtectedWorkout(w.id);
  els.editName.value = w.name;
  els.editName.disabled = locked;
  els.editLockedHint.classList.toggle("hidden", !locked);
  els.btnDeleteWorkout.classList.toggle("hidden", locked);
  els.btnAddExercise.classList.toggle("hidden", locked);
  clearEditNameError();
  renderEditList();
  show(els.viewEdit);
}

function persistEditorState() {
  updateWorkout(editor.workoutId, {
    name: editor.name,
    exercises: editor.exercises,
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
  els.editEmpty.classList.toggle("hidden", editor.exercises.length > 0);
  const viewOnly = isProtectedWorkout(editor.workoutId);
  editor.exercises.forEach((entry, index) => {
    const ex = EXERCISE_BY_ID[entry.exerciseId];
    if (!ex) return;
    const work = entry.workSeconds ?? WORK_SECONDS;
    const rest = entry.restSeconds ?? REST_SECONDS;
    const customized = entry.workSeconds !== undefined || entry.restSeconds !== undefined;
    const item = document.createElement("div");
    item.className = "edit-item";
    item.dataset.index = String(index);
    item.innerHTML = `
      <span class="drag-handle${viewOnly ? " hidden" : ""}" aria-label="Verschieben" title="Verschieben">
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
      <div class="edit-item-text">
        <div class="edit-item-name"></div>
        <div class="edit-item-meta"></div>
      </div>
      <button class="btn-edit-duration${viewOnly ? " hidden" : ""}" type="button" aria-label="Dauer bearbeiten" title="Dauer bearbeiten">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 9v4l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M9 3h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="btn-remove${viewOnly ? " hidden" : ""}" type="button" aria-label="Entfernen" title="Entfernen">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    renderExerciseFigure(item.querySelector(".edit-item-svg"), ex);
    item.querySelector(".edit-item-name").textContent = ex.name;
    const meta = item.querySelector(".edit-item-meta");
    meta.textContent = `${work}s Übung · ${rest}s Pause`;
    meta.classList.toggle("customized", customized);
    item.querySelector(".btn-edit-duration").addEventListener("click", () => {
      openDurationDialog(index);
    });
    item.querySelector(".btn-remove").addEventListener("click", () => {
      editor.exercises.splice(index, 1);
      persistEditorState();
      renderEditList();
    });
    if (!viewOnly) {
      const handle = item.querySelector(".drag-handle");
      handle.addEventListener("pointerdown", (ev) => startDrag(ev, item, index));
    }
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
    const [moved] = editor.exercises.splice(drag.sourceIndex, 1);
    editor.exercises.splice(drag.currentIndex, 0, moved);
    persistEditorState();
  }
  drag = null;
  renderEditList();
}

// --- Editor events ---
function validateEditName() {
  const duplicate = !!editor.name.trim() && isNameTaken(editor.name, editor.workoutId);
  els.editNameError.classList.toggle("hidden", !duplicate);
  els.editName.classList.toggle("invalid", duplicate);
  return !duplicate;
}

function clearEditNameError() {
  els.editNameError.classList.add("hidden");
  els.editName.classList.remove("invalid");
}

els.editName.addEventListener("input", () => {
  editor.name = els.editName.value;
  validateEditName();
});
els.editName.addEventListener("blur", () => {
  if (validateEditName()) persistEditorState();
});
els.btnEditBack.addEventListener("click", () => {
  if (!validateEditName()) return;
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

// --- Duration dialog ---
els.durWork.min = String(WORK_MIN);
els.durWork.max = String(WORK_MAX);
els.durWork.step = String(WORK_STEP);
els.durRest.min = String(REST_MIN);
els.durRest.max = String(REST_MAX);
els.durRest.step = String(REST_STEP);

let durationEditIndex = -1;

function updateDurationLabels() {
  els.durWorkValue.textContent = `${els.durWork.value}s`;
  els.durRestValue.textContent = `${els.durRest.value}s`;
}

els.durWork.addEventListener("input", updateDurationLabels);
els.durRest.addEventListener("input", updateDurationLabels);

function openDurationDialog(index) {
  const entry = editor.exercises[index];
  if (!entry) return;
  const ex = EXERCISE_BY_ID[entry.exerciseId];
  if (!ex) return;
  durationEditIndex = index;
  els.durTitle.textContent = ex.name;
  els.durWork.value = String(entry.workSeconds ?? WORK_SECONDS);
  els.durRest.value = String(entry.restSeconds ?? REST_SECONDS);
  els.durFirstHint.classList.toggle("hidden", index !== 0);
  updateDurationLabels();
  if (typeof els.durDialog.showModal === "function") {
    els.durDialog.showModal();
  } else {
    els.durDialog.setAttribute("open", "");
  }
}

function closeDurationDialog() {
  if (typeof els.durDialog.close === "function") els.durDialog.close();
  else els.durDialog.removeAttribute("open");
  durationEditIndex = -1;
}

els.durReset.addEventListener("click", () => {
  els.durWork.value = String(WORK_SECONDS);
  els.durRest.value = String(REST_SECONDS);
  updateDurationLabels();
});

els.durCancel.addEventListener("click", () => closeDurationDialog());

els.durSave.addEventListener("click", () => {
  if (durationEditIndex < 0) return;
  const entry = editor.exercises[durationEditIndex];
  if (!entry) { closeDurationDialog(); return; }
  const work = parseInt(els.durWork.value, 10);
  const rest = parseInt(els.durRest.value, 10);
  const next = { exerciseId: entry.exerciseId };
  if (work !== WORK_SECONDS) next.workSeconds = work;
  if (rest !== REST_SECONDS) next.restSeconds = rest;
  editor.exercises[durationEditIndex] = next;
  persistEditorState();
  renderEditList();
  closeDurationDialog();
});

// Close on backdrop click
els.durDialog.addEventListener("click", (ev) => {
  if (ev.target === els.durDialog) closeDurationDialog();
});

// --- Picker state ---
const picker = {
  selected: new Map(),
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
  const q = picker.query.trim().toLowerCase();
  const available = EXERCISES.filter((ex) => q === "" || ex.name.toLowerCase().includes(q));
  if (available.length === 0) {
    const empty = document.createElement("div");
    empty.className = "picker-empty";
    empty.textContent = "Keine Treffer.";
    els.pickerList.appendChild(empty);
    return;
  }
  for (const ex of available) {
    const item = document.createElement("div");
    item.className = "picker-item";
    item.innerHTML = `
      <div class="picker-item-svg"></div>
      <div class="picker-item-name"></div>
      <span class="picker-check"></span>
    `;
    renderExerciseFigure(item.querySelector(".picker-item-svg"), ex);
    item.querySelector(".picker-item-name").textContent = ex.name;
    renderPickerItemCount(item, picker.selected.get(ex.id) ?? 0);
    item.addEventListener("click", () => {
      const prev = picker.selected.get(ex.id) ?? 0;
      picker.selected.set(ex.id, prev + 1);
      renderPickerItemCount(item, prev + 1);
      updatePickerAddButton();
    });
    els.pickerList.appendChild(item);
  }
}

function renderPickerItemCount(item, count) {
  item.classList.toggle("checked", count > 0);
  const badge = item.querySelector(".picker-check");
  if (count > 1) {
    badge.textContent = `×${count}`;
  } else {
    badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
}

function updatePickerAddButton() {
  const total = [...picker.selected.values()].reduce((s, n) => s + n, 0);
  els.btnPickerAdd.textContent = total === 0 ? "Hinzufügen" : `Hinzufügen (${total})`;
  els.btnPickerAdd.disabled = total === 0;
}

els.pickerSearch.addEventListener("input", () => {
  picker.query = els.pickerSearch.value;
  renderPicker();
});
els.btnPickerBack.addEventListener("click", () => show(els.viewEdit));
els.btnPickerAdd.addEventListener("click", () => {
  if (picker.selected.size === 0) return;
  const ordered = EXERCISES
    .filter((e) => picker.selected.has(e.id))
    .flatMap((e) => Array.from({ length: picker.selected.get(e.id) }, () => ({ exerciseId: e.id })));
  editor.exercises.push(...ordered);
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
function buildSchedule(entries) {
  const phases = [];
  if (entries.length === 0) return phases;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rest = entry.restSeconds ?? REST_SECONDS;
    const work = entry.workSeconds ?? WORK_SECONDS;
    if (rest > 0) {
      phases.push({ kind: "rest", duration: rest, exerciseIndex: i });
    }
    phases.push({ kind: "work", duration: work, exerciseIndex: i });
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

  if (phase.kind === "work") {
    els.phaseLabel.textContent = "Übung";
    // NBSP placeholder keeps the line's height so the figure below doesn't jump.
    els.nextLabel.textContent = " ";
    els.timer.classList.add("work");
    els.timer.classList.remove("warn");
    if (phase.exerciseIndex === 0 && !precedingRestExists(0)) {
      speak(`Erste Übung: ${ex.name}`);
    }
  } else if (phase.kind === "rest") {
    if (phase.exerciseIndex === 0) {
      els.phaseLabel.textContent = "Bereitmachen";
      els.nextLabel.textContent = "Erste Übung:";
      els.timer.classList.remove("work", "warn");
      speak(`Erste Übung: ${ex.name}`);
    } else {
      els.phaseLabel.textContent = "Pause";
      els.nextLabel.textContent = "Nächste Übung:";
      els.timer.classList.remove("work", "warn");
      speak(`Nächste Übung: ${ex.name}`);
    }
  }
}

function precedingRestExists(exerciseIndex) {
  return state.schedule.some((p) => p.kind === "rest" && p.exerciseIndex === exerciseIndex);
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
  const restIdx = state.schedule.findIndex(
    (p) => p.kind === "rest" && p.exerciseIndex === exerciseIndex
  );
  if (restIdx >= 0) return restIdx;
  // No rest phase (rest=0): fall back to the work phase for this exercise.
  return state.schedule.findIndex(
    (p) => p.kind === "work" && p.exerciseIndex === exerciseIndex
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
    const curPhase = state.schedule[state.phaseIndex];
    if (state.lastSecondShown !== -1 && curPhase?.kind === "work" &&
        secLeft === Math.floor(curPhase.duration / 2)) {
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
  const entries = w.exercises.filter((e) => EXERCISE_BY_ID[e.exerciseId]);
  const exercises = entries.map((e) => EXERCISE_BY_ID[e.exerciseId]);
  if (exercises.length === 0) return;
  setLastUsedWorkoutId(workoutId);
  ensureAudioSession();
  state.workoutId = workoutId;
  state.exercises = exercises;
  state.schedule = buildSchedule(entries);
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
  ensureAudioSession();
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
