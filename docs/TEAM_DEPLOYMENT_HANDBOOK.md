# Dream-to-Doom — Team Deployment & Handover Guide

This document provides instructions for teammates to fetch, run, and deploy **Dream-to-Doom** on **Vercel** and **Render**.

---

## 1. Getting the Latest Code from `main`

All deployment configurations, server files, 3D vignettes, and production optimizations have been pushed to the remote GitHub repository:
**`https://github.com/PRADUMNA-HJ/Dream_to_doom_hacathon.git`** on the **`main`** branch.

### To sync your local workspace:
```bash
git fetch origin
git checkout main
git pull origin main
```

Verify your tree is clean:
```bash
git status
# Should show: On branch main, Your branch is up to date with 'origin/main'
```

---

## 2. Deploying to Vercel (1-Click Automated Serverless)

Vercel deploys the Vite frontend as a high-performance SPA and runs `api/generate-world.ts` as a serverless function endpoint.

### Steps for Teammates:
1. Go to **[vercel.com](https://vercel.com/)** and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Import the repository: **`PRADUMNA-HJ/Dream_to_doom_hacathon`**.
4. Vercel automatically detects the project settings from `vercel.json`:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables (Optional):**
   - Key: `GEMINI_API_KEY`
   - Value: `<Your Google Gemini API Key>`
   *(Note: The application has a full procedural fallback engine, so it works even if this key is omitted).*
6. Click **"Deploy"**.
7. In ~60 seconds, your site is live with a public URL like `https://dream-to-doom.vercel.app`.

---

## 3. Deploying to Render (Full-Stack Node.js Web Service)

Render runs the full application using the included production server (`server.js`), which serves the 3D bundle from `dist/` and hosts the API endpoint.

### Method A: 1-Click via Render Blueprint (`render.yaml`)
1. Log in to **[dashboard.render.com](https://dashboard.render.com/)**.
2. Click **"New +"** → **"Blueprint"**.
3. Connect **`PRADUMNA-HJ/Dream_to_doom_hacathon`**.
4. Render automatically reads `render.yaml` and provisions the Web Service on Node 20.x.
5. Click **"Apply"**.

### Method B: Manual Web Service Setup
1. On **[dashboard.render.com](https://dashboard.render.com/)**, click **"New +"** → **"Web Service"**.
2. Connect **`PRADUMNA-HJ/Dream_to_doom_hacathon`**.
3. Enter settings:
   - **Name:** `dream-to-doom`
   - **Language:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Under **Environment Variables**, add:
   - `NODE_VERSION` = `20.18.0`
   - `GEMINI_API_KEY` = `<Your Google Gemini API Key>` (optional)
5. Click **"Create Web Service"**.
6. Render will build and deploy the app at `https://dream-to-doom.onrender.com`.

---

## 4. Local Testing & Verification

To test the project on any machine:

```bash
# 1. Install dependencies
npm install

# 2. Run automated tests (114/114 passing)
npm test

# 3. Start local development server
npm run dev
# Open http://localhost:3000

# 4. Test production build & server
npm run build
npm start
# Open http://localhost:3000
```

---

## 5. Project Architecture Summary

- **Frontend 3D Engine:** React Three Fiber + Three.js + Rapier physics (`src/world3d/`).
- **Cinematic Director:** 10-second automated 3-act drone choreography (`CinematicCameraController.tsx`).
- **Voice System:** Multilingual speech recognition in 8 languages (`MultilingualSpeech.ts`).
- **Audio Engine:** Tone.js procedural synthesis with 4 mood presets (`SoundEngine.ts`).
- **AI & Procedural Pipeline:** Dual-path engine—Gemini AI serverless API (`api/generate-world.ts`) with zero-latency client-side procedural synthesis fallback (`proceduralPromptSynthesizer.ts`).
- **3D Vignettes Included:**
  - Cyberpunk Skyline with 13 skyscrapers and flying spinner hovercars.
  - Cosmic Void with giant ringed planet and tumbling asteroid fields.
  - Animated Boy & Dog chase scene down a parkway.
  - Animated Dragon vs Dragon mid-air aerial battle with fire/ice breath.
