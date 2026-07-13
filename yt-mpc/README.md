# DJ Sample Pad 🎛️

A full-stack web application that lets DJs experiment with creating samples from YouTube audio. Paste a YouTube URL, visualize the waveform, chop it into 16 MPC-style pads, and play with transpose, speed, effects — then export everything.

## Features

- **YouTube Audio Download** — Paste a URL, get a WAV
- **Interactive Waveform** — WaveSurfer.js with region selection, zoom, scroll
- **Auto & Manual Chop** — Transient detection or manual marker placement
- **16-Pad Grid** — MPC-style layout with keyboard mapping
- **Polyphonic Playback** — Multiple pads play simultaneously
- **One-Shot & Loop Modes** — Per-pad toggle
- **Transpose** — Global and per-pad pitch shifting (±24 semitones)
- **Speed Control** — 50%–200% with pitch preservation
- **Effects** — Reverb, delay, low-pass, high-pass (per-pad + master)
- **Export** — ZIP with full song + all 16 pad slices as WAV
- **Keyboard Mapping** — C V B N / F G H J / R T Y U / 5 6 7 8

## Prerequisites

- **Node.js** 18+
- **yt-dlp** installed and in PATH ([install guide](https://github.com/yt-dlp/yt-dlp#installation))
- **ffmpeg** installed and in PATH ([download](https://ffmpeg.org/download.html))

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both server and client in development mode
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000

## Docker

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:4000
```

## Keyboard Layout

```
| 5 | 6 | 7 | 8 |   ← Pads 13-16
| R | T | Y | U |   ← Pads 9-12
| F | G | H | J |   ← Pads 5-8
| C | V | B | N |   ← Pads 1-4
```

- **Press** = trigger pad (one-shot or start loop)
- **Hold** = keep looping (in loop mode)
- **Release** = stop loop
- **Right-click pad** = open per-pad settings (transpose, speed, effects)

## Project Structure

```
dj-sample-webapp/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Audio engine, tone.js, chop logic
│   │   ├── App.tsx        # Main app
│   │   └── types.ts       # TypeScript types
│   └── public/
├── server/                # Express backend
│   ├── index.js           # API server + yt-dlp integration
│   └── downloads/         # Temporary audio files
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript |
| Audio Engine | Tone.js (Web Audio API) |
| Waveform | WaveSurfer.js |
| Backend | Node.js + Express |
| YouTube Download | yt-dlp |
| Styling | Tailwind CSS |
| Export | audiobuffer-to-wav + JSZip |

## Deploying this at theluckystrike.co.uk/yt-mpc

This directory is vendored from [UncleWob/YT2TW](https://github.com/UncleWob/YT2TW) into the
main site's repo, but it is **not** part of the site's Vercel build (`yt-mpc/` is listed in
`.vercelignore`). That's intentional: this app needs a long-running Node process that shells
out to `yt-dlp`/`ffmpeg` to download and slice audio, which Vercel's serverless functions can't
do (they're time-limited and have no persistent binaries). It needs a real host.

### 1. Deploy this directory as its own service

Pick any host that runs Docker containers (Railway, Render, Fly.io, a VPS, etc.), pointed at
this `yt-mpc/` directory, using the included `Dockerfile`:

```bash
docker build -t yt-mpc .
docker run -p 4000:4000 yt-mpc
```

Give it a public URL — either the host's default domain, or a subdomain you control, e.g.
`yt-mpc.theluckystrike.co.uk` (point a CNAME at the host).

### 2. Point theluckystrike.co.uk/yt-mpc at it

Simplest option — a redirect in the main site's `vercel.json` (add once you have the URL):

```json
{ "source": "/yt-mpc", "destination": "https://yt-mpc.theluckystrike.co.uk", "permanent": false }
```

Users hitting `/yt-mpc` land on the app at its own origin. This is the recommended approach —
it needs no changes to this app's code.

Alternative — a same-origin reverse proxy (Vercel rewrite instead of redirect) keeps the URL bar
at `theluckystrike.co.uk/yt-mpc`, but requires patching this app first: set
`base: '/yt-mpc/'` in `client/vite.config.ts` and prefix the client's `/api` and `/audio` fetch
calls with `/yt-mpc`, since the server currently assumes it's served from `/`. Only worth doing
if a same-origin URL matters more than the extra work.

### Note on YouTube's Terms of Service

This app downloads audio from YouTube via `yt-dlp`, which is not sanctioned by YouTube's ToS.
That's a reasonable risk for personal/local use; think about exposure (rate limiting, takedown
requests, account/IP bans on the host) before making it public-facing.
