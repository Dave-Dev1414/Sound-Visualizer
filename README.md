# Sound Visualizer

A local-first audio analysis workstation with a compact, FL Studio-inspired workspace. Audio stays in the browser; the optional local API stores only session settings.

## Features

- Two independent audio decks with local file loading, play/pause, seek, duration and decoded waveform previews
- Live frequency spectrum and time-domain waveform using the Web Audio API
- Three-band EQ per deck (low shelf, mid peaking filter, high shelf)
- Per-deck gain, master level and equal-power crossfader
- Microphone input with explicit browser permission and a stop control
- Save and restore project settings through the local API, with browser local-storage fallback
- Responsive layout for desktop and smaller screens

## Requirements

- Node.js 20.19+ (Node 22+ recommended)
- A modern browser with Web Audio API support
- Microphone access requires localhost or HTTPS and browser permission

## Run locally

Install the frontend dependencies once:

```bash
npm install
```

Start both the API and frontend in one terminal:

```bash
npm run dev:full
```

This launches the API at `http://localhost:8787` and the frontend at the Vite URL shown in the terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to the local API. If you prefer separate terminals, use `npm run server` and `npm run dev` respectively.

The API saves the current session settings to `backend/data/session.json` when you press **Save**. That local data file is ignored by Git.

The frontend can still run without the API. Session settings are then saved in the browser's local storage instead.

## Verify

```bash
npm run build
npm run lint
```

Check the API separately at `http://localhost:8787/api/health`; it should return JSON with `"status":"ok"`.

## Audio privacy and limitations

- Audio files are decoded and played locally in the browser. The backend does **not** upload or store audio files.
- Microphone audio is processed in-browser and is not sent to the API.
- Session persistence stores the project name, visualization mode, master/crossfader levels, EQ values and channel gain only.
- Browser audio decoding depends on the codec support in the browser.
- This is a real-time analysis and basic processing workstation, not yet a multitrack editor, recorder, pitch shifter or DAW export pipeline.

## Architecture

- **Frontend:** React, TypeScript, Vite
- **Audio processing:** Web Audio API (`AnalyserNode`, `BiquadFilterNode`, `GainNode`, `MediaStreamAudioSourceNode`)
- **Backend:** Node.js built-in HTTP server; no extra backend package is required
- **Session storage:** local JSON file on the backend, with local-storage fallback in the browser
