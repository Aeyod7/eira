// Minimal local dev server — mimics Vercel routing for /api/* + serves public/ statically.
// Lets you run `npm run dev` without installing the Vercel CLI.
// For full-fidelity local dev (edge functions, rewrites UI), use `vercel dev` instead.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".json": "application/json; charset=utf-8",
  ".ico":  "image/x-icon"
};

// Match a request path to an API function file, resolving [slug] dynamic segments.
function resolveApiFile(reqPath) {
  const clean = reqPath.split("?")[0].replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean); // ["api","go","vitamin-c-serum"]
  if (parts[0] !== "api") return null;

  // Try exact path: /api/posts/index.js  (for /api/posts)
  // Try /api/posts/[slug].js (for /api/posts/some-slug)
  // Try /api/go/[slug].js   (for /api/go/some-slug)
  const segments = parts.slice(1);
  let dir = path.join(ROOT, "api");
  let query = {};
  let file = null;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    const exact = path.join(dir, seg + (isLast ? ".js" : ""));
    const indexFile = path.join(dir, seg, "index.js");
    const dynamicFile = path.join(dir, "[slug].js");
    const asDir = path.join(dir, seg);

    if (fs.existsSync(exact) && fs.statSync(exact).isFile()) { file = exact; break; }
    // Segment matches a directory — descend and continue resolving.
    if (fs.existsSync(asDir) && fs.statSync(asDir).isDirectory()) {
      dir = asDir;
      if (isLast && fs.existsSync(indexFile)) { file = indexFile; break; }
      continue;
    }
    if (fs.existsSync(indexFile)) { dir = path.join(dir, seg); file = indexFile; if (isLast) break; continue; }
    if (fs.existsSync(dynamicFile)) { query.slug = decodeURIComponent(seg); file = dynamicFile; break; }
    // Fallback: if no [slug].js, try index.js in current dir with slug query param.
    // This supports the consolidated route pattern (index.js handles both collection and individual).
    const currentIndex = path.join(dir, "index.js");
    if (fs.existsSync(currentIndex)) { query.slug = decodeURIComponent(seg); file = currentIndex; break; }
    return null;
  }
  // If we ended on a directory with index.js
  if (!file) {
    const idx = path.join(dir, "index.js");
    if (fs.existsSync(idx)) file = idx;
  }
  return file ? { file, query } : null;
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      resolve(String(req.headers["content-type"] || "").startsWith("multipart/") ? body : body.toString("utf8"));
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const reqPath = parsed.pathname;

  // Merge query: parsed.query (from URL) + any slug from route resolution
  const apiMatch = resolveApiFile(req.url);
  if (apiMatch) {
    try {
      // Read the body BEFORE importing the module — the request stream
      // emits data events immediately and they'd be lost during the async import.
      const body = await readBody(req);
      const mod = await import(pathToFileURL(apiMatch.file).href + "?t=" + Date.now());
      const handler = mod.default;
      if (!handler) { res.statusCode = 500; return res.end("No default export in " + apiMatch.file); }
      // Build a Vercel-like req/res
      req.query = { ...parsed.query, ...apiMatch.query };
      req.body = body;
      return handler(req, res);
    } catch (e) {
      console.error("API error:", e);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Pretty URLs via vercel.json rewrites — replicate locally
  if (reqPath.startsWith("/go/")) {
    const slug = reqPath.split("/")[2];
    const mod = await import(pathToFileURL(path.join(ROOT, "api/go/[slug].js")).href + "?t=" + Date.now());
    req.query = { slug };
    return mod.default(req, res);
  }
  if (reqPath.startsWith("/post/")) {
    const slug = reqPath.split("/")[2]?.replace(/\/$/, "");
    const mod = await import(pathToFileURL(path.join(ROOT, "api/post/[slug].js")).href + "?t=" + Date.now());
    req.query = { slug };
    return mod.default(req, res);
  }
  if (reqPath === "/sitemap.xml") {
    const mod = await import(pathToFileURL(path.join(ROOT, "api/sitemap.js")).href + "?t=" + Date.now());
    req.query = {};
    return mod.default(req, res);
  }

  // Static files from public/
  let filePath = path.join(PUBLIC, reqPath === "/" ? "index.html" : reqPath);
  if (!fs.existsSync(filePath)) {
    // Try .html fallback (e.g. /about → about.html)
    const htmlFallback = filePath.replace(/\/$/, "") + ".html";
    if (fs.existsSync(htmlFallback)) filePath = htmlFallback;
    else { res.statusCode = 404; return res.end("Not found"); }
  }
  const ext = path.extname(filePath);
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Eira dev server: http://localhost:${PORT}`);
  console.log(`Admin UI:        http://localhost:${PORT}/admin.html`);
  console.log(`(Use \`vercel dev\` for full-fidelity routing.)`);
});
