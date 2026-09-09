import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'floo-embed-dev-proxy',
      configureServer(server) {
        server.middlewares.use('/api/floo-embed', async (_req, res) => {
          try {
            const upstreamUrl = 'https://www.hpvn-archive.net/floo?hpvn_update=ea7cfe4';
            const response = await fetch(upstreamUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
            });
            let html = await response.text();
            if (html.includes('<head>')) {
              html = html.replace('<head>', '<head><base href="https://www.hpvn-archive.net/">');
            } else {
              html = html.replace('<html>', '<html><head><base href="https://www.hpvn-archive.net/"></head>');
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(`Error: ${err?.message}`);
          }
        });
      },
    },
  ],
})
