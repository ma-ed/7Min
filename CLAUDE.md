# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

German-language 7-minute-workout PWA. Pure static site — no build step, no package manager, no dependencies. All files at the repo root are served as-is.

## Running locally

Serve the directory over HTTP (the service worker and ES modules require it; `file://` won't work):

```powershell
python -m http.server 8080
# then open http://localhost:8080
```

There are no tests, linter, or build commands.

## Releasing a new version

The version string is duplicated in two places and **both must be bumped together**, otherwise installed PWAs will keep serving stale assets:

1. `VERSION` constant in [app.js](app.js) (e.g. `"v9"`) — shown in the bottom-right corner; tapping it forces `swReg.update()` + reload.
2. `CACHE` name in [sw.js](sw.js) (e.g. `"7min-v9"`) — the new SW deletes any cache whose key doesn't match, which is how old assets are evicted.

If you add a new top-level asset (JS module, CSS, icon), append it to the `ASSETS` array in [sw.js](sw.js) so it's precached on install.

## Architecture

Five views toggled via a single `show(view)` helper in [app.js](app.js) — all sections live in [index.html](index.html) and only one has `hidden` removed at a time:

- `view-list` — workout cards
- `view-edit` — name + reorderable exercise list for one workout
- `view-picker` — multi-select exercise chooser
- `view-session` — running timer (prepare → work → rest → work → …)
- `view-finished` — completion screen

### Data model & persistence

[workouts.js](workouts.js) is the only module that touches `localStorage` (keys `7min.workouts.v1`, `7min.workouts.lastUsed`). A workout is `{ id, name, exerciseIds: string[] }`. On every `load()` the module:

- seeds a built-in "Klassisches Training" (id `"classic"`) if none exists,
- re-inserts it if a user deleted it,
- filters out any `exerciseIds` not present in `EXERCISE_BY_ID` (defensive against removed exercises).

`isProtectedWorkout(id)` gates rename and delete for the classic workout — the editor disables the name input and hides the delete button when true.

[exercises.js](exercises.js) holds the static exercise catalog. Each exercise has an inline SVG (stick-figure built via the `stick()` template helper) rendered directly into the DOM via `innerHTML`. The phase durations live here too: `PREPARE_SECONDS = 10`, `WORK_SECONDS = 30`, `REST_SECONDS = 10`. `CLASSIC_EXERCISE_IDS` defines the classic 12-exercise sequence.

### Session timer

`buildSchedule(exercises)` produces a flat `phases` array: one `prepare`, then alternating `work`/`rest` (no trailing rest). The session loop uses a 100 ms `setInterval` (`tick`) that compares `performance.now()` to `phaseEndAt` — durations are wall-clock based, so a backgrounded tab doesn't drift. On pause, `remainingMs` is captured and `phaseEndAt` is recomputed on resume.

Prev/Next buttons call `jumpToExercise()`, which finds the `rest` (or `prepare`) phase that *precedes* the target exercise so the user gets the lead-in countdown again.

### Audio & iOS quirks

Two parallel audio paths, both gated by `muted`:

- **WebAudio beeps** (`countdownBeep`, `halfTimeBeep`, `successFanfare`) via a shared `AudioContext`.
- **SpeechSynthesis** for German announcements ("Erste Übung: …", "Nächste Übung: …").

iOS PWA gotchas the code works around — preserve these when refactoring:

- `unlockIOSAudioSession()` plays a tiny silent WAV through an `<Audio>` element on first user gesture. This makes WebAudio bypass the iOS mute switch (otherwise beeps are silent when the ringer is off).
- `ensureAudio()` is `async` and awaits `audioCtx.resume()` — required for reliable playback in standalone PWAs.
- A `touchstart` listener also nudges `audioCtx.resume()` defensively.
- `visibilitychange` re-runs `ensureAudio()` and re-acquires the wake lock when the tab becomes visible mid-session.

### Drag & drop reorder

Custom pointer-event implementation in [app.js](app.js) (`startDrag`/`onDragMove`/`onDragEnd`) — not HTML5 DnD, because it needs to work on touch. A cloned "ghost" follows the pointer; the real item is reinserted into the DOM as the pointer crosses item midpoints, and the underlying `editor.exerciseIds` array is mutated only on drop.

### Service worker

[sw.js](sw.js) uses **cache-first** for all GET requests, with network fallback that writes successful basic responses back into the cache. Combined with the manual `VERSION`/`CACHE` bump-on-release flow, this means: until both strings change, users keep the old app even if you push new files to the host. The version label in the bottom-right corner is also a manual "force update" button (`swReg.update()` + hard reload).

## Conventions

- All UI strings are German — keep new copy in German (`de-DE`).
- No build pipeline: write browser-ready ES modules, no TypeScript, no JSX, no bundler-specific syntax. Imports must include the `.js` extension.
- Inline SVGs only (rendered via `innerHTML` from trusted constants in [exercises.js](exercises.js)) — don't introduce remote image assets.
