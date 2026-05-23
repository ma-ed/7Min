import { EXERCISES, PREPARE_SECONDS, WORK_SECONDS, REST_SECONDS } from "./exercises.js";

const els = {
  viewIdle: document.getElementById("view-idle"),
  viewSession: document.getElementById("view-session"),
  viewFinished: document.getElementById("view-finished"),
  btnStart: document.getElementById("btn-start"),
  btnPause: document.getElementById("btn-pause"),
  btnResume: document.getElementById("btn-resume"),
  btnStop: document.getElementById("btn-stop"),
  btnRestart: document.getElementById("btn-restart"),
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
function ensureAudio() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function beep(frequency, durationMs, when = 0, gain = 0.25) {
  if (!audioCtx || muted) return;
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

function countdownBeep() {
  ensureAudio();
  beep(880, 150);
}

function halfTimeBeep() {
  ensureAudio();
  // Double-ping at a softer pitch to mark the halfway point
  beep(660, 120, 0, 0.2);
  beep(660, 120, 0.2, 0.2);
}

function successFanfare() {
  if (!audioCtx) return;
  // C5, E5, G5, C6
  beep(523.25, 180, 0);
  beep(659.25, 180, 0.2);
  beep(783.99, 180, 0.4);
  beep(1046.5, 380, 0.6, 0.3);
}

// --- Speech Synthesis ---
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
  } catch (_) { /* user gesture required or not allowed — ignore */ }
}
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
// iOS/Android auto-release the lock when the tab is hidden. Re-acquire on return.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.status === "running") {
    ensureAudio();
    if (!wakeLock) requestWakeLock();
  }
});

// --- State machine ---
// Phase sequence: prepare -> (work, rest)*11 -> work -> finished
// First "prepare" shows exercise 0 with PREPARE_SECONDS.
// During "rest" we show the NEXT exercise so user can mentally prep.
function buildSchedule() {
  const phases = [];
  phases.push({ kind: "prepare", duration: PREPARE_SECONDS, exerciseIndex: 0 });
  for (let i = 0; i < EXERCISES.length; i++) {
    phases.push({ kind: "work", duration: WORK_SECONDS, exerciseIndex: i });
    if (i < EXERCISES.length - 1) {
      phases.push({ kind: "rest", duration: REST_SECONDS, exerciseIndex: i + 1 });
    }
  }
  return phases;
}

const state = {
  status: "idle", // idle | running | paused | finished
  schedule: [],
  phaseIndex: 0,
  phaseEndAt: 0,        // performance.now() timestamp
  remainingMs: 0,       // used while paused
  lastSecondShown: -1,
  intervalId: 0,
};

function show(view) {
  for (const v of [els.viewIdle, els.viewSession, els.viewFinished]) v.classList.add("hidden");
  view.classList.remove("hidden");
}

function setPhaseUI(phase) {
  const ex = EXERCISES[phase.exerciseIndex];
  els.exerciseSvg.innerHTML = ex.svg;
  els.exerciseName.textContent = ex.name;
  els.progress.textContent = `${Math.min(phase.exerciseIndex + 1, EXERCISES.length)} / ${EXERCISES.length}`;

  if (phase.kind === "prepare") {
    els.phaseLabel.textContent = "Bereitmachen";
    els.nextLabel.classList.remove("hidden");
    els.nextLabel.textContent = "Erste Übung:";
    els.timer.classList.remove("work", "warn");
    speak(`Erste Übung: ${ex.name}`);
  } else if (phase.kind === "work") {
    els.phaseLabel.textContent = "Übung";
    els.nextLabel.classList.add("hidden");
    els.timer.classList.add("work");
    els.timer.classList.remove("warn");
  } else if (phase.kind === "rest") {
    els.phaseLabel.textContent = "Pause";
    els.nextLabel.classList.remove("hidden");
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
  // Returns the prepare phase (before exercise 0) or the rest phase that
  // precedes work[exerciseIndex] (rest.exerciseIndex === exerciseIndex).
  if (exerciseIndex === 0) {
    return state.schedule.findIndex((p) => p.kind === "prepare");
  }
  return state.schedule.findIndex(
    (p) => p.kind === "rest" && p.exerciseIndex === exerciseIndex
  );
}

function jumpToExercise(targetExerciseIndex) {
  if (state.status !== "running" && state.status !== "paused") return;
  if (targetExerciseIndex >= EXERCISES.length) {
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
    // Trigger beep when a new second appears that is in {3,2,1}
    if (state.lastSecondShown !== -1 && secLeft >= 1 && secLeft <= 3) {
      countdownBeep();
      els.timer.classList.add("warn");
      // restart pulse animation
      els.timer.style.animation = "none";
      void els.timer.offsetWidth;
      els.timer.style.animation = "";
    } else if (secLeft > 3) {
      els.timer.classList.remove("warn");
    }
    // Half-time ping at 15 s during work phases
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

function startSession() {
  ensureAudio();
  state.schedule = buildSchedule();
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
  // restore phase label
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
  show(els.viewIdle);
}

function finish() {
  stopTimerLoop();
  state.status = "finished";
  releaseWakeLock();
  show(els.viewFinished);
  successFanfare();
}

// --- Wire up events ---
els.btnStart.addEventListener("click", startSession);
els.btnPause.addEventListener("click", pauseSession);
els.btnResume.addEventListener("click", resumeSession);
els.btnStop.addEventListener("click", stopSession);
els.btnRestart.addEventListener("click", startSession);
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

// --- Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
