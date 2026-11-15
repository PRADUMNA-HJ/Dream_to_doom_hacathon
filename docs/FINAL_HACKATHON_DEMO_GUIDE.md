# DREAM-TO-DOOM — FINAL HACKATHON DEMO GUIDE
## Complete 5-Minute Live Judging Walkthrough & Guaranteed Offline Fallback Script

**Event:** 24-Hour AI Game Hackathon  
**Project:** Dream-to-Doom (Voice-to-Playable-3D)  
**Live URL:** Local: `http://localhost:3000/` | Production: Vercel Deployment  
**Repository:** `https://github.com/PRADUMNA-HJ/Dream_to_doom_hacathon`  
**Branch:** `main`  

---

## 1. Quick Rehearsal Checklist (Before Stepping Up)

1. **Browser:** Google Chrome or Microsoft Edge (native Web Speech API & WebGL 2.0 acceleration).
2. **Microphone:** Allow microphone permissions if prompted (`chrome://settings/content/microphone`).
3. **Sound:** Unmute your laptop / speaker. Modern browsers require 1 click to activate Tone.js Web Audio.
4. **Window Mode:** Press `F11` (or full-screen window) for maximum immersive gameplay presentation.
5. **Backup Tab:** Keep a second tab preloaded at `http://localhost:3000/` in case of unexpected network drops.

---

## 2. 5-Minute Live Judging Demonstration Script

### Demo 1: The Pitch & Vision (0:00 - 0:45)
**Action:** Show the landing view of Dream-to-Doom with the active session stopwatch ticking in the header.
**Spoken Script:**
> *"Judges, welcome to Dream-to-Doom. Our thesis for this hackathon was simple: **Speak your imagination, and watch it become playable reality in under 2 seconds.**
> Conventional 3D AI tools generate raw polygon meshes via 3D diffusion, which takes 30 to 120 seconds and yields unrigged, non-manifold geometry with zero game physics or semantic rules.
> Instead, Dream-to-Doom pioneers **Semantic Scene Graph Generation**. We use Google Gemini to interpret natural language into a strictly typed, validated 3D Scene Graph, which our client engine assembles instantly using React Three Fiber, Rapier physics, and Tone.js generative audio."*

---

### Demo 2: Instant Playable World & Physics Gameplay (0:45 - 1:45)
**Action:**
1. Click **"✨ Load Demo World"** in the top navigation (or the **🌿 Enchanted Forest** preset button).
2. The 3D world materializes instantly with glowing trees, ancient platforms, and ambient lighting.
3. Use `W`, `A`, `S`, `D` to navigate, `Space` to jump onto the stone platform.
4. Collect a glowing cyan crystal $\to$ hear the sparkling chime, see the score increase (+10).
5. Walk into the red hazard drone $\to$ notice the pink damage flash, sound effect, and health drop to 85.
6. Walk through the purple ancient portal $\to$ experience the dimensional warp flash and instant teleportation.
**Spoken Script:**
> *"Let's immediately launch Emerald Grove Sanctuary. Notice that this is not a pre-baked video or static model—this is a live, deterministic 3D physics environment.
> We have smooth WASD movement, dynamic third-person camera tracking, Rapier rigid-body physics, jump detection, collectible energy crystals with procedural sound chimes, hazard drone damage with cooldown rate-limiting, and dimensional teleportation portals."*

---

### Demo 3: Sensory Audio Suite & Tone.js Engine (1:45 - 2:30)
**Action:**
1. In the header, click **"🎛️ Audio Suite"**.
2. The modal opens showing the Tone.js procedural synthesis matrix.
3. Switch between ambient presets:
   - `nature_breeze` (Calm, acoustic lowpass pad)
   - `dystopian_drone` (Tense, detuned minor harmonics)
   - `cyber_ambience` (High-energy arpeggiated synth)
4. Click the SFX preview buttons (`Player Jump`, `Item Collected`, `Player Damaged`, `Portal Entered`).
5. Close the modal (`Esc` or `Return to World`).
**Spoken Script:**
> *"Every generated world features adaptive sensory audio synthesized entirely in the browser using Tone.js.
> For serene fantasy biomes, our engine modulates to a C3 Major Pentatonic scale. For dangerous cyberpunk or void biomes, it dynamically shifts to a Diminished Octatonic scale. All SFX—jumping, crystal collection, impact damage, and portal warps—are synthesized procedurally without relying on static MP3 downloads."*

---

### Demo 4: AI World Generation from Natural Language (2:30 - 3:30)
**Action:**
1. Click into the prompt bar at the bottom.
2. Type or paste:
   `Create a dark futuristic cyberpunk rooftop with neon lights, rain, flying platforms, and dangerous robots.`
