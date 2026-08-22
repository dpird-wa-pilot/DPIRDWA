import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const vercelApiMock = () => {
  return {
    name: 'vercel-api-mock',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              req.body = JSON.parse(body || '{}');
            } catch(e) {
              req.body = {};
            }
            
            // Load the handler dynamically
            const handler = (await import('./api/chat.js')).default;
            
            // Mock Vercel res.status().json()
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };
            
            try {
              await handler(req, res);
            } catch (e) {
              res.status(500).json({ error: e.message });
            }
          });
          return;
        }
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  process.env = { ...process.env, ...env }
  
  return {
    plugins: [react(), vercelApiMock()],
  }
})
