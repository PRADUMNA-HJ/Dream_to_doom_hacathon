import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import handler from './api/generate-world';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/generate-world', async (req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            (req as any).body = body;
            const vRes = {
              status: (code: number) => {
                res.statusCode = code;
                return vRes;
              },
              setHeader: (name: string, val: string) => {
                res.setHeader(name, val);
              },
              json: (data: unknown) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
            };
            const result = await handler(req as any, vRes as any);
            if (result instanceof Response && !res.writableEnded) {
              res.statusCode = result.status;
              result.headers.forEach((v, k) => res.setHeader(k, v));
              const text = await result.text();
              res.end(text);
            }
          } catch (err: any) {
            if (!res.writableEnded) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  error: { code: 'SERVER_ERROR', message: err?.message || String(err) },
                })
              );
            }
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServerPlugin()],
  server: {
    port: 3000,
    host: true,
  },
});
