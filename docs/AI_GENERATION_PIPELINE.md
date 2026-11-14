# Dream-to-Doom — Complete AI World Generation Pipeline

This document details the serverless AI generation architecture for **Dream-to-Doom**, explaining how natural-language transcripts are converted into verified, playable 3D Scene Graphs via Google Gemini and Vercel Serverless Functions.

---

## 1. Overall Pipeline Architecture

```
[Browser / Client]
  User Speech ──> Web Speech API ──> Transcript
                                         │
                                         ▼
                             useDreamStore.beginGeneration(requestId)
                                         │
                                         ▼ (POST /api/generate-world)
────────────────────────────────────────────────────────────────────────
[Serverless Boundary / Vercel Function (api/generate-world.ts)]
  1. Validate HTTP Method (POST) & Content-Type (application/json)
  2. Validate Transcript (1 - 600 characters, sanitized)
  3. Load Server-Side Config (GEMINI_API_KEY, GEMINI_MODEL)
  4. Invoke Google Gen AI SDK (@google/genai 3.x)
     - Model: gemini-3.8-flash (configurable)
     - System Instruction: Scene Graph level designer prompt
     - Format: Structured JSON via responseSchema (OpenAPI 3.0)
     - Temperature: 0.35, MaxTokens: 2500
  5. Measure Generation Latency via performance.now()
  6. Safe Parse JSON Response
  7. Enforce Runtime Contract via WorldSpecSchema.safeParse()
  8. Emit Structured Telemetry Log
  9. Return JSON Envelope with 200 OK
────────────────────────────────────────────────────────────────────────
[Client Integration]
  1. Client validates envelope & extracts WorldSpec
  2. Concurrency Check: verify response belongs to active requestId
  3. useDreamStore.setWorld(world, requestId)
  4. Automatic Event Broadcast: emit 'world-generated'
     ├─ Person 2: <Canvas> mounts entities, physics bodies, sky, lights
     └─ Person 3: Tone.js adapts synth scale to world.audioMood
```

---

## 2. Serverless Endpoint Specification

