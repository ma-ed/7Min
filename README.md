# 7-Minuten-Workout

A German-language Progressive Web App (PWA) for the classic 7-minute workout. **The app interface is currently in German only.**

**[Open the app →](https://ma-ed.github.io/7Min)**

## Features

- Classic 12-exercise, 7-minute circuit (30 s work / 10 s rest)
- Create and manage custom workouts with your own exercise selection
- Reorder exercises via drag & drop (touch-friendly)
- Audio cues: countdown beeps and spoken German exercise announcements
- Works offline — installs as a PWA on iOS, Android, and desktop
- Light / dark / auto theme
- No account, no tracking, no dependencies — everything runs in the browser

## Technical notes

- Pure static site: no build step, no bundler, no package manager
- ES modules served as-is from the repo root
- Service worker with cache-first strategy for full offline support
- iOS mute-switch workaround (silent WAV unlock on first gesture)
- Custom pointer-event drag & drop (works on touch and mouse)

## Running locally

```powershell
python -m http.server 8080
# then open http://localhost:8080
```

A plain HTTP server is required because ES modules and the service worker don't work over `file://`.

## License

MIT
