// Simple Node.js proxy for Roku ECP to avoid CORS / mixed content issues.
// Usage: npm run proxy
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// Serve built frontend in production if you put build files in /dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../../dist")));

// Proxy endpoints:
// POST /api/roku/:ip/keypress/:key
// GET  /api/roku/:ip/query/device-info
app.post("/api/roku/:ip/keypress/:key", async (req, res) => {
  const ip = req.params.ip;
  const key = req.params.key;
  try {
    const url = `http://${ip}:8060/keypress/${key}`;
    const r = await fetch(url, { method: "POST" });
    const text = await r.text().catch(()=>"");
    res.status(r.status || 200).send(text || "OK");
  } catch (err) {
    res.status(502).send(String(err));
  }
});

app.get("/api/roku/:ip/query/device-info", async (req, res) => {
  const ip = req.params.ip;
  try {
    const url = `http://${ip}:8060/query/device-info`;
    const r = await fetch(url);
    const text = await r.text();
    res.status(r.status || 200).send(text);
  } catch (err) {
    res.status(502).send(String(err));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Roku proxy listening on ${PORT}`));