* **Route:** `POST /api/generate-world`
* **Handler:** [api/generate-world.ts](file:///c:/Users/Hp/OneDrive/Desktop/Dream_to_dream/api/generate-world.ts)
* **Runtime:** Vercel Serverless Node.js (Web Standard & Node-compatible)
* **Headers Required:** `Content-Type: application/json`

### Request Schema
```json
{
  "transcript": "A floating island in cosmic void with crystalline pillars and glowing portals"
}
```

### Success Response Schema (200 OK)
```json
{
  "success": true,
  "world": {
    "id": "world-1731600000000",
    "title": "Astral Archipelagos",
    "description": "Floating crystalline rock masses drifting through a vibrant starfield.",
    "biome": "floating_islands",
    "mood": "surreal",
    "audioMood": "mystical",
    "environment": {
      "skyColor": "#080417",
      "fogColor": "#150d2e",
      "groundColor": "#1f143d",
      "fogDensity": 0.02
    },
    "lighting": {
      "ambientIntensity": 0.45,
      "directionalIntensity": 1.2,
      "directionalColor": "#c084fc"
    },
    "weather": {
      "type": "clear",
      "intensity": 0.0
    },
    "spawnPoint": { "x": 0, "y": 1.5, "z": 0 },
    "entities": [
      {
        "id": "platform_main",
        "asset": "platform",
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 4, "y": 0.5, "z": 4 },
        "color": "#382952",
        "physics": "fixed",
        "interaction": "none"
      },
      {
        "id": "crystal_beacon",
        "asset": "crystal",
        "position": { "x": 3, "y": 0.8, "z": -2 },
        "rotation": { "x": 0, "y": 0.785, "z": 0 },
        "scale": { "x": 1.2, "y": 1.2, "z": 1.2 },
        "color": "#e879f9",
        "physics": "dynamic",
        "interaction": "collectible"
      }
    ]
  },
  "generationTimeMs": 845,
  "data": {
    "world": { "...": "same as above" },
    "generationTimeMs": 845
  }
}
```

### Error Response Schema
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "The Gemini API rate limit or quota has been reached. Please try again shortly."
  }
}
```

---

## 3. Gemini SDK Configuration

* **SDK Package:** `@google/genai` (v3.3.0)
* **SDK Module:** Direct import of `GoogleGenAI`
* **Initialization File:** [api/_lib/geminiClient.ts](file:///c:/Users/Hp/OneDrive/Desktop/Dream_to_dream/api/_lib/geminiClient.ts)
* **Client Caching:** Singleton instance cached across warm serverless execution invocations to minimize TLS handshake overhead.
* **Model Configuration:** Configured via server-side environment variable `GEMINI_MODEL`, defaulting to `gemini-3.8-flash`.

---

## 4. Structured Output Enforcement

Rather than prompting for freeform text and hoping for valid JSON, the pipeline uses Gemini's native **Structured Outputs** (`responseMimeType: "application/json"`, `responseSchema: WORLD_SPEC_JSON_SCHEMA`).

### Schema Enforcement
1. **Asset Allowlist:** Explicitly restricted to 10 low-poly primitives: `tree`, `rock`, `house`, `portal`, `crystal`, `enemy`, `platform`, `mushroom`, `lamp`, `cloud`.
2. **Coordinates:** Position vectors bounded within $[-45, 45]$ for X/Z and $[0, 25]$ for Y.
3. **Hex Colors:** Regex verified format `^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$`.
4. **Entity Limits:** Enforces a hard maximum of 28 entities to preserve 60 FPS in React Three Fiber.
5. **Double Validation:** Even after Gemini produces structured JSON, the server runs `WorldSpecSchema.safeParse(parsedJson)`. Any structural discrepancy or duplicate entity ID triggers a typed `SCHEMA_VALIDATION_FAILED` error.

---

## 5. Security Architecture

1. **Zero Client-Side Key Exposure:** `GEMINI_API_KEY` is read exclusively inside `api/_lib/geminiClient.ts` on the Node.js serverless runtime.
2. **Never Prefixed with `VITE_`:** No `VITE_GEMINI_API_KEY` exists in any file.
3. **Input Sanitization:** XML/HTML tags in user transcripts are stripped via `buildUserPrompt()` to prevent prompt injection.
4. **Length Clamping:** Transcripts exceeding 600 characters are rejected with `400 TRANSCRIPT_TOO_LONG`.
5. **Safe Logging:** Telemetry logs omit raw transcripts and credentials.

---

## 6. How Teammates Consume the AI Output

### Person 2 (3D Graphics Lead)
* Subscribes to `world` in `useDreamStore`:
  ```typescript
  import { useDreamStore } from '../store/useDreamStore';

  export function SceneContainer() {
    const world = useDreamStore((state) => state.world);
    // Maps world.environment to <Sky />, world.lighting to <directionalLight />
    // Iterates world.entities to spawn <ModelInstance /> with Rapier colliders
  }
  ```

### Person 3 (Sensory & Audio Lead)
* Subscribes to `world.audioMood` in `useDreamStore`:
  ```typescript
  import { useDreamStore } from '../store/useDreamStore';

  export function initAudio() {
    useDreamStore.subscribe(
      (state) => state.world?.audioMood,
      (mood) => {
        // mood is: 'calm' | 'mystical' | 'tense' | 'chaotic'
        updateToneJsHarmonics(mood);
      }
    );
  }
  ```

---

## 7. Local Serverless Execution

Because Vite's development server (`npm run dev`) does not execute backend serverless files located in `api/`, you can run the full integrated stack using the Vercel CLI:

```bash
# 1. Install Vercel CLI globally (if not installed)
npm install -g vercel

# 2. Add local GEMINI_API_KEY to .env.local
echo GEMINI_API_KEY=your_key_here >> .env.local

# 3. Start local frontend and serverless API together
npx vercel dev
```
