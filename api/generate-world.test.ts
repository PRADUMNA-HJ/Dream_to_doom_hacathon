import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './generate-world';
import * as worldGen from './_lib/worldGeneration';
import { DEFAULT_MOCK_WORLD } from '../src/shared/constants';
import { ApiServerError } from './_lib/apiErrors';

describe('POST /api/generate-world (Vercel Serverless Function)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-POST HTTP methods with 405 INVALID_METHOD', async () => {
    const request = new Request('http://localhost/api/generate-world', {
      method: 'GET',
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_METHOD');
  });

  it('rejects non-JSON Content-Type with 400 INVALID_CONTENT_TYPE', async () => {
    const request = new Request('http://localhost/api/generate-world', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'transcript=hello',
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CONTENT_TYPE');
  });

  it('rejects missing transcript with 400 INVALID_REQUEST', async () => {
    const request = new Request('http://localhost/api/generate-world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'wrong key' }),
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects empty transcript with 400 INVALID_REQUEST', async () => {
    const request = new Request('http://localhost/api/generate-world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: '   ' }),
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects transcript exceeding 600 characters with 400 TRANSCRIPT_TOO_LONG', async () => {
    const request = new Request('http://localhost/api/generate-world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'x'.repeat(601) }),
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('TRANSCRIPT_TOO_LONG');
  });

  it('successfully returns 200 with validated envelope on valid prompt', async () => {
    vi.spyOn(worldGen, 'generateWorldFromPrompt').mockResolvedValueOnce({
      world: DEFAULT_MOCK_WORLD,
      generationTimeMs: 420,
    });

    const request = new Request('http://localhost/api/generate-world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'A glowing crystal forest with platforms' }),
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.world.id).toBe(DEFAULT_MOCK_WORLD.id);
    expect(body.generationTimeMs).toBe(420);
    expect(body.data.world.id).toBe(DEFAULT_MOCK_WORLD.id);
  });

  it('handles Node (req, res) style parameters seamlessly', async () => {
    vi.spyOn(worldGen, 'generateWorldFromPrompt').mockResolvedValueOnce({
      world: DEFAULT_MOCK_WORLD,
      generationTimeMs: 310,
    });

    const mockReq = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { transcript: 'Node style test' },
    };

    let responseStatus = 0;
    let responseBody: unknown = null;
    const mockRes = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: unknown) => {
        responseBody = data;
      },
      setHeader: vi.fn(),
    };

    await handler(mockReq, mockRes);
    expect(responseStatus).toBe(200);
    expect((responseBody as { success: boolean }).success).toBe(true);
  });

  it('returns appropriate HTTP status and never leaks secret keys on error', async () => {
    vi.spyOn(worldGen, 'generateWorldFromPrompt').mockRejectedValueOnce(
      new ApiServerError('MISSING_API_KEY', 'GEMINI_API_KEY is not configured on server.', 500)
    );

    const request = new Request('http://localhost/api/generate-world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'test' }),
    });

    const response = (await handler(request)) as Response;
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_API_KEY');
    // Ensure secrets or raw internal tokens are never leaked
    expect(JSON.stringify(body)).not.toContain('AIzaSy');
  });
});
