export default async function handler(req, res) {
  try {
    const upstreamUrl = 'https://www.hpvn-archive.net/floo?hpvn_update=ea7cfe4';
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Lỗi tải Mạng Floo từ máy chủ gốc: ${response.status}`);
    }

    let html = await response.text();

    // 1. Inject <base href="https://www.hpvn-archive.net/"> right after <head>
    // so all relative chunks, CSS, images, and fonts resolve cleanly to upstream
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head><base href="https://www.hpvn-archive.net/">');
    } else {
      html = html.replace('<html>', '<html><head><base href="https://www.hpvn-archive.net/"></head>');
    }

    // 2. Inject subtle styling to harmonize with Hogwarts dark theme
    const customStyle = `
      <style>
        /* Zero shadow override to match requirement */
        *, *::before, *::after {
          box-shadow: none !important;
          text-shadow: none !important;
          --tw-shadow: 0 0 #0000 !important;
        }
        /* Custom scrollbar matching dark purple parchment */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #0d0716;
        }
        ::-webkit-scrollbar-thumb {
          background: #3b1d5a;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #c8aa6e;
        }
      </style>
    `;
    html = html.replace('</head>', `${customStyle}</head>`);

    // 3. Set headers allowing framing inside Undercover Hogwarts
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://undercover-hogwarts.vercel.app https://seven-potters.vercel.app http://localhost:5173 *;");

    return res.status(200).send(html);
  } catch (err) {
    console.error('Error proxying Floo shoutbox:', err);
    return res.status(500).send(`Không thể kết nối Mạng Floo: ${err?.message || err}`);
  }
}
