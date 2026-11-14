# Dream-to-Doom — Live Hackathon Demo Guide

This document is the official presentation playbook for showcasing **Dream-to-Doom** to judges and audiences during the hackathon.

---

## 1. The 30-Second Elevator Pitch

> *"Most generative AI tools today force you to wait 2 to 3 minutes for slow, unrigged 3D meshes that don't even have physics. Dream-to-Doom takes a completely different path: we use Google Gemini 3.8 Flash to generate an instantaneous, semantic **Scene Graph** in JSON, which our WebGL and Rapier physics engines instantiate in under 2 seconds. You speak your imagination, and you are immediately walking, jumping, and exploring a real-time 3D gaming world."*

---

## 2. Pre-Demo Setup Checklist

1. **Audio Context:** Click the **"Enable Audio"** button in the top navigation bar. Confirm ambient synth chords are gently audible.
2. **Microphone Permissions:** Ensure browser microphone permissions are enabled for the site.
3. **Display Mode:** Press `F11` (or full screen) to maximize visual immersion. The WebGL Canvas and glassmorphic HUD will scale to any resolution.
4. **Offline Safety Fallback:** If internet or Gemini API access is temporarily restricted at the venue, click any of the preset pills or load test worlds to showcase real-time 3D instancing and Rapier physics.

---

## 3. Recommended 3-Step Demo Walkthrough

### Prompt 1: The Ethereal Dream (Enchanted Forest)
* **Spoken Prompt:** *"Create an enchanted forest with giant glowing trees, floating crystals, mysterious portals, and soft mist."*
* **What to Show:**
  * Point to the **live digital stopwatch** running in real-time.
  * Show the terminal telemetry streaming pipeline stages (`ai-response-received`, `schema-validation-completed`, `loading-assets`, `world-ready`).
  * Watch the camera reveal the bioluminescent green trees and glowing crystal obelisks.
  * Point out the **calm pentatonic ambient music** automatically adapted by Tone.js.
  * Walk up to a crystal to collect it: hear the collection chime and observe the score increment.

### Prompt 2: The Apocalyptic Doom (Cyberpunk Rooftop)
* **Spoken Prompt:** *"Create a dark futuristic cyberpunk rooftop with neon lights, rain, flying platforms, and dangerous robots."*
* **What to Show:**
  * Immediate transition: the world swaps from tranquil forest to dark neon citadel.
  * Point out the shift in **Tone.js audio mood**: it transitions to dark, tense minor second chords.
  * Walk with WASD and jump with Spacebar over the platforms.
  * Touch a hazard drone: show the health bar decrease and hear the impact noise.

### Prompt 3: The Surreal Wonder (Floating Islands)
* **Spoken Prompt:** *"Create an ethereal world with floating islands, glowing clouds, crystal structures, and a golden portal."*
* **What to Show:**
  * Dramatic vertical landscape with floating platforms and cloud meshes.
  * Notice the player spawning safely on walkable ground without falling through the void.
  * Walk through the portal ring to trigger the portal transition SFX.

---

## 4. Keybindings & Gameplay Controls

| Action | Keybinding |
| :--- | :--- |
| **Walk Forward / Backward** | `W` / `S` or `Up` / `Down` |
| **Strafe Left / Right** | `A` / `D` or `Left` / `Right` |
| **Jump** | `Spacebar` |
| **Toggle Microphone** | Click the circular Mic button or press `Enter` in text field |
| **Mute / Unmute Audio** | Click the Sound button in TopNav |
| **Reset Session** | Click "Reset Session" in TopNav |
