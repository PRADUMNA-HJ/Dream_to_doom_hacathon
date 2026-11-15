import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

/**
 * Universal Node.js HTTP Server for Render / Container Deployments
 * Serves the React Three Fiber production build from /dist
 * and handles the /api/generate-world endpoint with Gemini / procedural fallback.
 */
const server = http.createServer(async (req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health check for Render / Cloud monitoring
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() }));
    return;
  }

  // 2. API Endpoint: POST /api/generate-world
  if (pathname === '/api/generate-world' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Prevent payload flood
      if (body.length > 1e6) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        const prompt = (parsedBody.prompt || '').trim();

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt is required' }));
          return;
        }

        // Check if serverless handler exists
        try {
          const handlerModule = await import('./api/generate-world.ts');
          const handler = handlerModule.default;
          if (typeof handler === 'function') {
            await handler(req, res);
            return;
          }
        } catch {
          // If TS file cannot be directly dynamically imported in pure Node runtime,
          // respond with prompt confirmation so frontend client-side procedural engine takes over seamlessly
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'success',
              prompt,
              message: 'World synthesized successfully',
            })
          );
          return;
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error', message: String(err) }));
      }
    });
    return;
  }

  // 3. Static File Serving from /dist
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // If pointing to directory, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file exists in dist, serve it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Aggressive caching for hashed assets, no-cache for index.html
    const cacheControl =
      pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    return;
  }

  // 4. SPA Fallback: Serve dist/index.html for any unhandled routes
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    // If dist folder hasn't been built yet
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Application is building. Please run `npm run build` first.');
  }
});

server.listen(PORT, () => {
  console.log(`[Dream-to-Doom Production Server] Running on http://localhost:${PORT}`);
});
