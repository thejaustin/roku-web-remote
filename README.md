# roku-web-remote

A web-based Roku remote UI built with React + Vite and an optional Node proxy to forward commands to Roku ECP (port 8060).

## What’s included
- React UI (src/RokuRemote.jsx) using lucide-react icons and Tailwind via CDN
- Vite dev setup
- Optional Express proxy (server/proxy/server.js) to avoid CORS or mixed-content issues

## Run locally (recommended)
1. Install dependencies:
   ```
   npm install
   ```

2. Run the dev server:
   ```
   npm run dev
   ```

3. In a separate terminal run the proxy (optional, recommended if your page is served via HTTPS or you get CORS errors):
   ```
   npm run proxy
   ```

4. Open Vite dev URL (usually http://localhost:5173). Enter your Roku IP (Settings → Network → About) and press Connect.

Notes:
- If you see CORS or mixed-content issues
