# Dream-to-Doom — Final Hackathon Demonstration Guide & Rehearsal Playbook

**Document Status:** Production Ready
**Project:** Dream-to-Doom — Voice-to-Playable-3D
**Sprint Phase:** Final Demo Readiness, Feature Gap Closure & Rehearsal
**Auditor & Author:** Person 1 (Integrator & AI Lead)

---

## 1. Quick Launch & Environment Setup

Run the following command in terminal to launch both the static frontend and the Vercel serverless function simultaneously:

```bash
npx vercel dev
```

- **Target URL:** `http://localhost:3000` (Verify port 3000 rather than standard Vite 5173, as port 3000 serves both frontend and `/api/generate-world`).
- **Required Environment Variable:** `GEMINI_API_KEY` present in `.env.local` or `.env`.

---

## 2. Pre-Rehearsal Verification Checklist

Before presenting to judges:

1. [x] **Audio User Gesture:** Click **"🔈 Enable Audio"** in TopNav immediately upon page load. Confirm that the button changes to **"🔊 Sound On"** and a gentle C-major ambient pad begins playing.
2. [x] **Browser Microphone Permission:** Allow microphone access in Chrome or Edge when prompted.
3. [x] **Full-Screen Immersion:** Press `F11` in Chrome to enter borderless full-screen mode.
4. [x] **Fallback Readiness:** If conference Wi-Fi experiences high packet loss, use the preset prompt buttons (e.g. `🌿 Enchanted Forest`, `🏙️ Cyberpunk Rooftop`) or text prompt input.

---

## 3. Step-by-Step Judge Demonstration Script

### Step 1: Initial Presentation & Architecture Hook (30 Seconds)
- Open `http://localhost:3000` in full-screen.
- Show the glassmorphic HUD, real-time stopwatch, and clean 3D terrain canvas.
- Click **"📐 Architecture"** in the top navigation bar to open the in-app technical specification modal.
- Point to the **Voice-to-World Pipeline** diagram and highlight:
  > *"Rather than forcing users to wait 30 to 120 seconds for slow 3D mesh diffusion models that have no physics or rigging, Dream-to-Doom generates an instantaneous JSON Scene Graph in 2 seconds using Google Gemini Flash, and instantiates preloaded assets in the browser with Rapier physics and Tone.js adaptive audio."*
- Close the modal with `Esc` or the return button.

### Step 2: Audio Context Activation
- Click the **"🔈 Enable Audio"** button in the top navigation bar.
- Point out the ambient synthesis sound and the state update in the HUD.

### Step 3: Demo 1 — "The Dream" (Enchanted Forest)
- Click the **`🌿 Enchanted Forest`** preset button (or speak into the microphone: *"Create an enchanted forest with giant glowing trees, floating crystals, mysterious portals, and soft mist."*).
- Highlight the **Live Stopwatch** in the top bar ($<2.5$ seconds) and watch the **Telemetry Feed** on the left stream:
  1. `[00:00.012] AI Generation pipeline initiated`
  2. `[00:01.842] Gemini API structured response received`
  3. `[00:01.890] Zod schema validated and clamped`
  4. `[00:02.100] World state revision committed`
- Walk through the forest using **WASD** and jump with **Spacebar**.
- Walk toward a floating cyan crystal:
  - Demonstrate the single-collection logic.
  - Notice the score increase by $+10$ in the HUD.
  - Listen for the polyphonic chime synthesised via Tone.js.

### Step 4: Demo 2 — "The Doom" (Cyberpunk Rooftop)
- Click the **`🏙️ Cyberpunk Rooftop`** preset button (or speak into the microphone: *"Create a dark futuristic cyberpunk rooftop with neon lights, rain, flying platforms, and dangerous robots."*).
- Observe the seamless live scene swap:
  - Forest transforms into a dystopian cyberpunk rooftop with neon fog and dark ambiance.
  - Audio mood immediately transitions to tense minor second intervals.
- Jump across platforms to avoid or engage the hazard robot:
  - Approach the red hazard drone: take damage ($-15$ HP).
  - Point out that damage is rate-limited to 1 hit per $1200\text{ms}$ (preventing immediate instant-death frame drains).
  - Health clamps safely $\ge 0$.

---

## 4. Judge Technical Q&A Cheat Sheet

| Question | Recommended Answer |
| :--- | :--- |
| **"Why not generate 3D meshes directly using Point-E, Shap-E, or TripoSR?"** | 3D diffusion generation takes 30-120 seconds per model, generates non-manifold geometry lacking physics colliders, creates 20MB+ payloads, and causes heavy WebGL draw-call bottlenecks. Our Scene Graph approach generates a typed layout contract in 2 seconds, instantiating optimized assets with instant Rapier rigidbodies and 60 FPS WebGL rendering. |
| **"How do you prevent AI entities from overlapping or spawning inside the player?"** | We use a multi-tiered spatial constraint system: a mandatory $3.5\text{m}$ cylinder radius around origin is reserved for player spawn, and a grid-based spatial density hash prevents entity crowding ($<3$ entities per $10\text{m}^2$ cell). |
| **"How did your team prevent Git merge conflicts in 24 hours?"** | Work was strictly partitioned by domain contracts: Person 1 (Integrator & AI Lead) owned store interfaces and serverless endpoints; Person 2 (3D Lead) owned R3F rendering; Person 3 (Sensory Lead) owned audio and speech. All communication occurred via typed Zustand state and an internal event bus. |
| **"What happens if Web Speech API is blocked or unsupported?"** | The application detects Web Speech API support automatically and provides an inline text fallback with Enter-to-submit and one-click demo presets. |

---

## 5. Keyboard & Input Reference

- **`W` / `A` / `S` / `D`**: Character movement (Forward, Left, Backward, Right)
- **`Spacebar`**: Jump
- **`Esc`**: Close Architecture modal or overlays
- **`Enter`**: Submit typed prompt
- **`F11`**: Toggle full-screen mode in browser
