import { generateWorldFromPrompt } from './_lib/worldGeneration';
import { mapUpstreamError } from './_lib/apiErrors';

export interface VercelCompatibleRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined> | Headers;
  body?: unknown;
  json?: () => Promise<unknown>;
}

export interface VercelCompatibleResponse {
  status: (code: number) => VercelCompatibleResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

/**
 * Universal Vercel Serverless Function handler for /api/generate-world.
 * Supports both Web Standard Request/Response and Node (req, res) styles.
 */
export default async function handler(
  req: Request | VercelCompatibleRequest,
  res?: VercelCompatibleResponse
): Promise<Response | void> {
  const method = ('method' in req && req.method ? req.method : 'POST').toUpperCase();
  const headers = req.headers;

  // Helper to retrieve header value case-insensitively
  const getHeader = (name: string): string | null => {
    if (!headers) return null;
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name);
    }
    const record = headers as Record<string, string | string[] | undefined>;
    const key = Object.keys(record).find((k) => k.toLowerCase() === name.toLowerCase());
    const val = key ? record[key] : undefined;
    return Array.isArray(val) ? val[0] : val || null;
  };

  // Helper to respond universally
  const sendResponse = (status: number, payload: unknown): Response | void => {
    if (res && typeof res.status === 'function') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.status(status).json(payload);
      return;
    }

    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  };

  // 1. Method verification
  if (method !== 'POST') {
    return sendResponse(405, {
      success: false,
      error: {
        code: 'INVALID_METHOD',
        message: `HTTP method ${method} not allowed. Please use POST.`,
      },
    });
  }

  // 2. Content-Type verification
  const contentType = getHeader('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return sendResponse(400, {
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be application/json.',
      },
    });
  }

  // 3. Body extraction & JSON validation
  let parsedBody: Record<string, unknown> | null = null;
  try {
    if ('json' in req && typeof req.json === 'function') {
      parsedBody = (await req.json()) as Record<string, unknown>;
    } else if ('body' in req && req.body !== undefined) {
      parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>);
    }
  } catch (parseErr) {
    return sendResponse(400, {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: `Malformed JSON in request body: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      },
    });
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    return sendResponse(400, {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request body must be a valid JSON object.',
      },
    });
  }

  // 4. Transcript verification
  const rawTranscript = parsedBody.transcript;
  if (typeof rawTranscript !== 'string') {
    return sendResponse(400, {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Property "transcript" is required and must be a string.',
      },
    });
  }

  const transcript = rawTranscript.trim();
  if (transcript.length === 0) {
    return sendResponse(400, {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Transcript cannot be empty or whitespace only.',
      },
    });
  }

  if (transcript.length > 600) {
    return sendResponse(400, {
      success: false,
      error: {
        code: 'TRANSCRIPT_TOO_LONG',
        message: `Transcript is too long (${transcript.length} characters). Maximum allowed is 600.`,
      },
    });
  }

  // 5. Execute AI Generation Pipeline
  try {
    const result = await generateWorldFromPrompt(transcript);

    // Structured observability log (never log API keys or full transcripts)
    console.log(
      JSON.stringify({
        event: 'world_generation_success',
        generationTimeMs: result.generationTimeMs,
        biome: result.world.biome,
        mood: result.world.mood,
        entityCount: result.world.entities.length,
      })
    );

    return sendResponse(200, {
      success: true,
      world: result.world,
      generationTimeMs: result.generationTimeMs,
      data: {
        world: result.world,
        generationTimeMs: result.generationTimeMs,
      },
    });
  } catch (error: unknown) {
    const serverError = mapUpstreamError(error);

    // Structured error log
    console.error(
      JSON.stringify({
        event: 'world_generation_failed',
        code: serverError.code,
        status: serverError.status,
        message: serverError.message,
      })
    );

    return sendResponse(serverError.status, {
      success: false,
      error: {
        code: serverError.code,
        message: serverError.message,
      },
    });
  }
}
