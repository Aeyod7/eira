import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requireAuth } from "../lib/auth.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

// Verify the file's magic bytes actually match its declared MIME type,
// so a renamed executable can't sneak through with an image Content-Type.
function magicBytesMatch(type, data) {
  if (data.length < 12) return false;
  switch (type) {
    case "image/jpeg": return data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF;
    case "image/png":  return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    case "image/gif":  return data.subarray(0, 3).toString("ascii") === "GIF";
    case "image/webp": return data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";
    default: return false;
  }
}

function parseMultipart(body, contentType) {
  const match = String(contentType || "").match(/boundary=(?:"([^\"]+)"|([^;]+))/i);
  if (!match) return null;
  const boundary = Buffer.from("--" + (match[1] || match[2]));
  const start = body.indexOf(boundary);
  if (start < 0) return null;
  const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), start);
  if (headerEnd < 0) return null;
  const headers = body.subarray(start + boundary.length + 2, headerEnd).toString("utf8");
  const disposition = headers.match(/content-disposition:[^\r\n]*name="([^"]+)"[^\r\n]*filename="([^"]*)"/i);
  const type = headers.match(/content-type:\s*([^\r\n]+)/i);
  if (!disposition || !type) return null;
  const fileStart = headerEnd + 4;
  const endMarker = Buffer.concat([Buffer.from("\r\n"), boundary]);
  const fileEnd = body.indexOf(endMarker, fileStart);
  if (fileEnd < 0) return null;
  return { filename: disposition[2], contentType: type[1].trim().toLowerCase(), data: body.subarray(fileStart, fileEnd) };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
  return requireAuth(async (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "", "binary");
    const file = parseMultipart(raw, req.headers?.["content-type"]);
    if (!file || !file.data.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Choose an image file to upload" }));
    }
    if (!ALLOWED_TYPES[file.contentType]) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Only JPG, PNG, WebP, and GIF images are supported" }));
    }
    if (file.data.length > MAX_BYTES) {
      res.statusCode = 413;
      return res.end(JSON.stringify({ error: "Images must be 8 MB or smaller" }));
    }
    if (!magicBytesMatch(file.contentType, file.data)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "File contents don't match the image type" }));
    }
    const base = path.basename(file.filename, path.extname(file.filename)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
    const filename = `${base}-${Date.now()}-${randomBytes(4).toString("hex")}${ALLOWED_TYPES[file.contentType]}`;

    let url;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production (Vercel): persist to Vercel Blob — the serverless filesystem is ephemeral.
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${filename}`, file.data, { access: "public", contentType: file.contentType });
      url = blob.url;
    } else {
      // Local dev: write to public/uploads/ and serve statically.
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, filename), file.data);
      url = `/uploads/${filename}`;
    }
    res.statusCode = 201;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ url }));
  })(req, res);
}