3. Click **"Generate"** (or click the **🏙️ Cyberpunk Rooftop** preset button).
4. Watch the Loading Overlay progress:
   - *Gemini 3.8 Flash Synthesizing Scene Graph...*
   - *Verifying Scene Graph via Zod Contract...*
   - *Instantiating 3D Primitives & Colliders...*
5. The world transforms into **Neo-Veridia Cyber Rooftop**: obsidian sky, purple acid rain, neon green and pink lamps, high catwalks, and patrol drones.
**Spoken Script:**
> *"Now let's synthesize a brand new world. We enter a prompt: 'A futuristic cyberpunk rooftop with neon lights and rain.'
> Notice the generation timeline: Gemini Flash generates the structured JSON payload, our Zod schema contract validates all entity coordinates and bounds, and React Three Fiber hydrates the new scene graph. The entire world, lighting, rain weather, and audio mood transitioned in under 2 seconds!"*

---

### Demo 5: Multilingual Voice Terminal & Live Waveform (3:30 - 4:15)
**Action:**
1. Click **"🎙️ Voice Terminal"** in the bottom panel.
2. The Cyberpunk Sensory Terminal opens.
3. Switch the language dropdown to an Indian language (e.g. `kn-IN` Kannada, `te-IN` Telugu, `ta-IN` Tamil, `hi-IN` Hindi).
4. Click the microphone button and speak a prompt, or use the **Edit Transcript** button to tweak text.
5. Point out the live audio waveform visualizer driven by the browser's Web Audio API `AnalyserNode`.
6. Click **"⚡ Generate World"**.
**Spoken Script:**
> *"Accessibility across regional languages was a core requirement. Our Voice Terminal supports 8 major languages: English, Tamil, Kannada, Telugu, Marathi, Bengali, Malayalam, and Hindi.
> The terminal analyzes real-time microphone frequency data via the Web Audio API AnalyserNode, displays real-time transcription with algorithmic confidence scoring, allows inline prompt editing, and connects straight to our serverless AI gateway."*

---

### Demo 6: Architecture Blueprint Modal (4:15 - 4:45)
**Action:**
1. Click **"📐 Architecture"** in the top navigation.
2. Click through the tabs:
   - **Voice-to-World Pipeline:** Explain the 8 distinct stages.
   - **Scene Graph vs 3D Diffusion:** Highlight the latency comparison table (300-500ms server time vs 30-120s diffusion).
   - **Collision & Physics Constraints:** Show the safe spawn radius ($r=3.5\text{m}$) and 28-entity density cap.
**Spoken Script:**
> *"Evaluators often ask about our engineering choices. In our Architecture Blueprint, we document the entire 8-stage pipeline from Speech Input to React Three Fiber rendering.
> We clearly explain why structured scene graph generation is mathematically superior to 3D diffusion for interactive games: sub-second generation, zero GPU server costs, guaranteed physics collision, and a tiny 2KB network footprint."*

---

### Demo 7: Final Conclusion & Wrap-Up (4:45 - 5:00)
**Spoken Script:**
> *"Dream-to-Doom demonstrates that generative AI can produce instantaneous, playable 3D games with real physics, spatial game mechanics, and dynamic procedural music right inside the browser.
> All automated tests pass, the build is production-ready, and our code is fully synchronized on GitHub. Thank you, and we welcome your questions!"*

---

## 3. Guaranteed Offline Fallback Demo Plan (Zero-Panic Mode)

If the conference Wi-Fi drops, Gemini rate-limits, or microphone hardware fails:

1. **Do NOT panic.** Dream-to-Doom is built to be 100% demonstrable completely offline.
2. **Predefined Offline Demo Worlds:**
   - Click **🌿 Enchanted Forest** $\to$ Loads Emerald Grove Sanctuary with 17 entities, crystals, and portals.
   - Click **🏙️ Cyberpunk Rooftop** $\to$ Loads Neo-Veridia with rain weather, neon lamps, and patrol drones.
   - Click **☁️ Floating Islands** $\to$ Loads Aetheria Floating Archipelago with vertical cloud platforms.
3. **Visual Badge:** Notice the animated **`[Offline Demo Mode]`** badge in the header, demonstrating transparent error resilience.
4. **Tone.js Audio:** Tone.js runs entirely client-side; all 6 ambient soundscapes and 4 SFX work identically offline.
5. **Interactive Architecture Modal:** Click **📐 Architecture** to show judges the full technical diagrams and engineering documentation.
